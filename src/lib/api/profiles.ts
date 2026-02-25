import { supabase } from '../supabase';
import type { Profile, ProfileUpdate } from '../database.types';

// ============================================================================
// Types
// ============================================================================

export interface ProfileWithFollowStatus extends Profile {
  is_following?: boolean;
}

// ============================================================================
// Queries
// ============================================================================

/** 프로필 조회 */
export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, nickname, bio, avatar_url, cover_image_url, email, role, preferences, terms_agreed_at, privacy_agreed_at, marketing_agreed, notification_schedule, notification_community, notification_marketing, current_streak, longest_streak, last_active_date, post_count, follower_count, following_count, total_completed_routines, status, created_at, updated_at'
    )
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/** 프로필 수정 */
export async function updateProfile(
  userId: string,
  updates: Omit<ProfileUpdate, 'id'>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select(
      'id, nickname, bio, avatar_url, cover_image_url, email, role, preferences, terms_agreed_at, privacy_agreed_at, marketing_agreed, notification_schedule, notification_community, notification_marketing, current_streak, longest_streak, last_active_date, post_count, follower_count, following_count, total_completed_routines, status, created_at, updated_at'
    )
    .single();

  if (error) throw error;
  return data;
}

/** 프로필 온보딩 완료 (약관 동의 등) */
export async function completeOnboarding(
  userId: string,
  input: {
    nickname: string;
    preferences?: unknown;
    termsAgreedAt: string;
    privacyAgreedAt: string;
    marketingAgreed?: boolean;
  }
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      nickname: input.nickname,
      preferences: input.preferences as ProfileUpdate['preferences'],
      terms_agreed_at: input.termsAgreedAt,
      privacy_agreed_at: input.privacyAgreedAt,
      marketing_agreed: input.marketingAgreed ?? false,
    })
    .eq('id', userId)
    .select(
      'id, nickname, bio, avatar_url, cover_image_url, email, role, preferences, terms_agreed_at, privacy_agreed_at, marketing_agreed, notification_schedule, notification_community, notification_marketing, current_streak, longest_streak, last_active_date, post_count, follower_count, following_count, total_completed_routines, status, created_at, updated_at'
    )
    .single();

  if (error) throw error;
  return data;
}

/** 알림 설정 업데이트 */
export async function updateNotificationSettings(
  userId: string,
  settings: {
    notificationSchedule?: boolean;
    notificationCommunity?: boolean;
    notificationMarketing?: boolean;
  }
): Promise<Profile> {
  const updateData: ProfileUpdate = {};
  if (settings.notificationSchedule !== undefined) {
    updateData.notification_schedule = settings.notificationSchedule;
  }
  if (settings.notificationCommunity !== undefined) {
    updateData.notification_community = settings.notificationCommunity;
  }
  if (settings.notificationMarketing !== undefined) {
    updateData.notification_marketing = settings.notificationMarketing;
  }

  return updateProfile(userId, updateData);
}

/** 팔로우 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<{ followerCount: number; followingCount: number }> {
  // 팔로우 INSERT (트리거가 follower_count/following_count를 자동 업데이트)
  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: followingId,
    });

  if (error) throw error;

  // 트리거 반영 후 최신 카운트 조회
  const [followerProfile, followingProfile] = await Promise.all([
    supabase
      .from('profiles')
      .select('following_count')
      .eq('id', followerId)
      .single(),
    supabase
      .from('profiles')
      .select('follower_count')
      .eq('id', followingId)
      .single(),
  ]);

  return {
    followerCount: followingProfile.data?.follower_count ?? 0,
    followingCount: followerProfile.data?.following_count ?? 0,
  };
}

/** 언팔로우 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<{ followerCount: number; followingCount: number }> {
  // 언팔로우 DELETE (트리거가 follower_count/following_count를 자동 업데이트)
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;

  // 트리거 반영 후 최신 카운트 조회
  const [followerProfile, followingProfile] = await Promise.all([
    supabase
      .from('profiles')
      .select('following_count')
      .eq('id', followerId)
      .single(),
    supabase
      .from('profiles')
      .select('follower_count')
      .eq('id', followingId)
      .single(),
  ]);

  return {
    followerCount: followingProfile.data?.follower_count ?? 0,
    followingCount: followerProfile.data?.following_count ?? 0,
  };
}

/** 팔로우 여부 확인 */
export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('follows')
    .select('id', { count: 'exact', head: true })
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
  return (count ?? 0) > 0;
}

/** 팔로워 목록 */
export async function getFollowers(
  userId: string,
  options?: { page?: number; limit?: number }
): Promise<{ data: Profile[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('follows')
    .select(
      'follower_id, profiles!follower_id(id, nickname, avatar_url, bio, follower_count, following_count)',
      { count: 'exact' }
    )
    .eq('following_id', userId)
    .range(from, to);

  if (error) throw error;

  const profiles =
    data?.map(
      (row) => (row as unknown as { profiles: Profile }).profiles
    ) ?? [];

  return { data: profiles, count: count ?? 0 };
}

/** 팔로잉 목록 */
export async function getFollowing(
  userId: string,
  options?: { page?: number; limit?: number }
): Promise<{ data: Profile[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('follows')
    .select(
      'following_id, profiles!following_id(id, nickname, avatar_url, bio, follower_count, following_count)',
      { count: 'exact' }
    )
    .eq('follower_id', userId)
    .range(from, to);

  if (error) throw error;

  const profiles =
    data?.map(
      (row) => (row as unknown as { profiles: Profile }).profiles
    ) ?? [];

  return { data: profiles, count: count ?? 0 };
}
