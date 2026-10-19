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

export const STAGE_TITLES = {
  1: ['단서 수집', '가설 수립', '반례 수색', '증명 보고서', '다음 사건 예고'],
  2: ['새 사건 선택', '현장 조사', '반례 수색', '판정서 작성', '수사 결과 공유'],
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
  s1.teacherMemo = '1차시 연역적 증명 구조와 2차시 반례 제시 모두 정확하게 연결함.';
  s1.evaluation = {
    scores: [3, 3, 3, 3],
    feedback: '관찰에서 추측, 반례 검증, 일반화 증명까지 모든 논리적 연결이 매우 탄탄합니다.',
    nextStep: 'n=4k±1 형태에 따라 16으로 나눈 나머지가 왜 1과 9로 나뉘는지 증명해 보세요.',
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
  s2.teacherMemo = '1차시 핵심 아이디어(k(k+1)은 짝수)를 2차시 주제 B에 성공적으로 전이함.';
  s2.evaluation = {
    scores: [3, 2, 3, 3],
    feedback: '1차시에서 학습한 대수적 표현을 새로운 문제 상황에 스스로 적용한 점이 훌륭합니다.',
    nextStep: '후속 질문으로 적어 준 연속하는 세 짝수의 곱이 48의 배수인지도 함께 탐구해 보세요.',
  };

  return [s1, s2];
}
