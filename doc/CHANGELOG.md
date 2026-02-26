# HTB Project — CHANGELOG

> 기획 변경, 스키마 변경, 에이전트 범위 변경 등을 기록합니다.
> P0 Planner가 매 Phase 완료 후 업데이트합니다.

---

## [2026-02-26] Phase 1 후속 — 버그 수정 + 기획 확정

### 버그 수정 (R0 리뷰 Non-critical → 서비스 버그로 재분류)
- [F1] SplashScreen 배경: `bg-white` → `#65D9AC` 그라데이션 (브랜드 첫인상)
- [F1] TermsAgreementPage: user null 시 약관 동의 사일런트 실패 → 에러 토스트 + /login 리다이렉트
- [F1/F2/F3] routes.ts: F2/F3 신규 페이지 lazy loading 통일 (메인 번들 -30KB)
- [F2] PeriodSelectionSheet: options 0개 시 크래시 → 빈 상태 UI 방어
- [F2] PaymentMethodPage: TODO 주석 `[FB-F2]` → `[FB-001]` 형식 통일

### 기획 확정
- [기획서 07] **MyListsPage 3탭 구조 확정** — DB `user_routines` 테이블이 `status`(진행상태)와 `is_custom`(소유형태) 2축으로 설계됨. 4탭은 2축 혼용으로 겹침 발생. 소유형태 기준 3탭(전체/구매/직접) + 프로그레스 카드로 확정. 기획서(07_MY_PAGE.md MY-02) 업데이트 완료.

### 문서 추가
- `doc/HUMAN_TODO.md` — 수동 처리 필요 항목 추적 문서 생성

---

## [2026-02-26] Phase 1 완료 — Frontend P0 (Critical)

### 기획 변경
- [기획서 01] AuthCallbackPage 추가 — 기획서 원본에 없었으나, Supabase OAuth 플로우에서 `/auth/callback` 리다이렉트 처리를 위해 F1이 추가 구현. 기획서에 ONBOARD-05.5로 반영함.
- [기획서 01] localStorage 키 변경 — `htb_visited` → `htb_walkthrough_done` (구현에서 더 명확한 네이밍 사용)
- [기획서 01] 온보딩 라우트 전체 Layout 밖 배치 — Terms, Preference도 Layout 밖 풀스크린으로 변경 (기획서는 Terms/Preference를 Layout 안으로 예상)
- [기획서 01] API 호출 방식 변경 — REST API 직접 호출 → Supabase Auth SDK 사용 (`supabase.auth.signInWithOAuth`, `supabase.auth.getSession`)
- [기획서 01] 워크스루 일러스트 → Lucide 아이콘 placeholder 대체 (에셋 미준비)
- [기획서 07] **MyListsPage 탭 구조 변경** — 기획(진행중/완료/구매/직접 4탭) → 구현(전체/구매한 루틴/나만의 루틴 3탭). 사유: MyListsPage가 TODAY 보드 역할을 겸하며 주간 캘린더를 포함하므로 소유 형태별 분류가 더 적합. 전체 프로그레스 요약 카드에서 진행중/완료 루틴 수를 표시하여 원본 의도를 보완.
- [기획서 07] Settings 우선순위 변경 — P1 → P0 (Phase 1에서 앞당겨 구현)

### 산출물 추가 (기획에 없으나 구현됨)
- `AuthCallbackPage.tsx` — OAuth 리다이렉트 콜백 처리 (기획서에 반영 완료)
- MyListsPage 전체 프로그레스 요약 카드 — 전체 진행률, 진행중/완료 루틴 수, 완료 할일 수 표시
- MyListsPage 주간 캘린더 뷰 + 캘린더 뷰 토글

### 미구현 항목 (기획에 있으나 구현 안 됨)
- [기획서 07] QR Code Center (MY-03) — P1 → Phase 2 예정
- [기획서 07] Following/Followers (MY-04) — P1 → Phase 2 예정
- [기획서 07] MyListsPage 진행중/완료 분리 탭 — 3탭 구조로 확정 (기획서 업데이트 완료)

### Backend Feedback 반영
- FB-001: process-payment Edge Function (SUGGESTION) — OPEN 유지, Phase 2에서 처리 예정

### R0 리뷰 결과
- F1: 90/100 PASS
- F2: 85/100 CONDITIONAL_PASS → Critical 1건 (비로그인 구매 시도 미처리) 수정 → PASS
- F3: 86/100 PASS
- 시스템 통합: 전항목 PASS
- 최종: PASS (총점 88/100)

### 문서 업데이트 (P0 Planner)
- `doc/01_ONBOARDING.md` — 상태 MISSING→EXISTS, AuthCallbackPage 추가, 라우트/API/파일목록 최신화
- `doc/03_PURCHASE.md` — 상태 MISSING→EXISTS, 구현 완료 파일목록 최신화
- `doc/07_MY_PAGE.md` — 상태 PARTIAL(P0완료), 탭 구조 변경 기록, Settings 우선순위 변경, 파일목록 최신화
- `doc/00_INDEX.md` — 17개 페이지 상태 테이블 업데이트, 기획서 상태 반영
- `doc/PROGRESS.md` — Phase 1 완료 상태 기록
- `doc/CHANGELOG.md` — 이번 항목 추가

---

## [2026-02-25] Phase 0 완료 — Backend Foundation

### 기획 변경
- (Phase 0에서는 기획 변경 없음 — 기획서 기반으로 스키마 신규 생성)

### 스키마 변경
- 전체 스키마 신규 생성: 25개 테이블, 11개 트리거, 4개 RPC 함수
- comments 트리거: soft delete(status='deleted') 시 comment_count 감소 추가
- challenge_participants 트리거: soft delete(status='withdrawn') 시 participant_count 감소 추가

### 에이전트 범위 변경
- R0_REVIEWER 에이전트 신설 (품질 게이트)

### Backend Feedback 반영
- (Phase 0에서는 FE 작업 없으므로 피드백 없음)

### R0 리뷰 결과
- B1: 92/100 → 재수정 후 PASS
- B2: 88/100 → 재수정 후 PASS
- B3: 90/100 → 재수정 후 PASS
- Critical 7건 수정 완료, Non-critical 2건 수정 완료
