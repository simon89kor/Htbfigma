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
} from "lucide-react";
import { Button, Avatar } from "@heroui/react";
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

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(19,214,128,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

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

  // Atmospheric glow from product's brand color
  useEffect(() => {
    if (product?.color) {
      document.documentElement.style.setProperty('--page-glow-color', hexToRgba(product.color, 0.38));
    }
    return () => {
      document.documentElement.style.removeProperty('--page-glow-color');
    };
  }, [product?.color]);

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
        <p className="text-foreground/60 text-lg">상품을 찾을 수 없습니다</p>
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

  const lightColors = ["#FFD24F", "#B1F1B8", "#C3DF13", "#87CEEB", "#98D8C8"];
  const isLightColor = lightColors.includes(product.color);
  const accentText = isLightColor ? "#1a1a2e" : "white";

  // Glass card style shared across all content cards
  const glassCard: React.CSSProperties = {
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: '20px',
  };

  return (
    // Break out of layout's max-w / px padding to go full-bleed
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 pb-24 relative">

      {/* ── Hero background image (fixed, hero height only) ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '68vh',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <ImageWithFallback
          src={product.image}
          alt=""
          className="w-full h-full object-cover object-top"
        />
        {/* Color tint overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 100% 50% at 50% 0%, ${hexToRgba(product.color, 0.15)} 0%, transparent 60%)`,
          }}
        />
        {/* Gradient: clear at top → opaque dark at bottom */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: [
              'linear-gradient(to bottom,',
              '  rgba(10,10,26,0.20) 0%,',
              '  rgba(10,10,26,0.05) 20%,',
              '  rgba(10,10,26,0.30) 50%,',
              '  rgba(10,10,26,0.80) 72%,',
              '  rgba(10,10,26,1.00) 100%',
              ')',
            ].join(' '),
          }}
        />
        {/* Blur layer at the bottom edge — fades in via mask */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '35%',
            backdropFilter: 'blur(16px) saturate(130%)',
            WebkitBackdropFilter: 'blur(16px) saturate(130%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 50%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 50%, black 100%)',
          }}
        />
      </div>
      {/* Dark fill below the image area */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '68vh',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          backgroundColor: 'rgba(10,10,26,1)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Scrollable content (above fixed bg) ── */}
      <div className="relative" style={{ zIndex: 2 }}>

        {/* Hero spacer — the image shows through here */}
        <div className="h-[52vh] sm:h-[58vh] relative">
          {/* Top overlay bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-9 h-9 rounded-full cursor-pointer border-none"
              style={{ ...glassCard, borderRadius: '50%', background: 'rgba(0,0,0,0.35)' }}
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLikeToggle}
                className="flex items-center justify-center w-9 h-9 rounded-full cursor-pointer border-none"
                style={{ ...glassCard, borderRadius: '50%', background: 'rgba(0,0,0,0.35)' }}
                aria-label={isLiked ? "좋아요 취소" : "좋아요"}
              >
                <Heart className={cn("w-4 h-4 transition-colors", isLiked ? "fill-red-500 text-red-500" : "text-white")} />
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center w-9 h-9 rounded-full cursor-pointer border-none"
                style={{ ...glassCard, borderRadius: '50%', background: 'rgba(0,0,0,0.35)' }}
                aria-label="공유하기"
              >
                <Share2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Glass content section ── */}
        <div className="px-4 sm:px-6 max-w-2xl mx-auto lg:max-w-5xl space-y-3 pb-6">

          {/* Title card */}
          <div style={glassCard} className="p-5 sm:p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {product.tags.map((tag, index) => (
                <span
                  key={tag}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={
                    index === 0
                      ? { backgroundColor: product.color, color: accentText }
                      : { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }
                  }
                >
                  {index === 0 ? `${getCategoryEmoji(product.category)} ${tag}` : tag}
                </span>
              ))}
            </div>
            <h1 className="text-white text-[26px] sm:text-3xl font-bold leading-tight mb-3">{product.name}</h1>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "fill-white/15 text-white/15"}`} />
                ))}
              </div>
              <span className="text-sm text-white font-medium">{product.rating}</span>
              <span className="text-xs text-white/50">({product.reviews}개의 리뷰)</span>
            </div>
          </div>

          {/* Author + Price card */}
          <div style={glassCard} className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              {product.author && product.authorId ? (
                <Link to={`/provider/${product.authorId}`} className="flex items-center gap-3 no-underline group flex-1 min-w-0">
                  <Avatar
                    className="w-10 h-10 shrink-0"
                    showFallback
                    fallback={<User className="w-5 h-5" style={{ color: product.color }} />}
                    style={{ backgroundColor: product.color + "30" }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-white font-semibold group-hover:text-[#65D9AC] transition-colors truncate">{product.author}</p>
                    <p className="text-xs text-white/50 truncate">{product.authorSubtitle}</p>
                  </div>
                </Link>
              ) : <div />}
              <div className="shrink-0 text-right">
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-2xl text-white font-bold">₩{product.price.toLocaleString()}</span>
                </div>
                {product.originalPrice && (
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className="text-xs text-white/40 line-through">₩{product.originalPrice.toLocaleString()}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/80 text-white">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description card */}
          <div style={glassCard} className="p-5">
            <p className="text-sm text-white/80 leading-relaxed">
              {showFullDesc ? product.longDescription : truncatedDesc}
              {product.longDescription.length > 120 && (
                <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-white/50 font-semibold ml-1 bg-transparent border-none cursor-pointer p-0 text-sm hover:text-white/80 transition-colors">
                  {showFullDesc ? "접기" : "더 보기"}
                </button>
              )}
            </p>
          </div>

          {/* Duration + Features card */}
          <div style={glassCard} className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: product.color + "25" }}>
                <Calendar className="w-4 h-4" style={{ color: product.color }} />
              </div>
              <div>
                <p className="text-sm text-white font-medium">총 {formatDuration(product.durationDays)} ({product.durationDays}일)</p>
                <p className="text-xs text-white/50">매일 할 일이 제공됩니다</p>
              </div>
            </div>
            <div className="h-px bg-white/8" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="w-4 h-4" style={{ color: product.color }} />
                <span className="text-sm text-white font-semibold">주요 기능</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {product.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-white/65 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#65D9AC] shrink-0" />{feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day Planner card */}
          <div style={glassCard} className="overflow-hidden">
            <div className="px-5 pt-4 pb-3" style={{ background: `linear-gradient(135deg, ${product.color}88 0%, ${product.color}55 100%)`, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-sm font-bold text-white">{product.name}</p>
              <p className="text-xs text-white/50">{formatDuration(product.durationDays)} 루틴 · 미리보기</p>
            </div>
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollDays("left")}
                  disabled={dayRange[0] <= 1}
                  className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border-none disabled:opacity-30 transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <div ref={dayScrollRef} className="flex-1 flex gap-1.5 justify-center">
                  {dayRange.map((day) => {
                    const isSelected = day === selectedDay;
                    const hasPlan = product.dayPlans.some((dp) => dp.day === day);
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className="flex flex-col items-center justify-center min-w-[40px] h-[50px] rounded-xl transition-all cursor-pointer border-none text-center"
                        style={
                          isSelected
                            ? { backgroundColor: product.color, color: accentText }
                            : { background: 'rgba(255,255,255,0.07)', color: hasPlan ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' }
                        }
                      >
                        <span className="text-[14px] font-bold leading-tight">{day}</span>
                        <span className="text-[8px] leading-tight opacity-60">{dayLabels[(day - 1) % 7]}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => scrollDays("right")}
                  disabled={dayRange[dayRange.length - 1] >= totalDays}
                  className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border-none disabled:opacity-30 transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-[11px] text-white/40 text-center mt-2">Day {selectedDay} / {totalDays}</p>
            </div>
            {currentDayPlan && (
              <div className="px-5 pb-2">
                <p className="text-xs text-white/50 font-medium">{currentDayPlan.title}</p>
              </div>
            )}
            <div className="px-5 pb-5">
              {currentDayPlan ? (
                <div>
                  {currentDayPlan.items.map((item, index) => {
                    const isPreview = index >= 3 && !purchased;
                    return (
                      <div key={index}>
                        <div className={`flex items-center gap-3 py-2.5 ${isPreview ? "opacity-35 select-none" : ""}`}>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white/25 shrink-0" />
                          <span className="flex-1 text-sm text-white/85 font-medium">{isPreview ? blurText(item) : item}</span>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: product.color }} />
                        </div>
                        {index < currentDayPlan.items.length - 1 && <div className="h-px bg-white/6 ml-6" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-white/40 text-sm">이 날의 루틴 정보가 없습니다</div>
              )}
            </div>
            {/* Stats strip */}
            <div className="grid grid-cols-3 divide-x divide-white/8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { label: '총 일수', value: `${product.durationDays}일` },
                { label: '총 할 일', value: `${product.dayPlans.reduce((s, dp) => s + dp.items.length, 0)}개` },
                { label: '일 평균', value: `${Math.round(product.dayPlans.reduce((s, dp) => s + dp.items.length, 0) / product.dayPlans.length)}개` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center py-3 gap-0.5">
                  <span className="text-[11px] text-white/40">{label}</span>
                  <span className="text-sm text-white font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews card */}
          <div style={glassCard} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">리뷰 ({reviewCount > 0 ? reviewCount : product.reviews})</h3>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-white">{product.rating}</span>
              </div>
            </div>
            {reviews.length > 0 ? (
              <>
                <div className="space-y-3">
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="p-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar
                          className="w-8 h-8"
                          src={review.profiles?.avatar_url || undefined}
                          showFallback
                          fallback={<User className="w-4 h-4 text-white/50" />}
                          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{review.profiles?.nickname ?? "익명"}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < Math.floor(review.rating) ? "fill-amber-400 text-amber-400" : "fill-white/10 text-white/10"}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-white/40">{new Date(review.created_at).toLocaleDateString("ko-KR")}</span>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed">{review.content}</p>
                    </div>
                  ))}
                </div>
                {reviews.length > 3 && !showAllReviews && (
                  <button
                    type="button"
                    onClick={() => setShowAllReviews(true)}
                    className="w-full mt-3 py-3 text-sm text-white/50 font-medium cursor-pointer hover:text-white/80 transition-colors rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    리뷰 더보기 ({reviews.length - 3}개 더)
                  </button>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-white/40 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Star className="w-7 h-7 mx-auto mb-2" />
                <p className="text-sm">아직 리뷰가 없습니다</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Sticky Bottom Action Bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          background: 'rgba(10,10,26,0.82)',
          borderTop: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="text-white/35 text-[11px] leading-tight hidden sm:block">
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
                <Button startContent={<Check className="w-4 h-4" />} className="font-bold" style={{ backgroundColor: product.color, color: accentText }}>장바구니 확인</Button>
              </Link>
            ) : (
              <Button
                startContent={<ShoppingCart className="w-4 h-4" />}
                className="font-bold"
                style={{ backgroundColor: product.color, color: accentText }}
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
