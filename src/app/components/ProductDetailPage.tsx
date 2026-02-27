import { useParams, Link, useNavigate } from "react-router";
import { useState, useRef, useEffect } from "react";
import {
  Star,
  ShoppingCart,
  Check,
  ArrowLeft,
  CheckCircle2,
  ListChecks,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Heart,
  Share2,
  ChevronDown,
} from "lucide-react";
import { Button, Card, CardBody, Chip, Avatar } from "@heroui/react";
import { toast } from "sonner";
import type { TodoTemplate } from "../data";
import { useStore } from "../store-context";
import { useAuth } from "../auth-context";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getRoutine, getRoutineReviews } from "@/lib/api/routines";
import { routineToTodoTemplate } from "@/lib/api/routine-adapter";
import { isRoutineLiked, toggleRoutineLike } from "@/lib/api/routine-likes";
import { cn } from "./ui/utils";
import { Loader2 } from "lucide-react";

// ============================================================================
// Helpers
// ============================================================================

function formatDuration(days: number): string {
  if (days === 7) return "1주일";
  if (days === 14) return "2주";
  if (days === 21) return "3주";
  if (days === 28) return "4주";
  if (days === 30) return "1개월";
  if (days === 60) return "2개월";
  if (days === 90) return "3개월";
  return `${days}일`;
}

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

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart, isPurchased } = useStore();
  const { isLoggedIn } = useAuth();
  const [selectedDay, setSelectedDay] = useState(1);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  // Product data from DB
  const [product, setProduct] = useState<TodoTemplate | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // New states for enhanced features
  const [isLiked, setIsLiked] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (!id) return;
    setPageLoading(true);
    setSelectedDay(1);
    setShowFullDesc(false);
    setShowAllReviews(false);

    // Fetch routine detail from DB
    getRoutine(id)
      .then((data) => setProduct(routineToTodoTemplate(data)))
      .catch(() => setProduct(null))
      .finally(() => setPageLoading(false));

    // Check like status from server
    if (isLoggedIn) {
      isRoutineLiked(id).then(setIsLiked).catch(() => setIsLiked(false));
    }

    // Fetch reviews from API
    getRoutineReviews(id, { limit: 10 })
      .then((data) => {
        setReviews(data.data as unknown as ReviewItem[]);
        setReviewCount(data.count);
      })
      .catch(() => {
        setReviews([]);
        setReviewCount(0);
      });
  }, [id]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#65D9AC] animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">상품을 찾을 수 없습니다</p>
        <Link to="/" className="text-[#6C5CE7] hover:underline mt-4 inline-block no-underline">
          스토어로 돌아가기
        </Link>
      </div>
    );
  }

  const inCart = isInCart(product.id);
  const purchased = isPurchased(product.id);
  const currentDayPlan = product.dayPlans.find((dp) => dp.day === selectedDay);
  const totalDays = product.durationDays;
  const visibleDays = Math.min(7, totalDays);
  const dayPageStart = Math.max(1, Math.min(selectedDay - Math.floor(visibleDays / 2), totalDays - visibleDays + 1));
  const dayRange = Array.from({ length: visibleDays }, (_, i) => dayPageStart + i);
  const dayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const scrollDays = (direction: "left" | "right") => {
    if (direction === "left" && selectedDay > 1) setSelectedDay(Math.max(1, selectedDay - 7));
    else if (direction === "right" && selectedDay < totalDays) setSelectedDay(Math.min(totalDays, selectedDay + 7));
  };

  const truncatedDesc = product.longDescription.length > 120 ? product.longDescription.slice(0, 120) + "..." : product.longDescription;

  // Like toggle handler (server-side via routine_likes table)
  const handleLikeToggle = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    // Optimistic update
    const prevState = isLiked;
    setIsLiked(!prevState);
    try {
      const newState = await toggleRoutineLike(product.id);
      setIsLiked(newState);
      toast.success(newState ? "좋아요를 눌렀습니다" : "좋아요를 취소했습니다");
    } catch {
      setIsLiked(prevState);
      toast.error("좋아요 처리에 실패했습니다");
    }
  };

  // Share handler
  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: product.description,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("링크가 복사되었습니다");
      }
    } catch {
      // Share cancelled or failed
    }
  };

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <div className="pb-24">
      {/* Top bar with back, like, share */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-5 h-5" />}
          onPress={() => navigate(-1)}
          className="text-gray-500"
          size="sm"
        >
          뒤로가기
        </Button>
        <div className="flex items-center gap-1">
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={handleLikeToggle}
            aria-label={isLiked ? "좋아요 취소" : "좋아요"}
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                isLiked ? "fill-red-500 text-red-500" : "text-gray-400"
              )}
            />
          </Button>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={handleShare}
            aria-label="공유하기"
          >
            <Share2 className="w-5 h-5 text-gray-400" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <div className="relative rounded-2xl overflow-hidden mb-6" style={{ backgroundColor: product.color + "15" }}>
            <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full opacity-20" style={{ backgroundColor: product.color }} />
              <ImageWithFallback src={product.image} alt={product.name} className="w-full h-[300px] sm:h-[380px] object-cover relative z-10" />
            </div>
          </div>

          {/* Provider link (enhanced) */}
          {product.author && product.authorId && (
            <Link
              to={`/provider/${product.authorId}`}
              className="flex items-center gap-3 mb-4 p-3 rounded-xl hover:bg-gray-50 transition-colors no-underline group"
            >
              <Avatar
                className="w-10 h-10"
                showFallback
                fallback={<User className="w-5 h-5" style={{ color: product.color }} />}
                style={{ backgroundColor: product.color + "20" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium group-hover:text-[#65D9AC] transition-colors">
                  {product.author}
                </p>
                <p className="text-xs text-gray-500">{product.authorSubtitle}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
            </Link>
          )}

          <h1 className="text-gray-900 text-2xl mb-4 leading-tight font-bold">{product.name}</h1>

          <div className="flex flex-wrap gap-2 mb-5">
            {product.tags.map((tag, index) => (
              <Chip
                key={tag}
                variant={index === 0 ? "solid" : "flat"}
                color={index === 0 ? "primary" : "default"}
                size="sm"
                style={index === 0 ? { backgroundColor: "#1a1a2e", color: product.color } : {}}
              >
                {index === 0 ? `${getCategoryEmoji(product.category)} ${tag}` : tag}
              </Chip>
            ))}
          </div>

          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            {showFullDesc ? product.longDescription : truncatedDesc}
            {product.longDescription.length > 120 && (
              <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-gray-500 font-semibold ml-1 bg-transparent border-none cursor-pointer p-0 text-sm">
                {showFullDesc ? "접기" : "더 보기"}
              </button>
            )}
          </p>

          <div className="flex items-baseline gap-3 mb-4 mt-6">
            <span className="text-[28px] text-gray-900 font-bold">₩{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <>
                <span className="text-base text-gray-400 line-through">₩{product.originalPrice.toLocaleString()}</span>
                <Chip color="danger" size="sm" variant="flat">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% 할인
                </Chip>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
              ))}
            </div>
            <span className="text-sm text-gray-900">{product.rating}</span>
            <span className="text-[13px] text-gray-500">({product.reviews}개의 리뷰)</span>
          </div>

          <Card shadow="none" className="bg-gray-100 mb-6">
            <CardBody className="p-5 gap-3">
              <h3 className="text-gray-900 flex items-center gap-2 text-base font-semibold">
                <ListChecks className="w-5 h-5 text-[#6C5CE7]" />주요 기능
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {product.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-gray-500 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#65D9AC] shrink-0" />{feature}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card shadow="none" className="bg-gray-100 mb-6">
            <CardBody className="flex-row items-center gap-3 p-4">
              <Calendar className="w-5 h-5 text-[#6C5CE7]" />
              <div>
                <p className="text-sm text-gray-900 font-medium">총 {formatDuration(product.durationDays)} ({product.durationDays}일)</p>
                <p className="text-xs text-gray-500">매일 할 일이 제공됩니다</p>
              </div>
            </CardBody>
          </Card>

          {/* Review Section */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                리뷰 ({reviewCount > 0 ? reviewCount : product.reviews})
              </h3>
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-base font-semibold text-gray-900">{product.rating}</span>
              </div>
            </div>

            {reviews.length > 0 ? (
              <>
                <div className="space-y-3">
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar
                          className="w-8 h-8"
                          src={review.profiles?.avatar_url || undefined}
                          showFallback
                          fallback={<User className="w-4 h-4 text-gray-400" />}
                          style={{ backgroundColor: "#e5e7eb" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {review.profiles?.nickname ?? "익명"}
                          </p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(review.rating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {review.content}
                      </p>
                    </div>
                  ))}
                </div>

                {reviews.length > 3 && !showAllReviews && (
                  <button
                    type="button"
                    onClick={() => setShowAllReviews(true)}
                    className="w-full mt-3 py-3 text-sm text-gray-500 font-medium bg-transparent border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    리뷰 더보기 ({reviews.length - 3}개 더)
                  </button>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl">
                <Star className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">아직 리뷰가 없습니다</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3">
          <Card shadow="sm" className="sticky top-24 overflow-hidden">
            <div className="px-6 pt-5 pb-4" style={{ backgroundColor: product.color }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: ["#FFD24F", "#B1F1B8", "#C3DF13", "#87CEEB", "#98D8C8"].includes(product.color) ? "#1a1a2e" : "white" }}>
                {product.name}
              </h2>
              <p className="text-xs opacity-70" style={{ color: ["#FFD24F", "#B1F1B8", "#C3DF13", "#87CEEB", "#98D8C8"].includes(product.color) ? "#1a1a2e" : "white" }}>
                {formatDuration(product.durationDays)} 루틴 | 미리보기
              </p>
            </div>

            <CardBody className="p-0">
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-center gap-2">
                  <Button isIconOnly size="sm" variant="light" onPress={() => scrollDays("left")} isDisabled={dayRange[0] <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div ref={dayScrollRef} className="flex-1 flex gap-1.5 justify-center">
                    {dayRange.map((day) => {
                      const isSelected = day === selectedDay;
                      const hasPlan = product.dayPlans.some((dp) => dp.day === day);
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          className={`flex flex-col items-center justify-center min-w-[42px] h-[52px] rounded-lg transition-all cursor-pointer border-none text-center ${
                            isSelected ? "bg-primary text-white" : hasPlan ? "bg-gray-100 text-gray-900 hover:bg-gray-200" : "bg-gray-100 text-gray-900 opacity-30"
                          }`}
                        >
                          <span className="text-[15px] font-bold leading-tight">{day}</span>
                          <span className={`text-[8px] leading-tight ${isSelected ? "text-white/50" : "text-gray-400"}`}>{dayLabels[(day - 1) % 7]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <Button isIconOnly size="sm" variant="light" onPress={() => scrollDays("right")} isDisabled={dayRange[dayRange.length - 1] >= totalDays}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">Day {selectedDay} / {totalDays}</p>
              </div>

              {currentDayPlan && (
                <div className="px-6 pb-3">
                  <p className="text-sm text-gray-500 font-medium">{currentDayPlan.title}</p>
                </div>
              )}

              <div className="px-6 pb-6">
                {currentDayPlan ? (
                  <div className="space-y-0">
                    {currentDayPlan.items.map((item, index) => {
                      const isPreview = index >= 3 && !purchased;
                      return (
                        <div key={index}>
                          <div className={`flex items-center gap-3 py-3 ${isPreview ? "opacity-40 select-none" : ""}`}>
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                            <span className="flex-1 text-sm text-gray-900 font-medium">{isPreview ? blurText(item) : item}</span>
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: product.color }} />
                          </div>
                          {index < currentDayPlan.items.length - 1 && <div className="h-px bg-gray-100 ml-7" />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500 text-sm"><p>이 날의 루틴 정보가 없습니다</p></div>
                )}
              </div>

              <div className="px-6 pb-6">
                <Card shadow="none" className="bg-gray-100">
                  <CardBody className="p-4 gap-2">
                    <div className="flex items-center justify-between"><span className="text-[13px] text-gray-500">총 일수</span><span className="text-[13px] text-gray-900 font-medium">{product.durationDays}일</span></div>
                    <div className="flex items-center justify-between"><span className="text-[13px] text-gray-500">총 할 일</span><span className="text-[13px] text-gray-900 font-medium">{product.dayPlans.reduce((sum, dp) => sum + dp.items.length, 0)}개</span></div>
                    <div className="flex items-center justify-between"><span className="text-[13px] text-gray-500">일 평균</span><span className="text-[13px] text-gray-900 font-medium">{Math.round(product.dayPlans.reduce((sum, dp) => sum + dp.items.length, 0) / product.dayPlans.length)}개</span></div>
                  </CardBody>
                </Card>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1a1a2e] shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="text-white/40 text-[11px] leading-tight hidden sm:block">
            <p className="mb-0">{product.author ? `${product.author}의 ${formatDuration(product.durationDays)} 루틴이 궁금하다면?` : `${formatDuration(product.durationDays)} 루틴으로 시작해보세요`}</p>
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <span className="text-white text-lg font-bold">₩{product.price.toLocaleString()}</span>
            {purchased ? (
              <Link to="/my-lists" className="no-underline">
                <Button color="success" startContent={<Check className="w-4 h-4" />} className="font-bold">사용하기</Button>
              </Link>
            ) : inCart ? (
              <Link to="/cart" className="no-underline">
                <Button startContent={<Check className="w-4 h-4" />} className="font-bold" style={{ backgroundColor: product.color, color: "#1a1a2e" }}>장바구니 확인</Button>
              </Link>
            ) : (
              <Button
                startContent={<ShoppingCart className="w-4 h-4" />}
                className="font-bold"
                style={{ backgroundColor: product.color, color: "#1a1a2e" }}
                onPress={() => addToCart(product)}
              >
                내 루틴에 추가하기
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = { "운동": "💪", "라이프스타일": "🌅", "교육": "📚", "비즈니스": "🚀", "여행": "✈️", "건강": "🥗", "자기개발": "🧠", "생산성": "⚡" };
  return map[category] || "📋";
}

function blurText(text: string): string {
  return text.replace(/[가-힣a-zA-Z0-9]/g, "●");
}
