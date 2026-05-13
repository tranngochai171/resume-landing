'use client';

import { useRef, useState, useEffect } from 'react';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { FadeUp } from '@/components/motion/FadeUp';
import { track } from '@/lib/analytics/track';
import { useSectionView } from '@/hooks/useSectionView';

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  useSectionView('contact', ref);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px 100% 0px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="contact"
      className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 py-24 text-center md:px-12"
    >
      {mounted && (
        <>
          <video
            src="/videos/contact-ambient-mobile.mp4"
            poster="/images/contact-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-25 mix-blend-screen motion-reduce:hidden md:hidden"
          />
          <video
            src="/videos/contact-ambient.mp4"
            poster="/images/contact-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full object-cover opacity-25 mix-blend-screen motion-reduce:hidden md:block"
          />
        </>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #000 85%)' }}
      />

      <FadeUp as="p" className="mb-8 font-mono text-xs uppercase tracking-widest text-fg-muted">
        Contact
      </FadeUp>

      <a
        href="mailto:tranngochai171@gmail.com"
        onClick={() => track('contact_email')}
        className="group relative inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <SplitReveal
          trigger="scroll"
          stagger={0.04}
          className="block font-display text-[clamp(2rem,9vw,5rem)] font-light leading-[0.95] tracking-tight text-fg transition-colors group-hover:text-accent"
        >
          tranngochai171
        </SplitReveal>
        <SplitReveal
          trigger="scroll"
          stagger={0.04}
          className="block font-display text-[clamp(2rem,9vw,5rem)] font-light leading-[0.95] tracking-tight text-fg-muted transition-colors group-hover:text-accent"
        >
          @gmail.com
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
          onClick={() => track('contact_social', { network: 'linkedin' })}
          className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          LinkedIn
        </a>
        <span className="text-fg-subtle">·</span>
        <a
          href="https://github.com/tranngochai171"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('contact_social', { network: 'github' })}
          className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          GitHub
        </a>
        <span className="text-fg-subtle">·</span>
        <a
          href="/resume/Topy_Tran_Resume_2026_AI_Workflows.pdf"
          download
          onClick={() => track('resume_download', { source: 'contact' })}
          className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Download Resume (PDF)
        </a>
      </FadeUp>

    </section>
  );
}
