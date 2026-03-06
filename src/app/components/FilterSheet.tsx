import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { RotateCcw } from "lucide-react";
import { Button } from "@heroui/react";
import { cn } from "./ui/utils";

// ============================================================================
// Types
// ============================================================================

export interface FilterOptions {
  categories: string[];
  priceRange: string | null;
  sort: SortOption;
}

export type SortOption = "popular" | "latest" | "price_asc" | "rating";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFilters: FilterOptions;
  onApply: (filters: FilterOptions) => void;
  resultCount?: number;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORIES = ["운동", "라이프스타일", "교육", "비즈니스", "여행", "건강", "자기개발", "생산성"];

const PRICE_RANGES = [
  { label: "무료", value: "free" },
  { label: "~5,000", value: "0-5000" },
  { label: "~10,000", value: "0-10000" },
  { label: "10,000~", value: "10000-" },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "인기순", value: "popular" },
  { label: "최신순", value: "latest" },
  { label: "가격낮은순", value: "price_asc" },
  { label: "리뷰많은순", value: "rating" },
];

const DEFAULT_FILTERS: FilterOptions = {
  categories: [],
  priceRange: null,
  sort: "popular",
};

// ============================================================================
// Component
// ============================================================================

const FilterSheet = ({ open, onOpenChange, initialFilters, onApply, resultCount }: FilterSheetProps) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  // Sync when opened
  useEffect(() => {
    if (open) {
      setFilters(initialFilters);
    }
  }, [open, initialFilters]);

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const setPriceRange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: prev.priceRange === value ? null : value,
    }));
  };

  const setSort = (value: SortOption) => {
    setFilters((prev) => ({ ...prev, sort: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleApply = () => {
    onApply(filters);
    onOpenChange(false);
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceRange !== null ||
    filters.sort !== "popular";

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-50 max-h-[85vh] flex flex-col">
          {/* Drag handle */}
          <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full my-3 shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4 shrink-0">
            <Drawer.Title className="text-lg font-bold text-foreground">필터</Drawer.Title>
            <button
              type="button"
              onClick={resetFilters}
              className={cn(
                "flex items-center gap-1.5 text-sm border-none bg-transparent cursor-pointer p-0",
                hasActiveFilters ? "text-[#65D9AC]" : "text-foreground/50"
              )}
              aria-label="필터 초기화"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-5 pb-4">
            {/* Category Section */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">카테고리</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer",
                      filters.categories.includes(cat)
                        ? "bg-[#65D9AC] text-white border-[#65D9AC]"
                        : "bg-white/8 text-foreground/80 border-white/10 hover:bg-white/5"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* Price Range Section */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">가격대</h3>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => setPriceRange(range.value)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer",
                      filters.priceRange === range.value
                        ? "bg-[#65D9AC] text-white border-[#65D9AC]"
                        : "bg-white/8 text-foreground/80 border-white/10 hover:bg-white/5"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Sort Section */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">정렬</h3>
              <div className="flex flex-col gap-2">
                {SORT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 py-2 cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        filters.sort === option.value
                          ? "border-[#65D9AC]"
                          : "border-white/20"
                      )}
                    >
                      {filters.sort === option.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#65D9AC]" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        filters.sort === option.value
                          ? "text-foreground font-medium"
                          : "text-foreground/80"
                      )}
                    >
                      {option.label}
                    </span>
                    <input
                      type="radio"
                      name="sort"
                      value={option.value}
                      checked={filters.sort === option.value}
                      onChange={() => setSort(option.value)}
                      className="sr-only"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Bottom action bar */}
          <div className="px-5 py-4 border-t border-white/10 shrink-0 safe-area-pb">
            <Button
              className="w-full h-[52px] bg-[#65D9AC] text-white rounded-xl text-lg font-semibold"
              onPress={handleApply}
            >
              {resultCount !== undefined
                ? `적용하기 (${resultCount.toLocaleString()}개 결과)`
                : "적용하기"}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export { DEFAULT_FILTERS };
export default FilterSheet;
