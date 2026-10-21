# 우연일까, 필연일까? — 수학 탐정단 (Props)

> **2022 개정 교육과정 공통수학2 「명제의 증명」 교사·학생 통합 탐구 플랫폼**  
> GitHub Repository: [https://4ai4me.github.io/Props/](https://4ai4me.github.io/Props/)

---

## 1. 프로젝트 개요 (Overview)

본 시스템(**Props**)은 고등학교 공통수학2 '명제와 증명' 단원에서 학생들이 규칙을 귀납적으로 관찰하고, 이를 일반적인 연역적 증명 또는 반례로 엄밀하게 정당화하는 수학적 탐구 활동을 지원하는 교육 웹 애플리케이션입니다.

- **1차시 (교사 안내형)**: 짝수 제곱을 8로 나눈 나머지 규칙 발견 → 사례의 한계 인식 → 4단계 빈칸 채우기를 통한 대수적 일반화 증명 서술
- **2차시 (학생 주도형)**: 조건 변형 명제(A·B·C) 또는 자유 탐구 명제(D) 선택 → 반례 탐색 또는 대수적 정당화 → 동료 피드백 및 최종 수정
- **교사용 수사 기록실 (관리자 모드)**: 학생 가입 신청 승인, 기기(MAC 주소) 중복 방지, 실시간 탐구 답안 동기화, 역량 대시보드, 다차원 필터링 및 **비모달(Modeless) 상세 비교 창**, 개별 학생 맞춤 피드백 PDF 인쇄

---

## 2. 시스템 아키텍처 (System Architecture)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        클라이언트 브라우저 계층                         │
│  (PC, 태블릿, 모바일 반응형 UI / iOS Safari 줌 방지 / Tailwind CSS)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│      학생 모드 (Student Mode)    │   │      교사 모드 (Teacher Mode)     │
│  - 학교/학년/반/번호/생년월일 가입 │   │  - 관리자 구글 OAuth 인증        │
│  - 기기 고유 MAC 주소 해시 식별  │   │  - 학생 가입 승인 / 반려 / 관리  │
│  - 1·2차시 단계별 탐구 작성     │   │  - 접기/펼치기 메뉴 아코디언      │
│  - 실시간 자동 저장 (Debounce)   │   │  - 학생 이름 검색 & 열 필터링   │
│  - 인쇄 및 PDF 저장             │   │  - 비모달(Modeless) 상세 비교창  │
└────────────────┬────────────────┘   └────────────────┬─────────────────┘
                 │                                     │
                 ▼                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Firebase Firestore 백엔드                       │
│  - student_registrations/{studentKey}: 가입 상태, 인적사항, 답안 JSON  │
│  - device_locks/{deviceHash}: 기기 고유 MAC 주소 기반 중복 가입 방지    │
│  - admin_logs/{logId}: 관리자 승인 및 감사 기록                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 인증 및 기기 식별 보안 아키텍처

### 3.1 학교 공용 네트워크 환경 고려: MAC 주소 기반 식별
- **문제 정의**: 학교 컴퓨터실이나 교실 공용 Wi-Fi 환경에서는 모든 학생의 공인 IP 주소가 동일하여 IP 기준 중복 검사 시 정상적인 학생 가입이 차단되는 치명적 문제가 발생합니다.
- **해결 방안**: IP 주소 검사를 완전히 배제하고, Web Crypto API(SHA-256) 기반의 **기기 고유 MAC 주소 식별자(`deviceHash`)**만을 사용하여 기기 중복을 식별하고 방지합니다.
- **잠금 해제**: 다른 기기로 교체해야 하거나 잘못 신청된 경우, 교사가 대시보드에서 해당 학생의 기기 잠금을 안전하게 삭제/초기화할 수 있습니다.

### 3.2 교사(관리자) 인증
- 교사는 지정된 관리자 이메일(`ADMIN_TEACHER_EMAIL`) 계정으로 구글 인증을 통과한 경우에만 교사용 수사 기록실 및 학생 승인 패널에 접근할 수 있습니다.

---

## 4. 컴포넌트 Props 명세 (Component Props Reference)

### 4.1 `AuthGateView`
학생 가입 신청/로그인 및 교사 구글 로그인을 처리하는 게이트웨이 컴포넌트입니다.

```typescript
export interface AuthGateViewProps {
  /** 승인된 학생이 로그인에 성공했을 때 호출되는 콜백 */
  onStudentApprovedLogin: (
    studentDoc: FirestoreStudentRegistrationDoc,
    loadedRecord: StudentRecord | null
  ) => void;

  /** 교사(관리자)가 구글 인증을 완료했을 때 호출되는 콜백 */
  onTeacherLogin: (adminEmail: string) => void;
}
```

### 4.2 `Lesson1View`
1차시 교사 안내형 수사 활동지 컴포넌트입니다.

```typescript
export interface Lesson1ViewProps {
  /** 1차시 활동지 전체 데이터 상태 */
  state: Lesson1State;

  /** 현재 열려 있는 탐구 단계 (1~5단계) */
  step: number;

  /** 단계 전환 핸들러 */
  onStepChange: (nextStep: number) => void;

  /** 1차시 상태 변경 업데이트 함수 */
  onUpdate: (updater: (prev: Lesson1State) => Lesson1State) => void;

  /** 2차시 활동지로 이동하는 핸들러 */
  onGoToLesson2: () => void;

  /** 시스템 위험 작업 전 사용자 확인 다이얼로그 호출 함수 */
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}
```

### 4.3 `Lesson2View`
2차시 학생 주도형 수사 활동지 컴포넌트입니다.

```typescript
export interface Lesson2ViewProps {
  /** 2차시 활동지 전체 데이터 상태 */
  state: Lesson2State;

  /** 현재 열려 있는 탐구 단계 (1~4단계) */
  step: number;

  /** 단계 전환 핸들러 */
  onStepChange: (nextStep: number) => void;

  /** 2차시 상태 변경 업데이트 함수 */
  onUpdate: (updater: (prev: Lesson2State) => Lesson2State) => void;

  /** 2차시 탐구 주제(A, B, C, D) 변경 핸들러 */
  onChangeTopic: (nextTopic: TopicId) => void;

  /** 시스템 위험 작업 전 사용자 확인 다이얼로그 호출 함수 */
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;

  /** 2차시 완료 후 3차시 대우법 탐구로 이동 핸들러 */
  onGoToLesson3: () => void;
}
```

### 4.4 `Lesson3View`
3차시 대우를 이용한 증명법(2문항: $n^2$이 짝수이면 $n$도 짝수 / $n^2$이 3의 배수이면 $n$도 3의 배수) 인터랙티브 활동지 컴포넌트입니다.

```typescript
export interface Lesson3ViewProps {
  /** 3차시 활동지 전체 데이터 상태 */
  state: Lesson3State;

  /** 현재 열려 있는 탐구 단계 (0: 비교/원리, 1: 문제 1, 2: 문제 2, 3: 성찰) */
  step: number;

  /** 단계 전환 핸들러 */
  onStepChange: (nextStep: number) => void;

  /** 3차시 상태 변경 업데이트 함수 */
  onUpdate: (updater: (prev: Lesson3State) => Lesson3State) => void;

  /** 시스템 위험 작업 전 사용자 확인 다이얼로그 호출 함수 */
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;

  /** 3차시 완료 후 4차시 귀류법 탐구로 이동 핸들러 */
  onGoToLesson4: () => void;
}
```

### 4.5 `Lesson4View`
4차시 귀류법(2문항: $\sqrt{2}$는 유리수가 아니다 / $1+\sqrt{2}$는 무리수이다) 인터랙티브 활동지 컴포넌트입니다.

```typescript
export interface Lesson4ViewProps {
  /** 4차시 활동지 전체 데이터 상태 */
  state: Lesson4State;

  /** 현재 열려 있는 탐구 단계 (0: 귀류법 원리, 1: 문제 1, 2: 문제 2, 3: 성찰) */
  step: number;

  /** 단계 전환 핸들러 */
  onStepChange: (nextStep: number) => void;

  /** 4차시 상태 변경 업데이트 함수 */
  onUpdate: (updater: (prev: Lesson4State) => Lesson4State) => void;

  /** 시스템 위험 작업 전 사용자 확인 다이얼로그 호출 함수 */
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}
```

### 4.4 `TeacherView`
교사용 수사 기록실, 실시간 수합 대시보드, 학생 가입 승인 및 사건 기록 비교 컴포넌트입니다.

```typescript
export interface TeacherViewProps {
  /** 로그인한 교사(관리자) 이메일 주소 */
  adminEmail: string;

  /** 수합된 전체 학생 기록 배열 */
  records: StudentRecord[];

  /** 현재 상세 비교 대상인 학생의 고유 식별 키 (`group::code`) */
  selectedKey: string;

  /** 상세 비교 대상 학생 선택 핸들러 */
  onSelectStudent: (key: string) => void;

  /** 교사 평가, 메모 수정 시 전체 레코드 상태를 갱신하는 React Dispatch 함수 */
  onUpdateRecords: React.Dispatch<React.SetStateAction<StudentRecord[]>>;

  /** 선택한 학생의 개별 탐구 피드백 보고서 인쇄/PDF 저장 트리거 */
  onPrintStudentReport: (student: StudentRecord) => void;

  /** 확인 다이얼로그 호출 함수 */
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}
```

---

## 5. 교사용 기록실 고도화 기능 명세

### 5.1 접기 / 펼치기 아코디언 모드
- **학생 가입 신청 승인 메뉴**: 전체 가입자 및 대기/승인/반려 현황 배지를 상단에 표시하며 한 번의 클릭으로 접기/펼치기 가능
- **교사용 수사 기록실**: 데이터 불러오기/CSV 내보내기/KPI 지표 카드 영역을 접어서 화면을 넓게 활용 가능
- **학급 탐구 역량 대시보드**: 활동 완료율, 판단 분포, 역량 평정 그래프 접기/펼치기
- **탐정별 사건 기록**: 검색/필터 바 및 학생 테이블 접기/펼치기
- **교사용 수사 체크리스트**: 4대 핵심 질문 체크리스트 접기/펼치기

### 5.2 학생 이름 검색 기능
- **가입 신청 승인 메뉴**: 수많은 신청자 중 이름 또는 학번으로 즉시 필터링
- **탐정별 사건 기록**: 학생 이름(예: `김탐정`) 또는 식별코드로 실시간 검색 및 결과 표시

### 5.3 다차원 열 필터링 (Column Filters)
탐정별 사건 기록 테이블에서 다음 4가지 조건을 복합 적용할 수 있습니다:
1. **학급/반 필터**: 수합된 데이터의 고유 학급(`group`) 목록 자동 추출 및 선택
2. **1차시 사례 수 필터**: 전체 / 사례 4개 이상 (완료) / 1~3개 (진행 중) / 0개 (미작성)
3. **2차시 탐구 주제 필터**: 전체 / 주제 A (세 자연수) / 주제 B (홀수 제곱 차) / 주제 C (소수 판정) / 자유 주제
4. **2차시 판단 필터**: 전체 / 참 (증명) / 거짓 (반례) / 미해결 / 미작성
- **필터 초기화 버튼**: 활성화된 모든 필터와 검색어를 원클릭으로 초기 상태 복원

### 5.4 비모달(Modeless) 상세 비교 창 모드
- **비모달(Modeless) 아키텍처**: 화면 전체를 어둡게 가리고 입력을 차단하는 모달(Modal)과 달리, **배경 화면 클릭 및 상호작용이 100% 유지**됩니다.
- **실시간 학생 전환**: 비모달 창이 열려 있는 상태에서 테이블의 다른 학생 행을 클릭하면 비모달 창의 내용이 해당 학생의 1·2차시 기록으로 즉시 전환됩니다.
- **창 제어 기능**:
  - `최소화`: 우측 하단 콤팩트 칩으로 축소하여 테이블 열람 공간 확보
  - `최대화`: 전체 화면으로 확장하여 긴 증명 서술을 한눈에 검토
  - `닫기`: 비모달 창 종료 (테이블 하단 인라인 뷰 전환 가능)
  - `PDF 인쇄`: 창 상단에서 바로 학생 개별 맞춤 피드백 인쇄 호출

---

## 6. 핵심 데이터 모델 (Data Model Contract)

```typescript
// 1차시 상태 모델
export interface Lesson1State {
  examples: L1Example[];        // 관찰 사례 목록 (n, n², 나머지)
  claim: string;                // 발견한 추측 명제 서술
  scope: '' | 'some' | 'all';   // 명제 조건 범위 ('모든')
  claimChecked: boolean;        // 가설 점검 완료 여부
  checks: L1Example[];          // 반례/추가 검증 사례 목록
  limits: string;               // 사례 확인의 한계 서술
  proofChoices: (number | null)[]; // 4단계 증명 빈칸 선택값
  proofVerified: boolean[];     // 각 단계별 정답 검증 여부
  proofHints: number[];         // 단계별 힌트 열람 횟수
  proofText: string;            // 나의 말로 쓰는 최종 일반적 증명
  reflection: string;           // 1차시 탐구 성찰
  bridge: string;               // 2차시 연결 후속 질문
}

// 2차시 상태 모델
export interface Lesson2State {
  topic: '' | 'a' | 'b' | 'c' | 'd'; // 선택 주제 (A, B, C, D)
  customStatement: string;      // D주제 선택 시 사용자 정의 명제
  customScope: string;          // D주제 조건 범위
  examples: L2Example[];        // 수집 사례 목록
  checks: L2Check[];            // 추가 검증 및 반례 검사 목록
  guess: string;                // 추측과 이유
  decision: '' | 'true' | 'false' | 'unknown'; // 참/거짓/미해결 판단
  decisionChecked: boolean;     // 판단 확정 여부
  counter: string;              // 거짓일 때 제시한 반례 n 값
  counterReason: string;        // 반례가 되는 이유
  proofText: string;            // 참일 때 일반적 증명 서술
  hintLevel: number;            // 힌트 단계
  share: string;                // 모둠 공유 내용
  peer: string;                 // 피드백을 주고받은 동료 이름
  peerComment: string;          // 동료가 남겨준 피드백
  revision: string;             // 피드백 반영 수정 사항
  reflection: string;           // 2차시 탐구 성찰
  nextQuestion: string;         // 후속 탐구 질문
}

// 3차시 상태 모델 (대우를 이용한 증명법)
export interface Lesson3State {
  examples: L3Example[];        // 0단계 관찰 사례 목록 (n, n², 짝홀/3의 배수 여부)
  whyHard: string;              // 직접 증명이 막히는 이유 서술 (30자 이상)
  p1Choices: (number | null)[]; // 문제 1 (짝수 명제) 4단계 빈칸 선택값
  p1Verified: boolean[];        // 문제 1 단계별 검증 완료 여부
  p1Hints: number[];            // 문제 1 단계별 힌트 열람 횟수
  p1ProofText: string;          // 문제 1 나의 말로 쓰는 대우 증명 (45자 이상)
  p2Choices: (number | null)[]; // 문제 2 (3의 배수 명제) 4단계 빈칸 선택값
  p2Verified: boolean[];        // 문제 2 단계별 검증 완료 여부
  p2Hints: number[];            // 문제 2 단계별 힌트 열람 횟수
  p2ProofText: string;          // 문제 2 나의 말로 쓰는 대우 증명 (50자 이상)
  reflection: string;           // 3차시 탐구 성찰 (35자 이상)
  bridge: string;               // 4차시 연결 후속 질문 (20자 이상)
}

// 4차시 상태 모델 (귀류법)
export interface Lesson4State {
  whyIndirect: string;          // 귀류법(결론 부정)이 필요한 이유 서술 (30자 이상)
  p1Choices: (number | null)[]; // 문제 1 (√2 무리수 증명) 4단계 빈칸 선택값
  p1Verified: boolean[];        // 문제 1 단계별 검증 완료 여부
  p1Hints: number[];            // 문제 1 단계별 힌트 열람 횟수
  p1ProofText: string;          // 문제 1 나의 말로 쓰는 귀류법 증명 (50자 이상)
  p2Choices: (number | null)[]; // 문제 2 (1+√2 무리수 증명) 4단계 빈칸 선택값
  p2Verified: boolean[];        // 문제 2 단계별 검증 완료 여부
  p2Hints: number[];            // 문제 2 단계별 힌트 열람 횟수
  p2ProofText: string;          // 문제 2 나의 말로 쓰는 귀류법 증명 (45자 이상)
  methodCompare: string;        // 직접증명 vs 대우법 vs 귀류법 비교 서술 (35자 이상)
  reflection: string;           // 4차시 탐구 성찰 (35자 이상)
}

// 교사 평정 모델 (4대 영역)
export interface TeacherEvaluation {
  scores: (number | null)[];    // 4개 루브릭 영역 (각 0~3점)
  feedback: string;             // 구체적인 학생 맞춤 피드백
  nextStep: string;             // 다음 탐구를 위한 제안
}

// 통합 학생 레코드 모델
export interface StudentRecord {
  kind: 'proof2lesson-v1';      // 구버전 100% 호환 고유 식별자
  group: string;                // 학교/학급 (예: "서울중학교 1학년 3반")
  code: string;                 // 식별코드 (예: "10301_홍길동")
  createdAt: string;            // 생성 일시 (ISO-8601)
  updatedAt: string;            // 수정 일시 (ISO-8601)
  l1: Lesson1State;             // 1차시 데이터
  l2: Lesson2State;             // 2차시 데이터
  l3?: Lesson3State;            // 3차시 데이터 (구버전 레코드 로드 시 기본값 자동 보정)
  l4?: Lesson4State;            // 4차시 데이터 (구버전 레코드 로드 시 기본값 자동 보정)
  teacherMemo?: string;         // 교사용 관찰 메모
  evaluation?: TeacherEvaluation; // 교사 평정 및 피드백
}
```

---

## 7. 프로젝트 파일 구조

```text
/
├── src/
│   ├── App.tsx                     # 최상위 세션 라우팅 및 탭·인쇄·상태 관리
│   ├── firebase.ts                 # Firestore 초기화 및 에러 핸들러
│   ├── index.css                   # 글로벌 Tailwind 스타일 및 인쇄 매체 쿼리
│   ├── main.tsx                    # React 진입점
│   ├── components/
│   │   ├── AuthGateView.tsx        # 학생 가입/로그인 및 교사 인증 게이트웨이
│   │   ├── CharCountBadge.tsx      # 실시간 글자수 카운터 및 최소 분량 검증 배지
│   │   ├── Lesson1View.tsx         # 1차시 활동지 (직접 증명 4단계 인터랙션)
│   │   ├── Lesson2View.tsx         # 2차시 활동지 (반례 검사 및 정당화)
│   │   ├── Lesson3View.tsx         # 3차시 활동지 (대우를 이용한 증명 2문항 & 단계별 힌트)
│   │   ├── Lesson4View.tsx         # 4차시 활동지 (귀류법 증명 2문항 & 단계별 힌트)
│   │   └── TeacherView.tsx         # 교사용 기록실, 필터, 비모달 비교창, 1~4차시 대시보드
│   └── utils/
│       ├── authLogic.ts            # MAC 식별자 해시 및 관리자 권한 로직
│       ├── mathLogic.ts            # 순수 수학 판정, 루브릭 평가, JSON 정제
│       └── mathLogic.test.ts       # node:test 기반 로직 무결성 단위 테스트
├── index.html                      # HTML 셸 (모바일 뷰포트 및 메타 태그)
├── firestore.rules                 # Firestore 보안 규칙 (RBAC & 기기 잠금)
├── firebase-blueprint.json         # Firestore 데이터베이스 스키마 정의
├── log.md                          # 개발 작업 로그 및 회귀 검증 기록
├── package.json                    # 프로젝트 의존성 및 스크립트 정의
└── README.md                       # 시스템 구조 및 Props 명세 문서
```

---

## 8. 빌드 및 테스트 가이드

```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 서버 실행 (Port 3000)
npm run dev

# 3. TypeScript 타입 및 코드 린트 검사
npm run lint

# 4. 순수 수학 로직 단위 테스트 실행
node --test src/utils/mathLogic.test.ts

# 5. 프로덕션 빌드 (dist/ 생성)
npm run build
```
