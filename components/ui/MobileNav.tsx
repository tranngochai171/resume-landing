'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Ledger', href: '#timeline' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
];

const SOCIAL = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/topytran', external: true },
  { label: 'GitHub', href: 'https://github.com/tranngochai171', external: true },
  { label: 'Download Resume', href: '/resume/Topy_Tran_Resume_2026_AI_Workflows.pdf', external: false, download: true },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-drawer"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className="relative z-[70] flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className={`block h-px w-6 bg-fg transition-transform ${open ? 'translate-y-[3px] rotate-45' : ''}`} />
        <span className={`block h-px w-6 bg-fg transition-transform ${open ? '-translate-y-[3px] -rotate-45' : ''}`} />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-drawer"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
              className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-bg/95 px-6 backdrop-blur-2xl md:hidden"
            >
              <nav className="flex flex-col items-center gap-6">
                {LINKS.map((l, i) => (
                  <motion.a
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.04, duration: 0.25 }}
                    className="font-display text-4xl font-light tracking-tight text-fg transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    {l.label}
                  </motion.a>
                ))}
              </nav>
              <div className="h-px w-12 bg-fg-subtle/40" />
              <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
                {SOCIAL.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    {...(s.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    {...(s.download ? { download: true } : {})}
                    onClick={() => setOpen(false)}
                    className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
