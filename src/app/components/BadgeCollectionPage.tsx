import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Lock, Loader2, Share2 } from 'lucide-react';
import { Drawer } from 'vaul';
import { toast } from 'sonner';
import { useReward, type BadgeWithStatus } from '../reward-context';
import { useAuth } from '../auth-context';
import { cn } from './ui/utils';
import { format } from 'date-fns';

// ============================================================================
// Constants
// ============================================================================

type FilterTab = 'all' | 'unlocked' | 'locked';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'unlocked', label: '획득' },
  { key: 'locked', label: '미획득' },
];

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  routine: { label: '루틴 마스터', emoji: '🌟' },
  streak: { label: '스트릭 달성', emoji: '🔥' },
  community: { label: '커뮤니티', emoji: '🤝' },
  challenge: { label: '챌린지', emoji: '🎯' },
  special: { label: '스페셜', emoji: '✨' },
};

// ============================================================================
// Badge Detail Bottom Sheet
// ============================================================================

function BadgeDetailSheet({
  badge,
  open,
  onOpenChange,
}: {
  badge: BadgeWithStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!badge) return null;

  const catInfo = CATEGORY_LABELS[badge.category] ?? { label: badge.category, emoji: '🏅' };

  const handleShare = async () => {
    const shareText = `${badge.name} 뱃지를 획득했습니다! #HTB #루틴마켓`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          toast.error('공유에 실패했습니다');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('클립보드에 복사되었습니다');
      } catch {
        toast.error('복사에 실패했습니다');
      }
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white/8 rounded-t-2xl z-50">
          <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full my-3" />
          <div className="px-6 pb-8">
            {/* 아이콘 + 이름 */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div
                className={cn(
                  'relative w-20 h-20 rounded-full flex items-center justify-center text-4xl',
                  badge.isUnlocked
                    ? 'bg-[var(--accent-color)]/10 shadow-md'
                    : 'bg-white/5 grayscale opacity-50'
                )}
              >
                {badge.icon || '🏅'}
                {!badge.isUnlocked && (
                  <div className="absolute">
                    <Lock size={14} className="text-foreground/50" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground">{badge.name}</h3>
              <p className="text-sm text-foreground/60 text-center">
                {badge.description}
              </p>
            </div>

            {/* 상세 정보 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">카테고리</span>
                <span className="text-foreground font-medium">
                  {catInfo.emoji} {catInfo.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">획득 조건</span>
                <span className="text-foreground font-medium">
                  {badge.condition_type}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">상태</span>
                <span
                  className={cn(
                    'font-medium',
                    badge.isUnlocked ? 'text-[var(--accent-color)]' : 'text-foreground/60'
                  )}
                >
                  {badge.isUnlocked ? '획득 완료' : '미획득'}
                </span>
              </div>
              {badge.isUnlocked && badge.unlockedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">획득 일시</span>
                  <span className="text-foreground">
                    {format(new Date(badge.unlockedAt), 'yyyy.MM.dd HH:mm')}
                  </span>
                </div>
              )}
            </div>

            {/* 공유 버튼 — 획득한 뱃지에만 표시 */}
            {badge.isUnlocked && (
              <button
                onClick={handleShare}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--accent-color)] text-white font-semibold text-sm border-none cursor-pointer transition-opacity hover:opacity-90 active:opacity-80"
              >
                <Share2 size={18} />
                <span>뱃지 공유하기</span>
              </button>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ============================================================================
// Badge Card
// ============================================================================

function BadgeCard({
  badge,
  onClick,
}: {
  badge: BadgeWithStatus;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 bg-transparent border-none cursor-pointer"
      aria-label={`${badge.name} 뱃지 ${badge.isUnlocked ? '획득 완료' : '미획득'}`}
    >
      <div className="relative">
        <div
          className={cn(
            'w-20 h-20 rounded-2xl flex items-center justify-center text-3xl transition-all',
            badge.isUnlocked
              ? 'bg-white/8 shadow-md border border-white/10'
              : 'bg-white/5 border border-white/10'
          )}
          style={!badge.isUnlocked ? { filter: 'grayscale(1)', opacity: 0.5 } : undefined}
        >
          {badge.icon || '🏅'}
        </div>
        {!badge.isUnlocked && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shadow-sm">
            <Lock size={12} className="text-white" />
          </div>
        )}
      </div>
      <span
        className={cn(
          'text-xs font-medium max-w-[80px] truncate text-center',
          badge.isUnlocked ? 'text-foreground' : 'text-foreground/60'
        )}
      >
        {badge.name}
      </span>
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const BadgeCollectionPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { badges, loading, loadBadges } = useReward();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  // 필터링
  const filteredBadges = useMemo(() => {
    if (activeFilter === 'unlocked') return badges.filter((b) => b.isUnlocked);
    if (activeFilter === 'locked') return badges.filter((b) => !b.isUnlocked);
    return badges;
  }, [badges, activeFilter]);

  // 카테고리별 그룹핑
  const groupedBadges = useMemo(() => {
    const groups: Record<string, BadgeWithStatus[]> = {};
    filteredBadges.forEach((badge) => {
      const cat = badge.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(badge);
    });
    return groups;
  }, [filteredBadges]);

  const handleBadgeClick = (badge: BadgeWithStatus) => {
    setSelectedBadge(badge);
    setSheetOpen(true);
  };

  // 통계
  const totalCount = badges.length;
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1 bg-transparent border-none cursor-pointer text-foreground"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">뱃지 컬렉션</h1>
          <p className="text-xs text-foreground/60">
            {unlockedCount}/{totalCount}개 획득
          </p>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'px-4 py-2 rounded-full whitespace-nowrap text-sm border-none cursor-pointer transition-all',
              activeFilter === tab.key
                ? 'bg-[var(--accent-color)] text-white font-medium'
                : 'bg-white/5 text-foreground/60 hover:bg-white/10'
            )}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {loading && badges.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--accent-color)] mb-3" />
          <p className="text-sm text-foreground/60">뱃지를 불러오는 중...</p>
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && filteredBadges.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-foreground/60">
          <span className="text-4xl mb-4">🏅</span>
          <p className="text-lg">
            {activeFilter === 'unlocked'
              ? '아직 획득한 뱃지가 없습니다'
              : activeFilter === 'locked'
                ? '모든 뱃지를 획득했습니다!'
                : '뱃지가 없습니다'}
          </p>
        </div>
      )}

      {/* 카테고리별 뱃지 그리드 */}
      {!loading && Object.entries(groupedBadges).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedBadges).map(([category, categoryBadges]) => {
            const catInfo = CATEGORY_LABELS[category] ?? { label: category, emoji: '🏅' };
            return (
              <div key={category}>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span>{catInfo.emoji}</span>
                  <span>{catInfo.label}</span>
                </h2>
                <div className="grid grid-cols-3 gap-1">
                  {categoryBadges.map((badge) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      onClick={() => handleBadgeClick(badge)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 뱃지 상세 Bottom Sheet */}
      <BadgeDetailSheet
        badge={selectedBadge}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
};

export default BadgeCollectionPage;
