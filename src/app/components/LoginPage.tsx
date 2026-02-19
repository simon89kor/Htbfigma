import { useState } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router";
import { Eye, EyeOff, LogIn, CheckSquare, AlertCircle } from "lucide-react";
import { useAuth } from "../auth-context";
import { toast } from "sonner";

export function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 이미 로그인된 경우 리다이렉트
  if (isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    // 약간의 딜레이로 로딩 UX
    await new Promise((r) => setTimeout(r, 600));

    const result = login(email, password);
    setIsLoading(false);

    if (result.success) {
      toast.success("로그인 성공! 환영합니다 🎉");
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error || "로그인에 실패했습니다.");
    }
  };

  const fillDemo = () => {
    setEmail("demo@todomarket.kr");
    setPassword("demo1234");
    setError("");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline mb-6">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-[#1a1a2e] text-[22px] tracking-tight">TodoMarket</span>
          </Link>
          <h1 className="text-[#1a1a2e] text-[26px] mt-4">로그인</h1>
          <p className="text-gray-400 text-[14px] mt-2">
            계정에 로그인하고 To-Do 리스트를 관리하세요
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[14px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[14px] text-gray-700 mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="name@example.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[14px] text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="비밀번호 입력"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  로그인
                </>
              )}
            </button>
          </form>

          {/* Demo Account */}
          <div className="mt-5 p-4 bg-violet-50 border border-violet-100 rounded-xl">
            <p className="text-[13px] text-violet-600 mb-2">데모 계정으로 체험하기</p>
            <div className="text-[13px] text-gray-500 space-y-0.5 mb-3">
              <p>이메일: demo@todomarket.kr</p>
              <p>비밀번호: demo1234</p>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              className="w-full py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors cursor-pointer text-[13px] border-none"
            >
              데모 계정 자동 입력
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center mt-6">
            <span className="text-gray-400 text-[14px]">계정이 없으신가요? </span>
            <Link
              to={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-violet-600 hover:text-violet-700 no-underline text-[14px]"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}