import { Link } from "react-router";
import { Star, ShoppingCart, Check, Calendar } from "lucide-react";
import { TodoTemplate } from "../data";
import { useStore } from "../store-context";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductCardProps {
  product: TodoTemplate;
}

function formatDuration(days: number): string {
  if (days % 7 === 0 && days <= 28) return `${days / 7}주`;
  return `${days}일`;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isInCart, isPurchased } = useStore();
  const inCart = isInCart(product.id);
  const purchased = isPurchased(product.id);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="no-underline">
        <div className="relative h-48 overflow-hidden">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.originalPrice && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-lg text-[13px]">
              {Math.round(
                ((product.originalPrice - product.price) / product.originalPrice) * 100
              )}
              % OFF
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <div
              className="px-2.5 py-1 rounded-lg text-[13px] text-white backdrop-blur-sm"
              style={{ backgroundColor: product.color }}
            >
              {product.category}
            </div>
          </div>
          {/* Duration badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[12px]">
            <Calendar className="w-3 h-3" />
            {formatDuration(product.durationDays)}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <Link to={`/product/${product.id}`} className="no-underline text-inherit">
          <h3 className="text-[#1a1a2e] mb-1 group-hover:text-violet-600 transition-colors text-[16px]">
            {product.name}
          </h3>
          <p className="text-gray-500 text-[14px] mb-3 line-clamp-2">
            {product.description}
          </p>
        </Link>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-4">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-[14px] text-gray-700">{product.rating}</span>
          <span className="text-[13px] text-gray-400">({product.reviews})</span>
        </div>

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[20px] text-[#1a1a2e]">
              ₩{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-[14px] text-gray-400 line-through">
                ₩{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {purchased ? (
            <Link
              to="/my-lists"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-50 text-green-600 rounded-xl text-[14px] no-underline hover:bg-green-100 transition-colors"
            >
              <Check className="w-4 h-4" />
              사용하기
            </Link>
          ) : inCart ? (
            <Link
              to="/cart"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-50 text-violet-600 rounded-xl text-[14px] no-underline hover:bg-violet-100 transition-colors"
            >
              <Check className="w-4 h-4" />
              담김
            </Link>
          ) : (
            <button
              onClick={() => addToCart(product)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-[14px] hover:bg-violet-700 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              담기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
