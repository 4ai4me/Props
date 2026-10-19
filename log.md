# log.md — 작업 기록

## [작업 1] 수학 탐정단 참·거짓 추리 프로젝트 (1·2차시 통합 활동지 & 교사용 기록실) 분석, 리팩토링 및 다중 플랫폼 최적화

- **시작 시각**: 2026-10-18T18:31:00-07:00
- **Tier 판단**: Tier 3 (단일 HTML 스파게티 구조를 모듈형 TypeScript/React 아키텍처로 전환 + iOS/Android/PC 반응형 및 GitHub Pages 정적 배포 구조 설계 + 구버전 JSON 스키마 하위 호환성 100% 보장)
- **요청 요약**:
  1. 첨부된 단일 HTML 코드(`proof2lesson-v1`)의 아키텍처·상태 관리·UI·보안·모바일 이슈 분석 및 검토
  2. GitHub에 올려서 웹호스팅(GitHub Pages 등)할 수 있도록 정적 호스팅 및 CI/CD 워크플로우 완비
  3. iOS(Safari, iPadOS), Android(Chrome, Samsung Internet), PC 등 다양한 환경에서 깨짐이나 포커스 유실, 자동 확대, 모달 차단 없이 완벽히 작동하는 반응형 UI 및 다중 플랫폼 최적화

- **변경 전 공통 질문 검토**:
  - *무엇을 바꾸는가?* 단일 HTML 인라인 스크립트(`innerHTML` 전체 재렌더링 방식)를 React + TypeScript 모듈 구조(`src/utils/mathLogic.ts`, `src/components/*`)로 이관하면서, 원본 코드의 결함(한글 IME 조합 중 포커스 손실 기대 위험, `alert`/`confirm` 팝업 차단, iOS `<input type="number">` 음수 입력 불가, `14px` 미만 폰트로 인한 iOS Safari 강제 줌인, 모바일 테이블 가로 스크롤 가독성 저하 등)을 모두 해결한다.
  - *기존 데이터(사용자 데이터)에 영향이 있는가?* **절대 손실 없음.** 원본의 `localStorage` 키(`proof_discovery_two_lessons_student_v1`, `proof_discovery_two_lessons_teacher_v1`)와 JSON 파일 포맷(`kind: 'proof2lesson-v1'`)을 100% 그대로 호환 유지하여, 기존 HTML에서 저장한 학생 JSON 파일도 그대로 불러오고 교사용 기록실에서 수합·비교·CSV 출력할 수 있게 설계한다.
  - *어떻게 검증할 것인가?*
    1. 순수 수학/검증 로직을 `src/utils/mathLogic.ts`로 분리하고 `node --test` 기반 단위 테스트(`src/utils/mathLogic.test.ts`)로 검증.
    2. `compile_applet` 및 `lint_applet`을 통한 정적 타입·빌드 검증.
    3. Headless Chromium (`playwright-cli`)을 이용해 PC(1440x900) 및 모바일(390x844) 뷰포트에서 1차시·2차시·교사용 기록실·코드 분석/배포 가이드 모달까지 실제 동작 및 레이아웃을 시각적으로 검증.

---

## [작업 1 완료 기록]

- **완료 시각**: 2026-10-18T18:45:20-07:00
- **수행 내역 요약**:
  1. **순수 로직 분리 및 단위 테스트 (`src/utils/mathLogic.ts`, `src/utils/mathLogic.test.ts`)**:
     - `mod`, `safeN`, `calc1`, `calc2`, `validateClaim1`, `cleanStudentState`, `csvSafe`, 루브릭/단계 완료 판정 함수를 분리하고 `node --test` 기반 8개 테스트 스위트 전체 통과 확인.
     - 원본 `proof2lesson-v1` JSON 스키마 및 `localStorage` 키(`proof_discovery_two_lessons_student_v1`, `proof_discovery_two_lessons_teacher_v1`) 100% 하위 호환 유지.
  2. **다중 플랫폼 최적화 (iOS / iPadOS / Android / 갤럭시탭 / PC)**:
     - 모든 `input`, `select`, `textarea` 폰트 크기 `16px` 이상 고정으로 iOS Safari 자동 화면 확대(Zoom-in) 방지.
     - 아이폰·아이패드·갤럭시탭 숫자 키패드에서 음수(`-`) 입력이 어려운 문제를 해결하기 위해 `±부호 전환`, `−2`, `+2` 터치 버튼 및 빠른 추천 칩 제공.
     - `window.alert`/`window.confirm`을 모두 제거하고 접근성 표준(`role="dialog"`)을 준수하는 커스텀 확인 모달 및 상단 토스트 알림 배너로 교체.
     - `.mono` 폰트 스택에 Pretendard / Noto Sans KR 폴백을 포함하여 리눅스·안드로이드·크롬북 등에서 한글 플레이스홀더 깨짐(두부 현상) 해결.
  3. **GitHub Pages 정적 웹호스팅 대응**:
     - `vite.config.ts`에 `base: './'` 설정 추가 (하위 경로 레포지토리 호스팅 완벽 호환).
     - `.github/workflows/deploy.yml` 자동 빌드·테스트·배포 워크플로우 생성.
     - 앱 내 상단 `[코드 분석 · GitHub 웹호스팅 가이드]` 모달 및 오프라인 배포용 독립 실행형 HTML 내려받기 기능 탑재.
- **회귀 및 검증 결과**:
  - `node --test src/utils/mathLogic.test.ts`: 8/8 통과
  - `compile_applet`: 성공 (타입 및 프로덕션 번들링 에러 0건)
  - 브라우저 멀티 뷰포트 검증: Desktop(1440×900), Galaxy Tab(1280×800), iPad Air(820×1180), Mobile(390×844) 검증 및 콘솔 에러 0건 확인.

---

## [작업 2] 화면 상단 '코드 분석 · GitHub 웹호스팅 가이드' 버튼 및 모달 제거

- **시작 시각**: 2026-10-18T18:50:10-07:00
- **Tier 판단**: Tier 1 (UI 요소 제거 및 미사용 컴포넌트 정리, 기존 1·2차시 활동지 및 교사용 기록실 기능 100% 유지)
- **요청 요약**: 화면 상단에 있는 `코드 분석 · GitHub 웹호스팅 가이드` 버튼과 관련 모달을 삭제.

- **완료 시각**: 2026-10-18T18:51:35-07:00
- **수행 내역 및 검증 결과**:
  - `src/App.tsx`에서 상단 `코드 분석 · GitHub 웹호스팅 가이드` 버튼 및 모달 렌더링 제거, `src/components/CodeReviewDeployModal.tsx` 파일 삭제.
  - `node --test` 단위 테스트(8/8 통과), `compile_applet` 빌드 성공, 브라우저 캡처(`r4-clean-header.png`)로 상단 헤더에서 해당 버튼이 깔끔하게 제거되었음을 확인.

---

## [작업 3] GitHub Pages (`https://4ai4me.github.io/Props/`) 기본 브랜치(`main` 루트) 직접 서빙을 위한 완전 독립형 `/index.html` 구성

- **시작 시각**: 2026-10-18T18:52:00-07:00
- **원인 분석**:
  - 사용자가 GitHub 저장소(`4ai4me/Props`)에 소스를 올리고 GitHub Pages 기본 설정(**Deploy from a branch: `main` / `/ (root)`**)으로 호스팅 중임.
  - 기존 `/index.html`은 `<div id="root"></div><script type="module" src="/src/main.tsx"></script>`만 들어 있어서, 정적 파일 서버인 GitHub Pages가 `.tsx` 파일을 브라우저에 그대로 내려보내거나 `/Props/src/main.tsx` 경로 불일치로 인해 빈 화면이 출력됨.
- **해결 설계**:
  - 루트 `/index.html` 자체에 완성된 CSS와 다중 플랫폼 최적화 스크립트(iOS/iPadOS/갤럭시탭/PC 반응형, `±부호`/`-2`/`+2` 터치 버튼, 16px 자동 줌 방지, 비차단 커스텀 모달/토스트, 실시간 나눗셈 분석기, 교사용 예시 데이터 체험 기능, `proof2lesson-v1` JSON/CSV 완벽 호환)를 **100% 인라인으로 내장**하여, 빌드 과정 없이 `main` 브랜치의 `/index.html`을 그대로 열어도 즉시 작동하도록 구현한다.

- **완료 시각**: 2026-10-18T19:01:05-07:00
- **수행 내역 및 검증 결과**:
  - 루트 `/index.html`을 외부 `.tsx` 번들러 의존 없이 단독으로도 즉시 실행되는 완전 독립형(Self-contained) HTML로 재구성하여, `https://4ai4me.github.io/Props/` (GitHub Pages `main` 브랜치 루트 서빙)에서 빈 화면 없이 곧바로 작동하도록 해결.
  - 상단의 '코드 분석 · GitHub 웹호스팅 가이드' 버튼 완전히 제거 완료.
  - 아이패드·갤럭시탭·iOS·Android·PC 반응형 UI(`16px` 입력 규격, `±부호` / `−2` / `+2` 터치 버튼, 커스텀 비차단 확인 모달 및 토스트, 교사용 예시 학생 데이터 체험 기능, `proof2lesson-v1` JSON 호환) 모두 `/index.html`에 내장 및 브라우저 검증 완료.
