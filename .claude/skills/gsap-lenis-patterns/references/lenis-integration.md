# Lenis + ScrollTrigger Integration

The trickiest wiring in the project. Get it wrong and scroll breaks silently.

## The Recipe

```tsx
// components/motion/SmoothScrollProvider.tsx
'use client';

import { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });

    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
```

## Why this works

1. `gsap.ticker` drives Lenis via `raf()` — single RAF loop, no conflict
2. `lenis.on('scroll', ScrollTrigger.update)` — ScrollTrigger stays in sync
3. `smoothTouch: false` — native iOS scroll on touch
4. Reduced-motion early-return — no Lenis at all
5. Cleanup kills both the ticker callback and the Lenis instance

## Never do this

- `new Lenis({ smoothTouch: true })` — breaks iOS overscroll
- Running Lenis without `gsap.ticker.add(raf)` — ScrollTrigger will desync
- Forgetting to remove the raf callback on unmount — memory leak + two Lenis instances
