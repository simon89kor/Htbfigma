# HTB 정식 런칭 체크리스트

> 작성일: 2026-03-04
> 각 항목을 **사람(Human)** / **Claude** 로 분류하고, 실행 순서대로 정리했습니다.

---

## 상태 범례

- `[ ]` 미처리
- `[~]` 진행중
- `[x]` 완료
- 🧑 = 사람이 직접 해야 하는 작업 (외부 서비스, 계약, 에셋 등)
- 🤖 = Claude가 코드로 처리 가능한 작업

---

## Step 1 — 인프라 & 배포 기반 (사람 작업 중심)

> 코드 수정보다 먼저, 외부 서비스 설정이 선행되어야 합니다.

| # | 작업 | 담당 | 상세 |
|---|------|------|------|
| 1-1 | [ ] 프로덕션 도메인 구매 & DNS 설정 | 🧑 | Vercel에 커스텀 도메인 연결, SSL 자동 적용 |
| 1-2 | [ ] Vercel 프로젝트 생성 & 환경변수 등록 | 🧑 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 등록 |
| 1-3 | [ ] Supabase 프로덕션 마이그레이션 적용 | 🧑 | SQL Editor에서 `00001`~`00016` 순서대로 실행 또는 `supabase db push` |
| 1-4 | [ ] Supabase Edge Functions 배포 | 🧑 | `supabase functions deploy process-payment send-notification aggregate-stats qr-generate` |
| 1-5 | [ ] Supabase Storage 버킷 공개/비공개 설정 확인 | 🧑 | avatars, covers, post-images, routine-images, banners |

---

## Step 2 — 보안 강화 (Claude 작업 중심)

> 외부 노출 전 반드시 처리해야 하는 보안 항목입니다.

| # | 작업 | 담당 | 상세 |
|---|------|------|------|
| 2-1 | [ ] Edge Functions CORS origin 제한 | 🤖 | `origin: "*"` → 프로덕션 도메인으로 변경 (4개 함수) |
| 2-2 | [ ] SECURITY DEFINER 함수 search_path 설정 | 🤖 | 00009 내 14개 트리거 함수에 `SET search_path = public` 추가 마이그레이션 작성 |
| 2-3 | [ ] 데모 계정 버튼 제거 | 🤖 | LoginPage.tsx에서 `demo@todomarket.kr` 관련 코드 제거 |
| 2-4 | [ ] PaymentMethodPage → Edge Function 연결 | 🤖 | 클라이언트 직접 DB 호출 → `process-payment` Edge Function 호출로 교체 |
| 2-5 | [ ] ErrorBoundary 컴포넌트 추가 | 🤖 | React Router `errorElement` 활용, 전역 에러 캐치 |

---

## Step 3 — 인증 & OAuth 설정 (사람 작업 중심)

> 소셜 로그인을 위한 외부 서비스 등록입니다. 코드는 이미 준비되어 있습니다.

| # | 작업 | 담당 | 상세 |
|---|------|------|------|
| 3-1 | [ ] Kakao Developers 앱 등록 | 🧑 | Client ID/Secret 발급 → Supabase Auth Provider에 입력 |
| 3-2 | [ ] Google Cloud Console OAuth 등록 | 🧑 | Client ID/Secret 발급 → Supabase Auth Provider에 입력 |
| 3-3 | [ ] Apple Developer 로그인 설정 | 🧑 | Key ID/Team ID/Client ID 발급 → Supabase Auth Provider에 입력 |
| 3-4 | [ ] OAuth redirect URL 확인 | 🧑 | 각 Provider에 프로덕션 도메인의 callback URL 등록 |

---

## Step 4 — 누락 페이지 & 기능 구현 (Claude 작업)

> 코드에서 빠져있거나 placeholder인 기능을 구현합니다.

| # | 작업 | 담당 | 상세 |
|---|------|------|------|
| 4-1 | [ ] `/auth/reset-password` 라우트 & 페이지 생성 | 🤖 | 비밀번호 재설정 이메일 링크 수신 후 새 비밀번호 입력 페이지 |
| 4-2 | [ ] SettingsPage 비밀번호 변경 기능 연동 | 🤖 | `updateUser({ password })` 연동 (auth.ts에 함수 이미 존재) |
| 4-3 | [ ] SettingsPage 소셜 계정 연동 관리 | 🤖 | Supabase Auth identities API 연동 |
| 4-4 | [ ] CartPage ↔ 결제 플로우 통합 | 🤖 | 레거시 `checkout()` 경로 → `/payment` 플로우로 통합 |
| 4-5 | [ ] 이용약관 페이지 생성 | 🤖 | 약관 내용은 사람이 작성, 페이지 컴포넌트는 Claude가 생성 |
| 4-6 | [ ] 개인정보처리방침 페이지 생성 | 🤖 | 방침 내용은 사람이 작성, 페이지 컴포넌트는 Claude가 생성 |

---

## Step 5 — 브랜딩 & 에셋 (사람 + Claude 협업)

> 디자인 에셋은 사람이 준비하고, 코드 삽입은 Claude가 합니다.

| # | 작업 | 담당 | 상세 |
|---|------|------|------|
| 5-1 | [ ] HTB 로고 SVG 제작 | 🧑 | 디자이너 또는 직접 제작 |
| 5-2 | [ ] 워크스루 일러스트 3장 제작 | 🧑 | WalkthroughPage용 |
| 5-3 | [ ] 에셋 코드에 삽입 | 🤖 | SplashScreen.tsx, WalkthroughPage.tsx에 로고/일러스트 교체 |
| 5-4 | [ ] 브랜드명 `TodoMarket` → 실제 서비스명 일괄 변경 | 🤖 | Layout, RegisterPage, MyListsPage, context 파일 등 전체 변경 |
| 5-5 | [ ] 파비콘 & OG 이미지 설정 | 🧑+🤖 | 에셋은 사람이 준비, index.html 메타태그는 Claude가 수정 |

---

## Step 6 — 모니터링 & 품질 (Claude 작업 중심)

> 런칭 후 문제를 빠르게 인지하기 위한 도구 설정입니다.

| # | 작업 | 담당 | 상세 |
|---|------|------|------|
| 6-1 | [ ] Sentry 연동 | 🤖 | `@sentry/react` 설치 + 초기화 코드 작성 |
| 6-2 | [ ] Sentry 프로젝트 생성 & DSN 발급 | 🧑 | sentry.io에서 프로젝트 생성 후 DSN 제공 |
| 6-3 | [ ] package.json scripts 보강 | 🤖 | `lint`, `typecheck`, `preview` 스크립트 추가 |
| 6-4 | [ ] 번들 크기 분석 & 최적화 | 🤖 | `vite-bundle-visualizer` 분석 후 큰 청크 분리 |

---

## Step 7 — 결제 시스템 (사람 + Claude 협업)

> 실제 결제를 받으려면 PG사 계약이 필수입니다.

| # | 작업 | 담당 | 상세 |
|---|------|------|------|
| 7-1 | [ ] 사업자등록증 준비 | 🧑 | PG 계약 전 필수 |
| 7-2 | [ ] 통신판매업 신고 | 🧑 | 온라인 결제 서비스 운영 시 법적 필수 |
| 7-3 | [ ] PG사 계약 (Toss Payments / PortOne 등) | 🧑 | 가맹점 계약 + API Key 발급 |
| 7-4 | [ ] process-payment Edge Function에 실제 PG 연동 | 🤖 | PG API Key 수령 후, 결제 검증 로직 구현 |
| 7-5 | [ ] SettingsPage 결제수단 관리 기능 구현 | 🤖 | PG 연동 완료 후 카드 등록/삭제 UI 구현 |

---

## Step 8 — 법적 준비물 (사람 작업)

> 서비스 공개 전 법적으로 필요한 문서와 절차입니다.

| # | 작업 | 담당 | 상세 |
|---|------|------|------|
| 8-1 | [ ] 이용약관 내용 작성 | 🧑 | 법률 검토 권장 |
| 8-2 | [ ] 개인정보처리방침 내용 작성 | 🧑 | 개인정보보호법 준수, 수집항목/목적/보유기간 명시 |
| 8-3 | [ ] 개인정보처리방침 KISA 신고 | 🧑 | 개인정보보호 포털에서 공개 |
| 8-4 | [ ] 마케팅 수신동의 절차 확인 | 🧑 | 앱 내 동의 UI 존재 여부 확인 |

---

## Step 9 — 최종 QA & 배포 (협업)

| # | 작업 | 담당 | 상세 |
|---|------|------|------|
| 9-1 | [ ] 전체 플로우 수동 테스트 | 🧑 | 회원가입 → 온보딩 → 루틴 탐색 → 구매 → 커뮤니티 → 마이페이지 |
| 9-2 | [ ] 모바일 반응형 테스트 | 🧑 | iOS Safari, Android Chrome 에서 확인 |
| 9-3 | [ ] RLS 정책 실환경 검증 | 🧑+🤖 | 각 역할(anon, user, admin)별 데이터 접근 테스트 |
| 9-4 | [ ] Vercel 프로덕션 배포 | 🧑 | `main` 브랜치 push → 자동 배포 |
| 9-5 | [ ] 배포 후 스모크 테스트 | 🧑 | 프로덕션 URL에서 핵심 기능 동작 확인 |

---

## 요약 — 담당별 작업 수

| 담당 | 작업 수 | 주요 내용 |
|------|---------|-----------|
| 🧑 **사람만** | **18건** | 인프라 설정, OAuth 등록, PG 계약, 에셋 제작, 법적 문서, QA |
| 🤖 **Claude만** | **16건** | 보안 강화, 누락 페이지, 브랜드명 변경, 모니터링, 코드 최적화 |
| 🧑+🤖 **협업** | **5건** | 에셋 삽입, PG 연동, RLS 검증, 파비콘/OG |

---

## 권장 실행 순서

```
Step 1 (인프라)  ──→  Step 2 (보안)  ──→  Step 3 (OAuth)
       ↓                    ↓
Step 5 (브랜딩)       Step 4 (기능 구현)
       ↓                    ↓
Step 7 (결제) ←── Step 8 (법적 준비) ←── 병렬 진행 가능
       ↓
Step 6 (모니터링)
       ↓
Step 9 (QA & 배포)
```

**Step 1~3**은 사람 작업이 많으므로 먼저 착수하고,
그 사이 **Step 2, 4, 5-4**는 Claude에게 병렬로 맡길 수 있습니다.

---

> 이 문서는 런칭 진행에 따라 지속적으로 업데이트합니다.
> 각 항목 완료 시 `[x]`로 체크해주세요.
