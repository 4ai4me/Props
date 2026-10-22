import React, { useState } from 'react';
import {
  Lesson2State,
  TOPICS,
  TopicId,
  calc2,
  checkScope,
  evaluateLevel2Completion,
  mod,
  safeN,
} from '../utils/mathLogic';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
  Shuffle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { CharCountBadge, getCharCountBorderClass } from './CharCountBadge';

interface Lesson2ViewProps {
  state: Lesson2State;
  step: number;
  onStepChange: (nextStep: number) => void;
  onUpdate: (updater: (prev: Lesson2State) => Lesson2State) => void;
  onChangeTopic: (nextTopic: TopicId) => void;
  onGoToLesson3?: () => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const Lesson2View: React.FC<Lesson2ViewProps> = ({
  state,
  step,
  onStepChange,
  onUpdate,
  onChangeTopic,
  onGoToLesson3,
  onRequestConfirm,
}) => {
  const [numInputStr, setNumInputStr] = useState<string>('3');
  const [obsInputStr, setObsInputStr] = useState<string>('');
  const [testInputStr, setTestInputStr] = useState<string>('3');
  const [testMemoStr, setTestMemoStr] = useState<string>('');
  const [feedback, setFeedback] = useState<Record<string, { text: string; type: 'good' | 'warn' | 'info' }>>({});
  const [isHintVisible, setIsHintVisible] = useState<boolean>(false);

  const completion = evaluateLevel2Completion(state);
  const currentTopic = state.topic ? TOPICS[state.topic as TopicId] : null;
  const isAutoCalc = Boolean(currentTopic?.calc);

  const topicValid =
    Boolean(state.topic) &&
    (state.topic !== 'd' ||
      (state.customStatement.trim().length >= 10 && state.customScope.trim().length >= 2));

  const topicStatement =
    state.topic === 'd'
      ? state.customStatement.trim() || '아직 명제를 작성하지 않았습니다.'
      : currentTopic?.statement || '먼저 1단계에서 명제를 선택해 주세요.';

  const showNotice = (id: string, text: string, type: 'good' | 'warn' | 'info' = 'info') => {
    setFeedback((prev) => ({ ...prev, [id]: { text, type } }));
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

  const handleAddExample = (rawVal: string | number, customObs?: string) => {
    if (!currentTopic) return;
    const n = safeN(rawVal);
    if (n === null) {
      showNotice('twoInput', '−10,000부터 10,000까지의 정수를 입력해 주세요.', 'warn');
      return;
    }
    if (state.examples.some((x) => x.n === n)) {
      showNotice('twoInput', `n = ${n}은(는) 이미 관찰한 정수입니다. 다른 수를 선택하세요.`, 'warn');
      return;
    }
    if (currentTopic.calc && !checkScope(state.topic, n)) {
      showNotice(
        'twoInput',
        `이 명제는 '${currentTopic.scope}'를 대상으로 합니다. 가정을 만족하는 수를 선택해 보세요.`,
        'warn'
      );
      return;
    }
    const obsToSave = customObs !== undefined ? customObs : obsInputStr;
    if (!currentTopic.calc && String(obsToSave || '').trim().length < 2) {
      showNotice('twoInput', '직접 만든 명제는 계산 결과 또는 관찰 내용을 함께 입력해야 합니다.', 'warn');
      return;
    }
    const newItem = currentTopic.calc
      ? calc2(state.topic as TopicId, n)!
      : { n, obs: String(obsToSave).slice(0, 250) };

    onUpdate((prev) => ({ ...prev, examples: [...prev.examples, newItem] }));
    setNumInputStr(String(n));
    if (!currentTopic.calc) setObsInputStr('');
    showNotice('twoInput', '관찰 결과가 기록되었습니다. 서로 다른 수 5개 이상을 비교해 보세요.', 'good');
  };

  const handleCheckCandidate = (rawVal: string | number, isRandom = false) => {
    if (!currentTopic) return;
    let n: number | null = null;
    if (isRandom) {
      let r = Math.floor(Math.random() * 201) - 100;
      if (state.topic === 'a' && mod(r, 2) === 0) r++;
      if (state.topic === 'b' && mod(r, 2) === 1) r++;
      n = r;
      setTestInputStr(String(r));
    } else {
      n = safeN(rawVal);
    }

    if (n === null) {
      showNotice('twoCheck', '정수 −10,000부터 10,000까지 입력해 주세요.', 'warn');
      return;
    }

    if (currentTopic.calc) {
      const x = calc2(state.topic as TopicId, n)!;
      onUpdate((prev) => ({ ...prev, checks: [...prev.checks, x] }));
      if (!x.valid) {
        showNotice(
          'twoCheck',
          `n = ${n}은(는) 이 명제의 가정(${currentTopic.scope})에 맞지 않으므로 반례가 아닙니다.`,
          'warn'
        );
      } else if (x.isCounter) {
        showNotice(
          'twoCheck',
          `n = ${n}은(는) 가정을 만족하며 나머지가 ${x.r}이므로 결론에 어긋납니다. 반례를 찾았습니다!`,
          'good'
        );
      } else {
        showNotice('twoCheck', `n = ${n}에서 나머지는 ${x.r}입니다. 이 수는 반례가 아닙니다.`, 'info');
      }
      return;
    }

    if (testMemoStr.trim().length < 2) {
      showNotice('twoCheck', '직접 만든 명제에서는 검사 결과를 글로 입력해 주세요.', 'warn');
      return;
    }
    onUpdate((prev) => ({
      ...prev,
      checks: [...prev.checks, { n: n!, memo: testMemoStr.trim().slice(0, 250) }],
    }));
    setTestMemoStr('');
    showNotice('twoCheck', '검사 내용을 기록했습니다. 반례인지 논리적으로 점검해 보세요.', 'good');
  };

  const handleJudgeDecision = () => {
    if (!currentTopic) return;
    if (!state.decision) {
      showNotice('twoJudge', '먼저 참·거짓에 대한 판단을 선택해 주세요.', 'warn');
      return;
    }
    if (!state.guess.trim()) {
      showNotice('twoJudge', '판단하기 전에 추측과 근거를 적어 보세요.', 'warn');
      return;
    }
    onUpdate((prev) => ({ ...prev, decisionChecked: true }));

    if (currentTopic.trueValue === null) {
      showNotice(
        'twoJudge',
        '직접 만든 명제는 자동으로 판단하지 않습니다. 다음 단계에서 논거와 반례를 제시하세요.',
        'info'
      );
      return;
    }
    if (state.decision === 'unknown') {
      showNotice(
        'twoJudge',
        '미해결 상태도 중요한 탐구 결과입니다. 더 확인할 수 있는 사례나 일반적인 논증을 찾아 보세요.',
        'info'
      );
      return;
    }
    const matchesTruth = (state.decision === 'true') === currentTopic.trueValue;
    if (matchesTruth) {
      showNotice(
        'twoJudge',
        state.decision === 'true'
          ? '현재 판단은 명제의 실제 참·거짓과 일치합니다. 이제 4단계에서 모든 경우를 증명해야 합니다.'
          : '현재 판단은 명제의 실제 참·거짓과 일치합니다. 4단계에서 가정을 만족하는 반례를 분명하게 설명하세요.',
        'good'
      );
    } else {
      showNotice(
        'twoJudge',
        '현재 판단과 명제의 실제 참·거짓이 일치하지 않습니다. 특히 가정에 맞는 서로 다른 값을 더 검사해 보세요.',
        'warn'
      );
    }
  };

  const handleVerifyCounter = () => {
    if (!currentTopic) return;
    const n = safeN(state.counter);
    if (n === null) {
      showNotice('twoCounter', '−10,000부터 10,000까지의 정수를 입력해 주세요.', 'warn');
      return;
    }
    if (currentTopic.calc) {
      const x = calc2(state.topic as TopicId, n)!;
      if (x.isCounter) {
        showNotice(
          'twoCounter',
          `n = ${n}은(는) 가정을 만족하고, 나머지는 ${x.r}이므로 반례에 해당합니다. 이제 설명을 논리적으로 완성해 보세요.`,
          'good'
        );
      } else if (!x.valid) {
        showNotice('twoCounter', `n = ${n}은(는) 명제의 가정(${currentTopic.scope})을 만족하지 않아 반례가 아닙니다.`, 'warn');
      } else {
        showNotice('twoCounter', `n = ${n}에서는 결론이 성립하므로 반례가 아닙니다.`, 'warn');
      }
      return;
    }
    showNotice(
      'twoCounter',
      '직접 만든 명제는 반례를 자동 판정할 수 없습니다. 조건과 계산 과정을 함께 제출해 주세요.',
      'info'
    );
  };

  const renderTopicLockedNotice = () => (
    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <strong className="block text-base font-bold">먼저 2차시 1단계에서 탐구할 명제를 선택해 주세요.</strong>
        <span className="text-xs sm:text-sm text-amber-800">
          주제 A, B, C 중 하나를 고르거나, 주제 D에서 나만의 명제와 대상 조건을 작성하면 현장 조사를 시작할 수 있습니다.
        </span>
      </div>
      <button
        type="button"
        onClick={() => onStepChange(0)}
        className="min-h-[42px] rounded-xl bg-amber-700 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-amber-800 shrink-0 whitespace-nowrap"
      >
        1단계(사건 선택)로 이동
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {step === 0 && (
        <div>
          <div className="text-xs font-bold text-blue-600">
            02차시 · 1 / 5단계
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            새 사건 접수 · 명제를 선택하라
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            1차시에서 사용한 규칙을 변형하거나, 나만의 참·거짓을 판단할 수 있는 명제를 만들어 봅시다.
          </p>

          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
            오늘의 목표는 참인 명제의 증명뿐 아니라, 거짓인 명제의 반례를 찾는 일도 포함합니다.
          </div>

          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            {(Object.values(TOPICS) as typeof TOPICS[TopicId][]).map((t) => {
              const selected = state.topic === t.id;
              return (
                <label
                  key={t.id}
                  className={`flex items-start gap-3.5 rounded-2xl border p-4 sm:p-5 cursor-pointer transition-colors ${
                    selected
                      ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="topic"
                    value={t.id}
                    checked={selected}
                    onChange={() => onChangeTopic(t.id)}
                    className="mt-1.5 h-4 w-4 accent-blue-600 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-blue-600">{t.tag}</div>
                    <div className="text-base font-bold text-slate-900">{t.title}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      {t.id === 'd'
                        ? '대상·조건·결론을 구체적으로 적어 보세요.'
                        : t.statement}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {state.topic === 'd' && (
            <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label htmlFor="customStatement" className="block text-sm font-bold text-slate-800">
                    내가 만든 명제 (10자 이상)
                  </label>
                  <CharCountBadge current={state.customStatement.trim().length} min={10} />
                </div>
                <textarea
                  id="customStatement"
                  rows={3}
                  value={state.customStatement}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, customStatement: e.target.value }))}
                  placeholder="모든(또는 어떤) …에 대하여 …은(는) …이다."
                  className={`w-full rounded-xl border bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                    state.customStatement.trim().length,
                    10
                  )}`}
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label htmlFor="customScope" className="block text-sm font-bold text-slate-800">
                    대상과 조건 (2자 이상)
                  </label>
                  <CharCountBadge current={state.customScope.trim().length} min={2} />
                </div>
                <input
                  id="customScope"
                  type="text"
                  value={state.customScope}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, customScope: e.target.value }))}
                  placeholder="탐구 대상과 조건 (…의 정수, …인 수 등)"
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                    state.customScope.trim().length,
                    2
                  )}`}
                />
              </div>
              <p className="text-xs text-slate-500">
                직접 만든 명제는 자동으로 참·거짓을 판정할 수 없습니다. 학생의 논증과 반례 설명을 교사가 확인합니다.
              </p>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">이번 사건의 명제</h3>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm sm:text-base font-bold text-slate-900">
              {topicStatement}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              처음에는 정답이 공개되지 않습니다. 다음 단계에서 탐구 결과를 바탕으로 참·거짓 판단을 기록하세요.
            </p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="text-xs font-bold text-blue-600">
            02차시 · 2 / 5단계
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            현장 조사 · 계산의 흔적 모으기
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            먼저 간단한 수를 대입하고 예상과 다른 결과가 있는지 확인해 보세요.
          </p>

          {!topicValid ? (
            renderTopicLockedNotice()
          ) : (
            <>
              <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
                탐구 명제: {topicStatement}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6">
                {isAutoCalc && currentTopic ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="l2number" className="block text-sm font-bold text-slate-800 mb-1.5">
                        대입할 정수 n (대상: {currentTopic.scope})
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="l2number"
                          type="text"
                          inputMode="numeric"
                          value={numInputStr}
                          onChange={(e) => setNumInputStr(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold mono text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => toggleSign(numInputStr, setNumInputStr)}
                          className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 shrink-0 whitespace-nowrap"
                        >
                          ±부호
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1.5">
                        추천 입력 예시 (터치하여 즉시 추가)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {currentTopic.recommendedInputs.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => handleAddExample(n)}
                            className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 mono whitespace-nowrap"
                          >
                            n = {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="l2number" className="block text-sm font-bold text-slate-800 mb-1.5">
                        사례에 사용한 정수 n
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="l2number"
                          type="text"
                          inputMode="numeric"
                          value={numInputStr}
                          onChange={(e) => setNumInputStr(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold mono text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => toggleSign(numInputStr, setNumInputStr)}
                          className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 shrink-0 whitespace-nowrap"
                        >
                          ±부호
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="l2obs" className="block text-sm font-bold text-slate-800 mb-1.5">
                        계산 결과 · 관찰 내용
                      </label>
                      <input
                        id="l2obs"
                        type="text"
                        value={obsInputStr}
                        onChange={(e) => setObsInputStr(e.target.value)}
                        placeholder="…일 때 식의 값이 …이므로 성립함"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleAddExample(numInputStr)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    {isAutoCalc ? '값 계산하고 표에 추가' : '관찰 기록 추가'}
                  </button>
                </div>

                {feedback.twoInput && (
                  <div
                    role="status"
                    className={`mt-3.5 flex items-start gap-2 rounded-xl p-3.5 text-sm font-medium ${
                      feedback.twoInput.type === 'good'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    <span>{feedback.twoInput.text}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    단서 보관함 ({state.examples.length}개 / 5개 이상 권장)
                  </h3>
                  {state.examples.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onRequestConfirm('2차시 사례표 비우기', '2차시에서 수집한 사례를 모두 비울까요?', () => {
                          onUpdate((prev) => ({ ...prev, examples: [] }));
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      사례표 비우기
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                        <th className="py-3 px-4 text-left">대입한 n</th>
                        <th className="py-3 px-4 text-left">{isAutoCalc ? '계산한 식' : '관찰 내용'}</th>
                        <th className="py-3 px-4 text-left">{isAutoCalc ? '계산 값' : '기록'}</th>
                        {isAutoCalc && (
                          <th className="py-3 px-4 text-left">{currentTopic?.div}로 나눈 나머지</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {state.examples.length > 0 ? (
                        state.examples.map((x, idx) =>
                          isAutoCalc && currentTopic?.formula ? (
                            <tr key={`${x.n}-${idx}`} className="hover:bg-slate-50/80">
                              <td className="py-3 px-4 mono font-bold text-slate-900">{x.n}</td>
                              <td className="py-3 px-4 mono text-slate-700">{currentTopic.formula(x.n)}</td>
                              <td className="py-3 px-4 mono text-slate-700">{(x.product ?? 0).toLocaleString('ko-KR')}</td>
                              <td className="py-3 px-4 mono font-bold text-emerald-600">
                                {x.r} {x.valid ? '' : '(조건 밖)'}
                              </td>
                            </tr>
                          ) : (
                            <tr key={`${x.n}-${idx}`} className="hover:bg-slate-50/80">
                              <td className="py-3 px-4 mono font-bold text-slate-900">{x.n}</td>
                              <td colSpan={2} className="py-3 px-4 text-slate-700">
                                {x.obs}
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td colSpan={isAutoCalc ? 4 : 3} className="py-6 px-4 text-center text-slate-500">
                            사례 5개 이상을 기록해 봅시다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="text-xs font-bold text-blue-600">
            02차시 · 3 / 5단계
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            가설 검증 · 반례를 수색하라
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            명제가 참일 것 같은지 먼저 생각한 뒤, 반례가 될 수 있는 수를 적극적으로 찾아보세요.
          </p>

          {!topicValid ? (
            renderTopicLockedNotice()
          ) : (
            <>
              <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
                탐구 명제: {topicStatement}
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="l2guess" className="block text-sm font-bold text-slate-800 mb-1.5">
                    1. 앞선 계산을 보고 추측한 내용과 그 이유
                  </label>
                  <textarea
                    id="l2guess"
                    rows={3}
                    value={state.guess}
                    onChange={(e) => onUpdate((prev) => ({ ...prev, guess: e.target.value }))}
                    placeholder="어떤 결과가 반복되었나요? 참 또는 거짓이라고 추측하는 이유는 무엇인가요?"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white p-3.5 text-base text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="l2decision" className="block text-sm font-bold text-slate-800 mb-1.5">
                    2. 현재 나의 판단
                  </label>
                  <select
                    id="l2decision"
                    value={state.decision}
                    onChange={(e) =>
                      onUpdate((prev) => ({
                        ...prev,
                        decision: e.target.value as Lesson2State['decision'],
                        decisionChecked: false,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base text-slate-900"
                  >
                    <option value="">판단을 선택하세요</option>
                    <option value="true">참이라고 생각한다</option>
                    <option value="false">거짓이라고 생각한다</option>
                    <option value="unknown">아직 판단하기 어렵다</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">반례 후보 조사 (2회 이상 권장)</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  반례는 명제의 <strong>가정을 만족</strong>하면서 결론이 <strong>거짓</strong>인 경우여야 합니다.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="l2test" className="block text-sm font-bold text-slate-800 mb-1.5">
                      검사할 정수 n
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="l2test"
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

                  {isAutoCalc ? (
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1.5">임의의 수 검사</label>
                      <button
                        type="button"
                        onClick={() => handleCheckCandidate(0, true)}
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <Shuffle className="h-4 w-4 text-blue-600" />
                        무작위 정수 검사
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="l2testMemo" className="block text-sm font-bold text-slate-800 mb-1.5">
                        내가 확인한 계산/판단
                      </label>
                      <input
                        id="l2testMemo"
                        type="text"
                        value={testMemoStr}
                        onChange={(e) => setTestMemoStr(e.target.value)}
                        placeholder="반례인지 설명해 보세요."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleCheckCandidate(testInputStr)}
                    className="min-h-[44px] rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    검사 결과 기록
                  </button>
                </div>

                {feedback.twoCheck && (
                  <div
                    role="status"
                    className={`mt-3.5 rounded-xl p-3.5 text-sm font-medium ${
                      feedback.twoCheck.type === 'good'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : feedback.twoCheck.type === 'warn'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-blue-50 text-blue-900 border border-blue-200'
                    }`}
                  >
                    {feedback.twoCheck.text}
                  </div>
                )}

                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                        <th className="py-3 px-4 text-left">검사값</th>
                        <th className="py-3 px-4 text-left">결과</th>
                        <th className="py-3 px-4 text-left">해석</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {state.checks.length > 0 ? (
                        state.checks.map((x, idx) => (
                          <tr key={`${x.n}-${idx}`} className="hover:bg-slate-50/80">
                            <td className="py-3 px-4 mono font-bold text-slate-900">{x.n}</td>
                            <td className="py-3 px-4 mono text-slate-700">
                              {isAutoCalc ? `나머지 ${x.r}` : x.memo || '직접 확인'}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {isAutoCalc
                                ? x.valid
                                  ? x.isCounter
                                    ? '반례 확인 ✓'
                                    : '반례 아님'
                                  : '가정을 만족하지 않음'
                                : '학생 확인 필요'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-5 px-4 text-center text-slate-500">
                            아직 검사한 수가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleJudgeDecision}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    나의 참·거짓 판단 점검
                  </button>
                </div>

                {feedback.twoJudge && (
                  <div
                    role="status"
                    className={`mt-3.5 rounded-xl p-3.5 text-sm font-medium ${
                      feedback.twoJudge.type === 'good'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : feedback.twoJudge.type === 'warn'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-blue-50 text-blue-900 border border-blue-200'
                    }`}
                  >
                    {feedback.twoJudge.text}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="text-xs font-bold text-blue-600">
            02차시 · 4 / 5단계
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            최종 판정서 · 증명 또는 반례
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            명제가 참이라면 모든 경우를 설명하는 증명을, 거짓이라면 조건에 맞는 반례를 제시하세요.
          </p>

          {!topicValid ? (
            renderTopicLockedNotice()
          ) : (
            <>
              <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-900 border border-blue-200/80">
                탐구 명제: {topicStatement}
              </div>

              <div className="mt-5">
                <h3 className="text-base font-bold text-slate-900 mb-3">내가 선택한 탐구 방향</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    {
                      val: 'true',
                      title: '참이라고 추측',
                      desc: '임의의 수에 대해 성립하는 증명 시도',
                    },
                    {
                      val: 'false',
                      title: '거짓이라고 추측',
                      desc: '구체적인 반례와 이유 제시',
                    },
                    {
                      val: 'unknown',
                      title: '아직 미해결',
                      desc: '현재까지의 탐구와 남은 의문 설명',
                    },
                  ].map((item) => (
                    <label
                      key={item.val}
                      className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                        state.decision === item.val
                          ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision4"
                        value={item.val}
                        checked={state.decision === item.val}
                        onChange={() =>
                          onUpdate((prev) => ({
                            ...prev,
                            decision: item.val as Lesson2State['decision'],
                            decisionChecked: false,
                          }))
                        }
                        className="mt-1 h-4 w-4 accent-blue-600 shrink-0"
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {state.decision === 'false' ? (
                <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6 space-y-4">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">반례로 진실 밝히기</h3>
                  <div>
                    <label htmlFor="l2counter" className="block text-sm font-bold text-slate-800 mb-1.5">
                      명제의 가정을 만족하지만 결론이 성립하지 않는 정수 n
                    </label>
                    <div className="flex items-center gap-2 max-w-sm">
                      <input
                        id="l2counter"
                        type="text"
                        inputMode="numeric"
                        value={state.counter}
                        onChange={(e) => onUpdate((prev) => ({ ...prev, counter: e.target.value }))}
                        placeholder="반례 숫자 입력 (정수)"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold mono text-slate-900 placeholder:font-normal"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate((prev) => ({
                            ...prev,
                            counter: prev.counter.startsWith('-')
                              ? prev.counter.slice(1)
                              : '-' + prev.counter,
                          }))
                        }
                        className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 shrink-0 whitespace-nowrap"
                      >
                        ±부호
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <label htmlFor="l2reason" className="block text-sm font-bold text-slate-800">
                        이 수가 반례임을 계산과 문장으로 설명하세요. (25자 이상)
                      </label>
                      <CharCountBadge current={state.counterReason.trim().length} min={25} />
                    </div>
                    <textarea
                      id="l2reason"
                      rows={5}
                      value={state.counterReason}
                      onChange={(e) => onUpdate((prev) => ({ ...prev, counterReason: e.target.value }))}
                      placeholder="가정이 성립하고, …을 계산하면 … 이므로 결론이 성립하지 않는다."
                      className={`w-full rounded-xl border bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                        state.counterReason.trim().length,
                        25
                      )}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyCounter}
                    className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    입력한 반례 점검
                  </button>

                  {feedback.twoCounter && (
                    <div
                      role="status"
                      className={`rounded-xl p-3.5 text-sm font-medium ${
                        feedback.twoCounter.type === 'good'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {feedback.twoCounter.text}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {state.decision === 'unknown'
                        ? '아직 증명하지 못한 이유 설명하기'
                        : '나의 말로 증명 보고서 작성하기'}
                    </h3>
                    <CharCountBadge current={state.proofText.trim().length} min={40} />
                  </div>
                  <label htmlFor="l2proof" className="block text-xs sm:text-sm text-slate-600 font-semibold">
                    {state.decision === 'unknown'
                      ? '현재까지 확인한 사실, 증명에 부족한 점, 다음 시도를 적어 보세요. (40자 이상)'
                      : '임의의 정수(또는 대상)를 문자로 나타내고 수학적 근거를 연결하세요. (40자 이상)'}
                  </label>
                  <textarea
                    id="l2proof"
                    rows={6}
                    value={state.proofText}
                    onChange={(e) => onUpdate((prev) => ({ ...prev, proofText: e.target.value }))}
                    placeholder="임의의 …에 대해 …이므로 …이다. 따라서 …"
                    className={`w-full rounded-xl border bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                      state.proofText.trim().length,
                      40
                    )}`}
                  />
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-slate-100">
                <h3 className="text-base font-bold text-slate-900">필요할 때만 힌트 열기</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  증명을 스스로 시도한 다음 막히는 부분에서 활용하세요. (클릭하여 열거나 다시 클릭하여 숨길 수 있습니다)
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    aria-expanded={isHintVisible}
                    onClick={() => {
                      if (isHintVisible) {
                        setIsHintVisible(false);
                      } else {
                        setIsHintVisible(true);
                        if ((state.hintLevel || 0) === 0) {
                          onUpdate((prev) => ({ ...prev, hintLevel: 1 }));
                        }
                      }
                    }}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-4 py-2 text-xs sm:text-sm font-bold transition-colors ${
                      isHintVisible
                        ? 'border-amber-400 bg-amber-100 text-amber-950'
                        : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <HelpCircle className="h-4 w-4" />
                    {isHintVisible
                      ? `힌트 숨기기 (${Math.max(1, state.hintLevel)}/3)`
                      : `힌트 보기 (${state.hintLevel}/3)`}
                  </button>
                </div>
                {isHintVisible && currentTopic && (
                  <div className="mt-3 rounded-xl bg-amber-50/70 border border-amber-200/70 p-3.5 text-sm text-amber-900 space-y-2">
                    <div className="space-y-1">
                      {currentTopic.hints.slice(0, Math.max(1, state.hintLevel)).map((h, hIdx) => (
                        <div key={hIdx}>
                          <strong>힌트 {hIdx + 1}:</strong> {h}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-amber-200/60">
                      {state.hintLevel < 3 ? (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdate((prev) => ({
                              ...prev,
                              hintLevel: Math.min(3, (prev.hintLevel || 0) + 1),
                            }))
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-200/70 hover:bg-amber-200 px-2.5 py-1 text-xs font-bold text-amber-950 transition-colors"
                        >
                          + 다음 단계 힌트 더 보기 ({Math.max(1, state.hintLevel)}/3)
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700">
                          모든 단계 힌트가 열렸습니다 (3/3)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsHintVisible(false)}
                        className="text-xs font-bold text-amber-800 hover:underline"
                      >
                        힌트 접기 ▲
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="text-xs font-bold text-blue-600">
            02차시 · 5 / 5단계
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            수사 결과 공유 · 사건을 확장하라
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            서로의 논리를 점검하고, 이번 탐구가 이전 차시와 어떻게 달랐는지 되돌아보세요.
          </p>

          <div className="mt-5 space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">수사 보고서 공유 및 동료 검토</h3>
            <div>
              <label htmlFor="l2share" className="block text-sm font-bold text-slate-800 mb-1.5">
                1. 친구에게 내 탐구 결과를 짧게 설명하기
              </label>
              <textarea
                id="l2share"
                rows={3}
                value={state.share}
                onChange={(e) => onUpdate((prev) => ({ ...prev, share: e.target.value }))}
                placeholder="내가 탐구한 명제는 … 이고, 이를 …으로 판단했다."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white p-3.5 text-base text-slate-900"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="l2peer" className="block text-sm font-bold text-slate-800 mb-1.5">
                  피드백한 친구 식별코드 (선택)
                </label>
                <input
                  id="l2peer"
                  type="text"
                  maxLength={25}
                  value={state.peer}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, peer: e.target.value }))}
                  placeholder="예: 10312"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="l2peerComment" className="block text-sm font-bold text-slate-800 mb-1.5">
                  친구가 확인해 준 점 / 질문
                </label>
                <textarea
                  id="l2peerComment"
                  rows={2}
                  value={state.peerComment}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, peerComment: e.target.value }))}
                  placeholder="가정에 맞는 반례인가요? 설명이 모든 경우를 포함하나요?"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white p-3 text-base text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="l2revision" className="block text-sm font-bold text-slate-800 mb-1.5">
                피드백을 반영해 고친 점 (선택)
              </label>
              <textarea
                id="l2revision"
                rows={2}
                value={state.revision}
                onChange={(e) => onUpdate((prev) => ({ ...prev, revision: e.target.value }))}
                placeholder="무엇을 보완했나요?"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white p-3 text-base text-slate-900"
              />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="l2reflection" className="block text-sm font-bold text-slate-800">
                  2. 1차시와 비교했을 때, 내가 달라진 점은 무엇인가요? (20자 이상)
                </label>
                <CharCountBadge current={state.reflection.trim().length} min={20} />
              </div>
              <textarea
                id="l2reflection"
                rows={4}
                value={state.reflection}
                onChange={(e) => onUpdate((prev) => ({ ...prev, reflection: e.target.value }))}
                placeholder="1차시와 비교하여 … 탐구 과정에서 … 점이 달라졌고 …을 배웠다."
                className={`w-full rounded-xl border bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.reflection.trim().length,
                  20
                )}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="l2next" className="block text-sm font-bold text-slate-800">
                  3. 다음에 탐구해 보고 싶은 명제 또는 질문 (10자 이상)
                </label>
                <CharCountBadge current={state.nextQuestion.trim().length} min={10} />
              </div>
              <textarea
                id="l2next"
                rows={3}
                value={state.nextQuestion}
                onChange={(e) => onUpdate((prev) => ({ ...prev, nextQuestion: e.target.value }))}
                placeholder="다음에는 … 조건의 명제를 탐구해 보고 싶으며, 궁금한 점은 …이다."
                className={`w-full rounded-xl border bg-white p-3.5 text-base text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.nextQuestion.trim().length,
                  10
                )}`}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <h3 className="text-lg font-extrabold text-emerald-950">01 + 02차시 수사 완료 · 03차시 대우법 예고</h3>
            </div>
            <p className="mt-1.5 text-sm text-emerald-800">
              작성하신 모든 수사 기록은 교사용 대시보드에 실시간으로 안전하게 자동 제출되었습니다. 이제 직접 증명하기 까다로운 명제를 해결하는 <strong>3차시(대우를 이용한 증명)</strong>로 나아가 봅시다!
            </p>
            {onGoToLesson3 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onGoToLesson3}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  3차시 대우법 사건 열기
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
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
