import { supabase } from '../supabase';
import type { Database, Routine, RoutinePeriod } from '../database.types';

// ============================================================================
// Types
// ============================================================================

type RoutineRow = Database['public']['Tables']['routines']['Row'];

export interface RoutineWithAuthor extends RoutineRow {
  profiles: {
    nickname: string;
    avatar_url: string;
    bio: string;
  } | null;
  routine_periods?: RoutinePeriod[];
}

export interface RoutineListOptions {
  category?: string;
  search?: string;
  sort?: 'popular' | 'latest' | 'price_asc' | 'price_desc' | 'rating';
  page?: number;
  limit?: number;
  status?: Routine['status'];
}

// ============================================================================
// Queries
// ============================================================================

/** 루틴 목록 조회 (페이지네이션, 필터, 정렬) */
export async function getRoutines(options?: RoutineListOptions): Promise<{
  data: RoutineWithAuthor[];
  count: number;
}> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('routines')
    .select(
      'id, title, description, price, original_price, image_url, category, tags, author_id, rating, review_count, purchase_count, duration_days, features, color, status, created_at, updated_at, day_plans, profiles!author_id(nickname, avatar_url, bio)',
      { count: 'exact' }
    )
    .eq('status', options?.status ?? 'published');

  if (options?.category && options.category !== '전체') {
    query = query.eq('category', options.category);
  }

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%,tags.cs.{${options.search}}`
    );
  }

  switch (options?.sort) {
    case 'popular':
      query = query.order('purchase_count', { ascending: false });
      break;
    case 'latest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    default:
      query = query.order('purchase_count', { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data as unknown as RoutineWithAuthor[]) ?? [],
    count: count ?? 0,
  };
}

/** 루틴 단일 조회 (기간 옵션 포함) */
export async function getRoutine(id: string): Promise<RoutineWithAuthor> {
  const { data, error } = await supabase
    .from('routines')
    .select(
      'id, title, description, long_description, price, original_price, image_url, category, tags, author_id, rating, review_count, purchase_count, duration_days, day_plans, features, color, status, created_at, updated_at, profiles!author_id(nickname, avatar_url, bio), routine_periods(id, label, days, price, original_price, sort_order)'
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as RoutineWithAuthor;
}

/** 카테고리별 루틴 수 조회 */
export async function getRoutineCountByCategory(): Promise<
  { category: string; count: number }[]
> {
  const { data, error } = await supabase
    .from('routines')
    .select('category')
    .eq('status', 'published');

  if (error) throw error;

  const countMap = new Map<string, number>();
  data?.forEach((row) => {
    const cat = row.category;
    countMap.set(cat, (countMap.get(cat) ?? 0) + 1);
  });

  return Array.from(countMap.entries()).map(([category, count]) => ({
    category,
    count,
  }));
}

/** 특정 작성자의 루틴 목록 */
export async function getRoutinesByAuthor(
  authorId: string,
  options?: { page?: number; limit?: number }
): Promise<{ data: RoutineWithAuthor[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('routines')
    .select(
      'id, title, description, price, original_price, image_url, category, tags, author_id, rating, review_count, purchase_count, duration_days, features, color, status, created_at, updated_at, day_plans, profiles!author_id(nickname, avatar_url, bio)',
      { count: 'exact' }
    )
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data as unknown as RoutineWithAuthor[]) ?? [],
    count: count ?? 0,
  };
}

/** 리뷰 목록 조회 */
export async function getRoutineReviews(
  routineId: string,
  options?: { page?: number; limit?: number }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('reviews')
    .select(
      'id, rating, content, created_at, profiles!user_id(nickname, avatar_url)',
      { count: 'exact' }
    )
    .eq('routine_id', routineId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return { data: data ?? [], count: count ?? 0 };
}

/** 리뷰 작성 */
export async function createReview(input: {
  routineId: string;
  userId: string;
  rating: number;
  content: string;
}) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      routine_id: input.routineId,
      user_id: input.userId,
      rating: input.rating,
      content: input.content,
    })
    .select('id, rating, content, created_at')
    .single();

  if (error) throw error;
  return data;
}
