'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'curtainSeen';

export function LoadCurtain() {
  // Start visible on first render so SSR HTML covers the hero before hydration.
  // useEffect then dismisses (immediately if seen/reduce-motion, else after 1.1s).
  const [visible, setVisible] = useState(true);
  const [animated, setAnimated] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = sessionStorage.getItem(SESSION_KEY);

    if (reduce || seen) {
      setAnimated(false);
      setVisible(false);
      return;
    }

    sessionStorage.setItem(SESSION_KEY, '1');
    document.documentElement.style.overflow = 'hidden';
    const t = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (visible) return;
    document.documentElement.style.overflow = '';
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          initial={{ y: 0 }}
          exit={animated ? { y: '-100%' } : { opacity: 0 }}
          transition={animated ? { duration: 0.5, ease: [0.7, 0, 0.2, 1] } : { duration: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="font-display text-[clamp(4rem,12vw,8rem)] font-light leading-none text-fg"
          >
            T
          </motion.span>
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 0.5, width: 48 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-4 h-px bg-accent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
