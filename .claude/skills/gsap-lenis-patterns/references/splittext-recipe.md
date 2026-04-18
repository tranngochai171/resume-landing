# SplitText Recipe

GSAP SplitText shipped broken on component re-mount — always splits, never reverts. Must cleanup manually.

## Component

```tsx
// components/motion/SplitReveal.tsx
'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(SplitText, ScrollTrigger);

interface Props {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  stagger?: number;
  trigger?: 'mount' | 'scroll';
  splitBy?: 'chars' | 'words';
}

export function SplitReveal({
  children,
  as: Tag = 'div',
  className,
  stagger = 0.04,
  trigger = 'mount',
  splitBy = 'chars',
}: Props) {
  const ref = useRef<HTMLElement>(null);

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
```

## Gotchas

1. **`split.revert()` is REQUIRED on unmount** — else re-mounted components accumulate split DOM nodes
2. **SplitText was a paid plugin in GSAP 3.x** — free as of GSAP 3.13. Check `node_modules/gsap/SplitText.js` exists before relying on it.
3. **iOS Safari + SplitText filter blur** — blur is GPU-heavy; keep stagger tight (0.04s) to limit concurrent blurs

## Free SplitText alternative

If GSAP SplitText isn't available, use this DIY approach:

```tsx
const text = typeof children === 'string' ? children : '';
const chars = Array.from(text).map((c, i) => (
  <span key={i} className="inline-block opacity-0 translate-y-6 blur-sm">
    {c === ' ' ? '\u00A0' : c}
  </span>
));

// animate with gsap.to on the span refs via a useEffect
```
