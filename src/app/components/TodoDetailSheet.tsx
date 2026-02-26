import { useState, useEffect } from "react";
import { Clock, Repeat, FileText, Bell, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "./ui/drawer";
import { toast } from "sonner";
import type { TodoItem } from "../store-context";

// ============================================================================
// Types
// ============================================================================

interface TodoDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TodoItem | null;
  onSave: (
    itemId: string,
    updates: {
      time?: string;
      repeatDays?: number[];
      memo?: string;
      notification?: "none" | "ontime" | "10min";
    }
  ) => void;
}

// ============================================================================
// Constants
// ============================================================================

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
const WEEKDAY_INDICES = [1, 2, 3, 4, 5, 6, 0]; // 월~일 → dayIndex

const NOTIFICATION_OPTIONS = [
  { value: "none" as const, label: "없음" },
  { value: "ontime" as const, label: "시작 시" },
  { value: "10min" as const, label: "10분 전" },
] as const;

// ============================================================================
// Component
// ============================================================================

const TodoDetailSheet = ({
  open,
  onOpenChange,
  item,
  onSave,
}: TodoDetailSheetProps) => {
  const [time, setTime] = useState("");
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [memo, setMemo] = useState("");
  const [notification, setNotification] = useState<"none" | "ontime" | "10min">(
    "none"
  );

  // item 변경 시 폼 초기화
  useEffect(() => {
    if (item) {
      setTime(item.time || "");
      setRepeatDays(item.repeatDays || []);
      setMemo((item as TodoItem & { memo?: string }).memo || "");
      setNotification(
        ((item as TodoItem & { notification?: string }).notification as
          | "none"
          | "ontime"
          | "10min") || "none"
      );
    }
  }, [item]);

  const handleToggleDay = (dayIndex: number) => {
    setRepeatDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleSave = () => {
    if (!item) return;

    onSave(item.id, {
      time: time || undefined,
      repeatDays: repeatDays.length > 0 ? repeatDays : undefined,
      memo: memo || undefined,
      notification,
    });

    toast.success("설정이 저장되었습니다");
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold text-default-900">
              {item.text}
            </DrawerTitle>
            <DrawerClose asChild>
              <button
                className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </DrawerClose>
          </div>
          <DrawerDescription className="sr-only">
            투두 상세 설정
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-5 space-y-5 overflow-y-auto flex-1 pb-2">
          {/* 시간 설정 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="w-4 h-4 text-[#6C5CE7]" />
              시간 설정
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#65D9AC]/30 focus:border-[#65D9AC] transition-all"
              aria-label="시간 선택"
            />
          </div>

          {/* 반복 설정 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Repeat className="w-4 h-4 text-[#65D9AC]" />
              반복 설정
            </label>
            <div className="flex gap-2">
              {WEEKDAYS.map((day, idx) => {
                const dayIndex = WEEKDAY_INDICES[idx];
                const isActive = repeatDays.includes(dayIndex);
                return (
                  <button
                    key={day}
                    onClick={() => handleToggleDay(dayIndex)}
                    className={`w-10 h-10 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#65D9AC] text-white border-transparent"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                    aria-label={`${day}요일 ${isActive ? "해제" : "선택"}`}
                    aria-pressed={isActive}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4 text-[#F59E0B]" />
              메모
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모를 입력하세요..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#65D9AC]/30 focus:border-[#65D9AC] transition-all placeholder:text-gray-400"
              aria-label="메모 입력"
            />
          </div>

          {/* 알림 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Bell className="w-4 h-4 text-[#E36185]" />
              알림
            </label>
            <div className="flex gap-3">
              {NOTIFICATION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="notification"
                    value={option.value}
                    checked={notification === option.value}
                    onChange={() => setNotification(option.value)}
                    className="w-4 h-4 accent-[#65D9AC]"
                  />
                  <span
                    className={`text-sm ${
                      notification === option.value
                        ? "text-gray-900 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DrawerFooter className="px-5 pb-6">
          <button
            onClick={handleSave}
            className="w-full h-[52px] bg-[#65D9AC] text-white rounded-xl text-lg font-semibold transition-all hover:bg-[#55C99C] active:scale-[0.98] cursor-pointer border-none"
            aria-label="저장하기"
          >
            저장하기
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default TodoDetailSheet;
