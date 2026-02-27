# Admin Routes Configuration

> 이 파일은 F9 에이전트가 생성한 라우트 설정 안내입니다.
> routes.ts에 아래 내용을 통합 머지 시 추가해주세요.

## routes.ts에 추가해야 할 import (없음 - lazy loading 사용)

Admin 라우트는 모두 lazy loading으로 처리하므로 상단 import는 필요 없습니다.

## routes.ts에 추가해야 할 route config

`RootProviders`의 `children` 배열에 아래를 추가합니다.
Layout 라우트(`path: "/"`) **밖**, 온보딩 라우트와 같은 레벨에 위치해야 합니다.

```typescript
// ==================================================================
// [F9] Admin 라우트 — 별도 AdminLayout (사이드바 + 헤더)
// ==================================================================
{
  path: "admin",
  lazy: async () => {
    const { default: AdminLayout } = await import("./components/admin/AdminLayout");
    return { Component: AdminLayout };
  },
  children: [
    {
      index: true,
      lazy: async () => {
        const { default: AdminDashboard } = await import("./components/admin/AdminDashboard");
        return { Component: AdminDashboard };
      },
    },
    {
      path: "users",
      lazy: async () => {
        const { default: AdminUserManagement } = await import("./components/admin/AdminUserManagement");
        return { Component: AdminUserManagement };
      },
    },
    {
      path: "users/:id",
      lazy: async () => {
        const { default: AdminUserDetail } = await import("./components/admin/AdminUserDetail");
        return { Component: AdminUserDetail };
      },
    },
    {
      path: "routines",
      lazy: async () => {
        const { default: AdminRoutineManagement } = await import("./components/admin/AdminRoutineManagement");
        return { Component: AdminRoutineManagement };
      },
    },
    {
      path: "purchases",
      lazy: async () => {
        const { default: AdminPurchaseManagement } = await import("./components/admin/AdminPurchaseManagement");
        return { Component: AdminPurchaseManagement };
      },
    },
    {
      path: "posts",
      lazy: async () => {
        const { default: AdminPostModeration } = await import("./components/admin/AdminPostModeration");
        return { Component: AdminPostModeration };
      },
    },
  ],
},
```

## 위치 참고

```typescript
// routes.ts 구조 (추가 위치 표시)
export const router = createBrowserRouter([
  {
    Component: RootProviders,
    children: [
      // [F1] 온보딩 라우트 (Layout 밖)
      { path: "splash", ... },
      { path: "walkthrough", ... },
      { path: "auth/callback", ... },
      { path: "terms", ... },
      { path: "preference", ... },

      // ★★★ [F9] Admin 라우트 추가 위치 ★★★
      // { path: "admin", ... } <-- 여기에 위 코드 삽입

      // Layout 라우트
      {
        path: "/",
        Component: Layout,
        children: [ ... ],
      },
    ],
  },
]);
```

## 참고사항

- AdminLayout은 기존 Layout.tsx와 완전히 독립된 별도 레이아웃입니다.
- AdminLayout 내부에서 `profiles.role === 'admin'` 권한 체크를 수행합니다.
- 비로그인 시 `/login`으로, admin이 아닌 유저는 `/`로 리다이렉트합니다.
- 챌린지 관리(`/admin/challenges`)와 설정(`/admin/settings`)은 사이드바에 메뉴는 있지만,
  해당 라우트 컴포넌트는 이번 스코프에 포함되지 않았습니다.
  필요 시 placeholder 컴포넌트를 추가하거나, 라우트를 생략할 수 있습니다.
