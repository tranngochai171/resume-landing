'use client';

import { motion } from 'framer-motion';
import { SectionNumber } from '@/components/ui/SectionNumber';
import { roles } from '@/lib/timeline-data';

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
  return (
    <section className="bg-bg px-6 py-24 md:px-12 md:py-48">
      <div className="mx-auto max-w-content">
        <SectionNumber number="02" title="Ledger" />
        <motion.ul
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="divide-y divide-fg-subtle/30"
        >
          {roles.map((r) => (
            <motion.li
              key={`${r.dates}-${r.company}`}
              variants={row}
              whileHover={{ y: -2 }}
              className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-4 py-4 font-mono text-xs uppercase tracking-widest text-fg-muted tabular-nums transition-colors hover:text-fg md:text-sm"
            >
              <span className="text-fg-subtle">{r.dates}</span>
              <span>{r.role}</span>
              <span className="text-fg">{r.company}</span>
              <span className="text-right text-fg-subtle">{r.location}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
