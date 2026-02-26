import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./auth-context";
import { supabase } from "@/lib/supabase";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api/notifications";
import type { Notification } from "@/lib/database.types";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

type NotificationTab = 'all' | 'schedule' | 'community' | 'purchase';

interface NotificationContextType {
  /** 현재 탭의 알림 목록 */
  notifications: Notification[];
  /** 미읽음 카운트 (전역) */
  unreadCount: number;
  /** 로딩 상태 */
  loading: boolean;
  /** 추가 페이지 로딩 상태 */
  loadingMore: boolean;
  /** 더 불러올 알림이 있는지 */
  hasMore: boolean;
  /** 알림 목록 로드 (탭별 필터링) */
  loadNotifications: (tab: NotificationTab, page?: number) => Promise<void>;
  /** 추가 알림 로드 (무한 스크롤) */
  loadMoreNotifications: (tab: NotificationTab) => Promise<void>;
  /** 개별 알림 읽음 처리 */
  markAsRead: (notificationId: string) => Promise<void>;
  /** 일괄 읽음 처리 */
  markAllAsRead: (tab?: NotificationTab) => Promise<void>;
  /** 알림 목록 새로고침 */
  refreshNotifications: (tab: NotificationTab) => Promise<void>;
}

// ============================================================================
// Context (HMR-safe Symbol 패턴)
// ============================================================================

const NOTIFICATION_CTX_KEY = Symbol.for('htb-notification-context');
const globalObj = globalThis as Record<symbol, unknown>;
if (!globalObj[NOTIFICATION_CTX_KEY]) {
  globalObj[NOTIFICATION_CTX_KEY] = createContext<NotificationContextType | undefined>(undefined);
}
const NotificationContext = globalObj[NOTIFICATION_CTX_KEY] as React.Context<NotificationContextType | undefined>;

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 20;

const TAB_TO_TYPE: Record<NotificationTab, Notification['type'] | undefined> = {
  all: undefined,
  schedule: 'schedule',
  community: 'community',
  purchase: 'purchase',
};

// ============================================================================
// Provider
// ============================================================================

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const currentPageRef = useRef(1);
  const currentTabRef = useRef<NotificationTab>('all');
  const mountedRef = useRef(true);

  // 미읽음 카운트 조회
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getUnreadNotificationCount(user.id);
      if (mountedRef.current) {
        setUnreadCount(count);
      }
    } catch {
      // 에러 무시 (네트워크 문제 등)
    }
  }, [user]);

  // 알림 목록 로드
  const loadNotifications = useCallback(async (tab: NotificationTab, page = 1) => {
    if (!user) return;
    setLoading(true);
    currentTabRef.current = tab;
    currentPageRef.current = page;

    try {
      const type = TAB_TO_TYPE[tab];
      const { data, count } = await getNotifications(user.id, {
        type,
        page,
        limit: PAGE_SIZE,
      });
      if (mountedRef.current) {
        setNotifications(data);
        setHasMore(data.length < count);
      }
    } catch {
      if (mountedRef.current) {
        toast.error('알림을 불러오지 못했습니다');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  // 추가 알림 로드 (무한 스크롤)
  const loadMoreNotifications = useCallback(async (tab: NotificationTab) => {
    if (!user || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = currentPageRef.current + 1;

    try {
      const type = TAB_TO_TYPE[tab];
      const { data, count } = await getNotifications(user.id, {
        type,
        page: nextPage,
        limit: PAGE_SIZE,
      });
      if (mountedRef.current) {
        currentPageRef.current = nextPage;
        setNotifications(prev => [...prev, ...data]);
        const totalLoaded = nextPage * PAGE_SIZE;
        setHasMore(totalLoaded < count);
      }
    } catch {
      if (mountedRef.current) {
        toast.error('알림을 더 불러오지 못했습니다');
      }
    } finally {
      if (mountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [user, loadingMore, hasMore]);

  // 개별 알림 읽음 처리
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      if (mountedRef.current) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {
      // 에러 무시
    }
  }, []);

  // 일괄 읽음 처리
  const markAllAsRead = useCallback(async (tab?: NotificationTab) => {
    if (!user) return;
    try {
      const type = tab ? TAB_TO_TYPE[tab] : undefined;
      await markAllNotificationsAsRead(user.id, type);
      if (mountedRef.current) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        );
        // 탭 필터가 없으면 전체 초기화, 있으면 카운트 재조회
        if (!tab || tab === 'all') {
          setUnreadCount(0);
        } else {
          await fetchUnreadCount();
        }
      }
    } catch {
      if (mountedRef.current) {
        toast.error('일괄 읽음 처리에 실패했습니다');
      }
    }
  }, [user, fetchUnreadCount]);

  // 새로고침
  const refreshNotifications = useCallback(async (tab: NotificationTab) => {
    await loadNotifications(tab, 1);
    await fetchUnreadCount();
  }, [loadNotifications, fetchUnreadCount]);

  // 로그인 시 미읽음 카운트 조회
  useEffect(() => {
    mountedRef.current = true;

    if (isLoggedIn && user) {
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [isLoggedIn, user, fetchUnreadCount]);

  // Supabase Realtime 구독 — notifications 테이블 INSERT 감지
  useEffect(() => {
    if (!isLoggedIn || !user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          if (mountedRef.current) {
            setUnreadCount(prev => prev + 1);
            // 현재 알림 목록이 로드된 상태라면 최상단에 추가
            setNotifications(prev => {
              // 현재 탭에 맞는 알림만 추가
              const currentType = TAB_TO_TYPE[currentTabRef.current];
              if (!currentType || newNotification.type === currentType) {
                return [newNotification, ...prev];
              }
              return prev;
            });
            toast(newNotification.title, {
              description: newNotification.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasMore,
        loadNotifications,
        loadMoreNotifications,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
}
