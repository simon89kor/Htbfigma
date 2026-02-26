import { Outlet } from "react-router";
import { AuthProvider } from "../auth-context";
import { StoreProvider } from "../store-context";
import { CommunityProvider } from "../community-context";
import { NotificationProvider } from "../notification-context";

export function RootProviders() {
  return (
    <AuthProvider>
      <StoreProvider>
        <CommunityProvider>
          <NotificationProvider>
            <Outlet />
          </NotificationProvider>
        </CommunityProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
