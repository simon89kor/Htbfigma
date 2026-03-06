import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useReward } from '../reward-context';
import { useAuth } from '../auth-context';
import { cn } from './ui/utils';

// ============================================================================
// Constants
// ============================================================================

type PeriodTab = 'weekly' | 'monthly';
type CategoryTab = 'all' | 'exercise' | 'diet' | 'selfdev' | 'lifestyle';

const PERIOD_TABS: { key: PeriodTab; label: string }[] = [
  { key: 'weekly', label: '주간' },
  { key: 'monthly', label: '월간' },
];

const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'exercise', label: '운동' },
  { key: 'diet', label: '식단' },
  { key: 'selfdev', label: '자기개발' },
  { key: 'lifestyle', label: '라이프' },
];

// ============================================================================
// Medal helper
// ============================================================================

function getMedalEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}

// ============================================================================
// Top 3 Podium
// ============================================================================

function TopThreePodium({
  entries,
  currentUserId,
  onClickUser,
}: {
  entries: { rank: number; nickname: string; avatar_url: string; completion_rate: number; user_id: string }[];
  currentUserId: string | undefined;
  onClickUser: (userId: string, isMe: boolean) => void;
}) {
  const first = entries.find((e) => e.rank === 1);
  const second = entries.find((e) => e.rank === 2);
  const third = entries.find((e) => e.rank === 3);

  const PodiumItem = ({
    entry,
    size,
  }: {
    entry: typeof first;
    size: 'lg' | 'sm';
  }) => {
    if (!entry) return <div className="flex-1" />;

    const isMe = entry.user_id === currentUserId;

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onClickUser(entry.user_id, isMe)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClickUser(entry.user_id, isMe);
          }
        }}
        className="flex flex-col items-center flex-1 cursor-pointer"
      >
        <span className={cn('mb-1', size === 'lg' ? 'text-3xl' : 'text-2xl')}>
          {getMedalEmoji(entry.rank)}
        </span>
        <div
          className={cn(
            'rounded-full bg-white/10 flex items-center justify-center text-lg font-medium text-white overflow-hidden',
            size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'
          )}
          style={{
            backgroundImage: entry.avatar_url ? `url(${entry.avatar_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: !entry.avatar_url ? '#9CA3AF' : undefined,
          }}
        >
          {!entry.avatar_url && entry.nickname[0]}
        </div>
        <p
          className={cn(
            'mt-1.5 font-medium text-foreground truncate max-w-[80px] text-center',
            size === 'lg' ? 'text-sm' : 'text-xs'
          )}
        >
          {entry.nickname}
        </p>
        <p className={cn('text-[var(--accent-color)] font-bold', size === 'lg' ? 'text-base' : 'text-sm')}>
          {entry.completion_rate}%
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white/8 rounded-xl p-6 shadow-sm border border-white/10 mb-4">
      <div className="flex items-end justify-center gap-2">
        <PodiumItem entry={second} size="sm" />
        <PodiumItem entry={first} size="lg" />
        <PodiumItem entry={third} size="sm" />
      </div>
    </div>
  );
}

// ============================================================================
// Ranking List Item
// ============================================================================

function RankingListItem({
  rank,
  nickname,
  avatarUrl,
  completionRate,
  isMe,
  userId,
  onClickUser,
}: {
  rank: number;
  nickname: string;
  avatarUrl: string;
  completionRate: number;
  isMe: boolean;
  userId: string;
  onClickUser: (userId: string, isMe: boolean) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClickUser(userId, isMe)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClickUser(userId, isMe);
        }
      }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer',
        isMe ? 'bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/30' : 'bg-white/8 hover:bg-white/10'
      )}
    >
      {/* 순위 */}
      <div className="w-8 text-center">
        <span
          className={cn(
            'text-sm font-bold',
            isMe ? 'text-[var(--accent-color)]' : 'text-foreground/60'
          )}
        >
          {rank}
        </span>
      </div>

      {/* 아바타 */}
      <div
        className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white overflow-hidden shrink-0"
        style={{
          backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: !avatarUrl ? '#9CA3AF' : undefined,
        }}
      >
        {!avatarUrl && nickname[0]}
      </div>

      {/* 닉네임 */}
      <p
        className={cn(
          'flex-1 text-sm font-medium truncate',
          isMe ? 'text-[var(--accent-color)]' : 'text-foreground'
        )}
      >
        {nickname}
        {isMe && <span className="ml-1 text-xs opacity-70">(나)</span>}
      </p>

      {/* 프로그레스 */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full',
              isMe ? 'bg-[var(--accent-color)]' : 'bg-white/30'
            )}
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <span
          className={cn(
            'text-xs font-bold w-10 text-right',
            isMe ? 'text-[var(--accent-color)]' : 'text-foreground/60'
          )}
        >
          {completionRate}%
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const RankingBoardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ranking, myRanking, loading, loadRanking } = useReward();
  const [period, setPeriod] = useState<PeriodTab>('weekly');
  const [category, setCategory] = useState<CategoryTab>('all');

  useEffect(() => {
    loadRanking(period, category);
  }, [period, category, loadRanking]);

  const topThree = ranking.filter((e) => e.rank <= 3);
  const rest = ranking.filter((e) => e.rank > 3);

  const handleClickUser = (userId: string, isMe: boolean) => {
    if (isMe) {
      navigate('/profile');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  return (
    <div className="pb-24">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1 bg-transparent border-none cursor-pointer text-foreground"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-foreground">랭킹</h1>
      </div>

      {/* 기간 탭 */}
      <div className="flex gap-2 mb-3">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'px-4 py-2 rounded-full text-sm border-none cursor-pointer transition-all',
              period === tab.key
                ? 'bg-[var(--accent-color)] text-white font-medium'
                : 'bg-white/5 text-foreground/60 hover:bg-white/10'
            )}
            onClick={() => setPeriod(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'px-3 py-1.5 rounded-full whitespace-nowrap text-xs border-none cursor-pointer transition-all',
              category === tab.key
                ? 'bg-foreground text-background'
                : 'bg-white/5 text-foreground/60 border border-white/10 hover:bg-white/10'
            )}
            onClick={() => setCategory(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {loading && ranking.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--accent-color)] mb-3" />
          <p className="text-sm text-foreground/60">랭킹을 불러오는 중...</p>
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && ranking.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-foreground/60">
          <span className="text-4xl mb-4">🏆</span>
          <p className="text-lg">랭킹 데이터가 없습니다</p>
          <p className="text-sm mt-1">루틴을 완료하여 랭킹에 참여하세요!</p>
        </div>
      )}

      {/* 1~3위 포디움 */}
      {topThree.length > 0 && (
        <TopThreePodium
          entries={topThree}
          currentUserId={user?.id}
          onClickUser={handleClickUser}
        />
      )}

      {/* 4위~ 리스트 */}
      {rest.length > 0 && (
        <div className="space-y-1">
          {rest.map((entry) => (
            <RankingListItem
              key={entry.user_id}
              rank={entry.rank}
              nickname={entry.nickname}
              avatarUrl={entry.avatar_url}
              completionRate={entry.completion_rate}
              isMe={entry.user_id === user?.id}
              userId={entry.user_id}
              onClickUser={handleClickUser}
            />
          ))}
        </div>
      )}

      {/* 내 순위 sticky */}
      {myRanking && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-white/10 shadow-lg z-30">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <RankingListItem
              rank={myRanking.rank}
              nickname={myRanking.nickname}
              avatarUrl={myRanking.avatar_url}
              completionRate={myRanking.completion_rate}
              isMe={true}
              userId={myRanking.user_id}
              onClickUser={handleClickUser}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingBoardPage;
