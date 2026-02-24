import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Check,
  X,
} from "lucide-react";
import { useStore, type CustomList } from "../store-context";
import { useAuth } from "../auth-context";
import { toast } from "sonner";

const COLORS = [
  "#FFD24F",
  "#B1F1B8",
  "#49AA85",
  "#212422",
  "#E36185",
  "#922A2A",
  "#9396E2",
  "#C3DF13",
];

const CATEGORIES = [
  "식단관리",
  "자기계발",
  "운동",
  "자격증",
  "학업",
  "라이프스타일",
  "건강",
  "비즈니스",
  "생산성",
  "여행",
];

const DURATION_OPTIONS: { label: string; value: CustomList["durationType"]; days: number }[] = [
  { label: "1주일", value: "1week", days: 7 },
  { label: "4주일", value: "4weeks", days: 28 },
  { label: "100일", value: "100days", days: 100 },
  { label: "무기한", value: "unlimited", days: 365 },
];

interface NewTodoItem {
  text: string;
  time?: string;
  repeatDays?: number[];
}

export function CreateRoutinePage() {
  const navigate = useNavigate();
  const { createCustomList, addCustomTodoItem } = useStore();
  const { isLoggedIn } = useAuth();

  const [step, setStep] = useState(1); // 1=settings, 2=schedule, 3=write todos

  // Step 1: Settings
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [durationType, setDurationType] = useState<CustomList["durationType"]>("4weeks");
  const [headerColor, setHeaderColor] = useState(COLORS[3]);
  const [showDDay, setShowDDay] = useState(true);

  // Step 2: Schedule
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"start" | "end">("start");

  // Step 3: Write todos
  const [selectedDay, setSelectedDay] = useState(1);
  const [todoItems, setTodoItems] = useState<Record<number, NewTodoItem[]>>({});
  const [newItemText, setNewItemText] = useState("");
  const [newItemTime, setNewItemTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const durationDays = DURATION_OPTIONS.find((d) => d.value === durationType)?.days || 28;

  const endDate = useMemo(() => {
    if (!startDate) return null;
    const end = new Date(startDate);
    end.setDate(end.getDate() + durationDays - 1);
    return end;
  }, [startDate, durationDays]);

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // Calendar helpers
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [calendarYear, calendarMonth]);

  const prevMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const isStartDateSelected = (day: number) => {
    if (!startDate) return false;
    return (
      startDate.getFullYear() === calendarYear &&
      startDate.getMonth() === calendarMonth &&
      startDate.getDate() === day
    );
  };

  const isEndDateSelected = (day: number) => {
    if (!endDate) return false;
    return (
      endDate.getFullYear() === calendarYear &&
      endDate.getMonth() === calendarMonth &&
      endDate.getDate() === day
    );
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const d = new Date(calendarYear, calendarMonth, day);
    return d > startDate && d < endDate;
  };

  const selectCalendarDay = (day: number) => {
    const date = new Date(calendarYear, calendarMonth, day);
    setStartDate(date);
    setActiveTab("end");
  };

  // Step 3: Write calendar for selected month within duration
  const step3CalendarDays = useMemo(() => {
    if (!startDate) return [];
    const monthDate = new Date(calendarYear, calendarMonth, 1);
    const firstDay = monthDate.getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [calendarYear, calendarMonth, startDate]);

  const getDayNumber = (calDay: number): number | null => {
    if (!startDate) return null;
    const date = new Date(calendarYear, calendarMonth, calDay);
    const diff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diff < 1 || diff > durationDays) return null;
    return diff;
  };

  const isDateInRange = (calDay: number): boolean => {
    const dayNum = getDayNumber(calDay);
    return dayNum !== null;
  };

  const hasItems = (calDay: number): boolean => {
    const dayNum = getDayNumber(calDay);
    if (!dayNum) return false;
    return (todoItems[dayNum]?.length || 0) > 0;
  };

  const addTodoForDay = () => {
    if (!newItemText.trim()) return;
    const item: NewTodoItem = {
      text: newItemText.trim(),
      ...(newItemTime && { time: newItemTime }),
    };
    setTodoItems((prev) => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), item],
    }));
    setNewItemText("");
    setNewItemTime("");
    setShowTimePicker(false);
  };

  const removeTodoForDay = (dayNum: number, index: number) => {
    setTodoItems((prev) => ({
      ...prev,
      [dayNum]: prev[dayNum]?.filter((_, i) => i !== index) || [],
    }));
  };

  const canProceedStep1 = title.trim() && category;
  const canProceedStep2 = startDate !== null;
  const totalItemsCount = Object.values(todoItems).reduce((sum, items) => sum + items.length, 0);

  const handleComplete = () => {
    if (!startDate || !endDate) return;
    const listId = createCustomList({
      title: title.trim(),
      category,
      headerColor,
      durationType,
      durationDays,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      showDDay,
    });

    // Add all todo items
    Object.entries(todoItems).forEach(([day, items]) => {
      items.forEach((item) => {
        addCustomTodoItem(listId, item.text, parseInt(day), item.time);
      });
    });

    toast.success("나만의 루틴이 생성되었습니다!");
    navigate("/my-lists");
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[#6b6b80] mb-4">로그인이 필요합니다</p>
        <button
          onClick={() => navigate("/login?redirect=/create-routine")}
          className="px-6 py-3 bg-[#1a1a2e] text-[#65D9AC] rounded-xl cursor-pointer border-none font-medium"
        >
          로그인하기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else navigate(-1);
          }}
          className="p-2 -ml-2 text-[#1a1a2e] hover:bg-black/[0.03] rounded-lg transition-colors cursor-pointer bg-transparent border-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] text-[#1a1a2e] font-bold">
          {step === 1 ? "루틴 추가하기" : step === 2 ? "일정 선택" : "작성하기"}
        </h1>
        <button
          onClick={() => {
            if (step === 1 && canProceedStep1) setStep(2);
            else if (step === 2 && canProceedStep2) {
              if (startDate) setCalendarDate(new Date(startDate));
              setStep(3);
            }
            else if (step === 3) handleComplete();
          }}
          disabled={
            (step === 1 && !canProceedStep1) ||
            (step === 2 && !canProceedStep2)
          }
          className="text-[14px] text-[#6C5CE7] font-semibold bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {step === 3 ? "완료" : "다음"}
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all ${
              s <= step ? "bg-[#1a1a2e]" : "bg-[#f0f0f4]"
            }`}
          />
        ))}
      </div>

      {/* STEP 1: Settings */}
      {step === 1 && (
        <div className="space-y-0">
          {/* Title */}
          <div className="pb-5 mb-5 border-b border-gray-100">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="루틴 제목을 입력하세요"
              className="w-full text-[16px] font-semibold text-[#212422] bg-transparent border-none outline-none placeholder:text-gray-300 py-2"
            />
          </div>

          {/* Category */}
          <div className="pb-5 mb-5 border-b border-gray-100">
            <p className="text-[14px] font-semibold text-[#212422] mb-1">루틴 유형</p>
            <p className="text-[12px] text-[#212422] mb-3">루틴 타입</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-[13px] tracking-tight transition-all cursor-pointer border ${
                    category === cat
                      ? "bg-[#212422] text-[#B1F1B8] border-[#212422] font-semibold"
                      : "bg-white text-[#757976] border-[#757976] hover:border-[#212422]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="pb-5 mb-5 border-b border-gray-100">
            <p className="text-[14px] font-semibold text-[#212422] mb-1">기한 설정</p>
            <p className="text-[12px] text-[#212422] mb-3">기한</p>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDurationType(opt.value)}
                  className={`px-4 py-2 rounded-full text-[13px] tracking-tight transition-all cursor-pointer border ${
                    durationType === opt.value
                      ? "bg-[#212422] text-[#B1F1B8] border-[#212422] font-semibold"
                      : "bg-white text-[#757976] border-[#757976] hover:border-[#212422]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="pb-5 mb-5 border-b border-gray-100">
            <p className="text-[14px] font-semibold text-[#212422] mb-1">
              헤더 컬러 설정
            </p>
            <p className="text-[12px] text-[#212422] mb-3">컬러</p>
            <div className="flex gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setHeaderColor(color)}
                  className="relative w-8 h-8 rounded-full cursor-pointer border-none p-0 transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                >
                  {headerColor === color && (
                    <Check
                      className="absolute inset-0 m-auto w-4 h-4"
                      style={{
                        color: color === "#212422" || color === "#922A2A" ? "white" : "#212422",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* D-DAY Toggle */}
          <div className="pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-[#212422]">
                  D-DAY 표시 여부
                </p>
                <p className="text-[12px] text-[#212422] mt-1">
                  헤더에 D-DAY 표시하기
                </p>
              </div>
              <button
                onClick={() => setShowDDay(!showDDay)}
                className={`relative w-14 h-[30px] rounded-full transition-colors cursor-pointer border-none ${
                  showDDay ? "bg-[#65D9AC]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[26px] h-[26px] rounded-full bg-white transition-transform shadow ${
                    showDDay ? "translate-x-[30px]" : "translate-x-[2px]"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Schedule */}
      {step === 2 && (
        <div>
          {/* Tab: Start / End */}
          <div className="flex mb-6">
            <button
              onClick={() => setActiveTab("start")}
              className={`flex-1 pb-2 text-[14px] font-semibold text-center cursor-pointer bg-transparent border-b-2 transition-colors ${
                activeTab === "start"
                  ? "border-[#212422] text-[#212422]"
                  : "border-gray-200 text-gray-400"
              }`}
            >
              시작일
            </button>
            <button
              onClick={() => setActiveTab("end")}
              className={`flex-1 pb-2 text-[14px] text-center cursor-pointer bg-transparent border-b-2 transition-colors ${
                activeTab === "end"
                  ? "border-[#212422] text-[#212422] font-semibold"
                  : "border-gray-200 text-gray-400"
              }`}
            >
              종료일
            </button>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-2xl p-4 mb-6">
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-1 text-[#212422] hover:bg-gray-100 rounded-lg cursor-pointer bg-transparent border-none"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <p className="text-[14px] font-bold text-[#212422]">
                {calendarYear}년 {calendarMonth + 1}월
              </p>
              <button
                onClick={nextMonth}
                className="p-1 text-[#212422] hover:bg-gray-100 rounded-lg cursor-pointer bg-transparent border-none"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-[11px] text-[#212422] text-center py-1 border-b border-gray-100"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                if (day === null)
                  return <div key={i} className="h-10" />;

                const isStart = isStartDateSelected(day);
                const isEnd = isEndDateSelected(day);
                const inRange = isInRange(day);

                return (
                  <button
                    key={i}
                    onClick={() => selectCalendarDay(day)}
                    className={`h-10 text-[11px] rounded-full transition-all cursor-pointer border-none mx-0.5 ${
                      isStart || isEnd
                        ? "bg-[#65D9AC] text-white font-bold"
                        : inRange
                        ? "bg-[#65D9AC]/20 text-[#212422]"
                        : "bg-transparent text-[#212422] hover:bg-gray-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Info */}
          <div className="text-[14px] text-[#212422] leading-relaxed">
            {startDate && (
              <>
                <p>
                  선택하신 시작일은{" "}
                  <span className="font-bold text-[#65D9AC] text-[16px]">
                    {formatDate(startDate)}
                  </span>{" "}
                  입니다.
                </p>
                {endDate && (
                  <p>
                    종료일은{" "}
                    <span className="font-bold text-[#65D9AC] text-[16px]">
                      {formatDate(endDate)}
                    </span>
                    입니다.
                  </p>
                )}
              </>
            )}
            {!startDate && (
              <p className="text-gray-400 text-center">
                캘린더에서 시작일을 선택해주세요
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Write Todos */}
      {step === 3 && startDate && (
        <div>
          {/* Month calendar for writing */}
          <div className="bg-white rounded-2xl p-4 mb-4">
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-1 text-[#212422] hover:bg-gray-100 rounded-lg cursor-pointer bg-transparent border-none"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <p className="text-[14px] font-bold text-[#212422]">
                {calendarYear}년 {calendarMonth + 1}월
              </p>
              <button
                onClick={nextMonth}
                className="p-1 text-[#212422] hover:bg-gray-100 rounded-lg cursor-pointer bg-transparent border-none"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-[11px] text-[#212422] text-center py-1 border-b border-gray-100"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {step3CalendarDays.map((day, i) => {
                if (day === null) return <div key={i} className="h-10" />;

                const dayNum = getDayNumber(day);
                const inRange = isDateInRange(day);
                const isSelected = dayNum === selectedDay;
                const itemCount = dayNum ? todoItems[dayNum]?.length || 0 : 0;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (dayNum) setSelectedDay(dayNum);
                    }}
                    disabled={!inRange}
                    className={`relative h-10 text-[11px] rounded-full transition-all cursor-pointer border-none mx-0.5 ${
                      isSelected
                        ? "text-white font-bold"
                        : inRange
                        ? "bg-transparent text-[#212422] hover:bg-gray-100"
                        : "bg-transparent text-gray-300 cursor-not-allowed"
                    }`}
                    style={isSelected ? { backgroundColor: headerColor } : {}}
                  >
                    {day}
                    {itemCount > 0 && !isSelected && (
                      <span
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ backgroundColor: headerColor }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Todo items for selected day */}
          <div className="bg-white rounded-2xl overflow-hidden">
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: headerColor + "15" }}
            >
              <p className="text-[14px] font-semibold text-[#212422]">
                Day {selectedDay}
              </p>
              <p className="text-[12px] text-gray-400">
                {todoItems[selectedDay]?.length || 0}개의 할 일
              </p>
            </div>

            {/* Existing items */}
            <div className="divide-y divide-gray-100">
              {(todoItems[selectedDay] || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-3 group"
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 shrink-0"
                    style={{ borderColor: headerColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[#212422] truncate">
                      {item.text}
                    </p>
                    {item.time && (
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeTodoForDay(selectedDay, idx)}
                    className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer bg-transparent border-none rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new item */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTodoForDay()}
                    placeholder="할 일을 입력하세요"
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
                  onClick={addTodoForDay}
                  disabled={!newItemText.trim()}
                  className="px-4 py-2.5 rounded-xl cursor-pointer transition-colors text-[14px] border-none disabled:opacity-40 disabled:cursor-not-allowed text-white"
                  style={{ backgroundColor: headerColor === "#FFD24F" || headerColor === "#B1F1B8" || headerColor === "#C3DF13" ? "#212422" : headerColor }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Time picker */}
              {showTimePicker && (
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="time"
                    value={newItemTime}
                    onChange={(e) => setNewItemTime(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-gray-300"
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

            {/* Quick add placeholder */}
            <div className="px-4 pb-4">
              <div
                className="w-6 h-6 rounded-full border-2 border-dashed opacity-30"
                style={{ borderColor: headerColor }}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-[12px] text-gray-500">
              총 <span className="font-bold text-[#212422]">{totalItemsCount}</span>개의 할 일이 작성되었습니다
            </p>
          </div>
        </div>
      )}

      {/* Bottom Action (fixed) */}
      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-[#212422]">{title}</p>
              <p className="text-[11px] text-gray-400">
                {category} | {DURATION_OPTIONS.find((d) => d.value === durationType)?.label} | {totalItemsCount}개 할 일
              </p>
            </div>
            <button
              onClick={handleComplete}
              className="px-6 py-2.5 rounded-xl font-bold cursor-pointer transition-colors text-[14px] border-none"
              style={{
                backgroundColor: "#212422",
                color: headerColor,
              }}
            >
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}