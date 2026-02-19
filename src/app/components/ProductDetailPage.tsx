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

  // Reset selected day when product changes
  useEffect(() => {
    setSelectedDay(1);
    setShowFullDesc(false);
  }, [id]);

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-[18px]">상품을 찾을 수 없습니다</p>
        <Link
          to="/"
          className="text-violet-600 hover:text-violet-700 mt-4 inline-block no-underline"
        >
          스토어로 돌아가기
        </Link>
      </div>
    );
  }

  const inCart = isInCart(product.id);
  const purchased = isPurchased(product.id);

  const currentDayPlan = product.dayPlans.find((dp) => dp.day === selectedDay);

  // Calculate visible day range for the selector
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
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <ArrowLeft className="w-5 h-5" />
        뒤로가기
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Hero Image + Info */}
        <div className="lg:col-span-2">
          {/* Hero Image with colored background */}
          <div
            className="relative rounded-2xl overflow-hidden mb-6"
            style={{ backgroundColor: product.color + "20" }}
          >
            <div className="relative">
              {/* Colored circle decoration */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full opacity-30"
                style={{ backgroundColor: product.color }}
              />
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-[300px] sm:h-[380px] object-cover relative z-10"
              />
            </div>
          </div>

          {/* Author info */}
          {product.author && (
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: product.color + "30" }}
              >
                <User className="w-5 h-5" style={{ color: product.color }} />
              </div>
              <div>
                <p className="text-[14px] text-[#212422] font-medium">
                  {product.author}
                </p>
                <p className="text-[12px] text-gray-400">{product.authorSubtitle}</p>
              </div>
            </div>
          )}

          {/* Title & Subtitle */}
          <h1 className="text-[#212422] text-[24px] mb-4 leading-tight">
            {product.name}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {product.tags.map((tag, index) => (
              <span
                key={tag}
                className={`px-2.5 py-1.5 rounded text-[12px] font-medium ${
                  index === 0
                    ? "text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
                style={
                  index === 0
                    ? { backgroundColor: "#212422", color: product.color }
                    : {}
                }
              >
                {index === 0 ? `${getCategoryEmoji(product.category)} ${tag}` : tag}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-[14px] text-[#212422] leading-relaxed mb-2">
            {showFullDesc ? product.longDescription : truncatedDesc}
            {product.longDescription.length > 120 && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="text-gray-400 font-semibold ml-1 bg-transparent border-none cursor-pointer p-0 text-[14px]"
              >
                {showFullDesc ? "접기" : "더 보기"}
              </button>
            )}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4 mt-6">
            <span className="text-[28px] text-[#212422] font-bold">
              ₩{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-[16px] text-gray-400 line-through">
                  ₩{product.originalPrice.toLocaleString()}
                </span>
                <span className="text-red-500 text-[14px] font-medium">
                  {Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
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
            <span className="text-[14px] text-gray-600">{product.rating}</span>
            <span className="text-[13px] text-gray-400">
              ({product.reviews}개의 리뷰)
            </span>
          </div>

          {/* Features */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-[#212422] mb-3 flex items-center gap-2 text-[16px]">
              <ListChecks className="w-5 h-5 text-violet-500" />
              주요 기능
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {product.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-gray-600 text-[14px]"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Duration info */}
          <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-xl">
            <Calendar className="w-5 h-5 text-violet-500" />
            <div>
              <p className="text-[14px] text-[#212422] font-medium">
                총 {formatDuration(product.durationDays)} ({product.durationDays}일)
              </p>
              <p className="text-[12px] text-gray-400">
                매일 할 일이 제공됩니다
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Day Selector + Preview Items */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
            {/* Preview Header */}
            <div
              className="px-6 pt-5 pb-4"
              style={{ backgroundColor: product.color }}
            >
              <h2
                className="text-[18px] font-bold mb-1"
                style={{
                  color: ["#FFD24F", "#B1F1B8", "#C3DF13", "#87CEEB", "#98D8C8"].includes(product.color)
                    ? "#212422"
                    : "white",
                }}
              >
                {product.name}
              </h2>
              <p
                className="text-[12px] opacity-70"
                style={{
                  color: ["#FFD24F", "#B1F1B8", "#C3DF13", "#87CEEB", "#98D8C8"].includes(product.color)
                    ? "#212422"
                    : "white",
                }}
              >
                {formatDuration(product.durationDays)} 루틴 | 미리보기
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mx-6" />

            {/* Day Selector */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollDays("left")}
                  disabled={dayRange[0] <= 1}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 bg-transparent border-none cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div
                  ref={dayScrollRef}
                  className="flex-1 flex gap-1.5 justify-center"
                >
                  {dayRange.map((day) => {
                    const isSelected = day === selectedDay;
                    const hasPlan = product.dayPlans.some((dp) => dp.day === day);
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`flex flex-col items-center justify-center min-w-[42px] h-[52px] rounded-md transition-all cursor-pointer border-none text-center ${
                          isSelected
                            ? "text-white"
                            : hasPlan
                            ? "bg-gray-50 text-[#212422] hover:bg-gray-100"
                            : "bg-gray-50 text-[#212422] opacity-30"
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: "#212422" }
                            : {}
                        }
                      >
                        <span
                          className={`text-[15px] font-bold leading-tight ${
                            isSelected ? "text-white" : ""
                          }`}
                        >
                          {day}
                        </span>
                        <span
                          className={`text-[8px] leading-tight ${
                            isSelected
                              ? "text-white/50"
                              : "text-[#212422] opacity-30"
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
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 bg-transparent border-none cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day indicator */}
              <p className="text-[12px] text-gray-400 text-center mt-2">
                Day {selectedDay} / {totalDays}
              </p>
            </div>

            {/* Day Title */}
            {currentDayPlan && (
              <div className="px-6 pb-3">
                <p className="text-[14px] text-gray-500 font-medium">
                  {currentDayPlan.title}
                </p>
              </div>
            )}

            {/* Todo Items Preview */}
            <div className="px-6 pb-6">
              {currentDayPlan ? (
                <div className="space-y-0">
                  {currentDayPlan.items.map((item, index) => {
                    // Show first 3 items fully, blur the rest for preview
                    const isPreview = index >= 3 && !purchased;
                    return (
                      <div key={index}>
                        <div
                          className={`flex items-center gap-3 py-3 ${
                            isPreview ? "opacity-40 select-none" : ""
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                          <span className="flex-1 text-[15px] text-[#212422] font-medium">
                            {isPreview ? blurText(item) : item}
                          </span>
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: product.color }}
                          />
                        </div>
                        {index < currentDayPlan.items.length - 1 && (
                          <div className="h-px bg-gray-100 ml-7" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-gray-400 text-[14px]">
                  <p>이 날의 루틴 정보가 없습니다</p>
                </div>
              )}
            </div>

            {/* All days summary */}
            <div className="px-6 pb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-gray-500">총 일수</span>
                  <span className="text-[13px] text-[#212422] font-medium">
                    {product.durationDays}일
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-gray-500">총 할 일</span>
                  <span className="text-[13px] text-[#212422] font-medium">
                    {product.dayPlans.reduce((sum, dp) => sum + dp.items.length, 0)}개
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-500">일 평균</span>
                  <span className="text-[13px] text-[#212422] font-medium">
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#212422] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="text-[#aaaaaf] text-[11px] leading-tight hidden sm:block">
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
                className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-[#212422] rounded font-bold no-underline hover:bg-green-400 transition-colors text-[15px]"
              >
                <Check className="w-4 h-4" />
                사용하기
              </Link>
            ) : inCart ? (
              <Link
                to="/cart"
                className="flex items-center gap-2 px-6 py-2.5 rounded font-bold no-underline transition-colors text-[15px]"
                style={{ backgroundColor: product.color, color: "#212422" }}
              >
                <Check className="w-4 h-4" />
                장바구니 확인
              </Link>
            ) : (
              <button
                onClick={() => addToCart(product)}
                className="flex items-center gap-2 px-6 py-2.5 rounded font-bold cursor-pointer transition-colors text-[15px] border-none"
                style={{ backgroundColor: product.color, color: "#212422" }}
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