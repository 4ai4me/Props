import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mod,
  safeN,
  calc1,
  checkScope,
  calc2,
  calc3Parity,
  calc3Mod3,
  gcd,
  calc4Coprime,
  calc5Inequality,
  calc6Means,
  calc6GeometrySimulation,
  calc7Abs,
  applyMathSymbolInsertion,
  convertMathShorthand,
  tokenizeMathRadicals,
  LESSON_RECOMMENDED_SYMBOLS,
  MATH_SYMBOL_CATEGORIES,
  PROOF3_PROB1_STEPS,
  PROOF3_PROB2_STEPS,
  PROOF4_PROB1_STEPS,
  PROOF4_PROB2_STEPS,
  PROOF5_PROB1_STEPS,
  PROOF5_PROB2_STEPS,
  PROOF6_PROB1_STEPS,
  PROOF6_PROB2_STEPS,
  PROOF7_PROB1_STEPS,
  PROOF7_PROB2_STEPS,
  validateClaim1,
  cleanStudentState,
  createInitialStudentState,
  mergeStudentStates,
  csvSafe,
  evaluateLevel1Completion,
  evaluateLevel2Completion,
  evaluateLevel3Completion,
  evaluateLevel4Completion,
  evaluateLevel5Completion,
  evaluateLevel6Completion,
  evaluateLevel7Completion,
  hasTeacherEvaluation,
  getTeacherEvalAverage,
  getTeacherEvaluationProgress,
  getClassEvaluationSummary,
  ensureTeacherEval,
  createSampleTeacherDataset,
  EVAL_CRITERIA,
  EVAL_SCORE_LABELS,
  CLASSROOM_BRAND_NAME,
} from './mathLogic.ts';

test('mod handles positive and negative integers properly', () => {
  assert.equal(mod(9, 8), 1);
  assert.equal(mod(-3 * -3, 8), 1);
  assert.equal(mod(-7, 8), 1);
  assert.equal(mod(9, 16), 9);
});

test('safeN validates integer bounds [-10000, 10000]', () => {
  assert.equal(safeN('3'), 3);
  assert.equal(safeN('-21'), -21);
  assert.equal(safeN(10000), 10000);
  assert.equal(safeN(10001), null);
  assert.equal(safeN(-10001), null);
  assert.equal(safeN(''), null);
  assert.equal(safeN('3.5'), null);
  assert.equal(safeN('abc'), null);
});

test('calc1 calculates odd square modulo 8 and checks oddness', () => {
  const oddCase = calc1(-3);
  assert.equal(oddCase.n, -3);
  assert.equal(oddCase.sq, 9);
  assert.equal(oddCase.r, 1);
  assert.equal(oddCase.valid, true);

  const evenCase = calc1(4);
  assert.equal(evenCase.valid, false);
  assert.equal(evenCase.r, 0);
});

test('calc2 identifies counterexamples for Topic A and valid proofs for Topic B/C', () => {
  // Topic A: n^2 mod 16 === 1 for odd n
  const a1 = calc2('a', 1);
  assert.ok(a1);
  assert.equal(a1.valid, true);
  assert.equal(a1.r, 1);
  assert.equal(a1.isCounter, false);

  const a3 = calc2('a', 3);
  assert.ok(a3);
  assert.equal(a3.valid, true);
  assert.equal(a3.r, 9);
  assert.equal(a3.isCounter, true);

  const aEven = calc2('a', 2);
  assert.ok(aEven);
  assert.equal(aEven.valid, false);
  assert.equal(aEven.isCounter, false);

  // Topic B: n(n+2) mod 8 === 0 for even n
  const b2 = calc2('b', 2);
  assert.ok(b2);
  assert.equal(b2.valid, true);
  assert.equal(b2.product, 8);
  assert.equal(b2.r, 0);
  assert.equal(b2.isCounter, false);

  // Topic C: n(n+1)(n+2) mod 6 === 0 for all integers n
  const cNeg = calc2('c', -4);
  assert.ok(cNeg);
  assert.equal(cNeg.valid, true);
  assert.equal(cNeg.r, 0);
  assert.equal(cNeg.isCounter, false);
});

test('calc3Parity and calc3Mod3 compute contrapositive clues accurately', () => {
  const p3 = calc3Parity(3);
  assert.equal(p3.sq, 9);
  assert.equal(p3.nIsOdd, true);
  assert.equal(p3.sqIsOdd, true);

  const p4 = calc3Parity(4);
  assert.equal(p4.sq, 16);
  assert.equal(p4.nIsOdd, false);
  assert.equal(p4.sqIsOdd, false);

  const m1 = calc3Mod3(4); // 4 = 3*2 - 2 (rem 1), 16 = 3*5 + 1 (rem 1)
  assert.equal(m1.nRem3, 1);
  assert.equal(m1.sqRem3, 1);

  const m2 = calc3Mod3(5); // 5 = 3*2 - 1 (rem 2), 25 = 3*8 + 1 (rem 1)
  assert.equal(m2.nRem3, 2);
  assert.equal(m2.sqRem3, 1);

  const m0 = calc3Mod3(6);
  assert.equal(m0.nRem3, 0);
  assert.equal(m0.sqRem3, 0);
});

test('gcd and calc4Coprime verify coprime fractions and n^2 != 2m^2', () => {
  assert.equal(gcd(5, 7), 1);
  assert.equal(gcd(4, 6), 2);

  const f1 = calc4Coprime(5, 7); // 7/5 = 1.4, n^2=49, 2m^2=50, diff=-1
  assert.equal(f1.coprime, true);
  assert.equal(f1.nSq, 49);
  assert.equal(f1.mSq2, 50);
  assert.equal(f1.diff, -1);
  assert.notEqual(f1.diff, 0);
});

test('calc5Inequality, calc6Means, and calc7Abs compute absolute inequality clues accurately', () => {
  // Lesson 5: a^2 + b^2 >= ab
  const c5Zero = calc5Inequality(0, 0);
  assert.equal(c5Zero.lhs, 0);
  assert.equal(c5Zero.rhs, 0);
  assert.equal(c5Zero.diff, 0);
  assert.equal(c5Zero.isEqual, true);

  const c5NonZero = calc5Inequality(2, 2);
  assert.equal(c5NonZero.lhs, 8);
  assert.equal(c5NonZero.rhs, 4);
  assert.equal(c5NonZero.diff, 4);
  assert.equal(c5NonZero.isEqual, false);

  // Lesson 6: (a+b)/2 >= sqrt(ab) >= 2ab/(a+b)
  const c6Eq = calc6Means(4, 4);
  assert.equal(c6Eq.arith, 4);
  assert.equal(c6Eq.geom, 4);
  assert.equal(c6Eq.harm, 4);
  assert.equal(c6Eq.isEqual, true);

  const c6Diff = calc6Means(1, 9);
  assert.equal(c6Diff.arith, 5);
  assert.equal(c6Diff.geom, 3);
  assert.equal(c6Diff.harm, 1.8);
  assert.equal(c6Diff.diff, 2);
  assert.equal(c6Diff.isEqual, false);

  // Lesson 7: |a+b| <= |a| + |b|
  const c7Same = calc7Abs(2, 3);
  assert.equal(c7Same.lhsSum, 5);
  assert.equal(c7Same.rhsSum, 5);
  assert.equal(c7Same.diffSq, 0);
  assert.equal(c7Same.sameSign, true);

  const c7Opp = calc7Abs(2, -3);
  assert.equal(c7Opp.lhsSum, 1);
  assert.equal(c7Opp.rhsSum, 5);
  assert.equal(c7Opp.diffSq, 24);
  assert.equal(c7Opp.sameSign, false);
});

test('PROOF3 through PROOF7 step definitions have 4 steps and 3 hints each', () => {
  for (const steps of [
    PROOF3_PROB1_STEPS,
    PROOF3_PROB2_STEPS,
    PROOF4_PROB1_STEPS,
    PROOF4_PROB2_STEPS,
    PROOF5_PROB1_STEPS,
    PROOF5_PROB2_STEPS,
    PROOF6_PROB1_STEPS,
    PROOF6_PROB2_STEPS,
    PROOF7_PROB1_STEPS,
    PROOF7_PROB2_STEPS,
  ]) {
    assert.equal(steps.length, 4);
    for (const s of steps) {
      assert.equal(s.opts.length, 3);
      assert.equal(s.hints.length, 3);
      assert.ok(s.answer >= 0 && s.answer < s.opts.length);
    }
  }
});

test('validateClaim1 checks scope and required keywords', () => {
  assert.equal(validateClaim1('', '모든 홀수 n에 대하여 제곱을 8로 나눈 나머지는 1이다.').ok, false);
  assert.equal(validateClaim1('some', '모든 홀수 n에 대하여 제곱을 8로 나눈 나머지는 1이다.').ok, false);
  assert.equal(validateClaim1('all', '짧은 문장').ok, false);
  assert.equal(validateClaim1('all', '모든 수를 곱하면 항상 나머지가 1이 나온다.').ok, false);
  assert.equal(validateClaim1('all', '모든 홀수 n에 대하여 제곱을 8로 나눈 나머지는 1이다.').ok, true);
});

test('cleanStudentState preserves backward compatibility with legacy JSON and hydrates l3..l7', () => {
  const initial = createInitialStudentState();
  initial.group = '1학년 3반';
  initial.code = '10315';
  const legacyRaw = {
    kind: 'proof2lesson-v1',
    group: '1학년 3반',
    code: '10315',
    createdAt: initial.createdAt,
    updatedAt: initial.updatedAt,
    l1: initial.l1,
    l2: initial.l2,
    // l3, l4, l5, l6, l7 intentionally omitted to simulate legacy saved state
  };
  const cleaned = cleanStudentState(legacyRaw);
  assert.equal(cleaned.kind, 'proof2lesson-v1');
  assert.equal(cleaned.group, '1학년 3반');
  assert.equal(cleaned.code, '10315');
  assert.equal(cleaned.l3.prob1Choices.length, 4);
  assert.equal(cleaned.l4.prob1Choices.length, 4);
  assert.equal(cleaned.l5.prob1Choices.length, 4);
  assert.equal(cleaned.l6.prob1Choices.length, 4);
  assert.equal(cleaned.l7.prob1Choices.length, 4);

  assert.throws(() => cleanStudentState({ kind: 'wrong-kind' }));
});

test('csvSafe prevents formula injection and escapes quotes', () => {
  assert.equal(csvSafe('=SUM(A1:A2)'), '"\'=SUM(A1:A2)"');
  assert.equal(csvSafe('학생 "탐정" 기록'), '"학생 ""탐정"" 기록"');
});

test('evaluateLevel1..7Completion track progress accurately', () => {
  const s = createInitialStudentState();
  assert.deepEqual(evaluateLevel1Completion(s.l1), [false, false, false, false, false]);
  s.l1.examples = [calc1(-3), calc1(1), calc1(3), calc1(5)];
  assert.equal(evaluateLevel1Completion(s.l1)[0], true);

  s.l2.topic = 'a';
  assert.equal(evaluateLevel2Completion(s.l2)[0], true);

  assert.deepEqual(evaluateLevel3Completion(s.l3), [false, false, false, false, false]);
  s.l3.parityExamples = [calc3Parity(1), calc3Parity(2), calc3Parity(3)];
  s.l3.contrapositiveChoice = 'contrapositive';
  assert.equal(evaluateLevel3Completion(s.l3)[0], true);

  assert.deepEqual(evaluateLevel4Completion(s.l4), [false, false, false, false, false]);
  s.l4.fractionExamples = [calc4Coprime(1, 1), calc4Coprime(2, 3), calc4Coprime(5, 7)];
  s.l4.contradictionConceptChecked = true;
  assert.equal(evaluateLevel4Completion(s.l4)[0], true);

  assert.deepEqual(evaluateLevel5Completion(s.l5), [false, false, false, false, false]);
  s.l5.examples = [calc5Inequality(0, 0), calc5Inequality(1, 2), calc5Inequality(-1, 1)];
  s.l5.squareConceptChoice = 'nonnegative';
  assert.equal(evaluateLevel5Completion(s.l5)[0], true);

  assert.deepEqual(evaluateLevel6Completion(s.l6), [false, false, false, false, false]);
  s.l6.examples = [calc6Means(4, 4), calc6Means(1, 9), calc6Means(2, 8)];
  s.l6.amgmConceptChoice = 'positive';
  assert.equal(evaluateLevel6Completion(s.l6)[0], true);

  assert.deepEqual(evaluateLevel7Completion(s.l7), [false, false, false, false, false]);
  s.l7.examples = [calc7Abs(2, 3), calc7Abs(2, -3), calc7Abs(-2, -3)];
  s.l7.absSquareConceptChoice = 'square_diff';
  assert.equal(evaluateLevel7Completion(s.l7)[0], true);
});

test('hasTeacherEvaluation and getTeacherEvalAverage evaluate teacher scoring accurately', () => {
  const s = createInitialStudentState();
  assert.equal(hasTeacherEvaluation(s), false);
  assert.equal(getTeacherEvalAverage(s.evaluation?.scores), null);

  // When scores are set
  s.evaluation = {
    scores: [3, 2, 3, null],
    feedback: '논증 전개가 우수합니다.',
    nextStep: '문자로 일반화해 보세요.',
  };
  assert.equal(hasTeacherEvaluation(s), true);
  // (3 + 2 + 3) / 3 = 2.66666...
  const avg = getTeacherEvalAverage(s.evaluation.scores);
  assert.ok(avg !== null);
  assert.ok(Math.abs(avg - 8 / 3) < 0.001);

  // When only memo is set
  const sMemo = createInitialStudentState();
  sMemo.teacherMemo = '꾸준히 발전 중임';
  assert.equal(hasTeacherEvaluation(sMemo), true);

  // Score label dictionary
  assert.equal(EVAL_SCORE_LABELS[3], '3점 · 충분한 수행');
  assert.equal(EVAL_SCORE_LABELS[0], '0점 · 증거 부족');
  assert.equal(CLASSROOM_BRAND_NAME, '이하연 수학 교실');
});

test('getTeacherEvaluationProgress and getClassEvaluationSummary calculate per-student and class progress accurately across 7 lessons', () => {
  assert.equal(EVAL_CRITERIA.length, 7);

  const sNone = createInitialStudentState();
  const pNone = getTeacherEvaluationProgress(sNone);
  assert.equal(pNone.status, 'none');
  assert.equal(pNone.percent, 0);
  assert.equal(pNone.completedCount, 0);
  assert.equal(pNone.totalCount, 8); // 7 rubric items + 1 feedback
  assert.equal(pNone.statusLabel, '미평가');
  assert.equal(pNone.isReopenedByLessonExpansion, false);

  const sPartial = createInitialStudentState();
  sPartial.evaluation = {
    scores: [3, 2, null, null, null, null, null],
    feedback: '규칙 발견이 뛰어납니다.',
    nextStep: '',
  };
  const pPartial = getTeacherEvaluationProgress(sPartial);
  assert.equal(pPartial.status, 'partial');
  assert.equal(pPartial.completedCount, 3); // 2 scores + 1 feedback = 3/8 = 38%
  assert.equal(pPartial.totalCount, 8);
  assert.equal(pPartial.percent, 38);
  assert.equal(pPartial.statusLabel, '평가 진행 중');
  assert.equal(pPartial.isReopenedByLessonExpansion, false);

  const sComplete = createInitialStudentState();
  sComplete.evaluation = {
    scores: [3, 3, 2, 3, 3, 3, 3],
    feedback: '1~7차시 모든 증명을 성실히 완수했습니다.',
    nextStep: '심화 문제를 탐구해 보세요.',
    evaluatedLessonCount: 7,
  };
  const pComplete = getTeacherEvaluationProgress(sComplete);
  assert.equal(pComplete.status, 'complete');
  assert.equal(pComplete.completedCount, 8);
  assert.equal(pComplete.totalCount, 8);
  assert.equal(pComplete.percent, 100);
  assert.equal(pComplete.statusLabel, '평가 완료');
  assert.equal(pComplete.isReopenedByLessonExpansion, false);

  const summary = getClassEvaluationSummary([sNone, sPartial, sComplete]);
  assert.equal(summary.totalStudents, 3);
  assert.equal(summary.completeCount, 1);
  assert.equal(summary.partialCount, 1);
  assert.equal(summary.noneCount, 1);
  assert.equal(summary.evaluatedAnyCount, 2);
  assert.equal(summary.completionRatePercent, 33); // 1/3 -> 33%
  assert.equal(summary.averageProgressPercent, 46); // (0 + 38 + 100) / 3 = 46%
});

test('when lessons are added, previously completed evaluations revoke complete status and transition to partial (in-progress) while preserving existing scores', () => {
  // Case 1: A student whose evaluation was completed when only 1~4차시 existed (4 scores + feedback)
  const legacyCompletedRaw = {
    ...createInitialStudentState(),
    group: '1학년 3반',
    code: '10301',
    evaluation: {
      scores: [3, 3, 2, 3],
      feedback: '1~4차시 명제 증명을 완벽히 수행했습니다.',
      nextStep: '절대부등식도 탐구해 보세요.',
    },
  };

  // Verify that under a 4-lesson curriculum it was 100% complete (5/5)
  const progAt4Lessons = getTeacherEvaluationProgress(legacyCompletedRaw, 4);
  assert.equal(progAt4Lessons.status, 'complete');
  assert.equal(progAt4Lessons.percent, 100);

  // Now lessons 5, 6, 7 are added (current 7-lesson curriculum):
  const hydrated = cleanStudentState(legacyCompletedRaw);
  const ev = ensureTeacherEval(hydrated);
  // Existing 4 scores and feedback must be preserved intact, and new 3 items padded with null
  assert.deepEqual(ev.scores, [3, 3, 2, 3, null, null, null]);
  assert.equal(ev.feedback, '1~4차시 명제 증명을 완벽히 수행했습니다.');
  assert.equal(ev.evaluatedLessonCount, 4);

  const progAt7Lessons = getTeacherEvaluationProgress(hydrated);
  assert.equal(progAt7Lessons.status, 'partial');
  assert.equal(progAt7Lessons.statusLabel, '평가 진행 중');
  assert.equal(progAt7Lessons.completedCount, 5); // 4 existing scores + 1 feedback
  assert.equal(progAt7Lessons.totalCount, 8); // 7 rubric items + 1 feedback
  assert.equal(progAt7Lessons.ungradedRubricCount, 3); // 5, 6, 7차시 미평정
  assert.equal(progAt7Lessons.percent, 63); // 5/8 = 62.5% -> 63%
  assert.equal(progAt7Lessons.isReopenedByLessonExpansion, true);

  // Case 2: Once the teacher evaluates the newly added 5~7차시 items, it becomes 'complete' (100%)
  hydrated.evaluation = {
    ...ev,
    scores: [3, 3, 2, 3, 3, 2, 3],
    evaluatedLessonCount: 7,
  };
  const progAfterGradingNewLessons = getTeacherEvaluationProgress(hydrated);
  assert.equal(progAfterGradingNewLessons.status, 'complete');
  assert.equal(progAfterGradingNewLessons.statusLabel, '평가 완료');
  assert.equal(progAfterGradingNewLessons.percent, 100);
  assert.equal(progAfterGradingNewLessons.isReopenedByLessonExpansion, false);

  // Case 3: If an 8th lesson is added in the future, the 7-lesson completed evaluation automatically transitions back to 'partial'
  const progWhen8thLessonAdded = getTeacherEvaluationProgress(hydrated, 8);
  assert.equal(progWhen8thLessonAdded.status, 'partial');
  assert.equal(progWhen8thLessonAdded.statusLabel, '평가 진행 중');
  assert.equal(progWhen8thLessonAdded.completedCount, 8);
  assert.equal(progWhen8thLessonAdded.totalCount, 9);
  assert.equal(progWhen8thLessonAdded.ungradedRubricCount, 1);
  assert.equal(progWhen8thLessonAdded.percent, 89);
  assert.equal(progWhen8thLessonAdded.isReopenedByLessonExpansion, true);

  // Case 4: Sample dataset records (which had 4 lessons scored prior to 5~7차시 expansion) are in 'partial' state
  const samples = createSampleTeacherDataset();
  for (const sample of samples) {
    const p = getTeacherEvaluationProgress(sample);
    assert.equal(p.status, 'partial');
    assert.equal(p.isReopenedByLessonExpansion, true);
    assert.equal(p.ungradedRubricCount, 3);
  }
});

test('calc6GeometrySimulation computes semicircle length and square/rectangle area properties accurately', () => {
  // Unequal positive pair (a = 1, b = 9)
  const sim19 = calc6GeometrySimulation(1, 9);
  assert.equal(sim19.diameter, 10);
  assert.equal(sim19.arith, 5); // radius (1+9)/2 = 5
  assert.equal(sim19.geom, 3); // altitude sqrt(1*9) = 3
  assert.equal(sim19.harm, 1.8); // 2*9 / 10 = 1.8
  assert.equal(sim19.centerOffset, 4); // |1-9|/2 = 4 (note 3^2 + 4^2 = 5^2)
  assert.equal(sim19.arithSquareArea, 25); // 5^2 = 25
  assert.equal(sim19.rectArea, 9); // 1 * 9 = 9
  assert.equal(sim19.areaDiff, 16); // 25 - 9 = 16 = (1-9)^2 / 4
  assert.equal(sim19.bigSquareArea, 100); // (1+9)^2 = 100
  assert.equal(sim19.fourRectArea, 36); // 4 * 1 * 9 = 36
  assert.equal(sim19.innerHoleArea, 64); // (1-9)^2 = 64 (36 + 64 = 100)
  assert.equal(sim19.isEqual, false);

  // Equal positive pair (a = 4, b = 4) -> Equality holds across all lengths and areas
  const sim44 = calc6GeometrySimulation(4, 4);
  assert.equal(sim44.diameter, 8);
  assert.equal(sim44.arith, 4);
  assert.equal(sim44.geom, 4);
  assert.equal(sim44.harm, 4);
  assert.equal(sim44.centerOffset, 0);
  assert.equal(sim44.arithSquareArea, 16);
  assert.equal(sim44.rectArea, 16);
  assert.equal(sim44.areaDiff, 0);
  assert.equal(sim44.innerHoleArea, 0);
  assert.equal(sim44.isEqual, true);
});

test('applyMathSymbolInsertion and convertMathShorthand support smart wrapping, cursor placement, and PC shorthands', () => {
  // 1. Plain symbol insertion at cursor
  const r1 = applyMathSymbolInsertion('a + b', 5, 5, ' ≥ ');
  assert.equal(r1.nextValue, 'a + b ≥ ');
  assert.equal(r1.nextCursorStart, 8);

  // 2. Template insertion with NO selection places cursor inside □
  const r2 = applyMathSymbolInsertion('좌변 = ', 5, 5, '√(□)');
  assert.equal(r2.nextValue, '좌변 = √()');
  assert.equal(r2.nextCursorStart, 7); // Right between '(' and ')'

  // 3. Template insertion WITH selection wraps selected text
  const r3 = applyMathSymbolInsertion('(a+b)/2 - ab', 10, 12, '√(□)');
  assert.equal(r3.nextValue, '(a+b)/2 - √(ab)');
  assert.equal(r3.nextCursorStart, 15);

  // 4. Multi-slot fraction template (□)/(□) with selection wraps numerator and puts cursor in denominator
  const r4 = applyMathSymbolInsertion('a+b', 0, 3, '(□)/(□)');
  assert.equal(r4.nextValue, '(a+b)/()');
  assert.equal(r4.nextCursorStart, 7); // Inside denominator parentheses

  // 5. Shorthand conversions
  const c1 = convertMathShorthand('(a+b)/2 >=', 10);
  assert.equal(c1.converted, true);
  assert.equal(c1.nextValue, '(a+b)/2 ≥');

  const c2 = convertMathShorthand('(a-b)^2', 7);
  assert.equal(c2.converted, true);
  assert.equal(c2.nextValue, '(a-b)²');

  const c3 = convertMathShorthand('sqrt(ab)', 5);
  assert.equal(c3.converted, true);
  assert.equal(c3.nextValue, '√(ab)');

  const c4 = convertMathShorthand(':. a = b', 2);
  assert.equal(c4.converted, true);
  assert.equal(c4.nextValue, '∴ a = b');

  // Ensure all 7 lessons have recommended symbols and all categories are populated
  for (const lesson of [1, 2, 3, 4, 5, 6, 7] as const) {
    assert.ok(LESSON_RECOMMENDED_SYMBOLS[lesson].length >= 8);
  }
  assert.ok(MATH_SYMBOL_CATEGORIES.length >= 5);
});

test('tokenizeMathRadicals parses parenthesized, numeric, variable, and bare square root expressions accurately', () => {
  // 1. Parenthesized radical √(ab) -> strips outer parens and keeps 'ab' under the vinculum
  const t1 = tokenizeMathRadicals('(a + b)/2 − √(ab) = ((√a − √b)²)/2 ≥ 0');
  const radicals1 = t1.filter((tok) => tok.type === 'radical');
  assert.equal(radicals1.length, 3);
  assert.equal(radicals1[0].value, 'ab');
  assert.equal(radicals1[0].hasParens, true);
  assert.equal(radicals1[1].value, 'a');
  assert.equal(radicals1[1].hasParens, false);
  assert.equal(radicals1[2].value, 'b');
  assert.equal(radicals1[2].hasParens, false);

  // 2. Numeric radical followed by multiplier variable: n = √2m -> radicand is '2', 'm' stays outside
  const t2 = tokenizeMathRadicals('n = √2m의 양변을 제곱하면 n² = 2m²');
  assert.deepEqual(t2, [
    { type: 'text', value: 'n = ', raw: 'n = ' },
    { type: 'radical', value: '2', hasParens: false, raw: '√2' },
    { type: 'text', value: 'm의 양변을 제곱하면 n² = 2m²', raw: 'm의 양변을 제곱하면 n² = 2m²' },
  ]);

  // 3. Consecutive radicals √a√b -> two distinct radicals
  const t3 = tokenizeMathRadicals('(√a)² − 2√a√b + (√b)²');
  const radicals3 = t3.filter((tok) => tok.type === 'radical');
  assert.equal(radicals3.length, 4);
  assert.deepEqual(
    radicals3.map((r) => r.value),
    ['a', 'a', 'b', 'b']
  );

  // 4. Complex parenthesized expression √(a × 1/a) and template √(□)
  const t4 = tokenizeMathRadicals('a + 1/a ≥ 2√(a × 1/a) = 2 · 템플릿 √(□)');
  const radicals4 = t4.filter((tok) => tok.type === 'radical');
  assert.equal(radicals4.length, 2);
  assert.equal(radicals4[0].value, 'a × 1/a');
  assert.equal(radicals4[0].hasParens, true);
  assert.equal(radicals4[1].value, '□');
  assert.equal(radicals4[1].hasParens, true);

  // 5. Bare √ symbol (e.g., on keypad button)
  const t5 = tokenizeMathRadicals('√');
  assert.deepEqual(t5, [{ type: 'radical', value: '', hasParens: false, raw: '√' }]);
});

test('cleanStudentState properly sanitizes and pads Lesson 5~7 choices, booleans, and hint arrays', () => {
  const base = createInitialStudentState();
  const rawData = {
    ...base,
    l5: {
      ...base.l5,
      prob1Choices: [0, 1], // partial array
      prob1Verified: [true], // partial booleans
      prob1Hints: [2],
      equalityReason: '완전제곱식이 0 이상이기 때문',
    },
    l6: {
      ...base.l6,
      prob1Choices: [null, 2, 'invalid', 1],
      harmonicReason: '역수의 산술기하평균에 의해 성립',
    },
    l7: {
      ...base.l7,
      absDiffReason: '양변 제곱 후 차를 계산',
    },
  };

  const cleaned = cleanStudentState(rawData);
  assert.equal(cleaned.l5.prob1Choices.length, 4);
  assert.deepEqual(cleaned.l5.prob1Choices, [0, 1, null, null]);
  assert.deepEqual(cleaned.l5.prob1Verified, [true, false, false, false]);
  assert.deepEqual(cleaned.l5.prob1Hints, [2, 0, 0, 0]);
  assert.equal(cleaned.l5.equalityReason, '완전제곱식이 0 이상이기 때문');

  assert.equal(cleaned.l6.prob1Choices.length, 4);
  assert.deepEqual(cleaned.l6.prob1Choices, [null, 2, null, 1]);
  assert.equal(cleaned.l6.harmonicReason, '역수의 산술기하평균에 의해 성립');
  assert.equal(cleaned.l7.absDiffReason, '양변 제곱 후 차를 계산');
});

test('mergeStudentStates preserves student work in lessons 5~7 while merging teacher evaluations from remote', () => {
  const local = createInitialStudentState();
  local.code = '10101';
  local.group = '수학수사1반';
  local.updatedAt = '2026-10-26T14:00:00.000Z';
  local.l5.equalityReason = '로컬 작성: a=b일 때만 등호 성립';
  local.l5.prob1ProofText = '(a - b/2)^2 + 3/4 b^2 >= 0';
  local.l6.harmonicReason = '로컬 작성: 산술기하 평균 역수 부등식';
  local.l7.absDiffReason = '로컬 작성: 삼각부등식 성립 원리';

  const remote = createInitialStudentState();
  remote.code = '10101';
  remote.group = '수학수사1반';
  remote.updatedAt = '2026-10-26T10:00:00.000Z'; // older remote
  remote.evaluation = {
    scores: [3, 3, 3, 3, 3, 3, 3],
    feedback: '훌륭한 증명 과정입니다.',
    nextStep: '심화 절대부등식 탐구',
    evaluatedLessonCount: 7,
  };
  remote.teacherMemo = '교사 추가 메모';

  const merged = mergeStudentStates(remote, local);

  // Student-authored Lesson 5~7 inputs must be preserved from local
  assert.equal(merged.l5.equalityReason, '로컬 작성: a=b일 때만 등호 성립');
  assert.equal(merged.l5.prob1ProofText, '(a - b/2)^2 + 3/4 b^2 >= 0');
  assert.equal(merged.l6.harmonicReason, '로컬 작성: 산술기하 평균 역수 부등식');
  assert.equal(merged.l7.absDiffReason, '로컬 작성: 삼각부등식 성립 원리');

  // Teacher feedback from remote must be preserved
  assert.ok(merged.evaluation);
  assert.equal(merged.evaluation?.feedback, '훌륭한 증명 과정입니다.');
  assert.equal(merged.teacherMemo, '교사 추가 메모');
});

