import { Link } from "react-router";
import { Star, ShoppingCart, Check, Calendar } from "lucide-react";
import { Card, CardBody, CardFooter, Button, Chip } from "@heroui/react";
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
    <Card
      shadow="sm"
      isPressable={false}
      className="group hover:shadow-[0_8px_32px_rgba(19,214,128,0.18)] transition-all duration-300 hover:-translate-y-1 border border-white/10 hover:border-white/20"
    >
      {/* Image */}
      <Link to={`/product/${product.id}`} className="no-underline">
        <div className="relative h-48 overflow-hidden">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.originalPrice && (
            <Chip color="danger" size="sm" variant="solid" className="absolute top-3 left-3">
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
            </Chip>
          )}
          <div className="absolute top-3 right-3">
            <Chip
              size="sm"
              variant="solid"
              className="text-white"
              style={{ backgroundColor: product.color }}
            >
              {product.category}
            </Chip>
          </div>
          <div className="absolute bottom-3 left-3">
            <Chip size="sm" variant="solid" className="bg-black/60 text-white backdrop-blur-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDuration(product.durationDays)}
              </span>
            </Chip>
          </div>
        </div>
      </Link>

      <CardBody className="px-4 pt-4 pb-2">
        <Link to={`/product/${product.id}`} className="no-underline text-inherit">
          <h3 className="text-default-900 mb-1 text-[15px] font-semibold">
            {product.name}
          </h3>
          <p className="text-default-500 text-[13px] mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </Link>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.tags.slice(0, 3).map((tag) => (
            <Chip key={tag} size="sm" variant="flat" color="default">
              {tag}
            </Chip>
          ))}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-[13px] text-default-900 font-medium">{product.rating}</span>
          <span className="text-[12px] text-default-400">({product.reviews})</span>
        </div>
      </CardBody>

      <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-lg text-default-900 font-bold">
            ₩{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-[13px] text-default-400 line-through">
              ₩{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {purchased ? (
          <Link to="/my-lists" className="no-underline">
            <Button
              color="success"
              variant="flat"
              size="sm"
              startContent={<Check className="w-4 h-4" />}
            >
              사용하기
            </Button>
          </Link>
        ) : inCart ? (
          <Link to="/cart" className="no-underline">
            <Button
              color="secondary"
              variant="flat"
              size="sm"
              startContent={<Check className="w-4 h-4" />}
            >
              담김
            </Button>
          </Link>
        ) : (
          <Button
            color="primary"
            variant="solid"
            size="sm"
            startContent={<ShoppingCart className="w-4 h-4" />}
            onPress={() => addToCart(product)}
          >
            담기
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
