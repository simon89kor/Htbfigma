import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  BarChart3,
  Flame,
  TrendingUp,
  PieChart as PieChartIcon,
  ListChecks,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "./ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../auth-context";

// ============================================================================
// Types
// ============================================================================

interface StatsData {
  totalCompleted: number;
  totalTasks: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  weeklyCheckmarks: boolean[];
  dailyRates: { date: string; rate: number }[];
  categoryDistribution: {
    category: string;
    percentage: number;
    color: string;
  }[];
  routineStats: {
    routineId: string;
    routineName: string;
    completionRate: number;
  }[];
}

// ============================================================================
// Constants
// ============================================================================

const PERIOD_OPTIONS = [
  { value: "week" as const, label: "주간" },
  { value: "month" as const, label: "월간" },
] as const;

const CATEGORY_COLORS = [
  "#65D9AC",
  "#6C5CE7",
  "#E36185",
  "#F59E0B",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
];

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

// ============================================================================
// Helper: parse RPC response
// ============================================================================

function parseStatsResponse(raw: unknown): StatsData {
  const data = raw as Record<string, unknown>;

  const categoryDist = Array.isArray(data.categoryDistribution)
    ? (data.categoryDistribution as { category: string; percentage: number }[]).map(
        (c, i) => ({
          ...c,
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        })
      )
    : [];

  return {
    totalCompleted: (data.totalCompleted as number) ?? 0,
    totalTasks: (data.totalTasks as number) ?? 0,
    completionRate: (data.completionRate as number) ?? 0,
    currentStreak: (data.currentStreak as number) ?? 0,
    longestStreak: (data.longestStreak as number) ?? 0,
    weeklyCheckmarks: Array.isArray(data.weeklyCheckmarks)
      ? (data.weeklyCheckmarks as boolean[])
      : [false, false, false, false, false, false, false],
    dailyRates: Array.isArray(data.dailyRates)
      ? (data.dailyRates as { date: string; rate: number }[])
      : [],
    categoryDistribution: categoryDist,
    routineStats: Array.isArray(data.routineStats)
      ? (data.routineStats as StatsData["routineStats"])
      : [],
  };
}

// ============================================================================
// Sub-Components
// ============================================================================

/** 이번 주 달성률 - RadialBarChart */
const CompletionRateChart = ({ data }: { data: StatsData }) => {
  const chartData = [
    { name: "달성률", rate: data.completionRate, fill: "#65D9AC" },
  ];

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-[#65D9AC]" />
        <h3 className="text-[15px] font-semibold text-gray-900">
          이번 주 달성률
        </h3>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative w-full" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              innerRadius="60%"
              outerRadius="90%"
              data={chartData}
              startAngle={90}
              endAngle={-270}
              barSize={12}
            >
              <RadialBar
                dataKey="rate"
                cornerRadius={6}
                background={{ fill: "#F3F4F6" }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* 중앙 퍼센트 텍스트 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">
              {Math.round(data.completionRate)}%
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          완료 {data.totalCompleted} / 전체 {data.totalTasks}
        </p>
      </div>
    </div>
  );
};

/** 연속 달성일 Streak */
const StreakSection = ({ data }: { data: StatsData }) => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-[15px] font-semibold text-gray-900">
          연속 달성일
        </h3>
      </div>
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-1">
          <span className="text-4xl" role="img" aria-label="불꽃">
            🔥
          </span>
          <span className="text-4xl font-bold text-gray-900">
            {data.currentStreak}일
          </span>
          <span className="text-lg text-gray-500 ml-1">연속!</span>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          최장 기록: {data.longestStreak}일
        </p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAY_LABELS.map((day, i) => (
          <div key={day} className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500">{day}</span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                data.weeklyCheckmarks[i]
                  ? "bg-[#65D9AC] text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
              aria-label={`${day}요일 ${
                data.weeklyCheckmarks[i] ? "달성" : "미달성"
              }`}
            >
              {data.weeklyCheckmarks[i] ? "✓" : "○"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 주간 달성 추이 - LineChart */
const WeeklyTrendChart = ({ data }: { data: StatsData }) => {
  if (data.dailyRates.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#6C5CE7]" />
          <h3 className="text-[15px] font-semibold text-gray-900">
            달성 추이
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <TrendingUp className="w-12 h-12 mb-3" />
          <p className="text-sm">아직 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#6C5CE7]" />
        <h3 className="text-[15px] font-semibold text-gray-900">달성 추이</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data.dailyRates}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, "달성률"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#65D9AC"
            strokeWidth={2}
            dot={{ fill: "#65D9AC", r: 3 }}
            activeDot={{ r: 5, fill: "#65D9AC" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/** 카테고리별 시간 분배 - PieChart 도넛 */
const CategoryPieChart = ({ data }: { data: StatsData }) => {
  if (data.categoryDistribution.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-5 h-5 text-[#E36185]" />
          <h3 className="text-[15px] font-semibold text-gray-900">
            카테고리별 분배
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <PieChartIcon className="w-12 h-12 mb-3" />
          <p className="text-sm">아직 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-5 h-5 text-[#E36185]" />
        <h3 className="text-[15px] font-semibold text-gray-900">
          카테고리별 분배
        </h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.categoryDistribution}
                innerRadius={55}
                outerRadius={80}
                dataKey="percentage"
                nameKey="category"
                stroke="none"
              >
                {data.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name,
                ]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 shrink-0 min-w-[100px]">
          {data.categoryDistribution.map((cat) => (
            <div key={cat.category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-xs text-gray-600 truncate">
                {cat.category}
              </span>
              <span className="text-xs font-medium text-gray-900 ml-auto">
                {cat.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** 루틴별 완료율 - 프로그레스 바 */
const RoutineProgressBars = ({ data }: { data: StatsData }) => {
  if (data.routineStats.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-5 h-5 text-[#F59E0B]" />
          <h3 className="text-[15px] font-semibold text-gray-900">
            루틴별 완료율
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <ListChecks className="w-12 h-12 mb-3" />
          <p className="text-sm">아직 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="w-5 h-5 text-[#F59E0B]" />
        <h3 className="text-[15px] font-semibold text-gray-900">
          루틴별 완료율
        </h3>
      </div>
      <div className="space-y-3">
        {data.routineStats.map((routine) => (
          <div key={routine.routineId} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 truncate max-w-[200px]">
                {routine.routineName}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(routine.completionRate)}%
              </span>
            </div>
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#65D9AC] rounded-full h-3 transition-all duration-500"
                style={{
                  width: `${Math.min(100, routine.completionRate)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 로딩 스켈레톤 */
const StatsSkeleton = () => {
  return (
    <div className="space-y-4">
      {[200, 180, 200, 200, 150].map((h, i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
        >
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="w-full" style={{ height: h }} />
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Page Component
// ============================================================================

const ProgressStatsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("get_user_stats", {
        target_user_id: user.id,
        period,
      });

      if (rpcError) throw rpcError;
      setStats(parseStatsResponse(data));
    } catch (err) {
      setError("통계 데이터를 불러오지 못했습니다");
      // FB-004 resolved: get_user_stats RPC 구현 완료 — 실패 시 빈 데이터로 폴백
      setStats({
        totalCompleted: 0,
        totalTasks: 0,
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyCheckmarks: [false, false, false, false, false, false, false],
        dailyRates: [],
        categoryDistribution: [],
        routineStats: [],
      });
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">통계</h1>
          <div className="w-10" />
        </div>

        {/* 기간 필터 */}
        <div className="flex gap-2 px-4 pb-3">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer border-none ${
                period === opt.value
                  ? "bg-[#65D9AC] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              aria-pressed={period === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4 pb-24">
        {loading ? (
          <StatsSkeleton />
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <BarChart3 className="w-12 h-12 mb-4" />
            <p className="text-lg">로그인이 필요합니다</p>
          </div>
        ) : error && !stats ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <BarChart3 className="w-12 h-12 mb-4" />
            <p className="text-lg">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 px-4 py-2 bg-[#65D9AC] text-white rounded-xl text-sm font-medium cursor-pointer border-none"
            >
              다시 시도
            </button>
          </div>
        ) : stats ? (
          <>
            <CompletionRateChart data={stats} />
            <StreakSection data={stats} />
            <WeeklyTrendChart data={stats} />
            <CategoryPieChart data={stats} />
            <RoutineProgressBars data={stats} />
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProgressStatsPage;
