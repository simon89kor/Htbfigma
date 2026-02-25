import { useState } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router";
import { Eye, EyeOff, LogIn, CheckSquare, AlertCircle } from "lucide-react";
import { Input, Button, Card, CardBody } from "@heroui/react";
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
    if (!email.trim()) { setError("이메일을 입력해주세요."); return; }
    if (!password) { setError("비밀번호를 입력해주세요."); return; }

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
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline mb-6">
            <div className="w-11 h-11 bg-[#1a1a2e] rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-[#65D9AC]" />
            </div>
            <span className="text-default-900 text-[22px] font-semibold tracking-tight">TodoMarket</span>
          </Link>
          <h1 className="text-default-900 text-[26px] mt-4 font-bold">로그인</h1>
          <p className="text-default-500 text-sm mt-2">계정에 로그인하고 To-Do 리스트를 관리하세요</p>
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
                label="이메일"
                type="email"
                value={email}
                onValueChange={(v) => { setEmail(v); setError(""); }}
                placeholder="name@example.com"
                variant="bordered"
                radius="lg"
                autoComplete="email"
              />

              <Input
                label="비밀번호"
                type={showPassword ? "text" : "password"}
                value={password}
                onValueChange={(v) => { setPassword(v); setError(""); }}
                placeholder="비밀번호 입력"
                variant="bordered"
                radius="lg"
                autoComplete="current-password"
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

              <Button
                type="submit"
                color="primary"
                variant="solid"
                fullWidth
                size="lg"
                isLoading={isLoading}
                startContent={!isLoading && <LogIn className="w-5 h-5" />}
                className="font-medium"
              >
                로그인
              </Button>
            </form>

            <Card shadow="none" className="bg-secondary-50 border border-secondary-100">
              <CardBody className="gap-2 p-4">
                <p className="text-sm text-secondary font-medium">데모 계정으로 체험하기</p>
                <div className="text-sm text-default-500 space-y-0.5">
                  <p>이메일: demo@todomarket.kr</p>
                  <p>비밀번호: demo1234</p>
                </div>
                <Button
                  color="secondary"
                  variant="flat"
                  size="sm"
                  fullWidth
                  onPress={fillDemo}
                  className="mt-1 font-medium"
                >
                  데모 계정 자동 입력
                </Button>
              </CardBody>
            </Card>

            <div className="text-center">
              <span className="text-default-500 text-sm">계정이 없으신가요? </span>
              <Link
                to={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
                className="text-secondary hover:text-secondary-600 no-underline text-sm font-medium"
              >
                회원가입
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
