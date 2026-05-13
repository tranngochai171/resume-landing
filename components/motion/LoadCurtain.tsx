'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'curtainSeen';

export function LoadCurtain() {
  const [visible, setVisible] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const r = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduce(r);
    if (r) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(true);
    document.documentElement.style.overflow = 'hidden';
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 1100);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (visible) return;
    document.documentElement.style.overflow = '';
  }, [visible]);

  if (reduce) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.5, ease: [0.7, 0, 0.2, 1] }}
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
