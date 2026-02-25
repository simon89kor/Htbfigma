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
import { Card, CardBody, Button, Input, Progress, Switch, Chip } from "@heroui/react";
import { PurchasedList, CustomList, useStore } from "../store-context";
import { toast } from "sonner";

interface TodoListUsableProps {
  list?: PurchasedList;
  customList?: CustomList;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  selectedDate?: Date;
}

function getDDay(startDate: string, durationDays: number): number {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays - 1);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const handleToggleExpand = onToggleExpand || (() => setInternalExpanded((v) => !v));

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const activeDate = externalDate || today;

  const [newItemText, setNewItemText] = useState("");
  const [newItemTime, setNewItemTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showSubItemInput, setShowSubItemInput] = useState<string | null>(null);
  const [newSubText, setNewSubText] = useState("");
  const [showListSettings, setShowListSettings] = useState(false);

  const isCustom = !!customList;
  const id = isCustom ? customList!.id : list!.id;
  const title = isCustom ? customList!.title : list!.product.name;
  const headerColor = isCustom ? customList!.headerColor : list!.product.color;
  const durationDays = isCustom ? customList!.durationDays : list!.product.durationDays;
  const items = isCustom ? customList!.items : list!.items;
  const startDate = isCustom ? customList!.startDate : list!.startDate || list!.purchasedAt;
  const showDDay = isCustom ? customList!.showDDay : true;
  const listMoveToNextDay = isCustom ? customList!.moveToNextDay : list!.moveToNextDay;

  const dday = getDDay(startDate, durationDays);
  const textColor = getContrastText(headerColor);
  const activeDayNum = useMemo(() => dateToDayNum(activeDate, startDate), [activeDate, startDate]);
  const isDayInRange = activeDayNum >= 1 && activeDayNum <= durationDays;
  const isActiveToday = activeDate.getFullYear() === today.getFullYear() && activeDate.getMonth() === today.getMonth() && activeDate.getDate() === today.getDate();

  const dayTitleMap = useMemo(() => {
    if (isCustom) return {};
    const map: Record<number, string> = {};
    list!.product.dayPlans.forEach((dp) => { map[dp.day] = dp.title; });
    return map;
  }, [isCustom, list]);

  const dayItems = useMemo(() => (isDayInRange ? items.filter((item) => item.day === activeDayNum) : []), [items, activeDayNum, isDayInRange]);
  const dayCompleted = dayItems.filter((i) => i.completed).length;
  const dayTotal = dayItems.length;
  const dayProgress = dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0;
  const overallCompleted = items.filter((i) => i.completed).length;
  const overallTotal = items.length;
  const overallProgress = overallTotal > 0 ? (overallCompleted / overallTotal) * 100 : 0;

  const todayDayNum = useMemo(() => { const num = dateToDayNum(today, startDate); return Math.max(1, Math.min(num, durationDays)); }, [today, startDate, durationDays]);
  const todayItems = useMemo(() => items.filter((item) => item.day === todayDayNum), [items, todayDayNum]);
  const todayCompleted = todayItems.filter((i) => i.completed).length;
  const todayTotal = todayItems.length;
  const todayProgress = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

  const handleToggle = (itemId: string) => {
    if (!isActiveToday) { toast.info("오늘 날짜의 할 일만 완료할 수 있습니다."); return; }
    if (isCustom) toggleCustomTodoItem(id, itemId);
    else toggleTodoItem(id, itemId);
  };

  const handleAdd = () => {
    if (!newItemText.trim() || !isCustom) return;
    addCustomTodoItem(id, newItemText.trim(), activeDayNum, newItemTime || undefined);
    setNewItemText(""); setNewItemTime(""); setShowTimePicker(false);
  };

  const handleDelete = (itemId: string) => { if (isCustom) deleteCustomTodoItem(id, itemId); };

  const handleAddSubItem = (itemId: string) => {
    if (!newSubText.trim()) return;
    addSubItem(id, itemId, newSubText.trim());
    setNewSubText(""); setShowSubItemInput(null);
  };

  return (
    <Card shadow="sm" className="overflow-hidden">
      {/* Colored Header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer"
        style={{ backgroundColor: headerColor }}
        onClick={handleToggleExpand}
      >
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold truncate" style={{ color: textColor }}>{title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {showDDay && dday > 0 && (
              <span className="text-xs font-semibold" style={{ color: headerColor === "#E36185" || headerColor === "#922A2A" ? "#FFD24F" : "#E36185" }}>
                D-{dday}
              </span>
            )}
            {showDDay && dday <= 0 && (
              <span className="text-xs font-semibold" style={{ color: textColor, opacity: 0.7 }}>
                {dday === 0 ? "D-DAY" : `D+${Math.abs(dday)}`}
              </span>
            )}
            {listMoveToNextDay && (
              <Chip size="sm" variant="flat" className="h-5 text-[10px]" style={{ backgroundColor: textColor === "white" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)", color: textColor }}>
                <ArrowRight className="w-2.5 h-2.5 inline -mt-px mr-0.5" />자동이월
              </Chip>
            )}
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" style={{ color: textColor }} /> : <ChevronDown className="w-5 h-5" style={{ color: textColor }} />}
      </div>

      {isExpanded && (
        <CardBody className="p-0">
          {/* Day info + Settings */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {!isDayInRange ? (
                  <span className="text-xs text-default-400 flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" />이 날짜는 루틴 범위 밖입니다</span>
                ) : (
                  <p className="text-[13px] text-default-500">
                    <span className="font-semibold text-default-900">Day {activeDayNum}</span>
                    {dayTitleMap[activeDayNum] ? ` — ${dayTitleMap[activeDayNum]}` : ""}
                    {isActiveToday && <Chip size="sm" variant="solid" className="ml-1.5 h-5 text-[10px] text-white" style={{ backgroundColor: headerColor }}>오늘</Chip>}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isDayInRange && <p className="text-xs text-default-400">{dayCompleted}/{dayTotal}</p>}
                <Button isIconOnly size="sm" variant={showListSettings ? "flat" : "light"} onPress={() => setShowListSettings((v) => !v)}>
                  <Settings2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {showListSettings && (
              <div className="mt-2 p-2.5 bg-default-50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-default-500">미완료 항목 다음 날로 자동 이월</span>
                </div>
                <Switch size="sm" isSelected={!!listMoveToNextDay} onValueChange={() => toggleListMoveToNextDay(id)} color="success" />
              </div>
            )}

            {isDayInRange && (
              <Progress value={dayProgress} size="sm" className="mt-2" classNames={{ indicator: "" }} style={{ ["--tw-gradient-from" as string]: headerColor, ["--tw-gradient-to" as string]: headerColor } as React.CSSProperties}
                aria-label="Day progress"
              />
            )}
          </div>

          {/* Todo Items */}
          <div className="px-4 space-y-0 max-h-[400px] overflow-y-auto">
            {isDayInRange && dayItems.length === 0 && (
              <div className="py-6 text-center text-default-400 text-[13px]">
                {isActiveToday ? "오늘의 할 일이 없습니다." : "이 날의 할 일이 없습니다."}
              </div>
            )}
            {!isDayInRange && (
              <div className="py-6 text-center text-default-300 text-[13px]">루틴 기간에 포함되지 않는 날짜입니다.</div>
            )}
            {dayItems.map((item) => (
              <div key={item.id}>
                <div className={`flex items-start gap-3 py-3 group ${item.completed ? "opacity-50" : ""}`}>
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all cursor-pointer mt-0.5 ${
                      item.completed ? "border-success bg-success" : "bg-transparent hover:border-default-400"
                    }`}
                    style={!item.completed ? { borderColor: headerColor } : {}}
                  >
                    {item.completed && <Check className="w-3 h-3 text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <span className={`text-sm transition-all ${item.completed ? "line-through text-default-400" : "text-default-900"}`}>{item.text}</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.time && <span className="text-[11px] text-default-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{item.time}</span>}
                      {item.repeatDays && item.repeatDays.length > 0 && (
                        <span className="text-[11px] text-default-400 flex items-center gap-0.5">
                          <Repeat className="w-3 h-3" />{item.repeatDays.map((d) => ["일", "월", "화", "수", "목", "금", "토"][d]).join(" ")}
                        </span>
                      )}
                    </div>

                    {item.subItems && item.subItems.length > 0 && (
                      <div className="mt-2 ml-1 space-y-1">
                        {item.subItems.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2">
                            <button
                              onClick={() => { if (!isActiveToday) { toast.info("오늘 날짜의 할 일만 완료할 수 있습니다."); return; } toggleSubItem(id, item.id, sub.id); }}
                              className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center cursor-pointer transition-all ${sub.completed ? "border-success bg-success" : "border-default-300 bg-transparent hover:border-default-400"}`}
                            >
                              {sub.completed && <Check className="w-2 h-2 text-white" />}
                            </button>
                            <span className={`text-xs ${sub.completed ? "line-through text-default-400" : "text-default-500"}`}>{sub.text}</span>
                            {isCustom && (
                              <button onClick={() => deleteSubItem(id, item.id, sub.id)} className="p-0.5 text-default-300 hover:text-danger opacity-0 group-hover:opacity-100 transition-all cursor-pointer bg-transparent border-none">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isCustom && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button isIconOnly size="sm" variant={editingItemId === item.id ? "flat" : "light"}
                        className={editingItemId !== item.id ? "opacity-0 group-hover:opacity-100" : ""}
                        onPress={() => setEditingItemId(editingItemId === item.id ? null : item.id)}>
                        <Settings2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button isIconOnly size="sm" variant="light" color="danger" className="opacity-0 group-hover:opacity-100" onPress={() => handleDelete(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {isCustom && editingItemId === item.id && (
                  <div className="ml-8 mb-3 rounded-xl border border-default-100 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-default-50">
                      <span className="text-xs text-default-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />시간</span>
                      <input type="time" value={item.time || ""} onChange={(e) => updateCustomTodoItem(id, item.id, { time: e.target.value || undefined })}
                        className="px-2 py-1 bg-default-50 border border-default-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 w-[100px]" />
                    </div>
                    <div className="px-3 py-2.5 bg-white border-b border-default-50">
                      <span className="text-xs text-default-500 flex items-center gap-1.5 mb-2"><Repeat className="w-3.5 h-3.5 text-success" />반복 요일</span>
                      <div className="flex gap-1">
                        {["월", "화", "수", "목", "금", "토", "일"].map((d, idx) => {
                          const dayIdx = idx + 1 === 7 ? 0 : idx + 1;
                          const isActive = item.repeatDays?.includes(dayIdx);
                          return (
                            <button key={d} onClick={() => {
                              const current = item.repeatDays || [];
                              const updated = isActive ? current.filter((v) => v !== dayIdx) : [...current, dayIdx];
                              updateCustomTodoItem(id, item.id, { repeatDays: updated.length ? updated : undefined });
                            }}
                              className={`w-7 h-7 rounded-full text-[10px] font-medium border transition-all cursor-pointer ${isActive ? "text-white border-transparent" : "bg-white text-default-500 border-default-200 hover:border-default-400"}`}
                              style={isActive ? { backgroundColor: headerColor } : {}}>
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="px-3 py-2.5 bg-white">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-default-500 flex items-center gap-1.5">
                          <ListTree className="w-3.5 h-3.5 text-warning" />하위 항목
                          {item.subItems && item.subItems.length > 0 && <Chip size="sm" variant="flat">{item.subItems.length}</Chip>}
                        </span>
                        <Button size="sm" variant="flat" className="h-6 text-[11px]" style={{ backgroundColor: headerColor + "18", color: headerColor === "#FFD24F" || headerColor === "#B1F1B8" || headerColor === "#C3DF13" ? "#212422" : headerColor }}
                          onPress={() => setShowSubItemInput(showSubItemInput === item.id ? null : item.id)}>
                          + 추가
                        </Button>
                      </div>
                      {showSubItemInput === item.id && (
                        <div className="flex gap-1.5 mt-1.5">
                          <Input size="sm" value={newSubText} onValueChange={setNewSubText} onKeyDown={(e) => e.key === "Enter" && handleAddSubItem(item.id)}
                            placeholder="하위 항목 입력..." variant="bordered" className="flex-1" autoFocus />
                          <Button size="sm" color="primary" isDisabled={!newSubText.trim()} onPress={() => handleAddSubItem(item.id)}>추가</Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add New Item */}
          {isCustom && isDayInRange && (
            <div className="p-4 border-t border-default-100">
              <div className="flex gap-2 items-center">
                <Input
                  value={newItemText}
                  onValueChange={setNewItemText}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder={`Day ${activeDayNum}에 항목 추가...`}
                  variant="bordered"
                  size="sm"
                  radius="lg"
                  className="flex-1"
                />
                <Button isIconOnly variant={showTimePicker || newItemTime ? "solid" : "bordered"} color={showTimePicker || newItemTime ? "primary" : "default"}
                  size="sm" onPress={() => setShowTimePicker(!showTimePicker)}>
                  <Clock className="w-4 h-4" />
                </Button>
                <Button isIconOnly color="primary" size="sm" isDisabled={!newItemText.trim()} onPress={handleAdd}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {showTimePicker && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="time" value={newItemTime} onChange={(e) => setNewItemTime(e.target.value)}
                    className="px-3 py-2 bg-default-50 border border-default-200 rounded-xl text-sm focus:outline-none" />
                  {newItemTime && <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => { setNewItemTime(""); setShowTimePicker(false); }}><X className="w-4 h-4" /></Button>}
                </div>
              )}
            </div>
          )}

          {/* Overall Progress */}
          <div className="px-4 pb-4 pt-2">
            <Progress value={overallProgress} size="sm" color="success" aria-label="Overall progress" />
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-default-400">전체 진행률</span>
              <span className="text-[11px] text-default-500">{overallCompleted}/{overallTotal} ({Math.round(overallProgress)}%)</span>
            </div>
          </div>
        </CardBody>
      )}

      {/* Collapsed footer */}
      {!isExpanded && (
        <CardBody className="px-4 py-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-default-500">Day {todayDayNum}{dayTitleMap[todayDayNum] ? ` — ${dayTitleMap[todayDayNum]}` : ""}</span>
            <span className="text-[11px] text-default-400">{todayCompleted}/{todayTotal}</span>
          </div>
          <Progress value={todayProgress} size="sm" color="primary" aria-label="Today progress" />
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-default-400">오늘의 진행률</span>
            <span className="text-[10px] text-default-400">{Math.round(todayProgress)}%</span>
          </div>
        </CardBody>
      )}
    </Card>
  );
}
