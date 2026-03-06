import { useLocation, useNavigate } from 'react-router';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../auth-context';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const PAGE_TITLES: Record<string, string> = {
  '/admin': '대시보드',
  '/admin/users': '유저 관리',
  '/admin/routines': '루틴 관리',
  '/admin/purchases': '구매 관리',
  '/admin/posts': '게시물 관리',
  '/admin/challenges': '챌린지 관리',
  '/admin/settings': '설정',
};

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    // Exact match first
    if (PAGE_TITLES[location.pathname]) {
      return PAGE_TITLES[location.pathname];
    }
    // Check for user detail page
    if (location.pathname.startsWith('/admin/users/')) {
      return '유저 상세';
    }
    // Fallback to parent path
    const parentPath = '/' + location.pathname.split('/').slice(1, 3).join('/');
    return PAGE_TITLES[parentPath] ?? '관리자';
  };

  const handleLogout = async () => {
    await logout();
    toast.success('로그아웃 되었습니다.');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-black/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-foreground">{getTitle()}</h1>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-foreground/60 hover:text-foreground"
          aria-label="알림"
        >
          <Bell className="w-5 h-5" />
        </Button>

        {/* Admin Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 bg-[#13d680]/20 border border-[#13d680]/30 rounded-full flex items-center justify-center">
            <span className="text-[#13d680] text-xs font-medium">
              {user?.name?.[0] ?? 'A'}
            </span>
          </div>
          <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
            {user?.name ?? '관리자'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground/60 hover:text-destructive"
            onClick={handleLogout}
            aria-label="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
