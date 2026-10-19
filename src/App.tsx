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
  filenameSafe,
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
  Upload,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [sessionMode, setSessionMode] = useState<'gate' | 'student' | 'teacher'>('gate');
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

  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);
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

  const handleExportStudentJson = () => {
    const payload: StudentRecord = {
      ...student,
      updatedAt: new Date().toISOString(),
    };
    setStudent(payload);
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `수학탐정단_1-2차시_${filenameSafe(payload.group)}_${filenameSafe(payload.code)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('사건 파일(JSON)을 내려받았습니다.', 'good');
  };

  const handleResumeJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;

    try {
      if (f.size > 2_000_000) throw new Error('파일이 너무 큽니다 (2MB 이하만 가능).');
      const text = await f.text();
      const parsed = cleanStudentState(JSON.parse(text));

      const applyLoaded = () => {
        if (approvedProfile) {
          parsed.group = `${approvedProfile.school} ${approvedProfile.grade}학년 ${approvedProfile.classNum}반`.slice(0, 25);
          parsed.code = `${approvedProfile.grade}${String(approvedProfile.classNum).padStart(2, '0')}${String(
            approvedProfile.studentNum
          ).padStart(2, '0')}_${approvedProfile.name}`.slice(0, 25);
        }
        setStudent(parsed);
        setSteps({ 1: 0, 2: 0 });
        showToast('이전 탐구 결과를 불러왔습니다.', 'good');
      };

      if (student.l1.examples.length > 0 || student.l2.examples.length > 0) {
        requestConfirm(
          '이전 결과 덮어쓰기 확인',
          '현재 작성 중인 내용을 불러온 JSON 파일 내용으로 바꿀까요?',
          applyLoaded
        );
      } else {
        applyLoaded();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '올바른 JSON 파일이 아닙니다.';
      showToast(`불러오기 실패: ${msg}`, 'warn');
    }
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
        {/* Top Hero Banner */}
        <header className="hero-bg text-white pt-6 pb-5 px-4 sm:px-6">
          <div className="mx-auto max-w-[1120px] relative z-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_220px] items-center">
              {/* Hero Copy */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#d4ddd8]">
                    <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-[#c99f57] font-serif text-xs font-black text-[#162f39]">
                      M
                    </span>
                    <span>COMMON MATH 2</span>
                    <span className="text-[#849e9c]">/</span>
                    <span>명제의 증명</span>
                    <span className="text-[#849e9c]">/</span>
                    <span>2차시 탐구</span>
                  </div>

                  {sessionMode !== 'gate' && (
                    <div className="no-print flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-[#f7d59b]">
                        {sessionMode === 'teacher' ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" />
                            교사(관리자) 모드 · {firebaseUser?.email || ADMIN_TEACHER_EMAIL}
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5" />
                            학생 모드 · {approvedProfile?.school} {approvedProfile?.grade}-
                            {approvedProfile?.classNum}-{approvedProfile?.studentNum}{' '}
                            {approvedProfile?.name}
                          </>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={handleExitMode}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        로그아웃 / 모드 전환
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2.5 text-xs font-extrabold tracking-[2px] text-[#deb87a]">
                  <span>MATH DETECTIVE PROJECT</span>
                  <span className="h-px w-8 bg-[#c7aa7c]" />
                  <span>CASE 01—02</span>
                </div>

                <h1 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight leading-[1.15]">
                  우연일까, <em className="not-italic text-[#f7d59b]">필연일까?</em>
                </h1>
                <p className="mt-2.5 text-base sm:text-xl text-[#f4f2e9] font-medium">
                  수학 탐정단의 <strong className="text-[#f3d29a]">참·거짓 추리 프로젝트</strong>
                </p>
                <p className="mt-2 text-xs sm:text-sm text-[#c7d9d6] max-w-2xl leading-relaxed">
                  규칙이라는 단서를 수집하고, 반례를 수색하고, 누구나 납득할 수 있는{' '}
                  <strong className="text-[#f0dfb9]">증명 보고서</strong>를 완성해 보세요.
                </p>
              </div>

              {/* Hero Right Emblem */}
              <div className="hidden lg:flex flex-col items-center justify-center gap-3 text-center">
                <div className="flex flex-col items-center opacity-95" aria-hidden="true">
                  <svg
                    width="136"
                    height="134"
                    viewBox="0 0 155 152"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="64"
                      cy="63"
                      r="48"
                      stroke="#E6C990"
                      strokeWidth="2"
                      strokeDasharray="3 8"
                      opacity=".5"
                    />
                    <circle cx="64" cy="63" r="34" stroke="#F4DCA4" strokeWidth="8" />
                    <path
                      d="M89 88l30 30"
                      stroke="#F4DCA4"
                      strokeWidth="13"
                      strokeLinecap="round"
                    />
                    <path
                      d="M52 62l10 10 18-22"
                      stroke="#F4DCA4"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 17h20M4 25h32M114 16h30M129 24h15"
                      stroke="#96B4B7"
                      strokeWidth="2"
                      opacity=".45"
                    />
                  </svg>
                  <span className="text-[10px] tracking-[2px] text-[#a4c2bf] font-extrabold -mt-1">
                    수사 중 · EVIDENCE LAB
                  </span>
                </div>
                <div className="w-full border-y border-white/25 py-2 text-left text-[11px] tracking-wider text-[#dfc397]">
                  CASE FILE <strong className="float-right text-xs text-[#fff4db]">01 / 02</strong>
                  <span className="block clear-both text-[10px] text-[#b6c9c6] pt-1">
                    관찰 · 추측 · 반례 · 증명
                  </span>
                </div>
              </div>
            </div>

            {/* In Student Mode: Show ONLY Lesson 1 & Lesson 2 Tabs (Teacher Mode strictly separated) */}
            {sessionMode === 'student' && (
              <div
                role="tablist"
                aria-label="학생 차시 선택"
                className="no-print mt-5 pt-4 border-t border-white/20 grid grid-cols-2 sm:flex sm:flex-wrap gap-2"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeLessonTab === 1}
                  onClick={() => {
                    setActiveLessonTab(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`min-h-[46px] rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all whitespace-nowrap ${
                    activeLessonTab === 1
                      ? 'bg-[#f5ebd5] text-[#27404b] border border-[#f1d8ae] shadow-sm'
                      : 'bg-white/10 text-[#e7ece4] border border-white/25 hover:bg-white/20'
                  }`}
                >
                  <span
                    className={`mr-1.5 text-xs font-black ${
                      activeLessonTab === 1 ? 'text-[#98621d]' : 'text-[#e5bd84]'
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
                  className={`min-h-[46px] rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all whitespace-nowrap ${
                    activeLessonTab === 2
                      ? 'bg-[#f5ebd5] text-[#27404b] border border-[#f1d8ae] shadow-sm'
                      : 'bg-white/10 text-[#e7ece4] border border-white/25 hover:bg-white/20'
                  }`}
                >
                  <span
                    className={`mr-1.5 text-xs font-black ${
                      activeLessonTab === 2 ? 'text-[#98621d]' : 'text-[#e5bd84]'
                    }`}
                  >
                    02
                  </span>
                  진실의 증명 (2차시)
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Workspace Container */}
        <main className="mx-auto w-full max-w-[1120px] flex-1 px-3.5 sm:px-6 py-5">
          {toast && (
            <div
              role="status"
              className={`no-print mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm ${
                toast.type === 'good'
                  ? 'border-[#9cd6c1] bg-[#e5f5ed] text-[#075e49]'
                  : 'border-[#e7c989] bg-[#fff4da] text-[#705012]'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'good' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <span>{toast.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-xs underline opacity-80 hover:opacity-100 shrink-0"
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
            <section aria-label="학생 탐구 활동 영역" className="space-y-4">
              {/* Approved Student Identity Bar */}
              <div className="no-print rounded-2xl border border-[#e0ddd1] bg-[#fffcf6] p-4 sm:p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold text-[#187361]">
                      ✓ 관리자 승인 완료 · 학생 전용 모드 (실시간 자동 저장)
                    </div>
                    <div className="mt-0.5 text-sm sm:text-base font-extrabold text-[#20343d]">
                      {approvedProfile
                        ? `${approvedProfile.school} ${approvedProfile.grade}학년 ${approvedProfile.classNum}반 ${approvedProfile.studentNum}번 ${approvedProfile.name}`
                        : `${student.group} ${student.code}`}
                    </div>
                    {approvedProfile && (
                      <div className="text-xs text-[#65747c] mono mt-0.5">
                        생년월일: {approvedProfile.birthDate} · 등록 기기 MAC:{' '}
                        {formatDeviceHashAsMac(approvedProfile.deviceHash)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={resumeFileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleResumeJsonUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => resumeFileInputRef.current?.click()}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#b8cac4] bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-[#295763] hover:bg-[#e8f2f1] whitespace-nowrap"
                    >
                      <Upload className="h-4 w-4" />
                      백업 JSON 불러오기
                    </button>
                  </div>
                </div>
              </div>

              {/* Lesson Intro Banner */}
              <div className="print-card relative overflow-hidden rounded-2xl border border-[#c8d8ce] bg-gradient-to-r from-[#ebf3ef] to-[#f8f7ee] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <span className="font-extrabold text-[#1b505a] tracking-wide">
                    CASE {activeLessonTab === 1 ? '01 · 교사 안내형 수사' : '02 · 학생 주도형 수사'}
                  </span>
                  <span className="text-[#516b69] font-semibold">
                    권장 시간 50분 · 증거 확보 {activeDone.filter(Boolean).length} / 5 단계
                  </span>
                </div>

                <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-[#20343d]">
                  {activeLessonTab === 1
                    ? '패턴의 비밀을 찾아라!'
                    : '반례를 찾아라! 진실을 증명하라!'}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#516b69]">
                  {activeLessonTab === 1
                    ? '홀수의 제곱에서 발견한 단서는 우연일까요, 필연일까요?'
                    : '새롭게 만든 명제는 진실일까요? 반례와 증명으로 사건을 해결해 보세요.'}
                </p>

                <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-[#d8e2df]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c99d57] to-[#27947c] transition-all duration-200"
                    style={{ width: `${activeDone.filter(Boolean).length * 20}%` }}
                  />
                </div>
              </div>

              {/* 5-Stage Step Navigation */}
              <nav
                aria-label="수사 단계 이동"
                className="no-print grid grid-cols-5 gap-1.5 sm:gap-2.5"
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
                      className={`min-h-[68px] sm:min-h-[76px] rounded-xl border p-1.5 sm:p-2.5 flex flex-col items-center justify-center text-center transition-all ${
                        isCurrent
                          ? 'border-[#21666e] bg-[#eaf3f0] text-[#134650] ring-1 ring-[#21666e] shadow-xs'
                          : isComplete
                          ? 'border-[#96c6ae] bg-[#e9f4ee] text-[#176950]'
                          : 'border-[#d1d9d6] bg-[#fffefa] text-[#5d6b80] hover:bg-white'
                      }`}
                    >
                      <strong className="text-[10px] sm:text-xs font-black tracking-wide">
                        수사 {idx + 1} {isComplete ? '✓' : ''}
                      </strong>
                      <span className="mt-0.5 text-[11px] sm:text-sm font-extrabold leading-tight break-keep">
                        {title}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Main Stage Content Card */}
              <section
                aria-live="polite"
                className="print-card rounded-2xl border border-[#d9dfda] bg-[#fffefb] p-4 sm:p-7 shadow-sm"
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
                    onExportStudentJson={handleExportStudentJson}
                    onRequestConfirm={requestConfirm}
                  />
                )}
              </section>

              {/* Bottom Student Status & Export Footer */}
              <section className="no-print rounded-2xl border border-[#d9dfda] bg-[#fffefb] p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-base font-extrabold text-[#20343d]">나의 수사 진행 현황</h3>
                    <p className="text-xs text-[#65747c]">
                      작성 내용은 교사(관리자) 기록실에 실시간으로 자동 저장되며, 백업용 JSON 파일로도 내려받을 수 있습니다.
                    </p>
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-[#1f6165]">
                    1차시 {done1.filter(Boolean).length}/5 · 2차시 {done2.filter(Boolean).length}/5 완료
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportStudentJson}
                    className="inline-flex min-h-[45px] items-center gap-2 rounded-xl bg-[#167561] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110"
                  >
                    <Download className="h-4 w-4" />
                    사건 파일 백업·저장 (JSON)
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex min-h-[45px] items-center gap-2 rounded-xl border border-[#b8cac4] bg-white px-4 py-2.5 text-sm font-bold text-[#295763] hover:bg-[#f4f2ec]"
                  >
                    <Printer className="h-4 w-4" />
                    현재 화면 인쇄 / PDF
                  </button>
                </div>
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
        <footer className="no-print mx-auto max-w-[1120px] px-4 py-6 text-center text-xs text-[#788580] leading-relaxed">
          <span className="font-extrabold tracking-widest text-[#41676b]">
            MATH DETECTIVE PROJECT
          </span>{' '}
          · 우연일까, 필연일까? · 관찰 → 추측 → 반례 → 증명
          <br />
          공통수학2 · 명제의 증명 | 학생 모드 · 교사(관리자 {ADMIN_TEACHER_EMAIL}) 승인제 통합 플랫폼
        </footer>

        {/* Custom Confirmation Modal */}
        {confirmDialog && (
          <div
            className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-[#d5dbd6] bg-[#fffefb] p-5 sm:p-6 shadow-xl">
              <h3 id="confirm-dialog-title" className="text-lg font-extrabold text-[#20343d]">
                {confirmDialog.title}
              </h3>
              <p className="mt-2 text-sm text-[#516b69] leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="min-h-[42px] rounded-xl border border-[#b8cac4] bg-white px-4 py-2 text-sm font-bold text-[#295763] hover:bg-[#f4f2ec]"
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
                  className="min-h-[42px] rounded-xl bg-[#215b61] px-4 py-2 text-sm font-bold text-white hover:brightness-110"
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
