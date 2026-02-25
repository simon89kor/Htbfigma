import { supabase } from '../supabase';
import type { Database, Post } from '../database.types';

// ============================================================================
// Types
// ============================================================================

type PostCategory = Database['public']['Tables']['posts']['Row']['category'];

export interface PostWithAuthor extends Post {
  profiles: {
    nickname: string;
    avatar_url: string;
  } | null;
  routines?: {
    id: string;
    title: string;
  } | null;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface PostListOptions {
  category?: PostCategory;
  authorId?: string;
  search?: string;
  sort?: 'latest' | 'popular' | 'comments';
  page?: number;
  limit?: number;
}

export interface CreatePostInput {
  authorId: string;
  title?: string;
  content: string;
  images?: string[];
  hashtags?: string[];
  category?: PostCategory;
  linkedRoutineId?: string;
}

// ============================================================================
// Queries
// ============================================================================

/** 게시물 목록 조회 */
export async function getPosts(
  options?: PostListOptions,
  currentUserId?: string
): Promise<{ data: PostWithAuthor[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('posts')
    .select(
      'id, author_id, title, content, images, hashtags, category, linked_routine_id, like_count, comment_count, bookmark_count, status, created_at, updated_at, profiles!author_id(nickname, avatar_url), routines!linked_routine_id(id, title)',
      { count: 'exact' }
    )
    .eq('status', 'active');

  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.authorId) {
    query = query.eq('author_id', options.authorId);
  }
  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,content.ilike.%${options.search}%`
    );
  }

  switch (options?.sort) {
    case 'popular':
      query = query.order('like_count', { ascending: false });
      break;
    case 'comments':
      query = query.order('comment_count', { ascending: false });
      break;
    case 'latest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  let posts = (data as unknown as PostWithAuthor[]) ?? [];

  // 현재 유저의 좋아요/북마크 상태 확인
  if (currentUserId && posts.length > 0) {
    const postIds = posts.map((p) => p.id);

    const [likesResult, bookmarksResult] = await Promise.all([
      supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds),
      supabase
        .from('post_bookmarks')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds),
    ]);

    const likedPostIds = new Set(likesResult.data?.map((l) => l.post_id) ?? []);
    const bookmarkedPostIds = new Set(bookmarksResult.data?.map((b) => b.post_id) ?? []);

    posts = posts.map((post) => ({
      ...post,
      is_liked: likedPostIds.has(post.id),
      is_bookmarked: bookmarkedPostIds.has(post.id),
    }));
  }

  return { data: posts, count: count ?? 0 };
}

/** 게시물 단일 조회 */
export async function getPost(
  id: string,
  currentUserId?: string
): Promise<PostWithAuthor> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, author_id, title, content, images, hashtags, category, linked_routine_id, like_count, comment_count, bookmark_count, status, created_at, updated_at, profiles!author_id(nickname, avatar_url), routines!linked_routine_id(id, title)'
    )
    .eq('id', id)
    .single();

  if (error) throw error;

  let post = data as unknown as PostWithAuthor;

  if (currentUserId) {
    const [likeResult, bookmarkResult] = await Promise.all([
      supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', currentUserId)
        .maybeSingle(),
      supabase
        .from('post_bookmarks')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', currentUserId)
        .maybeSingle(),
    ]);

    post = {
      ...post,
      is_liked: !!likeResult.data,
      is_bookmarked: !!bookmarkResult.data,
    };
  }

  return post;
}

/** 게시물 작성 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: input.authorId,
      title: input.title ?? '',
      content: input.content,
      images: input.images ?? [],
      hashtags: input.hashtags ?? [],
      category: input.category ?? 'general',
      linked_routine_id: input.linkedRoutineId ?? null,
    })
    .select('id, author_id, title, content, images, hashtags, category, like_count, comment_count, bookmark_count, status, created_at, updated_at, linked_routine_id')
    .single();

  if (error) throw error;
  return data;
}

/** 게시물 수정 */
export async function updatePost(
  id: string,
  updates: {
    title?: string;
    content?: string;
    images?: string[];
    hashtags?: string[];
    category?: PostCategory;
  }
): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select('id, author_id, title, content, images, hashtags, category, like_count, comment_count, bookmark_count, status, created_at, updated_at, linked_routine_id')
    .single();

  if (error) throw error;
  return data;
}

/** 게시물 삭제 (soft delete) */
export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({ status: 'deleted' })
    .eq('id', id);

  if (error) throw error;
}

/** 좋아요 토글 */
export async function togglePostLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; count: number }> {
  // 기존 좋아요 확인
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // 좋아요 취소 (트리거가 like_count를 자동 감소)
    await supabase
      .from('post_likes')
      .delete()
      .eq('id', existing.id);

    // 트리거 반영 후 최신 카운트 조회
    const { data: post } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single();

    return { liked: false, count: post?.like_count ?? 0 };
  } else {
    // 좋아요 추가 (트리거가 like_count를 자동 증가)
    await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });

    // 트리거 반영 후 최신 카운트 조회
    const { data: post } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single();

    return { liked: true, count: post?.like_count ?? 0 };
  }
}

/** 북마크 토글 */
export async function togglePostBookmark(
  postId: string,
  userId: string
): Promise<{ bookmarked: boolean; count: number }> {
  const { data: existing } = await supabase
    .from('post_bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // 북마크 취소 (트리거가 bookmark_count를 자동 감소)
    await supabase
      .from('post_bookmarks')
      .delete()
      .eq('id', existing.id);

    // 트리거 반영 후 최신 카운트 조회
    const { data: post } = await supabase
      .from('posts')
      .select('bookmark_count')
      .eq('id', postId)
      .single();

    return { bookmarked: false, count: post?.bookmark_count ?? 0 };
  } else {
    // 북마크 추가 (트리거가 bookmark_count를 자동 증가)
    await supabase
      .from('post_bookmarks')
      .insert({ post_id: postId, user_id: userId });

    // 트리거 반영 후 최신 카운트 조회
    const { data: post } = await supabase
      .from('posts')
      .select('bookmark_count')
      .eq('id', postId)
      .single();

    return { bookmarked: true, count: post?.bookmark_count ?? 0 };
  }
}

/** 유저의 북마크 게시물 목록 */
export async function getBookmarkedPosts(
  userId: string,
  options?: { page?: number; limit?: number }
): Promise<{ data: PostWithAuthor[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: bookmarks, error: bmError, count } = await supabase
    .from('post_bookmarks')
    .select('post_id', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (bmError) throw bmError;
  if (!bookmarks || bookmarks.length === 0) {
    return { data: [], count: 0 };
  }

  const postIds = bookmarks.map((b) => b.post_id);

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(
      'id, author_id, title, content, images, hashtags, category, linked_routine_id, like_count, comment_count, bookmark_count, status, created_at, updated_at, profiles!author_id(nickname, avatar_url)'
    )
    .in('id', postIds)
    .eq('status', 'active');

  if (postsError) throw postsError;

  const postsWithBookmark = (posts as unknown as PostWithAuthor[]).map((p) => ({
    ...p,
    is_bookmarked: true,
  }));

  return { data: postsWithBookmark, count: count ?? 0 };
}
