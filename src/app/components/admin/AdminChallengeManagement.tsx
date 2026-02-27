import { useState, useEffect, useCallback } from 'react';
import { Search, Target, Plus, X, Users } from 'lucide-react';
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
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
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
  getAdminChallenges,
  getAdminChallengeParticipants,
  createAdminChallenge,
  updateAdminChallenge,
  cancelAdminChallenge,
} from '@/lib/api/admin';
import type {
  AdminChallengeRow,
  AdminChallengeParticipantRow,
} from '@/lib/api/admin';
import type { Challenge, ChallengeReward } from '@/lib/database.types';
import { cn } from '../ui/utils';

// ============================================================================
// Constants
// ============================================================================

const ITEMS_PER_PAGE = 20;

const STATUS_LABELS: Record<Challenge['status'], string> = {
  upcoming: '예정',
  active: '진행중',
  completed: '완료',
  cancelled: '취소',
};

const STATUS_COLORS: Record<Challenge['status'], string> = {
  upcoming: 'bg-[#dbeafe] text-[#2563eb] border-transparent',
  active: 'bg-[#e8faf3] text-[#059669] border-transparent',
  completed: 'bg-[#f3f4f6] text-[#6b7280] border-transparent',
  cancelled: 'bg-[#fee2e2] text-[#dc2626] border-transparent',
};

const CATEGORIES = ['전체', '운동', '식단', '자기개발', '학습', '생산성', '마음챙김', '기타'];

const REWARD_TYPE_LABELS: Record<ChallengeReward['type'], string> = {
  badge: '뱃지',
  coupon: '쿠폰',
  point: '포인트',
};

const PARTICIPANT_STATUS_LABELS: Record<string, string> = {
  active: '진행중',
  completed: '완료',
  withdrawn: '탈퇴',
};

const PARTICIPANT_STATUS_COLORS: Record<string, string> = {
  active: 'bg-[#e8faf3] text-[#059669] border-transparent',
  completed: 'bg-[#dbeafe] text-[#2563eb] border-transparent',
  withdrawn: 'bg-[#fee2e2] text-[#dc2626] border-transparent',
};

// ============================================================================
// Reward Form Row Type
// ============================================================================

interface RewardFormRow {
  type: ChallengeReward['type'];
  name: string;
  icon: string;
  description: string;
}

const EMPTY_REWARD: RewardFormRow = {
  type: 'badge',
  name: '',
  icon: '',
  description: '',
};

// ============================================================================
// Challenge Form Type
// ============================================================================

interface ChallengeFormData {
  title: string;
  description: string;
  category: string;
  status: Challenge['status'];
  image_url: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  rules: string;
  rewards: RewardFormRow[];
}

const INITIAL_FORM: ChallengeFormData = {
  title: '',
  description: '',
  category: '운동',
  status: 'upcoming',
  image_url: '',
  start_date: '',
  end_date: '',
  max_participants: 0,
  rules: '',
  rewards: [],
};

// ============================================================================
// Validation
// ============================================================================

interface FormErrors {
  title?: string;
  start_date?: string;
  end_date?: string;
  rewards?: string[];
}

function validateForm(data: ChallengeFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.title || data.title.trim().length < 2) {
    errors.title = '챌린지 제목을 입력해주세요 (2자 이상)';
  }
  if (!data.start_date) {
    errors.start_date = '시작일을 선택해주세요';
  }
  if (!data.end_date) {
    errors.end_date = '종료일을 선택해주세요';
  }
  if (data.start_date && data.end_date && data.end_date <= data.start_date) {
    errors.end_date = '종료일은 시작일 이후여야 합니다';
  }

  const rewardErrors: string[] = [];
  data.rewards.forEach((r, i) => {
    if (!r.name.trim()) {
      rewardErrors[i] = '보상 이름을 입력해주세요';
    }
  });
  if (rewardErrors.length > 0) {
    errors.rewards = rewardErrors;
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return (
    !!errors.title ||
    !!errors.start_date ||
    !!errors.end_date ||
    (errors.rewards?.some(Boolean) ?? false)
  );
}

// ============================================================================
// Component
// ============================================================================

const AdminChallengeManagement = () => {
  // List state
  const [challenges, setChallenges] = useState<AdminChallengeRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // CRUD Dialog
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    challengeId: string | null;
  }>({ open: false, mode: 'create', challengeId: null });
  const [form, setForm] = useState<ChallengeFormData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Cancel dialog
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    challenge: AdminChallengeRow | null;
  }>({ open: false, challenge: null });
  const [cancelling, setCancelling] = useState(false);

  // Participant dialog
  const [participantDialog, setParticipantDialog] = useState<{
    open: boolean;
    challenge: AdminChallengeRow | null;
    participants: AdminChallengeParticipantRow[];
    totalCount: number;
    page: number;
    loading: boolean;
    search: string;
    statusFilter: string;
  }>({
    open: false,
    challenge: null,
    participants: [],
    totalCount: 0,
    page: 1,
    loading: false,
    search: '',
    statusFilter: 'all',
  });

  // ---- Data fetching ----

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const { data, count } = await getAdminChallenges({
        search: search || undefined,
        status: statusFilter as Challenge['status'] | 'all',
        category: categoryFilter !== '전체' ? categoryFilter : undefined,
        page,
        limit: ITEMS_PER_PAGE,
      });
      setChallenges(data);
      setTotalCount(count);
    } catch {
      setChallenges([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, page]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // ---- Search ----

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  // ---- Open create dialog ----

  const openCreateDialog = () => {
    setForm(INITIAL_FORM);
    setFormErrors({});
    setFormDialog({ open: true, mode: 'create', challengeId: null });
  };

  // ---- Open edit dialog ----

  const openEditDialog = (challenge: AdminChallengeRow) => {
    setForm({
      title: challenge.title,
      description: challenge.description ?? '',
      category: challenge.category ?? '운동',
      status: challenge.status,
      image_url: challenge.image_url ?? '',
      start_date: challenge.start_date ? challenge.start_date.substring(0, 10) : '',
      end_date: challenge.end_date ? challenge.end_date.substring(0, 10) : '',
      max_participants: challenge.max_participants ?? 0,
      rules: (challenge.rules ?? []).join('\n'),
      rewards: (challenge.challenge_rewards ?? []).map((r) => ({
        type: r.type,
        name: r.name,
        icon: r.icon ?? '',
        description: r.description ?? '',
      })),
    });
    setFormErrors({});
    setFormDialog({ open: true, mode: 'edit', challengeId: challenge.id });
  };

  // ---- Save (create / update) ----

  const handleSave = async () => {
    const errors = validateForm(form);
    setFormErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      const rulesArray = form.rules
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const challengePayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        status: form.status,
        image_url: form.image_url.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        max_participants: form.max_participants || null,
        rules: rulesArray,
      };

      const rewardsPayload = form.rewards.map((r, i) => ({
        type: r.type,
        name: r.name.trim(),
        icon: r.icon.trim() || undefined,
        description: r.description.trim() || undefined,
        sort_order: i,
      }));

      if (formDialog.mode === 'create') {
        await createAdminChallenge(challengePayload, rewardsPayload);
        toast.success('챌린지가 생성되었습니다.');
      } else if (formDialog.challengeId) {
        await updateAdminChallenge(
          formDialog.challengeId,
          challengePayload,
          rewardsPayload
        );
        toast.success('챌린지가 수정되었습니다.');
      }

      setFormDialog({ open: false, mode: 'create', challengeId: null });
      fetchChallenges();
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Cancel challenge ----

  const handleCancel = async () => {
    if (!cancelDialog.challenge) return;
    setCancelling(true);
    try {
      await cancelAdminChallenge(cancelDialog.challenge.id);
      toast.success('챌린지가 취소되었습니다.');
      setCancelDialog({ open: false, challenge: null });
      fetchChallenges();
    } catch {
      toast.error('취소 처리에 실패했습니다.');
    } finally {
      setCancelling(false);
    }
  };

  // ---- Participants ----

  const openParticipantDialog = async (challenge: AdminChallengeRow) => {
    setParticipantDialog({
      open: true,
      challenge,
      participants: [],
      totalCount: 0,
      page: 1,
      loading: true,
      search: '',
      statusFilter: 'all',
    });
    try {
      const { data, count } = await getAdminChallengeParticipants({
        challengeId: challenge.id,
        page: 1,
        limit: ITEMS_PER_PAGE,
      });
      setParticipantDialog((prev) => ({
        ...prev,
        participants: data,
        totalCount: count,
        loading: false,
      }));
    } catch {
      setParticipantDialog((prev) => ({ ...prev, loading: false }));
      toast.error('참가자 정보를 불러오지 못했습니다.');
    }
  };

  const fetchParticipants = useCallback(async () => {
    if (!participantDialog.challenge) return;
    setParticipantDialog((prev) => ({ ...prev, loading: true }));
    try {
      const { data, count } = await getAdminChallengeParticipants({
        challengeId: participantDialog.challenge.id,
        search: participantDialog.search || undefined,
        status: participantDialog.statusFilter as 'active' | 'completed' | 'withdrawn' | 'all',
        page: participantDialog.page,
        limit: ITEMS_PER_PAGE,
      });
      setParticipantDialog((prev) => ({
        ...prev,
        participants: data,
        totalCount: count,
        loading: false,
      }));
    } catch {
      setParticipantDialog((prev) => ({ ...prev, loading: false }));
    }
  }, [
    participantDialog.challenge,
    participantDialog.search,
    participantDialog.statusFilter,
    participantDialog.page,
  ]);

  useEffect(() => {
    if (participantDialog.open && participantDialog.challenge) {
      fetchParticipants();
    }
  }, [participantDialog.search, participantDialog.statusFilter, participantDialog.page]);

  // ---- Reward helpers ----

  const addReward = () => {
    setForm((prev) => ({
      ...prev,
      rewards: [...prev.rewards, { ...EMPTY_REWARD }],
    }));
  };

  const removeReward = (index: number) => {
    setForm((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index),
    }));
  };

  const updateReward = (
    index: number,
    field: keyof RewardFormRow,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      rewards: prev.rewards.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      ),
    }));
  };

  // ---- Format helpers ----

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatRewardSummary = (rewards: ChallengeReward[]) => {
    if (!rewards || rewards.length === 0) return '-';
    return rewards.map((r) => REWARD_TYPE_LABELS[r.type] ?? r.type).join(', ');
  };

  // ---- Check if challenge is editable ----

  const isEditable = (status: Challenge['status']) =>
    status !== 'completed' && status !== 'cancelled';

  // ---- Pagination ----

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

  // ---- Participant pagination ----

  const participantTotalPages = Math.ceil(participantDialog.totalCount / ITEMS_PER_PAGE);

  const renderParticipantPagination = () => {
    if (participantTotalPages <= 1) return null;

    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, participantDialog.page - half);
    const end = Math.min(participantTotalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('ellipsis');
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < participantTotalPages) {
      if (end < participantTotalPages - 1) pages.push('ellipsis');
      pages.push(participantTotalPages);
    }

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() =>
                setParticipantDialog((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
              className={cn('cursor-pointer', participantDialog.page <= 1 && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>
          {pages.map((p, i) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`pe-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={participantDialog.page === p}
                  onClick={() =>
                    setParticipantDialog((prev) => ({
                      ...prev,
                      page: p as number,
                    }))
                  }
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                setParticipantDialog((prev) => ({
                  ...prev,
                  page: Math.min(participantTotalPages, prev.page + 1),
                }))
              }
              className={cn('cursor-pointer', participantDialog.page >= participantTotalPages && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // ---- Participant summary counts ----

  const getParticipantSummaryCounts = () => {
    const all = participantDialog.participants;
    return {
      total: participantDialog.totalCount,
      completed: all.filter((p) => p.status === 'completed').length,
      active: all.filter((p) => p.status === 'active').length,
    };
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="챌린지 제목 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="upcoming">예정</SelectItem>
            <SelectItem value="active">진행중</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
            <SelectItem value="cancelled">취소</SelectItem>
          </SelectContent>
        </Select>
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
        <Button onClick={handleSearch} size="sm">
          검색
        </Button>
        <Button onClick={openCreateDialog} size="sm" className="bg-[var(--accent-color)] hover:bg-[#4dc99a] text-white">
          <Plus className="w-4 h-4 mr-1" />
          새 챌린지
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
        ) : challenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
            <Target size={48} className="mb-4 opacity-40" />
            <p className="text-lg">챌린지가 없습니다</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--bg-secondary)]">
                  <TableHead className="w-[60px]">번호</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-[90px]">카테고리</TableHead>
                  <TableHead className="w-[70px]">상태</TableHead>
                  <TableHead className="w-[70px]">참여자</TableHead>
                  <TableHead className="w-[180px]">기간</TableHead>
                  <TableHead className="w-[100px]">보상</TableHead>
                  <TableHead className="w-[140px]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.map((challenge, index) => (
                  <TableRow key={challenge.id}>
                    <TableCell className="text-[var(--text-secondary)] text-xs">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-[var(--primary)] truncate max-w-[200px]">
                      {challenge.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {challenge.category || '기타'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', STATUS_COLORS[challenge.status])}>
                        {STATUS_LABELS[challenge.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[var(--accent)] hover:bg-[var(--secondary)]"
                        onClick={() => openParticipantDialog(challenge)}
                        title="참가자 현황 보기"
                      >
                        <Users className="w-3 h-3 mr-0.5" />
                        {challenge.participant_count.toLocaleString()}
                      </Button>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--text-secondary)]">
                      {formatDate(challenge.start_date)} ~ {formatDate(challenge.end_date)}
                    </TableCell>
                    <TableCell className="text-xs text-[var(--text-secondary)]">
                      {formatRewardSummary(challenge.challenge_rewards)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isEditable(challenge.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => openEditDialog(challenge)}
                          >
                            편집
                          </Button>
                        )}
                        {isEditable(challenge.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[#fee2e2]"
                            onClick={() =>
                              setCancelDialog({ open: true, challenge })
                            }
                          >
                            취소
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
              <p className="text-sm text-[var(--text-secondary)]">
                총 {totalCount.toLocaleString()}개 챌린지
              </p>
              {renderPagination()}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={formDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setFormDialog({ open: false, mode: 'create', challengeId: null });
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formDialog.mode === 'create' ? '챌린지 생성' : '챌린지 수정'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>제목 *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="챌린지 제목을 입력하세요"
              />
              {formErrors.title && (
                <p className="text-xs text-[var(--destructive)]">{formErrors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>설명</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="챌린지 설명을 입력하세요"
                rows={3}
              />
            </div>

            {/* Category + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>카테고리</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c !== '전체').map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>상태</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, status: v as Challenge['status'] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">예정</SelectItem>
                    <SelectItem value="active">진행중</SelectItem>
                    <SelectItem value="completed">완료</SelectItem>
                    <SelectItem value="cancelled">취소</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <Label>이미지 URL</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>시작일 *</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                />
                {formErrors.start_date && (
                  <p className="text-xs text-[var(--destructive)]">{formErrors.start_date}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>종료일 *</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                />
                {formErrors.end_date && (
                  <p className="text-xs text-[var(--destructive)]">{formErrors.end_date}</p>
                )}
              </div>
            </div>

            {/* Max Participants */}
            <div className="space-y-1.5">
              <Label>최대 참가자 (0 = 무제한)</Label>
              <Input
                type="number"
                min={0}
                value={form.max_participants}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_participants: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>

            {/* Rules */}
            <div className="space-y-1.5">
              <Label>규칙 (줄바꿈으로 구분)</Label>
              <Textarea
                value={form.rules}
                onChange={(e) => setForm((prev) => ({ ...prev, rules: e.target.value }))}
                placeholder="매일 운동 루틴 1개 완료&#10;인증 게시물 업로드"
                rows={3}
              />
            </div>

            {/* Rewards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">보상 설정</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReward}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  보상 추가
                </Button>
              </div>

              {form.rewards.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  보상 항목이 없습니다
                </p>
              )}

              {form.rewards.map((reward, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[100px_1fr_80px_1fr_40px] gap-2 items-start p-3 rounded-lg border border-[var(--border)]"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">유형</Label>
                    <Select
                      value={reward.type}
                      onValueChange={(v) =>
                        updateReward(index, 'type', v)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="badge">뱃지</SelectItem>
                        <SelectItem value="coupon">쿠폰</SelectItem>
                        <SelectItem value="point">포인트</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">이름 *</Label>
                    <Input
                      value={reward.name}
                      onChange={(e) => updateReward(index, 'name', e.target.value)}
                      className="h-8 text-xs"
                      placeholder="보상 이름"
                    />
                    {formErrors.rewards?.[index] && (
                      <p className="text-xs text-[var(--destructive)]">
                        {formErrors.rewards[index]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">아이콘</Label>
                    <Input
                      value={reward.icon}
                      onChange={(e) => updateReward(index, 'icon', e.target.value)}
                      className="h-8 text-xs"
                      placeholder="emoji"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">설명</Label>
                    <Input
                      value={reward.description}
                      onChange={(e) => updateReward(index, 'description', e.target.value)}
                      className="h-8 text-xs"
                      placeholder="보상 설명"
                    />
                  </div>
                  <div className="flex items-end pb-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[var(--destructive)] hover:bg-[#fee2e2]"
                      onClick={() => removeReward(index)}
                      aria-label="보상 삭제"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setFormDialog({ open: false, mode: 'create', challengeId: null })
              }
            >
              취소
            </Button>
            <Button
              className="bg-[var(--accent-color)] hover:bg-[#4dc99a] text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm Dialog */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) =>
          !open && setCancelDialog({ open: false, challenge: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>챌린지 취소</DialogTitle>
            <DialogDescription>
              {cancelDialog.challenge && (
                <>
                  <strong>{cancelDialog.challenge.title}</strong> 챌린지를 취소하시겠습니까?
                  {cancelDialog.challenge.participant_count > 0 && (
                    <>
                      <br />
                      <span className="text-[var(--destructive)]">
                        현재 {cancelDialog.challenge.participant_count}명의 참여자가 있습니다.
                      </span>
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, challenge: null })}
            >
              돌아가기
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? '처리 중...' : '취소 처리'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participant Dialog */}
      <Dialog
        open={participantDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setParticipantDialog({
              open: false,
              challenge: null,
              participants: [],
              totalCount: 0,
              page: 1,
              loading: false,
              search: '',
              statusFilter: 'all',
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              참가자 현황: {participantDialog.challenge?.title}
            </DialogTitle>
          </DialogHeader>

          {/* Summary */}
          {!participantDialog.loading && (
            <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
              <span>
                총 참여자:{' '}
                <strong className="text-[var(--primary)]">
                  {getParticipantSummaryCounts().total}명
                </strong>
              </span>
              <span>
                완료:{' '}
                <strong className="text-[#059669]">
                  {getParticipantSummaryCounts().completed}명
                </strong>
              </span>
              <span>
                진행중:{' '}
                <strong className="text-[#2563eb]">
                  {getParticipantSummaryCounts().active}명
                </strong>
              </span>
            </div>
          )}

          {/* Participant Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder="닉네임 검색..."
                value={participantDialog.search}
                onChange={(e) =>
                  setParticipantDialog((prev) => ({
                    ...prev,
                    search: e.target.value,
                    page: 1,
                  }))
                }
                className="pl-10 h-8 text-sm"
              />
            </div>
            <Select
              value={participantDialog.statusFilter}
              onValueChange={(v) =>
                setParticipantDialog((prev) => ({
                  ...prev,
                  statusFilter: v,
                  page: 1,
                }))
              }
            >
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="withdrawn">탈퇴</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Participant Table */}
          {participantDialog.loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : participantDialog.participants.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-8">
              참가자가 없습니다
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[var(--bg-secondary)]">
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>닉네임</TableHead>
                    <TableHead className="w-[100px]">참여일</TableHead>
                    <TableHead className="w-[70px]">상태</TableHead>
                    <TableHead className="w-[70px]">진행률</TableHead>
                    <TableHead className="w-[100px]">완료일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participantDialog.participants.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs text-[var(--text-secondary)]">
                        {(participantDialog.page - 1) * ITEMS_PER_PAGE + i + 1}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-[var(--primary)]">
                        {p.profiles?.nickname ?? '-'}
                      </TableCell>
                      <TableCell className="text-xs text-[var(--text-secondary)]">
                        {formatDate(p.joined_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'text-xs',
                            PARTICIPANT_STATUS_COLORS[p.status] ?? ''
                          )}
                        >
                          {PARTICIPANT_STATUS_LABELS[p.status] ?? p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-[var(--primary)]">
                        {p.progress}%
                      </TableCell>
                      <TableCell className="text-xs text-[var(--text-secondary)]">
                        {p.completed_at ? formatDate(p.completed_at) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-secondary)]">
                  총 {participantDialog.totalCount.toLocaleString()}명
                </p>
                {renderParticipantPagination()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChallengeManagement;
