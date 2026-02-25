import { useState } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router";
import { Eye, EyeOff, UserPlus, CheckSquare, AlertCircle, Check } from "lucide-react";
import { Input, Button, Card, CardBody } from "@heroui/react";
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
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline mb-6">
            <div className="w-11 h-11 bg-[#1a1a2e] rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-[#65D9AC]" />
            </div>
            <span className="text-default-900 text-[22px] font-semibold tracking-tight">TodoMarket</span>
          </Link>
          <h1 className="text-default-900 text-[26px] mt-4 font-bold">회원가입</h1>
          <p className="text-default-500 text-sm mt-2">TodoMarket에 가입하고 다양한 To-Do 리스트를 만나보세요</p>
        </div>

        <Card shadow="sm" className="p-2">
          <CardBody className="gap-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-100 rounded-xl text-danger text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Input
                label="이름"
                type="text"
                value={name}
                onValueChange={(v) => { setName(v); setError(""); }}
                placeholder="홍길동"
                variant="bordered"
                radius="lg"
                autoComplete="name"
              />

              <Input
                label="이메일"
                type="email"
                value={email}
                onValueChange={(v) => { setEmail(v); setError(""); }}
                placeholder="name@example.com"
                variant="bordered"
                radius="lg"
                autoComplete="email"
              />

              <div>
                <Input
                  label="비밀번호"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onValueChange={(v) => { setPassword(v); setError(""); }}
                  placeholder="비밀번호 입력"
                  variant="bordered"
                  radius="lg"
                  autoComplete="new-password"
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-default-400 hover:text-default-700 bg-transparent border-none cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                />
                {password && (
                  <div className="flex gap-3 mt-2">
                    {passwordChecks.map((check) => (
                      <span
                        key={check.label}
                        className={`flex items-center gap-1 text-xs ${check.valid ? "text-success" : "text-default-400"}`}
                      >
                        <Check className="w-3 h-3" />
                        {check.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Input
                label="비밀번호 확인"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onValueChange={(v) => { setConfirmPassword(v); setError(""); }}
                placeholder="비밀번호 다시 입력"
                variant="bordered"
                radius="lg"
                autoComplete="new-password"
                isInvalid={!!confirmPassword && confirmPassword !== password}
                errorMessage={confirmPassword && confirmPassword !== password ? "비밀번호가 일치하지 않습니다" : undefined}
              />

              <Button
                type="submit"
                color="primary"
                variant="solid"
                fullWidth
                size="lg"
                isLoading={isLoading}
                startContent={!isLoading && <UserPlus className="w-5 h-5" />}
                className="font-medium"
              >
                회원가입
              </Button>
            </form>

            <div className="text-center">
              <span className="text-default-500 text-sm">이미 계정이 있으신가요? </span>
              <Link
                to={`/login${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
                className="text-secondary hover:text-secondary-600 no-underline text-sm font-medium"
              >
                로그인
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
