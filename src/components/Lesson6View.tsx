import React, { useState } from 'react';
import {
  Lesson6State,
  PROOF6_PROB1_STEPS,
  PROOF6_PROB2_STEPS,
  calc6GeometrySimulation,
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
  CircleDot,
  Square,
  Layers,
  PlusCircle,
} from 'lucide-react';
import { CharCountBadge } from './CharCountBadge';
import { MathText, MathPreviewBox } from './MathText';

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
  const [simA, setSimA] = useState<number>(4);
  const [simB, setSimB] = useState<number>(12);
  const [inputA, setInputA] = useState<string>('4');
  const [inputB, setInputB] = useState<string>('12');
  const [simViewMode, setSimViewMode] = useState<'both' | 'length' | 'area'>('both');
  const [showFullCircle, setShowFullCircle] = useState<boolean>(true);
  const [inputWarning, setInputWarning] = useState<string | null>(null);

  // Toggle visibility states for hints
  const [showStep1Hint, setShowStep1Hint] = useState<boolean>(false);
  const [showStep3Hint, setShowStep3Hint] = useState<boolean>(false);
  const [prob1HintsOpen, setProb1HintsOpen] = useState<boolean[]>([false, false, false, false]);
  const [prob2HintsOpen, setProb2HintsOpen] = useState<boolean[]>([false, false, false, false]);

  const done = evaluateLevel6Completion(state);
  const rubric = evaluateRubricL6(state);
  const geoSim = calc6GeometrySimulation(simA, simB);

  const syncSimPair = (nextA: number, nextB: number) => {
    const clampedA = Math.max(0.5, Math.min(20, Number(nextA.toFixed(1))));
    const clampedB = Math.max(0.5, Math.min(20, Number(nextB.toFixed(1))));
    setSimA(clampedA);
    setSimB(clampedB);
    setInputA(String(clampedA));
    setInputB(String(clampedB));
    setInputWarning(null);
  };

  const handleAddExample = (aVal?: number, bVal?: number) => {
    const parsedA = aVal !== undefined ? aVal : Number(inputA);
    const parsedB = bVal !== undefined ? bVal : Number(inputB);
    const a = Number.isFinite(parsedA) ? Number(parsedA.toFixed(2)) : safeN(inputA);
    const b = Number.isFinite(parsedB) ? Number(parsedB.toFixed(2)) : safeN(inputB);
    if (a === null || b === null || a <= 0 || b <= 0) {
      setInputWarning('양수 조건(a > 0, b > 0)을 만족하는 양수를 입력해 주세요. (예: a=4, b=12 또는 a=1, b=9)');
      return;
    }
    syncSimPair(a, b);
    if (state.examples.some((x) => Math.abs(x.a - a) < 1e-6 && Math.abs(x.b - b) < 1e-6)) {
      setInputWarning(`이미 (a=${a}, b=${b}) 순서쌍이 단서 표에 기록되어 있습니다. 도형 시뮬레이션 값은 업데이트되었습니다.`);
      return;
    }
    setInputWarning(null);
    const nextItem = calc6Means(a, b);
    onUpdate((prev) => ({
      ...prev,
      examples: [...prev.examples, nextItem],
    }));
  };

  // SVG Geometry Coordinates Calculation for Circle/Semicircle
  const circleSvgGeometry = (() => {
    const cx = 190;
    const cy = showFullCircle ? 128 : 178;
    const radiusPx = showFullCircle ? 84 : 118;
    const totalAB = geoSim.diameter;
    const scale = (2 * radiusPx) / totalAB;
    // Left endpoint A = (cx - R, cy), Right endpoint B = (cx + R, cy), Center O = (cx, cy)
    const ax = cx - radiusPx;
    const bx = cx + radiusPx;
    // Split point H at distance a from A
    const hx = ax + geoSim.a * scale;
    // Altitude PH = sqrt(ab) * scale
    const hPx = geoSim.geom * scale;
    const px = hx;
    const py = cy - hPx;
    // Projection Q of H onto OP:
    // Vector OP = (px - cx, py - cy), length = radiusPx
    // In right triangle OPH, distance OQ along OP is OH^2 / R, and PQ along PO is PH^2 / R = harm * scale
    const ux = (px - cx) / (radiusPx || 1);
    const uy = (py - cy) / (radiusPx || 1);
    const oqLen = (geoSim.centerOffset * scale * (geoSim.centerOffset * scale)) / (radiusPx || 1);
    const qx = cx + ux * oqLen;
    const qy = cy + uy * oqLen;

    return {
      cx,
      cy,
      radiusPx,
      ax,
      bx,
      hx,
      px,
      py,
      qx,
      qy,
      viewHeight: showFullCircle ? 248 : 225,
    };
  })();

  return (
    <div className="space-y-6">
      {/* STEP 0: 1단계 산술·기하 단서 수집 (원·반원 길이 & 사각형 면적 시뮬레이션) */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="text-xs font-bold text-blue-600">
              STAGE 01 · 도형 시뮬레이션 단서 수집 · 원·반원의 길이와 정사각형·직사각형의 넓이 비교
            </div>
            <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              절대부등식 수사 2: 원·반원과 사각형에서 산술평균과 기하평균을 눈으로 확인하라!
            </h3>
            <p className="mt-1.5 text-sm sm:text-base text-slate-700 leading-relaxed">
              두 양수 <span className="mono font-bold">a &gt; 0, b &gt; 0</span>을 지름의 두 선분 또는 직사각형의 두 변으로 두면,{' '}
              <span className="mono font-bold text-blue-700">산술평균 (a+b)/2</span>는 <strong>원의 반지름(정사각형의 한 변)</strong>이 되고,{' '}
              <span className="mono font-bold text-indigo-700">
                <MathText text="기하평균 √(ab)" />
              </span>
              는 <strong>수선의 높이(넓이가 같은 정사각형의 한 변)</strong>가 됩니다.
              슬라이더나 추천 순서쌍을 조작하여 <strong>길이 비교(원·반원)</strong>와 <strong>면적 비교(사각형)</strong>를 실험하고 단서를 3개 이상 기록해 보세요.
            </p>
          </div>

          {/* Interactive Geometric Simulator Card */}
          <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/40 p-4 sm:p-6 shadow-xs space-y-5">
            {/* Simulator Header & Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-extrabold text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                    실시간 도형 시뮬레이터
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-900">
                    양수 (a={geoSim.a}, b={geoSim.b}) 길이·면적 기하학 비교
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  슬라이더를 움직이거나 프리셋을 클릭하면 반원·원의 현과 정사각형·직사각형의 면적이 실시간으로 변합니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="도형 시뮬레이션 보기 방식">
                <button
                  type="button"
                  role="tab"
                  aria-selected={simViewMode === 'both'}
                  onClick={() => setSimViewMode('both')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    simViewMode === 'both'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>길이+면적 함께 보기</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={simViewMode === 'length'}
                  onClick={() => setSimViewMode('length')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    simViewMode === 'length'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CircleDot className="h-3.5 w-3.5" />
                  <span>원·반원 길이 비교</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={simViewMode === 'area'}
                  onClick={() => setSimViewMode('area')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    simViewMode === 'area'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>사각형 면적 비교</span>
                </button>
              </div>
            </div>

            {/* Sliders & Quick Presets Bar */}
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] items-center rounded-xl border border-slate-200 bg-white p-4">
              {/* Slider A */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <label htmlFor="l6-slider-a" className="text-slate-700">
                    선분·가로 길이 <span className="mono text-blue-700 font-extrabold">a = {geoSim.a}</span>
                  </label>
                  <span className="text-[11px] text-slate-400 mono">0.5 ~ 16</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    id="l6-slider-a"
                    type="range"
                    min="0.5"
                    max="16"
                    step="0.5"
                    value={simA}
                    onChange={(e) => syncSimPair(Number(e.target.value), simB)}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <input
                    id="l6-a-input"
                    type="text"
                    inputMode="numeric"
                    aria-label="양수 a 직접 입력"
                    value={inputA}
                    onChange={(e) => {
                      setInputA(e.target.value);
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v > 0 && v <= 50) {
                        setSimA(v);
                      }
                    }}
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-xs font-bold mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Slider B */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <label htmlFor="l6-slider-b" className="text-slate-700">
                    선분·세로 길이 <span className="mono text-indigo-700 font-extrabold">b = {geoSim.b}</span>
                  </label>
                  <span className="text-[11px] text-slate-400 mono">0.5 ~ 16</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    id="l6-slider-b"
                    type="range"
                    min="0.5"
                    max="16"
                    step="0.5"
                    value={simB}
                    onChange={(e) => syncSimPair(simA, Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <input
                    id="l6-b-input"
                    type="text"
                    inputMode="numeric"
                    aria-label="양수 b 직접 입력"
                    value={inputB}
                    onChange={(e) => {
                      setInputB(e.target.value);
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v > 0 && v <= 50) {
                        setSimB(v);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExample();
                      }
                    }}
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-xs font-bold mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Record Button */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleAddExample(simA, simB)}
                  className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-extrabold text-white shadow-xs hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>현재 ({simA}, {simB}) 단서 표에 추가</span>
                </button>
              </div>
            </div>

            {/* Preset Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-slate-600 mr-1">빠른 실험 &amp; 단서 추가:</span>
                {[
                  { a: 4, b: 4, tag: 'a=b 등호 성립' },
                  { a: 1, b: 9, tag: '산술 5 > 기하 3' },
                  { a: 2, b: 8, tag: '산술 5 > 기하 4' },
                  { a: 4, b: 16, tag: '산술 10 > 기하 8' },
                  { a: 3, b: 12, tag: '산술 7.5 > 기하 6' },
                  { a: 6, b: 6, tag: 'a=b 등호 성립' },
                ].map((preset) => {
                  const isCurrent = Math.abs(simA - preset.a) < 1e-6 && Math.abs(simB - preset.b) < 1e-6;
                  return (
                    <button
                      key={`${preset.a}-${preset.b}`}
                      type="button"
                      onClick={() => handleAddExample(preset.a, preset.b)}
                      className={`rounded-xl border px-3 py-1.5 font-bold transition-all ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                          : 'border-blue-200 bg-blue-50/80 text-blue-800 hover:bg-blue-100'
                      }`}
                    >
                      <span className="mono">({preset.a}, {preset.b})</span>{' '}
                      <span className="text-[11px] opacity-85">· {preset.tag}</span>
                    </button>
                  );
                })}
              </div>

              <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                <input
                  type="checkbox"
                  checked={showFullCircle}
                  onChange={(e) => setShowFullCircle(e.target.checked)}
                  className="rounded accent-blue-600"
                />
                <span>전체 원(Circle) 보조선 표시</span>
              </label>
            </div>

            {/* Visual Simulation Panels (Length & Area) */}
            <div
              className={`grid gap-5 ${
                simViewMode === 'both' ? 'lg:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {/* PANEL 1: Semicircle / Circle Length Comparison */}
              {(simViewMode === 'both' || simViewMode === 'length') && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                        GEOMETRY 01 · 반원·원에서의 선분 길이 비교
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                        <MathText text="반지름 R = (a+b)/2 vs 수선 높이 h = √(ab) vs 조화선분 = 2ab/(a+b)" />
                      </h4>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                        geoSim.isEqual
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {geoSim.isEqual ? 'a = b (수선 P가 원의 정중앙 M과 일치!)' : '빗변(반지름) > 높이(기하평균)'}
                    </span>
                  </div>

                  {/* Interactive Circle/Semicircle SVG */}
                  <div className="rounded-xl border border-slate-100 bg-slate-950 p-3 text-white">
                    <svg
                      viewBox={`0 0 380 ${circleSvgGeometry.viewHeight}`}
                      className="w-full h-auto max-h-[250px] overflow-visible"
                      role="img"
                      aria-label={`지름이 a+b=${geoSim.diameter}인 원에서 산술평균 반지름 ${geoSim.arith}와 기하평균 높이 ${geoSim.geom}를 비교하는 기하 시뮬레이션`}
                    >
                      {/* Background Grid Lines */}
                      <line
                        x1="20"
                        y1={circleSvgGeometry.cy}
                        x2="360"
                        y2={circleSvgGeometry.cy}
                        stroke="rgba(148,163,184,0.2)"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1={circleSvgGeometry.cx}
                        y1="18"
                        x2={circleSvgGeometry.cx}
                        y2={circleSvgGeometry.viewHeight - 18}
                        stroke="rgba(148,163,184,0.2)"
                        strokeDasharray="3 3"
                      />

                      {/* Lower Half Circle (when full circle is enabled) */}
                      {showFullCircle && (
                        <circle
                          cx={circleSvgGeometry.cx}
                          cy={circleSvgGeometry.cy}
                          r={circleSvgGeometry.radiusPx}
                          fill="rgba(59,130,246,0.05)"
                          stroke="rgba(148,163,184,0.35)"
                          strokeWidth="1.5"
                          strokeDasharray="5 4"
                        />
                      )}

                      {/* Upper Semicircle Arc */}
                      <path
                        d={`M ${circleSvgGeometry.ax} ${circleSvgGeometry.cy} A ${circleSvgGeometry.radiusPx} ${circleSvgGeometry.radiusPx} 0 0 1 ${circleSvgGeometry.bx} ${circleSvgGeometry.cy}`}
                        fill="rgba(59,130,246,0.12)"
                        stroke="#60a5fa"
                        strokeWidth="2.5"
                      />

                      {/* Inscribed Right Triangle APB (dashed chords AP and BP showing similarity) */}
                      <line
                        x1={circleSvgGeometry.ax}
                        y1={circleSvgGeometry.cy}
                        x2={circleSvgGeometry.px}
                        y2={circleSvgGeometry.py}
                        stroke="rgba(148,163,184,0.45)"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1={circleSvgGeometry.bx}
                        y1={circleSvgGeometry.cy}
                        x2={circleSvgGeometry.px}
                        y2={circleSvgGeometry.py}
                        stroke="rgba(148,163,184,0.45)"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                      />

                      {/* Highlight Right Triangle OPH */}
                      <polygon
                        points={`${circleSvgGeometry.cx},${circleSvgGeometry.cy} ${circleSvgGeometry.hx},${circleSvgGeometry.cy} ${circleSvgGeometry.px},${circleSvgGeometry.py}`}
                        fill="rgba(99,102,241,0.22)"
                        stroke="none"
                      />

                      {/* Segment AH = a (Sky Blue) */}
                      <line
                        x1={circleSvgGeometry.ax}
                        y1={circleSvgGeometry.cy}
                        x2={circleSvgGeometry.hx}
                        y2={circleSvgGeometry.cy}
                        stroke="#38bdf8"
                        strokeWidth="4"
                      />
                      {/* Segment HB = b (Violet) */}
                      <line
                        x1={circleSvgGeometry.hx}
                        y1={circleSvgGeometry.cy}
                        x2={circleSvgGeometry.bx}
                        y2={circleSvgGeometry.cy}
                        stroke="#c084fc"
                        strokeWidth="4"
                      />

                      {/* Center Vertical Radius OM = (a+b)/2 (dashed reference) */}
                      <line
                        x1={circleSvgGeometry.cx}
                        y1={circleSvgGeometry.cy}
                        x2={circleSvgGeometry.cx}
                        y2={circleSvgGeometry.cy - circleSvgGeometry.radiusPx}
                        stroke="rgba(96,165,250,0.55)"
                        strokeWidth="1.8"
                        strokeDasharray="4 3"
                      />

                      {/* Hypotenuse Radius OP = (a+b)/2 (Arithmetic Mean, Blue) */}
                      <line
                        x1={circleSvgGeometry.cx}
                        y1={circleSvgGeometry.cy}
                        x2={circleSvgGeometry.px}
                        y2={circleSvgGeometry.py}
                        stroke="#3b82f6"
                        strokeWidth="3.5"
                      />

                      {/* Harmonic Mean Segment PQ along OP (Emerald) */}
                      {!geoSim.isEqual && (
                        <>
                          <line
                            x1={circleSvgGeometry.hx}
                            y1={circleSvgGeometry.cy}
                            x2={circleSvgGeometry.qx}
                            y2={circleSvgGeometry.qy}
                            stroke="rgba(16,185,129,0.65)"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                          <line
                            x1={circleSvgGeometry.qx}
                            y1={circleSvgGeometry.qy}
                            x2={circleSvgGeometry.px}
                            y2={circleSvgGeometry.py}
                            stroke="#10b981"
                            strokeWidth="4"
                          />
                        </>
                      )}

                      {/* Altitude PH = sqrt(ab) (Geometric Mean, Amber/Indigo bright) */}
                      <line
                        x1={circleSvgGeometry.hx}
                        y1={circleSvgGeometry.cy}
                        x2={circleSvgGeometry.px}
                        y2={circleSvgGeometry.py}
                        stroke="#f59e0b"
                        strokeWidth="3.5"
                      />

                      {/* Key Points */}
                      <circle cx={circleSvgGeometry.ax} cy={circleSvgGeometry.cy} r="4" fill="#38bdf8" />
                      <circle cx={circleSvgGeometry.bx} cy={circleSvgGeometry.cy} r="4" fill="#c084fc" />
                      <circle cx={circleSvgGeometry.cx} cy={circleSvgGeometry.cy} r="4.5" fill="#60a5fa" />
                      <circle cx={circleSvgGeometry.hx} cy={circleSvgGeometry.cy} r="4.5" fill="#f59e0b" />
                      <circle cx={circleSvgGeometry.px} cy={circleSvgGeometry.py} r="5" fill="#fbbf24" />
                      <circle
                        cx={circleSvgGeometry.cx}
                        cy={circleSvgGeometry.cy - circleSvgGeometry.radiusPx}
                        r="3.5"
                        fill="#60a5fa"
                      />

                      {/* Labels */}
                      <text x={circleSvgGeometry.ax - 4} y={circleSvgGeometry.cy + 18} fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
                        A
                      </text>
                      <text x={circleSvgGeometry.bx + 4} y={circleSvgGeometry.cy + 18} fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
                        B
                      </text>
                      <text x={circleSvgGeometry.cx} y={circleSvgGeometry.cy + 18} fill="#60a5fa" fontSize="11" fontWeight="bold" textAnchor="middle">
                        O(중심)
                      </text>
                      <text
                        x={circleSvgGeometry.hx}
                        y={Math.abs(circleSvgGeometry.hx - circleSvgGeometry.cx) < 22 ? circleSvgGeometry.cy + 31 : circleSvgGeometry.cy + 18}
                        fill="#fbbf24"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        H
                      </text>
                      <text x={circleSvgGeometry.px} y={circleSvgGeometry.py - 8} fill="#fde68a" fontSize="11" fontWeight="bold" textAnchor="middle">
                        P (<tspan fontFamily="Cambria Math, STIX Two Math, Times New Roman, serif">√</tspan>
                        <tspan style={{ textDecoration: 'overline' }}>ab</tspan>={geoSim.geom})
                      </text>
                      <text
                        x={circleSvgGeometry.cx}
                        y={circleSvgGeometry.cy - circleSvgGeometry.radiusPx - 7}
                        fill="#93c5fd"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        반지름 R=(a+b)/2={geoSim.arith}
                      </text>

                      {/* Segment a and b labels */}
                      <text
                        x={(circleSvgGeometry.ax + circleSvgGeometry.hx) / 2}
                        y={circleSvgGeometry.cy - 6}
                        fill="#38bdf8"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        a={geoSim.a}
                      </text>
                      <text
                        x={(circleSvgGeometry.hx + circleSvgGeometry.bx) / 2}
                        y={circleSvgGeometry.cy - 6}
                        fill="#c084fc"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        b={geoSim.b}
                      </text>
                    </svg>

                    {/* Length Comparison Bar Meters */}
                    <div className="mt-2 pt-2.5 border-t border-white/10 space-y-1.5 text-xs">
                      <div className="grid grid-cols-[120px_1fr_64px] items-center gap-2">
                        <span className="font-bold text-sky-300">산술 반지름 (a+b)/2</span>
                        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 transition-all duration-150" style={{ width: '100%' }} />
                        </div>
                        <span className="mono font-extrabold text-right text-sky-200">{geoSim.arith}</span>
                      </div>
                      <div className="grid grid-cols-[120px_1fr_64px] items-center gap-2">
                        <span className="font-bold text-amber-300">
                          <MathText text="기하 수선 √(ab)" />
                        </span>
                        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all duration-150"
                            style={{ width: `${Math.min(100, (geoSim.geom / (geoSim.arith || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="mono font-extrabold text-right text-amber-200">{geoSim.geom}</span>
                      </div>
                      <div className="grid grid-cols-[120px_1fr_64px] items-center gap-2">
                        <span className="font-bold text-emerald-300">조화 선분 2ab/(a+b)</span>
                        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400 transition-all duration-150"
                            style={{ width: `${Math.min(100, (geoSim.harm / (geoSim.arith || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="mono font-extrabold text-right text-emerald-200">{geoSim.harm}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50/80 border border-blue-200/80 px-3 py-2 text-xs text-slate-700 leading-relaxed">
                    <strong className="text-blue-900">원·반원 기하학적 원리:</strong> 직각삼각형 <span className="mono font-bold">△OPH</span>에서 빗변(반지름)의 길이는{' '}
                    <span className="mono font-bold text-blue-700">OP = (a+b)/2 = {geoSim.arith}</span>이고, 수선의 높이는{' '}
                    <span className="mono font-bold text-amber-700">
                      <MathText text={`PH = √(ab) = ${geoSim.geom}`} />
                    </span>
                    , 밑변은{' '}
                    <span className="mono font-bold">|a−b|/2 = {geoSim.centerOffset}</span>입니다. 직각삼각형의 빗변은 항상 높이보다 길거나 같으므로{' '}
                    <span className="mono font-extrabold text-slate-900">
                      <MathText text="(a+b)/2 ≥ √(ab)" />
                    </span>
                    가 성립합니다!
                  </div>
                </div>
              )}

              {/* PANEL 2: Square & Rectangle Area Comparison */}
              {(simViewMode === 'both' || simViewMode === 'area') && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
                        GEOMETRY 02 · 정사각형·직사각형 면적(넓이) 비교
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                        정사각형 넓이 ((a+b)/2)² vs 직사각형 넓이 ab &amp; 4분할 바람개비
                      </h4>
                    </div>
                    <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-extrabold text-indigo-800 mono">
                      넓이 차 = {geoSim.areaDiff}
                    </span>
                  </div>

                  {/* Area Comparison SVG: Left = Square ((a+b)/2)^2 vs Rectangle a*b, Right = Pinwheel (a+b)^2 = 4ab + (a-b)^2 */}
                  <div className="rounded-xl border border-slate-100 bg-slate-950 p-3 text-white">
                    {(() => {
                      const maxDim = Math.max(geoSim.a, geoSim.b, geoSim.arith, 1);
                      const boxScale = 86 / maxDim;
                      const sqSide = geoSim.arith * boxScale;
                      const rectW = geoSim.a * boxScale;
                      const rectH = geoSim.b * boxScale;

                      // Pinwheel square of side (a+b) scaled to 108px
                      const pinSize = 108;
                      const pinScale = pinSize / (geoSim.diameter || 1);
                      const pa = geoSim.a * pinScale;
                      const pb = geoSim.b * pinScale;
                      const holeSide = Math.abs(pa - pb);
                      const holeStart = Math.min(pa, pb);

                      return (
                        <svg
                          viewBox="0 0 380 185"
                          className="w-full h-auto max-h-[215px]"
                          role="img"
                          aria-label={`정사각형 넓이 ${geoSim.arithSquareArea}와 직사각형 넓이 ${geoSim.rectArea}를 비교하는 도형 시뮬레이션`}
                        >
                          {/* Left Side: Overlay comparison of Square ((a+b)/2)^2 and Rectangle a*b */}
                          <text x="95" y="16" fill="#93c5fd" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                            ① 둘레가 2(a+b)로 같은 정사각형 vs 직사각형
                          </text>

                          {/* Square of side (a+b)/2 */}
                          <rect
                            x={95 - sqSide / 2}
                            y={92 - sqSide / 2}
                            width={sqSide}
                            height={sqSide}
                            fill="rgba(59,130,246,0.22)"
                            stroke="#60a5fa"
                            strokeWidth="2"
                            strokeDasharray="4 2"
                          />
                          {/* Rectangle of width a and height b */}
                          <rect
                            x={95 - rectW / 2}
                            y={92 - rectH / 2}
                            width={rectW}
                            height={rectH}
                            fill="rgba(245,158,11,0.32)"
                            stroke="#fbbf24"
                            strokeWidth="2"
                          />

                          <text x="95" y="156" fill="#bfdbfe" fontSize="10" fontWeight="bold" textAnchor="middle">
                            파란 정사각형 넓이 = ((a+b)/2)² = {geoSim.arithSquareArea}
                          </text>
                          <text x="95" y="171" fill="#fde68a" fontSize="10" fontWeight="bold" textAnchor="middle">
                            주황 직사각형 넓이 = a×b = {geoSim.rectArea}
                          </text>

                          {/* Divider */}
                          <line x1="196" y1="12" x2="196" y2="174" stroke="rgba(148,163,184,0.2)" />

                          {/* Right Side: (a+b)^2 = 4ab + (a-b)^2 Pinwheel Square */}
                          <text x="290" y="16" fill="#c4b5fd" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                            ② (a+b)² = 4ab + (a−b)² 면적 분할
                          </text>

                          <g transform="translate(236, 28)">
                            {/* Outer Square (a+b)^2 */}
                            <rect
                              x={0}
                              y={0}
                              width={pinSize}
                              height={pinSize}
                              fill="rgba(30,41,59,0.9)"
                              stroke="#94a3b8"
                              strokeWidth="1.5"
                            />
                            {/* 4 Rectangles of a x b */}
                            {/* Top-Left: width pa, height pb */}
                            <rect x={0} y={0} width={pa} height={pb} fill="rgba(99,102,241,0.42)" stroke="#818cf8" strokeWidth="1.2" />
                            {/* Top-Right: width pb, height pa */}
                            <rect x={pa} y={0} width={pb} height={pa} fill="rgba(59,130,246,0.42)" stroke="#60a5fa" strokeWidth="1.2" />
                            {/* Bottom-Right: width pa, height pb */}
                            <rect x={pb} y={pa} width={pa} height={pb} fill="rgba(99,102,241,0.42)" stroke="#818cf8" strokeWidth="1.2" />
                            {/* Bottom-Left: width pb, height pa */}
                            <rect x={0} y={pb} width={pb} height={pa} fill="rgba(59,130,246,0.42)" stroke="#60a5fa" strokeWidth="1.2" />

                            {/* Center Hole Square (a-b)^2 */}
                            {holeSide > 0.5 && (
                              <rect
                                x={holeStart}
                                y={holeStart}
                                width={holeSide}
                                height={holeSide}
                                fill="rgba(244,63,94,0.45)"
                                stroke="#fb7185"
                                strokeWidth="1.8"
                              />
                            )}
                          </g>

                          <text x="290" y="156" fill="#a5b4fc" fontSize="10" fontWeight="bold" textAnchor="middle">
                            전체 (a+b)²={geoSim.bigSquareArea} / 4ab={geoSim.fourRectArea}
                          </text>
                          <text x="290" y="171" fill="#fda4af" fontSize="10" fontWeight="bold" textAnchor="middle">
                            가운데 빈틈 (a−b)² = {geoSim.innerHoleArea} {geoSim.isEqual ? '(빈틈 0!)' : '> 0'}
                          </text>
                        </svg>
                      );
                    })()}

                    {/* Area Comparison Bar Meters */}
                    <div className="mt-2 pt-2.5 border-t border-white/10 space-y-1.5 text-xs">
                      <div className="grid grid-cols-[135px_1fr_64px] items-center gap-2">
                        <span className="font-bold text-sky-300">정사각형 ((a+b)/2)²</span>
                        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 transition-all duration-150" style={{ width: '100%' }} />
                        </div>
                        <span className="mono font-extrabold text-right text-sky-200">{geoSim.arithSquareArea}</span>
                      </div>
                      <div className="grid grid-cols-[135px_1fr_64px] items-center gap-2">
                        <span className="font-bold text-amber-300">직사각형 넓이 a×b</span>
                        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all duration-150"
                            style={{ width: `${Math.min(100, (geoSim.rectArea / (geoSim.arithSquareArea || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="mono font-extrabold text-right text-amber-200">{geoSim.rectArea}</span>
                      </div>
                      <div className="grid grid-cols-[135px_1fr_64px] items-center gap-2">
                        <span className="font-bold text-rose-300">넓이 차 (a−b)²/4</span>
                        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-rose-400 transition-all duration-150"
                            style={{ width: `${Math.min(100, (geoSim.areaDiff / (geoSim.arithSquareArea || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="mono font-extrabold text-right text-rose-200">{geoSim.areaDiff}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-indigo-50/80 border border-indigo-200/80 px-3 py-2 text-xs text-slate-700 leading-relaxed">
                    <strong className="text-indigo-900">사각형 면적 원리:</strong> 한 변이 <span className="mono font-bold">(a+b)/2</span>인 정사각형의 넓이{' '}
                    <span className="mono font-bold text-blue-700">{geoSim.arithSquareArea}</span>는 가로 <span className="mono">a</span>, 세로 <span className="mono">b</span>인 직사각형의 넓이{' '}
                    <span className="mono font-bold text-amber-700">ab = {geoSim.rectArea}</span>보다 항상{' '}
                    <span className="mono font-bold text-rose-700">(a−b)²/4 = {geoSim.areaDiff}</span>만큼 크거나 같습니다. 양변에 루트를 씌우면{' '}
                    <span className="mono font-extrabold text-slate-900">
                      <MathText text="(a+b)/2 ≥ √(ab)" />
                    </span>
                    가 됩니다!
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Left: Collected Clues Table */}
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    수집한 양수 (a, b) 단서 기록표 (3개 이상 수집)
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    표의 행을 클릭하면 해당 (a, b) 값을 위 도형 시뮬레이터로 즉시 불러옵니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    현재 {state.examples.length}개 (권장 3개 이상)
                  </span>
                  {state.examples.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onRequestConfirm('단서 표 초기화', '입력한 양수 (a, b) 사례를 모두 지울까요?', () => {
                          onUpdate((prev) => ({ ...prev, examples: [] }));
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      초기화
                    </button>
                  )}
                </div>
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
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">반지름 (a+b)/2</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">
                        <MathText text="높이 √(ab)" />
                      </th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">조화 2ab/(a+b)</th>
                      <th className="py-2 px-2.5 text-center font-bold border-b border-slate-200">길이·면적 비교</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {state.examples.length > 0 ? (
                      state.examples.map((item) => {
                        const isSimSelected =
                          Math.abs(item.a - simA) < 1e-6 && Math.abs(item.b - simB) < 1e-6;
                        return (
                          <tr
                            key={`${item.a}-${item.b}`}
                            onClick={() => syncSimPair(item.a, item.b)}
                            className={`text-center cursor-pointer transition-colors ${
                              isSimSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                            }`}
                            title="클릭하여 도형 시뮬레이터에서 (a, b) 길이·넓이 확인"
                          >
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
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          위 도형 시뮬레이터의 추천 순서쌍 버튼을 눌러 (4, 4), (1, 9), (2, 8) 등을 실험해 보세요.
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
                  <MathText text="a > 0, b > 0일 때: (a + b) / 2 ≥ √(ab)   (단, 등호는 a = b일 때 성립)" />
                </div>
              </div>

              {showStep1Hint && state.step1HintLevel > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 space-y-2 text-xs sm:text-sm text-amber-950">
                  {STEP1_HINTS.slice(0, state.step1HintLevel).map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-extrabold text-amber-700 shrink-0">💡</span>
                      <span>
                        <MathText text={h} />
                      </span>
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
                <div className="text-xs font-bold text-slate-600 leading-relaxed">
                  <MathText text="Q. 부등식 (a + b)/2 ≥ √(ab)를 증명할 때 a = (√a)², b = (√b)²으로 바꾸어 완전제곱식 (√a − √b)²을 만들 수 있는 조건은?" />
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
                      className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold leading-relaxed transition-all ${
                        isSel
                          ? val === 'positive'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                            : 'border-rose-400 bg-rose-50 text-rose-950'
                          : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/70'
                      }`}
                    >
                      <MathText text={label} />
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
                    <span className="flex items-center gap-1.5 font-bold leading-relaxed">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        <MathText text="정확합니다! a > 0, b > 0 조건이 있어야 √a와 √b가 실수로 정의되며 (√a − √b)² ≥ 0이 성립합니다." />
                      </span>
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
              <span className="mono text-blue-700">
                <MathText text="(a + b) / 2 ≥ √(ab)" />
              </span>
              가 성립함을 증명하시오. (등호 성립 조건 포함)
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
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed">
                      <span className="mono text-blue-600 mr-1.5">Step 0{idx + 1}.</span>
                      <MathText text={item.q} />
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
                        <div key={hIdx} className="flex items-start gap-2 leading-relaxed">
                          <span className="font-bold text-amber-700 shrink-0">힌트 {hIdx + 1}:</span>
                          <span>
                            <MathText text={h} />
                          </span>
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
                          className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold leading-relaxed transition-all ${
                            isThisSelected
                              ? isCorrect
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                                : 'border-rose-400 bg-rose-50 text-rose-950'
                              : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/70'
                          }`}
                        >
                          <span className="mono mr-2 font-bold">({oIdx + 1})</span>
                          <MathText text={opt} />
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
              <span className="mono font-semibold">
                <MathText text="(a + b)/2 − √(ab) = (√a − √b)² / 2 ≥ 0" />
              </span>
              임을 보인 뒤 등호 성립 조건을 서술하세요.
            </p>
            <textarea
              id="l6-prob1-proof"
              rows={4}
              value={state.prob1ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob1ProofText: e.target.value }))}
              placeholder="a > 0, b > 0일 때 (a+b)/2 - √(ab) = (√a - √b)² / 2 ≥ 0이므로 (a+b)/2 ≥ √(ab)가 성립한다. 여기서 등호는 …일 때 성립한다."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <MathPreviewBox
              text={state.prob1ProofText}
              placeholder="a > 0, b > 0일 때 (a+b)/2 - √(ab) = (√a - √b)² / 2 ≥ 0이므로 (a+b)/2 ≥ √(ab)가 성립한다. 여기서 등호는 …일 때 성립한다."
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
              <span className="mono">
                <MathText text="√(ab) ≥ 2ab / (a + b)" />
              </span>
            </h3>
            <p className="mt-1.5 text-sm sm:text-base text-slate-700 leading-relaxed">
              [문제 1]에서 증명한 산술·기하평균의 관계{' '}
              <span className="mono font-bold">
                <MathText text="(A + B)/2 ≥ √(AB)" />
              </span>{' '}
              (또는{' '}
              <span className="mono font-bold">
                <MathText text="A + B ≥ 2√(AB)" />
              </span>
              )를 이용하면 역수의 합과 조화평균 부등식도 손쉽게 증명할 수 있습니다.
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
                    <MathText text="a + 1/a ≥ 2√(a × 1/a) = 2√1 = 2" />
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="mono font-bold">a &gt; 0</span>이면 <span className="mono font-bold">1/a &gt; 0</span>이므로 산술·기하평균을 적용하면 근호 안의 곱이 <strong>1로 약분</strong>됩니다. 등호는 <span className="mono font-bold">a = 1/a</span>이고 <span className="mono font-bold">a &gt; 0</span>이므로 <strong>a = 1</strong>일 때 성립합니다.
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-1.5">
                  <div className="text-xs font-extrabold text-indigo-700">
                    <MathText text="열쇠 2 — 기하평균과 조화평균: √(ab) ≥ 2ab / (a + b)" />
                  </div>
                  <div className="mono text-sm font-bold text-slate-900">
                    <MathText text="√(ab) − 2ab/(a+b) = √(ab)(√a − √b)² / (a + b) ≥ 0" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    통분하여 완전제곱식으로 묶거나,{' '}
                    <span className="mono font-bold">
                      <MathText text="(a + b)/2 ≥ √(ab)" />
                    </span>
                    의 양변에 양수{' '}
                    <span className="mono font-bold">
                      <MathText text="2√(ab)/(a + b)" />
                    </span>
                    를 곱하여 증명할 수 있습니다. 등호는 <strong>a = b</strong>일 때 성립합니다.
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
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="font-extrabold text-amber-700 shrink-0">💡</span>
                      <span>
                        <MathText text={h} />
                      </span>
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
                  className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold leading-relaxed transition-all ${
                    state.harmonicChecked
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/70'
                  }`}
                >
                  <MathText text="✓ (a + b)/2 ≥ √(ab) ≥ 2ab/(a + b) 이며, 등호는 모두 a = b일 때 성립한다. (확인 클릭)" />
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
                <MathPreviewBox text={state.harmonicReason} />
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
                <MathText text="(2) √(ab) ≥ 2ab / (a + b)" />
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
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed">
                      <span className="mono text-indigo-600 mr-1.5">Step 0{idx + 1}.</span>
                      <MathText text={item.q} />
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
                        <div key={hIdx} className="flex items-start gap-2 leading-relaxed">
                          <span className="font-bold text-amber-700 shrink-0">힌트 {hIdx + 1}:</span>
                          <span>
                            <MathText text={h} />
                          </span>
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
                          className={`w-full rounded-xl border p-3 text-left text-xs sm:text-sm font-semibold leading-relaxed transition-all ${
                            isThisSelected
                              ? isCorrect
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                                : 'border-rose-400 bg-rose-50 text-rose-950'
                              : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/70'
                          }`}
                        >
                          <span className="mono mr-2 font-bold">({oIdx + 1})</span>
                          <MathText text={opt} />
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
              (1) <span className="mono">a + 1/a ≥ 2</span>와 (2){' '}
              <span className="mono">
                <MathText text="√(ab) ≥ 2ab / (a + b)" />
              </span>
              의 증명 과정과 각각의 등호 성립 조건을 서술하세요.
            </p>
            <textarea
              id="l6-prob2-proof"
              rows={4}
              value={state.prob2ProofText}
              onChange={(e) => onUpdate((prev) => ({ ...prev, prob2ProofText: e.target.value }))}
              placeholder="(1) a > 0이면 1/a > 0이므로 산술·기하평균에 의해 a + 1/a ≥ 2√(a · 1/a) = 2이고 등호는 a=1일 때 성립한다. (2) √(ab) - 2ab/(a+b) = … ≥ 0이므로 성립하며 등호는 a=b일 때 성립한다."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <MathPreviewBox
              text={state.prob2ProofText}
              placeholder="(1) a > 0이면 1/a > 0이므로 산술·기하평균에 의해 a + 1/a ≥ 2√(a · 1/a) = 2이고 등호는 a=1일 때 성립한다. (2) √(ab) - 2ab/(a+b) = … ≥ 0이므로 성립하며 등호는 a=b일 때 성립한다."
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
              {(
                [
                  ['1단계: 양수 (a, b) 대입 실험 3개 이상 & 양수 조건 확인', rubric[0]],
                  ['2단계: [문제 1] ((a+b)/2 ≥ √(ab)) 4단계 추론 & 증명 보고서 작성', rubric[1]],
                  ['3단계: 역수의 합 & 조화평균 원리 탐색 및 서술', rubric[2]],
                  ['4단계: [문제 2] (1)·(2) 4단계 추론 & 증명 보고서 작성', rubric[3]],
                  ['5단계: 절대부등식2 탐구 성찰 작성', done[4]],
                ] as const
              ).map(([label, ok], idx) => (
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
                  <span>
                    <MathText text={label} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label htmlFor="l6-ref1" className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                  <MathText text="성찰 1. 산술평균과 기하평균의 관계 (a + b)/2 ≥ √(ab)를 적용할 때 왜 반드시 두 수가 양수(a > 0, b > 0)인지 먼저 확인해야 하나요?" />
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
              <MathPreviewBox
                text={state.reflection1}
                placeholder="양수 조건이 있어야 √a와 √b가 실수로 존재하고, a = (√a)², b = (√b)²으로 바꾸어 완전제곱식 …을 만들 수 있기 때문이다."
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
              <MathPreviewBox text={state.reflection2} />
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
