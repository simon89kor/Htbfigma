# HTB Project — CHANGELOG

> 기획 변경, 스키마 변경, 에이전트 범위 변경 등을 기록합니다.
> P0 Planner가 매 Phase 완료 후 업데이트합니다.

---

## [2026-02-26] Phase 3 완료 — Frontend P2~P3 (Reward + Admin)

### 기획 변경
- [기획서 06] **상태 변경**: MISSING → EXISTS (Phase 3 F8에서 구현 완료)
- [기획서 06] **뱃지 카테고리 추가**: 기획의 4종(routine/streak/community/challenge) → 구현 5종(+special) (사유: DB badges 테이블에 'special' 카테고리가 정의되어 있어 구현에서 포함)
- [기획서 06] **RewardSummary 인터페이스 변경**: 기획의 `badges: Badge[]` → 구현 `recentBadges: (Badge & { isUnlocked: boolean; unlockedAt?: string })[]` (사유: 획득 상태를 뱃지 데이터와 함께 관리하기 위해 타입 확장)
- [기획서 06] **RewardContextType 확장**: 기획의 4개 함수 → 구현 5개 함수 + myRanking, challengesCount, loading 상태 추가 (사유: 내 순위 sticky 표시, 챌린지 카운트, 로딩 상태를 위해 확장)
- [기획서 06] **랭킹 카테고리 탭 변경**: 기획의 4종(전체/운동/식단/자기개발) → 구현 5종(+라이프) (사유: DB 카테고리 체계와 일치)
- [기획서 06] **랭킹 유저 탭 인터랙션 축소**: 기획의 "유저 탭 → User Profile View" 미구현 (사유: F5의 UserProfileViewPage와 연동은 스코프 밖, 순수 랭킹 보기에 집중)
- [기획서 09] **상태 변경**: MISSING → PARTIAL (Phase 3 F9에서 7개 화면 구현, 2개 미구현)
- [기획서 09] **AdminChallengeManagement 미구현**: 기획의 `/admin/challenges` 화면 미생성 (사유: 사이드바 메뉴는 존재하나 컴포넌트/라우트 미생성, 후속 처리 필요)
- [기획서 09] **AdminSettings 미구현**: 기획의 `/admin/settings` 화면 미생성 (사유: 사이드바 메뉴는 존재하나 컴포넌트/라우트 미생성, 후속 처리 필요)
- [기획서 09] **Dashboard 차트 구조 변경**: 기획의 4종(주간 가입자 라인차트, 카테고리별 매출 바차트, DAU 라인차트, 루틴 완료율 히스토그램) → 구현 3종 + 신고 리스트 (주간 가입자 라인차트, 카테고리별 매출 바차트, DAU 에어리어차트, 최근 신고 리스트) (사유: 루틴 완료율 히스토그램 대신 운영에 더 유용한 최근 신고 리스트로 대체, DAU는 에어리어차트로 변경)
- [기획서 09] **권한 체크 방식**: 기획의 `user.role !== 'admin'` (AuthContext에서 직접 확인) → 구현 `getProfile(user.id)` 후 `profile.role !== 'admin'` (사유: AuthContext의 user 객체가 role을 직접 포함하지 않으므로, profiles 테이블에서 별도 조회)

### 산출물 추가 (기획에 없으나 구현됨)
- [F8] `reward-context.tsx` — 리워드 데이터 Context Provider (HMR-safe Symbol 패턴, Supabase 연동)
- [F8] `src/lib/api/rewards.ts` — 리워드 전용 API 레이어 (뱃지/랭킹/챌린지 CRUD, RPC 호출)
- [F8] Layout.tsx 네비게이션 바에 리워드 탭 추가 (Trophy 아이콘, /reward 경로)
- [F8] RootProviders.tsx에 RewardProvider 추가
- [F8] 비로그인 사용자에 대한 리워드 메인 페이지 안내 화면 (로그인 유도)
- [F9] `src/lib/api/admin.ts` — Admin 전용 API 레이어 (대시보드 통계, 유저/루틴/구매/게시물 관리, 신고 처리)
- [F9] AdminLayout에 로딩 상태 스켈레톤 UI (auth + profile 로딩 시)
- [F9] AdminPostModeration에 신고 상세 다이얼로그 (신고자 정보, 사유, 기각/처리 완료 액션)
- [F9] AdminRoutineManagement에 보관 삭제 확인 다이얼로그
- [F9] AdminPurchaseManagement에 매출 요약 카드 (페이지 내 합계, 전체 건수)

### 미구현 항목 (기획에 있으나 구현 안 됨)
- [기획서 06] **뱃지 공유 버튼** — Badge Detail Bottom Sheet 내 SNS 공유/이미지 저장 미구현 (MVP 스코프 외)
- [기획서 06] **뱃지 progress 필드** — 기획의 `progress?: number (0~100)` 미획득 뱃지의 진행률 표시 미구현 (condition_type/condition_value로 추후 계산 가능)
- [기획서 09] **AdminChallengeManagement** — `/admin/challenges` 화면 미구현 (사이드바 메뉴만 존재)
- [기획서 09] **AdminSettings** — `/admin/settings` 화면 미구현 (사이드바 메뉴만 존재)
- [기획서 09] **Routine CRUD (생성/수정)** — AdminRoutineManagement에서 루틴 생성/수정 기능 미구현 (목록 조회 + 발행 상태 변경 + 삭제(보관)만 구현). `/admin/routines/create` 라우트도 미등록
- [기획서 09] **유저 삭제 API** — 기획의 `DELETE /api/admin/users/:id`는 미구현 (소프트 삭제: status='deleted'로 처리)
- [기획서 09] **AdminHeader 알림 건수** — 기획의 "신고 미처리 건수" 뱃지가 알림 아이콘에 표시되지 않음 (아이콘만 존재, 미처리 카운트는 대시보드에서 확인)

### Backend Feedback 반영
- FB-001 ~ FB-005: 전부 RESOLVED (Phase 2 후속 처리 완료)
- FB-006: Admin RLS 정책 보강 (IMPORTANT) — OPEN, F9에서 신규 등록. profiles UPDATE, routines SELECT/UPDATE에 admin 조건 추가 필요

### R0 리뷰 결과
- F8: 87/100 CONDITIONAL_PASS
- F9: 89/100 CONDITIONAL_PASS
- Backend Feedback: 1건 OPEN (FB-006, IMPORTANT)
- 최종: CONDITIONAL_PASS (평균 88/100)

### 문서 업데이트 (P0 Planner)
- `doc/06_REWARD.md` — 상태 MISSING→EXISTS, 구현 완료 파일목록, 인터페이스/API 변경, 뱃지 카테고리 추가
- `doc/09_ADMIN.md` — 상태 MISSING→PARTIAL, 구현 완료 파일목록, 미구현 2개 화면 기록, 차트 구조 변경
- `doc/00_INDEX.md` — 27→38 페이지/라우트 상태 테이블 업데이트, Phase 3 라우트 11개 추가
- `doc/PROGRESS.md` — Phase 3 완료 상태 기록 (F8+F9 + 통합 + R0 + P0)
- `doc/CHANGELOG.md` — 이번 항목 추가

---

## [2026-02-26] Phase 2 완료 — Frontend P1 (Important)

### 기획 변경
- [기획서 02] **상태 변경**: PARTIAL → EXISTS (Phase 2 F4에서 구현 완료)
- [기획서 02] **Banner linkType 추가**: `'routine' | 'category' | 'external'` → `'routine' | 'category' | 'challenge' | 'external'` (사유: DB 스키마에 'challenge' 타입이 포함되어 있어 구현에서 반영함)
- [기획서 02] **필터 카테고리 변경**: 기획의 5종(운동/식단/자기개발/자격증/취미) → 구현 8종(운동/라이프스타일/교육/비즈니스/여행/건강/자기개발/생산성) (사유: DB 카테고리 기준으로 구현)
- [기획서 04] **상태 변경**: MISSING → EXISTS (Phase 2 F5에서 구현 완료)
- [기획서 04] **피드 탭 구조 변경**: 기획의 5탭(전체/운동/식단/자기개발/랭킹) → 구현 8탭(전체/운동인증/자기개발/식단/라이프스타일/취미/공부/기타) (사유: 커뮤니티 특화 카테고리로 세분화, 랭킹은 별도 페이지 /ranking으로 분리)
- [기획서 04] **PostCreatePage 프로세스 변경**: 기획의 3-step → 구현 6-step(사진 선택→편집→필터→글작성→카테고리→루틴연결) (사유: 인스타그램형 UX 흐름 채택, 편집/필터는 placeholder)
- [기획서 05] **상태 변경**: PARTIAL → EXISTS (Phase 2 F6에서 구현 완료)
- [기획서 05] **TodoDetailSheet 알림 옵션 축소**: 기획의 4종(없음/시작시/10분전/30분전) → 구현 3종(없음/시작시/10분전) (사유: MVP 단순화, 30분 전은 추후 추가 가능)
- [기획서 05] **기간 필터 축소**: 기획의 3종(1주/1개월/3개월) → 구현 2종(주간/월간) (사유: 3개월 데이터 축적 전 의미 제한)
- [기획서 08] **상태 변경**: MISSING → EXISTS (Phase 2 F7에서 구현 완료)
- [기획서 08] **탭 구조 변경**: 기획의 3탭(일정/커뮤니티/구매) → 구현 4탭(전체/일정/커뮤니티/구매) (사유: "전체" 탭 추가하여 필터 없이 모든 알림 한눈에 확인 가능)
- [기획서 08] **미읽음 점 색상 변경**: 기획의 `--accent-color`(#65D9AC, 민트) → 구현 `--destructive`(#d4183d, 빨간색) (사유: 읽지 않은 알림의 시각적 긴급성 강화)

### 산출물 추가 (기획에 없으나 구현됨)
- [F5] `community-context.tsx` — 커뮤니티 데이터 Context Provider (Supabase 연동, 포스트 CRUD, 좋아요/북마크 관리)
- [F7] `notification-context.tsx` — 알림 Context Provider (Supabase Realtime 구독, unreadCount 전역 관리)
- [F5] `CommentList.tsx` — 댓글 목록/입력 공통 컴포넌트 (기획서에 별도 파일로 명시되지 않았으나 재사용을 위해 분리)
- [F5] `PostCard.tsx` — 피드 카드 공통 컴포넌트 (터치 스와이프 이미지, 인터랙션 바, 루틴 배지)
- [F5] Layout.tsx 네비게이션 바에 커뮤니티 탭 추가 (Users 아이콘, /community 경로)
- [F5] RootProviders.tsx에 CommunityProvider 추가
- [F7] RootProviders.tsx에 NotificationProvider 추가
- [F4] ProductDetailPage.tsx에 좋아요(하트) 토글 + Web Share API 공유 버튼 추가
- [F5] 옵티미스틱 업데이트 적용 (좋아요/북마크 즉시 반영 후 서버 동기화)

### 미구현 항목 (기획에 있으나 구현 안 됨)
- [기획서 02] **자동완성 API** — 검색 모드에서 입력 중 자동완성 드롭다운 미구현 (최근/인기 검색어만 표시). Phase 3 또는 후속 처리 예정
- [기획서 02] **기간별 가격 표시** — ProductDetailPage에서 단일 가격만 표시 (PeriodSelectionSheet에서 선택 시 가격 확인 가능)
- [기획서 04] **QR 스캔 버튼** — UserProfileViewPage에 QR 아이콘 미구현. MY Page QR Center(기획서 07 MY-03)와 함께 Phase 3에서 처리 예정
- [기획서 04] **메시지 버튼** — UserProfileViewPage에 DM/메시지 기능 미구현. 채팅 기능은 별도 기획 필요
- [기획서 04] **PostCreatePage 사진 편집/필터** — step 2(편집), step 3(필터)는 UI placeholder로 구현. 실제 이미지 처리 라이브러리 연동은 Phase 3 예정
- [기획서 05] **우선순위 설정** — TodoDetailSheet에서 `priority: 'low' | 'medium' | 'high'` 미구현
- [기획서 05] **StatsChart 별도 래퍼** — ProgressStatsPage 내부 서브컴포넌트로 구현 (별도 파일 불필요)
- [기획서 05] **드래그 이동** — 미완료 투두 날짜간 드래그 미구현 (기획에서도 향후 개선으로 분류)
- [기획서 05] **주간 타임라인 뷰** — 미구현 (기획에서도 선택 사항)

### Backend Feedback 반영
- FB-001: process-payment Edge Function (SUGGESTION) — OPEN 유지 (Phase 1부터 계속)
- FB-002: getRoutines priceRange 필터 추가 (SUGGESTION) — OPEN, F4에서 신규 등록
- FB-003: routine_likes 테이블 및 API (SUGGESTION) — OPEN, F4에서 신규 등록
- FB-004: get_user_stats RPC 반환 형식 명세 (IMPORTANT) — OPEN, F6에서 신규 등록. ProgressStatsPage가 기대하는 JSON 형식 명세됨. RPC 불일치 시 파싱 실패 가능.
- FB-005: store-context memo/notification 서버 동기화 (SUGGESTION) — OPEN, F6에서 신규 등록

### R0 리뷰 결과
- F4: 88/100 PASS
- F5: 90/100 PASS
- F6: 87/100 PASS
- F7: 92/100 PASS
- 시스템 통합: 전항목 PASS
- Backend Feedback: 0 BLOCKER, 1 IMPORTANT(FB-004), 4 SUGGESTION
- 최종: PASS (평균 89.25/100)

### 문서 업데이트 (P0 Planner)
- `doc/02_HOME_EXT.md` — 상태 PARTIAL→EXISTS, 구현 완료 파일목록, 6건 구현 차이점 기록, Banner interface linkType 업데이트
- `doc/04_POST_COMMUNITY.md` — 상태 MISSING→EXISTS, 구현 완료 파일목록, 5건 구현 차이점 기록
- `doc/05_BOARD_EXT.md` — 상태 PARTIAL→EXISTS, 구현 완료 파일목록, 8건 구현 차이점 기록
- `doc/08_NOTIFICATION.md` — 상태 MISSING→EXISTS, 구현 완료 파일목록, 4건 구현 차이점 기록
- `doc/00_INDEX.md` — 17→27 페이지/라우트 상태 테이블 업데이트, Phase 2 라우트 10개 추가
- `doc/PROGRESS.md` — Phase 2 완료 상태 기록 (F4+F5+F6+F7 + 통합 + R0 + P0)
- `doc/CHANGELOG.md` — 이번 항목 추가

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
