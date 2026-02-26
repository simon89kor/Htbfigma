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
import { NotFoundPage } from "./components/NotFoundPage";
// [F2] Purchase Flow 라우트 import
import { PaymentMethodPage } from "./components/PaymentMethodPage";
import { PurchaseCompletePage } from "./components/PurchaseCompletePage";

// ============================================================================
// [F1 Onboarding] 신규 라우트 5개 추가
// - /splash          → SplashScreen (Layout 밖, 풀스크린)
// - /walkthrough     → WalkthroughPage (Layout 밖, 풀스크린)
// - /auth/callback   → AuthCallbackPage (Layout 밖, OAuth 리다이렉트)
// - /terms           → TermsAgreementPage (Layout 밖, 온보딩 플로우)
// - /preference      → PreferenceSetupPage (Layout 밖, 온보딩 플로우)
// ============================================================================

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
      // 기존 Layout 라우트 (변경 없음)
      // ==================================================================
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: StorePage },
          { path: "product/:id", Component: ProductDetailPage },
          { path: "cart", Component: CartPage },
          { path: "my-lists", Component: MyListsPage },
          { path: "create-routine", Component: CreateRoutinePage },
          { path: "login", Component: LoginPage },
          { path: "register", Component: RegisterPage },
          { path: "profile", Component: ProfilePage },
          // [F2] Purchase Flow 라우트 (통합 머지 시 주의)
          { path: "payment", Component: PaymentMethodPage },
          { path: "purchase-complete", Component: PurchaseCompletePage },
          { path: "*", Component: NotFoundPage },
        ],
      },
    ],
  },
]);
