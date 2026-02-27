import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { cn } from './ui/utils';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '../auth-context';
import {
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  isFollowing as checkIsFollowing,
} from '@/lib/api/profiles';
import { toast } from 'sonner';
import type { Profile } from '@/lib/database.types';

// ============================================================================
// Constants
// ============================================================================

const FOLLOW_TABS = [
  { key: 'followers', label: '팔로워' },
  { key: 'following', label: '팔로잉' },
] as const;

type FollowTab = (typeof FOLLOW_TABS)[number]['key'];

// ============================================================================
// Types
// ============================================================================

interface FollowUserItem {
  id: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  isFollowing: boolean;
  isProvider: boolean;
}

// ============================================================================
// Component
// ============================================================================

const FollowingPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<FollowTab>('followers');

  // Data state
  const [followers, setFollowers] = useState<FollowUserItem[]>([]);
  const [following, setFollowing] = useState<FollowUserItem[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followLoadingIds, setFollowLoadingIds] = useState<Set<string>>(new Set());

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // ========================================================================
  // Data Loading
  // ========================================================================

  const mapProfileToFollowUser = useCallback(
    (profile: Profile, isFollowingUser: boolean): FollowUserItem => ({
      id: profile.id,
      nickname: profile.nickname,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      isFollowing: isFollowingUser,
      isProvider: profile.role === 'provider',
    }),
    []
  );

  const loadFollowers = useCallback(async () => {
    if (!user) return;
    try {
      const result = await getFollowers(user.id, { limit: 100 });
      setFollowerCount(result.count);

      // Check follow status for each follower
      const items: FollowUserItem[] = await Promise.all(
        result.data.map(async (profile) => {
          let isFollowingUser = false;
          try {
            isFollowingUser = await checkIsFollowing(user.id, profile.id);
          } catch {
            // Ignore individual check errors
          }
          return mapProfileToFollowUser(profile, isFollowingUser);
        })
      );

      setFollowers(items);
    } catch {
      toast.error('팔로워를 불러오지 못했습니다');
    }
  }, [user, mapProfileToFollowUser]);

  const loadFollowing = useCallback(async () => {
    if (!user) return;
    try {
      const result = await getFollowing(user.id, { limit: 100 });
      setFollowingCount(result.count);

      const items: FollowUserItem[] = result.data.map((profile) =>
        mapProfileToFollowUser(profile, true)
      );

      setFollowing(items);
    } catch {
      toast.error('팔로잉을 불러오지 못했습니다');
    }
  }, [user, mapProfileToFollowUser]);

  useEffect(() => {
    if (!user) return;

    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadFollowers(), loadFollowing()]);
      setLoading(false);
    };

    loadAll();
  }, [user, loadFollowers, loadFollowing]);

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleToggleFollow = useCallback(
    async (targetUserId: string, currentlyFollowing: boolean) => {
      if (!user) return;

      setFollowLoadingIds((prev) => new Set(prev).add(targetUserId));

      try {
        if (currentlyFollowing) {
          await unfollowUser(user.id, targetUserId);
          toast.success('팔로우를 취소했습니다');
        } else {
          await followUser(user.id, targetUserId);
          toast.success('팔로우했습니다');
        }

        // Update local state
        const updateList = (list: FollowUserItem[]): FollowUserItem[] =>
          list.map((item) =>
            item.id === targetUserId
              ? { ...item, isFollowing: !currentlyFollowing }
              : item
          );

        setFollowers(updateList);
        setFollowing((prev) => {
          if (currentlyFollowing) {
            // Remove from following list
            const updated = prev.filter((item) => item.id !== targetUserId);
            setFollowingCount(updated.length);
            return updated;
          } else {
            // We need to re-fetch the following list to get the updated data
            return updateList(prev);
          }
        });

        // Update counts
        if (currentlyFollowing) {
          setFollowingCount((prev) => Math.max(0, prev - 1));
        } else {
          setFollowingCount((prev) => prev + 1);
        }
      } catch {
        toast.error('요청을 처리하지 못했습니다');
      } finally {
        setFollowLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      }
    },
    [user]
  );

  const handleUserTap = useCallback(
    (userId: string) => {
      navigate(`/user/${userId}`);
    },
    [navigate]
  );

  // ========================================================================
  // Derived Data
  // ========================================================================

  const currentList = activeTab === 'followers' ? followers : following;

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const query = searchQuery.trim().toLowerCase();
    return currentList.filter(
      (item) =>
        item.nickname.toLowerCase().includes(query) ||
        item.bio.toLowerCase().includes(query)
    );
  }, [currentList, searchQuery]);

  // ========================================================================
  // Auth Guard
  // ========================================================================

  if (!isLoggedIn || !user) {
    navigate('/login?redirect=/following', { replace: true });
    return null;
  }

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="min-h-screen bg-white -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={22} className="text-[#1a1a2e]" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-[#1a1a2e]">
            {user.name || '프로필'}
          </h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB]">
        {FOLLOW_TABS.map((tab) => {
          const count = tab.key === 'followers' ? followerCount : followingCount;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchQuery('');
              }}
              className={cn(
                'flex-1 py-3 text-sm font-semibold text-center transition-colors relative',
                activeTab === tab.key
                  ? 'text-[#65D9AC]'
                  : 'text-[#6B7280]'
              )}
            >
              {tab.label} {count > 0 && <span>{count}</span>}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#65D9AC]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F5] rounded-xl text-sm text-[#1a1a2e] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#65D9AC]/30"
          />
        </div>
      </div>

      {/* List */}
      <div className="px-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
            <Users size={48} className="mb-4 text-gray-300" />
            <p className="text-sm">
              {searchQuery
                ? '검색 결과가 없습니다'
                : activeTab === 'followers'
                  ? '아직 팔로워가 없습니다'
                  : '아직 팔로잉한 사용자가 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredList.map((item) => {
              const isMe = item.id === user.id;
              const isButtonLoading = followLoadingIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-3 rounded-xl hover:bg-gray-50 transition-colors px-1 cursor-pointer"
                >
                  {/* Avatar */}
                  <button
                    onClick={() => handleUserTap(item.id)}
                    className="flex-shrink-0"
                    aria-label={`${item.nickname} 프로필 보기`}
                  >
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.nickname}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#65D9AC]/20 flex items-center justify-center text-[#65D9AC] font-bold text-lg">
                        {item.nickname.charAt(0)}
                      </div>
                    )}
                  </button>

                  {/* User Info */}
                  <button
                    onClick={() => handleUserTap(item.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[#1a1a2e] truncate">
                        {item.nickname}
                      </span>
                      {item.isProvider && (
                        <span className="px-1.5 py-0.5 bg-[#6C5CE7]/10 text-[#6C5CE7] text-[10px] font-bold rounded">
                          Provider
                        </span>
                      )}
                    </div>
                    {item.bio && (
                      <p className="text-xs text-[#6B7280] truncate mt-0.5">{item.bio}</p>
                    )}
                  </button>

                  {/* Follow/Unfollow Button */}
                  {!isMe && (
                    <button
                      onClick={() => handleToggleFollow(item.id, item.isFollowing)}
                      disabled={isButtonLoading}
                      className={cn(
                        'flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                        item.isFollowing
                          ? 'bg-[#F5F5F5] text-[#6B7280] hover:bg-gray-200'
                          : 'bg-[#65D9AC] text-white hover:bg-[#56c99b]',
                        isButtonLoading && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {isButtonLoading
                        ? '...'
                        : item.isFollowing
                          ? '팔로잉'
                          : '팔로우'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingPage;
