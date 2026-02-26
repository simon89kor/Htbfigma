import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { CheckSquare } from 'lucide-react';

// ============================================================================
// Constants
// ============================================================================

const SPLASH_LOGO_FADE_IN_MS = 500;
const SPLASH_HOLD_MS = 1000;
const SPLASH_FADE_OUT_MS = 500;
const SPLASH_TOTAL_MS = SPLASH_LOGO_FADE_IN_MS + SPLASH_HOLD_MS + SPLASH_FADE_OUT_MS;

const WALKTHROUGH_DONE_KEY = 'htb_walkthrough_done';

// ============================================================================
// Component
// ============================================================================

const SplashScreen = () => {
  const navigate = useNavigate();
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    // Logo animation: fade-in(500ms) -> hold(1000ms) -> fade-out(500ms)
    const fadeOutTimer = setTimeout(() => {
      setShowLogo(false);
    }, SPLASH_LOGO_FADE_IN_MS + SPLASH_HOLD_MS);

    // Navigate after full animation completes
    const navigateTimer = setTimeout(async () => {
      try {
        const walkthroughDone = localStorage.getItem(WALKTHROUGH_DONE_KEY);

        if (!walkthroughDone) {
          // First visit: show walkthrough
          navigate('/walkthrough', { replace: true });
          return;
        }

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Has valid session: go to home
          navigate('/', { replace: true });
        } else {
          // No session: go to login
          navigate('/login', { replace: true });
        }
      } catch {
        // On error, fallback to login
        navigate('/login', { replace: true });
      }
    }, SPLASH_TOTAL_MS);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(navigateTimer);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#65D9AC] to-[#4DB896]">
      <AnimatePresence>
        {showLogo && (
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: SPLASH_LOGO_FADE_IN_MS / 1000,
              exit: { duration: SPLASH_FADE_OUT_MS / 1000 },
            }}
          >
            {/* Logo */}
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <CheckSquare className="w-12 h-12 text-[#1a1a2e]" />
            </div>

            {/* Brand Name */}
            <h1 className="text-white text-2xl font-bold tracking-tight">
              HOW TO BE
            </h1>

            {/* Tagline */}
            <p className="text-white/80 text-sm">
              나를 바꾸는 루틴 습관
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle loading indicator */}
      <motion.div
        className="absolute bottom-20 flex gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-white"
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
      </motion.div>
    </div>
  );
};

export default SplashScreen;
