import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../auth-context';
import { updateProfile } from '@/lib/api/profiles';
import { toast } from 'sonner';
import { cn } from './ui/utils';

// ============================================================================
// Constants
// ============================================================================

interface TermItem {
  key: keyof TermsState;
  label: string;
  required: boolean;
  hasDetail: boolean;
}

interface TermsState {
  service: boolean;
  privacy: boolean;
  marketing: boolean;
}

const TERM_ITEMS: TermItem[] = [
  { key: 'service', label: '서비스 이용약관', required: true, hasDetail: true },
  { key: 'privacy', label: '개인정보 처리방침', required: true, hasDetail: true },
  { key: 'marketing', label: '마케팅 정보 수신', required: false, hasDetail: false },
];

const TERMS_CONTENT: Record<string, string> = {
  service: `제 1 조 (목적)
이 약관은 HOW TO BE(이하 "회사")가 제공하는 루틴 마켓플레이스 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제 2 조 (정의)
1. "서비스"란 회사가 제공하는 모든 루틴 마켓플레이스 관련 서비스를 의미합니다.
2. "회원"이란 이 약관에 따라 이용계약을 체결하고 서비스를 이용하는 자를 말합니다.
3. "루틴"이란 서비스 내에서 제공되는 일일/주간/월간 단위의 활동 계획을 의미합니다.

제 3 조 (약관의 효력 및 변경)
회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.`,
  privacy: `1. 개인정보의 수집 및 이용 목적
회사는 다음의 목적을 위하여 개인정보를 수집 및 이용합니다.
- 회원 가입 및 관리
- 서비스 제공 및 개선
- 마케팅 및 광고 활용

2. 수집하는 개인정보의 항목
- 필수: 이메일, 닉네임
- 선택: 프로필 이미지, 관심 카테고리

3. 개인정보의 보유 및 이용 기간
회원 탈퇴 시까지 보유하며, 관계 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보관합니다.`,
};

// ============================================================================
// Sub-components
// ============================================================================

interface TermCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  required: boolean;
  hasDetail: boolean;
  onDetailClick?: () => void;
  large?: boolean;
}

const TermCheckbox = ({
  checked,
  onChange,
  label,
  required,
  hasDetail,
  onDetailClick,
  large = false,
}: TermCheckboxProps) => {
  return (
    <div className={cn('flex items-center gap-3', large ? 'py-3' : 'py-2.5')}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'shrink-0 flex items-center justify-center rounded-md border-2 transition-colors cursor-pointer',
          large ? 'w-6 h-6' : 'w-5 h-5',
          checked
            ? 'bg-[#65D9AC] border-[#65D9AC]'
            : 'bg-white/8 border-white/10'
        )}
      >
        {checked && <Check className={cn('text-white', large ? 'w-4 h-4' : 'w-3.5 h-3.5')} strokeWidth={3} />}
      </button>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'flex-1 text-left bg-transparent border-none cursor-pointer p-0',
          large ? 'text-base font-semibold text-foreground' : 'text-sm text-foreground/60'
        )}
      >
        {!large && (
          <span className={cn('mr-1', required ? 'text-[#65D9AC] font-medium' : 'text-foreground/50')}>
            [{required ? '필수' : '선택'}]
          </span>
        )}
        {label}
      </button>

      {hasDetail && onDetailClick && (
        <button
          type="button"
          onClick={onDetailClick}
          className="shrink-0 p-1 bg-transparent border-none cursor-pointer text-foreground/50 hover:text-foreground/60"
          aria-label={`${label} 상세 보기`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const TermsAgreementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [terms, setTerms] = useState<TermsState>({
    service: false,
    privacy: false,
    marketing: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailContent, setDetailContent] = useState<{ title: string; content: string } | null>(null);

  const allChecked = terms.service && terms.privacy && terms.marketing;
  const requiredChecked = terms.service && terms.privacy;

  const handleAllToggle = useCallback(() => {
    const newValue = !allChecked;
    setTerms({
      service: newValue,
      privacy: newValue,
      marketing: newValue,
    });
  }, [allChecked]);

  const handleTermToggle = useCallback((key: keyof TermsState) => {
    setTerms((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleDetailClick = (key: string, label: string) => {
    const content = TERMS_CONTENT[key];
    if (content) {
      setDetailContent({ title: label, content });
    }
  };

  const handleSubmit = async () => {
    if (!requiredChecked || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (!user) {
        toast.error('로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
        navigate('/login', { replace: true });
        return;
      }

      const now = new Date().toISOString();
      await updateProfile(user.id, {
        terms_agreed_at: now,
        privacy_agreed_at: now,
        marketing_agreed: terms.marketing,
      });

      navigate('/preference', { replace: true });
    } catch {
      toast.error('약관 동의 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Detail Bottom Sheet
  if (detailContent) {
    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => setDetailContent(null)}
            className="p-1 bg-transparent border-none cursor-pointer text-foreground"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">{detailContent.title}</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="text-sm text-foreground/60 whitespace-pre-wrap font-[inherit] leading-relaxed m-0">
            {detailContent.content}
          </pre>
        </div>
      </div>
    );
  }

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
        <h1 className="text-lg font-semibold text-foreground">약관 동의</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground leading-snug">
            서비스 이용을 위해
            <br />
            아래 약관에 동의해주세요
          </h2>
        </div>

        {/* All agree */}
        <TermCheckbox
          checked={allChecked}
          onChange={handleAllToggle}
          label="전체 동의"
          required={false}
          hasDetail={false}
          large
        />

        {/* Divider */}
        <div className="h-px bg-white/10 my-2" />

        {/* Individual terms */}
        {TERM_ITEMS.map((item) => (
          <TermCheckbox
            key={item.key}
            checked={terms[item.key]}
            onChange={() => handleTermToggle(item.key)}
            label={item.label}
            required={item.required}
            hasDetail={item.hasDetail}
            onDetailClick={
              item.hasDetail
                ? () => handleDetailClick(item.key, item.label)
                : undefined
            }
          />
        ))}
      </div>

      {/* CTA Button */}
      <div className="px-5 pb-10 pt-4">
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!requiredChecked || isSubmitting}
          className={cn(
            'w-full h-[52px] rounded-xl text-lg font-semibold border-none cursor-pointer transition-colors',
            requiredChecked && !isSubmitting
              ? 'bg-[#65D9AC] text-white'
              : 'bg-white/5 text-foreground/50 cursor-not-allowed'
          )}
          animate={{ opacity: requiredChecked ? 1 : 0.7 }}
          transition={{ duration: 0.2 }}
          aria-label="동의하고 시작하기"
        >
          {isSubmitting ? '처리 중...' : '동의하고 시작하기'}
        </motion.button>
      </div>
    </div>
  );
};

export default TermsAgreementPage;
