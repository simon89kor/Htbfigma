import { supabase } from '../supabase';
import type {
  Json,
  Profile,
  Routine,
  Purchase,
  Post,
  Report,
  Challenge,
  ChallengeParticipant,
  ChallengeReward,
  ChallengeInsert,
  ChallengeUpdate,
  ChallengeRewardInsert,
} from '../database.types';

// ============================================================================
// Types
// ============================================================================

export interface DashboardStats {
  totalUsers: number;
  newUsersThisWeek: number;
  totalRevenue: number;
  revenueThisMonth: number;
  activeRoutines: number;
  totalPosts: number;
  pendingReports: number;
  activeChallenges: number;
}

export interface WeeklySignup {
  week: string;
  count: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
}

export interface DailyActiveUser {
  date: string;
  count: number;
}

export interface AdminProfileRow extends Profile {
  _purchaseCount?: number;
}

export interface AdminRoutineRow extends Routine {
  profiles: {
    nickname: string;
    avatar_url: string;
  } | null;
}

export interface AdminPurchaseRow extends Purchase {
  profiles: {
    nickname: string;
  } | null;
  routines: {
    title: string;
    category: string;
  } | null;
}

export interface AdminPostRow extends Post {
  profiles: {
    nickname: string;
    avatar_url: string;
  } | null;
  report_count?: number;
}

export interface AdminReportRow extends Report {
  profiles: {
    nickname: string;
  } | null;
}

// ============================================================================
// Dashboard
// ============================================================================

/** 대시보드 KPI 통계 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsersRes,
    newUsersRes,
    totalRevenueRes,
    monthRevenueRes,
    activeRoutinesRes,
    totalPostsRes,
    pendingReportsRes,
    activeChallengesRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'deleted'),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())
      .neq('status', 'deleted'),
    supabase
      .from('purchases')
      .select('final_amount')
      .eq('status', 'completed'),
    supabase
      .from('purchases')
      .select('final_amount')
      .eq('status', 'completed')
      .gte('purchased_at', monthStart.toISOString()),
    supabase
      .from('routines')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('challenges')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ]);

  const totalRevenue = totalRevenueRes.data?.reduce(
    (sum, p) => sum + (p.final_amount ?? 0),
    0
  ) ?? 0;
  const revenueThisMonth = monthRevenueRes.data?.reduce(
    (sum, p) => sum + (p.final_amount ?? 0),
    0
  ) ?? 0;

  return {
    totalUsers: totalUsersRes.count ?? 0,
    newUsersThisWeek: newUsersRes.count ?? 0,
    totalRevenue,
    revenueThisMonth,
    activeRoutines: activeRoutinesRes.count ?? 0,
    totalPosts: totalPostsRes.count ?? 0,
    pendingReports: pendingReportsRes.count ?? 0,
    activeChallenges: activeChallengesRes.count ?? 0,
  };
}

/** 주간 가입자 추이 (최근 4주) */
export async function getWeeklySignups(): Promise<WeeklySignup[]> {
  const weeks: WeeklySignup[] = [];
  const now = new Date();

  for (let i = 3; i >= 0; i--) {
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString());

    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    weeks.push({ week: label, count: count ?? 0 });
  }

  return weeks;
}

/** 카테고리별 매출 */
export async function getCategoryRevenue(): Promise<CategoryRevenue[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('final_amount, routines!routine_id(category)')
    .eq('status', 'completed');

  if (error) throw error;

  const revenueMap = new Map<string, number>();
  data?.forEach((row) => {
    const category = (row.routines as unknown as { category: string })?.category ?? '기타';
    revenueMap.set(category, (revenueMap.get(category) ?? 0) + (row.final_amount ?? 0));
  });

  return Array.from(revenueMap.entries()).map(([category, revenue]) => ({
    category,
    revenue,
  }));
}

/** 최근 미처리 신고 목록 */
export async function getRecentReports(
  limit = 5
): Promise<AdminReportRow[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, profiles!reporter_id(nickname)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as unknown as AdminReportRow[]) ?? [];
}

// ============================================================================
// User Management
// ============================================================================

export interface AdminUserListOptions {
  search?: string;
  status?: Profile['status'] | 'all';
  role?: Profile['role'] | 'all';
  page?: number;
  limit?: number;
}

/** 유저 목록 (검색, 필터, 페이지네이션) */
export async function getAdminUsers(
  options?: AdminUserListOptions
): Promise<{ data: Profile[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (options?.search) {
    query = query.or(
      `nickname.ilike.%${options.search}%,email.ilike.%${options.search}%`
    );
  }

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options?.role && options.role !== 'all') {
    query = query.eq('role', options.role);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: (data as Profile[]) ?? [], count: count ?? 0 };
}

/** 유저 상세 */
export async function getAdminUser(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

/** 유저의 활동 통계 */
export async function getAdminUserStats(userId: string): Promise<{
  purchaseCount: number;
  customRoutineCount: number;
  postCount: number;
  totalSpent: number;
}> {
  const [purchasesRes, routinesRes, postsRes] = await Promise.all([
    supabase
      .from('purchases')
      .select('final_amount', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed'),
    supabase
      .from('user_routines')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_custom', true),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId)
      .neq('status', 'deleted'),
  ]);

  const totalSpent = purchasesRes.data?.reduce(
    (sum, p) => sum + (p.final_amount ?? 0),
    0
  ) ?? 0;

  return {
    purchaseCount: purchasesRes.count ?? 0,
    customRoutineCount: routinesRes.count ?? 0,
    postCount: postsRes.count ?? 0,
    totalSpent,
  };
}

/** 유저 역할 변경 */
export async function updateUserRole(
  userId: string,
  role: Profile['role']
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Profile;
}

/** 유저 상태 변경 */
export async function updateUserStatus(
  userId: string,
  status: Profile['status']
): Promise<Profile> {
  const updates: Record<string, unknown> = { status };
  if (status === 'deleted') {
    updates.deleted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Profile;
}

/** 유저의 구매 내역 */
export async function getAdminUserPurchases(
  userId: string,
  options?: { page?: number; limit?: number }
): Promise<{ data: AdminPurchaseRow[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('purchases')
    .select(
      '*, profiles!user_id(nickname), routines!routine_id(title, category)',
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .order('purchased_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: (data as unknown as AdminPurchaseRow[]) ?? [], count: count ?? 0 };
}

// ============================================================================
// Routine Management
// ============================================================================

export interface AdminRoutineListOptions {
  category?: string;
  status?: Routine['status'] | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

/** 루틴 목록 (관리자용) */
export async function getAdminRoutines(
  options?: AdminRoutineListOptions
): Promise<{ data: AdminRoutineRow[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('routines')
    .select(
      '*, profiles!author_id(nickname, avatar_url)',
      { count: 'exact' }
    );

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options?.category && options.category !== '전체') {
    query = query.eq('category', options.category);
  }

  if (options?.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: (data as unknown as AdminRoutineRow[]) ?? [], count: count ?? 0 };
}

/** 루틴 상태 변경 (발행/비발행) */
export async function updateRoutineStatus(
  routineId: string,
  status: Routine['status']
): Promise<Routine> {
  const { data, error } = await supabase
    .from('routines')
    .update({ status })
    .eq('id', routineId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Routine;
}

/** 루틴 삭제 (archived) */
export async function archiveRoutine(routineId: string): Promise<void> {
  const { error } = await supabase
    .from('routines')
    .update({ status: 'archived' })
    .eq('id', routineId);

  if (error) throw error;
}

// ============================================================================
// Purchase Management
// ============================================================================

export interface AdminPurchaseListOptions {
  status?: Purchase['status'] | 'all';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** 구매 목록 (관리자용) */
export async function getAdminPurchases(
  options?: AdminPurchaseListOptions
): Promise<{ data: AdminPurchaseRow[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('purchases')
    .select(
      '*, profiles!user_id(nickname), routines!routine_id(title, category)',
      { count: 'exact' }
    );

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options?.dateFrom) {
    query = query.gte('purchased_at', options.dateFrom);
  }

  if (options?.dateTo) {
    query = query.lte('purchased_at', options.dateTo);
  }

  if (options?.search) {
    // Search by user nickname or routine title via sub-query is not straightforward,
    // so we just filter by ID-like patterns
    query = query.or(`id.ilike.%${options.search}%`);
  }

  query = query.order('purchased_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: (data as unknown as AdminPurchaseRow[]) ?? [], count: count ?? 0 };
}

/** 구매 환불 처리 */
export async function adminRefundPurchase(purchaseId: string): Promise<Purchase> {
  const { data, error } = await supabase
    .from('purchases')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('id', purchaseId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Purchase;
}

// ============================================================================
// Post Moderation
// ============================================================================

export interface AdminPostListOptions {
  status?: Post['status'] | 'all';
  hasReport?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/** 게시물 목록 (관리자용) */
export async function getAdminPosts(
  options?: AdminPostListOptions
): Promise<{ data: AdminPostRow[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('posts')
    .select(
      '*, profiles!author_id(nickname, avatar_url)',
      { count: 'exact' }
    );

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,content.ilike.%${options.search}%`
    );
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  // Fetch report counts for each post
  let posts = (data as unknown as AdminPostRow[]) ?? [];

  if (posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const { data: reportCounts } = await supabase
      .from('reports')
      .select('target_id')
      .eq('target_type', 'post')
      .in('target_id', postIds);

    const countMap = new Map<string, number>();
    reportCounts?.forEach((r) => {
      countMap.set(r.target_id, (countMap.get(r.target_id) ?? 0) + 1);
    });

    posts = posts.map((post) => ({
      ...post,
      report_count: countMap.get(post.id) ?? 0,
    }));

    // If filtering by has report, filter client-side
    if (options?.hasReport) {
      posts = posts.filter((p) => (p.report_count ?? 0) > 0);
    }
  }

  return { data: posts, count: count ?? 0 };
}

/** 게시물 상태 변경 (숨김/삭제/복원) */
export async function updatePostStatus(
  postId: string,
  status: Post['status']
): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .update({ status })
    .eq('id', postId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Post;
}

/** 게시물의 신고 목록 */
export async function getPostReports(
  postId: string
): Promise<AdminReportRow[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, profiles!reporter_id(nickname)')
    .eq('target_type', 'post')
    .eq('target_id', postId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as AdminReportRow[]) ?? [];
}

/** 신고 상태 변경 */
export async function updateReportStatus(
  reportId: string,
  status: Report['status'],
  adminNote?: string
): Promise<Report> {
  const updates: Record<string, unknown> = { status };
  if (adminNote) {
    updates.admin_note = adminNote;
  }
  if (status === 'resolved' || status === 'dismissed') {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Report;
}

// ============================================================================
// Challenge Management
// ============================================================================

export interface AdminChallengeRow extends Challenge {
  profiles: { nickname: string } | null;
  challenge_rewards: ChallengeReward[];
}

export interface AdminChallengeListOptions {
  search?: string;
  status?: Challenge['status'] | 'all';
  category?: string;
  page?: number;
  limit?: number;
}

export interface AdminChallengeParticipantRow extends ChallengeParticipant {
  profiles: { nickname: string; avatar_url: string } | null;
}

export interface AdminParticipantListOptions {
  challengeId: string;
  search?: string;
  status?: ChallengeParticipant['status'] | 'all';
  page?: number;
  limit?: number;
}

/** 챌린지 목록 (관리자용) */
export async function getAdminChallenges(
  options?: AdminChallengeListOptions
): Promise<{ data: AdminChallengeRow[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('challenges')
    .select(
      '*, profiles!created_by(nickname), challenge_rewards(*)',
      { count: 'exact' }
    );

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options?.category && options.category !== '전체') {
    query = query.eq('category', options.category);
  }

  if (options?.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: (data as unknown as AdminChallengeRow[]) ?? [], count: count ?? 0 };
}

/** 챌린지 상세 */
export async function getAdminChallenge(
  challengeId: string
): Promise<AdminChallengeRow> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*, profiles!created_by(nickname), challenge_rewards(*)')
    .eq('id', challengeId)
    .single();

  if (error) throw error;
  return data as unknown as AdminChallengeRow;
}

/** 챌린지 생성 */
export async function createAdminChallenge(
  challengeData: Omit<ChallengeInsert, 'created_by'>,
  rewards: Omit<ChallengeRewardInsert, 'challenge_id'>[]
): Promise<Challenge> {
  // Get current admin user id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증되지 않은 사용자입니다.');

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .insert({ ...challengeData, created_by: user.id })
    .select('*')
    .single();

  if (challengeError) throw challengeError;

  // Insert rewards if any
  if (rewards.length > 0) {
    const rewardInserts: ChallengeRewardInsert[] = rewards.map((r, i) => ({
      ...r,
      challenge_id: challenge.id,
      sort_order: r.sort_order ?? i,
    }));

    const { error: rewardsError } = await supabase
      .from('challenge_rewards')
      .insert(rewardInserts);

    if (rewardsError) throw rewardsError;
  }

  return challenge as Challenge;
}

/** 챌린지 수정 */
export async function updateAdminChallenge(
  challengeId: string,
  challengeData: ChallengeUpdate,
  rewards?: Omit<ChallengeRewardInsert, 'challenge_id'>[]
): Promise<Challenge> {
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .update(challengeData)
    .eq('id', challengeId)
    .select('*')
    .single();

  if (challengeError) throw challengeError;

  // If rewards are provided, replace them (delete + insert)
  if (rewards !== undefined) {
    const { error: deleteError } = await supabase
      .from('challenge_rewards')
      .delete()
      .eq('challenge_id', challengeId);

    if (deleteError) throw deleteError;

    if (rewards.length > 0) {
      const rewardInserts: ChallengeRewardInsert[] = rewards.map((r, i) => ({
        ...r,
        challenge_id: challengeId,
        sort_order: r.sort_order ?? i,
      }));

      const { error: rewardsError } = await supabase
        .from('challenge_rewards')
        .insert(rewardInserts);

      if (rewardsError) throw rewardsError;
    }
  }

  return challenge as Challenge;
}

/** 챌린지 취소 (soft delete) */
export async function cancelAdminChallenge(
  challengeId: string
): Promise<Challenge> {
  const { data, error } = await supabase
    .from('challenges')
    .update({ status: 'cancelled' })
    .eq('id', challengeId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Challenge;
}

/** 챌린지 참가자 목록 */
export async function getAdminChallengeParticipants(
  options: AdminParticipantListOptions
): Promise<{ data: AdminChallengeParticipantRow[]; count: number }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('challenge_participants')
    .select(
      '*, profiles!user_id(nickname, avatar_url)',
      { count: 'exact' }
    )
    .eq('challenge_id', options.challengeId);

  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  // Search by nickname is done client-side since it's a joined field
  query = query.order('joined_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  let participants = (data as unknown as AdminChallengeParticipantRow[]) ?? [];

  // Client-side nickname search
  if (options.search) {
    const search = options.search.toLowerCase();
    participants = participants.filter(
      (p) => p.profiles?.nickname?.toLowerCase().includes(search)
    );
  }

  return { data: participants, count: count ?? 0 };
}

// ============================================================================
// Admin Settings
// ============================================================================

export interface AppSetting {
  key: string;
  value: Json;
  description: string;
  updated_at: string;
}

export interface SystemInfo {
  dbStatus: 'healthy' | 'degraded' | 'down';
  totalUsers: number;
  totalRoutines: number;
  totalPosts: number;
  totalChallenges: number;
  storageUsed: string;
  storageLimit: string;
  supabaseProjectId: string;
  lastRefreshed: string;
}

/** 전체 설정 조회 (app_settings 테이블) */
export async function getAdminSettings(): Promise<AppSetting[]> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value, description, updated_at')
    .order('key', { ascending: true });

  if (error) throw error;
  return (data as AppSetting[]) ?? [];
}

/** 설정 일괄 업데이트 (app_settings 테이블) */
export async function updateAdminSettingsBatch(
  updates: { key: string; value: Json }[]
): Promise<AppSetting[]> {
  for (const { key, value } of updates) {
    const { error } = await supabase
      .from('app_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) throw error;
  }

  return getAdminSettings();
}

/** 시스템 정보 조회 */
export async function getSystemInfo(): Promise<SystemInfo> {
  const [usersRes, routinesRes, postsRes, challengesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'deleted'),
    supabase
      .from('routines')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'deleted'),
    supabase
      .from('challenges')
      .select('id', { count: 'exact', head: true }),
  ]);

  // Check DB health based on whether queries succeeded
  const hasError = [usersRes, routinesRes, postsRes, challengesRes].some(
    (r) => r.error
  );

  // Extract project ID from Supabase URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const projectIdMatch = supabaseUrl.match(
    /https:\/\/([^.]+)\.supabase\./
  );
  const projectId = projectIdMatch?.[1] ?? 'unknown';

  return {
    dbStatus: hasError ? 'degraded' : 'healthy',
    totalUsers: usersRes.count ?? 0,
    totalRoutines: routinesRes.count ?? 0,
    totalPosts: postsRes.count ?? 0,
    totalChallenges: challengesRes.count ?? 0,
    storageUsed: '-',
    storageLimit: '1 GB',
    supabaseProjectId: projectId,
    lastRefreshed: new Date().toISOString(),
  };
}
