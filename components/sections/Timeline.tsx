'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { SectionNumber } from '@/components/ui/SectionNumber';
import { roles } from '@/lib/timeline-data';
import { useSectionView } from '@/hooks/useSectionView';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const row = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] as const },
  },
};

export function Timeline() {
  const ref = useRef<HTMLElement>(null);
  useSectionView('timeline', ref);

  return (
    <section ref={ref} id="timeline" className="bg-bg px-6 py-24 md:px-12 md:py-48">
      <div className="mx-auto max-w-content">
        <SectionNumber number="03" title="Ledger" />
        <motion.ul
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="divide-y divide-fg-subtle/30"
        >
          {roles.map((r, idx) => (
            <motion.li
              key={`${r.dates}-${r.company}`}
              variants={row}
              whileHover={{ y: -2 }}
              className="group flex items-start gap-3 py-5 font-mono text-xs uppercase tracking-widest text-fg-muted tabular-nums transition-colors hover:text-fg md:grid md:grid-cols-[12px_auto_1fr_1fr_auto] md:items-center md:gap-4 md:py-4 md:text-sm"
            >
              <span
                aria-hidden
                className={
                  (idx === 0
                    ? 'bg-accent group-hover:w-3 group-hover:rounded-sm'
                    : 'bg-transparent group-hover:bg-accent/60') +
                  ' mt-1 h-1.5 w-1.5 shrink-0 rounded-full transition-all md:mt-0'
                }
              />
              <div className="flex flex-1 flex-col gap-1 md:contents">
                <div className="flex items-baseline justify-between gap-3 md:contents">
                  <span className="text-fg-subtle">{r.dates}</span>
                  <span className="text-right text-fg-subtle md:order-last md:text-right">
                    {r.location}
                  </span>
                </div>
                <span>{r.role}</span>
                <span className="text-fg">{r.company}</span>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
