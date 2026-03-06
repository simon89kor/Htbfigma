import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, AlertTriangle, Eye, EyeOff, Trash2 } from 'lucide-react';
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
  getAdminPosts,
  updatePostStatus,
  getPostReports,
  updateReportStatus,
} from '@/lib/api/admin';
import type { AdminPostRow, AdminReportRow } from '@/lib/api/admin';
import type { Post } from '@/lib/database.types';
import { cn } from '../ui/utils';

// ============================================================================
// Constants
// ============================================================================

const ITEMS_PER_PAGE = 20;

const STATUS_LABELS: Record<Post['status'], string> = {
  active: '게시',
  hidden: '숨김',
  deleted: '삭제',
};

const STATUS_COLORS: Record<Post['status'], string> = {
  active: 'bg-[#e8faf3] text-[#059669] border-transparent',
  hidden: 'bg-[#fef3c7] text-[#d97706] border-transparent',
  deleted: 'bg-[#fee2e2] text-[#dc2626] border-transparent',
};

const CATEGORY_LABELS: Record<string, string> = {
  mytobe: 'MyToBe',
  now: 'NOW',
  gratitude: '감사',
  diet: '다이어트',
  exercise: '운동',
  selfdev: '자기계발',
  general: '일반',
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  reviewed: '검토 중',
  resolved: '처리 완료',
  dismissed: '기각',
};

// ============================================================================
// Component
// ============================================================================

const AdminPostModeration = () => {
  const [posts, setPosts] = useState<AdminPostRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reportFilter, setReportFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Action dialog
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    post: AdminPostRow | null;
    action: Post['status'] | null;
  }>({ open: false, post: null, action: null });

  // Report detail sheet
  const [reportDialog, setReportDialog] = useState<{
    open: boolean;
    postId: string | null;
    reports: AdminReportRow[];
    loading: boolean;
  }>({ open: false, postId: null, reports: [], loading: false });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, count } = await getAdminPosts({
        search: search || undefined,
        status: statusFilter as Post['status'] | 'all',
        hasReport: reportFilter || undefined,
        page,
        limit: ITEMS_PER_PAGE,
      });
      setPosts(data);
      setTotalCount(count);
    } catch {
      setPosts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, reportFilter, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handlePostAction = async () => {
    const { post, action } = actionDialog;
    if (!post || !action) return;
    try {
      await updatePostStatus(post.id, action);
      const label = STATUS_LABELS[action];
      toast.success(`게시물이 ${label} 처리되었습니다.`);
      setActionDialog({ open: false, post: null, action: null });
      fetchPosts();
    } catch {
      toast.error('처리에 실패했습니다.');
    }
  };

  const openReportDialog = async (postId: string) => {
    setReportDialog({ open: true, postId, reports: [], loading: true });
    try {
      const reports = await getPostReports(postId);
      setReportDialog((prev) => ({ ...prev, reports, loading: false }));
    } catch {
      setReportDialog((prev) => ({ ...prev, loading: false }));
      toast.error('신고 내역을 불러오지 못했습니다.');
    }
  };

  const handleReportDismiss = async (reportId: string) => {
    try {
      await updateReportStatus(reportId, 'dismissed', '관리자 기각');
      toast.success('신고가 기각되었습니다.');
      // Refresh the report list
      if (reportDialog.postId) {
        const reports = await getPostReports(reportDialog.postId);
        setReportDialog((prev) => ({ ...prev, reports }));
      }
    } catch {
      toast.error('처리에 실패했습니다.');
    }
  };

  const handleReportResolve = async (reportId: string) => {
    try {
      await updateReportStatus(reportId, 'resolved', '관리자 처리 완료');
      toast.success('신고가 처리 완료되었습니다.');
      if (reportDialog.postId) {
        const reports = await getPostReports(reportDialog.postId);
        setReportDialog((prev) => ({ ...prev, reports }));
      }
    } catch {
      toast.error('처리에 실패했습니다.');
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
            placeholder="게시물 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="active">게시</SelectItem>
            <SelectItem value="hidden">숨김</SelectItem>
            <SelectItem value="deleted">삭제</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={reportFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setReportFilter(!reportFilter); setPage(1); }}
          className={cn(
            reportFilter && 'bg-[var(--destructive)] hover:bg-[#b91535] text-white'
          )}
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          신고 있음
        </Button>
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
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-foreground/60">
            <FileText size={48} className="mb-4 opacity-40" />
            <p className="text-lg">게시물이 없습니다</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-white/5">
                  <TableHead className="w-[60px]">번호</TableHead>
                  <TableHead className="w-[100px]">작성자</TableHead>
                  <TableHead>내용</TableHead>
                  <TableHead className="w-[80px]">카테고리</TableHead>
                  <TableHead className="w-[60px]">신고</TableHead>
                  <TableHead className="w-[70px]">상태</TableHead>
                  <TableHead className="w-[100px]">작성일</TableHead>
                  <TableHead className="w-[160px]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post, index) => (
                  <TableRow key={post.id}>
                    <TableCell className="text-foreground/60 text-xs">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell className="text-sm text-foreground truncate max-w-[100px]">
                      {post.profiles?.nickname ?? '-'}
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[220px]">
                        {post.title && (
                          <span className="font-medium text-foreground">
                            {post.title}{' '}
                          </span>
                        )}
                        <span className="text-sm text-foreground/60">
                          {post.content.substring(0, 50)}
                          {post.content.length > 50 ? '...' : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[post.category] ?? post.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(post.report_count ?? 0) > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[var(--destructive)] hover:bg-[#fee2e2]"
                          onClick={() => openReportDialog(post.id)}
                        >
                          <AlertTriangle className="w-3 h-3 mr-0.5" />
                          {post.report_count}
                        </Button>
                      ) : (
                        <span className="text-xs text-foreground/60">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', STATUS_COLORS[post.status])}>
                        {STATUS_LABELS[post.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground/60">
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {post.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                post,
                                action: 'hidden',
                              })
                            }
                            title="숨김"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {post.status === 'hidden' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-[#059669]"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                post,
                                action: 'active',
                              })
                            }
                            title="게시 복원"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {post.status !== 'deleted' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-[var(--destructive)] hover:bg-[#fee2e2]"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                post,
                                action: 'deleted',
                              })
                            }
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Action Confirm Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open && setActionDialog({ open: false, post: null, action: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              게시물{' '}
              {actionDialog.action === 'hidden'
                ? '숨김'
                : actionDialog.action === 'active'
                  ? '복원'
                  : '삭제'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'hidden'
                ? '이 게시물을 숨김 처리하시겠습니까?'
                : actionDialog.action === 'active'
                  ? '이 게시물을 다시 게시하시겠습니까?'
                  : '이 게시물을 삭제하시겠습니까? 삭제된 게시물은 유저에게 노출되지 않습니다.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, post: null, action: null })
              }
            >
              취소
            </Button>
            <Button
              variant={actionDialog.action === 'deleted' ? 'destructive' : 'default'}
              onClick={handlePostAction}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog
        open={reportDialog.open}
        onOpenChange={(open) =>
          !open &&
          setReportDialog({
            open: false,
            postId: null,
            reports: [],
            loading: false,
          })
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>신고 내역</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {reportDialog.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : reportDialog.reports.length === 0 ? (
              <p className="text-center text-foreground/60 py-8">
                신고 내역이 없습니다
              </p>
            ) : (
              reportDialog.reports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 rounded-lg border border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {report.profiles?.nickname ?? '알 수 없음'}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {REPORT_STATUS_LABELS[report.status] ?? report.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-foreground/60">
                      {new Date(report.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/60">
                    <span className="font-medium">사유:</span> {report.reason || '없음'}
                  </p>
                  {report.description && (
                    <p className="text-sm text-foreground/60">
                      <span className="font-medium">상세:</span> {report.description}
                    </p>
                  )}
                  {report.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleReportDismiss(report.id)}
                      >
                        기각
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-[var(--accent-color)] hover:bg-[#4dc99a]"
                        onClick={() => handleReportResolve(report.id)}
                      >
                        처리 완료
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPostModeration;
