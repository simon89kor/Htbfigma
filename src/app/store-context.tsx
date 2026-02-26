import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./auth-context";
import { TodoTemplate } from "./data";
import {
  getUserRoutines,
  createCustomRoutine,
  deleteUserRoutine,
  createTodoItem as apiCreateTodoItem,
  toggleTodoItem as apiToggleTodoItem,
  updateTodoItem as apiUpdateTodoItem,
  deleteTodoItem as apiDeleteTodoItem,
  createTodoSubItem as apiCreateTodoSubItem,
  toggleTodoSubItem as apiToggleTodoSubItem,
  deleteTodoSubItem as apiDeleteTodoSubItem,
  type UserRoutineWithItems,
} from "@/lib/api/user-routines";
import {
  createPurchase,
  getUserPurchases,
  hasUserPurchasedRoutine,
} from "@/lib/api/purchases";

// ============================================================================
// Types (기존 인터페이스 유지)
// ============================================================================

export interface CartItem {
  product: TodoTemplate;
  quantity: number;
}

export interface SubItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  day: number;
  time?: string;
  repeatDays?: number[];
  memo?: string;
  notification?: 'none' | 'ontime' | '10min' | '30min';
  moveToNextDay?: boolean;
  subItems?: SubItem[];
}

export interface PurchasedList {
  id: string;
  product: TodoTemplate;
  purchasedAt: string;
  startDate: string;
  items: TodoItem[];
  moveToNextDay?: boolean;
}

export interface CustomList {
  id: string;
  title: string;
  category: string;
  headerColor: string;
  durationType: "1week" | "4weeks" | "100days" | "unlimited";
  durationDays: number;
  startDate: string;
  endDate: string;
  showDDay: boolean;
  createdAt: string;
  items: TodoItem[];
  moveToNextDay?: boolean;
}

interface StoreContextType {
  cart: CartItem[];
  purchasedLists: PurchasedList[];
  customLists: CustomList[];
  loading: boolean;
  addToCart: (product: TodoTemplate) => void;
  removeFromCart: (productId: string) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (productId: string) => boolean;
  isPurchased: (productId: string) => boolean;
  checkout: () => Promise<void>;
  toggleTodoItem: (listId: string, itemId: string) => void;
  addTodoItem: (listId: string, text: string, day: number, time?: string) => void;
  deleteTodoItem: (listId: string, itemId: string) => void;
  updateTodoItem: (listId: string, itemId: string, updates: Partial<Omit<TodoItem, 'id'>>) => void;
  toggleSubItem: (listId: string, itemId: string, subItemId: string) => void;
  addSubItem: (listId: string, itemId: string, text: string) => void;
  deleteSubItem: (listId: string, itemId: string, subItemId: string) => void;
  createCustomList: (list: Omit<CustomList, 'id' | 'createdAt' | 'items'>) => string;
  deleteCustomList: (id: string) => void;
  addCustomTodoItem: (listId: string, text: string, day: number, time?: string) => void;
  deleteCustomTodoItem: (listId: string, itemId: string) => void;
  toggleCustomTodoItem: (listId: string, itemId: string) => void;
  updateCustomTodoItem: (listId: string, itemId: string, updates: Partial<Omit<TodoItem, 'id'>>) => void;
  toggleListMoveToNextDay: (listId: string) => void;
  /** 서버에서 데이터 다시 불러오기 */
  refreshData: () => Promise<void>;
}

// ============================================================================
// Context (HMR-safe)
// ============================================================================

const STORE_CTX_KEY = Symbol.for('TodoMarketStoreContext');
const globalObj = globalThis as Record<symbol, unknown>;
if (!globalObj[STORE_CTX_KEY]) {
  globalObj[STORE_CTX_KEY] = createContext<StoreContextType | undefined>(undefined);
}
const StoreContext = globalObj[STORE_CTX_KEY] as React.Context<StoreContextType | undefined>;

// ============================================================================
// localStorage helpers (카트는 비로그인도 사용 가능하므로 localStorage 유지)
// ============================================================================

const STORAGE_KEY_CART = "todomarket_cart";

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CART);
    if (stored) return JSON.parse(stored);
  } catch { /* empty */ }
  return [];
}

function saveCart(cart: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
  } catch { /* empty */ }
}

// ============================================================================
// Helpers: DB 데이터 → 기존 인터페이스 변환
// ============================================================================

function dbRoutineToTodoItem(
  item: UserRoutineWithItems['todo_items'] extends (infer T)[] | undefined ? T : never
): TodoItem {
  const dbItem = item as {
    id: string;
    text: string;
    completed: boolean;
    day: number | null;
    time: string | null;
    repeat_days: string[];
    memo: string | null;
    notification: 'none' | 'ontime' | '10min' | '30min' | null;
    sort_order: number;
    todo_sub_items?: { id: string; text: string; completed: boolean; sort_order: number }[];
  };

  return {
    id: dbItem.id,
    text: dbItem.text,
    completed: dbItem.completed,
    day: dbItem.day ?? 1,
    time: dbItem.time ?? undefined,
    repeatDays: dbItem.repeat_days?.map(Number).filter((n) => !isNaN(n)),
    memo: dbItem.memo ?? undefined,
    notification: dbItem.notification ?? undefined,
    subItems: dbItem.todo_sub_items?.map((si) => ({
      id: si.id,
      text: si.text,
      completed: si.completed,
    })),
  };
}

function dbUserRoutineToPurchasedList(ur: UserRoutineWithItems): PurchasedList {
  return {
    id: ur.id,
    product: {
      id: ur.routine_id ?? ur.id,
      name: ur.title,
      description: ur.description,
      longDescription: ur.description,
      price: 0,
      image: ur.routines?.image_url ?? '',
      category: ur.category,
      rating: 0,
      reviews: 0,
      color: ur.routines?.color ?? '#65D9AC',
      durationDays: ur.routines?.duration_days ?? 0,
      tags: [],
      dayPlans: [],
      features: [],
    },
    purchasedAt: ur.created_at,
    startDate: ur.start_date ?? ur.created_at,
    items: ur.todo_items?.map(dbRoutineToTodoItem) ?? [],
  };
}

function dbUserRoutineToCustomList(ur: UserRoutineWithItems): CustomList {
  const startDate = ur.start_date ?? ur.created_at;
  const endDate = ur.end_date ?? '';
  let durationDays = 0;
  let durationType: CustomList['durationType'] = 'unlimited';

  if (startDate && endDate) {
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    durationDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (durationDays <= 7) durationType = '1week';
    else if (durationDays <= 28) durationType = '4weeks';
    else if (durationDays <= 100) durationType = '100days';
    else durationType = 'unlimited';
  }

  return {
    id: ur.id,
    title: ur.title,
    category: ur.category,
    headerColor: '#65D9AC',
    durationType,
    durationDays,
    startDate,
    endDate,
    showDDay: !!endDate,
    createdAt: ur.created_at,
    items: ur.todo_items?.map(dbRoutineToTodoItem) ?? [],
  };
}

// ============================================================================
// Provider
// ============================================================================

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [purchasedLists, setPurchasedLists] = useState<PurchasedList[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  // 카트 localStorage 동기화
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  // 로그인 시 서버에서 데이터 로드
  useEffect(() => {
    mountedRef.current = true;
    if (isLoggedIn && user) {
      loadUserData(user.id);
    } else {
      setPurchasedLists([]);
      setCustomLists([]);
    }
    return () => {
      mountedRef.current = false;
    };
  }, [isLoggedIn, user?.id]);

  const loadUserData = async (userId: string) => {
    setLoading(true);
    try {
      const { data: routines } = await getUserRoutines(userId, { status: 'active' });

      if (!mountedRef.current) return;

      const purchased: PurchasedList[] = [];
      const custom: CustomList[] = [];

      routines.forEach((ur) => {
        if (ur.is_custom) {
          custom.push(dbUserRoutineToCustomList(ur));
        } else {
          purchased.push(dbUserRoutineToPurchasedList(ur));
        }
      });

      setPurchasedLists(purchased);
      setCustomLists(custom);
    } catch {
      // 에러 시 빈 배열 유지
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // ========================================================================
  // Cart (localStorage 유지 - 비로그인도 사용 가능)
  // ========================================================================

  const addToCart = useCallback((product: TodoTemplate) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) return prev;
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const getCartCount = useCallback(() => {
    return cart.length;
  }, [cart]);

  const isInCart = useCallback(
    (productId: string) => cart.some((item) => item.product.id === productId),
    [cart]
  );

  const isPurchased = useCallback(
    (productId: string) => {
      // 로컬 상태에서 먼저 확인
      return purchasedLists.some((list) => list.product.id === productId);
    },
    [purchasedLists]
  );

  // ========================================================================
  // Checkout → Supabase
  // ========================================================================

  const checkout = useCallback(async () => {
    if (!user) return;

    const newPurchases: PurchasedList[] = [];

    for (const item of cart) {
      try {
        // 이미 구매한 루틴인지 확인
        const alreadyPurchased = await hasUserPurchasedRoutine(user.id, item.product.id);
        if (alreadyPurchased) continue;

        // 구매 생성
        const purchase = await createPurchase({
          userId: user.id,
          routineId: item.product.id,
          periodLabel: `${item.product.durationDays}일`,
          periodDays: item.product.durationDays,
          amount: item.product.originalPrice ?? item.product.price,
          discount: (item.product.originalPrice ?? item.product.price) - item.product.price,
          finalAmount: item.product.price,
          paymentMethod: 'free',
          startDate: new Date().toISOString(),
        });

        // 투두 아이템 생성
        const todoItems: TodoItem[] = [];
        item.product.dayPlans.forEach((dayPlan) => {
          dayPlan.items.forEach((text, idx) => {
            todoItems.push({
              id: `${item.product.id}-d${dayPlan.day}-${idx}`,
              text,
              completed: false,
              day: dayPlan.day,
            });
          });
        });

        newPurchases.push({
          id: purchase.id,
          product: item.product,
          purchasedAt: new Date().toISOString(),
          startDate: new Date().toISOString(),
          items: todoItems,
        });
      } catch {
        // 개별 구매 실패 시 건너뛰기
      }
    }

    setPurchasedLists((prev) => [...prev, ...newPurchases]);
    setCart([]);

    // 서버 데이터 새로고침
    if (user) {
      await loadUserData(user.id);
    }
  }, [cart, user]);

  // ========================================================================
  // Todo Items → Supabase (기존 인터페이스 유지, 내부 구현은 Supabase)
  // ========================================================================

  const toggleTodoItem = useCallback((listId: string, itemId: string) => {
    // 즉시 로컬 상태 업데이트 (optimistic)
    setPurchasedLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : list
      )
    );

    // 서버 동기화
    const list = purchasedLists.find((l) => l.id === listId);
    const item = list?.items.find((i) => i.id === itemId);
    if (item) {
      apiToggleTodoItem(itemId, !item.completed).catch(() => {
        // 실패 시 롤백
        setPurchasedLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.map((i) =>
                    i.id === itemId ? { ...i, completed: item.completed } : i
                  ),
                }
              : l
          )
        );
      });
    }
  }, [purchasedLists]);

  const addTodoItem = useCallback((listId: string, text: string, day: number, time?: string) => {
    const tempId = `temp-${Date.now()}`;

    // optimistic 업데이트
    setPurchasedLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: [
                ...list.items,
                { id: tempId, text, completed: false, day, ...(time && { time }) },
              ],
            }
          : list
      )
    );

    // 서버에 생성
    if (user) {
      apiCreateTodoItem({
        userRoutineId: listId,
        userId: user.id,
        text,
        day,
        time,
      }).then((created) => {
        // temp ID를 실제 ID로 교체
        setPurchasedLists((prev) =>
          prev.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.map((item) =>
                    item.id === tempId ? { ...item, id: created.id } : item
                  ),
                }
              : list
          )
        );
      }).catch(() => {
        // 실패 시 제거
        setPurchasedLists((prev) =>
          prev.map((list) =>
            list.id === listId
              ? { ...list, items: list.items.filter((i) => i.id !== tempId) }
              : list
          )
        );
      });
    }
  }, [user]);

  const deleteTodoItem = useCallback((listId: string, itemId: string) => {
    setPurchasedLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
          : list
      )
    );

    apiDeleteTodoItem(itemId).catch(() => {
      // 실패 무시 (이미 로컬에서 삭제됨)
    });
  }, []);

  const updateTodoItem = useCallback((listId: string, itemId: string, updates: Partial<Omit<TodoItem, 'id'>>) => {
    setPurchasedLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : list
      )
    );

    apiUpdateTodoItem(itemId, {
      text: updates.text,
      day: updates.day,
      time: updates.time ?? undefined,
      repeatDays: updates.repeatDays?.map(String),
      memo: updates.memo,
      notification: updates.notification,
    }).catch(() => {
      // 실패 무시
    });
  }, []);

  // ========================================================================
  // Sub Items → Supabase
  // ========================================================================

  const toggleSubItem = useCallback((listId: string, itemId: string, subItemId: string) => {
    const updateList = (lists: (PurchasedList | CustomList)[]) =>
      lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item: TodoItem) =>
                item.id === itemId
                  ? {
                      ...item,
                      subItems: item.subItems?.map((si) =>
                        si.id === subItemId ? { ...si, completed: !si.completed } : si
                      ),
                    }
                  : item
              ),
            }
          : list
      );

    // 현재 상태 조회하여 토글
    const allLists = [...purchasedLists, ...customLists];
    const currentList = allLists.find((l) => l.id === listId);
    const currentItem = currentList?.items.find((i) => i.id === itemId);
    const currentSubItem = currentItem?.subItems?.find((si) => si.id === subItemId);

    setPurchasedLists((prev) => updateList(prev) as PurchasedList[]);
    setCustomLists((prev) => updateList(prev) as CustomList[]);

    if (currentSubItem) {
      apiToggleTodoSubItem(subItemId, !currentSubItem.completed).catch(() => {
        // 실패 무시
      });
    }
  }, [purchasedLists, customLists]);

  const addSubItem = useCallback((listId: string, itemId: string, text: string) => {
    const tempId = `sub-${Date.now()}`;
    const newSub: SubItem = { id: tempId, text, completed: false };

    const updateList = (lists: (PurchasedList | CustomList)[]) =>
      lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item: TodoItem) =>
                item.id === itemId
                  ? { ...item, subItems: [...(item.subItems || []), newSub] }
                  : item
              ),
            }
          : list
      );

    setPurchasedLists((prev) => updateList(prev) as PurchasedList[]);
    setCustomLists((prev) => updateList(prev) as CustomList[]);

    apiCreateTodoSubItem({ todoItemId: itemId, text }).then((created) => {
      // temp ID 교체
      const replaceId = (lists: (PurchasedList | CustomList)[]) =>
        lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                items: list.items.map((item: TodoItem) =>
                  item.id === itemId
                    ? {
                        ...item,
                        subItems: item.subItems?.map((si) =>
                          si.id === tempId ? { ...si, id: created.id } : si
                        ),
                      }
                    : item
                ),
              }
            : list
        );

      setPurchasedLists((prev) => replaceId(prev) as PurchasedList[]);
      setCustomLists((prev) => replaceId(prev) as CustomList[]);
    }).catch(() => {
      // 실패 시 제거
    });
  }, []);

  const deleteSubItem = useCallback((listId: string, itemId: string, subItemId: string) => {
    const updateList = (lists: (PurchasedList | CustomList)[]) =>
      lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item: TodoItem) =>
                item.id === itemId
                  ? { ...item, subItems: item.subItems?.filter((si) => si.id !== subItemId) }
                  : item
              ),
            }
          : list
      );

    setPurchasedLists((prev) => updateList(prev) as PurchasedList[]);
    setCustomLists((prev) => updateList(prev) as CustomList[]);

    apiDeleteTodoSubItem(subItemId).catch(() => {
      // 실패 무시
    });
  }, []);

  // ========================================================================
  // Custom List CRUD → Supabase
  // ========================================================================

  const createCustomListHandler = useCallback((list: Omit<CustomList, 'id' | 'createdAt' | 'items'>): string => {
    const tempId = `custom-${Date.now()}`;
    const newList: CustomList = {
      ...list,
      id: tempId,
      createdAt: new Date().toISOString(),
      items: [],
    };
    setCustomLists((prev) => [...prev, newList]);

    // 서버에 생성
    if (user) {
      createCustomRoutine({
        userId: user.id,
        title: list.title,
        category: list.category,
        startDate: list.startDate,
        endDate: list.endDate || undefined,
      }).then((created) => {
        setCustomLists((prev) =>
          prev.map((cl) => (cl.id === tempId ? { ...cl, id: created.id } : cl))
        );
      }).catch(() => {
        // 실패 시 제거
        setCustomLists((prev) => prev.filter((cl) => cl.id !== tempId));
      });
    }

    return tempId;
  }, [user]);

  const deleteCustomListHandler = useCallback((id: string) => {
    setCustomLists((prev) => prev.filter((list) => list.id !== id));
    deleteUserRoutine(id).catch(() => {
      // 실패 무시
    });
  }, []);

  const addCustomTodoItem = useCallback((listId: string, text: string, day: number, time?: string) => {
    const tempId = `ct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    setCustomLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: [
                ...list.items,
                { id: tempId, text, completed: false, day, ...(time && { time }) },
              ],
            }
          : list
      )
    );

    if (user) {
      apiCreateTodoItem({
        userRoutineId: listId,
        userId: user.id,
        text,
        day,
        time,
      }).then((created) => {
        setCustomLists((prev) =>
          prev.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.map((item) =>
                    item.id === tempId ? { ...item, id: created.id } : item
                  ),
                }
              : list
          )
        );
      }).catch(() => {
        setCustomLists((prev) =>
          prev.map((list) =>
            list.id === listId
              ? { ...list, items: list.items.filter((i) => i.id !== tempId) }
              : list
          )
        );
      });
    }
  }, [user]);

  const deleteCustomTodoItem = useCallback((listId: string, itemId: string) => {
    setCustomLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
          : list
      )
    );

    apiDeleteTodoItem(itemId).catch(() => {
      // 실패 무시
    });
  }, []);

  const toggleCustomTodoItem = useCallback((listId: string, itemId: string) => {
    const list = customLists.find((l) => l.id === listId);
    const item = list?.items.find((i) => i.id === itemId);

    setCustomLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : list
      )
    );

    if (item) {
      apiToggleTodoItem(itemId, !item.completed).catch(() => {
        // 실패 시 롤백
        setCustomLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.map((i) =>
                    i.id === itemId ? { ...i, completed: item.completed } : i
                  ),
                }
              : l
          )
        );
      });
    }
  }, [customLists]);

  const updateCustomTodoItem = useCallback((listId: string, itemId: string, updates: Partial<Omit<TodoItem, 'id'>>) => {
    setCustomLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : list
      )
    );

    apiUpdateTodoItem(itemId, {
      text: updates.text,
      day: updates.day,
      time: updates.time ?? undefined,
      repeatDays: updates.repeatDays?.map(String),
      memo: updates.memo,
      notification: updates.notification,
    }).catch(() => {
      // 실패 무시
    });
  }, []);

  const toggleListMoveToNextDay = useCallback((listId: string) => {
    setPurchasedLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, moveToNextDay: !list.moveToNextDay }
          : list
      )
    );
    setCustomLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, moveToNextDay: !list.moveToNextDay }
          : list
      )
    );
  }, []);

  // 서버 데이터 새로고침
  const refreshData = useCallback(async () => {
    if (user) {
      await loadUserData(user.id);
    }
  }, [user]);

  return (
    <StoreContext.Provider
      value={{
        cart,
        purchasedLists,
        customLists,
        loading,
        addToCart,
        removeFromCart,
        getCartTotal,
        getCartCount,
        isInCart,
        isPurchased,
        checkout,
        toggleTodoItem,
        addTodoItem,
        deleteTodoItem,
        updateTodoItem,
        toggleSubItem,
        addSubItem,
        deleteSubItem,
        createCustomList: createCustomListHandler,
        deleteCustomList: deleteCustomListHandler,
        addCustomTodoItem,
        deleteCustomTodoItem,
        toggleCustomTodoItem,
        updateCustomTodoItem,
        toggleListMoveToNextDay,
        refreshData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}
