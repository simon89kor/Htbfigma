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

  const lightColors = ["#FFD24F", "#B1F1B8", "#C3DF13", "#87CEEB", "#98D8C8"];
  const isLightColor = lightColors.includes(product.color);
  const accentText = isLightColor ? "#1a1a2e" : "white";

  return (
    <div
      className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5"
      style={{
        height: '340px',
        border: `1px solid ${product.color}35`,
        boxShadow: `0 4px 20px ${product.color}18`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${product.color}45`;
        (e.currentTarget as HTMLElement).style.borderColor = `${product.color}60`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${product.color}18`;
        (e.currentTarget as HTMLElement).style.borderColor = `${product.color}35`;
      }}
    >
      {/* Full-bleed background image */}
      <Link to={`/product/${product.id}`} className="no-underline absolute inset-0 block">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Subtle dark gradient so top badges are readable */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 40%, transparent 55%, rgba(0,0,0,0.15) 100%)' }} />
      </Link>

      {/* Top badges */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none z-10">
        {product.originalPrice ? (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </span>
        ) : <span />}
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: product.color, color: accentText }}
        >
          {product.category}
        </span>
      </div>

      {/* Bottom glass panel */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          backdropFilter: 'blur(22px) saturate(160%)',
          WebkitBackdropFilter: 'blur(22px) saturate(160%)',
          background: `linear-gradient(135deg, rgba(10,10,26,0.72) 0%, rgba(10,10,26,0.62) 100%)`,
          borderTop: `1px solid ${product.color}30`,
        }}
      >
        <Link to={`/product/${product.id}`} className="no-underline block px-4 pt-3 pb-1">
          <h3 className="text-white text-[15px] font-bold mb-1 leading-tight line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "fill-white/20 text-white/20"}`} />
              ))}
            </div>
            <span className="text-[11px] text-white/60">{product.rating} ({product.reviews})</span>
            <span className="ml-auto flex items-center gap-1 text-[11px] text-white/50">
              <Calendar className="w-3 h-3" />
              {formatDuration(product.durationDays)}
            </span>
          </div>
        </Link>

        <div className="px-4 pb-3 pt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-bold text-[17px]">₩{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-[12px] text-white/38 line-through">₩{product.originalPrice.toLocaleString()}</span>
            )}
          </div>

          {purchased ? (
            <Link to="/my-lists" className="no-underline">
              <button
                className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none"
                style={{ backgroundColor: '#65D9AC', color: '#1a1a2e' }}
              >
                <Check className="w-3 h-3" /> 사용하기
              </button>
            </Link>
          ) : inCart ? (
            <Link to="/cart" className="no-underline">
              <button
                className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none"
                style={{ backgroundColor: product.color, color: accentText }}
              >
                <Check className="w-3 h-3" /> 담김
              </button>
            </Link>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); addToCart(product); }}
              className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none"
              style={{ backgroundColor: product.color, color: accentText }}
            >
              <ShoppingCart className="w-3 h-3" /> 담기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
