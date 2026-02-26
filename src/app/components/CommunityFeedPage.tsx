import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Users as UsersIcon } from 'lucide-react';
import { cn } from './ui/utils';
import { Skeleton } from './ui/skeleton';
import { useCommunity, type FeedTab } from '../community-context';
import PostCard from './PostCard';

// ============================================================================
// Constants
// ============================================================================

const FEED_TABS: { key: FeedTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'following', label: '팔로잉' },
  { key: 'mytobe', label: 'MY TO-BE' },
  { key: 'now', label: 'NOW' },
  { key: 'gratitude', label: '감사일기' },
  { key: 'diet', label: '다이어트' },
];

// ============================================================================
// Component
// ============================================================================

const CommunityFeedPage = () => {
  const navigate = useNavigate();
  const {
    posts,
    activeTab,
    loading,
    loadingMore,
    hasMore,
    setActiveTab,
    loadFeed,
    loadMore,
    likePost,
    bookmarkPost,
  } = useCommunity();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Initial load
  useEffect(() => {
    loadFeed(activeTab);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll observer
  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }
  }, [hasMore, loadingMore, loadMore]);

  useEffect(() => {
    setupObserver();
    return () => {
      observerRef.current?.disconnect();
    };
  }, [setupObserver]);

  const handleTabChange = useCallback((tab: FeedTab) => {
    setActiveTab(tab);
  }, [setActiveTab]);

  const handleFABClick = useCallback(() => {
    navigate('/community/create');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* Full-bleed: negate Layout <main> padding (px-4 sm:px-6 lg:px-8 py-8) */}
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-[#1a1a2e]">커뮤니티</h1>
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-gray-100 transition-colors"
              aria-label="검색"
            >
              <Search size={20} className="text-[#1a1a2e]" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
          {FEED_TABS.map((tab) => (
            <button
              key={tab.key}
              className={cn(
                'px-4 py-2 rounded-full whitespace-nowrap text-sm border-none cursor-pointer transition-colors',
                activeTab === tab.key
                  ? 'bg-[#65D9AC] text-white font-medium'
                  : 'bg-gray-100 text-[#6B7280]'
              )}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed content */}
      <div className="pb-24">
        {loading ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#9CA3AF]">
            <UsersIcon size={48} className="mb-4" />
            <p className="text-lg">게시물이 없습니다</p>
            <p className="text-sm mt-1">
              {activeTab === 'following'
                ? '팔로우한 유저의 게시물이 여기에 표시됩니다'
                : '첫 번째 게시물을 작성해보세요'}
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={likePost}
                onBookmark={bookmarkPost}
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-[#65D9AC] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="text-center py-6 text-sm text-[#9CA3AF]">
                모든 게시물을 확인했습니다
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB Button */}
      <button
        onClick={handleFABClick}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#65D9AC] text-white shadow-lg flex items-center justify-center border-none cursor-pointer hover:brightness-95 active:scale-95 transition-all z-40"
        aria-label="게시물 작성"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
};

// ============================================================================
// Skeleton
// ============================================================================

const FeedSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
        <Skeleton className="w-full aspect-[4/3]" />
        <div className="px-4 py-3 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

export default CommunityFeedPage;
