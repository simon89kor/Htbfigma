# 09. Admin Dashboard 기획서

**우선순위:** P2~P3 (Phase 3)
**상태:** MISSING (9개 화면 모두 미구현)
**예상 라우트:** `/admin/*` (별도 레이아웃)

---

## 1. 현재 상태 분석

- 어드민 관련 컴포넌트 없음
- 별도의 어드민 레이아웃/라우트 없음
- 어드민 권한 체크 로직 없음

---

## 2. 어드민 아키텍처 개요

### 라우트 구조
```
/admin (AdminLayout)
  ├── /admin                    → Dashboard (인덱스)
  ├── /admin/users              → User Management
  ├── /admin/users/:id          → User Detail
  ├── /admin/routines           → Routine Management
  ├── /admin/routines/create    → Routine Create/Edit
  ├── /admin/purchases          → Purchase Management
  ├── /admin/posts              → Post Moderation
  ├── /admin/challenges         → Challenge Management
  └── /admin/settings           → Admin Settings
```

### 권한 체크
```typescript
// AdminLayout.tsx
const AdminLayout = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1">
        <AdminHeader />
        <Outlet />
      </main>
    </div>
  );
};
```

---

## 3. 페이지별 상세 기획

### ADMIN-01: Dashboard

**경로:** `/admin`
**컴포넌트:** `AdminDashboard.tsx`

#### UI 구성
```
┌──────────┬──────────────────────────┐
│          │  Dashboard        닉네임  │
│  HTB     │  ─────────────────────── │
│  Admin   │                          │
│          │  ┌──────┐ ┌──────┐      │
│  📊 대시보드│  │ 전체  │ │ 신규  │      │
│  👥 유저   │  │ 유저  │ │ 가입  │      │
│  📋 루틴   │  │ 1,234│ │ +45  │      │
│  💰 구매   │  │      │ │ (이번주)│     │
│  📝 게시물  │  └──────┘ └──────┘     │
│  🎯 챌린지  │  ┌──────┐ ┌──────┐     │
│  ⚙️ 설정   │  │ 총매출 │ │ 활성  │     │
│          │  │₩2.5M │ │ 루틴  │      │
│          │  │      │ │  89  │      │
│          │  └──────┘ └──────┘      │
│          │                          │
│          │  📈 주간 가입자 추이        │
│          │  ┌──────────────────┐    │
│          │  │  (라인 차트)       │    │
│          │  └──────────────────┘    │
│          │                          │
│          │  📊 카테고리별 매출         │
│          │  ┌──────────────────┐    │
│          │  │  (바 차트)        │    │
│          │  └──────────────────┘    │
│          │                          │
│          │  ⚠️ 최근 신고             │
│          │  ├ 게시물#123 - 스팸 신고  │
│          │  ├ 유저#456 - 부적절 콘텐츠│
│          │  └ 게시물#789 - 광고      │
└──────────┴──────────────────────────┘
```

#### 대시보드 KPI 카드
```typescript
interface DashboardStats {
  totalUsers: number;
  newUsersThisWeek: number;
  totalRevenue: number;
  revenueThisMonth: number;
  activeRoutines: number;
  totalPosts: number;
  pendingReports: number;
  activeChallenges: number;
}
```

#### 차트
1. **주간 가입자 추이** - 라인 차트 (최근 4주)
2. **카테고리별 매출** - 바 차트
3. **일일 활성 유저 (DAU)** - 라인 차트
4. **루틴 완료율 분포** - 히스토그램

#### API
- `GET /api/admin/dashboard`
- `GET /api/admin/stats?period={week|month}`

---

### ADMIN-02: User Management

**경로:** `/admin/users`
**컴포넌트:** `AdminUserManagement.tsx`

#### UI 구성
```
┌──────────────────────────────────┐
│  유저 관리                        │
│  ─────────────────────────────── │
│  🔍 [검색...]  [상태▼] [역할▼]   │
│  ─────────────────────────────── │
│                                  │
│  ┌────┬──────┬──────┬────┬────┐ │
│  │ ID │ 닉네임 │ 이메일 │ 역할 │ 상태│ │
│  ├────┼──────┼──────┼────┼────┤ │
│  │ 1  │ 유저1 │ a@.. │일반 │활성 │ │
│  │ 2  │ 유저2 │ b@.. │제공자│활성 │ │
│  │ 3  │ 유저3 │ c@.. │일반 │정지 │ │
│  └────┴──────┴──────┴────┴────┘ │
│                                  │
│  < 1 2 3 ... 10 >   총 1,234명   │
└──────────────────────────────────┘
```

#### 유저 상세 (유저 행 클릭 시)
```
┌──────────────────────────────────┐
│  ← 유저 상세: 닉네임1             │
│  ─────────────────────────────── │
│                                  │
│  기본 정보                        │
│  ├ ID: 1                         │
│  ├ 이메일: user@example.com       │
│  ├ 가입일: 2026.01.15            │
│  ├ 역할: 일반 [변경▼]            │
│  └ 상태: 활성 [정지] [탈퇴처리]    │
│  ─────────────────────────────── │
│  활동 통계                        │
│  ├ 구매 루틴: 5개                 │
│  ├ 커스텀 루틴: 3개               │
│  ├ 게시물: 12개                   │
│  ├ 총 결제금액: ₩28,000           │
│  └ 최근 접속: 2026.02.24         │
│  ─────────────────────────────── │
│  구매 내역                        │
│  (테이블)                        │
│  ─────────────────────────────── │
│  게시물                          │
│  (게시물 목록)                    │
└──────────────────────────────────┘
```

#### 기능
- 유저 검색 (닉네임, 이메일)
- 필터: 상태 (전체/활성/정지/탈퇴), 역할 (전체/일반/Provider/Admin)
- 유저 상세 보기
- 역할 변경 (일반 ↔ Provider ↔ Admin)
- 계정 정지/해제
- 계정 탈퇴 처리

#### API
- `GET /api/admin/users?search={q}&status={status}&role={role}&page={page}`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id` - body: `{ role?, status? }`
- `DELETE /api/admin/users/:id`

---

### ADMIN-03: Routine Management

**경로:** `/admin/routines`
**컴포넌트:** `AdminRoutineManagement.tsx`

#### 기능
- 루틴 목록 (테이블): ID, 제목, Provider, 카테고리, 가격, 판매수, 상태
- 루틴 CRUD (생성/수정/삭제)
- 루틴 발행/비발행 상태 관리
- 카테고리별 필터링
- Provider별 필터링

#### API
- `GET /api/admin/routines?category={cat}&provider={id}&status={status}&page={page}`
- `POST /api/admin/routines`
- `PUT /api/admin/routines/:id`
- `DELETE /api/admin/routines/:id`
- `PUT /api/admin/routines/:id/publish` - 발행/비발행

---

### ADMIN-04: Purchase Management

**경로:** `/admin/purchases`
**컴포넌트:** `AdminPurchaseManagement.tsx`

#### 기능
- 구매 내역 테이블: ID, 유저, 루틴, 기간, 금액, 결제수단, 상태, 일시
- 환불 처리
- 기간별 매출 통계
- 결제 상태 필터 (완료/환불/취소)

#### API
- `GET /api/admin/purchases?status={status}&dateFrom={date}&dateTo={date}&page={page}`
- `POST /api/admin/purchases/:id/refund`

---

### ADMIN-05: Post Moderation

**경로:** `/admin/posts`
**컴포넌트:** `AdminPostModeration.tsx`

#### 기능
- 게시물 목록: ID, 작성자, 카테고리, 신고수, 상태, 작성일
- 신고 접수된 게시물 우선 표시
- 게시물 숨김/삭제 처리
- 신고 내역 확인
- 게시물 상세 미리보기

#### 신고 처리 워크플로우
```
신고 접수 → 검토 → [승인(게시 유지)] or [경고] or [숨김] or [삭제 + 유저 경고]
```

#### API
- `GET /api/admin/posts?status={status}&hasReport={bool}&page={page}`
- `GET /api/admin/posts/:id/reports`
- `PUT /api/admin/posts/:id` - body: `{ status: 'active' | 'hidden' | 'deleted' }`

---

## 4. 어드민 레이아웃 컴포넌트

### AdminSidebar
```typescript
const ADMIN_MENU = [
  { icon: BarChart3, label: '대시보드', path: '/admin' },
  { icon: Users, label: '유저 관리', path: '/admin/users' },
  { icon: ClipboardList, label: '루틴 관리', path: '/admin/routines' },
  { icon: CreditCard, label: '구매 관리', path: '/admin/purchases' },
  { icon: FileText, label: '게시물 관리', path: '/admin/posts' },
  { icon: Target, label: '챌린지 관리', path: '/admin/challenges' },
  { icon: Settings, label: '설정', path: '/admin/settings' },
];
```

### AdminHeader
- 현재 페이지 타이틀
- 관리자 프로필/로그아웃
- 알림 아이콘 (신고 미처리 건수)

---

## 5. 디자인 스펙

| 요소 | 스펙 |
|------|------|
| 사이드바 | width 240px, `--primary` 배경, White 텍스트 |
| 콘텐츠 영역 | `--bg-secondary` 배경 |
| KPI 카드 | White 배경, shadow-sm, radius 12px |
| 테이블 | 기존 `ui/table.tsx` 활용 |
| 차트 | `recharts` 활용 |
| 페이지네이션 | 기존 `ui/pagination.tsx` 활용 |

---

## 6. AuthContext 확장

```typescript
// auth-context.tsx 수정
interface User {
  // 기존...
  role: 'user' | 'provider' | 'admin';
}
```

---

## 7. 라우트 추가

```typescript
// routes.ts - 별도 레이아웃 그룹
{
  path: '/admin',
  element: <AdminLayout />,
  children: [
    { index: true, element: <AdminDashboard /> },
    { path: 'users', element: <AdminUserManagement /> },
    { path: 'users/:id', element: <AdminUserDetail /> },
    { path: 'routines', element: <AdminRoutineManagement /> },
    { path: 'purchases', element: <AdminPurchaseManagement /> },
    { path: 'posts', element: <AdminPostModeration /> },
    { path: 'challenges', element: <AdminChallengeManagement /> },
    { path: 'settings', element: <AdminSettings /> },
  ],
},
```

## 8. 신규 파일 목록

| 파일 | 설명 |
|------|------|
| `src/app/components/admin/AdminLayout.tsx` | 어드민 레이아웃 |
| `src/app/components/admin/AdminSidebar.tsx` | 사이드바 |
| `src/app/components/admin/AdminHeader.tsx` | 헤더 |
| `src/app/components/admin/AdminDashboard.tsx` | 대시보드 |
| `src/app/components/admin/AdminUserManagement.tsx` | 유저 관리 |
| `src/app/components/admin/AdminUserDetail.tsx` | 유저 상세 |
| `src/app/components/admin/AdminRoutineManagement.tsx` | 루틴 관리 |
| `src/app/components/admin/AdminPurchaseManagement.tsx` | 구매 관리 |
| `src/app/components/admin/AdminPostModeration.tsx` | 게시물 관리 |
| `src/app/components/admin/AdminChallengeManagement.tsx` | 챌린지 관리 |
| `src/app/components/admin/AdminSettings.tsx` | 어드민 설정 |

> 어드민 컴포넌트는 `src/app/components/admin/` 디렉토리에 분리하여 관리
