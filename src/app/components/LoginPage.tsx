import { useState } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router";
import { Eye, EyeOff, LogIn, CheckSquare, AlertCircle, Mail } from "lucide-react";
import { Input, Button, Card, CardBody } from "@heroui/react";
import { motion } from "motion/react";
import { useAuth } from "../auth-context";
import type { SocialProvider } from "@/lib/auth";
import { toast } from "sonner";

// ============================================================================
// Constants
// ============================================================================

interface SocialButton {
  provider: SocialProvider;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor?: string;
  icon: React.ReactNode;
}

const SOCIAL_BUTTONS: SocialButton[] = [
  {
    provider: 'kakao',
    label: '카카오로 시작하기',
    bgColor: '#FEE500',
    textColor: '#191919',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 3C5.58 3 2 5.8 2 9.26c0 2.22 1.48 4.17 3.7 5.27l-.94 3.44c-.08.3.26.54.52.37l4.1-2.7c.2.02.41.03.62.03 4.42 0 8-2.8 8-6.26C18 5.8 14.42 3 10 3z"
          fill="#191919"
        />
      </svg>
    ),
  },
  {
    provider: 'apple',
    label: 'Apple로 시작하기',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M14.94 10.42c-.03-2.52 2.06-3.74 2.15-3.8-1.17-1.71-3-1.95-3.65-1.97-1.55-.16-3.04.92-3.83.92-.8 0-2.02-.9-3.33-.87-1.71.03-3.29 1-4.17 2.53-1.78 3.09-.46 7.67 1.28 10.18.85 1.22 1.86 2.6 3.19 2.55 1.28-.05 1.76-.83 3.31-.83 1.54 0 1.98.83 3.33.8 1.38-.02 2.25-1.25 3.09-2.48.98-1.42 1.38-2.8 1.4-2.87-.03-.01-2.68-1.03-2.71-4.1zM12.45 3.42c.7-.86 1.18-2.04 1.05-3.22-1.01.04-2.24.68-2.97 1.53-.65.76-1.22 1.97-1.07 3.13 1.13.09 2.28-.57 2.99-1.44z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    provider: 'google',
    label: 'Google로 시작하기',
    bgColor: '#FFFFFF',
    textColor: '#1a1a2e',
    borderColor: '#DADCE0',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M19.6 10.23c0-.68-.06-1.36-.17-2.02H10v3.83h5.38a4.6 4.6 0 01-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.33z" fill="#4285F4"/>
        <path d="M10 20c2.7 0 4.96-.9 6.62-2.44l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H1.07v2.58A9.99 9.99 0 0010 20z" fill="#34A853"/>
        <path d="M4.42 11.89a6.01 6.01 0 010-3.78V5.53H1.07a9.99 9.99 0 000 8.94l3.35-2.58z" fill="#FBBC05"/>
        <path d="M10 3.96c1.47 0 2.78.5 3.82 1.5l2.86-2.87C14.96.99 12.7 0 10 0A9.99 9.99 0 001.07 5.53l3.35 2.58C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
      </svg>
    ),
  },
];

// ============================================================================
// Component
// ============================================================================

export function LoginPage() {
  const { login, socialLogin, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);

  if (isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSocialLogin = async (provider: SocialProvider) => {
    setSocialLoading(provider);
    setError("");
    try {
      const result = await socialLogin(provider);
      if (!result.success && result.error) {
        setError(result.error);
      }
      // If successful, Supabase will redirect to /auth/callback
    } catch {
      setError("소셜 로그인에 실패했습니다.");
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("이메일을 입력해주세요."); return; }
    if (!password) { setError("비밀번호를 입력해주세요."); return; }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      toast.success("로그인 성공! 환영합니다.");
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
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline mb-6">
            <div className="w-11 h-11 bg-[#1a1a2e] rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-[#65D9AC]" />
            </div>
            <span className="text-default-900 text-[22px] font-semibold tracking-tight">
              HOW TO BE
            </span>
          </Link>
          <h1 className="text-default-900 text-[26px] mt-4 font-bold">
            나를 바꾸는 루틴 습관
          </h1>
          <p className="text-default-500 text-sm mt-2">
            간편하게 시작하세요
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          {SOCIAL_BUTTONS.map((btn) => (
            <button
              key={btn.provider}
              type="button"
              onClick={() => handleSocialLogin(btn.provider)}
              disabled={socialLoading !== null}
              className="flex items-center justify-center gap-3 w-full h-12 rounded-lg text-sm font-medium border cursor-pointer transition-opacity disabled:opacity-60 active:scale-[0.98]"
              style={{
                backgroundColor: btn.bgColor,
                color: btn.textColor,
                borderColor: btn.borderColor || btn.bgColor,
              }}
              aria-label={btn.label}
            >
              {socialLoading === btn.provider ? (
                <span className="text-sm">로그인 중...</span>
              ) : (
                <>
                  {btn.icon}
                  <span>{btn.label}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-foreground/50 text-xs">또는</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email login toggle / form */}
        {!showEmailForm ? (
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="flex items-center gap-2 text-foreground/60 text-sm font-medium bg-transparent border-none cursor-pointer hover:text-foreground transition-colors py-2"
              aria-label="이메일로 시작하기"
            >
              <Mail className="w-4 h-4" />
              이메일로 시작하기
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
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
                    <p className="text-sm text-foreground font-medium">데모 계정으로 체험하기</p>
                    <div className="text-sm text-default-800 space-y-0.5">
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
                  <span className="text-default-700 text-sm">계정이 없으신가요? </span>
                  <Link
                    to={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
                    className="text-foreground hover:text-secondary-600 no-underline text-sm font-medium"
                  >
                    회원가입
                  </Link>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* Error display outside email form (for social login errors) */}
        {error && !showEmailForm && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-danger-50 border border-danger-100 rounded-xl text-danger text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
