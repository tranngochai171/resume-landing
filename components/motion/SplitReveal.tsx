'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(SplitText, ScrollTrigger);

type SplitTag = 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'blockquote' | 'a';

interface Props {
  children: React.ReactNode;
  as?: SplitTag;
  className?: string;
  stagger?: number;
  trigger?: 'mount' | 'scroll';
  splitBy?: 'chars' | 'words';
}

export function SplitReveal({
  children,
  as = 'div',
  className,
  stagger = 0.04,
  trigger = 'mount',
  splitBy = 'chars',
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as React.ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) return;

    const split = new SplitText(el, {
      type: splitBy,
    });

    const targets = splitBy === 'chars' ? split.chars : split.words;

    const animate = () =>
      gsap.fromTo(
        targets,
        { opacity: 0, y: 24, filter: 'blur(8px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          ease: 'expo.out',
          stagger,
        }
      );

    let st: ScrollTrigger | null = null;

    if (trigger === 'mount') {
      animate();
    } else {
      st = ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        once: true,
        onEnter: animate,
      });
    }

    return () => {
      st?.kill();
      split.revert();
    };
  }, [stagger, trigger, splitBy]);

  return <Tag ref={ref as any} className={className}>{children}</Tag>;
}
