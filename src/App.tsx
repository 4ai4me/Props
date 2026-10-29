import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  updateDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  CLASSROOM_BRAND_NAME,
  STORAGE_KEY_STUDENT,
  STORAGE_KEY_TEACHER,
  STORAGE_KEY_LESSON_ACCESS,
  DEFAULT_LESSON_ACCESS,
  LESSON_TAB_METADATA,
  LessonAccessConfig,
  LessonTabNumber,
  STAGE_TITLES,
  StudentRecord,
  TOPICS,
  TopicId,
  EVAL_CRITERIA,
  buildLessonAccessFirestoreFields,
  cleanStudentState,
  createInitialStudentState,
  ensureTeacherEval,
  evaluateLevel1Completion,
  evaluateLevel2Completion,
  evaluateLevel3Completion,
  evaluateLevel4Completion,
  evaluateLevel5Completion,
  evaluateLevel6Completion,
  evaluateLevel7Completion,
  evaluateStudentLessonRenderGate,
  getFirstEnabledLesson,
  getTeacherEvaluationProgress,
  hasAnyLockedLesson,
  hasTeacherEvaluation,
  isLessonEnabled,
  mergeStudentStates,
  normalizeLessonAccess,
} from './utils/mathLogic';
import {
  ADMIN_TEACHER_EMAIL,
  formatDeviceHashAsMac,
  isAuthorizedAdminEmail,
} from './utils/authLogic';
import { Lesson1View } from './components/Lesson1View';
import { Lesson2View } from './components/Lesson2View';
import { Lesson3View } from './components/Lesson3View';
import { Lesson4View } from './components/Lesson4View';
import { Lesson5View } from './components/Lesson5View';
import { Lesson6View } from './components/Lesson6View';
import { Lesson7View } from './components/Lesson7View';
import { TeacherView } from './components/TeacherView';
import { AuthGateView, FirestoreStudentRegistrationDoc } from './components/AuthGateView';
import { StudentEvaluationModal } from './components/StudentEvaluationModal';
import { MathSymbolInputBar } from './components/MathSymbolInputBar';
import { MathText } from './components/MathText';
import { recordStudentAccessLog } from './utils/auditLogger';
import { ensureStudentAuth } from './utils/studentAuth';
import {
  LessonJsonMap,
  assembleRecord,
  findChangedLessons,
  listenTeacherEvaluation,
  loadStudentLessons,
  saveLessons,
  splitLessons,
} from './utils/lessonStore';
import {
  Printer,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  LogOut,
  ShieldCheck,
  UserCheck,
  Award,
  RotateCw,
  Zap,
  Lock,
} from 'lucide-react';

/**
 * 예전 방식(가입 문서의 worksheetJson 한 덩어리)으로 저장된 Props 활동지를 읽습니다.
 * 형식이 맞지 않으면 학생 정보만 채운 빈 활동지를 돌려줍니다 (기존 문서는 수정하지 않음).
 */
function parseLegacyPropsWorksheet(
  worksheetJson: string | undefined,
  groupLabel: string,
  codeLabel: string
): StudentRecord {
  try {
    const parsed = cleanStudentState(JSON.parse(worksheetJson || ''));
    parsed.group = groupLabel;
    parsed.code = codeLabel;
    return parsed;
  } catch (err) {
    console.warn('Legacy Props worksheet unreadable; starting from an empty worksheet:', err);
    const fresh = createInitialStudentState();
    fresh.group = groupLabel;
    fresh.code = codeLabel;
    return fresh;
  }
}

// 학생 활동지 자동 저장 대기 시간: 입력이 멈춘 뒤 이 시간이 지나면 한 번 저장
// (기존 0.9초 → 10초. 탭 전환·닫기 시에는 즉시 저장되므로 내용이 사라지지 않음)
const AUTOSAVE_DELAY_MS = 10000;

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [sessionMode, setSessionMode] = useState<'gate' | 'student' | 'teacher'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      if (m === 'student' || m === 'teacher') return m;
    } catch {
      // ignore
    }
    return 'gate';
  });
  const [approvedProfile, setApprovedProfile] =
    useState<FirestoreStudentRegistrationDoc | null>(() => {
      try {
        const raw = localStorage.getItem('math_detective_approved_profile_v1');
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
      return null;
    });

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [student, setStudent] = useState<StudentRecord>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STUDENT);
      if (raw) return cleanStudentState(JSON.parse(raw));
    } catch {
      // ignore
    }
    return createInitialStudentState();
  });

  const [teacherRecords, setTeacherRecords] = useState<StudentRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TEACHER);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => {
              try {
                return cleanStudentState(item);
              } catch {
                return null;
              }
            })
            .filter((x): x is StudentRecord => x !== null);
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [lessonAccess, setLessonAccess] = useState<LessonAccessConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LESSON_ACCESS);
      if (raw) return normalizeLessonAccess(JSON.parse(raw));
    } catch {
      // ignore
    }
    return { ...DEFAULT_LESSON_ACCESS };
  });
  const [isLessonAccessServerChecked, setIsLessonAccessServerChecked] = useState<boolean>(false);
  const [lessonAccessSyncStatus, setLessonAccessSyncStatus] = useState<
    'checking' | 'saving' | 'synced' | 'local_only' | 'error'
  >('checking');
  const [lessonAccessLastSyncedAt, setLessonAccessLastSyncedAt] = useState<Date | null>(null);
  const lessonAccessRef = useRef<LessonAccessConfig>(lessonAccess);
  useEffect(() => {
    lessonAccessRef.current = lessonAccess;
  }, [lessonAccess]);

  const [activeLessonTab, setActiveLessonTab] = useState<LessonTabNumber>(() => {
    let initialLesson: LessonTabNumber = 1;
    try {
      const params = new URLSearchParams(window.location.search);
      const l = Number(params.get('lesson'));
      if (l === 1 || l === 2 || l === 3 || l === 4 || l === 5 || l === 6 || l === 7) {
        initialLesson = l;
      }
      const rawAccess = localStorage.getItem(STORAGE_KEY_LESSON_ACCESS);
      if (rawAccess) {
        const parsedAccess = normalizeLessonAccess(JSON.parse(rawAccess));
        if (!isLessonEnabled(parsedAccess, initialLesson)) {
          const fallback = getFirstEnabledLesson(parsedAccess);
          if (fallback !== null) initialLesson = fallback;
        }
      }
    } catch {
      // ignore
    }
    return initialLesson;
  });
  const [steps, setSteps] = useState<{
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
    7: number;
  }>(() => {
    let initialStep = 0;
    try {
      const params = new URLSearchParams(window.location.search);
      const s = Number(params.get('step'));
      if (Number.isInteger(s) && s >= 0 && s <= 4) initialStep = s;
    } catch {
      // ignore
    }
    return {
      1: initialStep,
      2: initialStep,
      3: initialStep,
      4: initialStep,
      5: initialStep,
      6: initialStep,
      7: initialStep,
    };
  });
  const [selectedTeacherKey, setSelectedTeacherKey] = useState<string>('');
  const [printingStudent, setPrintingStudent] = useState<StudentRecord | null>(null);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState<boolean>(false);

  const [toast, setToast] = useState<{ text: string; type: 'good' | 'warn' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = useCallback((text: string, type: 'good' | 'warn' = 'good') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 자동 저장 대기 중인 작업 (탭 닫힘·전환 시 즉시 실행)
  const pendingSaveRef = useRef<(() => Promise<void>) | null>(null);
  // 서버에 저장되어 있는 차시별 내용(JSON). null이면 아직 서버에서 불러오지 못한 상태이므로
  // 자동 저장을 하지 않습니다 (불러오기 전의 오래된 내용으로 서버의 최신 내용을 덮어쓰지 않기 위해).
  const serverLessonJsonRef = useRef<LessonJsonMap | null>(null);
  const [lessonLoadNonce, setLessonLoadNonce] = useState(0);

  // Track Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      // 로그인된 사용자가 없으면 학생용 익명 계정으로 자동 로그인
      if (!u) {
        ensureStudentAuth().catch((err) => console.error('Anonymous sign-in failed:', err));
      }
      if (u && isAuthorizedAdminEmail(u.email, u.emailVerified)) {
        setSessionMode('teacher');
      }
    });
    return () => unsub();
  }, []);

  // Sync student state to localStorage and debounced Firestore update when approved
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(student));
    } catch {
      // ignore
    }

    if (sessionMode === 'student' && approvedProfile?.studentKey) {
      const studentKey = approvedProfile.studentKey;
      const serverJson = serverLessonJsonRef.current;
      // 서버 내용을 아직 불러오지 못했으면 저장하지 않음 (기기에는 위에서 저장됨)
      if (!serverJson) return;

      // 서버와 내용이 달라진 차시만 저장 (바뀐 것이 없으면 쓰지 않음)
      const changed = findChangedLessons(student, serverJson);
      if (changed.length === 0) {
        pendingSaveRef.current = null;
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        return;
      }

      setCloudSyncStatus('saving');
      const recordToSave = student;
      pendingSaveRef.current = async () => {
        pendingSaveRef.current = null;
        try {
          const saved = await saveLessons(studentKey, recordToSave, changed);
          if (serverLessonJsonRef.current) {
            serverLessonJsonRef.current = { ...serverLessonJsonRef.current, ...saved };
          }
          setCloudSyncStatus('saved');
          setLastSavedAt(new Date());
        } catch (err) {
          console.error(`Firestore autosave failed (${changed.join(', ')}):`, err);
          setCloudSyncStatus('error');
        }
      };
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        pendingSaveRef.current?.();
      }, AUTOSAVE_DELAY_MS);
    }
  }, [student, sessionMode, approvedProfile]);

  // 탭을 닫거나 다른 창으로 전환할 때는 기다리지 않고 바로 저장
  useEffect(() => {
    const flushNow = () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      pendingSaveRef.current?.();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushNow();
    };
    window.addEventListener('pagehide', flushNow);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pagehide', flushNow);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // 학생 로그인 후: 서버의 차시 문서를 불러와 예전 worksheetJson 내용과 합칩니다.
  // 불러오기가 끝나야 자동 저장이 시작됩니다.
  useEffect(() => {
    if (sessionMode !== 'student' || !approvedProfile?.studentKey || !firebaseUser) return;
    const profile = approvedProfile;
    let cancelled = false;
    serverLessonJsonRef.current = null;

    const groupLabel = `${profile.school} ${profile.grade}학년 ${profile.classNum}반`.slice(0, 25);
    const codeLabel = `${profile.grade}${String(profile.classNum).padStart(2, '0')}${String(
      profile.studentNum
    ).padStart(2, '0')}_${profile.name}`.slice(0, 25);

    loadStudentLessons(profile.studentKey)
      .then((snap) => {
        if (cancelled) return;
        const legacy = parseLegacyPropsWorksheet(profile.worksheetJson, groupLabel, codeLabel);
        const assembled = assembleRecord(legacy, snap);
        // 서버가 실제로 가진 내용 = 차시 문서(있으면) 또는 예전 worksheetJson
        serverLessonJsonRef.current = splitLessons(assembled);
        setStudent((prev) => {
          const merged = mergeStudentStates(assembled, prev);
          merged.group = groupLabel;
          merged.code = codeLabel;
          return merged;
        });
        setCloudSyncStatus('saved');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load lesson documents:', err);
        setCloudSyncStatus('error');
        showToast(
          (err as { code?: string })?.code === 'permission-denied'
            ? '서버의 활동지를 불러올 권한이 없습니다. 다시 로그인하거나 선생님께 알려주세요. (입력 내용은 이 기기에 보관됩니다)'
            : '서버의 활동지를 불러오지 못했습니다. 네트워크를 확인한 뒤 [지금 저장]을 눌러 다시 시도해 주세요. (입력 내용은 이 기기에 보관됩니다)',
          'warn'
        );
      });
    return () => {
      cancelled = true;
    };
  }, [sessionMode, approvedProfile, firebaseUser, lessonLoadNonce, showToast]);

  // 교사 평가·메모 실시간 수신 (교사 전용 문서, 학생은 읽기만)
  useEffect(() => {
    if (sessionMode !== 'student' || !approvedProfile?.studentKey || !firebaseUser) return;
    const unsub = listenTeacherEvaluation(
      approvedProfile.studentKey,
      (teacher) => {
        if (!teacher) return; // 아직 새 평가 문서가 없으면 예전 평가를 그대로 사용
        let remote: { evaluation?: StudentRecord['evaluation']; teacherMemo?: string };
        try {
          remote = JSON.parse(teacher.data);
        } catch (err) {
          console.warn('Teacher evaluation document is malformed:', err);
          return;
        }
        setStudent((prev) => {
          const nextEval = remote.evaluation ?? prev.evaluation;
          const nextMemo = typeof remote.teacherMemo === 'string' ? remote.teacherMemo : prev.teacherMemo;
          if (
            JSON.stringify(nextEval) === JSON.stringify(prev.evaluation) &&
            nextMemo === prev.teacherMemo
          ) {
            return prev;
          }
          return { ...prev, evaluation: nextEval, teacherMemo: nextMemo };
        });
      },
      (err) => {
        console.error('Teacher evaluation listener error:', err);
      }
    );
    return () => unsub();
  }, [sessionMode, approvedProfile?.studentKey, firebaseUser]);

  // 가입 문서 감시: 다른 기기에서 같은 학생으로 다시 로그인해 이 기기의 연결이 끊긴 경우 처음 화면으로
  useEffect(() => {
    if (sessionMode !== 'student' || !approvedProfile?.studentKey || !firebaseUser) return;
    const unsub = onSnapshot(doc(db, 'student_registrations', approvedProfile.studentKey), () => {
      // 내용은 사용하지 않음 (활동지는 차시 문서에서 불러옴)
    }, (error) => {
      console.error('Student registration listener error:', error);
      if ((error as { code?: string })?.code === 'permission-denied') {
        try {
          localStorage.removeItem('math_detective_active_student_key_v1');
          localStorage.removeItem('math_detective_approved_profile_v1');
        } catch (storageErr) {
          console.warn('Failed to clear saved student session:', storageErr);
        }
        setApprovedProfile(null);
        setSessionMode('gate');
        showToast('다른 기기에서 같은 학생으로 로그인되어 이 기기의 연결이 해제되었습니다. 다시 로그인해 주세요.', 'warn');
      }
    });
    return () => unsub();
  }, [sessionMode, approvedProfile?.studentKey, firebaseUser, showToast]);

  // Sync teacher state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEACHER, JSON.stringify(teacherRecords));
    } catch {
      // ignore
    }
  }, [teacherRecords]);

  // Clean up printing class after print
  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-report');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ title, message, onConfirm });
  };

  const applyServerLessonAccessSnapshot = useCallback((rawServerData: unknown) => {
    const normalized = normalizeLessonAccess(rawServerData);
    lessonAccessRef.current = normalized;
    setLessonAccess(normalized);
    setIsLessonAccessServerChecked(true);
    setLessonAccessSyncStatus('synced');
    setLessonAccessLastSyncedAt(
      normalized.updatedAt ? new Date(normalized.updatedAt) : new Date()
    );
    try {
      localStorage.setItem(STORAGE_KEY_LESSON_ACCESS, JSON.stringify(normalized));
    } catch {
      // ignore
    }
  }, []);

  const persistLessonAccessToCloud = useCallback(
    async (configToSave: LessonAccessConfig, reasonLabel?: string): Promise<boolean> => {
      const normalized = normalizeLessonAccess(configToSave);
      lessonAccessRef.current = normalized;
      setLessonAccess(normalized);
      try {
        localStorage.setItem(STORAGE_KEY_LESSON_ACCESS, JSON.stringify(normalized));
      } catch {
        // ignore
      }

      setLessonAccessSyncStatus('saving');
      try {
        const fields = buildLessonAccessFirestoreFields(
          normalized,
          firebaseUser?.email || ADMIN_TEACHER_EMAIL
        );
        const targetRef = doc(db, 'app_settings', 'lesson_access');
        await setDoc(targetRef, {
          ...fields,
          updatedAt: serverTimestamp(),
        });
        // Verify directly from the Firestore server to guarantee cross-browser persistence
        try {
          const verifiedSnap = await getDocFromServer(targetRef);
          if (verifiedSnap.exists()) {
            applyServerLessonAccessSnapshot(verifiedSnap.data());
          } else {
            setIsLessonAccessServerChecked(true);
            setLessonAccessSyncStatus('synced');
            setLessonAccessLastSyncedAt(new Date());
          }
        } catch {
          setIsLessonAccessServerChecked(true);
          setLessonAccessSyncStatus('synced');
          setLessonAccessLastSyncedAt(new Date());
        }
        if (reasonLabel) {
          showToast(
            `클라우드 서버 저장 완료: ${reasonLabel} (모든 PC·브라우저 학생에게 즉시 적용됨)`,
            'good'
          );
        }
        return true;
      } catch (err) {
        console.error('Failed to sync lesson_access to Firestore:', err);
        setLessonAccessSyncStatus('error');
        if (reasonLabel) {
          showToast(
            `차시 잠금 서버 저장 확인 필요: 네트워크 상태를 확인하고 [차시 잠금 설정 서버 저장] 버튼을 다시 눌러주세요.`,
            'warn'
          );
        }
        return false;
      }
    },
    [firebaseUser, applyServerLessonAccessSnapshot, showToast]
  );

  const refreshLessonAccessFromServer = useCallback(async () => {
    const targetRef = doc(db, 'app_settings', 'lesson_access');
    try {
      let snap;
      try {
        snap = await getDocFromServer(targetRef);
      } catch {
        snap = await getDoc(targetRef);
      }
      if (snap.exists()) {
        applyServerLessonAccessSnapshot(snap.data());
        return;
      }
      // If no server document exists yet, automatically seed the server with current config
      // (especially if the teacher previously locked lessons in localStorage!)
      if (sessionMode === 'teacher' || hasAnyLockedLesson(lessonAccessRef.current)) {
        await persistLessonAccessToCloud(lessonAccessRef.current);
      } else {
        setIsLessonAccessServerChecked(true);
        setLessonAccessSyncStatus('local_only');
      }
    } catch {
      setIsLessonAccessServerChecked(true);
    }
  }, [sessionMode, applyServerLessonAccessSnapshot, persistLessonAccessToCloud]);

  // Real-time listener, initial server verification, focus/visibility sync & cross-tab storage listener
  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLessonAccessServerChecked(true);
      }
    }, 2500);

    refreshLessonAccessFromServer();

    const unsubFirestore = onSnapshot(
      doc(db, 'app_settings', 'lesson_access'),
      (docSnap) => {
        if (!docSnap.exists()) {
          setIsLessonAccessServerChecked(true);
          return;
        }
        applyServerLessonAccessSnapshot(docSnap.data());
      },
      () => {
        setIsLessonAccessServerChecked(true);
      }
    );

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_LESSON_ACCESS && e.newValue) {
        try {
          const parsed = normalizeLessonAccess(JSON.parse(e.newValue));
          lessonAccessRef.current = parsed;
          setLessonAccess(parsed);
        } catch {
          // ignore
        }
      }
    };

    const handleWindowFocusOrVisible = () => {
      if (document.visibilityState === 'hidden') return;
      refreshLessonAccessFromServer();
    };

    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const l = Number(params.get('lesson'));
        if (l === 1 || l === 2 || l === 3 || l === 4 || l === 5 || l === 6 || l === 7) {
          if (isLessonEnabled(lessonAccessRef.current, l)) {
            setActiveLessonTab(l);
          } else {
            const firstOpen = getFirstEnabledLesson(lessonAccessRef.current);
            if (firstOpen !== null) setActiveLessonTab(firstOpen);
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocusOrVisible);
    document.addEventListener('visibilitychange', handleWindowFocusOrVisible);
    window.addEventListener('popstate', handlePopState);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubFirestore();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocusOrVisible);
      document.removeEventListener('visibilitychange', handleWindowFocusOrVisible);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [applyServerLessonAccessSnapshot, refreshLessonAccessFromServer]);

  // Redirect student away from a locked lesson and sanitize URL ?lesson= query param
  useEffect(() => {
    if (sessionMode !== 'student') return;
    if (!isLessonAccessServerChecked) return;
    if (!isLessonEnabled(lessonAccess, activeLessonTab)) {
      const firstOpen = getFirstEnabledLesson(lessonAccess);
      if (firstOpen !== null && firstOpen !== activeLessonTab) {
        setActiveLessonTab(firstOpen);
      }
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('lesson')) {
          if (firstOpen !== null) {
            url.searchParams.set('lesson', String(firstOpen));
          } else {
            url.searchParams.delete('lesson');
          }
          window.history.replaceState({}, '', url.toString());
        }
      } catch {
        // ignore
      }
    }
  }, [sessionMode, isLessonAccessServerChecked, lessonAccess, activeLessonTab]);

  const handleUpdateLessonAccess = useCallback(
    async (nextConfig: LessonAccessConfig, reasonLabel?: string): Promise<boolean> => {
      return persistLessonAccessToCloud(nextConfig, reasonLabel);
    },
    [persistLessonAccessToCloud]
  );

  const handleForceSyncLessonAccessToServer = useCallback(async (): Promise<boolean> => {
    return persistLessonAccessToCloud(
      lessonAccessRef.current,
      '현재 차시 잠금 설정 전체 PC·브라우저 강제 동기화'
    );
  }, [persistLessonAccessToCloud]);

  const handleSelectStudentLesson = useCallback(
    (targetTab: LessonTabNumber, resetStepToZero = false) => {
      if (sessionMode === 'student' && !isLessonEnabled(lessonAccess, targetTab)) {
        const meta = LESSON_TAB_METADATA.find((m) => m.num === targetTab);
        showToast(
          `현재 선생님이 ${meta ? meta.fullTitle : `${targetTab}차시`}를 비활성(잠금) 상태로 설정하여 선행 학습할 수 없습니다.`,
          'warn'
        );
        return;
      }
      if (resetStepToZero) {
        setSteps((prev) => ({ ...prev, [targetTab]: 0 }));
      }
      setActiveLessonTab(targetTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [sessionMode, lessonAccess, showToast]
  );

  const handleManualForceSave = async () => {
    if (!approvedProfile?.studentKey) {
      showToast('승인된 학생 계정 정보가 없어 클라우드에 저장할 수 없습니다.', 'warn');
      return;
    }
    const serverJson = serverLessonJsonRef.current;
    if (!serverJson) {
      // 서버 내용을 아직 불러오지 못한 상태: 덮어쓰지 않고 다시 불러오기를 시도
      setLessonLoadNonce((n) => n + 1);
      showToast('서버의 활동지를 다시 불러오는 중입니다. 잠시 후 [지금 저장]을 다시 눌러 주세요.', 'warn');
      return;
    }
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    pendingSaveRef.current = null;
    const changed = findChangedLessons(student, serverJson);
    if (changed.length === 0) {
      setCloudSyncStatus('saved');
      showToast('모든 내용이 이미 클라우드에 저장되어 있습니다.', 'good');
      return;
    }
    setCloudSyncStatus('saving');
    try {
      const saved = await saveLessons(approvedProfile.studentKey, student, changed);
      serverLessonJsonRef.current = { ...serverJson, ...saved };
      setCloudSyncStatus('saved');
      setLastSavedAt(new Date());
      showToast('클라우드에 최신 활동지가 즉시 저장되었습니다.', 'good');

      // Record access log for save event
      recordStudentAccessLog({
        studentKey: approvedProfile.studentKey,
        school: approvedProfile.school,
        grade: approvedProfile.grade,
        classNum: approvedProfile.classNum,
        studentNum: approvedProfile.studentNum,
        name: approvedProfile.name,
        eventType: 'save',
        status: 'approved',
        deviceHash: approvedProfile.deviceHash,
        ipAddress: approvedProfile.ipAddress,
        userAgent: approvedProfile.userAgent,
      }).catch((logErr) => console.warn('Save audit log skipped:', logErr));
    } catch (err) {
      console.error('Manual force save failed:', err);
      setCloudSyncStatus('error');
      showToast('클라우드 저장 중 오류가 발생했습니다. 네트워크 연결을 확인하세요.', 'warn');
    }
  };

  const handleStudentApprovedLogin = useCallback(
    (regDoc: FirestoreStudentRegistrationDoc, worksheet: StudentRecord) => {
      const groupLabel = `${regDoc.school} ${regDoc.grade}학년 ${regDoc.classNum}반`.slice(0, 25);
      const codeLabel = `${regDoc.grade}${String(regDoc.classNum).padStart(2, '0')}${String(
        regDoc.studentNum
      ).padStart(2, '0')}_${regDoc.name}`.slice(0, 25);

      // 차시 문서 불러오기는 로그인 후 effect에서 수행 (끝나기 전까지 자동 저장하지 않음)
      serverLessonJsonRef.current = null;
      setApprovedProfile(regDoc);
      try {
        localStorage.setItem('math_detective_approved_profile_v1', JSON.stringify(regDoc));
        localStorage.setItem('math_detective_active_student_key_v1', regDoc.studentKey);
      } catch {}

      setStudent((prev) => {
        const merged = mergeStudentStates(worksheet, prev);
        merged.group = groupLabel;
        merged.code = codeLabel;
        return merged;
      });
      // 아직 서버와 동기화가 끝나지 않았으므로 '저장됨'으로 표시하지 않음
      setCloudSyncStatus('idle');
      setSessionMode('student');

      // Record access log for approved session entry
      recordStudentAccessLog({
        studentKey: regDoc.studentKey,
        school: regDoc.school,
        grade: regDoc.grade,
        classNum: regDoc.classNum,
        studentNum: regDoc.studentNum,
        name: regDoc.name,
        eventType: 'resume',
        status: 'approved',
        deviceHash: regDoc.deviceHash,
        ipAddress: regDoc.ipAddress,
        userAgent: regDoc.userAgent,
        updateRegistrationUpdatedAt: true,
      }).catch(() => {});
    },
    []
  );

  const handleAdminTeacherLogin = useCallback(() => {
    setSessionMode('teacher');
  }, []);

  const handleExitMode = async () => {
    // 교사·학생 모두 로그아웃. 학생은 다음 접속 때 새 익명 계정이 만들어지므로
    // 공용 기기에서 다음 사람이 이전 학생의 문서에 접근할 수 없습니다.
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    try {
      await pendingSaveRef.current?.();
    } catch {
      // ignore
    }
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem('math_detective_active_student_key_v1');
      localStorage.removeItem('math_detective_approved_profile_v1');
    } catch {}
    setApprovedProfile(null);
    setSessionMode('gate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeTopic2 = (nextTopic: TopicId) => {
    if (student.l2.topic !== nextTopic && student.l2.examples.length > 0) {
      requestConfirm(
        '탐구 주제 변경 확인',
        '탐구 주제를 바꾸면 2차시의 사례·반례·증명 기록이 초기화됩니다. 바꿀까요?',
        () => {
          setStudent((prev) => ({
            ...prev,
            updatedAt: new Date().toISOString(),
            l2: {
              ...createInitialStudentState().l2,
              topic: nextTopic,
              customStatement: prev.l2.customStatement,
              customScope: prev.l2.customScope,
            },
          }));
        }
      );
      return;
    }
    setStudent((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      l2: {
        ...prev.l2,
        topic: nextTopic,
      },
    }));
  };

  const handlePrintStudentReport = (targetStudent: StudentRecord) => {
    setPrintingStudent(targetStudent);
    document.body.classList.add('printing-report');
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const done1 = evaluateLevel1Completion(student.l1);
  const done2 = evaluateLevel2Completion(student.l2);
  const done3 = evaluateLevel3Completion(student.l3);
  const done4 = evaluateLevel4Completion(student.l4);
  const done5 = evaluateLevel5Completion(student.l5);
  const done6 = evaluateLevel6Completion(student.l6);
  const done7 = evaluateLevel7Completion(student.l7);
  const doneMap = {
    1: done1,
    2: done2,
    3: done3,
    4: done4,
    5: done5,
    6: done6,
    7: done7,
  } as const;
  const studentRenderGate = evaluateStudentLessonRenderGate(
    lessonAccess,
    activeLessonTab,
    isLessonAccessServerChecked
  );
  const displayLessonTab: LessonTabNumber =
    sessionMode === 'student' ? studentRenderGate.effectiveLesson : activeLessonTab;
  const activeDone = doneMap[displayLessonTab];
  const activeStep = steps[displayLessonTab];

  return (
    <>
      <div id="app-shell" className="min-h-screen flex flex-col">
        {/* Top Navigation Bar (Strict 3-Zone Contract — 최상단 브랜드 표기) */}
        <div className="no-print border-b border-white/10 bg-[#070b14] text-slate-300 px-4 sm:px-6 py-3">
          <div className="mx-auto max-w-[1160px] flex items-center justify-between gap-2 sm:gap-6">
            {/* Zone 1: Single-line Brand Wordmark */}
            <div className="text-sm sm:text-base font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
              <span className="text-sky-400">{CLASSROOM_BRAND_NAME}</span>
              <span aria-hidden="true" className="hidden sm:inline text-slate-600">·</span>
              <span className="hidden sm:inline">Math Detective Lab</span>
            </div>

            {/* Zone 2: Unboxed Curriculum Metadata */}
            <div className="hidden md:flex items-center gap-3 text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
              <span>공통수학2</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>명제의 증명과 절대부등식</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>관찰 · 추측 · 반례 · 증명</span>
            </div>

            {/* Zone 3: Session Status & Primary Action */}
            <div className="flex items-center gap-3 shrink-0">
              {sessionMode !== 'gate' ? (
                <>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 whitespace-nowrap">
                    {sessionMode === 'teacher' ? (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                        교사(관리자) 모드 · {firebaseUser?.email || ADMIN_TEACHER_EMAIL}
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                        학생 모드 · {approvedProfile?.school} {approvedProfile?.grade}-
                        {approvedProfile?.classNum}-{approvedProfile?.studentNum}{' '}
                        {approvedProfile?.name}
                      </>
                    )}
                  </span>
                  {sessionMode === 'student' && (
                    <button
                      type="button"
                      onClick={handleManualForceSave}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-xs font-bold transition-all shadow-xs active:scale-95"
                      title="현재 작성한 활동지를 교사 서버(클라우드)에 즉시 저장합니다"
                    >
                      {cloudSyncStatus === 'saving' ? (
                        <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                      )}
                      <span>{cloudSyncStatus === 'saving' ? '저장 중…' : '지금 저장'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExitMode}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15 whitespace-nowrap shrink-0"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    로그아웃 / 모드 전환
                  </button>
                </>
              ) : (
                <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                  학생 · 교사 승인제 플랫폼
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Architectural Hero Banner */}
        <header className="hero-bg text-white pt-8 pb-8 px-4 sm:px-6 border-b border-slate-800">
          <div className="mx-auto max-w-[1160px] relative z-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_300px] items-center">
              {/* Hero Copy */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 flex-wrap">
                  <span>01 — 07차시 통합 탐구 프로젝트</span>
                  <span aria-hidden="true" className="text-slate-600">/</span>
                  <span className="text-slate-300">직접 증명 · 반례 탐색 · 대우법 · 귀류법 · 절대부등식(1·2·3)</span>
                </div>

                <h1
                  className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.14] text-white"
                  style={{ textWrap: 'balance' }}
                >
                  우연일까, <span className="text-sky-300">필연일까?</span>
                </h1>
                <p className="mt-3 text-base sm:text-xl text-slate-200 font-semibold">
                  수학 탐정단의 참·거짓 추리 및 증명 프로젝트
                </p>
                <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
                  구체적인 숫자의 단서를 수집하고, 반례 수색과 대수적 증명(1·2차시)부터 대우법(3차시), 귀류법(4차시), 그리고 절대부등식의 증명(5·6·7차시)까지 단계별 힌트와 함께 완성해 보세요.
                </p>
              </div>

              {/* Hero Right Geometric Mathematical Diagram */}
              <div className="hidden lg:flex flex-col items-end justify-center">
                <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xs">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-white/10">
                    <span className="font-semibold text-slate-200">핵심 증명 기법</span>
                    <span className="mono text-sky-300">01 — 07차시</span>
                  </div>
                  <div className="py-3 space-y-2 mono text-xs">
                    <div className="flex items-center justify-between gap-3 text-slate-300 whitespace-nowrap">
                      <span>직접·반례</span>
                      <span className="text-white font-semibold">(2k+1)² ≡ 1 (mod 8)</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-slate-300 whitespace-nowrap">
                      <span>대우·귀류</span>
                      <MathText text="~q → ~p, √2 ∉ ℚ" className="text-sky-300 font-semibold" />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-slate-400 whitespace-nowrap">
                      <span>절대부등식</span>
                      <MathText text="(a+b)/2 ≥ √(ab), |a+b| ≤ |a|+|b|" className="text-emerald-300 font-semibold" />
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    <span>관찰 → 추측 → 대우·귀류 → 절대부등식</span>
                    <span className="mono text-slate-300">01 ~ 07</span>
                  </div>
                </div>
              </div>
            </div>

            {/* In Student Mode: Show Lesson 1~7 Tabs on Left, Progress & Print Feature on Right */}
            {sessionMode === 'student' && (
              <div
                role="tablist"
                aria-label="학생 차시 선택 및 수사 진행 현황"
                className="no-print mt-7 pt-5 border-t border-white/10 flex flex-col gap-4"
              >
                {/* Top Row: Lesson 1 ~ 7 Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  {LESSON_TAB_METADATA.map(({ num: tabNum, badge, fullTitle: label }) => {
                    const isUnlocked = isLessonEnabled(lessonAccess, tabNum);
                    const isSelected = activeLessonTab === tabNum && isUnlocked;
                    return (
                      <button
                        key={tabNum}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        aria-disabled={!isUnlocked}
                        onClick={() => handleSelectStudentLesson(tabNum)}
                        title={
                          isUnlocked
                            ? `${label} 학습하기`
                            : `${label} — 현재 교사가 비활성(잠금) 상태로 설정하여 진입할 수 없습니다`
                        }
                        className={`min-h-[42px] rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-white text-slate-900 shadow-sm'
                            : isUnlocked
                            ? 'bg-white/10 text-slate-200 border border-white/15 hover:bg-white/15'
                            : 'bg-slate-900/60 text-slate-400 border border-dashed border-slate-600/80 opacity-75 cursor-not-allowed'
                        }`}
                      >
                        <span
                          className={`mono text-xs font-extrabold ${
                            isSelected
                              ? 'text-blue-600'
                              : isUnlocked
                              ? 'text-sky-300'
                              : 'text-slate-500'
                          }`}
                        >
                          {badge}
                        </span>
                        <span>{label}</span>
                        {!isUnlocked && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
                            <Lock className="h-3 w-3" />
                            <span>잠김</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Row: 나의 수사 진행 현황 (h3 class) with Evaluation & Print Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-white whitespace-nowrap">
                      나의 수사 진행 현황
                    </h3>
                    <span className="mono text-xs font-bold text-sky-200 bg-sky-950/70 border border-sky-400/30 px-2 py-0.5 rounded-md">
                      1차시 {done1.filter(Boolean).length}/{STAGE_TITLES[1].length} · 2차시 {done2.filter(Boolean).length}/5 · 3차시 {done3.filter(Boolean).length}/5 · 4차시 {done4.filter(Boolean).length}/5 · 5차시 {done5.filter(Boolean).length}/5 · 6차시 {done6.filter(Boolean).length}/5 · 7차시 {done7.filter(Boolean).length}/5
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">

                  {/* "평가 결과" Button */}
                  {(() => {
                    const studentEvalProg = getTeacherEvaluationProgress(student);
                    return (
                      <button
                        type="button"
                        onClick={() => setIsEvalModalOpen(true)}
                        className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 shadow-xs border ${
                          studentEvalProg.status === 'complete'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40 ring-2 ring-emerald-400/30'
                            : studentEvalProg.status === 'partial'
                            ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/40 ring-2 ring-amber-400/30'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                        }`}
                        title="교수자가 입력한 평가 결과 및 피드백 확인"
                      >
                        <Award
                          className={`h-4 w-4 ${
                            studentEvalProg.status !== 'none' ? 'text-amber-200' : 'text-sky-300'
                          }`}
                        />
                        <span>평가 결과</span>
                        {studentEvalProg.status === 'complete' && (
                          <span className="rounded-full bg-emerald-300 text-emerald-950 text-[10px] px-1.5 py-0.5 font-black uppercase tracking-tight">
                            평가 완료
                          </span>
                        )}
                        {studentEvalProg.status === 'partial' && (
                          <span className="rounded-full bg-amber-200 text-amber-950 text-[10px] px-1.5 py-0.5 font-black uppercase tracking-tight">
                            진행 중 {studentEvalProg.percent}%
                          </span>
                        )}
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-white/20 transition-all whitespace-nowrap shrink-0 shadow-xs"
                    title="현재 수사 활동지 화면 인쇄 / PDF 저장"
                  >
                    <Printer className="h-4 w-4 text-sky-300" />
                    <span>현재 화면 인쇄 / PDF</span>
                  </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Workspace Container */}
        <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 sm:px-6 py-7">
          {toast && (
            <div
              role="status"
              className={`no-print mb-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-sm font-semibold shadow-xs ${
                toast.type === 'good'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toast.type === 'good' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                )}
                <span>{toast.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-xs font-bold underline opacity-80 hover:opacity-100 shrink-0 whitespace-nowrap"
              >
                닫기
              </button>
            </div>
          )}

          {sessionMode === 'gate' && (
            <AuthGateView
              currentUser={firebaseUser}
              onStudentApprovedLogin={handleStudentApprovedLogin}
              onAdminTeacherLogin={handleAdminTeacherLogin}
            />
          )}

          {sessionMode === 'student' && (
            <section aria-label="학생 탐구 활동 영역" className="space-y-6">
              {/* Approved Student Identity & Progress Header Bar */}
              <div className="no-print rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>관리자 승인 완료 · 학생 전용 모드 · 실시간 클라우드 자동 저장</span>
                    </div>
                    <div className="mt-1 text-base sm:text-lg font-extrabold text-slate-900">
                      {approvedProfile
                        ? `${approvedProfile.school} ${approvedProfile.grade}학년 ${approvedProfile.classNum}반 ${approvedProfile.studentNum}번 ${approvedProfile.name}`
                        : `${student.group} ${student.code}`}
                    </div>
                    {approvedProfile && (
                      <div className="text-xs text-slate-500 mono mt-1">
                        생년월일 {approvedProfile.birthDate} · 기기 MAC 식별자{' '}
                        {formatDeviceHashAsMac(approvedProfile.deviceHash)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const studentEvalProg = getTeacherEvaluationProgress(student);
                      return (
                        <button
                          type="button"
                          onClick={() => setIsEvalModalOpen(true)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
                            studentEvalProg.status === 'complete'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 ring-1 ring-emerald-300/40'
                              : studentEvalProg.status === 'partial'
                              ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 ring-1 ring-amber-300/40'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          title="교수자가 입력한 역량 평가 및 피드백 열람"
                        >
                          <Award
                            className={`h-4 w-4 ${
                              studentEvalProg.status === 'complete'
                                ? 'text-emerald-600'
                                : studentEvalProg.status === 'partial'
                                ? 'text-amber-600'
                                : 'text-slate-500'
                            }`}
                          />
                          <span>
                            {studentEvalProg.status === 'complete'
                              ? '교수자 평가 결과 (완료 100%)'
                              : studentEvalProg.status === 'partial'
                              ? `교수자 평가 결과 (진행 중 ${studentEvalProg.percent}%)`
                              : '교수자 평가 결과 확인'}
                          </span>
                        </button>
                      );
                    })()}

                    {/* Real-time Cloud Save Status Indicator & Manual Force Save */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors ${
                          cloudSyncStatus === 'saving'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : cloudSyncStatus === 'saved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : cloudSyncStatus === 'error'
                            ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                        title={
                          cloudSyncStatus === 'saved' && lastSavedAt
                            ? `마지막 클라우드 저장: ${lastSavedAt.toLocaleTimeString('ko-KR')}`
                            : undefined
                        }
                      >
                        {cloudSyncStatus === 'saving' && (
                          <>
                            <RotateCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                            <span>클라우드 실시간 동기화 중…</span>
                          </>
                        )}
                        {cloudSyncStatus === 'saved' && (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>
                              클라우드 저장 완료 (
                              {lastSavedAt ? lastSavedAt.toLocaleTimeString('ko-KR') : '방금'})
                            </span>
                          </>
                        )}
                        {cloudSyncStatus === 'error' && (
                          <>
                            <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                            <span>클라우드 저장 재시도 필요</span>
                          </>
                        )}
                        {cloudSyncStatus === 'idle' && (
                          <>
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>로컬 및 클라우드 동기화 대기</span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleManualForceSave}
                        className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/90 hover:bg-blue-100 text-blue-700 px-3 py-2 text-xs font-extrabold transition-colors shadow-2xs active:scale-95"
                        title="작성한 탐구 내용을 지금 즉시 교사 서버(클라우드)로 전송하여 저장합니다"
                      >
                        <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span>지금 저장</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lesson Overview & Progress */}
                <div className="pt-5">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-slate-500">
                    <span className="font-bold text-blue-600">
                      {displayLessonTab === 1 && '01차시 · 교사 안내형 수사 (직접 증명)'}
                      {displayLessonTab === 2 && '02차시 · 학생 주도형 수사 (반례와 정당화)'}
                      {displayLessonTab === 3 && '03차시 · 힌트 안내형 수사 (대우를 이용한 증명)'}
                      {displayLessonTab === 4 && '04차시 · 힌트 안내형 수사 (귀류법을 이용한 증명)'}
                      {displayLessonTab === 5 && '05차시 · 절대부등식1 (완전제곱식을 이용한 절대부등식의 증명)'}
                      {displayLessonTab === 6 && '06차시 · 절대부등식2 (산술평균과 기하평균의 관계 증명)'}
                      {displayLessonTab === 7 && '07차시 · 절대부등식3 (절댓값 기호를 포함한 부등식의 증명)'}
                    </span>
                    <span className="font-semibold mono text-slate-600">
                      권장 시간 50분 · 단계 완료 {activeDone.filter(Boolean).length} / {STAGE_TITLES[displayLessonTab].length}
                    </span>
                  </div>

                  <h2 className="mt-1.5 text-xl sm:text-2xl font-extrabold text-slate-900">
                    {displayLessonTab === 1 && '패턴의 비밀을 찾아라!'}
                    {displayLessonTab === 2 && '반례를 찾아라! 진실을 증명하라!'}
                    {displayLessonTab === 3 && '대우(~q → ~p)로 숨겨진 진실을 증명하라!'}
                    {displayLessonTab === 4 && '모순을 포착하라! 귀류법으로 무리수를 증명하라!'}
                    {displayLessonTab === 5 && '절대부등식1 — 실수의 제곱(X² ≥ 0)으로 절대부등식을 증명하라!'}
                    {displayLessonTab === 6 && '절대부등식2 — 산술평균과 기하평균의 관계를 증명하라!'}
                    {displayLessonTab === 7 && '절대부등식3 — 절댓값의 제곱 성질(|A|² = A²)로 부등식을 증명하라!'}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600">
                    {displayLessonTab === 1 && '홀수의 제곱에서 발견한 단서는 우연일까요, 필연일까요?'}
                    {displayLessonTab === 2 && '새롭게 만든 명제는 진실일까요? 반례와 증명으로 사건을 해결해 보세요.'}
                    {displayLessonTab === 3 && '직접 증명하기 까다로운 두 사건(짝수·홀수, 3의 배수)을 대우 명제와 단계별 힌트로 해결해 보세요.'}
                    {displayLessonTab === 4 && (
                      <MathText text="결론을 부정했을 때 발생하는 논리적 모순을 추적하여 √2와 1+√2가 유리수가 아님을 증명해 보세요." />
                    )}
                    {displayLessonTab === 5 && '교과서 예제 3을 변환한 [문제 1] (a²+b² ≥ ab)과 [문제 2] ((a+b)² ≥ 4ab, a²−4ab+5b² ≥ 0)를 완전제곱식으로 증명해 보세요.'}
                    {displayLessonTab === 6 && (
                      <MathText text="교과서 예제 4를 변환한 [문제 1] ((a+b)/2 ≥ √(ab))과 [문제 2] (a+1/a ≥ 2, √(ab) ≥ 2ab/(a+b))를 증명해 보세요." />
                    )}
                    {displayLessonTab === 7 && '교과서 예제 5를 변환한 [문제 1] (|a+b| ≤ |a|+|b|)과 [문제 2] (|a−b| ≤ |a|+|b|, |a|−|b| ≤ |a−b|)를 증명해 보세요.'}
                  </p>

                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-200"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((activeDone.filter(Boolean).length / Math.max(1, STAGE_TITLES[displayLessonTab].length)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Stage Step Navigation Grid */}
              {studentRenderGate.canRender && (
                <nav
                  aria-label="수사 단계 이동"
                  className={`no-print grid gap-2 sm:gap-3 ${
                    STAGE_TITLES[displayLessonTab].length === 6
                      ? 'grid-cols-3 sm:grid-cols-6'
                      : 'grid-cols-5'
                  }`}
                >
                  {STAGE_TITLES[displayLessonTab].map((title, idx) => {
                    const isCurrent = activeStep === idx;
                    const isComplete = activeDone[idx];
                    return (
                      <button
                        key={title}
                        type="button"
                        aria-current={isCurrent ? 'step' : undefined}
                        onClick={() => {
                          if (!isLessonEnabled(lessonAccess, displayLessonTab)) return;
                          setSteps((prev) => ({ ...prev, [displayLessonTab]: idx }));
                        }}
                        className={`min-h-[68px] sm:min-h-[76px] rounded-xl border p-2 sm:p-3 flex flex-col items-center justify-center text-center transition-all ${
                          isCurrent
                            ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-1 ring-blue-600 shadow-xs'
                            : isComplete
                            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900 hover:bg-emerald-50'
                            : 'border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <strong className="mono text-[10px] sm:text-xs font-extrabold">
                          0{idx + 1} {isComplete ? '✓' : ''}
                        </strong>
                        <span className="mt-1 text-[11px] sm:text-sm font-bold leading-tight break-keep">
                          <MathText text={title} />
                        </span>
                      </button>
                    );
                  })}
                </nav>
              )}

              {/* Main Stage Content Card */}
              <section
                aria-live="polite"
                className="print-card rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-xs"
              >
                {/* Print-only Classroom Header for Current Screen Print / PDF */}
                <div className="hidden print:block mb-4 pb-3 border-b border-slate-300 text-slate-900">
                  <div className="text-xs font-extrabold tracking-wider text-blue-700">
                    MATH DETECTIVE WORKSHEET
                  </div>
                  <div className="text-lg font-extrabold mt-0.5">
                    우연일까, 필연일까? ({displayLessonTab}차시 탐구 활동지)
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    학생: {approvedProfile ? `${approvedProfile.school} ${approvedProfile.grade}학년 ${approvedProfile.classNum}반 ${approvedProfile.studentNum}번 ${approvedProfile.name}` : `${student.group} ${student.code}`} · 출력일: {new Date().toLocaleDateString('ko-KR')}
                  </div>
                </div>
                {studentRenderGate.reason === 'syncing' ? (
                  <div
                    id="student-lesson-syncing-gate"
                    className="rounded-2xl border border-blue-200 bg-blue-50/60 p-8 text-center space-y-3"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <RotateCw className="h-6 w-6 animate-spin" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      선생님의 차시 활성/잠금 설정을 확인하고 있습니다…
                    </h3>
                    <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                      클라우드 서버에서 현재 수업 진도에 맞게 허용된 차시 정보를 불러오고 있습니다.
                    </p>
                  </div>
                ) : studentRenderGate.reason === 'all_locked' ? (
                  <div
                    id="student-all-lessons-locked-gate"
                    className="rounded-2xl border border-amber-200 bg-amber-50/70 p-8 text-center space-y-3"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      현재 모든 차시가 잠금(비활성) 상태입니다
                    </h3>
                    <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                      선생님이 수업 진도에 맞춰 차시를 활성화(ON)하면 화면이 자동으로 열립니다. 잠시만 기다려 주세요.
                    </p>
                  </div>
                ) : studentRenderGate.reason === 'lesson_locked' ? (
                  <div
                    id="student-single-lesson-locked-gate"
                    className="rounded-2xl border border-amber-200 bg-amber-50/70 p-8 text-center space-y-4"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                        이 차시는 현재 비활성(선행 학습 잠금) 상태입니다
                      </h3>
                      <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                        선생님이 아직 이 차시를 열지 않았습니다. 현재 열려 있는 차시로 이동하여 탐구를 진행해 주세요.
                      </p>
                    </div>
                    {studentRenderGate.redirectLesson !== null && (
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectStudentLesson(studentRenderGate.redirectLesson!, true)
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-extrabold text-white shadow-xs transition-colors"
                        >
                          <span>{studentRenderGate.redirectLesson}차시로 이동하기</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {activeLessonTab === 1 && isLessonEnabled(lessonAccess, 1) && (
                      <Lesson1View
                        state={student.l1}
                        step={steps[1]}
                        onStepChange={(next) => {
                          setSteps((prev) => ({ ...prev, 1: next }));
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                        onUpdate={(updater) =>
                          setStudent((prev) => {
                            if (!isLessonEnabled(lessonAccessRef.current, 1)) return prev;
                            return {
                              ...prev,
                              updatedAt: new Date().toISOString(),
                              l1: updater(prev.l1),
                            };
                          })
                        }
                        onGoToLesson2={() => handleSelectStudentLesson(2, true)}
                        onRequestConfirm={requestConfirm}
                      />
                    )}

                    {activeLessonTab === 2 && isLessonEnabled(lessonAccess, 2) && (
                      <Lesson2View
                        state={student.l2}
                        step={steps[2]}
                        onStepChange={(next) => {
                          setSteps((prev) => ({ ...prev, 2: next }));
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                        onUpdate={(updater) =>
                          setStudent((prev) => {
                            if (!isLessonEnabled(lessonAccessRef.current, 2)) return prev;
                            return {
                              ...prev,
                              updatedAt: new Date().toISOString(),
                              l2: updater(prev.l2),
                            };
                          })
                        }
                        onChangeTopic={handleChangeTopic2}
                        onGoToLesson3={() => handleSelectStudentLesson(3, true)}
                        onRequestConfirm={requestConfirm}
                      />
                    )}

                    {activeLessonTab === 3 && isLessonEnabled(lessonAccess, 3) && (
                      <Lesson3View
                        state={student.l3}
                        step={steps[3]}
                        onStepChange={(next) => {
                          setSteps((prev) => ({ ...prev, 3: next }));
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                        onUpdate={(updater) =>
                          setStudent((prev) => {
                            if (!isLessonEnabled(lessonAccessRef.current, 3)) return prev;
                            return {
                              ...prev,
                              updatedAt: new Date().toISOString(),
                              l3: updater(prev.l3),
                            };
                          })
                        }
                        onGoToLesson4={() => handleSelectStudentLesson(4, true)}
                        onRequestConfirm={requestConfirm}
                      />
                    )}

                    {activeLessonTab === 4 && isLessonEnabled(lessonAccess, 4) && (
                      <Lesson4View
                        state={student.l4}
                        step={steps[4]}
                        onStepChange={(next) => {
                          setSteps((prev) => ({ ...prev, 4: next }));
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                        onUpdate={(updater) =>
                          setStudent((prev) => {
                            if (!isLessonEnabled(lessonAccessRef.current, 4)) return prev;
                            return {
                              ...prev,
                              updatedAt: new Date().toISOString(),
                              l4: updater(prev.l4),
                            };
                          })
                        }
                        onGoToLesson5={() => handleSelectStudentLesson(5, true)}
                        onRequestConfirm={requestConfirm}
                      />
                    )}

                    {activeLessonTab === 5 && isLessonEnabled(lessonAccess, 5) && (
                      <Lesson5View
                        state={student.l5}
                        step={steps[5]}
                        onStepChange={(next) => {
                          setSteps((prev) => ({ ...prev, 5: next }));
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                        onUpdate={(updater) =>
                          setStudent((prev) => {
                            if (!isLessonEnabled(lessonAccessRef.current, 5)) return prev;
                            return {
                              ...prev,
                              updatedAt: new Date().toISOString(),
                              l5: updater(prev.l5),
                            };
                          })
                        }
                        onGoToLesson6={() => handleSelectStudentLesson(6, true)}
                        onRequestConfirm={requestConfirm}
                      />
                    )}

                    {activeLessonTab === 6 && isLessonEnabled(lessonAccess, 6) && (
                      <Lesson6View
                        state={student.l6}
                        step={steps[6]}
                        onStepChange={(next) => {
                          setSteps((prev) => ({ ...prev, 6: next }));
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                        onUpdate={(updater) =>
                          setStudent((prev) => {
                            if (!isLessonEnabled(lessonAccessRef.current, 6)) return prev;
                            return {
                              ...prev,
                              updatedAt: new Date().toISOString(),
                              l6: updater(prev.l6),
                            };
                          })
                        }
                        onGoToLesson7={() => handleSelectStudentLesson(7, true)}
                        onRequestConfirm={requestConfirm}
                      />
                    )}

                    {activeLessonTab === 7 && isLessonEnabled(lessonAccess, 7) && (
                      <Lesson7View
                        state={student.l7}
                        step={steps[7]}
                        onStepChange={(next) => {
                          setSteps((prev) => ({ ...prev, 7: next }));
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                        onUpdate={(updater) =>
                          setStudent((prev) => {
                            if (!isLessonEnabled(lessonAccessRef.current, 7)) return prev;
                            return {
                              ...prev,
                              updatedAt: new Date().toISOString(),
                              l7: updater(prev.l7),
                            };
                          })
                        }
                        onRequestConfirm={requestConfirm}
                      />
                    )}
                  </>
                )}
              </section>
            </section>
          )}

          {sessionMode === 'teacher' && (
            <section aria-label="교사용 수사 기록실 영역">
              <TeacherView
                adminEmail={firebaseUser?.email || ADMIN_TEACHER_EMAIL}
                records={teacherRecords}
                selectedKey={selectedTeacherKey}
                onSelectStudent={setSelectedTeacherKey}
                onUpdateRecords={setTeacherRecords}
                onPrintStudentReport={handlePrintStudentReport}
                onRequestConfirm={requestConfirm}
                lessonAccess={lessonAccess}
                lessonAccessSyncStatus={lessonAccessSyncStatus}
                lessonAccessLastSyncedAt={lessonAccessLastSyncedAt}
                onUpdateLessonAccess={handleUpdateLessonAccess}
                onForceSyncLessonAccessToServer={handleForceSyncLessonAccessToServer}
                onRefreshLessonAccessFromServer={refreshLessonAccessFromServer}
              />
            </section>
          )}

          {sessionMode !== 'gate' && (
            <MathSymbolInputBar activeLesson={displayLessonTab} />
          )}
        </main>

        {/* Footer (최하단 브랜드 표기) */}
        <footer className="no-print border-t border-slate-200/80 bg-white mt-10">
          <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              <span className="font-extrabold text-blue-700">{CLASSROOM_BRAND_NAME}</span>
              <span className="mx-2 text-slate-300">·</span>
              <span className="font-bold text-slate-800">우연일까, 필연일까?</span>
              <span className="mx-2 text-slate-300">·</span>
              <span>공통수학2 명제의 증명과 절대부등식 탐구 프로젝트</span>
            </div>
            <div>
              학생 모드 · 교사(관리자 <span className="mono">{ADMIN_TEACHER_EMAIL}</span>) 승인제 통합 플랫폼
            </div>
          </div>
        </footer>

        {/* Custom Confirmation Modal */}
        {confirmDialog && (
          <div
            className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 id="confirm-dialog-title" className="text-lg font-extrabold text-slate-900">
                {confirmDialog.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fn = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    fn();
                  }}
                  className="min-h-[42px] rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 whitespace-nowrap"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Evaluation Result & Teacher Feedback Modal */}
        <StudentEvaluationModal
          isOpen={isEvalModalOpen}
          onClose={() => setIsEvalModalOpen(false)}
          student={student}
          lessonAccess={lessonAccess}
          onPrintReport={handlePrintStudentReport}
          onGoToLesson={(lesson) => {
            handleSelectStudentLesson(lesson);
          }}
        />
      </div>

      {/* Dedicated Individual Student Report Print Area */}
      <section
        id="print-report-sheet"
        className="hidden"
        aria-label="학생 개별 피드백 인쇄"
      >
        {printingStudent && (
          <div className="text-[#18283b] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#18283b] pb-2">
              <div>
                <div className="text-xs tracking-[2px] text-[#2563eb] font-extrabold">
                  {CLASSROOM_BRAND_NAME} · MATH DETECTIVE · INDIVIDUAL FEEDBACK
                </div>
                <h2 className="text-2xl font-extrabold mt-0.5">
                  우연일까, 필연일까? — 수학 탐정단 개별 탐구 평가 결과서
                </h2>
              </div>
              <div className="text-right text-xs font-bold text-[#516780]">
                <div>발행일: {new Date().toLocaleDateString('ko-KR')}</div>
              </div>
            </div>
            <div className="border-b border-[#ccd5df] py-2 text-sm">
              <strong>학급/모둠:</strong> {printingStudent.group || '—'} &nbsp;&nbsp;|&nbsp;&nbsp;{' '}
              <strong>학생 식별코드:</strong> {printingStudent.code || '—'} &nbsp;&nbsp;|&nbsp;&nbsp;{' '}
              <strong>평가 상태:</strong> {getTeacherEvaluationProgress(printingStudent).statusLabel} ({getTeacherEvaluationProgress(printingStudent).percent}%)
            </div>

            <h3 className="text-lg font-bold pt-2">1. 탐구 활동 요약 (1 ~ 7차시)</h3>
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>1차시 발견한 명제:</strong> {printingStudent.l1.claim || '미작성'}
            </div>
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>1차시 증명 서술:</strong> {printingStudent.l1.proofText || '미작성'}
            </div>
            {(printingStudent.l1.aiA || printingStudent.l1.vendAnswer) && (
              <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
                <strong>1차시 06 도전 실생활 함수:</strong>{' '}
                {printingStudent.l1.aiA && `[도전 1 AI] 기계A: ${printingStudent.l1.aiA === 'yes' ? '함수' : '함수아님'}, B: ${printingStudent.l1.aiB === 'yes' ? '함수' : '함수아님'}, C: ${printingStudent.l1.aiC === 'yes' ? '함수' : '함수아님'} (설명: ${printingStudent.l1.aiExplain || '미작성'}) `}
                {printingStudent.l1.vendAnswer && `[도전 2 자판기] 함수여부: ${printingStudent.l1.vendAnswer === 'yes' ? '함수' : '함수아님'} (수리음료: [${(printingStudent.l1.vFix || []).filter(Boolean).join(', ')}], 이유: ${printingStudent.l1.vendExplain || '미작성'})`}
              </div>
            )}
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>2차시 선택 명제:</strong>{' '}
              {printingStudent.l2.topic === 'd'
                ? printingStudent.l2.customStatement
                : TOPICS[printingStudent.l2.topic as TopicId]?.statement || '미선택'}
            </div>
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>2차시 판단 및 논증:</strong>{' '}
              {({ true: '참', false: '거짓', unknown: '미해결' } as Record<string, string>)[
                printingStudent.l2.decision
              ] || '미작성'}{' '}
              /{' '}
              {printingStudent.l2.decision === 'false'
                ? `반례 n=${printingStudent.l2.counter}: ${printingStudent.l2.counterReason}`
                : printingStudent.l2.proofText || '미작성'}
            </div>
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>3차시 대우법 [문제 1·짝수]:</strong> {printingStudent.l3?.prob1ProofText || '미작성'}
            </div>
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>3차시 대우법 [문제 2·3의 배수]:</strong> {printingStudent.l3?.prob2ProofText || '미작성'}
            </div>
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong><MathText text="4차시 귀류법 [문제 1·√2]:" /></strong>{' '}
              <MathText text={printingStudent.l4?.prob1ProofText || '미작성'} />
            </div>
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong><MathText text="4차시 귀류법 [문제 2·1+√2]:" /></strong>{' '}
              <MathText text={printingStudent.l4?.prob2ProofText || '미작성'} />
            </div>
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>5차시 절대부등식1 [문제 1·a²+b²≥ab]:</strong>{' '}
              <MathText text={printingStudent.l5?.prob1ProofText || '미작성'} />
            </div>
            {printingStudent.l5?.equalityReason && (
              <div className="border-b border-[#ccd5df] py-1.5 text-xs sm:text-sm whitespace-pre-wrap text-slate-700">
                <strong>5차시 [등호 성립 조건 이유]:</strong> {printingStudent.l5.equalityReason}
              </div>
            )}
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>5차시 절대부등식1 [문제 2·(a+b)²≥4ab 외]:</strong>{' '}
              <MathText text={printingStudent.l5?.prob2ProofText || '미작성'} />
            </div>
            {printingStudent.l5?.reflection1 && (
              <div className="border-b border-[#ccd5df] py-1.5 text-xs sm:text-sm whitespace-pre-wrap text-slate-700">
                <strong>5차시 성찰 1:</strong> {printingStudent.l5.reflection1}
              </div>
            )}
            {printingStudent.l5?.reflection2 && (
              <div className="border-b border-[#ccd5df] py-1.5 text-xs sm:text-sm whitespace-pre-wrap text-slate-700">
                <strong>5차시 성찰 2:</strong> {printingStudent.l5.reflection2}
              </div>
            )}
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>6차시 절대부등식2 [문제 1·산술·기하평균]:</strong>{' '}
              <MathText text={printingStudent.l6?.prob1ProofText || '미작성'} />
            </div>
            {printingStudent.l6?.harmonicReason && (
              <div className="border-b border-[#ccd5df] py-1.5 text-xs sm:text-sm whitespace-pre-wrap text-slate-700">
                <strong>6차시 [조화평균 유도 이유]:</strong> {printingStudent.l6.harmonicReason}
              </div>
            )}
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>6차시 절대부등식2 [문제 2·역수·조화평균]:</strong>{' '}
              <MathText text={printingStudent.l6?.prob2ProofText || '미작성'} />
            </div>
            {printingStudent.l6?.reflection1 && (
              <div className="border-b border-[#ccd5df] py-1.5 text-xs sm:text-sm whitespace-pre-wrap text-slate-700">
                <strong>6차시 성찰 1:</strong> {printingStudent.l6.reflection1}
              </div>
            )}
            {printingStudent.l6?.reflection2 && (
              <div className="border-b border-[#ccd5df] py-1.5 text-xs sm:text-sm whitespace-pre-wrap text-slate-700">
                <strong>6차시 성찰 2:</strong> {printingStudent.l6.reflection2}
              </div>
            )}
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong><MathText text="7차시 절대부등식3 [문제 1·|a+b|≤|a|+|b|]:" /></strong>{' '}
              <MathText text={printingStudent.l7?.prob1ProofText || '미작성'} />
            </div>
            {printingStudent.l7?.absDiffReason && (
              <div className="border-b border-[#ccd5df] py-1.5 text-xs sm:text-sm whitespace-pre-wrap text-slate-700">
                <strong>7차시 [절댓값의 차 부호 판별 이유]:</strong> {printingStudent.l7.absDiffReason}
              </div>
            )}
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong><MathText text="7차시 절대부등식3 [문제 2·절댓값 차 부등식]:" /></strong>{' '}
              <MathText text={printingStudent.l7?.prob2ProofText || '미작성'} />
            </div>
            {printingStudent.l7?.reflection1 && (
              <div className="border-b border-[#ccd5df] py-1.5 text-xs sm:text-sm whitespace-pre-wrap text-slate-700">
                <strong>7차시 성찰 1:</strong> {printingStudent.l7.reflection1}
              </div>
            )}
            {printingStudent.l7?.reflection2 && (
              <div className="border-b border-[#ccd5df] py-1.5 text-xs sm:text-sm whitespace-pre-wrap text-slate-700">
                <strong>7차시 성찰 2:</strong> {printingStudent.l7.reflection2}
              </div>
            )}

            <h3 className="text-lg font-bold pt-2">
              2. 교수자 역량 평가 ({EVAL_CRITERIA.length}개 영역, 각 0~3점)
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {EVAL_CRITERIA.map((title, i) => {
                const ev = ensureTeacherEval(printingStudent);
                return (
                  <div
                    key={title}
                    className="rounded-xl border border-[#d2dbe8] p-3 text-center"
                  >
                    <div className="text-xs font-semibold">{title}</div>
                    <strong className="block text-2xl font-extrabold mt-1">
                      {ev.scores[i] === null ? '—' : ev.scores[i]}
                    </strong>
                    <small className="text-xs text-[#596678]">/ 3</small>
                  </div>
                );
              })}
            </div>

            <h3 className="text-lg font-bold pt-2">3. 교수자 피드백</h3>
            <div className="rounded-lg border border-[#ddd] p-3 text-sm whitespace-pre-wrap">
              {ensureTeacherEval(printingStudent).feedback || '아직 작성된 피드백이 없습니다.'}
            </div>

            <h3 className="text-lg font-bold pt-2">4. 다음 탐구를 위한 제안</h3>
            <div className="rounded-lg border border-[#ddd] p-3 text-sm whitespace-pre-wrap">
              {ensureTeacherEval(printingStudent).nextStep || '아직 작성된 제안이 없습니다.'}
            </div>

            <div className="pt-4 border-t border-[#ccd5df] text-center text-xs text-[#516780] font-semibold">
              {CLASSROOM_BRAND_NAME} · 공통수학2 명제의 증명과 절대부등식 탐구 프로젝트 공식 평가서
            </div>
          </div>
        )}
      </section>
    </>
  );
}
