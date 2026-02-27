import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import {
  getAllBadges,
  getUserBadges,
  getRanking,
  getChallenges,
  getChallenge,
  joinChallenge as apiJoinChallenge,
  type UserBadgeWithDetails,
  type ChallengeWithDetails,
  type RankingEntry,
} from '@/lib/api/rewards';
import type { Badge, Profile } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface RewardSummary {
  totalCompletedRoutines: number;
  currentStreak: number;
  longestStreak: number;
  recentBadges: (Badge & { isUnlocked: boolean; unlockedAt?: string })[];
  ranking: {
    overall: number;
    category: string;
    categoryRank: number;
  };
  activeChallenges: ChallengeWithDetails[];
}

export interface BadgeWithStatus extends Badge {
  isUnlocked: boolean;
  unlockedAt?: string;
}

interface RewardContextType {
  /** 리워드 서머리 (메인 페이지) */
  summary: RewardSummary | null;
  /** 뱃지 목록 (전체 + 획득 상태 포함) */
  badges: BadgeWithStatus[];
  /** 랭킹 데이터 */
  ranking: RankingEntry[];
  /** 내 랭킹 */
  myRanking: RankingEntry | null;
  /** 챌린지 목록 */
  challenges: ChallengeWithDetails[];
  /** 챌린지 총 수 */
  challengesCount: number;
  /** 로딩 상태 */
  loading: boolean;
  /** 서머리 로드 */
  loadSummary: () => Promise<void>;
  /** 뱃지 목록 로드 */
  loadBadges: () => Promise<void>;
  /** 랭킹 로드 */
  loadRanking: (period: string, category: string) => Promise<void>;
  /** 챌린지 목록 로드 */
  loadChallenges: (status?: ChallengeWithDetails['status']) => Promise<void>;
  /** 챌린지 참여 */
  joinChallenge: (challengeId: string) => Promise<void>;
}

// ============================================================================
// Context (HMR-safe)
// ============================================================================

const REWARD_CTX_KEY = Symbol.for('htb-reward-context');
const globalObj = globalThis as Record<symbol, unknown>;
if (!globalObj[REWARD_CTX_KEY]) {
  globalObj[REWARD_CTX_KEY] = createContext<RewardContextType | undefined>(undefined);
}
const RewardContext = globalObj[REWARD_CTX_KEY] as React.Context<RewardContextType | undefined>;

// ============================================================================
// Provider
// ============================================================================

export function RewardProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [myRanking, setMyRanking] = useState<RankingEntry | null>(null);
  const [challenges, setChallenges] = useState<ChallengeWithDetails[]>([]);
  const [challengesCount, setChallengesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 뱃지 목록 + 획득 상태 조합
  const loadBadges = useCallback(async () => {
    setLoading(true);
    try {
      const allBadges = await getAllBadges();

      let userBadgeMap = new Map<string, string>();
      if (isLoggedIn && user) {
        const userBadges = await getUserBadges(user.id);
        userBadgeMap = new Map(
          userBadges.map((ub) => [ub.badge_id, ub.unlocked_at])
        );
      }

      const badgesWithStatus: BadgeWithStatus[] = allBadges.map((badge) => ({
        ...badge,
        isUnlocked: userBadgeMap.has(badge.id),
        unlockedAt: userBadgeMap.get(badge.id),
      }));

      if (mountedRef.current) {
        setBadges(badgesWithStatus);
      }
    } catch (err) {
      toast.error('뱃지 정보를 불러오지 못했습니다');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [isLoggedIn, user?.id]);

  // 랭킹 로드
  const loadRanking = useCallback(
    async (period: string, category: string) => {
      setLoading(true);
      try {
        const data = await getRanking({ period, category, limit: 50 });
        if (mountedRef.current) {
          setRanking(data);

          // 내 순위 찾기
          if (user) {
            const me = data.find((e) => e.user_id === user.id);
            setMyRanking(me ?? null);
          }
        }
      } catch (err) {
        toast.error('랭킹 정보를 불러오지 못했습니다');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [user?.id]
  );

  // 챌린지 로드
  const loadChallenges = useCallback(
    async (status?: ChallengeWithDetails['status']) => {
      setLoading(true);
      try {
        const { data, count } = await getChallenges({
          status: status as 'upcoming' | 'active' | 'completed' | 'cancelled' | undefined,
          currentUserId: user?.id,
        });
        if (mountedRef.current) {
          setChallenges(data);
          setChallengesCount(count);
        }
      } catch (err) {
        toast.error('챌린지 정보를 불러오지 못했습니다');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [user?.id]
  );

  // 서머리 로드 (메인 페이지용)
  const loadSummary = useCallback(async () => {
    if (!isLoggedIn || !user) return;

    setLoading(true);
    try {
      // 프로필에서 스트릭/달성 정보 가져오기
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_completed_routines, current_streak, longest_streak')
        .eq('id', user.id)
        .single();

      // 뱃지 (최근 4개)
      const allBadges = await getAllBadges();
      const userBadges = await getUserBadges(user.id);
      const userBadgeMap = new Map(
        userBadges.map((ub) => [ub.badge_id, ub.unlocked_at])
      );

      const unlockedBadges = allBadges
        .filter((b) => userBadgeMap.has(b.id))
        .map((b) => ({
          ...b,
          isUnlocked: true,
          unlockedAt: userBadgeMap.get(b.id),
        }))
        .slice(0, 4);

      // 랭킹 (전체)
      const rankingData = await getRanking({ period: 'weekly', category: 'all', limit: 50 });
      const myRank = rankingData.find((r) => r.user_id === user.id);

      // 진행 중 챌린지
      const { data: activeChallenges } = await getChallenges({
        status: 'active',
        currentUserId: user.id,
      });

      const participatingChallenges = activeChallenges.filter((c) => c.is_participating);

      if (mountedRef.current) {
        setSummary({
          totalCompletedRoutines: profile?.total_completed_routines ?? 0,
          currentStreak: profile?.current_streak ?? 0,
          longestStreak: profile?.longest_streak ?? 0,
          recentBadges: unlockedBadges,
          ranking: {
            overall: myRank?.rank ?? 0,
            category: '전체',
            categoryRank: myRank?.rank ?? 0,
          },
          activeChallenges: participatingChallenges,
        });
      }
    } catch (err) {
      toast.error('리워드 정보를 불러오지 못했습니다');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [isLoggedIn, user?.id]);

  // 챌린지 참여
  const joinChallengeHandler = useCallback(
    async (challengeId: string) => {
      if (!user) {
        toast.error('로그인이 필요합니다');
        return;
      }

      try {
        const result = await apiJoinChallenge(challengeId, user.id);

        // 낙관적 업데이트
        setChallenges((prev) =>
          prev.map((ch) =>
            ch.id === challengeId
              ? {
                  ...ch,
                  is_participating: true,
                  user_progress: 0,
                  participant_count: result.participant_count,
                }
              : ch
          )
        );

        toast.success('챌린지에 참여했습니다!');
      } catch (err) {
        const message = err instanceof Error ? err.message : '챌린지 참여에 실패했습니다';
        toast.error(message);
      }
    },
    [user]
  );

  return (
    <RewardContext.Provider
      value={{
        summary,
        badges,
        ranking,
        myRanking,
        challenges,
        challengesCount,
        loading,
        loadSummary,
        loadBadges,
        loadRanking,
        loadChallenges,
        joinChallenge: joinChallengeHandler,
      }}
    >
      {children}
    </RewardContext.Provider>
  );
}

export function useReward() {
  const context = useContext(RewardContext);
  if (!context) throw new Error('useReward must be used within RewardProvider');
  return context;
}
