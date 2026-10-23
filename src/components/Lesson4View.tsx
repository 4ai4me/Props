import React, { useState } from 'react';
import {
  Lesson4State,
  PROOF4_PROB1_STEPS,
  PROOF4_PROB2_STEPS,
  calc4Coprime,
  safeN,
  evaluateLevel4Completion,
} from '../utils/mathLogic';
import {
  CheckCircle2,
  HelpCircle,
  Trash2,
  Plus,
} from 'lucide-react';
import { CharCountBadge, getCharCountBorderClass } from './CharCountBadge';
import { MathText, MathPreviewBox } from './MathText';

export interface Lesson4ViewProps {
  state: Lesson4State;
  step: number;
  onStepChange: (nextStep: number) => void;
  onUpdate: (updater: (prev: Lesson4State) => Lesson4State) => void;
  onGoToLesson5?: () => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const STEP1_CONTRADICTION_HINTS = [
  '귀류법은 어떤 명제가 참임을 보이기 위해, 결론을 부정했을 때 모순이 생김을 보이는 증명법입니다.',
  '양의 유리수는 항상 분모 m과 분자 n이 서로소(최대공약수가 1)인 기약분수 n/m으로 나타낼 수 있습니다.',
  '만약 √2 = n/m이라면 양변을 제곱했을 때 n² = 2m²이 되는 자연수 m, n이 존재해야 하지만, 실제로는 어떤 자연수를 넣어도 n²과 2m²은 같아질 수 없습니다.',
];

const STEP3_CLOSURE_HINTS = [
  '문제 1을 통해 우리는 ‘√2는 유리수가 아니다(무리수이다)’라는 확실한 단서를 얻었습니다.',
  '1 + √2가 유리수 r이라고 가정하면, 양변에서 1을 빼서 √2 = r − 1로 정리할 수 있습니다.',
  '유리수끼리 덧셈·뺄셈을 한 결과는 항상 유리수이므로 우변(r − 1)은 유리수인데, 좌변(√2)은 유리수가 아니므로 모순이 발생합니다.',
];

export const Lesson4View: React.FC<Lesson4ViewProps> = ({
  state,
  step,
  onStepChange,
  onUpdate,
  onGoToLesson5,
  onRequestConfirm,
}) => {
  const [mInputStr, setMInputStr] = useState<string>('5');
  const [nInputStr, setNInputStr] = useState<string>('7');
  const [feedback, setFeedback] = useState<Record<string, { text: string; type: 'good' | 'warn' }>>({});
  const [isStep1HintVisible, setIsStep1HintVisible] = useState<boolean>(false);
  const [visibleProb1Hints, setVisibleProb1Hints] = useState<boolean[]>([false, false, false, false]);
  const [isStep3HintVisible, setIsStep3HintVisible] = useState<boolean>(false);
  const [visibleProb2Hints, setVisibleProb2Hints] = useState<boolean[]>([false, false, false, false]);

  const completion = evaluateLevel4Completion(state);

  const showNotice = (id: string, text: string, type: 'good' | 'warn') => {
    setFeedback((prev) => ({ ...prev, [id]: { text, type } }));
  };

  // Step 0: Add Coprime Fraction Clue
  const handleAddFraction = (rawM: string | number, rawN: string | number) => {
    const m = safeN(rawM);
    const n = safeN(rawN);
    if (m === null || n === null || m < 1 || n < 1) {
      showNotice('fracNotice', '분모 m과 분자 n에 모두 1 이상의 자연수를 입력해 주세요.', 'warn');
      return;
    }
    if (state.fractionExamples.some((v) => v.m === m && v.n === n)) {
      showNotice('fracNotice', `m = ${m}, n = ${n} 조합은 이미 실험 목록에 있습니다.`, 'warn');
      return;
    }
    const item = calc4Coprime(m, n);
    onUpdate((prev) => ({
      ...prev,
      fractionExamples: [...prev.fractionExamples, item],
    }));
    showNotice(
      'fracNotice',
      `n/m = ${n}/${m} 실험 완료: n² = ${item.nSq}, 2m² = ${item.mSq2} → 차이(n² − 2m²) = ${item.diff} (0이 될 수 없음!)`,
      'good'
    );
  };

  // Step 1: Verify Problem 1 Step
  const handleVerifyProb1Step = (i: number) => {
    const picked = state.prob1Choices[i];
    if (picked === null || picked === undefined) {
      showNotice(`prob1_${i}`, '먼저 보기를 선택해 주세요.', 'warn');
      return;
    }
    const isCorrect = picked === PROOF4_PROB1_STEPS[i].answer;
    onUpdate((prev) => {
      const nextVer = [...prev.prob1Verified];
      nextVer[i] = isCorrect;
      return { ...prev, prob1Verified: nextVer };
    });
    if (isCorrect) {
      showNotice(`prob1_${i}`, '정확합니다! 귀류법 추리 단계가 올바르게 연결되었습니다.', 'good');
    } else {
      showNotice(`prob1_${i}`, '다시 생각해 보세요. [힌트 보기]를 눌러 단계별 단서를 확인해 보세요.', 'warn');
    }
  };

  const handleToggleProb1Hint = (i: number) => {
    const isCurrentlyVisible = visibleProb1Hints[i];
    if (isCurrentlyVisible) {
      setVisibleProb1Hints((prev) => {
        const next = [...prev];
        next[i] = false;
        return next;
      });
    } else {
      if ((state.prob1Hints[i] || 0) === 0) {
        onUpdate((prev) => {
          const nextHints = [...prev.prob1Hints];
          nextHints[i] = 1;
          return { ...prev, prob1Hints: nextHints };
        });
      }
      setVisibleProb1Hints((prev) => {
        const next = [...prev];
        next[i] = true;
        return next;
      });
    }
  };

  const handleNextProb1Hint = (i: number) => {
    onUpdate((prev) => {
      const nextHints = [...prev.prob1Hints];
      nextHints[i] = Math.min(3, (nextHints[i] || 0) + 1);
      return { ...prev, prob1Hints: nextHints };
    });
    setVisibleProb1Hints((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  // Step 3: Verify Problem 2 Step
  const handleVerifyProb2Step = (i: number) => {
    const picked = state.prob2Choices[i];
    if (picked === null || picked === undefined) {
      showNotice(`prob2_${i}`, '먼저 보기를 선택해 주세요.', 'warn');
      return;
    }
    const isCorrect = picked === PROOF4_PROB2_STEPS[i].answer;
    onUpdate((prev) => {
      const nextVer = [...prev.prob2Verified];
      nextVer[i] = isCorrect;
      return { ...prev, prob2Verified: nextVer };
    });
    if (isCorrect) {
      showNotice(`prob2_${i}`, '정확합니다! 1 + √(2)의 무리수 증명 단계가 확인되었습니다.', 'good');
    } else {
      showNotice(`prob2_${i}`, '다시 점검해 보세요. [힌트 보기]를 누르면 단서를 확인할 수 있습니다.', 'warn');
    }
  };

  const handleToggleProb2Hint = (i: number) => {
    const isCurrentlyVisible = visibleProb2Hints[i];
    if (isCurrentlyVisible) {
      setVisibleProb2Hints((prev) => {
        const next = [...prev];
        next[i] = false;
        return next;
      });
    } else {
      if ((state.prob2Hints[i] || 0) === 0) {
        onUpdate((prev) => {
          const nextHints = [...prev.prob2Hints];
          nextHints[i] = 1;
          return { ...prev, prob2Hints: nextHints };
        });
      }
      setVisibleProb2Hints((prev) => {
        const next = [...prev];
        next[i] = true;
        return next;
      });
    }
  };

  const handleNextProb2Hint = (i: number) => {
    onUpdate((prev) => {
      const nextHints = [...prev.prob2Hints];
      nextHints[i] = Math.min(3, (nextHints[i] || 0) + 1);
      return { ...prev, prob2Hints: nextHints };
    });
    setVisibleProb2Hints((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* STEP 0: 귀류법 단서 탐색 */}
      {step === 0 && (
        <div>
          <div className="text-xs font-bold text-blue-600">04차시 · 1 / 5단계</div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            귀류법(Proof by Contradiction) 단서 탐색
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            결론을 반대로 가정했을 때 숨길 수 없는 ‘논리적 모순’이 드러나는 순간을 포착해 봅시다.
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            <MathText text="수사 의뢰 [문제 1]: √2는 유리수가 아니다." />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-12">
            {/* Left: Fraction Explorer */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">① 기약분수(n/m) 제곱 비교 실험기</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    <MathText text="만약 √2 = n/m이라면 n² = 2m²이어야 합니다. 자연수 m, n을 최소 3쌍 이상 대입해 n²과 2m²이 같아질 수 있는지 실험하세요." />
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="l4mInput" className="block text-xs font-bold text-slate-700 mb-1">
                      분모 m (자연수)
                    </label>
                    <input
                      id="l4mInput"
                      type="text"
                      inputMode="numeric"
                      value={mInputStr}
                      onChange={(e) => setMInputStr(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base font-semibold mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="l4nInput" className="block text-xs font-bold text-slate-700 mb-1">
                      분자 n (자연수)
                    </label>
                    <input
                      id="l4nInput"
                      type="text"
                      inputMode="numeric"
                      value={nInputStr}
                      onChange={(e) => setNInputStr(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base font-semibold mono text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddFraction(mInputStr, nInputStr)}
                  className="w-full inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  분수 n/m 실험 추가
                </button>

                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">
                    <MathText text="√2 (≈ 1.4142...)에 가까운 기약분수 추천" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { m: 1, n: 1, label: '1/1' },
                      { m: 2, n: 3, label: '3/2 (1.5)' },
                      { m: 5, n: 7, label: '7/5 (1.4)' },
                      { m: 12, n: 17, label: '17/12 (1.416)' },
                      { m: 29, n: 41, label: '41/29 (1.4138)' },
                    ].map((pair) => {
                      const exists = state.fractionExamples.some(
                        (e) => e.m === pair.m && e.n === pair.n
                      );
                      return (
                        <button
                          key={pair.label}
                          type="button"
                          onClick={() => handleAddFraction(pair.m, pair.n)}
                          disabled={exists}
                          className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold mono transition-all ${
                            exists
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-60'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pair.label} {exists ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {feedback.fracNotice && (
                  <div
                    role="status"
                    className={`rounded-xl p-3 text-xs sm:text-sm font-medium ${
                      feedback.fracNotice.type === 'good'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {feedback.fracNotice.text}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                <span>실험한 분수: {state.fractionExamples.length}개 (권장 3개 이상)</span>
                {state.fractionExamples.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onRequestConfirm('실험 초기화', '기약분수 실험 기록을 모두 초기화할까요?', () =>
                        onUpdate((prev) => ({ ...prev, fractionExamples: [] }))
                      )
                    }
                    className="inline-flex items-center gap-1 text-rose-600 font-bold hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    초기화
                  </button>
                )}
              </div>
            </div>

            {/* Right: Table & Contradiction Concept Check */}
            <div className="lg:col-span-7 space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                      <th className="py-3 px-4">분수 n/m</th>
                      <th className="py-3 px-4">서로소 여부</th>
                      <th className="py-3 px-4">n² vs 2m²</th>
                      <th className="py-3 px-4">n² = 2m² 성립?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {state.fractionExamples.length > 0 ? (
                      state.fractionExamples.map((item, idx) => (
                        <tr key={`${item.m}-${item.n}-${idx}`}>
                          <td className="py-2.5 px-4 font-bold mono text-slate-900">
                            {item.n} / {item.m}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`text-xs font-bold ${
                                item.coprime ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {item.coprime ? '서로소 (gcd=1)' : `공약수 ${item.g}`}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 mono text-xs sm:text-sm font-semibold text-slate-800">
                            {item.nSq} vs {item.mSq2}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="text-xs font-bold text-rose-600">
                              불일치 (차이 {item.diff > 0 ? `+${item.diff}` : item.diff})
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 px-4 text-center text-slate-400 text-xs sm:text-sm">
                          왼쪽 실험기에서 분수 n/m을 추가해 n² = 2m²이 성립할 수 있는지 확인해 보세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">
                    ② 귀류법의 핵심 전략 점검
                  </h3>
                  <button
                    type="button"
                    aria-expanded={isStep1HintVisible && state.step1HintLevel > 0}
                    onClick={() => {
                      if (isStep1HintVisible && state.step1HintLevel > 0) {
                        setIsStep1HintVisible(false);
                      } else {
                        if ((state.step1HintLevel || 0) === 0) {
                          onUpdate((prev) => ({
                            ...prev,
                            step1HintLevel: 1,
                          }));
                        }
                        setIsStep1HintVisible(true);
                      }
                    }}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                      isStep1HintVisible && state.step1HintLevel > 0
                        ? 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200/70'
                        : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    {isStep1HintVisible && state.step1HintLevel > 0
                      ? `원리 힌트 숨기기 (${state.step1HintLevel}/3)`
                      : `원리 힌트 보기 (${state.step1HintLevel}/3)`}
                  </button>
                </div>

                {isStep1HintVisible && state.step1HintLevel > 0 && (
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-3 text-xs sm:text-sm text-amber-900 space-y-1.5">
                    {STEP1_CONTRADICTION_HINTS.slice(0, state.step1HintLevel).map((h, idx) => (
                      <div key={idx}>
                        <strong>힌트 {idx + 1}:</strong> <MathText text={h} />
                      </div>
                    ))}
                    <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-200/60">
                      {state.step1HintLevel < 3 ? (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdate((prev) => ({
                              ...prev,
                              step1HintLevel: Math.min(3, (prev.step1HintLevel || 0) + 1),
                            }))
                          }
                          className="text-xs font-extrabold text-amber-800 hover:text-amber-950 underline underline-offset-2"
                        >
                          + 다음 단계 힌트 더 보기 ({state.step1HintLevel}/3)
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700">
                          모든 단계 힌트를 확인했습니다 (3/3)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsStep1HintVisible(false)}
                        className="text-xs font-bold text-amber-700 hover:text-amber-950"
                      >
                        힌트 접기 ▲
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs sm:text-sm text-slate-600">
                  귀류법으로 명제가 참임을 증명하는 올바른 논리 순서는 무엇인가요?
                </p>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdate((prev) => ({ ...prev, contradictionConceptChecked: true }))}
                    className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold text-left transition-all ${
                      state.contradictionConceptChecked
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    명제의 결론을 부정하여 가정한다 → 논리적 추론을 통해 가정이나 이미 알려진 사실에 모순됨을 보인다 → 원래 명제가 참이라고 결론짓는다.{' '}
                    {state.contradictionConceptChecked ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate((prev) => ({ ...prev, contradictionConceptChecked: false }));
                      showNotice('contraWarn', '귀류법은 몇 개의 사례를 대입하는 것이 아니라, 결론을 부정했을 때 모순이 발생함을 보이는 증명법입니다.', 'warn');
                    }}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs sm:text-sm font-bold text-left text-slate-700 hover:bg-slate-100"
                  >
                    충분히 많은 기약분수를 대입해 보고 성립하는 분수가 없음을 확인하여 결론짓는다.
                  </button>
                </div>

                {state.contradictionConceptChecked && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm font-medium text-emerald-900">
                    ✓ 귀류법 추리 전략 준비 완료! 다음 단계에서 [문제 1]을 단계별 힌트와 함께 증명해 봅시다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: 문제 1 증명 (√2는 유리수가 아니다) */}
      {step === 1 && (
        <div>
          <div className="text-xs font-bold text-blue-600">04차시 · 2 / 5단계</div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            <MathText text="[문제 1] 귀류법을 이용한 명제의 증명 (√2)" />
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            <MathText text="1차시처럼 단계별 힌트를 활용하여 ‘√2가 유리수’라고 가정했을 때 어떤 모순이 생기는지 증명해 봅시다." />
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            문제 1. 귀류법을 이용하여 다음 명제가 참임을 증명하시오.
            <div className="mt-1.5 text-base sm:text-lg text-blue-950">
              <MathText text="‘√2는 유리수가 아니다.’" />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {PROOF4_PROB1_STEPS.map((t, i) => {
              const verified = state.prob1Verified[i];
              const hintCount = state.prob1Hints[i] || 0;
              const fb = feedback[`prob1_${i}`];
              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-5 transition-colors ${
                    verified ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                    <h3 className="text-base font-bold text-slate-900">
                      {i + 1}. <MathText text={t.q} />
                    </h3>
                    <span
                      className={`text-xs font-extrabold ${
                        verified ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {verified ? '✓ 확인 완료' : '탐구 중'}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {t.opts.map((opt, j) => {
                      const isPicked = state.prob1Choices[i] === j;
                      return (
                        <button
                          key={j}
                          type="button"
                          onClick={() => {
                            onUpdate((prev) => {
                              const nextChoices = [...prev.prob1Choices];
                              const nextVer = [...prev.prob1Verified];
                              nextChoices[i] = j;
                              nextVer[i] = false;
                              return { ...prev, prob1Choices: nextChoices, prob1Verified: nextVer };
                            });
                          }}
                          className={`min-h-[42px] rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold text-left transition-all ${
                            isPicked
                              ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-1 ring-blue-600'
                              : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <MathText text={opt} />
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerifyProb1Step(i)}
                      className="min-h-[40px] rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-blue-700"
                    >
                      이 단계 확인
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleProb1Hint(i)}
                      aria-expanded={Boolean(visibleProb1Hints[i] && hintCount > 0)}
                      className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors ${
                        visibleProb1Hints[i] && hintCount > 0
                          ? 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200/70'
                          : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      <HelpCircle className="h-4 w-4" />
                      {visibleProb1Hints[i] && hintCount > 0
                        ? `힌트 숨기기 (${hintCount}/3)`
                        : `힌트 보기 (${hintCount}/3)`}
                    </button>
                  </div>

                  {visibleProb1Hints[i] && hintCount > 0 && (
                    <div className="mt-3 rounded-xl bg-amber-50/70 border border-amber-200/70 p-3 text-xs sm:text-sm text-amber-900 space-y-1.5">
                      {t.hints.slice(0, hintCount).map((h, hIdx) => (
                        <div key={hIdx}>
                          <strong>힌트 {hIdx + 1}:</strong> <MathText text={h} />
                        </div>
                      ))}
                      <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-200/60">
                        {hintCount < 3 ? (
                          <button
                            type="button"
                            onClick={() => handleNextProb1Hint(i)}
                            className="text-xs font-extrabold text-amber-800 hover:text-amber-950 underline underline-offset-2"
                          >
                            + 다음 단계 힌트 더 보기 ({hintCount}/3)
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700">
                            모든 단계 힌트를 확인했습니다 (3/3)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleProb1Hint(i)}
                          className="text-xs font-bold text-amber-700 hover:text-amber-950"
                        >
                          힌트 접기 ▲
                        </button>
                      </div>
                    </div>
                  )}

                  {fb && (
                    <div
                      role="status"
                      className={`mt-3 rounded-xl p-3 text-xs sm:text-sm font-medium ${
                        fb.type === 'good'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}
                    >
                      <MathText text={fb.text} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                [문제 1] 나의 말로 쓰는 귀류법 증명 보고서
              </h3>
              <CharCountBadge current={state.prob1ProofText.trim().length} min={40} />
            </div>
            <label htmlFor="l4prob1proof" className="block text-xs sm:text-sm text-slate-600 font-semibold mb-2">
              <MathText text="위에서 확인한 4단계를 연결하여 ‘√2는 유리수가 아니다.’의 귀류법 증명을 완결된 문장으로 서술하세요. (40자 이상)" />
            </label>
            <textarea
              id="l4prob1proof"
              rows={6}
              value={state.prob1ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob1ProofText: e.target.value }))}
              placeholder="명제를 부정하여 √(2)가 …라 하면, 서로소인 두 자연수 m과 n에 대하여 √(2) = …으로 나타낼 수 있다. 양변을 제곱하면 … 이므로 …이다. 다시 n = 2k를 대입하면 … 이므로 …이다. 그런데 … 이므로 서로소임에 모순이다. 따라서 …"
              className={`w-full rounded-xl border bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                state.prob1ProofText.trim().length,
                40
              )}`}
            />
            <MathPreviewBox text={state.prob1ProofText} />
          </div>
        </div>
      )}

      {/* STEP 2: 무리수 성질 탐색 (1 + √2 사전 단서) */}
      {step === 2 && (
        <div>
          <div className="text-xs font-bold text-blue-600">04차시 · 3 / 5단계</div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            유리수의 연산 닫힘 성질과 무리수 단서 연결
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            <MathText text="문제 1에서 증명한 ‘√2는 유리수가 아니다’라는 사실을 활용하여 ‘1 + √2는 유리수가 아니다’를 어떻게 증명할지 단서를 찾아봅시다." />
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            <MathText text="수사 의뢰 [문제 2]: 1 + √2는 유리수가 아니다." />
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                ① 이항을 통한 모순 구조 설계
              </h3>
              <button
                type="button"
                aria-expanded={isStep3HintVisible && state.step3HintLevel > 0}
                onClick={() => {
                  if (isStep3HintVisible && state.step3HintLevel > 0) {
                    setIsStep3HintVisible(false);
                  } else {
                    if ((state.step3HintLevel || 0) === 0) {
                      onUpdate((prev) => ({
                        ...prev,
                        step3HintLevel: 1,
                      }));
                    }
                    setIsStep3HintVisible(true);
                  }
                }}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                  isStep3HintVisible && state.step3HintLevel > 0
                    ? 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200/70'
                    : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {isStep3HintVisible && state.step3HintLevel > 0
                  ? `단서 힌트 숨기기 (${state.step3HintLevel}/3)`
                  : `단서 힌트 보기 (${state.step3HintLevel}/3)`}
              </button>
            </div>

            {isStep3HintVisible && state.step3HintLevel > 0 && (
              <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-3 text-xs sm:text-sm text-amber-900 space-y-1.5">
                {STEP3_CLOSURE_HINTS.slice(0, state.step3HintLevel).map((h, idx) => (
                  <div key={idx}>
                    <strong>힌트 {idx + 1}:</strong> <MathText text={h} />
                  </div>
                ))}
                <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-200/60">
                  {state.step3HintLevel < 3 ? (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate((prev) => ({
                          ...prev,
                          step3HintLevel: Math.min(3, (prev.step3HintLevel || 0) + 1),
                        }))
                      }
                      className="text-xs font-extrabold text-amber-800 hover:text-amber-950 underline underline-offset-2"
                    >
                      + 다음 단계 힌트 더 보기 ({state.step3HintLevel}/3)
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700">
                      모든 단계 힌트를 확인했습니다 (3/3)
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsStep3HintVisible(false)}
                    className="text-xs font-bold text-amber-700 hover:text-amber-950"
                  >
                    힌트 접기 ▲
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 space-y-2">
              <div>
                <strong>가정 (결론 부정):</strong>{' '}
                <MathText text="1 + √2 = r" className="mono font-bold" /> (단,{' '}
                <span className="mono font-bold">r</span>은 유리수)
              </div>
              <div>
                <strong><MathText text="√2에 대하여 정리:" /></strong>{' '}
                <MathText text="√2 = r − 1" className="mono font-bold text-blue-700" />
              </div>
            </div>

            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mb-2">
                r이 유리수일 때, 우변 r − 1에 대한 설명으로 옳은 것을 선택하세요.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onUpdate((prev) => ({ ...prev, closureChecked: true }))}
                  className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold text-left transition-all ${
                    state.closureChecked
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  유리수끼리의 뺄셈 결과는 항상 유리수이므로 r − 1은 유리수이다. {state.closureChecked ? '✓' : ''}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate((prev) => ({ ...prev, closureChecked: false }))}
                  className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs sm:text-sm font-bold text-left text-slate-700 hover:bg-slate-100"
                >
                  유리수에서 1을 빼면 무리수가 될 수도 있다.
                </button>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="l4closureReason" className="block text-sm font-bold text-slate-800">
                  <MathText text="② 등식 √2 = r − 1에서 왜 모순이 발생하는지 한 문장으로 정리해 보세요. (15자 이상)" />
                </label>
                <CharCountBadge current={state.closureReason.trim().length} min={15} />
              </div>
              <textarea
                id="l4closureReason"
                rows={3}
                value={state.closureReason}
                onChange={(e) => onUpdate((prev) => ({ ...prev, closureReason: e.target.value }))}
                placeholder="우변 r − 1은 …인데 좌변 √(2)는 …이므로 서로 같을 수 없어 모순이다."
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.closureReason.trim().length,
                  15
                )}`}
              />
              <MathPreviewBox text={state.closureReason} />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: 문제 2 증명 (1 + √2는 유리수가 아니다) */}
      {step === 3 && (
        <div>
          <div className="text-xs font-bold text-blue-600">04차시 · 4 / 5단계</div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            <MathText text="[문제 2] 귀류법을 이용한 명제의 증명 (1 + √2)" />
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            <MathText text="단계별 힌트를 활용하여 ‘1 + √2는 유리수가 아니다.’의 귀류법 증명을 완성해 봅시다." />
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            문제 2. 귀류법을 이용하여 다음 명제가 참임을 증명하시오.
            <div className="mt-1.5 text-base sm:text-lg text-blue-950">
              <MathText text="‘1 + √2는 유리수가 아니다.’" />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {PROOF4_PROB2_STEPS.map((t, i) => {
              const verified = state.prob2Verified[i];
              const hintCount = state.prob2Hints[i] || 0;
              const fb = feedback[`prob2_${i}`];
              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-5 transition-colors ${
                    verified ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                    <h3 className="text-base font-bold text-slate-900">
                      {i + 1}. <MathText text={t.q} />
                    </h3>
                    <span
                      className={`text-xs font-extrabold ${
                        verified ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {verified ? '✓ 확인 완료' : '탐구 중'}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {t.opts.map((opt, j) => {
                      const isPicked = state.prob2Choices[i] === j;
                      return (
                        <button
                          key={j}
                          type="button"
                          onClick={() => {
                            onUpdate((prev) => {
                              const nextChoices = [...prev.prob2Choices];
                              const nextVer = [...prev.prob2Verified];
                              nextChoices[i] = j;
                              nextVer[i] = false;
                              return { ...prev, prob2Choices: nextChoices, prob2Verified: nextVer };
                            });
                          }}
                          className={`min-h-[42px] rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold text-left transition-all ${
                            isPicked
                              ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-1 ring-blue-600'
                              : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <MathText text={opt} />
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerifyProb2Step(i)}
                      className="min-h-[40px] rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-blue-700"
                    >
                      이 단계 확인
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleProb2Hint(i)}
                      aria-expanded={Boolean(visibleProb2Hints[i] && hintCount > 0)}
                      className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors ${
                        visibleProb2Hints[i] && hintCount > 0
                          ? 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200/70'
                          : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      <HelpCircle className="h-4 w-4" />
                      {visibleProb2Hints[i] && hintCount > 0
                        ? `힌트 숨기기 (${hintCount}/3)`
                        : `힌트 보기 (${hintCount}/3)`}
                    </button>
                  </div>

                  {visibleProb2Hints[i] && hintCount > 0 && (
                    <div className="mt-3 rounded-xl bg-amber-50/70 border border-amber-200/70 p-3 text-xs sm:text-sm text-amber-900 space-y-1.5">
                      {t.hints.slice(0, hintCount).map((h, hIdx) => (
                        <div key={hIdx}>
                          <strong>힌트 {hIdx + 1}:</strong> <MathText text={h} />
                        </div>
                      ))}
                      <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-200/60">
                        {hintCount < 3 ? (
                          <button
                            type="button"
                            onClick={() => handleNextProb2Hint(i)}
                            className="text-xs font-extrabold text-amber-800 hover:text-amber-950 underline underline-offset-2"
                          >
                            + 다음 단계 힌트 더 보기 ({hintCount}/3)
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700">
                            모든 단계 힌트를 확인했습니다 (3/3)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleProb2Hint(i)}
                          className="text-xs font-bold text-amber-700 hover:text-amber-950"
                        >
                          힌트 접기 ▲
                        </button>
                      </div>
                    </div>
                  )}

                  {fb && (
                    <div
                      role="status"
                      className={`mt-3 rounded-xl p-3 text-xs sm:text-sm font-medium ${
                        fb.type === 'good'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}
                    >
                      <MathText text={fb.text} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                [문제 2] 나의 말로 쓰는 귀류법 증명 보고서
              </h3>
              <CharCountBadge current={state.prob2ProofText.trim().length} min={35} />
            </div>
            <label htmlFor="l4prob2proof" className="block text-xs sm:text-sm text-slate-600 font-semibold mb-2">
              <MathText text="위에서 확인한 4단계를 연결하여 ‘1 + √2는 유리수가 아니다.’의 귀류법 증명을 완성하세요. (35자 이상)" />
            </label>
            <textarea
              id="l4prob2proof"
              rows={5}
              value={state.prob2ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob2ProofText: e.target.value }))}
              placeholder="명제를 부정하여 1 + √(2)가 …라 하면, 유리수 r에 대하여 1 + √(2) = r, 즉 √(2) = …로 나타낼 수 있다. 이때 r과 1이 모두 유리수이므로 …도 유리수이다. 그런데 이는 √(2)가 …라는 사실에 모순이다. 따라서 …"
              className={`w-full rounded-xl border bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                state.prob2ProofText.trim().length,
                35
              )}`}
            />
            <MathPreviewBox text={state.prob2ProofText} />
          </div>
        </div>
      )}

      {/* STEP 4: 전체 수사 종결 */}
      {step === 4 && (
        <div>
          <div className="text-xs font-bold text-blue-600">04차시 · 5 / 5단계</div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            귀류법 수사 및 1~4차시 전체 프로젝트 종결
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            직접 증명, 반례 탐색, 대우법, 귀류법까지 수학 탐정단의 모든 수사 기법을 마스터했습니다.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="l4ref1" className="block text-sm font-bold text-slate-800">
                  1. 귀류법으로 증명할 때 ‘결론을 부정하는 이유’와 ‘모순을 찾는 과정’의 핵심을 정리해 보세요. (20자 이상)
                </label>
                <CharCountBadge current={state.reflection1.trim().length} min={20} />
              </div>
              <textarea
                id="l4ref1"
                rows={4}
                value={state.reflection1}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection1: e.target.value }))}
                placeholder="‘…가 아니다’처럼 직접 식을 세우기 어려운 명제에서 결론을 부정하면 … 형태로 식을 쓸 수 있고, 이로부터 …에 모순됨을 보여 참임을 입증한다."
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.reflection1.trim().length,
                  20
                )}`}
              />
              <MathPreviewBox text={state.reflection1} />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="l4ref2" className="block text-sm font-bold text-slate-800">
                  2. 대우를 이용한 증명(3차시)과 귀류법(4차시)은 각각 어떤 특징이 있는지 비교해 보세요. (20자 이상)
                </label>
                <CharCountBadge current={state.reflection2.trim().length} min={20} />
              </div>
              <textarea
                id="l4ref2"
                rows={4}
                value={state.reflection2}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection2: e.target.value }))}
                placeholder="대우법은 명제 p → q 대신 …가 참임을 보이는 방법이고, 귀류법은 결론을 부정하여 …이 생김을 보이는 방법이다."
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.reflection2.trim().length,
                  20
                )}`}
              />
              <MathPreviewBox text={state.reflection2} />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <h3 className="text-lg font-extrabold text-emerald-950">
                  04차시 귀류법 수사 완료 · 실시간 자동 제출
                </h3>
              </div>
              <p className="mt-1.5 text-sm text-emerald-800">
                작성한 귀류법 증명 보고서가 클라우드와 브라우저에 안전하게 보관되었습니다. 이어서 5차시(절대부등식1) 수사로 이동해 보세요!
              </p>
            </div>
            {onGoToLesson5 && (
              <button
                type="button"
                onClick={onGoToLesson5}
                className="min-h-[44px] rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0 transition-colors"
              >
                5차시(절대부등식1)로 이동 →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Step Pager */}
      <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onStepChange(Math.max(0, step - 1))}
          disabled={step === 0}
          className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          이전 단계
        </button>
        <div className="text-xs font-bold text-slate-400 mono">
          STAGE 0{step + 1} / 05 {completion[step] ? '· 완료 ✓' : ''}
        </div>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => onStepChange(Math.min(4, step + 1))}
            className="min-h-[44px] rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
          >
            다음 단계
          </button>
        ) : onGoToLesson5 ? (
          <button
            type="button"
            onClick={onGoToLesson5}
            className="min-h-[44px] rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            5차시로 이동 →
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-[44px] rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white opacity-40"
          >
            다음 단계
          </button>
        )}
      </div>
    </div>
  );
};
