import React, { useState } from 'react';
import {
  Lesson5State,
  PROOF5_PROB1_STEPS,
  PROOF5_PROB2_STEPS,
  calc5Inequality,
  evaluateLevel5Completion,
  evaluateRubricL5,
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

interface Lesson5ViewProps {
  state: Lesson5State;
  step: number;
  onStepChange: (step: number) => void;
  onUpdate: (updater: (prev: Lesson5State) => Lesson5State) => void;
  onGoToLesson6: () => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const STEP1_HINTS = [
  '1단계 힌트: 두 실수 A와 B의 크기를 비교할 때는 좌변에서 우변을 뺀 차 A − B의 부호를 조사합니다.',
  '2단계 힌트: 임의의 실수 X에 대하여 제곱한 값 X²은 음수가 될 수 없으므로 항상 X² ≥ 0입니다.',
  '3단계 힌트: 따라서 주어진 식 A − B를 완전제곱식들의 합 X² + Y² 꼴로 변형하면 항상 0 이상임을 증명할 수 있습니다.',
];

const STEP3_HINTS = [
  '1단계 힌트: 실수 X, Y에 대하여 X² ≥ 0이고 Y² ≥ 0이므로, X² + Y² = 0이 되려면 두 제곱식이 동시에 0이어야 합니다.',
  '2단계 힌트: (a − b)² = 0일 때는 a − b = 0이므로 a = b인 모든 실수에서 등호가 성립합니다.',
  '3단계 힌트: 반면 (a − 2b)² + b² = 0일 때는 a − 2b = 0이고 동시에 b = 0이어야 하므로, a = b = 0일 때만 등호가 성립합니다.',
];

export const Lesson5View: React.FC<Lesson5ViewProps> = ({
  state,
  step,
  onStepChange,
  onUpdate,
  onGoToLesson6,
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

  const done = evaluateLevel5Completion(state);
  const rubric = evaluateRubricL5(state);

  const handleAddExample = (aVal?: number, bVal?: number) => {
    const a = aVal !== undefined ? aVal : safeN(inputA);
    const b = bVal !== undefined ? bVal : safeN(inputB);
    if (a === null || b === null) {
      setInputWarning('실수(정수) a와 b를 모두 입력해 주세요. (예: a=2, b=1 또는 a=-1, b=2)');
      return;
    }
    if (state.examples.some((x) => x.a === a && x.b === b)) {
      setInputWarning(`이미 (a=${a}, b=${b}) 순서쌍이 단서 표에 있습니다.`);
      return;
    }
    setInputWarning(null);
    const nextItem = calc5Inequality(a, b);
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
      {/* STEP 0: 1단계 완전제곱 단서 수집 */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="text-xs font-bold text-blue-600">
              STAGE 01 · 단서 수집 · 실수의 제곱 성질과 완전제곱식
            </div>
            <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              절대부등식 수사 1: 왜 실수의 제곱은 항상 0 이상일까?
            </h3>
            <p className="mt-1.5 text-sm sm:text-base text-slate-700 leading-relaxed">
              문자에 어떤 실수를 대입해도 항상 성립하는 부등식을 <strong>절대부등식</strong>이라고 합니다.
              실수 <span className="mono font-bold">a, b</span>에 여러 값을 대입하여{' '}
              <span className="mono font-bold text-blue-700">a² + b²</span>과{' '}
              <span className="mono font-bold text-indigo-700">ab</span>의 크기를 비교해 보고, 완전제곱식을 이용한 증명 단서를 찾아보세요.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Left: Interactive (a, b) Clue Collector */}
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  실수 (a, b) 대입 실험기 (3개 이상 수집)
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  현재 {state.examples.length}개 (권장 3개 이상)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="l5-a-input" className="block text-xs font-bold text-slate-600 mb-1">
                    실수 a 입력
                  </label>
                  <input
                    id="l5-a-input"
                    type="text"
                    inputMode="numeric"
                    value={inputA}
                    onChange={(e) => setInputA(e.target.value)}
                    placeholder="a (예: -2)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="l5-b-input" className="block text-xs font-bold text-slate-600 mb-1">
                    실수 b 입력
                  </label>
                  <input
                    id="l5-b-input"
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
                    placeholder="b (예: 3)"
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
                  [0, 0],
                  [2, 2],
                  [3, 1],
                  [-2, 1],
                  [-3, -2],
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
                <table className="w-full min-w-[440px] border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">(a, b)</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">좌변 a²+b²</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">우변 ab</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">차 (a²+b²)−ab</th>
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
                          <td className="py-2 px-2.5 mono font-semibold text-blue-700">{item.lhs}</td>
                          <td className="py-2 px-2.5 mono font-semibold text-indigo-700">{item.rhs}</td>
                          <td className="py-2 px-2.5 mono font-extrabold text-emerald-700">
                            {item.diff} ≥ 0
                          </td>
                          <td className="py-2 px-2.5">
                            {item.isEqual ? (
                              <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                                등호 성립 (=)
                              </span>
                            ) : (
                              <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                a²+b² &gt; ab
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          추천 순서쌍 버튼을 눌러 (0, 0), (2, 2), (-2, 1) 등을 실험해 보세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Core Real Number Property Check & Hint */}
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  절대부등식 증명에 쓰이는 실수의 기본 성질 확인
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
                <div className="font-extrabold">교과서 핵심 성질 — 부등식의 증명에 이용되는 실수의 성질</div>
                <div className="mono text-xs text-indigo-900">
                  a, b가 실수일 때: ① a &gt; b ⇔ a − b &gt; 0 &nbsp;|&nbsp; ② a² ≥ 0 &nbsp;|&nbsp; ③ a² + b² = 0 ⇔ a = b = 0
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
                  Q. 두 실수 A, B에 대하여 부등식 A ≥ B가 항상 성립함을 증명할 때 가장 핵심이 되는 원리는?
                </div>
                {(
                  [
                    [
                      'nonnegative',
                      '좌변에서 우변을 뺀 차 A − B를 완전제곱식의 합(X² + Y²) 꼴로 변형하여 A − B ≥ 0임을 보인다.',
                    ],
                    [
                      'alwayspositive',
                      '양수인 숫자 2~3개만 대입하여 성립하는지 확인하면 모든 실수에 대해 증명이 끝난다.',
                    ],
                    [
                      'negative',
                      '실수를 제곱하면 음수가 되므로 A − B < 0임을 보인다.',
                    ],
                  ] as const
                ).map(([val, label]) => {
                  const isSel = state.squareConceptChoice === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdate((prev) => ({ ...prev, squareConceptChoice: val }))}
                      className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold transition-all ${
                        isSel
                          ? val === 'nonnegative'
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

              {state.squareConceptChoice && (
                <div
                  className={`rounded-xl border p-3.5 text-xs sm:text-sm font-medium ${
                    state.squareConceptChoice === 'nonnegative'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-rose-200 bg-rose-50 text-rose-900'
                  }`}
                >
                  {state.squareConceptChoice === 'nonnegative' ? (
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      정확합니다! 임의의 실수 X에 대하여 X² ≥ 0이므로, 차 A − B를 완전제곱식의 합으로 바꾸면 항상 0 이상임을 보일 수 있습니다.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      다시 생각해 보세요! 몇 개의 숫자 대입만으로는 모든 실수에 대해 증명할 수 없으며, 실수의 제곱은 항상 0 이상(X² ≥ 0)입니다.
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

      {/* STEP 1: 2단계 [문제 1] (교과서 예제 3 변환) */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                STAGE 02 · [문제 1] (교과서 예제 3 변환)
              </span>
              <span className="text-xs font-semibold text-blue-800 bg-white px-2.5 py-1 rounded-full border border-blue-200">
                완전제곱식을 이용한 절대부등식 증명
              </span>
            </div>
            <h3 className="mt-1.5 text-lg sm:text-xl font-extrabold text-slate-900">
              [문제 1] <span className="mono">a</span>와 <span className="mono">b</span>가 실수일 때, 부등식{' '}
              <span className="mono text-blue-700">a² + b² ≥ ab</span>가 성립함을 증명하시오. (등호 성립 조건 포함)
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              각 단계의 빈칸에 들어갈 알맞은 추론을 선택하고, 막히면 <strong>[힌트 보기]</strong>를 눌러 단서를 확인하세요.
            </p>
          </div>

          <div className="space-y-4">
            {PROOF5_PROB1_STEPS.map((item, idx) => {
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
              <label htmlFor="l5-prob1-proof" className="text-sm sm:text-base font-extrabold text-slate-900">
                [문제 1] 나의 말로 쓰는 증명 보고서 (등호 성립 조건 필수)
              </label>
              <CharCountBadge text={state.prob1ProofText} min={35} />
            </div>
            <p className="text-xs text-slate-600">
              위의 Step 01~04 과정을 연결하여 <span className="mono font-semibold">a² + b² − ab = (a − b/2)² + (3/4)b² ≥ 0</span>임을 보인 뒤, 언제 등호가 성립하는지 서술하세요.
            </p>
            <textarea
              id="l5-prob1-proof"
              rows={4}
              value={state.prob1ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob1ProofText: e.target.value }))}
              placeholder="좌변에서 우변을 빼면 a² + b² - ab = (a - …)² + … ≥ 0이므로 a² + b² ≥ ab가 성립한다. 여기서 등호는 …일 때 성립한다."
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
              다음 단계 (등호 조건 탐색)
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: 3단계 완전제곱식 변형과 등호 성립 조건 비교 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="text-xs font-bold text-blue-600">
              STAGE 03 · 심화 단서 탐색 · 한 개의 제곱식 vs 두 제곱식의 합
            </div>
            <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              등호는 언제 성립할까? <span className="mono">(a − b)² ≥ 0</span> vs{' '}
              <span className="mono">(a − 2b)² + b² ≥ 0</span>
            </h3>
            <p className="mt-1.5 text-sm sm:text-base text-slate-700 leading-relaxed">
              [문제 2]에서는 <strong>(1) <span className="mono">(a + b)² ≥ 4ab</span></strong>와{' '}
              <strong>(2) <span className="mono">a² − 4ab + 5b² ≥ 0</span></strong> 두 부등식을 증명합니다.
              두 식을 완전제곱식으로 바꾸었을 때 <strong>등호 성립 조건</strong>이 어떻게 달라지는지 비교해 봅시다.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="text-sm font-bold text-slate-900">
                두 완전제곱식 변형의 구조 비교
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-1.5">
                  <div className="text-xs font-extrabold text-blue-700">
                    유형 A — 단일 완전제곱식: (a + b)² − 4ab
                  </div>
                  <div className="mono text-sm font-bold text-slate-900">
                    (a + b)² − 4ab = a² − 2ab + b² = (a − b)² ≥ 0
                  </div>
                  <p className="text-xs text-slate-600">
                    제곱식이 1개뿐이므로 <span className="mono font-bold">a − b = 0</span>, 즉{' '}
                    <strong className="text-blue-800">a = b인 모든 실수</strong>(예: a=3, b=3)에서 등호가 성립합니다.
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-1.5">
                  <div className="text-xs font-extrabold text-indigo-700">
                    유형 B — 두 제곱식의 합: a² − 4ab + 5b²
                  </div>
                  <div className="mono text-sm font-bold text-slate-900">
                    a² − 4ab + 5b² = (a² − 4ab + 4b²) + b² = (a − 2b)² + b² ≥ 0
                  </div>
                  <p className="text-xs text-slate-600">
                    두 제곱식의 합이 0이 되려면 <span className="mono font-bold">a − 2b = 0</span>이고 동시에{' '}
                    <span className="mono font-bold">b = 0</span>이어야 하므로{' '}
                    <strong className="text-indigo-800">a = b = 0일 때만</strong> 등호가 성립합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  등호 성립 원리 점검 및 서술
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
                  Q. 실수 a, b에 대하여 (a − 2b)² + b² = 0이 성립하기 위한 필요충분조건은?
                </div>
                <button
                  type="button"
                  onClick={() => onUpdate((prev) => ({ ...prev, equalityConditionChecked: true }))}
                  className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold transition-all ${
                    state.equalityConditionChecked
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/70'
                  }`}
                >
                  ✓ a − 2b = 0이고 동시에 b = 0이어야 하므로, a = b = 0이다. (확인 클릭)
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label htmlFor="l5-eq-reason" className="text-xs sm:text-sm font-bold text-slate-900">
                    왜 5b²을 4b² + b²으로 쪼개어 변형해야 하는지 나의 말로 적어 보세요.
                  </label>
                  <CharCountBadge text={state.equalityReason} min={15} />
                </div>
                <textarea
                  id="l5-eq-reason"
                  rows={3}
                  value={state.equalityReason}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, equalityReason: e.target.value }))}
                  placeholder="a² - 4ab와 결합하여 완전제곱식 (a - 2b)²을 만들려면 …이 필요하고, 남는 …도 제곱식이기 때문이다."
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

      {/* STEP 3: 4단계 [문제 2] (교과서 문제 3 (1)·(2)) */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                STAGE 04 · [문제 2] (교과서 문제 3 (1)·(2))
              </span>
              <span className="text-xs font-semibold text-indigo-800 bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                완전제곱식을 이용한 두 절대부등식의 증명
              </span>
            </div>
            <h3 className="mt-1.5 text-lg sm:text-xl font-extrabold text-slate-900">
              [문제 2] <span className="mono">a</span>와 <span className="mono">b</span>가 실수일 때, 다음 부등식이 성립함을 증명하시오.
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs sm:text-sm font-bold text-indigo-950">
              <div className="rounded-lg bg-white/90 border border-indigo-200 px-3 py-2 mono">
                (1) (a + b)² ≥ 4ab
              </div>
              <div className="rounded-lg bg-white/90 border border-indigo-200 px-3 py-2 mono">
                (2) a² − 4ab + 5b² ≥ 0
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {PROOF5_PROB2_STEPS.map((item, idx) => {
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
              <label htmlFor="l5-prob2-proof" className="text-sm sm:text-base font-extrabold text-slate-900">
                [문제 2] (1)·(2) 나의 말로 쓰는 증명 보고서
              </label>
              <CharCountBadge text={state.prob2ProofText} min={40} />
            </div>
            <p className="text-xs text-slate-600">
              (1) <span className="mono">(a + b)² ≥ 4ab</span>와 (2) <span className="mono">a² − 4ab + 5b² ≥ 0</span>의 완전제곱식 변형 과정과 각각의 등호 성립 조건을 서술하세요.
            </p>
            <textarea
              id="l5-prob2-proof"
              rows={4}
              value={state.prob2ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob2ProofText: e.target.value }))}
              placeholder="(1) (a+b)² - 4ab = (a - b)² ≥ 0이므로 성립하며 등호는 …일 때 성립한다. (2) a² - 4ab + 5b² = (a - 2b)² + b² ≥ 0이므로 성립하며 등호는 …일 때 성립한다."
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
              다음 단계 (절대부등식1 종결)
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
              STAGE 05 · 5차시 수사 종결 · 절대부등식1 성찰
            </div>
            <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              완전제곱식을 이용한 절대부등식 수사 완료!
            </h3>
            <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
              5차시에서 증명한 두 문제(예제 3 변환 및 문제 3)를 되돌아보며 핵심 아이디어를 정리하고, 6차시(산술평균과 기하평균) 수사로 나아가 봅시다.
            </p>
          </div>

          {/* Rubric Check Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
            <div className="text-sm font-bold text-slate-900">5차시 수사 점검표</div>
            <div className="grid gap-2 sm:grid-cols-2 text-xs sm:text-sm">
              {[
                ['1단계: (a, b) 대입 실험 3개 이상 & 실수 제곱 성질 확인', rubric[0]],
                ['2단계: [문제 1] (a²+b²≥ab) 4단계 추론 & 증명 보고서 작성', rubric[1]],
                ['3단계: 두 제곱식의 합 등호 성립 조건 탐색 및 서술', rubric[2]],
                ['4단계: [문제 2] (1)·(2) 4단계 추론 & 증명 보고서 작성', rubric[3]],
                ['5단계: 절대부등식1 탐구 성찰 작성', done[4]],
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
                <label htmlFor="l5-ref1" className="text-sm sm:text-base font-bold text-slate-900">
                  성찰 1. 이차식으로 이루어진 부등식이 모든 실수에서 성립함을 증명할 때 ‘완전제곱식’이 강력한 도구가 되는 이유는 무엇인가요?
                </label>
                <CharCountBadge text={state.reflection1} min={20} />
              </div>
              <textarea
                id="l5-ref1"
                rows={3}
                value={state.reflection1}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection1: e.target.value }))}
                placeholder="실수를 제곱하면 항상 … 이상이라는 성질 덕분에, 식을 완전제곱식의 합으로 바꾸면 …임을 한눈에 보일 수 있기 때문이다."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label htmlFor="l5-ref2" className="text-sm sm:text-base font-bold text-slate-900">
                  성찰 2. [문제 2]의 (1) (a − b)² ≥ 0과 (2) (a − 2b)² + b² ≥ 0에서 등호가 성립하는 조건의 차이를 비교해 적어 보세요.
                </label>
                <CharCountBadge text={state.reflection2} min={15} />
              </div>
              <textarea
                id="l5-ref2"
                rows={3}
                value={state.reflection2}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection2: e.target.value }))}
                placeholder="(1)은 제곱식이 하나여서 …일 때 등호가 성립하지만, (2)는 두 제곱식의 합이어서 …일 때만 등호가 성립한다."
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
              onClick={onGoToLesson6}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              6차시(절대부등식2 · 산술·기하평균) 수사로 이동
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
