import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  StudentRecord,
  TOPICS,
  TopicId,
  EVAL_CRITERIA,
  EVAL_DESCRIPTIONS,
  cleanStudentState,
  createSampleTeacherDataset,
  csvSafe,
  ensureTeacherEval,
  evaluateRubricL1,
  evaluateRubricL2,
  evaluateRubricL3,
  evaluateRubricL4,
  evaluateRubricL5,
  evaluateRubricL6,
  evaluateRubricL7,
  getTeacherEvalAverage,
  getTeacherEvaluationProgress,
  getClassEvaluationSummary,
  studentKey,
} from '../utils/mathLogic';
import { formatDeviceHashAsMac } from '../utils/authLogic';
import { FirestoreStudentRegistrationDoc } from './AuthGateView';
import {
  Upload,
  Download,
  Trash2,
  Printer,
  Users,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  UserCheck,
  Fingerprint,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  AlertCircle,
  Activity,
  Sun,
  Moon,
  Radio,
  FileSpreadsheet,
  LogIn,
  UserPlus,
  Save,
} from 'lucide-react';
import { StudentAccessLog } from '../utils/auditLogger';
import { MathText } from './MathText';

interface TeacherViewProps {
  adminEmail: string;
  records: StudentRecord[];
  selectedKey: string;
  onSelectStudent: (key: string) => void;
  onUpdateRecords: React.Dispatch<React.SetStateAction<StudentRecord[]>>;
  onPrintStudentReport: (student: StudentRecord) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  adminEmail,
  records,
  selectedKey,
  onSelectStudent,
  onUpdateRecords,
  onPrintStudentReport,
  onRequestConfirm,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const [cloudRegistrations, setCloudRegistrations] = useState<FirestoreStudentRegistrationDoc[]>([]);
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [notice, setNotice] = useState<{ text: string; type: 'good' | 'warn' | 'info' }>({
    text: '학생 가입 신청 내역과 승인된 학생들의 실시간 탐구 답안이 자동으로 동기화됩니다.',
    type: 'info',
  });

  // Section collapse/expand states
  const [isApprovalOpen, setIsApprovalOpen] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(true);
  const [isRecordsOpen, setIsRecordsOpen] = useState(true);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  // Student name search states
  const [approvalSearchName, setApprovalSearchName] = useState('');
  const [recordsSearchName, setRecordsSearchName] = useState('');

  // Column filter states for student records table
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterExamples, setFilterExamples] = useState<'all' | '4plus' | '1to3' | '0'>('all');
  const [filterTopic, setFilterTopic] = useState<'all' | TopicId>('all');
  const [filterDecision, setFilterDecision] = useState<'all' | 'true' | 'false' | 'unknown' | 'none'>('all');
  const [filterEvalStatus, setFilterEvalStatus] = useState<'all' | 'complete' | 'partial' | 'none'>('all');

  // Modeless (비모달) dialog state for detail comparison
  const [isModelessOpen, setIsModelessOpen] = useState<boolean>(false);
  const [isModelessMinimized, setIsModelessMinimized] = useState<boolean>(false);
  const [isModelessExpanded, setIsModelessExpanded] = useState<boolean>(false);

  // Real-time Student Access Logs state
  const [accessLogs, setAccessLogs] = useState<StudentAccessLog[]>([]);
  const [isAccessLogsOpen, setIsAccessLogsOpen] = useState<boolean>(true);
  const [accessTimeFilter, setAccessTimeFilter] = useState<'all' | 'today' | 'morning' | 'afternoon'>('all');
  const [accessEventFilter, setAccessEventFilter] = useState<'all' | 'login' | 'register' | 'save' | 'resume'>('all');
  const [accessSearch, setAccessSearch] = useState<string>('');

  const applySnapshotDocs = useCallback(
    (docs: FirestoreStudentRegistrationDoc[]) => {
      const approvedWorksheets: StudentRecord[] = [];
      for (const data of docs) {
        if (data.status === 'approved' && data.worksheetJson) {
          try {
            const parsed = cleanStudentState(JSON.parse(data.worksheetJson));
            parsed.group = `${data.school} ${data.grade}학년 ${data.classNum}반`.slice(0, 25);
            parsed.code = `${data.grade}${String(data.classNum).padStart(2, '0')}${String(
              data.studentNum
            ).padStart(2, '0')}_${data.name}`.slice(0, 25);
            approvedWorksheets.push(parsed);
          } catch {
            // ignore malformed worksheet
          }
        }
      }

      setCloudRegistrations(docs);

      if (approvedWorksheets.length > 0) {
        onUpdateRecords((prevRecords) => {
          const merged = [...prevRecords];
          for (const cw of approvedWorksheets) {
            const k = studentKey(cw);
            const idx = merged.findIndex((item) => studentKey(item) === k);
            if (idx >= 0) {
              const old = merged[idx];
              cw.teacherMemo = cw.teacherMemo || old.teacherMemo || '';
              cw.evaluation = cw.evaluation || old.evaluation;
              merged[idx] = cw;
            } else {
              merged.push(cw);
            }
          }
          return merged;
        });
      }
    },
    [onUpdateRecords]
  );

  const handleManualRefreshRegistrations = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'student_registrations'),
        where('status', 'in', ['pending', 'approved', 'rejected'])
      );
      const snap = await getDocs(q);
      const docs: FirestoreStudentRegistrationDoc[] = [];
      snap.forEach((d) => {
        docs.push(d.data() as FirestoreStudentRegistrationDoc);
      });
      applySnapshotDocs(docs);
      setNotice({
        text: `학생 가입 신청 목록을 새로고침했습니다. (현재 총 ${docs.length}명)`,
        type: 'good',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '조회 오류';
      setNotice({
        text: `가입 신청 목록 조회 중 오류: ${msg}`,
        type: 'warn',
      });
    }
  }, [applySnapshotDocs]);

  // Real-time Firestore listener for student_registrations
  useEffect(() => {
    const q = query(
      collection(db, 'student_registrations'),
      where('status', 'in', ['pending', 'approved', 'rejected'])
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: FirestoreStudentRegistrationDoc[] = [];
        snap.forEach((d) => {
          docs.push(d.data() as FirestoreStudentRegistrationDoc);
        });
        applySnapshotDocs(docs);
      },
      (error) => {
        console.error('Admin registration listener error:', error);
        setNotice({
          text: `실시간 가입 목록 동기화 확인 필요: ${error.message}`,
          type: 'warn',
        });
      }
    );
    return () => unsub();
  }, [applySnapshotDocs, adminEmail]);

  // Real-time listener for student access logs
  useEffect(() => {
    const ref = collection(db, 'student_access_logs');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const list: StudentAccessLog[] = [];
        snap.forEach((d) => {
          list.push(d.data() as StudentAccessLog);
        });
        // Sort descending by timestamp
        list.sort((a, b) => {
          const parseTime = (val: unknown): number => {
            if (!val) return 0;
            if (typeof (val as { toMillis?: () => number }).toMillis === 'function') {
              return (val as { toMillis: () => number }).toMillis();
            }
            if (val instanceof Date) return val.getTime();
            const parsed = new Date(String(val)).getTime();
            return isNaN(parsed) ? 0 : parsed;
          };
          return parseTime(b.createdAt) - parseTime(a.createdAt);
        });
        setAccessLogs(list);
      },
      (error) => {
        console.error('Access logs listener error:', error);
      }
    );
    return () => unsub();
  }, []);

  const handleUpdateStudentStatus = async (
    reg: FirestoreStudentRegistrationDoc,
    nextStatus: 'approved' | 'rejected' | 'pending'
  ) => {
    const ref = doc(db, 'student_registrations', reg.studentKey);
    try {
      await updateDoc(ref, {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      setNotice({
        text: `${reg.school} ${reg.grade}학년 ${reg.classNum}반 ${reg.studentNum}번 ${reg.name} 학생을 [${
          nextStatus === 'approved' ? '가입 승인' : nextStatus === 'rejected' ? '반려' : '대기'
        }] 처리했습니다.`,
        type: nextStatus === 'approved' ? 'good' : 'info',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_registrations/${reg.studentKey}`);
    }
  };

  const handleBulkApprovePending = async () => {
    const pendings = cloudRegistrations.filter((r) => r.status === 'pending');
    if (!pendings.length) return;
    try {
      for (const reg of pendings) {
        await updateDoc(doc(db, 'student_registrations', reg.studentKey), {
          status: 'approved',
          updatedAt: serverTimestamp(),
        });
      }
      setNotice({
        text: `승인 대기 중이던 학생 ${pendings.length}명을 일괄 승인 처리했습니다.`,
        type: 'good',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'student_registrations');
    }
  };

  const handleDeleteStudentRegistration = (reg: FirestoreStudentRegistrationDoc) => {
    onRequestConfirm(
      '가입 신청 및 기기 잠금 삭제',
      `${reg.school} ${reg.grade}-${reg.classNum}-${reg.studentNum} ${reg.name} 학생의 가입 기록과 기기 중복 방지 잠금(MAC ${formatDeviceHashAsMac(
        reg.deviceHash
      )})을 모두 삭제할까요?`,
      async () => {
        try {
          await deleteDoc(doc(db, 'student_registrations', reg.studentKey));
          await deleteDoc(doc(db, 'device_locks', reg.deviceHash));
          setNotice({
            text: `${reg.name} 학생의 가입 기록 및 기기 잠금이 해제되었습니다.`,
            type: 'info',
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `student_registrations/${reg.studentKey}`);
        }
      }
    );
  };

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const errors: string[] = [];
    let loaded = 0;
    const nextList = [...records];

    for (const f of files) {
      try {
        if (f.size > 2_000_000) throw new Error('파일 크기 초과 (2MB 제한)');
        const text = await f.text();
        const x = cleanStudentState(JSON.parse(text));
        if (!x.code.trim()) throw new Error('식별코드 누락');

        const k = studentKey(x);
        const existingIdx = nextList.findIndex((item) => studentKey(item) === k);
        if (existingIdx >= 0) {
          const old = nextList[existingIdx];
          if ((x.updatedAt || '') >= (old.updatedAt || '')) {
            x.teacherMemo = old.teacherMemo || '';
            x.evaluation = old.evaluation;
            ensureTeacherEval(x);
            nextList[existingIdx] = x;
          }
        } else {
          nextList.push(x);
        }
        loaded++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류';
        errors.push(`${f.name}: ${msg}`);
      }
    }

    onUpdateRecords(nextList);
    if (nextList.length > 0 && !selectedKey) {
      onSelectStudent(studentKey(nextList[0]));
    }
    setNotice({
      text: `파일 ${loaded}개 처리 완료 · 현재 총 ${nextList.length}명. ${
        errors.length ? '가져오지 못한 파일: ' + errors.join(' / ') : '모든 결과가 정상 수합되었습니다.'
      }`,
      type: errors.length ? 'warn' : 'good',
    });
  };

  const handleLoadSampleData = () => {
    const samples = createSampleTeacherDataset();
    const nextList = [...records];
    for (const s of samples) {
      const k = studentKey(s);
      const idx = nextList.findIndex((item) => studentKey(item) === k);
      if (idx >= 0) nextList[idx] = s;
      else nextList.push(s);
    }
    onUpdateRecords(nextList);
    onSelectStudent(studentKey(samples[0]));
    setNotice({
      text: '교사용 대시보드 체험을 위한 예시 학생 2명(10301, 10302)의 기록을 불러왔습니다.',
      type: 'good',
    });
  };

  const handleExportCSV = () => {
    if (!records.length) {
      setNotice({ text: '먼저 승인된 학생 답안이나 JSON 파일을 불러와 주세요.', type: 'warn' });
      return;
    }
    const headers = [
      '학급',
      '식별코드',
      '수정 시각',
      '1차시 사례 수',
      '1차시 추측',
      '1차시 반례 검사 수',
      '1차시 검증 한계',
      '1차시 증명 단계',
      '1차시 증명 서술',
      '1차시 성찰',
      '1차시 다음 질문',
      '2차시 주제',
      '2차시 명제',
      '2차시 사례 수',
      '2차시 반례 검사 수',
      '2차시 추측',
      '2차시 판단',
      '2차시 반례 숫자',
      '2차시 반례 이유',
      '2차시 증명 또는 미해결 서술',
      '2차시 동료 피드백',
      '2차시 수정',
      '2차시 성찰',
      '2차시 다음 질문',
      '3차시 대우법 문제1 단계확인',
      '3차시 대우법 문제1 증명서술',
      '3차시 대우법 문제2 단계확인',
      '3차시 대우법 문제2 증명서술',
      '3차시 성찰1',
      '3차시 성찰2',
      '4차시 귀류법 문제1 단계확인',
      '4차시 귀류법 문제1 증명서술',
      '4차시 귀류법 문제2 단계확인',
      '4차시 귀류법 문제2 증명서술',
      '4차시 성찰1',
      '4차시 성찰2',
      '5차시 수치사례수',
      '5차시 개념선택',
      '5차시 절대부등식1 문제1 단계확인',
      '5차시 절대부등식1 문제1 증명서술',
      '5차시 등호성립이유',
      '5차시 절대부등식1 문제2 단계확인',
      '5차시 절대부등식1 문제2 증명서술',
      '5차시 성찰1',
      '5차시 성찰2',
      '6차시 수치·기하사례수',
      '6차시 개념선택',
      '6차시 절대부등식2 문제1 단계확인',
      '6차시 절대부등식2 문제1 증명서술',
      '6차시 조화평균이유',
      '6차시 절대부등식2 문제2 단계확인',
      '6차시 절대부등식2 문제2 증명서술',
      '6차시 성찰1',
      '6차시 성찰2',
      '7차시 수치사례수',
      '7차시 개념선택',
      '7차시 절대부등식3 문제1 단계확인',
      '7차시 절대부등식3 문제1 증명서술',
      '7차시 절댓값차이유',
      '7차시 절대부등식3 문제2 단계확인',
      '7차시 절대부등식3 문제2 증명서술',
      '7차시 성찰1',
      '7차시 성찰2',
      '교사 메모',
      '교사 평가 상태',
      '교사 평가 진행율(%)',
      ...EVAL_CRITERIA.map((t) => `교사 평정_${t}`),
      '학생 피드백',
      '다음 탐구 제안',
    ];

    const rows = records.map((x) => {
      const a = x.l1;
      const b = x.l2;
      const c = x.l3;
      const d = x.l4;
      const e = x.l5;
      const f = x.l6;
      const g = x.l7;
      const ev = ensureTeacherEval(x);
      const evalProg = getTeacherEvaluationProgress(x);
      const tDef = b.topic ? TOPICS[b.topic as TopicId] : null;
      return [
        x.group,
        x.code,
        x.updatedAt,
        a.examples.length,
        a.claim,
        a.checks.length,
        a.limits,
        a.proofVerified.filter(Boolean).length,
        a.proofText,
        a.reflection,
        a.bridge,
        tDef?.tag || '',
        b.topic === 'd' ? b.customStatement : tDef?.statement || '',
        b.examples.length,
        b.checks.length,
        b.guess,
        b.decision,
        b.counter,
        b.counterReason,
        b.proofText,
        b.peerComment,
        b.revision,
        b.reflection,
        b.nextQuestion,
        c?.prob1Verified?.filter(Boolean).length ?? 0,
        c?.prob1ProofText || '',
        c?.prob2Verified?.filter(Boolean).length ?? 0,
        c?.prob2ProofText || '',
        c?.reflection1 || '',
        c?.reflection2 || '',
        d?.prob1Verified?.filter(Boolean).length ?? 0,
        d?.prob1ProofText || '',
        d?.prob2Verified?.filter(Boolean).length ?? 0,
        d?.prob2ProofText || '',
        d?.reflection1 || '',
        d?.reflection2 || '',
        e?.examples?.length ?? 0,
        e?.squareConceptChoice || '',
        e?.prob1Verified?.filter(Boolean).length ?? 0,
        e?.prob1ProofText || '',
        e?.equalityReason || '',
        e?.prob2Verified?.filter(Boolean).length ?? 0,
        e?.prob2ProofText || '',
        e?.reflection1 || '',
        e?.reflection2 || '',
        f?.examples?.length ?? 0,
        f?.amgmConceptChoice || '',
        f?.prob1Verified?.filter(Boolean).length ?? 0,
        f?.prob1ProofText || '',
        f?.harmonicReason || '',
        f?.prob2Verified?.filter(Boolean).length ?? 0,
        f?.prob2ProofText || '',
        f?.reflection1 || '',
        f?.reflection2 || '',
        g?.examples?.length ?? 0,
        g?.absSquareConceptChoice || '',
        g?.prob1Verified?.filter(Boolean).length ?? 0,
        g?.prob1ProofText || '',
        g?.absDiffReason || '',
        g?.prob2Verified?.filter(Boolean).length ?? 0,
        g?.prob2ProofText || '',
        g?.reflection1 || '',
        g?.reflection2 || '',
        x.teacherMemo || '',
        evalProg.statusLabel,
        evalProg.percent,
        ...ev.scores.map((v) => (v === null ? '' : v)),
        ev.feedback,
        ev.nextStep,
      ];
    });

    const csvContent =
      '\ufeff' + [headers, ...rows].map((r) => r.map(csvSafe).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '수학탐정단_1-7차시_학급응답.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Detect duplicate MAC address (deviceHash) across registrations for teacher warning badge
  const deviceCounts: Record<string, number> = {};
  for (const r of cloudRegistrations) {
    if (r.deviceHash) deviceCounts[r.deviceHash] = (deviceCounts[r.deviceHash] || 0) + 1;
  }

  const pendingCount = cloudRegistrations.filter((r) => r.status === 'pending').length;
  const approvedCount = cloudRegistrations.filter((r) => r.status === 'approved').length;
  const rejectedCount = cloudRegistrations.filter((r) => r.status === 'rejected').length;

  const filteredRegistrations = cloudRegistrations
    .filter((r) => {
      if (approvalFilter !== 'all' && r.status !== approvalFilter) return false;
      if (approvalSearchName.trim()) {
        const q = approvalSearchName.trim().toLowerCase();
        const matchName = (r.name || '').toLowerCase().includes(q);
        const matchCode = `${r.grade}${r.classNum}${r.studentNum}`.includes(q);
        const matchSchool = (r.school || '').toLowerCase().includes(q);
        return matchName || matchCode || matchSchool;
      }
      return true;
    })
    .slice()
    .sort((a, b) => {
      const gDiff = (parseInt(a.grade, 10) || 0) - (parseInt(b.grade, 10) || 0);
      if (gDiff !== 0) return gDiff;
      const cDiff = (parseInt(a.classNum, 10) || 0) - (parseInt(b.classNum, 10) || 0);
      if (cDiff !== 0) return cDiff;
      const nDiff = (parseInt(a.studentNum, 10) || 0) - (parseInt(b.studentNum, 10) || 0);
      if (nDiff !== 0) return nDiff;
      return (a.name || '').localeCompare(b.name || '', 'ko');
    });

  // Unique groups from existing records for group filter
  const uniqueGroups = Array.from(
    new Set(records.map((r) => (r.group || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'ko'));

  const isAnyRecordsFilterActive =
    recordsSearchName.trim() !== '' ||
    filterGroup !== 'all' ||
    filterExamples !== 'all' ||
    filterTopic !== 'all' ||
    filterDecision !== 'all' ||
    filterEvalStatus !== 'all';

  const resetRecordsFilters = () => {
    setRecordsSearchName('');
    setFilterGroup('all');
    setFilterExamples('all');
    setFilterTopic('all');
    setFilterDecision('all');
    setFilterEvalStatus('all');
  };

  const filteredSortedRecords = records
    .filter((x) => {
      // 1. Search by student name / code
      if (recordsSearchName.trim()) {
        const q = recordsSearchName.trim().toLowerCase();
        const matchCode = (x.code || '').toLowerCase().includes(q);
        const matchGroup = (x.group || '').toLowerCase().includes(q);
        if (!matchCode && !matchGroup) return false;
      }
      // 2. Filter by group/class
      if (filterGroup !== 'all' && (x.group || '').trim() !== filterGroup) {
        return false;
      }
      // 3. Filter by L1 examples count
      if (filterExamples !== 'all') {
        const count = x.l1.examples.length;
        if (filterExamples === '4plus' && count < 4) return false;
        if (filterExamples === '1to3' && (count < 1 || count > 3)) return false;
        if (filterExamples === '0' && count !== 0) return false;
      }
      // 4. Filter by L2 topic
      if (filterTopic !== 'all' && x.l2.topic !== filterTopic) {
        return false;
      }
      // 5. Filter by L2 decision
      if (filterDecision !== 'all') {
        if (filterDecision === 'none') {
          if (x.l2.decision) return false;
        } else {
          if (x.l2.decision !== filterDecision) return false;
        }
      }
      // 6. Filter by Teacher Evaluation status
      if (filterEvalStatus !== 'all') {
        const evalProg = getTeacherEvaluationProgress(x);
        if (evalProg.status !== filterEvalStatus) return false;
      }
      return true;
    })
    .slice()
    .sort(
      (a, b) =>
        (a.group || '').localeCompare(b.group || '', 'ko') ||
        (a.code || '').localeCompare(b.code || '', 'ko')
    );

  const count = records.length;
  const complete1 = records.filter((x) => evaluateRubricL1(x.l1).every(Boolean)).length;
  const complete2 = records.filter((x) => evaluateRubricL2(x.l2).every(Boolean)).length;
  const complete3 = records.filter((x) => x.l3 && evaluateRubricL3(x.l3).every(Boolean)).length;
  const complete4 = records.filter((x) => x.l4 && evaluateRubricL4(x.l4).every(Boolean)).length;
  const complete5 = records.filter((x) => x.l5 && evaluateRubricL5(x.l5).every(Boolean)).length;
  const complete6 = records.filter((x) => x.l6 && evaluateRubricL6(x.l6).every(Boolean)).length;
  const complete7 = records.filter((x) => x.l7 && evaluateRubricL7(x.l7).every(Boolean)).length;
  const classEvalSummary = getClassEvaluationSummary(records);

  const selectedStudent = records.find((v) => studentKey(v) === selectedKey) || null;

  const updateSelectedStudent = async (updater: (item: StudentRecord) => StudentRecord) => {
    if (!selectedStudent) return;
    const updatedItem = updater({ ...selectedStudent });
    const next = records.map((item) =>
      studentKey(item) === selectedKey ? updatedItem : item
    );
    onUpdateRecords(next);

    // Also sync teacher evaluation to Firestore if this student exists in cloudRegistrations
    const matchCloud = cloudRegistrations.find((r) => {
      const g = `${r.school} ${r.grade}학년 ${r.classNum}반`.slice(0, 25);
      const c = `${r.grade}${String(r.classNum).padStart(2, '0')}${String(r.studentNum).padStart(2, '0')}_${r.name}`.slice(0, 25);
      return `${g}::${c}` === selectedKey;
    });
    if (matchCloud) {
      try {
        await updateDoc(doc(db, 'student_registrations', matchCloud.studentKey), {
          worksheetJson: JSON.stringify(updatedItem),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // local fallback already updated
      }
    }
  };

  // Analytics calculations
  const checkRows: [string, number][] = [
    ['1차시 사례 4개 이상', records.filter((x) => x.l1.examples.length >= 4).length],
    ['1차시 증명 4단계 확인', records.filter((x) => x.l1.proofVerified.every(Boolean)).length],
    ['2차시 정당화 기록', records.filter((x) => evaluateRubricL2(x.l2)[4]).length],
    ['3차시 대우법(문제 1·2) 완료', complete3],
    ['4차시 귀류법(문제 1·2) 완료', complete4],
    ['5차시 절대부등식1 완료', complete5],
    ['6차시 절대부등식2 완료', complete6],
    ['7차시 절대부등식3 완료', complete7],
  ];

  const decisions: [string, number, string][] = [
    ['참', records.filter((x) => x.l2.decision === 'true').length, '#10b981'],
    ['거짓', records.filter((x) => x.l2.decision === 'false').length, '#f59e0b'],
    ['미해결', records.filter((x) => x.l2.decision === 'unknown').length, '#94a3b8'],
    ['미작성', records.filter((x) => !x.l2.decision).length, '#3b82f6'],
  ];

  const topicRows: [string, number][] = (
    Object.entries(TOPICS) as [TopicId, typeof TOPICS[TopicId]][]
  ).map(([id, v]) => [v.tag, records.filter((x) => x.l2.topic === id).length]);

  const rated = records.filter((x) => ensureTeacherEval(x).scores.some((v) => v !== null));
  const means = EVAL_CRITERIA.map((t, i) => {
    const nums = rated
      .map((x) => ensureTeacherEval(x).scores[i])
      .filter((v): v is number => Number.isInteger(v) && v !== null && v >= 0 && v <= 3);
    return {
      title: t,
      mean: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null,
      count: nums.length,
    };
  });

  let cum = 0;
  const slices = decisions
    .map(([, n, color]) => {
      const begin = cum;
      cum += n;
      return `${color} ${count ? (begin / count) * 100 : 0}% ${count ? (cum / count) * 100 : 0}%`;
    })
    .join(', ');

  // Access Logs Helpers & Filtering
  const parseLogDate = (val: unknown): Date | null => {
    if (!val) return null;
    if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
      return (val as { toDate: () => Date }).toDate();
    }
    if (val instanceof Date) return val;
    const d = new Date(String(val));
    return isNaN(d.getTime()) ? null : d;
  };

  const formatLogTimestamp = (val: unknown): string => {
    const d = parseLogDate(val);
    if (!d) return '-';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    const ampm = hours < 12 ? '오전' : '오후';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${y}-${m}-${day} ${ampm} ${displayHour}:${mins}:${secs}`;
  };

  const formatEventBadge = (ev: string) => {
    switch (ev) {
      case 'login':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
            <LogIn className="h-3 w-3" /> 로그인
          </span>
        );
      case 'register':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
            <UserPlus className="h-3 w-3" /> 가입 신청
          </span>
        );
      case 'save':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <Save className="h-3 w-3" /> 클라우드 저장
          </span>
        );
      case 'resume':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-700 border border-cyan-200">
            <RefreshCw className="h-3 w-3" /> 세션 복귀
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
            {ev}
          </span>
        );
    }
  };

  const todayStr = new Date().toDateString();
  const todayLogs = accessLogs.filter((log) => {
    const d = parseLogDate(log.createdAt);
    return d && d.toDateString() === todayStr;
  });
  const morningLogsCount = todayLogs.filter((log) => {
    const d = parseLogDate(log.createdAt);
    return d && d.getHours() < 12;
  }).length;
  const afternoonLogsCount = todayLogs.filter((log) => {
    const d = parseLogDate(log.createdAt);
    return d && d.getHours() >= 12;
  }).length;
  const uniqueDevicesCount = new Set(accessLogs.map((l) => l.deviceHash)).size;

  const filteredAccessLogs = accessLogs.filter((log) => {
    const d = parseLogDate(log.createdAt);
    if (accessTimeFilter === 'today') {
      if (!d || d.toDateString() !== todayStr) return false;
    } else if (accessTimeFilter === 'morning') {
      if (!d || d.toDateString() !== todayStr || d.getHours() >= 12) return false;
    } else if (accessTimeFilter === 'afternoon') {
      if (!d || d.toDateString() !== todayStr || d.getHours() < 12) return false;
    }

    if (accessEventFilter !== 'all' && log.eventType !== accessEventFilter) {
      return false;
    }

    if (accessSearch.trim()) {
      const q = accessSearch.trim().toLowerCase();
      const match =
        log.name.toLowerCase().includes(q) ||
        log.school.toLowerCase().includes(q) ||
        log.studentKey.toLowerCase().includes(q) ||
        log.ipAddress.toLowerCase().includes(q) ||
        formatDeviceHashAsMac(log.deviceHash).toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleExportAccessLogsCSV = () => {
    if (filteredAccessLogs.length === 0) {
      setNotice({ text: '내보낼 접속 로그가 없습니다.', type: 'warn' });
      return;
    }
    const headers = [
      '접속시각',
      '이벤트구분',
      '승인상태',
      '학교',
      '학년',
      '반',
      '번호',
      '이름',
      '학생식별키',
      '기기MAC식별자',
      'IP주소',
      'UserAgent',
    ];
    const rows = filteredAccessLogs.map((log) => {
      const timeStr = formatLogTimestamp(log.createdAt);
      return [
        csvSafe(timeStr),
        csvSafe(log.eventType),
        csvSafe(log.status),
        csvSafe(log.school),
        csvSafe(log.grade),
        csvSafe(log.classNum),
        csvSafe(log.studentNum),
        csvSafe(log.name),
        csvSafe(log.studentKey),
        csvSafe(formatDeviceHashAsMac(log.deviceHash)),
        csvSafe(log.ipAddress),
        csvSafe(log.userAgent),
      ].join(',');
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `수학탐정단_학생_접속로그_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: Student Registration Approval Management (Admin Only) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsApprovalOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              aria-expanded={isApprovalOpen}
              aria-label="학생 가입 신청 승인 메뉴 접기/펼치기"
            >
              {isApprovalOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 text-slate-600" />
                  <span>접기</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                  <span>펼치기</span>
                </>
              )}
            </button>
            <div>
              <div className="text-xs font-bold text-blue-600">
                학생 가입 관리 · 관리자 ({adminEmail})
              </div>
              <h2 className="mt-0.5 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                학생 가입 신청 승인 · 기기(MAC 주소) 중복 관리
                {!isApprovalOpen && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    신청 {cloudRegistrations.length}명 (대기 {pendingCount} · 승인 {approvedCount} · 반려 {rejectedCount})
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleManualRefreshRegistrations}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              새로고침
            </button>
            {pendingCount > 0 && isApprovalOpen && (
              <button
                type="button"
                onClick={handleBulkApprovePending}
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                대기 일괄 승인 ({pendingCount}명)
              </button>
            )}
          </div>
        </div>

        {isApprovalOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            {pendingCount > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 sm:p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="text-xs sm:text-sm text-amber-900 font-bold">
                    현재 승인 대기 중인 학생이 <span className="underline font-extrabold text-amber-950">{pendingCount}명</span> 있습니다.
                    교사가 가입을 승인해야 학생 활동지가 클라우드에 실시간 저장되고 아래 탐구 기록실에 표시됩니다.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBulkApprovePending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-extrabold transition-colors shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  대기 학생 {pendingCount}명 즉시 일괄 승인
                </button>
              </div>
            )}

            <p className="text-sm text-slate-600 leading-relaxed">
              학생이 <strong>학교 / 학년 / 반 / 번호 / 생년월일 / 이름</strong>으로 가입을 신청하면 이곳에 실시간으로 표시됩니다.
              학교 공용 네트워크 환경을 고려하여 IP는 검사하지 않으며, <strong>기기 고유 MAC 주소 식별자</strong> 기준으로만 중복을 식별합니다.
            </p>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap">
              {/* Student Name Search Input */}
              <div className="relative min-w-[220px] sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={approvalSearchName}
                  onChange={(e) => setApprovalSearchName(e.target.value)}
                  placeholder="학생 이름 검색 (예: 홍길동)..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {approvalSearchName && (
                  <button
                    type="button"
                    onClick={() => setApprovalSearchName('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title="검색어 지우기"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setApprovalFilter('all')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    approvalFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  전체 ({cloudRegistrations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter('pending')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    approvalFilter === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  승인 대기 ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter('approved')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    approvalFilter === 'approved'
                      ? 'bg-emerald-600 text-white'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  승인 완료 ({approvedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter('rejected')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    approvalFilter === 'rejected'
                      ? 'bg-rose-600 text-white'
                      : 'border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  반려됨 ({rejectedCount})
                </button>
              </div>
            </div>

            {/* Approval Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                    <th className="py-3 px-3.5 text-left">상태</th>
                    <th className="py-3 px-3.5 text-left">학교 / 학년 / 반 / 번호</th>
                    <th className="py-3 px-3.5 text-left">이름</th>
                    <th className="py-3 px-3.5 text-left">생년월일</th>
                    <th className="py-3 px-3.5 text-left">기기 고유 MAC 주소 식별자 (중복 점검)</th>
                    <th className="py-3 px-3.5 text-left">관리자 승인 처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRegistrations.length > 0 ? (
                    filteredRegistrations.map((reg) => {
                      const isDupDev = reg.deviceHash && deviceCounts[reg.deviceHash] > 1;
                      return (
                        <tr key={reg.studentKey} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3.5">
                            {reg.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800">
                                <Clock className="h-3.5 w-3.5" /> 승인 대기
                              </span>
                            )}
                            {reg.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800">
                                <UserCheck className="h-3.5 w-3.5" /> 승인됨
                              </span>
                            )}
                            {reg.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-800">
                                <XCircle className="h-3.5 w-3.5" /> 반려됨
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 font-semibold text-slate-800">
                            {reg.school} {reg.grade}학년 {reg.classNum}반 {reg.studentNum}번
                          </td>
                          <td className="py-3 px-3.5 font-bold text-slate-900">{reg.name}</td>
                          <td className="py-3 px-3.5 mono text-xs text-slate-600">{reg.birthDate}</td>
                          <td className="py-3 px-3.5 mono text-xs">
                            <div className="flex items-center gap-1.5">
                              <Fingerprint className="h-3.5 w-3.5 text-blue-600" />
                              <span className="text-slate-700">MAC: {formatDeviceHashAsMac(reg.deviceHash)}</span>
                              {isDupDev && (
                                <span className="inline-flex items-center gap-0.5 text-rose-600 font-bold">
                                  <ShieldAlert className="h-3.5 w-3.5" /> 동일 MAC 중복 ({deviceCounts[reg.deviceHash]}명)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {reg.status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStudentStatus(reg, 'approved')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  가입 승인
                                </button>
                              )}
                              {reg.status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStudentStatus(reg, 'rejected')}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                                >
                                  반려
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteStudentRegistration(reg)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 px-4 text-center text-slate-500">
                        {approvalSearchName
                          ? `'${approvalSearchName}' 학생 이름을 포함하는 가입 신청 내역이 없습니다.`
                          : '현재 해당 상태의 학생 가입 신청 내역이 없습니다.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION: Real-time Student Access Logs (Live Audit Trail) */}
      <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAccessLogsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-2xs"
              aria-expanded={isAccessLogsOpen}
              aria-label="학생 실시간 접속 로그 메뉴 접기/펼치기"
            >
              {isAccessLogsOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 text-indigo-600" />
                  <span>접기</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 text-indigo-600" />
                  <span>펼치기</span>
                </>
              )}
            </button>
            <div>
              <div className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Firestore 실시간 수신 모니터링
              </div>
              <h2 className="mt-0.5 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                학생 실시간 접속 로그
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  누적 {accessLogs.length}건 · 오늘 {todayLogs.length}건
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportAccessLogsCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-all shadow-2xs"
              title="현재 필터링된 접속 로그를 CSV 파일로 저장합니다"
            >
              <Download className="h-3.5 w-3.5" />
              <span>접속 로그 CSV 다운로드</span>
            </button>
          </div>
        </div>

        {isAccessLogsOpen && (
          <div className="mt-5 pt-4 border-t border-indigo-100 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              학생들이 <strong>가입 신청, 로그인, 세션 복귀, 활동지 클라우드 저장</strong>을 수행할 때마다 실시간으로 기록되는 접속 감사 로그(Audit Trail)입니다.
              오전 수업과 오후 수업의 시간대별 접속 인원 및 기기 정보를 한눈에 파악할 수 있습니다.
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-indigo-500" />
                  오늘 총 접속
                </div>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {todayLogs.length} <span className="text-xs font-semibold text-slate-500">건</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  누적 총 {accessLogs.length}건
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 shadow-2xs">
                <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  🌅 오전 접속 (12시 전)
                </div>
                <div className="mt-1 text-2xl font-black text-amber-900">
                  {morningLogsCount} <span className="text-xs font-semibold text-amber-700">건</span>
                </div>
                <div className="mt-0.5 text-[11px] text-amber-700">
                  00:00 ~ 11:59 발생 기록
                </div>
              </div>

              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3.5 shadow-2xs">
                <div className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
                  <Moon className="h-3.5 w-3.5 text-sky-500" />
                  🌇 오후 접속 (12시 후)
                </div>
                <div className="mt-1 text-2xl font-black text-sky-900">
                  {afternoonLogsCount} <span className="text-xs font-semibold text-sky-700">건</span>
                </div>
                <div className="mt-0.5 text-[11px] text-sky-700">
                  12:00 ~ 23:59 발생 기록
                </div>
              </div>

              <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 shadow-2xs">
                <div className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5 text-purple-500" />
                  고유 접속 기기
                </div>
                <div className="mt-1 text-2xl font-black text-purple-900">
                  {uniqueDevicesCount} <span className="text-xs font-semibold text-purple-700">대</span>
                </div>
                <div className="mt-0.5 text-[11px] text-purple-700">
                  MAC 식별자 기준
                </div>
              </div>
            </div>

            {/* Controls: Time Filter, Event Filter, Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap pt-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-extrabold text-slate-500 mr-1">시간대:</span>
                <button
                  type="button"
                  onClick={() => setAccessTimeFilter('all')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    accessTimeFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  전체 ({accessLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccessTimeFilter('today')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    accessTimeFilter === 'today'
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  오늘 ({todayLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccessTimeFilter('morning')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    accessTimeFilter === 'morning'
                      ? 'bg-amber-600 text-white'
                      : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  🌅 오전 ({morningLogsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAccessTimeFilter('afternoon')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    accessTimeFilter === 'afternoon'
                      ? 'bg-sky-600 text-white'
                      : 'border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100'
                  }`}
                >
                  🌇 오후 ({afternoonLogsCount})
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={accessEventFilter}
                  onChange={(e) => setAccessEventFilter(e.target.value as any)}
                  className="rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">모든 이벤트 구분</option>
                  <option value="login">로그인</option>
                  <option value="register">가입 신청</option>
                  <option value="save">클라우드 저장</option>
                  <option value="resume">세션 복귀</option>
                </select>

                <div className="relative min-w-[200px] sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={accessSearch}
                    onChange={(e) => setAccessSearch(e.target.value)}
                    placeholder="학생명, 학적, MAC, IP 검색..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  {accessSearch && (
                    <button
                      type="button"
                      onClick={() => setAccessSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Access Logs Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">접속 시각 (KST)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">이벤트 구분</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">학생 정보 (학적 · 성명)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">승인 상태</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">기기 식별자 (MAC 주소)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">접속 환경 (IP · 브라우저)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccessLogs.length > 0 ? (
                    filteredAccessLogs.map((log) => {
                      const d = parseLogDate(log.createdAt);
                      const isAfternoon = d ? d.getHours() >= 12 : false;
                      return (
                        <tr key={log.logId} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-800">
                            <span className="flex items-center gap-1.5">
                              {isAfternoon ? (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px]">
                                  오후
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  오전
                                </span>
                              )}
                              <span>{formatLogTimestamp(log.createdAt)}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {formatEventBadge(log.eventType)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {log.school} {log.grade}학년 {log.classNum}반 {log.studentNum}번
                            </div>
                            <div className="text-[11px] font-semibold text-indigo-700">
                              {log.name}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {log.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3" /> 승인 완료
                              </span>
                            ) : log.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                                <Clock className="h-3 w-3" /> 승인 대기
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                                <XCircle className="h-3 w-3" /> 반려
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                            <div className="flex items-center gap-1 font-bold text-slate-800">
                              <Fingerprint className="h-3 w-3 text-slate-400" />
                              {formatDeviceHashAsMac(log.deviceHash)}
                            </div>
                            <div className="text-[10px] text-slate-600 truncate max-w-[140px]" title={log.studentKey}>
                              {log.studentKey}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-600">
                            <div className="font-mono text-slate-700">{log.ipAddress}</div>
                            <div className="text-[10px] text-slate-600 truncate max-w-[260px]" title={log.userAgent}>
                              {log.userAgent}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        {accessSearch || accessTimeFilter !== 'all' || accessEventFilter !== 'all'
                          ? '선택한 필터 조건에 부합하는 접속 로그가 없습니다.'
                          : '기록된 학생 실시간 접속 로그가 아직 없습니다.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Header & Controls Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsControlsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              aria-expanded={isControlsOpen}
              aria-label="교사용 수사 기록실 메뉴 접기/펼치기"
            >
              {isControlsOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 text-slate-600" />
                  <span>접기</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                  <span>펼치기</span>
                </>
              )}
            </button>
            <div>
              <div className="text-xs font-bold text-blue-600">
                학급 데이터 수합 · 교사 워크스페이스
              </div>
              <h2 className="mt-0.5 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                교사용 수사 기록실
                {!isControlsOpen && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    수합 학생 {count}명 · 평가 완료 {classEvalSummary.completeCount}/{count}명 ({classEvalSummary.averageProgressPercent}%)
                  </span>
                )}
              </h2>
            </div>
          </div>
        </div>

        {isControlsOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              승인된 학생들이 작성한 1~7차시(직접증명 · 반례 · 대우법 · 귀류법 · 절대부등식1·2·3) 탐구 기록이 실시간으로 연동되며, 외부 JSON 파일을 추가로 불러오거나 CSV로 내려받을 수도 있습니다.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                multiple
                onChange={handleUploadFiles}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[45px] items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
              >
                <Upload className="h-4 w-4" />
                학생 JSON 여러 개 불러오기
              </button>

              <button
                type="button"
                onClick={handleLoadSampleData}
                className="inline-flex min-h-[45px] items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                예시 학생 데이터(2명) 체험하기
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex min-h-[45px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                CSV 내려받기
              </button>

              {records.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onRequestConfirm(
                      '로컬 수합 목록 지우기',
                      '현재 브라우저의 로컬 수합 목록을 비울까요? (클라우드에 승인된 학생 기록은 유지됩니다.)',
                      () => {
                        onUpdateRecords([]);
                        onSelectStudent('');
                        setNotice({ text: '로컬 수합 목록을 비웠습니다.', type: 'info' });
                      }
                    )
                  }
                  className="inline-flex min-h-[45px] items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  로컬 수합 목록 지우기
                </button>
              )}
            </div>

            <div
              role="status"
              className={`mt-4 rounded-xl p-3.5 text-sm font-medium ${
                notice.type === 'good'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : notice.type === 'warn'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-slate-50 text-slate-800 border border-slate-200'
              }`}
            >
              {notice.text}
            </div>

            {/* Summary KPI Tiles */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-9">
              {[
                [count, '수합 학생 (명)'],
                [complete1, '1차시 완성'],
                [complete2, '2차시 완성'],
                [complete3, '3차시(대우) 완성'],
                [complete4, '4차시(귀류) 완성'],
                [complete5, '5차시(절대1) 완성'],
                [complete6, '6차시(절대2) 완성'],
                [complete7, '7차시(절대3) 완성'],
              ].map(([num, label], idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-center"
                >
                  <strong className="block text-xl sm:text-2xl font-extrabold text-blue-600 mono">{num}</strong>
                  <span className="mt-0.5 block text-[11px] font-semibold text-slate-600">{label}</span>
                </div>
              ))}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center">
                <strong className="block text-xl sm:text-2xl font-extrabold text-emerald-700 mono">
                  {classEvalSummary.completeCount}/{count}명 ({classEvalSummary.averageProgressPercent}%)
                </strong>
                <span className="mt-0.5 block text-[11px] font-bold text-emerald-900">
                  교수자 평가 완료
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Analytics Dashboard */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAnalyticsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              aria-expanded={isAnalyticsOpen}
              aria-label="학급 탐구 역량 대시보드 접기/펼치기"
            >
              {isAnalyticsOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 text-slate-600" />
                  <span>접기</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                  <span>펼치기</span>
                </>
              )}
            </button>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">학급 탐구 역량 대시보드</h3>
          </div>
          <span className="text-xs font-medium text-slate-500">
            제출 기록 기반 자동 집계 · 역량 평정은 교사가 직접 입력
          </span>
        </div>

        {isAnalyticsOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {count === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-600">
                승인된 학생이 활동을 시작하거나 상단의 <strong>[예시 학생 데이터(2명) 체험하기]</strong> 버튼을 누르면 학급별 탐구 지표 그래프가 나타납니다.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-3">활동 완료 현황</h4>
                  <div className="space-y-2.5">
                    {checkRows.map(([title, n]) => {
                      const pct = count ? Math.round((n / count) * 100) : 0;
                      return (
                        <div key={title}>
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{title}</span>
                            <strong className="mono text-slate-900">
                              {n}명 ({pct}%)
                            </strong>
                          </div>
                          <div className="mt-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    기록 여부의 집계이며 증명의 정확성이나 성취수준을 자동 판정하지 않습니다.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-3">2차시 학생 판단 분포</h4>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div
                      className="relative h-32 w-32 rounded-full shrink-0"
                      style={{ background: count ? `conic-gradient(${slices})` : '#e2e8f0' }}
                    >
                      <div className="absolute inset-6 rounded-full bg-white grid place-items-center font-extrabold text-sm mono text-slate-900">
                        {count}명
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                      {decisions.map(([label, n, color]) => (
                        <div key={label} className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span>
                            {label}: <strong className="mono text-slate-900">{n}명</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    참·거짓은 학생이 선택한 판단이며 정답률이 아닙니다.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-3">2차시 탐구주제 선택 현황</h4>
                  <div className="space-y-2.5">
                    {topicRows.map(([title, n]) => {
                      const pct = count ? Math.round((n / count) * 100) : 0;
                      return (
                        <div key={title}>
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{title}</span>
                            <strong className="mono text-slate-900">
                              {n}명 ({pct}%)
                            </strong>
                          </div>
                          <div className="mt-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-3">교사 평정 평균 (0~3점)</h4>
                  <div className="space-y-2.5">
                    {means.map((m) => (
                      <div key={m.title}>
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{m.title}</span>
                          <strong className="mono text-slate-900">
                            {m.mean === null ? '평정 없음' : `${m.mean.toFixed(2)} / 3`} ({m.count}명)
                          </strong>
                        </div>
                        <div className="mt-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-600"
                            style={{ width: `${m.mean === null ? 0 : (m.mean / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    0: 증거 부족 / 1: 시작 단계 / 2: 부분적 수행 / 3: 충분한 수행.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 4: Student Records Table & Detail View */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRecordsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              aria-expanded={isRecordsOpen}
              aria-label="탐정별 사건 기록 메뉴 접기/펼치기"
            >
              {isRecordsOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 text-slate-600" />
                  <span>접기</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                  <span>펼치기</span>
                </>
              )}
            </button>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                <Users className="h-5 w-5 text-blue-600" />
                <span>탐정별 사건 기록</span>
                {!isRecordsOpen && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    수합 {records.length}명 (필터 적용 {filteredSortedRecords.length}명)
                  </span>
                )}
              </h3>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-500">
            승인된 학생 답안 및 불러온 파일이 함께 표시됩니다.
          </span>
        </div>

        {isRecordsOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            {/* Search and Column Filter Bar */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* 1. Student Name Search */}
                <div className="relative min-w-[220px] sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={recordsSearchName}
                    onChange={(e) => setRecordsSearchName(e.target.value)}
                    placeholder="학생 이름 또는 학번 검색 (예: 김탐정)..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {recordsSearchName && (
                    <button
                      type="button"
                      onClick={() => setRecordsSearchName('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title="검색어 지우기"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Status & Reset */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    표시: <strong className="mono text-blue-600">{filteredSortedRecords.length}</strong> / {records.length}명
                  </span>
                  {isAnyRecordsFilterActive && (
                    <button
                      type="button"
                      onClick={resetRecordsFilters}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                      title="모든 필터 및 검색 초기화"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                      <span>필터 초기화</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Column Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
                {/* Column Filter: 학급/반 */}
                <div>
                  <label htmlFor="filter-group" className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Filter className="h-3 w-3 text-slate-400" />
                    <span>학급 / 반 필터</span>
                  </label>
                  <select
                    id="filter-group"
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">전체 학급 / 반</option>
                    {uniqueGroups.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Column Filter: 1차시 사례 수 */}
                <div>
                  <label htmlFor="filter-examples" className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Filter className="h-3 w-3 text-slate-400" />
                    <span>1차시 사례 수</span>
                  </label>
                  <select
                    id="filter-examples"
                    value={filterExamples}
                    onChange={(e) => setFilterExamples(e.target.value as typeof filterExamples)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">전체 사례 수</option>
                    <option value="4plus">사례 4개 이상 (충분한 관찰)</option>
                    <option value="1to3">사례 1~3개 (관찰 진행 중)</option>
                    <option value="0">사례 0개 (미작성)</option>
                  </select>
                </div>

                {/* Column Filter: 2차시 탐구 주제 */}
                <div>
                  <label htmlFor="filter-topic" className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Filter className="h-3 w-3 text-slate-400" />
                    <span>2차시 탐구 주제</span>
                  </label>
                  <select
                    id="filter-topic"
                    value={filterTopic}
                    onChange={(e) => setFilterTopic(e.target.value as typeof filterTopic)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">전체 탐구 주제</option>
                    {(Object.entries(TOPICS) as [TopicId, typeof TOPICS[TopicId]][]).map(([id, t]) => (
                      <option key={id} value={id}>
                        [{t.tag}] {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Column Filter: 2차시 판단 */}
                <div>
                  <label htmlFor="filter-decision" className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Filter className="h-3 w-3 text-slate-400" />
                    <span>2차시 참/거짓 판단</span>
                  </label>
                  <select
                    id="filter-decision"
                    value={filterDecision}
                    onChange={(e) => setFilterDecision(e.target.value as typeof filterDecision)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">전체 판단</option>
                    <option value="true">참 (증명 완료)</option>
                    <option value="false">거짓 (반례 발견)</option>
                    <option value="unknown">미해결</option>
                    <option value="none">미작성</option>
                  </select>
                </div>

                {/* Column Filter: 교수자 평가 상태 */}
                <div>
                  <label htmlFor="filter-eval-status" className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Filter className="h-3 w-3 text-emerald-600" />
                    <span>교수자 평가 상태</span>
                  </label>
                  <select
                    id="filter-eval-status"
                    value={filterEvalStatus}
                    onChange={(e) => setFilterEvalStatus(e.target.value as typeof filterEvalStatus)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">전체 평가 상태</option>
                    <option value="complete">평가 완료 (100%)</option>
                    <option value="partial">평가 진행 중 (차시 추가·부분 평정)</option>
                    <option value="none">미평가 (0%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                    <th className="py-3 px-3.5 text-left">학급</th>
                    <th className="py-3 px-3.5 text-left">식별코드(학번·이름)</th>
                    <th className="py-3 px-3.5 text-left">1차시 사례/증명</th>
                    <th className="py-3 px-3.5 text-left">2차시 주제/판단</th>
                    <th className="py-3 px-3.5 text-left">3차시 대우법</th>
                    <th className="py-3 px-3.5 text-left">4차시 귀류법</th>
                    <th className="py-3 px-3.5 text-left">5~7차시 절대부등식</th>
                    <th className="py-3 px-3.5 text-left">교수자 평가 현황 (진행율)</th>
                    <th className="py-3 px-3.5 text-left">평가 및 비교</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSortedRecords.length > 0 ? (
                    filteredSortedRecords.map((x) => {
                      const k = studentKey(x);
                      const isSel = k === selectedKey;
                      const tDef = x.l2.topic ? TOPICS[x.l2.topic as TopicId] : null;
                      const evalProg = getTeacherEvaluationProgress(x);
                      const avgScore = getTeacherEvalAverage(ensureTeacherEval(x).scores);
                      return (
                        <tr
                          key={k}
                          className={
                            isSel
                              ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                              : 'hover:bg-slate-50/80 transition-colors'
                          }
                        >
                          <td className="py-3 px-3.5 text-slate-700">{x.group || '—'}</td>
                          <td className="py-3 px-3.5 font-bold mono text-slate-900">{x.code || '미입력'}</td>
                          <td className="py-3 px-3.5 mono text-slate-700">
                            사례 {x.l1.examples.length}개 · {x.l1.proofVerified.filter(Boolean).length}/4
                          </td>
                          <td className="py-3 px-3.5 text-slate-700">
                            {tDef?.tag || '미선택'} ·{' '}
                            <strong className="text-slate-900">
                              {({ true: '참', false: '거짓', unknown: '미해결' } as Record<string, string>)[
                                x.l2.decision
                              ] || '미작성'}
                            </strong>
                          </td>
                          <td className="py-3 px-3.5 mono text-slate-700">
                            {x.l3 ? evaluateRubricL3(x.l3).filter(Boolean).length : 0}/5
                          </td>
                          <td className="py-3 px-3.5 mono text-slate-700">
                            {x.l4 ? evaluateRubricL4(x.l4).filter(Boolean).length : 0}/5
                          </td>
                          <td className="py-3 px-3.5 text-xs text-slate-700 min-w-[210px]">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span
                                  className={`rounded px-1.5 py-0.5 font-bold text-[11px] border ${
                                    x.l5 && (x.l5.prob1ProofText || x.l5.examples.length > 0)
                                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                      : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}
                                  title="5차시 절대부등식1: 사례 수, Step 4단계 확인, 증명 서술"
                                >
                                  5차 {x.l5?.examples?.length ?? 0}개·{x.l5?.prob1Verified?.filter(Boolean).length ?? 0}/4·{x.l5?.prob1ProofText ? '서술' : '미작성'}
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.5 font-bold text-[11px] border ${
                                    x.l6 && (x.l6.prob1ProofText || x.l6.examples.length > 0)
                                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                                      : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}
                                  title="6차시 산술·기하: 사례 수, Step 4단계 확인, 증명 서술"
                                >
                                  6차 {x.l6?.examples?.length ?? 0}개·{x.l6?.prob1Verified?.filter(Boolean).length ?? 0}/4·{x.l6?.prob1ProofText ? '서술' : '미작성'}
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.5 font-bold text-[11px] border ${
                                    x.l7 && (x.l7.prob1ProofText || x.l7.examples.length > 0)
                                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                                      : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}
                                  title="7차시 절댓값 부등식: 사례 수, Step 4단계 확인, 증명 서술"
                                >
                                  7차 {x.l7?.examples?.length ?? 0}개·{x.l7?.prob1Verified?.filter(Boolean).length ?? 0}/4·{x.l7?.prob1ProofText ? '서술' : '미작성'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                루브릭 5차 {x.l5 ? evaluateRubricL5(x.l5).filter(Boolean).length : 0}/5 · 6차 {x.l6 ? evaluateRubricL6(x.l6).filter(Boolean).length : 0}/5 · 7차 {x.l7 ? evaluateRubricL7(x.l7).filter(Boolean).length : 0}/5
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 min-w-[200px]">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-extrabold border ${
                                    evalProg.status === 'complete'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : evalProg.status === 'partial'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {evalProg.status === 'complete'
                                    ? '✓ 평가 완료'
                                    : evalProg.status === 'partial'
                                    ? '● 평가 진행 중'
                                    : '미평가'}
                                </span>
                                <span className="mono text-xs font-extrabold text-slate-800">
                                  {evalProg.percent}% ({evalProg.completedCount}/{evalProg.totalCount})
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    evalProg.status === 'complete'
                                      ? 'bg-emerald-600'
                                      : evalProg.status === 'partial'
                                      ? 'bg-amber-500'
                                      : 'bg-slate-300'
                                  }`}
                                  style={{ width: `${evalProg.percent}%` }}
                                />
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                                <span>
                                  평정 {evalProg.scoredRubricCount}/{evalProg.totalRubricCount} · 피드백 {evalProg.hasFeedback ? '완료' : '미작성'}
                                </span>
                                {avgScore !== null && (
                                  <strong className="mono text-slate-700">평균 {avgScore.toFixed(2)}점</strong>
                                )}
                              </div>
                              {evalProg.isReopenedByLessonExpansion && (
                                <div className="rounded-md bg-amber-50/90 border border-amber-200/80 px-2 py-1 text-[10px] font-bold text-amber-800">
                                  차시 추가로 완료 취소 → 진행형 (미평정 {evalProg.ungradedRubricCount}건)
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectStudent(k);
                                setIsModelessOpen(true);
                                setIsModelessMinimized(false);
                              }}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                                isSel && isModelessOpen
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {isSel && isModelessOpen ? '비모달 평가·비교 중' : '상세 비교 · 평가'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 px-4 text-center text-slate-500">
                        {isAnyRecordsFilterActive
                          ? '선택한 검색 및 필터 조건에 해당하는 학생 기록이 없습니다.'
                          : '불러온 학생 자료가 없습니다.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Inline comparison fallback (if teacher prefers viewing at table bottom) */}
            {selectedStudent && !isModelessOpen && (
              <div ref={detailRef} className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {selectedStudent.code || '미입력'} 학생의 1~7차시 종합 비교 ({selectedStudent.group || '학급 미입력'})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModelessOpen(true);
                        setIsModelessMinimized(false);
                      }}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <Layers className="h-4 w-4" />
                      비모달 플로팅 창으로 열기
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintStudentReport(selectedStudent)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                    >
                      <Printer className="h-4 w-4" />
                      PDF 인쇄
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                    <div className="text-xs font-bold text-blue-600">1차시 · 교사 안내형 수사 (직접 증명)</div>
                    {[
                      ['추측한 명제', selectedStudent.l1.claim],
                      ['사례 확인의 한계', selectedStudent.l1.limits],
                      ['일반적인 증명 서술', selectedStudent.l1.proofText],
                      ['탐구 성찰', selectedStudent.l1.reflection],
                      ['다음 질문: 16으로 바꾸면?', selectedStudent.l1.bridge],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">{label}</div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          {val || '미작성'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                    <div className="text-xs font-bold text-emerald-700">2차시 · 학생 주도형 수사 (반례와 정당화)</div>
                    {[
                      [
                        '선택한 명제',
                        selectedStudent.l2.topic === 'd'
                          ? selectedStudent.l2.customStatement
                          : TOPICS[selectedStudent.l2.topic as TopicId]?.statement,
                      ],
                      [
                        '사례 탐색 / 판단',
                        `${selectedStudent.l2.examples.length}개 · ${
                          ({ true: '참', false: '거짓', unknown: '미해결' } as Record<string, string>)[
                            selectedStudent.l2.decision
                          ] || '미작성'
                        }`,
                      ],
                      ['추측과 이유', selectedStudent.l2.guess],
                      [
                        '반례 / 증명 / 미해결 탐구',
                        selectedStudent.l2.decision === 'false'
                          ? `반례 n=${selectedStudent.l2.counter || '(미작성)'}\n${selectedStudent.l2.counterReason}`
                          : selectedStudent.l2.proofText,
                      ],
                      ['2차시 성찰', selectedStudent.l2.reflection],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">{label}</div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          {val || '미작성'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                    <div className="text-xs font-bold text-indigo-700">3차시 · 대우법 수사 (문제 1·2)</div>
                    {[
                      [
                        '문제 1 (n²이 짝수이면 n도 짝수) 증명',
                        `단계 확인: ${selectedStudent.l3?.prob1Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l3?.prob1ProofText || '미작성'}`,
                      ],
                      [
                        '문제 2 (n²이 3의 배수이면 n도 3의 배수) 증명',
                        `단계 확인: ${selectedStudent.l3?.prob2Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l3?.prob2ProofText || '미작성'}`,
                      ],
                      ['3차시 성찰', selectedStudent.l3?.reflection1],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">{label}</div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          {val || '미작성'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                    <div className="text-xs font-bold text-purple-700">4차시 · 귀류법 수사 (문제 1·2)</div>
                    {[
                      [
                        '문제 1 (√2는 유리수가 아니다) 증명',
                        `단계 확인: ${selectedStudent.l4?.prob1Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l4?.prob1ProofText || '미작성'}`,
                      ],
                      [
                        '문제 2 (1+√2는 유리수가 아니다) 증명',
                        `단계 확인: ${selectedStudent.l4?.prob2Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l4?.prob2ProofText || '미작성'}`,
                      ],
                      ['4차시 성찰', selectedStudent.l4?.reflection1],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">
                          <MathText text={label || ''} />
                        </div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          <MathText text={val || '미작성'} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                    <div className="text-xs font-bold text-cyan-700 flex items-center justify-between">
                      <span>5차시 · 절대부등식1 수사 (완전제곱식)</span>
                      <span className="mono text-[11px] font-semibold text-cyan-800 bg-cyan-100/70 px-2 py-0.5 rounded">
                        사례 {selectedStudent.l5?.examples?.length ?? 0}개
                      </span>
                    </div>
                    {[
                      [
                        '수치 계산 사례 탐색',
                        selectedStudent.l5?.examples?.length
                          ? `등록된 사례 ${selectedStudent.l5.examples.length}개: ${selectedStudent.l5.examples
                              .slice(0, 3)
                              .map((ex) => `(a=${ex.a}, b=${ex.b} → a²+b²=${ex.lhs}, ab=${ex.rhs})`)
                              .join('; ')}`
                          : '사례 미등록',
                      ],
                      [
                        '실수 제곱 기본 성질 개념 선택',
                        selectedStudent.l5?.squareConceptChoice === 'nonnegative'
                          ? 'X² ≥ 0 (항상 0 이상) [정답]'
                          : selectedStudent.l5?.squareConceptChoice
                          ? selectedStudent.l5.squareConceptChoice
                          : '미선택',
                      ],
                      [
                        '문제 1 (a²+b² ≥ ab) 증명 서술',
                        `단계 확인: ${selectedStudent.l5?.prob1Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l5?.prob1ProofText || '미작성'}`,
                      ],
                      [
                        `등호(=) 성립 조건 (${selectedStudent.l5?.equalityConditionChecked ? '확인 완료' : '미확인'})`,
                        selectedStudent.l5?.equalityReason || '이유 미작성',
                      ],
                      [
                        '문제 2 ((a+b)² ≥ 4ab 외) 증명 서술',
                        `단계 확인: ${selectedStudent.l5?.prob2Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l5?.prob2ProofText || '미작성'}`,
                      ],
                      ['5차시 성찰 1 (완전제곱식 증명)', selectedStudent.l5?.reflection1 || '미작성'],
                      ['5차시 성찰 2 (등호 성립 조건 비교)', selectedStudent.l5?.reflection2 || '미작성'],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">
                          <MathText text={label || ''} />
                        </div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          <MathText text={val || '미작성'} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                    <div className="text-xs font-bold text-teal-700 flex items-center justify-between">
                      <span>6차시 · 절대부등식2 수사 (산술·기하평균)</span>
                      <span className="mono text-[11px] font-semibold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                        사례 {selectedStudent.l6?.examples?.length ?? 0}개
                      </span>
                    </div>
                    {[
                      [
                        '수치·기하 시뮬레이션 탐색 사례',
                        selectedStudent.l6?.examples?.length
                          ? `등록된 사례 ${selectedStudent.l6.examples.length}개: ${selectedStudent.l6.examples
                              .slice(0, 3)
                              .map((ex) => `(a=${ex.a}, b=${ex.b} → 산술=${ex.arith}, 기하=${ex.geom})`)
                              .join('; ')}`
                          : '사례 미등록',
                      ],
                      [
                        '산술·기하평균 전제 조건 선택',
                        selectedStudent.l6?.amgmConceptChoice === 'positive'
                          ? '양수 조건 a>0, b>0 [정답]'
                          : selectedStudent.l6?.amgmConceptChoice
                          ? selectedStudent.l6.amgmConceptChoice
                          : '미선택',
                      ],
                      [
                        '문제 1 ((a+b)/2 ≥ √(ab)) 증명 서술',
                        `단계 확인: ${selectedStudent.l6?.prob1Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l6?.prob1ProofText || '미작성'}`,
                      ],
                      [
                        `조화평균 관계 (${selectedStudent.l6?.harmonicChecked ? '확인 완료' : '미확인'})`,
                        selectedStudent.l6?.harmonicReason || '이유 미작성',
                      ],
                      [
                        '문제 2 (a+1/a ≥ 2 외) 증명 서술',
                        `단계 확인: ${selectedStudent.l6?.prob2Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l6?.prob2ProofText || '미작성'}`,
                      ],
                      ['6차시 성찰 1 (양수 조건과 제곱근 변형)', selectedStudent.l6?.reflection1 || '미작성'],
                      ['6차시 성찰 2 (산술·기하·조화평균 대소관계)', selectedStudent.l6?.reflection2 || '미작성'],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">
                          <MathText text={label || ''} />
                        </div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          <MathText text={val || '미작성'} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3 lg:col-span-2">
                    <div className="text-xs font-bold text-rose-700 flex items-center justify-between">
                      <span>7차시 · 절대부등식3 수사 (절댓값 부등식)</span>
                      <span className="mono text-[11px] font-semibold text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded">
                        사례 {selectedStudent.l7?.examples?.length ?? 0}개
                      </span>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {[
                        [
                          '절댓값 수치 계산 사례',
                          selectedStudent.l7?.examples?.length
                            ? `등록된 사례 ${selectedStudent.l7.examples.length}개: ${selectedStudent.l7.examples
                                .slice(0, 3)
                                .map((ex) => `(a=${ex.a}, b=${ex.b} → |a+b|=${ex.lhsSum}, |a|+|b|=${ex.rhsSum})`)
                                .join('; ')}`
                            : '사례 미등록',
                        ],
                        [
                          '절댓값 증명 기본 전략 선택',
                          selectedStudent.l7?.absSquareConceptChoice === 'square_diff'
                            ? '양변의 제곱의 차 (|A|²-|B|²) [정답]'
                            : selectedStudent.l7?.absSquareConceptChoice
                            ? selectedStudent.l7.absSquareConceptChoice
                            : '미선택',
                        ],
                        [
                          '문제 1 (|a+b| ≤ |a|+|b|) 증명 서술',
                          `단계 확인: ${selectedStudent.l7?.prob1Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l7?.prob1ProofText || '미작성'}`,
                        ],
                        [
                          `절댓값의 차 (|a|-|b|) 부호 판별 (${selectedStudent.l7?.absDiffChecked ? '확인 완료' : '미확인'})`,
                          selectedStudent.l7?.absDiffReason || '이유 미작성',
                        ],
                        [
                          '문제 2 (|a−b| ≤ |a|+|b| 외) 증명 서술',
                          `단계 확인: ${selectedStudent.l7?.prob2Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l7?.prob2ProofText || '미작성'}`,
                        ],
                        ['7차시 성찰 1 (절댓값 제곱의 차 원리)', selectedStudent.l7?.reflection1 || '미작성'],
                        ['7차시 성찰 2 (부호 조건에 따른 등호 성립 차이)', selectedStudent.l7?.reflection2 || '미작성'],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <div className="text-xs font-bold text-slate-700">
                            <MathText text={label || ''} />
                          </div>
                          <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                            <MathText text={val || '미작성'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inline Teacher Evaluation & Feedback Section */}
                {(() => {
                  const inlineEvalProg = getTeacherEvaluationProgress(selectedStudent);
                  return (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6 space-y-5">
                      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 pb-3">
                        <div>
                          <div className="text-xs font-bold text-blue-600">개별 학습자 평가</div>
                          <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                            {selectedStudent.code} 학생 역량 평가 및 맞춤 피드백
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-extrabold border ${
                              inlineEvalProg.status === 'complete'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : inlineEvalProg.status === 'partial'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {inlineEvalProg.statusLabel} · 진행율 {inlineEvalProg.percent}% ({inlineEvalProg.completedCount}/{inlineEvalProg.totalCount})
                          </span>
                        </div>
                      </div>

                      {inlineEvalProg.isReopenedByLessonExpansion && (
                        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-900">
                          새로운 차시(평가 항목)가 추가되어 기존 <strong>평가 완료</strong> 처리가 취소되고 <strong>평가 진행 중</strong> 상태로 변경되었습니다. 새로 추가된 차시 항목({inlineEvalProg.ungradedRubricCount}개)을 평정하면 다시 평가 완료(100%)로 전환됩니다.
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        {EVAL_CRITERIA.map((title, i) => {
                          const ev = ensureTeacherEval(selectedStudent);
                          return (
                            <div key={title}>
                              <label htmlFor={`inlineEval${i}`} className="block text-xs sm:text-sm font-bold text-slate-900">
                                {title}
                                <span className="block text-xs font-normal text-slate-500">
                                  {EVAL_DESCRIPTIONS[i]}
                                </span>
                              </label>
                              <select
                                id={`inlineEval${i}`}
                                value={ev.scores[i] === null ? '' : String(ev.scores[i])}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : Number(e.target.value);
                                  updateSelectedStudent((item) => {
                                    const currentEv = ensureTeacherEval(item);
                                    const nextScores = [...currentEv.scores];
                                    nextScores[i] = val;
                                    return {
                                      ...item,
                                      evaluation: {
                                        ...currentEv,
                                        scores: nextScores,
                                        evaluatedLessonCount: EVAL_CRITERIA.length,
                                      },
                                    };
                                  });
                                }}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              >
                                <option value="">평정 전</option>
                                {[0, 1, 2, 3].map((v) => (
                                  <option key={v} value={v}>
                                    {v}점 · {['증거 부족', '시작 단계', '부분적 수행', '충분한 수행'][v]}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>

                      <div>
                        <label htmlFor="inlineTeacherFeedback" className="block text-sm font-bold text-slate-900 mb-1.5">
                          학생에게 전달할 구체적인 피드백
                        </label>
                        <textarea
                          id="inlineTeacherFeedback"
                          rows={3}
                          value={ensureTeacherEval(selectedStudent).feedback}
                          onChange={(e) =>
                            updateSelectedStudent((item) => {
                              const ev = ensureTeacherEval(item);
                              return { ...item, evaluation: { ...ev, feedback: e.target.value } };
                            })
                          }
                          placeholder="잘한 점과 이를 뒷받침하는 학생의 탐구 기록을 적어 주세요."
                          className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="inlineTeacherNext" className="block text-sm font-bold text-slate-900 mb-1.5">
                          다음 탐구를 위한 제안
                        </label>
                        <textarea
                          id="inlineTeacherNext"
                          rows={2}
                          value={ensureTeacherEval(selectedStudent).nextStep}
                          onChange={(e) =>
                            updateSelectedStudent((item) => {
                              const ev = ensureTeacherEval(item);
                              return { ...item, evaluation: { ...ev, nextStep: e.target.value } };
                            })
                          }
                          placeholder="예: 반례가 가정을 만족하는지 먼저 확인하고, 문자로 일반화해 보세요."
                          className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* NON-MODAL FLOATING COMPARISON WINDOW (비모달 상세 비교 창) */}
      {isModelessOpen && selectedStudent && (
        <div
          className={`no-print fixed z-40 transition-all duration-200 pointer-events-auto shadow-2xl ${
            isModelessExpanded
              ? 'inset-3 sm:inset-6 flex flex-col rounded-2xl border-2 border-blue-500 bg-white overflow-hidden'
              : isModelessMinimized
              ? 'bottom-5 right-5 max-w-md rounded-xl border-2 border-blue-600 bg-slate-900 text-white p-3.5 flex items-center justify-between gap-3'
              : 'bottom-4 right-4 sm:right-6 w-[95vw] sm:w-[840px] max-h-[84vh] flex flex-col rounded-2xl border-2 border-blue-500 bg-white overflow-hidden'
          }`}
          role="region"
          aria-label="비모달 탐정 사건 상세 비교 창"
        >
          {isModelessMinimized ? (
            /* Minimized Pill View */
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">
                  비모달 비교 접힘: <strong className="text-white">{selectedStudent.code}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsModelessMinimized(false)}
                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
                >
                  창 펼치기
                </button>
                <button
                  type="button"
                  onClick={() => setIsModelessOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                  title="창 닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Full Modeless Window View */
            <>
              {/* Window Header Bar */}
              <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-2 border-b border-slate-800 shrink-0 select-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Layers className="h-5 w-5 text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-extrabold text-white truncate">
                        [비모달 비교] {selectedStudent.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        {selectedStudent.group || '학급 미입력'}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        비모달 모드 (배경 상호작용 가능)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Window Action Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPrintStudentReport(selectedStudent)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
                    title="이 학생 피드백 인쇄 / PDF 저장"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">PDF 인쇄</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModelessMinimized(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="창 최소화"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModelessExpanded((prev) => !prev)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={isModelessExpanded ? '기본 크기' : '창 최대화'}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModelessOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="비모달 창 닫기"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Window Scrollable Body */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1 bg-white">
                <div className="text-xs text-slate-500 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span>
                    💡 <strong>비모달 창:</strong> 이 창이 열려 있는 상태에서도 뒤쪽의 표에서 다른 학생을 클릭하여 즉시 비교할 수 있습니다.
                  </span>
                  <span className="mono text-slate-400 text-xs">
                    수정 시각: {selectedStudent.updatedAt ? new Date(selectedStudent.updatedAt).toLocaleTimeString('ko-KR') : '—'}
                  </span>
                </div>

                {/* 1~4차시 Side by Side Comparison */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      1차시 · 교사 안내형 수사 (규칙 발견 및 일반적 증명)
                    </div>
                    {[
                      ['추측한 명제', selectedStudent.l1.claim],
                      ['사례 확인의 한계', selectedStudent.l1.limits],
                      ['일반적인 증명 서술', selectedStudent.l1.proofText],
                      ['탐구 성찰', selectedStudent.l1.reflection],
                      ['다음 질문: 16으로 바꾸면?', selectedStudent.l1.bridge],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">{label}</div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          {val || '미작성'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      2차시 · 학생 주도형 수사 (반례 또는 정당화)
                    </div>
                    {[
                      [
                        '선택한 명제',
                        selectedStudent.l2.topic === 'd'
                          ? selectedStudent.l2.customStatement
                          : TOPICS[selectedStudent.l2.topic as TopicId]?.statement,
                      ],
                      [
                        '사례 탐색 / 판단',
                        `${selectedStudent.l2.examples.length}개 · ${
                          ({ true: '참', false: '거짓', unknown: '미해결' } as Record<string, string>)[
                            selectedStudent.l2.decision
                          ] || '미작성'
                        }`,
                      ],
                      ['추측과 이유', selectedStudent.l2.guess],
                      [
                        '반례 / 증명 / 미해결 탐구',
                        selectedStudent.l2.decision === 'false'
                          ? `반례 n=${selectedStudent.l2.counter || '(미작성)'}\n${selectedStudent.l2.counterReason}`
                          : selectedStudent.l2.proofText,
                      ],
                      ['2차시 성찰', selectedStudent.l2.reflection],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">{label}</div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          {val || '미작성'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      3차시 · 힌트 안내형 수사 (대우법 문제 1·2)
                    </div>
                    {[
                      [
                        '문제 1 (n²이 짝수 → n도 짝수)',
                        `단계 확인: ${selectedStudent.l3?.prob1Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l3?.prob1ProofText || '미작성'}`,
                      ],
                      [
                        '문제 2 (n²이 3의 배수 → n도 3의 배수)',
                        `단계 확인: ${selectedStudent.l3?.prob2Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l3?.prob2ProofText || '미작성'}`,
                      ],
                      ['3차시 성찰 1', selectedStudent.l3?.reflection1],
                      ['3차시 성찰 2', selectedStudent.l3?.reflection2],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">{label}</div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          {val || '미작성'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-600" />
                      4차시 · 힌트 안내형 수사 (귀류법 문제 1·2)
                    </div>
                    {[
                      [
                        '문제 1 (√2는 유리수가 아니다)',
                        `단계 확인: ${selectedStudent.l4?.prob1Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l4?.prob1ProofText || '미작성'}`,
                      ],
                      [
                        '문제 2 (1+√2는 유리수가 아니다)',
                        `단계 확인: ${selectedStudent.l4?.prob2Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l4?.prob2ProofText || '미작성'}`,
                      ],
                      ['4차시 성찰 1', selectedStudent.l4?.reflection1],
                      ['4차시 성찰 2', selectedStudent.l4?.reflection2],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">
                          <MathText text={label || ''} />
                        </div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          <MathText text={val || '미작성'} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="text-xs font-bold text-cyan-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-600" />
                        5차시 · 절대부등식1 (완전제곱식)
                      </span>
                      <span className="mono text-[11px] font-semibold text-cyan-800 bg-cyan-100/70 px-2 py-0.5 rounded">
                        사례 {selectedStudent.l5?.examples?.length ?? 0}개
                      </span>
                    </div>
                    {[
                      [
                        '수치 계산 사례 탐색',
                        selectedStudent.l5?.examples?.length
                          ? `등록된 사례 ${selectedStudent.l5.examples.length}개: ${selectedStudent.l5.examples
                              .slice(0, 3)
                              .map((ex) => `(a=${ex.a}, b=${ex.b} → a²+b²=${ex.lhs}, ab=${ex.rhs})`)
                              .join('; ')}`
                          : '사례 미등록',
                      ],
                      [
                        '실수 제곱 기본 성질 개념 선택',
                        selectedStudent.l5?.squareConceptChoice === 'nonnegative'
                          ? 'X² ≥ 0 (항상 0 이상) [정답]'
                          : selectedStudent.l5?.squareConceptChoice
                          ? selectedStudent.l5.squareConceptChoice
                          : '미선택',
                      ],
                      [
                        '문제 1 (a²+b² ≥ ab) 증명',
                        `단계 확인: ${selectedStudent.l5?.prob1Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l5?.prob1ProofText || '미작성'}`,
                      ],
                      [
                        `등호(=) 성립 조건 (${selectedStudent.l5?.equalityConditionChecked ? '확인 완료' : '미확인'})`,
                        selectedStudent.l5?.equalityReason || '이유 미작성',
                      ],
                      [
                        '문제 2 ((a+b)² ≥ 4ab 외) 증명',
                        `단계 확인: ${selectedStudent.l5?.prob2Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l5?.prob2ProofText || '미작성'}`,
                      ],
                      ['5차시 성찰 1 (완전제곱식 증명)', selectedStudent.l5?.reflection1 || '미작성'],
                      ['5차시 성찰 2 (등호 성립 조건 비교)', selectedStudent.l5?.reflection2 || '미작성'],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">
                          <MathText text={label || ''} />
                        </div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          <MathText text={val || '미작성'} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="text-xs font-bold text-teal-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-teal-600" />
                        6차시 · 절대부등식2 (산술·기하평균)
                      </span>
                      <span className="mono text-[11px] font-semibold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                        사례 {selectedStudent.l6?.examples?.length ?? 0}개
                      </span>
                    </div>
                    {[
                      [
                        '수치·기하 시뮬레이션 탐색 사례',
                        selectedStudent.l6?.examples?.length
                          ? `등록된 사례 ${selectedStudent.l6.examples.length}개: ${selectedStudent.l6.examples
                              .slice(0, 3)
                              .map((ex) => `(a=${ex.a}, b=${ex.b} → 산술=${ex.arith}, 기하=${ex.geom})`)
                              .join('; ')}`
                          : '사례 미등록',
                      ],
                      [
                        '산술·기하평균 전제 조건 선택',
                        selectedStudent.l6?.amgmConceptChoice === 'positive'
                          ? '양수 조건 a>0, b>0 [정답]'
                          : selectedStudent.l6?.amgmConceptChoice
                          ? selectedStudent.l6.amgmConceptChoice
                          : '미선택',
                      ],
                      [
                        '문제 1 ((a+b)/2 ≥ √(ab)) 증명',
                        `단계 확인: ${selectedStudent.l6?.prob1Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l6?.prob1ProofText || '미작성'}`,
                      ],
                      [
                        `조화평균 관계 (${selectedStudent.l6?.harmonicChecked ? '확인 완료' : '미확인'})`,
                        selectedStudent.l6?.harmonicReason || '이유 미작성',
                      ],
                      [
                        '문제 2 (a+1/a ≥ 2 외) 증명',
                        `단계 확인: ${selectedStudent.l6?.prob2Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l6?.prob2ProofText || '미작성'}`,
                      ],
                      ['6차시 성찰 1 (양수 조건과 제곱근 변형)', selectedStudent.l6?.reflection1 || '미작성'],
                      ['6차시 성찰 2 (산술·기하·조화평균 대소관계)', selectedStudent.l6?.reflection2 || '미작성'],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-slate-700">
                          <MathText text={label || ''} />
                        </div>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          <MathText text={val || '미작성'} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 lg:col-span-2">
                    <div className="text-xs font-bold text-rose-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-600" />
                        7차시 · 절대부등식3 (절댓값 부등식)
                      </span>
                      <span className="mono text-[11px] font-semibold text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded">
                        사례 {selectedStudent.l7?.examples?.length ?? 0}개
                      </span>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {[
                        [
                          '절댓값 수치 계산 사례',
                          selectedStudent.l7?.examples?.length
                            ? `등록된 사례 ${selectedStudent.l7.examples.length}개: ${selectedStudent.l7.examples
                                .slice(0, 3)
                                .map((ex) => `(a=${ex.a}, b=${ex.b} → |a+b|=${ex.lhsSum}, |a|+|b|=${ex.rhsSum})`)
                                .join('; ')}`
                            : '사례 미등록',
                        ],
                        [
                          '절댓값 증명 기본 전략 선택',
                          selectedStudent.l7?.absSquareConceptChoice === 'square_diff'
                            ? '양변의 제곱의 차 (|A|²-|B|²) [정답]'
                            : selectedStudent.l7?.absSquareConceptChoice
                            ? selectedStudent.l7.absSquareConceptChoice
                            : '미선택',
                        ],
                        [
                          '문제 1 (|a+b| ≤ |a|+|b|) 증명',
                          `단계 확인: ${selectedStudent.l7?.prob1Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l7?.prob1ProofText || '미작성'}`,
                        ],
                        [
                          `절댓값의 차 (|a|-|b|) 부호 판별 (${selectedStudent.l7?.absDiffChecked ? '확인 완료' : '미확인'})`,
                          selectedStudent.l7?.absDiffReason || '이유 미작성',
                        ],
                        [
                          '문제 2 (|a−b| ≤ |a|+|b| 외) 증명',
                          `단계 확인: ${selectedStudent.l7?.prob2Verified?.filter(Boolean).length ?? 0}/4\n${selectedStudent.l7?.prob2ProofText || '미작성'}`,
                        ],
                        ['7차시 성찰 1 (절댓값 제곱의 차 원리)', selectedStudent.l7?.reflection1 || '미작성'],
                        ['7차시 성찰 2 (부호 조건에 따른 등호 성립 차이)', selectedStudent.l7?.reflection2 || '미작성'],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <div className="text-xs font-bold text-slate-700">
                            <MathText text={label || ''} />
                          </div>
                          <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                            <MathText text={val || '미작성'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Teacher Memo and Rubric Section */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6 space-y-5">
                  <div>
                    <label htmlFor="modelessTeacherMemo" className="block text-sm font-bold text-slate-900 mb-1">
                      학습 변화 관찰 메모
                    </label>
                    <textarea
                      id="modelessTeacherMemo"
                      rows={3}
                      value={selectedStudent.teacherMemo || ''}
                      onChange={(e) =>
                        updateSelectedStudent((item) => ({ ...item, teacherMemo: e.target.value }))
                      }
                      placeholder="예: 1차시는 사례 나열에 머물렀지만 2차시는 조건에 맞는 반례를 직접 구성함."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
                    {(() => {
                      const modelessEvalProg = getTeacherEvaluationProgress(selectedStudent);
                      return (
                        <div className="space-y-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <div className="text-xs font-bold text-blue-600">교수자 평가</div>
                              <h4 className="text-base font-bold text-slate-900">학생 역량 평가 및 맞춤 피드백</h4>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold border ${
                                modelessEvalProg.status === 'complete'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : modelessEvalProg.status === 'partial'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {modelessEvalProg.statusLabel} · 진행율 {modelessEvalProg.percent}% ({modelessEvalProg.completedCount}/{modelessEvalProg.totalCount})
                            </span>
                          </div>
                          {modelessEvalProg.isReopenedByLessonExpansion && (
                            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                              새로운 차시(평가 항목)가 추가되어 기존 <strong>평가 완료</strong> 처리가 취소되고 <strong>평가 진행 중</strong> 상태로 변경되었습니다. 미평정 차시 항목({modelessEvalProg.ungradedRubricCount}개)을 추가로 평정해 주세요.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {EVAL_CRITERIA.map((title, i) => {
                        const ev = ensureTeacherEval(selectedStudent);
                        return (
                          <div key={title}>
                            <label htmlFor={`modelessEval${i}`} className="block text-xs sm:text-sm font-bold text-slate-900">
                              {title}
                              <span className="block text-xs font-normal text-slate-500">
                                {EVAL_DESCRIPTIONS[i]}
                              </span>
                            </label>
                            <select
                              id={`modelessEval${i}`}
                              value={ev.scores[i] === null ? '' : String(ev.scores[i])}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                updateSelectedStudent((item) => {
                                  const currentEv = ensureTeacherEval(item);
                                  const nextScores = [...currentEv.scores];
                                  nextScores[i] = val;
                                  return {
                                    ...item,
                                    evaluation: {
                                      ...currentEv,
                                      scores: nextScores,
                                      evaluatedLessonCount: EVAL_CRITERIA.length,
                                    },
                                  };
                                });
                              }}
                              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            >
                              <option value="">평정 전</option>
                              {[0, 1, 2, 3].map((v) => (
                                <option key={v} value={v}>
                                  {v}점 · {['증거 부족', '시작 단계', '부분적 수행', '충분한 수행'][v]}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>

                    <div>
                      <label htmlFor="modelessTeacherFeedback" className="block text-sm font-bold text-slate-900 mb-1.5">
                        학생에게 전달할 구체적인 피드백
                      </label>
                      <textarea
                        id="modelessTeacherFeedback"
                        rows={3}
                        value={ensureTeacherEval(selectedStudent).feedback}
                        onChange={(e) =>
                          updateSelectedStudent((item) => {
                            const ev = ensureTeacherEval(item);
                            return { ...item, evaluation: { ...ev, feedback: e.target.value } };
                          })
                        }
                        placeholder="잘한 점과 이를 뒷받침하는 학생의 탐구 기록을 적어 주세요."
                        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="modelessTeacherNext" className="block text-sm font-bold text-slate-900 mb-1.5">
                        다음 탐구를 위한 제안
                      </label>
                      <textarea
                        id="modelessTeacherNext"
                        rows={2}
                        value={ensureTeacherEval(selectedStudent).nextStep}
                        onChange={(e) =>
                          updateSelectedStudent((item) => {
                            const ev = ensureTeacherEval(item);
                            return { ...item, evaluation: { ...ev, nextStep: e.target.value } };
                          })
                        }
                        placeholder="예: 반례가 가정을 만족하는지 먼저 확인하고, 문자로 일반화해 보세요."
                        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onPrintStudentReport(selectedStudent)}
                        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                      >
                        <Printer className="h-4 w-4" />
                        이 학생 피드백 PDF 인쇄
                      </button>
                      <span className="text-xs text-slate-500">
                        입력한 평가와 피드백은 학생 답안에 실시간 동기화됩니다.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SECTION 5: Checklist Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsChecklistOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              aria-expanded={isChecklistOpen}
              aria-label="교사용 수사 체크리스트 접기/펼치기"
            >
              {isChecklistOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 text-slate-600" />
                  <span>접기</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                  <span>펼치기</span>
                </>
              )}
            </button>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">교사용 수사 체크리스트</h3>
          </div>
        </div>

        {isChecklistOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              ① 사례를 여러 개 확인한 것과 일반적 증명을 구별하는가? ② 새로운 명제에서 반례가 가정에 맞는지 확인하는가? ③ 참이라고 판단했을 때 문자·정수의 성질 등을 이용해 모든 경우를 설명하는가? ④ 처음 추측을 수정한 이유를 설명하는가?
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
