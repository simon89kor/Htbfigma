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
- [x] F4: Home Extension — 완료 (2026-02-26)
  - BannerCarousel.tsx, FilterSheet.tsx, SearchResultPage.tsx, ProviderProfilePage.tsx 신규 생성
  - StorePage.tsx 수정 (배너 캐러셀 + 검색 모드 + 최근/인기 검색어)
  - ProductDetailPage.tsx 수정 (좋아요 하트 토글 + 공유 버튼 + 리뷰 섹션 + Provider 링크)
  - routes.ts에 2개 라우트 추가 (/search, /provider/:id)
  - FB-002: getRoutines priceRange 필터 (SUGGESTION, OPEN)
  - FB-003: routine_likes 테이블 (SUGGESTION, OPEN)
- [x] F5: Community — 완료 (2026-02-26)
  - CommunityFeedPage.tsx, PostCard.tsx, CommentList.tsx, PostDetailPage.tsx, PostCreatePage.tsx, UserProfileViewPage.tsx, RankingDetailPage.tsx 신규 생성
  - community-context.tsx 신규 생성 (CommunityProvider)
  - RootProviders.tsx 수정 (CommunityProvider 추가)
  - routes.ts에 5개 라우트 추가 (/community, /community/create, /community/:id, /user/:id, /ranking)
- [x] F6: Board Extension — 완료 (2026-02-26)
  - TodoDetailSheet.tsx, ProgressStatsPage.tsx 신규 생성
  - CalendarView.tsx 수정 (달성 마커 + 통계 보기 링크)
  - TodoListUsable.tsx 수정 (상세 설정 진입점 + TodoDetailSheet 연결)
  - routes.ts에 1개 라우트 추가 (/stats)
  - FB-004: get_user_stats RPC 반환 형식 명세 (IMPORTANT, OPEN)
  - FB-005: store-context memo/notification 서버 동기화 (SUGGESTION, OPEN)
- [x] F7: Notification — 완료 (2026-02-26)
  - NotificationCenterPage.tsx, NotificationCard.tsx 신규 생성
  - notification-context.tsx 신규 생성 (NotificationProvider + Supabase Realtime 구독)
  - Layout.tsx 수정 (헤더 알림 아이콘 + 미읽음 뱃지 + 커뮤니티 네비 탭)
  - RootProviders.tsx 수정 (NotificationProvider 추가)
  - routes.ts에 1개 라우트 추가 (/notifications)
- [x] Phase 2 routes.ts + Layout.tsx 통합 — 완료 (2026-02-26)
  - F4: 2개 라우트 (search, provider/:id)
  - F5: 5개 라우트 (community, community/create, community/:id, user/:id, ranking)
  - F6: 1개 라우트 (stats)
  - F7: 1개 라우트 (notifications)
  - Layout.tsx: 헤더 알림 아이콘 + 네비 커뮤니티 탭 추가
  - 총 9개 신규 라우트 추가 (+ 1개 기존 라우트 포함 = 10개 lazy-loaded routes)
- [x] R0: 리뷰 — PASS (2026-02-26)
  - F4: 88/100 PASS
  - F5: 90/100 PASS
  - F6: 87/100 PASS
  - F7: 92/100 PASS
  - Backend Feedback: 5건 OPEN (0 BLOCKER, 1 IMPORTANT, 4 SUGGESTION)
- [x] P0: 기획 동기화 — 완료 (2026-02-26)
  - 기획서 4개 업데이트 (02_HOME_EXT, 04_POST_COMMUNITY, 05_BOARD_EXT, 08_NOTIFICATION)
  - 00_INDEX.md 상태 업데이트 (17→27 페이지/라우트)
  - CHANGELOG.md Phase 2 변경 사항 기록

## Phase 3: Frontend P2~P3
- [ ] F8: Reward — 대기
- [ ] F9: Admin — 대기
- [ ] Phase 3 최종 통합 — 대기
