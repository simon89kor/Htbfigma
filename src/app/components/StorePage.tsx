import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, Sparkles, Plus } from "lucide-react";
import { Link } from "react-router";
import { Input, Button, Chip } from "@heroui/react";
import { products, categories } from "../data";
import { ProductCard } from "./ProductCard";

export function StorePage() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high" | "rating">("popular");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const sortLabels: Record<typeof sortBy, string> = {
    popular: "인기순",
    "price-low": "낮은 가격순",
    "price-high": "높은 가격순",
    rating: "평점순",
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products
    .filter((p) => {
      const matchesCategory = selectedCategory === "전체" || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.includes(searchQuery);
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low": return a.price - b.price;
        case "price-high": return b.price - a.price;
        case "rating": return b.rating - a.rating;
        default: return b.reviews - a.reviews;
      }
    });

  return (
    <div>
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Input
          placeholder="To-Do 리스트 검색..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<Search className="w-5 h-5 text-default-400" />}
          variant="bordered"
          radius="lg"
          classNames={{
            inputWrapper: "border-default-200 bg-white h-12",
          }}
          className="flex-1"
        />
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="h-12 flex items-center gap-2 px-4 bg-white border border-default-200 rounded-xl cursor-pointer transition-all hover:bg-default-50"
          >
            <SlidersHorizontal className="w-5 h-5 text-default-500" />
            <span className="text-sm text-default-700 whitespace-nowrap">{sortLabels[sortBy]}</span>
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-14 bg-white border border-default-200 rounded-xl shadow-lg z-50 min-w-[160px] py-2">
              {(Object.entries(sortLabels) as [typeof sortBy, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                  className={"w-full text-left px-4 py-3 text-base cursor-pointer transition-colors " + (sortBy === key ? "bg-primary-50 text-primary font-semibold" : "text-default-700 hover:bg-default-100")}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-default-500 text-lg mb-2">검색 결과가 없습니다</p>
          <p className="text-default-400 text-sm">다른 키워드로 검색해보세요</p>
        </div>
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
