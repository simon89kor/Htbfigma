import { Outlet } from "react-router";
import { AuthProvider } from "../auth-context";
import { StoreProvider } from "../store-context";

export function RootProviders() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Outlet />
      </StoreProvider>
    </AuthProvider>
  );
}
