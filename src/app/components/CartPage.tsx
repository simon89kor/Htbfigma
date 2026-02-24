import { Link, useNavigate } from "react-router";
import { Trash2, ShoppingBag, ArrowRight, PackageOpen, LogIn, Calendar } from "lucide-react";
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
    toast.success("구매가 완료되었습니다! 🎉", {
      description: "내 리스트에서 바로 사용해보세요.",
    });
    navigate("/my-lists");
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-[#f0f0f4] rounded-2xl flex items-center justify-center mb-6">
          <PackageOpen className="w-10 h-10 text-[#6b6b80]" />
        </div>
        <h2 className="text-[#1a1a2e] mb-2">장바구니가 비어있습니다</h2>
        <p className="text-[#6b6b80] mb-6">마음에 드는 To-Do 리스트를 담아보세요</p>
        <Link
          to="/"
          className="flex items-center gap-2 px-6 py-3 bg-[#1a1a2e] text-white rounded-xl no-underline hover:bg-[#2a2a3e] transition-colors text-[14px] font-medium"
        >
          <ShoppingBag className="w-5 h-5" />
          스토어 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[#1a1a2e] mb-8 text-[28px] font-bold">장바구니</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="bg-white rounded-2xl border border-black/[0.06] p-4 sm:p-5 flex gap-4 sm:gap-5"
              style={{boxShadow: 'var(--shadow-card)'}}
            >
              <Link to={`/product/${item.product.id}`} className="shrink-0">
                <ImageWithFallback
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item.product.id}`}
                  className="no-underline text-inherit"
                >
                  <h3 className="text-[#1a1a2e] mb-1 truncate font-semibold">{item.product.name}</h3>
                </Link>
                <p className="text-[#6b6b80] text-[13px] mb-2 line-clamp-1">
                  {item.product.description}
                </p>
                <div
                  className="inline-flex px-2 py-0.5 rounded-md text-white text-[12px] mb-1 font-medium"
                  style={{ backgroundColor: item.product.color }}
                >
                  {item.product.category}
                </div>
                <div className="flex items-center gap-1 text-[12px] text-[#6b6b80] mb-3">
                  <Calendar className="w-3 h-3" />
                  {item.product.durationDays}일
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[18px] text-[#1a1a2e] font-bold">
                      ₩{item.product.price.toLocaleString()}
                    </span>
                    {item.product.originalPrice && (
                      <span className="text-[13px] text-[#6b6b80] line-through">
                        ₩{item.product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 text-[#6b6b80] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sticky top-24" style={{boxShadow: 'var(--shadow-card)'}}>
            <h3 className="text-[#1a1a2e] mb-5 font-semibold">주문 요약</h3>

            <div className="space-y-3 mb-5">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-[14px]">
                  <span className="text-[#6b6b80] truncate mr-4">
                    {item.product.name}
                  </span>
                  <span className="text-[#1a1a2e] shrink-0 font-medium">
                    ₩{item.product.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-black/[0.04] pt-4 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-[#6b6b80]">총 결제금액</span>
                <span className="text-[24px] text-[#1a1a2e] font-bold">
                  ₩{total.toLocaleString()}
                </span>
              </div>
              {cart.some((item) => item.product.originalPrice) && (
                <div className="text-right mt-1">
                  <span className="text-red-500 text-[13px]">
                    총{" "}
                    ₩
                    {cart
                      .reduce(
                        (sum, item) =>
                          sum +
                          ((item.product.originalPrice || item.product.price) -
                            item.product.price),
                        0
                      )
                      .toLocaleString()}{" "}
                    할인
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#1a1a2e] text-white rounded-xl hover:bg-[#2a2a3e] transition-colors cursor-pointer text-[15px] font-medium border-none"
            >
              {isLoggedIn ? (
                <>
                  결제하기
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  로그인 후 결제하기
                </>
              )}
            </button>

            <Link
              to="/"
              className="block text-center text-[14px] text-[#6b6b80] hover:text-[#1a1a2e] mt-4 no-underline transition-colors"
            >
              계속 쇼핑하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
