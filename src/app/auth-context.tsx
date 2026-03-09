import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithSocial,
  signOut as authSignOut,
  onAuthStateChange,
  type SocialProvider,
} from "@/lib/auth";
import { getProfile, updateProfile as apiUpdateProfile } from "@/lib/api/profiles";
import type { Profile } from "@/lib/database.types";

// ============================================================================
// Types (기존 인터페이스 호환 유지)
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  joinedAt: string;
  /** Supabase profile 전체 데이터 (확장용) */
  profile?: Profile;
}

interface AuthContextType {
  /** 현재 유저 */
  user: User | null;
  /** 로그인 여부 */
  isLoggedIn: boolean;
  /** 로딩 중 여부 (비동기 인증 상태 확인) */
  loading: boolean;
  /** 이메일 로그인 */
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** 이메일 회원가입 */
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** 로그아웃 */
  logout: () => Promise<void>;
  /** 프로필 이름 수정 (기존 API 호환) */
  updateProfile: (name: string) => Promise<void>;
  /** 소셜 로그인 (카카오/애플/구글) */
  socialLogin: (provider: SocialProvider) => Promise<{ success: boolean; error?: string }>;
  /** Supabase 프로필 전체 업데이트 */
  updateProfileFull: (updates: Partial<Profile>) => Promise<void>;
  /** 프로필 새로고침 */
  refreshProfile: () => Promise<void>;
}

// ============================================================================
// Context (HMR-safe)
// ============================================================================

const AUTH_CTX_KEY = Symbol.for('TodoMarketAuthContext');
const globalAuthObj = globalThis as Record<symbol, unknown>;
if (!globalAuthObj[AUTH_CTX_KEY]) {
  globalAuthObj[AUTH_CTX_KEY] = createContext<AuthContextType | undefined>(undefined);
}
const AuthContext = globalAuthObj[AUTH_CTX_KEY] as React.Context<AuthContextType | undefined>;

// ============================================================================
// Helper: Supabase User → App User 변환
// ============================================================================

function toAppUser(profile: Profile): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.nickname,
    avatar: profile.avatar_url,
    joinedAt: profile.created_at,
    profile,
  };
}

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // 초기 세션 확인 + Auth 상태 리스너
  useEffect(() => {
    mountedRef.current = true;

    // 1. 현재 세션 확인
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mountedRef.current) {
          try {
            const profile = await getProfile(session.user.id);
            if (mountedRef.current) {
              setUser(toAppUser(profile));
            }
          } catch {
            // 프로필이 아직 없을 수 있음 (회원가입 직후)
            if (mountedRef.current) {
              setUser({
                id: session.user.id,
                email: session.user.email ?? '',
                name: session.user.user_metadata?.nickname ?? '',
                avatar: '',
                joinedAt: session.user.created_at,
              });
            }
          }
        }
      } catch {
        // 세션 조회 실패 시 무시
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initSession();

    // 2. Auth 상태 변경 리스너
    const subscription = onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const profile = await getProfile(session.user.id);
          if (mountedRef.current) {
            setUser(toAppUser(profile));
          }
        } catch {
          if (mountedRef.current) {
            setUser({
              id: session.user.id,
              email: session.user.email ?? '',
              name: session.user.user_metadata?.nickname ?? '',
              avatar: '',
              joinedAt: session.user.created_at,
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (mountedRef.current) {
          setUser(null);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // 토큰 갱신 시 별도 처리 불필요 (세션 유지)
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // 이메일 로그인
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { user: authUser } = await signInWithEmail(email, password);
        if (!authUser) {
          return { success: false, error: '로그인에 실패했습니다.' };
        }
        // onAuthStateChange가 user 상태 업데이트를 처리
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
        // Supabase 에러 메시지 한글 변환
        if (message.includes('Invalid login credentials')) {
          return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
        }
        return { success: false, error: message };
      }
    },
    []
  );

  // 이메일 회원가입
  const register = useCallback(
    async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { user: authUser } = await signUpWithEmail({
          email,
          password,
          nickname: name,
        });
        if (!authUser) {
          return { success: false, error: '회원가입에 실패했습니다.' };
        }
        // onAuthStateChange가 user 상태 업데이트를 처리
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : '회원가입에 실패했습니다.';
        if (message.includes('already registered') || message.includes('already been registered')) {
          return { success: false, error: '이미 등록된 이메일입니다.' };
        }
        return { success: false, error: message };
      }
    },
    []
  );

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      await authSignOut();
      // onAuthStateChange가 user 상태를 null로 설정
    } catch {
      // 에러 발생해도 로컬 상태 초기화
      setUser(null);
    }
  }, []);

  // 프로필 이름 수정 (기존 API 호환: 이름만 업데이트)
  const updateProfileHandler = useCallback(async (name: string) => {
    if (!user) return;
    try {
      const updatedProfile = await apiUpdateProfile(user.id, { nickname: name });
      setUser(toAppUser(updatedProfile));
    } catch {
      // 에러 시 로컬 상태만 업데이트 (오프라인 대응)
      setUser((prev) => (prev ? { ...prev, name } : prev));
    }
  }, [user]);

  // 소셜 로그인
  const socialLogin = useCallback(
    async (provider: SocialProvider): Promise<{ success: boolean; error?: string }> => {
      try {
        await signInWithSocial(provider);
        // OAuth 리다이렉트 되므로 여기서 반환값은 의미 없음
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : '소셜 로그인에 실패했습니다.';
        return { success: false, error: message };
      }
    },
    []
  );

  // 프로필 전체 업데이트
  const updateProfileFull = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;
    try {
      const updatedProfile = await apiUpdateProfile(user.id, updates);
      setUser(toAppUser(updatedProfile));
    } catch {
      // 에러 무시
    }
  }, [user]);

  // 프로필 새로고침
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getProfile(user.id);
      setUser(toAppUser(profile));
    } catch {
      // 에러 무시
    }
  }, [user]);

  // 인증 상태 확인 중에는 빈 화면 (로그인 페이지 깜빡임 방지)
  if (loading) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          isLoggedIn: false,
          loading: true,
          login,
          register,
          logout,
          updateProfile: updateProfileHandler,
          socialLogin,
          updateProfileFull,
          refreshProfile,
        }}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        login,
        register,
        logout,
        updateProfile: updateProfileHandler,
        socialLogin,
        updateProfileFull,
        refreshProfile,
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
