import { supabase } from '../supabase';
import type { Notification } from '../database.types';

// ============================================================================
// Types
// ============================================================================

export interface NotificationListOptions {
  type?: Notification['type'];
  isRead?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// Queries
// ============================================================================

/** 알림 목록 조회 */
export async function getNotifications(
  userId: string,
  options?: NotificationListOptions
): Promise<{ data: Notification[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 30;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('notifications')
    .select(
      'id, user_id, type, sub_type, title, message, icon, is_read, deep_link, metadata, created_at',
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.type) {
    query = query.eq('type', options.type);
  }
  if (options?.isRead !== undefined) {
    query = query.eq('is_read', options.isRead);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data ?? [], count: count ?? 0 };
}

/** 읽지 않은 알림 수 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}

/** 알림 읽음 처리 */
export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

/** 모든 알림 읽음 처리 */
export async function markAllNotificationsAsRead(
  userId: string,
  type?: Notification['type']
): Promise<void> {
  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (type) {
    query = query.eq('type', type);
  }

  const { error } = await query;
  if (error) throw error;
}

/** 알림 삭제 */
export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/** 오래된 알림 일괄 삭제 (30일 이전) */
export async function deleteOldNotifications(userId: string): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .lt('created_at', thirtyDaysAgo.toISOString());

  if (error) throw error;
}
