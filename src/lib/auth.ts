import { supabase } from './supabase';
import type { Provider, Session, User as SupabaseUser } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export type SocialProvider = 'kakao' | 'apple' | 'google';

export interface AuthSession {
  user: SupabaseUser | null;
  session: Session | null;
}

// ============================================================================
// Email Auth
// ============================================================================

/** 이메일 회원가입 */
export async function signUpWithEmail(input: {
  email: string;
  password: string;
  nickname?: string;
}): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        nickname: input.nickname ?? '',
      },
    },
  });

  if (error) throw error;

  return {
    user: data.user,
    session: data.session,
  };
}

/** 이메일 로그인 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return {
    user: data.user,
    session: data.session,
  };
}

// ============================================================================
// Social Auth
// ============================================================================

/** 소셜 로그인 (카카오/애플/구글) */
export async function signInWithSocial(provider: SocialProvider): Promise<void> {
  const providerMap: Record<SocialProvider, Provider> = {
    kakao: 'kakao',
    apple: 'apple',
    google: 'google',
  };

  const { error } = await supabase.auth.signInWithOAuth({
    provider: providerMap[provider],
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: provider === 'kakao' ? { prompt: 'login' } : undefined,
    },
  });

  if (error) throw error;
}

// ============================================================================
// Session Management
// ============================================================================

/** 현재 세션 조회 */
export async function getSession(): Promise<AuthSession> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  return {
    user: data.session?.user ?? null,
    session: data.session,
  };
}

/** 현재 유저 조회 */
export async function getCurrentUser(): Promise<SupabaseUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/** 토큰 갱신 */
export async function refreshSession(): Promise<AuthSession> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;

  return {
    user: data.user,
    session: data.session,
  };
}

/** 로그아웃 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ============================================================================
// Auth State Listener
// ============================================================================

/** Auth 상태 변경 리스너 등록 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return data.subscription;
}

// ============================================================================
// Password Management
// ============================================================================

/** 비밀번호 재설정 이메일 발송 */
export async function resetPasswordForEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) throw error;
}

/** 비밀번호 변경 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

// ============================================================================
// Account Management
// ============================================================================

/** 이메일 변경 */
export async function updateEmail(newEmail: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) throw error;
}

/** 계정 삭제 요청 (soft delete - profiles 상태 변경) */
export async function requestAccountDeletion(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;

  // 로그아웃 처리
  await signOut();
}
