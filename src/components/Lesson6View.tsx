import React, { useState } from 'react';
import {
  Lesson6State,
  PROOF6_PROB1_STEPS,
  PROOF6_PROB2_STEPS,
  calc6Means,
  evaluateLevel6Completion,
  evaluateRubricL6,
  safeN,
} from '../utils/mathLogic';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { CharCountBadge } from './CharCountBadge';

interface Lesson6ViewProps {
  state: Lesson6State;
  step: number;
  onStepChange: (step: number) => void;
  onUpdate: (updater: (prev: Lesson6State) => Lesson6State) => void;
  onGoToLesson7: () => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const STEP1_HINTS = [
  '1단계 힌트: 기하평균 √(ab)가 실수로 정의되고 a = (√a)², b = (√b)²으로 변형하려면 두 수 a, b가 양수(a > 0, b > 0)여야 합니다.',
  '2단계 힌트: 양수 a, b에 대하여 (a + b)/2를 산술평균, √(ab)를 기하평균이라고 부릅니다.',
  '3단계 힌트: (a + b)/2 − √(ab) = (√a − √b)² / 2 ≥ 0이므로 산술평균은 항상 기하평균 이상입니다.',
];

const STEP3_HINTS = [
  '1단계 힌트: 문제 2-(1)의 a + 1/a ≥ 2에서는 두 양수 a와 1/a의 곱이 a × (1/a) = 1로 일정하게 약분된다는 점을 활용합니다.',
  '2단계 힌트: 문제 2-(2)의 우변 2ab / (a + b)는 조화평균이며, 좌변에서 우변을 빼서 통분하면 √(ab)(√a − √b)² / (a + b) ≥ 0이 됩니다.',
  '3단계 힌트: 또는 (a + b)/2 ≥ √(ab)의 양변에 양수 2√(ab) / (a + b)를 곱하여 √(ab) ≥ 2ab / (a + b)를 바로 이끌어낼 수도 있습니다.',
];

export const Lesson6View: React.FC<Lesson6ViewProps> = ({
  state,
  step,
  onStepChange,
  onUpdate,
  onGoToLesson7,
  onRequestConfirm,
}) => {
  const [inputA, setInputA] = useState<string>('');
  const [inputB, setInputB] = useState<string>('');
  const [inputWarning, setInputWarning] = useState<string | null>(null);

  // Toggle visibility states for hints
  const [showStep1Hint, setShowStep1Hint] = useState<boolean>(false);
  const [showStep3Hint, setShowStep3Hint] = useState<boolean>(false);
  const [prob1HintsOpen, setProb1HintsOpen] = useState<boolean[]>([false, false, false, false]);
  const [prob2HintsOpen, setProb2HintsOpen] = useState<boolean[]>([false, false, false, false]);

  const done = evaluateLevel6Completion(state);
  const rubric = evaluateRubricL6(state);

  const handleAddExample = (aVal?: number, bVal?: number) => {
    const a = aVal !== undefined ? aVal : safeN(inputA);
    const b = bVal !== undefined ? bVal : safeN(inputB);
    if (a === null || b === null || a <= 0 || b <= 0) {
      setInputWarning('양수 조건(a > 0, b > 0)을 만족하는 자연수를 입력해 주세요. (예: a=4, b=4 또는 a=1, b=9)');
      return;
    }
    if (state.examples.some((x) => x.a === a && x.b === b)) {
      setInputWarning(`이미 (a=${a}, b=${b}) 순서쌍이 단서 표에 있습니다.`);
      return;
    }
    setInputWarning(null);
    const nextItem = calc6Means(a, b);
    onUpdate((prev) => ({
      ...prev,
      examples: [...prev.examples, nextItem],
    }));
    if (aVal === undefined) {
      setInputA('');
      setInputB('');
    }
  };

  return (
    <div className="space-y-6">
      {/* STEP 0: 1단계 산술·기하 단서 수집 */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="text-xs font-bold text-blue-600">
              STAGE 01 · 단서 수집 · 산술평균과 기하평균의 관계
            </div>
            <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              절대부등식 수사 2: 두 양수의 산술평균과 기하평균은 어떤 관계일까?
            </h3>
            <p className="mt-1.5 text-sm sm:text-base text-slate-700 leading-relaxed">
              두 양수 <span className="mono font-bold">a &gt; 0, b &gt; 0</span>에 대하여{' '}
              <span className="mono font-bold text-blue-700">(a + b)/2</span>를 <strong>산술평균</strong>,{' '}
              <span className="mono font-bold text-indigo-700">√(ab)</span>를 <strong>기하평균</strong>이라고 합니다.
              여러 양수 쌍을 대입하여 산술평균, 기하평균, 그리고 <span className="mono font-bold text-emerald-700">2ab/(a+b)</span>의 크기를 비교해 보세요.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Left: Interactive Positive Pair Calculator */}
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  양수 (a, b) 평균 비교 실험기 (3개 이상 수집)
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  현재 {state.examples.length}개 (권장 3개 이상)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="l6-a-input" className="block text-xs font-bold text-slate-600 mb-1">
                    양수 a (&gt;0)
                  </label>
                  <input
                    id="l6-a-input"
                    type="text"
                    inputMode="numeric"
                    value={inputA}
                    onChange={(e) => setInputA(e.target.value)}
                    placeholder="a (예: 1)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="l6-b-input" className="block text-xs font-bold text-slate-600 mb-1">
                    양수 b (&gt;0)
                  </label>
                  <input
                    id="l6-b-input"
                    type="text"
                    inputMode="numeric"
                    value={inputB}
                    onChange={(e) => setInputB(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExample();
                      }
                    }}
                    placeholder="b (예: 9)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddExample()}
                  className="min-h-[42px] rounded-xl bg-slate-900 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition-colors"
                >
                  단서 추가
                </button>
                {[
                  [4, 4],
                  [1, 9],
                  [2, 8],
                  [4, 16],
                  [3, 3],
                ].map(([ra, rb]) => (
                  <button
                    key={`${ra},${rb}`}
                    type="button"
                    onClick={() => handleAddExample(ra, rb)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 mono"
                  >
                    ({ra}, {rb})
                  </button>
                ))}
                {state.examples.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onRequestConfirm('단서 표 초기화', '입력한 양수 (a, b) 사례를 모두 지울까요?', () => {
                        onUpdate((prev) => ({ ...prev, examples: [] }));
                      })
                    }
                    className="ml-auto inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    초기화
                  </button>
                )}
              </div>

              {inputWarning && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                  {inputWarning}
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[460px] border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">(a, b)</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">(a+b)/2</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">√(ab)</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">2ab/(a+b)</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">비교 결과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {state.examples.length > 0 ? (
                      state.examples.map((item) => (
                        <tr key={`${item.a}-${item.b}`} className="text-center">
                          <td className="py-2 px-2.5 mono font-bold">
                            ({item.a}, {item.b})
                          </td>
                          <td className="py-2 px-2.5 mono font-semibold text-blue-700">{item.arith}</td>
                          <td className="py-2 px-2.5 mono font-semibold text-indigo-700">{item.geom}</td>
                          <td className="py-2 px-2.5 mono font-semibold text-emerald-700">{item.harm}</td>
                          <td className="py-2 px-2.5">
                            {item.isEqual ? (
                              <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                                a=b 등호 성립 (=)
                              </span>
                            ) : (
                              <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                산술 &gt; 기하 &gt; 조화
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          추천 순서쌍 버튼을 눌러 (4, 4), (1, 9), (2, 8) 등을 실험해 보세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: AM-GM Prerequisite Check & Hint */}
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  산술평균과 기하평균의 전제 조건 확인
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (state.step1HintLevel === 0) {
                      onUpdate((prev) => ({ ...prev, step1HintLevel: 1 }));
                      setShowStep1Hint(true);
                    } else {
                      setShowStep1Hint((prev) => !prev);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                  {showStep1Hint && state.step1HintLevel > 0
                    ? `힌트 숨기기 (${state.step1HintLevel}/${STEP1_HINTS.length})`
                    : `힌트 보기 (${state.step1HintLevel}/${STEP1_HINTS.length})`}
                </button>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs sm:text-sm text-indigo-950 space-y-1">
                <div className="font-extrabold">핵심 개념 — 산술평균과 기하평균의 관계</div>
                <div className="mono text-xs text-indigo-900">
                  a &gt; 0, b &gt; 0일 때: (a + b) / 2 ≥ √(ab) &nbsp; (단, 등호는 a = b일 때 성립)
                </div>
              </div>

              {showStep1Hint && state.step1HintLevel > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 space-y-2 text-xs sm:text-sm text-amber-950">
                  {STEP1_HINTS.slice(0, state.step1HintLevel).map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-extrabold text-amber-700 shrink-0">💡</span>
                      <span>{h}</span>
                    </div>
                  ))}
                  <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                    {state.step1HintLevel < STEP1_HINTS.length && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate((prev) => ({
                            ...prev,
                            step1HintLevel: Math.min(STEP1_HINTS.length, prev.step1HintLevel + 1),
                          }))
                        }
                        className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700"
                      >
                        + 다음 단계 힌트 더 보기 ({state.step1HintLevel + 1}/{STEP1_HINTS.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowStep1Hint(false)}
                      className="text-xs font-bold text-amber-800 hover:underline ml-auto"
                    >
                      힌트 접기 ▲
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-600">
                  Q. 부등식 (a + b)/2 ≥ √(ab)를 증명할 때 a = (√a)², b = (√b)²으로 바꾸어 완전제곱식 (√a − √b)²을 만들 수 있는 조건은?
                </div>
                {(
                  [
                    [
                      'positive',
                      '두 수 a, b가 모두 양수(a > 0, b > 0)일 때 √a와 √b가 실수가 되어 (√a − √b)² ≥ 0을 이용할 수 있다.',
                    ],
                    [
                      'anyreal',
                      'a, b가 음수여도 항상 (a + b)/2 ≥ √(ab)가 성립한다.',
                    ],
                    [
                      'negative',
                      'a = −b일 때만 성립하는 조건부 부등식이다.',
                    ],
                  ] as const
                ).map(([val, label]) => {
                  const isSel = state.amgmConceptChoice === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdate((prev) => ({ ...prev, amgmConceptChoice: val }))}
                      className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold transition-all ${
                        isSel
                          ? val === 'positive'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                            : 'border-rose-400 bg-rose-50 text-rose-950'
                          : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/70'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {state.amgmConceptChoice && (
                <div
                  className={`rounded-xl border p-3.5 text-xs sm:text-sm font-medium ${
                    state.amgmConceptChoice === 'positive'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-rose-200 bg-rose-50 text-rose-900'
                  }`}
                >
                  {state.amgmConceptChoice === 'positive' ? (
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      정확합니다! a &gt; 0, b &gt; 0 조건이 있어야 √a와 √b가 실수로 정의되며 (√a − √b)² ≥ 0이 성립합니다.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      다시 확인해 보세요! 산술평균과 기하평균의 관계는 두 수가 모두 양수(a &gt; 0, b &gt; 0)일 때 성립합니다.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onStepChange(1)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
            >
              다음 단계 (문제 1 증명)
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: 2단계 [문제 1] (교과서 예제 4 변환) */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                STAGE 02 · [문제 1] (교과서 예제 4 변환)
              </span>
              <span className="text-xs font-semibold text-blue-800 bg-white px-2.5 py-1 rounded-full border border-blue-200">
                산술평균과 기하평균의 관계 증명
              </span>
            </div>
            <h3 className="mt-1.5 text-lg sm:text-xl font-extrabold text-slate-900">
              [문제 1] <span className="mono">a &gt; 0</span>이고 <span className="mono">b &gt; 0</span>일 때, 부등식{' '}
              <span className="mono text-blue-700">(a + b) / 2 ≥ √(ab)</span>가 성립함을 증명하시오. (등호 성립 조건 포함)
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              각 단계의 빈칸에 들어갈 추론을 선택하고, 막히면 <strong>[힌트 보기]</strong>를 눌러 단서를 확인하세요.
            </p>
          </div>

          <div className="space-y-4">
            {PROOF6_PROB1_STEPS.map((item, idx) => {
              const selected = state.prob1Choices[idx];
              const isVerified = state.prob1Verified[idx];
              const hintLvl = state.prob1Hints[idx] || 0;
              const isHintOpen = prob1HintsOpen[idx];

              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 sm:p-5 transition-all ${
                    isVerified
                      ? 'border-emerald-200 bg-emerald-50/35'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="text-sm sm:text-base font-extrabold text-slate-900">
                      <span className="mono text-blue-600 mr-1.5">Step 0{idx + 1}.</span>
                      {item.q}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (hintLvl === 0) {
                          onUpdate((prev) => {
                            const nextHints = [...prev.prob1Hints];
                            nextHints[idx] = 1;
                            return { ...prev, prob1Hints: nextHints };
                          });
                          setProb1HintsOpen((prev) => {
                            const next = [...prev];
                            next[idx] = true;
                            return next;
                          });
                        } else {
                          setProb1HintsOpen((prev) => {
                            const next = [...prev];
                            next[idx] = !next[idx];
                            return next;
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 shrink-0"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                      {isHintOpen && hintLvl > 0
                        ? `힌트 숨기기 (${hintLvl}/${item.hints.length})`
                        : `힌트 보기 (${hintLvl}/${item.hints.length})`}
                    </button>
                  </div>

                  {isHintOpen && hintLvl > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 p-3 space-y-1.5 text-xs sm:text-sm text-amber-950">
                      {item.hints.slice(0, hintLvl).map((h, hIdx) => (
                        <div key={hIdx} className="flex items-start gap-2">
                          <span className="font-bold text-amber-700 shrink-0">힌트 {hIdx + 1}:</span>
                          <span>{h}</span>
                        </div>
                      ))}
                      <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                        {hintLvl < item.hints.length && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdate((prev) => {
                                const nextHints = [...prev.prob1Hints];
                                nextHints[idx] = Math.min(item.hints.length, (nextHints[idx] || 0) + 1);
                                return { ...prev, prob1Hints: nextHints };
                              })
                            }
                            className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700"
                          >
                            + 다음 힌트 더 보기 ({hintLvl + 1}/{item.hints.length})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setProb1HintsOpen((prev) => {
                              const next = [...prev];
                              next[idx] = false;
                              return next;
                            })
                          }
                          className="text-xs font-bold text-amber-800 hover:underline ml-auto"
                        >
                          힌트 접기 ▲
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 grid gap-2">
                    {item.opts.map((opt, oIdx) => {
                      const isThisSelected = selected === oIdx;
                      const isCorrect = oIdx === item.answer;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => {
                            onUpdate((prev) => {
                              const nextChoices = [...prev.prob1Choices];
                              const nextVerified = [...prev.prob1Verified];
                              nextChoices[idx] = oIdx;
                              nextVerified[idx] = oIdx === item.answer;
                              return {
                                ...prev,
                                prob1Choices: nextChoices,
                                prob1Verified: nextVerified,
                              };
                            });
                          }}
                          className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold transition-all ${
                            isThisSelected
                              ? isCorrect
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                                : 'border-rose-400 bg-rose-50 text-rose-950'
                              : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/70'
                          }`}
                        >
                          <span className="mono mr-2 font-bold">({oIdx + 1})</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {selected !== null && (
                    <div
                      className={`mt-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                        isVerified ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isVerified ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>정확한 추론입니다!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                          <span>다시 생각해 보세요. 막히면 우측 상단의 [힌트 보기]를 눌러 보세요.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Written Proof for Problem 1 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label htmlFor="l6-prob1-proof" className="text-sm sm:text-base font-extrabold text-slate-900">
                [문제 1] 나의 말로 쓰는 증명 보고서 (등호 성립 조건 필수)
              </label>
              <CharCountBadge text={state.prob1ProofText} min={35} />
            </div>
            <p className="text-xs text-slate-600">
              <span className="mono font-semibold">(a + b)/2 − √(ab) = (√a − √b)² / 2 ≥ 0</span>임을 보인 뒤 등호 성립 조건을 서술하세요.
            </p>
            <textarea
              id="l6-prob1-proof"
              rows={4}
              value={state.prob1ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob1ProofText: e.target.value }))}
              placeholder="a > 0, b > 0일 때 (a+b)/2 - √(ab) = (√a - √b)² / 2 ≥ 0이므로 (a+b)/2 ≥ √(ab)가 성립한다. 여기서 등호는 …일 때 성립한다."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onStepChange(0)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              이전 단계
            </button>
            <button
              type="button"
              onClick={() => onStepChange(2)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
            >
              다음 단계 (역수·조화 탐색)
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: 3단계 역수의 합과 조화평균 단서 탐색 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="text-xs font-bold text-blue-600">
              STAGE 03 · 심화 단서 탐색 · 역수의 합과 조화평균의 증명 전략
            </div>
            <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              [문제 2]를 풀기 위한 두 가지 열쇠: <span className="mono">a + 1/a ≥ 2</span>와{' '}
              <span className="mono">√(ab) ≥ 2ab / (a + b)</span>
            </h3>
            <p className="mt-1.5 text-sm sm:text-base text-slate-700 leading-relaxed">
              [문제 1]에서 증명한 산술·기하평균의 관계 <span className="mono font-bold">(A + B)/2 ≥ √(AB)</span> (또는{' '}
              <span className="mono font-bold">A + B ≥ 2√(AB)</span>)를 이용하면 역수의 합과 조화평균 부등식도 손쉽게 증명할 수 있습니다.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="text-sm font-bold text-slate-900">
                [문제 2]의 두 부등식 핵심 아이디어
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-1.5">
                  <div className="text-xs font-extrabold text-blue-700">
                    열쇠 1 — 역수의 합: a + 1/a ≥ 2 (단, a &gt; 0)
                  </div>
                  <div className="mono text-sm font-bold text-slate-900">
                    a + 1/a ≥ 2√(a × 1/a) = 2√1 = 2
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="mono font-bold">a &gt; 0</span>이면 <span className="mono font-bold">1/a &gt; 0</span>이므로 산술·기하평균을 적용하면 근호 안의 곱이 <strong>1로 약분</strong>됩니다. 등호는 <span className="mono font-bold">a = 1/a</span>이고 <span className="mono font-bold">a &gt; 0</span>이므로 <strong>a = 1</strong>일 때 성립합니다.
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-1.5">
                  <div className="text-xs font-extrabold text-indigo-700">
                    열쇠 2 — 기하평균과 조화평균: √(ab) ≥ 2ab / (a + b)
                  </div>
                  <div className="mono text-sm font-bold text-slate-900">
                    √(ab) − 2ab/(a+b) = √(ab)(√a − √b)² / (a + b) ≥ 0
                  </div>
                  <p className="text-xs text-slate-600">
                    통분하여 완전제곱식으로 묶거나, <span className="mono font-bold">(a + b)/2 ≥ √(ab)</span>의 양변에 양수{' '}
                    <span className="mono font-bold">2√(ab)/(a + b)</span>를 곱하여 증명할 수 있습니다. 등호는 <strong>a = b</strong>일 때 성립합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  산술·기하평균 활용 원리 점검
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (state.step3HintLevel === 0) {
                      onUpdate((prev) => ({ ...prev, step3HintLevel: 1 }));
                      setShowStep3Hint(true);
                    } else {
                      setShowStep3Hint((prev) => !prev);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                  {showStep3Hint && state.step3HintLevel > 0
                    ? `힌트 숨기기 (${state.step3HintLevel}/${STEP3_HINTS.length})`
                    : `힌트 보기 (${state.step3HintLevel}/${STEP3_HINTS.length})`}
                </button>
              </div>

              {showStep3Hint && state.step3HintLevel > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 space-y-2 text-xs sm:text-sm text-amber-950">
                  {STEP3_HINTS.slice(0, state.step3HintLevel).map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-extrabold text-amber-700 shrink-0">💡</span>
                      <span>{h}</span>
                    </div>
                  ))}
                  <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                    {state.step3HintLevel < STEP3_HINTS.length && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate((prev) => ({
                            ...prev,
                            step3HintLevel: Math.min(STEP3_HINTS.length, prev.step3HintLevel + 1),
                          }))
                        }
                        className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700"
                      >
                        + 다음 힌트 더 보기 ({state.step3HintLevel + 1}/{STEP3_HINTS.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowStep3Hint(false)}
                      className="text-xs font-bold text-amber-800 hover:underline ml-auto"
                    >
                      힌트 접기 ▲
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-600">
                  Q. a &gt; 0, b &gt; 0일 때 세 평균의 크기 관계를 바르게 나타낸 것은?
                </div>
                <button
                  type="button"
                  onClick={() => onUpdate((prev) => ({ ...prev, harmonicChecked: true }))}
                  className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold transition-all ${
                    state.harmonicChecked
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/70'
                  }`}
                >
                  ✓ (a + b)/2 ≥ √(ab) ≥ 2ab/(a + b) 이며, 등호는 모두 a = b일 때 성립한다. (확인 클릭)
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label htmlFor="l6-harm-reason" className="text-xs sm:text-sm font-bold text-slate-900">
                    a + 1/a ≥ 2에서 왜 a가 1일 때 등호가 성립하는지 나의 말로 적어 보세요.
                  </label>
                  <CharCountBadge text={state.harmonicReason} min={15} />
                </div>
                <textarea
                  id="l6-harm-reason"
                  rows={3}
                  value={state.harmonicReason}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, harmonicReason: e.target.value }))}
                  placeholder="산술·기하평균에서 등호는 두 양수 a와 1/a가 같을 때 성립하므로, a = 1/a이고 a > 0에서 …이다."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onStepChange(1)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              이전 단계
            </button>
            <button
              type="button"
              onClick={() => onStepChange(3)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
            >
              다음 단계 (문제 2 증명)
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: 4단계 [문제 2] (교과서 문제 4 (1)·(2)) */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                STAGE 04 · [문제 2] (교과서 문제 4 (1)·(2))
              </span>
              <span className="text-xs font-semibold text-indigo-800 bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                산술·기하평균을 이용한 절대부등식의 증명
              </span>
            </div>
            <h3 className="mt-1.5 text-lg sm:text-xl font-extrabold text-slate-900">
              [문제 2] <span className="mono">a &gt; 0</span>이고 <span className="mono">b &gt; 0</span>일 때, 다음 부등식이 성립함을 증명하시오.
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs sm:text-sm font-bold text-indigo-950">
              <div className="rounded-lg bg-white/90 border border-indigo-200 px-3 py-2 mono">
                (1) a + 1/a ≥ 2
              </div>
              <div className="rounded-lg bg-white/90 border border-indigo-200 px-3 py-2 mono">
                (2) √(ab) ≥ 2ab / (a + b)
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {PROOF6_PROB2_STEPS.map((item, idx) => {
              const selected = state.prob2Choices[idx];
              const isVerified = state.prob2Verified[idx];
              const hintLvl = state.prob2Hints[idx] || 0;
              const isHintOpen = prob2HintsOpen[idx];

              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 sm:p-5 transition-all ${
                    isVerified
                      ? 'border-emerald-200 bg-emerald-50/35'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="text-sm sm:text-base font-extrabold text-slate-900">
                      <span className="mono text-indigo-600 mr-1.5">Step 0{idx + 1}.</span>
                      {item.q}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (hintLvl === 0) {
                          onUpdate((prev) => {
                            const nextHints = [...prev.prob2Hints];
                            nextHints[idx] = 1;
                            return { ...prev, prob2Hints: nextHints };
                          });
                          setProb2HintsOpen((prev) => {
                            const next = [...prev];
                            next[idx] = true;
                            return next;
                          });
                        } else {
                          setProb2HintsOpen((prev) => {
                            const next = [...prev];
                            next[idx] = !next[idx];
                            return next;
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 shrink-0"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                      {isHintOpen && hintLvl > 0
                        ? `힌트 숨기기 (${hintLvl}/${item.hints.length})`
                        : `힌트 보기 (${hintLvl}/${item.hints.length})`}
                    </button>
                  </div>

                  {isHintOpen && hintLvl > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 p-3 space-y-1.5 text-xs sm:text-sm text-amber-950">
                      {item.hints.slice(0, hintLvl).map((h, hIdx) => (
                        <div key={hIdx} className="flex items-start gap-2">
                          <span className="font-bold text-amber-700 shrink-0">힌트 {hIdx + 1}:</span>
                          <span>{h}</span>
                        </div>
                      ))}
                      <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                        {hintLvl < item.hints.length && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdate((prev) => {
                                const nextHints = [...prev.prob2Hints];
                                nextHints[idx] = Math.min(item.hints.length, (nextHints[idx] || 0) + 1);
                                return { ...prev, prob2Hints: nextHints };
                              })
                            }
                            className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700"
                          >
                            + 다음 힌트 더 보기 ({hintLvl + 1}/{item.hints.length})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setProb2HintsOpen((prev) => {
                              const next = [...prev];
                              next[idx] = false;
                              return next;
                            })
                          }
                          className="text-xs font-bold text-amber-800 hover:underline ml-auto"
                        >
                          힌트 접기 ▲
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 grid gap-2">
                    {item.opts.map((opt, oIdx) => {
                      const isThisSelected = selected === oIdx;
                      const isCorrect = oIdx === item.answer;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => {
                            onUpdate((prev) => {
                              const nextChoices = [...prev.prob2Choices];
                              const nextVerified = [...prev.prob2Verified];
                              nextChoices[idx] = oIdx;
                              nextVerified[idx] = oIdx === item.answer;
                              return {
                                ...prev,
                                prob2Choices: nextChoices,
                                prob2Verified: nextVerified,
                              };
                            });
                          }}
                          className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold transition-all ${
                            isThisSelected
                              ? isCorrect
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                                : 'border-rose-400 bg-rose-50 text-rose-950'
                              : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/70'
                          }`}
                        >
                          <span className="mono mr-2 font-bold">({oIdx + 1})</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {selected !== null && (
                    <div
                      className={`mt-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                        isVerified ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isVerified ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>정확한 추론입니다!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                          <span>다시 생각해 보세요. [힌트 보기]를 눌러 단계별 해설을 참고할 수 있습니다.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Written Proof for Problem 2 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label htmlFor="l6-prob2-proof" className="text-sm sm:text-base font-extrabold text-slate-900">
                [문제 2] (1)·(2) 나의 말로 쓰는 증명 보고서
              </label>
              <CharCountBadge text={state.prob2ProofText} min={40} />
            </div>
            <p className="text-xs text-slate-600">
              (1) <span className="mono">a + 1/a ≥ 2</span>와 (2) <span className="mono">√(ab) ≥ 2ab / (a + b)</span>의 증명 과정과 각각의 등호 성립 조건을 서술하세요.
            </p>
            <textarea
              id="l6-prob2-proof"
              rows={4}
              value={state.prob2ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob2ProofText: e.target.value }))}
              placeholder="(1) a > 0이면 1/a > 0이므로 산술·기하평균에 의해 a + 1/a ≥ 2√(a · 1/a) = 2이고 등호는 a=1일 때 성립한다. (2) √(ab) - 2ab/(a+b) = … ≥ 0이므로 성립하며 등호는 a=b일 때 성립한다."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onStepChange(2)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              이전 단계
            </button>
            <button
              type="button"
              onClick={() => onStepChange(4)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
            >
              다음 단계 (절대부등식2 종결)
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: 5단계 사건 종결 · 성찰 */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="text-xs font-bold text-blue-600">
              STAGE 05 · 6차시 수사 종결 · 절대부등식2 성찰
            </div>
            <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              산술평균과 기하평균을 이용한 절대부등식 수사 완료!
            </h3>
            <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
              6차시에서 증명한 두 문제(예제 4 변환 및 문제 4)를 되돌아보며 핵심 원리를 정리하고, 마지막 7차시(절댓값을 포함한 절대부등식)로 이동해 봅시다.
            </p>
          </div>

          {/* Rubric Check Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
            <div className="text-sm font-bold text-slate-900">6차시 수사 점검표</div>
            <div className="grid gap-2 sm:grid-cols-2 text-xs sm:text-sm">
              {[
                ['1단계: 양수 (a, b) 대입 실험 3개 이상 & 양수 조건 확인', rubric[0]],
                ['2단계: [문제 1] ((a+b)/2≥√ab) 4단계 추론 & 증명 보고서 작성', rubric[1]],
                ['3단계: 역수의 합 & 조화평균 원리 탐색 및 서술', rubric[2]],
                ['4단계: [문제 2] (1)·(2) 4단계 추론 & 증명 보고서 작성', rubric[3]],
                ['5단계: 절대부등식2 탐구 성찰 작성', done[4]],
              ].map(([label, ok], idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 font-semibold ${
                    ok
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${ok ? 'text-emerald-600' : 'text-slate-400'}`}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label htmlFor="l6-ref1" className="text-sm sm:text-base font-bold text-slate-900">
                  성찰 1. 산술평균과 기하평균의 관계 (a + b)/2 ≥ √(ab)를 적용할 때 왜 반드시 두 수가 양수(a &gt; 0, b &gt; 0)인지 먼저 확인해야 하나요?
                </label>
                <CharCountBadge text={state.reflection1} min={20} />
              </div>
              <textarea
                id="l6-ref1"
                rows={3}
                value={state.reflection1}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection1: e.target.value }))}
                placeholder="양수 조건이 있어야 √a와 √b가 실수로 존재하고, a = (√a)², b = (√b)²으로 바꾸어 완전제곱식 …을 만들 수 있기 때문이다."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label htmlFor="l6-ref2" className="text-sm sm:text-base font-bold text-slate-900">
                  성찰 2. 산술평균, 기하평균, 조화평균 2ab/(a+b)의 대소 관계와 등호 성립 조건을 정리해 보세요.
                </label>
                <CharCountBadge text={state.reflection2} min={15} />
              </div>
              <textarea
                id="l6-ref2"
                rows={3}
                value={state.reflection2}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection2: e.target.value }))}
                placeholder="두 양수 a, b에 대하여 항상 산술평균 ≥ 기하평균 ≥ 조화평균이 성립하며, 등호는 모두 …일 때 성립한다."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onStepChange(3)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              이전 단계
            </button>
            <button
              type="button"
              onClick={onGoToLesson7}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              7차시(절대부등식3 · 절댓값 부등식) 수사로 이동
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
