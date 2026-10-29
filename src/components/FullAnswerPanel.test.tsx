import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FullAnswerPanel } from './FullAnswerPanel';
import { createInitialStudentState } from '../utils/mathLogic';
import { LESSON_ANSWER_CONFIG } from '../utils/answerLabels';

function render(record: ReturnType<typeof createInitialStudentState>) {
  return renderToStaticMarkup(<FullAnswerPanel record={record} initiallyOpen />);
}

test('빈 활동지: 모든 차시 제목이 보이고, 빈 문항은 빨간 미작성으로 표시된다', () => {
  const html = render(createInitialStudentState());
  for (const cfg of Object.values(LESSON_ANSWER_CONFIG)) {
    assert.ok(html.includes(cfg.title), `차시 제목 표시: ${cfg.title}`);
  }
  assert.ok(html.includes('font-bold text-rose-600">미작성<'), '미작성이 강조 색으로 표시됨');
});

test('입력한 답안은 문항 이름과 함께 표시되고, 작성 현황이 갱신된다', () => {
  const r = createInitialStudentState();
  const l1 = r.l1 as unknown as Record<string, unknown>;
  const l2 = r.l2 as unknown as Record<string, unknown>;
  const firstText = LESSON_ANSWER_CONFIG.l1.groups
    .flatMap((g) => g.fields)
    .find((f) => !f.format || f.format.kind === 'text')!;
  l1[firstText.key] = '학생이 쓴 고유한 답안 문장';
  l2.reflection = '성찰 답안';
  const html = render(r);
  assert.ok(html.includes(firstText.label), '문항 이름 표시');
  assert.ok(html.includes('학생이 쓴 고유한 답안 문장'), '답안 내용 표시');
  assert.ok(html.includes('성찰 답안'));
});

test('이름표가 없는 새 필드에 값이 있으면 기타 기록으로 표시된다 (누락 방지)', () => {
  const r = createInitialStudentState();
  (r.l3 as unknown as Record<string, unknown>).brandNewField = '새 문항 답';
  const html = render(r);
  assert.ok(html.includes('기타 기록'));
  assert.ok(html.includes('brandNewField'));
  assert.ok(html.includes('새 문항 답'));
});

test('힌트 열람 횟수 같은 진행 기록은 표시하지 않는다', () => {
  const html = render(createInitialStudentState());
  assert.ok(!/>prob1Hints</.test(html));
  assert.ok(!/>step1HintLevel</.test(html));
});
