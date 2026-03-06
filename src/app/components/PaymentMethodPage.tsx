import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../auth-context';
import { useStore } from '../store-context';
import { createPurchase } from '@/lib/api/purchases';
import { cn } from './ui/utils';

// ============================================================================
// Types
// ============================================================================

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'kakao' | 'toss' | 'naver';
  iconBg: string;
  iconText: string;
  iconLabel: string;
}

interface PaymentLocationState {
  routineId: string;
  routineTitle: string;
  routineProvider: string;
  routineColor: string;
  periodId: string;
  periodLabel: string;
  periodDays: number;
  amount: number;
  discount: number;
  finalAmount: number;
}

// ============================================================================
// Constants
// ============================================================================

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: '카드결제',
    type: 'card',
    iconBg: 'rgba(255,255,255,0.08)',
    iconText: 'rgba(255,255,255,0.8)',
    iconLabel: '',
  },
  {
    id: 'kakao',
    name: '카카오페이',
    type: 'kakao',
    iconBg: '#FEE500',
    iconText: '#191919',
    iconLabel: 'K',
  },
  {
    id: 'toss',
    name: '토스',
    type: 'toss',
    iconBg: '#0064FF',
    iconText: '#FFFFFF',
    iconLabel: 'T',
  },
  {
    id: 'naver',
    name: '네이버페이',
    type: 'naver',
    iconBg: '#03C75A',
    iconText: '#FFFFFF',
    iconLabel: 'N',
  },
];

const PRICE_FORMATTER = new Intl.NumberFormat('ko-KR');

function formatPrice(amount: number): string {
  return `\u20A9${PRICE_FORMATTER.format(amount)}`;
}

// ============================================================================
// Component
// ============================================================================

export function PaymentMethodPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn } = useAuth();
  const { refreshData } = useStore();

  const state = location.state as PaymentLocationState | null;

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // state가 없으면 스토어로 리다이렉트
  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-foreground/50">
        <CreditCard size={48} className="mb-4" />
        <p className="text-lg mb-4">결제 정보가 없습니다</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-[#65D9AC] font-semibold bg-transparent border-none cursor-pointer text-base"
        >
          스토어로 돌아가기
        </button>
      </div>
    );
  }

  // 비로그인 시 로그인으로 리다이렉트
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  const handlePayment = async () => {
    if (!selectedMethod || isProcessing) return;

    const method = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
    if (!method) return;

    setIsProcessing(true);

    try {
      // TODO: [FB-001] Phase 2에서 process-payment Edge Function으로 교체 예정
      // 현재는 Supabase 클라이언트 API를 직접 호출 (MVP)
      const startDate = new Date().toISOString();

      await createPurchase({
        userId: user.id,
        routineId: state.routineId,
        periodId: state.periodId,
        periodLabel: state.periodLabel,
        periodDays: state.periodDays,
        amount: state.amount,
        discount: state.discount,
        finalAmount: state.finalAmount,
        paymentMethod: method.type,
        startDate,
      });

      // 구매 후 데이터 새로고침
      await refreshData();

      navigate('/purchase-complete', {
        replace: true,
        state: {
          routineName: state.routineTitle,
          period: state.periodLabel,
          amount: state.finalAmount,
          purchaseDate: new Date().toISOString(),
          paymentMethod: method.name,
        },
      });
    } catch {
      toast.error('결제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer bg-transparent border-none"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">결제하기</h1>
      </div>

      {/* 결제 금액 카드 */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          결제 금액
        </h2>
        <div className="border border-white/10 rounded-xl p-5 bg-white/8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-foreground/60">상품명</span>
            <span className="text-sm font-medium text-foreground max-w-[200px] truncate">
              {state.routineTitle}
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-foreground/60">기간</span>
            <span className="text-sm font-medium text-foreground">
              {state.periodLabel}
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-foreground/60">상품 금액</span>
            <span className="text-sm text-foreground">
              {formatPrice(state.amount)}
            </span>
          </div>
          {state.discount > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-foreground/60">할인</span>
              <span className="text-sm text-[#d4183d]">
                -{formatPrice(state.discount)}
              </span>
            </div>
          )}
          <div className="h-px bg-white/10 my-3" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              최종 금액
            </span>
            <span className="text-lg font-bold text-foreground">
              {formatPrice(state.finalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* 결제 수단 선택 */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          결제 수단 선택
        </h2>
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/8">
          {PAYMENT_METHODS.map((method, index) => {
            const isSelected = selectedMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={cn(
                  'w-full flex items-center justify-between px-5 py-4 transition-all cursor-pointer bg-transparent border-none',
                  isSelected && 'bg-[#65D9AC]/5',
                  index < PAYMENT_METHODS.length - 1 &&
                    'border-b border-white/10'
                )}
                style={
                  index < PAYMENT_METHODS.length - 1
                    ? { borderBottom: '1px solid rgba(255,255,255,0.1)' }
                    : undefined
                }
                aria-label={method.name}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-3">
                  {/* 아이콘 */}
                  {method.id === 'card' ? (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: method.iconBg }}
                    >
                      <CreditCard
                        className="w-4 h-4"
                        style={{ color: method.iconText }}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: method.iconBg,
                        color: method.iconText,
                      }}
                    >
                      {method.iconLabel}
                    </div>
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-foreground' : 'text-foreground/60'
                    )}
                  >
                    {method.name}
                  </span>
                </div>

                {/* 라디오 인디케이터 */}
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    isSelected ? 'border-[#65D9AC]' : 'border-white/10'
                  )}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#65D9AC]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA 버튼 - 고정 하단 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-white/10 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={handlePayment}
            disabled={!selectedMethod || isProcessing}
            className={cn(
              'w-full h-[52px] rounded-xl text-lg font-semibold border-none transition-all',
              selectedMethod && !isProcessing
                ? 'bg-[#65D9AC] text-white cursor-pointer hover:opacity-90 active:opacity-80'
                : 'bg-white/5 text-foreground/50 cursor-not-allowed'
            )}
            aria-label={
              isProcessing
                ? '결제 처리 중'
                : `결제하기 ${formatPrice(state.finalAmount)}`
            }
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                결제 처리 중...
              </span>
            ) : (
              `결제하기 ${formatPrice(state.finalAmount)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
