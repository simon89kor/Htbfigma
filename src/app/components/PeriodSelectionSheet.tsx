import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Drawer } from 'vaul';
import { useAuth } from '../auth-context';
import { cn } from './ui/utils';

// ============================================================================
// Types
// ============================================================================

export interface PeriodOption {
  id: string;
  label: string;
  days: number;
  price: number;
  originalPrice?: number;
}

interface PeriodSelectionSheetProps {
  routine: {
    id: string;
    title: string;
    provider: string;
    color: string;
  };
  options: PeriodOption[];
  isOpen: boolean;
  onClose: () => void;
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

const PeriodSelectionSheet = ({
  routine,
  options,
  isOpen,
  onClose,
}: PeriodSelectionSheetProps) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  // 기본 선택: 가운데 옵션 (4 WEEK)
  const defaultIndex = options.length > 0 ? Math.floor(options.length / 2) : 0;
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  const selectedOption = useMemo(
    () => options[selectedIndex] ?? options[0] ?? null,
    [options, selectedIndex]
  );

  // 옵션이 없으면 빈 상태 표시
  if (!selectedOption) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-50 outline-none"
            aria-label="기간 선택"
          >
            <div className="mx-auto w-12 h-1.5 bg-white/10 rounded-full my-3" />
            <div className="px-6 pb-8 text-center">
              <p className="text-foreground/60 py-8">이용 가능한 기간 옵션이 없습니다.</p>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-[52px] bg-white/5 text-foreground/60 rounded-xl text-lg font-semibold cursor-pointer border-none"
              >
                닫기
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  const handlePurchase = () => {
    if (!isLoggedIn) {
      navigate('/login');
      onClose();
      return;
    }

    navigate('/payment', {
      state: {
        routineId: routine.id,
        routineTitle: routine.title,
        routineProvider: routine.provider,
        routineColor: routine.color,
        periodId: selectedOption.id,
        periodLabel: selectedOption.label,
        periodDays: selectedOption.days,
        amount: selectedOption.originalPrice ?? selectedOption.price,
        discount:
          selectedOption.originalPrice
            ? selectedOption.originalPrice - selectedOption.price
            : 0,
        finalAmount: selectedOption.price,
      },
    });
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-50 outline-none"
          aria-label="기간 선택"
        >
          {/* 드래그 핸들 */}
          <div className="mx-auto w-12 h-1.5 bg-white/10 rounded-full my-3" />

          <div className="px-6 pb-8">
            {/* 루틴 정보 */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-foreground">
                {routine.title}
              </h3>
              <p className="text-sm text-foreground/60">by {routine.provider}</p>
            </div>

            <div className="h-px bg-white/10 mb-5" />

            {/* 기간 선택 라벨 */}
            <p className="text-sm font-semibold text-foreground mb-4">
              기간을 선택해주세요
            </p>

            {/* 기간 옵션 */}
            <div className="space-y-3 mb-6">
              {options.map((option, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 transition-all cursor-pointer bg-transparent',
                      isSelected
                        ? 'border-[#65D9AC] bg-[#65D9AC]/5'
                        : 'border-white/10 hover:border-white/30'
                    )}
                    aria-label={`${option.label} ${formatPrice(option.price)}`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-3">
                      {/* 라디오 인디케이터 */}
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                          isSelected
                            ? 'border-[#65D9AC]'
                            : 'border-white/20'
                        )}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#65D9AC]" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-foreground' : 'text-foreground/60'
                        )}
                      >
                        {option.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {option.originalPrice && (
                        <span className="text-xs text-foreground/50 line-through">
                          {formatPrice(option.originalPrice)}
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-sm font-bold',
                          isSelected ? 'text-foreground' : 'text-foreground/60'
                        )}
                      >
                        {formatPrice(option.price)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-white/10 mb-5" />

            {/* CTA 버튼 */}
            <button
              type="button"
              onClick={handlePurchase}
              className="w-full h-[52px] bg-[#65D9AC] text-white rounded-xl text-lg font-semibold cursor-pointer border-none transition-opacity hover:opacity-90 active:opacity-80"
              aria-label={`구매하기 ${formatPrice(selectedOption.price)}`}
            >
              구매하기 {formatPrice(selectedOption.price)}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default PeriodSelectionSheet;
