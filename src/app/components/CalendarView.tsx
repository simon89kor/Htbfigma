import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Circle,
  CalendarDays,
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

function getContrastText(color: string): string {
  const dark = ["#212422", "#922A2A", "#49AA85", "#9396E2", "#E36185"];
  return dark.includes(color) ? "white" : "#212422";
}

export function CalendarView({ purchasedLists, customLists }: CalendarViewProps) {
  const {
    toggleTodoItem,
    toggleCustomTodoItem,
  } = useStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Build a map of actual dates → todo items across all lists
  const todosByDate = useMemo(() => {
    const map = new Map<string, DayTodo[]>();

    const addItemsToMap = (
      listId: string,
      listTitle: string,
      headerColor: string,
      startDate: string,
      items: TodoItem[],
      isCustom: boolean
    ) => {
      const start = parseISO(startDate);
      items.forEach((item) => {
        const actualDate = addDays(start, item.day - 1);
        const key = format(actualDate, "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({
          listId,
          listTitle,
          headerColor,
          isCustom,
          item,
        });
      });
    };

    purchasedLists.forEach((pl) => {
      addItemsToMap(
        pl.id,
        pl.product.name,
        pl.product.color,
        pl.startDate || pl.purchasedAt,
        pl.items,
        false
      );
    });

    customLists.forEach((cl) => {
      addItemsToMap(
        cl.id,
        cl.title,
        cl.headerColor,
        cl.startDate,
        cl.items,
        true
      );
    });

    return map;
  }, [purchasedLists, customLists]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Selected date's todos
  const selectedTodos = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return todosByDate.get(key) || [];
  }, [selectedDate, todosByDate]);

  // Group selected todos by list
  const groupedTodos = useMemo(() => {
    const groups: Record<string, { title: string; color: string; isCustom: boolean; items: DayTodo[] }> = {};
    selectedTodos.forEach((t) => {
      if (!groups[t.listId]) {
        groups[t.listId] = {
          title: t.listTitle,
          color: t.headerColor,
          isCustom: t.isCustom,
          items: [],
        };
      }
      groups[t.listId].items.push(t);
    });
    return Object.entries(groups);
  }, [selectedTodos]);

  const handleToggle = (todo: DayTodo) => {
    if (todo.isCustom) {
      toggleCustomTodoItem(todo.listId, todo.item.id);
    } else {
      toggleTodoItem(todo.listId, todo.item.id);
    }
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden" style={{boxShadow: 'var(--shadow-card)'}}>
        {/* Month Nav */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-black/[0.03] rounded-xl transition-colors cursor-pointer bg-transparent border-none text-[#6b6b80]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-[17px] font-semibold text-[#1a1a2e]">
            {format(currentMonth, "yyyy년 M월", { locale: ko })}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-black/[0.03] rounded-xl transition-colors cursor-pointer bg-transparent border-none text-[#6b6b80]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 px-3">
          {weekDays.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[12px] font-medium py-2 ${
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-[#6b6b80]"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 px-3 pb-4">
          {calendarDays.map((day, idx) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTodos = todosByDate.get(key) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);
            const hasTodos = dayTodos.length > 0;
            const completedCount = dayTodos.filter((t) => t.item.completed).length;
            const allCompleted = hasTodos && completedCount === dayTodos.length;
            const dayOfWeek = day.getDay();
            const colors = [...new Set(dayTodos.map((t) => t.headerColor))].slice(0, 3);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`relative flex flex-col items-center justify-start py-1.5 min-h-[52px] rounded-xl transition-all cursor-pointer border-none ${
                  isSelected
                    ? "bg-[#1a1a2e] text-white"
                    : today
                    ? "bg-[#f4f3ff]"
                    : "bg-transparent hover:bg-black/[0.02]"
                } ${!isCurrentMonth ? "opacity-30" : ""}`}
              >
                <span
                  className={`text-[13px] font-medium leading-none ${
                    isSelected
                      ? "text-white"
                      : today
                      ? "text-[#6C5CE7] font-bold"
                      : dayOfWeek === 0
                      ? "text-red-400"
                      : dayOfWeek === 6
                      ? "text-blue-400"
                      : "text-[#1a1a2e]"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {hasTodos && (
                  <div className="flex items-center gap-[2px] mt-1">
                    {colors.map((color, ci) => (
                      <div
                        key={ci}
                        className={`w-[5px] h-[5px] rounded-full ${
                          allCompleted ? "opacity-40" : ""
                        }`}
                        style={{ backgroundColor: isSelected ? "white" : color }}
                      />
                    ))}
                  </div>
                )}

                {hasTodos && allCompleted && !isSelected && (
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#65D9AC] rounded-full flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden" style={{boxShadow: 'var(--shadow-card)'}}>
          <div className="px-5 py-4 border-b border-black/[0.04]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4.5 h-4.5 text-[#6C5CE7]" />
                <h3 className="text-[15px] font-semibold text-[#1a1a2e]">
                  {format(selectedDate, "M월 d일 (EEEE)", { locale: ko })}
                </h3>
              </div>
              {selectedTodos.length > 0 && (
                <span className="text-[12px] text-gray-400">
                  {selectedTodos.filter((t) => t.item.completed).length}/{selectedTodos.length} 완료
                </span>
              )}
            </div>
            {selectedTodos.length > 0 && (
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-[#6C5CE7] rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (selectedTodos.filter((t) => t.item.completed).length /
                        selectedTodos.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {groupedTodos.length === 0 ? (
              <div className="py-10 text-center">
                <Circle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-[13px] text-gray-400">
                  이 날의 할 일이 없습니다
                </p>
              </div>
            ) : (
              groupedTodos.map(([listId, group]) => (
                <div key={listId} className="border-b border-gray-50 last:border-b-0">
                  {/* List header */}
                  <div
                    className="px-4 py-2.5 flex items-center gap-2"
                    style={{ backgroundColor: group.color + "12" }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-[13px] font-semibold text-[#212422] truncate">
                      {group.title}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-auto shrink-0">
                      {group.items.filter((i) => i.item.completed).length}/{group.items.length}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="px-4">
                    {group.items.map((todo) => (
                      <div
                        key={todo.item.id}
                        className={`flex items-center gap-3 py-2.5 ${
                          todo.item.completed ? "opacity-50" : ""
                        }`}
                      >
                        <button
                          onClick={() => handleToggle(todo)}
                          className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                            todo.item.completed
                              ? "border-green-500 bg-green-500"
                              : "bg-transparent"
                          }`}
                          style={
                            !todo.item.completed
                              ? { borderColor: group.color }
                              : {}
                          }
                        >
                          {todo.item.completed && (
                            <Check className="w-2.5 h-2.5 text-white" />
                          )}
                        </button>
                        <span
                          className={`text-[13px] flex-1 ${
                            todo.item.completed
                              ? "line-through text-gray-400"
                              : "text-[#212422]"
                          }`}
                        >
                          {todo.item.text}
                        </span>
                        {todo.item.time && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-0.5 shrink-0">
                            <Clock className="w-3 h-3" />
                            {todo.item.time}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}