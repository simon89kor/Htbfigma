import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Trophy, ChevronRight, Flame, Medal, Target, Loader2 } from 'lucide-react';
import { Drawer } from 'vaul';
import { useReward, type BadgeWithStatus } from '../reward-context';
import { useAuth } from '../auth-context';
import { cn } from './ui/utils';
import { format, differenceInDays } from 'date-fns';

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

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white/8 rounded-t-2xl z-50">
          <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full my-3" />
          <div className="px-6 pb-8">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="text-5xl">{badge.icon || '🏅'}</div>
              <h3 className="text-lg font-bold text-foreground">{badge.name}</h3>
              <p className="text-sm text-foreground/60 text-center">
                {badge.description}
              </p>
            </div>

            <div className="space-y-3 bg-white/5 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">카테고리</span>
                <span className="text-foreground font-medium">
                  {badge.category === 'routine' && '루틴 마스터'}
                  {badge.category === 'streak' && '스트릭 달성'}
                  {badge.category === 'community' && '커뮤니티'}
                  {badge.category === 'challenge' && '챌린지'}
                  {badge.category === 'special' && '스페셜'}
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
                    {format(new Date(badge.unlockedAt), 'yyyy.MM.dd')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ============================================================================
// Section Components
// ============================================================================

function TotalCompletedCard({ count }: { count: number }) {
  return (
    <div className="bg-white/11 rounded-xl p-5 shadow-sm border border-white/16 backdrop-blur-xl">
      <p className="text-sm text-foreground/60 mb-1">총 달성 루틴</p>
      <motion.p
        className="text-4xl font-bold text-foreground"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {count}
        <span className="text-lg font-normal text-foreground/60 ml-1">개</span>
      </motion.p>
    </div>
  );
}

function StreakCard({
  currentStreak,
  longestStreak,
}: {
  currentStreak: number;
  longestStreak: number;
}) {
  return (
    <div className="rounded-xl p-5 text-white shadow-sm border border-[#13d680]/30"
      style={{
        background: 'linear-gradient(135deg, rgba(19, 214, 128, 0.80) 0%, rgba(16, 185, 129, 0.90) 100%)',
        boxShadow: '0 0 32px rgba(19, 214, 128, 0.30), inset 0 1px 0 rgba(255,255,255,0.20)',
      }}>
      <div className="flex items-center gap-2 mb-3">
        <Flame size={20} />
        <p className="text-sm font-medium opacity-90">연속 달성 (Streak)</p>
      </div>
      <div className="flex items-end gap-3">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          >
            🔥
          </motion.span>
          <span className="text-3xl font-bold">{currentStreak}일</span>
          <span className="text-sm opacity-80">연속!</span>
        </div>
      </div>
      <p className="text-sm opacity-80 mt-2">
        최장 기록: <span className="font-semibold">{longestStreak}일</span>
      </p>
    </div>
  );
}

function BadgePreviewSection({
  badges,
  onBadgeClick,
}: {
  badges: (BadgeWithStatus)[];
  onBadgeClick: (badge: BadgeWithStatus) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Medal size={18} className="text-[var(--accent-color)]" />
          <h3 className="text-base font-semibold text-foreground">획득 뱃지</h3>
        </div>
        <Link
          to="/reward/badges"
          className="flex items-center gap-1 text-sm text-foreground/60 no-underline hover:text-[var(--accent-color)] transition-colors"
        >
          더보기 <ChevronRight size={16} />
        </Link>
      </div>
      {badges.length > 0 ? (
        <div className="flex gap-4">
          {badges.map((badge) => (
            <button
              key={badge.id}
              onClick={() => onBadgeClick(badge)}
              className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer p-0"
              aria-label={`${badge.name} 뱃지 상세보기`}
            >
              <div className="w-[52px] h-[52px] rounded-full bg-white/12 shadow-sm border border-white/20 backdrop-blur-md flex items-center justify-center text-2xl" style={{ boxShadow: '0 0 16px rgba(255,255,255,0.08)' }}>
                {badge.icon || '🏅'}
              </div>
              <span className="text-xs text-foreground/60 max-w-[60px] truncate">
                {badge.name}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-6 text-center">
          <p className="text-sm text-foreground/60">아직 획득한 뱃지가 없습니다</p>
          <p className="text-xs text-foreground/60 mt-1">루틴을 완료하고 뱃지를 획득하세요!</p>
        </div>
      )}
    </div>
  );
}

function RankingPreviewSection({
  overallRank,
}: {
  overallRank: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-[var(--accent-color)]" />
          <h3 className="text-base font-semibold text-foreground">현재 랭킹</h3>
        </div>
        <Link
          to="/reward/ranking"
          className="flex items-center gap-1 text-sm text-foreground/60 no-underline hover:text-[var(--accent-color)] transition-colors"
        >
          더보기 <ChevronRight size={16} />
        </Link>
      </div>
      <div className="bg-white/11 rounded-xl p-4 shadow-sm border border-white/16 backdrop-blur-xl">
        {overallRank > 0 ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-color)]/10 flex items-center justify-center">
              <Trophy size={20} className="text-[var(--accent-color)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                전체 {overallRank}위
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/60 text-center py-2">
            랭킹 정보가 없습니다
          </p>
        )}
      </div>
    </div>
  );
}

function ChallengePreviewSection({
  challenges,
}: {
  challenges: {
    id: string;
    title: string;
    end_date: string;
    user_progress?: number;
  }[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-[var(--accent-color)]" />
          <h3 className="text-base font-semibold text-foreground">진행 중 챌린지</h3>
        </div>
        <Link
          to="/reward/challenges"
          className="flex items-center gap-1 text-sm text-foreground/60 no-underline hover:text-[var(--accent-color)] transition-colors"
        >
          더보기 <ChevronRight size={16} />
        </Link>
      </div>
      {challenges.length > 0 ? (
        <div className="space-y-3">
          {challenges.map((ch) => {
            const daysLeft = differenceInDays(new Date(ch.end_date), new Date());
            const progress = ch.user_progress ?? 0;

            return (
              <Link
                key={ch.id}
                to={`/reward/challenges/${ch.id}`}
                className="block bg-white/11 rounded-xl p-4 shadow-sm border border-white/16 no-underline backdrop-blur-xl hover:bg-white/16 transition-all"
              >
                <p className="font-medium text-foreground mb-2">{ch.title}</p>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full bg-[var(--accent-color)] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-foreground/60">
                  <span>{progress}%</span>
                  <span className="text-[var(--accent-color)] font-medium">
                    {daysLeft > 0 ? `D-${daysLeft}` : '마감'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-6 text-center">
          <p className="text-sm text-foreground/60">참여 중인 챌린지가 없습니다</p>
          <Link
            to="/reward/challenges"
            className="text-xs text-[var(--accent-color)] no-underline mt-1 inline-block"
          >
            챌린지 둘러보기
          </Link>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

const RewardMainPage = () => {
  const { user, isLoggedIn } = useAuth();
  const { summary, loading, loadSummary } = useReward();
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadSummary();
    }
  }, [isLoggedIn, loadSummary]);

  const handleBadgeClick = (badge: BadgeWithStatus) => {
    setSelectedBadge(badge);
    setSheetOpen(true);
  };

  // 비로그인 상태
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-foreground/60">
        <Trophy size={48} className="mb-4" />
        <p className="text-lg mb-2">로그인이 필요합니다</p>
        <p className="text-sm">리워드 기능을 이용하려면 로그인해주세요.</p>
        <Link
          to="/login"
          className="mt-4 px-6 py-2.5 bg-[var(--accent-color)] text-white rounded-xl no-underline text-sm font-medium"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  // 로딩 상태
  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[var(--accent-color)] mb-3" />
        <p className="text-sm text-foreground/60">리워드 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">리워드</h1>
        <p className="text-sm text-foreground/60 mt-1">
          {user?.name ?? ''}님의 달성 현황
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. 총 달성 루틴 수 */}
        <TotalCompletedCard count={summary?.totalCompletedRoutines ?? 0} />

        {/* 2. 연속 달성 (Streak) */}
        <StreakCard
          currentStreak={summary?.currentStreak ?? 0}
          longestStreak={summary?.longestStreak ?? 0}
        />

        {/* 3. 획득 뱃지 미리보기 */}
        <BadgePreviewSection
          badges={summary?.recentBadges ?? []}
          onBadgeClick={handleBadgeClick}
        />

        {/* 4. 현재 랭킹 */}
        <RankingPreviewSection overallRank={summary?.ranking?.overall ?? 0} />

        {/* 5. 진행 중 챌린지 */}
        <ChallengePreviewSection challenges={summary?.activeChallenges ?? []} />
      </div>

      {/* 뱃지 상세 Bottom Sheet */}
      <BadgeDetailSheet
        badge={selectedBadge}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
};

export default RewardMainPage;
