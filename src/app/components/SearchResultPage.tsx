import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { ArrowLeft, SlidersHorizontal, Search, Loader2 } from "lucide-react";
import { Button } from "@heroui/react";
import { ProductCard } from "./ProductCard";
import FilterSheet, { DEFAULT_FILTERS } from "./FilterSheet";
import { getRoutines, type PriceRange } from "@/lib/api/routines";
import { routineToTodoTemplate } from "@/lib/api/routine-adapter";
import { cn } from "./ui/utils";
import type { FilterOptions, SortOption } from "./FilterSheet";
import type { TodoTemplate } from "../data";

// ============================================================================
// Constants
// ============================================================================

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

// ============================================================================
// Helpers
// ============================================================================

function mapPriceRange(range: string | null): PriceRange | undefined {
  if (!range) return undefined;
  switch (range) {
    case "free": return "free";
    case "0-5000": return "under5000";
    case "0-10000": return "under10000";
    case "10000-": return "over10000";
    default: return undefined;
  }
}

// ============================================================================
// Component
// ============================================================================

export function SearchResultPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category") ?? "";

  const [searchInput, setSearchInput] = useState(query);
  const [filters, setFilters] = useState<FilterOptions>(() => ({
    categories: categoryParam ? [categoryParam] : [],
    priceRange: null,
    sort: "popular",
  }));
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TodoTemplate[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Apply search + filters via API
  const applySearch = useCallback(
    (q: string, filterOpts: FilterOptions) => {
      setLoading(true);

      const apiCategory = filterOpts.categories.length === 1 ? filterOpts.categories[0] : undefined;
      const apiPriceRange = mapPriceRange(filterOpts.priceRange);

      getRoutines({
        search: q.trim() || undefined,
        category: apiCategory,
        sort: filterOpts.sort,
        priceRange: apiPriceRange,
        limit: PAGE_SIZE,
      })
        .then(({ data, count }) => {
          setResults(data.map(routineToTodoTemplate));
          setTotalCount(count);
        })
        .catch(() => {
          setResults([]);
          setTotalCount(0);
        })
        .finally(() => setLoading(false));
    },
    []
  );

  // Run search on mount and when params change
  useEffect(() => {
    applySearch(query, filters);
  }, [query, filters, applySearch]);

  // Debounced search input handler
  const handleInputChange = (value: string) => {
    setSearchInput(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (value.trim()) {
        newParams.set("q", value.trim());
      } else {
        newParams.delete("q");
      }
      setSearchParams(newParams, { replace: true });
    }, DEBOUNCE_MS);
  };

  // Handle search submit (Enter key)
  const handleSearchSubmit = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set("q", searchInput.trim());

      // Save to localStorage recent searches
      saveRecentSearch(searchInput.trim());
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams, { replace: true });
    inputRef.current?.blur();
  };

  // Apply filters from FilterSheet
  const handleFilterApply = (newFilters: FilterOptions) => {
    setFilters(newFilters);

    // Update URL params for category
    const newParams = new URLSearchParams(searchParams);
    if (newFilters.categories.length === 1) {
      newParams.set("category", newFilters.categories[0]);
    } else {
      newParams.delete("category");
    }
    setSearchParams(newParams, { replace: true });
  };

  // Count active filters
  const activeFilterCount =
    filters.categories.length +
    (filters.priceRange ? 1 : 0) +
    (filters.sort !== "popular" ? 1 : 0);

  return (
    <div className="pb-8">
      {/* Top bar: Back + Search + Filter */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            placeholder="루틴을 검색해보세요"
            className="w-full h-12 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#65D9AC] transition-colors"
            autoFocus
          />
        </div>

        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="relative h-12 w-12 flex items-center justify-center bg-white border border-gray-200 rounded-xl cursor-pointer transition-all hover:bg-gray-50 shrink-0"
          aria-label="필터 열기"
        >
          <SlidersHorizontal className="w-5 h-5 text-gray-500" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#65D9AC] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {(filters.categories.length > 0 || filters.priceRange) && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {filters.categories.map((cat) => (
            <span
              key={cat}
              className="px-3 py-1.5 rounded-full bg-[#65D9AC]/10 text-[#65D9AC] text-xs font-medium whitespace-nowrap"
            >
              {cat}
            </span>
          ))}
          {filters.priceRange && (
            <span className="px-3 py-1.5 rounded-full bg-[#65D9AC]/10 text-[#65D9AC] text-xs font-medium whitespace-nowrap">
              {getPriceRangeLabel(filters.priceRange)}
            </span>
          )}
        </div>
      )}

      {/* Result count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {query && (
            <span>
              <span className="font-medium text-gray-900">"{query}"</span> 검색 결과{" "}
            </span>
          )}
          <span className="font-medium text-gray-900">{totalCount}</span>개
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#65D9AC] animate-spin" />
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Search className="w-12 h-12 mb-4" />
          <p className="text-lg mb-2">검색 결과가 없습니다</p>
          <p className="text-sm text-gray-400">다른 키워드나 필터로 검색해보세요</p>
        </div>
      )}

      {/* Filter Sheet */}
      <FilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        initialFilters={filters}
        onApply={handleFilterApply}
        resultCount={totalCount}
      />
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getPriceRangeLabel(value: string): string {
  const map: Record<string, string> = {
    free: "무료",
    "0-5000": "~5,000원",
    "0-10000": "~10,000원",
    "10000-": "10,000원~",
  };
  return map[value] ?? value;
}

const RECENT_SEARCH_KEY = "htb_recent_searches";
const MAX_RECENT_SEARCHES = 10;

function saveRecentSearch(keyword: string) {
  try {
    const stored = localStorage.getItem(RECENT_SEARCH_KEY);
    let searches: string[] = stored ? JSON.parse(stored) : [];
    // Remove duplicates, add to front
    searches = [keyword, ...searches.filter((s) => s !== keyword)].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(searches));
  } catch {
    // localStorage failure: ignore
  }
}
