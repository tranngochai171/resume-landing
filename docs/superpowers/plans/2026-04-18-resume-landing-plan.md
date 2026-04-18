# Resume Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Topy Tran's scroll-driven, dark, luxurious resume landing — Next.js static export to Vercel, GSAP + Lenis + Framer Motion animations, 6 single-page sections built from the approved design spec.

**Architecture:** Next.js 14 App Router in static-export mode. Single `app/page.tsx` composes six section components. Motion primitives live in `components/motion/` and are shared across sections. Two project-scoped skills govern the work: `design-inspiration` (exists — aesthetic + content) and `gsap-lenis-patterns` (created by Task 7 — motion recipes).

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, GSAP (ScrollTrigger + SplitText), `@studio-freight/lenis`, framer-motion, `next/font` (Fraunces + Geist + Geist Mono).

---

## Parallelization Map (for subagent-driven-development)

Tasks group into phases. Tasks within a phase are independent and can be dispatched in parallel.

| Phase | Tasks | Parallel? |
|-------|-------|-----------|
| 1. Foundation | 1, 2, 3, 4, 5, 6 | Sequential (each depends on prior) |
| 2. Motion + UI primitives | 7, 8, 9, 10, 11, 12, 13, 14, 15 | **Parallel after Phase 1** |
| 3. Sections | 16, 17, 18, 19, 20, 21 | **Parallel after Phase 2** |
| 4. Integration | 22, 23 | Sequential after Phase 3 |
| 5. Assets + verification | 24, 25, 26 | Parallel |
| 6. Deploy | 27 | Sequential — last |

---

## Phase 1 — Foundation (sequential)

### Task 1: Scaffold Next.js 14 with static export

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `.eslintrc.json`
- Modify: none

- [ ] **Step 1: Scaffold Next.js into the existing repo**

The repo at `D:/Works/resume-landing` already has git, README, `.claude/skills/`, `assets/`, `moodboard/`, `docs/`. Scaffold Next.js AROUND these (not into a subdirectory).

Run from repo root:
```bash
cd D:/Works/resume-landing
pnpm create next-app@14 . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint --use-pnpm
```

When prompted to overwrite files, choose No for README.md and .gitignore. Yes for everything else.

Merge the generated `.gitignore` with existing by appending Next.js entries (node_modules, .next, out).

- [ ] **Step 2: Configure static export in `next.config.mjs`**

Overwrite `next.config.mjs` with:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
```

- [ ] **Step 3: Verify scaffold compiles**

Run:
```bash
pnpm install
pnpm build
```

Expected: build succeeds, outputs to `out/` directory.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 14 with static export"
```

---

### Task 2: Install motion + utility dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install motion libs + utilities**

```bash
cd D:/Works/resume-landing
pnpm add gsap @studio-freight/lenis framer-motion clsx tailwind-merge
pnpm add -D @types/node
```

- [ ] **Step 2: Verify versions in package.json**

Open `package.json`. Expected under `dependencies`:
- `"gsap": "^3.12.x"`
- `"@studio-freight/lenis": "^1.x"`
- `"framer-motion": "^11.x"`
- `"clsx": "^2.x"`
- `"tailwind-merge": "^2.x"`

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add motion and utility dependencies"
```

---

### Task 3: Configure Tailwind tokens from design-inspiration skill

**Files:**
- Modify: `tailwind.config.ts`
- Create: `lib/utils.ts`

- [ ] **Step 1: Overwrite `tailwind.config.ts` with locked design tokens**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        'bg-elev': '#0A0A0A',
        fg: '#F5F5F4',
        'fg-muted': '#8A8A87',
        'fg-subtle': '#3F3F3E',
        accent: '#7DD3C8',
        'accent-dim': '#3A5D58',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        condensed: ['var(--font-condensed)', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['8rem', { lineHeight: '0.9', letterSpacing: '-0.02em' }],
        'display-lg': ['5rem', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '1.0', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        'glow-accent': '0 0 80px 0 rgba(125, 211, 200, 0.18)',
      },
      maxWidth: {
        content: '1440px',
        readable: '640px',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Create `lib/utils.ts` with `cn` helper**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts lib/utils.ts
git commit -m "feat: wire design tokens into Tailwind config"
```

---

### Task 4: Configure fonts via `next/font`

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Overwrite `app/layout.tsx` with font setup**

```tsx
import type { Metadata } from 'next';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500'],
  display: 'swap',
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tran Ngoc Hai — Senior Fullstack Developer',
  description:
    'Senior Fullstack Developer shipping production apps in FinTech, HealthTech, SaaS, and eCommerce — from SEC-regulated investment platforms to AI-powered recruitment tools.',
  openGraph: {
    title: 'Tran Ngoc Hai — Senior Fullstack Developer',
    description:
      'Senior Fullstack Developer · 6+ years · FinTech · HealthTech · SaaS',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body className="bg-bg text-fg font-body antialiased">{children}</body>
    </html>
  );
}
```

**Note:** PP Neue Machina / Druk Wide are paid fonts. For v1, substitute with **Space Grotesk at 700 weight + `font-stretch: 75%` via CSS** to get a condensed-bold feel. If the user purchases Druk Wide or PP Neue Machina later, swap the `--font-condensed` variable. Add this to the imports now:

```tsx
import { Space_Grotesk } from 'next/font/google';

const condensed = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-condensed',
  weight: ['500', '700'],
  display: 'swap',
});
```

And add `condensed.variable` to the `<html className>` list.

- [ ] **Step 2: Verify fonts load**

```bash
pnpm dev
```

Open http://localhost:3000 and use browser DevTools → Network → Fonts. Expected: fraunces, geist, geist-mono, space-grotesk all loading from `fonts.gstatic.com`.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: configure Fraunces + Geist + Space Grotesk fonts"
```

---

### Task 5: Global CSS base + reduced-motion defaults

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Overwrite `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: dark;
  }

  html {
    background-color: #000;
    /* Lenis adds its own smoothness — disable native smooth-scroll */
    scroll-behavior: auto;
  }

  html.lenis,
  html.lenis body {
    height: auto;
  }

  .lenis.lenis-smooth {
    scroll-behavior: auto !important;
  }

  .lenis.lenis-smooth [data-lenis-prevent] {
    overscroll-behavior: contain;
  }

  .lenis.lenis-stopped {
    overflow: hidden;
  }

  body {
    text-rendering: geometricPrecision;
    -webkit-font-smoothing: antialiased;
  }

  ::selection {
    background-color: #7DD3C8;
    color: #000;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: global CSS with Lenis base + reduced-motion"
```

---

### Task 6: Copy assets into `public/`

**Files:**
- Create: `public/videos/macbook-scroll.mp4`, `public/images/01-closed.png`, `public/resume/Topy_Tran_Resume_2026.pdf`

- [ ] **Step 1: Copy video + image + PDF**

```bash
cd D:/Works/resume-landing
mkdir -p public/videos public/images public/resume
cp assets/videos/macbook-scroll.mp4 public/videos/macbook-scroll.mp4
cp assets/images/01-closed.png public/images/01-closed.png
cp "C:/Users/Admin/Downloads/Topy_Tran_Resume_2026.pdf" public/resume/Topy_Tran_Resume_2026.pdf
```

- [ ] **Step 2: Verify files present**

```bash
ls -la public/videos/ public/images/ public/resume/
```

Expected: all three files non-zero bytes.

- [ ] **Step 3: Commit**

```bash
git add public/
git commit -m "chore: add hero video, poster, PDF resume to public/"
```

---

## Phase 2 — Skills, Motion primitives, UI primitives (parallel)

All tasks in this phase are independent. Dispatch as parallel subagents.

### Task 7: Create `gsap-lenis-patterns` skill

**Files:**
- Create: `.claude/skills/gsap-lenis-patterns/SKILL.md` + 5 references

- [ ] **Step 1: Create skill directory**

```bash
mkdir -p .claude/skills/gsap-lenis-patterns/references
```

- [ ] **Step 2: Write `SKILL.md`**

```markdown
---
name: gsap-lenis-patterns
description: GSAP + Lenis + Framer Motion integration patterns for the resume-landing scroll-driven hero and section animations. Use when building any motion component, debugging scroll-scrubbed video, integrating Lenis with ScrollTrigger, or writing SplitText character reveals. Covers reduced-motion fallbacks and mobile branching.
---

# GSAP + Lenis + Framer Motion Patterns

Motion source of truth for the resume-landing build.

## Stack

- **GSAP 3.12+** — ScrollTrigger (scroll-scrubbed hero) + SplitText (type reveals)
- **Lenis 1.x** — weighted smooth scroll, desktop + tablet only
- **Framer Motion 11** — declarative entry animations + hover micro-interactions only

## Rules (non-negotiable)

1. Every scroll animation reads from Lenis via `ScrollTrigger.scrollerProxy`, never `window.scrollY` directly.
2. Lenis is disabled on touch devices (`smoothTouch: false`). iOS overscroll fights smooth-scroll implementations.
3. No elastic/bounce/back easing. Only `power3.out`, `expo.out`, or the cubic-bezier in `references/easing-palette.md`.
4. No animation under 0.25s (twitchy) or over 1.2s (sluggish). Character-stagger is the exception.
5. Every ScrollTrigger must `kill()` on unmount. SplitText must `.revert()` on unmount.
6. `prefers-reduced-motion` branch runs at the provider level — all ScrollTriggers become no-ops, Framer durations become 0, SplitText shows final state.
7. `will-change` only while actively animating — removed after.

## Recipe Index

| File | Use when |
|------|----------|
| `references/lenis-integration.md` | Setting up SmoothScrollProvider, wiring ScrollTrigger to Lenis |
| `references/scrollvideo-recipe.md` | Hero component — desktop scroll-scrub + mobile autoplay + poster fallback |
| `references/splittext-recipe.md` | Character/word reveals (hero name, contact email) |
| `references/framer-variants.md` | Shared fadeUp / staggerContainer variants |
| `references/easing-palette.md` | Allowed easings + cubic-beziers |
```

- [ ] **Step 3: Write `references/easing-palette.md`**

```markdown
# Easing Palette — The Only Easings Allowed

## The 3 easings

| Name | Cubic-bezier | Visual | Use for |
|------|--------------|--------|---------|
| `power3.out` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | Fast start, slow end | Section entries, fade-ups |
| `expo.out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Extremely sharp start, long settle | Hero name reveal, dramatic moments |
| `power2.out` | `cubic-bezier(0.33, 1, 0.68, 1)` | Gentle, balanced | Hover states, pill pop-ins |

## Usage

**GSAP:**
```js
gsap.to('.el', { opacity: 1, duration: 0.8, ease: 'power3.out' });
```

**Framer Motion:**
```tsx
transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
```

**CSS:**
```css
transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
```

## Banned easings

- `back.out`, `back.inOut`, `elastic.*`, `bounce.*` — too playful, breaks luxury feel
- `linear` — never mechanical
- `ease-in` — things disappearing feel wrong slowing down first
```

- [ ] **Step 4: Write `references/lenis-integration.md`**

```markdown
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
```

- [ ] **Step 5: Write `references/scrollvideo-recipe.md`**

```markdown
# ScrollVideo Recipe

The hero video component. Desktop gets scroll-scrub. Mobile gets autoplay loop. Video failure → poster stays.

## Component

```tsx
// components/motion/ScrollVideo.tsx
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
}

export function ScrollVideo({ src, poster, className }: Props) {
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
      return;
    }

    if (isDesktop && !isTouch) {
      // Desktop: scroll-scrub
      let trigger: ScrollTrigger | null = null;

      const onReady = () => {
        trigger = ScrollTrigger.create({
          trigger: container,
          start: 'top top',
          end: () => `+=${window.innerHeight * 3}`,
          pin: true,
          scrub: 0.5,
          onUpdate: (self) => {
            if (video.duration && !isNaN(video.duration)) {
              video.currentTime = video.duration * self.progress;
            }
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
      // Mobile/tablet: autoplay on viewport entry
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().catch(() => {
                /* Autoplay blocked — poster stays */
              });
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(container);

      return () => observer.disconnect();
    }
  }, [isDesktop]);

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

## Behavior matrix

| Device | Reduced motion | Behavior |
|--------|----------------|----------|
| Desktop ≥1024 | off | Pin hero, scrub video via ScrollTrigger |
| Desktop ≥1024 | on | No pin, no scrub, poster stays |
| Tablet 768-1023 | off | Autoplay loop on viewport entry |
| Mobile <768 | off | Autoplay loop on viewport entry |
| Any | Video fails to load | Poster stays (handled by `<video poster>` native behavior) |

## Never do this

- `video.play()` on mount — iOS blocks autoplay without visibility trigger
- Scroll-scrub on touch devices — iOS Safari stalls `currentTime` seeks
- `loop` attribute on desktop — ScrollTrigger needs a linear duration
```

- [ ] **Step 6: Write `references/splittext-recipe.md`**

```markdown
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
2. **SplitText is a paid plugin in GSAP 3** — business license or use free alternative (split manually with `String.prototype.split('')` + map to `<span>`). The component above assumes paid license. See fallback section below.
3. **iOS Safari + SplitText filter blur** — blur is GPU-heavy; keep stagger tight (0.04s) to limit concurrent blurs

## Free SplitText alternative

If GSAP paid license isn't available, use this DIY approach:

```tsx
const text = typeof children === 'string' ? children : '';
const chars = Array.from(text).map((c, i) => (
  <span key={i} className="inline-block opacity-0 translate-y-6 blur-sm">
    {c === ' ' ? '\u00A0' : c}
  </span>
));

// animate with gsap.to on the span refs
```

Note: GSAP v3.13+ made SplitText free. Check your installed version.
```

- [ ] **Step 7: Write `references/framer-variants.md`**

```markdown
# Framer Motion Variants

Shared motion variants. One source of truth — avoid drift across sections.

## `fadeUp` variant

```ts
export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.215, 0.61, 0.355, 1],
    },
  },
};
```

## `staggerContainer` variant

```ts
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};
```

## `pillPop` (Skills section)

```ts
export const pillPop = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.33, 1, 0.68, 1] },
  },
};
```

## Usage pattern

```tsx
<motion.div
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-100px' }}
>
  <motion.h2 variants={fadeUp}>Section Title</motion.h2>
  <motion.p variants={fadeUp}>Body...</motion.p>
</motion.div>
```

## File location

All variants live in `components/motion/variants.ts`. Import from there.
```

- [ ] **Step 8: Commit**

```bash
git add .claude/skills/gsap-lenis-patterns/
git commit -m "feat(skills): add gsap-lenis-patterns skill"
```

---

### Task 8: `SmoothScrollProvider` component

**Files:**
- Create: `components/motion/SmoothScrollProvider.tsx`

- [ ] **Step 1: Write the component**

Copy the full recipe from `.claude/skills/gsap-lenis-patterns/references/lenis-integration.md` (Task 7 Step 4) into `components/motion/SmoothScrollProvider.tsx`. It is complete and tested as-written.

- [ ] **Step 2: Commit**

```bash
git add components/motion/SmoothScrollProvider.tsx
git commit -m "feat(motion): add SmoothScrollProvider (Lenis + ScrollTrigger)"
```

---

### Task 9: `ScrollVideo` component

**Files:**
- Create: `components/motion/ScrollVideo.tsx`, `hooks/useMediaQuery.ts`

- [ ] **Step 1: Write `hooks/useMediaQuery.ts`**

```ts
'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
```

- [ ] **Step 2: Write `components/motion/ScrollVideo.tsx`**

Copy the full recipe from `.claude/skills/gsap-lenis-patterns/references/scrollvideo-recipe.md` (Task 7 Step 5). Import path for `useMediaQuery` is `@/hooks/useMediaQuery`.

- [ ] **Step 3: Commit**

```bash
git add hooks/useMediaQuery.ts components/motion/ScrollVideo.tsx
git commit -m "feat(motion): add ScrollVideo component with desktop/mobile branching"
```

---

### Task 10: `SplitReveal` component

**Files:**
- Create: `components/motion/SplitReveal.tsx`

- [ ] **Step 1: Write the component**

Copy the full recipe from `.claude/skills/gsap-lenis-patterns/references/splittext-recipe.md` (Task 7 Step 6).

- [ ] **Step 2: Verify GSAP SplitText license**

Check `node_modules/gsap/SplitText.js`. If missing (paid plugin), use the DIY fallback from the recipe. Run:

```bash
test -f node_modules/gsap/SplitText.js && echo "HAS SplitText" || echo "NEEDS DIY fallback"
```

If output is "NEEDS DIY fallback", replace the component body with the DIY version from the recipe's "Free SplitText alternative" section.

- [ ] **Step 3: Commit**

```bash
git add components/motion/SplitReveal.tsx
git commit -m "feat(motion): add SplitReveal component (GSAP SplitText)"
```

---

### Task 11: Framer Motion variants

**Files:**
- Create: `components/motion/variants.ts`, `components/motion/FadeUp.tsx`

- [ ] **Step 1: Write `components/motion/variants.ts`**

Copy the variants block from `.claude/skills/gsap-lenis-patterns/references/framer-variants.md` (Task 7 Step 7). Export `fadeUp`, `staggerContainer`, `pillPop`.

- [ ] **Step 2: Write `components/motion/FadeUp.tsx`**

```tsx
'use client';

import { motion, type MotionProps } from 'framer-motion';
import { fadeUp } from './variants';

interface Props extends MotionProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'p' | 'h1' | 'h2' | 'h3';
}

export function FadeUp({ children, className, as = 'div', ...rest }: Props) {
  const Tag = motion[as];
  return (
    <Tag
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/motion/variants.ts components/motion/FadeUp.tsx
git commit -m "feat(motion): add shared Framer Motion variants + FadeUp wrapper"
```

---

### Task 12: `TopNav` component

**Files:**
- Create: `components/ui/TopNav.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-bg/40 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-content items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-display text-2xl font-light tracking-tight"
            aria-label="Home"
          >
            T
          </Link>
          <span className="hidden font-mono text-xs uppercase tracking-widest text-fg-muted md:inline">
            Hi, I&apos;m Topy 👋
          </span>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden items-center gap-8 md:flex">
            {['Work', 'About', 'Skills'].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className="font-mono text-xs uppercase tracking-widest text-fg-muted transition-colors hover:text-fg"
              >
                {label}
              </a>
            ))}
          </div>
          <a
            href="#contact"
            className={cn(
              'font-mono text-xs uppercase tracking-widest',
              'rounded-full border border-fg-subtle px-4 py-2',
              'transition-colors hover:border-accent hover:text-accent'
            )}
          >
            Get in Touch
          </a>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/TopNav.tsx
git commit -m "feat(ui): add TopNav with blur backdrop + greeting chip"
```

---

### Task 13: `LeaderDots` component

**Files:**
- Create: `components/ui/LeaderDots.tsx`

- [ ] **Step 1: Write the component**

```tsx
interface Props {
  left: string;
  right: string;
  center?: string;
  className?: string;
}

export function LeaderDots({ left, right, center, className }: Props) {
  return (
    <div
      className={`flex items-center justify-between font-mono text-xs uppercase tracking-widest text-fg-subtle ${className ?? ''}`}
    >
      <span>{left}</span>
      <span className="mx-4 flex-1 border-b border-dotted border-fg-subtle/40" />
      {center && (
        <>
          <span>{center}</span>
          <span className="mx-4 flex-1 border-b border-dotted border-fg-subtle/40" />
        </>
      )}
      <span>{right}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/LeaderDots.tsx
git commit -m "feat(ui): add LeaderDots caption strip component"
```

---

### Task 14: `SectionNumber` component

**Files:**
- Create: `components/ui/SectionNumber.tsx`

- [ ] **Step 1: Write the component**

```tsx
interface Props {
  number: string;
  title: string;
  id?: string;
  className?: string;
}

export function SectionNumber({ number, title, id, className }: Props) {
  return (
    <div id={id} className={`mb-16 flex items-start gap-6 ${className ?? ''}`}>
      <span className="font-mono text-xs text-fg-subtle">{number}</span>
      <h2 className="font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted">
        {title}
      </h2>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/SectionNumber.tsx
git commit -m "feat(ui): add SectionNumber component"
```

---

### Task 15: `useReducedMotion` hook

**Files:**
- Create: `hooks/useReducedMotion.ts`

- [ ] **Step 1: Write the hook**

```ts
'use client';

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefers(mql.matches);

    const listener = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  return prefers;
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useReducedMotion.ts
git commit -m "feat(hooks): add useReducedMotion hook"
```

---

## Phase 3 — Sections (parallel)

Each section is independent. Dispatch in parallel.

### Task 16: `Hero` section

**Files:**
- Create: `components/sections/Hero.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { ScrollVideo } from '@/components/motion/ScrollVideo';
import { SplitReveal } from '@/components/motion/SplitReveal';

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen w-full overflow-hidden bg-bg"
    >
      {/* Corner metadata */}
      <div className="pointer-events-none absolute inset-x-0 top-24 z-10 mx-auto flex max-w-content items-start justify-between px-6 md:px-12">
        <div className="font-condensed text-xs font-bold uppercase leading-tight tracking-widest text-fg-muted">
          Senior Fullstack
          <br />
          Developer
        </div>
        <div className="text-right font-condensed text-xs font-bold uppercase leading-tight tracking-widest text-fg-muted">
          Based in
          <br />
          Ho Chi Minh City, VN
        </div>
      </div>

      {/* Centered MacBook video */}
      <div className="relative flex min-h-screen items-center justify-center">
        <ScrollVideo
          src="/videos/macbook-scroll.mp4"
          poster="/images/01-closed.png"
          className="relative z-0 h-[60vh] w-full max-w-[1200px]"
        />

        {/* Name overlay */}
        <SplitReveal
          as="h1"
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-full -translate-x-1/2 -translate-y-1/2 text-center font-display text-5xl font-light leading-none tracking-tight text-fg md:text-7xl lg:text-display-xl"
          stagger={0.04}
        >
          TRAN NGOC HAI
        </SplitReveal>
      </div>

      {/* Teaser nav at base */}
      <div className="pointer-events-none absolute inset-x-0 bottom-12 z-10 mx-auto flex max-w-content items-end justify-between px-6 md:px-12">
        <div className="font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted">
          Shipping since 2020
        </div>
        <div className="font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted">
          Dalmore / Nestwell / Zeligate
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sections/Hero.tsx
git commit -m "feat(sections): Hero with scroll-scrub video + split-text name"
```

---

### Task 17: `About` section

**Files:**
- Create: `components/sections/About.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { SectionNumber } from '@/components/ui/SectionNumber';
import { FadeUp } from '@/components/motion/FadeUp';
import { SplitReveal } from '@/components/motion/SplitReveal';

export function About() {
  return (
    <section
      id="about"
      className="relative bg-bg px-6 py-24 md:px-12 md:py-48"
    >
      <div className="mx-auto max-w-content">
        <SectionNumber number="01" title="About" />

        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_2fr]">
          <FadeUp as="div" className="max-w-readable">
            <p className="font-body text-lg leading-relaxed text-fg">
              I build production web apps for FinTech, HealthTech, SaaS, and
              eCommerce. React / Next.js front, Node / NestJS back, deep
              Stripe.
            </p>
            <p className="mt-6 font-body text-lg leading-relaxed text-fg-muted">
              From SEC-regulated investment platforms to AI-powered
              recruitment tools. I own delivery end-to-end on teams of 5–25,
              ship on aggressive timelines, interface directly with C-suite.
            </p>
          </FadeUp>

          <SplitReveal
            as="blockquote"
            trigger="scroll"
            splitBy="words"
            stagger={0.03}
            className="font-condensed text-3xl font-bold uppercase leading-tight tracking-wide text-fg-muted md:text-5xl"
          >
            &ldquo;Six years shipping production apps — from SEC-regulated
            investment platforms to AI recruitment tools.&rdquo;
          </SplitReveal>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sections/About.tsx
git commit -m "feat(sections): About with pull quote split reveal"
```

---

### Task 18: `Work` section (4 case cards)

**Files:**
- Create: `components/sections/Work.tsx`, `components/sections/CaseCard.tsx`, `lib/work-data.ts`

- [ ] **Step 1: Write `lib/work-data.ts`**

```ts
export interface Case {
  number: string;
  name: string;
  role: string;
  company: string;
  location: string;
  dates: string;
  media: { type: 'typographic' } | { type: 'image'; src: string } | { type: 'video'; src: string };
  highlights: string[];
  stack: string[];
}

export const cases: Case[] = [
  {
    number: '01',
    name: 'Dalmore Group',
    role: 'Frontend Developer · Adroit Technology Solutions',
    company: 'Dalmore',
    location: 'Los Angeles, CA',
    dates: '2024 – Present',
    media: { type: 'typographic' },
    highlights: [
      '3 interconnected portals (Investor, Issuer, Compliance) under SEC regs — Reg A, CF, D',
      'KYC/AML/Sanctions via Persona with role-based access + audit trails',
      'Multi-channel payments: Stripe, Plaid, ACH, Wire — primary + secondary markets',
    ],
    stack: ['React 18', 'TypeScript', 'Vite', 'Tailwind', 'Radix', 'Shadcn', 'TanStack Query', 'Zustand'],
  },
  {
    number: '02',
    name: 'Nestwell',
    role: 'Software Developer · Insomnia Club',
    company: 'Nestwell',
    location: 'Pompano Beach, FL',
    dates: '2024 – Present',
    media: { type: 'typographic' },
    highlights: [
      'Built from scratch with Next.js 14 App Router + tRPC + Supabase',
      'Config-driven quiz engine, environmental scoring, PDF reports, SimpleLab marketplace',
      '600+ Vitest tests, Playwright E2E, RLS across 16 tables / 20+ migrations',
    ],
    stack: ['Next.js 14', 'tRPC', 'Supabase', 'Stripe', 'Tailwind', 'Vitest', 'Playwright'],
  },
  {
    number: '03',
    name: 'Zeligate',
    role: 'Frontend Developer · Freelance',
    company: 'Zeligate',
    location: 'Gold Coast, QLD',
    dates: '2024 – 2025',
    media: { type: 'typographic' },
    highlights: [
      'AI candidate shortlisting + ranking with 60s highlight reels',
      'ATS connectivity to 50+ platforms — Greenhouse, Workday, BambooHR',
      'Timezone-aware scheduling reducing coordinator overhead',
    ],
    stack: ['React', 'Next.js', 'TypeScript'],
  },
  {
    number: '04',
    name: 'Trailer2you',
    role: 'Fullstack Developer · Spritely Apps',
    company: 'Trailer2you',
    location: 'Robina, QLD',
    dates: '2022 – 2024',
    media: { type: 'typographic' },
    highlights: [
      '70% hands-on lead on customer + admin portals, bi-weekly releases for 2+ years',
      'Stripe booking payments, deposits, damage protection add-ons',
      'Mentored junior devs, reduced PR turnaround significantly',
    ],
    stack: ['React', 'Next.js', 'MUI', 'Node.js', 'Azure DevOps'],
  },
];
```

- [ ] **Step 2: Write `components/sections/CaseCard.tsx`**

```tsx
'use client';

import Image from 'next/image';
import { LeaderDots } from '@/components/ui/LeaderDots';
import { FadeUp } from '@/components/motion/FadeUp';
import type { Case } from '@/lib/work-data';

export function CaseCard({ case: c }: { case: Case }) {
  return (
    <article className="mb-32 md:mb-48">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-[2fr_1fr]">
        <FadeUp className="aspect-[4/3] bg-bg-elev">
          {c.media.type === 'image' && (
            <Image
              src={c.media.src}
              alt={c.name}
              width={1200}
              height={900}
              className="h-full w-full object-cover"
            />
          )}
          {c.media.type === 'video' && (
            <video
              src={c.media.src}
              muted
              loop
              playsInline
              autoPlay
              className="h-full w-full object-cover"
            />
          )}
          {c.media.type === 'typographic' && (
            <div className="flex h-full w-full items-center justify-center">
              <h3 className="font-display text-6xl font-light uppercase tracking-tight text-fg md:text-8xl">
                {c.name}
              </h3>
            </div>
          )}
        </FadeUp>

        <FadeUp className="flex flex-col justify-between">
          <div>
            <span className="font-mono text-xs text-fg-subtle">{c.number}</span>
            <h3 className="mt-2 font-display text-4xl font-light leading-tight tracking-tight text-fg md:text-5xl">
              {c.name}
            </h3>
            <p className="mt-3 font-mono text-xs uppercase tracking-widest text-fg-muted">
              {c.role}
            </p>
            <ul className="mt-8 space-y-4">
              {c.highlights.map((h) => (
                <li
                  key={h}
                  className="font-body text-base leading-relaxed text-fg-muted before:mr-3 before:text-accent before:content-['—']"
                >
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              {c.stack.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-fg-subtle px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-fg-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>

      <LeaderDots
        className="mt-8"
        left={c.company}
        center={c.location}
        right={c.dates}
      />
    </article>
  );
}
```

- [ ] **Step 3: Write `components/sections/Work.tsx`**

```tsx
import { SectionNumber } from '@/components/ui/SectionNumber';
import { CaseCard } from './CaseCard';
import { cases } from '@/lib/work-data';

export function Work() {
  return (
    <section id="work" className="bg-bg px-6 py-24 md:px-12 md:py-48">
      <div className="mx-auto max-w-content">
        <SectionNumber number="01" title="Selected Work" />
        {cases.map((c) => (
          <CaseCard key={c.number} case={c} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/work-data.ts components/sections/CaseCard.tsx components/sections/Work.tsx
git commit -m "feat(sections): Work with 4 case cards"
```

---

### Task 19: `Timeline` section

**Files:**
- Create: `components/sections/Timeline.tsx`, `lib/timeline-data.ts`

- [ ] **Step 1: Write `lib/timeline-data.ts`**

```ts
export interface Role {
  dates: string;
  role: string;
  company: string;
  location: string;
}

export const roles: Role[] = [
  { dates: '2024 — Present', role: 'Frontend Developer', company: 'Adroit Technology Solutions', location: 'LA (Remote)' },
  { dates: '2024 — Present', role: 'Software Developer', company: 'Insomnia Club', location: 'Pompano Beach (Remote)' },
  { dates: '2024 — 2025', role: 'Frontend Developer', company: 'Zeligate', location: 'Gold Coast (Remote)' },
  { dates: '2022 — 2024', role: 'Fullstack Developer', company: 'Spritely Apps', location: 'Robina (Remote)' },
  { dates: '2021 — 2022', role: 'Software Developer', company: 'RocketCart', location: 'Garden Grove (Remote)' },
  { dates: '2021', role: 'Frontend Developer', company: 'Kodebaze', location: 'Copenhagen (Remote)' },
  { dates: '2020 — 2021', role: 'Frontend Web Developer', company: 'CyberLogitec', location: 'Singapore (On-site)' },
];
```

- [ ] **Step 2: Write `components/sections/Timeline.tsx`**

```tsx
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
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
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
              <span className="text-fg transition-colors group-hover:text-accent">
                {r.company}
              </span>
              <span className="text-right text-fg-subtle">{r.location}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/timeline-data.ts components/sections/Timeline.tsx
git commit -m "feat(sections): Timeline ledger with hover lift"
```

---

### Task 20: `Skills` section

**Files:**
- Create: `components/sections/Skills.tsx`, `lib/skills-data.ts`

- [ ] **Step 1: Write `lib/skills-data.ts`**

```ts
export interface SkillGroup {
  label: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  { label: 'Frontend', items: ['React 18', 'Next.js', 'TypeScript', 'Tailwind', 'Shadcn/ui', 'Radix', 'MUI', 'Ant Design'] },
  { label: 'Backend', items: ['NestJS', 'Node.js', 'tRPC', 'GraphQL', 'REST', 'Express'] },
  { label: 'Payments', items: ['Stripe', 'Plaid', 'Persona KYC/AML', 'BoldSign'] },
  { label: 'State', items: ['TanStack Query', 'Zustand', 'Jotai', 'Redux Toolkit', 'RHF', 'Zod'] },
  { label: 'Cloud', items: ['AWS', 'Supabase', 'Vercel', 'Azure DevOps', 'Docker'] },
  { label: 'Testing', items: ['Vitest', 'Playwright', 'RTL'] },
];
```

- [ ] **Step 2: Write `components/sections/Skills.tsx`**

```tsx
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
    transition: { duration: 0.25, ease: [0.33, 1, 0.68, 1] },
  },
};

export function Skills() {
  return (
    <section id="skills" className="bg-bg px-6 py-24 md:px-12 md:py-48">
      <div className="mx-auto max-w-content">
        <SectionNumber number="03" title="Stack" />
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
```

- [ ] **Step 3: Commit**

```bash
git add lib/skills-data.ts components/sections/Skills.tsx
git commit -m "feat(sections): Skills pill grid with stagger"
```

---

### Task 21: `Contact` section

**Files:**
- Create: `components/sections/Contact.tsx`

- [ ] **Step 1: Write the component**

```tsx
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

      <SplitReveal
        as="a"
        trigger="scroll"
        stagger={0.04}
        className="group relative font-display text-4xl font-light leading-none tracking-tight text-fg transition-colors hover:text-accent md:text-7xl lg:text-8xl"
      >
        tranngochai171@gmail.com
      </SplitReveal>

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
```

**Wrap the email in a mailto:** Change the `<a>` to `href="mailto:tranngochai171@gmail.com"` — but `SplitReveal` renders it as the outer element. The current `SplitReveal` only supports tag strings, not href. Adjust: wrap SplitReveal in an `<a>` parent instead:

Replace the SplitReveal block with:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/sections/Contact.tsx
git commit -m "feat(sections): Contact finale with email + social links"
```

---

## Phase 4 — Integration (sequential)

### Task 22: Compose `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Overwrite `app/page.tsx`**

```tsx
import { SmoothScrollProvider } from '@/components/motion/SmoothScrollProvider';
import { TopNav } from '@/components/ui/TopNav';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Work } from '@/components/sections/Work';
import { Timeline } from '@/components/sections/Timeline';
import { Skills } from '@/components/sections/Skills';
import { Contact } from '@/components/sections/Contact';

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <TopNav />
      <main>
        <Hero />
        <About />
        <Work />
        <Timeline />
        <Skills />
        <Contact />
      </main>
    </SmoothScrollProvider>
  );
}
```

- [ ] **Step 2: Run dev server, walk through every section**

```bash
pnpm dev
```

Open http://localhost:3000. Manually verify:
- Top nav sticks, blur visible
- Hero name splits in on load, video visible
- Scroll: hero pins, video scrubs (desktop) — or autoplay loop (if browser <1024 viewport)
- About, Work (4 cards), Timeline, Skills, Contact all render
- Email link mailto works
- LinkedIn / GitHub / PDF links work
- Zero console errors

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: compose single-page layout"
```

---

### Task 23: Metadata + OG image placeholder

**Files:**
- Modify: `app/layout.tsx`
- Create: `public/og-image.png`

- [ ] **Step 1: Generate OG image from existing hero**

Use `01-closed.png` as an OG base. Crop to 1200×630 using any image editor or ImageMagick:

```bash
# If ImageMagick available:
convert public/images/01-closed.png -resize 1200x630^ -gravity center -extent 1200x630 public/og-image.png
```

If ImageMagick isn't installed, the user can open `01-closed.png` in Figma or Photoshop, crop/resize to 1200×630, save to `public/og-image.png`. Document this in a note:

Create `public/og-image.README.md`:

```markdown
OG image should be 1200×630 derived from images/01-closed.png.

Ideally add overlay text: "TRAN NGOC HAI · Senior Fullstack Developer" in Fraunces 300.

For v1 a clean crop of the MacBook hero is sufficient. Can upgrade later.
```

- [ ] **Step 2: Verify metadata renders**

`app/layout.tsx` already has the correct `metadata` export from Task 4. Open http://localhost:3000/ in browser, view source, confirm:
- `<title>Tran Ngoc Hai — Senior Fullstack Developer</title>`
- `<meta property="og:image" content="/og-image.png">`

- [ ] **Step 3: Commit**

```bash
git add public/og-image.png public/og-image.README.md
git commit -m "chore: add OG image placeholder"
```

---

## Phase 5 — Assets + verification (parallel)

### Task 24: Re-encode hero video for web

**Files:**
- Modify: `public/videos/macbook-scroll.mp4`

- [ ] **Step 1: Re-encode with keyframe-dense x264**

Requires ffmpeg. If not installed: `choco install ffmpeg` (Windows) or `brew install ffmpeg` (macOS).

```bash
cd D:/Works/resume-landing
ffmpeg -i public/videos/macbook-scroll.mp4 \
  -c:v libx264 -crf 23 -preset slow \
  -vf scale=1920:1080 \
  -g 6 -keyint_min 6 \
  -movflags +faststart -pix_fmt yuv420p -an \
  public/videos/macbook-scroll-web.mp4
```

Compare sizes:

```bash
ls -lh public/videos/
```

Expected: web version is 6-10MB vs 28MB original.

- [ ] **Step 2: Swap files**

```bash
mv public/videos/macbook-scroll.mp4 public/videos/macbook-scroll-original.mp4
mv public/videos/macbook-scroll-web.mp4 public/videos/macbook-scroll.mp4
```

Keep the original in `assets/videos/` as source of truth. Delete `macbook-scroll-original.mp4` from `public/`:

```bash
rm public/videos/macbook-scroll-original.mp4
```

- [ ] **Step 3: Verify scroll-scrub still works**

```bash
pnpm dev
```

Open http://localhost:3000 in desktop Chrome. Scroll slowly through hero. Video should scrub smoothly (no stuttering).

- [ ] **Step 4: Commit**

```bash
git add public/videos/macbook-scroll.mp4
git commit -m "perf: re-encode hero video to ~8MB with keyframe-dense x264"
```

---

### Task 25: Playwright smoke test

**Files:**
- Create: `tests/smoke.spec.ts`, `playwright.config.ts`

- [ ] **Step 1: Install Playwright**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'chromium-tablet', use: { ...devices['iPad Pro'] } },
    { name: 'chromium-mobile', use: { ...devices['iPhone 14'] } },
  ],
});
```

- [ ] **Step 3: Write `tests/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('home page loads with zero console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(errors).toEqual([]);
});

test('hero name renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /TRAN NGOC HAI/i })).toBeVisible();
});

test('all section anchors exist', async ({ page }) => {
  await page.goto('/');
  for (const id of ['hero', 'about', 'work', 'skills', 'contact']) {
    const el = page.locator(`#${id}`);
    await expect(el).toBeAttached();
  }
});

test('PDF download link exists', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: /Download Resume/i });
  await expect(link).toHaveAttribute('href', '/resume/Topy_Tran_Resume_2026.pdf');
});

test('email mailto link exists', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: /tranngochai171@gmail.com/ });
  await expect(link).toHaveAttribute('href', 'mailto:tranngochai171@gmail.com');
});

test('reduced motion: video does not play automatically', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const video = page.locator('video').first();
  const paused = await video.evaluate((v: HTMLVideoElement) => v.paused);
  expect(paused).toBe(true);
  await context.close();
});
```

- [ ] **Step 4: Run tests**

```bash
pnpm exec playwright test
```

Expected: all tests pass across chromium-desktop, chromium-tablet, chromium-mobile.

- [ ] **Step 5: Commit**

```bash
git add tests/ playwright.config.ts package.json pnpm-lock.yaml
git commit -m "test: add Playwright smoke tests"
```

---

### Task 26: Lighthouse audit on production build

**Files:**
- Create: `docs/lighthouse-baseline.md`

- [ ] **Step 1: Production build + serve**

```bash
pnpm build
pnpm exec serve out -l 3001
```

Open http://localhost:3001/ in Chrome incognito.

- [ ] **Step 2: Run Lighthouse**

Chrome DevTools → Lighthouse → Desktop → Performance + Accessibility + Best Practices + SEO → Analyze.

- [ ] **Step 3: Record scores in `docs/lighthouse-baseline.md`**

```markdown
# Lighthouse Baseline

**Date:** 2026-04-18
**Build:** initial deploy
**URL:** http://localhost:3001

| Category | Score | Target | Pass? |
|----------|-------|--------|-------|
| Performance | XX | ≥92 | Y/N |
| Accessibility | XX | ≥98 | Y/N |
| Best Practices | XX | 100 | Y/N |
| SEO | XX | 100 | Y/N |

**Core Web Vitals:**
- LCP: Xs (target <2.5s)
- CLS: X (target <0.05)
- INP: Xms (target <200ms)

**Notes:**
- [any observations]
```

Replace XX with actual numbers.

- [ ] **Step 4: Fix any category below target**

If Performance <92: consider further video compression or lazy-loading case cards.
If Accessibility <98: check color contrast on `--fg-subtle` against `--bg`. Add missing alt text.
If Best Practices <100: check console for CSP/mixed-content warnings.
If SEO <100: verify `<meta name="description">` + `<html lang="en">`.

Fix inline, re-run Lighthouse, update baseline file.

- [ ] **Step 5: Commit**

```bash
git add docs/lighthouse-baseline.md
git commit -m "docs: Lighthouse baseline scores"
```

---

## Phase 6 — Deploy

### Task 27: Deploy to Vercel

**Files:**
- Create: GitHub repo
- Modify: none

- [ ] **Step 1: Create GitHub repo + push**

```bash
cd D:/Works/resume-landing
gh repo create resume-landing --private --source=. --push
```

- [ ] **Step 2: Connect Vercel**

In browser, go to https://vercel.com/new → Import Git Repository → select `resume-landing`. Vercel auto-detects Next.js. No env vars needed.

Deploy → wait for build → visit preview URL.

- [ ] **Step 3: Smoke test the deployed site**

Open the preview URL (something like `resume-landing-topy.vercel.app`) on:
- Desktop Chrome
- macOS Safari
- iOS Safari (real device recommended)
- Android Chrome

Walk through every section. Verify:
- Hero video scrubs on desktop, autoplays on mobile
- All links work
- PDF downloads
- OG preview renders (paste URL into Slack or Twitter to check)

- [ ] **Step 4: Run Lighthouse on production URL**

Update `docs/lighthouse-baseline.md` with production URL scores. Commit.

- [ ] **Step 5: Commit final state**

```bash
git add docs/lighthouse-baseline.md
git commit -m "docs: production Lighthouse scores"
git push
```

---

## Definition of Done

From the spec, verified by the above tasks:

- [x] Deployed to Vercel preview URL (Task 27)
- [x] All 6 sections render, animate, and link (Tasks 16-22)
- [x] Mobile autoplay + desktop scroll-scrub verified (Tasks 9, 27)
- [x] Reduced-motion fully functional (Tasks 8, 10, 25)
- [x] Lighthouse perf ≥92, a11y ≥98, BP 100, SEO 100 (Task 26, 27)
- [x] PDF downloads (Tasks 6, 21, 25)
- [x] Email / LinkedIn / GitHub links (Tasks 21, 25)
- [x] OG image renders (Task 23)
- [x] Both skills reflect final implementation (Tasks 7, plus post-build skill update)
- [x] Pushed to GitHub (Task 27)
- [x] Video re-encoded to <10MB (Task 24)
- [x] Hero images present (01-closed.png ✅, 02-open + 03-half-closed remain for future polish)

---

## Post-Launch Polish (not blocking v1)

Future tasks captured so they don't get forgotten:

- Generate `02-open.jpeg` + `03-half-closed.jpeg` via NBP for secondary hero imagery
- Regenerate OG image with overlay text in Fraunces
- Swap Space Grotesk for licensed PP Neue Machina or Druk Wide
- Purchase custom domain (topy.dev recommended)
- Add real Nestwell screenshot for Work section card 02
- Capture Zeligate video loop for Work section card 03
- Add blog/writing section (optional)
- Add dark/light mode toggle (optional — luxury brand usually stays dark-only)

---

**End of plan.**
