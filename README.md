# 우연일까, 필연일까? — 수학 탐정단 (Props) | 이하연 수학 교실

> **2022 개정 교육과정 공통수학2 「명제와 절대부등식의 증명」 1~7차시 교사·학생 통합 탐구 플랫폼**  
> GitHub Pages: [https://4ai4me.github.io/Props/](https://4ai4me.github.io/Props/)

---

## 1. 프로젝트 개요 (Overview)

본 시스템(**Props — 이하연 수학 교실**)은 고등학교 공통수학2 '명제와 증명' 단원에서 학생들이 구체적인 수치를 대입해 규칙을 귀납적으로 관찰하고, 이를 연역적 증명(직접 증명, 대우법, 귀류법, 실수의 성질을 이용한 절대부등식 증명) 또는 반례로 엄밀하게 정당화하는 **1~7차시 수학적 탐구 활동**을 지원하는 교육 웹 애플리케이션입니다.

### 전체 커리큘럼 (1차시 ~ 7차시)
- **1차시 (교사 안내형 — 직접 증명)**: 짝수의 제곱을 8로 나눈 나머지 규칙 발견 → 사례 확인의 한계 인식 → 4단계 빈칸 채우기를 통한 대수적 일반화 증명 서술
- **2차시 (학생 주도형 — 참/거짓 판별과 정당화)**: 조건 변형 명제(A·B·C) 또는 자유 탐구 명제(D) 선택 → 반례 탐색 또는 대수적 정당화 → 동료 피드백 및 최종 수정
- **3차시 (대우를 이용한 증명법)**: 명제와 대우의 동치 관계 이해 → **문제 1**($n^2$이 짝수이면 $n$도 짝수) & **문제 2**($n^2$이 3의 배수이면 $n$도 3의 배수) 4단계 빈칸 추론 및 서술형 증명
- **4차시 (귀류법)**: 결론을 부정하여 모순을 이끌어내는 간접 증명 원리 탐구 → **문제 1**($\sqrt{2}$는 무리수) & **문제 2**($1+\sqrt{2}$는 무리수) 4단계 빈칸 추론 및 서술형 증명
- **5차시 (절대부등식 1 — 완전제곱식을 이용한 증명)**: 실수의 성질($A^2 \ge 0$)과 두 식의 차($A-B$)를 완전제곱식으로 변형하여 증명 및 등호 성립 조건 탐구
  - **문제 1 (예제 3 변환)**: $a^2 + b^2 \ge ab$ 증명 (등호 조건: $a = b = 0$)
  - **문제 2 (문제 3)**: `(1)` $(a + b)^2 \ge 4ab$, `(2)` $a^2 - 4ab + 5b^2 \ge 0$ 증명 및 등호 성립 조건 확인
- **6차시 (절대부등식 2 — 산술평균과 기하평균의 관계)**: 양수 조건($a>0, b>0$)에서 $(\sqrt{a}-\sqrt{b})^2 \ge 0$을 이용한 산술·기하평균 부등식 증명 및 활용
  - **문제 1 (예제 4 변환)**: $\dfrac{a + b}{2} \ge \sqrt{ab}$ 증명 (등호 조건: $a = b$)
  - **문제 2 (문제 4)**: `(1)` $a + \dfrac{1}{a} \ge 2$, `(2)` $\sqrt{ab} \ge \dfrac{2ab}{a + b}$ 증명 및 등호 성립 조건 확인
- **7차시 (절대부등식 3 — 절댓값 기호를 포함한 부등식)**: 절댓값의 성질($|a|^2 = a^2, |a||b| = |ab|, |a| \ge a$)과 양변 제곱의 차($|B|^2 - |A|^2 \ge 0$)를 이용한 증명
  - **문제 1 (예제 5 변환)**: $|a + b| \le |a| + |b|$ 증명 (등호 조건: $ab \ge 0$)
  - **문제 2 (문제 5)**: `(1)` $|a - b| \le |a| + |b|$, `(2)` $|a| - |b| \le |a - b|$ 증명 및 등호 성립 조건 확인

### 주요 UX 및 교수·학습 지원 기능
- **힌트 토글(열기/숨기기)**: 모든 차시의 단계별 힌트 버튼을 클릭하면 힌트가 표시되고, 다시 클릭하면 깔끔하게 숨겨집니다(최초 열람 시에만 힌트 열람 횟수 1회 기록).
- **학생용 「평가 결과」 모달**: 상단 헤더의 `평가 결과` 버튼을 통해 1~7차시 완료 현황, 자동 루브릭 분석, 교수자 평정 점수(12점 만점) 및 맞춤 피드백을 실시간으로 확인하고 인쇄할 수 있습니다.
- **교사용 수사 기록실 (관리자 모드)**:
  - 학생 가입 신청 승인/반려 및 기기(MAC 해시) 잠금 초기화
  - **학생별 평가 완료 여부 및 평가 진행율(%) 배지**: 학급 전체 평가 완료 현황(`평가 완료 N/M명 (P%)`)과 개별 학습자별 루브릭 채점·피드백 진행율(`평가 완료 100%`, `평가 중 X%`, `미평가 0%`)을 실시간 표시
  - 다차원 열 필터링, 이름 검색, **비모달(Modeless) 상세 비교 창**, 개별 학생 맞춤 피드백 PDF 인쇄
- **브랜딩**: 웹 화면 최상단 헤더와 최하단 푸터에 **「이하연 수학 교실」** 공식 타이틀이 표시되며, 인쇄/PDF 보고서에도 반영됩니다.

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
│  - 1~7차시 단계별 탐구 작성     │   │  - 학생별 평가 진행율(%) 배지    │
│  - 힌트 토글 (열기/다시 숨기기)  │   │  - 접기/펼치기 메뉴 아코디언      │
│  - 실시간 자동 저장 (Debounce)   │   │  - 학생 이름 검색 & 열 필터링   │
│  - 평가 결과 모달 & PDF 인쇄    │   │  - 비모달(Modeless) 상세 비교창  │
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
- **문제 정의**: 학교 컴퓨터실이나 교실 공용 Wi-Fi 환경에서는 모든 학생의 공인 IP 주소가 동일하여 IP 기준 중복 검사 시 정상적인 학생 가입이 차단되는 문제가 발생합니다.
- **해결 방안**: IP 주소 검사를 배제하고, Web Crypto API(SHA-256) 기반의 **기기 고유 식별자(`deviceHash`)**만을 사용하여 기기 중복을 식별하고 방지합니다.
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

### 4.2 `Lesson1View` ~ `Lesson4View`
1~4차시 명제와 증명(직접 증명, 반례와 정당화, 대우 증명, 귀류법) 활동지 컴포넌트입니다.

```typescript
export interface Lesson1ViewProps {
  state: Lesson1State;
  step: number;
  onStepChange: (nextStep: number) => void;
  onUpdate: (updater: (prev: Lesson1State) => Lesson1State) => void;
  onGoToLesson2: () => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export interface Lesson2ViewProps {
  state: Lesson2State;
  step: number;
  onStepChange: (nextStep: number) => void;
  onUpdate: (updater: (prev: Lesson2State) => Lesson2State) => void;
  onChangeTopic: (nextTopic: TopicId) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onGoToLesson3: () => void;
}

export interface Lesson3ViewProps {
  state: Lesson3State;
  step: number;
  onStepChange: (nextStep: number) => void;
  onUpdate: (updater: (prev: Lesson3State) => Lesson3State) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onGoToLesson4: () => void;
}

export interface Lesson4ViewProps {
  state: Lesson4State;
  step: number;
  onStepChange: (nextStep: number) => void;
  onUpdate: (updater: (prev: Lesson4State) => Lesson4State) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onGoToLesson5?: () => void;
}
```

### 4.3 `Lesson5View` ~ `Lesson7View` (절대부등식 1·2·3)
5~7차시 절대부등식의 증명(완전제곱식, 산술·기하평균, 절댓값 부등식) 인터랙티브 활동지 컴포넌트입니다. 각 차시는 1차시와 동일한 4단계(0: 수치 실험과 원리 발견 → 1: 문제 1(예제 변환) → 2: 문제 2(소문항 (1)·(2)) → 3: 등호 성립 조건 정리 및 성찰) 스텝퍼 구조로 진행됩니다.

```typescript
export interface Lesson5ViewProps {
  state: Lesson5State;
  step: number;
  onStepChange: (nextStep: number) => void;
  onUpdate: (updater: (prev: Lesson5State) => Lesson5State) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onGoToLesson6: () => void;
}

export interface Lesson6ViewProps {
  state: Lesson6State;
  step: number;
  onStepChange: (nextStep: number) => void;
  onUpdate: (updater: (prev: Lesson6State) => Lesson6State) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onGoToLesson7: () => void;
}

export interface Lesson7ViewProps {
  state: Lesson7State;
  step: number;
  onStepChange: (nextStep: number) => void;
  onUpdate: (updater: (prev: Lesson7State) => Lesson7State) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}
```

### 4.4 `TeacherView`
교사용 수사 기록실, 실시간 수합 대시보드, 학생 가입 승인, 평가 진행율 표시 및 사건 기록 비교 컴포넌트입니다.

```typescript
export interface TeacherViewProps {
  adminEmail: string;
  records: StudentRecord[];
  selectedKey: string;
  onSelectStudent: (key: string) => void;
  onUpdateRecords: React.Dispatch<React.SetStateAction<StudentRecord[]>>;
  onPrintStudentReport: (student: StudentRecord) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}
```

---

## 5. 핵심 데이터 모델 (Data Model Contract)

```typescript
// 5차시(절대부등식 1), 6차시(절대부등식 2), 7차시(절대부등식 3) 상태 모델
export interface Lesson5State {
  examples: L5Example[];          // 수치 대입 실험 사례 목록 (a, b, 좌변, 우변, 차)
  whyDifference: string;          // A - B >= 0 및 완전제곱식 변형 원리 서술 (30자 이상)
  p1Choices: (number | null)[];   // 문제 1 (예제 3: a²+b² >= ab) 4단계 빈칸 선택값
  p1Verified: boolean[];          // 문제 1 단계별 검증 완료 여부
  p1Hints: number[];              // 문제 1 단계별 힌트 열람 횟수
  p1ProofText: string;            // 문제 1 나의 말로 쓰는 증명 및 등호 조건 (45자 이상)
  p2Choices: (number | null)[];   // 문제 2 (문제 3: (1) (a+b)²>=4ab, (2) a²-4ab+5b²>=0) 4단계 빈칸 선택값
  p2Verified: boolean[];          // 문제 2 단계별 검증 완료 여부
  p2Hints: number[];              // 문제 2 단계별 힌트 열람 횟수
  p2ProofText: string;            // 문제 2 나의 말로 쓰는 증명 및 등호 조건 (50자 이상)
  reflection: string;             // 5차시 탐구 성찰 (35자 이상)
  bridge: string;                 // 6차시 연결 후속 질문 (20자 이상)
}

export type Lesson6State = Lesson5State; // 산술평균과 기하평균 (예제 4, 문제 4)
export type Lesson7State = Lesson5State; // 절댓값 부등식 (예제 5, 문제 5)

// 통합 학생 레코드 모델 (구버전 백업 JSON 100% 하위 호환)
export interface StudentRecord {
  kind: 'proof2lesson-v1';
  group: string;                  // 학교/학급 (예: "서울고등학교 1학년 3반")
  code: string;                   // 식별코드 (예: "10301_홍길동")
  createdAt: string;              // 생성 일시 (ISO-8601)
  updatedAt: string;              // 수정 일시 (ISO-8601)
  l1: Lesson1State;               // 1차시 데이터
  l2: Lesson2State;               // 2차시 데이터
  l3?: Lesson3State;              // 3차시 데이터 (대우 증명)
  l4?: Lesson4State;              // 4차시 데이터 (귀류법)
  l5?: Lesson5State;              // 5차시 데이터 (절대부등식 1)
  l6?: Lesson6State;              // 6차시 데이터 (절대부등식 2)
  l7?: Lesson7State;              // 7차시 데이터 (절대부등식 3)
  teacherMemo?: string;           // 교사용 관찰 메모
  evaluation?: TeacherEvaluation; // 교사 평정 및 피드백
}
```

---

## 6. 프로젝트 파일 구조

```text
/
├── src/
│   ├── App.tsx                       # 최상위 세션 라우팅, 1~7차시 탭, 인쇄 및 상태 관리
│   ├── firebase.ts                   # Firestore 초기화 및 에러 핸들러
│   ├── index.css                     # 글로벌 Tailwind 스타일 및 인쇄 매체 쿼리
│   ├── main.tsx                      # React 진입점
│   ├── components/
│   │   ├── AuthGateView.tsx          # 학생 가입/로그인 및 교사 인증 게이트웨이
│   │   ├── CharCountBadge.tsx        # 실시간 글자수 카운터 및 최소 분량 검증 배지
│   │   ├── Lesson1View.tsx           # 1차시 활동지 (직접 증명)
│   │   ├── Lesson2View.tsx           # 2차시 활동지 (반례 탐색 및 대수적 정당화)
│   │   ├── Lesson3View.tsx           # 3차시 활동지 (대우를 이용한 증명 2문항)
│   │   ├── Lesson4View.tsx           # 4차시 활동지 (귀류법 증명 2문항)
│   │   ├── Lesson5View.tsx           # 5차시 활동지 (절대부등식 1: 완전제곱식, 예제3·문제3)
│   │   ├── Lesson6View.tsx           # 6차시 활동지 (절대부등식 2: 산술·기하평균, 예제4·문제4)
│   │   ├── Lesson7View.tsx           # 7차시 활동지 (절대부등식 3: 절댓값 부등식, 예제5·문제5)
│   │   ├── StudentEvaluationModal.tsx # 개별 학습자용 1~7차시 평가 결과 및 피드백 모달
│   │   └── TeacherView.tsx           # 교사용 기록실, 평가 진행율, 비모달 비교창, 1~7차시 대시보드
│   └── utils/
│       ├── authLogic.ts              # 기기 식별자 해시 및 관리자 권한 로직
│       ├── authLogic.test.ts         # 인증/식별 로직 단위 테스트
│       ├── mathLogic.ts              # 1~7차시 수학 판정, 루브릭/평가 진행율 계산, JSON 정제
│       └── mathLogic.test.ts         # node:test 기반 1~7차시 로직 무결성 단위 테스트
├── index.html                        # HTML 셸 (모바일 뷰포트 및 메타 태그)
├── ghpages-app.js / ghpages-app.css  # GitHub Pages 루트 배포용 동기화 번들
├── firestore.rules                   # Firestore 보안 규칙 (RBAC & 기기 잠금)
├── firebase-blueprint.json           # Firestore 데이터베이스 스키마 정의
├── log.md                            # 개발 작업 로그 및 회귀 검증 기록
├── package.json                      # 프로젝트 의존성 및 빌드 스크립트
└── README.md                         # 시스템 구조 및 전체 명세 문서
```

---

## 7. 빌드 및 배포 가이드 (GitHub Pages 호환)

`npm run build` 실행 시 Vite 프로덕션 빌드(`dist/`) 생성과 동시에 루트 디렉터리의 `ghpages-app.js` 및 `ghpages-app.css`가 자동으로 최신 빌드 산출물로 동기화됩니다. 따라서 GitHub 저장소의 루트 브랜치(`main`)나 `dist` 어느 쪽으로 GitHub Pages를 배포하더라도 항상 최신 UI(1~7차시 탭, `평가 결과` 버튼 등)가 반영됩니다.

```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 서버 실행 (Port 3000)
npm run dev

# 3. TypeScript 타입 및 코드 린트 검사
npm run lint

# 4. 순수 수학 및 인증 로직 단위 테스트 실행
npx tsx --test src/utils/mathLogic.test.ts src/utils/authLogic.test.ts

# 5. 프로덕션 빌드 및 GitHub Pages 루트 번들(ghpages-app.js/css) 자동 동기화
npm run build
```
