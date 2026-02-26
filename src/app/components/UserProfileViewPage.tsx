import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Grid3X3, ClipboardList, UserPlus, UserCheck } from 'lucide-react';
import { cn } from './ui/utils';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '../auth-context';
import {
  getProfile,
  followUser,
  unfollowUser,
  isFollowing as checkIsFollowing,
} from '@/lib/api/profiles';
import { getPosts, type PostWithAuthor } from '@/lib/api/posts';
import { getUserRoutines, type UserRoutineWithItems } from '@/lib/api/user-routines';
import { toast } from 'sonner';
import type { Profile } from '@/lib/database.types';

// ============================================================================
// Component
// ============================================================================

const UserProfileViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<'posts' | 'routines'>('posts');
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [routines, setRoutines] = useState<UserRoutineWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user?.id === id;

  // Load profile data
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const [profileData, postsData] = await Promise.all([
          getProfile(id),
          getPosts({ authorId: id, sort: 'latest', limit: 50 }),
        ]);
        setProfile(profileData);
        setPosts(postsData.data);

        // Check follow status
        if (user && user.id !== id) {
          const following = await checkIsFollowing(user.id, id);
          setIsFollowingUser(following);
        }
      } catch {
        toast.error('프로필을 불러오지 못했습니다');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load routines when tab switches
  useEffect(() => {
    if (activeViewTab === 'routines' && id && routines.length === 0) {
      getUserRoutines(id, { status: 'active' })
        .then((result) => setRoutines(result.data))
        .catch(() => setRoutines([]));
    }
  }, [activeViewTab, id, routines.length]);

  const handleFollow = useCallback(async () => {
    if (!user || !id || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowingUser) {
        const result = await unfollowUser(user.id, id);
        setIsFollowingUser(false);
        setProfile((prev) =>
          prev ? { ...prev, follower_count: result.followerCount } : prev
        );
        toast.success('언팔로우했습니다');
      } else {
        const result = await followUser(user.id, id);
        setIsFollowingUser(true);
        setProfile((prev) =>
          prev ? { ...prev, follower_count: result.followerCount } : prev
        );
        toast.success('팔로우했습니다');
      }
    } catch {
      toast.error('팔로우 처리에 실패했습니다');
    } finally {
      setFollowLoading(false);
    }
  }, [user, id, isFollowingUser, followLoading]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#9CA3AF]">
        <p className="text-lg">프로필을 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] flex items-center px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-gray-100"
          aria-label="뒤로가기"
        >
          <ArrowLeft size={22} className="text-[#1a1a2e]" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-[#1a1a2e] mr-9">
          {profile.nickname}
        </h1>
      </div>

      {/* Profile info */}
      <div className="px-4 py-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mb-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                {profile.nickname[0]}
              </div>
            )}
          </div>
          <h2 className="text-lg font-bold text-[#1a1a2e]">{profile.nickname}</h2>
          {profile.bio && (
            <p className="text-sm text-[#6B7280] mt-1 text-center max-w-[250px]">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-5">
          <div className="text-center">
            <p className="text-lg font-bold text-[#1a1a2e]">{profile.post_count}</p>
            <p className="text-xs text-[#6B7280]">게시물</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#1a1a2e]">{profile.follower_count}</p>
            <p className="text-xs text-[#6B7280]">팔로워</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#1a1a2e]">{profile.following_count}</p>
            <p className="text-xs text-[#6B7280]">팔로잉</p>
          </div>
        </div>

        {/* Follow button */}
        {!isOwnProfile && user && (
          <div className="flex gap-3 mt-5 px-4">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={cn(
                'flex-1 h-10 rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors flex items-center justify-center gap-2',
                isFollowingUser
                  ? 'bg-gray-100 text-[#6B7280]'
                  : 'bg-[#65D9AC] text-white'
              )}
            >
              {isFollowingUser ? (
                <>
                  <UserCheck size={16} />
                  팔로잉
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  팔로우
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB]">
        <div className="flex">
          <button
            onClick={() => setActiveViewTab('posts')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 border-b-2 bg-transparent cursor-pointer transition-colors',
              activeViewTab === 'posts'
                ? 'border-[#1a1a2e] text-[#1a1a2e]'
                : 'border-transparent text-[#9CA3AF]'
            )}
          >
            <Grid3X3 size={18} />
            <span className="text-sm font-medium">게시물</span>
          </button>
          <button
            onClick={() => setActiveViewTab('routines')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 border-b-2 bg-transparent cursor-pointer transition-colors',
              activeViewTab === 'routines'
                ? 'border-[#1a1a2e] text-[#1a1a2e]'
                : 'border-transparent text-[#9CA3AF]'
            )}
          >
            <ClipboardList size={18} />
            <span className="text-sm font-medium">루틴</span>
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="pb-8">
        {activeViewTab === 'posts' ? (
          posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#9CA3AF]">
              <Grid3X3 size={40} className="mb-3" />
              <p className="text-sm">게시물이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-gray-100 overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/community/${post.id}`)}
                  role="button"
                  tabIndex={0}
                  aria-label="게시물 보기"
                >
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0]}
                      alt="게시물 썸네일"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 p-2 text-center">
                      {post.title || post.content?.substring(0, 30) || '게시물'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : routines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#9CA3AF]">
            <ClipboardList size={40} className="mb-3" />
            <p className="text-sm">루틴이 없습니다</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="flex items-center gap-3 px-4 py-3 border border-[#E5E7EB] rounded-xl"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={18} className="text-[#6B7280]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] truncate">
                    {routine.title}
                  </p>
                  <p className="text-xs text-[#9CA3AF] truncate">
                    {routine.category} · 달성률 {Math.round(routine.completion_rate)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Skeleton
// ============================================================================

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-white -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
    <div className="flex items-center px-4 py-3 border-b border-[#E5E7EB]">
      <Skeleton className="w-9 h-9 rounded-full" />
      <Skeleton className="h-5 w-24 mx-auto" />
    </div>
    <div className="flex flex-col items-center py-6">
      <Skeleton className="w-20 h-20 rounded-full mb-3" />
      <Skeleton className="h-5 w-24 mb-2" />
      <Skeleton className="h-4 w-40" />
    </div>
    <div className="flex justify-center gap-8 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="text-center space-y-1">
          <Skeleton className="h-6 w-10 mx-auto" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-0.5 px-0">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square" />
      ))}
    </div>
  </div>
);

export default UserProfileViewPage;
