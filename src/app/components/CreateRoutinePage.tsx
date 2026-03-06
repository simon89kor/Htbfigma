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
import { Button, Input, Switch, Chip, Card, CardBody, Progress } from "@heroui/react";
import { useStore, type CustomList } from "../store-context";
import { useAuth } from "../auth-context";
import { toast } from "sonner";

const COLORS = ["#FFD24F", "#B1F1B8", "#49AA85", "#212422", "#E36185", "#922A2A", "#9396E2", "#C3DF13"];
const CATEGORIES = ["식단관리", "자기계발", "운동", "자격증", "학업", "라이프스타일", "건강", "비즈니스", "생산성", "여행"];
const DURATION_OPTIONS: { label: string; value: CustomList["durationType"]; days: number }[] = [
  { label: "1주일", value: "1week", days: 7 },
  { label: "4주일", value: "4weeks", days: 28 },
  { label: "100일", value: "100days", days: 100 },
  { label: "무기한", value: "unlimited", days: 365 },
];

interface NewTodoItem { text: string; time?: string; repeatDays?: number[]; }

export function CreateRoutinePage() {
  const navigate = useNavigate();
  const { createCustomList, addCustomTodoItem } = useStore();
  const { isLoggedIn } = useAuth();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [durationType, setDurationType] = useState<CustomList["durationType"]>("4weeks");
  const [headerColor, setHeaderColor] = useState(COLORS[3]);
  const [showDDay, setShowDDay] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"start" | "end">("start");
  const [selectedDay, setSelectedDay] = useState(1);
  const [todoItems, setTodoItems] = useState<Record<number, NewTodoItem[]>>({});
  const [newItemText, setNewItemText] = useState("");
  const [newItemTime, setNewItemTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const durationDays = DURATION_OPTIONS.find((d) => d.value === durationType)?.days || 28;
  const endDate = useMemo(() => { if (!startDate) return null; const end = new Date(startDate); end.setDate(end.getDate() + durationDays - 1); return end; }, [startDate, durationDays]);
  const formatDate = (date: Date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

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

  const prevMonth = () => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));

  const isStartDateSelected = (day: number) => startDate && startDate.getFullYear() === calendarYear && startDate.getMonth() === calendarMonth && startDate.getDate() === day;
  const isEndDateSelected = (day: number) => endDate && endDate.getFullYear() === calendarYear && endDate.getMonth() === calendarMonth && endDate.getDate() === day;
  const isInRange = (day: number) => { if (!startDate || !endDate) return false; const d = new Date(calendarYear, calendarMonth, day); return d > startDate && d < endDate; };
  const selectCalendarDay = (day: number) => { setStartDate(new Date(calendarYear, calendarMonth, day)); setActiveTab("end"); };

  const step3CalendarDays = useMemo(() => {
    if (!startDate) return [];
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
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

  const isDateInRange = (calDay: number): boolean => getDayNumber(calDay) !== null;
  const hasItems = (calDay: number): boolean => { const dayNum = getDayNumber(calDay); if (!dayNum) return false; return (todoItems[dayNum]?.length || 0) > 0; };

  const addTodoForDay = () => {
    if (!newItemText.trim()) return;
    const item: NewTodoItem = { text: newItemText.trim(), ...(newItemTime && { time: newItemTime }) };
    setTodoItems((prev) => ({ ...prev, [selectedDay]: [...(prev[selectedDay] || []), item] }));
    setNewItemText(""); setNewItemTime(""); setShowTimePicker(false);
  };

  const removeTodoForDay = (dayNum: number, index: number) => {
    setTodoItems((prev) => ({ ...prev, [dayNum]: prev[dayNum]?.filter((_, i) => i !== index) || [] }));
  };

  const canProceedStep1 = title.trim() && category;
  const canProceedStep2 = startDate !== null;
  const totalItemsCount = Object.values(todoItems).reduce((sum, items) => sum + items.length, 0);

  const handleComplete = () => {
    if (!startDate || !endDate) return;
    const listId = createCustomList({ title: title.trim(), category, headerColor, durationType, durationDays, startDate: startDate.toISOString(), endDate: endDate.toISOString(), showDDay });
    Object.entries(todoItems).forEach(([day, items]) => { items.forEach((item) => { addCustomTodoItem(listId, item.text, parseInt(day), item.time); }); });
    toast.success("나만의 루틴이 생성되었습니다!");
    navigate("/my-lists");
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-default-500 mb-4">로그인이 필요합니다</p>
        <Button color="primary" onPress={() => navigate("/login?redirect=/create-routine")} className="font-medium">로그인하기</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <Button isIconOnly variant="light" size="sm" onPress={() => { if (step > 1) setStep(step - 1); else navigate(-1); }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-[17px] text-default-900 font-bold">
          {step === 1 ? "루틴 추가하기" : step === 2 ? "일정 선택" : "작성하기"}
        </h1>
        <Button
          variant="light"
          color="secondary"
          size="sm"
          className="font-semibold"
          isDisabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
          onPress={() => {
            if (step === 1 && canProceedStep1) setStep(2);
            else if (step === 2 && canProceedStep2) { if (startDate) setCalendarDate(new Date(startDate)); setStep(3); }
            else if (step === 3) handleComplete();
          }}
        >
          {step === 3 ? "완료" : "다음"}
        </Button>
      </div>

      <Progress value={(step / 3) * 100} size="sm" color="primary" className="mb-6" />

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-0">
          <div className="pb-5 mb-5 border-b border-default-100">
            <Input
              value={title}
              onValueChange={setTitle}
              placeholder="루틴 제목을 입력하세요"
              variant="underlined"
              size="lg"
              classNames={{ input: "text-base font-semibold" }}
            />
          </div>

          <div className="pb-5 mb-5 border-b border-default-100">
            <p className="text-sm font-semibold text-default-900 mb-1">루틴 유형</p>
            <p className="text-xs text-default-500 mb-3">루틴 타입</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  variant={category === cat ? "solid" : "bordered"}
                  color={category === cat ? "primary" : "default"}
                  className="cursor-pointer"
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Chip>
              ))}
            </div>
          </div>

          <div className="pb-5 mb-5 border-b border-default-100">
            <p className="text-sm font-semibold text-default-900 mb-1">기한 설정</p>
            <p className="text-xs text-default-500 mb-3">기한</p>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  variant={durationType === opt.value ? "solid" : "bordered"}
                  color={durationType === opt.value ? "primary" : "default"}
                  className="cursor-pointer"
                  onClick={() => setDurationType(opt.value)}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="pb-5 mb-5 border-b border-default-100">
            <p className="text-sm font-semibold text-default-900 mb-1">헤더 컬러 설정</p>
            <p className="text-xs text-default-500 mb-3">컬러</p>
            <div className="flex gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setHeaderColor(color)}
                  className="relative w-8 h-8 rounded-full cursor-pointer border-none p-0 transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                >
                  {headerColor === color && (
                    <Check className="absolute inset-0 m-auto w-4 h-4" style={{ color: color === "#212422" || color === "#922A2A" ? "white" : "#212422" }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-default-900">D-DAY 표시 여부</p>
              <p className="text-xs text-default-500 mt-1">헤더에 D-DAY 표시하기</p>
            </div>
            <Switch isSelected={showDDay} onValueChange={setShowDDay} color="success" />
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          <div className="flex mb-6">
            <button onClick={() => setActiveTab("start")} className={`flex-1 pb-2 text-sm font-semibold text-center cursor-pointer bg-transparent border-b-2 transition-colors ${activeTab === "start" ? "border-primary text-primary" : "border-default-200 text-default-400"}`}>시작일</button>
            <button onClick={() => setActiveTab("end")} className={`flex-1 pb-2 text-sm text-center cursor-pointer bg-transparent border-b-2 transition-colors ${activeTab === "end" ? "border-primary text-primary font-semibold" : "border-default-200 text-default-400"}`}>종료일</button>
          </div>

          <Card shadow="sm" className="mb-6">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Button isIconOnly variant="light" size="sm" onPress={prevMonth}><ChevronLeft className="w-5 h-5" /></Button>
                <p className="text-sm font-bold text-default-900">{calendarYear}년 {calendarMonth + 1}월</p>
                <Button isIconOnly variant="light" size="sm" onPress={nextMonth}><ChevronRight className="w-5 h-5" /></Button>
              </div>
              <div className="grid grid-cols-7 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-[11px] text-default-500 text-center py-1 border-b border-default-100">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  if (day === null) return <div key={i} className="h-10" />;
                  const isStart = isStartDateSelected(day);
                  const isEnd = isEndDateSelected(day);
                  const inRange = isInRange(day);
                  return (
                    <button key={i} onClick={() => selectCalendarDay(day)} className={`h-10 text-[11px] rounded-full transition-all cursor-pointer border-none mx-0.5 ${isStart || isEnd ? "bg-success text-white font-bold" : inRange ? "bg-success/20 text-default-900" : "bg-transparent text-default-900 hover:bg-default-100"}`}>{day}</button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <div className="text-sm text-default-700 leading-relaxed">
            {startDate && (<><p>선택하신 시작일은 <span className="font-bold text-success text-base">{formatDate(startDate)}</span> 입니다.</p>{endDate && (<p>종료일은 <span className="font-bold text-success text-base">{formatDate(endDate)}</span>입니다.</p>)}</>)}
            {!startDate && <p className="text-default-400 text-center">캘린더에서 시작일을 선택해주세요</p>}
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && startDate && (
        <div>
          <Card shadow="sm" className="mb-4">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Button isIconOnly variant="light" size="sm" onPress={prevMonth}><ChevronLeft className="w-5 h-5" /></Button>
                <p className="text-sm font-bold text-default-900">{calendarYear}년 {calendarMonth + 1}월</p>
                <Button isIconOnly variant="light" size="sm" onPress={nextMonth}><ChevronRight className="w-5 h-5" /></Button>
              </div>
              <div className="grid grid-cols-7 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-[11px] text-default-500 text-center py-1 border-b border-default-100">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {step3CalendarDays.map((day, i) => {
                  if (day === null) return <div key={i} className="h-10" />;
                  const dayNum = getDayNumber(day);
                  const inRange = isDateInRange(day);
                  const isSelected = dayNum === selectedDay;
                  const itemCount = dayNum ? todoItems[dayNum]?.length || 0 : 0;
                  return (
                    <button key={i} onClick={() => { if (dayNum) setSelectedDay(dayNum); }} disabled={!inRange}
                      className={`relative h-10 text-[11px] rounded-full transition-all cursor-pointer border-none mx-0.5 ${isSelected ? "text-white font-bold" : inRange ? "bg-transparent text-default-900 hover:bg-default-100" : "bg-transparent text-default-300 cursor-not-allowed"}`}
                      style={isSelected ? { backgroundColor: headerColor } : {}}>
                      {day}
                      {itemCount > 0 && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: headerColor }} />}
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card shadow="sm" className="overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: headerColor + "15" }}>
              <p className="text-sm font-semibold text-default-900">Day {selectedDay}</p>
              <p className="text-xs text-default-400">{todoItems[selectedDay]?.length || 0}개의 할 일</p>
            </div>
            <CardBody className="p-0">
              <div className="divide-y divide-default-100">
                {(todoItems[selectedDay] || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3 group">
                    <div className="w-5 h-5 rounded-full border-2 shrink-0" style={{ borderColor: headerColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-default-900 truncate">{item.text}</p>
                      {item.time && <p className="text-[11px] text-default-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{item.time}</p>}
                    </div>
                    <Button isIconOnly size="sm" variant="light" color="danger" className="opacity-0 group-hover:opacity-100 transition-all" onPress={() => removeTodoForDay(selectedDay, idx)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-default-100">
                <div className="flex gap-2 items-center">
                  <Input
                    value={newItemText}
                    onValueChange={setNewItemText}
                    onKeyDown={(e) => e.key === "Enter" && addTodoForDay()}
                    placeholder="할 일을 입력하세요"
                    variant="bordered"
                    size="sm"
                    radius="lg"
                    className="flex-1"
                  />
                  <Button isIconOnly variant={showTimePicker || newItemTime ? "solid" : "bordered"} color={showTimePicker || newItemTime ? "primary" : "default"} size="sm" onPress={() => setShowTimePicker(!showTimePicker)}>
                    <Clock className="w-4 h-4" />
                  </Button>
                  <Button isIconOnly color="primary" size="sm" isDisabled={!newItemText.trim()} onPress={addTodoForDay} style={{ backgroundColor: headerColor === "#FFD24F" || headerColor === "#B1F1B8" || headerColor === "#C3DF13" ? "#212422" : headerColor }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {showTimePicker && (
                  <div className="flex items-center gap-2 mt-3">
                    <input type="time" value={newItemTime} onChange={(e) => setNewItemTime(e.target.value)} className="px-3 py-2 bg-default-100 border border-default-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    {newItemTime && <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => { setNewItemTime(""); setShowTimePicker(false); }}><X className="w-4 h-4" /></Button>}
                  </div>
                )}
              </div>
              <div className="px-4 pb-4">
                <div className="w-6 h-6 rounded-full border-2 border-dashed opacity-30" style={{ borderColor: headerColor }} />
              </div>
            </CardBody>
          </Card>

          <Card shadow="none" className="mt-4 bg-default-100">
            <CardBody className="text-center p-4">
              <p className="text-xs text-default-500">총 <span className="font-bold text-default-900">{totalItemsCount}</span>개의 할 일이 작성되었습니다</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Bottom Action */}
      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-white/10 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-default-900">{title}</p>
              <p className="text-[11px] text-default-400">{category} | {DURATION_OPTIONS.find((d) => d.value === durationType)?.label} | {totalItemsCount}개 할 일</p>
            </div>
            <Button color="primary" size="sm" className="font-bold" style={{ backgroundColor: "#212422", color: headerColor }} onPress={handleComplete}>완료</Button>
          </div>
        </div>
      )}
    </div>
  );
}
