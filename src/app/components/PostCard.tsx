import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from './ui/utils';
import type { PostWithAuthor } from '@/lib/api/posts';

// ============================================================================
// Types
// ============================================================================

interface PostCardProps {
  post: PostWithAuthor;
  onLike: (postId: string) => Promise<void>;
  onBookmark: (postId: string) => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  mytobe: 'MY TO-BE',
  now: 'NOW',
  gratitude: '감사일기',
  diet: '다이어트',
  exercise: '운동인증',
  selfdev: '자기개발',
  general: '일반',
};

// ============================================================================
// Component
// ============================================================================

const PostCard = ({ post, onLike, onBookmark }: PostCardProps) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const images = post.images ?? [];
  const hasMultipleImages = images.length > 1;

  const authorNickname = post.profiles?.nickname ?? '알 수 없음';
  const authorAvatar = post.profiles?.avatar_url ?? '';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ko,
  });

  const handleUserClick = useCallback(() => {
    navigate(`/user/${post.author_id}`);
  }, [navigate, post.author_id]);

  const handlePostClick = useCallback(() => {
    navigate(`/community/${post.id}`);
  }, [navigate, post.id]);

  const handleCommentClick = useCallback(() => {
    navigate(`/community/${post.id}?focus=comments`);
  }, [navigate, post.id]);

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onLike(post.id);
  }, [onLike, post.id]);

  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onBookmark(post.id);
  }, [onBookmark, post.id]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || '게시물 공유',
          url: `${window.location.origin}/community/${post.id}`,
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/community/${post.id}`);
    }
  }, [post.id, post.title]);

  // Touch swipe handling for image carousel
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImageIndex < images.length - 1) {
        setCurrentImageIndex((prev) => prev + 1);
      } else if (diff < 0 && currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1);
      }
    }
    setTouchStart(null);
  }, [touchStart, currentImageIndex, images.length]);

  return (
    <article className="bg-background border-b border-white/10">
      {/* User profile header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={handleUserClick}
        role="button"
        tabIndex={0}
        aria-label={`${authorNickname}의 프로필 보기`}
      >
        <div className="w-9 h-9 rounded-full bg-white/8 overflow-hidden flex-shrink-0">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorNickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-foreground/60">
              {authorNickname[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">{authorNickname}</span>
          <span className="text-xs text-foreground/50 ml-2">{timeAgo}</span>
        </div>
      </div>

      {/* Image area */}
      {images.length > 0 && (
        <div
          className="relative w-full aspect-[4/3] bg-white/5 overflow-hidden cursor-pointer"
          onClick={handlePostClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          aria-label="게시물 상세 보기"
        >
          <img
            src={images[currentImageIndex]}
            alt={`게시물 이미지 ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Image indicator dots */}
          {hasMultipleImages && (
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
          )}

          {/* Routine badge overlay */}
          {post.routines && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span>📋</span>
              <span className="max-w-[150px] truncate">{post.routines.title}</span>
            </div>
          )}
        </div>
      )}

      {/* Interaction bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
            aria-label={post.is_liked ? '좋아요 취소' : '좋아요'}
          >
            <Heart
              size={22}
              className={cn(
                'transition-colors',
                post.is_liked ? 'fill-red-500 text-red-500' : 'text-foreground/60'
              )}
            />
          </button>
          <button
            onClick={handleCommentClick}
            className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
            aria-label="댓글 보기"
          >
            <MessageCircle size={22} className="text-foreground/60" />
          </button>
          <button
            onClick={handleBookmark}
            className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
            aria-label={post.is_bookmarked ? '북마크 취소' : '북마크'}
          >
            <Bookmark
              size={22}
              className={cn(
                'transition-colors',
                post.is_bookmarked ? 'fill-foreground text-foreground' : 'text-foreground/60'
              )}
            />
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
            aria-label="공유하기"
          >
            <Share2 size={22} className="text-foreground/60" />
          </button>
        </div>
      </div>

      {/* Like and comment counts */}
      <div className="px-4 pb-1">
        <div className="flex items-center gap-3 text-sm">
          {post.like_count > 0 && (
            <span className="font-semibold text-foreground">좋아요 {post.like_count}개</span>
          )}
          {post.comment_count > 0 && (
            <span className="text-foreground/60">댓글 {post.comment_count}개</span>
          )}
        </div>
      </div>

      {/* Content preview */}
      {(post.title || post.content) && (
        <div
          className="px-4 pb-2 cursor-pointer"
          onClick={handlePostClick}
          role="button"
          tabIndex={0}
        >
          {post.title && (
            <p className="text-sm font-semibold text-foreground line-clamp-1">{post.title}</p>
          )}
          {post.content && (
            <p className="text-sm text-foreground/60 line-clamp-2 mt-0.5">{post.content}</p>
          )}
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {post.hashtags.map((tag, idx) => (
            <span key={idx} className="text-xs text-[#65D9AC] font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Category badge */}
      {post.category && post.category !== 'general' && (
        <div className="px-4 pb-3">
          <span className="inline-block text-xs bg-white/5 text-foreground/60 px-2.5 py-1 rounded-full">
            {CATEGORY_LABELS[post.category] ?? post.category}
          </span>
        </div>
      )}
    </article>
  );
};

export default PostCard;
export { CATEGORY_LABELS };
