import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { CheckCircle2, Home } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// ============================================================================
// Types
// ============================================================================

interface PurchaseCompleteState {
  routineName: string;
  period: string;
  amount: number;
  purchaseDate: string;
  paymentMethod: string;
}

// ============================================================================
// Constants
// ============================================================================

const PRICE_FORMATTER = new Intl.NumberFormat('ko-KR');

function formatPrice(amount: number): string {
  return `\u20A9${PRICE_FORMATTER.format(amount)}`;
}

// ============================================================================
// Component
// ============================================================================

export function PurchaseCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as PurchaseCompleteState | null;

  // state가 없으면 Empty State
  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#9CA3AF]">
        <CheckCircle2 size={48} className="mb-4" />
        <p className="text-lg mb-4">구매 정보가 없습니다</p>
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

  const purchaseDate = state.purchaseDate
    ? format(new Date(state.purchaseDate), 'yyyy.MM.dd', { locale: ko })
    : format(new Date(), 'yyyy.MM.dd', { locale: ko });

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 max-w-lg mx-auto">
      {/* 체크 아이콘 애니메이션 */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          duration: 0.3,
        }}
        className="mb-6"
      >
        <div className="w-16 h-16 bg-[#65D9AC] rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      {/* 완료 메시지 */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-xl font-bold text-[#1a1a2e] mb-8"
      >
        결제가 완료되었습니다!
      </motion.h1>

      {/* 구매 요약 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="w-full border border-[#E5E7EB] rounded-xl p-5 bg-white mb-8"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">루틴명</span>
            <span className="text-sm font-medium text-[#1a1a2e] max-w-[200px] truncate text-right">
              {state.routineName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">기간</span>
            <span className="text-sm font-medium text-[#1a1a2e]">
              {state.period}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">금액</span>
            <span className="text-sm font-bold text-[#1a1a2e]">
              {formatPrice(state.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">결제 수단</span>
            <span className="text-sm font-medium text-[#1a1a2e]">
              {state.paymentMethod}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">결제일</span>
            <span className="text-sm font-medium text-[#1a1a2e]">
              {purchaseDate}
            </span>
          </div>
        </div>
      </motion.div>

      {/* CTA 버튼 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="w-full space-y-3"
      >
        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => navigate('/my-lists')}
          className="w-full h-[52px] bg-[#65D9AC] text-white rounded-xl text-lg font-semibold cursor-pointer border-none transition-opacity hover:opacity-90 active:opacity-80"
        >
          일정 선택하기
        </button>

        {/* Secondary CTA */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 py-3 text-[#6B7280] font-medium text-sm bg-transparent border-none cursor-pointer transition-colors hover:text-[#1a1a2e]"
        >
          <Home className="w-4 h-4" />
          HOME으로 돌아가기
        </button>
      </motion.div>
    </div>
  );
}
