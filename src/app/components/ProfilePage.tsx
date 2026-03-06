import { useState, useRef } from "react";
import { Link, Navigate } from "react-router";
import {
  Edit3,
  ShoppingBag,
  ClipboardList,
  X,
  Settings,
  Camera,
  Image as ImageIcon,
  Grid3X3,
  Loader2,
} from "lucide-react";
import { Button, Card, CardBody, Input, Avatar, Textarea } from "@heroui/react";
import { useAuth } from "../auth-context";
import { useStore } from "../store-context";
import { toast } from "sonner";
import { uploadAvatar, uploadCoverImage } from "@/lib/api/storage";
import { cn } from "./ui/utils";

// ============================================================================
// Constants
// ============================================================================

const PROFILE_TABS = [
  { key: "posts", label: "게시물", icon: Grid3X3 },
  { key: "routines", label: "루틴", icon: ClipboardList },
  { key: "purchases", label: "구매내역", icon: ShoppingBag },
] as const;

type ProfileTab = (typeof PROFILE_TABS)[number]["key"];

// ============================================================================
// Main Component
// ============================================================================

export function ProfilePage() {
  const { user, updateProfileFull, isLoggedIn } = useAuth();
  const { purchasedLists, customLists } = useStore();

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editBio, setEditBio] = useState(user?.profile?.bio || "");

  // Upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  if (!isLoggedIn || !user) {
    return <Navigate to="/login?redirect=/profile" replace />;
  }

  const profile = user.profile;

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    try {
      await updateProfileFull({
        nickname: editName.trim(),
        bio: editBio.trim(),
      });
      setIsEditing(false);
      toast.success("프로필이 수정되었습니다.");
    } catch {
      toast.error("프로필 수정에 실패했습니다.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(user.name);
    setEditBio(profile?.bio || "");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하만 가능합니다.");
      return;
    }

    setAvatarUploading(true);
    try {
      const result = await uploadAvatar(user.id, file, profile?.avatar_url || undefined);
      await updateProfileFull({ avatar_url: result.publicUrl });
      toast.success("프로필 사진이 변경되었습니다.");
    } catch {
      toast.error("사진 업로드에 실패했습니다.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하만 가능합니다.");
      return;
    }

    setCoverUploading(true);
    try {
      const result = await uploadCoverImage(user.id, file, profile?.cover_image_url || undefined);
      await updateProfileFull({ cover_image_url: result.publicUrl });
      toast.success("배경 이미지가 변경되었습니다.");
    } catch {
      toast.error("배경 업로드에 실패했습니다.");
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  // ========================================================================
  // Data
  // ========================================================================

  const postCount = profile?.post_count ?? 0;
  const followerCount = profile?.follower_count ?? 0;
  const followingCount = profile?.following_count ?? 0;

  // ========================================================================
  // Edit Mode Render
  // ========================================================================

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Edit Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleCancelEdit}
            className="flex items-center gap-1 text-default-500 hover:text-default-700 transition-colors bg-transparent border-none cursor-pointer text-sm"
            aria-label="편집 취소"
          >
            <X className="w-5 h-5" />
            <span>취소</span>
          </button>
          <h1 className="text-default-900 text-lg font-bold">프로필 편집</h1>
          <button
            onClick={handleSaveProfile}
            className="text-[#65D9AC] font-semibold text-sm bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="프로필 저장"
          >
            저장
          </button>
        </div>

        {/* Avatar Edit */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <Avatar
              className="w-24 h-24 text-5xl border-4 border-white shadow-md"
              showFallback
              src={profile?.avatar_url || undefined}
              fallback={<span className="text-5xl">{user.avatar || "🧑‍💻"}</span>}
              size="lg"
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#65D9AC] rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-[#55c99c] transition-colors disabled:opacity-50"
              aria-label="프로필 사진 변경"
            >
              {avatarUploading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              aria-label="아바타 이미지 선택"
            />
          </div>
        </div>

        {/* Name Field */}
        <div className="mb-6">
          <label className="text-sm font-medium text-default-700 mb-2 block">닉네임</label>
          <Input
            value={editName}
            onValueChange={setEditName}
            variant="bordered"
            placeholder="닉네임을 입력하세요"
            maxLength={20}
            classNames={{ inputWrapper: "border-default-200" }}
          />
        </div>

        {/* Bio Field */}
        <div className="mb-6">
          <label className="text-sm font-medium text-default-700 mb-2 block">소개</label>
          <Textarea
            value={editBio}
            onValueChange={setEditBio}
            variant="bordered"
            placeholder="소개를 입력하세요..."
            maxLength={100}
            maxRows={3}
            classNames={{ inputWrapper: "border-default-200" }}
          />
          <p className="text-xs text-default-400 mt-1 text-right">{editBio.length}/100</p>
        </div>

        {/* Cover Image */}
        <div className="mb-6">
          <label className="text-sm font-medium text-default-700 mb-2 block">배경 이미지</label>
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={coverUploading}
            className="w-full h-32 border-2 border-dashed border-default-200 rounded-xl flex flex-col items-center justify-center gap-2 bg-default-50 hover:bg-default-100 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="배경 이미지 선택"
          >
            {coverUploading ? (
              <Loader2 className="w-6 h-6 text-default-400 animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-6 h-6 text-default-400" />
                <span className="text-sm text-default-400">
                  {profile?.cover_image_url ? "이미지 변경" : "이미지 선택"}
                </span>
              </>
            )}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
            aria-label="커버 이미지 선택"
          />
          {profile?.cover_image_url && (
            <div className="mt-2 rounded-lg overflow-hidden h-20">
              <img src={profile.cover_image_url} alt="현재 배경 이미지" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================================================
  // Normal Mode Render
  // ========================================================================

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cover Image + Avatar */}
      <Card shadow="sm" className="mb-6 overflow-hidden">
        <div
          className="h-36 relative"
          style={
            profile?.cover_image_url
              ? { backgroundImage: `url(${profile.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
              : {
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.60) 0%, rgba(19, 214, 128, 0.40) 50%, rgba(108, 92, 231, 0.55) 100%)',
                }
          }
        >
          {/* Default decorative elements when no cover */}
          {!profile?.cover_image_url && (
            <div className="absolute inset-0">
              <div className="absolute top-3 right-8 w-24 h-24 rounded-full bg-[#6C5CE7] opacity-30 blur-[20px]" />
              <div className="absolute bottom-1 left-12 w-20 h-20 rounded-full bg-[#13d680] opacity-35 blur-[18px]" />
              <div className="absolute top-6 left-4 w-16 h-16 rounded-full bg-[#22d3ee] opacity-20 blur-[15px]" />
            </div>
          )}

          {/* Settings icon */}
          <Link
            to="/settings"
            className="absolute top-3 right-3 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
            aria-label="설정"
          >
            <Settings className="w-5 h-5 text-white" />
          </Link>

          {/* Avatar */}
          <div className="absolute -bottom-10 left-6">
            <Avatar
              className="w-20 h-20 text-4xl border-4 border-white"
              showFallback
              src={profile?.avatar_url || undefined}
              fallback={<span className="text-4xl">{user.avatar || "🧑‍💻"}</span>}
              size="lg"
            />
          </div>
        </div>

        <CardBody className="pt-14 pb-5 px-6">
          {/* Name + Bio */}
          <div className="mb-3">
            <h2 className="text-default-900 text-xl font-bold">{user.name}</h2>
            {profile?.bio && <p className="text-default-500 text-sm mt-1">{profile.bio}</p>}
          </div>

          {/* Stats Row: Posts, Followers, Following */}
          <div className="flex items-center gap-5 mb-4 text-sm">
            <span className="text-default-700">
              <strong className="text-default-900">{postCount}</strong>{" "}
              <span className="text-default-500">게시물</span>
            </span>
            <Link
              to="/following"
              className="text-default-700 no-underline hover:opacity-80 transition-opacity"
              aria-label={`팔로워 ${followerCount}명`}
            >
              <strong className="text-default-900">{followerCount}</strong>{" "}
              <span className="text-default-500">팔로워</span>
            </Link>
            <Link
              to="/following"
              className="text-default-700 no-underline hover:opacity-80 transition-opacity"
              aria-label={`팔로잉 ${followingCount}명`}
            >
              <strong className="text-default-900">{followingCount}</strong>{" "}
              <span className="text-default-500">팔로잉</span>
            </Link>
          </div>

          {/* Edit Profile Button */}
          <Button
            variant="bordered"
            fullWidth
            size="sm"
            className="border-default-200 text-default-700 font-medium"
            startContent={<Edit3 className="w-4 h-4" />}
            onPress={() => {
              setEditName(user.name);
              setEditBio(profile?.bio || "");
              setIsEditing(true);
            }}
          >
            프로필 편집
          </Button>
        </CardBody>
      </Card>

      {/* Tab Bar */}
      <div className="flex border-b border-default-200 mb-4">
        {PROFILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 bg-transparent cursor-pointer",
                isActive
                  ? "border-foreground text-default-900"
                  : "border-transparent text-default-400 hover:text-default-600"
              )}
              aria-label={tab.label}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "posts" && <PostsTabContent />}
      {activeTab === "routines" && (
        <RoutinesTabContent purchasedLists={purchasedLists} customLists={customLists} />
      )}
      {activeTab === "purchases" && <PurchasesTabContent purchasedLists={purchasedLists} />}
    </div>
  );
}

// ============================================================================
// Tab Content: Posts
// ============================================================================

function PostsTabContent() {
  // TODO: getUserPosts API 연동 후 실제 게시물 그리드 표시
  return (
    <div className="flex flex-col items-center justify-center py-16 text-default-400">
      <Grid3X3 size={48} className="mb-4" />
      <p className="text-base">아직 게시물이 없습니다</p>
      <p className="text-sm mt-1">커뮤니티에서 첫 게시물을 작성해보세요</p>
    </div>
  );
}

// ============================================================================
// Tab Content: Routines (with progress bar)
// ============================================================================

interface RoutineListItem {
  id: string;
  items: { id: string; completed: boolean }[];
  product?: { name: string; category?: string };
  title?: string;
  category?: string;
  startDate?: string;
}

function RoutinesTabContent({
  purchasedLists,
  customLists,
}: {
  purchasedLists: RoutineListItem[];
  customLists: RoutineListItem[];
}) {
  const allLists: RoutineListItem[] = [...purchasedLists, ...customLists];

  if (allLists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-default-400">
        <ClipboardList size={48} className="mb-4" />
        <p className="text-base">진행 중인 루틴이 없습니다</p>
        <p className="text-sm mt-1">스토어에서 루틴을 시작해보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allLists.map((list) => {
        const title = list.product?.name ?? list.title ?? "루틴";
        const category = list.product?.category ?? list.category ?? "";
        const totalItems = list.items.length;
        const completedItems = list.items.filter((i) => i.completed).length;
        const progressRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        return (
          <Card key={list.id} shadow="sm" className="overflow-hidden">
            <CardBody className="p-4">
              <div className="flex items-start gap-3">
                {/* Category color bar */}
                <div className="w-1 h-12 rounded-full bg-[#65D9AC] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-default-900 text-sm font-semibold truncate">{title}</h3>
                  {category && <p className="text-default-400 text-xs mt-0.5">{category}</p>}
                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-default-500">
                        {completedItems}/{totalItems} 완료
                      </span>
                      <span className="text-xs font-medium text-[#65D9AC]">{progressRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-default-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#65D9AC] rounded-full transition-all duration-300"
                        style={{ width: `${progressRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// Tab Content: Purchases
// ============================================================================

function PurchasesTabContent({
  purchasedLists,
}: {
  purchasedLists: Array<{
    id: string;
    product: { name: string; price: number; category?: string };
    purchasedAt: string;
  }>;
}) {
  if (purchasedLists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-default-400">
        <ShoppingBag size={48} className="mb-4" />
        <p className="text-base">구매 내역이 없습니다</p>
        <p className="text-sm mt-1">스토어에서 루틴을 구매해보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {purchasedLists.map((list) => {
        const purchaseDate = new Date(list.purchasedAt);
        const formatted = `${purchaseDate.getFullYear()}.${String(purchaseDate.getMonth() + 1).padStart(2, "0")}.${String(purchaseDate.getDate()).padStart(2, "0")}`;

        return (
          <Card key={list.id} shadow="sm">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-default-900 text-sm font-semibold truncate">{list.product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {list.product.category && (
                      <span className="text-xs text-default-400">{list.product.category}</span>
                    )}
                    <span className="text-xs text-default-300">|</span>
                    <span className="text-xs text-default-400">{formatted}</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-default-700">
                  {list.product.price > 0 ? `${list.product.price.toLocaleString()}원` : "무료"}
                </span>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
