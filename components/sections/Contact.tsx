'use client';

import { SplitReveal } from '@/components/motion/SplitReveal';
import { FadeUp } from '@/components/motion/FadeUp';

export function Contact() {
  return (
    <section
      id="contact"
      className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-24 text-center md:px-12"
    >
      <FadeUp as="p" className="mb-8 font-mono text-xs uppercase tracking-widest text-fg-muted">
        Get in Touch
      </FadeUp>

      <a
        href="mailto:tranngochai171@gmail.com"
        className="group relative inline-block"
      >
        <SplitReveal
          trigger="scroll"
          stagger={0.04}
          className="font-display text-4xl font-light leading-none tracking-tight text-fg transition-colors group-hover:text-accent md:text-7xl lg:text-8xl"
        >
          tranngochai171@gmail.com
        </SplitReveal>
      </a>

      <FadeUp
        as="div"
        className="mt-16 flex flex-wrap items-center justify-center gap-6 font-mono text-xs uppercase tracking-widest text-fg-muted md:gap-10"
      >
        <a
          href="https://linkedin.com/in/topytran"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-accent"
        >
          LinkedIn
        </a>
        <span className="text-fg-subtle">·</span>
        <a
          href="https://github.com/tranngochai171"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-accent"
        >
          GitHub
        </a>
        <span className="text-fg-subtle">·</span>
        <a
          href="/resume/Topy_Tran_Resume_2026.pdf"
          download
          className="transition-colors hover:text-accent"
        >
          Download Resume (PDF)
        </a>
      </FadeUp>

      <FadeUp as="p" className="mt-24 font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
        Ho Chi Minh City · 2026
      </FadeUp>
    </section>
  );
}
