# Agent F9: Admin Dashboard Frontend

> **읽어야 할 문서:** `COMMON.md` → 이 문서 → `doc/09_ADMIN.md`

---

## Identity

```yaml
이름: Admin Agent
역할: Frontend Developer — Admin Panel & Data Management Specialist
전문성: 관리자 대시보드, 데이터 테이블, 차트, CRUD 인터페이스, 권한 관리
성격: 복잡한 데이터를 깔끔한 테이블과 차트로 정리하는 관리 전문가.
원칙: "관리자는 한 화면에서 전체 현황을 파악하고, 3클릭 안에 조치할 수 있어야 한다."
```

## Mission

HTB 서비스의 **Admin Dashboard 전체**를 구현한다.
별도 레이아웃(`AdminLayout`)으로 사이드바 + 헤더 + 9개 관리 화면을 개발한다.

> ⚠️ **독립된 레이아웃.** 기존 Layout.tsx와 별도이므로 다른 에이전트와 충돌 없음.

---

## Scope

| 화면 | 파일 | 핵심 |
|------|------|------|
| Admin Layout | `admin/AdminLayout.tsx` | 사이드바 + 헤더 + 권한 체크 |
| Admin Sidebar | `admin/AdminSidebar.tsx` | 메뉴 네비게이션 |
| Admin Header | `admin/AdminHeader.tsx` | 페이지 타이틀 + 관리자 프로필 |
| Dashboard | `admin/AdminDashboard.tsx` | KPI 카드 + 차트 4종 |
| User Management | `admin/AdminUserManagement.tsx` | 유저 테이블 + 검색/필터 |
| User Detail | `admin/AdminUserDetail.tsx` | 유저 상세 + 역할/상태 변경 |
| Routine Management | `admin/AdminRoutineManagement.tsx` | 루틴 CRUD 테이블 |
| Purchase Management | `admin/AdminPurchaseManagement.tsx` | 구매 내역 + 환불 |
| Post Moderation | `admin/AdminPostModeration.tsx` | 게시물 관리 + 신고 처리 |
| 라우트 등록 | `routes.ts` 수정 | /admin/* (nested routes) |

---

## Rules

### 반드시 따를 것
1. **admin/ 디렉토리 분리** — 모든 Admin 컴포넌트는 `src/app/components/admin/`에
2. **권한 체크** — `AdminLayout`에서 `profiles.role === 'admin'` 확인, 아니면 리다이렉트
3. **사이드바 너비** — 240px, `--primary` (#1a1a2e) 배경
4. **기존 ui/ 컴포넌트 최대한 활용** — Table, Pagination, Dialog, Badge 등
5. **차트는 recharts** — Dashboard의 4종 차트
6. **테이블 페이지네이션** — 페이지당 20건, 기존 `ui/pagination.tsx` 활용
7. **데스크탑 우선** — Admin은 모바일 대신 데스크탑 레이아웃

### 하지 말 것
- 기존 Layout.tsx를 수정하지 않기 (AdminLayout은 완전 별도)
- Admin API를 기존 프론트엔드 API와 섞지 않기 (admin 전용 함수 분리)
- service_role 키를 프론트엔드에서 사용하지 않기 (RLS의 admin 정책으로 처리)

---

## API Dependencies

```typescript
// Admin 전용 API (RLS에서 role='admin' 조건으로 접근 제어)
// src/lib/api/admin.ts (신규 생성 또는 기존 API에 admin 함수 추가)

// Dashboard 통계 — RPC
const { data } = await supabase.rpc('get_admin_dashboard_stats');

// 유저 관리
const { data } = await supabase
  .from('profiles')
  .select('*')
  .ilike('nickname', `%${search}%`)
  .range(from, to);

// 유저 역할/상태 변경
await supabase.from('profiles').update({ role, status }).eq('id', userId);

// 구매 관리
const { data } = await supabase
  .from('purchases')
  .select('*, profiles!user_id(nickname), routines!routine_id(title)')
  .order('purchased_at', { ascending: false });

// 게시물 관리
const { data } = await supabase
  .from('posts')
  .select('*, profiles!author_id(nickname), reports(count)')
  .order('created_at', { ascending: false });
```

---

## Component Spec

### AdminLayout
```tsx
const AdminLayout = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  // profiles 테이블에서 role 확인
  const { data: profile } = useProfile(user.id);
  if (profile?.role !== 'admin') return <Navigate to="/" />;

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-gray-50 overflow-auto">
        <AdminHeader />
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
```

### AdminSidebar 메뉴
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

### Dashboard KPI 카드
```
[전체 유저: 1,234]  [신규 가입: +45 (이번주)]
[총 매출: ₩2.5M]   [활성 루틴: 89]
```

### Dashboard 차트 (recharts)
```
1. 주간 가입자 추이 — LineChart
2. 카테고리별 매출 — BarChart
3. DAU (일일 활성 유저) — AreaChart
4. 미처리 신고 — 리스트 (차트 아님)
```

---

## Route Config

```typescript
// routes.ts에 추가 (nested routes)
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
  ],
}
```

---

## Quality Checklist

- [ ] /admin 접근 시 비로그인 → /login 리다이렉트
- [ ] /admin 접근 시 admin 아닌 유저 → / 리다이렉트
- [ ] 사이드바 현재 페이지 하이라이트
- [ ] Dashboard KPI 카드 데이터 로드
- [ ] Dashboard 차트 4종 렌더링
- [ ] 유저 테이블 검색 + 필터 + 페이지네이션
- [ ] 유저 역할 변경 (일반 ↔ Provider ↔ Admin)
- [ ] 유저 상태 변경 (활성 ↔ 정지)
- [ ] 루틴 목록 표시 + 발행/비발행 토글
- [ ] 구매 내역 표시 + 환불 처리 버튼
- [ ] 게시물 목록 + 신고 건수 표시
- [ ] 게시물 숨김/삭제 처리
