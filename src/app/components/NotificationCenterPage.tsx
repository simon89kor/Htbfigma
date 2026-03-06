import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { Bell, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "./ui/utils";
import { useNotifications } from "../notification-context";
import NotificationCard from "./NotificationCard";

// ============================================================================
// Types
// ============================================================================

type NotificationTab = 'all' | 'schedule' | 'community' | 'purchase';

// ============================================================================
// Constants
// ============================================================================

const TABS: { key: NotificationTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'schedule', label: '일정' },
  { key: 'community', label: '커뮤니티' },
  { key: 'purchase', label: '구매' },
];

// ============================================================================
// Component
// ============================================================================

export function NotificationCenterPage() {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    loadingMore,
    hasMore,
    loadNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 초기 로드 + 탭 전환 시 로드
  useEffect(() => {
    loadNotifications(activeTab, 1);
  }, [activeTab, loadNotifications]);

  // 무한 스크롤 (IntersectionObserver)
  const handleSentinel = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;
      sentinelRef.current = node;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
            loadMoreNotifications(activeTab);
          }
        },
        { threshold: 0.1 }
      );

      observerRef.current.observe(node);
    },
    [hasMore, loadingMore, loading, activeTab, loadMoreNotifications]
  );

  // cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleTabChange = (tab: NotificationTab) => {
    setActiveTab(tab);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead(activeTab);
  };

  const handleRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* Full-bleed: negate Layout <main> padding (px-4 sm:px-6 lg:px-8 py-8) */}
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 rounded-lg hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer text-foreground"
              aria-label="뒤로 가기"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-semibold text-foreground">알림</h1>
          </div>

          {hasUnread && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-sm text-[#65D9AC] font-medium bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
            >
              일괄 읽음
            </button>
          )}
        </div>

        {/* 탭 바 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={cn(
                "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors",
                "border-none cursor-pointer",
                activeTab === tab.key
                  ? "bg-[#65D9AC] text-white"
                  : "bg-white/5 text-foreground/60 hover:bg-white/10"
              )}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="pb-8">
        {loading ? (
          /* 로딩 스켈레톤 */
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-white/10 animate-pulse">
                <div className="w-2 h-2 mt-2 rounded-full bg-white/10" />
                <div className="w-6 h-6 rounded bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-foreground/50">
            <Bell size={48} className="mb-4" strokeWidth={1.5} />
            <p className="text-lg font-medium">알림이 없습니다</p>
            <p className="text-sm mt-1">새로운 알림이 오면 여기에 표시됩니다</p>
          </div>
        ) : (
          /* 알림 리스트 */
          <>
            <div className="flex flex-col">
              {notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onRead={handleRead}
                />
              ))}
            </div>

            {/* 무한 스크롤 센티널 */}
            {hasMore && (
              <div ref={handleSentinel} className="py-4 flex justify-center">
                {loadingMore && (
                  <Loader2 size={24} className="animate-spin text-foreground/50" />
                )}
              </div>
            )}

            {/* 더 이상 알림 없음 */}
            {!hasMore && notifications.length > 0 && (
              <p className="text-center text-sm text-foreground/50 py-6">
                모든 알림을 확인했습니다
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NotificationCenterPage;
