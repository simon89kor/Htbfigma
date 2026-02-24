import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router";
import {
  User,
  Mail,
  Calendar,
  Edit3,
  LogOut,
  ShoppingBag,
  ClipboardList,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../auth-context";
import { useStore } from "../store-context";
import { toast } from "sonner";

export function ProfilePage() {
  const { user, logout, updateProfile, isLoggedIn } = useAuth();
  const { purchasedLists } = useStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");

  if (!isLoggedIn || !user) {
    return <Navigate to="/login?redirect=/profile" replace />;
  }

  const handleSaveName = () => {
    if (!editName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    updateProfile(editName.trim());
    setIsEditing(false);
    toast.success("프로필이 수정되었습니다.");
  };

  const handleLogout = () => {
    logout();
    toast.success("로그아웃 되었습니다.");
    navigate("/");
  };

  const joinDate = new Date(user.joinedAt);
  const formattedDate = `${joinDate.getFullYear()}년 ${joinDate.getMonth() + 1}월 ${joinDate.getDate()}일`;

  const totalTodos = purchasedLists.reduce((sum, list) => sum + list.items.length, 0);
  const completedTodos = purchasedLists.reduce(
    (sum, list) => sum + list.items.filter((item) => item.completed).length,
    0
  );
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const stats = [
    { label: "구매한 리스트", value: purchasedLists.length, icon: ShoppingBag, color: "bg-[#f4f3ff] text-[#6C5CE7]" },
    { label: "전체 할 일", value: totalTodos, icon: ClipboardList, color: "bg-[#E8FAF0] text-[#65D9AC]" },
    { label: "완료한 할 일", value: completedTodos, icon: Check, color: "bg-[#E8FAF0] text-[#3dba8a]" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-[#1a1a2e] text-[28px] mb-8 font-bold">내 프로필</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden mb-6" style={{boxShadow: 'var(--shadow-card)'}}>
        <div className="h-28 bg-[#1a1a2e] relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-12 w-20 h-20 rounded-full bg-[#6C5CE7]" />
            <div className="absolute bottom-2 left-16 w-14 h-14 rounded-full bg-[#65D9AC]" />
          </div>
          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-[36px] border-4 border-white">
              {user.avatar || "🧑‍💻"}
            </div>
          </div>
        </div>

        <div className="pt-14 pb-6 px-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-3 py-1.5 bg-[#f5f5f7] border border-black/[0.06] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 text-[18px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") { setIsEditing(false); setEditName(user.name); }
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 bg-[#E8FAF0] text-[#3dba8a] rounded-lg hover:bg-[#d0f0e0] transition-colors cursor-pointer border-none"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditName(user.name); }}
                    className="p-2 bg-[#f0f0f4] text-[#6b6b80] rounded-lg hover:bg-[#e0e0e4] transition-colors cursor-pointer border-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[#1a1a2e] text-[20px] font-bold">{user.name}</h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-[#6b6b80] hover:text-[#6C5CE7] hover:bg-[#f4f3ff] rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 text-[14px] text-[#6b6b80]">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formattedDate} 가입
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-black/[0.06] p-5 text-center"
              style={{boxShadow: 'var(--shadow-card)'}}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-[24px] text-[#1a1a2e] mb-1 font-bold">{stat.value}</div>
              <div className="text-[13px] text-[#6b6b80]">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      {totalTodos > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6 mb-6" style={{boxShadow: 'var(--shadow-card)'}}>
          <h3 className="text-[#1a1a2e] mb-4 font-semibold">전체 진행률</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-[#f0f0f4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6C5CE7] rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-[18px] text-[#6C5CE7] font-bold min-w-[50px] text-right">
              {completionRate}%
            </span>
          </div>
          <p className="text-[13px] text-[#6b6b80] mt-2">
            전체 {totalTodos}개 중 {completedTodos}개 완료
          </p>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden mb-6" style={{boxShadow: 'var(--shadow-card)'}}>
        <Link
          to="/my-lists"
          className="flex items-center justify-between p-5 hover:bg-black/[0.01] transition-colors no-underline border-b border-black/[0.04]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f4f3ff] rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#6C5CE7]" />
            </div>
            <div>
              <div className="text-[#1a1a2e] text-[15px] font-medium">내 To-Do 리스트</div>
              <div className="text-[13px] text-[#6b6b80]">구매한 리스트 확인 및 관리</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6b6b80]" />
        </Link>
        <Link
          to="/"
          className="flex items-center justify-between p-5 hover:bg-black/[0.01] transition-colors no-underline"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E8FAF0] rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#65D9AC]" />
            </div>
            <div>
              <div className="text-[#1a1a2e] text-[15px] font-medium">스토어 둘러보기</div>
              <div className="text-[13px] text-[#6b6b80]">새로운 To-Do 리스트 구매</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6b6b80]" />
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-black/[0.06] text-red-500 rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer"
      >
        <LogOut className="w-5 h-5" />
        로그아웃
      </button>
    </div>
  );
}
