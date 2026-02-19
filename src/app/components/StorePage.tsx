import { useState } from "react";
import { Search, SlidersHorizontal, Sparkles, Calendar, Plus } from "lucide-react";
import { Link } from "react-router";
import { products, categories } from "../data";
import { ProductCard } from "./ProductCard";

export function StorePage() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high" | "rating">(
    "popular"
  );

  const filteredProducts = products
    .filter((p) => {
      const matchesCategory =
        selectedCategory === "전체" || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.includes(searchQuery);
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        default:
          return b.reviews - a.reviews;
      }
    });

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-8 sm:p-12 mb-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white" />
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white" />
          <div className="absolute top-20 right-40 w-20 h-20 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <span className="text-violet-200 text-[14px]">프리미엄 To-Do 리스트 마켓</span>
          </div>
          <h1 className="text-white mb-3 text-[28px] sm:text-[36px]">
            나에게 딱 맞는 To-Do 리스트를
            <br />
            찾아보세요
          </h1>
          <p className="text-violet-200 max-w-lg text-[15px]">
            전문가가 설계한 다양한 To-Do 리스트 템플릿을 구매하고, 바로 사용해보세요.
            7일부터 100일까지, 나에게 딱 맞는 기간의 루틴을 찾아보세요.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="To-Do 리스트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="pl-10 pr-8 py-3 bg-white border border-gray-200 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
          >
            <option value="popular">인기순</option>
            <option value="price-low">낮은 가격순</option>
            <option value="price-high">높은 가격순</option>
            <option value="rating">평점순</option>
          </select>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer text-[14px] ${
              selectedCategory === category
                ? "bg-violet-600 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-[18px] mb-2">검색 결과가 없습니다</p>
          <p className="text-gray-400 text-[14px]">다른 키워드로 검색해보세요</p>
        </div>
      )}

      {/* Create Custom Routine CTA */}
      <div className="mt-12 bg-[#212422] rounded-2xl p-8 sm:p-10 text-center">
        <h2 className="text-white text-[20px] sm:text-[24px] mb-2">
          나만의 루틴이 필요하신가요?
        </h2>
        <p className="text-gray-400 text-[14px] mb-6 max-w-md mx-auto">
          직접 카테고리, 기한, 컬러를 설정하고 나만의 To-Do 리스트를 만들어보세요.
          캘린더 기반으로 일별 할 일을 자유롭게 작성할 수 있습니다.
        </p>
        <Link
          to="/create-routine"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#B1F1B8] text-[#212422] rounded-xl no-underline hover:bg-[#9FE0A6] transition-colors text-[15px] font-semibold"
        >
          <Plus className="w-5 h-5" />
          나만의 루틴 만들기
        </Link>
      </div>
    </div>
  );
}