'use client';

import { motion } from 'framer-motion';
import { SectionNumber } from '@/components/ui/SectionNumber';
import { skillGroups } from '@/lib/skills-data';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const pill = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.33, 1, 0.68, 1] as const },
  },
};

export function Skills() {
  return (
    <section id="skills" className="bg-bg px-6 py-24 md:px-12 md:py-48">
      <div className="mx-auto max-w-content">
        <SectionNumber number="04" title="Stack" />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="space-y-8"
        >
          {skillGroups.map((g) => (
            <div
              key={g.label}
              className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr] md:gap-8"
            >
              <span className="font-mono text-xs uppercase tracking-widest text-fg-subtle">
                {g.label}
              </span>
              <div className="flex flex-wrap gap-2">
                {g.items.map((item) => (
                  <motion.span
                    key={item}
                    variants={pill}
                    className="rounded-full border border-fg-subtle px-3 py-1 font-body text-sm text-fg-muted"
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
