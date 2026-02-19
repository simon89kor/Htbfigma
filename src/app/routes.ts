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

export const router = createBrowserRouter([
  {
    Component: RootProviders,
    children: [
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
          { path: "*", Component: NotFoundPage },
        ],
      },
    ],
  },
]);