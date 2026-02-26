# HTB Project - 기획서 인덱스

## 프로젝트 개요
- **프로젝트명:** HOW TO BE (HTB)
- **기술 스택:** React 18 + Vite + TypeScript + Tailwind CSS + HeroUI + Radix UI
- **백엔드:** Supabase
- **상태관리:** React Context (AuthContext, StoreContext)
- **라우팅:** React Router v7

## 현재 구현 상태 (27개 페이지/라우트 — Phase 2 완료)
| 경로 | 컴포넌트 | 상태 |
|------|----------|------|
| `/` | StorePage | EXISTS (배너+검색 강화 — Phase 2) |
| `/product/:id` | ProductDetailPage | EXISTS (리뷰+좋아요+Provider 링크 — Phase 2) |
| `/cart` | CartPage | EXISTS |
| `/my-lists` | MyListsPage | EXISTS (프로그레스 요약 + 3탭) |
| `/create-routine` | CreateRoutinePage | EXISTS |
| `/login` | LoginPage | EXISTS (소셜 로그인 추가) |
| `/register` | RegisterPage | EXISTS |
| `/profile` | ProfilePage | EXISTS (커버/탭/인라인편집 확장) |
| `/splash` | SplashScreen | EXISTS (Phase 1 신규) |
| `/walkthrough` | WalkthroughPage | EXISTS (Phase 1 신규) |
| `/auth/callback` | AuthCallbackPage | EXISTS (Phase 1 신규) |
| `/terms` | TermsAgreementPage | EXISTS (Phase 1 신규) |
| `/preference` | PreferenceSetupPage | EXISTS (Phase 1 신규) |
| `/payment` | PaymentMethodPage | EXISTS (Phase 1 신규) |
| `/purchase-complete` | PurchaseCompletePage | EXISTS (Phase 1 신규) |
| `/settings` | SettingsPage | EXISTS (Phase 1 신규) |
| `/search` | SearchResultPage | EXISTS (Phase 2 신규 — F4) |
| `/provider/:id` | ProviderProfilePage | EXISTS (Phase 2 신규 — F4) |
| `/community` | CommunityFeedPage | EXISTS (Phase 2 신규 — F5) |
| `/community/create` | PostCreatePage | EXISTS (Phase 2 신규 — F5) |
| `/community/:id` | PostDetailPage | EXISTS (Phase 2 신규 — F5) |
| `/user/:id` | UserProfileViewPage | EXISTS (Phase 2 신규 — F5) |
| `/ranking` | RankingDetailPage | EXISTS (Phase 2 신규 — F5) |
| `/stats` | ProgressStatsPage | EXISTS (Phase 2 신규 — F6) |
| `/notifications` | NotificationCenterPage | EXISTS (Phase 2 신규 — F7) |
| `/*` | NotFoundPage | EXISTS |

## 기획서 목록

### 1. Onboarding Flow
- [01_ONBOARDING.md](./01_ONBOARDING.md) - Splash, Walkthrough, Social Login, AuthCallback, Terms, Preference
- **우선순위:** P0 (Critical)
- **상태:** EXISTS (6개 화면 — Phase 1 완료)

### 2. HOME 확장
- [02_HOME_EXT.md](./02_HOME_EXT.md) - Search 강화, Provider Profile, Banner/Promotions
- **우선순위:** P1
- **상태:** EXISTS (4개 신규 컴포넌트 + 2개 수정 — Phase 2 완료)

### 3. Purchase Flow
- [03_PURCHASE.md](./03_PURCHASE.md) - Period Selection, Payment, Confirm, Complete
- **우선순위:** P0 (Critical)
- **상태:** EXISTS (3개 화면 + ProductDetail 수정 — Phase 1 완료)

### 4. POST (Community)
- [04_POST_COMMUNITY.md](./04_POST_COMMUNITY.md) - Feed, Detail, Create, Profile, Ranking
- **우선순위:** P1
- **상태:** EXISTS (7개 신규 컴포넌트 + Context — Phase 2 완료)

### 5. BOARD 확장
- [05_BOARD_EXT.md](./05_BOARD_EXT.md) - Progress & Stats, Todo Detail 강화
- **우선순위:** P1
- **상태:** EXISTS (2개 신규 컴포넌트 + 2개 수정 — Phase 2 완료)

### 6. REWARD
- [06_REWARD.md](./06_REWARD.md) - Reward Main, Badge, Ranking, Challenge
- **우선순위:** P1~P2
- **상태:** MISSING (4개 화면)

### 7. MY Page 확장
- [07_MY_PAGE.md](./07_MY_PAGE.md) - Profile 확장, My Routines, QR, Following, Settings
- **우선순위:** P0~P1
- **상태:** PARTIAL (P0 범위 3개 섹션 완료 — Phase 1, P1 범위 2개 미구현)

### 8. Global - Notification
- [08_NOTIFICATION.md](./08_NOTIFICATION.md) - Notification Center
- **우선순위:** P1
- **상태:** EXISTS (2개 신규 컴포넌트 + Context + Realtime — Phase 2 완료)

### 9. Admin Dashboard
- [09_ADMIN.md](./09_ADMIN.md) - Dashboard, User/Routine/Purchase/Post Management
- **우선순위:** P2~P3
- **상태:** MISSING (9개 화면)

## 개발 우선순위 로드맵
```
Phase 1 (P0): Onboarding + Purchase Flow + MY Page 핵심
Phase 2 (P1): HOME 확장 + POST Community + BOARD 확장 + Notification
Phase 3 (P2): REWARD + Admin Dashboard
```

## 디자인 토큰 참조
```css
--primary: #1a1a2e        /* 다크 네이비 */
--accent: #6C5CE7         /* 퍼플 */
--accent-color: #65D9AC   /* 민트 그린 (--primary in IR 기획) */
--secondary: #f4f3ff      /* 라이트 퍼플 */
--destructive: #d4183d    /* 레드 */
--radius: 0.75rem         /* 12px */
--font: "Noto Sans KR"
```
