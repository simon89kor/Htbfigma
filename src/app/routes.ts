import { createBrowserRouter } from "react-router";
import { RootProviders } from "./components/RootProviders";
import { Layout } from "./components/Layout";
import { StorePage } from "./components/StorePage";
import { ProductDetailPage } from "./components/ProductDetailPage";
import { CartPage } from "./components/CartPage";
import { MyListsPage } from "./components/MyListsPage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ProfilePage } from "./components/ProfilePage";
import { CreateRoutinePage } from "./components/CreateRoutinePage";
import { CheckoutStartDatePage } from "./components/CheckoutStartDatePage";
import { NotFoundPage } from "./components/NotFoundPage";
export const router = createBrowserRouter([
  {
    Component: RootProviders,
    children: [
      // ==================================================================
      // [F1] 온보딩 라우트 — Layout 밖 (풀스크린, 네비게이션 바 없음)
      // ==================================================================
      {
        path: "splash",
        lazy: () =>
          import("./components/SplashScreen").then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: "walkthrough",
        lazy: () =>
          import("./components/WalkthroughPage").then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: "auth/callback",
        lazy: () =>
          import("./components/AuthCallbackPage").then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: "terms",
        lazy: () =>
          import("./components/TermsAgreementPage").then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: "preference",
        lazy: () =>
          import("./components/PreferenceSetupPage").then((m) => ({
            Component: m.default,
          })),
      },
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
          {
            path: "challenges",
            lazy: async () => {
              const { default: AdminChallengeManagement } = await import("./components/admin/AdminChallengeManagement");
              return { Component: AdminChallengeManagement };
            },
          },
          {
            path: "settings",
            lazy: async () => {
              const { default: AdminSettings } = await import("./components/admin/AdminSettings");
              return { Component: AdminSettings };
            },
          },
        ],
      },
      // ==================================================================
      // Layout 라우트
      // ==================================================================
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: StorePage },
          { path: "product/:id", Component: ProductDetailPage },
          { path: "cart", Component: CartPage },
          { path: "checkout/start-date", Component: CheckoutStartDatePage },
          { path: "my-lists", Component: MyListsPage },
          { path: "create-routine", Component: CreateRoutinePage },
          { path: "login", Component: LoginPage },
          { path: "register", Component: RegisterPage },
          { path: "profile", Component: ProfilePage },
          // [F2] Purchase Flow 라우트
          {
            path: "payment",
            lazy: () =>
              import("./components/PaymentMethodPage").then((m) => ({
                Component: m.PaymentMethodPage,
              })),
          },
          {
            path: "purchase-complete",
            lazy: () =>
              import("./components/PurchaseCompletePage").then((m) => ({
                Component: m.PurchaseCompletePage,
              })),
          },
          // [F3] Settings 라우트
          {
            path: "settings",
            lazy: () =>
              import("./components/SettingsPage").then((m) => ({
                Component: m.SettingsPage,
              })),
          },
          // [F4] Home Extension 라우트
          {
            path: "search",
            lazy: async () => {
              const { SearchResultPage } = await import("./components/SearchResultPage");
              return { Component: SearchResultPage };
            },
          },
          {
            path: "provider/:id",
            lazy: async () => {
              const { ProviderProfilePage } = await import("./components/ProviderProfilePage");
              return { Component: ProviderProfilePage };
            },
          },
          // [F5] Community 라우트
          {
            path: "community",
            lazy: async () => {
              const { default: CommunityFeedPage } = await import("./components/CommunityFeedPage");
              return { Component: CommunityFeedPage };
            },
          },
          {
            path: "community/create",
            lazy: async () => {
              const { default: PostCreatePage } = await import("./components/PostCreatePage");
              return { Component: PostCreatePage };
            },
          },
          {
            path: "community/:id",
            lazy: async () => {
              const { default: PostDetailPage } = await import("./components/PostDetailPage");
              return { Component: PostDetailPage };
            },
          },
          {
            path: "user/:id",
            lazy: async () => {
              const { default: UserProfileViewPage } = await import("./components/UserProfileViewPage");
              return { Component: UserProfileViewPage };
            },
          },
          {
            path: "ranking",
            lazy: async () => {
              const { default: RankingDetailPage } = await import("./components/RankingDetailPage");
              return { Component: RankingDetailPage };
            },
          },
          // [F6] Board Extension 라우트
          {
            path: "stats",
            lazy: async () => {
              const { default: ProgressStatsPage } = await import("./components/ProgressStatsPage");
              return { Component: ProgressStatsPage };
            },
          },
          // [F8] Reward 라우트
          {
            path: "reward",
            lazy: async () => {
              const { default: RewardMainPage } = await import("./components/RewardMainPage");
              return { Component: RewardMainPage };
            },
          },
          {
            path: "reward/badges",
            lazy: async () => {
              const { default: BadgeCollectionPage } = await import("./components/BadgeCollectionPage");
              return { Component: BadgeCollectionPage };
            },
          },
          {
            path: "reward/ranking",
            lazy: async () => {
              const { default: RankingBoardPage } = await import("./components/RankingBoardPage");
              return { Component: RankingBoardPage };
            },
          },
          {
            path: "reward/challenges",
            lazy: async () => {
              const { default: ChallengePage } = await import("./components/ChallengePage");
              return { Component: ChallengePage };
            },
          },
          {
            path: "reward/challenges/:id",
            lazy: async () => {
              const { default: ChallengeDetailPage } = await import("./components/ChallengeDetailPage");
              return { Component: ChallengeDetailPage };
            },
          },
          // [F7] Notification 라우트
          {
            path: "notifications",
            lazy: () =>
              import("./components/NotificationCenterPage").then((m) => ({
                Component: m.NotificationCenterPage,
              })),
          },
          // [F3] Phase 4 — QR Code Center + Following
          {
            path: "qr",
            lazy: async () => {
              const { default: QRCodeCenterPage } = await import("./components/QRCodeCenterPage");
              return { Component: QRCodeCenterPage };
            },
          },
          {
            path: "following",
            lazy: async () => {
              const { default: FollowingPage } = await import("./components/FollowingPage");
              return { Component: FollowingPage };
            },
          },
          { path: "*", Component: NotFoundPage },
        ],
      },
    ],
  },
]);
