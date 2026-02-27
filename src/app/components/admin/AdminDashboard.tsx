import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Users,
  UserPlus,
  DollarSign,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  getDashboardStats,
  getWeeklySignups,
  getCategoryRevenue,
  getRecentReports,
} from '@/lib/api/admin';
import type {
  DashboardStats,
  WeeklySignup,
  CategoryRevenue,
  AdminReportRow,
} from '@/lib/api/admin';
import { cn } from '../ui/utils';

// ============================================================================
// Constants
// ============================================================================

const REPORT_TARGET_LABELS: Record<string, string> = {
  post: '게시물',
  comment: '댓글',
  user: '유저',
};

// ============================================================================
// KPI Card
// ============================================================================

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

const KpiCard = ({ title, value, subtitle, icon: Icon, iconColor, iconBg }: KpiCardProps) => (
  <Card className="bg-white shadow-sm border-0">
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">{title}</p>
          <p className="text-2xl font-bold text-[var(--primary)] mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// Main Component
// ============================================================================

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklySignups, setWeeklySignups] = useState<WeeklySignup[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [recentReports, setRecentReports] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, signupsData, revenueData, reportsData] =
          await Promise.all([
            getDashboardStats(),
            getWeeklySignups(),
            getCategoryRevenue(),
            getRecentReports(5),
          ]);

        setStats(statsData);
        setWeeklySignups(signupsData);
        setCategoryRevenue(revenueData);
        setRecentReports(reportsData);
      } catch (err) {
        setError('대시보드 데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) {
      return `₩${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      return `₩${(amount / 1_000).toFixed(0)}K`;
    }
    return `₩${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => num.toLocaleString();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
        <AlertTriangle size={48} className="mb-4" />
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="전체 유저"
          value={formatNumber(stats?.totalUsers ?? 0)}
          icon={Users}
          iconColor="text-[var(--accent)]"
          iconBg="bg-[var(--secondary)]"
        />
        <KpiCard
          title="신규 가입"
          value={`+${formatNumber(stats?.newUsersThisWeek ?? 0)}`}
          subtitle="이번 주"
          icon={UserPlus}
          iconColor="text-[var(--accent-color)]"
          iconBg="bg-[#e8faf3]"
        />
        <KpiCard
          title="총 매출"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          subtitle={`이번 달: ${formatCurrency(stats?.revenueThisMonth ?? 0)}`}
          icon={DollarSign}
          iconColor="text-[#f59e0b]"
          iconBg="bg-[#fef3c7]"
        />
        <KpiCard
          title="활성 루틴"
          value={formatNumber(stats?.activeRoutines ?? 0)}
          icon={ClipboardList}
          iconColor="text-[#3b82f6]"
          iconBg="bg-[#eff6ff]"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Signups Line Chart */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--primary)]">
              주간 가입자 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklySignups.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={weeklySignups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="가입자 수"
                    stroke="var(--accent-color)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--accent-color)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-[var(--text-muted)]">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Revenue Bar Chart */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--primary)]">
              카테고리별 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={categoryRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출']}
                  />
                  <Bar
                    dataKey="revenue"
                    name="매출"
                    fill="var(--accent)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-[var(--text-muted)]">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DAU Area Chart + Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DAU Chart - using weekly signups as proxy data */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--primary)]">
              일일 활성 유저 (DAU)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklySignups.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={weeklySignups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                    }}
                  />
                  <defs>
                    <linearGradient id="dauGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="활성 유저"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#dauGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-[var(--text-muted)]">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--primary)]">
              최근 신고
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentReports.length > 0 ? (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] hover:bg-[#EBEBEB] transition-colors cursor-pointer"
                    onClick={() => navigate('/admin/posts')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate('/admin/posts');
                    }}
                  >
                    <div className="w-8 h-8 bg-[#fef3c7] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {REPORT_TARGET_LABELS[report.target_type] ?? report.target_type}
                        </Badge>
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(report.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--primary)] mt-1 truncate">
                        {report.reason || '사유 없음'}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                        신고자: {report.profiles?.nickname ?? '알 수 없음'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-[var(--text-muted)]">
                <AlertTriangle size={36} className="mb-2 opacity-40" />
                <p className="text-sm">미처리 신고가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
