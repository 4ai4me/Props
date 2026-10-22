import React, { useState } from 'react';
import {
  Lesson1State,
  PROOF1_STEPS,
  calc1,
  mod,
  safeN,
  validateClaim1,
  evaluateLevel1Completion,
} from '../utils/mathLogic';
import { CheckCircle2, AlertCircle, HelpCircle, Trash2, Shuffle, ArrowRight, Plus } from 'lucide-react';
import { CharCountBadge, getCharCountBorderClass } from './CharCountBadge';

interface Lesson1ViewProps {
  state: Lesson1State;
  step: number;
  onStepChange: (nextStep: number) => void;
  onUpdate: (updater: (prev: Lesson1State) => Lesson1State) => void;
  onGoToLesson2: () => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const Lesson1View: React.FC<Lesson1ViewProps> = ({
  state,
  step,
  onStepChange,
  onUpdate,
  onGoToLesson2,
  onRequestConfirm,
}) => {
  const [oddInputStr, setOddInputStr] = useState<string>('3');
  const [testInputStr, setTestInputStr] = useState<string>('-21');
  const [feedback, setFeedback] = useState<Record<string, { text: string; type: 'good' | 'warn' }>>({});
  const [visibleProofHints, setVisibleProofHints] = useState<boolean[]>([false, false, false, false]);

  const completion = evaluateLevel1Completion(state);

  const showNotice = (id: string, text: string, type: 'good' | 'warn') => {
    setFeedback((prev) => ({ ...prev, [id]: { text, type } }));
  };

  const handleAddOdd = (rawVal: string | number) => {
    const n = safeN(rawVal);
    if (n === null) {
      showNotice('oneInput', '−10,000부터 10,000까지의 정수를 입력해 주세요.', 'warn');
      return;
    }
    const item = calc1(n);
    if (!item.valid) {
      showNotice('oneInput', `${n}은(는) 홀수가 아니므로 대상에 맞지 않습니다. 홀수를 선택해 주세요.`, 'warn');
      return;
    }
    if (state.examples.some((x) => x.n === n)) {
      showNotice('oneInput', `n = ${n}은(는) 이미 단서 보관함에 있는 수입니다. 다른 홀수를 탐색해 보세요.`, 'warn');
      return;
    }
    onUpdate((prev) => ({ ...prev, examples: [...prev.examples, item] }));
    setOddInputStr(String(n));
    showNotice('oneInput', `${n}² = ${item.sq.toLocaleString('ko-KR')}을(를) 8로 나눈 나머지 ${item.r}을(를) 기록했습니다.`, 'good');
  };

  const toggleSign = (valStr: string, setter: (v: string) => void) => {
    const n = safeN(valStr);
    if (n !== null && n !== 0) {
      setter(String(-n));
    } else if (valStr.startsWith('-')) {
      setter(valStr.slice(1));
    } else {
      setter('-' + valStr);
    }
  };

  const stepByDelta = (valStr: string, delta: number, setter: (v: string) => void) => {
    const n = safeN(valStr) ?? 1;
    const next = Math.max(-10000, Math.min(10000, n + delta));
    setter(String(next));
  };

  const handleCheckClaim = () => {
    const res = validateClaim1(state.scope, state.claim);
    if (res.ok) {
      onUpdate((prev) => ({ ...prev, claimChecked: true }));
    }
    showNotice('oneClaim', res.message, res.type);
  };

  const handleCheckCounter = (rawVal: string | number, isRandom = false) => {
    const n = safeN(rawVal);
    if (n === null) {
      showNotice('oneCheck', '−10,000부터 10,000 사이의 정수를 입력해 주세요.', 'warn');
      return;
    }
    const x = calc1(n);
    onUpdate((prev) => ({ ...prev, checks: [...prev.checks, x] }));
    if (isRandom) {
      setTestInputStr(String(n));
    }
    if (x.valid) {
      showNotice(
        'oneCheck',
        `${n}은(는) 홀수이며, ${n}² = ${x.sq.toLocaleString('ko-KR')}을(를) 8로 나눈 나머지는 ${x.r}입니다. ${
          x.r === 1 ? '이번 수 역시 가설과 일치합니다(반례 아님).' : '반례를 발견했습니다!'
        }`,
        x.r === 1 ? 'good' : 'warn'
      );
    } else {
      showNotice('oneCheck', `${n}은(는) 홀수가 아니므로 홀수에 대한 명제의 반례가 될 수 없습니다.`, 'warn');
    }
  };

  const handleVerifyProofStep = (idx: number) => {
    const choice = state.proofChoices[idx];
    if (choice === null || choice === undefined) {
      showNotice(`proof${idx}`, '먼저 보기에서 알맞은 식이나 이유를 선택해 주세요.', 'warn');
      return;
    }
    const isCorrect = choice === PROOF1_STEPS[idx].answer;
    onUpdate((prev) => {
      const nextVerified = [...prev.proofVerified];
      nextVerified[idx] = isCorrect;
      return { ...prev, proofVerified: nextVerified };
    });
    showNotice(
      `proof${idx}`,
      isCorrect
        ? '이 단계의 수학적 연결이 정확합니다! 다음 단계와 이어 보세요.'
        : '이 선택은 논리적 연결에 맞지 않습니다. 힌트를 열거나 식을 다시 전개해 보세요.',
      isCorrect ? 'good' : 'warn'
    );
  };

  const handleToggleProofHint = (idx: number) => {
    const isCurrentlyOpen = Boolean(visibleProofHints[idx]);
    if (isCurrentlyOpen) {
      setVisibleProofHints((prev) => {
        const next = [...prev];
        next[idx] = false;
        return next;
      });
    } else {
      setVisibleProofHints((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      if ((state.proofHints[idx] || 0) === 0) {
        onUpdate((prev) => {
          const nextHints = [...prev.proofHints];
          nextHints[idx] = 1;
          return { ...prev, proofHints: nextHints };
        });
      }
    }
  };

  const handleNextProofHint = (idx: number) => {
    onUpdate((prev) => {
      const nextHints = [...prev.proofHints];
      nextHints[idx] = Math.min(3, (nextHints[idx] || 0) + 1);
      return { ...prev, proofHints: nextHints };
    });
  };

  // Live preview of current oddInputStr for the visual decomposition box
  const previewN = safeN(oddInputStr);
  const previewValidOdd = previewN !== null && Math.abs(previewN % 2) === 1;
  const previewSq = previewN !== null ? previewN * previewN : null;
  const previewQuotient = previewSq !== null ? Math.floor(previewSq / 8) : null;
  const previewRem = previewSq !== null ? mod(previewSq, 8) : null;

  return (
    <div className="space-y-6">
      {step === 0 && (
        <div>
          <div className="text-xs font-bold text-blue-600">
            01차시 · 1 / 5단계
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            단서 01 · 숫자에서 흔적 찾기
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            몇 개의 홀수를 입력한 다음, 제곱한 수를 8로 나눈 나머지를 비교해 봅시다.
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            핵심 수사 질문: 어떤 홀수를 제곱하더라도 8로 나눈 나머지가 항상 같을까요?
          </div>

          {/* Interactive Clue Collector */}
          <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-600 text-xs font-bold text-white mono">
                1
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                단서 수집 장치 · 수를 조작해 보기
              </h3>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="oddInput" className="block text-sm font-bold text-slate-800 mb-1.5">
                  홀수 n 입력 (−10,000 ~ 10,000)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="oddInput"
                    type="text"
                    inputMode="numeric"
                    value={oddInputStr}
                    onChange={(e) => setOddInputStr(e.target.value)}
                    placeholder="예: -3, 5, 11"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold text-slate-900 mono placeholder:font-normal placeholder:text-slate-400"
                  />
                  {/* Mobile friendly sign toggle & +/-2 buttons for iOS/Android */}
                  <button
                    type="button"
                    onClick={() => toggleSign(oddInputStr, setOddInputStr)}
                    title="양수/음수 부호 전환 (모바일 키패드 보조)"
                    className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 shrink-0 whitespace-nowrap"
                  >
                    ±부호
                  </button>
                  <button
                    type="button"
                    onClick={() => stepByDelta(oddInputStr, -2, setOddInputStr)}
                    className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 shrink-0 whitespace-nowrap"
                  >
                    −2
                  </button>
                  <button
                    type="button"
                    onClick={() => stepByDelta(oddInputStr, 2, setOddInputStr)}
                    className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 shrink-0 whitespace-nowrap"
                  >
                    +2
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  아이폰·아이패드 등 음수(-) 키가 없는 숫자 키패드에서는 <strong>[±부호]</strong> 버튼으로 음수를 손쉽게 입력할 수 있습니다.
                </p>
              </div>

              <div>
                <label htmlFor="oddRange" className="block text-sm font-bold text-slate-800 mb-1.5">
                  슬라이더로 빠르게 탐색하기 (현재 선택값:{' '}
                  <span className="mono font-extrabold text-blue-600">
                    {previewN !== null && Math.abs(previewN) <= 19 && previewValidOdd ? previewN : 3}
                  </span>
                  )
                </label>
                <input
                  id="oddRange"
                  type="range"
                  min={-19}
                  max={19}
                  step={2}
                  value={previewN !== null && Math.abs(previewN) <= 19 && previewValidOdd ? previewN : 3}
                  onChange={(e) => setOddInputStr(e.target.value)}
                  className="w-full h-2.5 rounded-lg cursor-pointer accent-blue-600 mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mono mt-1.5">
                  <span>-19</span>
                  <span>-9</span>
                  <span>1</span>
                  <span>9</span>
                  <span>19</span>
                </div>
              </div>
            </div>

            {/* Live Mathematical Decomposition Preview */}
            {previewN !== null && previewSq !== null && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-slate-800">
                  <span className="font-bold text-blue-600">실시간 나눗셈 분석:</span>{' '}
                  <span className="mono font-semibold">
                    ({previewN})² = {previewSq.toLocaleString('ko-KR')} = 8 × ({previewQuotient?.toLocaleString('ko-KR')}) +{' '}
                    <strong className="text-emerald-600 underline decoration-2">{previewRem}</strong>
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {previewValidOdd ? '홀수 조건 충족 · 나머지 = ' + previewRem : '짝수입니다 (홀수를 입력해 보세요)'}
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddOdd(oddInputStr)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                계산하고 표에 추가
              </button>
              <span className="text-xs font-bold text-slate-500 ml-1">빠른 대입:</span>
              {[-9, -3, 1, 5, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleAddOdd(n)}
                  className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 mono whitespace-nowrap"
                >
                  n={n}
                </button>
              ))}
            </div>

            {feedback.oneInput && (
              <div
                role="status"
                className={`mt-3.5 flex items-start gap-2 rounded-xl p-3.5 text-sm font-medium ${
                  feedback.oneInput.type === 'good'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                {feedback.oneInput.type === 'good' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span>{feedback.oneInput.text}</span>
              </div>
            )}
          </div>

          {/* Clue Storage Table */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-900 text-xs font-bold text-white mono">
                  2
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  단서 보관함 ({state.examples.length}개 수집됨)
                </h3>
              </div>
              {state.examples.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onRequestConfirm('1차시 사례표 비우기', '수집한 1차시 홀수 사례들을 모두 비울까요?', () => {
                      onUpdate((prev) => ({ ...prev, examples: [] }));
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  표 비우기
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                    <th className="py-3 px-4 text-left">홀수 n</th>
                    <th className="py-3 px-4 text-left">제곱한 값 (n²)</th>
                    <th className="py-3 px-4 text-left">8로 나눈 식</th>
                    <th className="py-3 px-4 text-left">8로 나눈 나머지</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.examples.length > 0 ? (
                    state.examples.map((x) => (
                      <tr key={x.n} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 mono font-bold text-slate-900">
                          {x.n} {x.n < 0 && <span className="text-xs font-normal text-blue-600">(음의 홀수)</span>}
                        </td>
                        <td className="py-3 px-4 mono text-slate-700">{x.sq.toLocaleString('ko-KR')}</td>
                        <td className="py-3 px-4 mono text-xs text-slate-500">
                          8 × {Math.floor(x.sq / 8).toLocaleString('ko-KR')} + {x.r}
                        </td>
                        <td className="py-3 px-4 mono font-extrabold text-emerald-600">{x.r}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 px-4 text-center text-slate-500">
                        홀수를 입력하거나 빠른 대입 버튼을 누르면 계산 결과가 이곳에 기록됩니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>권장 조건: 서로 다른 홀수 4개 이상, 그중 음의 홀수 1개 이상 포함</span>
              <span className="font-bold text-slate-700 mono">
                현재 달성: 전체 {state.examples.length}/4개 · 음의 홀수{' '}
                {state.examples.some((v) => v.n < 0) ? '포함됨(완료)' : '미포함'}
              </span>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="text-xs font-bold text-blue-600">
            01차시 · 2 / 5단계
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            가설 01 · 추측을 명제로 바꾸기
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            어떤 수에 대해 성립하는지 대상과 범위를 분명하게 표현해 보세요.
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            확인한 사례를 바탕으로, 모든 홀수에서 성립할 것 같은 규칙을 한 문장의 명제로 추측해 봅시다.
          </div>

          <div className="mt-5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3">① 명제의 범위 정하기</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    state.scope === 'some'
                      ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="scope1"
                    value="some"
                    checked={state.scope === 'some'}
                    onChange={() => onUpdate((prev) => ({ ...prev, scope: 'some', claimChecked: false }))}
                    className="mt-1 h-4 w-4 accent-blue-600 shrink-0"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    지금 계산한 홀수에 대해서만 참이라고 말할 수 있다.
                  </span>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    state.scope === 'all'
                      ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="scope1"
                    value="all"
                    checked={state.scope === 'all'}
                    onChange={() => onUpdate((prev) => ({ ...prev, scope: 'all', claimChecked: false }))}
                    className="mt-1 h-4 w-4 accent-blue-600 shrink-0"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    모든 홀수에 대해서도 성립할 것이라고 추측한다.
                  </span>
                </label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="l1claim" className="block text-sm font-bold text-slate-800">
                  ② 수사 가설을 한 문장의 명제로 표현하기 (12자 이상)
                </label>
                <CharCountBadge current={state.claim.trim().length} min={12} />
              </div>
              <textarea
                id="l1claim"
                rows={3}
                value={state.claim}
                onChange={(e) => onUpdate((prev) => ({ ...prev, claim: e.target.value, claimChecked: false }))}
                placeholder="모든(또는 어떤) …에 대하여 …한 수를 …로 나눈 나머지는 항상 …이다."
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.claim.trim().length,
                  12
                )}`}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                관찰한 사실과 아직 증명하지 않은 추측을 구별해 적어 보세요. (‘홀수’, ‘제곱’, ‘8’ 키워드 포함)
              </p>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleCheckClaim}
                  className="min-h-[44px] rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  명제 표현 점검
                </button>
              </div>

              {feedback.oneClaim && (
                <div
                  role="status"
                  className={`mt-3.5 flex items-start gap-2 rounded-xl p-3.5 text-sm font-medium ${
                    feedback.oneClaim.type === 'good'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  {feedback.oneClaim.type === 'good' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span>{feedback.oneClaim.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="text-xs font-bold text-blue-600">
            01차시 · 3 / 5단계
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            반례 수색 · 가설을 의심하라
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            다른 수에서도 살펴보세요. 단, 많은 사례를 확인해도 모든 수에 대해 참임이 증명되지는 않습니다.
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            아주 큰 홀수나 음의 홀수에서도 성립할까요? 혹시 반례가 숨어 있을까요?
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3">반례 용의자 입력하기</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="l1test" className="block text-sm font-bold text-slate-800 mb-1.5">
                  검사할 정수 입력
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="l1test"
                    type="text"
                    inputMode="numeric"
                    value={testInputStr}
                    onChange={(e) => setTestInputStr(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSign(testInputStr, setTestInputStr)}
                    className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 shrink-0 whitespace-nowrap"
                  >
                    ±부호
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">무작위 큰 홀수 실험</label>
                <button
                  type="button"
                  onClick={() => {
                    const randOdd = 2 * (Math.floor(Math.random() * 10001) - 5000) + 1;
                    handleCheckCounter(randOdd, true);
                  }}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Shuffle className="h-4 w-4 text-blue-600" />
                  임의의 홀수 생성·검사
                </button>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleCheckCounter(testInputStr)}
                className="min-h-[44px] rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                가설과 대조해 보기
              </button>
            </div>

            {feedback.oneCheck && (
              <div
                role="status"
                className={`mt-3.5 flex items-start gap-2 rounded-xl p-3.5 text-sm font-medium ${
                  feedback.oneCheck.type === 'good'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{feedback.oneCheck.text}</span>
              </div>
            )}
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100 space-y-5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              검사 기록 ({state.checks.length}회 · 홀수 3회 이상 권장)
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                    <th className="py-3 px-4 text-left">검사한 수</th>
                    <th className="py-3 px-4 text-left">대상인 홀수인가?</th>
                    <th className="py-3 px-4 text-left">8로 나눈 나머지</th>
                    <th className="py-3 px-4 text-left">판단</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.checks.length > 0 ? (
                    state.checks.map((x, idx) => (
                      <tr key={`${x.n}-${idx}`} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 mono font-bold text-slate-900">{x.n}</td>
                        <td className="py-3 px-4 text-slate-700">{x.valid ? '예 (홀수)' : '아니요 (짝수)'}</td>
                        <td className="py-3 px-4 mono font-bold text-slate-900">{x.r}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-700">
                          {x.valid ? (x.r === 1 ? '반례 아님' : '반례 발견') : '가정에 맞지 않음'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 px-4 text-center text-slate-500">
                        아직 검사 기록이 없습니다. 위에서 수를 입력하거나 무작위 검사를 실행해 보세요.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="l1limits" className="block text-sm font-bold text-slate-800">
                  모든 단서가 일치해도, 왜 최종 증명이 필요할까요? (12자 이상)
                </label>
                <CharCountBadge current={state.limits.trim().length} min={12} />
              </div>
              <textarea
                id="l1limits"
                rows={3}
                value={state.limits}
                onChange={(e) => onUpdate((prev) => ({ ...prev, limits: e.target.value }))}
                placeholder="사례 확인의 한계를 자신의 말로 설명해 보세요. (…의 개수는 …하므로 모든 경우를 직접 …할 수 없다.)"
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.limits.trim().length,
                  12
                )}`}
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="text-xs font-bold text-blue-600">
            01차시 · 4 / 5단계
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            최종 증명 보고서 작성
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            이제 몇 개의 계산을 넘어, 임의의 홀수에도 적용되는 대수적 이유를 찾아봅시다.
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            모든 홀수 n에 대하여 n² − 1이 8의 배수임을 4단계로 증명해 봅시다.
          </div>

          <div className="mt-5 space-y-4">
            {PROOF1_STEPS.map((t, i) => {
              const verified = state.proofVerified[i];
              const hintCount = state.proofHints[i] || 0;
              const fb = feedback[`proof${i}`];
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
                    <label htmlFor={`proof1choice${i}`} className="sr-only">
                      증명 {i + 1}단계 선택
                    </label>
                    <select
                      id={`proof1choice${i}`}
                      value={state.proofChoices[i] === null ? '' : String(state.proofChoices[i])}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        onUpdate((prev) => {
                          const nextChoices = [...prev.proofChoices];
                          const nextVer = [...prev.proofVerified];
                          nextChoices[i] = val;
                          nextVer[i] = false;
                          return { ...prev, proofChoices: nextChoices, proofVerified: nextVer };
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
                      onClick={() => handleVerifyProofStep(i)}
                      className="min-h-[40px] rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-blue-700"
                    >
                      이 단계 확인
                    </button>
                    <button
                      type="button"
                      aria-expanded={Boolean(visibleProofHints[i])}
                      onClick={() => handleToggleProofHint(i)}
                      className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors ${
                        visibleProofHints[i]
                          ? 'border-amber-400 bg-amber-100 text-amber-950'
                          : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      <HelpCircle className="h-4 w-4" />
                      {visibleProofHints[i]
                        ? `힌트 숨기기 (${Math.max(1, hintCount)}/3)`
                        : `힌트 보기 (${hintCount}/3)`}
                    </button>
                  </div>

                  {visibleProofHints[i] && (
                    <div className="mt-3 rounded-xl bg-amber-50/70 border border-amber-200/70 p-3 text-xs sm:text-sm text-amber-900 space-y-2">
                      <div className="space-y-1">
                        {t.hints.slice(0, Math.max(1, hintCount)).map((h, hIdx) => (
                          <div key={hIdx}>
                            <strong>힌트 {hIdx + 1}:</strong> {h}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
                        {hintCount < 3 ? (
                          <button
                            type="button"
                            onClick={() => handleNextProofHint(i)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-200/70 hover:bg-amber-200 px-2.5 py-1 text-xs font-bold text-amber-950 transition-colors"
                          >
                            + 다음 단계 힌트 더 보기 ({Math.max(1, hintCount)}/3)
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700">
                            모든 단계 힌트가 열렸습니다 (3/3)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleProofHint(i)}
                          className="text-xs font-bold text-amber-800 hover:underline"
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
              <h3 className="text-base sm:text-lg font-bold text-slate-900">나의 말로 쓰는 최종 증명 보고서</h3>
              <CharCountBadge current={state.proofText.trim().length} min={35} />
            </div>
            <label htmlFor="l1proof" className="block text-xs sm:text-sm text-slate-600 font-semibold mb-2">
              위에서 확인한 네 단계를 연결하여 완결된 수학적 문장으로 서술해 보세요. (35자 이상)
            </label>
            <textarea
              id="l1proof"
              rows={5}
              value={state.proofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, proofText: e.target.value }))}
              placeholder="임의의 홀수 n을 2k+1(k는 정수)이라 놓으면, n²-1 = ... 따라서 모든 홀수 n에 대하여 ..."
              className={`w-full rounded-xl border bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                state.proofText.trim().length,
                35
              )}`}
            />
            <p className="mt-2 text-xs text-slate-500">
              선택형 단계 확인과 별개로, 서술한 증명이 논리적으로 타당한지는 교사·동료와 함께 확인합니다.
            </p>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="text-xs font-bold text-blue-600">
            01차시 · 5 / 5단계
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            첫 사건 종결 · 다음 사건 예고
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            첫 사건의 수사 과정을 돌아보고 다음 사건에서 확인할 새로운 가설을 세워 봅시다.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="l1reflection" className="block text-sm font-bold text-slate-800">
                  1. 사례를 여러 개 확인하는 것과 일반적인 증명은 어떤 차이가 있을까요? (20자 이상)
                </label>
                <CharCountBadge current={state.reflection.trim().length} min={20} />
              </div>
              <textarea
                id="l1reflection"
                rows={4}
                value={state.reflection}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection: e.target.value }))}
                placeholder="구체적인 수를 대입했을 때와 임의의 문자(k)로 설명할 때의 차이는 …이다."
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.reflection.trim().length,
                  20
                )}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="l1bridge" className="block text-sm font-bold text-slate-800">
                  2. 8 대신 16으로 나누어도 규칙이 성립할까요? 나의 예상과 이유를 적어 보세요. (10자 이상)
                </label>
                <CharCountBadge current={state.bridge.trim().length} min={10} />
              </div>
              <textarea
                id="l1bridge"
                rows={3}
                value={state.bridge}
                onChange={(e) => onUpdate((prev) => ({ ...prev, bridge: e.target.value }))}
                placeholder="16으로 나눌 때 규칙이 성립할지 여부에 대해 …라고 생각하며, 이유는 …이다."
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.bridge.trim().length,
                  10
                )}`}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
            <h3 className="text-lg font-extrabold text-slate-900">01차시 수사 기록 정리 완료</h3>
            <p className="mt-1 text-sm text-slate-600">
              내가 발견한 규칙을 2차시에서 새롭게 변형하거나 일반화해 봅니다. 2차시로 이동해도 이번 기록은 안전하게 유지됩니다.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={onGoToLesson2}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                2차시 다음 사건 열기
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Step Navigation */}
      <div className="flex items-center justify-between gap-3 pt-5 border-t border-slate-100 flex-wrap">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => onStepChange(Math.max(0, step - 1))}
          className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
        >
          ← 이전 단계
        </button>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-extrabold ${
              completion[step] ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {completion[step] ? '✓ 현재 단계 작성 조건 충족' : '현재 단계 탐구 진행 중'}
          </span>
          <button
            type="button"
            disabled={step === 4}
            onClick={() => onStepChange(Math.min(4, step + 1))}
            className="min-h-[44px] rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap"
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </div>
  );
};
