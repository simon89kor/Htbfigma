import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  joinedAt: string;
}

interface RegisteredUser extends User {
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (name: string) => void;
}

// HMR-safe: keep context reference stable across hot reloads
const AUTH_CTX_KEY = Symbol.for('TodoMarketAuthContext');
const globalAuthObj = globalThis as any;
if (!globalAuthObj[AUTH_CTX_KEY]) {
  globalAuthObj[AUTH_CTX_KEY] = createContext<AuthContextType | undefined>(undefined);
}
const AuthContext = globalAuthObj[AUTH_CTX_KEY] as React.Context<AuthContextType | undefined>;

const STORAGE_KEY_USERS = "todomarket_users";
const STORAGE_KEY_SESSION = "todomarket_session";

// 기본 데모 계정
const DEFAULT_USERS: RegisteredUser[] = [
  {
    id: "demo-user-1",
    email: "demo@todomarket.kr",
    password: "demo1234",
    name: "김투두",
    avatar: "",
    joinedAt: "2025-12-01T00:00:00.000Z",
  },
];

const AVATARS = [
  "🧑‍💻", "👩‍🎨", "👨‍🔬", "👩‍🚀", "🧑‍🍳", "👩‍🏫", "👨‍💼", "👩‍⚕️",
];

function getRandomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

function loadUsers(): RegisteredUser[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USERS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...DEFAULT_USERS];
}

function saveUsers(users: RegisteredUser[]) {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

function loadSession(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SESSION);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function saveSession(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<RegisteredUser[]>(loadUsers);
  const [user, setUser] = useState<User | null>(loadSession);

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  useEffect(() => {
    saveSession(user);
  }, [user]);

  const login = useCallback(
    (email: string, password: string): { success: boolean; error?: string } => {
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!found) {
        return { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." };
      }
      const { password: _, ...userData } = found;
      setUser(userData);
      return { success: true };
    },
    [users]
  );

  const register = useCallback(
    (name: string, email: string, password: string): { success: boolean; error?: string } => {
      const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return { success: false, error: "이미 등록된 이메일입니다." };
      }
      const newUser: RegisteredUser = {
        id: `user-${Date.now()}`,
        email,
        password,
        name,
        avatar: getRandomAvatar(),
        joinedAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newUser]);
      const { password: _, ...userData } = newUser;
      setUser(userData);
      return { success: true };
    },
    [users]
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateProfile = useCallback((name: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, name };
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === user?.id ? { ...u, name } : u))
    );
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}