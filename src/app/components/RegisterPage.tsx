import { useState } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router";
import { Eye, EyeOff, UserPlus, CheckSquare, AlertCircle, Check } from "lucide-react";
import { useAuth } from "../auth-context";
import { toast } from "sonner";

export function RegisterPage() {
  const { register, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  const passwordChecks = [
    { label: "8자 이상", valid: password.length >= 8 },
    { label: "영문 포함", valid: /[a-zA-Z]/.test(password) },
    { label: "숫자 포함", valid: /[0-9]/.test(password) },
  ];

  const isPasswordValid = passwordChecks.every((c) => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!email.trim()) { setError("이메일을 입력해주세요."); return; }
    if (!isPasswordValid) { setError("비밀번호 조건을 모두 충족해주세요."); return; }
    if (password !== confirmPassword) { setError("비밀번호가 일치하지 않습니다."); return; }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const result = register(name, email, password);
    setIsLoading(false);

    if (result.success) {
      toast.success("회원가입 완료! 환영합니다 🎉");
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error || "회원가입에 실패했습니다.");
    }
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
          <h1 className="text-[#1a1a2e] text-[26px] mt-4 font-bold">회원가입</h1>
          <p className="text-[#6b6b80] text-[14px] mt-2">
            TodoMarket에 가입하고 다양한 To-Do 리스트를 만나보세요
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
              <label className="block text-[14px] text-[#1a1a2e] mb-2">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="홍길동"
                className="w-full px-4 py-3 bg-[#f5f5f7] border border-black/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]/40 transition-all text-[14px]"
                autoComplete="name"
              />
            </div>

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
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6b6b80] hover:text-[#1a1a2e] bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <div className="flex gap-3 mt-2">
                  {passwordChecks.map((check) => (
                    <span
                      key={check.label}
                      className={`flex items-center gap-1 text-[12px] ${
                        check.valid ? "text-[#65D9AC]" : "text-[#6b6b80]"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      {check.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[14px] text-[#1a1a2e] mb-2">비밀번호 확인</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="비밀번호 다시 입력"
                className={`w-full px-4 py-3 bg-[#f5f5f7] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]/40 transition-all text-[14px] ${
                  confirmPassword && confirmPassword !== password
                    ? "border-red-300"
                    : "border-black/[0.06]"
                }`}
                autoComplete="new-password"
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-red-500 text-[12px] mt-1">비밀번호가 일치하지 않습니다</p>
              )}
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
                  <UserPlus className="w-5 h-5" />
                  회원가입
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-[#6b6b80] text-[14px]">이미 계정이 있으신가요? </span>
            <Link
              to={`/login${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-[#6C5CE7] hover:text-[#5A4BD6] no-underline text-[14px] font-medium"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
