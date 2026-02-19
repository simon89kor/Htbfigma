import { useState, useMemo } from "react";
import {
  Check,
  ChevronUp,
  ChevronDown,
  Clock,
  Plus,
  Trash2,
  X,
  Repeat,
  Settings2,
  ArrowRight,
  CalendarClock,
  ListTree,
} from "lucide-react";
import { PurchasedList, CustomList, useStore } from "../store-context";
import { toast } from "sonner";

interface TodoListUsableProps {
  list?: PurchasedList;
  customList?: CustomList;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  /** The externally-selected calendar date (page-level week selector). Defaults to today. */
  selectedDate?: Date;
}

function getDDay(startDate: string, durationDays: number): number {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays - 1);
  const now = new Date();
  const diff = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

function getContrastText(color: string): string {
  const dark = ["#212422", "#922A2A", "#49AA85", "#9396E2", "#E36185"];
  return dark.includes(color) ? "white" : "#212422";
}

function dateToDayNum(date: Date, startDate: string): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function TodoListUsable({
  list,
  customList,
  isExpanded: controlledExpanded,
  onToggleExpand,
  selectedDate: externalDate,
}: TodoListUsableProps) {
  const {
    toggleTodoItem,
    addCustomTodoItem,
    deleteCustomTodoItem,
    toggleCustomTodoItem,
    updateCustomTodoItem,
    toggleSubItem,
    addSubItem,
    deleteSubItem,
    toggleListMoveToNextDay,
  } = useStore();

  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const handleToggleExpand =
    onToggleExpand || (() => setInternalExpanded((v) => !v));

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Use external date if provided, otherwise use today
  const activeDate = externalDate || today;

  const [newItemText, setNewItemText] = useState("");
  const [newItemTime, setNewItemTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showSubItemInput, setShowSubItemInput] = useState<string | null>(null);
  const [newSubText, setNewSubText] = useState("");
  const [showListSettings, setShowListSettings] = useState(false);

  // Unified data access
  const isCustom = !!customList;
  const id = isCustom ? customList!.id : list!.id;
  const title = isCustom ? customList!.title : list!.product.name;
  const headerColor = isCustom ? customList!.headerColor : list!.product.color;
  const durationDays = isCustom
    ? customList!.durationDays
    : list!.product.durationDays;
  const items = isCustom ? customList!.items : list!.items;
  const startDate = isCustom
    ? customList!.startDate
    : list!.startDate || list!.purchasedAt;
  const showDDay = isCustom ? customList!.showDDay : true;
  const listMoveToNextDay = isCustom
    ? customList!.moveToNextDay
    : list!.moveToNextDay;

  const dday = getDDay(startDate, durationDays);
  const textColor = getContrastText(headerColor);

  // Day number from the active (selected) date
  const activeDayNum = useMemo(
    () => dateToDayNum(activeDate, startDate),
    [activeDate, startDate]
  );

  const isDayInRange = activeDayNum >= 1 && activeDayNum <= durationDays;
  const isActiveToday =
    activeDate.getFullYear() === today.getFullYear() &&
    activeDate.getMonth() === today.getMonth() &&
    activeDate.getDate() === today.getDate();

  const dayTitleMap = useMemo(() => {
    if (isCustom) return {};
    const map: Record<number, string> = {};
    list!.product.dayPlans.forEach((dp) => {
      map[dp.day] = dp.title;
    });
    return map;
  }, [isCustom, list]);

  // Items for the active day
  const dayItems = useMemo(
    () => (isDayInRange ? items.filter((item) => item.day === activeDayNum) : []),
    [items, activeDayNum, isDayInRange]
  );

  // Day progress
  const dayCompleted = dayItems.filter((i) => i.completed).length;
  const dayTotal = dayItems.length;
  const dayProgress = dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0;

  // Overall progress (all items across all days)
  const overallCompleted = items.filter((i) => i.completed).length;
  const overallTotal = items.length;
  const overallProgress =
    overallTotal > 0 ? (overallCompleted / overallTotal) * 100 : 0;

  // For collapsed footer — show today's progress
  const todayDayNum = useMemo(() => {
    const num = dateToDayNum(today, startDate);
    return Math.max(1, Math.min(num, durationDays));
  }, [today, startDate, durationDays]);

  const todayItems = useMemo(
    () => items.filter((item) => item.day === todayDayNum),
    [items, todayDayNum]
  );
  const todayCompleted = todayItems.filter((i) => i.completed).length;
  const todayTotal = todayItems.length;
  const todayProgress = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

  const handleToggle = (itemId: string) => {
    if (!isActiveToday) {
      toast.info("오늘 날짜의 할 일만 완료할 수 있습니다.");
      return;
    }
    if (isCustom) toggleCustomTodoItem(id, itemId);
    else toggleTodoItem(id, itemId);
  };

  const handleAdd = () => {
    if (!newItemText.trim() || !isCustom) return;
    addCustomTodoItem(id, newItemText.trim(), activeDayNum, newItemTime || undefined);
    setNewItemText("");
    setNewItemTime("");
    setShowTimePicker(false);
  };

  const handleDelete = (itemId: string) => {
    if (isCustom) deleteCustomTodoItem(id, itemId);
  };

  const handleAddSubItem = (itemId: string) => {
    if (!newSubText.trim()) return;
    addSubItem(id, itemId, newSubText.trim());
    setNewSubText("");
    setShowSubItemInput(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Colored Header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer"
        style={{ backgroundColor: headerColor }}
        onClick={handleToggleExpand}
      >
        <div className="flex-1 min-w-0">
          <p
            className="text-[16px] font-semibold truncate"
            style={{ color: textColor }}
          >
            {title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {showDDay && dday > 0 && (
              <span
                className="text-[12px] font-semibold"
                style={{
                  color:
                    headerColor === "#E36185" || headerColor === "#922A2A"
                      ? "#FFD24F"
                      : "#E36185",
                }}
              >
                D-{dday}
              </span>
            )}
            {showDDay && dday <= 0 && (
              <span
                className="text-[12px] font-semibold"
                style={{ color: textColor, opacity: 0.7 }}
              >
                {dday === 0 ? "D-DAY" : `D+${Math.abs(dday)}`}
              </span>
            )}
            {listMoveToNextDay && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor:
                    textColor === "white"
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.08)",
                  color: textColor,
                  opacity: 0.8,
                }}
              >
                <ArrowRight className="w-2.5 h-2.5 inline -mt-px mr-0.5" />
                자동이월
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" style={{ color: textColor }} />
          ) : (
            <ChevronDown className="w-5 h-5" style={{ color: textColor }} />
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Day info + Settings */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {!isDayInRange ? (
                  <span className="text-[12px] text-gray-400 flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5" />
                    이 날짜는 루틴 범위 밖입니다
                  </span>
                ) : (
                  <p className="text-[13px] text-gray-600">
                    <span className="font-semibold text-[#212422]">
                      Day {activeDayNum}
                    </span>
                    {dayTitleMap[activeDayNum]
                      ? ` — ${dayTitleMap[activeDayNum]}`
                      : ""}
                    {isActiveToday && (
                      <span
                        className="ml-1.5 text-[10px] text-white px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: headerColor }}
                      >
                        오늘
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isDayInRange && (
                  <p className="text-[12px] text-gray-400">
                    {dayCompleted}/{dayTotal}
                  </p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowListSettings((v) => !v);
                  }}
                  className={`p-1 rounded-md transition-all cursor-pointer border-none ${
                    showListSettings
                      ? "bg-gray-200 text-gray-700"
                      : "bg-transparent text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List-level settings */}
            {showListSettings && (
              <div className="mt-2 p-2.5 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[12px] text-gray-600">
                      미완료 항목 다음 날로 자동 이월
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleListMoveToNextDay(id);
                    }}
                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer border-none ${
                      listMoveToNextDay ? "bg-[#65D9AC]" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-[2px] w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                        listMoveToNextDay
                          ? "translate-x-[22px]"
                          : "translate-x-[2px]"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Day Progress bar */}
            {isDayInRange && (
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${dayProgress}%`,
                    backgroundColor: headerColor,
                  }}
                />
              </div>
            )}
          </div>

          {/* Todo Items */}
          <div className="px-4 space-y-0 max-h-[400px] overflow-y-auto">
            {isDayInRange && dayItems.length === 0 && (
              <div className="py-6 text-center text-gray-400 text-[13px]">
                {isActiveToday
                  ? "오늘의 할 일이 없습니다."
                  : "이 날의 할 일이 없습니다."}
              </div>
            )}
            {!isDayInRange && (
              <div className="py-6 text-center text-gray-300 text-[13px]">
                루틴 기간에 포함되지 않는 날짜입니다.
              </div>
            )}
            {dayItems.map((item) => (
              <div key={item.id}>
                <div
                  className={`flex items-start gap-3 py-3 group ${
                    item.completed ? "opacity-50" : ""
                  }`}
                >
                  {/* Check button */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all cursor-pointer mt-0.5 ${
                      item.completed
                        ? "border-green-500 bg-green-500"
                        : "bg-transparent hover:border-gray-500"
                    }`}
                    style={!item.completed ? { borderColor: headerColor } : {}}
                  >
                    {item.completed && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-[14px] transition-all ${
                        item.completed
                          ? "line-through text-gray-400"
                          : "text-[#212422]"
                      }`}
                    >
                      {item.text}
                    </span>

                    {/* Time & meta info */}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.time && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </span>
                      )}
                      {item.repeatDays && item.repeatDays.length > 0 && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                          <Repeat className="w-3 h-3" />
                          {item.repeatDays
                            .map(
                              (d) =>
                                ["일", "월", "화", "수", "목", "금", "토"][d]
                            )
                            .join(" ")}
                        </span>
                      )}
                    </div>

                    {/* Sub items */}
                    {item.subItems && item.subItems.length > 0 && (
                      <div className="mt-2 ml-1 space-y-1">
                        {item.subItems.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-2"
                          >
                            <button
                              onClick={() => {
                                if (!isActiveToday) {
                                  toast.info("오늘 날짜의 할 일만 완료할 수 있습니다.");
                                  return;
                                }
                                toggleSubItem(id, item.id, sub.id);
                              }}
                              className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center cursor-pointer transition-all ${
                                sub.completed
                                  ? "border-green-400 bg-green-400"
                                  : "border-gray-300 bg-transparent hover:border-gray-500"
                              }`}
                            >
                              {sub.completed && (
                                <Check className="w-2 h-2 text-white" />
                              )}
                            </button>
                            <span
                              className={`text-[12px] ${
                                sub.completed
                                  ? "line-through text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              {sub.text}
                            </span>
                            {isCustom && (
                              <button
                                onClick={() =>
                                  deleteSubItem(id, item.id, sub.id)
                                }
                                className="p-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer bg-transparent border-none"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions: only for custom lists */}
                  {isCustom && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() =>
                          setEditingItemId(
                            editingItemId === item.id ? null : item.id
                          )
                        }
                        className={`p-1.5 rounded-lg transition-all cursor-pointer border-none ${
                          editingItemId === item.id
                            ? "bg-gray-100 text-gray-600"
                            : "text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-gray-50"
                        }`}
                        title="편집"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer bg-transparent border-none rounded-lg hover:bg-red-50"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Edit Panel (only for custom lists) */}
                {isCustom && editingItemId === item.id && (
                  <div className="ml-8 mb-3 rounded-xl border border-gray-100 overflow-hidden">
                    {/* Time Setting Row */}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-50">
                      <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        시간
                      </span>
                      <input
                        type="time"
                        value={item.time || ""}
                        onChange={(e) => {
                          updateCustomTodoItem(id, item.id, {
                            time: e.target.value || undefined,
                          });
                        }}
                        className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-200 w-[100px]"
                      />
                    </div>

                    {/* Repeat Days Row */}
                    <div className="px-3 py-2.5 bg-white border-b border-gray-50">
                      <span className="text-[12px] text-gray-500 flex items-center gap-1.5 mb-2">
                        <Repeat className="w-3.5 h-3.5 text-green-500" />
                        반복 요일
                      </span>
                      <div className="flex gap-1">
                        {["월", "화", "수", "목", "금", "토", "일"].map(
                          (d, idx) => {
                            const dayIdx = idx + 1 === 7 ? 0 : idx + 1;
                            const isActive =
                              item.repeatDays?.includes(dayIdx);
                            return (
                              <button
                                key={d}
                                onClick={() => {
                                  const current = item.repeatDays || [];
                                  const updated = isActive
                                    ? current.filter((v) => v !== dayIdx)
                                    : [...current, dayIdx];
                                  updateCustomTodoItem(id, item.id, {
                                    repeatDays: updated.length
                                      ? updated
                                      : undefined,
                                  });
                                }}
                                className={`w-7 h-7 rounded-full text-[10px] font-medium border transition-all cursor-pointer ${
                                  isActive
                                    ? "text-white border-transparent"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                                }`}
                                style={
                                  isActive
                                    ? { backgroundColor: headerColor }
                                    : {}
                                }
                              >
                                {d}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Sub Items Row */}
                    <div className="px-3 py-2.5 bg-white">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
                          <ListTree className="w-3.5 h-3.5 text-orange-500" />
                          하위 항목
                          {item.subItems && item.subItems.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded-full text-gray-400">
                              {item.subItems.length}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() =>
                            setShowSubItemInput(
                              showSubItemInput === item.id ? null : item.id
                            )
                          }
                          className="text-[11px] px-2 py-0.5 rounded-lg cursor-pointer border-none transition-colors"
                          style={{
                            backgroundColor: headerColor + "18",
                            color:
                              headerColor === "#FFD24F" ||
                              headerColor === "#B1F1B8" ||
                              headerColor === "#C3DF13"
                                ? "#212422"
                                : headerColor,
                          }}
                        >
                          + 추가
                        </button>
                      </div>
                      {showSubItemInput === item.id && (
                        <div className="flex gap-1.5 mt-1.5">
                          <input
                            type="text"
                            value={newSubText}
                            onChange={(e) => setNewSubText(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleAddSubItem(item.id)
                            }
                            placeholder="하위 항목 입력..."
                            className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-gray-300"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddSubItem(item.id)}
                            disabled={!newSubText.trim()}
                            className="px-2.5 py-1.5 text-[11px] text-white rounded-lg cursor-pointer border-none disabled:opacity-40"
                            style={{ backgroundColor: "#212422" }}
                          >
                            추가
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add New Item: only for custom lists */}
          {isCustom && isDayInRange && (
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder={`Day ${activeDayNum}에 항목 추가...`}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                  />
                  <button
                    onClick={() => setShowTimePicker(!showTimePicker)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      showTimePicker || newItemTime
                        ? "bg-[#212422] text-white border-[#212422]"
                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  disabled={!newItemText.trim()}
                  className="px-4 py-2.5 bg-[#212422] text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 border-none"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {showTimePicker && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="time"
                    value={newItemTime}
                    onChange={(e) => setNewItemTime(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[14px] focus:outline-none"
                  />
                  {newItemTime && (
                    <button
                      onClick={() => {
                        setNewItemTime("");
                        setShowTimePicker(false);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Overall Progress */}
          <div className="px-4 pb-4 pt-2">
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${overallProgress}%`,
                  backgroundColor: headerColor,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-gray-400">
                전체 진행률
              </span>
              <span className="text-[11px] text-gray-600">
                {overallCompleted}/{overallTotal} ({Math.round(overallProgress)}%)
              </span>
            </div>
          </div>
        </>
      )}

      {/* Collapsed footer */}
      {!isExpanded && (
        <div className="px-4 py-2.5 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-500">
                Day {todayDayNum}
                {dayTitleMap[todayDayNum]
                  ? ` — ${dayTitleMap[todayDayNum]}`
                  : ""}
              </span>
              <span className="text-[11px] text-gray-400">
                {todayCompleted}/{todayTotal}
              </span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${todayProgress}%`,
                  backgroundColor: headerColor,
                }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[10px] text-gray-400">오늘의 진행률</span>
              <span className="text-[10px] text-gray-400">
                {Math.round(todayProgress)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}