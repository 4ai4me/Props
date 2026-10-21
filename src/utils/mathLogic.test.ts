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
  PROOF3_PROB1_STEPS,
  PROOF3_PROB2_STEPS,
  PROOF4_PROB1_STEPS,
  PROOF4_PROB2_STEPS,
  validateClaim1,
  cleanStudentState,
  createInitialStudentState,
  csvSafe,
  evaluateLevel1Completion,
  evaluateLevel2Completion,
  evaluateLevel3Completion,
  evaluateLevel4Completion,
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

test('PROOF3 and PROOF4 step definitions have 4 steps and 3 hints each', () => {
  for (const steps of [
    PROOF3_PROB1_STEPS,
    PROOF3_PROB2_STEPS,
    PROOF4_PROB1_STEPS,
    PROOF4_PROB2_STEPS,
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

test('cleanStudentState preserves backward compatibility with legacy 2-lesson JSON and hydrates l3/l4', () => {
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
    // l3 and l4 intentionally omitted to simulate legacy saved state
  };
  const cleaned = cleanStudentState(legacyRaw);
  assert.equal(cleaned.kind, 'proof2lesson-v1');
  assert.equal(cleaned.group, '1학년 3반');
  assert.equal(cleaned.code, '10315');
  assert.equal(cleaned.l3.prob1Choices.length, 4);
  assert.equal(cleaned.l4.prob1Choices.length, 4);

  assert.throws(() => cleanStudentState({ kind: 'wrong-kind' }));
});

test('csvSafe prevents formula injection and escapes quotes', () => {
  assert.equal(csvSafe('=SUM(A1:A2)'), '"\'=SUM(A1:A2)"');
  assert.equal(csvSafe('학생 "탐정" 기록'), '"학생 ""탐정"" 기록"');
});

test('evaluateLevel1..4Completion track progress accurately', () => {
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
});

