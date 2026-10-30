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
- **6차시 (절대부등식 2 — 산술평균과 기하평균의 관계)**: 양수 조건($a>0, b>0$)에서 **원·반원 길이 비교 시뮬레이션**(반지름 $\frac{a+b}{2}$ vs 수선 높이 $\sqrt{ab}$ vs 조화선분 $\frac{2ab}{a+b}$) 및 **정사각형·직사각형 면적 비교 시뮬레이션**($\left(\frac{a+b}{2}\right)^2$ vs $ab$, $(a+b)^2 = 4ab + (a-b)^2$ 바람개비 분할)을 통해 시각적으로 탐구한 뒤 $(\sqrt{a}-\sqrt{b})^2 \ge 0$으로 대수적 증명 수행
  - **문제 1 (예제 4 변환)**: $\dfrac{a + b}{2} \ge \sqrt{ab}$ 증명 (등호 조건: $a = b$)
  - **문제 2 (문제 4)**: `(1)` $a + \dfrac{1}{a} \ge 2$, `(2)` $\sqrt{ab} \ge \dfrac{2ab}{a + b}$ 증명 및 등호 성립 조건 확인
- **7차시 (절대부등식 3 — 절댓값 기호를 포함한 부등식)**: 절댓값의 성질($|a|^2 = a^2, |a||b| = |ab|, |a| \ge a$)과 양변 제곱의 차($|B|^2 - |A|^2 \ge 0$)를 이용한 증명
  - **문제 1 (예제 5 변환)**: $|a + b| \le |a| + |b|$ 증명 (등호 조건: $ab \ge 0$)
  - **문제 2 (문제 5)**: `(1)` $|a - b| \le |a| + |b|$, `(2)` $|a| - |b| \le |a - b|$ 증명 및 등호 성립 조건 확인

### 주요 UX 및 교수·학습 지원 기능
- **전 기기(PC · 노트북 · 태블릿/패드 · 모바일) 호환 스마트 수학 기호 입력기 (`MathSymbolInputBar`)**:
  - **2계층 하이브리드 팔레트 (맥락 추천 + 무제한 전체 탭)**: 기본 1줄에는 현재 학습 중인 차시(1~7차시)에 꼭 필요한 **차시별 맞춤 추천 기호·수식 템플릿**을 즉시 배치하여 탐색 부담을 줄이고, `전체 기호·검색 펼치기`를 누르면 6대 분류 탭(`차시 추천`, `부등호·등호`, `제곱·근호·분수`, `절댓값·연산`, `논리·집합`, `문자·그리스`)과 **한글 키워드 검색**(예: `루트`, `이상`, `제곱`, `따라서`) 및 **최근 사용 기호**를 통해 학습자의 표현을 전혀 제한하지 않고 모든 수학 기호를 입력할 수 있습니다.
  - **스마트 블록 감싸기(`□` 템플릿) & 커서 자동 배치**: 서술형 입력창에서 수식 일부(예: `a+b`)를 드래그한 뒤 `√(□)`, `(□)²`, `|□|`를 누르면 `√(a+b)`, `(a+b)²`, `|a+b|`로 자동 감싸지며, 선택 영역 없이 누르면 괄호 안(`√(|)`)으로 커서를 자동 이동시킵니다.
  - **PC·노트북 키보드 단축어 실시간 변환 (ON/OFF 토글)**: 주관식 입력창에 `>=` → `≥`, `<=` → `≤`, `!=` → `≠`, `+-` → `±`, `^2` → `²`, `^3` → `³`, `sqrt(` → `√(`, `<=>` → `⇔`, `=>` → `⇒`, `->` → `→`, `:.` → `∴`, `because` → `∵`를 타이핑하면 즉시 수학 기호로 자동 변환됩니다.
  - **패드·모바일 터치 최적화**: 기호 버튼을 터치해도 입력창 포커스나 가상 키보드가 닫히지 않으며(`onMouseDown preventDefault`), `◀ / ▶ 커서 이동`, `( )`, `지우기` 보조 키를 함께 제공합니다.
- **온전한 루트(근호 + 윗줄 Vinculum) 수식 렌더링 (`MathText`, `MathPreviewBox`, `tokenizeMathRadicals`)**:
  - 한글 산세리프 폰트에서 루트 기호(`√`)가 상단 윗줄 없이 마치 `V` 체크 표시처럼 보여 문제 해석과 평가 오류가 발생하는 현상을 방지하기 위해, 벡터 SVG 근호 갈고리와 피개방수 상단 수평 윗줄(`border-top` vinculum)이 빈틈없이 연결되는 `<MathText />` 수식 렌더러를 적용했습니다.
  - `√(ab)`, `√a`, `√b`, `√2`, `n = √2m`($\sqrt{2}m$), `√(a × 1/a)`, `√(□)` 등 모든 근호 표현을 자동 파싱하여 윗줄이 씌워진 정통 수학 근호($\sqrt{ab}$, $\sqrt{a}$, $\sqrt{b}$, $\sqrt{2}$)로 표기하며, 주관식 서술형 `<textarea>` 하단에는 실시간 수식 표기 미리보기(`<MathPreviewBox />`)를 제공합니다.
- **힌트 토글(열기/숨기기)**: 모든 차시의 단계별 힌트 버튼을 클릭하면 힌트가 표시되고, 다시 클릭하면 깔끔하게 숨겨집니다(최초 열람 시에만 힌트 열람 횟수 1회 기록).
- **학생용 「평가 결과」 모달**: 상단 헤더의 `평가 결과` 버튼을 통해 1~7차시 완료 현황, 자동 루브릭 분석, 교수자 7대 차시별 역량 평정 점수(각 0~3점) 및 맞춤 피드백을 실시간으로 확인하고 인쇄할 수 있습니다.
- **교사용 수사 기록실 (관리자 모드)**:
  - 학생 가입 신청 승인/반려 및 기기(MAC 해시) 잠금 초기화
  - **학생별 평가 완료 여부 및 평가 진행율(%) 배지**: 학급 전체 평가 완료 현황(`평가 완료 N/M명 (P%)`)과 개별 학습자별 루브릭 채점·피드백 진행율(`평가 완료 100%`, `평가 진행 중 X%`, `미평가 0%`)을 실시간 표시
  - **차시 추가 시 기존 '평가 완료' 자동 취소 및 '평가 진행 중(진행형)' 전환**: 기존 차시(예: 1~4차시) 기준으로 평가가 완료된 상태에서 새로운 차시(예: 5~7차시 절대부등식 1·2·3 또는 향후 추가 차시)가 추가되면, 기존 평정 점수와 피드백은 100% 보존하되 새로 추가된 차시 평가 항목이 미평정(`null`)으로 확장되어 자동으로 기존 `평가 완료` 처리를 취소하고 `평가 진행 중` 상태로 전환합니다.
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

### 3.3 Firestore 저장 구조·보안 (2026-10-30 갱신)

> `Func`와 `Props`는 **같은 Firebase 프로젝트·같은 Firestore 데이터베이스**(`ai-studio-526dd59d-…`)와 **같은 보안 규칙**(`firestore.rules`)을 공유합니다. 규칙을 바꿀 때는 두 저장소의 `firestore.rules`를 똑같이 맞추고, Firebase 콘솔에서 한 번만 게시합니다.

**학생 인증 — Firebase 익명 로그인**
- 학생은 접속 시 자동으로 익명 로그인되며(비밀번호 없음), 가입 문서에 본인 익명 계정 `uid`가 기록됩니다.
- 다른 기기·브라우저에서 로그인하면 이름·생년월일을 **보안 규칙(서버)이 확인**한 뒤 그 기기로 연결합니다(이전 기기 연결은 해제).
- 학생이 [나가기]를 누르면 익명 계정도 로그아웃되어, 공용 기기의 다음 사용자가 이전 학생 문서에 접근할 수 없습니다.
- Firebase 콘솔 → Authentication → 로그인 방법에서 **익명** 제공업체가 사용 설정되어 있어야 합니다.

**차시별 분리 저장**
```text
student_registrations/{studentKey}                 가입 정보·승인 상태·uid
                                                    (+ 예전 worksheetJson: 보존용, 더 이상 갱신하지 않음)
student_registrations/{studentKey}/props_lessons/l1~l7   차시별 답안 (승인된 학생 본인만 쓰기)
student_registrations/{studentKey}/props_lessons/teacher 교사 평가·메모 (교사만 쓰기, 학생은 읽기만)
```
- 학생이 입력을 멈추고 **10초** 뒤, **내용이 바뀐 차시 문서만** 저장합니다. 탭을 닫거나 다른 창으로 전환하면 즉시 저장합니다.
- 차시 문서가 아직 없는 차시는 예전 `worksheetJson` 내용을 그대로 사용하므로 별도 데이터 이전 작업이 필요 없습니다(학생이 그 차시를 수정할 때 자연스럽게 옮겨짐).
- 서버 내용을 불러오기 전에는 자동 저장하지 않습니다(오래된 내용으로 서버를 덮어쓰지 않기 위해). 입력 내용은 그동안 기기(`localStorage`)에 보관됩니다.
- **즉시 저장 시점 (2026-10-30 추가)**: 입력을 멈추고 10초 뒤 자동 저장에 더해, **다음 단계·이전 단계·단계 탭·다른 차시로 이동할 때**, 탭을 전환하거나 닫을 때, 인터넷이 다시 연결될 때 바로 저장합니다(바뀐 차시가 없으면 저장하지 않음). 모든 저장은 `App.tsx`의 `saveNow()` 한 곳에서 순서대로 실행됩니다.
- **저장 실패 대비**: 실패하면 30초마다 자동 재시도하고 한 번 안내합니다. 저장되지 않은 내용이 있을 때 창을 닫으려 하면 브라우저 확인 창이 뜹니다(iPad Safari 등 일부 브라우저는 표시하지 않음). 로그아웃 시 마지막 저장을 최대 5초 기다리고, 저장이 확인되지 않으면 기기에 보관합니다.
- **기기 보관(localStorage)은 학생별**: 학생 모드에서는 `STORAGE_KEY_STUDENT::{studentKey}`에 보관하고, 로그인할 때 **같은 학생의 보관본만** 합칩니다(공용 기기에서 앞 학생 답안이 뒤 학생 문서에 섞이지 않도록). 로그아웃 시 서버 저장이 확인되면 보관본을 지우고 화면을 비웁니다. (`src/utils/studentDraft.ts`)
- 교사 평가·메모는 입력을 **1.5초** 모았다가 `teacher` 문서에만 저장합니다.
- 차시 문서에는 `schemaVersion`(현재 1)이 기록됩니다. 문서 구조를 바꿀 때는 버전을 올리고 읽는 쪽에서 버전별로 처리합니다.
- 관련 코드: `src/utils/lessonStore.ts`(저장·불러오기), `src/utils/lessonMerge.ts`(합치기·변경 감지, 단위 테스트 `lessonMerge.test.ts`).

**학생 비밀번호 (2026-10-30 추가, 기본: 사용 안 함)**
- 교사가 [학생 가입 관리] → **학생 비밀번호 사용** 스위치로 켜고 끕니다 (`app_settings/student_auth.passwordRequired`, Func·Props 공통). 문서가 없으면 '사용 안 함'.
- 켜면: 새 가입은 비밀번호 필수(대문자·소문자·숫자·특수문자 포함 8~32자) / 비밀번호가 없는 기존 학생은 다음 로그인 때 **비밀번호를 먼저 설정해야 활동지가 열림** / 비밀번호를 설정한 학생은 다른 기기에서 로그인할 때 비밀번호 필요.
- 끄더라도 이미 비밀번호를 설정한 학생은 보안을 위해 계속 비밀번호가 필요합니다(필요하면 학생별 초기화).
- **교사 초기화**: 학생 가입 관리 표의 [비밀번호] 열 → [초기화]. 학생은 다음 로그인 때 이름·생년월일로 입장한 뒤 새 비밀번호를 설정합니다.
- 비밀번호 원문은 저장하지 않고 `SHA-256(접두어|학생키|비밀번호)` 해시만 가입 문서의 `passwordHash`에 저장합니다. 다른 기기 재연결 시 `해시:임의값` 증명(`claimPasswordHash`)을 보내고 보안 규칙이 해시를 비교합니다(임의값이 매번 바뀌어 예전 증명 재사용 불가).
- ⚠️ 해시 방식(`src/utils/passwordCore.ts`)은 Func·Props에서 반드시 같아야 합니다 — `passwordCore.test.ts`의 고정값 테스트가 검사합니다.
- 한계: 비밀번호를 아직 설정하지 않은 학생은 이름·생년월일만 아는 사람이 먼저 로그인해 비밀번호를 설정할 수 있습니다. 비밀번호 사용을 켠 직후에는 학생들이 바로 설정하도록 안내하세요.

**보안 규칙 요약**
| 대상 | 읽기 | 쓰기 |
|---|---|---|
| 가입 목록 조회 | 교사 | — |
| 가입 문서 | 교사, 본인 | 생성: 로그인한 학생(pending), 승인·반려: 교사, 접속 정보: 본인 |
| 차시 문서 `l1~l7` | 교사, 본인 | 승인된 본인, 교사 |
| 교사 평가 `teacher` | 교사, 본인 | 교사 |
| 접속 기록 | 교사 | 로그인한 사용자(생성만) |
| 차시 잠금 설정 | 누구나 | 교사 |
| 학생 비밀번호 사용 설정 | 누구나 | 교사 |
| 비밀번호 해시 | 교사, 본인 | 처음 설정: 본인(비밀번호 없을 때만) · 초기화: 교사 |

**사용량(무료 한도) 주의**
- 이 데이터베이스는 AI Studio 공유 할당량 데이터베이스로, **결제를 등록해도 무료 한도(쓰기 하루 2만 단위)를 넘을 수 없습니다.** 한도는 미국 태평양 시간 자정(한국 시간 오후 4~5시)에 초기화됩니다.
- 쓰기 단위는 저장하는 문서 크기에 비례하는 것으로 보이므로(추정), 큰 문서를 자주 저장하는 기능을 추가할 때는 바뀐 부분만 작은 문서로 저장하도록 설계합니다.

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
교사용 수사 기록실, 차시별 활성/비활성(선행 학습 방지 및 클라우드 서버 강제 동기화) 제어 패널, 실시간 수합 대시보드, 학생 가입 승인, 평가 진행율 표시 및 사건 기록 비교 컴포넌트입니다. (`https://github.com/4ai4me/Func`와 동일한 `/app_settings/lesson_access` 서버 동기화 및 다중 우회 차단 규격 적용)

- **전체 답안 보기 (2026-10-30)**: 상세 비교 창(인라인·비모달 모두) 아래에 차시별로 학생이 입력한 **모든 문항**을 문항 이름과 함께 표시합니다. 차시마다 `작성 n/m` 현황을 보여 주며, 비어 있는 문항과 기존 요약 칸의 `미작성`은 **빨간 굵은 글씨**로 강조됩니다. 문항 이름은 `src/utils/answerLabels.ts`에서 관리하고, 이름표가 없는 새 필드라도 값이 있으면 `기타 기록`에 표시됩니다. 학생 화면에 문항을 추가하면 `answerLabels.ts`에 이름표를 추가하세요 (`answerLabels.test.ts`가 누락을 검사합니다).
- **비모달 상세 비교 창 이동 (2026-10-30)**: 창의 어두운 제목 표시줄을 마우스로 끌거나 패드에서 손가락으로 끌어 옮길 수 있습니다(최대화·최소화 상태 제외). 창을 다시 열면 처음 위치(오른쪽 아래)에서 시작하며, 화면 밖으로 완전히 나가지 않습니다. (`src/utils/useDraggableWindow.ts`)

```typescript
export interface TeacherViewProps {
  adminEmail: string;
  records: StudentRecord[];
  selectedKey: string;
  onSelectStudent: (key: string) => void;
  onUpdateRecords: React.Dispatch<React.SetStateAction<StudentRecord[]>>;
  onPrintStudentReport: (student: StudentRecord) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
  lessonAccess: LessonAccessConfig;
  lessonAccessSyncStatus: 'loading' | 'saving' | 'synced' | 'error';
  lessonAccessLastSyncedAt: string | null;
  onUpdateLessonAccess: (updater: (prev: LessonAccessConfig) => LessonAccessConfig, summaryLabel?: string) => void;
  onForceSyncLessonAccessToServer: () => Promise<boolean>;
  onRefreshLessonAccessFromServer: () => Promise<void>;
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

// 교수자 평가 모델 (차시 추가 시 기존 점수 보존 및 진행형 전환 지원)
export interface TeacherEvaluation {
  scores: (number | null)[];      // 1~7차시 역량별 루브릭 평정 점수 (0~3점 또는 null)
  feedback: string;               // 학생 맞춤 피드백
  nextStep: string;               // 다음 탐구를 위한 제안
  evaluatedLessonCount?: number;  // 평가 당시 총 차시 수 (차시 추가 시 완료 취소 -> 진행형 전환 기준)
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
│   │   ├── Lesson6View.tsx           # 6차시 활동지 (절대부등식 2: 원·반원 길이 & 사각형 면적 시뮬레이션, 예제4·문제4)
│   │   ├── Lesson7View.tsx           # 7차시 활동지 (절대부등식 3: 절댓값 부등식, 예제5·문제5)
│   │   ├── MathSymbolInputBar.tsx    # PC·노트북·태블릿·모바일 호환 2계층 스마트 수학 기호 입력기
│   │   ├── MathText.tsx              # 온전한 루트(근호 갈고리 + 상단 윗줄 Vinculum) 수식 렌더러 및 실시간 미리보기
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
npx tsx --test src/utils/mathLogic.test.ts src/utils/authLogic.test.ts src/utils/lessonMerge.test.ts src/utils/answerLabels.test.ts src/components/FullAnswerPanel.test.tsx src/utils/passwordCore.test.ts src/utils/useDraggableWindow.test.ts src/utils/studentDraft.test.ts

# 5. 프로덕션 빌드 및 GitHub Pages 루트 번들(ghpages-app.js/css) 자동 동기화
npm run build
```
