import React, { useState } from 'react';
import { Lesson1State } from '../utils/mathLogic';
import {
  Sparkles,
  Bot,
  Coffee,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Check,
} from 'lucide-react';
import { CharCountBadge, getCharCountBorderClass } from './CharCountBadge';

interface Lesson1ChallengeViewProps {
  state: Lesson1State;
  onUpdate: (updater: (prev: Lesson1State) => Lesson1State) => void;
  onGoToLesson2: () => void;
}

const DRINK_OPTIONS = ['물', '주스', '우유', '차'];
const AI_NAMES = ['지민', '유나', '민수'];

export const Lesson1ChallengeView: React.FC<Lesson1ChallengeViewProps> = ({
  state,
  onUpdate,
  onGoToLesson2,
}) => {
  const activeSubTab = state.challengeSubTab || 'challenge1';

  // Feedback states for Challenge 1 (AI)
  const [aiFeedback1, setAiFeedback1] = useState<{ text: string; type: 'good' | 'warn' } | null>(null);
  const [aiFeedbackB, setAiFeedbackB] = useState<string | null>(null);
  const [aiFeedbackC, setAiFeedbackC] = useState<string | null>(null);
  const [aiFeedbackReflect, setAiFeedbackReflect] = useState<string | null>(null);

  // Feedback states for Challenge 2 (Vending)
  const [vendFeedback1, setVendFeedback1] = useState<{ text: string; type: 'good' | 'warn' } | null>(null);
  const [vendFeedback2, setVendFeedback2] = useState<{ text: string; type: 'good' | 'warn' } | null>(null);
  const [vendFeedback3, setVendFeedback3] = useState<{ text: string; type: 'good' | 'warn' } | null>(null);

  // Challenge 1 Completion Check
  const isC1Part1Complete = Boolean(state.aiA && state.aiB && state.aiC && (state.aiExplain?.trim().length ?? 0) >= 8);
  const isC1RepairComplete = Boolean(state.aiFixB && state.aiFixC);
  const isC1Complete = isC1Part1Complete && isC1RepairComplete;

  // Challenge 2 Completion Check
  const currentVFix = state.vFix || ['', '', '', ''];
  const isC2Part1Complete = Boolean(state.vendAnswer && (state.vendExplain?.trim().length ?? 0) >= 8);
  const isC2VFixComplete = currentVFix.length === 4 && currentVFix.every(Boolean);
  const isC2Complete = isC2Part1Complete && isC2VFixComplete;

  const handleSubTabChange = (tab: 'challenge1' | 'challenge2') => {
    onUpdate((prev) => ({ ...prev, challengeSubTab: tab }));
  };

  // --- Handlers for Challenge 1 (AI Face Recognition) ---
  const handleCheckAiMission1 = () => {
    if (!state.aiA || !state.aiB || !state.aiC || !state.aiExplain?.trim()) {
      setAiFeedback1({
        text: '세 기계(A, B, C)의 함수 여부를 모두 선택하고 이유를 작성해 주세요.',
        type: 'warn',
      });
      return;
    }
    const isCorrect = state.aiA === 'yes' && state.aiB === 'no' && state.aiC === 'no';
    if (isCorrect) {
      setAiFeedback1({
        text: '정답입니다! 기계 A는 서로 다른 사진이 같은 이름(지민)으로 출력되어도 함수입니다. 반면 기계 B는 사진 ②에 유나와 민수라는 서로 다른 두 값이 대응하므로 함수가 아니며(출력 중복), 기계 C는 사진 ③에 대응하는 출력이 없으므로 함수가 아닙니다(출력 누락).',
        type: 'good',
      });
    } else {
      setAiFeedback1({
        text: '다시 검토해 보세요. 기계 A는 함수(다대일 대응 가능)이지만, 기계 B는 한 입력에 출력이 2개(유나, 민수)이므로 함수가 아니고, 기계 C는 사진 ③의 출력이 없으므로 함수가 아닙니다.',
        type: 'warn',
      });
    }
  };

  const handleCheckAiFixB = () => {
    if (!state.aiFixB) {
      setAiFeedbackB('기계 B의 사진 ②에 대응시킬 이름 하나를 먼저 선택하세요.');
      return;
    }
    setAiFeedbackB(
      `✓ 기계 B 수리 성공! 사진 ②의 출력이 [${state.aiFixB}] 한 개로 확정되었습니다. 이제 모든 사진에 출력이 오직 하나씩 있으므로 기계 B는 올바른 함수가 되었습니다.`
    );
  };

  const handleCheckAiFixC = () => {
    if (!state.aiFixC) {
      setAiFeedbackC('기계 C의 사진 ③에 대응시킬 이름 하나를 먼저 선택하세요.');
      return;
    }
    setAiFeedbackC(
      `✓ 기계 C 수리 성공! 사진 ③에 [${state.aiFixC}]라는 출력이 새롭게 연결되었습니다. 이제 정의역의 모든 사진에 출력이 하나씩 존재하므로 기계 C는 올바른 함수가 되었습니다.`
    );
  };

  const handleCheckAiReflection = () => {
    if (!state.aiReflection?.trim()) {
      setAiFeedbackReflect('자신의 생각을 10자 이상 작성해 주세요.');
      return;
    }
    setAiFeedbackReflect(
      '✓ 개념 확인 완료: 서로 다른 두 사진에 같은 이름이 대응하는 다대일 대응도 함수가 될 수 있습니다! 함수의 핵심 정의는 "정의역의 각 원소에 공역의 원소가 오직 하나씩 대응한다"는 것이며, 공역의 원소가 중복 선택되는 것은 상관없습니다.'
    );
  };

  // --- Handlers for Challenge 2 (Faulty Vending Machine) ---
  const handleCheckVendMission1 = () => {
    if (!state.vendAnswer || !state.vendExplain?.trim()) {
      setVendFeedback1({
        text: '자판기의 함수 여부(예/아니오)와 그 이유를 작성해 주세요.',
        type: 'warn',
      });
      return;
    }
    if (state.vendAnswer === 'no') {
      setVendFeedback1({
        text: '정답입니다! 현재 자판기는 함수가 아닙니다. 2번 버튼은 서로 다른 두 음료(주스, 우유)가 나오고, 3번 버튼은 대응하는 음료가 없기 때문입니다. 1번과 4번 버튼이 모두 물에 대응하는 것은 함수의 정의에 위배되지 않습니다.',
        type: 'good',
      });
    } else {
      setVendFeedback1({
        text: '다시 생각해 보세요. 2번 버튼을 누르면 2개의 음료가 나오고, 3번 버튼은 출력이 없으므로 함수의 조건을 위반했습니다.',
        type: 'warn',
      });
    }
  };

  const handleUpdateVFixItem = (idx: number, val: string) => {
    const next = [...currentVFix];
    next[idx] = val;
    onUpdate((prev) => ({ ...prev, vFix: next }));
  };

  const handleCheckVFix = () => {
    if (!currentVFix.every(Boolean)) {
      setVendFeedback2({
        text: '아직 수리가 끝나지 않았습니다. 1번부터 4번까지 모든 버튼에 음료를 1개씩 선택해 주세요.',
        type: 'warn',
      });
      return;
    }
    setVendFeedback2({
      text: '수리 성공! 정의역의 각 버튼(1~4)이 음료 한 개와 빠짐없이 대응하므로 함수입니다. 서로 다른 버튼이 같은 음료(예: 물)에 연결되어도 함수입니다.',
      type: 'good',
    });
  };

  const handleResetVFix = () => {
    onUpdate((prev) => ({ ...prev, vFix: ['', '', '', ''] }));
    setVendFeedback2(null);
  };

  const handleCheckSetMission3 = () => {
    if (!state.setAns || !state.setExplain?.trim()) {
      setVendFeedback3({
        text: '나의 판단과 근거 설명을 작성해 주세요.',
        type: 'warn',
      });
      return;
    }
    if (state.setAns === 'yes') {
      setVendFeedback3({
        text: '좋습니다! 출력이 개별 음료가 아니라 {물, 주스}라는 "음료 세트(집합)"를 하나의 공역 원소로 정의한다면, 버튼 하나에 음료 세트 하나가 오직 하나씩 결정되므로 함수로 모델링할 수 있습니다.',
        type: 'good',
      });
    } else {
      setVendFeedback3({
        text: '다시 생각해 보세요. 공역의 원소를 "단일 음료"가 아니라 "{물, 주스}"와 같은 "음료 세트(집합)"로 정의하면 한 번에 두 음료가 나오는 세트도 하나의 원소로 취급되어 함수가 될 수 있습니다.',
        type: 'warn',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Challenge Header */}
      <div>
        <div className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          01차시 특별 심화 탐구 · 6 / 6단계
        </div>
        <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          06 도전!! 실생활 함수 탐정
        </h2>
        <p className="mt-1 text-sm sm:text-base text-slate-600 leading-relaxed">
          대수적 홀수 증명에서 한 걸음 더 나아가, <strong>공통수학2 대응으로서의 함수 개념</strong>을 실생활 기술(AI 얼굴 인식)과 일상 기계(자판기)에 직접 적용하여 오류를 찾아 수리해 봅시다.
        </p>
      </div>

      {/* Sub-Tab Navigation Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
        <button
          type="button"
          onClick={() => handleSubTabChange('challenge1')}
          className={`flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
            activeSubTab === 'challenge1'
              ? 'bg-white text-indigo-950 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-black ${
                activeSubTab === 'challenge1'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-indigo-600">도전 1 (창의 탐구 ①)</div>
              <div className="text-sm sm:text-base font-bold">AI 얼굴 인식은 함수일까?</div>
            </div>
          </div>
          {isC1Complete ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5">
              <Check className="h-3 w-3" /> 완료
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-400">탐구 진행 중</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('challenge2')}
          className={`flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
            activeSubTab === 'challenge2'
              ? 'bg-white text-blue-950 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-black ${
                activeSubTab === 'challenge2'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              <Coffee className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-blue-600">도전 2 (창의 탐구 ⑤)</div>
              <div className="text-sm sm:text-base font-bold">고장 난 자판기를 수리하라!</div>
            </div>
          </div>
          {isC2Complete ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5">
              <Check className="h-3 w-3" /> 완료
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-400">탐구 진행 중</span>
          )}
        </button>
      </div>

      {/* =========================================================================
          CHALLENGE 1: AI 얼굴 인식은 함수일까?
         ========================================================================= */}
      {activeSubTab === 'challenge1' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/40 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-full border border-indigo-200">
                창의 탐구 ① · AI 얼굴 인식 모델링
              </span>
              <span className="text-xs font-bold text-slate-500">
                공통수학2 · 대응으로서의 함수
              </span>
            </div>
            <h3 className="mt-2 text-xl sm:text-2xl font-black text-slate-900">
              AI 얼굴 인식은 함수일까?
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              AI에 얼굴 사진을 입력하면 인식된 <strong>이름 1개</strong>를 출력하도록 설계했습니다.
              사진은 <strong>정의역의 원소</strong>, 사람 이름은 <strong>공역의 원소</strong>라고 생각하고 세 AI 기계를 분석해 보세요.
            </p>
          </div>

          {/* Mission 1 Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-indigo-600 text-xs font-bold text-white mono">
                1
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                미션 1 · AI가 얼굴을 알아본다면?
              </h4>
            </div>

            {/* 3 Machine Observation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Machine A */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">기계 A · 한 번에 한 이름</span>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    정상 모델
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-600">사진 ①</span>
                    <span className="text-indigo-600 font-bold">➜</span>
                    <strong className="text-slate-900">지민</strong>
                  </div>
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-600">사진 ②</span>
                    <span className="text-indigo-600 font-bold">➜</span>
                    <strong className="text-slate-900">유나</strong>
                  </div>
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-600">사진 ③</span>
                    <span className="text-indigo-600 font-bold">➜</span>
                    <strong className="text-slate-900">지민</strong>
                  </div>
                </div>
              </div>

              {/* Machine B */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">기계 B · 이상한 출력</span>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    출력 오류
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-600">사진 ①</span>
                    <span className="text-indigo-600 font-bold">➜</span>
                    <strong className="text-slate-900">지민</strong>
                  </div>
                  <div className="flex items-center justify-between bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-300">
                    <span className="text-slate-600">사진 ②</span>
                    <span className="text-rose-600 font-black">➜</span>
                    <strong className="text-rose-700">유나, 민수 (각각)</strong>
                  </div>
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-600">사진 ③</span>
                    <span className="text-indigo-600 font-bold">➜</span>
                    <strong className="text-slate-900">지민</strong>
                  </div>
                </div>
              </div>

              {/* Machine C */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">기계 C · 사라진 출력</span>
                  <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                    출력 누락
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-600">사진 ①</span>
                    <span className="text-indigo-600 font-bold">➜</span>
                    <strong className="text-slate-900">지민</strong>
                  </div>
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-600">사진 ②</span>
                    <span className="text-indigo-600 font-bold">➜</span>
                    <strong className="text-slate-900">유나</strong>
                  </div>
                  <div className="flex items-center justify-between bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-300">
                    <span className="text-slate-600">사진 ③</span>
                    <span className="text-rose-600 font-black">➜</span>
                    <strong className="text-rose-700 underline">결과 없음</strong>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              * 이 실험에서는 이름을 각각 별도의 공역 원소로 다룹니다. (정의역: {'{사진①, 사진②, 사진③}'}, 공역: {'{지민, 유나, 민수}'})
            </p>

            {/* Selection Inputs for Machines A, B, C */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  기계 A의 대응은 함수일까요?
                </label>
                <select
                  value={state.aiA || ''}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, aiA: e.target.value as any }))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">선택하세요</option>
                  <option value="yes">함수이다</option>
                  <option value="no">함수가 아니다</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  기계 B의 대응은 함수일까요?
                </label>
                <select
                  value={state.aiB || ''}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, aiB: e.target.value as any }))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">선택하세요</option>
                  <option value="yes">함수이다</option>
                  <option value="no">함수가 아니다</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  기계 C의 대응은 함수일까요?
                </label>
                <select
                  value={state.aiC || ''}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, aiC: e.target.value as any }))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">선택하세요</option>
                  <option value="yes">함수이다</option>
                  <option value="no">함수가 아니다</option>
                </select>
              </div>
            </div>

            {/* Explanation Textarea */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="aiExplain" className="block text-xs font-bold text-slate-800">
                  세 기계의 차이를 자신의 말로 설명하기 (10자 이상)
                </label>
                <CharCountBadge current={state.aiExplain?.trim().length ?? 0} min={10} />
              </div>
              <textarea
                id="aiExplain"
                rows={3}
                value={state.aiExplain || ''}
                onChange={(e) => onUpdate((prev) => ({ ...prev, aiExplain: e.target.value }))}
                placeholder="예: 기계 A는 서로 다른 사진이 같은 사람으로 출력되어도 함수이지만, 기계 B는 사진 ②에 두 개의 출력이 대응하여 오직 하나가 아니며, 기계 C는 사진 ③에 대응하는 출력이 누락되어..."
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3 text-xs sm:text-sm text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.aiExplain?.trim().length ?? 0,
                  10
                )}`}
              />
            </div>

            <button
              type="button"
              onClick={handleCheckAiMission1}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              문항 1 정답 확인
            </button>

            {aiFeedback1 && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${
                  aiFeedback1.type === 'good'
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                    : 'bg-amber-50 text-amber-950 border border-amber-200'
                }`}
              >
                {aiFeedback1.type === 'good' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span>{aiFeedback1.text}</span>
              </div>
            )}
          </div>

          {/* Mission 2 Card: Repairing AI Errors */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-indigo-600 text-xs font-bold text-white mono">
                2
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                미션 2 · AI 오류를 직접 수리하기
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              기계 B는 사진 ②에 두 이름이 대응하는 오류, 기계 C는 사진 ③의 출력이 없는 오류입니다.{' '}
              <strong>각 기계를 별도로 수리</strong>해 보세요. 모든 사진에 이름이 정확히 하나씩 대응해야 함수가 됩니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Repair Machine B */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="font-bold text-sm text-slate-900">
                  기계 B 수리 · 사진 ②의 출력 하나로 변경
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    사진 ② ➜
                  </span>
                  <select
                    value={state.aiFixB || ''}
                    onChange={(e) => onUpdate((prev) => ({ ...prev, aiFixB: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-900"
                  >
                    <option value="">이름 하나 선택</option>
                    {AI_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleCheckAiFixB}
                    className="min-h-[38px] px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shrink-0"
                  >
                    수리 확인
                  </button>
                </div>
                {aiFeedbackB && (
                  <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                    {aiFeedbackB}
                  </p>
                )}
              </div>

              {/* Repair Machine C */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="font-bold text-sm text-slate-900">
                  기계 C 수리 · 사진 ③의 출력 채우기
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    사진 ③ ➜
                  </span>
                  <select
                    value={state.aiFixC || ''}
                    onChange={(e) => onUpdate((prev) => ({ ...prev, aiFixC: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-900"
                  >
                    <option value="">이름 하나 선택</option>
                    {AI_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleCheckAiFixC}
                    className="min-h-[38px] px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shrink-0"
                  >
                    수리 확인
                  </button>
                </div>
                {aiFeedbackC && (
                  <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                    {aiFeedbackC}
                  </p>
                )}
              </div>
            </div>

            {/* Reflection question */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label htmlFor="aiReflection" className="block text-xs font-bold text-slate-800">
                  탐구 질문: 두 장의 사진이 같은 사람의 이름으로 출력되어도 함수일까요? 이유는? (10자 이상)
                </label>
                <CharCountBadge current={state.aiReflection?.trim().length ?? 0} min={10} />
              </div>
              <textarea
                id="aiReflection"
                rows={3}
                value={state.aiReflection || ''}
                onChange={(e) => onUpdate((prev) => ({ ...prev, aiReflection: e.target.value }))}
                placeholder="정의역의 모든 원소와 공역의 원소의 관계를 이용하여 설명하세요. (예: 서로 다른 사진이라도 각 사진에 대응하는 사람이 하나씩만 정해지면 함수이다...)"
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3 text-xs sm:text-sm text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.aiReflection?.trim().length ?? 0,
                  10
                )}`}
              />
              <button
                type="button"
                onClick={handleCheckAiReflection}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700"
              >
                <HelpCircle className="h-4 w-4 text-indigo-600" />
                문항 3 생각 확인
              </button>
              {aiFeedbackReflect && (
                <div className="p-3.5 rounded-xl bg-blue-50 text-blue-950 border border-blue-200 text-xs sm:text-sm leading-relaxed">
                  {aiFeedbackReflect}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CHALLENGE 2: 고장 난 자판기를 수리하라!
         ========================================================================= */}
      {activeSubTab === 'challenge2' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full border border-blue-200">
                창의 탐구 ⑤ · 자판기 메커니즘
              </span>
              <span className="text-xs font-bold text-slate-500">
                공통수학2 · 대응으로서의 함수
              </span>
            </div>
            <h3 className="mt-2 text-xl sm:text-2xl font-black text-slate-900">
              고장 난 자판기를 수리하라!
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              버튼 1~4를 누르면 <strong>음료 한 개</strong>가 나오도록 만든 자판기입니다. 오류가 발생한 자판기의 대응을 조사하고 직접 정상 함수가 되도록 수리해 보세요.
            </p>
          </div>

          {/* Mission 1 Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-600 text-xs font-bold text-white mono">
                1
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                미션 1 · 고장 난 자판기 조사
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Faulty Status Display */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">현재 자판기 고장 상태</span>
                  <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                    기계 결함 확인
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700">1번 버튼</span>
                    <span className="text-blue-600 font-bold">➜</span>
                    <strong className="text-slate-900">물</strong>
                  </div>
                  <div className="flex items-center justify-between bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
                    <span className="font-bold text-slate-700">2번 버튼</span>
                    <span className="text-rose-600 font-black">➜</span>
                    <strong className="text-rose-700">주스 또는 우유 (각각)</strong>
                  </div>
                  <div className="flex items-center justify-between bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
                    <span className="font-bold text-slate-700">3번 버튼</span>
                    <span className="text-rose-600 font-black">➜</span>
                    <strong className="text-rose-700 underline">출력 없음</strong>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700">4번 버튼</span>
                    <span className="text-blue-600 font-bold">➜</span>
                    <strong className="text-slate-900">물</strong>
                  </div>
                </div>
              </div>

              {/* Mathematical Set Definition & Answer */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-xs text-blue-700 uppercase tracking-wider mb-1">
                    수학적 집합 정의
                  </div>
                  <p className="text-xs text-slate-600 mono">
                    정의역 X = {'{1, 2, 3, 4}'}
                  </p>
                  <p className="text-xs text-slate-600 mono">
                    공역 Y = {'{물, 주스, 우유, 차}'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    지금 대응이 함수인가요?
                  </label>
                  <select
                    value={state.vendAnswer || ''}
                    onChange={(e) => onUpdate((prev) => ({ ...prev, vendAnswer: e.target.value as any }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">선택하세요</option>
                    <option value="yes">함수이다</option>
                    <option value="no">함수가 아니다</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label htmlFor="vendExplain" className="block text-xs font-bold text-slate-800">
                  그렇게 판단한 이유 (어떤 버튼이 함수의 조건을 위반했나요? 8자 이상)
                </label>
                <CharCountBadge current={state.vendExplain?.trim().length ?? 0} min={8} />
              </div>
              <textarea
                id="vendExplain"
                rows={3}
                value={state.vendExplain || ''}
                onChange={(e) => onUpdate((prev) => ({ ...prev, vendExplain: e.target.value }))}
                placeholder="어떤 버튼이 함수의 조건을 위반했는지 설명하세요. (예: 2번 버튼은 하나의 입력에 주스와 우유 2개가 대응하고, 3번 버튼은 출력이 없으므로...)"
                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3 text-xs sm:text-sm text-slate-900 transition-colors ${getCharCountBorderClass(
                  state.vendExplain?.trim().length ?? 0,
                  8
                )}`}
              />
            </div>

            <button
              type="button"
              onClick={handleCheckVendMission1}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              문항 1 정답 확인
            </button>

            {vendFeedback1 && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${
                  vendFeedback1.type === 'good'
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                    : 'bg-amber-50 text-amber-950 border border-amber-200'
                }`}
              >
                {vendFeedback1.type === 'good' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span>{vendFeedback1.text}</span>
              </div>
            )}
          </div>

          {/* Mission 2 Card: Repairing the Vending Machine */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-600 text-xs font-bold text-white mono">
                2
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                미션 2 · 자판기 수리하기
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              버튼마다 연결할 음료를 선택하세요. <strong>모든 버튼에 음료 1개씩</strong> 대응하면 됩니다.{' '}
              같은 음료가 여러 버튼에 연결되어도 괜찮습니다.
            </p>

            {/* Interactive Drink Selector per Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((btnNum, idx) => (
                <div
                  key={btnNum}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70"
                >
                  <span className="font-extrabold text-xs text-slate-900 whitespace-nowrap">
                    {btnNum}번 버튼 ➜
                  </span>
                  <select
                    value={currentVFix[idx] || ''}
                    onChange={(e) => handleUpdateVFixItem(idx, e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-slate-900"
                  >
                    <option value="">음료를 선택하세요</option>
                    {DRINK_OPTIONS.map((drink) => (
                      <option key={drink} value={drink}>
                        {drink}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Real-time Status Preview */}
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                isC2VFixComplete
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {isC2VFixComplete ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>현재 설계는 함수입니다. 모든 버튼의 음료가 하나씩 올바르게 정해졌습니다.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>아직 일부 버튼에 대응 음료가 없습니다. 1번부터 4번까지 모든 버튼을 확인하세요.</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCheckVFix}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                문항 2 정답 확인
              </button>
              <button
                type="button"
                onClick={handleResetVFix}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                다시 설계
              </button>
            </div>

            {vendFeedback2 && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${
                  vendFeedback2.type === 'good'
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                    : 'bg-amber-50 text-amber-950 border border-amber-200'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{vendFeedback2.text}</span>
              </div>
            )}
          </div>

          {/* Mission 3 Card: Advanced Set Exploration */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-600 text-xs font-bold text-white mono">
                3
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                미션 3 · 더 어려운 상황 생각하기 (음료 세트 출력)
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              자판기가 <strong>음료 한 개</strong> 대신 <strong>음료 세트 전체</strong>를 하나의 출력으로 내보내게 규칙을 바꾸면, 한 번에 물과 주스가 함께 나오는 상황도 함수가 될 수 있을까요?
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  나의 판단
                </label>
                <select
                  value={state.setAns || ''}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, setAns: e.target.value as any }))}
                  className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">선택하세요</option>
                  <option value="yes">그럴 수 있다</option>
                  <option value="no">불가능하다</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label htmlFor="setExplain" className="block text-xs font-bold text-slate-800">
                    근거 설명 (출력의 원소를 어떻게 정의했는지 써 보세요. 8자 이상)
                  </label>
                  <CharCountBadge current={state.setExplain?.trim().length ?? 0} min={8} />
                </div>
                <textarea
                  id="setExplain"
                  rows={3}
                  value={state.setExplain || ''}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, setExplain: e.target.value }))}
                  placeholder="출력의 원소를 개별 음료가 아니라 {물, 주스}라는 묶음(세트 집합) 자체로 정의한다면..."
                  className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white p-3 text-xs sm:text-sm text-slate-900 transition-colors ${getCharCountBorderClass(
                    state.setExplain?.trim().length ?? 0,
                    8
                  )}`}
                />
              </div>

              <button
                type="button"
                onClick={handleCheckSetMission3}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                문항 3 정답 확인
              </button>

              {vendFeedback3 && (
                <div
                  className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${
                    vendFeedback3.type === 'good'
                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                      : 'bg-amber-50 text-amber-950 border border-amber-200'
                  }`}
                >
                  {vendFeedback3.type === 'good' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span>{vendFeedback3.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Banner & Next Lesson Navigation */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-blue-50/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>01차시 모든 탐구 및 실생활 함수 도전 완료!</span>
            </div>
            <h4 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              이제 02차시 '반례와 진실의 증명'으로 나아갈 준비가 되었습니다.
            </h4>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              도전 1(AI)과 도전 2(자판기)에서 학습한 대응의 원리를 바탕으로, 2차시에서는 새로운 가설을 세우고 반례 수색을 시작합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToLesson2}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all shrink-0 shadow-md active:scale-95"
          >
            <span>02차시 다음 사건 열기</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
