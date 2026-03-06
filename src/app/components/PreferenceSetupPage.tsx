import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth-context';
import { updateProfile } from '@/lib/api/profiles';
import { toast } from 'sonner';
import { cn } from './ui/utils';

// ============================================================================
// Constants
// ============================================================================

interface CategoryChip {
  id: string;
  emoji: string;
  label: string;
}

const CATEGORIES: CategoryChip[] = [
  { id: 'exercise', emoji: '\u{1F3CB}\u{FE0F}', label: '운동루틴' },
  { id: 'diet', emoji: '\u{1F957}', label: '식단관리' },
  { id: 'selfdev', emoji: '\u{1F4DA}', label: '자기개발' },
  { id: 'cert', emoji: '\u{1F4DD}', label: '자격증' },
  { id: 'hobby', emoji: '\u{1F4A1}', label: '취미' },
];

// ============================================================================
// Component
// ============================================================================

const PreferenceSetupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSelection = selectedCategories.length > 0;

  const handleToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleComplete = async () => {
    if (!hasSelection || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (user) {
        await updateProfile(user.id, {
          preferences: selectedCategories,
        });
      }

      toast.success('관심사가 설정되었습니다!');
      navigate('/', { replace: true });
    } catch {
      toast.error('관심사 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 bg-transparent border-none cursor-pointer text-foreground"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">관심사 설정</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground leading-snug">
            어떤 루틴에 관심이
            <br />
            있나요?
          </h2>
          <p className="text-foreground/60 text-sm mt-2">
            최소 1개를 선택해주세요
          </p>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <motion.button
                key={category.id}
                type="button"
                onClick={() => handleToggle(category.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-colors min-w-[100px]',
                  isSelected
                    ? 'bg-[#65D9AC] border-[#65D9AC] text-white'
                    : 'bg-white/5 border-transparent text-foreground/60'
                )}
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale: isSelected ? 1 : 1,
                }}
                transition={{ duration: 0.15 }}
                aria-pressed={isSelected}
                aria-label={`${category.label} ${isSelected ? '선택됨' : '선택 안됨'}`}
              >
                <span className="text-3xl" role="img" aria-hidden="true">
                  {category.emoji}
                </span>
                <span className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-white' : 'text-foreground/60'
                )}>
                  {category.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom section */}
      <div className="px-5 pb-10 pt-4 flex flex-col items-center gap-3">
        {/* Skip link */}
        <button
          type="button"
          onClick={handleSkip}
          className="text-foreground/50 text-sm font-medium bg-transparent border-none cursor-pointer py-1"
          aria-label="건너뛰기"
        >
          건너뛰기
        </button>

        {/* CTA Button */}
        <motion.button
          type="button"
          onClick={handleComplete}
          disabled={!hasSelection || isSubmitting}
          className={cn(
            'w-full h-[52px] rounded-xl text-lg font-semibold border-none cursor-pointer transition-colors',
            hasSelection && !isSubmitting
              ? 'bg-[#65D9AC] text-white'
              : 'bg-white/5 text-foreground/50 cursor-not-allowed'
          )}
          animate={{ opacity: hasSelection ? 1 : 0.7 }}
          transition={{ duration: 0.2 }}
          aria-label="완료"
        >
          {isSubmitting ? '저장 중...' : '완료'}
        </motion.button>
      </div>
    </div>
  );
};

export default PreferenceSetupPage;
