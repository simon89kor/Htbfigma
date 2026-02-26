import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import {
  getPosts,
  getPost,
  createPost as apiCreatePost,
  togglePostLike,
  togglePostBookmark,
  type PostWithAuthor,
  type CreatePostInput,
  type PostListOptions,
} from '@/lib/api/posts';
import {
  getComments,
  createComment as apiCreateComment,
  type CommentWithAuthor,
} from '@/lib/api/comments';
import { uploadPostImages } from '@/lib/api/storage';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

type FeedTab = 'all' | 'following' | 'mytobe' | 'now' | 'gratitude' | 'diet';

interface CommunityContextType {
  /** 피드 게시물 목록 */
  posts: PostWithAuthor[];
  /** 전체 게시물 수 */
  totalCount: number;
  /** 현재 탭 */
  activeTab: FeedTab;
  /** 로딩 상태 */
  loading: boolean;
  /** 추가 로딩 상태 (무한 스크롤) */
  loadingMore: boolean;
  /** 더 로드할 게시물 존재 여부 */
  hasMore: boolean;
  /** 현재 페이지 */
  currentPage: number;
  /** 탭 변경 */
  setActiveTab: (tab: FeedTab) => void;
  /** 피드 로드 (초기 또는 새로고침) */
  loadFeed: (tab?: FeedTab) => Promise<void>;
  /** 다음 페이지 로드 */
  loadMore: () => Promise<void>;
  /** 좋아요 토글 (낙관적 업데이트) */
  likePost: (postId: string) => Promise<void>;
  /** 북마크 토글 (낙관적 업데이트) */
  bookmarkPost: (postId: string) => Promise<void>;
  /** 게시물 작성 */
  publishPost: (data: {
    images: File[];
    title: string;
    content: string;
    hashtags: string[];
    category: string;
    linkedRoutineId?: string;
  }) => Promise<void>;
  /** 게시물 상세 조회 */
  fetchPost: (id: string) => Promise<PostWithAuthor>;
  /** 댓글 목록 조회 */
  fetchComments: (postId: string, page?: number) => Promise<{ data: CommentWithAuthor[]; count: number }>;
  /** 댓글 작성 */
  addComment: (postId: string, content: string) => Promise<CommentWithAuthor>;
}

// ============================================================================
// Context (HMR-safe)
// ============================================================================

const CTX_KEY = Symbol.for('htb-community-context');
const globalObj = globalThis as Record<symbol, unknown>;
if (!globalObj[CTX_KEY]) {
  globalObj[CTX_KEY] = createContext<CommunityContextType | undefined>(undefined);
}
const CommunityContext = globalObj[CTX_KEY] as React.Context<CommunityContextType | undefined>;

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 20;

const TAB_TO_OPTIONS: Record<FeedTab, Partial<PostListOptions>> = {
  all: { sort: 'latest' },
  following: { sort: 'latest' },
  mytobe: { category: 'mytobe', sort: 'latest' },
  now: { category: 'now', sort: 'latest' },
  gratitude: { category: 'gratitude', sort: 'latest' },
  diet: { category: 'diet', sort: 'latest' },
};

// ============================================================================
// Provider
// ============================================================================

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTabState] = useState<FeedTab>('all');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const loadingRef = useRef(false);

  const getFollowingIds = useCallback(async (): Promise<string[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    return data?.map((f) => f.following_id) ?? [];
  }, [user]);

  const loadFeed = useCallback(async (tab?: FeedTab) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const currentTab = tab ?? activeTab;
    try {
      const options: PostListOptions = {
        ...TAB_TO_OPTIONS[currentTab],
        page: 1,
        limit: PAGE_SIZE,
      };

      let result: { data: PostWithAuthor[]; count: number };

      if (currentTab === 'following' && user) {
        const followingIds = await getFollowingIds();
        if (followingIds.length === 0) {
          setPosts([]);
          setTotalCount(0);
          setHasMore(false);
          setCurrentPage(1);
          return;
        }
        // For following tab, get posts from followed users
        const { data, error, count } = await supabase
          .from('posts')
          .select(
            'id, author_id, title, content, images, hashtags, category, linked_routine_id, like_count, comment_count, bookmark_count, status, created_at, updated_at, profiles!author_id(nickname, avatar_url), routines!linked_routine_id(id, title)',
            { count: 'exact' }
          )
          .eq('status', 'active')
          .in('author_id', followingIds)
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1);

        if (error) throw error;
        result = { data: (data as unknown as PostWithAuthor[]) ?? [], count: count ?? 0 };
      } else {
        result = await getPosts(options, user?.id);
      }

      setPosts(result.data);
      setTotalCount(result.count);
      setHasMore(result.data.length >= PAGE_SIZE);
      setCurrentPage(1);
    } catch (error) {
      toast.error('게시물을 불러오지 못했습니다');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [activeTab, user, getFollowingIds]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadingMore(true);

    const nextPage = currentPage + 1;
    try {
      const options: PostListOptions = {
        ...TAB_TO_OPTIONS[activeTab],
        page: nextPage,
        limit: PAGE_SIZE,
      };

      let result: { data: PostWithAuthor[]; count: number };

      if (activeTab === 'following' && user) {
        const followingIds = await getFollowingIds();
        if (followingIds.length === 0) {
          setHasMore(false);
          return;
        }
        const from = (nextPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error, count } = await supabase
          .from('posts')
          .select(
            'id, author_id, title, content, images, hashtags, category, linked_routine_id, like_count, comment_count, bookmark_count, status, created_at, updated_at, profiles!author_id(nickname, avatar_url), routines!linked_routine_id(id, title)',
            { count: 'exact' }
          )
          .eq('status', 'active')
          .in('author_id', followingIds)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        result = { data: (data as unknown as PostWithAuthor[]) ?? [], count: count ?? 0 };
      } else {
        result = await getPosts(options, user?.id);
      }

      setPosts((prev) => [...prev, ...result.data]);
      setTotalCount(result.count);
      setHasMore(result.data.length >= PAGE_SIZE);
      setCurrentPage(nextPage);
    } catch (error) {
      toast.error('게시물을 더 불러오지 못했습니다');
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [activeTab, currentPage, hasMore, user, getFollowingIds]);

  const setActiveTab = useCallback((tab: FeedTab) => {
    setActiveTabState(tab);
    setPosts([]);
    setCurrentPage(1);
    setHasMore(true);
  }, []);

  // 좋아요 (낙관적 업데이트)
  const likePost = useCallback(async (postId: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    // 낙관적 업데이트
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked: !p.is_liked,
              like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1,
            }
          : p
      )
    );

    try {
      await togglePostLike(postId, user.id);
    } catch {
      // 실패 시 롤백
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked: !p.is_liked,
                like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1,
              }
            : p
        )
      );
      toast.error('좋아요 처리에 실패했습니다');
    }
  }, [user]);

  // 북마크 (낙관적 업데이트)
  const bookmarkPost = useCallback(async (postId: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_bookmarked: !p.is_bookmarked,
              bookmark_count: p.is_bookmarked ? p.bookmark_count - 1 : p.bookmark_count + 1,
            }
          : p
      )
    );

    try {
      await togglePostBookmark(postId, user.id);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_bookmarked: !p.is_bookmarked,
                bookmark_count: p.is_bookmarked ? p.bookmark_count - 1 : p.bookmark_count + 1,
              }
            : p
        )
      );
      toast.error('북마크 처리에 실패했습니다');
    }
  }, [user]);

  // 게시물 작성
  const publishPost = useCallback(async (data: {
    images: File[];
    title: string;
    content: string;
    hashtags: string[];
    category: string;
    linkedRoutineId?: string;
  }) => {
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    try {
      // 1. 이미지 업로드
      let imageUrls: string[] = [];
      if (data.images.length > 0) {
        const uploadResults = await uploadPostImages(user.id, data.images);
        imageUrls = uploadResults.map((r) => r.publicUrl);
      }

      // 2. 게시물 작성
      const input: CreatePostInput = {
        authorId: user.id,
        title: data.title,
        content: data.content,
        images: imageUrls,
        hashtags: data.hashtags,
        category: data.category as CreatePostInput['category'],
        linkedRoutineId: data.linkedRoutineId,
      };

      await apiCreatePost(input);
      toast.success('게시물이 등록되었습니다');
    } catch (error) {
      toast.error('게시물 등록에 실패했습니다');
      throw error;
    }
  }, [user]);

  // 게시물 상세 조회
  const fetchPost = useCallback(async (id: string): Promise<PostWithAuthor> => {
    return getPost(id, user?.id);
  }, [user]);

  // 댓글 조회
  const fetchComments = useCallback(async (postId: string, page?: number) => {
    return getComments(postId, user?.id, { page: page ?? 1, limit: PAGE_SIZE });
  }, [user]);

  // 댓글 작성
  const addComment = useCallback(async (postId: string, content: string): Promise<CommentWithAuthor> => {
    if (!user) {
      toast.error('로그인이 필요합니다');
      throw new Error('로그인이 필요합니다');
    }

    const comment = await apiCreateComment({
      postId,
      authorId: user.id,
      content,
    });

    // 피드의 댓글 수 업데이트
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comment_count: p.comment_count + 1 }
          : p
      )
    );

    return comment;
  }, [user]);

  return (
    <CommunityContext.Provider
      value={{
        posts,
        totalCount,
        activeTab,
        loading,
        loadingMore,
        hasMore,
        currentPage,
        setActiveTab,
        loadFeed,
        loadMore,
        likePost,
        bookmarkPost,
        publishPost,
        fetchPost,
        fetchComments,
        addComment,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) throw new Error('useCommunity must be used within CommunityProvider');
  return context;
}

export type { FeedTab };
