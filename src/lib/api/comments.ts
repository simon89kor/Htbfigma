import { supabase } from '../supabase';
import type { Comment } from '../database.types';

// ============================================================================
// Types
// ============================================================================

export interface CommentWithAuthor extends Comment {
  profiles: {
    nickname: string;
    avatar_url: string;
  } | null;
  replies?: CommentWithAuthor[];
  is_liked?: boolean;
}

// ============================================================================
// Queries
// ============================================================================

/** 게시물의 댓글 목록 조회 (대댓글 포함) */
export async function getComments(
  postId: string,
  currentUserId?: string,
  options?: { page?: number; limit?: number }
): Promise<{ data: CommentWithAuthor[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // 최상위 댓글만 조회
  const { data, error, count } = await supabase
    .from('comments')
    .select(
      'id, post_id, author_id, parent_id, content, like_count, status, created_at, updated_at, profiles!author_id(nickname, avatar_url)',
      { count: 'exact' }
    )
    .eq('post_id', postId)
    .is('parent_id', null)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .range(from, to);

  if (error) throw error;

  let comments = (data as unknown as CommentWithAuthor[]) ?? [];

  // 대댓글 조회
  if (comments.length > 0) {
    const commentIds = comments.map((c) => c.id);

    const { data: replies, error: repliesError } = await supabase
      .from('comments')
      .select(
        'id, post_id, author_id, parent_id, content, like_count, status, created_at, updated_at, profiles!author_id(nickname, avatar_url)'
      )
      .in('parent_id', commentIds)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (repliesError) throw repliesError;

    const repliesMap = new Map<string, CommentWithAuthor[]>();
    (replies as unknown as CommentWithAuthor[])?.forEach((reply) => {
      if (reply.parent_id) {
        const existing = repliesMap.get(reply.parent_id) ?? [];
        existing.push(reply);
        repliesMap.set(reply.parent_id, existing);
      }
    });

    comments = comments.map((comment) => ({
      ...comment,
      replies: repliesMap.get(comment.id) ?? [],
    }));
  }

  // 좋아요 상태 확인
  if (currentUserId && comments.length > 0) {
    const allCommentIds = [
      ...comments.map((c) => c.id),
      ...comments.flatMap((c) => c.replies?.map((r) => r.id) ?? []),
    ];

    const { data: likes } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', currentUserId)
      .in('comment_id', allCommentIds);

    const likedIds = new Set(likes?.map((l) => l.comment_id) ?? []);

    comments = comments.map((comment) => ({
      ...comment,
      is_liked: likedIds.has(comment.id),
      replies: comment.replies?.map((r) => ({
        ...r,
        is_liked: likedIds.has(r.id),
      })),
    }));
  }

  return { data: comments, count: count ?? 0 };
}

/** 댓글 작성 */
export async function createComment(input: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
}): Promise<CommentWithAuthor> {
  // 댓글 INSERT (트리거가 posts.comment_count를 자동 증가)
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: input.postId,
      author_id: input.authorId,
      content: input.content,
      parent_id: input.parentId ?? null,
    })
    .select(
      'id, post_id, author_id, parent_id, content, like_count, status, created_at, updated_at, profiles!author_id(nickname, avatar_url)'
    )
    .single();

  if (error) throw error;

  return data as unknown as CommentWithAuthor;
}

/** 댓글 수정 */
export async function updateComment(
  id: string,
  content: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .update({ content })
    .eq('id', id)
    .select('id, post_id, author_id, parent_id, content, like_count, status, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}

/** 댓글 삭제 (soft delete) */
export async function deleteComment(id: string, postId: string): Promise<void> {
  // soft delete (트리거가 posts.comment_count를 자동 감소)
  const { error } = await supabase
    .from('comments')
    .update({ status: 'deleted' })
    .eq('id', id);

  if (error) throw error;
}

/** 댓글 좋아요 토글 */
export async function toggleCommentLike(
  commentId: string,
  userId: string
): Promise<{ liked: boolean; count: number }> {
  const { data: existing } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // 좋아요 취소 (트리거가 like_count를 자동 감소)
    await supabase
      .from('comment_likes')
      .delete()
      .eq('id', existing.id);

    // 트리거 반영 후 최신 카운트 조회
    const { data: comment } = await supabase
      .from('comments')
      .select('like_count')
      .eq('id', commentId)
      .single();

    return { liked: false, count: comment?.like_count ?? 0 };
  } else {
    // 좋아요 추가 (트리거가 like_count를 자동 증가)
    await supabase
      .from('comment_likes')
      .insert({ comment_id: commentId, user_id: userId });

    // 트리거 반영 후 최신 카운트 조회
    const { data: comment } = await supabase
      .from('comments')
      .select('like_count')
      .eq('id', commentId)
      .single();

    return { liked: true, count: comment?.like_count ?? 0 };
  }
}
