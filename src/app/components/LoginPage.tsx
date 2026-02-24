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
            <div className="w-11 h-11 bg-[#1a1a2e] rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-[#65D9AC]" />
            </div>
            <span className="text-[#1a1a2e] text-[22px] font-semibold tracking-tight">TodoMarket</span>
          </Link>
          <h1 className="text-[#1a1a2e] text-[26px] mt-4 font-bold">로그인</h1>
          <p className="text-[#6b6b80] text-[14px] mt-2">
            계정에 로그인하고 To-Do 리스트를 관리하세요
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-8" style={{boxShadow: 'var(--shadow-card)'}}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[14px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-[14px] text-[#1a1a2e] mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="name@example.com"
                className="w-full px-4 py-3 bg-[#f5f5f7] border border-black/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]/40 transition-all text-[14px]"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[14px] text-[#1a1a2e] mb-2">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="비밀번호 입력"
                  className="w-full px-4 py-3 pr-12 bg-[#f5f5f7] border border-black/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]/40 transition-all text-[14px]"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6b6b80] hover:text-[#1a1a2e] bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1a1a2e] text-white rounded-xl hover:bg-[#2a2a3e] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border-none text-[15px] font-medium"
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
          <div className="mt-5 p-4 bg-[#f4f3ff] border border-[#6C5CE7]/10 rounded-xl">
            <p className="text-[13px] text-[#6C5CE7] font-medium mb-2">데모 계정으로 체험하기</p>
            <div className="text-[13px] text-[#6b6b80] space-y-0.5 mb-3">
              <p>이메일: demo@todomarket.kr</p>
              <p>비밀번호: demo1234</p>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              className="w-full py-2 bg-[#6C5CE7]/10 text-[#6C5CE7] rounded-lg hover:bg-[#6C5CE7]/20 transition-colors cursor-pointer text-[13px] font-medium border-none"
            >
              데모 계정 자동 입력
            </button>
          </div>

          <div className="text-center mt-6">
            <span className="text-[#6b6b80] text-[14px]">계정이 없으신가요? </span>
            <Link
              to={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-[#6C5CE7] hover:text-[#5A4BD6] no-underline text-[14px] font-medium"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
