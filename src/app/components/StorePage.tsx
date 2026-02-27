import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, Sparkles, Plus, X, Clock, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button, Chip } from "@heroui/react";
import { categories } from "../data";
import type { TodoTemplate } from "../data";
import { getRoutines } from "@/lib/api/routines";
import { routineToTodoTemplate } from "@/lib/api/routine-adapter";
import { ProductCard } from "./ProductCard";
import BannerCarousel from "./BannerCarousel";
import { getTrendingKeywords } from "@/lib/api/search";
import { cn } from "./ui/utils";

// ============================================================================
// Constants
// ============================================================================

const RECENT_SEARCH_KEY = "htb_recent_searches";
const MAX_RECENT_SEARCHES = 10;

// Sort 매핑: 프런트 → API
const SORT_MAP = {
  popular: "popular",
  "price-low": "price_asc",
  "price-high": "price_desc",
  rating: "rating",
} as const;

// ============================================================================
// Helpers
// ============================================================================

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCH_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(keyword: string) {
  try {
    const stored = localStorage.getItem(RECENT_SEARCH_KEY);
    let searches: string[] = stored ? JSON.parse(stored) : [];
    searches = [keyword, ...searches.filter((s) => s !== keyword)].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(searches));
  } catch {
    // localStorage failure: ignore
  }
}

function clearAllRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCH_KEY);
  } catch {
    // ignore
  }
}

function removeRecentSearch(keyword: string) {
  try {
    const stored = localStorage.getItem(RECENT_SEARCH_KEY);
    let searches: string[] = stored ? JSON.parse(stored) : [];
    searches = searches.filter((s) => s !== keyword);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(searches));
  } catch {
    // ignore
  }
}

// ============================================================================
// Component
// ============================================================================

export function StorePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high" | "rating">("popular");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Product data from DB
  const [products, setProducts] = useState<TodoTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Search mode state
  const [searchMode, setSearchMode] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const sortLabels: Record<typeof sortBy, string> = {
    popular: "인기순",
    "price-low": "낮은 가격순",
    "price-high": "높은 가격순",
    rating: "평점순",
  };

  // Fetch routines from DB
  useEffect(() => {
    setLoading(true);
    getRoutines({
      category: selectedCategory !== "전체" ? selectedCategory : undefined,
      sort: SORT_MAP[sortBy],
    })
      .then(({ data }) => setProducts(data.map(routineToTodoTemplate)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [selectedCategory, sortBy]);

  // Close sort menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load recent searches and trending keywords when search mode opens
  useEffect(() => {
    if (searchMode) {
      setRecentSearches(getRecentSearches());
      searchInputRef.current?.focus();

      // Fetch trending keywords
      getTrendingKeywords(10)
        .then((data) => {
          setTrendingKeywords(data.map((k) => k.keyword));
        })
        .catch(() => {
          // Fallback trending keywords
          setTrendingKeywords(["홈트레이닝", "다이어트 식단", "아침 루틴", "수능 공부", "습관 형성"]);
        });
    }
  }, [searchMode]);

  // Close search mode on outside click
  useEffect(() => {
    if (!searchMode) return;
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchMode(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchMode]);

  // Execute search: navigate to SearchResultPage
  const executeSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setSearchMode(false);
    setSearchInput("");
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  // Handle recent search delete
  const handleDeleteRecentSearch = (keyword: string) => {
    removeRecentSearch(keyword);
    setRecentSearches((prev) => prev.filter((s) => s !== keyword));
  };

  // Handle clear all recent searches
  const handleClearAllRecent = () => {
    clearAllRecentSearches();
    setRecentSearches([]);
  };

  return (
    <div>
      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Hero Section */}
      <div className="bg-[#1a1a2e] rounded-3xl p-8 sm:p-12 mb-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-[#6C5CE7]" />
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-[#65D9AC]" />
          <div className="absolute top-20 right-40 w-20 h-20 rounded-full bg-[#6C5CE7]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[#65D9AC]" />
            <span className="text-[#65D9AC] text-sm font-medium">프리미엄 To-Do 리스트 마켓</span>
          </div>
          <h1 className="text-white mb-3 text-[28px] sm:text-[36px] leading-tight font-bold">
            나에게 딱 맞는 To-Do 리스트를
            <br />
            찾아보세요
          </h1>
          <p className="text-white/50 max-w-lg text-[15px] leading-relaxed">
            전문가가 설계한 다양한 To-Do 리스트 템플릿을 구매하고, 바로 사용해보세요.
            7일부터 100일까지, 나에게 딱 맞는 기간의 루틴을 찾아보세요.
          </p>
        </div>
      </div>

      {/* Search Bar (enhanced with search mode) */}
      <div className="relative mb-8" ref={searchContainerRef}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input area */}
          <div className="relative flex-1">
            {searchMode ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") executeSearch(searchInput);
                    if (e.key === "Escape") setSearchMode(false);
                  }}
                  placeholder="루틴을 검색해보세요"
                  className="w-full h-12 pl-10 pr-10 bg-white border-2 border-[#65D9AC] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode(false);
                    setSearchInput("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-transparent border-none cursor-pointer"
                  aria-label="검색 닫기"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchMode(true)}
                className="w-full h-12 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-400 text-left cursor-pointer hover:border-gray-300 transition-colors relative"
                aria-label="검색 모드 진입"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                루틴을 검색해보세요
              </button>
            )}
          </div>

          {/* Sort button (hidden in search mode on mobile) */}
          {!searchMode && (
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="h-12 flex items-center gap-2 px-4 bg-white border border-gray-200 rounded-xl cursor-pointer transition-all hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700 whitespace-nowrap">{sortLabels[sortBy]}</span>
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-14 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[160px] py-2">
                  {(Object.entries(sortLabels) as [typeof sortBy, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-base cursor-pointer transition-colors border-none bg-transparent",
                        sortBy === key ? "bg-[#65D9AC]/10 text-[#65D9AC] font-semibold" : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search mode dropdown */}
        {searchMode && (
          <div className="absolute left-0 right-0 top-14 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 max-h-[60vh] overflow-y-auto">
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <section className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">최근 검색어</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAllRecent}
                    className="text-xs text-gray-400 bg-transparent border-none cursor-pointer p-0 hover:text-gray-600"
                  >
                    전체삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((keyword) => (
                    <div key={keyword} className="flex items-center gap-1 group">
                      <button
                        type="button"
                        onClick={() => executeSearch(keyword)}
                        className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 border-none cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                        {keyword}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecentSearch(keyword);
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200"
                        aria-label={`${keyword} 삭제`}
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trending keywords */}
            {trendingKeywords.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[#65D9AC]" />
                  <span className="text-sm font-semibold text-gray-900">인기 검색어</span>
                </div>
                <div className="space-y-1">
                  {trendingKeywords.map((keyword, index) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => executeSearch(keyword)}
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 bg-transparent border-none cursor-pointer transition-colors text-left"
                    >
                      <span className={cn(
                        "w-6 text-center text-sm font-bold",
                        index < 3 ? "text-[#65D9AC]" : "text-gray-400"
                      )}>
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{keyword}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {recentSearches.length === 0 && trendingKeywords.length === 0 && (
              <div className="py-8 text-center text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">검색어를 입력해보세요</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <Chip
            key={category}
            variant={selectedCategory === category ? "solid" : "bordered"}
            color={selectedCategory === category ? "primary" : "default"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Chip>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-2">검색 결과가 없습니다</p>
              <p className="text-gray-400 text-sm">다른 키워드로 검색해보세요</p>
            </div>
          )}
        </>
      )}

      {/* Create Custom Routine CTA */}
      <div className="mt-12 bg-[#1a1a2e] rounded-2xl p-8 sm:p-10 text-center">
        <h2 className="text-white text-xl sm:text-2xl mb-2 font-bold">
          나만의 루틴이 필요하신가요?
        </h2>
        <p className="text-white/40 text-sm mb-6 max-w-md mx-auto leading-relaxed">
          직접 카테고리, 기한, 컬러를 설정하고 나만의 To-Do 리스트를 만들어보세요.
          캘린더 기반으로 일별 할 일을 자유롭게 작성할 수 있습니다.
        </p>
        <Link to="/create-routine" className="no-underline">
          <Button
            color="success"
            variant="solid"
            startContent={<Plus className="w-5 h-5" />}
            size="lg"
            className="font-semibold text-[#1a1a2e]"
          >
            나만의 루틴 만들기
          </Button>
        </Link>
      </div>
    </div>
  );
}
