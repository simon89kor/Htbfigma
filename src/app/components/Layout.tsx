import { Outlet, Link, useLocation } from "react-router";
import {
  ShoppingCart,
  Store,
  ClipboardList,
  CheckSquare,
  Menu,
  X,
  LogIn,
  User,
  LogOut,
  ChevronDown,
  PlusCircle,
} from "lucide-react";
import { useStore } from "../store-context";
import { useAuth } from "../auth-context";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export function Layout() {
  const { getCartCount } = useStore();
  const { user, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const cartCount = getCartCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    toast.success("로그아웃 되었습니다.");
  };

  const navLinks = [
    { path: "/", label: "스토어", icon: Store },
    { path: "/my-lists", label: "내 리스트", icon: ClipboardList },
    { path: "/create-routine", label: "루틴 만들기", icon: PlusCircle },
    { path: "/cart", label: "장바구니", icon: ShoppingCart, badge: cartCount },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-[#1a1a2e] tracking-tight hidden sm:block">
                TodoMarket
              </span>
            </Link>

            {/* Right Side: Desktop Nav + Auth + Mobile Toggle */}
            <div className="flex items-center gap-2">
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl no-underline transition-all duration-200 ${
                        isActive
                          ? "bg-violet-50 text-violet-700"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      <span>{link.label}</span>
                      {link.badge ? (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-[11px]">
                          {link.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>

              {/* Desktop Auth */}
              <div className="hidden md:block">
                {isLoggedIn && user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full flex items-center justify-center text-[16px]">
                        {user.avatar || "🧑‍💻"}
                      </div>
                      <span className="text-[14px] text-gray-700 max-w-[100px] truncate">
                        {user.name}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown */}
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-[14px] text-[#1a1a2e] truncate">{user.name}</p>
                          <p className="text-[12px] text-gray-400 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 transition-colors no-underline text-[14px]"
                          >
                            <User className="w-4 h-4" />
                            내 프로필
                          </Link>
                          <Link
                            to="/my-lists"
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 transition-colors no-underline text-[14px]"
                          >
                            <ClipboardList className="w-4 h-4" />
                            내 리스트
                          </Link>
                        </div>
                        <div className="border-t border-gray-100 py-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors cursor-pointer bg-transparent border-none text-[14px] text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            로그아웃
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl no-underline hover:bg-violet-700 transition-colors text-[14px]"
                  >
                    <LogIn className="w-4 h-4" />
                    로그인
                  </Link>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center gap-3">
                <Link to="/cart" className="relative p-2 text-gray-600 no-underline">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-[11px]">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white pb-4">
            {/* Mobile User Info */}
            {isLoggedIn && user && (
              <div className="px-4 pt-4 pb-3 border-b border-gray-100 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full flex items-center justify-center text-[20px]">
                    {user.avatar || "🧑‍💻"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-[#1a1a2e] truncate">{user.name}</p>
                    <p className="text-[12px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex flex-col px-4 pt-2 gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl no-underline transition-all ${
                      isActive
                        ? "bg-violet-50 text-violet-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                    {link.badge ? (
                      <span className="ml-auto w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-[12px]">
                        {link.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}

              {isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl no-underline transition-all ${
                      location.pathname === "/profile"
                        ? "bg-violet-50 text-violet-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span>내 프로필</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all cursor-pointer bg-transparent border-none text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>로그아웃</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl no-underline text-violet-600 bg-violet-50 hover:bg-violet-100 transition-all mt-2"
                >
                  <LogIn className="w-5 h-5" />
                  <span>로그인</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}