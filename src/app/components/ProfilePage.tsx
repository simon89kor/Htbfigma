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
    {
      label: "구매한 리스트",
      value: purchasedLists.length,
      icon: ShoppingBag,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "전체 할 일",
      value: totalTodos,
      icon: ClipboardList,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "완료한 할 일",
      value: completedTodos,
      icon: Check,
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-[#1a1a2e] text-[28px] mb-8">내 프로필</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Profile Header (gradient) */}
        <div className="h-28 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 relative">
          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-[36px] border-4 border-white">
              {user.avatar || "🧑‍💻"}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-14 pb-6 px-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 text-[18px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setIsEditing(false);
                        setEditName(user.name);
                      }
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors cursor-pointer border-none"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(user.name);
                    }}
                    className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[#1a1a2e] text-[20px]">{user.name}</h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 text-[14px] text-gray-400">
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
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${stat.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-[24px] text-[#1a1a2e] mb-1">{stat.value}</div>
              <div className="text-[13px] text-gray-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      {totalTodos > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="text-[#1a1a2e] mb-4">전체 진행률</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-[18px] text-violet-600 min-w-[50px] text-right">
              {completionRate}%
            </span>
          </div>
          <p className="text-[13px] text-gray-400 mt-2">
            전체 {totalTodos}개 중 {completedTodos}개 완료
          </p>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <Link
          to="/my-lists"
          className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors no-underline border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <div className="text-[#1a1a2e] text-[15px]">내 To-Do 리스트</div>
              <div className="text-[13px] text-gray-400">구매한 리스트 확인 및 관리</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          to="/"
          className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors no-underline"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-[#1a1a2e] text-[15px]">스토어 둘러보기</div>
              <div className="text-[13px] text-gray-400">새로운 To-Do 리스트 구매</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-red-500 rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer"
      >
        <LogOut className="w-5 h-5" />
        로그아웃
      </button>
    </div>
  );
}