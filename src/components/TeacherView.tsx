import React, { useRef, useState } from 'react';
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
import { Upload, Download, Trash2, Printer, Users, Sparkles } from 'lucide-react';

interface TeacherViewProps {
  records: StudentRecord[];
  selectedKey: string;
  onSelectStudent: (key: string) => void;
  onUpdateRecords: (next: StudentRecord[]) => void;
  onPrintStudentReport: (student: StudentRecord) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  records,
  selectedKey,
  onSelectStudent,
  onUpdateRecords,
  onPrintStudentReport,
  onRequestConfirm,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const [notice, setNotice] = useState<{ text: string; type: 'good' | 'warn' | 'info' }>({
    text: '학번 대신 식별코드를 사용해도 됩니다. 학생 파일은 교사가 직접 수합해야 하며, 수합된 자료와 메모는 이 브라우저에 저장됩니다.',
    type: 'info',
  });

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
            x.evaluation = old.evaluation || { scores: [null, null, null, null], feedback: '', nextStep: '' };
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
      setNotice({ text: '먼저 학생 JSON 파일을 불러오거나 예시 데이터를 추가해 주세요.', type: 'warn' });
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

  const updateSelectedStudent = (updater: (item: StudentRecord) => StudentRecord) => {
    if (!selectedStudent) return;
    const next = records.map((item) =>
      studentKey(item) === selectedKey ? updater({ ...item }) : item
    );
    onUpdateRecords(next);
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

  const topicRows: [string, number][] = (Object.entries(TOPICS) as [TopicId, typeof TOPICS[TopicId]][]).map(
    ([id, v]) => [v.tag, records.filter((x) => x.l2.topic === id).length]
  );

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

  // Conic gradient for donut
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
      {/* Header & Controls Card */}
      <div className="rounded-2xl border border-[#d9dfda] bg-[#fffefb] p-5 sm:p-7 shadow-sm">
        <div className="text-xs font-extrabold tracking-widest text-[#ad7b37] uppercase">
          DETECTIVE HQ · TEACHER&apos;S DESK
        </div>
        <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#20343d]">교사용 수사 기록실</h2>
        <p className="mt-1 text-sm sm:text-base text-[#65747c]">
          학생들이 제출한 JSON 수사 기록을 한꺼번에 불러오면, 두 차시의 단서 수집·가설·반례·증명 내용을 나란히 확인할 수 있습니다. 별도 서버나 실시간 수집 기능 없이 브라우저에서 안전하게 작동합니다.
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
                  '수합 목록 지우기',
                  '현재 브라우저의 교사용 수합 자료와 메모를 모두 삭제할까요? (학생 원본 파일은 영향받지 않습니다.)',
                  () => {
                    onUpdateRecords([]);
                    onSelectStudent('');
                    setNotice({ text: '수합 목록을 모두 비웠습니다.', type: 'info' });
                  }
                )
              }
              className="inline-flex min-h-[45px] items-center gap-1.5 rounded-xl border border-[#e2b4b9] bg-[#fff1f1] px-4 py-2.5 text-sm font-bold text-[#873640] hover:bg-[#fde2e4]"
            >
              <Trash2 className="h-4 w-4" />
              수합 목록 지우기
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

      {/* Analytics Dashboard */}
      <div className="rounded-2xl border border-[#d9dfda] bg-[#fffefb] p-5 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#20343d]">학급 탐구 역량 대시보드</h3>
          <span className="text-xs text-[#65747c]">
            제출 기록 기반 자동 집계 · 역량 평정은 교사가 직접 입력
          </span>
        </div>

        {count === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c9d2d1] p-8 text-center text-sm text-[#65747c]">
            학생 결과 파일(JSON)을 불러오거나 상단의 <strong>[예시 학생 데이터(2명) 체험하기]</strong> 버튼을 누르면 학급별 탐구 지표 그래프가 나타납니다.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Panel 1 */}
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

            {/* Panel 2 */}
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

            {/* Panel 3 */}
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

            {/* Panel 4 */}
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

      {/* Student Records Table & Detail View */}
      <div className="rounded-2xl border border-[#d9dfda] bg-[#fffefb] p-5 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#20343d] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1e5661]" />
            탐정별 사건 기록
          </h3>
          <span className="text-xs text-[#65747c]">
            동일 학급·코드라면 저장 시각이 더 최신인 파일을 유지합니다.
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#e6ebf1] bg-white">
          <table className="w-full min-w-[740px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#f5f8fd] text-[#53627c] text-xs font-extrabold border-b border-[#e6ebf1]">
                <th className="py-3 px-3 text-left">학급</th>
                <th className="py-3 px-3 text-left">식별코드</th>
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

        {/* Selected Student Detail & Evaluation */}
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
              {/* Lesson 1 Summary */}
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

              {/* Lesson 2 Summary */}
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

            {/* Teacher Observation & Rubric Scoring */}
            <div className="rounded-2xl border border-[#e0e3dd] bg-[#f7f9f5] p-4 sm:p-6 space-y-5">
              <div>
                <label htmlFor="teacherMemo" className="block text-sm font-bold text-[#20343d] mb-1">
                  학습 변화 관찰 메모 (교사용 브라우저에만 저장)
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
