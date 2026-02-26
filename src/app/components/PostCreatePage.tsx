import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  X,
  ImagePlus,
  Crop,
  RotateCcw,
  Maximize2,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from './ui/utils';
import { useCommunity } from '../community-context';
import { useAuth } from '../auth-context';
import { getUserRoutines, type UserRoutineWithItems } from '@/lib/api/user-routines';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

interface PostCreateState {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  images: File[];
  imagePreviews: string[];
  title: string;
  content: string;
  hashtags: string[];
  hashtagInput: string;
  category: string;
  linkedRoutineId: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const STEP_TITLES = ['사진 선택', '사진 편집', '필터', '글 작성', '카테고리', '루틴 연결'];

const CATEGORIES = [
  { key: 'mytobe', label: 'MY TO-BE' },
  { key: 'now', label: 'NOW (실시간 인증)' },
  { key: 'gratitude', label: '감사일기' },
  { key: 'diet', label: '다이어트' },
  { key: 'exercise', label: '운동인증' },
  { key: 'selfdev', label: '자기개발' },
  { key: 'general', label: '일반' },
];

const FILTERS = [
  { key: 'original', label: '원본' },
  { key: 'bright', label: '밝게' },
  { key: 'warm', label: '따뜻' },
  { key: 'cool', label: '시원' },
  { key: 'vintage', label: '빈티지' },
  { key: 'mono', label: '모노' },
];

const SUGGESTED_TAGS = ['루틴인증', '아침루틴', '운동인증', '자기개발', '갓생'];

const MAX_IMAGES = 10;

// ============================================================================
// Component
// ============================================================================

const PostCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { publishPost } = useCommunity();

  const [state, setState] = useState<PostCreateState>({
    step: 1,
    images: [],
    imagePreviews: [],
    title: '',
    content: '',
    hashtags: [],
    hashtagInput: '',
    category: 'general',
    linkedRoutineId: null,
  });
  const [userRoutines, setUserRoutines] = useState<UserRoutineWithItems[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('original');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user routines for step 6
  useEffect(() => {
    if (state.step === 6 && user) {
      getUserRoutines(user.id, { status: 'active' })
        .then((result) => setUserRoutines(result.data))
        .catch(() => setUserRoutines([]));
    }
  }, [state.step, user]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      state.imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateState = useCallback((updates: Partial<PostCreateState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, 6) as PostCreateState['step'],
    }));
  }, []);

  const goBack = useCallback(() => {
    if (state.step === 1) {
      navigate(-1);
    } else {
      setState((prev) => ({
        ...prev,
        step: Math.max(prev.step - 1, 1) as PostCreateState['step'],
      }));
    }
  }, [state.step, navigate]);

  // Step 1: Image selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setState((prev) => {
      const remaining = MAX_IMAGES - prev.images.length;
      const newFiles = files.slice(0, remaining);
      const newPreviews = newFiles.map((f) => URL.createObjectURL(f));

      if (files.length > remaining) {
        toast.error(`최대 ${MAX_IMAGES}장까지 선택할 수 있습니다`);
      }

      return {
        ...prev,
        images: [...prev.images, ...newFiles],
        imagePreviews: [...prev.imagePreviews, ...newPreviews],
      };
    });

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setState((prev) => {
      URL.revokeObjectURL(prev.imagePreviews[index]);
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
        imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
      };
    });
  }, []);

  // Step 4: Hashtag handling
  const addHashtag = useCallback((tag: string) => {
    const clean = tag.replace(/^#/, '').trim();
    if (!clean) return;
    setState((prev) => {
      if (prev.hashtags.includes(clean)) return prev;
      return { ...prev, hashtags: [...prev.hashtags, clean], hashtagInput: '' };
    });
  }, []);

  const removeHashtag = useCallback((tag: string) => {
    setState((prev) => ({
      ...prev,
      hashtags: prev.hashtags.filter((t) => t !== tag),
    }));
  }, []);

  const handleHashtagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addHashtag(state.hashtagInput);
    }
  }, [addHashtag, state.hashtagInput]);

  // Step 6: Publish
  const handlePublish = useCallback(async () => {
    if (publishing) return;

    if (state.images.length === 0 && !state.content.trim()) {
      toast.error('사진이나 글 내용을 입력해주세요');
      return;
    }

    setPublishing(true);
    try {
      await publishPost({
        images: state.images,
        title: state.title,
        content: state.content,
        hashtags: state.hashtags,
        category: state.category,
        linkedRoutineId: state.linkedRoutineId ?? undefined,
      });
      navigate('/community', { replace: true });
    } catch {
      // Error handled in context
    } finally {
      setPublishing(false);
    }
  }, [state, publishing, publishPost, navigate]);

  const canGoNext = (): boolean => {
    switch (state.step) {
      case 1:
        return state.images.length > 0;
      case 2:
      case 3:
        return true; // Placeholders, always allowed
      case 4:
        return state.content.trim().length > 0;
      case 5:
        return !!state.category;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-white -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={goBack}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-gray-100"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={22} className="text-[#1a1a2e]" />
          </button>
          <h1 className="text-base font-semibold text-[#1a1a2e]">
            {STEP_TITLES[state.step - 1]}
          </h1>
          {state.step < 6 ? (
            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className={cn(
                'text-sm font-semibold border-none bg-transparent cursor-pointer px-2 py-1',
                canGoNext() ? 'text-[#65D9AC]' : 'text-[#9CA3AF]'
              )}
            >
              다음
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-[#65D9AC] transition-all duration-300"
            style={{ width: `${(state.step / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {state.step === 1 && (
          <Step1ImageSelect
            images={state.images}
            previews={state.imagePreviews}
            onSelect={() => fileInputRef.current?.click()}
            onRemove={removeImage}
          />
        )}
        {state.step === 2 && (
          <Step2EditPlaceholder preview={state.imagePreviews[0]} />
        )}
        {state.step === 3 && (
          <Step3FilterPlaceholder
            preview={state.imagePreviews[0]}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />
        )}
        {state.step === 4 && (
          <Step4Writing
            title={state.title}
            content={state.content}
            hashtags={state.hashtags}
            hashtagInput={state.hashtagInput}
            onTitleChange={(v) => updateState({ title: v })}
            onContentChange={(v) => updateState({ content: v })}
            onHashtagInputChange={(v) => updateState({ hashtagInput: v })}
            onAddHashtag={addHashtag}
            onRemoveHashtag={removeHashtag}
            onHashtagKeyDown={handleHashtagKeyDown}
          />
        )}
        {state.step === 5 && (
          <Step5Category
            selected={state.category}
            onChange={(v) => updateState({ category: v })}
          />
        )}
        {state.step === 6 && (
          <Step6RoutineLink
            routines={userRoutines}
            selectedId={state.linkedRoutineId}
            onChange={(v) => updateState({ linkedRoutineId: v })}
            onPublish={handlePublish}
            publishing={publishing}
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
};

// ============================================================================
// Step 1: Image Selection
// ============================================================================

interface Step1Props {
  images: File[];
  previews: string[];
  onSelect: () => void;
  onRemove: (index: number) => void;
}

const Step1ImageSelect = ({ images, previews, onSelect, onRemove }: Step1Props) => (
  <div className="p-4">
    <p className="text-sm text-[#6B7280] mb-4">
      최대 {MAX_IMAGES}장까지 선택할 수 있습니다 ({images.length}/{MAX_IMAGES})
    </p>
    <div className="grid grid-cols-3 gap-0.5">
      {/* Add button */}
      {images.length < MAX_IMAGES && (
        <button
          onClick={onSelect}
          className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
          aria-label="사진 추가"
        >
          <ImagePlus size={28} className="text-[#9CA3AF]" />
          <span className="text-xs text-[#9CA3AF]">사진 추가</span>
        </button>
      )}
      {/* Selected images */}
      {previews.map((preview, idx) => (
        <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={preview}
            alt={`선택된 사진 ${idx + 1}`}
            className="w-full h-full object-cover"
          />
          {/* Number badge */}
          <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-[#65D9AC] text-white text-xs font-bold flex items-center justify-center">
            {idx + 1}
          </div>
          {/* Remove button */}
          <button
            onClick={() => onRemove(idx)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center border-none cursor-pointer"
            aria-label={`사진 ${idx + 1} 제거`}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// Step 2: Edit Placeholder
// ============================================================================

interface Step2Props {
  preview?: string;
}

const Step2EditPlaceholder = ({ preview }: Step2Props) => (
  <div className="p-4">
    {preview && (
      <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-4">
        <img src={preview} alt="편집 미리보기" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <span className="text-white text-sm font-medium bg-black/40 px-4 py-2 rounded-full">
            편집 기능 준비 중
          </span>
        </div>
      </div>
    )}
    <div className="flex items-center justify-center gap-6 py-3">
      <button className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-not-allowed opacity-50" disabled>
        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
          <Crop size={20} className="text-[#6B7280]" />
        </div>
        <span className="text-xs text-[#6B7280]">자르기</span>
      </button>
      <button className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-not-allowed opacity-50" disabled>
        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
          <RotateCcw size={20} className="text-[#6B7280]" />
        </div>
        <span className="text-xs text-[#6B7280]">회전</span>
      </button>
      <button className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-not-allowed opacity-50" disabled>
        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
          <Maximize2 size={20} className="text-[#6B7280]" />
        </div>
        <span className="text-xs text-[#6B7280]">비율</span>
      </button>
    </div>
    <p className="text-center text-xs text-[#9CA3AF] mt-2">
      사진 편집 기능은 추후 업데이트 예정입니다
    </p>
  </div>
);

// ============================================================================
// Step 3: Filter Placeholder
// ============================================================================

interface Step3Props {
  preview?: string;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

const Step3FilterPlaceholder = ({ preview, selectedFilter, onFilterChange }: Step3Props) => (
  <div className="p-4">
    {preview && (
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-4">
        <img src={preview} alt="필터 미리보기" className="w-full h-full object-cover" />
      </div>
    )}
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={cn(
            'flex flex-col items-center gap-2 flex-shrink-0 bg-transparent border-none cursor-pointer',
          )}
        >
          <div
            className={cn(
              'w-[72px] h-[72px] rounded-xl bg-gray-200 overflow-hidden border-2 transition-colors',
              selectedFilter === filter.key ? 'border-[#65D9AC]' : 'border-transparent'
            )}
          >
            {preview && (
              <img src={preview} alt={filter.label} className="w-full h-full object-cover opacity-80" />
            )}
          </div>
          <span
            className={cn(
              'text-xs',
              selectedFilter === filter.key ? 'text-[#65D9AC] font-semibold' : 'text-[#6B7280]'
            )}
          >
            {filter.label}
          </span>
        </button>
      ))}
    </div>
    <p className="text-center text-xs text-[#9CA3AF] mt-4">
      필터 기능은 추후 업데이트 예정입니다
    </p>
  </div>
);

// ============================================================================
// Step 4: Writing
// ============================================================================

interface Step4Props {
  title: string;
  content: string;
  hashtags: string[];
  hashtagInput: string;
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onHashtagInputChange: (v: string) => void;
  onAddHashtag: (tag: string) => void;
  onRemoveHashtag: (tag: string) => void;
  onHashtagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const Step4Writing = ({
  title,
  content,
  hashtags,
  hashtagInput,
  onTitleChange,
  onContentChange,
  onHashtagInputChange,
  onAddHashtag,
  onRemoveHashtag,
  onHashtagKeyDown,
}: Step4Props) => (
  <div className="p-4 space-y-5">
    {/* Title */}
    <div>
      <label className="block text-sm font-semibold text-[#1a1a2e] mb-2">제목</label>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="제목을 입력하세요 (선택)"
        className="w-full text-sm bg-gray-50 rounded-xl px-4 py-3 border border-[#E5E7EB] outline-none focus:ring-2 focus:ring-[#65D9AC]/30 focus:border-[#65D9AC] placeholder:text-[#9CA3AF]"
      />
    </div>

    {/* Content */}
    <div>
      <label className="block text-sm font-semibold text-[#1a1a2e] mb-2">본문</label>
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="내용을 작성하세요..."
        rows={6}
        className="w-full text-sm bg-gray-50 rounded-xl px-4 py-3 border border-[#E5E7EB] outline-none focus:ring-2 focus:ring-[#65D9AC]/30 focus:border-[#65D9AC] placeholder:text-[#9CA3AF] resize-none"
      />
    </div>

    {/* Hashtags */}
    <div>
      <label className="block text-sm font-semibold text-[#1a1a2e] mb-2">해시태그</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {hashtags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-[#65D9AC]/10 text-[#65D9AC] text-sm px-3 py-1.5 rounded-full"
          >
            #{tag}
            <button
              onClick={() => onRemoveHashtag(tag)}
              className="bg-transparent border-none cursor-pointer p-0 text-[#65D9AC] hover:text-[#4dc99a]"
              aria-label={`${tag} 태그 제거`}
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={hashtagInput}
        onChange={(e) => onHashtagInputChange(e.target.value)}
        onKeyDown={onHashtagKeyDown}
        placeholder="# 해시태그 입력 (엔터로 추가)"
        className="w-full text-sm bg-gray-50 rounded-xl px-4 py-3 border border-[#E5E7EB] outline-none focus:ring-2 focus:ring-[#65D9AC]/30 focus:border-[#65D9AC] placeholder:text-[#9CA3AF]"
      />
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-xs text-[#9CA3AF]">#추천:</span>
        {SUGGESTED_TAGS.filter((t) => !hashtags.includes(t)).map((tag) => (
          <button
            key={tag}
            onClick={() => onAddHashtag(tag)}
            className="text-xs text-[#6B7280] bg-gray-100 px-2.5 py-1 rounded-full border-none cursor-pointer hover:bg-gray-200 transition-colors"
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// Step 5: Category
// ============================================================================

interface Step5Props {
  selected: string;
  onChange: (category: string) => void;
}

const Step5Category = ({ selected, onChange }: Step5Props) => (
  <div className="p-4">
    <p className="text-sm text-[#6B7280] mb-4">게시물 카테고리를 선택하세요</p>
    <div className="space-y-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors bg-transparent cursor-pointer',
            selected === cat.key
              ? 'border-[#65D9AC] bg-[#65D9AC]/5'
              : 'border-[#E5E7EB] hover:bg-gray-50'
          )}
        >
          <span
            className={cn(
              'text-sm',
              selected === cat.key ? 'text-[#65D9AC] font-semibold' : 'text-[#1a1a2e]'
            )}
          >
            {cat.label}
          </span>
          {selected === cat.key && (
            <Check size={18} className="text-[#65D9AC]" />
          )}
        </button>
      ))}
    </div>
  </div>
);

// ============================================================================
// Step 6: Routine Link + Publish
// ============================================================================

interface Step6Props {
  routines: UserRoutineWithItems[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  onPublish: () => void;
  publishing: boolean;
}

const Step6RoutineLink = ({
  routines,
  selectedId,
  onChange,
  onPublish,
  publishing,
}: Step6Props) => (
  <div className="p-4 flex flex-col min-h-[calc(100vh-120px)]">
    <div className="flex-1">
      <p className="text-sm text-[#6B7280] mb-1">게시물에 루틴을 연결할까요?</p>
      <p className="text-xs text-[#9CA3AF] mb-4">(선택사항)</p>

      {routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-[#9CA3AF]">
          <p className="text-sm">진행 중인 루틴이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {routines.map((routine) => (
            <button
              key={routine.id}
              onClick={() =>
                onChange(selectedId === routine.id ? null : routine.id)
              }
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors bg-transparent cursor-pointer text-left',
                selectedId === routine.id
                  ? 'border-[#65D9AC] bg-[#65D9AC]/5'
                  : 'border-[#E5E7EB] hover:bg-gray-50'
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                  selectedId === routine.id
                    ? 'border-[#65D9AC] bg-[#65D9AC]'
                    : 'border-gray-300'
                )}
              >
                {selectedId === routine.id && (
                  <Check size={12} className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a1a2e] truncate">
                  {routine.title}
                </p>
                {routine.description && (
                  <p className="text-xs text-[#9CA3AF] truncate mt-0.5">
                    {routine.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>

    {/* Publish button */}
    <div className="pt-4 pb-safe">
      <button
        onClick={onPublish}
        disabled={publishing}
        className={cn(
          'w-full h-[52px] rounded-xl text-lg font-semibold border-none cursor-pointer transition-colors flex items-center justify-center gap-2',
          publishing
            ? 'bg-gray-100 text-[#9CA3AF]'
            : 'bg-[#65D9AC] text-white hover:brightness-95 active:scale-[0.98]'
        )}
      >
        {publishing ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            게시 중...
          </>
        ) : (
          '게시하기'
        )}
      </button>
    </div>
  </div>
);

export default PostCreatePage;
