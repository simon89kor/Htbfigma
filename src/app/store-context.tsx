import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { TodoTemplate } from "./data";

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
  time?: string; // "21:00" format
  repeatDays?: number[]; // 0=Sun, 1=Mon ... 6=Sat
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
  addToCart: (product: TodoTemplate) => void;
  removeFromCart: (productId: string) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (productId: string) => boolean;
  isPurchased: (productId: string) => boolean;
  checkout: () => void;
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
}

// HMR-safe: keep context reference stable across hot reloads
const STORE_CTX_KEY = Symbol.for('TodoMarketStoreContext');
const globalObj = globalThis as any;
if (!globalObj[STORE_CTX_KEY]) {
  globalObj[STORE_CTX_KEY] = createContext<StoreContextType | undefined>(undefined);
}
const StoreContext = globalObj[STORE_CTX_KEY] as React.Context<StoreContextType | undefined>;

const STORAGE_KEY_CART = "todomarket_cart";
const STORAGE_KEY_PURCHASED = "todomarket_purchased";
const STORAGE_KEY_CUSTOM = "todomarket_custom";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => loadFromStorage(STORAGE_KEY_CART, []));
  const [purchasedLists, setPurchasedLists] = useState<PurchasedList[]>(() => loadFromStorage(STORAGE_KEY_PURCHASED, []));
  const [customLists, setCustomLists] = useState<CustomList[]>(() => loadFromStorage(STORAGE_KEY_CUSTOM, []));

  useEffect(() => {
    saveToStorage(STORAGE_KEY_CART, cart);
  }, [cart]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_PURCHASED, purchasedLists);
  }, [purchasedLists]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_CUSTOM, customLists);
  }, [customLists]);

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
    (productId: string) => {
      return cart.some((item) => item.product.id === productId);
    },
    [cart]
  );

  const isPurchased = useCallback(
    (productId: string) => {
      return purchasedLists.some((list) => list.product.id === productId);
    },
    [purchasedLists]
  );

  const checkout = useCallback(() => {
    const newPurchases: PurchasedList[] = cart.map((item) => {
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

      return {
        id: `${item.product.id}-${Date.now()}`,
        product: item.product,
        purchasedAt: new Date().toISOString(),
        startDate: new Date().toISOString(),
        items: todoItems,
      };
    });
    setPurchasedLists((prev) => [...prev, ...newPurchases]);
    setCart([]);
  }, [cart]);

  const toggleTodoItem = useCallback((listId: string, itemId: string) => {
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
  }, []);

  const addTodoItem = useCallback((listId: string, text: string, day: number, time?: string) => {
    setPurchasedLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: [
                ...list.items,
                { id: `custom-${Date.now()}`, text, completed: false, day, ...(time && { time }) },
              ],
            }
          : list
      )
    );
  }, []);

  const deleteTodoItem = useCallback((listId: string, itemId: string) => {
    setPurchasedLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
          : list
      )
    );
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
  }, []);

  const toggleSubItem = useCallback((listId: string, itemId: string, subItemId: string) => {
    const updateList = (lists: any[]) =>
      lists.map((list: any) =>
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
    setPurchasedLists((prev) => updateList(prev));
    setCustomLists((prev) => updateList(prev));
  }, []);

  const addSubItem = useCallback((listId: string, itemId: string, text: string) => {
    const newSub: SubItem = { id: `sub-${Date.now()}`, text, completed: false };
    const updateList = (lists: any[]) =>
      lists.map((list: any) =>
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
    setPurchasedLists((prev) => updateList(prev));
    setCustomLists((prev) => updateList(prev));
  }, []);

  const deleteSubItem = useCallback((listId: string, itemId: string, subItemId: string) => {
    const updateList = (lists: any[]) =>
      lists.map((list: any) =>
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
    setPurchasedLists((prev) => updateList(prev));
    setCustomLists((prev) => updateList(prev));
  }, []);

  // Custom list CRUD
  const createCustomList = useCallback((list: Omit<CustomList, 'id' | 'createdAt' | 'items'>): string => {
    const id = `custom-${Date.now()}`;
    const newList: CustomList = {
      ...list,
      id,
      createdAt: new Date().toISOString(),
      items: [],
    };
    setCustomLists((prev) => [...prev, newList]);
    return id;
  }, []);

  const deleteCustomList = useCallback((id: string) => {
    setCustomLists((prev) => prev.filter((list) => list.id !== id));
  }, []);

  const addCustomTodoItem = useCallback((listId: string, text: string, day: number, time?: string) => {
    setCustomLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: [
                ...list.items,
                { id: `ct-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, text, completed: false, day, ...(time && { time }) },
              ],
            }
          : list
      )
    );
  }, []);

  const deleteCustomTodoItem = useCallback((listId: string, itemId: string) => {
    setCustomLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
          : list
      )
    );
  }, []);

  const toggleCustomTodoItem = useCallback((listId: string, itemId: string) => {
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
  }, []);

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

  return (
    <StoreContext.Provider
      value={{
        cart,
        purchasedLists,
        customLists,
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
        createCustomList,
        deleteCustomList,
        addCustomTodoItem,
        deleteCustomTodoItem,
        toggleCustomTodoItem,
        updateCustomTodoItem,
        toggleListMoveToNextDay,
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
