import type { LessonKey } from './lessonMerge';

/**
 * 교사 [전체 답안 보기]에 표시할 문항 이름표 (Props — 명제)
 * ------------------------------------------------------------------
 * - 학생 화면(LessonNView)에 문항을 추가·변경하면 여기에도 같은 이름표를 추가하세요.
 *   이름표가 없어도 학생이 입력한 값은 '기타 기록'에 필드 이름으로 표시되지만,
 *   교사가 알아보기 쉽도록 이름표를 붙이는 것이 좋습니다.
 * - hidden: 다른 항목을 이어 붙여 자동으로 만들어지는 요약 필드나, 이 수업에서 쓰지 않는 필드.
 *   (표시하지 않음 — 원본 항목은 각각 따로 표시됨)
 * - 단위 테스트(answerLabels.test.ts)가 학생 화면이 쓰는 모든 필드가 이름표 또는 hidden에
 *   들어 있는지 검사합니다.
 */

export type AnswerFormat =
  | { kind: 'text' }
  | { kind: 'yesno'; yes?: string; no?: string }
  | { kind: 'choice'; options: Record<string, string> }
  | { kind: 'check' }
  | { kind: 'checks' }
  | { kind: 'choices' }
  | { kind: 'points' }
  | { kind: 'map'; valueLabels?: Record<string, string> }
  | { kind: 'list'; itemLabel?: string }
  | { kind: 'table'; columns?: Record<string, string> }
  | { kind: 'json' };

export interface AnswerField {
  key: string;
  label: string;
  format?: AnswerFormat;
}

export interface LessonAnswerGroup {
  title: string;
  fields: AnswerField[];
}

export interface LessonAnswerConfig {
  title: string;
  groups: LessonAnswerGroup[];
  hidden?: string[];
}

const CHECK: AnswerFormat = { kind: 'check' };
const CHECKS: AnswerFormat = { kind: 'checks' };
const CHOICES: AnswerFormat = { kind: 'choices' };
const FUNC_YN: AnswerFormat = { kind: 'yesno', yes: '함수이다 (O)', no: '함수가 아니다 (X)' };
const ONE_TO_ONE_YN: AnswerFormat = { kind: 'yesno', yes: '예 (O)', no: '아니오 (X)' };

/** 4~7차시 (Func·Props 공통 문항) */
export const COMMON_L4_TO_L7: Record<'l4' | 'l5' | 'l6' | 'l7', LessonAnswerConfig> = {
  l4: {
    title: '4차시 · 귀류법',
    groups: [
      {
        title: '실험과 개념 확인',
        fields: [
          {
            key: 'fractionExamples',
            label: '분수 n/m 실험 기록',
            format: { kind: 'table', columns: { m: 'm', n: 'n', g: '최대공약수', coprime: '서로소', mSq2: '2m²', nSq: 'n²', diff: 'n² − 2m²' } },
          },
          { key: 'contradictionConceptChecked', label: '귀류법 논리 순서 확인', format: CHECK },
        ],
      },
      {
        title: '[문제 1] 귀류법 증명',
        fields: [
          { key: 'prob1Choices', label: '단계별 선택', format: CHOICES },
          { key: 'prob1Verified', label: '단계 확인', format: CHECKS },
          { key: 'prob1ProofText', label: '[문제 1] 나의 말로 쓰는 귀류법 증명 보고서' },
        ],
      },
      {
        title: '[문제 2] 귀류법 증명',
        fields: [
          { key: 'closureChecked', label: 'r − 1에 대한 설명 확인', format: CHECK },
          { key: 'closureReason', label: 'r − 1에 대한 설명 (선택한 내용)' },
          { key: 'prob2Choices', label: '단계별 선택', format: CHOICES },
          { key: 'prob2Verified', label: '단계 확인', format: CHECKS },
          { key: 'prob2ProofText', label: '[문제 2] 나의 말로 쓰는 귀류법 증명 보고서' },
        ],
      },
      {
        title: '성찰',
        fields: [
          { key: 'reflection1', label: '성찰 1. 결론을 부정하는 이유와 모순을 찾는 과정' },
          { key: 'reflection2', label: '성찰 2. 대우를 이용한 증명과 귀류법 비교' },
        ],
      },
    ],
  },
  l5: {
    title: '5차시 · 절대부등식 1 (완전제곱식)',
    groups: [
      {
        title: '실험과 개념 확인',
        fields: [
          {
            key: 'examples',
            label: '수치 대입 실험 기록',
            format: { kind: 'table', columns: { a: 'a', b: 'b', lhs: '좌변', rhs: '우변', diff: '차', isEqual: '등호' } },
          },
          {
            key: 'squareConceptChoice',
            label: 'A ≥ B 증명의 핵심 원리',
            format: {
              kind: 'choice',
              options: {
                nonnegative: 'A − B를 완전제곱식의 합으로 변형하여 A − B ≥ 0임을 보인다',
                alwayspositive: '양수 2~3개만 대입해 확인하면 증명이 끝난다',
                negative: '실수를 제곱하면 음수가 되므로 A − B < 0임을 보인다',
              },
            },
          },
        ],
      },
      {
        title: '[문제 1] 증명',
        fields: [
          { key: 'prob1Choices', label: '단계별 선택', format: CHOICES },
          { key: 'prob1Verified', label: '단계 확인', format: CHECKS },
          { key: 'prob1ProofText', label: '[문제 1] 증명 보고서 (등호 성립 조건 포함)' },
        ],
      },
      {
        title: '[문제 2] 증명',
        fields: [
          { key: 'equalityConditionChecked', label: '등호 성립 필요충분조건 확인', format: CHECK },
          { key: 'equalityReason', label: '5b²을 4b² + b²으로 쪼개어 변형하는 이유' },
          { key: 'prob2Choices', label: '단계별 선택', format: CHOICES },
          { key: 'prob2Verified', label: '단계 확인', format: CHECKS },
          { key: 'prob2ProofText', label: '[문제 2] (1)·(2) 증명 보고서' },
        ],
      },
      {
        title: '성찰',
        fields: [
          { key: 'reflection1', label: '성찰 1. 완전제곱식이 강력한 도구가 되는 이유' },
          { key: 'reflection2', label: '성찰 2. (1)·(2)의 등호 성립 조건 비교' },
        ],
      },
    ],
  },
  l6: {
    title: '6차시 · 절대부등식 2 (산술·기하·조화평균)',
    groups: [
      {
        title: '실험과 개념 확인',
        fields: [
          {
            key: 'examples',
            label: '평균 비교 실험 기록',
            format: { kind: 'table', columns: { a: 'a', b: 'b', arith: '산술평균', geom: '기하평균', harm: '조화평균', diff: '차', isEqual: '등호' } },
          },
          {
            key: 'amgmConceptChoice',
            label: '(√a − √b)²을 만들 수 있는 조건',
            format: {
              kind: 'choice',
              options: {
                positive: 'a, b가 모두 양수일 때 (√a − √b)² ≥ 0을 이용할 수 있다',
                anyreal: 'a, b가 음수여도 항상 성립한다',
                negative: 'a = −b일 때만 성립한다',
              },
            },
          },
        ],
      },
      {
        title: '[문제 1] 증명',
        fields: [
          { key: 'prob1Choices', label: '단계별 선택', format: CHOICES },
          { key: 'prob1Verified', label: '단계 확인', format: CHECKS },
          { key: 'prob1ProofText', label: '[문제 1] 증명 보고서' },
        ],
      },
      {
        title: '[문제 2] 증명',
        fields: [
          { key: 'harmonicChecked', label: '조화평균 관계 확인', format: CHECK },
          { key: 'harmonicReason', label: '조화평균 관계에 대한 이유' },
          { key: 'prob2Choices', label: '단계별 선택', format: CHOICES },
          { key: 'prob2Verified', label: '단계 확인', format: CHECKS },
          { key: 'prob2ProofText', label: '[문제 2] 증명 보고서' },
        ],
      },
      {
        title: '성찰',
        fields: [
          { key: 'reflection1', label: '성찰 1. 양수 조건과 제곱근 변형' },
          { key: 'reflection2', label: '성찰 2. 산술·기하·조화평균의 대소관계' },
        ],
      },
    ],
  },
  l7: {
    title: '7차시 · 절대부등식 3 (절댓값)',
    groups: [
      {
        title: '실험과 개념 확인',
        fields: [
          {
            key: 'examples',
            label: '절댓값 실험 기록',
            format: { kind: 'table', columns: { a: 'a', b: 'b', lhsSum: '|a| + |b|', rhsSum: '|a + b|', diffSq: '제곱의 차', sameSign: '같은 부호' } },
          },
          {
            key: 'absSquareConceptChoice',
            label: '|a + b| ≤ |a| + |b| 증명 전략',
            format: {
              kind: 'choice',
              options: {
                square_diff: '양변이 0 이상이므로 제곱의 차 (|a| + |b|)² − |a + b|² ≥ 0을 보인다',
                direct_sub: '절댓값 기호를 임의로 지워서 계산한다',
                cube: '양변을 세제곱하여 비교한다',
              },
            },
          },
        ],
      },
      {
        title: '[문제 1] 증명',
        fields: [
          { key: 'prob1Choices', label: '단계별 선택', format: CHOICES },
          { key: 'prob1Verified', label: '단계 확인', format: CHECKS },
          { key: 'prob1ProofText', label: '[문제 1] 증명 보고서' },
        ],
      },
      {
        title: '[문제 2] 증명',
        fields: [
          { key: 'absDiffChecked', label: '|a| − |b| 관계 확인', format: CHECK },
          { key: 'absDiffReason', label: '|a| − |b| 관계에 대한 이유' },
          { key: 'prob2Choices', label: '단계별 선택', format: CHOICES },
          { key: 'prob2Verified', label: '단계 확인', format: CHECKS },
          { key: 'prob2ProofText', label: '[문제 2] 증명 보고서' },
        ],
      },
      {
        title: '성찰',
        fields: [
          { key: 'reflection1', label: '성찰 1. 절댓값 제곱의 차 원리' },
          { key: 'reflection2', label: '성찰 2. 부호 조건에 따른 등호 성립 차이' },
        ],
      },
    ],
  },
};

/** AI 얼굴 인식·자판기 도전 활동 (Func 1차시 / Props 1차시 도전 활동 공통) */
export const CHALLENGE_GROUPS: LessonAnswerGroup[] = [
  {
    title: '도전 ① AI 얼굴 인식은 함수일까?',
    fields: [
      { key: 'aiA', label: '기계 A는 함수인가?', format: FUNC_YN },
      { key: 'aiB', label: '기계 B는 함수인가?', format: FUNC_YN },
      { key: 'aiC', label: '기계 C는 함수인가?', format: FUNC_YN },
      { key: 'aiExplain', label: '판별 이유' },
      { key: 'aiCheck1', label: '판별 확인', format: CHECK },
      { key: 'aiFixB', label: '기계 B 수리: 사진 ②에 대응시킨 이름' },
      { key: 'aiFixBVerified', label: '기계 B 수리 확인', format: CHECK },
      { key: 'aiFixC', label: '기계 C 수리: 사진 ③에 대응시킨 이름' },
      { key: 'aiFixCVerified', label: '기계 C 수리 확인', format: CHECK },
      { key: 'aiReflection', label: '두 사진이 같은 사람 이름으로 출력되어도 함수일까? 이유' },
      { key: 'aiReflectionChecked', label: '탐구 질문 확인', format: CHECK },
    ],
  },
  {
    title: '도전 ② 고장 난 자판기를 수리하라!',
    fields: [
      { key: 'vendAnswer', label: '지금 대응은 함수인가?', format: FUNC_YN },
      { key: 'vendExplain', label: '판단 이유 (조건을 위반한 버튼)' },
      { key: 'vendCheck1', label: '미션 1 확인', format: CHECK },
      { key: 'vFix', label: '수리: 버튼별로 연결한 음료', format: { kind: 'list', itemLabel: '버튼' } },
      { key: 'vendCheck2', label: '미션 2 (수리) 확인', format: CHECK },
      {
        key: 'setAns',
        label: '미션 3: 음료 세트 전체를 하나의 출력으로 보면 함수가 될 수 있을까?',
        format: { kind: 'yesno', yes: '그럴 수 있다 (O)', no: '불가능하다 (X)' },
      },
      { key: 'setExplain', label: '미션 3 근거 설명' },
      { key: 'vendCheck3', label: '미션 3 확인', format: CHECK },
    ],
  },
];

/** Props 1차시 도전 활동에 실제로 있는 필드 (Func보다 확인 표시 필드가 적음) */
const PROPS_CHALLENGE_KEYS = new Set([
  'aiA', 'aiB', 'aiC', 'aiExplain', 'aiFixB', 'aiFixC', 'aiReflection',
  'vendAnswer', 'vendExplain', 'vFix', 'setAns', 'setExplain',
]);

const DECISION_OPTIONS = { true: '참', false: '거짓', unknown: '아직 판단할 수 없음' };

export const LESSON_ANSWER_CONFIG: Record<LessonKey, LessonAnswerConfig> = {
  l1: {
    title: '1차시 · 홀수의 제곱 규칙 탐구',
    groups: [
      {
        title: '사례 탐색과 명제 추측',
        fields: [
          {
            key: 'examples',
            label: '사례 탐색 기록 (홀수 n)',
            format: { kind: 'table', columns: { n: 'n', sq: 'n²', r: '8로 나눈 나머지', valid: '대상 맞음' } },
          },
          { key: 'claim', label: '① 추측한 명제' },
          { key: 'scope', label: '명제의 범위', format: { kind: 'choice', options: { some: '일부 홀수', all: '모든 홀수' } } },
          { key: 'claimChecked', label: '추측 확인', format: CHECK },
        ],
      },
      {
        title: '검사와 증명',
        fields: [
          {
            key: 'checks',
            label: '반례 검사 기록',
            format: { kind: 'table', columns: { n: 'n', sq: 'n²', r: '8로 나눈 나머지', valid: '대상 맞음' } },
          },
          { key: 'limits', label: '모든 단서가 일치해도 최종 증명이 필요한 이유' },
          { key: 'proofChoices', label: '증명 단계별 선택', format: CHOICES },
          { key: 'proofVerified', label: '증명 단계 확인', format: CHECKS },
          { key: 'proofText', label: '나의 말로 쓰는 최종 증명 보고서' },
        ],
      },
      {
        title: '성찰',
        fields: [
          { key: 'reflection', label: '1. 사례를 여러 개 확인하는 것과 일반적인 증명의 차이' },
          { key: 'bridge', label: '2. 8 대신 16으로 나누어도 규칙이 성립할까? 예상과 이유' },
        ],
      },
      ...CHALLENGE_GROUPS.map((g) => ({ ...g, fields: g.fields.filter((f) => PROPS_CHALLENGE_KEYS.has(f.key)) })),
    ],
    // challengeSubTab: 도전 활동 화면에서 어느 탭을 보고 있었는지(화면 상태)
    hidden: ['challengeSubTab'],
  },
  l2: {
    title: '2차시 · 명제의 참·거짓 탐구',
    groups: [
      {
        title: '탐구할 명제',
        fields: [
          {
            key: 'topic',
            label: '선택한 탐구 주제',
            format: { kind: 'choice', options: { a: 'A · 조건 바꾸기', b: 'B · 대상 바꾸기', c: 'C · 규칙 일반화', d: 'D · 나만의 명제' } },
          },
          { key: 'customStatement', label: '직접 만든 명제' },
          { key: 'customScope', label: '직접 만든 명제의 범위' },
        ],
      },
      {
        title: '사례 탐색과 판단',
        fields: [
          {
            key: 'examples',
            label: '사례 탐색 기록',
            format: { kind: 'table', columns: { n: 'n', product: '계산값', r: '나머지', valid: '대상 맞음', isCounter: '반례', obs: '관찰' } },
          },
          {
            key: 'checks',
            label: '반례 검사 기록',
            format: { kind: 'table', columns: { n: 'n', product: '계산값', r: '나머지', valid: '대상 맞음', isCounter: '반례', memo: '메모' } },
          },
          { key: 'guess', label: '추측과 근거' },
          { key: 'decision', label: '참·거짓 판단', format: { kind: 'choice', options: DECISION_OPTIONS } },
          { key: 'decisionChecked', label: '판단 확인', format: CHECK },
          { key: 'counter', label: '반례 (정수)' },
          { key: 'counterReason', label: '반례임을 계산과 문장으로 설명' },
          { key: 'proofText', label: '증명 보고서 (또는 아직 증명하지 못한 이유)' },
        ],
      },
      {
        title: '보고서 공유와 동료 검토',
        fields: [
          { key: 'share', label: '1. 친구에게 내 탐구 결과를 짧게 설명하기' },
          { key: 'peer', label: '피드백한 친구 식별코드' },
          { key: 'peerComment', label: '친구가 확인해 준 점 / 질문' },
          { key: 'revision', label: '피드백을 반영해 고친 점' },
          { key: 'reflection', label: '2. 1차시와 비교했을 때 달라진 점' },
          { key: 'nextQuestion', label: '3. 다음에 탐구해 보고 싶은 명제 또는 질문' },
        ],
      },
    ],
  },
  l3: {
    title: '3차시 · 대우를 이용한 증명',
    groups: [
      {
        title: '실험과 개념 확인',
        fields: [
          {
            key: 'parityExamples',
            label: '짝수·홀수 실험 기록',
            format: { kind: 'table', columns: { n: 'n', sq: 'n²', nIsOdd: 'n 홀수', sqIsOdd: 'n² 홀수' } },
          },
          {
            key: 'contrapositiveChoice',
            label: '원래 명제와 참·거짓이 항상 일치하는 명제',
            format: { kind: 'choice', options: { converse: '역 (q → p)', inverse: '이 (~p → ~q)', contrapositive: '대우 (~q → ~p)' } },
          },
        ],
      },
      {
        title: '[문제 1] 대우 증명 (짝수·홀수)',
        fields: [
          { key: 'prob1Choices', label: '단계별 선택', format: CHOICES },
          { key: 'prob1Verified', label: '단계 확인', format: CHECKS },
          { key: 'prob1ProofText', label: '[문제 1] 나의 말로 쓰는 대우 증명 보고서' },
        ],
      },
      {
        title: '[문제 2] 대우 증명 (3의 배수)',
        fields: [
          {
            key: 'mod3Examples',
            label: '3으로 나눈 나머지 실험 기록',
            format: { kind: 'table', columns: { n: 'n', sq: 'n²', nRem3: 'n ÷ 3 나머지', sqRem3: 'n² ÷ 3 나머지' } },
          },
          { key: 'mod3CasesChecked', label: '경우 나누기 확인', format: CHECK },
          { key: 'prob2Choices', label: '단계별 선택', format: CHOICES },
          { key: 'prob2Verified', label: '단계 확인', format: CHECKS },
          { key: 'prob2ProofText', label: '[문제 2] 나의 말로 쓰는 대우 증명 보고서' },
        ],
      },
      {
        title: '성찰',
        fields: [
          { key: 'reflection1', label: '성찰 1. 대우를 이용한 증명이 편리했던 점' },
          { key: 'reflection2', label: '성찰 2. 문제 1·2에서 경우를 나누는 방식의 차이' },
        ],
      },
    ],
  },
  ...COMMON_L4_TO_L7,
};
