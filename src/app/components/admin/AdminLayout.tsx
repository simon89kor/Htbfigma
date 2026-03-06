import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router';
import { useAuth } from '../../auth-context';
import { getProfile } from '@/lib/api/profiles';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { Skeleton } from '../ui/skeleton';
import type { Profile } from '@/lib/database.types';

const AdminLayout = () => {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setProfileLoading(false);
        return;
      }

      try {
        const data = await getProfile(user.id);
        setProfile(data);
      } catch {
        // Profile fetch failed
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user?.id, authLoading]);

  // Show loading while auth or profile is loading
  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-[240px] bg-black/80 border-r border-white/10 shrink-0" />
        <div className="flex-1 bg-background">
          <div className="h-16 bg-black/60 border-b border-white/10" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if not admin
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <main className="flex-1 bg-background overflow-hidden flex flex-col">
        <AdminHeader />
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
