import React, { useEffect, useReducer } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { BatteryCharging, Zap, SkipForward } from 'lucide-react';

/**
 * Welcome animation sequence shown after login.
 * Respects prefers-reduced-motion.
 * Calls onComplete() when done (or when skipped).
 */
const WelcomeAnimation = ({ username, onComplete }) => {
  const prefersReducedMotion = useReducedMotion();

  // If user prefers reduced motion, skip the animation entirely
  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete();
    }
  }, [prefersReducedMotion, onComplete]);

  // step: 0 = icon pulse, 1 = tagline, 2 = welcome text, 3 = done
  const [step, setStep] = useReducer((s) => s + 1, 0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    // Sequence timings
    const timers = [
      setTimeout(() => setStep(), 800),   // show tagline
      setTimeout(() => setStep(), 1700),  // show username greeting
      setTimeout(() => onComplete(), 3200), // transition to dashboard
    ];
    return () => timers.forEach(clearTimeout);
  }, [prefersReducedMotion, onComplete]);

  if (prefersReducedMotion) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Animated grid dots */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-b-full blur-3xl" />

      <div className="text-center relative z-10 flex flex-col items-center gap-6">

        {/* Charging Icon with pulse ring */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative"
        >
          {/* Pulse ring */}
          <motion.span
            className="absolute inset-0 rounded-2xl bg-emerald-500/30"
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-2xl shadow-emerald-500/40">
            <BatteryCharging className="w-10 h-10 text-white stroke-[2]" />
          </div>
        </motion.div>

        {/* Charging pulse trail */}
        <AnimatePresence>
          {step >= 0 && (
            <motion.div
              key="pulse"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 160, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full"
            />
          )}
        </AnimatePresence>

        {/* Title */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="flex flex-col items-center gap-1"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Welcome to
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                VoltPulse<span className="text-emerald-400">ML</span>
              </h1>
              <p className="text-slate-400 text-sm">EV Charging Analytics Dashboard</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Username greeting */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25"
            >
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span className="text-white font-semibold text-base">
                Hello, <span className="text-emerald-400">{username}</span>!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading bar */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-44 h-1 rounded-full bg-slate-800 overflow-hidden"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.3, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.8 }}
        onClick={onComplete}
        className="absolute bottom-8 right-8 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Skip animation"
      >
        <SkipForward className="w-3.5 h-3.5" />
        Skip
      </motion.button>
    </div>
  );
};

export default WelcomeAnimation;
