import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  ShoppingBag,
  FileText,
  ClipboardList,
  DollarSign,
  Calendar,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import {
  getAdminUser,
  getAdminUserStats,
  getAdminUserPurchases,
  updateUserRole,
  updateUserStatus,
} from '@/lib/api/admin';
import type { Profile } from '@/lib/database.types';
import type { AdminPurchaseRow } from '@/lib/api/admin';
import { cn } from '../ui/utils';

// ============================================================================
// Constants
// ============================================================================

const ROLE_LABELS: Record<Profile['role'], string> = {
  user: '일반',
  provider: 'Provider',
  admin: 'Admin',
};

const ROLE_COLORS: Record<Profile['role'], string> = {
  user: 'bg-[var(--secondary)] text-[var(--accent)] border-transparent',
  provider: 'bg-[#e8faf3] text-[#059669] border-transparent',
  admin: 'bg-[#fef3c7] text-[#d97706] border-transparent',
};

const STATUS_LABELS: Record<Profile['status'], string> = {
  active: '활성',
  suspended: '정지',
  deleted: '탈퇴',
};

const STATUS_COLORS: Record<Profile['status'], string> = {
  active: 'bg-[#e8faf3] text-[#059669] border-transparent',
  suspended: 'bg-[#fef3c7] text-[#d97706] border-transparent',
  deleted: 'bg-[#fee2e2] text-[#dc2626] border-transparent',
};

interface UserStats {
  purchaseCount: number;
  customRoutineCount: number;
  postCount: number;
  totalSpent: number;
}

// ============================================================================
// Component
// ============================================================================

const AdminUserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [purchases, setPurchases] = useState<AdminPurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'suspend' | 'delete' | null;
  }>({ open: false, type: null });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [userData, statsData, purchaseData] = await Promise.all([
          getAdminUser(id),
          getAdminUserStats(id),
          getAdminUserPurchases(id, { limit: 10 }),
        ]);
        setProfile(userData);
        setStats(statsData);
        setPurchases(purchaseData.data);
      } catch {
        toast.error('유저 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleRoleChange = async (newRole: string) => {
    if (!id || !profile) return;
    try {
      setSaving(true);
      const updated = await updateUserRole(id, newRole as Profile['role']);
      setProfile(updated);
      toast.success(`역할이 ${ROLE_LABELS[newRole as Profile['role']]}로 변경되었습니다.`);
    } catch {
      toast.error('역할 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAction = async () => {
    if (!id || !profile || !confirmDialog.type) return;
    try {
      setSaving(true);
      const newStatus: Profile['status'] =
        confirmDialog.type === 'suspend'
          ? profile.status === 'suspended'
            ? 'active'
            : 'suspended'
          : 'deleted';

      const updated = await updateUserStatus(id, newStatus);
      setProfile(updated);

      const message =
        newStatus === 'active'
          ? '정지가 해제되었습니다.'
          : newStatus === 'suspended'
            ? '계정이 정지되었습니다.'
            : '탈퇴 처리되었습니다.';
      toast.success(message);
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    } finally {
      setSaving(false);
      setConfirmDialog({ open: false, type: null });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-foreground/60">
        <User size={48} className="mb-4 opacity-40" />
        <p className="text-lg">유저를 찾을 수 없습니다</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/users')}>
          유저 목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-foreground/60 hover:text-foreground"
        onClick={() => navigate('/admin/users')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        유저 목록
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="bg-white/8 shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-[var(--primary)] rounded-full flex items-center justify-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.nickname}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl font-medium">
                    {profile.nickname?.[0] ?? '?'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{profile.nickname}</p>
                <p className="text-sm text-foreground/60">{profile.email}</p>
              </div>
            </div>

            {/* Info Fields */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">ID</span>
                <span className="text-xs text-foreground/60 font-mono truncate max-w-[160px]">
                  {profile.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">가입일</span>
                <span className="text-sm text-foreground">
                  {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">상태</span>
                <Badge className={cn('text-xs', STATUS_COLORS[profile.status])}>
                  {STATUS_LABELS[profile.status]}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">역할</span>
                <Select
                  value={profile.role}
                  onValueChange={handleRoleChange}
                  disabled={saving}
                >
                  <SelectTrigger className="w-[120px] h-8" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">일반</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">최근 접속</span>
                <span className="text-sm text-foreground">
                  {profile.last_active_date
                    ? new Date(profile.last_active_date).toLocaleDateString('ko-KR')
                    : '-'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-white/10">
              {profile.status !== 'deleted' && (
                <>
                  <Button
                    variant={profile.status === 'suspended' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmDialog({ open: true, type: 'suspend' })}
                    disabled={saving}
                  >
                    {profile.status === 'suspended' ? '정지 해제' : '정지'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmDialog({ open: true, type: 'delete' })}
                    disabled={saving}
                  >
                    탈퇴처리
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card className="bg-white/8 shadow-sm border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              활동 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatItem
                icon={ShoppingBag}
                label="구매 루틴"
                value={`${stats?.purchaseCount ?? 0}개`}
                iconColor="text-[var(--accent)]"
                iconBg="bg-[var(--secondary)]"
              />
              <StatItem
                icon={ClipboardList}
                label="커스텀 루틴"
                value={`${stats?.customRoutineCount ?? 0}개`}
                iconColor="text-[#3b82f6]"
                iconBg="bg-[#eff6ff]"
              />
              <StatItem
                icon={FileText}
                label="게시물"
                value={`${stats?.postCount ?? 0}개`}
                iconColor="text-[var(--accent-color)]"
                iconBg="bg-[#e8faf3]"
              />
              <StatItem
                icon={DollarSign}
                label="총 결제금액"
                value={`₩${(stats?.totalSpent ?? 0).toLocaleString()}`}
                iconColor="text-[#f59e0b]"
                iconBg="bg-[#fef3c7]"
              />
            </div>

            {/* Streak / Profile extras */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xs text-foreground/60 mb-1">현재 스트릭</p>
                <p className="text-lg font-bold text-foreground">{profile.current_streak}일</p>
              </div>
              <div>
                <p className="text-xs text-foreground/60 mb-1">최장 스트릭</p>
                <p className="text-lg font-bold text-foreground">{profile.longest_streak}일</p>
              </div>
              <div>
                <p className="text-xs text-foreground/60 mb-1">완료 루틴</p>
                <p className="text-lg font-bold text-foreground">{profile.total_completed_routines}개</p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-foreground/60 mb-1">자기소개</p>
                <p className="text-sm text-foreground">{profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Purchase History */}
      <Card className="bg-white/8 shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            구매 내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-white/5">
                  <TableHead>루틴</TableHead>
                  <TableHead className="w-[100px]">기간</TableHead>
                  <TableHead className="w-[100px]">금액</TableHead>
                  <TableHead className="w-[80px]">결제수단</TableHead>
                  <TableHead className="w-[80px]">상태</TableHead>
                  <TableHead className="w-[110px]">결제일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium text-foreground truncate max-w-[200px]">
                      {purchase.routines?.title ?? '-'}
                    </TableCell>
                    <TableCell className="text-sm text-foreground/60">
                      {purchase.period_label}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      ₩{purchase.final_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-foreground/60">
                      {purchase.payment_method}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'text-xs',
                          purchase.status === 'completed'
                            ? 'bg-[#e8faf3] text-[#059669] border-transparent'
                            : purchase.status === 'refunded'
                              ? 'bg-[#fee2e2] text-[#dc2626] border-transparent'
                              : 'bg-[var(--secondary)] text-[var(--accent)] border-transparent'
                        )}
                      >
                        {purchase.status === 'completed'
                          ? '완료'
                          : purchase.status === 'refunded'
                            ? '환불'
                            : purchase.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground/60">
                      {new Date(purchase.purchased_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-foreground/60">
              <Calendar size={36} className="mb-2 opacity-40" />
              <p className="text-sm">구매 내역이 없습니다</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, type: open ? confirmDialog.type : null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'suspend'
                ? profile.status === 'suspended'
                  ? '정지 해제'
                  : '계정 정지'
                : '탈퇴 처리'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'suspend'
                ? profile.status === 'suspended'
                  ? `${profile.nickname}님의 정지를 해제하시겠습니까?`
                  : `${profile.nickname}님의 계정을 정지하시겠습니까?`
                : `${profile.nickname}님을 탈퇴 처리하시겠습니까? 이 작업은 되돌리기 어렵습니다.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, type: null })}
            >
              취소
            </Button>
            <Button
              variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
              onClick={handleStatusAction}
              disabled={saving}
            >
              {saving ? '처리 중...' : '확인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================================
// Sub Component
// ============================================================================

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor: string;
  iconBg: string;
}

const StatItem = ({ icon: Icon, label, value, iconColor, iconBg }: StatItemProps) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
      <Icon className={cn('w-4 h-4', iconColor)} />
    </div>
    <div>
      <p className="text-xs text-foreground/60">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

export default AdminUserDetail;
