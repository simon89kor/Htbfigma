import { useNavigate } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "./ui/utils";
import type { Notification } from "@/lib/database.types";

// ============================================================================
// Constants
// ============================================================================

const NOTIFICATION_ICONS: Record<string, string> = {
  routine_reminder: '\u{1F4C5}',
  streak_alert: '\u{1F525}',
  routine_expiry: '\u{23F0}',
  like: '\u{2764}\u{FE0F}',
  comment: '\u{1F4AC}',
  follow: '\u{1F464}',
  purchase_complete: '\u{1F6D2}',
  refund: '\u{1F4B0}',
};

const DEFAULT_ICON = '\u{1F514}';

// ============================================================================
// Types
// ============================================================================

interface NotificationCardProps {
  notification: Notification;
  onRead: (id: string) => void;
}

// ============================================================================
// Component
// ============================================================================

const NotificationCard = ({ notification, onRead }: NotificationCardProps) => {
  const navigate = useNavigate();
  const { id, sub_type, title, message, is_read, deep_link, created_at } = notification;

  const icon = NOTIFICATION_ICONS[sub_type] || DEFAULT_ICON;

  const timeAgo = formatDistanceToNow(new Date(created_at), {
    addSuffix: true,
    locale: ko,
  });

  const handleClick = () => {
    // 미읽음이면 읽음 처리
    if (!is_read) {
      onRead(id);
    }

    // deep_link가 있으면 해당 경로로 이동
    if (deep_link) {
      navigate(deep_link);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
        "border-b border-[#E5E7EB] cursor-pointer bg-transparent",
        "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#65D9AC]/30",
        !is_read && "bg-[#65D9AC]/5"
      )}
      aria-label={`${is_read ? '읽은 알림' : '새 알림'}: ${title}`}
    >
      {/* 미읽음 점 */}
      <div className="flex-shrink-0 w-2 pt-2">
        {!is_read && (
          <div className="w-2 h-2 rounded-full bg-[#d4183d]" />
        )}
      </div>

      {/* 아이콘 */}
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-lg" aria-hidden="true">
        {icon}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm leading-snug",
          !is_read ? "font-semibold text-[#1a1a2e]" : "font-medium text-[#1a1a2e]"
        )}>
          {title}
        </p>
        {message && (
          <p className="text-sm text-[#6B7280] mt-0.5 line-clamp-2 leading-snug">
            {message}
          </p>
        )}
        <p className="text-xs text-[#9CA3AF] mt-1">
          {timeAgo}
        </p>
      </div>
    </button>
  );
};

export default NotificationCard;
