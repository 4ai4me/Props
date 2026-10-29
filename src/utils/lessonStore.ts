import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { StudentRecord } from './mathLogic';
import {
  LESSON_KEYS,
  LessonJsonMap,
  LessonKey,
  StudentLessonSnapshot,
  TeacherDocData,
  splitLessons,
  teacherJson,
} from './lessonMerge';

export * from './lessonMerge';

/**
 * 차시별 분리 저장
 * ------------------------------------------------------------------
 * 예전에는 학생의 모든 차시(+ 다른 수업 활동지)를 student_registrations 문서의
 * worksheetJson 한 덩어리에 넣고, 한 글자만 바꿔도 덩어리 전체를 다시 저장했습니다.
 * 이제는 차시마다 작은 문서를 따로 두고, 바뀐 차시 문서만 저장합니다.
 *
 *   student_registrations/{studentKey}                  가입 정보·승인 상태 (+ 예전 worksheetJson, 더 이상 갱신 안 함)
 *   student_registrations/{studentKey}/{COLLECTION}/l1  1차시 내용 (학생 본인만 쓰기)
 *   ...                                                  ...
 *   student_registrations/{studentKey}/{COLLECTION}/l7  7차시 내용
 *   student_registrations/{studentKey}/{COLLECTION}/teacher  교사 평가·메모 (교사만 쓰기, 학생은 읽기만)
 *
 * 아직 차시 문서가 없는 차시는 예전 worksheetJson 내용을 그대로 사용하므로
 * 따로 데이터 이전 작업을 하지 않아도 되고, 학생이 그 차시를 수정할 때 자연스럽게 옮겨집니다.
 */
export const LESSON_COLLECTION = 'props_lessons';

/** 차시 문서 형식 버전. 문서 구조를 바꿀 때 올리고, 읽는 쪽에서 버전별로 처리합니다. */
export const LESSON_SCHEMA_VERSION = 1;

function lessonsCollection(studentKey: string) {
  return collection(db, 'student_registrations', studentKey, LESSON_COLLECTION);
}

function readSnapshotInto(
  target: StudentLessonSnapshot,
  id: string,
  data: DocumentData
): void {
  if (id === 'teacher') {
    if (typeof data.data === 'string') {
      target.teacher = { studentKey: String(data.studentKey || ''), data: data.data };
    }
    return;
  }
  if ((LESSON_KEYS as readonly string[]).includes(id) && typeof data.data === 'string') {
    target.lessons[id as LessonKey] = {
      studentKey: String(data.studentKey || ''),
      lesson: Number(data.lesson) || 0,
      data: data.data,
      clientUpdatedAt: typeof data.clientUpdatedAt === 'string' ? data.clientUpdatedAt : '',
    };
  }
}

/** 학생 본인의 차시 문서를 모두 불러옵니다. */
export async function loadStudentLessons(studentKey: string): Promise<StudentLessonSnapshot> {
  const snap = await getDocs(lessonsCollection(studentKey));
  const result: StudentLessonSnapshot = { lessons: {} };
  snap.forEach((d) => readSnapshotInto(result, d.id, d.data()));
  return result;
}

/**
 * 지정한 차시 문서들을 한 번에(원자적으로) 저장합니다.
 * 모두 성공했을 때만 저장한 내용을 돌려주므로, 호출하는 쪽은 그때만 '저장됨'으로 표시해야 합니다.
 */
export async function saveLessons(
  studentKey: string,
  record: StudentRecord,
  keys: LessonKey[]
): Promise<Partial<LessonJsonMap>> {
  if (keys.length === 0) return {};
  const now = splitLessons(record);
  const batch = writeBatch(db);
  const saved: Partial<LessonJsonMap> = {};
  for (const k of keys) {
    batch.set(doc(lessonsCollection(studentKey), k), {
      studentKey,
      lesson: Number(k.slice(1)),
      schemaVersion: LESSON_SCHEMA_VERSION,
      data: now[k],
      clientUpdatedAt: record.updatedAt || new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
    saved[k] = now[k];
  }
  await batch.commit();
  return saved;
}

/** 교사 평가·메모만 저장합니다 (교사 전용). */
export async function saveTeacherEvaluation(studentKey: string, record: StudentRecord): Promise<void> {
  await setDoc(doc(lessonsCollection(studentKey), 'teacher'), {
    studentKey,
    schemaVersion: LESSON_SCHEMA_VERSION,
    data: teacherJson(record),
    updatedAt: serverTimestamp(),
  });
}

/** 학생 화면: 교사 평가 문서를 실시간으로 받습니다. */
export function listenTeacherEvaluation(
  studentKey: string,
  onData: (teacher: TeacherDocData | undefined) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    doc(lessonsCollection(studentKey), 'teacher'),
    (d) => {
      const data = d.data();
      onData(data && typeof data.data === 'string' ? { studentKey, data: data.data } : undefined);
    },
    onError
  );
}

/**
 * 교사 화면: 모든 학생의 차시 문서를 실시간으로 받습니다.
 * 결과는 studentKey → 차시 문서 묶음.
 */
export function listenAllStudentLessons(
  onData: (byStudent: Map<string, StudentLessonSnapshot>) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collectionGroup(db, LESSON_COLLECTION),
    (snap: QuerySnapshot<DocumentData>) => {
      const byStudent = new Map<string, StudentLessonSnapshot>();
      snap.forEach((d) => {
        const studentKey = d.ref.parent.parent?.id;
        if (!studentKey) return;
        let entry = byStudent.get(studentKey);
        if (!entry) {
          entry = { lessons: {} };
          byStudent.set(studentKey, entry);
        }
        readSnapshotInto(entry, d.id, d.data());
      });
      onData(byStudent);
    },
    onError
  );
}
