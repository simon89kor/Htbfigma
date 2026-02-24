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
    <div className="group bg-white rounded-2xl overflow-hidden border border-black/[0.06] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-1 flex flex-col" style={{boxShadow: 'var(--shadow-card)'}}>
      {/* Image */}
      <Link to={`/product/${product.id}`} className="no-underline">
        <div className="relative h-48 overflow-hidden">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.originalPrice && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-lg text-[12px] font-medium">
              {Math.round(
                ((product.originalPrice - product.price) / product.originalPrice) * 100
              )}
              % OFF
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <div
              className="px-2.5 py-1 rounded-lg text-[12px] text-white backdrop-blur-sm font-medium"
              style={{ backgroundColor: product.color }}
            >
              {product.category}
            </div>
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[12px]">
            <Calendar className="w-3 h-3" />
            {formatDuration(product.durationDays)}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <Link to={`/product/${product.id}`} className="no-underline text-inherit">
          <h3 className="text-[#1a1a2e] mb-1 group-hover:text-[#6C5CE7] transition-colors text-[15px] font-semibold">
            {product.name}
          </h3>
          <p className="text-[#6b6b80] text-[13px] mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </Link>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-md bg-[#f0f0f4] text-[#6b6b80]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-4">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-[13px] text-[#1a1a2e] font-medium">{product.rating}</span>
          <span className="text-[12px] text-[#6b6b80]">({product.reviews})</span>
        </div>

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] text-[#1a1a2e] font-bold">
              ₩{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-[13px] text-[#6b6b80] line-through">
                ₩{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {purchased ? (
            <Link
              to="/my-lists"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#65D9AC]/10 text-[#3dba8a] rounded-xl text-[13px] no-underline hover:bg-[#65D9AC]/20 transition-colors font-medium"
            >
              <Check className="w-4 h-4" />
              사용하기
            </Link>
          ) : inCart ? (
            <Link
              to="/cart"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#f4f3ff] text-[#6C5CE7] rounded-xl text-[13px] no-underline hover:bg-[#ece9ff] transition-colors font-medium"
            >
              <Check className="w-4 h-4" />
              담김
            </Link>
          ) : (
            <button
              onClick={() => addToCart(product)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a2e] text-white rounded-xl text-[13px] hover:bg-[#2a2a3e] transition-colors cursor-pointer border-none font-medium"
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
