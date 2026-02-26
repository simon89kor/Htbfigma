# HTB Project — 개발 진행 상황

> 이 파일은 에이전트 실행 시 자동 업데이트됩니다.

## Phase 0: Backend Foundation
- [x] B1: DB Architect — 완료 (2026-02-25)
  - 마이그레이션 SQL 11개 (supabase/migrations/)
  - TypeScript 타입 정의 (src/lib/database.types.ts)
  - ERD 문서 (doc/DATABASE_SCHEMA.md)
  - 테이블 25개, 트리거 11개, RPC 함수 4개, Storage 버킷 5개
- [x] B2: Supabase Client — 완료 (2026-02-25)
  - Supabase 클라이언트 싱글톤 (src/lib/supabase.ts)
  - API 레이어 11개 모듈 (src/lib/api/*.ts)
  - Auth 헬퍼 (src/lib/auth.ts)
  - auth-context.tsx, store-context.tsx Supabase 연동 교체
  - @supabase/supabase-js 패키지 설치
- [x] B3: Edge Functions — 완료 (2026-02-25)
  - RPC 함수 추가 (00012_create_rpc_functions.sql)
  - Edge Functions 4개 (process-payment, send-notification, aggregate-stats, qr-generate)
  - Seed Data (supabase/seed.sql)
- [x] Phase 0 통합 — 완료 (2026-02-25)
- [x] R0: 리뷰 — PASS (2026-02-25)
  - B1: 92/100, B2: 88/100, B3: 90/100
  - Critical 7건 발견 → 수정 완료 → 재리뷰 PASS
  - Non-critical 2건 (soft delete-트리거 불일치) → 수정 완료
    - on_comment_change: UPDATE OF status 이벤트 추가 (status='deleted' 감지)
    - on_challenge_participant_change: UPDATE OF status 이벤트 추가 (status='withdrawn' 감지)

## Phase 1: Frontend P0 (Critical)
- [x] F1: Onboarding — 완료 (2026-02-26)
  - SplashScreen.tsx, WalkthroughPage.tsx, AuthCallbackPage.tsx, TermsAgreementPage.tsx, PreferenceSetupPage.tsx 신규 생성
  - LoginPage.tsx 수정 (카카오/애플/구글 소셜 로그인 버튼 추가)
  - routes.ts에 5개 라우트 추가 (Layout 밖 풀스크린, lazy import)
- [x] F2: Purchase — 완료 (2026-02-26)
  - PeriodSelectionSheet.tsx, PaymentMethodPage.tsx, PurchaseCompletePage.tsx 신규 생성
  - ProductDetailPage.tsx 수정 (구매하기 버튼 + PeriodSheet 연결)
  - routes.ts에 2개 라우트 추가 (/payment, /purchase-complete)
  - FB-001: process-payment Edge Function 필요 (SUGGESTION, Phase 2 대상)
- [x] F3: MyPage Core — 완료 (2026-02-26)
  - ProfilePage.tsx 확장 (커버이미지, 팔로워/팔로잉 카운트, 게시물/루틴/구매내역 탭, 인라인 편집, 아바타/커버 업로드)
  - MyListsPage.tsx 확장 (전체 프로그레스 요약 카드 + 루틴별 프로그레스 바)
  - SettingsPage.tsx 신규 생성 (알림 토글, 계정관리, 로그아웃 확인모달, 탈퇴 이중확인)
  - routes.ts에 1개 라우트 추가 (/settings)
- [x] Phase 1 routes.ts 통합 — 완료 (2026-02-26)
  - F1: 5개 라우트 (splash, walkthrough, auth/callback, terms, preference)
  - F2: 2개 라우트 (payment, purchase-complete)
  - F3: 1개 라우트 (settings)
  - 총 8개 신규 라우트 추가
- [x] R0: 리뷰 — PASS (2026-02-26)
  - F1: 90/100 PASS
  - F2: 85/100 CONDITIONAL_PASS → Critical 1건 수정 → PASS
  - F3: 86/100 PASS
  - 시스템 통합: 전항목 PASS
  - 총점: 88/100
- [x] P0: 기획 동기화 — 완료 (2026-02-26)
  - 기획서 3개 업데이트 (01_ONBOARDING, 03_PURCHASE, 07_MY_PAGE)
  - 00_INDEX.md 상태 업데이트
  - MyListsPage 탭 구조 괴리 기록 (기획 4탭 → 구현 3탭)

## Phase 2: Frontend P1 (Important)
- [ ] F4: Home Extension — 대기
- [ ] F5: Community — 대기
- [ ] F6: Board Extension — 대기
- [ ] F7: Notification — 대기
- [ ] Phase 2 routes.ts + Layout.tsx 통합 — 대기

## Phase 3: Frontend P2~P3
- [ ] F8: Reward — 대기
- [ ] F9: Admin — 대기
- [ ] Phase 3 최종 통합 — 대기
