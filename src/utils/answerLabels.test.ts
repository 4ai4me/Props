import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { LESSON_ANSWER_CONFIG } from './answerLabels';
import { LESSON_KEYS } from './lessonMerge';

// 학생 답안이 아닌 화면 진행용 기록 (힌트 열람 횟수 등) — 표시 대상 아님
const BOOKKEEPING = /(Hints?|HintLevel|hintLevel)$/;

const here = dirname(fileURLToPath(import.meta.url));
const mathSource = readFileSync(join(here, 'mathLogic.ts'), 'utf8');

function lessonStateFields(n: number): string[] {
  const m = mathSource.match(new RegExp(`export interface Lesson${n}State \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(m, `Lesson${n}State 정의를 찾을 수 있어야 함`);
  return Array.from(m[1].matchAll(/^\s*(\w+)\??:/gm), (x) => x[1]);
}

test('모든 차시의 모든 학생 입력 필드가 [전체 답안 보기] 이름표 또는 숨김 목록에 들어 있다', () => {
  LESSON_KEYS.forEach((k, i) => {
    const config = LESSON_ANSWER_CONFIG[k];
    const labeled = new Set(config.groups.flatMap((g) => g.fields.map((f) => f.key)));
    const hidden = new Set(config.hidden ?? []);
    const missing = lessonStateFields(i + 1).filter(
      (f) => !labeled.has(f) && !hidden.has(f) && !BOOKKEEPING.test(f)
    );
    assert.deepEqual(missing, [], `${k}: 이름표가 없는 필드 → ${missing.join(', ')}`);
  });
});

test('이름표에 적은 필드는 실제로 존재하는 필드다 (오타 방지)', () => {
  LESSON_KEYS.forEach((k, i) => {
    const fields = new Set(lessonStateFields(i + 1));
    const config = LESSON_ANSWER_CONFIG[k];
    const unknown = [
      ...config.groups.flatMap((g) => g.fields.map((f) => f.key)),
      ...(config.hidden ?? []),
    ].filter((key) => !fields.has(key));
    assert.deepEqual(unknown, [], `${k}: 존재하지 않는 필드 → ${unknown.join(', ')}`);
  });
});

test('같은 필드가 이름표와 숨김 목록에 동시에 들어 있지 않다', () => {
  for (const k of LESSON_KEYS) {
    const config = LESSON_ANSWER_CONFIG[k];
    const labeled = new Set(config.groups.flatMap((g) => g.fields.map((f) => f.key)));
    const both = (config.hidden ?? []).filter((h) => labeled.has(h));
    assert.deepEqual(both, [], `${k}: 중복 → ${both.join(', ')}`);
  }
});
