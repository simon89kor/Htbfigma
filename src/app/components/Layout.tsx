import { Outlet, Link, useLocation } from "react-router";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Avatar,
  Badge,
  Divider,
} from "@heroui/react";
import {
  ShoppingCart,
  Store,
  ClipboardList,
  CheckSquare,
  LogIn,
  User,
  LogOut,
  PlusCircle,
  Users,
  Bell,
  Trophy,
} from "lucide-react";
import { useStore } from "../store-context";
import { useAuth } from "../auth-context";
import { useNotifications } from "../notification-context";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

// Per-route ambient glow colors (Apple Invite style)
const PAGE_GLOW_MAP: Record<string, string> = {
  '/': 'rgba(19, 214, 128, 0.50)',
  '/community': 'rgba(108, 92, 231, 0.50)',
  '/reward': 'rgba(253, 180, 60, 0.45)',
  '/profile': 'rgba(96, 165, 250, 0.45)',
  '/my-lists': 'rgba(19, 214, 128, 0.45)',
  '/cart': 'rgba(253, 180, 60, 0.42)',
  '/notifications': 'rgba(96, 165, 250, 0.42)',
  '/create-routine': 'rgba(34, 211, 238, 0.45)',
};

function getRouteGlow(pathname: string): string {
  if (PAGE_GLOW_MAP[pathname]) return PAGE_GLOW_MAP[pathname];
  // Detail pages inherit parent route color
  if (pathname.startsWith('/community')) return PAGE_GLOW_MAP['/community'];
  if (pathname.startsWith('/reward')) return PAGE_GLOW_MAP['/reward'];
  if (pathname.startsWith('/profile') || pathname.startsWith('/provider')) return PAGE_GLOW_MAP['/profile'];
  // Product detail page gets color via CSS var set by the page itself
  return 'rgba(19, 214, 128, 0.28)';
}

export function Layout() {
  const { getCartCount } = useStore();
  const { user, isLoggedIn, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const cartCount = getCartCount();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Route-based ambient glow
  const [glowColor, setGlowColor] = useState(() => getRouteGlow(location.pathname));
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      // Check if the page set a custom glow via CSS var (detail pages)
      const customGlow = document.documentElement.style.getPropertyValue('--page-glow-color');
      setGlowColor(customGlow || getRouteGlow(location.pathname));
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("로그아웃 되었습니다.");
  };

  const navLinks = [
    { path: "/", label: "스토어", icon: Store },
    { path: "/community", label: "커뮤니티", icon: Users },
    { path: "/my-lists", label: "내 리스트", icon: ClipboardList },
    { path: "/create-routine", label: "루틴 만들기", icon: PlusCircle },
    { path: "/reward", label: "리워드", icon: Trophy },
    { path: "/cart", label: "장바구니", icon: ShoppingCart, badge: cartCount },
  ];

  return (
    <div className="min-h-screen">
      {/* Ambient glow overlay — transitions between route accent colors */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: [
            `radial-gradient(ellipse 130% 65% at 50% -8%, ${glowColor} 0%, transparent 62%)`,
            `radial-gradient(ellipse 80% 50% at 50% 110%, ${glowColor.replace(/[\d.]+\)$/, '0.20)')} 0%, transparent 58%)`,
          ].join(', '),
          transition: 'background 800ms ease',
        }}
      />
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        maxWidth="xl"
        classNames={{
          base: "relative z-20 bg-[#07071a]/70 backdrop-blur-2xl border-b border-white/12 backdrop-saturate-150",
          wrapper: "px-4 sm:px-6",
        }}
      >
        <NavbarBrand>
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-[#13d680]" />
            </div>
            <span className="text-foreground font-semibold tracking-tight hidden sm:block text-lg">
              HOW TO BE
            </span>
          </Link>
        </NavbarBrand>

        <NavbarContent className="hidden md:flex gap-1" justify="center">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <NavbarItem key={link.path} isActive={isActive}>
                <Link to={link.path} className="no-underline">
                  {link.badge ? (
                    <Badge content={link.badge} color="secondary" size="sm" isInvisible={!link.badge}>
                      <Button
                        variant={isActive ? "flat" : "light"}
                        color={isActive ? "primary" : "default"}
                        startContent={<Icon className="w-[18px] h-[18px]" />}
                        size="sm"
                        className="font-medium"
                      >
                        {link.label}
                      </Button>
                    </Badge>
                  ) : (
                    <Button
                      variant={isActive ? "flat" : "light"}
                      color={isActive ? "primary" : "default"}
                      startContent={<Icon className="w-[18px] h-[18px]" />}
                      size="sm"
                      className="font-medium"
                    >
                      {link.label}
                    </Button>
                  )}
                </Link>
              </NavbarItem>
            );
          })}
        </NavbarContent>

        <NavbarContent justify="end">
          {/* [F7] 알림 아이콘 + 뱃지 */}
          {isLoggedIn && (
            <NavbarItem>
              <Link to="/notifications" className="relative p-1 no-underline text-foreground/60 hover:text-foreground transition-colors" aria-label="알림">
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#d4183d] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            </NavbarItem>
          )}

          <NavbarItem className="hidden md:flex">
            {isLoggedIn && user ? (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Button variant="light" className="gap-2" size="sm">
                    <Avatar
                      size="sm"
                      name={user.avatar || user.name[0]}
                      className="w-7 h-7 text-base"
                      showFallback
                      fallback={<span className="text-base">{user.avatar || "🧑‍💻"}</span>}
                    />
                    <span className="text-sm text-default-700 max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="User menu">
                  <DropdownSection showDivider>
                    <DropdownItem key="info" isReadOnly className="cursor-default">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-default-400">{user.email}</p>
                    </DropdownItem>
                  </DropdownSection>
                  <DropdownSection showDivider>
                    <DropdownItem
                      key="profile"
                      startContent={<User className="w-4 h-4" />}
                      href="/profile"
                    >
                      내 프로필
                    </DropdownItem>
                    <DropdownItem
                      key="lists"
                      startContent={<ClipboardList className="w-4 h-4" />}
                      href="/my-lists"
                    >
                      내 리스트
                    </DropdownItem>
                  </DropdownSection>
                  <DropdownSection>
                    <DropdownItem
                      key="logout"
                      color="danger"
                      startContent={<LogOut className="w-4 h-4" />}
                      onPress={handleLogout}
                    >
                      로그아웃
                    </DropdownItem>
                  </DropdownSection>
                </DropdownMenu>
              </Dropdown>
            ) : (
              <Link to="/login" className="no-underline">
                <Button
                  color="primary"
                  variant="solid"
                  startContent={<LogIn className="w-4 h-4" />}
                  size="sm"
                >
                  로그인
                </Button>
              </Link>
            )}
          </NavbarItem>
          <NavbarMenuToggle className="md:hidden" />
        </NavbarContent>

        <NavbarMenu>
          {isLoggedIn && user && (
            <>
              <div className="flex items-center gap-3 px-2 py-3">
                <Avatar
                  size="md"
                  showFallback
                  fallback={<span className="text-xl">{user.avatar || "🧑‍💻"}</span>}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-default-900 truncate">{user.name}</p>
                  <p className="text-xs text-default-400 truncate">{user.email}</p>
                </div>
              </div>
              <Divider className="my-2" />
            </>
          )}
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <NavbarMenuItem key={link.path} isActive={isActive}>
                <Link
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline transition-all text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-default-500 hover:bg-default-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                  {link.badge ? (
                    <Badge content={link.badge} color="secondary" size="sm">
                      <span />
                    </Badge>
                  ) : null}
                </Link>
              </NavbarMenuItem>
            );
          })}
          {/* [F7] 모바일 메뉴 알림 항목 */}
          {isLoggedIn && (
            <NavbarMenuItem>
              <Link
                to="/notifications"
                onClick={() => setIsMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline transition-all text-sm ${
                  location.pathname === "/notifications"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-default-500 hover:bg-default-100"
                }`}
              >
                <Bell className="w-5 h-5" />
                <span>알림</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-[#d4183d] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            </NavbarMenuItem>
          )}
          {isLoggedIn ? (
            <>
              <NavbarMenuItem>
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-default-500 hover:bg-default-100 text-sm"
                >
                  <User className="w-5 h-5" />
                  <span>내 프로필</span>
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-danger hover:bg-danger-50 transition-all cursor-pointer bg-transparent border-none text-left text-sm"
                >
                  <LogOut className="w-5 h-5" />
                  <span>로그아웃</span>
                </button>
              </NavbarMenuItem>
            </>
          ) : (
            <NavbarMenuItem>
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline bg-primary text-primary-foreground hover:opacity-90 transition-all mt-2 text-sm font-medium"
              >
                <LogIn className="w-5 h-5" />
                <span>로그인</span>
              </Link>
            </NavbarMenuItem>
          )}
        </NavbarMenu>
      </Navbar>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-foreground">
        <Outlet />
      </main>
    </div>
  );
}
