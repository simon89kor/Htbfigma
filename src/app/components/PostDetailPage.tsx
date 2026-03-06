import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from './ui/utils';
import { Skeleton } from './ui/skeleton';
import { useCommunity } from '../community-context';
import { useAuth } from '../auth-context';
import CommentList from './CommentList';
import { CATEGORY_LABELS } from './PostCard';
import type { PostWithAuthor } from '@/lib/api/posts';
import type { CommentWithAuthor } from '@/lib/api/comments';
import { togglePostLike, togglePostBookmark } from '@/lib/api/posts';
import { toast } from 'sonner';

// ============================================================================
// Component
// ============================================================================

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { fetchPost, fetchComments, addComment } = useCommunity();

  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  // Load post and comments
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setCommentsLoading(true);
      try {
        const [postData, commentsData] = await Promise.all([
          fetchPost(id),
          fetchComments(id),
        ]);
        setPost(postData);
        setComments(commentsData.data);
      } catch {
        toast.error('게시물을 불러오지 못했습니다');
        navigate(-1);
      } finally {
        setLoading(false);
        setCommentsLoading(false);
      }
    };

    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus comments if query param exists
  useEffect(() => {
    if (searchParams.get('focus') === 'comments' && !commentsLoading) {
      commentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams, commentsLoading]);

  const handleLike = useCallback(async () => {
    if (!user || !post) {
      toast.error('로그인이 필요합니다');
      return;
    }

    // Optimistic update
    setPost((prev) =>
      prev
        ? {
            ...prev,
            is_liked: !prev.is_liked,
            like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1,
          }
        : prev
    );

    try {
      await togglePostLike(post.id, user.id);
    } catch {
      // Rollback
      setPost((prev) =>
        prev
          ? {
              ...prev,
              is_liked: !prev.is_liked,
              like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1,
            }
          : prev
      );
      toast.error('좋아요 처리에 실패했습니다');
    }
  }, [user, post]);

  const handleBookmark = useCallback(async () => {
    if (!user || !post) {
      toast.error('로그인이 필요합니다');
      return;
    }

    setPost((prev) =>
      prev
        ? {
            ...prev,
            is_bookmarked: !prev.is_bookmarked,
            bookmark_count: prev.is_bookmarked
              ? prev.bookmark_count - 1
              : prev.bookmark_count + 1,
          }
        : prev
    );

    try {
      await togglePostBookmark(post.id, user.id);
    } catch {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              is_bookmarked: !prev.is_bookmarked,
              bookmark_count: prev.is_bookmarked
                ? prev.bookmark_count - 1
                : prev.bookmark_count + 1,
            }
          : prev
      );
      toast.error('북마크 처리에 실패했습니다');
    }
  }, [user, post]);

  const handleShare = useCallback(async () => {
    if (!post) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || '게시물 공유',
          url: `${window.location.origin}/community/${post.id}`,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/community/${post.id}`);
      toast.success('링크가 복사되었습니다');
    }
  }, [post]);

  const handleCommentSubmit = useCallback(async (content: string) => {
    if (!id) return;
    try {
      const newComment = await addComment(id, content);
      setComments((prev) => [...prev, newComment]);
      setPost((prev) =>
        prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev
      );
    } catch {
      toast.error('댓글 작성에 실패했습니다');
    }
  }, [id, addComment]);

  // Image swipe handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart === null || !post) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    const images = post.images ?? [];
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImageIndex < images.length - 1) {
        setCurrentImageIndex((prev) => prev + 1);
      } else if (diff < 0 && currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1);
      }
    }
    setTouchStart(null);
  }, [touchStart, currentImageIndex, post]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-foreground/50">
        <p className="text-lg">게시물을 찾을 수 없습니다</p>
      </div>
    );
  }

  const images = post.images ?? [];
  const authorNickname = post.profiles?.nickname ?? '알 수 없음';
  const authorAvatar = post.profiles?.avatar_url ?? '';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="min-h-screen bg-background -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-white/10 flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-white/5"
          aria-label="뒤로가기"
        >
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">게시물</h1>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-white/5"
          aria-label="더보기"
        >
          <MoreHorizontal size={22} className="text-foreground" />
        </button>
      </div>

      {/* Author info */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => navigate(`/user/${post.author_id}`)}
        role="button"
        tabIndex={0}
        aria-label={`${authorNickname}의 프로필 보기`}
      >
        <div className="w-10 h-10 rounded-full bg-white/8 overflow-hidden flex-shrink-0">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorNickname} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-foreground/60">
              {authorNickname[0]}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{authorNickname}</p>
          <p className="text-xs text-foreground/50">{timeAgo}</p>
        </div>
      </div>

      {/* Image viewer */}
      {images.length > 0 && (
        <div
          className="relative w-full aspect-[4/3] bg-white/5 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[currentImageIndex]}
            alt={`이미지 ${currentImageIndex + 1}/${images.length}`}
            className="w-full h-full object-cover"
          />

          {/* Image count indicator */}
          {images.length > 1 && (
            <>
              <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                {currentImageIndex + 1}/{images.length}
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-colors',
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Interaction bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="bg-transparent border-none cursor-pointer p-0"
            aria-label={post.is_liked ? '좋아요 취소' : '좋아요'}
          >
            <Heart
              size={24}
              className={cn(
                'transition-colors',
                post.is_liked ? 'fill-red-500 text-red-500' : 'text-foreground/60'
              )}
            />
          </button>
          <button
            onClick={() => commentSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-transparent border-none cursor-pointer p-0"
            aria-label="댓글"
          >
            <MessageCircle size={24} className="text-foreground/60" />
          </button>
          <button
            onClick={handleBookmark}
            className="bg-transparent border-none cursor-pointer p-0"
            aria-label={post.is_bookmarked ? '북마크 취소' : '북마크'}
          >
            <Bookmark
              size={24}
              className={cn(
                'transition-colors',
                post.is_bookmarked ? 'fill-foreground text-foreground' : 'text-foreground/60'
              )}
            />
          </button>
          <button
            onClick={handleShare}
            className="bg-transparent border-none cursor-pointer p-0"
            aria-label="공유"
          >
            <Share2 size={24} className="text-foreground/60" />
          </button>
        </div>
      </div>

      {/* Like count */}
      {post.like_count > 0 && (
        <div className="px-4 pb-2">
          <span className="text-sm font-semibold text-foreground">
            좋아요 {post.like_count}개
          </span>
        </div>
      )}

      {/* Linked routine */}
      {post.routines && (
        <div className="px-4 pb-3">
          <div
            className="inline-flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => navigate(`/product/${post.routines!.id}`)}
            role="button"
            tabIndex={0}
            aria-label="연결된 루틴 보기"
          >
            <span>📋</span>
            <span className="text-sm font-medium text-foreground">{post.routines.title}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        {post.title && (
          <h2 className="text-base font-bold text-foreground mb-1">{post.title}</h2>
        )}
        {post.content && (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        )}
      </div>

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {post.hashtags.map((tag, idx) => (
            <span key={idx} className="text-sm text-[#65D9AC] font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Category */}
      {post.category && post.category !== 'general' && (
        <div className="px-4 pb-3">
          <span className="inline-block text-xs bg-white/5 text-foreground/60 px-2.5 py-1 rounded-full">
            {CATEGORY_LABELS[post.category] ?? post.category}
          </span>
        </div>
      )}

      {/* Comments section */}
      <div ref={commentSectionRef} className="border-t border-white/10">
        <div className="px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            댓글 {post.comment_count}개
          </h3>
        </div>
        <CommentList
          comments={comments}
          loading={commentsLoading}
          onSubmit={handleCommentSubmit}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Skeleton
// ============================================================================

const DetailSkeleton = () => (
  <div className="min-h-screen bg-background -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <Skeleton className="w-9 h-9 rounded-full" />
      <Skeleton className="h-5 w-16" />
      <Skeleton className="w-9 h-9 rounded-full" />
    </div>
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
    <Skeleton className="w-full aspect-[4/3]" />
    <div className="px-4 py-3 space-y-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

export default PostDetailPage;
