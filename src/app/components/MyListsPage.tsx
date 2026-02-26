import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  ShoppingBag,
  ClipboardList,
  LogIn,
  Plus,
  Trash2,
  Store,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Play,
} from "lucide-react";
import { Button, Chip, Card, CardBody, Tabs, Tab } from "@heroui/react";
import { useStore } from "../store-context";
import { useAuth } from "../auth-context";
import { TodoListUsable } from "./TodoListUsable";
import { CalendarView } from "./CalendarView";
import { toast } from "sonner";

type ViewMode = "weekly" | "calendar";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeekDates(centerDate: Date): Date[] {
  const dayOfWeek = centerDate.getDay();
  const start = new Date(centerDate);
  start.setDate(start.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function getWeekLabel(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const weekNum = Math.ceil(date.getDate() / 7);
  return `${year}년 ${String(month).padStart(2, "0")}월 ${weekNum}주차`;
}

export function MyListsPage() {
  const { purchasedLists, customLists, deleteCustomList } = useStore();
  const { isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [selectedDate, setSelectedDate] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const weekLabel = useMemo(() => getWeekLabel(selectedDate), [selectedDate]);

  const shiftWeek = (delta: number) => {
    setSelectedDate((prev) => { const d = new Date(prev); d.setDate(d.getDate() + delta * 7); d.setHours(0, 0, 0, 0); return d; });
  };

  useEffect(() => {
    const newIds: string[] = [];
    purchasedLists.forEach((l) => { if (!expandedCards.has(l.id)) newIds.push(l.id); });
    customLists.forEach((l) => { if (!expandedCards.has(l.id)) newIds.push(l.id); });
    if (newIds.length > 0) {
      setExpandedCards((prev) => { const next = new Set(prev); newIds.forEach((id) => next.add(id)); return next; });
    }
  }, [purchasedLists.length, customLists.length]);

  const handleToggleCard = (cardId: string) => {
    setExpandedCards((prev) => { const next = new Set(prev); if (next.has(cardId)) next.delete(cardId); else next.add(cardId); return next; });
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-secondary-100 rounded-2xl flex items-center justify-center mb-6">
          <LogIn className="w-10 h-10 text-secondary" />
        </div>
        <h2 className="text-default-900 mb-2">로그인이 필요합니다</h2>
        <p className="text-default-500 mb-6 text-center">내 리스트를 확인하려면 먼저 로그인해주세요</p>
        <Link to="/login?redirect=/my-lists" className="no-underline">
          <Button color="primary" startContent={<LogIn className="w-5 h-5" />} size="lg">로그인하기</Button>
        </Link>
      </div>
    );
  }

  const totalLists = purchasedLists.length + customLists.length;

  const handleDeleteCustom = (id: string, title: string) => {
    if (confirm(`"${title}" 루틴을 삭제하시겠습니까?`)) {
      deleteCustomList(id);
      toast.success("루틴이 삭제되었습니다.");
    }
  };

  const showPurchased = activeTab === "all" || activeTab === "purchased";
  const showCustom = activeTab === "all" || activeTab === "custom";
  const filteredPurchased = showPurchased ? purchasedLists : [];
  const filteredCustom = showCustom ? customLists : [];

  // ========================================================================
  // Progress computation for all routines
  // ========================================================================

  const allItems = useMemo(() => {
    const items = [
      ...purchasedLists.flatMap((l) => l.items),
      ...customLists.flatMap((l) => l.items),
    ];
    return items;
  }, [purchasedLists, customLists]);

  const totalTodoCount = allItems.length;
  const completedTodoCount = allItems.filter((i) => i.completed).length;
  const overallProgress = totalTodoCount > 0 ? Math.round((completedTodoCount / totalTodoCount) * 100) : 0;

  // Routine-level completion breakdown
  const activeRoutineCount = useMemo(() => {
    return [...purchasedLists, ...customLists].filter((list) => {
      const total = list.items.length;
      if (total === 0) return true; // no items yet = active
      const done = list.items.filter((i) => i.completed).length;
      return done < total;
    }).length;
  }, [purchasedLists, customLists]);

  const completedRoutineCount = useMemo(() => {
    return [...purchasedLists, ...customLists].filter((list) => {
      const total = list.items.length;
      if (total === 0) return false;
      const done = list.items.filter((i) => i.completed).length;
      return done >= total;
    }).length;
  }, [purchasedLists, customLists]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-default-900 text-2xl font-bold tracking-tight">TODAY</h1>
        <div className="flex items-center gap-2">
          <Link to="/create-routine" className="no-underline">
            <Button isIconOnly variant="bordered" size="sm" radius="lg">
              <CalendarDays className="w-5 h-5 text-secondary" />
            </Button>
          </Link>
          <Link to="/create-routine" className="no-underline">
            <Button isIconOnly color="primary" size="sm" radius="lg">
              <Plus className="w-5 h-5 text-success stroke-[3]" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Week selector */}
      {viewMode === "weekly" && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Button isIconOnly size="sm" variant="light" onPress={() => shiftWeek(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="text-sm font-semibold text-default-900">{weekLabel}</p>
            <Button isIconOnly size="sm" variant="light" onPress={() => shiftWeek(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            {!isSameDay(selectedDate, today) && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                className="ml-auto"
                onPress={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setSelectedDate(d); }}
              >
                오늘
              </Button>
            )}
          </div>

          <div className="flex justify-between gap-1.5">
            {weekDates.map((date) => {
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(new Date(date))}
                  className={`flex-1 flex flex-col items-center justify-center h-[48px] rounded-xl transition-all cursor-pointer border ${
                    isSelected ? "bg-primary border-primary text-white" : "bg-white border-default-200 hover:border-default-400"
                  }`}
                >
                  <span className={`text-[15px] font-bold leading-[18px] ${isSelected ? "text-white" : "text-default-300"}`}>{date.getDate()}</span>
                  <span className={`text-[8px] leading-[10px] mt-[2px] ${isSelected ? "text-white/50" : "text-default-200"}`}>{DAY_LABELS[date.getDay()]}</span>
                  {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-secondary mt-[1px]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Summary */}
      {totalLists > 0 && (
        <Card shadow="sm" className="mb-5">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-default-900">전체 진행률</span>
              <span className="text-sm font-bold text-[#65D9AC]">{overallProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-default-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-[#65D9AC] rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-default-500">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3 text-[#65D9AC]" />
                진행중 {activeRoutineCount}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#6C5CE7]" />
                완료 {completedRoutineCount}
              </span>
              <span className="text-default-400">
                {completedTodoCount}/{totalTodoCount} 할 일 완료
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabs + View Toggle */}
      <div className="flex items-center justify-between mb-5 gap-2">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          size="sm"
          variant="solid"
          radius="full"
          color="primary"
        >
          <Tab key="all" title={<span>전체 {totalLists > 0 && <span className="text-xs ml-1 opacity-70">{totalLists}</span>}</span>} />
          <Tab key="purchased" title={<span>구매한 루틴 {purchasedLists.length > 0 && <span className="text-xs ml-1 opacity-70">{purchasedLists.length}</span>}</span>} />
          <Tab key="custom" title={<span>나만의 루틴 {customLists.length > 0 && <span className="text-xs ml-1 opacity-70">{customLists.length}</span>}</span>} />
        </Tabs>

        <div className="flex bg-default-100 rounded-xl p-1 gap-0.5 shrink-0">
          <Button
            size="sm"
            variant={viewMode === "weekly" ? "solid" : "light"}
            color={viewMode === "weekly" ? "default" : "default"}
            onPress={() => setViewMode("weekly")}
            startContent={<Calendar className="w-3.5 h-3.5" />}
            className={`text-xs ${viewMode === "weekly" ? "bg-white shadow-sm" : ""}`}
          >
            <span className="hidden sm:inline">주간</span>
          </Button>
          <Button
            size="sm"
            variant={viewMode === "calendar" ? "solid" : "light"}
            color={viewMode === "calendar" ? "default" : "default"}
            onPress={() => setViewMode("calendar")}
            startContent={<CalendarDays className="w-3.5 h-3.5" />}
            className={`text-xs ${viewMode === "calendar" ? "bg-white shadow-sm" : ""}`}
          >
            <span className="hidden sm:inline">캘린더</span>
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {totalLists === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-default-100 rounded-2xl flex items-center justify-center mb-6">
            <ClipboardList className="w-10 h-10 text-default-400" />
          </div>
          <h2 className="text-default-900 mb-2">아직 리스트가 없습니다</h2>
          <p className="text-default-500 mb-6 text-center text-sm">스토어에서 루틴을 구매하거나 나만의 루틴을 만들어보세요</p>
          <div className="flex gap-3">
            <Link to="/" className="no-underline">
              <Button color="secondary" variant="flat" startContent={<Store className="w-4 h-4" />}>스토어 둘러보기</Button>
            </Link>
            <Link to="/create-routine" className="no-underline">
              <Button color="primary" startContent={<Plus className="w-4 h-4" />}>루틴 만들기</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && totalLists > 0 && (
        <CalendarView purchasedLists={filteredPurchased} customLists={filteredCustom} />
      )}

      {/* Weekly View */}
      {viewMode === "weekly" && (
        <>
          {showPurchased && purchasedLists.length > 0 && (
            <div className="mb-6">
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-secondary rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-default-900 text-base font-semibold">구매한 루틴</h2>
                  <span className="text-xs text-default-500 ml-1">{purchasedLists.length}개</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {purchasedLists.map((plist) => (
                  <div key={plist.id}>
                    <RoutineProgressBar items={plist.items} />
                    <TodoListUsable list={plist} isExpanded={expandedCards.has(plist.id)} onToggleExpand={() => handleToggleCard(plist.id)} selectedDate={selectedDate} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {showCustom && customLists.length > 0 && (
            <div className="mb-6">
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-success" />
                  </div>
                  <h2 className="text-default-900 text-base font-semibold">나만의 루틴</h2>
                  <span className="text-xs text-default-500 ml-1">{customLists.length}개</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customLists.map((clist) => (
                  <div key={clist.id} className="relative group/card">
                    <RoutineProgressBar items={clist.items} />
                    <TodoListUsable customList={clist} isExpanded={expandedCards.has(clist.id)} onToggleExpand={() => handleToggleCard(clist.id)} selectedDate={selectedDate} />
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="danger"
                      className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-all z-10"
                      onPress={() => handleDeleteCustom(clist.id, clist.title)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom CTA */}
      {totalLists > 0 && (
        <Card shadow="none" className="mt-8 bg-default-100">
          <CardBody className="text-center py-8">
            <p className="text-[13px] text-default-500 mb-1">TodoMarket의 완성된 루틴을 추가해서</p>
            <p className="text-[13px] text-default-500 mb-1">원하시는 목표를 달성해보세요</p>
            <p className="text-[11px] text-default-400 mb-4 mt-3">또는 상단의 + 를 통해 나만의 TO-DO LIST를 작성할 수 있습니다</p>
            <Link to="/" className="no-underline">
              <Button color="primary" variant="solid" className="font-semibold">루틴 추가하기</Button>
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Routine Progress Bar (per-routine inline progress)
// ============================================================================

interface RoutineProgressBarProps {
  items: { completed: boolean }[];
}

function RoutineProgressBar({ items }: RoutineProgressBarProps) {
  if (items.length === 0) return null;

  const total = items.length;
  const completed = items.filter((i) => i.completed).length;
  const percent = Math.round((completed / total) * 100);

  return (
    <div className="flex items-center gap-2 mb-1.5 px-1">
      <div className="flex-1 h-1.5 bg-default-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#65D9AC] rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-default-400 shrink-0">
        {completed}/{total}
      </span>
    </div>
  );
}
