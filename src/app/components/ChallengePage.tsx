import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useReward } from '../reward-context';
import { cn } from './ui/utils';
import { differenceInDays, format } from 'date-fns';

// ============================================================================
// Constants
// ============================================================================

type StatusTab = 'active' | 'upcoming' | 'completed';

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'active', label: '진행중' },
  { key: 'upcoming', label: '예정' },
  { key: 'completed', label: '완료' },
];

// ============================================================================
// Challenge Card
// ============================================================================

function ChallengeCard({
  challenge,
}: {
  challenge: {
    id: string;
    title: string;
    description: string;
    category: string;
    start_date: string;
    end_date: string;
    participant_count: number;
    status: string;
    is_participating?: boolean;
    user_progress?: number;
    challenge_rewards?: { id: string; type: string; name: string; icon: string }[];
  };
}) {
  const isActive = challenge.status === 'active';
  const isUpcoming = challenge.status === 'upcoming';
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const daysUntilStart = isUpcoming
    ? differenceInDays(new Date(challenge.start_date), new Date())
    : 0;
  const progress = challenge.user_progress ?? 0;

  const categoryEmoji: Record<string, string> = {
    exercise: '🏋️',
    diet: '🥗',
    reading: '📚',
    selfdev: '💡',
    lifestyle: '🌿',
  };

  return (
    <Link
      to={`/reward/challenges/${challenge.id}`}
      className="block bg-white/8 rounded-xl p-4 shadow-sm border border-white/10 no-underline transition-shadow hover:shadow-md"
    >
      {/* 카테고리 + 제목 */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">
          {categoryEmoji[challenge.category] ?? '🎯'}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-0.5 truncate">
            {challenge.title}
          </h3>
          <p className="text-xs text-foreground/60 line-clamp-1">
            {challenge.description}
          </p>
        </div>
        {challenge.is_participating && isActive && (
          <span className="shrink-0 px-2 py-0.5 bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-medium rounded-full">
            참여중
          </span>
        )}
      </div>

      {/* 참여자 수 */}
      <div className="flex items-center gap-1.5 text-xs text-foreground/60 mb-3">
        <Users size={14} />
        <span>참여자 {challenge.participant_count.toLocaleString()}명</span>
      </div>

      {/* 프로그레스 (진행 중 + 참여 중인 경우) */}
      {isActive && challenge.is_participating && (
        <div className="mb-3">
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--accent-color)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-foreground/60">{progress}%</span>
            <span className="text-xs text-[var(--accent-color)] font-medium">
              {daysLeft > 0 ? `D-${daysLeft}` : '마감'}
            </span>
          </div>
        </div>
      )}

      {/* 기간 (예정 챌린지) */}
      {isUpcoming && (
        <div className="mb-3">
          <p className="text-xs text-foreground/60">
            {format(new Date(challenge.start_date), 'yyyy.MM.dd')} ~ {format(new Date(challenge.end_date), 'yyyy.MM.dd')}
          </p>
          <p className="text-xs text-[var(--accent-color)] font-medium mt-0.5">
            {daysUntilStart > 0 ? `시작까지 D-${daysUntilStart}` : '곧 시작'}
          </p>
        </div>
      )}

      {/* 보상 미리보기 */}
      {challenge.challenge_rewards && challenge.challenge_rewards.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <span className="text-xs text-foreground/60">보상:</span>
          <div className="flex items-center gap-1.5">
            {challenge.challenge_rewards.slice(0, 3).map((reward) => (
              <span key={reward.id} className="flex items-center gap-0.5 text-xs text-foreground/60">
                <span>{reward.icon || '🏅'}</span>
                <span>{reward.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const ChallengePage = () => {
  const navigate = useNavigate();
  const { challenges, loading, loadChallenges } = useReward();
  const [activeTab, setActiveTab] = useState<StatusTab>('active');

  useEffect(() => {
    loadChallenges(activeTab);
  }, [activeTab, loadChallenges]);

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
        <h1 className="text-xl font-bold text-foreground">챌린지</h1>
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'px-4 py-2 rounded-full whitespace-nowrap text-sm border-none cursor-pointer transition-all',
              activeTab === tab.key
                ? 'bg-[var(--accent-color)] text-white font-medium'
                : 'bg-white/5 text-foreground/60 hover:bg-white/10'
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {loading && challenges.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--accent-color)] mb-3" />
          <p className="text-sm text-foreground/60">챌린지를 불러오는 중...</p>
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && challenges.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-foreground/60">
          <span className="text-4xl mb-4">🎯</span>
          <p className="text-lg">
            {activeTab === 'active' && '진행 중인 챌린지가 없습니다'}
            {activeTab === 'upcoming' && '예정된 챌린지가 없습니다'}
            {activeTab === 'completed' && '완료된 챌린지가 없습니다'}
          </p>
        </div>
      )}

      {/* 챌린지 리스트 */}
      {challenges.length > 0 && (
        <div className="space-y-3">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChallengePage;
