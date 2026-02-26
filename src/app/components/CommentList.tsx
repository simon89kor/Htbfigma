import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from './ui/utils';
import { Skeleton } from './ui/skeleton';
import type { CommentWithAuthor } from '@/lib/api/comments';

// ============================================================================
// Types
// ============================================================================

interface CommentListProps {
  comments: CommentWithAuthor[];
  loading: boolean;
  onSubmit: (content: string) => Promise<void>;
  isLoggedIn: boolean;
}

// ============================================================================
// Component
// ============================================================================

const CommentList = ({ comments, loading, onSubmit, isLoggedIn }: CommentListProps) => {
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setInputValue('');
    } catch {
      // Error handling is done in context
    } finally {
      setSubmitting(false);
    }
  }, [inputValue, submitting, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleUserClick = useCallback((userId: string) => {
    navigate(`/user/${userId}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="px-4 py-3 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Comment list */}
      <div className="divide-y divide-[#E5E7EB]">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-[#9CA3AF]">
            <p className="text-sm">아직 댓글이 없습니다</p>
            <p className="text-xs mt-1">첫 번째 댓글을 남겨보세요</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onUserClick={handleUserClick}
            />
          ))
        )}
      </div>

      {/* Comment input */}
      <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="댓글을 입력하세요..."
              className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2.5 border-none outline-none focus:ring-2 focus:ring-[#65D9AC]/30 placeholder:text-[#9CA3AF]"
              disabled={submitting}
              aria-label="댓글 입력"
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || submitting}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors',
                inputValue.trim() && !submitting
                  ? 'bg-[#65D9AC] text-white'
                  : 'bg-gray-100 text-[#9CA3AF]'
              )}
              aria-label="댓글 전송"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </>
        ) : (
          <p className="text-sm text-[#9CA3AF] w-full text-center py-1">
            댓글을 작성하려면 로그인하세요
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CommentItem Sub-component
// ============================================================================

interface CommentItemProps {
  comment: CommentWithAuthor;
  onUserClick: (userId: string) => void;
}

const CommentItem = ({ comment, onUserClick }: CommentItemProps) => {
  const authorNickname = comment.profiles?.nickname ?? '알 수 없음';
  const authorAvatar = comment.profiles?.avatar_url ?? '';
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3">
        <div
          className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 cursor-pointer"
          onClick={() => onUserClick(comment.author_id)}
          role="button"
          tabIndex={0}
          aria-label={`${authorNickname}의 프로필 보기`}
        >
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorNickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              {authorNickname[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold text-[#1a1a2e] cursor-pointer"
              onClick={() => onUserClick(comment.author_id)}
              role="button"
              tabIndex={0}
            >
              {authorNickname}
            </span>
            <span className="text-xs text-[#9CA3AF]">{timeAgo}</span>
          </div>
          <p className="text-sm text-[#1a1a2e] mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommentList;
