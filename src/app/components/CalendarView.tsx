import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Circle,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { ko } from "date-fns/locale";
import { Button, Card, CardBody, Progress } from "@heroui/react";
import type { PurchasedList, CustomList, TodoItem } from "../store-context";
import { useStore } from "../store-context";

interface CalendarViewProps {
  purchasedLists: PurchasedList[];
  customLists: CustomList[];
}

interface DayTodo {
  listId: string;
  listTitle: string;
  headerColor: string;
  isCustom: boolean;
  item: TodoItem;
}

export function CalendarView({ purchasedLists, customLists }: CalendarViewProps) {
  const navigate = useNavigate();
  const { toggleTodoItem, toggleCustomTodoItem } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const todosByDate = useMemo(() => {
    const map = new Map<string, DayTodo[]>();
    const addItemsToMap = (listId: string, listTitle: string, headerColor: string, startDate: string, items: TodoItem[], isCustom: boolean) => {
      const start = parseISO(startDate);
      items.forEach((item) => {
        const actualDate = addDays(start, item.day - 1);
        const key = format(actualDate, "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ listId, listTitle, headerColor, isCustom, item });
      });
    };
    purchasedLists.forEach((pl) => addItemsToMap(pl.id, pl.product.name, pl.product.color, pl.startDate || pl.purchasedAt, pl.items, false));
    customLists.forEach((cl) => addItemsToMap(cl.id, cl.title, cl.headerColor, cl.startDate, cl.items, true));
    return map;
  }, [purchasedLists, customLists]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) { days.push(day); day = addDays(day, 1); }
    return days;
  }, [currentMonth]);

  const selectedTodos = useMemo(() => {
    if (!selectedDate) return [];
    return todosByDate.get(format(selectedDate, "yyyy-MM-dd")) || [];
  }, [selectedDate, todosByDate]);

  const groupedTodos = useMemo(() => {
    const groups: Record<string, { title: string; color: string; isCustom: boolean; items: DayTodo[] }> = {};
    selectedTodos.forEach((t) => {
      if (!groups[t.listId]) groups[t.listId] = { title: t.listTitle, color: t.headerColor, isCustom: t.isCustom, items: [] };
      groups[t.listId].items.push(t);
    });
    return Object.entries(groups);
  }, [selectedTodos]);

  const handleToggle = (todo: DayTodo) => {
    if (todo.isCustom) toggleCustomTodoItem(todo.listId, todo.item.id);
    else toggleTodoItem(todo.listId, todo.item.id);
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="space-y-4">
      {/* 통계 보기 링크 */}
      <div className="flex items-center justify-end px-1">
        <button
          onClick={() => navigate("/stats")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#65D9AC]/10 text-[#65D9AC] text-sm font-medium hover:bg-[#65D9AC]/20 transition-colors cursor-pointer border-none"
          aria-label="통계 보기"
        >
          <BarChart3 className="w-4 h-4" />
          통계 보기
        </button>
      </div>

      <Card shadow="sm">
        <CardBody className="p-0">
          <div className="flex items-center justify-between px-5 py-4">
            <Button isIconOnly variant="light" size="sm" onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-5 h-5" /></Button>
            <h3 className="text-[17px] font-semibold text-default-900">{format(currentMonth, "yyyy년 M월", { locale: ko })}</h3>
            <Button isIconOnly variant="light" size="sm" onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-5 h-5" /></Button>
          </div>

          <div className="grid grid-cols-7 px-3">
            {weekDays.map((d, i) => (
              <div key={d} className={`text-center text-xs font-medium py-2 ${i === 0 ? "text-danger" : i === 6 ? "text-primary" : "text-default-500"}`}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 px-3 pb-4">
            {calendarDays.map((day, idx) => {
              const key = format(day, "yyyy-MM-dd");
              const dayTodos = todosByDate.get(key) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const todayFlag = isToday(day);
              const hasTodos = dayTodos.length > 0;
              const completedCount = dayTodos.filter((t) => t.item.completed).length;
              const allCompleted = hasTodos && completedCount === dayTodos.length;
              const dayOfWeek = day.getDay();
              const colors = [...new Set(dayTodos.map((t) => t.headerColor))].slice(0, 3);
              // 선택된 날짜 배경 = 해당 날 첫 번째 카드 headerColor, 없으면 accent
              const selectedBgColor = colors[0] ?? '#13d680';

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`relative flex flex-col items-center justify-start py-1.5 min-h-[52px] rounded-xl transition-all cursor-pointer border-none ${
                    isSelected ? "" : todayFlag ? "bg-secondary-50" : "bg-transparent hover:bg-default-50"
                  } ${!isCurrentMonth ? "opacity-30" : ""}`}
                  style={isSelected ? { backgroundColor: selectedBgColor } : undefined}
                >
                  <span className={`text-[13px] font-medium leading-none ${
                    isSelected ? "text-white font-bold" : todayFlag ? "text-secondary font-bold" : dayOfWeek === 0 ? "text-danger" : dayOfWeek === 6 ? "text-primary" : "text-default-900"
                  }`}>{format(day, "d")}</span>
                  {hasTodos && (
                    <div className="flex items-center gap-[2px] mt-1">
                      {allCompleted ? (
                        <div
                          className="w-[6px] h-[6px] rounded-full"
                          style={{ backgroundColor: isSelected ? "white" : "#65D9AC" }}
                          aria-label="전체 달성"
                        />
                      ) : (
                        colors.map((color, ci) => (
                          <div key={ci} className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: isSelected ? "white" : color }} />
                        ))
                      )}
                    </div>
                  )}
                  {hasTodos && allCompleted && !isSelected && (
                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {selectedDate && (
        <Card shadow="sm">
          <CardBody className="p-0">
            <div className="px-5 py-4 border-b border-default-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-secondary" />
                  <h3 className="text-[15px] font-semibold text-default-900">{format(selectedDate, "M월 d일 (EEEE)", { locale: ko })}</h3>
                </div>
                {selectedTodos.length > 0 && (
                  <span className="text-xs text-default-400">{selectedTodos.filter((t) => t.item.completed).length}/{selectedTodos.length} 완료</span>
                )}
              </div>
              {selectedTodos.length > 0 && (
                <Progress
                  value={(selectedTodos.filter((t) => t.item.completed).length / selectedTodos.length) * 100}
                  size="sm"
                  color="secondary"
                  className="mt-2"
                />
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {groupedTodos.length === 0 ? (
                <div className="py-10 text-center">
                  <Circle className="w-8 h-8 text-default-200 mx-auto mb-2" />
                  <p className="text-[13px] text-default-400">이 날의 할 일이 없습니다</p>
                </div>
              ) : (
                groupedTodos.map(([listId, group]) => (
                  <div key={listId} className="border-b border-default-50 last:border-b-0">
                    <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: group.color + "12" }}>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                      <span className="text-[13px] font-semibold text-default-900 truncate">{group.title}</span>
                      <span className="text-[11px] text-default-400 ml-auto shrink-0">{group.items.filter((i) => i.item.completed).length}/{group.items.length}</span>
                    </div>
                    <div className="px-4">
                      {group.items.map((todo) => (
                        <div key={todo.item.id} className={`flex items-center gap-3 py-2.5 ${todo.item.completed ? "opacity-50" : ""}`}>
                          <button
                            onClick={() => handleToggle(todo)}
                            className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                              todo.item.completed ? "border-success bg-success" : "bg-transparent"
                            }`}
                            style={!todo.item.completed ? { borderColor: group.color } : {}}
                          >
                            {todo.item.completed && <Check className="w-2.5 h-2.5 text-white" />}
                          </button>
                          <span className={`text-[13px] flex-1 ${todo.item.completed ? "line-through text-default-400" : "text-default-900"}`}>{todo.item.text}</span>
                          {todo.item.time && <span className="text-[11px] text-default-400 flex items-center gap-0.5 shrink-0"><Clock className="w-3 h-3" />{todo.item.time}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
