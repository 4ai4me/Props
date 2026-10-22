import React, { useState } from 'react';
import {
  Lesson3State,
  PROOF3_PROB1_STEPS,
  PROOF3_PROB2_STEPS,
  calc3Parity,
  calc3Mod3,
  safeN,
  evaluateLevel3Completion,
} from '../utils/mathLogic';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
  Shuffle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { CharCountBadge, getCharCountBorderClass } from './CharCountBadge';

export interface Lesson3ViewProps {
  state: Lesson3State;
  step: number;
  onStepChange: (nextStep: number) => void;
  onUpdate: (updater: (prev: Lesson3State) => Lesson3State) => void;
  onGoToLesson4: () => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const STEP1_CONCEPT_HINTS = [
  '명제 p → q가 참이면 그 대우 ~q → ~p도 항상 참입니다.',
  '‘n²이 짝수이면’에서 출발하면 n = √(2k) 형태가 되어 자연수 성질을 다루기 까다롭습니다.',
  '반면 결론을 부정한 ‘n이 홀수이면(n = 2k − 1)’에서 출발하면 제곱 전개만으로 n²이 홀수임을 곧바로 보일 수 있습니다.',
];

const STEP3_MOD3_HINTS = [
  '자연수를 3으로 나누었을 때 나올 수 있는 나머지는 0, 1, 2뿐입니다.',
  '나머지가 0이면 3의 배수(3k)이고, 나머지가 1 또는 2이면 3의 배수가 아닙니다.',
  '자연수 k(k = 1, 2, 3, ...)에 대하여 나머지가 1인 자연수는 3k − 2, 나머지가 2인 자연수는 3k − 1로 빠짐없이 표현됩니다.',
];

export const Lesson3View: React.FC<Lesson3ViewProps> = ({
  state,
  step,
  onStepChange,
  onUpdate,
  onGoToLesson4,
  onRequestConfirm,
}) => {
  const [parityInputStr, setParityInputStr] = useState<string>('3');
  const [mod3InputStr, setMod3InputStr] = useState<string>('4');
  const [feedback, setFeedback] = useState<Record<string, { text: string; type: 'good' | 'warn' }>>({});
  const [isStep1HintVisible, setIsStep1HintVisible] = useState<boolean>(false);
  const [visibleProb1Hints, setVisibleProb1Hints] = useState<boolean[]>([false, false, false, false]);
  const [isStep3HintVisible, setIsStep3HintVisible] = useState<boolean>(false);
  const [visibleProb2Hints, setVisibleProb2Hints] = useState<boolean[]>([false, false, false, false]);

  const completion = evaluateLevel3Completion(state);

  const showNotice = (id: string, text: string, type: 'good' | 'warn') => {
    setFeedback((prev) => ({ ...prev, [id]: { text, type } }));
  };

  // Step 0: Add Parity Clue
  const handleAddParity = (rawVal: string | number) => {
    const n = safeN(rawVal);
    if (n === null || n < 1) {
      showNotice('parityNotice', '1 이상의 자연수(1 ~ 10,000)를 입력해 주세요.', 'warn');
      return;
    }
    if (state.parityExamples.some((v) => v.n === n)) {
      showNotice('parityNotice', `자연수 n = ${n}은(는) 이미 단서 목록에 있습니다.`, 'warn');
      return;
    }
    const item = calc3Parity(n);
    onUpdate((prev) => ({
      ...prev,
      parityExamples: [...prev.parityExamples, item].sort((a, b) => a.n - b.n),
    }));
    showNotice(
      'parityNotice',
      `n = ${n} (${item.nIsOdd ? '홀수' : '짝수'}) → n² = ${item.sq} (${item.sqIsOdd ? '홀수' : '짝수'}) 단서를 추가했습니다.`,
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
    const isCorrect = picked === PROOF3_PROB1_STEPS[i].answer;
    onUpdate((prev) => {
      const nextVer = [...prev.prob1Verified];
      nextVer[i] = isCorrect;
      return { ...prev, prob1Verified: nextVer };
    });
    if (isCorrect) {
      showNotice(`prob1_${i}`, '정확합니다! 대우 증명의 논리 단계가 올바르게 연결되었습니다.', 'good');
    } else {
      showNotice(`prob1_${i}`, '다시 생각해 보세요. 막히면 [힌트 보기]를 눌러 단계별 단서를 확인하세요.', 'warn');
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

  // Step 2: Add Mod 3 Clue
  const handleAddMod3 = (rawVal: string | number) => {
    const n = safeN(rawVal);
    if (n === null || n < 1) {
      showNotice('mod3Notice', '1 이상의 자연수(1 ~ 10,000)를 입력해 주세요.', 'warn');
      return;
    }
    if (state.mod3Examples.some((v) => v.n === n)) {
      showNotice('mod3Notice', `자연수 n = ${n}은(는) 이미 목록에 있습니다.`, 'warn');
      return;
    }
    const item = calc3Mod3(n);
    onUpdate((prev) => ({
      ...prev,
      mod3Examples: [...prev.mod3Examples, item].sort((a, b) => a.n - b.n),
    }));
    showNotice(
      'mod3Notice',
      `n = ${n} (3으로 나눈 나머지 ${item.nRem3}) → n² = ${item.sq} (3으로 나눈 나머지 ${item.sqRem3}) 기록 완료!`,
      'good'
    );
  };

  // Step 3: Verify Problem 2 Step
  const handleVerifyProb2Step = (i: number) => {
    const picked = state.prob2Choices[i];
    if (picked === null || picked === undefined) {
      showNotice(`prob2_${i}`, '먼저 보기를 선택해 주세요.', 'warn');
      return;
    }
    const isCorrect = picked === PROOF3_PROB2_STEPS[i].answer;
    onUpdate((prev) => {
      const nextVer = [...prev.prob2Verified];
      nextVer[i] = isCorrect;
      return { ...prev, prob2Verified: nextVer };
    });
    if (isCorrect) {
      showNotice(`prob2_${i}`, '정확합니다! 3의 배수 대우 증명 단계가 확인되었습니다.', 'good');
    } else {
      showNotice(`prob2_${i}`, '다시 점검해 보세요. [힌트 보기]를 누르면 식 변형 단서를 볼 수 있습니다.', 'warn');
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
      {/* STEP 0: 대우 단서 탐색 */}
      {step === 0 && (
        <div>
          <div className="text-xs font-bold text-blue-600">03차시 · 1 / 5단계</div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            대우(Contrapositive) 단서 탐색
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            직접 증명하기 까다로운 명제를 만났을 때, 탐정은 왜 ‘대우(~q → ~p)’를 먼저 조사할까요?
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            수사 의뢰 [문제 1]: 자연수 n에 대하여 n²이 짝수이면 n도 짝수이다.
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-12">
            {/* Left: Input & Quick Chips */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">① 자연수 홀·짝 단서 실험기</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    자연수 n을 최소 3개 이상 대입하여 n과 n²의 홀짝성이 어떻게 대응되는지 관찰하세요.
                  </p>
                </div>

                <div>
                  <label htmlFor="l3parityInput" className="block text-xs font-bold text-slate-700 mb-1.5">
                    자연수 n 입력
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="l3parityInput"
                      type="text"
                      inputMode="numeric"
                      value={parityInputStr}
                      onChange={(e) => setParityInputStr(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddParity(parityInputStr);
                        }
                      }}
                      placeholder="자연수 입력"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold mono text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddParity(parityInputStr)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shrink-0 whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4" />
                      단서 추가
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">빠른 추천 자연수</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((val) => {
                      const exists = state.parityExamples.some((e) => e.n === val);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleAddParity(val)}
                          disabled={exists}
                          className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold mono transition-all ${
                            exists
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-60'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          n={val} {exists ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {feedback.parityNotice && (
                  <div
                    role="status"
                    className={`rounded-xl p-3 text-xs sm:text-sm font-medium ${
                      feedback.parityNotice.type === 'good'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {feedback.parityNotice.text}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                <span>수집된 단서: {state.parityExamples.length}개 (권장 3개 이상)</span>
                {state.parityExamples.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onRequestConfirm('단서 목록 초기화', '수집한 자연수 단서를 모두 지울까요?', () =>
                        onUpdate((prev) => ({ ...prev, parityExamples: [] }))
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

            {/* Right: Table & Contrapositive Strategy Check */}
            <div className="lg:col-span-7 space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                      <th className="py-3 px-4">자연수 n</th>
                      <th className="py-3 px-4">n의 홀짝</th>
                      <th className="py-3 px-4">제곱 n²</th>
                      <th className="py-3 px-4">n²의 홀짝</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {state.parityExamples.length > 0 ? (
                      state.parityExamples.map((item) => (
                        <tr key={item.n}>
                          <td className="py-2.5 px-4 font-bold mono text-slate-900">{item.n}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`text-xs font-bold ${
                                item.nIsOdd ? 'text-amber-700' : 'text-blue-700'
                              }`}
                            >
                              {item.nIsOdd ? '홀수 (2k−1)' : '짝수 (2k)'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-bold mono text-slate-900">{item.sq}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`text-xs font-bold ${
                                item.sqIsOdd ? 'text-amber-700' : 'text-blue-700'
                              }`}
                            >
                              {item.sqIsOdd ? '홀수' : '짝수'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 px-4 text-center text-slate-400 text-xs sm:text-sm">
                          왼쪽 실험기에서 자연수를 추가해 n과 n²의 홀짝 관계를 확인해 보세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">
                    ② 왜 직접 증명 대신 ‘대우’를 이용할까?
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
                      ? `단서 힌트 숨기기 (${state.step1HintLevel}/3)`
                      : `단서 힌트 보기 (${state.step1HintLevel}/3)`}
                  </button>
                </div>

                {isStep1HintVisible && state.step1HintLevel > 0 && (
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-3 text-xs sm:text-sm text-amber-900 space-y-1.5">
                    {STEP1_CONCEPT_HINTS.slice(0, state.step1HintLevel).map((h, idx) => (
                      <div key={idx}>
                        <strong>힌트 {idx + 1}:</strong> {h}
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
                  원래 명제 <strong className="text-slate-900">p → q</strong>와 참·거짓이 항상 일치하여 대신 증명할 수 있는 명제는 무엇인가요?
                </p>

                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { id: 'converse', label: '역 (q → p)' },
                    { id: 'inverse', label: '이 (~p → ~q)' },
                    { id: 'contrapositive', label: '대우 (~q → ~p)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        onUpdate((prev) => ({
                          ...prev,
                          contrapositiveChoice: opt.id as Lesson3State['contrapositiveChoice'],
                        }))
                      }
                      className={`min-h-[44px] rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                        state.contrapositiveChoice === opt.id
                          ? opt.id === 'contrapositive'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                            : 'border-amber-500 bg-amber-50 text-amber-950'
                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {state.contrapositiveChoice && (
                  <div
                    className={`rounded-xl p-3 text-xs sm:text-sm font-medium ${
                      state.contrapositiveChoice === 'contrapositive'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {state.contrapositiveChoice === 'contrapositive'
                      ? '✓ 정답입니다! 명제 p → q가 참이면 대우 ~q → ~p도 항상 참이므로, 대우를 증명하면 원래 명제가 증명됩니다.'
                      : '역(q → p)이나 이(~p → ~q)는 원래 명제가 참이어도 거짓일 수 있습니다. 원래 명제와 진릿값이 항상 같은 것을 골라 보세요.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: 문제 1 증명 (짝수 대우법) */}
      {step === 1 && (
        <div>
          <div className="text-xs font-bold text-blue-600">03차시 · 2 / 5단계</div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            [문제 1] 대우를 이용한 명제의 증명 (짝수·홀수)
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            1차시처럼 단계별 힌트를 활용하여 대우 명제를 세우고 대수적으로 증명해 봅시다.
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            문제 1. 대우를 이용하여 다음 명제가 참임을 증명하시오.
            <div className="mt-1.5 text-base sm:text-lg text-blue-950">
              ‘자연수 n에 대하여 n²이 짝수이면 n도 짝수이다.’
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {PROOF3_PROB1_STEPS.map((t, i) => {
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
                      {i + 1}. {t.q}
                    </h3>
                    <span
                      className={`text-xs font-extrabold ${
                        verified ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {verified ? '✓ 확인 완료' : '탐구 중'}
                    </span>
                  </div>

                  <div>
                    <label htmlFor={`prob3_1_choice_${i}`} className="sr-only">
                      문제 1 증명 {i + 1}단계 선택
                    </label>
                    <select
                      id={`prob3_1_choice_${i}`}
                      value={state.prob1Choices[i] === null ? '' : String(state.prob1Choices[i])}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        onUpdate((prev) => {
                          const nextChoices = [...prev.prob1Choices];
                          const nextVer = [...prev.prob1Verified];
                          nextChoices[i] = val;
                          nextVer[i] = false;
                          return { ...prev, prob1Choices: nextChoices, prob1Verified: nextVer };
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base text-slate-900"
                    >
                      <option value="">답을 선택하세요</option>
                      {t.opts.map((opt, j) => (
                        <option key={j} value={j}>
                          {opt}
                        </option>
                      ))}
                    </select>
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
                          <strong>힌트 {hIdx + 1}:</strong> {h}
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
                      {fb.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                [문제 1] 나의 말로 쓰는 대우 증명 보고서
              </h3>
              <CharCountBadge current={state.prob1ProofText.trim().length} min={35} />
            </div>
            <label htmlFor="l3prob1proof" className="block text-xs sm:text-sm text-slate-600 font-semibold mb-2">
              위에서 확인한 4단계를 연결하여 ‘자연수 n에 대하여 n²이 짝수이면 n도 짝수이다.’의 증명을 완성하세요. (35자 이상)
            </label>
            <textarea
              id="l3prob1proof"
              rows={5}
              value={state.prob1ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob1ProofText: e.target.value }))}
              placeholder="주어진 명제의 대우는 ‘…’이다. 자연수 n이 …이면 n = … (k는 자연수)로 나타낼 수 있다. 이때 n² = … 이므로 …이다. 따라서 …"
              className={`w-full rounded-xl border bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                state.prob1ProofText.trim().length,
                35
              )}`}
            />
          </div>
        </div>
      )}

      {/* STEP 2: 3의 배수 단서 탐색 */}
      {step === 2 && (
        <div>
          <div className="text-xs font-bold text-blue-600">03차시 · 3 / 5단계</div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            3으로 나눈 나머지 분류 탐색
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            두 번째 사건인 ‘3의 배수’ 명제를 해결하기 전에, 3의 배수가 아닌 자연수들을 어떻게 분류할지 실험해 봅시다.
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            수사 의뢰 [문제 2]: 자연수 n에 대하여 n²이 3의 배수이면 n도 3의 배수이다.
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">① 3으로 나눈 나머지 분석기</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    자연수 n을 최소 3개 이상 대입하여 n을 3으로 나눈 나머지와 n²을 3으로 나눈 나머지를 비교해 보세요.
                  </p>
                </div>

                <div>
                  <label htmlFor="l3mod3Input" className="block text-xs font-bold text-slate-700 mb-1.5">
                    자연수 n 입력
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="l3mod3Input"
                      type="text"
                      inputMode="numeric"
                      value={mod3InputStr}
                      onChange={(e) => setMod3InputStr(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMod3(mod3InputStr);
                        }
                      }}
                      placeholder="자연수 입력"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold mono text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddMod3(mod3InputStr)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shrink-0 whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4" />
                      단서 추가
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">빠른 추천 자연수 (나머지 1, 2, 0 비교)</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((val) => {
                      const exists = state.mod3Examples.some((e) => e.n === val);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleAddMod3(val)}
                          disabled={exists}
                          className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold mono transition-all ${
                            exists
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-60'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          n={val} {exists ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {feedback.mod3Notice && (
                  <div
                    role="status"
                    className={`rounded-xl p-3 text-xs sm:text-sm font-medium ${
                      feedback.mod3Notice.type === 'good'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {feedback.mod3Notice.text}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                <span>수집된 단서: {state.mod3Examples.length}개 (권장 3개 이상)</span>
                {state.mod3Examples.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onRequestConfirm('단서 초기화', '3의 배수 탐색 기록을 초기화할까요?', () =>
                        onUpdate((prev) => ({ ...prev, mod3Examples: [] }))
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

            <div className="lg:col-span-7 space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                      <th className="py-3 px-4">자연수 n</th>
                      <th className="py-3 px-4">n ÷ 3 나머지</th>
                      <th className="py-3 px-4">제곱 n²</th>
                      <th className="py-3 px-4">n² ÷ 3 나머지</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {state.mod3Examples.length > 0 ? (
                      state.mod3Examples.map((item) => (
                        <tr key={item.n}>
                          <td className="py-2.5 px-4 font-bold mono text-slate-900">{item.n}</td>
                          <td className="py-2.5 px-4 font-semibold mono text-slate-700">
                            나머지 {item.nRem3}{' '}
                            <span className="text-xs text-slate-500">
                              ({item.nRem3 === 0 ? '3k' : item.nRem3 === 1 ? '3k−2' : '3k−1'})
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-bold mono text-slate-900">{item.sq}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`text-xs font-bold ${
                                item.sqRem3 === 0 ? 'text-blue-700' : 'text-emerald-700'
                              }`}
                            >
                              나머지 {item.sqRem3} ({item.sqRem3 === 0 ? '3의 배수' : '3의 배수 아님'})
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 px-4 text-center text-slate-400 text-xs sm:text-sm">
                          자연수 n을 입력하여 3으로 나눈 나머지의 규칙을 관찰해 보세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">
                    ② 3의 배수가 아닌 자연수의 두 가지 형태 확인
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
                      ? `분류 힌트 숨기기 (${state.step3HintLevel}/3)`
                      : `분류 힌트 보기 (${state.step3HintLevel}/3)`}
                  </button>
                </div>

                {isStep3HintVisible && state.step3HintLevel > 0 && (
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-3 text-xs sm:text-sm text-amber-900 space-y-1.5">
                    {STEP3_MOD3_HINTS.slice(0, state.step3HintLevel).map((h, idx) => (
                      <div key={idx}>
                        <strong>힌트 {idx + 1}:</strong> {h}
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

                <p className="text-xs sm:text-sm text-slate-600">
                  n이 3의 배수가 아닐 때(나머지가 1 또는 2일 때), n²을 3으로 나눈 나머지는 항상 얼마가 되나요?
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => onUpdate((prev) => ({ ...prev, mod3CasesChecked: true }))}
                    className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold text-left transition-all ${
                      state.mod3CasesChecked
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    n = 3k−2일 때와 n = 3k−1일 때 모두 n²을 3으로 나눈 나머지가 1이므로 3의 배수가 아니다. {state.mod3CasesChecked ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate((prev) => ({ ...prev, mod3CasesChecked: false }));
                      showNotice('mod3CaseWarn', '위 표에서 나머지가 1인 수(1, 4, ...)와 2인 수(2, 5, ...)의 제곱을 3으로 나눈 나머지를 다시 확인해 보세요!', 'warn');
                    }}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs sm:text-sm font-bold text-left text-slate-700 hover:bg-slate-100"
                  >
                    n = 3k−1일 때는 n²이 3의 배수가 되는 경우가 존재한다.
                  </button>
                </div>

                {state.mod3CasesChecked && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm font-medium text-emerald-900">
                    ✓ 핵심 단서 확보 완료! 이제 다음 단계에서 문제 2의 대우 증명을 완성해 봅시다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: 문제 2 증명 (3의 배수 대우법) */}
      {step === 3 && (
        <div>
          <div className="text-xs font-bold text-blue-600">03차시 · 4 / 5단계</div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            [문제 2] 대우를 이용한 명제의 증명 (3의 배수)
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            두 가지 경우(n = 3k − 2, n = 3k − 1)로 나누어 대우가 참임을 단계별로 증명해 봅시다.
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            문제 2. 대우를 이용하여 다음 명제가 참임을 증명하시오.
            <div className="mt-1.5 text-base sm:text-lg text-blue-950">
              ‘자연수 n에 대하여 n²이 3의 배수이면 n도 3의 배수이다.’
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {PROOF3_PROB2_STEPS.map((t, i) => {
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
                      {i + 1}. {t.q}
                    </h3>
                    <span
                      className={`text-xs font-extrabold ${
                        verified ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {verified ? '✓ 확인 완료' : '탐구 중'}
                    </span>
                  </div>

                  <div>
                    <label htmlFor={`prob3_2_choice_${i}`} className="sr-only">
                      문제 2 증명 {i + 1}단계 선택
                    </label>
                    <select
                      id={`prob3_2_choice_${i}`}
                      value={state.prob2Choices[i] === null ? '' : String(state.prob2Choices[i])}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        onUpdate((prev) => {
                          const nextChoices = [...prev.prob2Choices];
                          const nextVer = [...prev.prob2Verified];
                          nextChoices[i] = val;
                          nextVer[i] = false;
                          return { ...prev, prob2Choices: nextChoices, prob2Verified: nextVer };
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base text-slate-900"
                    >
                      <option value="">답을 선택하세요</option>
                      {t.opts.map((opt, j) => (
                        <option key={j} value={j}>
                          {opt}
                        </option>
                      ))}
                    </select>
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
                          <strong>힌트 {hIdx + 1}:</strong> {h}
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
                      {fb.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                [문제 2] 나의 말로 쓰는 대우 증명 보고서
              </h3>
              <CharCountBadge current={state.prob2ProofText.trim().length} min={40} />
            </div>
            <label htmlFor="l3prob2proof" className="block text-xs sm:text-sm text-slate-600 font-semibold mb-2">
              위에서 확인한 4단계를 연결하여 ‘자연수 n에 대하여 n²이 3의 배수이면 n도 3의 배수이다.’의 증명을 서술하세요. (40자 이상)
            </label>
            <textarea
              id="l3prob2proof"
              rows={6}
              value={state.prob2ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob2ProofText: e.target.value }))}
              placeholder="주어진 명제의 대우는 ‘…’이다. n이 3의 배수가 아니면 자연수 k에 대하여 (i) n = … 일 때 n² = … 이고, (ii) n = … 일 때 n² = … 이므로 두 경우 모두 …이다. 따라서 …"
              className={`w-full rounded-xl border bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                state.prob2ProofText.trim().length,
                40
              )}`}
            />
          </div>
        </div>
      )}

      {/* STEP 4: 사건 종결·성찰 */}
      {step === 4 && (
        <div>
          <div className="text-xs font-bold text-blue-600">03차시 · 5 / 5단계</div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            대우법 수사 종결 · 다음 사건 예고
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            대우를 이용한 두 가지 증명 사건을 돌아보고, 4차시 귀류법 수사로 나아갈 준비를 합시다.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="l3ref1" className="block text-sm font-bold text-slate-800">
                  1. 원래 명제를 직접 증명하기보다 ‘대우’를 이용하여 증명할 때 어떤 점이 편리했나요? (20자 이상)
                </label>
                <CharCountBadge current={state.reflection1.trim().length} min={20} />
              </div>
              <textarea
                id="l3ref1"
                rows={4}
                value={state.reflection1}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection1: e.target.value }))}
                placeholder="가정이 n²에 대한 조건일 때보다 대우를 통해 n에 대한 조건으로 바꾸었을 때 식 변형이 …하기 때문에 …이다."
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.reflection1.trim().length,
                  20
                )}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="l3ref2" className="block text-sm font-bold text-slate-800">
                  2. 문제 1(짝수·홀수)과 문제 2(3의 배수)에서 경우를 나누는 방식의 차이는 무엇이었나요? (15자 이상)
                </label>
                <CharCountBadge current={state.reflection2.trim().length} min={15} />
              </div>
              <textarea
                id="l3ref2"
                rows={3}
                value={state.reflection2}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection2: e.target.value }))}
                placeholder="짝수가 아닌 경우는 …로 한 가지뿐이지만, 3의 배수가 아닌 경우는 나머지에 따라 …로 나누어 확인해야 한다."
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.reflection2.trim().length,
                  15
                )}`}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
            <h3 className="text-lg font-extrabold text-slate-900">03차시 대우법 수사 기록 완료</h3>
            <p className="mt-1 text-sm text-slate-600">
              문제 1에서 증명한 ‘n²이 짝수이면 n도 짝수이다’라는 성질은 4차시 귀류법 수사에서 결정적인 단서로 사용됩니다!
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={onGoToLesson4}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                4차시 귀류법 사건 열기
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
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
        <button
          type="button"
          onClick={() => onStepChange(Math.min(4, step + 1))}
          disabled={step === 4}
          className="min-h-[44px] rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-40"
        >
          다음 단계
        </button>
      </div>
    </div>
  );
};
