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
} from 'lucide-react';

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
            x.evaluation =
              old.evaluation || { scores: [null, null, null, null], feedback: '', nextStep: '' };
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
      '교사 메모',
      ...EVAL_CRITERIA.map((t) => `교사 평정_${t}`),
      '학생 피드백',
      '다음 탐구 제안',
    ];

    const rows = records.map((x) => {
      const a = x.l1;
      const b = x.l2;
      const ev = ensureTeacherEval(x);
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
        x.teacherMemo || '',
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
    a.download = '수학탐정단_1-2차시_학급응답.csv';
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
    .filter((r) => (approvalFilter === 'all' ? true : r.status === approvalFilter))
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

  const count = records.length;
  const complete1 = records.filter((x) => evaluateRubricL1(x.l1).every(Boolean)).length;
  const complete2 = records.filter((x) => evaluateRubricL2(x.l2).every(Boolean)).length;
  const bothReflected = records.filter(
    (x) => x.l1.reflection.trim() && x.l2.reflection.trim()
  ).length;

  const sortedRecords = records
    .slice()
    .sort(
      (a, b) =>
        (a.group || '').localeCompare(b.group || '', 'ko') ||
        (a.code || '').localeCompare(b.code || '', 'ko')
    );

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
    ['2차시 반례 검사 2회 이상', records.filter((x) => x.l2.checks.length >= 2).length],
    ['2차시 정당화 기록', records.filter((x) => evaluateRubricL2(x.l2)[4]).length],
    [
      '두 차시 성찰 작성',
      records.filter((x) => x.l1.reflection.trim() && x.l2.reflection.trim()).length,
    ],
  ];

  const decisions: [string, number, string][] = [
    ['참', records.filter((x) => x.l2.decision === 'true').length, '#249782'],
    ['거짓', records.filter((x) => x.l2.decision === 'false').length, '#d49b3f'],
    ['미해결', records.filter((x) => x.l2.decision === 'unknown').length, '#8795ad'],
    ['미작성', records.filter((x) => !x.l2.decision).length, '#426cc1'],
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

  return (
    <div className="space-y-6">
      {/* SECTION 1: Student Registration Approval Management (Admin Only) */}
      <div className="rounded-2xl border border-[#c8d8ce] bg-[#fffefb] p-5 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs font-extrabold tracking-widest text-[#187361] uppercase">
              STUDENT REGISTRATION &amp; DUPLICATE GUARD · ADMIN ({adminEmail})
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#20343d]">
              학생 가입 신청 승인 · 기기(MAC 주소) 중복 관리
            </h2>
            <p className="mt-1 text-sm text-[#65747c]">
              학생이 <strong>학교 / 학년 / 반 / 번호 / 생년월일 / 이름</strong>으로 가입을 신청하면 이곳에 실시간으로 표시됩니다.
              학교 공용 네트워크 환경을 고려하여 IP는 검사하지 않으며, <strong>기기 고유 MAC 주소 식별자</strong> 기준으로만 중복을 식별합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setApprovalFilter('all')}
              className={`rounded-xl px-3.5 py-2 text-xs font-extrabold ${
                approvalFilter === 'all'
                  ? 'bg-[#183541] text-white'
                  : 'bg-[#f4f2ec] text-[#20343d]'
              }`}
            >
              전체 ({cloudRegistrations.length})
            </button>
            <button
              type="button"
              onClick={() => setApprovalFilter('pending')}
              className={`rounded-xl px-3.5 py-2 text-xs font-extrabold ${
                approvalFilter === 'pending'
                  ? 'bg-[#945e18] text-white'
                  : 'bg-[#fff4da] text-[#705012]'
              }`}
            >
              승인 대기 ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setApprovalFilter('approved')}
              className={`rounded-xl px-3.5 py-2 text-xs font-extrabold ${
                approvalFilter === 'approved'
                  ? 'bg-[#187361] text-white'
                  : 'bg-[#e5f5ed] text-[#075e49]'
              }`}
            >
              승인 완료 ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setApprovalFilter('rejected')}
              className={`rounded-xl px-3.5 py-2 text-xs font-extrabold ${
                approvalFilter === 'rejected'
                  ? 'bg-[#af4550] text-white'
                  : 'bg-[#fff1f1] text-[#873640]'
              }`}
            >
              반려됨 ({rejectedCount})
            </button>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={handleBulkApprovePending}
                className="inline-flex items-center gap-1 rounded-xl bg-[#167561] px-3.5 py-2 text-xs font-extrabold text-white hover:brightness-110"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                대기 학생 일괄 승인 ({pendingCount}명)
              </button>
            )}
            <button
              type="button"
              onClick={handleManualRefreshRegistrations}
              className="inline-flex items-center gap-1 rounded-xl border border-[#b8cac4] bg-white px-3 py-2 text-xs font-extrabold text-[#295763] hover:bg-[#f4f2ec]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              목록 새로고침
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-[#e6ebf1] bg-white">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#f5f8fd] text-[#53627c] text-xs font-extrabold border-b border-[#e6ebf1]">
                <th className="py-3 px-3 text-left">상태</th>
                <th className="py-3 px-3 text-left">학교 / 학년 / 반 / 번호</th>
                <th className="py-3 px-3 text-left">이름</th>
                <th className="py-3 px-3 text-left">생년월일</th>
                <th className="py-3 px-3 text-left">기기 고유 MAC 주소 식별자 (중복 점검)</th>
                <th className="py-3 px-3 text-left">관리자 승인 처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf1]">
              {filteredRegistrations.length > 0 ? (
                filteredRegistrations.map((reg) => {
                  const isDupDev = reg.deviceHash && deviceCounts[reg.deviceHash] > 1;
                  return (
                    <tr key={reg.studentKey} className="hover:bg-[#f9fbf9]">
                      <td className="py-3 px-3">
                        {reg.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#fff0d7] px-2.5 py-1 text-xs font-extrabold text-[#91601c]">
                            <Clock className="h-3.5 w-3.5" /> 승인 대기
                          </span>
                        )}
                        {reg.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#def3ea] px-2.5 py-1 text-xs font-extrabold text-[#116951]">
                            <UserCheck className="h-3.5 w-3.5" /> 승인됨
                          </span>
                        )}
                        {reg.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#fff1f1] px-2.5 py-1 text-xs font-extrabold text-[#873640]">
                            <XCircle className="h-3.5 w-3.5" /> 반려됨
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {reg.school} {reg.grade}학년 {reg.classNum}반 {reg.studentNum}번
                      </td>
                      <td className="py-3 px-3 font-extrabold text-[#20343d]">{reg.name}</td>
                      <td className="py-3 px-3 mono text-xs">{reg.birthDate}</td>
                      <td className="py-3 px-3 mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Fingerprint className="h-3.5 w-3.5 text-[#1e5661]" />
                          <span>MAC: {formatDeviceHashAsMac(reg.deviceHash)}</span>
                          {isDupDev && (
                            <span className="inline-flex items-center gap-0.5 text-[#af4550] font-bold">
                              <ShieldAlert className="h-3.5 w-3.5" /> 동일 MAC 중복 ({deviceCounts[reg.deviceHash]}명)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {reg.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentStatus(reg, 'approved')}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#167561] px-3 py-1.5 text-xs font-bold text-white hover:brightness-110"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              가입 승인
                            </button>
                          )}
                          {reg.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentStatus(reg, 'rejected')}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#e2b4b9] bg-[#fff1f1] px-2.5 py-1.5 text-xs font-bold text-[#873640] hover:bg-[#fde2e4]"
                            >
                              반려
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteStudentRegistration(reg)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#c9d2d1] bg-white px-2.5 py-1.5 text-xs font-bold text-[#65747c] hover:bg-[#f4f2ec]"
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
                  <td colSpan={6} className="py-6 px-4 text-center text-[#65747c]">
                    현재 해당 상태의 학생 가입 신청 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Header & Controls Card */}
      <div className="rounded-2xl border border-[#d9dfda] bg-[#fffefb] p-5 sm:p-7 shadow-sm">
        <div className="text-xs font-extrabold tracking-widest text-[#ad7b37] uppercase">
          DETECTIVE HQ · TEACHER&apos;S DESK
        </div>
        <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#20343d]">교사용 수사 기록실</h2>
        <p className="mt-1 text-sm sm:text-base text-[#65747c]">
          승인된 학생들이 작성한 1·2차시 탐구 기록이 실시간으로 연동되며, 외부 JSON 파일을 추가로 불러오거나 CSV로 내려받을 수도 있습니다.
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
            className="inline-flex min-h-[45px] items-center gap-2 rounded-xl bg-[#215b61] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110"
          >
            <Upload className="h-4 w-4" />
            학생 JSON 여러 개 불러오기
          </button>

          <button
            type="button"
            onClick={handleLoadSampleData}
            className="inline-flex min-h-[45px] items-center gap-2 rounded-xl bg-[#e2efea] px-4 py-2.5 text-sm font-bold text-[#1c6166] hover:bg-[#d1e6de]"
          >
            <Sparkles className="h-4 w-4" />
            예시 학생 데이터(2명) 체험하기
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex min-h-[45px] items-center gap-2 rounded-xl border border-[#b8cac4] bg-white px-4 py-2.5 text-sm font-bold text-[#295763] hover:bg-[#f4f2ec]"
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
              className="inline-flex min-h-[45px] items-center gap-1.5 rounded-xl border border-[#e2b4b9] bg-[#fff1f1] px-4 py-2.5 text-sm font-bold text-[#873640] hover:bg-[#fde2e4]"
            >
              <Trash2 className="h-4 w-4" />
              로컬 수합 목록 지우기
            </button>
          )}
        </div>

        <div
          role="status"
          className={`mt-4 rounded-xl p-3.5 text-sm ${
            notice.type === 'good'
              ? 'bg-[#e5f5ed] text-[#075e49] border border-[#a8d9ca]'
              : notice.type === 'warn'
              ? 'bg-[#fff4da] text-[#705012] border border-[#e7c989]'
              : 'bg-[#f2f6fd] text-[#20343d] border border-[#cbd7e6]'
          }`}
        >
          {notice.text}
        </div>

        {/* Summary KPI Tiles */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [count, '수합 학생 (명)'],
            [complete1, '1차시 주요 항목 완성'],
            [complete2, '2차시 주요 항목 완성'],
            [bothReflected, '두 차시 성찰 작성'],
          ].map(([num, label], idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#d2e3dc] bg-[#edf5f0] p-3.5 text-center"
            >
              <strong className="block text-2xl font-extrabold text-[#22666b] mono">{num}</strong>
              <span className="text-xs font-semibold text-[#516b69]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Analytics Dashboard */}
      <div className="rounded-2xl border border-[#d9dfda] bg-[#fffefb] p-5 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#20343d]">학급 탐구 역량 대시보드</h3>
          <span className="text-xs text-[#65747c]">
            제출 기록 기반 자동 집계 · 역량 평정은 교사가 직접 입력
          </span>
        </div>

        {count === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c9d2d1] p-8 text-center text-sm text-[#65747c]">
            승인된 학생이 활동을 시작하거나 상단의 <strong>[예시 학생 데이터(2명) 체험하기]</strong> 버튼을 누르면 학급별 탐구 지표 그래프가 나타납니다.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#dbe4ee] bg-white p-4">
              <h4 className="font-bold text-sm sm:text-base text-[#20343d] mb-3">활동 완료 현황</h4>
              <div className="space-y-2.5">
                {checkRows.map(([title, n]) => {
                  const pct = count ? Math.round((n / count) * 100) : 0;
                  return (
                    <div key={title}>
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{title}</span>
                        <strong className="mono">
                          {n}명 ({pct}%)
                        </strong>
                      </div>
                      <div className="mt-1 h-3 rounded-full bg-[#e9edf5] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#215b61] to-[#187361]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-[#65747c]">
                기록 여부의 집계이며 증명의 정확성이나 성취수준을 자동 판정하지 않습니다.
              </p>
            </div>

            <div className="rounded-xl border border-[#dbe4ee] bg-white p-4">
              <h4 className="font-bold text-sm sm:text-base text-[#20343d] mb-3">2차시 학생 판단 분포</h4>
              <div className="flex items-center gap-6 flex-wrap">
                <div
                  className="relative h-32 w-32 rounded-full shrink-0"
                  style={{ background: count ? `conic-gradient(${slices})` : '#e5eaf2' }}
                >
                  <div className="absolute inset-6 rounded-full bg-white grid place-items-center font-extrabold text-sm mono">
                    {count}명
                  </div>
                </div>
                <div className="space-y-1.5 text-xs sm:text-sm">
                  {decisions.map(([label, n, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span>
                        {label}: <strong className="mono">{n}명</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-[#65747c]">
                참·거짓은 학생이 선택한 판단이며 정답률이 아닙니다.
              </p>
            </div>

            <div className="rounded-xl border border-[#dbe4ee] bg-white p-4">
              <h4 className="font-bold text-sm sm:text-base text-[#20343d] mb-3">2차시 탐구주제 선택 현황</h4>
              <div className="space-y-2.5">
                {topicRows.map(([title, n]) => {
                  const pct = count ? Math.round((n / count) * 100) : 0;
                  return (
                    <div key={title}>
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{title}</span>
                        <strong className="mono">
                          {n}명 ({pct}%)
                        </strong>
                      </div>
                      <div className="mt-1 h-3 rounded-full bg-[#e9edf5] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#c99d57] to-[#27947c]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[#dbe4ee] bg-white p-4">
              <h4 className="font-bold text-sm sm:text-base text-[#20343d] mb-3">교사 평정 평균 (0~3점)</h4>
              <div className="space-y-2.5">
                {means.map((m) => (
                  <div key={m.title}>
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{m.title}</span>
                      <strong className="mono">
                        {m.mean === null ? '평정 없음' : `${m.mean.toFixed(2)} / 3`} ({m.count}명)
                      </strong>
                    </div>
                    <div className="mt-1 h-3 rounded-full bg-[#e9edf5] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#315cb7] to-[#15998e]"
                        style={{ width: `${m.mean === null ? 0 : (m.mean / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-[#65747c]">
                0: 증거 부족 / 1: 시작 단계 / 2: 부분적 수행 / 3: 충분한 수행.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: Student Records Table & Detail View */}
      <div className="rounded-2xl border border-[#d9dfda] bg-[#fffefb] p-5 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#20343d] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1e5661]" />
            탐정별 사건 기록
          </h3>
          <span className="text-xs text-[#65747c]">
            승인된 학생 답안 및 불러온 파일이 함께 표시됩니다.
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#e6ebf1] bg-white">
          <table className="w-full min-w-[740px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#f5f8fd] text-[#53627c] text-xs font-extrabold border-b border-[#e6ebf1]">
                <th className="py-3 px-3 text-left">학급</th>
                <th className="py-3 px-3 text-left">식별코드(학번·이름)</th>
                <th className="py-3 px-3 text-left">1차시 사례</th>
                <th className="py-3 px-3 text-left">1차시 증명</th>
                <th className="py-3 px-3 text-left">2차시 주제</th>
                <th className="py-3 px-3 text-left">2차시 판단</th>
                <th className="py-3 px-3 text-left">2차시 기록</th>
                <th className="py-3 px-3 text-left">비교</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf1]">
              {sortedRecords.length > 0 ? (
                sortedRecords.map((x) => {
                  const k = studentKey(x);
                  const isSel = k === selectedKey;
                  const tDef = x.l2.topic ? TOPICS[x.l2.topic as TopicId] : null;
                  return (
                    <tr key={k} className={isSel ? 'bg-[#eef7f1]' : 'hover:bg-[#f9fbf9]'}>
                      <td className="py-3 px-3">{x.group || '—'}</td>
                      <td className="py-3 px-3 font-bold mono">{x.code || '미입력'}</td>
                      <td className="py-3 px-3 mono">{x.l1.examples.length}개</td>
                      <td className="py-3 px-3 mono">
                        {x.l1.proofVerified.filter(Boolean).length}/4 + 서술
                      </td>
                      <td className="py-3 px-3">{tDef?.tag || '미선택'}</td>
                      <td className="py-3 px-3 font-semibold">
                        {({ true: '참', false: '거짓', unknown: '미해결' } as Record<string, string>)[
                          x.l2.decision
                        ] || '미작성'}
                      </td>
                      <td className="py-3 px-3 mono">
                        {evaluateRubricL2(x.l2).filter(Boolean).length}/6
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectStudent(k);
                            setTimeout(() => {
                              detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 50);
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                            isSel
                              ? 'bg-[#1e5661] text-white'
                              : 'border border-[#aabce4] bg-[#eef3ff] text-[#2b4892] hover:bg-[#dce6ff]'
                          }`}
                        >
                          {isSel ? '선택됨' : '상세 비교'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 px-4 text-center text-[#65747c]">
                    불러온 학생 자료가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedStudent && (
          <div ref={detailRef} className="mt-6 pt-6 border-t border-[#dcded7] space-y-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#20343d]">
                {selectedStudent.code || '미입력'} 학생의 1·2차시 비교 ({selectedStudent.group || '학급 미입력'})
              </h3>
              <button
                type="button"
                onClick={() => onPrintStudentReport(selectedStudent)}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#167561] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:brightness-110"
              >
                <Printer className="h-4 w-4" />
                이 학생 피드백 PDF 인쇄
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[#e0e3dd] bg-white p-4 space-y-3">
                <div className="text-xs font-extrabold text-[#1e5661]">1차시 · 교사 안내형 수사</div>
                {[
                  ['추측한 명제', selectedStudent.l1.claim],
                  ['사례 확인의 한계', selectedStudent.l1.limits],
                  ['일반적인 증명 서술', selectedStudent.l1.proofText],
                  ['탐구 성찰', selectedStudent.l1.reflection],
                  ['다음 질문: 16으로 바꾸면?', selectedStudent.l1.bridge],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-xs font-bold text-[#516b69]">{label}</div>
                    <div className="mt-1 rounded-lg border border-[#e5e4da] bg-[#faf9f5] p-2.5 text-xs sm:text-sm whitespace-pre-wrap">
                      {val || '미작성'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[#e0e3dd] bg-white p-4 space-y-3">
                <div className="text-xs font-extrabold text-[#187361]">2차시 · 학생 주도형 수사</div>
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
                  ['동료 피드백', selectedStudent.l2.peerComment],
                  ['수정 사항', selectedStudent.l2.revision],
                  ['2차시 성찰', selectedStudent.l2.reflection],
                  ['후속 탐구 질문', selectedStudent.l2.nextQuestion],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-xs font-bold text-[#516b69]">{label}</div>
                    <div className="mt-1 rounded-lg border border-[#e5e4da] bg-[#faf9f5] p-2.5 text-xs sm:text-sm whitespace-pre-wrap">
                      {val || '미작성'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e0e3dd] bg-[#f7f9f5] p-4 sm:p-6 space-y-5">
              <div>
                <label htmlFor="teacherMemo" className="block text-sm font-bold text-[#20343d] mb-1">
                  학습 변화 관찰 메모
                </label>
                <textarea
                  id="teacherMemo"
                  rows={3}
                  value={selectedStudent.teacherMemo || ''}
                  onChange={(e) =>
                    updateSelectedStudent((item) => ({ ...item, teacherMemo: e.target.value }))
                  }
                  placeholder="예: 1차시는 사례 나열에 머물렀지만 2차시는 조건에 맞는 반례를 직접 구성함."
                  className="w-full rounded-xl border border-[#c9d2d1] bg-white p-3 text-base"
                />
              </div>

              <div className="rounded-xl border border-[#e0e3dd] bg-white p-4 sm:p-5 space-y-4">
                <h4 className="text-base font-bold text-[#20343d]">학생 역량 평가 및 맞춤 피드백</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  {EVAL_CRITERIA.map((title, i) => {
                    const ev = ensureTeacherEval(selectedStudent);
                    return (
                      <div key={title}>
                        <label htmlFor={`eval${i}`} className="block text-xs sm:text-sm font-bold text-[#20343d]">
                          {title}
                          <span className="block text-xs font-normal text-[#65747c]">
                            {EVAL_DESCRIPTIONS[i]}
                          </span>
                        </label>
                        <select
                          id={`eval${i}`}
                          value={ev.scores[i] === null ? '' : String(ev.scores[i])}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            updateSelectedStudent((item) => {
                              const currentEv = ensureTeacherEval(item);
                              const nextScores = [...currentEv.scores];
                              nextScores[i] = val;
                              return {
                                ...item,
                                evaluation: { ...currentEv, scores: nextScores },
                              };
                            });
                          }}
                          className="mt-1.5 w-full rounded-xl border border-[#c9d2d1] bg-white px-3 py-2.5 text-base"
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
                  <label htmlFor="teacherFeedback" className="block text-sm font-bold text-[#20343d] mb-1.5">
                    학생에게 전달할 구체적인 피드백
                  </label>
                  <textarea
                    id="teacherFeedback"
                    rows={3}
                    value={ensureTeacherEval(selectedStudent).feedback}
                    onChange={(e) =>
                      updateSelectedStudent((item) => {
                        const ev = ensureTeacherEval(item);
                        return { ...item, evaluation: { ...ev, feedback: e.target.value } };
                      })
                    }
                    placeholder="잘한 점과 이를 뒷받침하는 학생의 탐구 기록을 적어 주세요."
                    className="w-full rounded-xl border border-[#c9d2d1] bg-white p-3 text-base"
                  />
                </div>

                <div>
                  <label htmlFor="teacherNext" className="block text-sm font-bold text-[#20343d] mb-1.5">
                    다음 탐구를 위한 제안
                  </label>
                  <textarea
                    id="teacherNext"
                    rows={2}
                    value={ensureTeacherEval(selectedStudent).nextStep}
                    onChange={(e) =>
                      updateSelectedStudent((item) => {
                        const ev = ensureTeacherEval(item);
                        return { ...item, evaluation: { ...ev, nextStep: e.target.value } };
                      })
                    }
                    placeholder="예: 반례가 가정을 만족하는지 먼저 확인하고, 문자로 일반화해 보세요."
                    className="w-full rounded-xl border border-[#c9d2d1] bg-white p-3 text-base"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onPrintStudentReport(selectedStudent)}
                    className="inline-flex min-h-[45px] items-center gap-2 rounded-xl bg-[#167561] px-5 py-2.5 text-sm font-bold text-white hover:brightness-110"
                  >
                    <Printer className="h-4 w-4" />
                    이 학생 피드백 PDF 인쇄
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checklist Card */}
      <div className="rounded-2xl border border-[#d9dfda] bg-[#fffefb] p-5 sm:p-7 shadow-sm">
        <h3 className="text-base sm:text-lg font-extrabold text-[#20343d]">교사용 수사 체크리스트</h3>
        <p className="mt-1.5 text-xs sm:text-sm text-[#516b69]">
          ① 사례를 여러 개 확인한 것과 일반적 증명을 구별하는가? ② 새로운 명제에서 반례가 가정에 맞는지 확인하는가? ③ 참이라고 판단했을 때 문자·정수의 성질 등을 이용해 모든 경우를 설명하는가? ④ 처음 추측을 수정한 이유를 설명하는가?
        </p>
      </div>
    </div>
  );
};
