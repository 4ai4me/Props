import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  STORAGE_KEY_STUDENT,
  STORAGE_KEY_TEACHER,
  STAGE_TITLES,
  StudentRecord,
  TOPICS,
  TopicId,
  EVAL_CRITERIA,
  cleanStudentState,
  createInitialStudentState,
  ensureTeacherEval,
  evaluateLevel1Completion,
  evaluateLevel2Completion,
} from './utils/mathLogic';
import {
  ADMIN_TEACHER_EMAIL,
  formatDeviceHashAsMac,
  isAuthorizedAdminEmail,
} from './utils/authLogic';
import { Lesson1View } from './components/Lesson1View';
import { Lesson2View } from './components/Lesson2View';
import { TeacherView } from './components/TeacherView';
import { AuthGateView, FirestoreStudentRegistrationDoc } from './components/AuthGateView';
import {
  Printer,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

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
    useState<FirestoreStudentRegistrationDoc | null>(null);

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

  const [activeLessonTab, setActiveLessonTab] = useState<1 | 2>(1);
  const [steps, setSteps] = useState<{ 1: number; 2: number }>({ 1: 0, 2: 0 });
  const [selectedTeacherKey, setSelectedTeacherKey] = useState<string>('');
  const [printingStudent, setPrintingStudent] = useState<StudentRecord | null>(null);

  const [toast, setToast] = useState<{ text: string; type: 'good' | 'warn' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
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
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'student_registrations', approvedProfile.studentKey), {
            worksheetJson: JSON.stringify(student),
            updatedAt: serverTimestamp(),
          });
        } catch {
          // local storage already saved
        }
      }, 900);
    }
  }, [student, sessionMode, approvedProfile]);

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

  const showToast = (text: string, type: 'good' | 'warn' = 'good') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ title, message, onConfirm });
  };

  const handleStudentApprovedLogin = useCallback(
    (regDoc: FirestoreStudentRegistrationDoc, worksheet: StudentRecord) => {
      const groupLabel = `${regDoc.school} ${regDoc.grade}학년 ${regDoc.classNum}반`.slice(0, 25);
      const codeLabel = `${regDoc.grade}${String(regDoc.classNum).padStart(2, '0')}${String(
        regDoc.studentNum
      ).padStart(2, '0')}_${regDoc.name}`.slice(0, 25);

      const hydrated: StudentRecord = {
        ...worksheet,
        group: groupLabel,
        code: codeLabel,
      };
      setApprovedProfile(regDoc);
      setStudent(hydrated);
      setSessionMode('student');
    },
    []
  );

  const handleAdminTeacherLogin = useCallback(() => {
    setSessionMode('teacher');
  }, []);

  const handleExitMode = async () => {
    if (sessionMode === 'teacher') {
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
    }
    try {
      localStorage.removeItem('math_detective_active_student_key_v1');
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
  const activeDone = activeLessonTab === 1 ? done1 : done2;
  const activeStep = activeLessonTab === 1 ? steps[1] : steps[2];

  return (
    <>
      <div id="app-shell" className="min-h-screen flex flex-col">
        {/* Top Navigation Bar (Strict 3-Zone Contract) */}
        <div className="no-print border-b border-white/10 bg-[#070b14] text-slate-300 px-4 sm:px-6 py-3">
          <div className="mx-auto max-w-[1160px] flex items-center justify-between gap-6">
            {/* Zone 1: Single-line Brand Wordmark */}
            <div className="text-sm sm:text-base font-extrabold tracking-tight text-white whitespace-nowrap shrink-0">
              Math Detective Lab
            </div>

            {/* Zone 2: Unboxed Curriculum Metadata */}
            <div className="hidden md:flex items-center gap-3 text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
              <span>공통수학2</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>명제의 증명</span>
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
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
                  <span>01 — 02차시 통합 탐구 프로젝트</span>
                  <span aria-hidden="true" className="text-slate-600">/</span>
                  <span className="text-slate-300">대수적 정당화와 반례 탐색</span>
                </div>

                <h1
                  className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.14] text-white"
                  style={{ textWrap: 'balance' }}
                >
                  우연일까, <span className="text-sky-300">필연일까?</span>
                </h1>
                <p className="mt-3 text-base sm:text-xl text-slate-200 font-semibold">
                  수학 탐정단의 참·거짓 추리 프로젝트
                </p>
                <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
                  구체적인 숫자의 단서를 수집하고, 가설을 의심하여 반례를 수색한 뒤, 임의의 수에서 성립하는 논리적 증명 보고서를 완성해 보세요.
                </p>
              </div>

              {/* Hero Right Geometric Mathematical Diagram */}
              <div className="hidden lg:flex flex-col items-end justify-center">
                <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xs">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-white/10">
                    <span className="font-semibold text-slate-200">탐구 모델</span>
                    <span className="mono text-sky-300">n = 2k + 1</span>
                  </div>
                  <div className="py-3 space-y-2 mono text-xs">
                    <div className="flex items-center justify-between gap-3 text-slate-300 whitespace-nowrap">
                      <span>홀수의 제곱</span>
                      <span className="text-white font-semibold">(2k + 1)² = 4k(k + 1) + 1</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-slate-400 whitespace-nowrap">
                      <span>나머지 합동</span>
                      <span className="text-emerald-300 font-semibold">n² ≡ 1 (mod 8)</span>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    <span>관찰 → 추측 → 반례 → 증명</span>
                    <span className="mono text-slate-300">01 / 02</span>
                  </div>
                </div>
              </div>
            </div>

            {/* In Student Mode: Show Lesson Tabs on Left, Progress & Print Feature on Right */}
            {sessionMode === 'student' && (
              <div
                role="tablist"
                aria-label="학생 차시 선택 및 수사 진행 현황"
                className="no-print mt-7 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4"
              >
                {/* Left Side: Lesson 1 & Lesson 2 Tabs */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeLessonTab === 1}
                    onClick={() => {
                      setActiveLessonTab(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                      activeLessonTab === 1
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'bg-white/10 text-slate-200 border border-white/15 hover:bg-white/15'
                    }`}
                  >
                    <span
                      className={`mr-2 mono text-xs font-extrabold ${
                        activeLessonTab === 1 ? 'text-blue-600' : 'text-sky-300'
                      }`}
                    >
                      01
                    </span>
                    패턴의 비밀 (1차시)
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeLessonTab === 2}
                    onClick={() => {
                      setActiveLessonTab(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                      activeLessonTab === 2
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'bg-white/10 text-slate-200 border border-white/15 hover:bg-white/15'
                    }`}
                  >
                    <span
                      className={`mr-2 mono text-xs font-extrabold ${
                        activeLessonTab === 2 ? 'text-blue-600' : 'text-sky-300'
                      }`}
                    >
                      02
                    </span>
                    진실의 증명 (2차시)
                  </button>
                </div>

                {/* Right Side: 나의 수사 진행 현황 (h3 class) with Print Button */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-white whitespace-nowrap">
                      나의 수사 진행 현황
                    </h3>
                    <span className="mono text-xs font-bold text-sky-200 bg-sky-950/70 border border-sky-400/30 px-2 py-0.5 rounded-md whitespace-nowrap">
                      1차시 {done1.filter(Boolean).length}/5 · 2차시 {done2.filter(Boolean).length}/5 완료
                    </span>
                  </div>

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

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100/90 border border-slate-200/80 px-3.5 py-2 rounded-xl">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>실시간 탐구 기록 보관 중</span>
                  </div>
                </div>

                {/* Lesson Overview & Progress */}
                <div className="pt-5">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-slate-500">
                    <span className="font-bold text-blue-600">
                      {activeLessonTab === 1 ? '01차시 · 교사 안내형 수사' : '02차시 · 학생 주도형 수사'}
                    </span>
                    <span className="font-semibold mono text-slate-600">
                      권장 시간 50분 · 단계 완료 {activeDone.filter(Boolean).length} / 5
                    </span>
                  </div>

                  <h2 className="mt-1.5 text-xl sm:text-2xl font-extrabold text-slate-900">
                    {activeLessonTab === 1
                      ? '패턴의 비밀을 찾아라!'
                      : '반례를 찾아라! 진실을 증명하라!'}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600">
                    {activeLessonTab === 1
                      ? '홀수의 제곱에서 발견한 단서는 우연일까요, 필연일까요?'
                      : '새롭게 만든 명제는 진실일까요? 반례와 증명으로 사건을 해결해 보세요.'}
                  </p>

                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-200"
                      style={{ width: `${activeDone.filter(Boolean).length * 20}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 5-Stage Step Navigation */}
              <nav
                aria-label="수사 단계 이동"
                className="no-print grid grid-cols-5 gap-2 sm:gap-3"
              >
                {STAGE_TITLES[activeLessonTab].map((title, idx) => {
                  const isCurrent = activeStep === idx;
                  const isComplete = activeDone[idx];
                  return (
                    <button
                      key={title}
                      type="button"
                      aria-current={isCurrent ? 'step' : undefined}
                      onClick={() => {
                        setSteps((prev) => ({ ...prev, [activeLessonTab]: idx }));
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
                        {title}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Main Stage Content Card */}
              <section
                aria-live="polite"
                className="print-card rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-xs"
              >
                {activeLessonTab === 1 ? (
                  <Lesson1View
                    state={student.l1}
                    step={steps[1]}
                    onStepChange={(next) => {
                      setSteps((prev) => ({ ...prev, 1: next }));
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    onUpdate={(updater) =>
                      setStudent((prev) => ({
                        ...prev,
                        updatedAt: new Date().toISOString(),
                        l1: updater(prev.l1),
                      }))
                    }
                    onGoToLesson2={() => {
                      setSteps((prev) => ({ ...prev, 2: 0 }));
                      setActiveLessonTab(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onRequestConfirm={requestConfirm}
                  />
                ) : (
                  <Lesson2View
                    state={student.l2}
                    step={steps[2]}
                    onStepChange={(next) => {
                      setSteps((prev) => ({ ...prev, 2: next }));
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    onUpdate={(updater) =>
                      setStudent((prev) => ({
                        ...prev,
                        updatedAt: new Date().toISOString(),
                        l2: updater(prev.l2),
                      }))
                    }
                    onChangeTopic={handleChangeTopic2}
                    onRequestConfirm={requestConfirm}
                  />
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
              />
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="no-print border-t border-slate-200/80 bg-white mt-10">
          <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              <span className="font-bold text-slate-800">우연일까, 필연일까?</span>
              <span className="mx-2 text-slate-300">·</span>
              <span>공통수학2 명제의 증명 탐구 프로젝트</span>
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
      </div>

      {/* Dedicated Individual Student Report Print Area */}
      <section
        id="print-report-sheet"
        className="hidden"
        aria-label="학생 개별 피드백 인쇄"
      >
        {printingStudent && (
          <div className="text-[#18283b] space-y-4">
            <div className="text-xs tracking-[2px] text-[#516780] font-bold">
              MATH DETECTIVE · INDIVIDUAL FEEDBACK
            </div>
            <h2 className="text-2xl font-extrabold">
              우연일까, 필연일까? — 수학 탐정단 개별 탐구 피드백
            </h2>
            <div className="border-b border-[#ccd5df] py-2 text-sm">
              <strong>학급/모둠:</strong> {printingStudent.group || '—'} &nbsp;&nbsp;|&nbsp;&nbsp;{' '}
              <strong>학생 식별코드:</strong> {printingStudent.code || '—'} &nbsp;&nbsp;|&nbsp;&nbsp;{' '}
              <strong>발행일:</strong> {new Date().toLocaleDateString('ko-KR')}
            </div>

            <h3 className="text-lg font-bold pt-2">1. 탐구 활동 요약</h3>
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>1차시 발견한 명제:</strong> {printingStudent.l1.claim || '미작성'}
            </div>
            <div className="border-b border-[#ccd5df] py-2 text-sm whitespace-pre-wrap">
              <strong>1차시 증명 서술:</strong> {printingStudent.l1.proofText || '미작성'}
            </div>
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

            <h3 className="text-lg font-bold pt-2">2. 교사 평가 (4개 영역, 각 0~3점)</h3>
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

            <h3 className="text-lg font-bold pt-2">3. 선생님의 피드백</h3>
            <div className="rounded-lg border border-[#ddd] p-3 text-sm whitespace-pre-wrap">
              {ensureTeacherEval(printingStudent).feedback || '아직 작성된 피드백이 없습니다.'}
            </div>

            <h3 className="text-lg font-bold pt-2">4. 다음 탐구를 위한 제안</h3>
            <div className="rounded-lg border border-[#ddd] p-3 text-sm whitespace-pre-wrap">
              {ensureTeacherEval(printingStudent).nextStep || '아직 작성된 제안이 없습니다.'}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
