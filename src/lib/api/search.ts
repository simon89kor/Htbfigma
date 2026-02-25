import { supabase } from '../supabase';
import type { SearchKeyword, UserSearchHistory } from '../database.types';

// ============================================================================
// Types
// ============================================================================

export interface SearchResult {
  routines: {
    id: string;
    title: string;
    image_url: string;
    category: string;
    price: number;
    rating: number;
  }[];
  posts: {
    id: string;
    title: string;
    content: string;
    author_nickname: string;
  }[];
  profiles: {
    id: string;
    nickname: string;
    avatar_url: string;
    bio: string;
  }[];
}

// ============================================================================
// Queries
// ============================================================================

/** 통합 검색 */
export async function search(
  query: string,
  options?: {
    type?: 'all' | 'routines' | 'posts' | 'profiles';
    limit?: number;
  }
): Promise<SearchResult> {
  const limit = options?.limit ?? 10;
  const type = options?.type ?? 'all';
  const result: SearchResult = { routines: [], posts: [], profiles: [] };

  const promises: Promise<void>[] = [];

  if (type === 'all' || type === 'routines') {
    promises.push(
      supabase
        .from('routines')
        .select('id, title, image_url, category, price, rating')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
        .limit(limit)
        .then(({ data, error }) => {
          if (error) throw error;
          result.routines = data ?? [];
        })
    );
  }

  if (type === 'all' || type === 'posts') {
    promises.push(
      supabase
        .from('posts')
        .select('id, title, content, profiles!author_id(nickname)')
        .eq('status', 'active')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(limit)
        .then(({ data, error }) => {
          if (error) throw error;
          result.posts =
            data?.map((p) => ({
              id: p.id,
              title: p.title,
              content: p.content.substring(0, 100),
              author_nickname:
                (p.profiles as unknown as { nickname: string })?.nickname ?? '',
            })) ?? [];
        })
    );
  }

  if (type === 'all' || type === 'profiles') {
    promises.push(
      supabase
        .from('profiles')
        .select('id, nickname, avatar_url, bio')
        .eq('status', 'active')
        .ilike('nickname', `%${query}%`)
        .limit(limit)
        .then(({ data, error }) => {
          if (error) throw error;
          result.profiles = data ?? [];
        })
    );
  }

  await Promise.all(promises);

  return result;
}

/** 인기 검색어 조회 */
export async function getTrendingKeywords(
  limit?: number
): Promise<SearchKeyword[]> {
  const { data, error } = await supabase
    .from('search_keywords')
    .select('id, keyword, count, is_trending, updated_at')
    .eq('is_trending', true)
    .order('count', { ascending: false })
    .limit(limit ?? 10);

  if (error) throw error;
  return data ?? [];
}

/** 검색 기록 저장 (RPC 함수로 키워드 카운트도 같이 처리) */
export async function saveSearchKeyword(
  userId: string,
  keyword: string
): Promise<void> {
  // 유저 검색 기록 저장
  const { error: historyError } = await supabase
    .from('user_search_history')
    .insert({
      user_id: userId,
      keyword,
    });

  if (historyError) throw historyError;

  // 검색 키워드 카운트 업데이트 (RPC)
  await supabase
    .rpc('upsert_search_keyword', { search_keyword: keyword })
    .catch(() => {
      // RPC 없으면 무시 (B3 Edge Function에서 처리)
    });
}

/** 유저 검색 기록 조회 */
export async function getUserSearchHistory(
  userId: string,
  limit?: number
): Promise<UserSearchHistory[]> {
  const { data, error } = await supabase
    .from('user_search_history')
    .select('id, user_id, keyword, searched_at')
    .eq('user_id', userId)
    .order('searched_at', { ascending: false })
    .limit(limit ?? 20);

  if (error) throw error;
  return data ?? [];
}

/** 유저 검색 기록 삭제 (단건) */
export async function deleteSearchHistoryItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_search_history')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/** 유저 검색 기록 전체 삭제 */
export async function clearSearchHistory(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_search_history')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

/** 자동완성 (루틴 제목 기반) */
export async function getAutocompleteSuggestions(
  query: string,
  limit?: number
): Promise<string[]> {
  if (!query || query.length < 1) return [];

  const { data, error } = await supabase
    .from('routines')
    .select('title')
    .eq('status', 'published')
    .ilike('title', `%${query}%`)
    .limit(limit ?? 5);

  if (error) throw error;
  return data?.map((r) => r.title) ?? [];
}
