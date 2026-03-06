import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/api/profiles';
import { CheckSquare, AlertCircle } from 'lucide-react';

// ============================================================================
// Constants
// ============================================================================

const CALLBACK_TIMEOUT_MS = 10000;

// ============================================================================
// Component
// ============================================================================

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        // Supabase automatically handles the OAuth callback via detectSessionInUrl
        // Wait for session to be established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (cancelled) return;

        if (sessionError) {
          setError('인증 처리 중 오류가 발생했습니다.');
          return;
        }

        if (!session) {
          // Session not yet available; listen for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (cancelled) {
                subscription.unsubscribe();
                return;
              }

              if (event === 'SIGNED_IN' && newSession?.user) {
                subscription.unsubscribe();
                await routeUser(newSession.user.id);
              }
            }
          );

          // Timeout fallback
          setTimeout(() => {
            if (!cancelled) {
              subscription.unsubscribe();
              setError('인증 시간이 초과되었습니다. 다시 시도해주세요.');
            }
          }, CALLBACK_TIMEOUT_MS);

          return;
        }

        // Session exists, route the user
        await routeUser(session.user.id);
      } catch {
        if (!cancelled) {
          setError('인증 처리 중 오류가 발생했습니다.');
        }
      }
    };

    const routeUser = async (userId: string) => {
      if (cancelled) return;

      try {
        const profile = await getProfile(userId);

        // Check if user has completed terms agreement (= not a new user)
        if (profile.terms_agreed_at) {
          navigate('/', { replace: true });
        } else {
          navigate('/terms', { replace: true });
        }
      } catch {
        // Profile might not exist yet for new social users
        navigate('/terms', { replace: true });
      }
    };

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[#d4183d]" />
          </div>
          <h2 className="text-foreground text-xl font-bold">{error}</h2>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 h-[52px] px-8 bg-[#65D9AC] text-white rounded-xl text-lg font-semibold border-none cursor-pointer active:scale-[0.98] transition-transform"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <div className="w-16 h-16 bg-[#1a1a2e] rounded-2xl flex items-center justify-center">
          <CheckSquare className="w-9 h-9 text-[#65D9AC]" />
        </div>

        {/* Loading text */}
        <p className="text-foreground/60 text-sm mt-2">로그인 처리 중...</p>

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[#65D9AC]"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCallbackPage;
