import { Link, useLocation } from 'react-router';
import {
  BarChart3,
  Users,
  ClipboardList,
  CreditCard,
  FileText,
  Target,
  Settings,
  CheckSquare,
} from 'lucide-react';
import { cn } from '../ui/utils';

const ADMIN_MENU = [
  { icon: BarChart3, label: '대시보드', path: '/admin' },
  { icon: Users, label: '유저 관리', path: '/admin/users' },
  { icon: ClipboardList, label: '루틴 관리', path: '/admin/routines' },
  { icon: CreditCard, label: '구매 관리', path: '/admin/purchases' },
  { icon: FileText, label: '게시물 관리', path: '/admin/posts' },
  { icon: Target, label: '챌린지 관리', path: '/admin/challenges' },
  { icon: Settings, label: '설정', path: '/admin/settings' },
] as const;

const AdminSidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-[240px] min-h-screen bg-[var(--primary)] flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-[var(--accent-color)] rounded-xl flex items-center justify-center">
          <CheckSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-semibold text-base tracking-tight">
            HTB Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {ADMIN_MENU.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors',
                    active
                      ? 'bg-[var(--accent-color)] text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-white/40 text-xs">HOW TO BE v1.0</p>
      </div>
    </aside>
  );
};

export default AdminSidebar;
