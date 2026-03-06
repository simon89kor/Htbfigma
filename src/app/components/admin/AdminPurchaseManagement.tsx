import { useState, useEffect, useCallback } from 'react';
import { Search, CreditCard } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '../ui/pagination';
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
  getAdminPurchases,
  adminRefundPurchase,
} from '@/lib/api/admin';
import type { AdminPurchaseRow } from '@/lib/api/admin';
import type { Purchase } from '@/lib/database.types';
import { cn } from '../ui/utils';

// ============================================================================
// Constants
// ============================================================================

const ITEMS_PER_PAGE = 20;

const STATUS_LABELS: Record<Purchase['status'], string> = {
  pending: '대기',
  completed: '완료',
  refunded: '환불',
  cancelled: '취소',
};

const STATUS_COLORS: Record<Purchase['status'], string> = {
  pending: 'bg-[#fef3c7] text-[#d97706] border-transparent',
  completed: 'bg-[#e8faf3] text-[#059669] border-transparent',
  refunded: 'bg-[#fee2e2] text-[#dc2626] border-transparent',
  cancelled: 'bg-[var(--secondary)] text-[var(--accent)] border-transparent',
};

const PAYMENT_LABELS: Record<Purchase['payment_method'], string> = {
  card: '카드',
  kakao: '카카오',
  toss: '토스',
  naver: '네이버',
  free: '무료',
};

// ============================================================================
// Component
// ============================================================================

const AdminPurchaseManagement = () => {
  const [purchases, setPurchases] = useState<AdminPurchaseRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refundTarget, setRefundTarget] = useState<AdminPurchaseRow | null>(null);
  const [refunding, setRefunding] = useState(false);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Revenue summary
  const totalRevenue = purchases
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.final_amount, 0);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const { data, count } = await getAdminPurchases({
        status: statusFilter as Purchase['status'] | 'all',
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: ITEMS_PER_PAGE,
      });
      setPurchases(data);
      setTotalCount(count);
    } catch {
      setPurchases([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleRefund = async () => {
    if (!refundTarget) return;
    try {
      setRefunding(true);
      await adminRefundPurchase(refundTarget.id);
      toast.success('환불 처리가 완료되었습니다.');
      setRefundTarget(null);
      fetchPurchases();
    } catch {
      toast.error('환불 처리에 실패했습니다.');
    } finally {
      setRefunding(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('ellipsis');
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('ellipsis');
      pages.push(totalPages);
    }

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(1, page - 1))}
              className={cn('cursor-pointer', page <= 1 && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>
          {pages.map((p, i) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`e-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={page === p}
                  onClick={() => setPage(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              className={cn('cursor-pointer', page >= totalPages && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-4">
      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/8 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-foreground/60">페이지 내 매출 합계</p>
          <p className="text-xl font-bold text-foreground mt-1">
            ₩{totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white/8 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-foreground/60">전체 건수</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {totalCount.toLocaleString()}건
          </p>
        </div>
        <div className="bg-white/8 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-foreground/60">현재 페이지</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {purchases.length}건
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white/8 rounded-xl p-4 shadow-sm">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
            <SelectItem value="refunded">환불</SelectItem>
            <SelectItem value="pending">대기</SelectItem>
            <SelectItem value="cancelled">취소</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-[150px]"
            aria-label="시작일"
          />
          <span className="text-foreground/60">~</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-[150px]"
            aria-label="종료일"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/8 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-foreground/60">
            <CreditCard size={48} className="mb-4 opacity-40" />
            <p className="text-lg">구매 내역이 없습니다</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-white/5">
                  <TableHead className="w-[60px]">번호</TableHead>
                  <TableHead className="w-[100px]">유저</TableHead>
                  <TableHead>루틴</TableHead>
                  <TableHead className="w-[80px]">기간</TableHead>
                  <TableHead className="w-[90px]">금액</TableHead>
                  <TableHead className="w-[80px]">결제수단</TableHead>
                  <TableHead className="w-[70px]">상태</TableHead>
                  <TableHead className="w-[110px]">결제일</TableHead>
                  <TableHead className="w-[80px]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase, index) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="text-foreground/60 text-xs">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell className="text-sm text-foreground truncate max-w-[100px]">
                      {purchase.profiles?.nickname ?? '-'}
                    </TableCell>
                    <TableCell className="font-medium text-foreground truncate max-w-[180px]">
                      {purchase.routines?.title ?? '-'}
                    </TableCell>
                    <TableCell className="text-sm text-foreground/60">
                      {purchase.period_label}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      ₩{purchase.final_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-foreground/60">
                      {PAYMENT_LABELS[purchase.payment_method] ?? purchase.payment_method}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', STATUS_COLORS[purchase.status])}>
                        {STATUS_LABELS[purchase.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground/60">
                      {new Date(purchase.purchased_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      {purchase.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[#fee2e2] border-[var(--destructive)]/30"
                          onClick={() => setRefundTarget(purchase)}
                        >
                          환불
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <p className="text-sm text-foreground/60">
                총 {totalCount.toLocaleString()}건
              </p>
              {renderPagination()}
            </div>
          </>
        )}
      </div>

      {/* Refund Confirm Dialog */}
      <Dialog
        open={!!refundTarget}
        onOpenChange={(open) => !open && setRefundTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환불 처리</DialogTitle>
            <DialogDescription>
              {refundTarget && (
                <>
                  <strong>{refundTarget.profiles?.nickname}</strong>님의{' '}
                  <strong>{refundTarget.routines?.title}</strong> 구매건을 환불
                  처리하시겠습니까?
                  <br />
                  환불 금액: ₩{refundTarget.final_amount.toLocaleString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={refunding}
            >
              {refunding ? '처리 중...' : '환불 처리'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPurchaseManagement;
