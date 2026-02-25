# HTB Project - Sub-Agent 구성안 (v2)

## 개요

9개 기획서를 분석하여 **Frontend + Backend 서브 에이전트**를 구성합니다.
현재 프론트엔드는 100% localStorage 기반이며, Supabase 프로젝트는 존재하나 연동되지 않은 상태입니다.

### 현재 백엔드 상태
```
Supabase 프로젝트: jwigqrgynvrgwrinjdiw (존재)
DB 테이블: kv_store_c12f498e (KV store 1개만 존재)
Supabase Auth: 미설정
Frontend 연동: 없음 (@supabase/supabase-js 미설치)
Edge Functions: health check 1개만 존재
Storage Buckets: 미설정
```

---

## Phase 0 (Foundation) — 백엔드 기반 구축 (3개 에이전트)

> **Phase 0는 모든 프론트엔드 Phase보다 먼저 실행되어야 합니다.**
> 단, Phase 0 내 3개 에이전트는 순차 실행 권장 (B1 → B2, B3 병렬)

---

### Agent B1: `db-architect-agent`
> **역할:** Database Architect
> **우선순위:** P0 (최우선)
> **설명:** 전체 DB 스키마 설계, 마이그레이션 SQL 작성, RLS 정책 정의

#### 작업 범위

| 작업 | 산출물 | 설명 |
|------|--------|------|
| 전체 ERD 설계 | `doc/DATABASE_SCHEMA.md` | 테이블 관계도 + 설명 |
| 마이그레이션 SQL | `supabase/migrations/` | 전체 테이블 생성 SQL |
| RLS 정책 | 마이그레이션 SQL 내 포함 | Row Level Security |
| Storage 버킷 | 마이그레이션 SQL 내 포함 | 이미지 업로드용 |
| TypeScript 타입 | `src/lib/database.types.ts` | DB 스키마 기반 타입 |

#### 설계할 테이블 (9개 기획서 기반)

```
── 인증 & 유저 ──────────────────────────────
profiles          유저 프로필 (Supabase Auth 확장)
  - id (uuid, FK → auth.users)
  - nickname, bio, avatar_url, cover_image_url
  - role ('user' | 'provider' | 'admin')
  - preferences (jsonb, 관심 카테고리)
  - terms_agreed_at, marketing_agreed
  - created_at, updated_at

follows           팔로우 관계
  - follower_id (FK → profiles)
  - following_id (FK → profiles)
  - created_at

── 루틴 & 상품 ──────────────────────────────
routines          루틴 상품 (기존 data.ts → DB 이관)
  - id, title, description, long_description
  - price, original_price
  - image_url, category, tags (text[])
  - author_id (FK → profiles)
  - rating, review_count
  - duration_days, day_plans (jsonb)
  - features (text[])
  - status ('draft' | 'published' | 'archived')
  - created_at, updated_at

routine_periods   기간별 가격 옵션
  - id, routine_id (FK)
  - label ('1 WEEK', '4 WEEK', '100 Days')
  - days, price, original_price

reviews           루틴 리뷰
  - id, routine_id (FK), user_id (FK)
  - rating (1-5), content
  - created_at

── 구매 & 결제 ──────────────────────────────
purchases         구매 내역
  - id, user_id (FK), routine_id (FK)
  - period_id (FK → routine_periods)
  - amount, discount, final_amount
  - payment_method ('card' | 'kakao' | 'toss' | 'naver')
  - status ('completed' | 'refunded' | 'cancelled')
  - purchased_at, start_date, end_date

user_routines     유저의 활성 루틴
  - id, user_id (FK), routine_id (FK), purchase_id (FK)
  - start_date, end_date
  - status ('active' | 'completed' | 'expired')
  - is_custom (boolean)
  - created_at

todo_items        투두 아이템 (기존 store-context → DB)
  - id, user_routine_id (FK)
  - text, completed, day, time
  - repeat_days (text[])
  - memo, priority ('low' | 'medium' | 'high')
  - notification ('none' | 'ontime' | '10min' | '30min')
  - sort_order
  - created_at, completed_at

todo_sub_items    서브 아이템
  - id, todo_item_id (FK)
  - text, completed, sort_order

── 커뮤니티 ─────────────────────────────────
posts             게시물
  - id, author_id (FK)
  - title, content
  - images (text[])
  - hashtags (text[])
  - category ('mytobe' | 'now' | 'gratitude' | 'diet' | ...)
  - linked_routine_id (FK, nullable)
  - like_count, comment_count
  - status ('active' | 'hidden' | 'deleted')
  - created_at, updated_at

post_likes        좋아요
  - post_id (FK), user_id (FK)
  - created_at

post_bookmarks    북마크
  - post_id (FK), user_id (FK)
  - created_at

comments          댓글
  - id, post_id (FK), author_id (FK)
  - content, like_count
  - created_at

comment_likes     댓글 좋아요
  - comment_id (FK), user_id (FK)

reports           신고
  - id, reporter_id (FK)
  - target_type ('post' | 'comment' | 'user')
  - target_id
  - reason, status ('pending' | 'reviewed' | 'resolved')
  - created_at

── 보상 & 챌린지 ────────────────────────────
badges            뱃지 정의
  - id, name, description, icon
  - category ('routine' | 'streak' | 'community' | 'challenge')
  - condition (jsonb, 획득 조건)

user_badges       유저 획득 뱃지
  - user_id (FK), badge_id (FK)
  - unlocked_at

challenges        챌린지
  - id, title, description, image_url
  - start_date, end_date
  - rules (text[])
  - participant_count
  - status ('upcoming' | 'active' | 'completed')
  - created_at

challenge_participants  챌린지 참여
  - challenge_id (FK), user_id (FK)
  - progress (0-100)
  - joined_at

challenge_rewards  챌린지 보상
  - id, challenge_id (FK)
  - type ('badge' | 'coupon' | 'point')
  - name, icon, description

── 알림 ─────────────────────────────────────
notifications     알림
  - id, user_id (FK)
  - type ('schedule' | 'community' | 'purchase')
  - sub_type (text)
  - title, message, icon
  - is_read (boolean)
  - deep_link (text)
  - metadata (jsonb)
  - created_at

── 기타 ─────────────────────────────────────
banners           홈 배너
  - id, image_url, title, subtitle
  - link_type ('routine' | 'category' | 'external')
  - link_target
  - sort_order, is_active
  - created_at

search_keywords   인기 검색어
  - keyword, count, updated_at

user_search_history  유저 검색 기록
  - id, user_id (FK), keyword, searched_at

qr_codes          QR 코드
  - id, user_id (FK), routine_id (FK)
  - code (unique), shared_count
  - created_at
```

#### RLS 정책 예시
```sql
-- profiles: 본인만 수정, 모두 조회 가능
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Own profile editable" ON profiles FOR UPDATE USING (auth.uid() = id);

-- purchases: 본인만 조회
CREATE POLICY "Own purchases only" ON purchases FOR SELECT USING (auth.uid() = user_id);

-- posts: 활성 게시물 모두 조회, 본인만 수정/삭제
CREATE POLICY "Active posts readable" ON posts FOR SELECT USING (status = 'active');
CREATE POLICY "Own posts editable" ON posts FOR ALL USING (auth.uid() = author_id);

-- notifications: 본인만 조회
CREATE POLICY "Own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
```

#### Storage 버킷
```sql
-- avatars: 프로필 이미지
-- covers: 배경 이미지
-- post-images: 게시물 이미지
-- routine-images: 루틴 상품 이미지
-- banners: 배너 이미지
```

**의존성:** 없음 (최우선 실행)
**산출물:** 마이그레이션 SQL + 타입 정의 + ERD 문서

---

### Agent B2: `supabase-client-agent`
> **역할:** Supabase Client Setup & Auth Integration
> **우선순위:** P0
> **설명:** 프론트엔드 Supabase 클라이언트 설정, Auth 연동, API 레이어 구축

#### 작업 범위

| 작업 | 파일 | 설명 |
|------|------|------|
| 패키지 설치 | `package.json` | @supabase/supabase-js 설치 |
| 환경변수 설정 | `.env.local` | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |
| Supabase 클라이언트 | `src/lib/supabase.ts` | createClient 싱글톤 |
| Auth 헬퍼 | `src/lib/auth.ts` | 소셜 로그인, 세션 관리 |
| API 레이어 | `src/lib/api/` 디렉토리 | 테이블별 CRUD 함수 |
| auth-context 교체 | `auth-context.tsx` 수정 | localStorage → Supabase Auth |
| store-context 교체 | `store-context.tsx` 수정 | localStorage → Supabase DB |
| 타입 연동 | `src/lib/database.types.ts` 활용 | B1 산출물 사용 |

#### API 레이어 구조
```
src/lib/
├── supabase.ts              # Supabase 클라이언트 싱글톤
├── database.types.ts        # DB 타입 (B1 산출물)
├── auth.ts                  # Auth 헬퍼 (소셜 로그인 등)
└── api/
    ├── routines.ts          # 루틴 CRUD + 검색
    ├── purchases.ts         # 구매 생성/조회
    ├── user-routines.ts     # 유저 루틴 + 투두 관리
    ├── posts.ts             # 게시물 CRUD + 좋아요/북마크
    ├── comments.ts          # 댓글 CRUD
    ├── profiles.ts          # 프로필 조회/수정 + 팔로우
    ├── notifications.ts     # 알림 조회/읽음처리
    ├── rewards.ts           # 뱃지/랭킹/챌린지
    ├── banners.ts           # 배너 조회
    ├── search.ts            # 검색 + 인기검색어
    └── storage.ts           # 이미지 업로드 헬퍼
```

#### auth-context.tsx 교체 핵심
```typescript
// Before (localStorage)
const login = (email, password) => {
  const users = JSON.parse(localStorage.getItem('users'));
  // ... 직접 비교
};

// After (Supabase Auth)
const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });
  // ...
};

const socialLogin = async (provider: 'kakao' | 'apple' | 'google') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  });
};
```

#### Supabase Auth 설정 필요 사항 (Supabase 대시보드)
```
- Email/Password: 활성화
- Kakao OAuth: 클라이언트 ID/Secret 설정
- Apple OAuth: 서비스 ID/Secret 설정
- Google OAuth: 클라이언트 ID/Secret 설정
- Redirect URL: http://localhost:5173/auth/callback
```

**의존성:** Agent B1 완료 후 (타입 파일 필요)
**산출물:** Supabase 클라이언트 + Auth 연동 + API 레이어

---

### Agent B3: `edge-functions-agent`
> **역할:** Backend Developer (Supabase Edge Functions)
> **우선순위:** P0~P1
> **설명:** 클라이언트에서 직접 처리하기 어려운 서버 로직 구현

#### 작업 범위

| 작업 | Edge Function | 설명 |
|------|--------------|------|
| 결제 처리 | `supabase/functions/process-payment/` | 결제 검증 + purchases 생성 + user_routines 생성 |
| 알림 발송 | `supabase/functions/send-notification/` | 알림 생성 (DB trigger 또는 cron) |
| 통계 집계 | `supabase/functions/aggregate-stats/` | 달성률/스트릭/랭킹 계산 |
| QR 코드 | `supabase/functions/qr-generate/` | QR 생성 + 루틴 공유 처리 |
| 이미지 처리 | `supabase/functions/process-image/` | 이미지 리사이즈/최적화 (선택) |
| 시드 데이터 | `supabase/seed.sql` | 초기 루틴/뱃지/배너 데이터 |

#### DB Triggers & Functions
```sql
── 자동 실행 트리거 ──────────────────────────
-- 1. 회원가입 시 profiles 자동 생성
CREATE FUNCTION handle_new_user() ...
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. 게시물 좋아요 시 like_count 자동 업데이트
CREATE FUNCTION update_post_like_count() ...
CREATE TRIGGER on_post_like
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- 3. 댓글 작성 시 comment_count 자동 업데이트
CREATE FUNCTION update_post_comment_count() ...

-- 4. 투두 완료 시 뱃지 조건 체크
CREATE FUNCTION check_badge_conditions() ...

-- 5. 구매 완료 시 알림 생성
CREATE FUNCTION create_purchase_notification() ...

── DB Functions (RPC) ───────────────────────
-- 랭킹 집계
CREATE FUNCTION get_ranking(period, category) ...

-- 유저 통계
CREATE FUNCTION get_user_stats(user_id, period) ...

-- 인기 검색어 업데이트
CREATE FUNCTION update_search_keyword(keyword) ...

-- 대시보드 통계 (Admin)
CREATE FUNCTION get_admin_dashboard_stats() ...
```

#### 시드 데이터 (seed.sql)
```
- 기존 data.ts의 9개 루틴 상품 → routines 테이블 이관
- 기간별 가격 → routine_periods
- 기본 뱃지 정의 → badges (약 15개)
- 카테고리 목록
- 샘플 배너 데이터
```

**의존성:** Agent B1 완료 후 (테이블 필요), B2와 병렬 실행 가능
**산출물:** Edge Functions + DB Triggers + Seed Data

---

## Phase 1 (P0 - Critical) — 3개 프론트엔드 에이전트

> Phase 0 완료 후 실행. API 레이어(B2)가 준비되어 있으므로
> 프론트엔드 에이전트는 `src/lib/api/*`를 import하여 사용합니다.

### Agent F1: `onboarding-agent`
> **기획서:** 01_ONBOARDING.md
> **우선순위:** P0
> **작업 범위:**

| 작업 | 파일 | 설명 |
|------|------|------|
| Splash Screen | `SplashScreen.tsx` | 로고 + 로딩 → Supabase 세션 체크 → 조건 분기 |
| Walkthrough | `WalkthroughPage.tsx` | 3장 슬라이드 (embla-carousel-react) |
| Social Login | `LoginPage.tsx` 수정 | 카카오/애플/구글 → `supabase.auth.signInWithOAuth()` |
| Auth Callback | `AuthCallbackPage.tsx` | OAuth 리다이렉트 처리 |
| Terms Agreement | `TermsAgreementPage.tsx` | 약관 동의 → `api/profiles.ts` 호출 |
| Preference Setup | `PreferenceSetupPage.tsx` | 카테고리 칩 → `api/profiles.ts` 호출 |
| 라우트 등록 | `routes.ts` 수정 | /splash, /walkthrough, /terms, /preference, /auth/callback |

**의존성:** Phase 0 완료 (Supabase Auth 연동 필요)
**API 사용:** `auth.ts`, `api/profiles.ts`

---

### Agent F2: `purchase-agent`
> **기획서:** 03_PURCHASE.md
> **우선순위:** P0

| 작업 | 파일 | 설명 |
|------|------|------|
| Period Selection | `PeriodSelectionSheet.tsx` | 기간 선택 → `api/routines.ts`에서 가격 조회 |
| Payment Method | `PaymentMethodPage.tsx` | 결제 수단 선택 |
| Purchase Complete | `PurchaseCompletePage.tsx` | 완료 → `api/purchases.ts` 조회 |
| ProductDetail 강화 | `ProductDetailPage.tsx` 수정 | 구매하기 → Period Sheet 연결 |
| 라우트 등록 | `routes.ts` 수정 | /payment, /purchase-complete |

**의존성:** Phase 0 완료
**API 사용:** `api/routines.ts`, `api/purchases.ts`, Edge Function `process-payment`

---

### Agent F3: `mypage-core-agent`
> **기획서:** 07_MY_PAGE.md (P0 부분)
> **우선순위:** P0

| 작업 | 파일 | 설명 |
|------|------|------|
| Profile 확장 | `ProfilePage.tsx` 수정 | Supabase profiles 연동 + 팔로워 카운트 |
| Profile 편집 | `ProfilePage.tsx` 수정 | 아바타 → Storage 업로드, 프로필 → DB 저장 |
| My Routines | `MyListsPage.tsx` 수정 | `api/user-routines.ts`로 DB 조회 |
| Settings | `SettingsPage.tsx` | 알림 설정 → DB, 로그아웃 → `supabase.auth.signOut()` |
| 라우트 등록 | `routes.ts` 수정 | /settings |

**의존성:** Phase 0 완료
**API 사용:** `api/profiles.ts`, `api/user-routines.ts`, `api/storage.ts`

---

## Phase 2 (P1 - Important) — 4개 프론트엔드 에이전트

### Agent F4: `home-ext-agent`
> **기획서:** 02_HOME_EXT.md

| 작업 | 파일 | API 사용 |
|------|------|----------|
| Search 강화 | `StorePage.tsx` 수정 | `api/search.ts` |
| Search Result | `SearchResultPage.tsx` | `api/routines.ts` (검색 쿼리) |
| Filter Sheet | `FilterSheet.tsx` | `api/routines.ts` (필터) |
| Provider Profile | `ProviderProfilePage.tsx` | `api/profiles.ts`, `api/routines.ts` |
| Banner Carousel | `BannerCarousel.tsx` | `api/banners.ts` |
| ProductDetail 강화 | `ProductDetailPage.tsx` 수정 | `api/reviews.ts` |
| 라우트 등록 | `routes.ts` 수정 | |

---

### Agent F5: `community-agent`
> **기획서:** 04_POST_COMMUNITY.md (가장 큰 에이전트)

| 작업 | 파일 | API 사용 |
|------|------|----------|
| Community Feed | `CommunityFeedPage.tsx` | `api/posts.ts` (무한스크롤) |
| Post Card | `PostCard.tsx` | `api/posts.ts` (좋아요/북마크) |
| Post Detail | `PostDetailPage.tsx` | `api/posts.ts`, `api/comments.ts` |
| Comment List | `CommentList.tsx` | `api/comments.ts` |
| Post Create | `PostCreatePage.tsx` | `api/posts.ts`, `api/storage.ts` (이미지 업로드) |
| User Profile | `UserProfileViewPage.tsx` | `api/profiles.ts` |
| Ranking Detail | `RankingDetailPage.tsx` | `api/rewards.ts` (ranking RPC) |
| Layout 수정 | `Layout.tsx` 수정 | 하단 네비 POST 탭 |
| 라우트 등록 | `routes.ts` 수정 | |

---

### Agent F6: `board-ext-agent`
> **기획서:** 05_BOARD_EXT.md

| 작업 | 파일 | API 사용 |
|------|------|----------|
| Todo Detail Sheet | `TodoDetailSheet.tsx` | `api/user-routines.ts` |
| TodoListUsable 강화 | `TodoListUsable.tsx` 수정 | `api/user-routines.ts` |
| Progress & Stats | `ProgressStatsPage.tsx` | Edge Function `aggregate-stats` |
| CalendarView 강화 | `CalendarView.tsx` 수정 | `api/user-routines.ts` |
| 라우트 등록 | `routes.ts` 수정 | |

---

### Agent F7: `notification-agent`
> **기획서:** 08_NOTIFICATION.md

| 작업 | 파일 | API 사용 |
|------|------|----------|
| Notification Center | `NotificationCenterPage.tsx` | `api/notifications.ts` |
| Notification Card | `NotificationCard.tsx` | |
| Layout 알림 뱃지 | `Layout.tsx` 수정 | `api/notifications.ts` (unread count) |
| Realtime 구독 | `notification-context.tsx` | Supabase Realtime (실시간 알림) |
| 라우트 등록 | `routes.ts` 수정 | |

---

## Phase 3 (P2~P3) — 2개 프론트엔드 에이전트

### Agent F8: `reward-agent`
> **기획서:** 06_REWARD.md

| 작업 | 파일 | API 사용 |
|------|------|----------|
| Reward Main | `RewardMainPage.tsx` | `api/rewards.ts` |
| Badge Collection | `BadgeCollectionPage.tsx` | `api/rewards.ts` |
| Ranking Board | `RankingBoardPage.tsx` | RPC `get_ranking()` |
| Challenge | `ChallengePage.tsx` | `api/rewards.ts` |
| Challenge Detail | `ChallengeDetailPage.tsx` | `api/rewards.ts` |
| Layout 수정 | `Layout.tsx` 수정 | REWARD 탭 추가 |
| 라우트 등록 | `routes.ts` 수정 | |

---

### Agent F9: `admin-agent`
> **기획서:** 09_ADMIN.md

| 작업 | 파일 | API 사용 |
|------|------|----------|
| Admin Layout | `admin/AdminLayout.tsx` | 권한 체크 (profiles.role) |
| Dashboard | `admin/AdminDashboard.tsx` | RPC `get_admin_dashboard_stats()` |
| User Management | `admin/AdminUserManagement.tsx` | `api/profiles.ts` (admin) |
| Routine Management | `admin/AdminRoutineManagement.tsx` | `api/routines.ts` (admin) |
| Purchase Management | `admin/AdminPurchaseManagement.tsx` | `api/purchases.ts` (admin) |
| Post Moderation | `admin/AdminPostModeration.tsx` | `api/posts.ts` (admin) |
| 라우트 등록 | `routes.ts` 수정 | |

---

## 전체 실행 전략

```
┌──────────────────────────────────────────────────────────────┐
│  Phase 0: Backend Foundation (최우선)                          │
│                                                                │
│  [B1: db-architect]  ──────────────────────────               │
│         ↓ (테이블 생성 완료)                                    │
│  [B2: supabase-client] ←→ [B3: edge-functions]  (병렬 가능)   │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  ↓ API 레이어 준비 완료                                         │
├──────────────────────────────────────────────────────────────┤
│  Phase 1: Frontend P0 (동시 실행)                               │
│                                                                │
│  [F1: onboarding]  [F2: purchase]  [F3: mypage-core]          │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  ↓ routes.ts 통합                                              │
├──────────────────────────────────────────────────────────────┤
│  Phase 2: Frontend P1 (동시 실행)                               │
│                                                                │
│  [F4: home-ext]  [F5: community]  [F6: board-ext]  [F7: noti] │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  ↓ routes.ts + Layout.tsx 통합                                  │
├──────────────────────────────────────────────────────────────┤
│  Phase 3: Frontend P2~P3 (동시 실행)                            │
│                                                                │
│  [F8: reward]  [F9: admin]                                     │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 에이전트 총 요약

| # | Agent | 역할 | Phase | 복잡도 | 핵심 산출물 |
|---|-------|------|-------|--------|-----------|
| B1 | db-architect | DB 설계 | 0 | ⭐⭐⭐⭐ | 마이그레이션 SQL, 타입, ERD |
| B2 | supabase-client | FE-BE 연동 | 0 | ⭐⭐⭐ | Supabase 클라이언트, API 레이어, Context 교체 |
| B3 | edge-functions | 서버 로직 | 0 | ⭐⭐⭐ | Edge Functions, Triggers, Seed Data |
| F1 | onboarding | 프론트엔드 | 1 | ⭐⭐ | Splash~Preference 5개 화면 |
| F2 | purchase | 프론트엔드 | 1 | ⭐⭐ | Period~Complete 4개 화면 |
| F3 | mypage-core | 프론트엔드 | 1 | ⭐⭐ | Profile 확장, Settings |
| F4 | home-ext | 프론트엔드 | 2 | ⭐⭐⭐ | Search, Provider, Banner |
| F5 | community | 프론트엔드 | 2 | ⭐⭐⭐⭐ | Feed~Ranking 5개 화면 |
| F6 | board-ext | 프론트엔드 | 2 | ⭐⭐⭐ | Todo Settings, Stats |
| F7 | notification | 프론트엔드 | 2 | ⭐⭐ | 알림 센터 + Realtime |
| F8 | reward | 프론트엔드 | 3 | ⭐⭐⭐ | Reward~Challenge 5개 화면 |
| F9 | admin | 프론트엔드 | 3 | ⭐⭐⭐⭐ | Admin 9개 화면 |
| **합계** | **12개 에이전트** | | | | |

---

## 공유 파일 충돌 관리

| 공유 파일 | 수정하는 에이전트 | 전략 |
|-----------|----------------|------|
| `routes.ts` | F1~F9 전체 | Phase별 통합 머지 |
| `Layout.tsx` | F5, F7, F8 | Phase별 순차 통합 |
| `auth-context.tsx` | B2 (교체), F1 (확장) | B2에서 완전 교체 후 F1은 호출만 |
| `store-context.tsx` | B2 (교체) | B2에서 Supabase 연동으로 교체 |
| `package.json` | B2 | B2에서 @supabase/supabase-js 설치 |
| `.env.local` | B2 | B2에서 생성 |

---

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                 │
│                                                   │
│  Pages (F1~F9)                                    │
│    ↓ import                                       │
│  Context (auth-context, store-context, ...)       │
│    ↓ 호출                                          │
│  API Layer (src/lib/api/*.ts)  ← B2가 구축        │
│    ↓ 호출                                          │
│  Supabase Client (src/lib/supabase.ts)            │
│                                                   │
├───────────────── Network ─────────────────────────┤
│                                                   │
│                Supabase Backend                    │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   Auth   │  │ PostgREST│  │ Realtime │       │
│  │(소셜로그인)│  │(자동 REST)│  │(실시간알림)│       │
│  └──────────┘  └──────────┘  └──────────┘       │
│        ↓              ↓              ↓            │
│  ┌────────────────────────────────────────┐      │
│  │          PostgreSQL Database            │      │
│  │          (B1이 설계한 스키마)              │      │
│  │  Tables + RLS + Triggers + Functions    │      │
│  └────────────────────────────────────────┘      │
│        ↑                                          │
│  ┌──────────┐  ┌──────────┐                      │
│  │  Edge    │  │ Storage  │                      │
│  │Functions │  │ (이미지)  │                      │
│  │ (B3 구축) │  │          │                      │
│  └──────────┘  └──────────┘                      │
│                                                   │
└─────────────────────────────────────────────────┘
```
