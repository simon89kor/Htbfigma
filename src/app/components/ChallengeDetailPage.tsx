import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Users, Calendar, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../auth-context';
import { useReward } from '../reward-context';
import { getChallenge, type ChallengeWithDetails } from '@/lib/api/rewards';
import { cn } from './ui/utils';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_EMOJI: Record<string, string> = {
  exercise: '🏋️',
  diet: '🥗',
  reading: '📚',
  selfdev: '💡',
  lifestyle: '🌿',
};

// ============================================================================
// Main Component
// ============================================================================

const ChallengeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { joinChallenge } = useReward();
  const [challenge, setChallenge] = useState<ChallengeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getChallenge(id, user?.id);
        setChallenge(data);
      } catch (err) {
        toast.error('챌린지 정보를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user?.id]);

  const handleJoin = async () => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다');
      return;
    }
    if (!id) return;

    setJoining(true);
    try {
      await joinChallenge(id);
      // 상태 갱신
      setChallenge((prev) =>
        prev
          ? {
              ...prev,
              is_participating: true,
              user_progress: 0,
              participant_count: prev.participant_count + 1,
            }
          : prev
      );
    } catch {
      // joinChallenge에서 toast 처리
    } finally {
      setJoining(false);
    }
  };

  // 로딩
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[var(--accent-color)] mb-3" />
        <p className="text-sm text-[var(--text-muted)]">챌린지를 불러오는 중...</p>
      </div>
    );
  }

  // 에러
  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
        <span className="text-4xl mb-4">😢</span>
        <p className="text-lg">챌린지를 찾을 수 없습니다</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-[var(--accent-color)] text-white rounded-xl border-none cursor-pointer text-sm"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const isActive = challenge.status === 'active';
  const isUpcoming = challenge.status === 'upcoming';
  const isCompleted = challenge.status === 'completed';
  const progress = challenge.user_progress ?? 0;
  const emoji = CATEGORY_EMOJI[challenge.category] ?? '🎯';

  return (
    <div className="pb-24">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1 bg-transparent border-none cursor-pointer text-[var(--primary)]"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-[var(--primary)] truncate flex-1">
          {challenge.title}
        </h1>
      </div>

      {/* 히어로 영역 */}
      <div className="bg-gradient-to-br from-[var(--accent-color)] to-emerald-400 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
        <span className="text-5xl mb-3 block">{emoji}</span>
        <h2 className="text-xl font-bold mb-2">{challenge.title}</h2>

        {/* 상태 뱃지 */}
        <span
          className={cn(
            'inline-block px-3 py-1 rounded-full text-xs font-medium',
            isActive && 'bg-white/20 text-white',
            isUpcoming && 'bg-yellow-400/20 text-yellow-100',
            isCompleted && 'bg-gray-500/30 text-gray-200'
          )}
        >
          {isActive && '진행중'}
          {isUpcoming && '예정'}
          {isCompleted && '완료'}
        </span>

        {/* 장식 원 */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
      </div>

      {/* 기간 & 참여자 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)]">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <Calendar size={14} />
            <span className="text-xs">기간</span>
          </div>
          <p className="text-sm font-medium text-[var(--primary)]">
            {format(new Date(challenge.start_date), 'yyyy.MM.dd')}
          </p>
          <p className="text-sm font-medium text-[var(--primary)]">
            ~ {format(new Date(challenge.end_date), 'yyyy.MM.dd')}
          </p>
          {isActive && daysLeft > 0 && (
            <p className="text-xs text-[var(--accent-color)] font-medium mt-1">D-{daysLeft}</p>
          )}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)]">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <Users size={14} />
            <span className="text-xs">참여자</span>
          </div>
          <p className="text-2xl font-bold text-[var(--primary)]">
            {challenge.participant_count.toLocaleString()}
            <span className="text-sm font-normal text-[var(--text-secondary)]">명</span>
          </p>
        </div>
      </div>

      {/* 진행률 (참여 중인 경우) */}
      {challenge.is_participating && isActive && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)] mb-6">
          <p className="text-sm font-medium text-[var(--primary)] mb-2">내 진행률</p>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--accent-color)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="text-right text-sm font-bold text-[var(--accent-color)] mt-1">{progress}%</p>
        </div>
      )}

      {/* 챌린지 설명 */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-[var(--primary)] mb-2">챌린지 설명</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
          {challenge.description}
        </p>
      </div>

      {/* 규칙 */}
      {challenge.rules && challenge.rules.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-[var(--primary)] mb-2">규칙</h3>
          <ul className="space-y-2">
            {challenge.rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle size={16} className="text-[var(--accent-color)] shrink-0 mt-0.5" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 보상 */}
      {challenge.challenge_rewards && challenge.challenge_rewards.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-[var(--primary)] mb-3">보상</h3>
          <div className="space-y-2">
            {challenge.challenge_rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
              >
                <span className="text-2xl">{reward.icon || '🏅'}</span>
                <div>
                  <p className="text-sm font-medium text-[var(--primary)]">{reward.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{reward.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 참여하기 CTA (하단 고정) */}
      {!isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--border)] p-4 z-30">
          <div className="max-w-7xl mx-auto">
            {challenge.is_participating ? (
              <button
                disabled
                className="w-full h-[52px] bg-gray-100 text-[var(--text-muted)] rounded-xl text-lg font-semibold border-none"
              >
                참여 중
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className={cn(
                  'w-full h-[52px] rounded-xl text-lg font-semibold border-none cursor-pointer transition-all',
                  joining
                    ? 'bg-gray-100 text-[var(--text-muted)]'
                    : 'bg-[var(--accent-color)] text-white hover:opacity-90'
                )}
              >
                {joining ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    참여 중...
                  </span>
                ) : (
                  '참여하기'
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeDetailPage;
