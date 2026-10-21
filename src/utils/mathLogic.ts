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

export interface TeacherEvaluation {
  scores: (number | null)[];
  feedback: string;
  nextStep: string;
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

export const STAGE_TITLES = {
  1: ['단서 수집', '가설 수립', '반례 수색', '증명 보고서', '다음 사건 예고'],
  2: ['새 사건 선택', '현장 조사', '반례 수색', '판정서 작성', '수사 결과 공유'],
  3: ['대우 단서 탐색', '문제 1 증명', '3의 배수 탐색', '문제 2 증명', '사건 종결·성찰'],
  4: ['귀류법 단서 탐색', '문제 1 증명 (√2)', '무리수 성질 탐색', '문제 2 증명 (1+√2)', '전체 수사 종결'],
} as const;

export const EVAL_CRITERIA = [
  '규칙 발견·추측',
  '반례 탐색·검증',
  '논리적 정당화',
  '성찰·탐구 확장',
] as const;

export const EVAL_DESCRIPTIONS = [
  '사례의 규칙을 명제로 표현하는 능력',
  '조건에 맞는 반례를 탐색하고 판단하는 능력',
  '문자·정수의 성질 등으로 일반성을 설명하는 능력',
  '한계를 인식하고 탐구를 수정·확장하는 능력',
] as const;

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

  return {
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
  };
}

export function ensureTeacherEval(x: StudentRecord): TeacherEvaluation {
  if (!x.evaluation || typeof x.evaluation !== 'object') {
    x.evaluation = { scores: [null, null, null, null], feedback: '', nextStep: '' };
  }
  if (!Array.isArray(x.evaluation.scores)) {
    x.evaluation.scores = [null, null, null, null];
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
  s1.teacherMemo = '1~4차시 모든 증명 기법(직접증명, 반례, 대우법, 귀류법)을 완벽하게 연결하여 서술함.';
  s1.evaluation = {
    scores: [3, 3, 3, 3],
    feedback: '관찰에서 추측, 반례 검증, 대우법과 귀류법 증명까지 모든 논리적 연결이 매우 탄탄합니다.',
    nextStep: '√3이 유리수가 아님을 귀류법과 3차시 문제 2(3의 배수 대우 증명)를 결합하여 증명해 보세요.',
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
  s2.teacherMemo = '1~3차시 완료, 4차시 귀류법 탐구 진행 중.';
  s2.evaluation = {
    scores: [3, 2, 3, 3],
    feedback: '대우를 이용한 두 가지 증명을 경우 나누기까지 정확하게 수행했습니다.',
    nextStep: '4차시 귀류법에서 3차시 문제 1의 결과가 어떻게 쓰이는지 확인해 보세요.',
  };

  return [s1, s2];
}

