import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { cn } from './ui/utils';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '../auth-context';
import { getRanking, type RankingEntry } from '@/lib/api/rewards';
import { toast } from 'sonner';

// ============================================================================
// Constants
// ============================================================================

const PERIOD_TABS = [
  { key: 'weekly', label: '주간' },
  { key: 'monthly', label: '월간' },
];

const CATEGORY_TABS = [
  { key: 'all', label: '전체' },
  { key: 'exercise', label: '운동' },
  { key: 'diet', label: '식단' },
  { key: 'selfdev', label: '자기개발' },
  { key: 'gratitude', label: '감사일기' },
];

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

// ============================================================================
// Component
// ============================================================================

const RankingDetailPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [period, setPeriod] = useState('weekly');
  const [category, setCategory] = useState('all');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<RankingEntry | null>(null);

  const loadRankings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRanking({
        period,
        category: category === 'all' ? undefined : category,
        limit: 50,
      });
      setRankings(data);

      // Find current user's rank
      if (user) {
        const found = data.find((r) => r.user_id === user.id);
        setMyRank(found ?? null);
      }
    } catch {
      toast.error('랭킹을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [period, category, user]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  return (
    <div className="min-h-screen bg-background -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-white/10">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-white/10"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="flex-1 text-center text-base font-semibold text-foreground mr-9">
            랭킹
          </h1>
        </div>

        {/* Period tabs */}
        <div className="flex gap-2 px-4 pb-2">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm border-none cursor-pointer transition-colors',
                period === tab.key
                  ? 'bg-[#65D9AC] text-white font-medium'
                  : 'bg-white/5 text-foreground/60'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs whitespace-nowrap border-none cursor-pointer transition-colors',
                category === tab.key
                  ? 'bg-foreground text-background font-medium'
                  : 'bg-white/5 text-foreground/60'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ranking content */}
      {loading ? (
        <RankingSkeleton />
      ) : rankings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-foreground/50">
          <Trophy size={48} className="mb-4" />
          <p className="text-lg">랭킹 데이터가 없습니다</p>
          <p className="text-sm mt-1">루틴을 완료하고 랭킹에 도전하세요</p>
        </div>
      ) : (
        <div className="px-4 py-4">
          {/* Top 3 */}
          {rankings.length >= 1 && (
            <div className="mb-6">
              {/* First place - highlight */}
              <div className="flex flex-col items-center mb-6">
                <span className="text-4xl mb-2">{RANK_MEDALS[0]}</span>
                <div
                  className="w-16 h-16 rounded-full bg-white/10 overflow-hidden mb-2 border-3 border-yellow-400 cursor-pointer"
                  onClick={() => navigate(`/user/${rankings[0].user_id}`)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${rankings[0].nickname}의 프로필 보기`}
                >
                  {rankings[0].avatar_url ? (
                    <img
                      src={rankings[0].avatar_url}
                      alt={rankings[0].nickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg text-foreground/50">
                      {rankings[0].nickname[0]}
                    </div>
                  )}
                </div>
                <p className="text-sm font-bold text-foreground">{rankings[0].nickname}</p>
                <p className="text-sm text-[#65D9AC] font-semibold">
                  달성 {Math.round(rankings[0].completion_rate)}%
                </p>
              </div>

              {/* Second and Third */}
              {rankings.length >= 2 && (
                <div className="flex justify-center gap-8">
                  {rankings.slice(1, 3).map((entry, idx) => (
                    <div key={entry.user_id} className="flex flex-col items-center">
                      <span className="text-2xl mb-1">{RANK_MEDALS[idx + 1]}</span>
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full bg-white/10 overflow-hidden mb-1.5 border-2 cursor-pointer',
                          idx === 0 ? 'border-white/30' : 'border-amber-600'
                        )}
                        onClick={() => navigate(`/user/${entry.user_id}`)}
                        role="button"
                        tabIndex={0}
                        aria-label={`${entry.nickname}의 프로필 보기`}
                      >
                        {entry.avatar_url ? (
                          <img
                            src={entry.avatar_url}
                            alt={entry.nickname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-foreground/50">
                            {entry.nickname[0]}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground">{entry.nickname}</p>
                      <p className="text-xs text-foreground/60">
                        달성 {Math.round(entry.completion_rate)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4th and below */}
          {rankings.length > 3 && (
            <div className="border-t border-white/10 pt-4 space-y-1">
              {rankings.slice(3).map((entry) => (
                <div
                  key={entry.user_id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => navigate(`/user/${entry.user_id}`)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${entry.nickname}의 프로필 보기`}
                >
                  <span className="w-8 text-center text-sm font-semibold text-foreground/60">
                    {entry.rank}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt={entry.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-foreground/50">
                        {entry.nickname[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {entry.nickname}
                    </p>
                  </div>
                  <span className="text-sm text-foreground/60">
                    {Math.round(entry.completion_rate)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My rank sticky bar */}
      {myRank && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-white/10 px-4 py-3 z-40">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#65D9AC]/10 flex items-center justify-center">
              <Medal size={16} className="text-[#65D9AC]" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-foreground">
                내 순위: {myRank.rank}위
              </span>
            </div>
            <span className="text-sm font-semibold text-[#65D9AC]">
              {Math.round(myRank.completion_rate)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Skeleton
// ============================================================================

const RankingSkeleton = () => (
  <div className="px-4 py-6">
    <div className="flex flex-col items-center mb-6">
      <Skeleton className="w-16 h-16 rounded-full mb-2" />
      <Skeleton className="h-4 w-20 mb-1" />
      <Skeleton className="h-4 w-16" />
    </div>
    <div className="flex justify-center gap-8 mb-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <Skeleton className="w-12 h-12 rounded-full mb-1.5" />
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
    <div className="space-y-2 border-t border-white/10 pt-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="w-8 h-5" />
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  </div>
);

export default RankingDetailPage;
