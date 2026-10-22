import React, { useState } from 'react';
import {
  Lesson7State,
  PROOF7_PROB1_STEPS,
  PROOF7_PROB2_STEPS,
  calc7Abs,
  evaluateLevel7Completion,
  evaluateRubricL7,
  safeN,
} from '../utils/mathLogic';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { CharCountBadge } from './CharCountBadge';

interface Lesson7ViewProps {
  state: Lesson7State;
  step: number;
  onStepChange: (step: number) => void;
  onUpdate: (updater: (prev: Lesson7State) => Lesson7State) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const STEP1_HINTS = [
  '1단계 힌트: 절댓값 기호가 있는 식은 그냥 빼서 정리하기 어렵지만, 절댓값의 제곱은 |x|² = x²이 되어 절댓값 기호가 사라집니다.',
  '2단계 힌트: 두 실수 A ≥ 0, B ≥ 0일 때는 A ≤ B와 A² ≤ B²이 동치이므로, 양변이 모두 0 이상일 때 제곱의 차 B² − A² ≥ 0을 보이면 됩니다.',
  '3단계 힌트: 또한 임의의 실수 x, y에 대하여 |x||y| = |xy|이고, 항상 |xy| ≥ xy이며 |xy| ≥ −xy가 성립합니다.',
];

const STEP3_HINTS = [
  '1단계 힌트: [문제 2-(1)] |a − b| ≤ |a| + |b|는 양변이 모두 0 이상이므로 (|a| + |b|)² − |a − b|² = 2(|ab| + ab) ≥ 0으로 증명하며, 등호는 |ab| = −ab 즉 ab ≤ 0일 때 성립합니다.',
  '2단계 힌트: [문제 2-(2)] |a| − |b| ≤ |a − b|에서는 좌변 |a| − |b|가 음수일 수도 있으므로, (i) |a| < |b|인 경우와 (ii) |a| ≥ |b|인 경우로 나누어 생각합니다.',
  '3단계 힌트: (i) |a| < |b|이면 좌변 < 0 ≤ 우변이므로 당연히 성립하고, (ii) |a| ≥ |b|이면 양변이 0 이상이므로 |a − b|² − (|a| − |b|)² = 2(|ab| − ab) ≥ 0으로 증명됩니다.',
];

export const Lesson7View: React.FC<Lesson7ViewProps> = ({
  state,
  step,
  onStepChange,
  onUpdate,
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

  const done = evaluateLevel7Completion(state);
  const rubric = evaluateRubricL7(state);

  const handleAddExample = (aVal?: number, bVal?: number) => {
    const a = aVal !== undefined ? aVal : safeN(inputA);
    const b = bVal !== undefined ? bVal : safeN(inputB);
    if (a === null || b === null) {
      setInputWarning('실수(정수) a와 b를 모두 입력해 주세요. (예: a=2, b=3 또는 a=2, b=-3)');
      return;
    }
    if (state.examples.some((x) => x.a === a && x.b === b)) {
      setInputWarning(`이미 (a=${a}, b=${b}) 순서쌍이 단서 표에 있습니다.`);
      return;
    }
    setInputWarning(null);
    const nextItem = calc7Abs(a, b);
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
      {/* STEP 0: 1단계 절댓값 단서 수집 */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="text-xs font-bold text-blue-600">
              STAGE 01 · 단서 수집 · 절댓값 기호를 포함한 부등식과 제곱의 차
            </div>
            <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              절대부등식 수사 3: 절댓값 기호가 있을 때는 어떻게 대소를 비교할까?
            </h3>
            <p className="mt-1.5 text-sm sm:text-base text-slate-700 leading-relaxed">
              실수 <span className="mono font-bold">a, b</span>의 부호가 같을 때와 다를 때{' '}
              <span className="mono font-bold text-blue-700">|a + b|</span>와{' '}
              <span className="mono font-bold text-indigo-700">|a| + |b|</span>의 크기를 비교해 보고, 양변을 제곱하여 증명하는 원리를 탐구해 보세요.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Left: Interactive Absolute Value Calculator */}
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  절댓값 부등식 (a, b) 실험기 (3개 이상 수집)
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  현재 {state.examples.length}개 (권장 3개 이상)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="l7-a-input" className="block text-xs font-bold text-slate-600 mb-1">
                    실수 a 입력
                  </label>
                  <input
                    id="l7-a-input"
                    type="text"
                    inputMode="numeric"
                    value={inputA}
                    onChange={(e) => setInputA(e.target.value)}
                    placeholder="a (예: 2)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="l7-b-input" className="block text-xs font-bold text-slate-600 mb-1">
                    실수 b 입력
                  </label>
                  <input
                    id="l7-b-input"
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
                    placeholder="b (예: -3)"
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
                  [2, 3],
                  [2, -3],
                  [-2, -3],
                  [-4, 1],
                  [0, -5],
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
                      onRequestConfirm('단서 표 초기화', '입력한 (a, b) 사례를 모두 지울까요?', () => {
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
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">|a+b|</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">|a|+|b|</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">(|a|+|b|)²−|a+b|²</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">등호·부호</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {state.examples.length > 0 ? (
                      state.examples.map((item) => (
                        <tr key={`${item.a}-${item.b}`} className="text-center">
                          <td className="py-2 px-2.5 mono font-bold">
                            ({item.a}, {item.b})
                          </td>
                          <td className="py-2 px-2.5 mono font-semibold text-blue-700">{item.lhsSum}</td>
                          <td className="py-2 px-2.5 mono font-semibold text-indigo-700">{item.rhsSum}</td>
                          <td className="py-2 px-2.5 mono font-extrabold text-emerald-700">
                            {item.diffSq} ≥ 0
                          </td>
                          <td className="py-2 px-2.5">
                            {item.sameSign ? (
                              <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                                ab≥0 등호 (=)
                              </span>
                            ) : (
                              <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                ab&lt;0 (|a+b|&lt;|a|+|b|)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          추천 순서쌍 버튼을 눌러 부호가 같을 때(2, 3)와 다를 때(2, -3)를 비교해 보세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Absolute Value Properties & Hint */}
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  절댓값 부등식의 증명 원리 확인
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
                <div className="font-extrabold">핵심 성질 — 절댓값과 제곱의 성질</div>
                <div className="mono text-xs text-indigo-900">
                  ① |a| ≥ 0, |a| ≥ a &nbsp;|&nbsp; ② |a|² = a² &nbsp;|&nbsp; ③ |a||b| = |ab| &nbsp;|&nbsp; ④ A≥0, B≥0일 때 A≤B ⇔ A²≤B²
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
                  Q. 절댓값 기호를 포함한 부등식 |a + b| ≤ |a| + |b|를 증명할 때 가장 효과적인 전략은?
                </div>
                {(
                  [
                    [
                      'square_diff',
                      '양변이 모두 0 이상이므로, 우변의 제곱에서 좌변의 제곱을 뺀 (|a| + |b|)² − |a + b|² ≥ 0임을 보인다.',
                    ],
                    [
                      'direct_sub',
                      '제곱하지 않고 절댓값 기호를 임의로 지워서 a + b − a − b = 0이라고 계산한다.',
                    ],
                    [
                      'cube',
                      '양변을 세제곱하여 비교한다.',
                    ],
                  ] as const
                ).map(([val, label]) => {
                  const isSel = state.absSquareConceptChoice === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdate((prev) => ({ ...prev, absSquareConceptChoice: val }))}
                      className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold transition-all ${
                        isSel
                          ? val === 'square_diff'
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

              {state.absSquareConceptChoice && (
                <div
                  className={`rounded-xl border p-3.5 text-xs sm:text-sm font-medium ${
                    state.absSquareConceptChoice === 'square_diff'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-rose-200 bg-rose-50 text-rose-900'
                  }`}
                >
                  {state.absSquareConceptChoice === 'square_diff' ? (
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      정확합니다! 양변이 모두 0 이상일 때는 제곱의 차 (|a| + |b|)² − |a + b|² ≥ 0을 보이면 |x|² = x² 성질 덕분에 식이 간단히 정리됩니다.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      다시 확인해 보세요! 절댓값 기호는 함부로 지울 수 없으며, 양변이 0 이상임을 확인한 후 제곱의 차를 이용해야 합니다.
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

      {/* STEP 1: 2단계 [문제 1] (교과서 예제 5 변환) */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                STAGE 02 · [문제 1] (교과서 예제 5 변환)
              </span>
              <span className="text-xs font-semibold text-blue-800 bg-white px-2.5 py-1 rounded-full border border-blue-200">
                절댓값 기호를 포함한 부등식의 증명
              </span>
            </div>
            <h3 className="mt-1.5 text-lg sm:text-xl font-extrabold text-slate-900">
              [문제 1] <span className="mono">a</span>와 <span className="mono">b</span>가 실수일 때, 부등식{' '}
              <span className="mono text-blue-700">|a + b| ≤ |a| + |b|</span>가 성립함을 증명하시오. (등호 성립 조건 포함)
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              각 단계의 빈칸에 들어갈 추론을 선택하고, 막히면 <strong>[힌트 보기]</strong>를 눌러 단서를 확인하세요.
            </p>
          </div>

          <div className="space-y-4">
            {PROOF7_PROB1_STEPS.map((item, idx) => {
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
              <label htmlFor="l7-prob1-proof" className="text-sm sm:text-base font-extrabold text-slate-900">
                [문제 1] 나의 말로 쓰는 증명 보고서 (등호 성립 조건 필수)
              </label>
              <CharCountBadge text={state.prob1ProofText} min={35} />
            </div>
            <p className="text-xs text-slate-600">
              <span className="mono font-semibold">(|a| + |b|)² − |a + b|² = 2(|ab| − ab) ≥ 0</span>임을 보인 뒤, 왜 <span className="mono font-semibold">|a + b| ≤ |a| + |b|</span>가 성립하는지와 등호 성립 조건을 서술하세요.
            </p>
            <textarea
              id="l7-prob1-proof"
              rows={4}
              value={state.prob1ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob1ProofText: e.target.value }))}
              placeholder="(|a| + |b|)² - |a + b|² = 2(|ab| - ab) ≥ 0이므로 |a + b|² ≤ (|a| + |b|)²이다. 이때 양변이 모두 0 이상이므로 |a + b| ≤ |a| + |b|가 성립하며, 등호는 …일 때 성립한다."
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
              다음 단계 (절댓값 차 탐색)
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: 3단계 절댓값의 차와 경우 나누기 탐색 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="text-xs font-bold text-blue-600">
              STAGE 03 · 심화 단서 탐색 · |a − b| ≤ |a| + |b|와 |a| − |b| ≤ |a − b|
            </div>
            <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              왜 <span className="mono">|a| − |b| ≤ |a − b|</span>에서는 경우를 나누어야 할까?
            </h3>
            <p className="mt-1.5 text-sm sm:text-base text-slate-700 leading-relaxed">
              양변을 제곱하여 크기를 비교하는 방법(<span className="mono">A ≤ B ⇔ A² ≤ B²</span>)은{' '}
              <strong>양변이 모두 0 이상(A ≥ 0, B ≥ 0)</strong>일 때만 사용할 수 있습니다.
              [문제 2]의 두 부등식에서 부호 조건과 등호 성립 조건을 살펴봅시다.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="text-sm font-bold text-slate-900">
                [문제 2]의 두 절댓값 부등식 핵심 비교
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-1.5">
                  <div className="text-xs font-extrabold text-blue-700">
                    [문제 2-(1)] |a − b| ≤ |a| + |b|
                  </div>
                  <div className="mono text-sm font-bold text-slate-900">
                    (|a| + |b|)² − |a − b|² = 2(|ab| + ab) ≥ 0
                  </div>
                  <p className="text-xs text-slate-600">
                    좌변과 우변이 항상 0 이상이므로 바로 제곱하여 뺍니다. 등호는{' '}
                    <span className="mono font-bold">|ab| + ab = 0 ⇔ |ab| = −ab</span>, 즉{' '}
                    <strong className="text-blue-800">ab ≤ 0</strong>일 때 성립합니다.
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-1.5">
                  <div className="text-xs font-extrabold text-indigo-700">
                    [문제 2-(2)] |a| − |b| ≤ |a − b|
                  </div>
                  <div className="mono text-sm font-bold text-slate-900">
                    (i) |a| &lt; |b| 이면 좌변 &lt; 0 ≤ 우변 (성립)
                    <br />
                    (ii) |a| ≥ |b| 이면 |a − b|² − (|a| − |b|)² = 2(|ab| − ab) ≥ 0
                  </div>
                  <p className="text-xs text-slate-600">
                    좌변 <span className="mono font-bold">|a| − |b|</span>는 음수가 될 수 있으므로 두 경우로 나누어 증명하며, 등호는{' '}
                    <strong className="text-indigo-800">ab ≥ 0이고 |a| ≥ |b|</strong>일 때 성립합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  경우 나누기 & 등호 조건 점검
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
                  Q. 부등식 |a| − |b| ≤ |a − b|에서 |a| &lt; |b|일 때 제곱하지 않고도 성립함을 알 수 있는 이유는?
                </div>
                <button
                  type="button"
                  onClick={() => onUpdate((prev) => ({ ...prev, absDiffChecked: true }))}
                  className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold transition-all ${
                    state.absDiffChecked
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/70'
                  }`}
                >
                  ✓ 좌변 |a| − |b| &lt; 0(음수)이고 우변 |a − b| ≥ 0이므로 항상 좌변 &lt; 우변이 성립한다. (확인 클릭)
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label htmlFor="l7-diff-reason" className="text-xs sm:text-sm font-bold text-slate-900">
                    |a − b| ≤ |a| + |b|에서 왜 ab ≤ 0일 때 등호가 성립하는지 나의 말로 적어 보세요.
                  </label>
                  <CharCountBadge text={state.absDiffReason} min={15} />
                </div>
                <textarea
                  id="l7-diff-reason"
                  rows={3}
                  value={state.absDiffReason}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, absDiffReason: e.target.value }))}
                  placeholder="제곱의 차 2(|ab| + ab) = 0이 되려면 |ab| = -ab여야 하므로, 절댓값의 정의에 의해 …일 때 성립한다."
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

      {/* STEP 3: 4단계 [문제 2] (교과서 문제 5 (1)·(2)) */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                STAGE 04 · [문제 2] (교과서 문제 5 (1)·(2))
              </span>
              <span className="text-xs font-semibold text-indigo-800 bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                절댓값 기호를 포함한 두 부등식의 증명
              </span>
            </div>
            <h3 className="mt-1.5 text-lg sm:text-xl font-extrabold text-slate-900">
              [문제 2] <span className="mono">a</span>와 <span className="mono">b</span>가 실수일 때, 다음 부등식이 성립함을 증명하시오.
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs sm:text-sm font-bold text-indigo-950">
              <div className="rounded-lg bg-white/90 border border-indigo-200 px-3 py-2 mono">
                (1) |a − b| ≤ |a| + |b|
              </div>
              <div className="rounded-lg bg-white/90 border border-indigo-200 px-3 py-2 mono">
                (2) |a| − |b| ≤ |a − b|
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {PROOF7_PROB2_STEPS.map((item, idx) => {
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
              <label htmlFor="l7-prob2-proof" className="text-sm sm:text-base font-extrabold text-slate-900">
                [문제 2] (1)·(2) 나의 말로 쓰는 증명 보고서
              </label>
              <CharCountBadge text={state.prob2ProofText} min={40} />
            </div>
            <p className="text-xs text-slate-600">
              (1) <span className="mono">|a − b| ≤ |a| + |b|</span>와 (2) <span className="mono">|a| − |b| ≤ |a − b|</span>의 증명 과정과 각각의 등호 성립 조건을 서술하세요.
            </p>
            <textarea
              id="l7-prob2-proof"
              rows={4}
              value={state.prob2ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob2ProofText: e.target.value }))}
              placeholder="(1) (|a|+|b|)² - |a-b|² = 2(|ab| + ab) ≥ 0이므로 성립하며 등호는 ab ≤ 0일 때 성립한다. (2) |a| < |b|이면 좌변이 음수여서 성립하고, |a| ≥ |b|이면 |a-b|² - (|a|-|b|)² = 2(|ab| - ab) ≥ 0이므로 성립한다."
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
              다음 단계 (전체 수사 종결)
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: 5단계 전체 수사 종결 · 성찰 */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="text-xs font-bold text-blue-600">
              STAGE 05 · 7차시 수사 종결 · 명제의 증명 전체 프로젝트 완성
            </div>
            <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              절댓값을 포함한 절대부등식 및 1~7차시 전체 수사 완료!
            </h3>
            <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
              7차시에서 증명한 두 문제(예제 5 변환 및 문제 5)와 5~7차시 절대부등식 단원 전체를 돌아보며 최종 성찰을 남겨 보세요. 작성한 모든 내용은 클라우드에 실시간으로 자동 저장됩니다.
            </p>
          </div>

          {/* Rubric Check Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
            <div className="text-sm font-bold text-slate-900">7차시 수사 점검표</div>
            <div className="grid gap-2 sm:grid-cols-2 text-xs sm:text-sm">
              {[
                ['1단계: 절댓값 (a, b) 대입 실험 3개 이상 & 제곱 차 원리 확인', rubric[0]],
                ['2단계: [문제 1] (|a+b|≤|a|+|b|) 4단계 추론 & 증명 보고서 작성', rubric[1]],
                ['3단계: 절댓값의 차 경우 나누기 & 등호 조건 탐색', rubric[2]],
                ['4단계: [문제 2] (1)·(2) 4단계 추론 & 증명 보고서 작성', rubric[3]],
                ['5단계: 절대부등식3 및 전체 탐구 성찰 작성', done[4]],
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
                <label htmlFor="l7-ref1" className="text-sm sm:text-base font-bold text-slate-900">
                  성찰 1. 절댓값 기호가 포함된 부등식을 증명할 때 ‘양변이 0 이상인지 확인한 후 제곱하여 빼는 방법’이 왜 유용한가요?
                </label>
                <CharCountBadge text={state.reflection1} min={20} />
              </div>
              <textarea
                id="l7-ref1"
                rows={3}
                value={state.reflection1}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection1: e.target.value }))}
                placeholder="절댓값은 |x|² = x²이라는 성질이 있어서, 양변이 0 이상일 때 제곱하여 빼면 복잡한 경우 나누기 없이 …을 비교할 수 있기 때문이다."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label htmlFor="l7-ref2" className="text-sm sm:text-base font-bold text-slate-900">
                  성찰 2. 5~7차시(완전제곱식, 산술·기하평균, 절댓값 부등식)를 통해 배운 절대부등식 증명의 핵심 원리를 정리해 보세요.
                </label>
                <CharCountBadge text={state.reflection2} min={15} />
              </div>
              <textarea
                id="l7-ref2"
                rows={3}
                value={state.reflection2}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection2: e.target.value }))}
                placeholder="식의 형태에 따라 일반 다항식은 완전제곱식으로, 양수 조건이 있으면 산술·기하평균으로, 절댓값이나 근호가 있으면 …으로 변형하여 증명한다."
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
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>1~7차시 모든 수학 탐정단 기록이 실시간 클라우드에 저장되었습니다!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
