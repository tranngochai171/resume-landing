'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  start?: string;
}

export function ScrollDesaturate({
  children,
  className,
  duration = 0.9,
  start = 'top 80%',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      el.style.filter = 'none';
      return;
    }

    el.style.filter = 'grayscale(100%) brightness(0.85)';

    const st = ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () => {
        gsap.to(el, {
          filter: 'grayscale(0%) brightness(1)',
          duration,
          ease: 'power2.out',
        });
      },
    });

    return () => {
      st.kill();
    };
  }, [duration, start]);

  return (
    <div ref={ref} className={className} data-scroll-desaturate>
      {children}
    </div>
  );
}
