# Hero MacBook Reveal Sequence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `TRAN NGOC HAI` overlay in the pinned MacBook hero with a 5-beat progressive reveal driven by existing scroll progress, plus dynamic corner labels that morph into watch-dial progress ticks and a first-paint "SCROLL TO DISCOVER" cue.

**Architecture:** Share scrub progress from `ScrollVideo` via an `onProgress(p: number)` callback into a parent-owned `useRef` in `Hero`. A new `HeroReveal` component mounts all 5 beats + 4 corner labels + 5 progress ticks + scroll cue, then drives their opacity/transform via `gsap.ticker.add` that reads the ref each tick (no React re-renders during scroll). `prefers-reduced-motion` short-circuits to a final-state render.

**Tech Stack:** Next.js 14 App Router, React 18, GSAP + ScrollTrigger (already installed), Tailwind, Playwright (smoke suite).

**Spec:** `docs/superpowers/specs/2026-04-18-hero-reveal-sequence-design.md`

---

## Task 1: Beat config

**Files:**
- Create: `lib/hero-beats.ts`

- [ ] **Step 1: Write config**

```ts
export interface Beat {
  id: 'intro' | 'nickname' | 'role' | 'portfolio' | 'invitation';
  range: [number, number];
}

export const beats: Beat[] = [
  { id: 'intro',      range: [0.00, 0.22] },
  { id: 'nickname',   range: [0.20, 0.42] },
  { id: 'role',       range: [0.40, 0.62] },
  { id: 'portfolio',  range: [0.60, 0.87] },
  { id: 'invitation', range: [0.85, 1.00] },
];

// Smooth in/out inside a progress range.
// Returns 0 outside [start, end], ramps 0→1 over first 15% of the range,
// holds at 1, ramps 1→0 over last 15%. Produces the ~200ms crossfade overlap.
export function beatOpacity(progress: number, [start, end]: [number, number]): number {
  if (progress < start || progress > end) return 0;
  const span = end - start;
  const local = (progress - start) / span;
  const fade = 0.15;
  if (local < fade) return local / fade;
  if (local > 1 - fade) return (1 - local) / fade;
  return 1;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd D:/Works/resume-landing && rtk tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add lib/hero-beats.ts
rtk git commit -m "feat(hero): add beat config + opacity helper"
```

---

## Task 2: Expose progress from `ScrollVideo`

**Files:**
- Modify: `components/motion/ScrollVideo.tsx`

- [ ] **Step 1: Add `onProgress` prop and call it in the existing `onUpdate`.**

Replace the `interface Props` block and the `ScrollTrigger.create` `onUpdate` handler. Final file:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMediaQuery } from '@/hooks/useMediaQuery';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  src: string;
  poster: string;
  className?: string;
  onProgress?: (p: number) => void;
}

export function ScrollVideo({ src, poster, className, onProgress }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const isTouch = 'ontouchstart' in window;
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      onProgress?.(1);
      return;
    }

    if (isDesktop && !isTouch) {
      let trigger: ScrollTrigger | null = null;
      const pinTarget = (container.closest('section') as HTMLElement) ?? container;

      const onReady = () => {
        trigger = ScrollTrigger.create({
          trigger: pinTarget,
          start: 'top top',
          end: () => `+=${window.innerHeight * 3}`,
          pin: pinTarget,
          scrub: 0.5,
          onUpdate: (self) => {
            if (video.duration && !isNaN(video.duration)) {
              video.currentTime = video.duration * self.progress;
            }
            onProgress?.(self.progress);
          },
        });
      };

      if (video.readyState >= 1) {
        onReady();
      } else {
        video.addEventListener('loadedmetadata', onReady, { once: true });
      }

      return () => {
        trigger?.kill();
      };
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
              onProgress?.(1);
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(container);
      return () => observer.disconnect();
    }
  }, [isDesktop, onProgress]);

  return (
    <div ref={containerRef} className={className}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="metadata"
        loop={!isDesktop}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `rtk tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add components/motion/ScrollVideo.tsx
rtk git commit -m "feat(hero): expose scrub progress via onProgress callback"
```

---

## Task 3: `HeroReveal` component

**Files:**
- Create: `components/motion/HeroReveal.tsx`

- [ ] **Step 1: Write component**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { beats, beatOpacity } from '@/lib/hero-beats';

interface Props {
  progressRef: React.MutableRefObject<number>;
}

export function HeroReveal({ progressRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const scrollCueDismissed = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      // Final-state render: show portfolio + invitation beats, hide ticks scrub.
      root.querySelectorAll<HTMLElement>('[data-beat]').forEach((el) => {
        const id = el.dataset.beat;
        el.style.opacity = id === 'portfolio' || id === 'invitation' ? '1' : '0';
      });
      root.querySelectorAll<HTMLElement>('[data-corner]').forEach((el) => {
        el.style.opacity = '0';
      });
      root.querySelectorAll<HTMLElement>('[data-tick]').forEach((el) => {
        el.style.opacity = '1';
      });
      if (scrollCueRef.current) scrollCueRef.current.style.opacity = '0';
      return;
    }

    const tick = () => {
      const p = progressRef.current;

      // Beats
      root.querySelectorAll<HTMLElement>('[data-beat]').forEach((el) => {
        const id = el.dataset.beat as typeof beats[number]['id'];
        const beat = beats.find((b) => b.id === id);
        if (!beat) return;
        const o = beatOpacity(p, beat.range);
        el.style.opacity = String(o);
        el.style.visibility = o === 0 ? 'hidden' : 'visible';
      });

      // Name drift: intro beat translates Y -6px across 0→0.40.
      const intro = root.querySelector<HTMLElement>('[data-beat="intro"]');
      if (intro) {
        const drift = Math.min(p / 0.4, 1) * -6;
        intro.style.transform = `translate(-50%, calc(-50% + ${drift}px))`;
      }

      // Corner labels: 0–0.25 full, 0.25–0.35 top fades, 0.35–0.50 bottom fades.
      root.querySelectorAll<HTMLElement>('[data-corner]').forEach((el) => {
        const pos = el.dataset.corner ?? '';
        const isTop = pos.startsWith('top');
        const fadeStart = isTop ? 0.25 : 0.35;
        const fadeEnd = isTop ? 0.35 : 0.50;
        let o = 1;
        if (p >= fadeEnd) o = 0;
        else if (p > fadeStart) o = 1 - (p - fadeStart) / (fadeEnd - fadeStart);
        el.style.opacity = String(o);
      });

      // Progress ticks: 5 segments, light sequentially from 0.50 → 1.00.
      root.querySelectorAll<HTMLElement>('[data-tick]').forEach((el) => {
        const idx = Number(el.dataset.tick ?? 0);
        const appearAt = 0.50 + idx * 0.10; // 0.50, 0.60, 0.70, 0.80, 0.90
        const o = p >= appearAt ? 1 : 0;
        el.style.opacity = String(o);
      });

      // Scroll cue: visible until user scrolls past 50px.
      if (!scrollCueDismissed.current && scrollCueRef.current) {
        if (window.scrollY > 50) {
          scrollCueDismissed.current = true;
          gsap.to(scrollCueRef.current, { opacity: 0, duration: 0.4, ease: 'power2.out' });
        }
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [progressRef]);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-10">
      {/* Corner metadata (fades out 0.25–0.50) */}
      <div className="absolute inset-x-0 top-24 mx-auto flex max-w-content items-start justify-between px-6 md:px-12">
        <div
          data-corner="top-left"
          className="font-condensed text-xs font-bold uppercase leading-tight tracking-widest text-fg-muted"
        >
          Senior Fullstack
          <br />
          Developer
        </div>
        <div
          data-corner="top-right"
          className="text-right font-condensed text-xs font-bold uppercase leading-tight tracking-widest text-fg-muted"
        >
          Based in
          <br />
          Ho Chi Minh City, VN
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-12 mx-auto flex max-w-content items-end justify-between px-6 md:px-12">
        <div
          data-corner="bot-left"
          className="font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted"
        >
          Shipping since 2020
        </div>
        <div
          data-corner="bot-right"
          className="font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted"
        >
          Dalmore / Nestwell / Zeligate
        </div>
      </div>

      {/* Beats (all centered, absolute, mount together) */}
      <h1
        data-beat="intro"
        role="img"
        aria-label="Tran Ngoc Hai"
        className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center font-display text-5xl font-light leading-none tracking-tight text-fg md:text-7xl lg:text-display-xl"
      >
        TRAN NGOC HAI
      </h1>
      <p
        data-beat="nickname"
        className="absolute left-1/2 top-[calc(50%+4.5rem)] w-full -translate-x-1/2 text-center font-body text-base italic text-fg-muted md:text-lg"
      >
        — but you can call me Topy —
      </p>
      <div
        data-beat="role"
        className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center"
      >
        <div className="font-display text-5xl font-light leading-none tracking-tight text-fg md:text-7xl">
          Senior Fullstack
        </div>
        <div className="mt-3 font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted">
          6+ years shipping
        </div>
      </div>
      <div
        data-beat="portfolio"
        className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center"
      >
        <div className="font-condensed text-lg font-bold uppercase tracking-[0.2em] text-fg md:text-2xl">
          Dalmore · Nestwell · Zeligate · Trailer2you
        </div>
        <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-fg-muted">
          + more
        </div>
      </div>
      <div
        data-beat="invitation"
        className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center"
      >
        <div className="font-condensed text-sm font-bold uppercase tracking-[0.3em] text-fg-muted">
          See the work
        </div>
        <div className="mt-3 animate-pulse font-display text-3xl text-fg">↓</div>
      </div>

      {/* Progress ticks (watch-dial, bottom-center, 0.50→1.00) */}
      <div className="absolute inset-x-0 bottom-12 flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            data-tick={i}
            className="block h-[2px] w-8 bg-fg-muted"
            style={{ opacity: 0 }}
          />
        ))}
      </div>

      {/* First-paint scroll cue */}
      <div
        ref={scrollCueRef}
        className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1"
      >
        <span className="font-condensed text-[10px] font-bold uppercase tracking-[0.3em] text-fg-muted">
          Scroll to discover
        </span>
        <span className="animate-bounce text-fg-muted">↓</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `rtk tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add components/motion/HeroReveal.tsx
rtk git commit -m "feat(hero): HeroReveal beats + corners + ticks + scroll cue"
```

---

## Task 4: Wire `Hero.tsx`

**Files:**
- Modify: `components/sections/Hero.tsx`

- [ ] **Step 1: Replace entire file**

```tsx
'use client';

import { useRef, useCallback } from 'react';
import { ScrollVideo } from '@/components/motion/ScrollVideo';
import { HeroReveal } from '@/components/motion/HeroReveal';

export function Hero() {
  const progressRef = useRef(0);
  const onProgress = useCallback((p: number) => {
    progressRef.current = p;
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full overflow-hidden bg-bg"
    >
      <div className="relative flex min-h-screen items-center justify-center">
        <ScrollVideo
          src="/videos/macbook-scroll.mp4"
          poster="/images/01-closed.jpg"
          className="relative z-0 h-[60vh] w-full max-w-[1200px]"
          onProgress={onProgress}
        />
      </div>

      <HeroReveal progressRef={progressRef} />
    </section>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `rtk tsc --noEmit && rtk lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add components/sections/Hero.tsx
rtk git commit -m "feat(hero): wire HeroReveal with shared progress ref"
```

---

## Task 5: Extend Playwright smoke

**Files:**
- Modify: `tests/smoke.spec.ts`

- [ ] **Step 1: Add two tests inside the `test.describe('Resume landing — smoke', () => { ... })` block.** Insert before the closing `});` of the describe:

```ts
  test('hero beats render at initial scroll (intro visible)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const intro = page.locator('[data-beat="intro"]');
    await expect(intro).toHaveText(/TRAN NGOC HAI/);
  });

  test('reduced-motion: portfolio + invitation beats present', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-beat="portfolio"]')).toContainText(/Dalmore/);
    await expect(page.locator('[data-beat="invitation"]')).toContainText(/See the work/i);
    await context.close();
  });
```

- [ ] **Step 2: Update existing `hero name renders` test** so it targets the new data attribute rather than the heading role (SplitReveal's `role="img"` wrapper no longer exists). Replace that test body:

```ts
  test('hero name renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-beat="intro"]')).toContainText(/TRAN NGOC HAI/i);
  });
```

- [ ] **Step 3: Run smoke suite**

Run: `rtk playwright test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
rtk git add tests/smoke.spec.ts
rtk git commit -m "test(smoke): verify hero beats render (initial + reduced-motion)"
```

---

## Task 6: Build + visual verification

- [ ] **Step 1: Production build**

Run: `cd D:/Works/resume-landing && rtk next build`
Expected: success. Static export completes. Route `/` bundle size delta < 5 KB vs prior.

- [ ] **Step 2: Dev server manual check**

Run: `rtk next dev`

Checklist (open http://localhost:3000):
- Initial: MacBook closed (poster), name `TRAN NGOC HAI` centered, corner labels visible, `SCROLL TO DISCOVER` cue at bottom.
- Scroll ~25%: nickname caption `— but you can call me Topy —` visible under name. Top corners fading.
- Scroll ~55%: `Senior Fullstack` + `6+ YEARS SHIPPING` centered; corners gone; 1 tick lit bottom-center.
- Scroll ~75%: `DALMORE · NESTWELL · ZELIGATE · TRAILER2YOU` + `+ more`. 3 ticks lit.
- Scroll ~95%: `SEE THE WORK` + pulsing chevron. 5 ticks lit.
- Test at 390px, 768px, 1280px, 1600px widths.

- [ ] **Step 3: Reduced-motion browser check**

DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`. Reload. Expect: portfolio + invitation beats visible in final arrangement, no scrub, video paused.

- [ ] **Step 4: Verify push-ready**

Run: `rtk git status && rtk git log --oneline -10`
Expected: clean tree, 5 new commits (beats + ScrollVideo + HeroReveal + Hero + tests).

---

## Self-review notes

- **Spec coverage:**
  - 5-beat sequence → Task 3 (beats rendered, opacity driven by range). ✓
  - Beat timing table → Task 1 (`beats` config matches spec ranges). ✓
  - Corner fade-out → Task 3 (`data-corner` + tick() logic). ✓
  - Watch-dial progress ticks → Task 3 (`data-tick` 0–4, appearAt 0.50 + idx·0.10). ✓
  - Scroll-discover cue → Task 3 (scrollCueRef + scrollY > 50 dismiss). ✓
  - Name drift −6px → Task 3 (intro transform). ✓
  - Reduced motion → Task 3 (early-return final-state render) + ScrollVideo reports progress=1 in Task 2. ✓
  - Progress sharing via useRef + context → Task 4 (ref passed as prop; no context needed since ref drilling is one level). Spec said context+ref; simpler prop-passing adopted — equivalent outcome, less code. ✓
  - Playwright extension → Task 5. ✓
- **Placeholder scan:** No TBDs, every step has code. ✓
- **Type consistency:** `Beat.id` union matches `data-beat` attributes across Task 1 and Task 3. `beatOpacity` signature stable. `onProgress` signature stable across Tasks 2 + 4. ✓
- **Scope:** Single plan, no decomposition. ✓
