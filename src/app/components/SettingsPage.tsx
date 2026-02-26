import { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Users,
  Megaphone,
  Mail,
  Lock,
  Link2,
  CreditCard,
  Info,
  FileText,
  Shield,
  Code2,
  HelpCircle,
  MessageCircle,
  LogOut,
  UserX,
} from "lucide-react";
import { useAuth } from "../auth-context";
import { toast } from "sonner";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./ui/alert-dialog";
import { updateNotificationSettings } from "@/lib/api/profiles";
import { requestAccountDeletion } from "@/lib/auth";

// ============================================================================
// Constants
// ============================================================================

const APP_VERSION = "1.0.0";

// ============================================================================
// Main Component
// ============================================================================

export function SettingsPage() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  // Modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteStep1, setShowDeleteStep1] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification state (initialize from profile)
  const profile = user?.profile;
  const [scheduleNotif, setScheduleNotif] = useState(profile?.notification_schedule ?? true);
  const [communityNotif, setCommunityNotif] = useState(profile?.notification_community ?? true);
  const [marketingNotif, setMarketingNotif] = useState(profile?.notification_marketing ?? false);

  if (!isLoggedIn || !user) {
    return <Navigate to="/login?redirect=/settings" replace />;
  }

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleNotificationToggle = async (
    type: "schedule" | "community" | "marketing",
    value: boolean
  ) => {
    // Optimistic update
    if (type === "schedule") setScheduleNotif(value);
    if (type === "community") setCommunityNotif(value);
    if (type === "marketing") setMarketingNotif(value);

    try {
      await updateNotificationSettings(user.id, {
        notificationSchedule: type === "schedule" ? value : undefined,
        notificationCommunity: type === "community" ? value : undefined,
        notificationMarketing: type === "marketing" ? value : undefined,
      });
    } catch {
      // Rollback on error
      if (type === "schedule") setScheduleNotif(!value);
      if (type === "community") setCommunityNotif(!value);
      if (type === "marketing") setMarketingNotif(!value);
      toast.error("설정 변경에 실패했습니다.");
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
      toast.success("로그아웃 되었습니다.");
      navigate("/login");
    } catch {
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  const handleDeleteStep1Confirm = () => {
    setShowDeleteStep1(false);
    setShowDeleteStep2(true);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await requestAccountDeletion(user.id);
      setShowDeleteStep2(false);
      toast.success("회원 탈퇴가 완료되었습니다.");
      navigate("/login");
    } catch {
      toast.error("회원 탈퇴에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-default-100 transition-colors bg-transparent border-none cursor-pointer"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="w-5 h-5 text-default-700" />
        </button>
        <h1 className="text-default-900 text-xl font-bold">설정</h1>
      </div>

      {/* Section 1: Notification Settings */}
      <SettingsSection title="알림 설정">
        <SettingsToggleRow
          icon={Bell}
          label="일정 알림"
          description="루틴 시작, 미완료 리마인더"
          checked={scheduleNotif}
          onCheckedChange={(v) => handleNotificationToggle("schedule", v)}
        />
        <Separator />
        <SettingsToggleRow
          icon={Users}
          label="커뮤니티 알림"
          description="댓글, 좋아요, 팔로우 알림"
          checked={communityNotif}
          onCheckedChange={(v) => handleNotificationToggle("community", v)}
        />
        <Separator />
        <SettingsToggleRow
          icon={Megaphone}
          label="마케팅 알림"
          description="이벤트, 할인, 추천 알림"
          checked={marketingNotif}
          onCheckedChange={(v) => handleNotificationToggle("marketing", v)}
        />
      </SettingsSection>

      {/* Section 2: Account Management */}
      <SettingsSection title="계정 관리">
        <SettingsInfoRow icon={Mail} label="이메일" value={user.email} />
        <Separator />
        <SettingsLinkRow
          icon={Lock}
          label="비밀번호 변경"
          onClick={() => toast.info("비밀번호 변경 기능은 준비 중입니다.")}
        />
        <Separator />
        <SettingsLinkRow
          icon={Link2}
          label="소셜 계정 연동"
          onClick={() => toast.info("소셜 계정 연동 기능은 준비 중입니다.")}
        />
      </SettingsSection>

      {/* Section 3: Payment */}
      <SettingsSection title="결제">
        <SettingsLinkRow
          icon={CreditCard}
          label="결제 수단 관리"
          onClick={() => toast.info("결제 수단 관리 기능은 준비 중입니다.")}
        />
      </SettingsSection>

      {/* Section 4: App Info */}
      <SettingsSection title="앱 정보">
        <SettingsInfoRow icon={Info} label="버전" value={APP_VERSION} />
        <Separator />
        <SettingsLinkRow
          icon={FileText}
          label="이용약관"
          onClick={() => toast.info("이용약관 페이지는 준비 중입니다.")}
        />
        <Separator />
        <SettingsLinkRow
          icon={Shield}
          label="개인정보처리방침"
          onClick={() => toast.info("개인정보처리방침 페이지는 준비 중입니다.")}
        />
        <Separator />
        <SettingsLinkRow
          icon={Code2}
          label="오픈소스 라이선스"
          onClick={() => toast.info("오픈소스 라이선스 페이지는 준비 중입니다.")}
        />
      </SettingsSection>

      {/* Section 5: Customer Service */}
      <SettingsSection title="고객센터">
        <SettingsLinkRow
          icon={HelpCircle}
          label="FAQ"
          onClick={() => toast.info("FAQ 페이지는 준비 중입니다.")}
        />
        <Separator />
        <SettingsLinkRow
          icon={MessageCircle}
          label="1:1 문의"
          onClick={() => toast.info("1:1 문의 기능은 준비 중입니다.")}
        />
      </SettingsSection>

      {/* Logout & Delete */}
      <div className="mt-6 mb-12 space-y-4">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full text-center py-3 text-[#d4183d] text-sm font-medium bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="로그아웃"
        >
          <span className="flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" />
            로그아웃
          </span>
        </button>
        <button
          onClick={() => setShowDeleteStep1(true)}
          className="w-full text-center py-2 text-[#9CA3AF] text-xs bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="회원탈퇴"
        >
          <span className="flex items-center justify-center gap-1.5">
            <UserX className="w-3.5 h-3.5" />
            회원탈퇴
          </span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <AlertDialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃</AlertDialogTitle>
            <AlertDialogDescription>
              정말 로그아웃 하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutModal(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-[#d4183d] text-white hover:bg-[#d4183d]/90"
            >
              로그아웃
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Step 1 */}
      <AlertDialog open={showDeleteStep1} onOpenChange={setShowDeleteStep1}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회원 탈퇴</AlertDialogTitle>
            <AlertDialogDescription>
              정말 탈퇴하시겠습니까? 탈퇴 시 모든 데이터가 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteStep1(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStep1Confirm}
              className="bg-[#d4183d] text-white hover:bg-[#d4183d]/90"
            >
              계속하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Step 2 (Double confirmation) */}
      <AlertDialog open={showDeleteStep2} onOpenChange={setShowDeleteStep2}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>최종 확인</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 구매 내역, 루틴 기록, 커뮤니티 활동 등 모든 데이터가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowDeleteStep2(false)}
              disabled={isDeleting}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-[#d4183d] text-white hover:bg-[#d4183d]/90"
            >
              {isDeleting ? "처리 중..." : "탈퇴하기"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-default-400 uppercase tracking-wider mb-2 px-1">
        {title}
      </h2>
      <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingsToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className="w-5 h-5 text-default-500 shrink-0" />
        <div className="min-w-0">
          <span className="text-sm text-default-900 font-medium block">{label}</span>
          {description && (
            <span className="text-xs text-default-400 block mt-0.5">{description}</span>
          )}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-[#65D9AC] shrink-0"
        aria-label={label}
      />
    </div>
  );
}

function SettingsLinkRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3.5 w-full bg-transparent border-none cursor-pointer hover:bg-default-50 transition-colors text-left"
      aria-label={label}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-default-500" />
        <span className="text-sm text-default-900 font-medium">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-default-400" />
    </button>
  );
}

function SettingsInfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-default-500" />
        <span className="text-sm text-default-900 font-medium">{label}</span>
      </div>
      <span className="text-sm text-default-400 truncate max-w-[200px]">{value}</span>
    </div>
  );
}
