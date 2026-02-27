import { Outlet } from "react-router";
import { AuthProvider } from "../auth-context";
import { StoreProvider } from "../store-context";
import { CommunityProvider } from "../community-context";
import { NotificationProvider } from "../notification-context";
import { RewardProvider } from "../reward-context";

export function RootProviders() {
  return (
    <AuthProvider>
      <StoreProvider>
        <CommunityProvider>
          <NotificationProvider>
            <RewardProvider>
              <Outlet />
            </RewardProvider>
          </NotificationProvider>
        </CommunityProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
