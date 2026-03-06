import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Star,
  User,
  Loader2,
  Users,
  ShoppingBag,
} from "lucide-react";
import { Button, Avatar } from "@heroui/react";
import { toast } from "sonner";
import { ProductCard } from "./ProductCard";
import { useAuth } from "../auth-context";
import { getProfile, followUser, unfollowUser, isFollowing as checkIsFollowing } from "@/lib/api/profiles";
import { getRoutinesByAuthor, getRoutineReviews } from "@/lib/api/routines";
import { routineToTodoTemplate } from "@/lib/api/routine-adapter";
import type { Profile } from "@/lib/database.types";
import type { TodoTemplate } from "../data";

// ============================================================================
// Types
// ============================================================================

interface ReviewItem {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  profiles: {
    nickname: string;
    avatar_url: string;
  } | null;
}

// ============================================================================
// Component
// ============================================================================

export function ProviderProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [routines, setRoutines] = useState<TodoTemplate[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [isFollowingState, setIsFollowingState] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  // Fetch provider data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Try fetching from Supabase
        const [profileData, routinesData] = await Promise.all([
          getProfile(id),
          getRoutinesByAuthor(id, { limit: 20 }),
        ]);

        setProfile(profileData);
        setFollowerCount(profileData.follower_count);

        // Convert DB routines to TodoTemplate format for ProductCard reuse
        if (routinesData.data.length > 0) {
          setRoutines(routinesData.data.map(routineToTodoTemplate));

          // Fetch reviews from the first routine as sample
          try {
            const reviewData = await getRoutineReviews(routinesData.data[0].id, { limit: 5 });
            setReviews(reviewData.data as unknown as ReviewItem[]);
            setReviewCount(reviewData.count);

            // Calculate average rating from all routines
            const totalRating = routinesData.data.reduce((sum, r) => sum + r.rating, 0);
            setAvgRating(routinesData.data.length > 0 ? totalRating / routinesData.data.length : 0);
          } catch {
            // Reviews fetch failed
          }
        }

        // Check follow status
        if (isLoggedIn && user) {
          try {
            const following = await checkIsFollowing(user.id, id);
            setIsFollowingState(following);
          } catch {
            // Follow check failed
          }
        }
      } catch {
        // API failed — profile will remain null, showing not-found state
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isLoggedIn, user]);

  // Follow toggle handler
  const handleFollowToggle = async () => {
    if (!isLoggedIn || !user) {
      navigate("/login");
      return;
    }
    if (!id || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowingState) {
        const result = await unfollowUser(user.id, id);
        setIsFollowingState(false);
        setFollowerCount(result.followerCount);
        toast.success("팔로우를 취소했습니다");
      } else {
        const result = await followUser(user.id, id);
        setIsFollowingState(true);
        setFollowerCount(result.followerCount);
        toast.success("팔로우했습니다");
      }
    } catch {
      toast.error("오류가 발생했습니다");
    } finally {
      setFollowLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#65D9AC] animate-spin" />
      </div>
    );
  }

  // Not found
  if (!profile) {
    return (
      <div className="text-center py-20">
        <User className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
        <p className="text-foreground/60 text-lg mb-2">프로필을 찾을 수 없습니다</p>
        <Link to="/" className="text-[#65D9AC] hover:underline text-sm">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const totalSales = routines.reduce((sum, r) => sum + (r.reviews ?? 0), 0);

  return (
    <div className="pb-8">
      {/* Back button */}
      <Button
        variant="light"
        startContent={<ArrowLeft className="w-5 h-5" />}
        onPress={() => navigate(-1)}
        className="mb-4 text-foreground/60"
        size="sm"
      >
        뒤로가기
      </Button>

      {/* Profile Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        {/* Cover image / gradient */}
        <div
          className="h-32 sm:h-40 bg-gradient-to-br from-[#1a1a2e] to-[#6C5CE7]"
          style={
            profile.cover_image_url
              ? {
                  backgroundImage: `url(${profile.cover_image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Avatar + info overlay */}
        <div className="relative px-5 -mt-10">
          <div className="flex items-end gap-4">
            <Avatar
              className="w-20 h-20 border-4 border-white shrink-0"
              src={profile.avatar_url || undefined}
              showFallback
              fallback={<User className="w-8 h-8 text-foreground/50" />}
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            />
            <div className="pb-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                {profile.nickname}
              </h1>
              {profile.bio && (
                <p className="text-sm text-foreground/60 line-clamp-2">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 px-1 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-foreground/50" />
          <span className="text-sm text-foreground/80">
            팔로워 <span className="font-semibold text-foreground">{followerCount.toLocaleString()}</span>
          </span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-foreground/50" />
          <span className="text-sm text-foreground/80">
            총 판매 <span className="font-semibold text-foreground">{formatCount(totalSales)}</span>
          </span>
        </div>
      </div>

      {/* Follow button */}
      <div className="mb-8">
        <Button
          className={
            isFollowingState
              ? "w-full h-11 bg-white/5 text-foreground/60 rounded-xl font-semibold"
              : "w-full h-11 bg-[#65D9AC] text-white rounded-xl font-semibold"
          }
          onPress={handleFollowToggle}
          isLoading={followLoading}
        >
          {isFollowingState ? "팔로잉" : "팔로우"}
        </Button>
      </div>

      {/* Provided routines */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4">
          제공 루틴 ({routines.length})
        </h2>
        {routines.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {routines.map((routine) => (
              <ProductCard key={routine.id} product={routine} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-foreground/50">
            <ShoppingBag className="w-10 h-10 mb-3" />
            <p className="text-sm">아직 제공 중인 루틴이 없습니다</p>
          </div>
        )}
      </section>

      {/* Reviews section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            리뷰 ({reviewCount})
          </h2>
          {avgRating > 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-base font-semibold text-foreground">
                {avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 bg-white/5 rounded-xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Avatar
                    className="w-8 h-8"
                    src={review.profiles?.avatar_url || undefined}
                    showFallback
                    fallback={<User className="w-4 h-4 text-foreground/50" />}
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {review.profiles?.nickname ?? "익명"}
                    </p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(review.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-white/20 text-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-foreground/50">
                    {new Date(review.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                  {review.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-foreground/50">
            <Star className="w-10 h-10 mb-3" />
            <p className="text-sm">아직 리뷰가 없습니다</p>
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}
