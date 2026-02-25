# HTB Project - 기획서 인덱스

## 프로젝트 개요
- **프로젝트명:** HOW TO BE (HTB)
- **기술 스택:** React 18 + Vite + TypeScript + Tailwind CSS + HeroUI + Radix UI
- **백엔드:** Supabase
- **상태관리:** React Context (AuthContext, StoreContext)
- **라우팅:** React Router v7

## 현재 구현 상태 (9개 페이지)
| 경로 | 컴포넌트 | 상태 |
|------|----------|------|
| `/` | StorePage | EXISTS |
| `/product/:id` | ProductDetailPage | PARTIAL |
| `/cart` | CartPage | EXISTS |
| `/my-lists` | MyListsPage | EXISTS |
| `/create-routine` | CreateRoutinePage | EXISTS |
| `/login` | LoginPage | EXISTS |
| `/register` | RegisterPage | EXISTS |
| `/profile` | ProfilePage | PARTIAL |
| `/*` | NotFoundPage | EXISTS |

## 기획서 목록

### 1. Onboarding Flow
- [01_ONBOARDING.md](./01_ONBOARDING.md) - Splash, Walkthrough, Social Login, Terms, Preference
- **우선순위:** P0 (Critical)
- **상태:** MISSING (5개 화면)

### 2. HOME 확장
- [02_HOME_EXT.md](./02_HOME_EXT.md) - Search 강화, Provider Profile, Banner/Promotions
- **우선순위:** P1
- **상태:** PARTIAL (2개 기능 누락)

### 3. Purchase Flow
- [03_PURCHASE.md](./03_PURCHASE.md) - Period Selection, Payment, Confirm, Complete
- **우선순위:** P0 (Critical)
- **상태:** MISSING (4개 화면)

### 4. POST (Community)
- [04_POST_COMMUNITY.md](./04_POST_COMMUNITY.md) - Feed, Detail, Create, Profile, Ranking
- **우선순위:** P1
- **상태:** MISSING (5개 화면)

### 5. BOARD 확장
- [05_BOARD_EXT.md](./05_BOARD_EXT.md) - Progress & Stats, Todo Detail 강화
- **우선순위:** P1
- **상태:** PARTIAL (1개 기능 누락)

### 6. REWARD
- [06_REWARD.md](./06_REWARD.md) - Reward Main, Badge, Ranking, Challenge
- **우선순위:** P1~P2
- **상태:** MISSING (4개 화면)

### 7. MY Page 확장
- [07_MY_PAGE.md](./07_MY_PAGE.md) - Profile 확장, My Routines, QR, Following, Settings
- **우선순위:** P0~P1
- **상태:** MISSING (4개 섹션)

### 8. Global - Notification
- [08_NOTIFICATION.md](./08_NOTIFICATION.md) - Notification Center
- **우선순위:** P1
- **상태:** MISSING (1개 화면)

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
