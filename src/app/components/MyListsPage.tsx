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
} from "lucide-react";
import { useStore } from "../store-context";
import { useAuth } from "../auth-context";
import { TodoListUsable } from "./TodoListUsable";
import { CalendarView } from "./CalendarView";
import { toast } from "sonner";

type ViewMode = "weekly" | "calendar";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekDates(centerDate: Date): Date[] {
  const dayOfWeek = centerDate.getDay(); // 0=Sun
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
  const [activeTab, setActiveTab] = useState<"all" | "purchased" | "custom">(
    "all"
  );
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Weekly selector state
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const weekLabel = useMemo(() => getWeekLabel(selectedDate), [selectedDate]);

  const shiftWeek = (delta: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  };

  // Auto-expand new cards when they are added
  useEffect(() => {
    const newIds: string[] = [];
    purchasedLists.forEach((l) => {
      if (!expandedCards.has(l.id)) newIds.push(l.id);
    });
    customLists.forEach((l) => {
      if (!expandedCards.has(l.id)) newIds.push(l.id);
    });
    if (newIds.length > 0) {
      setExpandedCards((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [purchasedLists.length, customLists.length]);

  const handleToggleCard = (cardId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mb-6">
          <LogIn className="w-10 h-10 text-violet-400" />
        </div>
        <h2 className="text-[#1a1a2e] mb-2">로그인이 필요합니다</h2>
        <p className="text-gray-400 mb-6 text-center">
          내 리스트를 확인하려면 먼저 로그인해주세요
        </p>
        <Link
          to="/login?redirect=/my-lists"
          className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl no-underline hover:bg-violet-700 transition-colors"
        >
          <LogIn className="w-5 h-5" />
          로그인하기
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

  return (
    <div>
      {/* Header - Figma style */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[#212422] text-[24px] font-black tracking-[-0.24px]">
          TODAY{" "}
          <span className="text-[20px]">📅</span>
        </h1>
        <div className="flex items-center gap-2">
          <Link
            to="/create-routine"
            className="w-[40px] h-[40px] bg-white rounded-lg shadow-[0px_0px_8px_0px_rgba(0,0,0,0.1)] flex items-center justify-center no-underline"
          >
            <CalendarDays className="w-5 h-5 text-[#65D9AC]" />
          </Link>
          <Link
            to="/create-routine"
            className="w-[40px] h-[40px] bg-white rounded-lg shadow-[0px_0px_8px_0px_rgba(0,0,0,0.1)] flex items-center justify-center no-underline"
          >
            <Plus className="w-5 h-5 text-[#65D9AC] stroke-[3]" />
          </Link>
        </div>
      </div>

      {/* Week selector (page-level, Figma style) */}
      {viewMode === "weekly" && (
        <div className="mb-5">
          {/* Week label + nav arrows */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => shiftWeek(-1)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer bg-transparent border-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-[14px] font-semibold text-[#212422] tracking-[-0.14px]">
              {weekLabel}
            </p>
            <button
              onClick={() => shiftWeek(1)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer bg-transparent border-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isSameDay(selectedDate, today) && (
              <button
                onClick={() => {
                  const d = new Date();
                  d.setHours(0, 0, 0, 0);
                  setSelectedDate(d);
                }}
                className="ml-auto text-[11px] px-2.5 py-1 bg-[#212422] text-[#B1F1B8] rounded-md cursor-pointer border-none"
              >
                오늘
              </button>
            )}
          </div>

          {/* Day cells - Figma style */}
          <div className="flex justify-between gap-1.5">
            {weekDates.map((date) => {
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);
              const dayNum = date.getDate();
              const dayLabel = DAY_LABELS[date.getDay()];

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(new Date(date))}
                  className={`flex-1 flex flex-col items-center justify-center h-[48px] rounded-[4px] transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#212422] border border-[#212422]"
                      : "bg-white border border-[#ececec]"
                  }`}
                >
                  <span
                    className={`text-[15px] font-bold leading-[18px] tracking-[-0.15px] ${
                      isSelected
                        ? "text-white"
                        : "text-[#212422] opacity-20"
                    }`}
                  >
                    {dayNum}
                  </span>
                  <span
                    className={`text-[8px] leading-[10px] mt-[2px] tracking-[-0.08px] ${
                      isSelected
                        ? "text-white opacity-50"
                        : "text-[#212422] opacity-10"
                    }`}
                  >
                    {dayLabel}
                  </span>
                  {isToday && !isSelected && (
                    <div className="w-1 h-1 rounded-full bg-[#65D9AC] mt-[1px]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs + View Toggle */}
      <div className="flex items-center justify-between mb-5 gap-2">
        <div className="flex gap-1.5 min-w-0 overflow-x-auto shrink">
          {[
            { key: "all" as const, label: "전체", count: totalLists },
            {
              key: "purchased" as const,
              label: "구매한 루틴",
              count: purchasedLists.length,
            },
            {
              key: "custom" as const,
              label: "나만의 루틴",
              count: customLists.length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-full text-[12px] transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
                activeTab === tab.key
                  ? "bg-[#212422] text-white border-[#212422]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1 text-[10px] ${
                    activeTab === tab.key ? "text-[#B1F1B8]" : "text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5 shrink-0">
          <button
            onClick={() => setViewMode("weekly")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer border-none ${
              viewMode === "weekly"
                ? "bg-white text-[#212422] shadow-sm"
                : "bg-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">주간</span>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer border-none ${
              viewMode === "calendar"
                ? "bg-white text-[#212422] shadow-sm"
                : "bg-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">캘린더</span>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {totalLists === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ClipboardList className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-[#1a1a2e] mb-2">아직 리스트가 없습니다</h2>
          <p className="text-gray-400 mb-6 text-center text-[14px]">
            스토어에서 루틴을 구매하거나 나만의 루틴을 만들어보세요
          </p>
          <div className="flex gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-50 text-violet-600 rounded-xl no-underline hover:bg-violet-100 transition-colors text-[14px]"
            >
              <Store className="w-4 h-4" />
              스토어 둘러보기
            </Link>
            <Link
              to="/create-routine"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#212422] text-[#B1F1B8] rounded-xl no-underline hover:bg-[#333] transition-colors text-[14px] font-semibold"
            >
              <Plus className="w-4 h-4" />
              루틴 만들기
            </Link>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && totalLists > 0 && (
        <CalendarView
          purchasedLists={filteredPurchased}
          customLists={filteredCustom}
        />
      )}

      {/* Weekly View */}
      {viewMode === "weekly" && (
        <>
          {/* Purchased Lists */}
          {showPurchased && purchasedLists.length > 0 && (
            <div className="mb-6">
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-violet-500 rounded-md flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-[#1a1a2e] text-[18px]">구매한 루틴</h2>
                  <span className="text-[12px] text-gray-400 ml-1">
                    {purchasedLists.length}개
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {purchasedLists.map((plist) => (
                  <TodoListUsable
                    key={plist.id}
                    list={plist}
                    isExpanded={expandedCards.has(plist.id)}
                    onToggleExpand={() => handleToggleCard(plist.id)}
                    selectedDate={selectedDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Custom Lists */}
          {showCustom && customLists.length > 0 && (
            <div className="mb-6">
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-[#212422] rounded-md flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-[#B1F1B8]" />
                  </div>
                  <h2 className="text-[#1a1a2e] text-[18px]">나만의 루틴</h2>
                  <span className="text-[12px] text-gray-400 ml-1">
                    {customLists.length}개
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customLists.map((clist) => (
                  <div key={clist.id} className="relative group/card">
                    <TodoListUsable
                      customList={clist}
                      isExpanded={expandedCards.has(clist.id)}
                      onToggleExpand={() => handleToggleCard(clist.id)}
                      selectedDate={selectedDate}
                    />
                    <button
                      onClick={() =>
                        handleDeleteCustom(clist.id, clist.title)
                      }
                      className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover/card:opacity-100 transition-all cursor-pointer border-none shadow-sm z-10"
                      title="루틴 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom CTA */}
      {totalLists > 0 && (
        <div className="mt-8 text-center py-8 bg-gray-50 rounded-2xl">
          <p className="text-[13px] text-gray-500 mb-1">
            TodoMarket의 완성된 루틴을 추가해서
          </p>
          <p className="text-[13px] text-gray-500 mb-1">
            원하시는 목표를 달성해보세요
          </p>
          <p className="text-[11px] text-gray-400 mb-4 mt-3">
            또는 상단의 + 를 통해 나만의 TO-DO LIST를 작성할 수 있습니다
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#212422] text-[#B1F1B8] rounded-xl no-underline hover:bg-[#333] transition-colors text-[14px] font-semibold"
            >
              HOW TO BE 추가하기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}