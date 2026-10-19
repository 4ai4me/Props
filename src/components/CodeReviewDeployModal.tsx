import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Globe,
  ShieldCheck,
  GitBranch,
  Copy,
  Check,
  Terminal,
  Layers,
  X,
  FileDown,
} from 'lucide-react';

interface CodeReviewDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadStandaloneHtml: () => void;
}

export const CodeReviewDeployModal: React.FC<CodeReviewDeployModalProps> = ({
  isOpen,
  onClose,
  onDownloadStandaloneHtml,
}) => {
  const [activeSection, setActiveSection] = useState<'review' | 'multiplatform' | 'github'>('review');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ghActionsYaml = `name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build_and_deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - name: Install dependencies
        run: npm install
      - name: Build static site
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-xs no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#d5dbd6] bg-[#fffefb] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#e2e6e1] bg-[#183541] px-5 py-4 text-white">
          <div>
            <div className="text-xs font-semibold tracking-wider text-[#deb87a]">
              ENGINEERING REVIEW · MULTI-PLATFORM · GITHUB PAGES
            </div>
            <h2 id="review-modal-title" className="mt-0.5 text-lg font-bold sm:text-xl">
              코드 분석·검토 리포트 및 GitHub 웹호스팅 가이드
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="리포트 창 닫기"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#e2e6e1] bg-[#f4f2ec] px-5 py-3">
          <button
            type="button"
            onClick={() => setActiveSection('review')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors whitespace-nowrap ${
              activeSection === 'review'
                ? 'bg-[#1e5661] text-white'
                : 'bg-white text-[#20343d] border border-[#cfd6d2] hover:bg-[#e8f2f1]'
            }`}
          >
            <Layers className="h-4 w-4" />
            1. 원본 코드 정밀 분석·개선
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('multiplatform')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors whitespace-nowrap ${
              activeSection === 'multiplatform'
                ? 'bg-[#1e5661] text-white'
                : 'bg-white text-[#20343d] border border-[#cfd6d2] hover:bg-[#e8f2f1]'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            2. iOS · Android · PC 최적화 내역
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('github')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors whitespace-nowrap ${
              activeSection === 'github'
                ? 'bg-[#1e5661] text-white'
                : 'bg-white text-[#20343d] border border-[#cfd6d2] hover:bg-[#e8f2f1]'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            3. GitHub 웹호스팅 배포 가이드
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-sm leading-relaxed text-[#20343d]">
          {activeSection === 'review' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#c8d8ce] bg-[#f3f8f5] p-4">
                <h3 className="flex items-center gap-2 text-base font-bold text-[#154f57]">
                  <ShieldCheck className="h-5 w-5 text-[#187361]" />
                  종합 아키텍처 평가 및 하위 호환성 보장
                </h3>
                <p className="mt-1.5 text-[#364d54]">
                  첨부해주신 코드는 <strong>공통수학2 명제의 증명(1·2차시)</strong> 교육과정 성취기준에 맞춰
                  관찰 → 추측 → 반례 탐색 → 연역적 증명 → 교사 루브릭 피드백까지 완결성 있게 설계된 우수한 교육용 웹 애플리케이션입니다.
                  기존의 단일 HTML 파일에서 발생하던 모바일/태블릿 입력 오류와 DOM 재렌더링 병목을 모두 해결하면서도,
                  <strong> 기존 JSON 사건 파일 포맷(<code>kind: &quot;proof2lesson-v1&quot;</code>)과 브라우저 저장소 키를 100% 그대로 호환</strong>하도록 설계했습니다.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[#e0e3dd] bg-white p-4">
                  <div className="flex items-center gap-2 font-bold text-[#945e18]">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    원본 코드에서 발견된 핵심 문제점 5가지
                  </div>
                  <ul className="mt-3 space-y-2.5 text-xs sm:text-sm text-[#43565e]">
                    <li>
                      <strong>① 전체 DOM 덮어쓰기(<code>innerHTML</code>) 구조:</strong> 버튼 클릭이나 상태 변경 시마다
                      <code>#studentContent.innerHTML</code> 전체를 재생성하여, 모바일 가상 키보드가 내려가거나 한글 IME 조합 중 포커스가 끊기는 현상이 발생합니다.
                    </li>
                    <li>
                      <strong>② iOS 음수 입력 불가 문제:</strong> iOS(iPhone) 기본 숫자 패드(<code>type=&quot;number&quot;</code>)에는
                      음수 부호(<code>-</code>) 키가 없는 경우가 많아, 1차시 필수 조건인 <em>&quot;음의 홀수 1개 이상 입력&quot;</em>을 수행하기 어렵습니다.
                    </li>
                    <li>
                      <strong>③ iOS Safari 자동 화면 확대(Zoom-in):</strong> 교사용 평가 셀렉트 및 일부 입력 요소의 글자 크기가 <code>13px~14px</code>로 지정되어 있어,
                      iOS에서 터치 시 화면이 강제로 확대되며 레이아웃이 깨집니다.
                    </li>
                    <li>
                      <strong>④ 네이티브 <code>alert()</code> / <code>confirm()</code> 의존:</strong> 인앱 브라우저(카카오톡, 클래스팅, 구글 클래스룸 웹뷰)나 iframe 환경에서
                      네이티브 팝업이 차단되면 초기화·파일 불러오기·CSV 저장이 먹통이 됩니다.
                    </li>
                    <li>
                      <strong>⑤ CSS 이중 선언 및 폰트 누락:</strong> 상단 기본 테마와 하단 &lsquo;수학 탐정단 리브랜딩 테마&rsquo;가 중복 선언되어 있고,
                      <code>Pretendard</code> 웹폰트 CDN 링크가 빠져 있어 기기마다 글꼴과 자간이 다르게 보입니다.
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[#cbe2d8] bg-[#f8fcf9] p-4">
                  <div className="flex items-center gap-2 font-bold text-[#187361]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    본 프로젝트에서의 리팩토링 및 해결책
                  </div>
                  <ul className="mt-3 space-y-2.5 text-xs sm:text-sm text-[#2d4840]">
                    <li>
                      <strong>① React 가상 DOM + 순수 로직 분리:</strong> 수학 계산·검증 로직을 <code>src/utils/mathLogic.ts</code>로 분리(Unit Test 완비)하고,
                      상태 변화 시 필요한 컴포넌트만 부분 업데이트하여 한글 타이핑과 스크롤 위치를 완벽히 보존합니다.
                    </li>
                    <li>
                      <strong>② 모바일 친화적 음수·증감 컨트롤 추가:</strong> 모든 정수 입력창 옆에 <strong>[±부호 전환]</strong>,{' '}
                      <strong>[-2 / +2]</strong> 터치 버튼을 배치하여 iOS/Android 터치만으로도 음의 홀수·짝수를 즉시 실험할 수 있습니다.
                    </li>
                    <li>
                      <strong>③ 전 플랫폼 16px 입력 규격 &amp; Pretendard 탑재:</strong> 모든 입력창(input, select, textarea)의
                      최소 폰트 크기를 16px로 고정하여 iOS 자동 줌인을 원천 차단하고, Pretendard 웹폰트를 연결했습니다.
                    </li>
                    <li>
                      <strong>④ 커스텀 비차단 모달 &amp; 토스트 알림 시스템:</strong> 모든 alert/confirm을 접근성 표준(role=&quot;dialog&quot;)을 갖춘
                      인앱 확인 모달과 상태 배너로 교체했습니다.
                    </li>
                    <li>
                      <strong>⑤ 실시간 나눗셈 분석기 추가:</strong> 단순 숫자 표뿐 아니라 n² = 8q + r 형태의 몫과 나머지를 실시간으로 분해해 보여주는 분석 박스를 제공하여 직관적 이해를 돕습니다.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'multiplatform' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-[#dcded7] bg-white p-4">
                  <div className="text-xs font-extrabold tracking-wider text-[#1e5661]">iOS / iPadOS (Safari)</div>
                  <h4 className="mt-1 font-bold text-base">아이폰 · 아이패드 최적화</h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#4a5c64]">
                    <li>• <code>font-size: 16px</code> 강제로 입력창 포커스 시 강제 화면 확대 방지</li>
                    <li>• iOS 숫자 키패드 한계를 극복하는 <code>± 부호 변환</code> 및 빠른 추천칩 제공</li>
                    <li>• 노치 및 홈 인디케이터 영역 보호 (<code>viewport-fit=cover</code> 및 <code>safe-area-inset</code> 적용)</li>
                    <li>• <code>Blob</code> 다운로드 시 iOS Safari 파일 앱 연동 및 클립보드 복사 백업 지원</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[#dcded7] bg-white p-4">
                  <div className="text-xs font-extrabold tracking-wider text-[#187361]">Android (Chrome / Samsung)</div>
                  <h4 className="mt-1 font-bold text-base">안드로이드 폰 · 갤럭시 탭</h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#4a5c64]">
                    <li>• 모든 터치 타깃 최소 크기 <code>44px × 44px</code> 이상 확보 (<code>touch-action: manipulation</code>)</li>
                    <li>• 가상 키보드 활성화 시 상단 고정 영역을 최소화하여 답안 작성 시야 확보</li>
                    <li>• 5단계 수사 네비게이션을 좁은 화면에서도 가독성 높은 5열/반응형 그리드로 자동 조절</li>
                    <li>• 한글 모아쓰기(IME) 중 실시간 상태 저장 시 글자 깨짐 방지</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[#dcded7] bg-white p-4">
                  <div className="text-xs font-extrabold tracking-wider text-[#945e18]">PC / Chromebook / 전자칠판</div>
                  <h4 className="mt-1 font-bold text-base">데스크톱 · 교실 전자칠판</h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#4a5c64]">
                    <li>• 1440px 와이드 해상도에 맞춘 2열 교사용 비교 뷰 및 4분할 역량 대시보드</li>
                    <li>• 키보드 <code>Tab</code> 및 <code>:focus-visible</code> 고대비 포커스 링 완비</li>
                    <li>• A4 인쇄 및 학생 개별 피드백 PDF 출력 전용 <code>@media print</code> 레이아웃</li>
                    <li>• 엑셀에서 한글이 깨지지 않는 UTF-8 BOM(<code>\ufeff</code>) 및 수식 주입 방지 CSV 내보내기</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-[#dcded7] bg-[#f7f9f5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-[#183541]">교실 오프라인 배포용 단일 HTML 파일도 필요하신가요?</h4>
                  <p className="text-xs text-[#54676e] mt-0.5">
                    GitHub 레포지토리 전체 빌드 배포뿐 아니라, 인터넷이 없는 교실 환경이나 학습관리시스템(LMS)에 파일 하나로 바로 올릴 수 있도록
                    다중 플랫폼 최적화가 적용된 단일 <code>index.html</code> 파일도 내려받을 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onDownloadStandaloneHtml}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e5661] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#16424b] shrink-0 whitespace-nowrap"
                >
                  <FileDown className="h-4 w-4" />
                  독립 실행형 단일 HTML 내려받기
                </button>
              </div>
            </div>
          )}

          {activeSection === 'github' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#c8d8ce] bg-[#f3f8f5] p-4">
                <h3 className="flex items-center gap-2 text-base font-bold text-[#154f57]">
                  <Globe className="h-5 w-5 text-[#187361]" />
                  GitHub Pages 웹호스팅 완벽 대응 완료 (<code>base: &apos;./&apos;</code>)
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#364d54]">
                  GitHub Pages는 <code>https://아이디.github.io/레포지토리이름/</code> 형태의 하위 경로에서 호스팅되는 경우가 많습니다.
                  본 프로젝트의 <code>vite.config.ts</code>에는 상대 경로 빌드(<code>base: &apos;./&apos;</code>)가 이미 적용되어 있어,
                  루트 도메인이든 하위 폴더든 정적 에셋(JS/CSS) 경로 깨짐 없이 즉시 작동합니다.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-[#183541] flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#1e5661]" />
                  방법 A. GitHub Actions 자동 배포 (가장 추천 · Push만 하면 자동 호스팅)
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-[#3a4d54]">
                  <li>GitHub에서 새 Repository를 생성하고 본 프로젝트 코드를 푸시(Push)합니다.</li>
                  <li>GitHub 레포지토리의 <strong>Settings → Pages → Build and deployment</strong>에서 Source를 <strong>GitHub Actions</strong>로 변경합니다.</li>
                  <li>프로젝트 내 <code>.github/workflows/deploy.yml</code>에 아래 워크플로우를 저장하면, <code>main</code> 브랜치에 푸시할 때마다 자동으로 빌드·웹호스팅됩니다.</li>
                </ol>

                <div className="relative rounded-xl bg-slate-900 p-4 text-xs text-slate-100 font-mono overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => copyText('yaml', ghActionsYaml)}
                    className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-sans font-semibold text-white hover:bg-white/20"
                  >
                    {copiedId === 'yaml' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" /> 복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> YAML 복사
                      </>
                    )}
                  </button>
                  <pre className="leading-relaxed">{ghActionsYaml}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e2e6e1] bg-[#f4f2ec] px-5 py-3.5">
          <span className="text-xs text-[#5d6e75]">
            JSON 호환 규격: <code className="font-mono font-bold">proof2lesson-v1</code> · 오프라인/정적 호스팅 완벽 지원
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#183541] px-5 py-2 text-sm font-bold text-white hover:bg-[#214858]"
          >
            확인 후 탐구 화면으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
