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
} from "lucide-react";
import { products } from "../data";
import { useStore } from "../store-context";
import { ImageWithFallback } from "./figma/ImageWithFallback";

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

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart, isPurchased } = useStore();
  const [selectedDay, setSelectedDay] = useState(1);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  const product = products.find((p) => p.id === id);

  useEffect(() => {
    setSelectedDay(1);
    setShowFullDesc(false);
  }, [id]);

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-[#6b6b80] text-[18px]">상품을 찾을 수 없습니다</p>
        <Link
          to="/"
          className="text-[#6C5CE7] hover:text-[#5A4BD6] mt-4 inline-block no-underline"
        >
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
  const dayPageStart = Math.max(
    1,
    Math.min(selectedDay - Math.floor(visibleDays / 2), totalDays - visibleDays + 1)
  );
  const dayRange = Array.from({ length: visibleDays }, (_, i) => dayPageStart + i);
  const dayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const scrollDays = (direction: "left" | "right") => {
    if (direction === "left" && selectedDay > 1) {
      setSelectedDay(Math.max(1, selectedDay - 7));
    } else if (direction === "right" && selectedDay < totalDays) {
      setSelectedDay(Math.min(totalDays, selectedDay + 7));
    }
  };

  const truncatedDesc =
    product.longDescription.length > 120
      ? product.longDescription.slice(0, 120) + "..."
      : product.longDescription;

  return (
    <div className="pb-24">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#6b6b80] hover:text-[#1a1a2e] mb-6 transition-colors cursor-pointer bg-transparent border-none p-0 text-[14px]"
      >
        <ArrowLeft className="w-5 h-5" />
        뒤로가기
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <div
            className="relative rounded-2xl overflow-hidden mb-6"
            style={{ backgroundColor: product.color + "15" }}
          >
            <div className="relative">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full opacity-20"
                style={{ backgroundColor: product.color }}
              />
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-[300px] sm:h-[380px] object-cover relative z-10"
              />
            </div>
          </div>

          {/* Author */}
          {product.author && (
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: product.color + "20" }}
              >
                <User className="w-5 h-5" style={{ color: product.color }} />
              </div>
              <div>
                <p className="text-[14px] text-[#1a1a2e] font-medium">
                  {product.author}
                </p>
                <p className="text-[12px] text-[#6b6b80]">{product.authorSubtitle}</p>
              </div>
            </div>
          )}

          <h1 className="text-[#1a1a2e] text-[24px] mb-4 leading-tight font-bold">
            {product.name}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {product.tags.map((tag, index) => (
              <span
                key={tag}
                className={`px-2.5 py-1.5 rounded-lg text-[12px] font-medium ${
                  index === 0
                    ? "text-white"
                    : "bg-[#f0f0f4] text-[#6b6b80]"
                }`}
                style={
                  index === 0
                    ? { backgroundColor: "#1a1a2e", color: product.color }
                    : {}
                }
              >
                {index === 0 ? `${getCategoryEmoji(product.category)} ${tag}` : tag}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-[14px] text-[#1a1a2e] leading-relaxed mb-2">
            {showFullDesc ? product.longDescription : truncatedDesc}
            {product.longDescription.length > 120 && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="text-[#6b6b80] font-semibold ml-1 bg-transparent border-none cursor-pointer p-0 text-[14px]"
              >
                {showFullDesc ? "접기" : "더 보기"}
              </button>
            )}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4 mt-6">
            <span className="text-[28px] text-[#1a1a2e] font-bold">
              ₩{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-[16px] text-[#6b6b80] line-through">
                  ₩{product.originalPrice.toLocaleString()}
                </span>
                <span className="text-red-500 text-[14px] font-medium">
                  {Math.round(
                    ((product.originalPrice - product.price) / product.originalPrice) * 100
                  )}
                  % 할인
                </span>
              </>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[14px] text-[#1a1a2e]">{product.rating}</span>
            <span className="text-[13px] text-[#6b6b80]">
              ({product.reviews}개의 리뷰)
            </span>
          </div>

          {/* Features */}
          <div className="bg-[#f5f5f7] rounded-xl p-5 mb-6">
            <h3 className="text-[#1a1a2e] mb-3 flex items-center gap-2 text-[16px]">
              <ListChecks className="w-5 h-5 text-[#6C5CE7]" />
              주요 기능
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {product.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-[#6b6b80] text-[14px]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#65D9AC] shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3 px-5 py-4 bg-[#f5f5f7] rounded-xl">
            <Calendar className="w-5 h-5 text-[#6C5CE7]" />
            <div>
              <p className="text-[14px] text-[#1a1a2e] font-medium">
                총 {formatDuration(product.durationDays)} ({product.durationDays}일)
              </p>
              <p className="text-[12px] text-[#6b6b80]">
                매일 할 일이 제공됩니다
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden sticky top-24" style={{boxShadow: 'var(--shadow-card)'}}>
            {/* Preview Header */}
            <div
              className="px-6 pt-5 pb-4"
              style={{ backgroundColor: product.color }}
            >
              <h2
                className="text-[18px] font-bold mb-1"
                style={{
                  color: ["#FFD24F", "#B1F1B8", "#C3DF13", "#87CEEB", "#98D8C8"].includes(product.color)
                    ? "#1a1a2e"
                    : "white",
                }}
              >
                {product.name}
              </h2>
              <p
                className="text-[12px] opacity-70"
                style={{
                  color: ["#FFD24F", "#B1F1B8", "#C3DF13", "#87CEEB", "#98D8C8"].includes(product.color)
                    ? "#1a1a2e"
                    : "white",
                }}
              >
                {formatDuration(product.durationDays)} 루틴 | 미리보기
              </p>
            </div>

            <div className="h-px bg-black/[0.04] mx-6" />

            {/* Day Selector */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollDays("left")}
                  disabled={dayRange[0] <= 1}
                  className="p-1 text-[#6b6b80] hover:text-[#1a1a2e] disabled:opacity-30 bg-transparent border-none cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div ref={dayScrollRef} className="flex-1 flex gap-1.5 justify-center">
                  {dayRange.map((day) => {
                    const isSelected = day === selectedDay;
                    const hasPlan = product.dayPlans.some((dp) => dp.day === day);
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`flex flex-col items-center justify-center min-w-[42px] h-[52px] rounded-lg transition-all cursor-pointer border-none text-center ${
                          isSelected
                            ? "bg-[#1a1a2e] text-white"
                            : hasPlan
                            ? "bg-[#f5f5f7] text-[#1a1a2e] hover:bg-[#ebebef]"
                            : "bg-[#f5f5f7] text-[#1a1a2e] opacity-30"
                        }`}
                      >
                        <span className={`text-[15px] font-bold leading-tight`}>
                          {day}
                        </span>
                        <span
                          className={`text-[8px] leading-tight ${
                            isSelected ? "text-white/50" : "text-[#1a1a2e]/30"
                          }`}
                        >
                          {dayLabels[(day - 1) % 7]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => scrollDays("right")}
                  disabled={dayRange[dayRange.length - 1] >= totalDays}
                  className="p-1 text-[#6b6b80] hover:text-[#1a1a2e] disabled:opacity-30 bg-transparent border-none cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[12px] text-[#6b6b80] text-center mt-2">
                Day {selectedDay} / {totalDays}
              </p>
            </div>

            {/* Day Title */}
            {currentDayPlan && (
              <div className="px-6 pb-3">
                <p className="text-[14px] text-[#6b6b80] font-medium">
                  {currentDayPlan.title}
                </p>
              </div>
            )}

            {/* Todo Items Preview */}
            <div className="px-6 pb-6">
              {currentDayPlan ? (
                <div className="space-y-0">
                  {currentDayPlan.items.map((item, index) => {
                    const isPreview = index >= 3 && !purchased;
                    return (
                      <div key={index}>
                        <div
                          className={`flex items-center gap-3 py-3 ${
                            isPreview ? "opacity-40 select-none" : ""
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full border-2 border-[#d0d0d8] shrink-0" />
                          <span className="flex-1 text-[14px] text-[#1a1a2e] font-medium">
                            {isPreview ? blurText(item) : item}
                          </span>
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: product.color }}
                          />
                        </div>
                        {index < currentDayPlan.items.length - 1 && (
                          <div className="h-px bg-black/[0.04] ml-7" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-[#6b6b80] text-[14px]">
                  <p>이 날의 루틴 정보가 없습니다</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="px-6 pb-6">
              <div className="bg-[#f5f5f7] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-[#6b6b80]">총 일수</span>
                  <span className="text-[13px] text-[#1a1a2e] font-medium">
                    {product.durationDays}일
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-[#6b6b80]">총 할 일</span>
                  <span className="text-[13px] text-[#1a1a2e] font-medium">
                    {product.dayPlans.reduce((sum, dp) => sum + dp.items.length, 0)}개
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#6b6b80]">일 평균</span>
                  <span className="text-[13px] text-[#1a1a2e] font-medium">
                    {Math.round(
                      product.dayPlans.reduce((sum, dp) => sum + dp.items.length, 0) /
                        product.dayPlans.length
                    )}
                    개
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1a1a2e] shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="text-white/40 text-[11px] leading-tight hidden sm:block">
            <p className="mb-0">
              {product.author
                ? `${product.author}의 ${formatDuration(product.durationDays)} 루틴이 궁금하다면?`
                : `${formatDuration(product.durationDays)} 루틴으로 시작해보세요`}
            </p>
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <span className="text-white text-[18px] font-bold">
              ₩{product.price.toLocaleString()}
            </span>
            {purchased ? (
              <Link
                to="/my-lists"
                className="flex items-center gap-2 px-6 py-2.5 bg-[#65D9AC] text-[#1a1a2e] rounded-xl font-bold no-underline hover:bg-[#55C99C] transition-colors text-[14px]"
              >
                <Check className="w-4 h-4" />
                사용하기
              </Link>
            ) : inCart ? (
              <Link
                to="/cart"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold no-underline transition-colors text-[14px]"
                style={{ backgroundColor: product.color, color: "#1a1a2e" }}
              >
                <Check className="w-4 h-4" />
                장바구니 확인
              </Link>
            ) : (
              <button
                onClick={() => addToCart(product)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold cursor-pointer transition-colors text-[14px] border-none"
                style={{ backgroundColor: product.color, color: "#1a1a2e" }}
              >
                <ShoppingCart className="w-4 h-4" />
                내 루틴에 추가하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    "운동": "💪",
    "라이프스타일": "🌅",
    "교육": "📚",
    "비즈니스": "🚀",
    "여행": "✈️",
    "건강": "🥗",
    "자기개발": "🧠",
    "생산성": "⚡",
  };
  return map[category] || "📋";
}

function blurText(text: string): string {
  return text.replace(/[가-힣a-zA-Z0-9]/g, "●");
}
