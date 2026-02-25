import { supabase } from '../supabase';
import type {
  Badge,
  UserBadge,
  Challenge,
  ChallengeParticipant,
  ChallengeReward,
  Database,
} from '../database.types';

// ============================================================================
// Types
// ============================================================================

export interface UserBadgeWithDetails extends UserBadge {
  badges: Badge;
}

export interface ChallengeWithDetails extends Challenge {
  challenge_rewards?: ChallengeReward[];
  is_participating?: boolean;
  user_progress?: number;
}

export interface RankingEntry {
  rank: number;
  user_id: string;
  nickname: string;
  avatar_url: string;
  completion_rate: number;
}

// ============================================================================
// Badges
// ============================================================================

/** 전체 뱃지 목록 */
export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('id, name, description, icon, category, condition_type, condition_value, sort_order, is_active, created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** 유저의 뱃지 목록 */
export async function getUserBadges(
  userId: string
): Promise<UserBadgeWithDetails[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(
      'id, user_id, badge_id, unlocked_at, badges(id, name, description, icon, category, condition_type, condition_value, sort_order, is_active, created_at)'
    )
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as UserBadgeWithDetails[]) ?? [];
}

/** 뱃지 부여 */
export async function awardBadge(
  userId: string,
  badgeId: string
): Promise<UserBadge> {
  // 중복 확인
  const { data: existing } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .maybeSingle();

  if (existing) {
    throw new Error('이미 보유한 뱃지입니다.');
  }

  const { data, error } = await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_id: badgeId,
    })
    .select('id, user_id, badge_id, unlocked_at')
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// Ranking
// ============================================================================

/** 랭킹 조회 (RPC 함수 활용) */
export async function getRanking(options?: {
  period?: string;
  category?: string;
  limit?: number;
}): Promise<RankingEntry[]> {
  const { data, error } = await supabase.rpc('get_ranking', {
    ranking_period: options?.period ?? 'weekly',
    ranking_category: options?.category ?? 'all',
    result_limit: options?.limit ?? 20,
  });

  if (error) throw error;
  return (data as RankingEntry[]) ?? [];
}

/** 유저 통계 조회 (RPC 함수 활용) */
export async function getUserStats(
  userId: string,
  period?: string
): Promise<Database['public']['Functions']['get_user_stats']['Returns']> {
  const { data, error } = await supabase.rpc('get_user_stats', {
    target_user_id: userId,
    period: period ?? 'weekly',
  });

  if (error) throw error;
  return data;
}

// ============================================================================
// Challenges
// ============================================================================

/** 챌린지 목록 조회 */
export async function getChallenges(options?: {
  status?: Challenge['status'];
  category?: string;
  page?: number;
  limit?: number;
  currentUserId?: string;
}): Promise<{ data: ChallengeWithDetails[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('challenges')
    .select(
      'id, title, description, image_url, category, start_date, end_date, rules, participant_count, max_participants, status, created_by, created_at, updated_at, challenge_rewards(id, type, name, icon, description, badge_id, sort_order)',
      { count: 'exact' }
    )
    .order('start_date', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.category) {
    query = query.eq('category', options.category);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  let challenges = (data as unknown as ChallengeWithDetails[]) ?? [];

  // 참여 상태 확인
  if (options?.currentUserId && challenges.length > 0) {
    const challengeIds = challenges.map((c) => c.id);

    const { data: participations } = await supabase
      .from('challenge_participants')
      .select('challenge_id, progress, status')
      .eq('user_id', options.currentUserId)
      .in('challenge_id', challengeIds);

    const participationMap = new Map(
      participations?.map((p) => [p.challenge_id, p]) ?? []
    );

    challenges = challenges.map((ch) => {
      const participation = participationMap.get(ch.id);
      return {
        ...ch,
        is_participating: !!participation,
        user_progress: participation?.progress ?? 0,
      };
    });
  }

  return { data: challenges, count: count ?? 0 };
}

/** 챌린지 단일 조회 */
export async function getChallenge(
  id: string,
  currentUserId?: string
): Promise<ChallengeWithDetails> {
  const { data, error } = await supabase
    .from('challenges')
    .select(
      'id, title, description, image_url, category, start_date, end_date, rules, participant_count, max_participants, status, created_by, created_at, updated_at, challenge_rewards(id, type, name, icon, description, badge_id, sort_order)'
    )
    .eq('id', id)
    .single();

  if (error) throw error;

  let challenge = data as unknown as ChallengeWithDetails;

  if (currentUserId) {
    const { data: participation } = await supabase
      .from('challenge_participants')
      .select('progress, status')
      .eq('challenge_id', id)
      .eq('user_id', currentUserId)
      .maybeSingle();

    challenge = {
      ...challenge,
      is_participating: !!participation,
      user_progress: participation?.progress ?? 0,
    };
  }

  return challenge;
}

/** 챌린지 참여 */
export async function joinChallenge(
  challengeId: string,
  userId: string
): Promise<ChallengeParticipant & { participant_count: number }> {
  // 참여 INSERT (트리거가 participant_count를 자동 증가)
  const { data, error } = await supabase
    .from('challenge_participants')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
    })
    .select('id, challenge_id, user_id, progress, status, joined_at')
    .single();

  if (error) throw error;

  // 트리거 반영 후 최신 카운트 조회
  const { data: challenge } = await supabase
    .from('challenges')
    .select('participant_count')
    .eq('id', challengeId)
    .single();

  return { ...data, participant_count: challenge?.participant_count ?? 0 };
}

/** 챌린지 탈퇴 */
export async function leaveChallenge(
  challengeId: string,
  userId: string
): Promise<{ participant_count: number }> {
  // 탈퇴 처리 (트리거가 participant_count를 자동 감소)
  const { error } = await supabase
    .from('challenge_participants')
    .update({ status: 'withdrawn' })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);

  if (error) throw error;

  // 트리거 반영 후 최신 카운트 조회
  const { data: challenge } = await supabase
    .from('challenges')
    .select('participant_count')
    .eq('id', challengeId)
    .single();

  return { participant_count: challenge?.participant_count ?? 0 };
}
