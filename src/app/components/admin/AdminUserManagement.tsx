import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Search, Users } from 'lucide-react';
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
import { Skeleton } from '../ui/skeleton';
import { getAdminUsers } from '@/lib/api/admin';
import type { Profile } from '@/lib/database.types';
import { cn } from '../ui/utils';

// ============================================================================
// Constants
// ============================================================================

const ITEMS_PER_PAGE = 20;

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

// ============================================================================
// Component
// ============================================================================

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, count } = await getAdminUsers({
        search: search || undefined,
        status: statusFilter as Profile['status'] | 'all',
        role: roleFilter as Profile['role'] | 'all',
        page,
        limit: ITEMS_PER_PAGE,
      });
      setUsers(data);
      setTotalCount(count);
    } catch {
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
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

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

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
              className={cn(
                'cursor-pointer',
                page <= 1 && 'pointer-events-none opacity-50'
              )}
            />
          </PaginationItem>
          {pages.map((p, i) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${i}`}>
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
              className={cn(
                'cursor-pointer',
                page >= totalPages && 'pointer-events-none opacity-50'
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="닉네임 또는 이메일 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="suspended">정지</SelectItem>
            <SelectItem value="deleted">탈퇴</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="역할" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 역할</SelectItem>
            <SelectItem value="user">일반</SelectItem>
            <SelectItem value="provider">Provider</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} size="sm">
          검색
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
            <Users size={48} className="mb-4 opacity-40" />
            <p className="text-lg">유저가 없습니다</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--bg-secondary)]">
                  <TableHead className="w-[60px]">번호</TableHead>
                  <TableHead>닉네임</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead className="w-[100px]">역할</TableHead>
                  <TableHead className="w-[80px]">상태</TableHead>
                  <TableHead className="w-[120px]">가입일</TableHead>
                  <TableHead className="w-[100px]">최근 활동</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-[#f9fafb]"
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                  >
                    <TableCell className="text-[var(--text-secondary)] text-xs">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[var(--primary)] rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-xs">
                            {user.nickname?.[0] ?? '?'}
                          </span>
                        </div>
                        <span className="font-medium text-[var(--primary)] truncate max-w-[120px]">
                          {user.nickname || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--text-secondary)] text-sm truncate max-w-[180px]">
                      {user.email || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', ROLE_COLORS[user.role])}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', STATUS_COLORS[user.status])}>
                        {STATUS_LABELS[user.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[var(--text-secondary)] text-xs">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-[var(--text-secondary)] text-xs">
                      {user.last_active_date
                        ? new Date(user.last_active_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
              <p className="text-sm text-[var(--text-secondary)]">
                총 {totalCount.toLocaleString()}명
              </p>
              {renderPagination()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagement;
