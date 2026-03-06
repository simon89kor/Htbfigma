import { useState, useEffect, useCallback } from 'react';
import { Search, ClipboardList } from 'lucide-react';
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
  getAdminRoutines,
  updateRoutineStatus,
  archiveRoutine,
} from '@/lib/api/admin';
import type { AdminRoutineRow } from '@/lib/api/admin';
import type { Routine } from '@/lib/database.types';
import { cn } from '../ui/utils';

// ============================================================================
// Constants
// ============================================================================

const ITEMS_PER_PAGE = 20;

const STATUS_LABELS: Record<Routine['status'], string> = {
  draft: '비발행',
  published: '발행',
  archived: '보관',
};

const STATUS_COLORS: Record<Routine['status'], string> = {
  draft: 'bg-[var(--secondary)] text-[var(--accent)] border-transparent',
  published: 'bg-[#e8faf3] text-[#059669] border-transparent',
  archived: 'bg-[#fee2e2] text-[#dc2626] border-transparent',
};

const CATEGORIES = ['전체', '건강', '운동', '학습', '생산성', '마음챙김', '재테크', '습관', '자기계발'];

// ============================================================================
// Component
// ============================================================================

const AdminRoutineManagement = () => {
  const [routines, setRoutines] = useState<AdminRoutineRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [archiveDialogId, setArchiveDialogId] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const fetchRoutines = useCallback(async () => {
    try {
      setLoading(true);
      const { data, count } = await getAdminRoutines({
        search: search || undefined,
        category: categoryFilter !== '전체' ? categoryFilter : undefined,
        status: statusFilter as Routine['status'] | 'all',
        page,
        limit: ITEMS_PER_PAGE,
      });
      setRoutines(data);
      setTotalCount(count);
    } catch {
      setRoutines([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, page]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleTogglePublish = async (routine: AdminRoutineRow) => {
    const newStatus: Routine['status'] =
      routine.status === 'published' ? 'draft' : 'published';
    try {
      await updateRoutineStatus(routine.id, newStatus);
      toast.success(
        newStatus === 'published' ? '루틴이 발행되었습니다.' : '루틴이 비발행 처리되었습니다.'
      );
      fetchRoutines();
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleArchive = async () => {
    if (!archiveDialogId) return;
    try {
      await archiveRoutine(archiveDialogId);
      toast.success('루틴이 보관 처리되었습니다.');
      setArchiveDialogId(null);
      fetchRoutines();
    } catch {
      toast.error('보관 처리에 실패했습니다.');
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
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white/8 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60" />
          <Input
            placeholder="루틴 제목 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="published">발행</SelectItem>
            <SelectItem value="draft">비발행</SelectItem>
            <SelectItem value="archived">보관</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} size="sm">
          검색
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white/8 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : routines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-foreground/60">
            <ClipboardList size={48} className="mb-4 opacity-40" />
            <p className="text-lg">루틴이 없습니다</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-white/5">
                  <TableHead className="w-[60px]">번호</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-[100px]">Provider</TableHead>
                  <TableHead className="w-[90px]">카테고리</TableHead>
                  <TableHead className="w-[80px]">가격</TableHead>
                  <TableHead className="w-[60px]">판매</TableHead>
                  <TableHead className="w-[60px]">평점</TableHead>
                  <TableHead className="w-[70px]">상태</TableHead>
                  <TableHead className="w-[140px]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routines.map((routine, index) => (
                  <TableRow key={routine.id}>
                    <TableCell className="text-foreground/60 text-xs">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-foreground truncate max-w-[200px]">
                      {routine.title}
                    </TableCell>
                    <TableCell className="text-sm text-foreground/60 truncate max-w-[100px]">
                      {routine.profiles?.nickname ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {routine.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {routine.price === 0
                        ? '무료'
                        : `₩${routine.price.toLocaleString()}`}
                    </TableCell>
                    <TableCell className="text-sm text-foreground/60">
                      {routine.purchase_count}
                    </TableCell>
                    <TableCell className="text-sm text-foreground/60">
                      {routine.rating.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', STATUS_COLORS[routine.status])}>
                        {STATUS_LABELS[routine.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {routine.status !== 'archived' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => handleTogglePublish(routine)}
                          >
                            {routine.status === 'published' ? '비발행' : '발행'}
                          </Button>
                        )}
                        {routine.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[#fee2e2]"
                            onClick={() => setArchiveDialogId(routine.id)}
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <p className="text-sm text-foreground/60">
                총 {totalCount.toLocaleString()}개
              </p>
              {renderPagination()}
            </div>
          </>
        )}
      </div>

      {/* Archive Confirm Dialog */}
      <Dialog
        open={!!archiveDialogId}
        onOpenChange={(open) => !open && setArchiveDialogId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>루틴 삭제(보관)</DialogTitle>
            <DialogDescription>
              이 루틴을 보관 처리하시겠습니까? 보관된 루틴은 유저에게 노출되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogId(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleArchive}>
              보관 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRoutineManagement;
