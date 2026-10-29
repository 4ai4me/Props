import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { StudentRecord } from '../utils/mathLogic';
import { LESSON_KEYS, LessonKey } from '../utils/lessonMerge';
import { LESSON_ANSWER_CONFIG } from '../utils/answerLabels';
import type { AnswerField, AnswerFormat } from '../utils/answerLabels';
import { AnswerText, UnwrittenMark } from './AnswerText';

/**
 * 교사 '상세 비교 · 평가' 화면의 [전체 답안 보기].
 * 학생이 각 차시에서 입력한 모든 항목을 문항 이름과 함께 보여줍니다.
 * - 문항 이름은 src/utils/answerLabels.ts 에서 관리합니다.
 * - 이름표가 없는 항목이라도 학생이 입력한 값이 있으면 '기타 기록'에 그대로 표시합니다 (누락 방지).
 * - 비어 있는 항목은 빨간 '미작성'으로 표시합니다.
 */

/** 학생 답안이 아닌 화면 진행용 기록 (힌트 열람 횟수 등) — 표시하지 않음 */
const BOOKKEEPING_PATTERN = /(Hints?|HintLevel|hintLevel)$/;

export function isEmptyAnswer(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0 || value.every((v) => isEmptyAnswer(v));
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

/** 이름표가 없지만 학생이 입력한 값이 있는 항목 (누락 방지용) */
export function findUnlabeledFields(lesson: LessonKey, lessonData: unknown): string[] {
  const config = LESSON_ANSWER_CONFIG[lesson];
  if (!lessonData || typeof lessonData !== 'object') return [];
  const labeled = new Set<string>(config.groups.flatMap((g) => g.fields.map((f) => f.key)));
  const hidden = new Set<string>(config.hidden ?? []);
  return Object.keys(lessonData as Record<string, unknown>).filter(
    (key) =>
      !labeled.has(key) &&
      !hidden.has(key) &&
      !BOOKKEEPING_PATTERN.test(key) &&
      typeof (lessonData as Record<string, unknown>)[key] !== 'boolean' &&
      !isEmptyAnswer((lessonData as Record<string, unknown>)[key])
  );
}

function CheckBadge({ value }: { value: unknown }) {
  return value === true ? (
    <span className="font-bold text-emerald-700">✓ 확인 완료</span>
  ) : (
    <span className="font-bold text-slate-500">미확인</span>
  );
}

function renderScalar(v: unknown): string {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'boolean') return v ? 'O' : 'X';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function AnswerValue({ value, format }: { value: unknown; format?: AnswerFormat }) {
  const kind = format?.kind ?? 'text';

  if (kind === 'check') return <CheckBadge value={value} />;

  if (kind === 'checks') {
    const arr = Array.isArray(value) ? value : [];
    if (arr.length === 0) return <span className="font-bold text-slate-500">미확인</span>;
    const done = arr.filter(Boolean).length;
    return (
      <span className={done === arr.length ? 'font-bold text-emerald-700' : 'font-bold text-slate-600'}>
        {done}/{arr.length} 단계 확인
      </span>
    );
  }

  if (isEmptyAnswer(value)) return <UnwrittenMark />;

  switch (kind) {
    case 'yesno': {
      const yes = format && 'yes' in format && format.yes ? format.yes : '예 (O)';
      const no = format && 'no' in format && format.no ? format.no : '아니오 (X)';
      return <span className="font-semibold">{value === 'yes' ? yes : value === 'no' ? no : String(value)}</span>;
    }
    case 'choice': {
      const options = format && 'options' in format ? format.options : {};
      const key = String(value);
      return <span className="font-semibold">{options[key] ?? key}</span>;
    }
    case 'choices': {
      const arr = Array.isArray(value) ? value : [];
      return (
        <span>
          {/* 저장된 선택값을 그대로 표시 (보기 번호 체계를 추측해 바꾸지 않음) */}
          {arr.map((v, i) => `${i + 1}단계: ${v === null || v === undefined ? '-' : String(v)}`).join(' · ')}
        </span>
      );
    }
    case 'points': {
      const arr = Array.isArray(value) ? value : [];
      return (
        <span>
          {arr
            .map((p) => {
              const o = p as { x?: unknown; y?: unknown };
              return `(${renderScalar(o?.x)}, ${renderScalar(o?.y)})`;
            })
            .join(', ')}
        </span>
      );
    }
    case 'map': {
      const entries = Object.entries(value as Record<string, unknown>);
      const valueLabels = format && 'valueLabels' in format ? format.valueLabels ?? {} : {};
      return (
        <ul className="space-y-0.5">
          {entries.map(([k, v]) => (
            <li key={k}>
              {k} → <strong>{valueLabels[String(v)] ?? renderScalar(v)}</strong>
            </li>
          ))}
        </ul>
      );
    }
    case 'list': {
      const arr = Array.isArray(value) ? value : [];
      const itemLabel = format && 'itemLabel' in format ? format.itemLabel : '';
      return (
        <ul className="space-y-0.5">
          {arr.map((v, i) => (
            <li key={i}>
              {itemLabel ? `${itemLabel} ${i + 1}: ` : `${i + 1}. `}
              {isEmptyAnswer(v) ? <UnwrittenMark /> : <strong>{renderScalar(v)}</strong>}
            </li>
          ))}
        </ul>
      );
    }
    case 'table': {
      const rows = (Array.isArray(value) ? value : [value]) as Record<string, unknown>[];
      const columns = format && 'columns' in format && format.columns ? format.columns : undefined;
      const keys = columns
        ? Object.keys(columns)
        : Array.from(new Set(rows.flatMap((r) => (r && typeof r === 'object' ? Object.keys(r) : []))));
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[11px] sm:text-xs">
            <thead>
              <tr>
                {keys.map((k) => (
                  <th key={k} className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-bold text-slate-600">
                    {columns?.[k] ?? k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {keys.map((k) => (
                    <td key={k} className="border border-slate-200 px-2 py-1">
                      {renderScalar(r?.[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'json':
      return <code className="break-all text-[11px]">{JSON.stringify(value)}</code>;
    default:
      if (typeof value === 'object') return <code className="break-all text-[11px]">{JSON.stringify(value)}</code>;
      return <AnswerText value={value} math />;
  }
}

function FieldRow({ field, value }: { field: AnswerField; value: unknown }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-3 border-b border-slate-100 py-1.5 last:border-b-0">
      <div className="text-[11px] sm:text-xs font-bold text-slate-600">{field.label}</div>
      <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap break-words">
        <AnswerValue value={value} format={field.format} />
      </div>
    </div>
  );
}

function LessonSection({
  lesson,
  record,
  initiallyOpen = false,
}: {
  lesson: LessonKey;
  record: StudentRecord;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const config = LESSON_ANSWER_CONFIG[lesson];
  const data = (record[lesson] ?? {}) as unknown as Record<string, unknown>;
  const unlabeled = findUnlabeledFields(lesson, data);

  // 작성 현황: 체크 항목을 제외한 답안 항목 중 입력된 것의 수
  const answerFields = config.groups
    .flatMap((g) => g.fields)
    .filter((f) => f.format?.kind !== 'check' && f.format?.kind !== 'checks');
  const filled = answerFields.filter((f) => !isEmptyAnswer(data[f.key])).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-800">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {config.title}
        </span>
        <span
          className={`text-[11px] font-bold ${
            filled === 0 ? 'text-rose-600' : filled === answerFields.length ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          작성 {filled}/{answerFields.length}
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 px-3 py-2">
          {config.groups.map((group) => (
            <div key={group.title}>
              <div className="mb-1 text-[11px] sm:text-xs font-extrabold text-blue-700">{group.title}</div>
              {group.fields.map((field) => (
                <FieldRow key={field.key} field={field} value={data[field.key]} />
              ))}
            </div>
          ))}
          {unlabeled.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] sm:text-xs font-extrabold text-slate-500">기타 기록</div>
              {unlabeled.map((key) => (
                <FieldRow key={key} field={{ key, label: key }} value={data[key]} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** initiallyOpen: 모든 차시를 펼친 상태로 시작 (테스트·인쇄용, 기본은 접힘) */
export function FullAnswerPanel({ record, initiallyOpen = false }: { record: StudentRecord; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-3 sm:p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-sm sm:text-base font-extrabold text-slate-900">
          전체 답안 보기 <span className="text-xs font-bold text-slate-500">(학생이 입력한 모든 문항)</span>
        </span>
        {open ? <ChevronDown className="h-5 w-5 text-slate-500" /> : <ChevronRight className="h-5 w-5 text-slate-500" />}
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-slate-500">
            차시를 눌러 펼쳐 보세요. 비어 있는 문항은 <UnwrittenMark />으로 표시됩니다.
          </p>
          {LESSON_KEYS.map((k) => (
            <LessonSection key={k} lesson={k} record={record} initiallyOpen={initiallyOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
