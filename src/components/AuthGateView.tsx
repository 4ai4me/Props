import React, { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  ADMIN_TEACHER_EMAIL,
  StudentIdentityInput,
  buildSafeStudentKey,
  formatDeviceHashAsMac,
  isAuthorizedAdminEmail,
  normalizeBirthDate,
  validateStudentRegistrationInput,
} from '../utils/authLogic';
import { ClientNetworkIdentity, getClientNetworkIdentity } from '../utils/deviceFingerprint';
import { StudentRecord, cleanStudentState, createInitialStudentState } from '../utils/mathLogic';
import {
  ShieldCheck,
  UserCheck,
  Clock,
  Lock,
  LogIn,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  Wifi,
  RefreshCw,
} from 'lucide-react';

export interface FirestoreStudentRegistrationDoc {
  studentKey: string;
  school: string;
  grade: string;
  classNum: string;
  studentNum: string;
  birthDate: string;
  name: string;
  deviceHash: string;
  ipAddress: string;
  userAgent: string;
  status: 'pending' | 'approved' | 'rejected';
  worksheetJson: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface AuthGateViewProps {
  currentUser: User | null;
  onStudentApprovedLogin: (
    regDoc: FirestoreStudentRegistrationDoc,
    worksheet: StudentRecord
  ) => void;
  onAdminTeacherLogin: () => void;
}

const SAVED_STUDENT_KEY_STORAGE = 'math_detective_active_student_key_v1';

export const AuthGateView: React.FC<AuthGateViewProps> = ({
  currentUser,
  onStudentApprovedLogin,
  onAdminTeacherLogin,
}) => {
  const [portalMode, setPortalMode] = useState<'student' | 'teacher'>('student');
  const [studentSubTab, setStudentSubTab] = useState<'login' | 'register'>('login');

  const [form, setForm] = useState<StudentIdentityInput>({
    school: '',
    grade: '1',
    classNum: '',
    studentNum: '',
    birthDate: '',
    name: '',
  });

  const [netInfo, setNetInfo] = useState<ClientNetworkIdentity>({
    deviceHash: 'DEV_LOADING00000',
    ipAddress: '확인 중...',
    userAgent: '',
  });

  const [activeStudentKey, setActiveStudentKey] = useState<string>(() => {
    try {
      return localStorage.getItem(SAVED_STUDENT_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });

  const [pendingDoc, setPendingDoc] = useState<FirestoreStudentRegistrationDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'good' | 'warn' } | null>(null);

  useEffect(() => {
    getClientNetworkIdentity().then(setNetInfo);
  }, []);

  // Listen to activeStudentKey registration status in real time
  useEffect(() => {
    if (!activeStudentKey) {
      setPendingDoc(null);
      return;
    }
    const ref = doc(db, 'student_registrations', activeStudentKey);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setPendingDoc(null);
          return;
        }
        const data = snap.data() as FirestoreStudentRegistrationDoc;
        setPendingDoc(data);
        if (data.status === 'approved') {
          try {
            const parsed = cleanStudentState(JSON.parse(data.worksheetJson));
            onStudentApprovedLogin(data, parsed);
          } catch {
            const fresh = createInitialStudentState();
            fresh.group = `${data.school} ${data.grade}학년 ${data.classNum}반`;
            fresh.code = `${data.grade}${String(data.classNum).padStart(2, '0')}${String(data.studentNum).padStart(2, '0')} ${data.name}`;
            onStudentApprovedLogin(data, fresh);
          }
        }
      },
      (error) => {
        console.error('Registration listener error:', error);
      }
    );
    return () => unsub();
  }, [activeStudentKey, onStudentApprovedLogin]);

  // If teacher is already logged in with authorized email
  useEffect(() => {
    if (currentUser && isAuthorizedAdminEmail(currentUser.email, currentUser.emailVerified)) {
      if (portalMode === 'teacher') {
        onAdminTeacherLogin();
      }
    }
  }, [currentUser, portalMode, onAdminTeacherLogin]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const validation = validateStudentRegistrationInput(form);
    if (!validation.ok) {
      setStatusMsg({ text: validation.error || '입력값을 확인해 주세요.', type: 'warn' });
      return;
    }

    setLoading(true);
    try {
      const latestNet = await getClientNetworkIdentity();
      setNetInfo(latestNet);

      const sKey = buildSafeStudentKey(form);
      const normalizedBirth = normalizeBirthDate(form.birthDate);

      // 1. Check if this device (MAC/Hardware Hash) already registered another account
      const deviceLockRef = doc(db, 'device_locks', latestNet.deviceHash);
      let deviceSnap;
      try {
        deviceSnap = await getDoc(deviceLockRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `device_locks/${latestNet.deviceHash}`);
      }

      if (deviceSnap && deviceSnap.exists()) {
        const lockData = deviceSnap.data() as { studentKey?: string; ipAddress?: string };
        if (lockData.studentKey && lockData.studentKey !== sKey) {
          setStatusMsg({
            text: `중복 가입 방지: 현재 기기(MAC 식별자 ${formatDeviceHashAsMac(
              latestNet.deviceHash
            )} / IP ${latestNet.ipAddress})에는 이미 다른 학생의 가입 신청 내역이 등록되어 있습니다. 교사에게 문의하세요.`,
            type: 'warn',
          });
          setLoading(false);
          return;
        }
      }

      // 2. Check if this studentKey already exists
      const regRef = doc(db, 'student_registrations', sKey);
      let regSnap;
      try {
        regSnap = await getDoc(regRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `student_registrations/${sKey}`);
      }

      if (regSnap && regSnap.exists()) {
        const existing = regSnap.data() as FirestoreStudentRegistrationDoc;
        if (
          existing.name === form.name.trim() &&
          existing.birthDate === normalizedBirth
        ) {
          try {
            localStorage.setItem(SAVED_STUDENT_KEY_STORAGE, sKey);
          } catch {}
          setActiveStudentKey(sKey);
          setStatusMsg({
            text:
              existing.status === 'approved'
                ? '이미 승인된 계정입니다. 활동지 화면으로 이동합니다.'
                : '이미 가입 신청이 접수되어 관리자 승인 대기 중입니다.',
            type: existing.status === 'approved' ? 'good' : 'warn',
          });
          setLoading(false);
          return;
        } else {
          setStatusMsg({
            text: '이미 동일한 학교·학년·반·번호로 등록된 학생이 존재합니다. 학적 정보를 다시 확인하거나 교사에게 문의해 주세요.',
            type: 'warn',
          });
          setLoading(false);
          return;
        }
      }

      // 3. Create initial worksheet payload & atomic batch write (student_registrations + device_locks)
      const initialWorksheet = createInitialStudentState();
      initialWorksheet.group = `${form.school.trim()} ${form.grade.trim()}학년 ${form.classNum.trim()}반`.slice(0, 25);
      initialWorksheet.code = `${form.grade.trim()}${String(form.classNum.trim()).padStart(2, '0')}${String(form.studentNum.trim()).padStart(2, '0')}_${form.name.trim()}`.slice(0, 25);

      const batch = writeBatch(db);
      batch.set(regRef, {
        studentKey: sKey,
        school: form.school.trim().slice(0, 40),
        grade: String(parseInt(form.grade.trim(), 10)),
        classNum: String(parseInt(form.classNum.trim(), 10)),
        studentNum: String(parseInt(form.studentNum.trim(), 10)),
        birthDate: normalizedBirth.slice(0, 12),
        name: form.name.trim().slice(0, 25),
        deviceHash: latestNet.deviceHash,
        ipAddress: latestNet.ipAddress,
        userAgent: latestNet.userAgent,
        status: 'pending',
        worksheetJson: JSON.stringify(initialWorksheet),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(deviceLockRef, {
        deviceHash: latestNet.deviceHash,
        studentKey: sKey,
        ipAddress: latestNet.ipAddress,
        createdAt: serverTimestamp(),
      });

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `student_registrations/${sKey}`);
      }

      try {
        localStorage.setItem(SAVED_STUDENT_KEY_STORAGE, sKey);
      } catch {}
      setActiveStudentKey(sKey);
      setStatusMsg({
        text: '가입 신청이 정상 접수되었습니다! 관리자(교사) 승인 후 즉시 활동지가 열립니다.',
        type: 'good',
      });
    } catch (err) {
      setStatusMsg({
        text: '가입 신청 처리 중 오류가 발생했습니다. 입력 정보를 다시 확인해 주세요.',
        type: 'warn',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const validation = validateStudentRegistrationInput(form);
    if (!validation.ok) {
      setStatusMsg({ text: validation.error || '입력값을 확인해 주세요.', type: 'warn' });
      return;
    }

    setLoading(true);
    try {
      const sKey = buildSafeStudentKey(form);
      const normalizedBirth = normalizeBirthDate(form.birthDate);
      const regRef = doc(db, 'student_registrations', sKey);

      let snap;
      try {
        snap = await getDoc(regRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `student_registrations/${sKey}`);
      }

      if (!snap || !snap.exists()) {
        setStatusMsg({
          text: '일치하는 가입 신청 내역이 없습니다. 먼저 [학생 신규 가입 신청] 탭에서 가입을 신청해 주세요.',
          type: 'warn',
        });
        setLoading(false);
        return;
      }

      const data = snap.data() as FirestoreStudentRegistrationDoc;
      if (data.name !== form.name.trim() || data.birthDate !== normalizedBirth) {
        setStatusMsg({
          text: '이름 또는 생년월일이 등록된 정보와 일치하지 않습니다.',
          type: 'warn',
        });
        setLoading(false);
        return;
      }

      try {
        localStorage.setItem(SAVED_STUDENT_KEY_STORAGE, sKey);
      } catch {}
      setActiveStudentKey(sKey);

      if (data.status === 'pending') {
        setStatusMsg({
          text: '현재 관리자(교사)의 가입 승인을 기다리고 있습니다. 교사가 승인하면 자동으로 입장됩니다.',
          type: 'warn',
        });
      } else if (data.status === 'rejected') {
        setStatusMsg({
          text: '가입 신청이 반려되었습니다. 담당 교사에게 문의해 주세요.',
          type: 'warn',
        });
      }
    } catch {
      setStatusMsg({
        text: '학생 정보 조회 중 오류가 발생했습니다.',
        type: 'warn',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleTeacherLogin = async () => {
    setStatusMsg(null);
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      if (!isAuthorizedAdminEmail(user.email, user.emailVerified)) {
        await signOut(auth);
        setStatusMsg({
          text: `접근 거부: 교사(관리자) 모드는 지정된 유일 관리자 계정(${ADMIN_TEACHER_EMAIL})으로만 로그인할 수 있습니다. (현재 시도 계정: ${
            user.email || '알 수 없음'
          })`,
          type: 'warn',
        });
        setLoading(false);
        return;
      }
      onAdminTeacherLogin();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      const msg = err instanceof Error ? err.message : '로그인 취소 또는 오류';
      if (code === 'auth/unauthorized-domain') {
        setStatusMsg({
          text: `도메인 승인 필요: 현재 호스팅 도메인(${window.location.hostname})에서 Google 로그인을 사용하려면 Firebase 콘솔(Authentication → Settings → Authorized domains)에 '${window.location.hostname}' 도메인을 추가해 주세요.`,
          type: 'warn',
        });
      } else {
        setStatusMsg({
          text: `Google 인증 안내 (${ADMIN_TEACHER_EMAIL} 전용): ${msg}`,
          type: 'warn',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      {/* Mode Switcher: Student Mode vs Teacher Admin Mode */}
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#c8d8ce] bg-[#fffcf6] p-2 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setPortalMode('student');
            setStatusMsg(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm sm:text-base font-extrabold transition-all ${
            portalMode === 'student'
              ? 'bg-[#183541] text-white shadow-sm'
              : 'text-[#20343d] hover:bg-[#e8f2f1]'
          }`}
        >
          <UserCheck className="h-5 w-5" />
          학생 모드 (입장 · 가입 신청)
        </button>

        <button
          type="button"
          onClick={() => {
            setPortalMode('teacher');
            setStatusMsg(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm sm:text-base font-extrabold transition-all ${
            portalMode === 'teacher'
              ? 'bg-[#183541] text-white shadow-sm'
              : 'text-[#20343d] hover:bg-[#e8f2f1]'
          }`}
        >
          <ShieldCheck className="h-5 w-5" />
          교사(관리자) 모드
        </button>
      </div>

      {statusMsg && (
        <div
          role="status"
          className={`mt-4 flex items-start gap-2.5 rounded-xl border p-4 text-sm font-bold ${
            statusMsg.type === 'good'
              ? 'border-[#9cd6c1] bg-[#e5f5ed] text-[#075e49]'
              : 'border-[#e7c989] bg-[#fff4da] text-[#705012]'
          }`}
        >
          {statusMsg.type === 'good' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {portalMode === 'student' ? (
        <div className="mt-5 rounded-2xl border border-[#d9dfda] bg-[#fffefb] p-5 sm:p-8 shadow-sm">
          {/* If student has an active pending/rejected registration on this device, show live status card */}
          {pendingDoc && pendingDoc.status !== 'approved' && (
            <div className="mb-6 rounded-2xl border border-[#e7c989] bg-[#fff9eb] p-5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#945e18]">
                  <Clock className="h-5 w-5" />
                  {pendingDoc.status === 'pending'
                    ? '관리자(교사) 가입 승인 대기 중'
                    : '가입 신청 반려됨'}
                </div>
                <span className="rounded-lg bg-[#fff0d7] px-2.5 py-1 text-xs font-extrabold text-[#91601c]">
                  {pendingDoc.status === 'pending' ? '승인 대기 (실시간 연동)' : '반려됨'}
                </span>
              </div>
              <div className="mt-3 text-sm text-[#20343d] space-y-1">
                <div>
                  <strong>신청 학생:</strong> {pendingDoc.school} {pendingDoc.grade}학년{' '}
                  {pendingDoc.classNum}반 {pendingDoc.studentNum}번 <strong>{pendingDoc.name}</strong> (생년월일: {pendingDoc.birthDate})
                </div>
                <div className="text-xs text-[#65747c] mono">
                  등록 기기 MAC 식별자: {formatDeviceHashAsMac(pendingDoc.deviceHash)} · 등록 IP: {pendingDoc.ipAddress}
                </div>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-[#705012]">
                선생님(관리자)이 교사 모드에서 <strong>[가입 승인]</strong>을 누르면 새로고침 없이 즉시 수학 탐정단 활동지 화면이 열립니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem(SAVED_STUDENT_KEY_STORAGE);
                    } catch {}
                    setActiveStudentKey('');
                    setPendingDoc(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#b8cac4] bg-white px-3.5 py-2 text-xs font-bold text-[#295763] hover:bg-[#f4f2ec]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  다른 학적 정보로 조회 / 전환
                </button>
              </div>
            </div>
          )}

          {/* Student Sub-tabs: Login vs Sign-up Request */}
          <div className="flex gap-2 border-b border-[#e2e6e1] pb-4 mb-5">
            <button
              type="button"
              onClick={() => {
                setStudentSubTab('login');
                setStatusMsg(null);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-colors ${
                studentSubTab === 'login'
                  ? 'bg-[#215b61] text-white'
                  : 'bg-[#f4f2ec] text-[#20343d] hover:bg-[#e2efea]'
              }`}
            >
              <LogIn className="h-4 w-4" />
              승인된 학생 입장 (로그인)
            </button>

            <button
              type="button"
              onClick={() => {
                setStudentSubTab('register');
                setStatusMsg(null);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-colors ${
                studentSubTab === 'register'
                  ? 'bg-[#215b61] text-white'
                  : 'bg-[#f4f2ec] text-[#20343d] hover:bg-[#e2efea]'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              학생 신규 가입 신청
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#20343d]">
              {studentSubTab === 'login'
                ? '학생 탐정단 입장하기'
                : '학생 탐정단 신규 가입 신청'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#65747c]">
              {studentSubTab === 'login'
                ? '가입 신청 후 교사(관리자)의 승인이 완료된 학생은 아래 정보를 입력하여 활동지를 시작하세요.'
                : '학교, 학년, 반, 번호, 생년월일, 이름을 입력해 가입을 신청하세요. 기기 고유 식별값(MAC) 및 IP가 함께 기록되어 중복 가입이 방지되며, 관리자 승인 후 가입 처리됩니다.'}
            </p>
          </div>

          <form
            onSubmit={studentSubTab === 'login' ? handleStudentLoginSubmit : handleRegisterSubmit}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="stu-school" className="block text-sm font-bold text-[#20343d] mb-1">
                  학교 이름
                </label>
                <input
                  id="stu-school"
                  type="text"
                  required
                  maxLength={40}
                  value={form.school}
                  onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))}
                  placeholder="예: 대한고등학교"
                  className="w-full rounded-xl border border-[#c9d2d1] bg-white px-3.5 py-2.5 text-base"
                />
              </div>

              <div>
                <label htmlFor="stu-name" className="block text-sm font-bold text-[#20343d] mb-1">
                  학생 이름
                </label>
                <input
                  id="stu-name"
                  type="text"
                  required
                  maxLength={25}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="예: 홍길동"
                  className="w-full rounded-xl border border-[#c9d2d1] bg-white px-3.5 py-2.5 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="stu-grade" className="block text-sm font-bold text-[#20343d] mb-1">
                  학년
                </label>
                <select
                  id="stu-grade"
                  value={form.grade}
                  onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
                  className="w-full rounded-xl border border-[#c9d2d1] bg-white px-3 py-2.5 text-base mono font-semibold"
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={String(g)}>
                      {g}학년
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="stu-class" className="block text-sm font-bold text-[#20343d] mb-1">
                  반
                </label>
                <input
                  id="stu-class"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={5}
                  value={form.classNum}
                  onChange={(e) => setForm((p) => ({ ...p, classNum: e.target.value.replace(/[^0-9]/g, '') }))}
                  placeholder="예: 3"
                  className="w-full rounded-xl border border-[#c9d2d1] bg-white px-3.5 py-2.5 text-base mono font-semibold placeholder:font-normal"
                />
              </div>

              <div>
                <label htmlFor="stu-num" className="block text-sm font-bold text-[#20343d] mb-1">
                  번호
                </label>
                <input
                  id="stu-num"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={5}
                  value={form.studentNum}
                  onChange={(e) => setForm((p) => ({ ...p, studentNum: e.target.value.replace(/[^0-9]/g, '') }))}
                  placeholder="예: 15"
                  className="w-full rounded-xl border border-[#c9d2d1] bg-white px-3.5 py-2.5 text-base mono font-semibold placeholder:font-normal"
                />
              </div>
            </div>

            <div>
              <label htmlFor="stu-birth" className="block text-sm font-bold text-[#20343d] mb-1">
                생년월일 (8자리 또는 6자리)
              </label>
              <input
                id="stu-birth"
                type="text"
                inputMode="numeric"
                required
                maxLength={12}
                value={form.birthDate}
                onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))}
                placeholder="예: 20090512 또는 2009-05-12"
                className="w-full rounded-xl border border-[#c9d2d1] bg-white px-3.5 py-2.5 text-base mono font-semibold placeholder:font-normal"
              />
            </div>

            {/* Device / MAC & IP Duplicate Guard Info Box */}
            <div className="rounded-xl border border-[#d2e3dc] bg-[#f3f8f5] p-3.5 text-xs text-[#365249] space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-[#184f44]">
                <Fingerprint className="h-4 w-4" />
                중복 가입 방지용 기기(MAC 식별자) · 네트워크 IP 자동 인증
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mono text-[11px] sm:text-xs">
                <span>
                  기기 MAC 식별값: <strong>{formatDeviceHashAsMac(netInfo.deviceHash)}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Wifi className="h-3.5 w-3.5" /> 공인 IP: <strong>{netInfo.ipAddress}</strong>
                </span>
              </div>
              <p className="text-[11px] text-[#516b69]">
                * 동일 기기 및 동일 학번으로 중복 신청하는 것을 방지하며, 교사 승인 시 위 기기 정보가 함께 대조됩니다.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] rounded-xl bg-[#215b61] px-5 py-3 text-base font-extrabold text-white hover:brightness-110 disabled:opacity-50"
              >
                {loading
                  ? '처리 중...'
                  : studentSubTab === 'login'
                  ? '승인 확인 후 학생 모드 입장하기'
                  : '관리자 승인 요청 및 가입 신청하기'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-[#d9dfda] bg-[#fffefb] p-5 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e4f0e9] text-[#1e5661] shrink-0">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-extrabold tracking-wider text-[#ad7b37] uppercase">
                SOLE ADMINISTRATOR AUTHENTICATION
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#20343d]">
                교사(관리자) 전용 Google 이메일 인증
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#65747c]">
                교사 모드는 유일한 관리자 이메일 계정(<strong className="mono text-[#183541]">{ADMIN_TEACHER_EMAIL}</strong>)으로 Google 인증을 완료한 경우에만 열립니다.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#e0e3dd] bg-[#f7f9f5] p-4 text-xs sm:text-sm text-[#3c544f] space-y-1.5">
            <div>• <strong>가입 신청 학생 승인 관리:</strong> 학생이 신청한 학교/학년/반/번호/생년월일/이름과 기기 MAC 식별값·IP 중복 여부를 확인한 후 <strong>[승인]</strong> 또는 <strong>[반려]</strong> 처리합니다.</div>
            <div>• <strong>실시간 수사 기록실 연동:</strong> 승인된 학생들이 작성하는 1·2차시 탐구 답안과 루브릭 평정, 피드백 PDF 인쇄, CSV 내려받기를 통합 관리합니다.</div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleTeacherLogin}
            className="w-full min-h-[50px] inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#183541] px-6 py-3.5 text-base font-extrabold text-white hover:bg-[#214858] transition-colors"
          >
            <ShieldCheck className="h-5 w-5 text-[#f7d59b]" />
            {loading
              ? 'Google 계정 확인 중...'
              : `Google 계정(${ADMIN_TEACHER_EMAIL})으로 관리자 인증하기`}
          </button>
        </div>
      )}
    </div>
  );
};
