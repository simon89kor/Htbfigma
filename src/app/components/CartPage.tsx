import { Link, useNavigate } from "react-router";
import { Trash2, ShoppingBag, ArrowRight, PackageOpen, LogIn, Calendar } from "lucide-react";
import { Button, Card, CardBody, Chip, Divider } from "@heroui/react";
import { useStore } from "../store-context";
import { useAuth } from "../auth-context";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";

export function CartPage() {
  const { cart, removeFromCart, getCartTotal, checkout } = useStore();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const total = getCartTotal();

  const handleCheckout = () => {
    if (!isLoggedIn) {
      toast.error("결제하려면 로그인이 필요합니다.");
      navigate("/login?redirect=/cart");
      return;
    }
    checkout();
    toast.success("구매가 완료되었습니다! 🎉", { description: "내 리스트에서 바로 사용해보세요." });
    navigate("/my-lists");
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-default-100 rounded-2xl flex items-center justify-center mb-6">
          <PackageOpen className="w-10 h-10 text-default-400" />
        </div>
        <h2 className="text-default-900 mb-2">장바구니가 비어있습니다</h2>
        <p className="text-default-500 mb-6">마음에 드는 To-Do 리스트를 담아보세요</p>
        <Link to="/" className="no-underline">
          <Button color="primary" startContent={<ShoppingBag className="w-5 h-5" />} size="lg">
            스토어 둘러보기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-default-900 mb-8 text-[28px] font-bold">장바구니</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card key={item.product.id} shadow="sm">
              <CardBody className="flex-row gap-4 sm:gap-5 p-4 sm:p-5">
                <Link to={`/product/${item.product.id}`} className="shrink-0">
                  <ImageWithFallback
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.id}`} className="no-underline text-inherit">
                    <h3 className="text-default-900 mb-1 truncate font-semibold">{item.product.name}</h3>
                  </Link>
                  <p className="text-default-500 text-[13px] mb-2 line-clamp-1">{item.product.description}</p>
                  <Chip size="sm" variant="solid" className="text-white mb-1" style={{ backgroundColor: item.product.color }}>
                    {item.product.category}
                  </Chip>
                  <div className="flex items-center gap-1 text-xs text-default-400 mb-3">
                    <Calendar className="w-3 h-3" />
                    {item.product.durationDays}일
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg text-default-900 font-bold">₩{item.product.price.toLocaleString()}</span>
                      {item.product.originalPrice && (
                        <span className="text-[13px] text-default-400 line-through">₩{item.product.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                    <Button
                      isIconOnly
                      variant="light"
                      color="danger"
                      size="sm"
                      onPress={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card shadow="sm" className="sticky top-24">
            <CardBody className="p-6 gap-4">
              <h3 className="text-default-900 font-semibold">주문 요약</h3>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-default-500 truncate mr-4">{item.product.name}</span>
                    <span className="text-default-900 shrink-0 font-medium">₩{item.product.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Divider />
              <div className="flex justify-between items-baseline">
                <span className="text-default-500">총 결제금액</span>
                <span className="text-2xl text-default-900 font-bold">₩{total.toLocaleString()}</span>
              </div>
              {cart.some((item) => item.product.originalPrice) && (
                <div className="text-right">
                  <span className="text-danger text-[13px]">
                    총 ₩{cart.reduce((sum, item) => sum + ((item.product.originalPrice || item.product.price) - item.product.price), 0).toLocaleString()} 할인
                  </span>
                </div>
              )}
              <Button
                color="primary"
                size="lg"
                fullWidth
                onPress={handleCheckout}
                endContent={isLoggedIn ? <ArrowRight className="w-5 h-5" /> : undefined}
                startContent={!isLoggedIn ? <LogIn className="w-5 h-5" /> : undefined}
                className="font-medium"
              >
                {isLoggedIn ? "결제하기" : "로그인 후 결제하기"}
              </Button>
              <Link to="/" className="block text-center text-sm text-default-500 hover:text-default-700 no-underline transition-colors">
                계속 쇼핑하기
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
