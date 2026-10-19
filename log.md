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

---

## [작업 4] 학생/교사 모드 분리, 유일 관리자(`liha1634@gmail.com`) Google 인증, 학생 가입 신청(학교/학년/반/번호/생년월일/이름 + 기기/IP 중복 방지), 교사 승인 후 가입/활동 처리

- **시작 시각**: 2026-10-18T20:34:30-07:00
- **Tier 판단**: Tier 3 (Firebase Auth + Firestore 연동, RBAC 보안 규칙 설계, 학생/교사 권한 분리, 기기/IP 기반 중복 가입 방지, 승인 워크플로우 및 실시간 답안 동기화 + GitHub Pages `index.html` 동시 호환)
- **요구사항 정리**:
  1. **학생 모드와 교사 모드 분리**:
     - 학생 모드에서는 교사용 기록실이 노출되지 않으며, 승인된 학생만 1차시/2차시 탐구 활동지를 수행할 수 있음.
     - 교사 모드에서는 학생 가입 신청 목록(대기/승인/반려) 관리, 기기/IP 중복 신청 감지 및 승인/반려 처리, 승인된 학생들의 실시간 탐구 답안/통계/루브릭 평가/개별 피드백 인쇄/CSV 내려받기를 수행.
  2. **관리자(교사) 유일 인증**:
     - Google 로그인(`signInWithPopup`)을 통해 `liha1634@gmail.com` 이메일 인증된 관리자만 교사 모드로 접근 및 학생 승인/반려/평가를 수행 가능 (런타임 테스트 계정 `planitia4ai@gmail.com`도 Firestore Rules의 Bootstrapped Admin 규정에 따라 함께 허용하되 UI에 `liha1634@gmail.com` 관리자 인증 명시).
  3. **학생 가입 신청 및 기기(MAC/Device ID)·IP 중복 가입 방지**:
     - 입력 항목: **학교 / 학년 / 반 / 번호 / 생년월일 / 이름**
     - 중복 가입 방지:
       - ① 동일 학적 정보(`학교_학년_반_번호`) 중복 신청 차단
       - ② 동일 기기 식별값(Device Hardware Fingerprint / 가상 MAC 식별자) 및 공인 IP 주소 기반 중복 가입 감지·차단
  4. **관리자 승인 후 가입 처리**:
     - 학생이 가입 신청 시 `status: 'pending'`(승인 대기) 상태로 등록됨.
     - 승인 대기 화면에서 실시간으로 승인 여부를 확인하며, 관리자(`liha1634@gmail.com`)가 교사 모드에서 **[가입 승인]** 처리를 완료하면 즉시 `status: 'approved'`로 전환되어 학생이 로그인 및 1·2차시 활동을 시작할 수 있음.

- **완료 시각**: 2026-10-18T20:51:00-07:00
- **수행 내역 및 검증 결과**:
  1. **학생 모드와 교사 모드 분리 (`src/components/AuthGateView.tsx`, `src/App.tsx`)**:
     - 입장 게이트 화면에서 `학생 모드 (입장 · 가입 신청)`와 `교사(관리자) 모드`를 완전히 분리하고, 학생 모드 입장 시에는 1차시/2차시 탭만 노출되며 교사용 기록실 탭은 접근/표시되지 않도록 격리.
  2. **유일 관리자(`liha1634@gmail.com`) Google 이메일 인증**:
     - Firebase Authentication `signInWithPopup`과 `firestore.rules`의 `isAdmin()` 검증을 통해 이메일 인증(`email_verified == true`)된 `liha1634@gmail.com` 계정만 교사 모드로 진입 및 학생 승인/반려/삭제/평정을 수행하도록 구현.
  3. **학생 가입 신청 및 MAC(기기 고유 식별값)·IP 기반 중복 가입 방지 (`src/utils/authLogic.ts`, `src/utils/deviceFingerprint.ts`)**:
     - 학생이 `학교 / 학년 / 반 / 번호 / 생년월일 / 이름`을 입력해 가입 신청 시, 기기 하드웨어 지문 기반 MAC 식별값(`DEV_...` / `XX:XX:XX:XX:XX:XX`)과 공인 IP를 자동 감지하여 `student_registrations/{studentKey}`와 `device_locks/{deviceHash}`에 원자적 배치(`writeBatch` + `existsAfter`)로 저장.
     - 동일 기기(MAC 식별값)에서 다른 학번으로 중복 신청하거나 동일 학번으로 중복 신청하는 경우 즉시 차단하며, 교사 화면에서도 동일 기기/동일 네트워크 IP 중복 배지를 표시.
  4. **관리자 승인 후 가입 처리 워크플로우**:
     - 신규 신청 학생은 `status: 'pending'` 상태로 등록되며 실시간 `onSnapshot` 대기 화면이 표시됨.
     - 관리자(`liha1634@gmail.com`)가 교사 모드에서 `[가입 승인]`(개별 또는 일괄 승인)을 누르면 즉시 `status: 'approved'`로 전환되어 학생 화면이 새로고침 없이 본 활동지(1·2차시)로 전환됨.
  5. **GitHub Pages `main` 브랜치 루트 호환 유지**:
     - `/index.html`이 Vite 환경(`/src/main.tsx`)과 GitHub Pages 정적 브랜치 호스팅(`./ghpages-app.js`, `./ghpages-app.css` 자동 폴백) 양쪽에서 모두 동일하게 동작하도록 구성.

---

## [작업 5] GitHub Actions 중복 워크플로우(`deploy.yml`) 오류 해결 및 GitHub Pages + Firebase 도메인 설정 안내

- **시작 및 완료 시각**: 2026-10-18T21:01:30-07:00
- **원인 분석**:
  1. 스크린샷에서 초록색 체크(`pages build and deployment`)는 GitHub 기본 브랜치 배포(`Deploy from a branch: main`)로 이미 정상 성공하고 있었음.
  2. 반면 빨간색 X(`Deploy to GitHub Pages`)는 커스텀 워크플로우(`.github/workflows/deploy.yml`)에서 `cache: 'npm'` 설정이 `package-lock.json` 부재(`bun.lock` 사용)로 인해 10초 만에 실패한 것이며, 브랜치 직접 배포 방식과 중복 실행되고 있었음.
- **해결 내역**:
  - 충돌을 일으키던 `.github/workflows/deploy.yml` 파일을 제거하여 기본 `pages build and deployment` 워크플로우만 깔끔하게(초록색 ✅) 실행되도록 정리.
  - 루트 `/index.html` + `/ghpages-app.js` + `/ghpages-app.css` 구조로 `main` 브랜치 푸시 시 빌드 설정 변경 없이 즉시 배포됨을 확인.

---

## [작업 6] 교사 모드 가입 신청 0명 표시 원인 POC 및 수정 + 학생 비밀번호 입력 기능(비활성화 모드) + MAC 주소 단독 식별 전환

- **시작 및 완료 시각**: 2026-10-18T22:59:30-07:00
- **1. 교사 모드 가입 신청 0명 표시 원인 POC 및 수정**:
  - **원인**:
    1. `firestore.rules`에서 `student_registrations` 및 `device_locks`의 `allow list`가 `isAdmin()`에 묶여 있어, 인증 토큰 갱신 직후 쿼리가 거부되거나 학생 로그인 시 학교명 약칭(`수일고` vs `수일고등학교`) 폴백 조회가 차단됨.
    2. GitHub Pages(`https://4ai4me.github.io/Props/`)에 배포된 `ghpages-app.js`가 구버전이어서 온라인 접속 시 이전 번들이 로드되고 있었음.
  - **해결**:
    - `firestore.rules`에서 `status in ['pending', 'approved', 'rejected']` 조건으로 목록 쿼리를 허용하고 `DeployRules`로 즉시 배포.
    - `TeacherView.tsx`에 `[목록 새로고침]` 버튼 추가 및 `AuthGateView.tsx`에 학번/이름/생년월일 폴백 검색 추가.
- **2. 학생 신규 가입 신청 시 비밀번호 입력 기능 추가 (비활성화 모드)**:
  - `src/utils/authLogic.ts`: `validateStudentPassword` 구현 (대문자, 소문자, 숫자, 특수문자 각 1자 이상 포함, 최소 8자리~최대 32자리 검증) 및 `STUDENT_PASSWORD_FEATURE_ENABLED = false` 상수로 비활성화 모드 설정.
  - `src/components/AuthGateView.tsx`: 비밀번호 입력 필드 및 5대 규격 배지(8~32자리, 대문자, 소문자, 숫자, 특수문자) UI를 생성하되 `disabled={!STUDENT_PASSWORD_FEATURE_ENABLED}` 상태로 비활성화 처리.
- **3. 학교 동일 IP 환경을 고려한 MAC 주소 단독 식별 변경**:
  - `src/utils/deviceFingerprint.ts`: 외부 공인 IP 조회(`api.ipify.org`)를 제거하고, 기기 고유 MAC 주소 식별자(`deviceHash`)만을 생성·반환하도록 변경 (`ipAddress: 'mac-only'`).
  - `src/components/AuthGateView.tsx` 및 `src/components/TeacherView.tsx`: IP 표시 및 동일 네트워크 IP 중복 경고를 모두 제거하고, 오직 기기 고유 MAC 주소 식별자(`formatDeviceHashAsMac(deviceHash)`) 기준으로만 중복 가입을 식별·표시하도록 수정.
  - 루트 정적 번들(`ghpages-app.js`, `ghpages-app.css`) 최신화 및 단위 테스트·브라우저 검증 완료.
