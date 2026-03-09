import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShoppingBag,
} from "lucide-react";
import { Button, Card, CardBody, Chip, Progress, Switch } from "@heroui/react";
import { useStore } from "../store-context";
import { useAuth } from "../auth-context";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";

function formatDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function CheckoutStartDatePage() {
  const { cart, checkout } = useStore();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // 각 상품별 시작일 상태 (기본값: 오늘)
  const [startDates, setStartDates] = useState<Record<string, Date>>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map: Record<string, Date> = {};
    cart.forEach((item) => {
      map[item.product.id] = new Date(today);
    });
    return map;
  });

  // "모든 루틴 같은 날짜로 시작" 체크
  const [sameDate, setSameDate] = useState(true);

  // 현재 캘린더를 열고 있는 루틴 ID (null이면 닫힘)
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);

  // 캘린더 상태
  const [calendarDate, setCalendarDate] = useState(() => new Date());
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 리다이렉트: 카트가 비거나 로그인 안 되어있으면
  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart", { replace: true });
    } else if (!isLoggedIn) {
      navigate("/login?redirect=/cart", { replace: true });
    }
  }, [cart.length, isLoggedIn, navigate]);

  if (cart.length === 0 || !isLoggedIn) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSelectDate = (routineId: string, day: number) => {
    const selected = new Date(calendarYear, calendarMonth, day);
    selected.setHours(0, 0, 0, 0);

    // 과거 날짜 선택 불가
    if (selected < today) return;

    if (sameDate) {
      // 모든 루틴에 같은 날짜 적용
      setStartDates((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          next[id] = new Date(selected);
        });
        return next;
      });
    } else {
      setStartDates((prev) => ({ ...prev, [routineId]: selected }));
    }
  };

  const toggleCalendar = (routineId: string) => {
    if (activeRoutineId === routineId) {
      setActiveRoutineId(null);
    } else {
      setActiveRoutineId(routineId);
      // 캘린더를 해당 루틴의 시작일 월로 이동
      const d = startDates[routineId] || today;
      setCalendarDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const handleSameDateToggle = (checked: boolean) => {
    setSameDate(checked);
    if (checked) {
      // 첫 번째 루틴의 날짜를 전체에 적용
      const firstId = cart[0]?.product.id;
      const firstDate = startDates[firstId] || today;
      setStartDates((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          next[id] = new Date(firstDate);
        });
        return next;
      });
    }
  };

  const getEndDate = (startDate: Date, durationDays: number): Date => {
    const end = new Date(startDate);
    end.setDate(end.getDate() + durationDays - 1);
    return end;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // startDates를 로컬 날짜 YYYY-MM-DD 형식으로 변환 (타임존 이슈 방지)
      const dateMap: Record<string, string> = {};
      Object.entries(startDates).forEach(([id, date]) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        dateMap[id] = `${y}-${m}-${d}T00:00:00`;
      });
      await checkout(dateMap);
      toast.success("구매가 완료되었습니다!", { description: "내 리스트에서 바로 사용해보세요." });
      navigate("/my-lists");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "결제 처리 중 오류가 발생했습니다.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSelectedDay = (routineId: string, day: number) => {
    const d = startDates[routineId];
    return d && d.getFullYear() === calendarYear && d.getMonth() === calendarMonth && d.getDate() === day;
  };

  const isInRange = (routineId: string, day: number) => {
    const start = startDates[routineId];
    if (!start) return false;
    const item = cart.find((c) => c.product.id === routineId);
    if (!item) return false;
    const end = getEndDate(start, item.product.durationDays);
    const d = new Date(calendarYear, calendarMonth, day);
    return d > start && d <= end;
  };

  const isEndDay = (routineId: string, day: number) => {
    const start = startDates[routineId];
    if (!start) return false;
    const item = cart.find((c) => c.product.id === routineId);
    if (!item) return false;
    const end = getEndDate(start, item.product.durationDays);
    return end.getFullYear() === calendarYear && end.getMonth() === calendarMonth && end.getDate() === day;
  };

  const isPastDay = (day: number) => {
    const d = new Date(calendarYear, calendarMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  return (
    <div className="max-w-lg mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button isIconOnly variant="light" size="sm" onPress={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-[17px] text-default-900 font-bold">시작일 선택</h1>
        <div className="w-9" />
      </div>

      <Progress value={100} size="sm" color="primary" className="mb-6" />

      {/* Description */}
      <div className="mb-6">
        <p className="text-sm text-default-600">
          구매한 루틴의 시작일을 선택해주세요.
        </p>
        <p className="text-xs text-default-400 mt-1">
          시작일부터 Day 1이 시작됩니다.
        </p>
      </div>

      {/* Same date toggle */}
      {cart.length > 1 && (
        <Card shadow="sm" className="mb-5">
          <CardBody className="p-4 flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm text-default-700">모든 루틴 같은 날짜로 시작</span>
            </div>
            <Switch
              size="sm"
              isSelected={sameDate}
              onValueChange={handleSameDateToggle}
              color="success"
            />
          </CardBody>
        </Card>
      )}

      {/* Routine cards */}
      <div className="space-y-4">
        {cart.map((item) => {
          const routineId = item.product.id;
          const start = startDates[routineId] || today;
          const end = getEndDate(start, item.product.durationDays);
          const isOpen = activeRoutineId === routineId;
          // sameDate 모드에서는 첫 번째 카드만 캘린더 열기 가능
          const canOpenCalendar = !sameDate || cart[0].product.id === routineId;

          return (
            <Card key={routineId} shadow="sm" className="overflow-hidden">
              <CardBody className="p-0">
                {/* Routine info */}
                <div className="flex gap-3 p-4">
                  <ImageWithFallback
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-default-900 truncate">
                      {item.product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Chip
                        size="sm"
                        variant="solid"
                        className="text-white h-5 text-[10px]"
                        style={{ backgroundColor: item.product.color }}
                      >
                        {item.product.category}
                      </Chip>
                      <span className="text-xs text-default-400">
                        {item.product.durationDays}일
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date selection area */}
                <div
                  className={`px-4 pb-4 ${canOpenCalendar ? "cursor-pointer" : ""}`}
                  onClick={canOpenCalendar ? () => toggleCalendar(routineId) : undefined}
                >
                  <div className="flex items-center justify-between bg-default-50 rounded-xl p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-default-500">시작일</span>
                        <span className="text-sm font-semibold text-success">
                          {formatDate(start)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-default-500">종료일</span>
                        <span className="text-xs text-default-700">
                          {formatDate(end)}
                        </span>
                      </div>
                    </div>
                    {canOpenCalendar && (
                      <Calendar className={`w-5 h-5 transition-colors ${isOpen ? "text-primary" : "text-default-400"}`} />
                    )}
                  </div>
                </div>

                {/* Calendar (expandable) */}
                {isOpen && (
                  <div className="px-4 pb-4">
                    <Card shadow="none" className="border border-default-200">
                      <CardBody className="p-3">
                        <div className="flex items-center justify-between mb-3">
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <p className="text-sm font-bold text-default-900">
                            {calendarYear}년 {calendarMonth + 1}월
                          </p>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-7 mb-1">
                          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                            <div
                              key={d}
                              className="text-[11px] text-default-400 text-center py-1"
                            >
                              {d}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7">
                          {calendarDays.map((day, i) => {
                            if (day === null) return <div key={i} className="h-9" />;
                            const past = isPastDay(day);
                            const isStart = isSelectedDay(routineId, day);
                            const isEnd = isEndDay(routineId, day);
                            const inRange = isInRange(routineId, day);
                            const isToday =
                              today.getFullYear() === calendarYear &&
                              today.getMonth() === calendarMonth &&
                              today.getDate() === day;

                            return (
                              <button
                                key={i}
                                disabled={past}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!past) handleSelectDate(routineId, day);
                                }}
                                className={`relative h-9 text-[12px] rounded-full transition-all border-none mx-0.5
                                  ${past ? "text-default-300 cursor-not-allowed bg-transparent" : "cursor-pointer"}
                                  ${isStart ? "bg-success text-white font-bold" : ""}
                                  ${isEnd && !isStart ? "bg-success/60 text-white font-semibold" : ""}
                                  ${inRange && !isStart && !isEnd ? "bg-success/15 text-default-900" : ""}
                                  ${!isStart && !isEnd && !inRange && !past ? "bg-transparent text-default-900 hover:bg-default-100" : ""}
                                `}
                              >
                                {day}
                                {isToday && !isStart && (
                                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-default-100 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-default-900">
              {cart.length}개 루틴
            </p>
            <p className="text-[11px] text-default-400">
              ₩{cart.reduce((s, c) => s + c.product.price, 0).toLocaleString()}
            </p>
          </div>
          <Button
            color="primary"
            size="lg"
            className="font-bold px-8"
            isLoading={isSubmitting}
            onPress={handleSubmit}
            startContent={!isSubmitting ? <ShoppingBag className="w-4 h-4" /> : undefined}
          >
            시작하기
          </Button>
        </div>
      </div>
    </div>
  );
}
