import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';
import { BookOpen, CalendarCheck, Users } from 'lucide-react';
import { cn } from './ui/utils';

// ============================================================================
// Constants
// ============================================================================

const WALKTHROUGH_DONE_KEY = 'htb_walkthrough_done';

interface WalkthroughSlide {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle: string;
}

const SLIDES: WalkthroughSlide[] = [
  {
    icon: BookOpen,
    iconColor: '#65D9AC',
    title: '전문가가 만든 루틴으로\n시작하세요',
    subtitle: '운동, 식단, 자기개발 등\n검증된 루틴을 만나보세요',
  },
  {
    icon: CalendarCheck,
    iconColor: '#6C5CE7',
    title: '매일 체크하며\n나를 바꿔보세요',
    subtitle: '캘린더와 투두리스트로\n꾸준히 관리하세요',
  },
  {
    icon: Users,
    iconColor: '#FF6B6B',
    title: '함께하면\n더 재미있어요',
    subtitle: '커뮤니티에서 경험을 나누고\n동기부여를 받으세요',
  },
];

// ============================================================================
// Component
// ============================================================================

const WalkthroughPage = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: false,
  });

  const isLastSlide = selectedIndex === SLIDES.length - 1;

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleComplete = () => {
    localStorage.setItem(WALKTHROUGH_DONE_KEY, 'true');
    navigate('/login', { replace: true });
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNext = () => {
    if (isLastSlide) {
      handleComplete();
    } else {
      emblaApi?.scrollNext();
    }
  };

  const handleDotClick = (index: number) => {
    emblaApi?.scrollTo(index);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Skip button */}
      <div className="flex justify-end px-5 pt-4 pb-2">
        <button
          type="button"
          onClick={handleSkip}
          className="text-[#9CA3AF] text-sm font-medium bg-transparent border-none cursor-pointer px-2 py-1"
          aria-label="워크스루 건너뛰기"
        >
          건너뛰기
        </button>
      </div>

      {/* Carousel */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {SLIDES.map((slide, index) => {
            const IconComponent = slide.icon;
            return (
              <div
                key={index}
                className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center px-8"
              >
                {/* Illustration placeholder */}
                <motion.div
                  className="w-48 h-48 rounded-3xl flex items-center justify-center mb-12"
                  style={{ backgroundColor: `${slide.iconColor}15` }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={
                    selectedIndex === index
                      ? { scale: 1, opacity: 1 }
                      : { scale: 0.8, opacity: 0.5 }
                  }
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <IconComponent
                    className="w-24 h-24"
                    style={{ color: slide.iconColor }}
                    strokeWidth={1.2}
                  />
                </motion.div>

                {/* Title */}
                <h2 className="text-[#1a1a2e] text-2xl font-bold text-center leading-snug whitespace-pre-line">
                  {slide.title}
                </h2>

                {/* Subtitle */}
                <p className="text-[#6B7280] text-base text-center mt-4 leading-relaxed whitespace-pre-line">
                  {slide.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom section: indicators + button */}
      <div className="px-6 pb-10 pt-4 flex flex-col items-center gap-6">
        {/* Page indicators */}
        <div className="flex gap-2" role="tablist" aria-label="워크스루 슬라이드">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={selectedIndex === index}
              aria-label={`슬라이드 ${index + 1}`}
              onClick={() => handleDotClick(index)}
              className="p-0 border-none bg-transparent cursor-pointer"
            >
              <motion.div
                className={cn(
                  'rounded-full transition-colors',
                  selectedIndex === index
                    ? 'bg-[#65D9AC]'
                    : 'bg-[#E5E7EB]'
                )}
                animate={{
                  width: selectedIndex === index ? 24 : 8,
                  height: 8,
                  scale: selectedIndex === index ? 1 : 0.9,
                }}
                transition={{ duration: 0.2 }}
              />
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full h-[52px] bg-[#65D9AC] text-white rounded-xl text-lg font-semibold border-none cursor-pointer active:scale-[0.98] transition-transform"
          aria-label={isLastSlide ? '시작하기' : '다음'}
        >
          {isLastSlide ? '시작하기' : '다음'}
        </button>
      </div>
    </div>
  );
};

export default WalkthroughPage;
