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
import { Button, Card, CardBody, Input, Progress, Avatar, Divider } from "@heroui/react";
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
    if (!editName.trim()) { toast.error("이름을 입력해주세요."); return; }
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
  const completedTodos = purchasedLists.reduce((sum, list) => sum + list.items.filter((item) => item.completed).length, 0);
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const stats = [
    { label: "구매한 리스트", value: purchasedLists.length, icon: ShoppingBag, color: "secondary" as const },
    { label: "전체 할 일", value: totalTodos, icon: ClipboardList, color: "success" as const },
    { label: "완료한 할 일", value: completedTodos, icon: Check, color: "success" as const },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-default-900 text-[28px] mb-8 font-bold">내 프로필</h1>

      {/* Profile Card */}
      <Card shadow="sm" className="mb-6 overflow-hidden">
        <div className="h-28 bg-[#1a1a2e] relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-12 w-20 h-20 rounded-full bg-[#6C5CE7]" />
            <div className="absolute bottom-2 left-16 w-14 h-14 rounded-full bg-[#65D9AC]" />
          </div>
          <div className="absolute -bottom-10 left-8">
            <Avatar
              className="w-20 h-20 text-4xl border-4 border-white"
              showFallback
              fallback={<span className="text-4xl">{user.avatar || "🧑‍💻"}</span>}
              size="lg"
            />
          </div>
        </div>
        <CardBody className="pt-14 pb-6 px-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2 mb-1">
                  <Input
                    value={editName}
                    onValueChange={setEditName}
                    variant="bordered"
                    size="sm"
                    className="max-w-[200px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") { setIsEditing(false); setEditName(user.name); }
                    }}
                  />
                  <Button isIconOnly size="sm" color="success" variant="flat" onPress={handleSaveName}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button isIconOnly size="sm" variant="flat" onPress={() => { setIsEditing(false); setEditName(user.name); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-default-900 text-xl font-bold">{user.name}</h2>
                  <Button isIconOnly size="sm" variant="light" onPress={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-default-500">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{user.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formattedDate} 가입</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} shadow="sm">
              <CardBody className="items-center text-center p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 bg-${stat.color}-100 text-${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl text-default-900 mb-1 font-bold">{stat.value}</div>
                <div className="text-[13px] text-default-500">{stat.label}</div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Progress */}
      {totalTodos > 0 && (
        <Card shadow="sm" className="mb-6">
          <CardBody className="p-6 gap-3">
            <h3 className="text-default-900 font-semibold">전체 진행률</h3>
            <Progress
              value={completionRate}
              color="secondary"
              size="md"
              showValueLabel
              classNames={{ value: "text-secondary font-bold text-lg" }}
            />
            <p className="text-[13px] text-default-500">전체 {totalTodos}개 중 {completedTodos}개 완료</p>
          </CardBody>
        </Card>
      )}

      {/* Quick Links */}
      <Card shadow="sm" className="mb-6">
        <CardBody className="p-0">
          <Link to="/my-lists" className="flex items-center justify-between p-5 hover:bg-default-50 transition-colors no-underline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <div className="text-default-900 text-[15px] font-medium">내 To-Do 리스트</div>
                <div className="text-[13px] text-default-500">구매한 리스트 확인 및 관리</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-default-400" />
          </Link>
          <Divider />
          <Link to="/" className="flex items-center justify-between p-5 hover:bg-default-50 transition-colors no-underline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="text-default-900 text-[15px] font-medium">스토어 둘러보기</div>
                <div className="text-[13px] text-default-500">새로운 To-Do 리스트 구매</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-default-400" />
          </Link>
        </CardBody>
      </Card>

      {/* Logout */}
      <Button
        color="danger"
        variant="bordered"
        fullWidth
        size="lg"
        startContent={<LogOut className="w-5 h-5" />}
        onPress={handleLogout}
      >
        로그아웃
      </Button>
    </div>
  );
}
