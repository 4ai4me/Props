import React, { useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Sparkles,
  BookOpen,
  ArrowRight,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  EVAL_CRITERIA,
  EVAL_DESCRIPTIONS,
  EVAL_SCORE_LABELS,
  StudentRecord,
  ensureTeacherEval,
  getTeacherEvalAverage,
  getTeacherEvaluationProgress,
  hasTeacherEvaluation,
  TOPICS,
  TopicId,
} from '../utils/mathLogic';

export interface StudentEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord;
  onPrintReport?: (student: StudentRecord) => void;
  onGoToLesson?: (lesson: 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;
}

export const StudentEvaluationModal: React.FC<StudentEvaluationModalProps> = ({
  isOpen,
  onClose,
  student,
  onPrintReport,
  onGoToLesson,
}) => {
  const [showInquirySummary, setShowInquirySummary] = React.useState(false);

  // Close on ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ev = ensureTeacherEval(student);
  const isEvaluated = hasTeacherEvaluation(student);
  const evalProgress = getTeacherEvaluationProgress(student);
  const avg = getTeacherEvalAverage(ev.scores);

  // Rubric score visual helper
  const getScoreColor = (score: number | null) => {
    switch (score) {
      case 3:
        return {
          bg: 'bg-emerald-500',
          text: 'text-emerald-700',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          barWidth: '100%',
        };
      case 2:
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-700',
          badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
          barWidth: '66%',
        };
      case 1:
        return {
          bg: 'bg-amber-500',
          text: 'text-amber-700',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          barWidth: '33%',
        };
      case 0:
        return {
          bg: 'bg-rose-400',
          text: 'text-rose-700',
          badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
          barWidth: '10%',
        };
      default:
        return {
          bg: 'bg-slate-300',
          text: 'text-slate-500',
          badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
          barWidth: '0%',
        };
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eval-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-4 py-3.5 sm:px-7 sm:py-5 flex items-center justify-between gap-3 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0 text-sky-300">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="eval-modal-title" className="text-sm sm:text-lg font-extrabold text-white">
                  역량 평가서 &amp; 교수자 피드백
                </h2>
                {evalProgress.status === 'complete' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[11px] sm:text-xs font-bold text-emerald-300 whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    평가 완료 ({evalProgress.percent}%)
                  </span>
                ) : evalProgress.status === 'partial' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 border border-sky-400/40 px-2 py-0.5 text-[11px] sm:text-xs font-bold text-sky-300 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    평가 진행 중 ({evalProgress.percent}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[11px] sm:text-xs font-bold text-amber-300 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    교수자 검토 대기 ({evalProgress.percent}%)
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 truncate">
                {student.group || '학급 미입력'} · {student.code || '학생'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onPrintReport && (
              <button
                type="button"
                onClick={() => onPrintReport(student)}
                className="inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1.5 text-xs font-bold text-white transition-colors"
                title="평가 결과서 인쇄 또는 PDF 저장"
              >
                <Printer className="h-3.5 w-3.5 text-sky-300" />
                <span className="hidden sm:inline">인쇄 / PDF</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-slate-50/50">
          {isEvaluated ? (
            <>
              {/* Score Summary Overview Card */}
              <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-indigo-50/80 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span>교수자 종합 평정 결과 (진행율 {evalProgress.percent}%)</span>
                    </div>
                    <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                      {student.code} 탐정의 {EVAL_CRITERIA.length}대 수학적 탐구 역량
                    </div>
                    <p className="text-xs text-slate-600">
                      1~7차시 단서, 반례 탐색, 대우법·귀류법 및 절대부등식 증명 서술을 종합하여 평정되었습니다.
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center rounded-xl bg-white/90 border border-blue-200/90 px-4 py-2.5 shrink-0 shadow-xs">
                    <span className="text-xs font-bold text-slate-500">평정 평균</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <strong className="mono text-2xl font-black text-blue-700">
                        {avg === null ? '—' : avg.toFixed(2)}
                      </strong>
                      <span className="text-xs font-semibold text-slate-500">/ 3.00</span>
                    </div>
                  </div>
                </div>
                {evalProgress.isReopenedByLessonExpansion && (
                  <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/90 px-3.5 py-2.5 text-xs font-semibold text-amber-900">
                    새로운 차시(평가 항목)가 추가되어 기존 평가 완료 상태가 <strong>평가 진행 중 ({evalProgress.percent}%, {evalProgress.completedCount}/{evalProgress.totalCount})</strong>으로 변경되었습니다. 추가된 차시 항목({evalProgress.ungradedRubricCount}개)의 평정이 완료되면 다시 평가 완료(100%)로 전환됩니다.
                  </div>
                )}
              </div>

              {/* Rubric Criteria Grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="h-4 w-4 text-indigo-600" />
                  <span>{EVAL_CRITERIA.length}대 탐구 역량 영역별 성취도 (0~3점 · 평정 {evalProgress.scoredRubricCount}/{evalProgress.totalRubricCount})</span>
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  {EVAL_CRITERIA.map((criterion, idx) => {
                    const score = ev.scores[idx];
                    const color = getScoreColor(score);
                    const desc = EVAL_DESCRIPTIONS[idx];
                    const label =
                      score === null || score === undefined
                        ? '평정 대기 중'
                        : EVAL_SCORE_LABELS[score] || `${score}점`;

                    return (
                      <div
                        key={criterion}
                        className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-slate-900">{criterion}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                          </div>
                          <span
                            className={`rounded-lg border px-2 py-0.5 text-xs font-bold shrink-0 ${color.badgeBg}`}
                          >
                            {score === null || score === undefined ? '—' : `${score} / 3점`}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="space-y-1">
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${color.bg}`}
                              style={{ width: color.barWidth }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                            <span>{label}</span>
                            <span className="mono text-slate-400">
                              {score === null ? '미평정' : `${Math.round((score / 3) * 100)}%`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Teacher's Specific Feedback Box */}
              <div className="rounded-2xl border border-blue-200 bg-white p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-sm font-extrabold text-blue-900">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>교수자 맞춤 피드백 (칭찬 및 강점)</span>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {ev.feedback.trim() ? (
                    ev.feedback
                  ) : (
                    <span className="text-slate-400 italic">
                      작성된 개별 피드백 내용이 없습니다.
                    </span>
                  )}
                </div>
              </div>

              {/* Next Step Suggestion Box */}
              <div className="rounded-2xl border border-emerald-200 bg-white p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-900">
                  <ArrowRight className="h-4 w-4 text-emerald-600" />
                  <span>다음 탐구를 위한 교수자 제안</span>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {ev.nextStep.trim() ? (
                    ev.nextStep
                  ) : (
                    <span className="text-slate-400 italic">
                      작성된 다음 탐구 제안이 없습니다.
                    </span>
                  )}
                </div>
              </div>

              {/* Teacher Memo (if provided) */}
              {student.teacherMemo && student.teacherMemo.trim() && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
                  <div className="text-xs font-bold text-slate-500">교수자 수사 관찰 메모</div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {student.teacherMemo}
                  </div>
                </div>
              )}

              {/* Accordion: Submitted Work Summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowInquirySummary((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-slate-500" />
                    <span>내가 작성한 1~7차시 핵심 서술 확인</span>
                  </div>
                  {showInquirySummary ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {showInquirySummary && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 text-xs sm:text-sm">
                    {/* 1차시 */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                      <div className="font-bold text-blue-700">1차시 · 직접 증명</div>
                      <div className="text-slate-600">
                        <strong>발견한 명제:</strong> {student.l1.claim || '(미작성)'}
                      </div>
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>일반적 증명:</strong> {student.l1.proofText || '(미작성)'}
                      </div>
                    </div>

                    {/* 2차시 */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                      <div className="font-bold text-emerald-700">2차시 · 반례와 정당화</div>
                      <div className="text-slate-600">
                        <strong>선택 주제:</strong>{' '}
                        {student.l2.topic === 'd'
                          ? student.l2.customStatement
                          : TOPICS[student.l2.topic as TopicId]?.statement || '(미선택)'}
                      </div>
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>판단 및 논증:</strong>{' '}
                        {student.l2.decision === 'false'
                          ? `반례 n=${student.l2.counter}: ${student.l2.counterReason}`
                          : student.l2.proofText || '(미작성)'}
                      </div>
                    </div>

                    {/* 3차시 */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                      <div className="font-bold text-indigo-700">3차시 · 대우를 이용한 증명</div>
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>문제 1 (짝수):</strong> {student.l3?.prob1ProofText || '(미작성)'}
                      </div>
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>문제 2 (3의 배수):</strong> {student.l3?.prob2ProofText || '(미작성)'}
                      </div>
                    </div>

                    {/* 4차시 */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                      <div className="font-bold text-purple-700">4차시 · 귀류법</div>
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>문제 1 (√2 무리수):</strong> {student.l4?.prob1ProofText || '(미작성)'}
                      </div>
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>문제 2 (1+√2 무리수):</strong> {student.l4?.prob2ProofText || '(미작성)'}
                      </div>
                    </div>

                    {/* 5차시 */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                      <div className="font-bold text-cyan-700">5차시 · 절대부등식1 (완전제곱식)</div>
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>문제 1 (a²+b² ≥ ab):</strong> {student.l5?.prob1ProofText || '(미작성)'}
                      </div>
                      {student.l5?.equalityReason && (
                        <div className="text-slate-600 whitespace-pre-wrap">
                          <strong>등호 조건 이유:</strong> {student.l5.equalityReason}
                        </div>
                      )}
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>문제 2 ((a+b)² ≥ 4ab 외):</strong> {student.l5?.prob2ProofText || '(미작성)'}
                      </div>
                      {student.l5?.reflection1 && (
                        <div className="text-slate-600 whitespace-pre-wrap">
                          <strong>성찰 1:</strong> {student.l5.reflection1}
                        </div>
                      )}
                      {student.l5?.reflection2 && (
                        <div className="text-slate-600 whitespace-pre-wrap">
                          <strong>성찰 2:</strong> {student.l5.reflection2}
                        </div>
                      )}
                    </div>

                    {/* 6차시 */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                      <div className="font-bold text-teal-700">6차시 · 절대부등식2 (산술·기하평균)</div>
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>문제 1 ((a+b)/2 ≥ √ab):</strong> {student.l6?.prob1ProofText || '(미작성)'}
                      </div>
                      {student.l6?.harmonicReason && (
                        <div className="text-slate-600 whitespace-pre-wrap">
                          <strong>조화평균 유도 이유:</strong> {student.l6.harmonicReason}
                        </div>
                      )}
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>문제 2 (a+1/a ≥ 2 외):</strong> {student.l6?.prob2ProofText || '(미작성)'}
                      </div>
                      {student.l6?.reflection1 && (
                        <div className="text-slate-600 whitespace-pre-wrap">
                          <strong>성찰 1:</strong> {student.l6.reflection1}
                        </div>
                      )}
                      {student.l6?.reflection2 && (
                        <div className="text-slate-600 whitespace-pre-wrap">
                          <strong>성찰 2:</strong> {student.l6.reflection2}
                        </div>
                      )}
                    </div>

                    {/* 7차시 */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                      <div className="font-bold text-rose-700">7차시 · 절대부등식3 (절댓값 부등식)</div>
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>문제 1 (|a+b| ≤ |a|+|b|):</strong> {student.l7?.prob1ProofText || '(미작성)'}
                      </div>
                      {student.l7?.absDiffReason && (
                        <div className="text-slate-600 whitespace-pre-wrap">
                          <strong>절댓값의 차 부호 이유:</strong> {student.l7.absDiffReason}
                        </div>
                      )}
                      <div className="text-slate-600 whitespace-pre-wrap">
                        <strong>문제 2 (|a−b| ≤ |a|+|b| 외):</strong> {student.l7?.prob2ProofText || '(미작성)'}
                      </div>
                      {student.l7?.reflection1 && (
                        <div className="text-slate-600 whitespace-pre-wrap">
                          <strong>성찰 1:</strong> {student.l7.reflection1}
                        </div>
                      )}
                      {student.l7?.reflection2 && (
                        <div className="text-slate-600 whitespace-pre-wrap">
                          <strong>성찰 2:</strong> {student.l7.reflection2}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Pending State (No evaluation yet) */
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-yellow-50/80 p-6 text-center space-y-3 shadow-xs">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    아직 교수자의 평가 결과가 등록되지 않았습니다
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    1~7차시 탐구 활동을 충실히 작성하여 완료하면, 교수자가 제출된 기록을 검토하고
                    {EVAL_CRITERIA.length}대 핵심 탐구 역량 평정 점수와 맞춤형 피드백을 이곳에 등록해 줍니다.
                  </p>
                </div>
              </div>

              {/* Evaluation Criteria Guide */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <span>교수자 평가 {EVAL_CRITERIA.length}대 루브릭 기준 미리보기</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {EVAL_CRITERIA.map((criterion, idx) => (
                    <div
                      key={criterion}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1"
                    >
                      <div className="text-xs font-bold text-slate-800">
                        {idx + 1}. {criterion}
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        {EVAL_DESCRIPTIONS[idx]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fast Jump to Lessons */}
              {onGoToLesson && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
                  <div className="text-xs font-bold text-slate-700">탐구 바로가기</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { lesson: 1 as const, title: '01차시 (직접 증명)' },
                      { lesson: 2 as const, title: '02차시 (반례 탐색)' },
                      { lesson: 3 as const, title: '03차시 (대우법)' },
                      { lesson: 4 as const, title: '04차시 (귀류법)' },
                      { lesson: 5 as const, title: '05차시 (절대부등식1)' },
                      { lesson: 6 as const, title: '06차시 (절대부등식2)' },
                      { lesson: 7 as const, title: '07차시 (절대부등식3)' },
                    ].map(({ lesson, title }) => (
                      <button
                        key={lesson}
                        type="button"
                        onClick={() => {
                          onGoToLesson(lesson);
                          onClose();
                        }}
                        className="rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <span>{title}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="bg-white border-t border-slate-200 px-4 py-3 sm:px-7 sm:py-4 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] sm:text-xs text-slate-500 text-center sm:text-left">
            {isEvaluated
              ? '💡 교수자 평가 내용은 실시간으로 최신화됩니다.'
              : '💡 작성을 완료하면 교수자가 확인합니다.'}
          </span>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {onPrintReport && isEvaluated && (
              <button
                type="button"
                onClick={() => onPrintReport(student)}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap w-full sm:w-auto"
              >
                <Printer className="h-4 w-4 text-slate-600 shrink-0" />
                <span>평가 결과서 인쇄 / PDF</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition-colors whitespace-nowrap w-full sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>확인</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
