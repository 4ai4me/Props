export interface L1Example {
  n: number;
  sq: number;
  r: number;
  valid: boolean;
}

export interface L2Example {
  n: number;
  product?: number;
  r?: number;
  valid?: boolean;
  isCounter?: boolean;
  obs?: string;
}

export interface L2Check {
  n: number;
  product?: number;
  r?: number;
  valid?: boolean;
  isCounter?: boolean;
  memo?: string;
}

export interface Lesson1State {
  examples: L1Example[];
  claim: string;
  scope: '' | 'some' | 'all';
  claimChecked: boolean;
  checks: L1Example[];
  limits: string;
  proofChoices: (number | null)[];
  proofVerified: boolean[];
  proofHints: number[];
  proofText: string;
  reflection: string;
  bridge: string;
}

export interface Lesson2State {
  topic: '' | 'a' | 'b' | 'c' | 'd';
  customStatement: string;
  customScope: string;
  examples: L2Example[];
  checks: L2Check[];
  guess: string;
  decision: '' | 'true' | 'false' | 'unknown';
  decisionChecked: boolean;
  counter: string;
  counterReason: string;
  proofText: string;
  hintLevel: number;
  share: string;
  peer: string;
  peerComment: string;
  revision: string;
  reflection: string;
  nextQuestion: string;
}

export interface L3ParityExample {
  n: number;
  sq: number;
  nIsOdd: boolean;
  sqIsOdd: boolean;
}

export interface L3Mod3Example {
  n: number;
  sq: number;
  nRem3: number;
  sqRem3: number;
}

export interface Lesson3State {
  parityExamples: L3ParityExample[];
  contrapositiveChoice: '' | 'converse' | 'inverse' | 'contrapositive';
  step1HintLevel: number;
  prob1Choices: (number | null)[];
  prob1Verified: boolean[];
  prob1Hints: number[];
  prob1ProofText: string;
  mod3Examples: L3Mod3Example[];
  mod3CasesChecked: boolean;
  step3HintLevel: number;
  prob2Choices: (number | null)[];
  prob2Verified: boolean[];
  prob2Hints: number[];
  prob2ProofText: string;
  reflection1: string;
  reflection2: string;
}

export interface L4FractionExample {
  m: number;
  n: number;
  g: number;
  coprime: boolean;
  mSq2: number;
  nSq: number;
  diff: number;
}

export interface Lesson4State {
  fractionExamples: L4FractionExample[];
  contradictionConceptChecked: boolean;
  step1HintLevel: number;
  prob1Choices: (number | null)[];
  prob1Verified: boolean[];
  prob1Hints: number[];
  prob1ProofText: string;
  closureChecked: boolean;
  closureReason: string;
  step3HintLevel: number;
  prob2Choices: (number | null)[];
  prob2Verified: boolean[];
  prob2Hints: number[];
  prob2ProofText: string;
  reflection1: string;
  reflection2: string;
}

export interface L5InequalityExample {
  a: number;
  b: number;
  lhs: number;
  rhs: number;
  diff: number;
  isEqual: boolean;
}

export interface Lesson5State {
  examples: L5InequalityExample[];
  squareConceptChoice: '' | 'nonnegative' | 'alwayspositive' | 'negative';
  step1HintLevel: number;
  prob1Choices: (number | null)[];
  prob1Verified: boolean[];
  prob1Hints: number[];
  prob1ProofText: string;
  equalityConditionChecked: boolean;
  equalityReason: string;
  step3HintLevel: number;
  prob2Choices: (number | null)[];
  prob2Verified: boolean[];
  prob2Hints: number[];
  prob2ProofText: string;
  reflection1: string;
  reflection2: string;
}

export interface L6MeanExample {
  a: number;
  b: number;
  arith: number;
  geom: number;
  harm: number;
  diff: number;
  isEqual: boolean;
}

export interface Lesson6State {
  examples: L6MeanExample[];
  amgmConceptChoice: '' | 'positive' | 'anyreal' | 'negative';
  step1HintLevel: number;
  prob1Choices: (number | null)[];
  prob1Verified: boolean[];
  prob1Hints: number[];
  prob1ProofText: string;
  harmonicChecked: boolean;
  harmonicReason: string;
  step3HintLevel: number;
  prob2Choices: (number | null)[];
  prob2Verified: boolean[];
  prob2Hints: number[];
  prob2ProofText: string;
  reflection1: string;
  reflection2: string;
}

export interface L7AbsExample {
  a: number;
  b: number;
  lhsSum: number;
  rhsSum: number;
  diffSq: number;
  sameSign: boolean;
}

export interface Lesson7State {
  examples: L7AbsExample[];
  absSquareConceptChoice: '' | 'square_diff' | 'direct_sub' | 'cube';
  step1HintLevel: number;
  prob1Choices: (number | null)[];
  prob1Verified: boolean[];
  prob1Hints: number[];
  prob1ProofText: string;
  absDiffChecked: boolean;
  absDiffReason: string;
  step3HintLevel: number;
  prob2Choices: (number | null)[];
  prob2Verified: boolean[];
  prob2Hints: number[];
  prob2ProofText: string;
  reflection1: string;
  reflection2: string;
}

export interface TeacherEvaluation {
  scores: (number | null)[];
  feedback: string;
  nextStep: string;
  evaluatedLessonCount?: number;
}

export interface StudentRecord {
  kind: 'proof2lesson-v1';
  group: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  l1: Lesson1State;
  l2: Lesson2State;
  l3: Lesson3State;
  l4: Lesson4State;
  l5: Lesson5State;
  l6: Lesson6State;
  l7: Lesson7State;
  teacherMemo?: string;
  evaluation?: TeacherEvaluation;
}

export type TopicId = 'a' | 'b' | 'c' | 'd';

export interface TopicDefinition {
  id: TopicId;
  tag: string;
  title: string;
  statement: string;
  scope: string;
  calc: ((n: number) => number) | null;
  div: number | null;
  formula: ((n: number) => string) | null;
  trueValue: boolean | null;
  proofLead: string;
  recommendedInputs: number[];
  hints: string[];
}

export const STORAGE_KEY_STUDENT = 'proof_discovery_two_lessons_student_v1';
export const STORAGE_KEY_TEACHER = 'proof_discovery_two_lessons_teacher_v1';

export const TOPICS: Record<TopicId, TopicDefinition> = {
  a: {
    id: 'a',
    tag: 'A · 조건 바꾸기',
    title: '홀수의 제곱을 16으로 나누면 나머지는 항상 1일까?',
    statement: '모든 홀수 n에 대하여 n²을 16으로 나눈 나머지는 1이다.',
    scope: '홀수',
    calc: (n: number) => n * n,
    div: 16,
    formula: (n: number) => `${n}²`,
    trueValue: false,
    proofLead: '이 명제가 참인지 확신이 서지 않는다면, 먼저 서로 다른 홀수의 나머지를 비교해 보세요.',
    recommendedInputs: [1, 3, 5, 7, -3],
    hints: [
      '2차시 2~3단계에서 서로 다른 홀수의 나머지를 비교하세요.',
      'n=1과 n=3일 때 16으로 나눈 나머지를 비교하세요.',
      '반례 한 개를 찾았다면 전체 명제가 거짓입니다.',
    ],
  },
  b: {
    id: 'b',
    tag: 'B · 대상 바꾸기',
    title: '연속하는 두 짝수의 곱은 항상 8의 배수일까?',
    statement: '모든 짝수 n에 대하여 n(n+2)는 8의 배수이다.',
    scope: '짝수',
    calc: (n: number) => n * (n + 2),
    div: 8,
    formula: (n: number) => `${n}×(${n + 2 >= 0 ? n + 2 : `${n + 2}`})`,
    trueValue: true,
    proofLead: '짝수를 n=2k로 놓고, 연속하는 다음 짝수를 2(k+1)로 나타내 보세요.',
    recommendedInputs: [0, 2, 4, 6, -4],
    hints: [
      '두 짝수를 2k, 2k+2로 나타내 보세요.',
      '곱을 4k(k+1)로 정리하세요.',
      '연속한 정수 k와 k+1 중 하나는 짝수입니다.',
    ],
  },
  c: {
    id: 'c',
    tag: 'C · 규칙 일반화',
    title: '연속하는 세 정수의 곱은 항상 6의 배수일까?',
    statement: '모든 정수 n에 대하여 n(n+1)(n+2)는 6의 배수이다.',
    scope: '정수',
    calc: (n: number) => n * (n + 1) * (n + 2),
    div: 6,
    formula: (n: number) => `${n}×${n + 1}×${n + 2}`,
    trueValue: true,
    proofLead: '연속하는 세 정수 중에는 반드시 짝수가 있고, 반드시 3의 배수도 있습니다.',
    recommendedInputs: [-2, -1, 0, 1, 3],
    hints: [
      '곱을 n(n+1)(n+2)로 표현하세요.',
      '연속한 세 정수 중 반드시 짝수가 있고, 3의 배수도 있습니다.',
      '2와 3이 서로소이므로 곱은 6의 배수입니다.',
    ],
  },
  d: {
    id: 'd',
    tag: 'D · 나만의 명제',
    title: '내가 만든 새로운 명제',
    statement: '',
    scope: '직접 정하기',
    calc: null,
    div: null,
    formula: null,
    trueValue: null,
    proofLead: '명제의 대상을 정확하게 정하고, 반례가 있는지 먼저 점검해 보세요.',
    recommendedInputs: [1, 2, 3, -1, 0],
    hints: [
      '가정이 정확히 무엇인지 먼저 명시하세요.',
      '참이라면 임의의 대상에 대한 논리를, 거짓이라면 구체적인 반례를 적어 보세요.',
      '수치 실험만으로는 모든 경우의 참을 증명할 수 없습니다.',
    ],
  },
};

export interface ProofStepQuestion {
  q: string;
  opts: string[];
  answer: number;
  hints: string[];
}

export const PROOF1_STEPS: ProofStepQuestion[] = [
  {
    q: '모든 홀수 n을 표현할 수 있는 식을 고르세요. (k는 정수)',
    opts: ['n = 2k', 'n = 2k + 1', 'n = k + 1'],
    answer: 1,
    hints: [
      '짝수와 홀수를 구별하는 표현을 떠올려 보세요.',
      '2의 배수가 아닌 정수를 표현해야 합니다.',
      '정수 k에 대하여 2k+1입니다.',
    ],
  },
  {
    q: 'n = 2k + 1일 때, n² − 1을 알맞게 정리한 식은?',
    opts: ['4k(k + 1)', '2k(k + 1)', '4k² + 1'],
    answer: 0,
    hints: [
      '먼저 (2k+1)²을 전개하세요.',
      '전개 후 1을 빼고 4k를 묶어 보세요.',
      '(2k+1)² − 1 = 4k² + 4k = 4k(k+1)입니다.',
    ],
  },
  {
    q: '모든 정수 k에 대하여 k(k + 1)이 짝수인 이유는?',
    opts: [
      '두 수가 모두 짝수이므로',
      '연속한 두 정수 중 적어도 하나는 짝수이므로',
      '모든 자연수는 짝수이므로',
    ],
    answer: 1,
    hints: [
      'k와 k+1은 어떤 관계일까요?',
      '연속한 두 정수는 짝수와 홀수가 번갈아 나옵니다.',
      '연속한 두 정수 중 하나는 반드시 짝수입니다.',
    ],
  },
  {
    q: '앞의 결과로부터 올바르게 결론 내릴 수 있는 것은?',
    opts: [
      'n² − 1은 4의 배수이지만 8의 배수는 아닐 수 있다',
      'n² − 1은 모든 정수 n에 대해 8의 배수이다',
      'n² − 1은 모든 홀수 n에 대해 8의 배수이다',
    ],
    answer: 2,
    hints: [
      'n² − 1 = 4k(k+1)이고 k(k+1)은 짝수입니다.',
      'k(k+1) = 2t (t는 정수)로 써 보세요.',
      'n² − 1 = 4 × 2t = 8t이므로 8의 배수입니다.',
    ],
  },
];

export const PROOF3_PROB1_STEPS: ProofStepQuestion[] = [
  {
    q: '주어진 명제 ‘자연수 n에 대하여 n²이 짝수이면 n도 짝수이다.’의 대우로 알맞은 것은?',
    opts: [
      '자연수 n에 대하여 n이 짝수이면 n²도 짝수이다.',
      '자연수 n에 대하여 n이 홀수이면 n²도 홀수이다.',
      '자연수 n에 대하여 n²이 홀수이면 n도 홀수이다.',
    ],
    answer: 1,
    hints: [
      '명제 p → q의 대우는 ~q → ~p입니다.',
      '가정 p는 ‘n²이 짝수이다’, 결론 q는 ‘n이 짝수이다’입니다.',
      '결론을 부정한 ‘n이 홀수이면’이 가정이 되고, 가정을 부정한 ‘n²도 홀수이다’가 결론이 됩니다.',
    ],
  },
  {
    q: '대우의 가정에서 자연수 n이 홀수일 때, 자연수 k를 사용하여 n을 알맞게 나타낸 식은?',
    opts: [
      'n = 2k (k는 자연수)',
      'n = 2k − 1 (k는 자연수)',
      'n = 2k + 2 (k는 자연수)',
    ],
    answer: 1,
    hints: [
      '자연수 k = 1, 2, 3, ...을 대입했을 때 1, 3, 5, ...가 나오는 식을 찾아보세요.',
      'k = 1일 때 첫 번째 홀수인 1이 나오려면 2k − 1 형태여야 합니다.',
      '따라서 홀수인 자연수 n은 n = 2k − 1 (k는 자연수)로 나타낼 수 있습니다.',
    ],
  },
  {
    q: 'n = 2k − 1일 때, n²을 전개하여 홀수임을 보이도록 바르게 묶은 식은?',
    opts: [
      'n² = (2k − 1)² = 4k² − 4k + 1 = 2(2k² − 2k + 1) − 1',
      'n² = (2k − 1)² = 4k² − 1 = 2(2k²) − 1',
      'n² = (2k − 1)² = 4k² − 2k + 1 = 2(2k² − k)',
    ],
    answer: 0,
    hints: [
      '곱셈 공식 (a − b)² = a² − 2ab + b²을 이용하여 (2k − 1)²을 전개하세요.',
      '(2k − 1)² = 4k² − 4k + 1입니다. 이를 2 × (자연수) − 1 꼴로 변형해 보세요.',
      '4k² − 4k + 1 = 2(2k² − 2k + 1) − 1이고, 2k² − 2k + 1은 자연수이므로 n²도 홀수입니다.',
    ],
  },
  {
    q: '위 과정으로부터 원래 명제가 참임을 정당화하는 올바른 마무리는?',
    opts: [
      '역이 참이므로 주어진 명제도 참이다.',
      '주어진 명제의 대우가 참이므로 주어진 명제도 참이다.',
      '몇 가지 자연수를 대입해 성립했으므로 주어진 명제는 참이다.',
    ],
    answer: 1,
    hints: [
      '어떤 명제와 그 대우의 참·거짓은 항상 일치합니다.',
      '우리가 증명한 ‘n이 홀수이면 n²도 홀수이다’는 원래 명제의 대우입니다.',
      '따라서 주어진 명제의 대우가 참이므로 주어진 명제도 참입니다.',
    ],
  },
];

export const PROOF3_PROB2_STEPS: ProofStepQuestion[] = [
  {
    q: '주어진 명제 ‘자연수 n에 대하여 n²이 3의 배수이면 n도 3의 배수이다.’의 대우로 알맞은 것은?',
    opts: [
      '자연수 n에 대하여 n이 3의 배수이면 n²도 3의 배수이다.',
      '자연수 n에 대하여 n이 3의 배수가 아니면 n²도 3의 배수가 아니다.',
      '자연수 n에 대하여 n²이 3의 배수가 아니면 n도 3의 배수가 아니다.',
    ],
    answer: 1,
    hints: [
      '가정 p는 ‘n²이 3의 배수이다’, 결론 q는 ‘n이 3의 배수이다’입니다.',
      '대우 ~q → ~p를 만들려면 결론을 먼저 부정하여 가정으로 놓아야 합니다.',
      '‘자연수 n에 대하여 n이 3의 배수가 아니면 n²도 3의 배수가 아니다.’가 대우입니다.',
    ],
  },
  {
    q: '자연수 n이 3의 배수가 아닐 때, 자연수 k를 사용하여 가능한 모든 경우를 바르게 나눈 것은?',
    opts: [
      'n = 3k − 1 (k는 자연수) 한 가지 경우만 확인한다.',
      'n = 3k − 2 또는 n = 3k − 1 (k는 자연수)의 두 가지 경우로 나눈다.',
      'n = 2k − 1 (k는 자연수)로 놓는다.',
    ],
    answer: 1,
    hints: [
      '자연수를 3으로 나누었을 때 가능한 나머지는 0, 1, 2입니다.',
      '3의 배수가 아니므로 나머지가 1인 수와 나머지가 2인 수 두 가지 경우를 모두 조사해야 합니다.',
      '자연수 k에 대하여 나머지가 1인 자연수는 3k − 2, 나머지가 2인 자연수는 3k − 1로 나타낼 수 있습니다.',
    ],
  },
  {
    q: '(i) n = 3k − 2일 때와 (ii) n = 3k − 1일 때, n²을 3으로 묶어 정리한 식으로 옳은 것은?',
    opts: [
      '(i) n² = 3(3k² − 4k + 1) + 1,  (ii) n² = 3(3k² − 2k) + 1',
      '(i) n² = 3(3k² − 4k) + 2,  (ii) n² = 3(3k² − 2k) + 2',
      '(i) n² = 3(3k² − 2k + 1),  (ii) n² = 3(3k² − k)',
    ],
    answer: 0,
    hints: [
      '(i) (3k − 2)² = 9k² − 12k + 4에서 4 = 3 + 1로 분리하여 3으로 묶어 보세요.',
      '9k² − 12k + 3 + 1 = 3(3k² − 4k + 1) + 1이므로 3으로 나눈 나머지가 1입니다.',
      '(ii) (3k − 1)² = 9k² − 6k + 1 = 3(3k² − 2k) + 1이므로 두 경우 모두 나머지가 1이어서 3의 배수가 아닙니다.',
    ],
  },
  {
    q: '두 경우 모두 n²이 3의 배수가 아님을 확인했습니다. 최종 결론으로 알맞은 것은?',
    opts: [
      '대우가 거짓이므로 주어진 명제도 거짓이다.',
      '주어진 명제의 대우가 참이므로 주어진 명제도 참이다.',
      '나머지가 2인 경우가 없으므로 주어진 명제는 거짓이다.',
    ],
    answer: 1,
    hints: [
      'n이 3의 배수가 아닌 모든 경우(3k − 2, 3k − 1)에 대하여 n²도 3의 배수가 아님을 증명했습니다.',
      '따라서 주어진 명제의 대우가 참임이 밝혀졌습니다.',
      '주어진 명제의 대우가 참이므로 원래 명제 ‘자연수 n에 대하여 n²이 3의 배수이면 n도 3의 배수이다.’도 참입니다.',
    ],
  },
];

export const PROOF4_PROB1_STEPS: ProofStepQuestion[] = [
  {
    q: '귀류법으로 ‘√2는 유리수가 아니다.’를 증명하기 위해 명제를 부정하여 세운 가정으로 알맞은 것은?',
    opts: [
      '√2가 무리수라 하면, 서로소인 두 자연수 m, n에 대하여 √2 = m × n으로 나타낼 수 있다.',
      '√2가 유리수라 하면, 서로소인 두 자연수 m과 n에 대하여 √2 = n / m으로 나타낼 수 있다.',
      '√2가 자연수라 하면, 짝수인 자연수 n에 대하여 √2 = 2n으로 나타낼 수 있다.',
    ],
    answer: 1,
    hints: [
      '귀류법의 첫걸음은 증명하려는 명제의 결론(‘유리수가 아니다’)을 부정하는 것입니다.',
      '양의 유리수는 항상 분모와 분자의 최대공약수로 약분한 기약분수 꼴로 나타낼 수 있습니다.',
      '따라서 √2가 유리수라 하면, 서로소인 두 자연수 m과 n에 대하여 √2 = n / m으로 나타낼 수 있습니다.',
    ],
  },
  {
    q: '√2 = n / m에서 n = √2m의 양변을 제곱하면 n² = 2m² (…… ①)입니다. 이때 알 수 있는 n의 성질은?',
    opts: [
      'n²이 홀수이므로 n도 홀수이다.',
      'n²이 짝수이므로 n도 짝수이다.',
      'n²이 3의 배수이므로 n도 3의 배수이다.',
    ],
    answer: 1,
    hints: [
      '등식 n² = 2m²에서 우변 2m²은 2 × (자연수) 꼴이므로 짝수입니다.',
      '3차시 문제 1에서 증명했듯이, 자연수 n에 대하여 ‘n²이 짝수이면 n도 짝수’입니다.',
      '따라서 n²이 짝수이므로 n도 짝수입니다.',
    ],
  },
  {
    q: 'n이 짝수이므로 n = 2k (k는 자연수)를 ①(n² = 2m²)에 대입하여 정리한 식과 m의 성질은?',
    opts: [
      '4k² = 2m², 즉 2k² = m²이므로 m²이 짝수이고 m도 짝수이다.',
      '2k² = 2m², 즉 k² = m²이므로 m은 홀수이다.',
      '4k² = m²이므로 m은 4의 배수이다.',
    ],
    answer: 0,
    hints: [
      'n = 2k를 n² = 2m²의 좌변에 대입하면 (2k)² = 4k²이 됩니다.',
      '4k² = 2m²의 양변을 2로 나누면 2k² = m²이 됩니다.',
      'm² = 2k²이므로 m²이 짝수이고, 따라서 m도 짝수입니다.',
    ],
  },
  {
    q: '앞의 과정에서 m과 n이 모두 짝수라는 결과가 나왔습니다. 왜 이것이 모순이 되나요?',
    opts: [
      'm과 n이 모두 짝수이면 공약수 2를 가지므로, m과 n이 서로소임에 모순이다.',
      '짝수의 제곱은 항상 홀수가 되어야 하므로 계산 규칙에 모순이다.',
      '자연수 k가 존재하지 않으므로 방정식의 해가 없다는 것에 모순이다.',
    ],
    answer: 0,
    hints: [
      '1단계에서 √2 = n / m으로 놓을 때 두 자연수 m과 n이 어떤 관계라고 가정했는지 떠올려 보세요.',
      'm과 n은 1 이외의 공약수가 없는 서로소인 두 자연수라고 가정했습니다.',
      '그런데 m과 n이 모두 짝수이면 2를 공약수로 가지므로 ‘m과 n이 서로소’임에 모순입니다. 따라서 √2는 유리수가 아닙니다.',
    ],
  },
];

export const PROOF4_PROB2_STEPS: ProofStepQuestion[] = [
  {
    q: '귀류법으로 ‘1 + √2는 유리수가 아니다.’를 증명하기 위해 명제를 부정하여 세운 첫 단계는?',
    opts: [
      '명제를 부정하여 1 + √2가 유리수라 하면, 유리수 r에 대하여 1 + √2 = r로 놓을 수 있다.',
      '명제를 부정하여 √2가 유리수라 하면, 1 + √2 = 0으로 놓을 수 있다.',
      '명제를 부정하여 1 + √2가 자연수라 하면, 1 + √2 = 2k로 놓을 수 있다.',
    ],
    answer: 0,
    hints: [
      '증명하려는 명제의 결론은 ‘1 + √2는 유리수가 아니다’입니다.',
      '결론을 부정하면 ‘1 + √2는 유리수이다’가 됩니다.',
      '따라서 어떤 유리수 r에 대하여 1 + √2 = r로 나타낼 수 있습니다.',
    ],
  },
  {
    q: '1 + √2 = r (r은 유리수)에서 이미 알고 있는 무리수 √2만 좌변에 남기도록 이항한 식은?',
    opts: [
      '√2 = r + 1',
      '√2 = r − 1',
      '√2 = 1 / r',
    ],
    answer: 1,
    hints: [
      '우리는 문제 1에서 ‘√2는 유리수가 아니다’라는 사실을 이미 증명했습니다.',
      '이 사실을 활용하기 위해 등식 1 + √2 = r의 양변에서 1을 빼 보세요.',
      '좌변의 1을 우변으로 이항하면 √2 = r − 1이 됩니다.',
    ],
  },
  {
    q: 'r이 유리수일 때, 우변의 식 r − 1은 어떤 수인가요?',
    opts: [
      '유리수 r과 1이 모두 유리수이므로 두 유리수의 차인 r − 1도 유리수이다.',
      '유리수에서 1을 빼면 항상 무리수가 된다.',
      'r의 값에 따라 유리수일 수도 있고 무리수일 수도 있다.',
    ],
    answer: 0,
    hints: [
      'r은 가정에 의해 유리수이고, 1도 유리수입니다.',
      '유리수끼리 더하거나 빼거나 곱한 결과는 항상 유리수입니다 (유리수의 닫힘 성질).',
      '따라서 유리수 r에서 유리수 1을 뺀 r − 1은 반드시 유리수입니다.',
    ],
  },
  {
    q: '등식 √2 = r − 1에서 우변 r − 1이 유리수라면 어떤 모순이 발생하나요?',
    opts: [
      '좌변의 √2도 유리수가 되어야 하는데, 이는 √2가 유리수가 아니라는 사실에 모순이다.',
      'r이 음수가 되어야 하므로 양수라는 사실에 모순이다.',
      '1이 무리수가 되어야 하므로 자연수 정의에 모순이다.',
    ],
    answer: 0,
    hints: [
      '등식 √2 = r − 1에서 우변(r − 1)이 유리수이면 좌변(√2)도 유리수여야 합니다.',
      '하지만 문제 1에서 ‘√2는 유리수가 아니다(무리수이다)’임을 이미 밝혔습니다.',
      '따라서 √2가 유리수가 아니라는 사실에 모순이므로, 1 + √2는 유리수가 아닙니다.',
    ],
  },
];

export const PROOF5_PROB1_STEPS: ProofStepQuestion[] = [
  {
    q: '실수 a와 b에 대하여 부등식 a² + b² ≥ ab가 성립함을 증명하기 위해 가장 먼저 계산해야 할 식은?',
    opts: [
      '좌변에서 우변을 뺀 차 (a² + b²) − ab = a² − ab + b²',
      '좌변과 우변을 곱한 식 (a² + b²) × ab',
      '좌변을 우변으로 나눈 식 (a² + b²) ÷ ab',
    ],
    answer: 0,
    hints: [
      '두 실수 A, B의 대소를 비교할 때는 A − B ≥ 0임을 보이는 것이 기본 원리입니다.',
      '따라서 좌변 A = a² + b²에서 우변 B = ab를 뺀 차 A − B를 구합니다.',
      '(a² + b²) − ab = a² − ab + b²의 부호를 조사하면 됩니다.',
    ],
  },
  {
    q: 'a² − ab + b²을 a에 대한 완전제곱식과 나머지의 합으로 바르게 변형한 것은?',
    opts: [
      '(a − b)² + b²',
      '(a − b/2)² + (3/4)b²',
      '(a − b/2)² − (3/4)b²',
    ],
    answer: 1,
    hints: [
      'a² − ab가 완전제곱식이 되려면 a의 계수(−b)의 절반의 제곱인 (−b/2)² = b²/4를 더하고 빼야 합니다.',
      'a² − ab + b² = (a² − ab + b²/4) − b²/4 + b²으로 묶을 수 있습니다.',
      '따라서 (a − b/2)² + (3/4)b²이 됩니다.',
    ],
  },
  {
    q: '실수의 성질에 의하여 (a − b/2)²과 (3/4)b²의 부호는 각각 어떠한가요?',
    opts: [
      '실수의 제곱은 항상 0 이상이므로 (a − b/2)² ≥ 0, (3/4)b² ≥ 0이 되어 그 합도 0 이상이다.',
      'a와 b가 음수이면 제곱한 값도 음수가 될 수 있다.',
      '항상 0보다 커서 0이 될 수는 없다.',
    ],
    answer: 0,
    hints: [
      '임의의 실수 X에 대하여 X² ≥ 0이라는 실수의 기본 성질을 떠올려 보세요.',
      'a − b/2와 b가 모두 실수이므로 (a − b/2)² ≥ 0이고 (3/4)b² ≥ 0입니다.',
      '0 이상인 두 실수의 합은 항상 0 이상이므로 a² + b² − ab ≥ 0, 즉 a² + b² ≥ ab가 성립합니다.',
    ],
  },
  {
    q: '부등식 a² + b² ≥ ab에서 등호(=)가 성립할 조건은 무엇인가요?',
    opts: [
      'a = b인 모든 실수일 때 성립한다.',
      'a − b/2 = 0이고 b = 0일 때, 즉 a = b = 0일 때 성립한다.',
      'a = 1, b = 2일 때 성립한다.',
    ],
    answer: 1,
    hints: [
      'X² + Y² = 0 (X, Y는 실수)이 성립하려면 X = 0이고 동시에 Y = 0이어야 합니다.',
      '(a − b/2)² + (3/4)b² = 0이 되려면 a − b/2 = 0이고 (3/4)b² = 0이어야 합니다.',
      'b = 0을 a − b/2 = 0에 대입하면 a = 0이므로, 등호는 a = b = 0일 때 성립합니다.',
    ],
  },
];

export const PROOF5_PROB2_STEPS: ProofStepQuestion[] = [
  {
    q: '[문제 2-(1)] 부등식 (a + b)² ≥ 4ab를 증명하기 위해 좌변에서 우변을 빼서 정리한 완전제곱식은?',
    opts: [
      '(a + b)² − 4ab = a² + 2ab + b² − 4ab = a² − 2ab + b² = (a − b)² ≥ 0',
      '(a + b)² − 4ab = a² − 4ab + b² = (a − 2b)² ≥ 0',
      '(a + b)² − 4ab = (a + b − 2)² ≥ 0',
    ],
    answer: 0,
    hints: [
      '(a + b)²을 전개하면 a² + 2ab + b²입니다.',
      '여기에 −4ab를 계산하면 동류항 2ab − 4ab = −2ab가 되어 a² − 2ab + b²이 됩니다.',
      'a² − 2ab + b²을 인수분해하면 (a − b)²이고, 실수의 제곱이므로 항상 (a − b)² ≥ 0입니다.',
    ],
  },
  {
    q: '[문제 2-(1)] 부등식 (a + b)² ≥ 4ab에서 등호가 성립할 조건은?',
    opts: [
      'a = b = 0일 때만 성립한다.',
      'a − b = 0, 즉 a = b일 때 성립한다.',
      'a = −b일 때 성립한다.',
    ],
    answer: 1,
    hints: [
      '(a + b)² − 4ab = (a − b)²에서 등호가 성립한다는 것은 (a − b)² = 0이 된다는 뜻입니다.',
      '실수의 제곱이 0이 되려면 밑인 a − b = 0이어야 합니다.',
      '따라서 등호는 a = b일 때 성립합니다.',
    ],
  },
  {
    q: '[문제 2-(2)] 부등식 a² − 4ab + 5b² ≥ 0을 증명하기 위해 좌변을 두 제곱식의 합으로 바르게 변형한 것은?',
    opts: [
      'a² − 4ab + 5b² = (a − 4b)² + b² ≥ 0',
      'a² − 4ab + 5b² = (a² − 4ab + 4b²) + b² = (a − 2b)² + b² ≥ 0',
      'a² − 4ab + 5b² = (a − 5b)² ≥ 0',
    ],
    answer: 1,
    hints: [
      'a² − 4ab가 완전제곱식이 되려면 뒤에 +4b²이 필요합니다.',
      '5b²을 4b² + b²으로 쪼개면 (a² − 4ab + 4b²) + b²이 됩니다.',
      '앞부분을 완전제곱식으로 묶으면 (a − 2b)² + b²이 되며, 두 실수의 제곱의 합이므로 ≥ 0입니다.',
    ],
  },
  {
    q: '[문제 2-(2)] 부등식 a² − 4ab + 5b² ≥ 0에서 등호가 성립할 조건은?',
    opts: [
      'a = 2b인 모든 실수에서 성립한다.',
      'a − 2b = 0이고 b = 0일 때, 즉 a = b = 0일 때 성립한다.',
      'a = b = 1일 때 성립한다.',
    ],
    answer: 1,
    hints: [
      '(a − 2b)² + b² = 0이 되려면 두 제곱식이 동시에 0이어야 합니다.',
      '즉 a − 2b = 0이고 동시에 b = 0이어야 합니다.',
      'b = 0을 대입하면 a = 0이므로, 등호는 a = b = 0일 때 성립합니다.',
    ],
  },
];

export const PROOF6_PROB1_STEPS: ProofStepQuestion[] = [
  {
    q: 'a > 0, b > 0일 때 산술평균과 기하평균의 관계 (a + b)/2 ≥ √(ab)를 증명하기 위해 계산할 차의 식은?',
    opts: [
      '(a + b)/2 − √(ab) = (a + b − 2√(ab)) / 2',
      '(a + b)/2 + √(ab) = (a + b + 2√(ab)) / 2',
      '(a − b)/2 − √(ab)',
    ],
    answer: 0,
    hints: [
      '좌변 (a + b)/2에서 우변 √(ab)를 뺀 차가 0 이상임을 보이면 됩니다.',
      '분모를 2로 통분하면 √(ab) = 2√(ab)/2가 됩니다.',
      '따라서 (a + b)/2 − √(ab) = (a + b − 2√(ab)) / 2로 정리됩니다.',
    ],
  },
  {
    q: 'a > 0, b > 0이므로 a = (√a)², b = (√b)²임을 이용하면 분자 a − 2√a√b + b는 어떤 완전제곱식이 되나요?',
    opts: [
      '(a − b)²',
      '(√a − √b)²',
      '(√a + √b)²',
    ],
    answer: 1,
    hints: [
      '양수 a, b에 대하여 a = (√a)², b = (√b)², √(ab) = √a√b입니다.',
      '따라서 분자는 (√a)² − 2√a√b + (√b)²으로 쓸 수 있습니다.',
      '이는 인수분해 공식 X² − 2XY + Y² = (X − Y)²에 의해 (√a − √b)²이 됩니다.',
    ],
  },
  {
    q: '(a + b)/2 − √(ab) = (√a − √b)² / 2의 부호에 대한 올바른 결론은?',
    opts: [
      '실수 (√a − √b)의 제곱은 항상 0 이상이므로 (√a − √b)² / 2 ≥ 0이 되어 (a + b)/2 ≥ √(ab)가 성립한다.',
      '√a − √b가 음수이면 제곱해도 음수가 될 수 있다.',
      '분모가 2이므로 항상 1보다 크다.',
    ],
    answer: 0,
    hints: [
      'a > 0, b > 0일 때 √a와 √b는 모두 실수이므로 √a − √b도 실수입니다.',
      '실수의 제곱은 항상 0 이상이므로 (√a − √b)² ≥ 0이고, 이를 양수 2로 나눈 값도 0 이상입니다.',
      '따라서 (a + b)/2 − √(ab) ≥ 0이므로 (a + b)/2 ≥ √(ab)가 성립합니다.',
    ],
  },
  {
    q: '부등식 (a + b)/2 ≥ √(ab)에서 등호(=)가 성립할 조건은?',
    opts: [
      'a = b = 0일 때 성립한다.',
      '√a − √b = 0, 즉 a = b일 때 성립한다.',
      'ab = 1일 때만 성립한다.',
    ],
    answer: 1,
    hints: [
      '(√a − √b)² / 2 = 0이 되려면 √a − √b = 0이어야 합니다.',
      '√a = √b의 양변을 제곱하면 a = b가 됩니다 (단, a > 0, b > 0).',
      '따라서 등호는 두 양수 a와 b가 서로 같을 때(a = b) 성립합니다.',
    ],
  },
];

export const PROOF6_PROB2_STEPS: ProofStepQuestion[] = [
  {
    q: '[문제 2-(1)] a > 0일 때 부등식 a + 1/a ≥ 2를 산술평균과 기하평균의 관계로 증명하는 첫 단계는?',
    opts: [
      'a > 0이면 1/a > 0이므로, 두 양수 a와 1/a에 산술·기하평균의 관계 a + 1/a ≥ 2√(a · 1/a)를 적용한다.',
      'a에 0을 대입하여 성립함을 확인한다.',
      '양변에서 a를 빼서 1/a ≥ 2 − a로 정리한다.',
    ],
    answer: 0,
    hints: [
      '산술평균과 기하평균의 관계는 두 수가 모두 양수일 때 사용할 수 있습니다 (양변에 2를 곱한 형태: A + B ≥ 2√(AB)).',
      'a > 0이면 역수인 1/a도 양수(1/a > 0)입니다.',
      '따라서 A = a, B = 1/a를 대입하면 a + 1/a ≥ 2√(a · 1/a) = 2√1 = 2가 성립합니다.',
    ],
  },
  {
    q: '[문제 2-(1)] a > 0일 때 부등식 a + 1/a ≥ 2에서 등호가 성립할 조건은?',
    opts: [
      'a = 1/a이고 a > 0이므로 a² = 1에서 a = 1일 때 성립한다.',
      'a = 2일 때 성립한다.',
      'a = 1 또는 a = −1일 때 모두 성립한다.',
    ],
    answer: 0,
    hints: [
      '두 양수 a와 1/a에 대한 산술·기하평균에서 등호는 두 수가 같을 때(a = 1/a) 성립합니다.',
      'a = 1/a의 양변에 a를 곱하면 a² = 1이므로 a = 1 또는 a = −1입니다.',
      '문제의 조건에서 a > 0이므로, 등호는 a = 1일 때 성립합니다.',
    ],
  },
  {
    q: '[문제 2-(2)] a > 0, b > 0일 때 부등식 √(ab) ≥ 2ab / (a + b)를 증명하는 올바른 방법은?',
    opts: [
      '좌변에서 우변을 빼서 통분하면 √(ab) − 2ab/(a+b) = √(ab)(a + b − 2√(ab))/(a + b) = √(ab)(√a − √b)²/(a + b) ≥ 0이다.',
      '양변에서 a + b를 빼서 음수임을 보인다.',
      'a = 0, b = 0을 대입하여 0 ≥ 0임을 보인다.',
    ],
    answer: 0,
    hints: [
      '방법 1 (차의 부호): √(ab) − 2ab/(a+b)를 분모 (a+b)로 통분하고 분자를 √(ab)로 묶으면 √(ab)(a + b − 2√(ab)) = √(ab)(√a − √b)²이 됩니다.',
      '방법 2 (산술·기하평균 활용): 문제 1에서 증명한 (a + b)/2 ≥ √(ab)의 양변에 양수 2√(ab)/(a + b)를 곱해도 √(ab) ≥ 2ab/(a + b)가 바로 유도됩니다.',
      'a > 0, b > 0이므로 √(ab) > 0, a + b > 0이고 (√a − √b)² ≥ 0이므로 항상 성립합니다.',
    ],
  },
  {
    q: '[문제 2-(2)] 부등식 √(ab) ≥ 2ab / (a + b) (단, a > 0, b > 0)에서 등호가 성립할 조건은?',
    opts: [
      'a = b일 때 성립한다.',
      'a + b = 2일 때만 성립한다.',
      'ab = 1일 때만 성립한다.',
    ],
    answer: 0,
    hints: [
      '√(ab)(√a − √b)² / (a + b) = 0이 되려면 √a − √b = 0이어야 합니다.',
      '또는 산술·기하평균 (a + b)/2 ≥ √(ab)의 등호 성립 조건과 동일합니다.',
      '따라서 등호는 a = b일 때 성립합니다.',
    ],
  },
];

export const PROOF7_PROB1_STEPS: ProofStepQuestion[] = [
  {
    q: '실수 a, b에 대하여 절댓값 기호가 포함된 부등식 |a + b| ≤ |a| + |b|를 증명할 때 양변을 제곱하여 비교할 수 있는 이유는?',
    opts: [
      '절댓값은 항상 0 이상이므로 좌변 |a + b| ≥ 0이고 우변 |a| + |b| ≥ 0이어서, (|a| + |b|)² − |a + b|² ≥ 0임을 보이면 되기 때문이다.',
      '음수인 경우에도 제곱하면 부등호 방향이 항상 그대로 유지되기 때문이다.',
      '절댓값 기호는 제곱하지 않아도 그냥 괄호로 바꿀 수 있기 때문이다.',
    ],
    answer: 0,
    hints: [
      '두 실수 A ≥ 0, B ≥ 0일 때는 A ≤ B와 A² ≤ B²이 필요충분조건(동치)입니다.',
      '절댓값의 성질에 의해 |a + b| ≥ 0이고 |a| + |b| ≥ 0이므로 양변이 모두 0 이상입니다.',
      '따라서 우변의 제곱에서 좌변의 제곱을 뺀 (|a| + |b|)² − |a + b|² ≥ 0임을 증명하면 됩니다.',
    ],
  },
  {
    q: '절댓값의 성질 |x|² = x²과 |a||b| = |ab|를 이용하여 (|a| + |b|)² − |a + b|²을 전개·정리한 식은?',
    opts: [
      '(a² + 2|ab| + b²) − (a² + 2ab + b²) = 2(|ab| − ab)',
      '(a² + 2ab + b²) − (a² − 2ab + b²) = 4ab',
      'a² + b² − (a² + b²) = 0',
    ],
    answer: 0,
    hints: [
      '(|a| + |b|)² = |a|² + 2|a||b| + |b|² = a² + 2|ab| + b²입니다.',
      '|a + b|² = (a + b)² = a² + 2ab + b²입니다.',
      '두 식을 빼면 a²과 b²이 소거되어 2|ab| − 2ab = 2(|ab| − ab)가 남습니다.',
    ],
  },
  {
    q: '임의의 실수 ab에 대하여 2(|ab| − ab)의 부호와 그에 따른 결론으로 옳은 것은?',
    opts: [
      '항상 |ab| ≥ ab이므로 2(|ab| − ab) ≥ 0이다. 따라서 |a + b|² ≤ (|a| + |b|)²이고, 양변이 0 이상이므로 |a + b| ≤ |a| + |b|가 성립한다.',
      'ab가 음수이면 |ab| − ab < 0이 될 수 있다.',
      '|ab|와 ab는 항상 같으므로 차는 언제나 0이다.',
    ],
    answer: 0,
    hints: [
      '임의의 실수 X에 대하여 절댓값 |X|는 항상 X 이상입니다 (|X| ≥ X).',
      '따라서 |ab| ≥ ab이므로 |ab| − ab ≥ 0이고, 2(|ab| − ab) ≥ 0입니다.',
      '즉 |a + b|² ≤ (|a| + |b|)²이며, |a + b| ≥ 0, |a| + |b| ≥ 0이므로 |a + b| ≤ |a| + |b|가 성립합니다.',
    ],
  },
  {
    q: '부등식 |a + b| ≤ |a| + |b|에서 등호(=)가 성립할 조건은 무엇인가요?',
    opts: [
      '|ab| = ab, 즉 ab ≥ 0 (두 실수 a, b의 부호가 같거나 적어도 하나가 0)일 때 성립한다.',
      'a = b일 때만 성립한다.',
      'ab ≤ 0 (두 실수 a, b의 부호가 반대)일 때 성립한다.',
    ],
    answer: 0,
    hints: [
      '2(|ab| − ab) = 0이 되려면 |ab| − ab = 0, 즉 |ab| = ab여야 합니다.',
      '절댓값 |X|가 자기 자신 X와 같으려면(|X| = X), 그 수 X는 0 이상이어야 합니다.',
      '따라서 등호는 ab ≥ 0일 때 성립합니다.',
    ],
  },
];

export const PROOF7_PROB2_STEPS: ProofStepQuestion[] = [
  {
    q: '[문제 2-(1)] 부등식 |a − b| ≤ |a| + |b|를 증명하기 위해 제곱의 차 (|a| + |b|)² − |a − b|²을 정리한 식은?',
    opts: [
      '(a² + 2|ab| + b²) − (a² − 2ab + b²) = 2(|ab| + ab) ≥ 0',
      '(a² − 2|ab| + b²) − (a² + 2ab + b²) = −2(|ab| + ab)',
      '2(|ab| − ab) ≥ 0',
    ],
    answer: 0,
    hints: [
      '|a − b| ≥ 0, |a| + |b| ≥ 0이므로 양변을 제곱하여 뺍니다.',
      '(|a| + |b|)² = a² + 2|ab| + b²이고, |a − b|² = (a − b)² = a² − 2ab + b²입니다.',
      '두 식을 빼면 2|ab| − (−2ab) = 2(|ab| + ab)가 되며, 항상 |ab| ≥ −ab이므로 2(|ab| + ab) ≥ 0입니다.',
    ],
  },
  {
    q: '[문제 2-(1)] 부등식 |a − b| ≤ |a| + |b|에서 등호가 성립할 조건은?',
    opts: [
      '|ab| + ab = 0, 즉 |ab| = −ab이므로 ab ≤ 0일 때 성립한다.',
      'ab ≥ 0일 때 성립한다.',
      'a = b = 0일 때만 성립한다.',
    ],
    answer: 0,
    hints: [
      '2(|ab| + ab) = 0이 되려면 |ab| = −ab여야 합니다.',
      '절댓값 |X|가 −X와 같으려면(|X| = −X), 그 수 X는 0 이하(X ≤ 0)여야 합니다.',
      '따라서 등호는 ab ≤ 0일 때 성립합니다.',
    ],
  },
  {
    q: '[문제 2-(2)] 부등식 |a| − |b| ≤ |a − b|를 증명할 때, 왜 (i) |a| < |b|인 경우와 (ii) |a| ≥ |b|인 경우로 나누어 생각하면 편리한가요?',
    opts: [
      '|a| < |b|이면 좌변 |a| − |b| < 0이고 우변 |a − b| ≥ 0이므로 제곱할 필요 없이 당연히 성립하고, |a| ≥ |b|이면 양변이 모두 0 이상이므로 제곱의 차로 비교할 수 있기 때문이다.',
      '|a| < |b|일 때는 부등식이 성립하지 않기 때문이다.',
      '절댓값은 음수일 때만 정의되기 때문이다.',
    ],
    answer: 0,
    hints: [
      '제곱하여 크기를 비교하는 방법은 양변이 모두 0 이상일 때 쓸 수 있습니다.',
      '(i) |a| < |b|일 때는 좌변 |a| − |b| < 0(음수)이고 우변 |a − b| ≥ 0이므로 부등식 |a| − |b| < |a − b|가 항상 성립합니다.',
      '(ii) |a| ≥ |b|일 때는 좌변 |a| − |b| ≥ 0, 우변 |a − b| ≥ 0이므로 양변을 제곱하여 비교할 수 있습니다.',
    ],
  },
  {
    q: '[문제 2-(2)] |a| ≥ |b|일 때 우변의 제곱에서 좌변의 제곱을 뺀 |a − b|² − (|a| − |b|)²의 정리 결과와 등호 성립 조건은?',
    opts: [
      '(a² − 2ab + b²) − (a² − 2|ab| + b²) = 2(|ab| − ab) ≥ 0이며, 등호는 ab ≥ 0이고 |a| ≥ |b|일 때 성립한다.',
      '2(|ab| + ab) ≥ 0이며, 등호는 ab ≤ 0일 때 성립한다.',
      '0이 되어 모든 실수 a, b에서 등호가 성립한다.',
    ],
    answer: 0,
    hints: [
      '|a − b|² = a² − 2ab + b²이고, (|a| − |b|)² = |a|² − 2|a||b| + |b|² = a² − 2|ab| + b²입니다.',
      '두 식을 빼면 −2ab − (−2|ab|) = 2(|ab| − ab) ≥ 0이므로 |a| − |b| ≤ |a − b|가 성립합니다.',
      '등호는 |a| ≥ |b|인 조건에서 |ab| = ab(즉 ab ≥ 0)일 때 성립합니다.',
    ],
  },
];

export const STAGE_TITLES = {
  1: ['단서 수집', '가설 수립', '반례 수색', '증명 보고서', '다음 사건 예고'],
  2: ['새 사건 선택', '현장 조사', '반례 수색', '판정서 작성', '수사 결과 공유'],
  3: ['대우 단서 탐색', '문제 1 증명', '3의 배수 탐색', '문제 2 증명', '사건 종결·성찰'],
  4: ['귀류법 단서 탐색', '문제 1 증명 (√2)', '무리수 성질 탐색', '문제 2 증명 (1+√2)', '사건 종결·성찰'],
  5: ['완전제곱 단서', '문제 1 (예제 3)', '등호 조건 탐색', '문제 2 (문제 3)', '절대부등식1 종결'],
  6: ['산술·기하 단서', '문제 1 (예제 4)', '역수·조화 탐색', '문제 2 (문제 4)', '절대부등식2 종결'],
  7: ['절댓값 단서', '문제 1 (예제 5)', '절댓값 차 탐색', '문제 2 (문제 5)', '전체 수사 종결'],
} as const;

export const TOTAL_LESSONS = 7;
export const LEGACY_EVAL_CRITERIA_COUNT = 4;

export const EVAL_CRITERIA = [
  '규칙 발견·추측 (1차시)',
  '반례 탐색·검증 (2차시)',
  '논리적 정당화 (3차시 대우법)',
  '성찰·탐구 확장 (4차시 귀류법)',
  '절대부등식1 증명 (5차시)',
  '절대부등식2 증명 (6차시)',
  '절대부등식3 증명 (7차시)',
] as const;

export const EVAL_DESCRIPTIONS = [
  '사례의 규칙을 보편 명제로 표현하고 직접 증명하는 능력',
  '조건에 맞는 반례를 탐색하고 명제의 참·거짓을 판단하는 능력',
  '명제의 대우(~q → ~p)와 경우 나누기로 일반성을 설명하는 능력',
  '결론 부정을 통한 모순 추론(귀류법) 및 탐구 확장 능력',
  '완전제곱식의 합(A²+B² ≥ 0)으로 부등식과 등호 조건을 증명하는 능력',
  '양수 조건에서 산술·기하·조화평균 관계를 유도하고 증명하는 능력',
  '절댓값 제곱 성질(|A|² = A²)과 제곱의 차로 절댓값 부등식을 증명하는 능력',
] as const;

export const CLASSROOM_BRAND_NAME = '이하연 수학 교실';

export const EVAL_SCORE_LABELS: Record<number, string> = {
  0: '0점 · 증거 부족',
  1: '1점 · 시작 단계',
  2: '2점 · 부분적 수행',
  3: '3점 · 충분한 수행',
};

export interface TeacherEvaluationProgress {
  completedCount: number;
  totalCount: number;
  totalRubricCount: number;
  ungradedRubricCount: number;
  percent: number;
  status: 'none' | 'partial' | 'complete';
  statusLabel: string;
  scoredRubricCount: number;
  hasFeedback: boolean;
  hasNextStep: boolean;
  hasMemo: boolean;
  /** 기존 차시 기준 평가 완료 상태였으나, 차시(평가 항목)가 추가되어 진행형('partial')으로 전환되었는지 여부 */
  isReopenedByLessonExpansion: boolean;
}

export interface ClassEvaluationSummary {
  totalStudents: number;
  completeCount: number;
  partialCount: number;
  noneCount: number;
  evaluatedAnyCount: number;
  completionRatePercent: number;
  averageProgressPercent: number;
}

export function hasTeacherEvaluation(student?: StudentRecord | null): boolean {
  if (!student) return false;
  const ev = student.evaluation;
  if (!ev) {
    return Boolean(student.teacherMemo && student.teacherMemo.trim().length > 0);
  }
  const hasScores =
    Array.isArray(ev.scores) &&
    ev.scores.some((s) => s !== null && s !== undefined && typeof s === 'number');
  const hasFeedback = typeof ev.feedback === 'string' && ev.feedback.trim().length > 0;
  const hasNextStep = typeof ev.nextStep === 'string' && ev.nextStep.trim().length > 0;
  const hasMemo = Boolean(student.teacherMemo && student.teacherMemo.trim().length > 0);
  return hasScores || hasFeedback || hasNextStep || hasMemo;
}

export function getTeacherEvalAverage(scores?: (number | null)[]): number | null {
  if (!scores || !Array.isArray(scores)) return null;
  const valid = scores.filter((v): v is number => typeof v === 'number' && v >= 0 && v <= 3);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function getTeacherEvaluationProgress(
  student?: StudentRecord | null,
  currentLessonCount: number = EVAL_CRITERIA.length
): TeacherEvaluationProgress {
  const totalRubricCount = Math.max(1, currentLessonCount);
  const totalCount = totalRubricCount + 1; // N lesson/competency rubric criteria + 1 student feedback
  if (!student) {
    return {
      completedCount: 0,
      totalCount,
      totalRubricCount,
      ungradedRubricCount: totalRubricCount,
      percent: 0,
      status: 'none',
      statusLabel: '미평가',
      scoredRubricCount: 0,
      hasFeedback: false,
      hasNextStep: false,
      hasMemo: false,
      isReopenedByLessonExpansion: false,
    };
  }
  const ev = student.evaluation;
  const rawScores = Array.isArray(ev?.scores) ? ev!.scores : [];

  // If evaluatedLessonCount was explicitly recorded under an older curriculum with fewer lessons
  // than currentLessonCount, only scores up to evaluatedLessonCount (or explicitly scored items) count,
  // and any newly added lesson slots beyond that are ungraded until scored.
  const effectiveRubricLimit =
    typeof ev?.evaluatedLessonCount === 'number' &&
    ev.evaluatedLessonCount > 0 &&
    ev.evaluatedLessonCount < totalRubricCount &&
    rawScores.slice(ev.evaluatedLessonCount, totalRubricCount).every((v) => v === null || v === undefined)
      ? ev.evaluatedLessonCount
      : totalRubricCount;

  const isScoreValid = (v: unknown): v is number =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 3;

  const scoredRubricCount = rawScores
    .slice(0, totalRubricCount)
    .filter((v, idx) => idx < effectiveRubricLimit && isScoreValid(v)).length;

  const ungradedRubricCount = Math.max(0, totalRubricCount - scoredRubricCount);
  const hasFeedback = Boolean(ev?.feedback && ev.feedback.trim().length > 0);
  const hasNextStep = Boolean(ev?.nextStep && ev.nextStep.trim().length > 0);
  const hasMemo = Boolean(student.teacherMemo && student.teacherMemo.trim().length > 0);

  // Check if this record had completed all previous evaluation items (e.g., first 4 lessons + feedback,
  // or first evaluatedLessonCount lessons + feedback) before new lessons were added.
  const prevBaselineCount =
    typeof ev?.evaluatedLessonCount === 'number' &&
    ev.evaluatedLessonCount >= LEGACY_EVAL_CRITERIA_COUNT &&
    ev.evaluatedLessonCount < totalRubricCount
      ? ev.evaluatedLessonCount
      : LEGACY_EVAL_CRITERIA_COUNT;

  const hadCompletedPreviousCurriculum =
    totalRubricCount > prevBaselineCount &&
    hasFeedback &&
    rawScores.slice(0, prevBaselineCount).filter(isScoreValid).length === prevBaselineCount &&
    scoredRubricCount < totalRubricCount;

  const completedCount = scoredRubricCount + (hasFeedback ? 1 : 0);
  let percent = Math.round((completedCount / totalCount) * 100);
  let status: 'none' | 'partial' | 'complete' = 'none';
  let statusLabel = '미평가';

  // Even if all previous criteria were scored, if currentLessonCount > scoredRubricCount (or evaluatedLessonCount < totalRubricCount with ungraded new lessons),
  // completion is revoked and changed to 'partial' (평가 진행 중).
  if (completedCount >= totalCount && scoredRubricCount >= totalRubricCount) {
    status = 'complete';
    statusLabel = '평가 완료';
    percent = 100;
  } else if (completedCount > 0 || hasNextStep || hasMemo) {
    status = 'partial';
    statusLabel = '평가 진행 중';
    if (percent === 0) percent = 10;
    if (percent >= 100) percent = 99;
  }

  return {
    completedCount,
    totalCount,
    totalRubricCount,
    ungradedRubricCount,
    percent,
    status,
    statusLabel,
    scoredRubricCount,
    hasFeedback,
    hasNextStep,
    hasMemo,
    isReopenedByLessonExpansion: status === 'partial' && hadCompletedPreviousCurriculum,
  };
}

export function getClassEvaluationSummary(records: StudentRecord[]): ClassEvaluationSummary {
  const totalStudents = records.length;
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      completeCount: 0,
      partialCount: 0,
      noneCount: 0,
      evaluatedAnyCount: 0,
      completionRatePercent: 0,
      averageProgressPercent: 0,
    };
  }
  let completeCount = 0;
  let partialCount = 0;
  let noneCount = 0;
  let sumPercent = 0;

  for (const r of records) {
    const p = getTeacherEvaluationProgress(r);
    sumPercent += p.percent;
    if (p.status === 'complete') completeCount++;
    else if (p.status === 'partial') partialCount++;
    else noneCount++;
  }

  return {
    totalStudents,
    completeCount,
    partialCount,
    noneCount,
    evaluatedAnyCount: completeCount + partialCount,
    completionRatePercent: Math.round((completeCount / totalStudents) * 100),
    averageProgressPercent: Math.round(sumPercent / totalStudents),
  };
}

export function createInitialStudentState(): StudentRecord {
  const timestamp = new Date().toISOString();
  return {
    kind: 'proof2lesson-v1',
    group: '',
    code: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    l1: {
      examples: [],
      claim: '',
      scope: '',
      claimChecked: false,
      checks: [],
      limits: '',
      proofChoices: [null, null, null, null],
      proofVerified: [false, false, false, false],
      proofHints: [0, 0, 0, 0],
      proofText: '',
      reflection: '',
      bridge: '',
    },
    l2: {
      topic: '',
      customStatement: '',
      customScope: '',
      examples: [],
      checks: [],
      guess: '',
      decision: '',
      decisionChecked: false,
      counter: '',
      counterReason: '',
      proofText: '',
      hintLevel: 0,
      share: '',
      peer: '',
      peerComment: '',
      revision: '',
      reflection: '',
      nextQuestion: '',
    },
    l3: {
      parityExamples: [],
      contrapositiveChoice: '',
      step1HintLevel: 0,
      prob1Choices: [null, null, null, null],
      prob1Verified: [false, false, false, false],
      prob1Hints: [0, 0, 0, 0],
      prob1ProofText: '',
      mod3Examples: [],
      mod3CasesChecked: false,
      step3HintLevel: 0,
      prob2Choices: [null, null, null, null],
      prob2Verified: [false, false, false, false],
      prob2Hints: [0, 0, 0, 0],
      prob2ProofText: '',
      reflection1: '',
      reflection2: '',
    },
    l4: {
      fractionExamples: [],
      contradictionConceptChecked: false,
      step1HintLevel: 0,
      prob1Choices: [null, null, null, null],
      prob1Verified: [false, false, false, false],
      prob1Hints: [0, 0, 0, 0],
      prob1ProofText: '',
      closureChecked: false,
      closureReason: '',
      step3HintLevel: 0,
      prob2Choices: [null, null, null, null],
      prob2Verified: [false, false, false, false],
      prob2Hints: [0, 0, 0, 0],
      prob2ProofText: '',
      reflection1: '',
      reflection2: '',
    },
    l5: {
      examples: [],
      squareConceptChoice: '',
      step1HintLevel: 0,
      prob1Choices: [null, null, null, null],
      prob1Verified: [false, false, false, false],
      prob1Hints: [0, 0, 0, 0],
      prob1ProofText: '',
      equalityConditionChecked: false,
      equalityReason: '',
      step3HintLevel: 0,
      prob2Choices: [null, null, null, null],
      prob2Verified: [false, false, false, false],
      prob2Hints: [0, 0, 0, 0],
      prob2ProofText: '',
      reflection1: '',
      reflection2: '',
    },
    l6: {
      examples: [],
      amgmConceptChoice: '',
      step1HintLevel: 0,
      prob1Choices: [null, null, null, null],
      prob1Verified: [false, false, false, false],
      prob1Hints: [0, 0, 0, 0],
      prob1ProofText: '',
      harmonicChecked: false,
      harmonicReason: '',
      step3HintLevel: 0,
      prob2Choices: [null, null, null, null],
      prob2Verified: [false, false, false, false],
      prob2Hints: [0, 0, 0, 0],
      prob2ProofText: '',
      reflection1: '',
      reflection2: '',
    },
    l7: {
      examples: [],
      absSquareConceptChoice: '',
      step1HintLevel: 0,
      prob1Choices: [null, null, null, null],
      prob1Verified: [false, false, false, false],
      prob1Hints: [0, 0, 0, 0],
      prob1ProofText: '',
      absDiffChecked: false,
      absDiffReason: '',
      step3HintLevel: 0,
      prob2Choices: [null, null, null, null],
      prob2Verified: [false, false, false, false],
      prob2Hints: [0, 0, 0, 0],
      prob2ProofText: '',
      reflection1: '',
      reflection2: '',
    },
  };
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function safeN(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  const n = Number(v);
  return Number.isSafeInteger(n) && Math.abs(n) <= 10000 ? n : null;
}

export function calc1(n: number): L1Example {
  return {
    n,
    sq: n * n,
    r: mod(n * n, 8),
    valid: Math.abs(n % 2) === 1,
  };
}

export function checkScope(topic: string, n: number): boolean {
  if (topic === 'a') return mod(n, 2) === 1;
  if (topic === 'b') return mod(n, 2) === 0;
  return true;
}

export function calc2(topic: TopicId, n: number): L2Example | null {
  const t = TOPICS[topic];
  if (!t || !t.calc || !t.div) return null;
  const product = t.calc(n);
  const r = mod(product, t.div);
  const valid = checkScope(topic, n);
  const expectedRemainder = topic === 'a' ? 1 : 0;
  return {
    n,
    product,
    r,
    valid,
    isCounter: valid && r !== expectedRemainder,
  };
}

export function calc3Parity(n: number): L3ParityExample {
  const sq = n * n;
  return {
    n,
    sq,
    nIsOdd: mod(n, 2) === 1,
    sqIsOdd: mod(sq, 2) === 1,
  };
}

export function calc3Mod3(n: number): L3Mod3Example {
  const sq = n * n;
  return {
    n,
    sq,
    nRem3: mod(n, 3),
    sqRem3: mod(sq, 3),
  };
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function calc4Coprime(m: number, n: number): L4FractionExample {
  const g = gcd(m, n);
  const mSq2 = 2 * m * m;
  const nSq = n * n;
  return {
    m,
    n,
    g,
    coprime: g === 1,
    mSq2,
    nSq,
    diff: nSq - mSq2,
  };
}

export function calc5Inequality(a: number, b: number): L5InequalityExample {
  const lhs = Number((a * a + b * b).toFixed(4));
  const rhs = Number((a * b).toFixed(4));
  const diff = Number((lhs - rhs).toFixed(4));
  return {
    a,
    b,
    lhs,
    rhs,
    diff,
    isEqual: Math.abs(diff) < 1e-9,
  };
}

export function calc6Means(a: number, b: number): L6MeanExample {
  const arith = Number(((a + b) / 2).toFixed(4));
  const geom = Number(Math.sqrt(a * b).toFixed(4));
  const harm = Number(((2 * a * b) / (a + b)).toFixed(4));
  const diff = Number((arith - geom).toFixed(4));
  return {
    a,
    b,
    arith,
    geom,
    harm,
    diff,
    isEqual: Math.abs(a - b) < 1e-9,
  };
}

export interface L6GeometrySimulation {
  a: number;
  b: number;
  diameter: number;
  arith: number;
  geom: number;
  harm: number;
  centerOffset: number;
  arithSquareArea: number;
  rectArea: number;
  areaDiff: number;
  bigSquareArea: number;
  fourRectArea: number;
  innerHoleArea: number;
  isEqual: boolean;
}

export function calc6GeometrySimulation(aRaw: number, bRaw: number): L6GeometrySimulation {
  const a = Math.max(0.1, Number.isFinite(aRaw) ? aRaw : 1);
  const b = Math.max(0.1, Number.isFinite(bRaw) ? bRaw : 1);
  const diameter = Number((a + b).toFixed(4));
  const arith = Number(((a + b) / 2).toFixed(4));
  const geom = Number(Math.sqrt(a * b).toFixed(4));
  const harm = Number(((2 * a * b) / (a + b)).toFixed(4));
  const centerOffset = Number((Math.abs(a - b) / 2).toFixed(4));
  const arithSquareArea = Number((((a + b) / 2) * ((a + b) / 2)).toFixed(4));
  const rectArea = Number((a * b).toFixed(4));
  const areaDiff = Number((arithSquareArea - rectArea).toFixed(4));
  const bigSquareArea = Number(((a + b) * (a + b)).toFixed(4));
  const fourRectArea = Number((4 * a * b).toFixed(4));
  const innerHoleArea = Number(((a - b) * (a - b)).toFixed(4));
  return {
    a,
    b,
    diameter,
    arith,
    geom,
    harm,
    centerOffset,
    arithSquareArea,
    rectArea,
    areaDiff,
    bigSquareArea,
    fourRectArea,
    innerHoleArea,
    isEqual: Math.abs(a - b) < 1e-9,
  };
}

export function calc7Abs(a: number, b: number): L7AbsExample {
  const lhsSum = Number(Math.abs(a + b).toFixed(4));
  const rhsSum = Number((Math.abs(a) + Math.abs(b)).toFixed(4));
  const diffSq = Number((rhsSum * rhsSum - lhsSum * lhsSum).toFixed(4));
  return {
    a,
    b,
    lhsSum,
    rhsSum,
    diffSq,
    sameSign: a * b >= 0,
  };
}

export function evaluateLevel1Completion(p: Lesson1State): boolean[] {
  return [
    p.examples.length >= 4 && p.examples.some((v) => v.n < 0),
    p.claimChecked,
    p.checks.filter((v) => v.valid).length >= 3 && p.limits.trim().length >= 12,
    p.proofVerified.every(Boolean) && p.proofText.trim().length >= 35,
    p.reflection.trim().length >= 20 && p.bridge.trim().length >= 10,
  ];
}

export function evaluateLevel2Completion(p: Lesson2State): boolean[] {
  return [
    Boolean(p.topic) && (p.topic !== 'd' || p.customStatement.trim().length >= 10),
    p.examples.length >= 5,
    p.checks.length >= 2 && Boolean(p.decision),
    p.decision === 'false'
      ? p.counterReason.trim().length >= 25 && Boolean(String(p.counter).trim())
      : p.proofText.trim().length >= 40,
    p.reflection.trim().length >= 20 && p.nextQuestion.trim().length >= 10,
  ];
}

export function evaluateLevel3Completion(p: Lesson3State): boolean[] {
  return [
    p.parityExamples.length >= 3 && p.contrapositiveChoice === 'contrapositive',
    p.prob1Verified.every(Boolean) && p.prob1ProofText.trim().length >= 35,
    p.mod3Examples.length >= 3 && p.mod3CasesChecked,
    p.prob2Verified.every(Boolean) && p.prob2ProofText.trim().length >= 40,
    p.reflection1.trim().length >= 20 && p.reflection2.trim().length >= 15,
  ];
}

export function evaluateLevel4Completion(p: Lesson4State): boolean[] {
  return [
    p.fractionExamples.length >= 3 && p.contradictionConceptChecked,
    p.prob1Verified.every(Boolean) && p.prob1ProofText.trim().length >= 40,
    p.closureChecked && p.closureReason.trim().length >= 15,
    p.prob2Verified.every(Boolean) && p.prob2ProofText.trim().length >= 35,
    p.reflection1.trim().length >= 20 && p.reflection2.trim().length >= 20,
  ];
}

export function evaluateLevel5Completion(p: Lesson5State): boolean[] {
  return [
    p.examples.length >= 3 && p.squareConceptChoice === 'nonnegative',
    p.prob1Verified.every(Boolean) && p.prob1ProofText.trim().length >= 35,
    p.equalityConditionChecked && p.equalityReason.trim().length >= 15,
    p.prob2Verified.every(Boolean) && p.prob2ProofText.trim().length >= 40,
    p.reflection1.trim().length >= 20 && p.reflection2.trim().length >= 15,
  ];
}

export function evaluateLevel6Completion(p: Lesson6State): boolean[] {
  return [
    p.examples.length >= 3 && p.amgmConceptChoice === 'positive',
    p.prob1Verified.every(Boolean) && p.prob1ProofText.trim().length >= 35,
    p.harmonicChecked && p.harmonicReason.trim().length >= 15,
    p.prob2Verified.every(Boolean) && p.prob2ProofText.trim().length >= 40,
    p.reflection1.trim().length >= 20 && p.reflection2.trim().length >= 15,
  ];
}

export function evaluateLevel7Completion(p: Lesson7State): boolean[] {
  return [
    p.examples.length >= 3 && p.absSquareConceptChoice === 'square_diff',
    p.prob1Verified.every(Boolean) && p.prob1ProofText.trim().length >= 35,
    p.absDiffChecked && p.absDiffReason.trim().length >= 15,
    p.prob2Verified.every(Boolean) && p.prob2ProofText.trim().length >= 40,
    p.reflection1.trim().length >= 20 && p.reflection2.trim().length >= 15,
  ];
}

export function evaluateRubricL1(p: Lesson1State): boolean[] {
  return [
    p.examples.length >= 4,
    p.claimChecked,
    p.checks.length >= 3,
    p.proofVerified.every(Boolean),
    p.reflection.trim().length >= 20,
  ];
}

export function evaluateRubricL2(p: Lesson2State): boolean[] {
  return [
    Boolean(p.topic),
    p.examples.length >= 5,
    p.checks.length >= 2,
    Boolean(p.decision),
    p.decision === 'false'
      ? p.counterReason.trim().length >= 25
      : p.proofText.trim().length >= 40,
    p.reflection.trim().length >= 20,
  ];
}

export function evaluateRubricL3(p: Lesson3State): boolean[] {
  return [
    p.parityExamples.length >= 3 && p.contrapositiveChoice === 'contrapositive',
    p.prob1Verified.every(Boolean) && p.prob1ProofText.trim().length >= 35,
    p.mod3Examples.length >= 3 && p.mod3CasesChecked,
    p.prob2Verified.every(Boolean) && p.prob2ProofText.trim().length >= 40,
    p.reflection1.trim().length >= 20,
  ];
}

export function evaluateRubricL4(p: Lesson4State): boolean[] {
  return [
    p.fractionExamples.length >= 3 && p.contradictionConceptChecked,
    p.prob1Verified.every(Boolean) && p.prob1ProofText.trim().length >= 40,
    p.closureChecked && p.closureReason.trim().length >= 15,
    p.prob2Verified.every(Boolean) && p.prob2ProofText.trim().length >= 35,
    p.reflection1.trim().length >= 20,
  ];
}

export function evaluateRubricL5(p: Lesson5State): boolean[] {
  return [
    p.examples.length >= 3 && p.squareConceptChoice === 'nonnegative',
    p.prob1Verified.every(Boolean) && p.prob1ProofText.trim().length >= 35,
    p.equalityConditionChecked && p.equalityReason.trim().length >= 15,
    p.prob2Verified.every(Boolean) && p.prob2ProofText.trim().length >= 40,
    p.reflection1.trim().length >= 20,
  ];
}

export function evaluateRubricL6(p: Lesson6State): boolean[] {
  return [
    p.examples.length >= 3 && p.amgmConceptChoice === 'positive',
    p.prob1Verified.every(Boolean) && p.prob1ProofText.trim().length >= 35,
    p.harmonicChecked && p.harmonicReason.trim().length >= 15,
    p.prob2Verified.every(Boolean) && p.prob2ProofText.trim().length >= 40,
    p.reflection1.trim().length >= 20,
  ];
}

export function evaluateRubricL7(p: Lesson7State): boolean[] {
  return [
    p.examples.length >= 3 && p.absSquareConceptChoice === 'square_diff',
    p.prob1Verified.every(Boolean) && p.prob1ProofText.trim().length >= 35,
    p.absDiffChecked && p.absDiffReason.trim().length >= 15,
    p.prob2Verified.every(Boolean) && p.prob2ProofText.trim().length >= 40,
    p.reflection1.trim().length >= 20,
  ];
}

export function validateClaim1(
  scope: string,
  claim: string
): { ok: boolean; message: string; type: 'good' | 'warn' } {
  const txt = claim.trim();
  if (!scope) {
    return {
      ok: false,
      message: '명제의 대상과 범위를 먼저 선택해 주세요.',
      type: 'warn',
    };
  }
  if (txt.length < 12) {
    return {
      ok: false,
      message: '대상(홀수), 연산(제곱), 나누는 수(8), 나머지를 포함하여 더 구체적으로 적어 보세요.',
      type: 'warn',
    };
  }
  if (scope === 'some') {
    return {
      ok: false,
      message: '현재의 계산 사례는 일부에 대한 관찰입니다. 이제 모든 홀수에 대해 성립할지도 추측해 보세요.',
      type: 'warn',
    };
  }
  const hasKeywords = ['홀수', '제곱', '8'].every((v) => txt.includes(v));
  if (!hasKeywords) {
    return {
      ok: false,
      message: '‘홀수’, ‘제곱’, ‘8’을 포함해 주장할 대상을 분명히 해 보세요.',
      type: 'warn',
    };
  }
  return {
    ok: true,
    message: '추측을 보편 명제의 형태로 적었습니다. 아직 증명된 것은 아닙니다.',
    type: 'good',
  };
}

export function cleanStudentState(raw: unknown): StudentRecord {
  if (!raw || typeof raw !== 'object') {
    throw new Error('이 통합 활동지의 결과 파일이 아닙니다.');
  }
  const x = raw as Record<string, unknown>;
  if (
    x.kind !== 'proof2lesson-v1' ||
    typeof x.l1 !== 'object' ||
    x.l1 === null ||
    typeof x.l2 !== 'object' ||
    x.l2 === null
  ) {
    throw new Error('이 통합 활동지의 결과 파일이 아닙니다.');
  }
  const l1 = x.l1 as Record<string, unknown>;
  const l2 = x.l2 as Record<string, unknown>;
  if (!Array.isArray(l1.examples) || !Array.isArray(l2.examples)) {
    throw new Error('이 통합 활동지의 결과 파일이 아닙니다.');
  }
  if (
    typeof x.code !== 'string' ||
    x.code.length > 25 ||
    typeof x.group !== 'string' ||
    x.group.length > 25
  ) {
    throw new Error('학생 식별정보가 올바르지 않습니다.');
  }
  const base = createInitialStudentState();
  const rawL3 = (x.l3 && typeof x.l3 === 'object' ? x.l3 : {}) as Partial<Lesson3State>;
  const rawL4 = (x.l4 && typeof x.l4 === 'object' ? x.l4 : {}) as Partial<Lesson4State>;
  const rawL5 = (x.l5 && typeof x.l5 === 'object' ? x.l5 : {}) as Partial<Lesson5State>;
  const rawL6 = (x.l6 && typeof x.l6 === 'object' ? x.l6 : {}) as Partial<Lesson6State>;
  const rawL7 = (x.l7 && typeof x.l7 === 'object' ? x.l7 : {}) as Partial<Lesson7State>;

  const cleanedResult: StudentRecord = {
    ...base,
    ...(x as Partial<StudentRecord>),
    l1: {
      ...base.l1,
      ...(l1 as Partial<Lesson1State>),
    },
    l2: {
      ...base.l2,
      ...(l2 as Partial<Lesson2State>),
      counter: l2.counter !== undefined && l2.counter !== null ? String(l2.counter) : '',
    },
    l3: {
      ...base.l3,
      ...rawL3,
      parityExamples: Array.isArray(rawL3.parityExamples) ? rawL3.parityExamples : base.l3.parityExamples,
      prob1Choices: Array.isArray(rawL3.prob1Choices) && rawL3.prob1Choices.length === 4 ? rawL3.prob1Choices : base.l3.prob1Choices,
      prob1Verified: Array.isArray(rawL3.prob1Verified) && rawL3.prob1Verified.length === 4 ? rawL3.prob1Verified : base.l3.prob1Verified,
      prob1Hints: Array.isArray(rawL3.prob1Hints) && rawL3.prob1Hints.length === 4 ? rawL3.prob1Hints : base.l3.prob1Hints,
      mod3Examples: Array.isArray(rawL3.mod3Examples) ? rawL3.mod3Examples : base.l3.mod3Examples,
      prob2Choices: Array.isArray(rawL3.prob2Choices) && rawL3.prob2Choices.length === 4 ? rawL3.prob2Choices : base.l3.prob2Choices,
      prob2Verified: Array.isArray(rawL3.prob2Verified) && rawL3.prob2Verified.length === 4 ? rawL3.prob2Verified : base.l3.prob2Verified,
      prob2Hints: Array.isArray(rawL3.prob2Hints) && rawL3.prob2Hints.length === 4 ? rawL3.prob2Hints : base.l3.prob2Hints,
    },
    l4: {
      ...base.l4,
      ...rawL4,
      fractionExamples: Array.isArray(rawL4.fractionExamples) ? rawL4.fractionExamples : base.l4.fractionExamples,
      prob1Choices: Array.isArray(rawL4.prob1Choices) && rawL4.prob1Choices.length === 4 ? rawL4.prob1Choices : base.l4.prob1Choices,
      prob1Verified: Array.isArray(rawL4.prob1Verified) && rawL4.prob1Verified.length === 4 ? rawL4.prob1Verified : base.l4.prob1Verified,
      prob1Hints: Array.isArray(rawL4.prob1Hints) && rawL4.prob1Hints.length === 4 ? rawL4.prob1Hints : base.l4.prob1Hints,
      prob2Choices: Array.isArray(rawL4.prob2Choices) && rawL4.prob2Choices.length === 4 ? rawL4.prob2Choices : base.l4.prob2Choices,
      prob2Verified: Array.isArray(rawL4.prob2Verified) && rawL4.prob2Verified.length === 4 ? rawL4.prob2Verified : base.l4.prob2Verified,
      prob2Hints: Array.isArray(rawL4.prob2Hints) && rawL4.prob2Hints.length === 4 ? rawL4.prob2Hints : base.l4.prob2Hints,
    },
    l5: {
      ...base.l5,
      ...rawL5,
      examples: Array.isArray(rawL5.examples) ? rawL5.examples : base.l5.examples,
      prob1Choices: Array.isArray(rawL5.prob1Choices) && rawL5.prob1Choices.length === 4 ? rawL5.prob1Choices : base.l5.prob1Choices,
      prob1Verified: Array.isArray(rawL5.prob1Verified) && rawL5.prob1Verified.length === 4 ? rawL5.prob1Verified : base.l5.prob1Verified,
      prob1Hints: Array.isArray(rawL5.prob1Hints) && rawL5.prob1Hints.length === 4 ? rawL5.prob1Hints : base.l5.prob1Hints,
      prob2Choices: Array.isArray(rawL5.prob2Choices) && rawL5.prob2Choices.length === 4 ? rawL5.prob2Choices : base.l5.prob2Choices,
      prob2Verified: Array.isArray(rawL5.prob2Verified) && rawL5.prob2Verified.length === 4 ? rawL5.prob2Verified : base.l5.prob2Verified,
      prob2Hints: Array.isArray(rawL5.prob2Hints) && rawL5.prob2Hints.length === 4 ? rawL5.prob2Hints : base.l5.prob2Hints,
    },
    l6: {
      ...base.l6,
      ...rawL6,
      examples: Array.isArray(rawL6.examples) ? rawL6.examples : base.l6.examples,
      prob1Choices: Array.isArray(rawL6.prob1Choices) && rawL6.prob1Choices.length === 4 ? rawL6.prob1Choices : base.l6.prob1Choices,
      prob1Verified: Array.isArray(rawL6.prob1Verified) && rawL6.prob1Verified.length === 4 ? rawL6.prob1Verified : base.l6.prob1Verified,
      prob1Hints: Array.isArray(rawL6.prob1Hints) && rawL6.prob1Hints.length === 4 ? rawL6.prob1Hints : base.l6.prob1Hints,
      prob2Choices: Array.isArray(rawL6.prob2Choices) && rawL6.prob2Choices.length === 4 ? rawL6.prob2Choices : base.l6.prob2Choices,
      prob2Verified: Array.isArray(rawL6.prob2Verified) && rawL6.prob2Verified.length === 4 ? rawL6.prob2Verified : base.l6.prob2Verified,
      prob2Hints: Array.isArray(rawL6.prob2Hints) && rawL6.prob2Hints.length === 4 ? rawL6.prob2Hints : base.l6.prob2Hints,
    },
    l7: {
      ...base.l7,
      ...rawL7,
      examples: Array.isArray(rawL7.examples) ? rawL7.examples : base.l7.examples,
      prob1Choices: Array.isArray(rawL7.prob1Choices) && rawL7.prob1Choices.length === 4 ? rawL7.prob1Choices : base.l7.prob1Choices,
      prob1Verified: Array.isArray(rawL7.prob1Verified) && rawL7.prob1Verified.length === 4 ? rawL7.prob1Verified : base.l7.prob1Verified,
      prob1Hints: Array.isArray(rawL7.prob1Hints) && rawL7.prob1Hints.length === 4 ? rawL7.prob1Hints : base.l7.prob1Hints,
      prob2Choices: Array.isArray(rawL7.prob2Choices) && rawL7.prob2Choices.length === 4 ? rawL7.prob2Choices : base.l7.prob2Choices,
      prob2Verified: Array.isArray(rawL7.prob2Verified) && rawL7.prob2Verified.length === 4 ? rawL7.prob2Verified : base.l7.prob2Verified,
      prob2Hints: Array.isArray(rawL7.prob2Hints) && rawL7.prob2Hints.length === 4 ? rawL7.prob2Hints : base.l7.prob2Hints,
    },
  };

  if (x.evaluation && typeof x.evaluation === 'object') {
    ensureTeacherEval(cleanedResult);
  }
  return cleanedResult;
}

export function ensureTeacherEval(
  x: StudentRecord,
  targetCriteriaCount: number = EVAL_CRITERIA.length
): TeacherEvaluation {
  if (!x.evaluation || typeof x.evaluation !== 'object') {
    x.evaluation = {
      scores: Array(targetCriteriaCount).fill(null),
      feedback: '',
      nextStep: '',
      evaluatedLessonCount: targetCriteriaCount,
    };
  }
  if (!Array.isArray(x.evaluation.scores)) {
    x.evaluation.scores = Array(targetCriteriaCount).fill(null);
  } else if (x.evaluation.scores.length < targetCriteriaCount) {
    // Preserve previous lesson count if it was evaluated under an older curriculum (e.g., 4 lessons)
    if (
      x.evaluation.evaluatedLessonCount === undefined &&
      x.evaluation.scores.some((s) => typeof s === 'number')
    ) {
      x.evaluation.evaluatedLessonCount = x.evaluation.scores.length;
    }
    const padded = [...x.evaluation.scores];
    while (padded.length < targetCriteriaCount) {
      padded.push(null);
    }
    x.evaluation.scores = padded;
  }
  if (typeof x.evaluation.feedback !== 'string') {
    x.evaluation.feedback = '';
  }
  if (typeof x.evaluation.nextStep !== 'string') {
    x.evaluation.nextStep = '';
  }
  return x.evaluation;
}

export function csvSafe(v: unknown): string {
  let x = String(v ?? '').replace(/\r\n?/g, '\n');
  if (/^\s*[=+\-@]/.test(x)) {
    x = "'" + x;
  }
  return '"' + x.replace(/"/g, '""') + '"';
}

export function filenameSafe(x: string): string {
  return (
    String(x || '미입력')
      .replace(/[^0-9a-zA-Z가-힣_\-]/g, '_')
      .slice(0, 30) || '미입력'
  );
}

export function studentKey(x: { group?: string; code?: string }): string {
  return `${(x.group || '').trim()}::${(x.code || '').trim()}`;
}

export function createSampleTeacherDataset(): StudentRecord[] {
  const s1 = createInitialStudentState();
  s1.group = '1학년 3반';
  s1.code = '10301';
  s1.updatedAt = '2026-10-18T09:15:00.000Z';
  s1.l1 = {
    examples: [calc1(-3), calc1(1), calc1(3), calc1(5), calc1(9)],
    claim: '모든 홀수 n에 대하여 n을 제곱한 수를 8로 나눈 나머지는 항상 1이다.',
    scope: 'all',
    claimChecked: true,
    checks: [calc1(-21), calc1(17), calc1(99)],
    limits: '홀수는 무한히 많기 때문에 몇 개만 계산해 본 것으로는 모든 홀수에서 참이라고 장담할 수 없다.',
    proofChoices: [1, 0, 1, 2],
    proofVerified: [true, true, true, true],
    proofHints: [0, 1, 0, 0],
    proofText:
      '임의의 홀수 n을 n=2k+1(k는 정수)이라 하면 n²-1 = (2k+1)²-1 = 4k²+4k = 4k(k+1)이다. 연속하는 두 정수 k, k+1 중 하나는 반드시 짝수이므로 k(k+1)=2t(t는 정수)로 놓을 수 있다. 따라서 n²-1 = 8t이므로 모든 홀수 n에 대하여 n²을 8로 나눈 나머지는 1이다.',
    reflection:
      '구체적인 숫자를 대입하는 것은 규칙을 추측하는 데 도움을 주지만, 문자를 사용한 일반적 증명을 해야만 모든 홀수에 대해 참임을 확신할 수 있다.',
    bridge: '16으로 나누면 n=3일 때 9÷16의 나머지가 9가 되어 성립하지 않을 것 같다.',
  };
  s1.l2 = {
    topic: 'a',
    customStatement: '',
    customScope: '',
    examples: [
      calc2('a', 1)!,
      calc2('a', 3)!,
      calc2('a', 5)!,
      calc2('a', 7)!,
      calc2('a', -3)!,
    ],
    checks: [calc2('a', 3)!, calc2('a', 5)!],
    guess: 'n=1, 7에서는 나머지가 1이지만 n=3, 5에서는 나머지가 9가 나오므로 거짓이다.',
    decision: 'false',
    decisionChecked: true,
    counter: '3',
    counterReason:
      'n=3은 홀수이므로 명제의 가정을 만족한다. 그런데 3² = 9이고, 9를 16으로 나눈 나머지는 9이므로 나머지가 1이라는 결론이 성립하지 않는다.',
    proofText: '',
    hintLevel: 0,
    share: '홀수의 제곱을 16으로 나눈 나머지는 1 또는 9가 나오므로 명제는 거짓이며 반례는 n=3이다.',
    peer: '10302',
    peerComment: '반례 n=3이 홀수 조건을 만족하고 계산도 정확해요.',
    revision: '음의 홀수 n=-3일 때도 나머지가 9임을 추가 확인했다.',
    reflection: '1차시에서는 참인 명제를 증명했고, 2차시에서는 조건이 바뀌었을 때 반례 단 하나로 거짓임을 입증했다.',
    nextQuestion: '나머지가 1이 되는 홀수(1, 7, 9, 15...)들은 어떤 공통 성질이 있을까?',
  };
  s1.l3 = {
    parityExamples: [calc3Parity(1), calc3Parity(2), calc3Parity(3), calc3Parity(4)],
    contrapositiveChoice: 'contrapositive',
    step1HintLevel: 1,
    prob1Choices: [1, 1, 0, 1],
    prob1Verified: [true, true, true, true],
    prob1Hints: [0, 0, 1, 0],
    prob1ProofText:
      '주어진 명제의 대우는 ‘자연수 n에 대하여 n이 홀수이면 n²도 홀수이다.’이다. n이 홀수이면 n=2k-1(k는 자연수)로 나타낼 수 있다. 이때 n²=(2k-1)²=4k²-4k+1=2(2k²-2k+1)-1이므로 n²도 홀수이다. 따라서 주어진 명제의 대우가 참이므로 주어진 명제도 참이다.',
    mod3Examples: [calc3Mod3(1), calc3Mod3(2), calc3Mod3(3), calc3Mod3(4)],
    mod3CasesChecked: true,
    step3HintLevel: 1,
    prob2Choices: [1, 1, 0, 1],
    prob2Verified: [true, true, true, true],
    prob2Hints: [0, 1, 1, 0],
    prob2ProofText:
      '주어진 명제의 대우는 ‘자연수 n에 대하여 n이 3의 배수가 아니면 n²도 3의 배수가 아니다.’이다. n이 3의 배수가 아니면 자연수 k에 대하여 n=3k-2 또는 n=3k-1로 나타낼 수 있다. (i) n=3k-2일 때 n²=3(3k²-4k+1)+1이고, (ii) n=3k-1일 때 n²=3(3k²-2k)+1이므로 두 경우 모두 n²은 3의 배수가 아니다. 따라서 대우가 참이므로 주어진 명제도 참이다.',
    reflection1: 'n²의 조건에서 출발하면 제곱근이 생겨 식을 세우기 어렵지만, 대우를 쓰면 n의 조건에서 출발하여 제곱 전개로 쉽게 증명할 수 있었다.',
    reflection2: '2의 배수는 나머지가 1인 한 가지만 확인하면 되지만, 3의 배수가 아닌 경우는 나머지가 1일 때와 2일 때 두 가지로 나누어 모두 확인해야 한다.',
  };
  s1.l4 = {
    fractionExamples: [calc4Coprime(1, 1), calc4Coprime(2, 3), calc4Coprime(5, 7)],
    contradictionConceptChecked: true,
    step1HintLevel: 1,
    prob1Choices: [1, 1, 0, 0],
    prob1Verified: [true, true, true, true],
    prob1Hints: [0, 0, 1, 0],
    prob1ProofText:
      '명제를 부정하여 √2가 유리수라 하면, 서로소인 두 자연수 m과 n에 대하여 √2 = n/m으로 나타낼 수 있다. 양변을 제곱하면 n² = 2m²이므로 n²이 짝수이고 n도 짝수이다. n=2k(k는 자연수)를 대입하면 4k² = 2m², 즉 m² = 2k²이므로 m²이 짝수이고 m도 짝수이다. 그런데 m과 n이 모두 짝수이므로 서로소임에 모순이다. 따라서 √2는 유리수가 아니다.',
    closureChecked: true,
    closureReason: '유리수끼리 뺄셈을 한 결과는 항상 유리수이므로 r - 1도 반드시 유리수가 된다.',
    step3HintLevel: 0,
    prob2Choices: [0, 1, 0, 0],
    prob2Verified: [true, true, true, true],
    prob2Hints: [0, 0, 0, 0],
    prob2ProofText:
      '명제를 부정하여 1+√2가 유리수라 하면, 유리수 r에 대하여 1+√2 = r, 즉 √2 = r-1로 나타낼 수 있다. 이때 r과 1이 모두 유리수이므로 r-1도 유리수이다. 그런데 좌변의 √2는 유리수가 아니므로 모순이다. 따라서 1+√2는 유리수가 아니다.',
    reflection1: '직접 유리수가 아님을 보이기 어려울 때 결론을 부정하여 유리수라고 가정하면 분수나 등식으로 정리할 수 있어 모순을 명확히 이끌어낼 수 있었다.',
    reflection2: '1~4차시를 통해 직접 증명, 반례 찾기, 대우 증명, 귀류법을 모두 경험하며 명제의 형태에 맞는 최적의 증명 전략을 선택하는 법을 배웠다.',
  };
  s1.l5 = {
    examples: [calc5Inequality(0, 0), calc5Inequality(2, 1), calc5Inequality(-1, 2)],
    squareConceptChoice: 'nonnegative',
    step1HintLevel: 0,
    prob1Choices: [0, 1, 0, 1],
    prob1Verified: [true, true, true, true],
    prob1Hints: [0, 0, 0, 0],
    prob1ProofText:
      'a² + b² - ab = (a - b/2)² + (3/4)b²이다. a와 b가 실수이므로 (a - b/2)² ≥ 0, (3/4)b² ≥ 0이다. 따라서 a² + b² - ab ≥ 0이므로 a² + b² ≥ ab가 성립한다. 여기서 등호는 a - b/2 = 0이고 b = 0일 때, 즉 a = b = 0일 때 성립한다.',
    equalityConditionChecked: true,
    equalityReason: '실수의 제곱의 합 X² + Y² = 0이 성립하려면 X = 0이고 동시에 Y = 0이어야 하기 때문이다.',
    step3HintLevel: 0,
    prob2Choices: [0, 1, 1, 1],
    prob2Verified: [true, true, true, true],
    prob2Hints: [0, 0, 0, 0],
    prob2ProofText:
      '(1) (a+b)² - 4ab = a² - 2ab + b² = (a-b)² ≥ 0이므로 (a+b)² ≥ 4ab가 성립하며, 등호는 a=b일 때 성립한다. (2) a² - 4ab + 5b² = (a-2b)² + b² ≥ 0이므로 부등식이 성립하며, 등호는 a-2b=0이고 b=0, 즉 a=b=0일 때 성립한다.',
    reflection1: '복잡한 이차식도 완전제곱식들의 합으로 변형하면 실수의 제곱이 0 이상이라는 성질로 명쾌하게 증명할 수 있었다.',
    reflection2: '(a-b)² ≥ 0은 a=b인 모든 실수에서 등호가 성립하지만, (a-2b)² + b² ≥ 0은 두 제곱식이 모두 0이어야 해서 a=b=0일 때만 등호가 성립한다.',
  };
  s1.l6 = {
    examples: [calc6Means(4, 4), calc6Means(1, 9), calc6Means(2, 8)],
    amgmConceptChoice: 'positive',
    step1HintLevel: 0,
    prob1Choices: [0, 1, 0, 1],
    prob1Verified: [true, true, true, true],
    prob1Hints: [0, 0, 0, 0],
    prob1ProofText:
      'a > 0, b > 0일 때 (a+b)/2 - √(ab) = ((√a)² - 2√a√b + (√b)²)/2 = (√a - √b)²/2 ≥ 0이다. 따라서 (a+b)/2 ≥ √(ab)가 성립하며, 등호는 √a = √b, 즉 a = b일 때 성립한다.',
    harmonicChecked: true,
    harmonicReason: '두 양수의 곱이 일정하게 약분되거나 산술·기하평균 부등식의 양변에 양수를 곱해 조화평균 관계를 유도할 수 있다.',
    step3HintLevel: 0,
    prob2Choices: [0, 0, 0, 0],
    prob2Verified: [true, true, true, true],
    prob2Hints: [0, 0, 0, 0],
    prob2ProofText:
      '(1) a > 0이면 1/a > 0이므로 산술평균과 기하평균의 관계에 의해 a + 1/a ≥ 2√(a · 1/a) = 2이고, 등호는 a = 1/a 즉 a = 1일 때 성립한다. (2) √(ab) - 2ab/(a+b) = √(ab)(√a - √b)²/(a+b) ≥ 0이므로 √(ab) ≥ 2ab/(a+b)가 성립하며 등호는 a = b일 때 성립한다.',
    reflection1: '양수 조건이 있기 때문에 a = (√a)², b = (√b)²으로 바꾸어 완전제곱식을 만들 수 있다는 점이 핵심이었다.',
    reflection2: '산술평균 ≥ 기하평균 ≥ 조화평균의 크기가 항상 성립하고 등호는 모두 a = b일 때 성립함을 확인했다.',
  };
  s1.l7 = {
    examples: [calc7Abs(2, 3), calc7Abs(2, -3), calc7Abs(-2, -3)],
    absSquareConceptChoice: 'square_diff',
    step1HintLevel: 0,
    prob1Choices: [0, 0, 0, 0],
    prob1Verified: [true, true, true, true],
    prob1Hints: [0, 0, 0, 0],
    prob1ProofText:
      '(|a| + |b|)² - |a + b|² = (a² + 2|ab| + b²) - (a² + 2ab + b²) = 2(|ab| - ab)이다. 이때 |ab| ≥ ab이므로 2(|ab| - ab) ≥ 0이다. 따라서 |a + b|² ≤ (|a| + |b|)²이고 양변이 모두 0 이상이므로 |a + b| ≤ |a| + |b|가 성립한다. 등호는 |ab| = ab, 즉 ab ≥ 0일 때 성립한다.',
    absDiffChecked: true,
    absDiffReason: '|a| < |b|이면 좌변이 음수이고 우변은 0 이상이므로 제곱하지 않아도 성립하고, |a| ≥ |b|일 때만 양변이 0 이상이므로 제곱하여 비교한다.',
    step3HintLevel: 0,
    prob2Choices: [0, 0, 0, 0],
    prob2Verified: [true, true, true, true],
    prob2Hints: [0, 0, 0, 0],
    prob2ProofText:
      '(1) (|a|+|b|)² - |a-b|² = 2(|ab| + ab) ≥ 0이므로 |a-b| ≤ |a|+|b|가 성립하며, 등호는 |ab| = -ab 즉 ab ≤ 0일 때 성립한다. (2) |a| < |b|이면 |a|-|b| < 0 ≤ |a-b|로 성립하고, |a| ≥ |b|이면 |a-b|² - (|a|-|b|)² = 2(|ab| - ab) ≥ 0이므로 성립한다. 등호는 ab ≥ 0이고 |a| ≥ |b|일 때 성립한다.',
    reflection1: '절댓값 기호가 있어 직접 빼기 어려울 때 양변이 0 이상임을 확인하고 제곱의 차를 이용하면 절댓값 기호가 제곱으로 풀려 쉽게 증명할 수 있었다.',
    reflection2: '|a+b| ≤ |a|+|b|는 ab ≥ 0일 때 등호가 성립하고, |a-b| ≤ |a|+|b|는 ab ≤ 0일 때 등호가 성립한다는 부호의 차이를 명확히 이해했다.',
  };
  s1.teacherMemo = '1~7차시 모든 증명 기법(직접증명, 반례, 대우법, 귀류법, 절대부등식 1·2·3)을 완벽하게 연결하여 서술함. (5~7차시 추가 항목 평정 진행 중)';
  s1.evaluation = {
    scores: [3, 3, 3, 3, null, null, null],
    feedback: '관찰에서 추측, 반례 검증, 대우법·귀류법까지 논리적 연결이 매우 탄탄합니다. 새로 추가된 5~7차시 절대부등식 평정이 진행 중입니다.',
    nextStep: '코시-슈바르츠 부등식 (a²+b²)(x²+y²) ≥ (ax+by)²도 완전제곱식을 이용해 직접 증명해 보세요.',
    evaluatedLessonCount: 4,
  };

  const s2 = createInitialStudentState();
  s2.group = '1학년 3반';
  s2.code = '10302';
  s2.updatedAt = '2026-10-18T09:20:00.000Z';
  s2.l1 = {
    examples: [calc1(-5), calc1(-1), calc1(3), calc1(7)],
    claim: '모든 홀수를 제곱하여 8로 나누면 나머지가 1이다.',
    scope: 'all',
    claimChecked: true,
    checks: [calc1(-15), calc1(25), calc1(101)],
    limits: '아무리 많은 홀수를 넣어 봐도 아직 안 넣어 본 홀수 중에 반례가 숨어 있을 수 있기 때문이다.',
    proofChoices: [1, 0, 1, 2],
    proofVerified: [true, true, true, true],
    proofHints: [1, 1, 0, 1],
    proofText:
      '홀수 n=2k+1로 두면 n²-1 = 4k(k+1)이고, k(k+1)은 연속한 두 정수의 곱이라 2의 배수이다. 따라서 4k(k+1)은 8의 배수이므로 나머지는 항상 1이다.',
    reflection: '처음에는 4개만 해 보고 당연하다고 생각했는데, 문자 k로 나타내어 증명하니 왜 8의 배수가 되는지 구조가 보였다.',
    bridge: '짝수의 곱이나 연속한 세 정수의 곱도 비슷한 성질이 있을지 궁금하다.',
  };
  s2.l2 = {
    topic: 'b',
    customStatement: '',
    customScope: '',
    examples: [
      calc2('b', 0)!,
      calc2('b', 2)!,
      calc2('b', 4)!,
      calc2('b', 6)!,
      calc2('b', -4)!,
    ],
    checks: [calc2('b', -10)!, calc2('b', 12)!],
    guess: '모든 사례에서 8로 나누어떨어지므로 참이라고 추측한다.',
    decision: 'true',
    decisionChecked: true,
    counter: '',
    counterReason: '',
    proofText:
      '임의의 짝수 n을 n=2k(k는 정수)라 하면 연속하는 다음 짝수는 n+2=2k+2=2(k+1)이다. 두 수의 곱은 n(n+2) = 2k × 2(k+1) = 4k(k+1)이다. 이때 k와 k+1은 연속하는 두 정수이므로 둘 중 하나는 짝수이다. 따라서 k(k+1)=2m(m은 정수)이라 하면 n(n+2)=8m이므로 항상 8의 배수이다.',
    hintLevel: 1,
    share: '연속하는 두 짝수의 곱 n(n+2)를 4k(k+1)로 변형하여 8의 배수임을 증명했다.',
    peer: '10301',
    peerComment: '1차시에서 배운 k(k+1)이 짝수라는 성질을 그대로 활용해서 이해하기 쉬웠어요.',
    revision: 'm이 정수라는 조건을 명확히 추가했다.',
    reflection: '1차시 증명에서 사용한 연속한 두 정수의 곱 아이디어를 2차시 새로운 명제 증명에 스스로 적용할 수 있었다.',
    nextQuestion: '연속하는 세 짝수의 곱은 항상 몇의 배수일까? (24의 배수인지 탐구)',
  };
  s2.l3 = {
    parityExamples: [calc3Parity(1), calc3Parity(3), calc3Parity(5)],
    contrapositiveChoice: 'contrapositive',
    step1HintLevel: 1,
    prob1Choices: [1, 1, 0, 1],
    prob1Verified: [true, true, true, true],
    prob1Hints: [1, 0, 1, 0],
    prob1ProofText:
      '명제의 대우는 자연수 n에 대하여 n이 홀수이면 n²도 홀수이다. n=2k-1(k는 자연수)이라 하면 n²=4k²-4k+1=2(2k²-2k+1)-1이므로 홀수이다. 대우가 참이므로 원래 명제도 참이다.',
    mod3Examples: [calc3Mod3(1), calc3Mod3(2), calc3Mod3(4)],
    mod3CasesChecked: true,
    step3HintLevel: 2,
    prob2Choices: [1, 1, 0, 1],
    prob2Verified: [true, true, true, true],
    prob2Hints: [1, 1, 1, 0],
    prob2ProofText:
      '대우는 자연수 n에 대하여 n이 3의 배수가 아니면 n²도 3의 배수가 아니다. n=3k-2이면 n²=3(3k²-4k+1)+1이고 n=3k-1이면 n²=3(3k²-2k)+1이므로 둘 다 3의 배수가 아니다. 따라서 대우가 참이므로 주어진 명제도 참이다.',
    reflection1: '대우를 이용하면 결론을 부정한 조건에서 식을 시작할 수 있어서 편리했다.',
    reflection2: '3의 배수가 아닌 수는 나머지가 1과 2인 두 경우로 나누어 빠짐없이 조사해야 했다.',
  };
  s2.teacherMemo = '1~4차시 평가 완료 후 5~7차시 절대부등식 차시가 추가되어 추가 평가 진행 중.';
  s2.evaluation = {
    scores: [3, 2, 3, 3, null, null, null],
    feedback: '대우를 이용한 두 가지 증명을 경우 나누기까지 정확하게 수행했습니다.',
    nextStep: '4차시 귀류법과 5~7차시 절대부등식 증명을 이어서 완성해 보세요.',
    evaluatedLessonCount: 4,
  };

  return [s1, s2];
}

export interface MathSymbolItem {
  label: string;
  token: string;
  desc: string;
  shorthand?: string;
  isTemplate?: boolean;
}

export type MathSymbolCategoryId =
  | 'recommended'
  | 'inequality'
  | 'power_root'
  | 'abs_op'
  | 'logic_set'
  | 'greek_var';

export interface MathSymbolCategory {
  id: MathSymbolCategoryId;
  name: string;
  shortName: string;
  items: MathSymbolItem[];
}

export const LESSON_RECOMMENDED_SYMBOLS: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, MathSymbolItem[]> = {
  1: [
    { label: '²', token: '²', desc: '제곱', shorthand: '^2' },
    { label: '(□)²', token: '(□)²', desc: '선택한 식을 괄호 제곱으로 감싸기', isTemplate: true },
    { label: '2k+1', token: '2k+1', desc: '홀수 일반항 표현', isTemplate: true },
    { label: '(2k+1)²', token: '(2k+1)²', desc: '홀수의 제곱', isTemplate: true },
    { label: '4k(k+1)+1', token: '4k(k+1)+1', desc: '홀수 제곱 전개식', isTemplate: true },
    { label: '8m+1', token: '8m+1', desc: '8로 나눈 나머지 1 표현', isTemplate: true },
    { label: '=', token: ' = ', desc: '등호' },
    { label: '≠', token: ' ≠ ', desc: '같지 않다', shorthand: '!=' },
    { label: '∴', token: '∴ ', desc: '따라서', shorthand: ':.' },
    { label: '∵', token: '∵ ', desc: '왜냐하면', shorthand: 'because' },
  ],
  2: [
    { label: '²', token: '²', desc: '제곱', shorthand: '^2' },
    { label: '(□)²', token: '(□)²', desc: '선택한 식을 괄호 제곱으로 감싸기', isTemplate: true },
    { label: '2k', token: '2k', desc: '짝수 일반항', isTemplate: true },
    { label: '4k(k+1)', token: '4k(k+1)', desc: '연속한 두 짝수의 곱', isTemplate: true },
    { label: '=', token: ' = ', desc: '등호' },
    { label: '≠', token: ' ≠ ', desc: '같지 않다 (반례)', shorthand: '!=' },
    { label: '≥', token: ' ≥ ', desc: '크거나 같다', shorthand: '>=' },
    { label: '≤', token: ' ≤ ', desc: '작거나 같다', shorthand: '<=' },
    { label: '∴', token: '∴ ', desc: '따라서', shorthand: ':.' },
    { label: '⇒', token: ' ⇒ ', desc: '이면 (함의)', shorthand: '=>' },
  ],
  3: [
    { label: '→', token: ' → ', desc: '명제 화살표 (p → q)', shorthand: '->' },
    { label: '~q → ~p', token: '~q → ~p', desc: '명제의 대우', isTemplate: true },
    { label: '²', token: '²', desc: '제곱', shorthand: '^2' },
    { label: '2k−1', token: '2k−1', desc: '홀수 표현 (k는 자연수)', isTemplate: true },
    { label: '3k−1', token: '3k−1', desc: '3으로 나눈 나머지가 2인 자연수', isTemplate: true },
    { label: '3k−2', token: '3k−2', desc: '3으로 나눈 나머지가 1인 자연수', isTemplate: true },
    { label: '=', token: ' = ', desc: '등호' },
    { label: '≠', token: ' ≠ ', desc: '같지 않다', shorthand: '!=' },
    { label: '⇔', token: ' ⇔ ', desc: '동치', shorthand: '<=>' },
    { label: '∴', token: '∴ ', desc: '따라서', shorthand: ':.' },
  ],
  4: [
    { label: '√2', token: '√2', desc: '루트 2', isTemplate: true },
    { label: '√(□)', token: '√(□)', desc: '제곱근 감싸기', shorthand: 'sqrt(', isTemplate: true },
    { label: '1+√2', token: '1+√2', desc: '1 더하기 루트 2', isTemplate: true },
    { label: 'n/m', token: 'n/m', desc: '기약분수 표현', isTemplate: true },
    { label: 'n² = 2m²', token: 'n² = 2m²', desc: '양변 제곱 정리식', isTemplate: true },
    { label: '²', token: '²', desc: '제곱', shorthand: '^2' },
    { label: '∈', token: ' ∈ ', desc: '원소이다' },
    { label: '∉', token: ' ∉ ', desc: '원소가 아니다' },
    { label: '≠', token: ' ≠ ', desc: '같지 않다', shorthand: '!=' },
    { label: '∴', token: '∴ ', desc: '따라서', shorthand: ':.' },
  ],
  5: [
    { label: '≥', token: ' ≥ ', desc: '크거나 같다 (이상)', shorthand: '>=' },
    { label: '≤', token: ' ≤ ', desc: '작거나 같다 (이하)', shorthand: '<=' },
    { label: '²', token: '²', desc: '제곱', shorthand: '^2' },
    { label: '(□)²', token: '(□)²', desc: '완전제곱식 감싸기', isTemplate: true },
    { label: '(a−b/2)²', token: '(a−b/2)²', desc: '예제3 완전제곱 항', isTemplate: true },
    { label: '(3/4)b²', token: '(3/4)b²', desc: '예제3 나머지 제곱 항', isTemplate: true },
    { label: '(a−b)² ≥ 0', token: '(a−b)² ≥ 0', desc: '실수의 제곱 성질', isTemplate: true },
    { label: '(a−2b)²+b²', token: '(a−2b)²+b²', desc: '문제3-(2) 완전제곱식의 합', isTemplate: true },
    { label: 'a = b = 0', token: 'a = b = 0', desc: '등호 성립 조건', isTemplate: true },
    { label: '∴', token: '∴ ', desc: '따라서', shorthand: ':.' },
  ],
  6: [
    { label: '≥', token: ' ≥ ', desc: '크거나 같다 (이상)', shorthand: '>=' },
    { label: '√(□)', token: '√(□)', desc: '제곱근 감싸기', shorthand: 'sqrt(', isTemplate: true },
    { label: '√(ab)', token: '√(ab)', desc: '기하평균 √(ab)', isTemplate: true },
    { label: '(a+b)/2', token: '(a+b)/2', desc: '산술평균 (a+b)/2', isTemplate: true },
    { label: '(√a−√b)²/2', token: '(√a−√b)²/2', desc: '산술·기하평균의 차 변형식', isTemplate: true },
    { label: '2ab/(a+b)', token: '2ab/(a+b)', desc: '조화평균 2ab/(a+b)', isTemplate: true },
    { label: 'a + 1/a ≥ 2', token: 'a + 1/a ≥ 2', desc: '역수의 합 부등식', isTemplate: true },
    { label: '²', token: '²', desc: '제곱', shorthand: '^2' },
    { label: 'a = b', token: 'a = b', desc: '등호 성립 조건', isTemplate: true },
    { label: '∴', token: '∴ ', desc: '따라서', shorthand: ':.' },
  ],
  7: [
    { label: '|□|', token: '|□|', desc: '절댓값 기호 감싸기', isTemplate: true },
    { label: '≤', token: ' ≤ ', desc: '작거나 같다 (이하)', shorthand: '<=' },
    { label: '≥', token: ' ≥ ', desc: '크거나 같다 (이상)', shorthand: '>=' },
    { label: '²', token: '²', desc: '제곱', shorthand: '^2' },
    { label: '|a+b|', token: '|a+b|', desc: '합의 절댓값', isTemplate: true },
    { label: '|a|+|b|', token: '|a|+|b|', desc: '절댓값의 합', isTemplate: true },
    { label: '|a−b|', token: '|a−b|', desc: '차의 절댓값', isTemplate: true },
    { label: '2(|ab|−ab)', token: '2(|ab|−ab)', desc: '제곱의 차 정리식', isTemplate: true },
    { label: 'ab ≥ 0', token: 'ab ≥ 0', desc: '등호 성립 조건 (같은 부호)', isTemplate: true },
    { label: 'ab ≤ 0', token: 'ab ≤ 0', desc: '등호 성립 조건 (반대 부호)', isTemplate: true },
  ],
};

export const MATH_SYMBOL_CATEGORIES: MathSymbolCategory[] = [
  {
    id: 'inequality',
    name: '부등호 · 등호',
    shortName: '부등호·등호',
    items: [
      { label: '≥', token: ' ≥ ', desc: '크거나 같다 (이상)', shorthand: '>=' },
      { label: '≤', token: ' ≤ ', desc: '작거나 같다 (이하)', shorthand: '<=' },
      { label: '>', token: ' > ', desc: '크다 (초과)' },
      { label: '<', token: ' < ', desc: '작다 (미만)' },
      { label: '=', token: ' = ', desc: '같다 (등호)' },
      { label: '≠', token: ' ≠ ', desc: '같지 않다', shorthand: '!=' },
      { label: '±', token: '±', desc: '플러스마이너스', shorthand: '+-' },
      { label: '≈', token: ' ≈ ', desc: '근사값 (약)' },
      { label: '≡', token: ' ≡ ', desc: '합동 / 항등' },
      { label: '≥ 0', token: ' ≥ 0', desc: '0 이상 (음이 아닌 실수)', isTemplate: true },
      { label: '≤ 0', token: ' ≤ 0', desc: '0 이하', isTemplate: true },
      { label: '= 0', token: ' = 0', desc: '0과 같다', isTemplate: true },
    ],
  },
  {
    id: 'power_root',
    name: '제곱 · 근호 · 분수',
    shortName: '제곱·근호·분수',
    items: [
      { label: '²', token: '²', desc: '제곱 (위첨자 2)', shorthand: '^2' },
      { label: '³', token: '³', desc: '세제곱 (위첨자 3)', shorthand: '^3' },
      { label: 'ⁿ', token: 'ⁿ', desc: 'n제곱 (위첨자 n)', shorthand: '^n' },
      { label: '√(□)', token: '√(□)', desc: '제곱근 감싸기', shorthand: 'sqrt(', isTemplate: true },
      { label: '√', token: '√', desc: '근호 기호' },
      { label: '(□)²', token: '(□)²', desc: '괄호 제곱 감싸기', isTemplate: true },
      { label: '(□)/(□)', token: '(□)/(□)', desc: '분수 틀 삽입', isTemplate: true },
      { label: '□/2', token: '(□)/2', desc: '2로 나눈 분수 (절반)', isTemplate: true },
      { label: '1/a', token: '1/a', desc: 'a의 역수', isTemplate: true },
      { label: '√a', token: '√a', desc: '루트 a', isTemplate: true },
      { label: '√b', token: '√b', desc: '루트 b', isTemplate: true },
      { label: '√(ab)', token: '√(ab)', desc: '루트 ab', isTemplate: true },
    ],
  },
  {
    id: 'abs_op',
    name: '절댓값 · 괄호 · 연산',
    shortName: '절댓값·연산',
    items: [
      { label: '|□|', token: '|□|', desc: '절댓값 감싸기', isTemplate: true },
      { label: '|', token: '|', desc: '절댓값 세로선' },
      { label: '(□)', token: '(□)', desc: '소괄호 감싸기', isTemplate: true },
      { label: '[□]', token: '[□]', desc: '대괄호 감싸기', isTemplate: true },
      { label: '|□|²', token: '|□|²', desc: '절댓값의 제곱 감싸기', isTemplate: true },
      { label: '−', token: ' − ', desc: '뺄셈 (마이너스)' },
      { label: '+', token: ' + ', desc: '덧셈 (플러스)' },
      { label: '×', token: ' × ', desc: '곱셈 기호' },
      { label: '·', token: '·', desc: '가운데점 곱셈' },
      { label: '÷', token: ' ÷ ', desc: '나눗셈 기호' },
      { label: '/', token: '/', desc: '분수 슬래시' },
    ],
  },
  {
    id: 'logic_set',
    name: '논리 · 증명 · 집합',
    shortName: '논리·집합',
    items: [
      { label: '∴', token: '∴ ', desc: '따라서 (결론)', shorthand: ':.' },
      { label: '∵', token: '∵ ', desc: '왜냐하면 (이유)', shorthand: 'because' },
      { label: '⇒', token: ' ⇒ ', desc: '이면 (논리적 함의)', shorthand: '=>' },
      { label: '⇔', token: ' ⇔ ', desc: '동치 (필요충분조건)', shorthand: '<=>' },
      { label: '→', token: ' → ', desc: '화살표 (명제 p → q)', shorthand: '->' },
      { label: '~', token: '~', desc: '부정 (~p)' },
      { label: '∈', token: ' ∈ ', desc: '원소이다 (속한다)' },
      { label: '∉', token: ' ∉ ', desc: '원소가 아니다' },
      { label: '⊂', token: ' ⊂ ', desc: '부분집합이다' },
      { label: '∪', token: ' ∪ ', desc: '합집합' },
      { label: '∩', token: ' ∩ ', desc: '교집합' },
      { label: '∅', token: '∅', desc: '공집합' },
    ],
  },
  {
    id: 'greek_var',
    name: '수식 문자 · 그리스 문자',
    shortName: '문자·그리스',
    items: [
      { label: 'a', token: 'a', desc: '문자 a' },
      { label: 'b', token: 'b', desc: '문자 b' },
      { label: 'c', token: 'c', desc: '문자 c' },
      { label: 'k', token: 'k', desc: '정수/상수 k' },
      { label: 'm', token: 'm', desc: '정수/자연수 m' },
      { label: 'n', token: 'n', desc: '정수/자연수 n' },
      { label: 'x', token: 'x', desc: '미지수 x' },
      { label: 'y', token: 'y', desc: '미지수 y' },
      { label: 'α', token: 'α', desc: '알파 (alpha)' },
      { label: 'β', token: 'β', desc: '베타 (beta)' },
      { label: 'θ', token: 'θ', desc: '세타 (theta)' },
      { label: 'π', token: 'π', desc: '원주율 파이 (pi)' },
      { label: '∞', token: '∞', desc: '무한대' },
    ],
  },
];

export interface MathSymbolInsertionResult {
  nextValue: string;
  nextCursorStart: number;
  nextCursorEnd: number;
}

/**
 * 주관식 입력창의 현재 문자열과 커서/선택 영역(selectionStart, selectionEnd)을 기준으로
 * 수학 기호 또는 템플릿('□' 포함)을 스마트하게 삽입하거나 감싼다.
 */
export function applyMathSymbolInsertion(
  currentValue: string,
  selectionStart: number,
  selectionEnd: number,
  token: string
): MathSymbolInsertionResult {
  const safeStart = Math.max(0, Math.min(selectionStart, currentValue.length));
  const safeEnd = Math.max(safeStart, Math.min(selectionEnd, currentValue.length));
  const before = currentValue.slice(0, safeStart);
  const selected = currentValue.slice(safeStart, safeEnd);
  const after = currentValue.slice(safeEnd);

  const firstBoxIdx = token.indexOf('□');
  if (firstBoxIdx !== -1) {
    if (selected.length > 0) {
      // 첫 번째 □ 자리에 드래그로 선택한 수식을 넣고, 두 번째 □가 있으면 그 위치로 커서를 이동한다.
      const prefix = token.slice(0, firstBoxIdx);
      const restTemplate = token.slice(firstBoxIdx + 1);
      const secondBoxIdx = restTemplate.indexOf('□');
      if (secondBoxIdx !== -1) {
        const middle = restTemplate.slice(0, secondBoxIdx);
        const suffix = restTemplate.slice(secondBoxIdx + 1).replace(/□/g, '');
        const inserted = `${prefix}${selected}${middle}${suffix}`;
        const cursorTarget = before.length + prefix.length + selected.length + middle.length;
        return {
          nextValue: `${before}${inserted}${after}`,
          nextCursorStart: cursorTarget,
          nextCursorEnd: cursorTarget,
        };
      }
      const suffix = restTemplate.replace(/□/g, '');
      const inserted = `${prefix}${selected}${suffix}`;
      const cursorTarget = before.length + inserted.length;
      return {
        nextValue: `${before}${inserted}${after}`,
        nextCursorStart: cursorTarget,
        nextCursorEnd: cursorTarget,
      };
    } else {
      // 선택 영역이 없을 때는 모든 □를 빈칸으로 치환하되, 첫 번째 □ 위치에 커서를 정확히 배치한다.
      const prefix = token.slice(0, firstBoxIdx);
      const suffix = token.slice(firstBoxIdx + 1).replace(/□/g, '');
      const inserted = `${prefix}${suffix}`;
      const cursorTarget = before.length + prefix.length;
      return {
        nextValue: `${before}${inserted}${after}`,
        nextCursorStart: cursorTarget,
        nextCursorEnd: cursorTarget,
      };
    }
  }

  const nextValue = `${before}${token}${after}`;
  const cursorTarget = before.length + token.length;
  return {
    nextValue,
    nextCursorStart: cursorTarget,
    nextCursorEnd: cursorTarget,
  };
}

export const MATH_SHORTHAND_RULES: ReadonlyArray<{
  shorthand: string;
  replacement: string;
  desc: string;
}> = [
  { shorthand: '<=>', replacement: '⇔', desc: '동치' },
  { shorthand: 'because', replacement: '∵', desc: '왜냐하면' },
  { shorthand: 'sqrt(', replacement: '√(', desc: '제곱근' },
  { shorthand: '>=', replacement: '≥', desc: '크거나 같다' },
  { shorthand: '<=', replacement: '≤', desc: '작거나 같다' },
  { shorthand: '!=', replacement: '≠', desc: '같지 않다' },
  { shorthand: '+-', replacement: '±', desc: '플러스마이너스' },
  { shorthand: '^2', replacement: '²', desc: '제곱' },
  { shorthand: '^3', replacement: '³', desc: '세제곱' },
  { shorthand: '^n', replacement: 'ⁿ', desc: 'n제곱' },
  { shorthand: '=>', replacement: '⇒', desc: '이면' },
  { shorthand: '->', replacement: '→', desc: '화살표' },
  { shorthand: ':.', replacement: '∴', desc: '따라서' },
];

export interface MathShorthandConversionResult {
  converted: boolean;
  nextValue: string;
  nextCursorPos: number;
  matchedShorthand?: string;
  replacement?: string;
}

/**
 * PC/노트북 키보드 타이핑 중 커서 직전의 문자열이 수학 단축어('>=', '^2', 'sqrt(' 등)와 일치하면
 * 즉시 유니코드 수학 기호로 변환한 문자열과 새 커서 위치를 반환한다.
 */
export function convertMathShorthand(
  value: string,
  cursorPos: number
): MathShorthandConversionResult {
  const safeCursor = Math.max(0, Math.min(cursorPos, value.length));
  const beforeCursor = value.slice(0, safeCursor);
  const afterCursor = value.slice(safeCursor);

  for (const rule of MATH_SHORTHAND_RULES) {
    if (beforeCursor.endsWith(rule.shorthand)) {
      const prefix = beforeCursor.slice(0, beforeCursor.length - rule.shorthand.length);
      const nextValue = `${prefix}${rule.replacement}${afterCursor}`;
      const nextCursorPos = prefix.length + rule.replacement.length;
      return {
        converted: true,
        nextValue,
        nextCursorPos,
        matchedShorthand: rule.shorthand,
        replacement: rule.replacement,
      };
    }
  }

  return {
    converted: false,
    nextValue: value,
    nextCursorPos: safeCursor,
  };
}

export interface MathTextToken {
  type: 'text' | 'radical';
  /** type === 'text'일 때는 일반 문자열, type === 'radical'일 때는 근호(윗줄) 아래에 들어갈 피개방수(radicand) */
  value: string;
  /** 원본 표현이 √(...) 형태였는지 여부 */
  hasParens?: boolean;
  /** 원본 부분 문자열 */
  raw: string;
}

/**
 * 문자열 내의 루트(근호, √) 수식을 파싱하여 일반 텍스트 토큰과 근호(radical + 윗줄 피개방수) 토큰으로 분리한다.
 * - √(ab), √(a × 1/a), √(□) 등 괄호로 감싸진 경우 괄호 내부 전체를 피개방수(value)로 추출한다.
 * - √2, √2m 등 숫자가 바로 뒤따르는 경우 숫자 부분만 피개방수로 추출하여 √2m이 (√2)m으로 정확히 해석되게 한다.
 * - √a, √b, √ab, √a√b, √□ 등 문자나 빈칸 기호가 뒤따르는 경우 해당 문자/기호를 피개방수로 추출한다.
 */
export function tokenizeMathRadicals(text: string): MathTextToken[] {
  if (!text) return [];
  const normalized = text.replace(/\u0305/g, '');
  if (!normalized.includes('√')) {
    return [{ type: 'text', value: normalized, raw: normalized }];
  }

  const tokens: MathTextToken[] = [];
  let i = 0;
  const len = normalized.length;

  while (i < len) {
    const idx = normalized.indexOf('√', i);
    if (idx === -1) {
      const rest = normalized.slice(i);
      tokens.push({ type: 'text', value: rest, raw: rest });
      break;
    }

    if (idx > i) {
      const before = normalized.slice(i, idx);
      tokens.push({ type: 'text', value: before, raw: before });
    }

    const afterIdx = idx + 1;
    if (afterIdx >= len) {
      tokens.push({ type: 'radical', value: '', hasParens: false, raw: '√' });
      break;
    }

    const nextChar = normalized[afterIdx];

    // 1. √(...) 형태: 짝이 맞는 닫는 괄호 ')'까지를 피개방수로 추출
    if (nextChar === '(') {
      let depth = 1;
      let k = afterIdx + 1;
      let foundClose = -1;
      while (k < len) {
        const ch = normalized[k];
        if (ch === '\n') break;
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0) {
            foundClose = k;
            break;
          }
        }
        k++;
      }

      if (foundClose !== -1) {
        const inner = normalized.slice(afterIdx + 1, foundClose);
        const raw = normalized.slice(idx, foundClose + 1);
        tokens.push({
          type: 'radical',
          value: inner,
          hasParens: true,
          raw,
        });
        i = foundClose + 1;
        continue;
      } else {
        // 아직 닫는 괄호를 입력 중인 경우 (예: '√(ab' 또는 단축어 안내 'sqrt(→√(')
        const unclosedMatch = normalized.slice(afterIdx + 1).match(/^[0-9a-zA-Z□+\-×·*/]+/);
        if (unclosedMatch && unclosedMatch[0].length > 0) {
          const inner = unclosedMatch[0];
          const raw = `√(${inner}`;
          tokens.push({
            type: 'radical',
            value: `(${inner}`,
            hasParens: false,
            raw,
          });
          i = afterIdx + 1 + inner.length;
          continue;
        } else {
          tokens.push({
            type: 'radical',
            value: '(',
            hasParens: false,
            raw: '√(',
          });
          i = afterIdx + 1;
          continue;
        }
      }
    }

    // 2. √2, √1, √2m 형태: 연속된 숫자만 근호 안(피개방수)으로 묶고 뒤따르는 문자(m 등)는 근호 밖에 배치
    const numMatch = normalized.slice(afterIdx).match(/^[0-9]+(?:\.[0-9]+)?/);
    if (numMatch) {
      const digits = numMatch[0];
      tokens.push({
        type: 'radical',
        value: digits,
        hasParens: false,
        raw: `√${digits}`,
      });
      i = afterIdx + digits.length;
      continue;
    }

    // 3. √a, √b, √ab, √a√b, √□ 형태: 연속된 영문자 또는 □를 피개방수로 추출
    const varMatch = normalized.slice(afterIdx).match(/^(?:□|[a-zA-Z]+)/);
    if (varMatch) {
      const vars = varMatch[0];
      tokens.push({
        type: 'radical',
        value: vars,
        hasParens: false,
        raw: `√${vars}`,
      });
      i = afterIdx + vars.length;
      continue;
    }

    // 4. 단독 근호 기호 '√'
    tokens.push({
      type: 'radical',
      value: '',
      hasParens: false,
      raw: '√',
    });
    i = afterIdx;
  }

  return tokens;
}



