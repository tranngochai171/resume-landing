# Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Vercel Web Analytics + Speed Insights into the resume landing site, with typed custom events for the four real call sites (resume download, email, social links) and per-section scroll depth.

**Architecture:** Two Vercel React components mounted in `app/layout.tsx` auto-capture pageviews and Core Web Vitals. A thin typed `track()` wrapper over `@vercel/analytics`'s `track` keeps call sites honest. A `useSectionView` hook fires one `section_view` event per section per page load via IntersectionObserver.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Playwright, `@vercel/analytics`, `@vercel/speed-insights`.

**Scope note:** Spec listed `hero_cta` and `project_click` events. Current Hero has no clickable CTA (beats are display-only) and `CaseCard` has no outbound link — those events have no call sites, so they are omitted. Add them when the corresponding UI ships.

---

## File Structure

**Create:**
- `lib/analytics/events.ts` — event name + props union types
- `lib/analytics/track.ts` — typed wrapper over `@vercel/analytics` `track`
- `hooks/useSectionView.ts` — IntersectionObserver hook, fires once per section per page load
- `components/analytics/Analytics.tsx` — wraps `<Analytics />` + `<SpeedInsights />`

**Modify:**
- `app/layout.tsx` — mount `<Analytics />`
- `components/sections/Contact.tsx` — `onClick` on email, LinkedIn, GitHub, resume PDF; `useSectionView('contact')` on section root
- `components/sections/Hero.tsx` — `useSectionView('hero')` on section root
- `components/sections/About.tsx` — `useSectionView('about')` on section root
- `components/sections/Work.tsx` — `useSectionView('work')` on section root
- `components/sections/Skills.tsx` — `useSectionView('skills')` on section root
- `components/sections/Timeline.tsx` — `useSectionView('timeline')` on section root
- `tests/smoke.spec.ts` — add analytics smoke tests (no new file; extend existing)
- `package.json` / lockfile — add deps

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`, `package-lock.json` (or pnpm/yarn lock as present)

- [ ] **Step 1: Install packages**

Run: `npm install @vercel/analytics @vercel/speed-insights`

Expected: both appear under `dependencies` in `package.json`, lockfile updated.

- [ ] **Step 2: Type check passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(analytics): add @vercel/analytics + speed-insights"
```

---

## Task 2: Typed event catalogue

**Files:**
- Create: `lib/analytics/events.ts`

- [ ] **Step 1: Write events module**

```ts
// lib/analytics/events.ts
export type SectionId =
  | 'hero'
  | 'about'
  | 'work'
  | 'skills'
  | 'timeline'
  | 'contact';

export type AnalyticsEvent =
  | { name: 'resume_download'; props: { source: 'contact' | 'nav' } }
  | { name: 'contact_email'; props?: undefined }
  | { name: 'contact_social'; props: { network: 'github' | 'linkedin' } }
  | { name: 'section_view'; props: { section: SectionId } };

export type EventName = AnalyticsEvent['name'];

export type PropsFor<N extends EventName> = Extract<
  AnalyticsEvent,
  { name: N }
>['props'];
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/analytics/events.ts
git commit -m "feat(analytics): add typed event catalogue"
```

---

## Task 3: Typed track() wrapper

**Files:**
- Create: `lib/analytics/track.ts`

- [ ] **Step 1: Write wrapper**

```ts
// lib/analytics/track.ts
import { track as vercelTrack } from '@vercel/analytics';
import type { EventName, PropsFor } from './events';

export function track<N extends EventName>(
  name: N,
  ...args: PropsFor<N> extends undefined ? [] : [props: PropsFor<N>]
): void {
  const props = args[0];
  if (props === undefined) {
    vercelTrack(name);
  } else {
    vercelTrack(name, props as Record<string, string>);
  }
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors. `track('contact_email')` and `track('contact_social', { network: 'github' })` both compile; `track('contact_social')` does not.

- [ ] **Step 3: Commit**

```bash
git add lib/analytics/track.ts
git commit -m "feat(analytics): typed track wrapper over vercel/analytics"
```

---

## Task 4: useSectionView hook

**Files:**
- Create: `hooks/useSectionView.ts`

- [ ] **Step 1: Write hook**

```ts
// hooks/useSectionView.ts
'use client';

import { useEffect, type RefObject } from 'react';
import { track } from '@/lib/analytics/track';
import type { SectionId } from '@/lib/analytics/events';

const fired = new Set<SectionId>();

export function useSectionView(
  id: SectionId,
  ref: RefObject<Element | null>
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    if (fired.has(id)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.has(id)) {
            fired.add(id);
            track('section_view', { section: id });
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [id, ref]);
}
```

The module-level `Set` survives across component remounts within a single page load, so a section fires at most once. It resets on full navigation, which matches one-event-per-visit intent.

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useSectionView.ts
git commit -m "feat(analytics): useSectionView hook with per-session dedup"
```

---

## Task 5: Analytics mount component

**Files:**
- Create: `components/analytics/Analytics.tsx`

- [ ] **Step 1: Write mount wrapper**

```tsx
// components/analytics/Analytics.tsx
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function Analytics() {
  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
    </>
  );
}
```

- [ ] **Step 2: Modify `app/layout.tsx` to render `<Analytics />`**

Replace the `<body>` contents to include the component. Final file:

```tsx
import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { getYearsOfExperience } from '@/lib/experience';
import { Analytics } from '@/components/analytics/Analytics';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

const condensed = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-condensed',
  weight: ['500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://topy-tran.vercel.app'),
  title: 'Tran Ngoc Hai — Senior Fullstack Developer',
  description:
    'Senior Fullstack Developer shipping production apps in FinTech, HealthTech, SaaS, and eCommerce — from SEC-regulated investment platforms to AI-powered recruitment tools.',
  openGraph: {
    title: 'Tran Ngoc Hai — Senior Fullstack Developer',
    description:
      `Senior Fullstack Developer · ${getYearsOfExperience()}+ years · FinTech · HealthTech · SaaS`,
    images: ['/og-image.jpg'],
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
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${condensed.variable}`}
    >
      <body className="bg-bg text-fg font-body antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Build passes**

Run: `npm run build`
Expected: successful production build, no type errors.

- [ ] **Step 4: Dev smoke — pageview fires**

Run: `npm run dev`, open `http://localhost:3000`, open DevTools → Network → filter `/_vercel/insights`. Expected: at least one POST to `/_vercel/insights/view` on load. Kill server.

- [ ] **Step 5: Commit**

```bash
git add components/analytics/Analytics.tsx app/layout.tsx
git commit -m "feat(analytics): mount Vercel Analytics + Speed Insights"
```

---

## Task 6: Instrument Contact links

**Files:**
- Modify: `components/sections/Contact.tsx`

Add `onClick` to email, LinkedIn, GitHub, resume PDF. Attach `useSectionView('contact')` to section root.

- [ ] **Step 1: Replace file contents**

```tsx
'use client';

import { useRef } from 'react';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { FadeUp } from '@/components/motion/FadeUp';
import { track } from '@/lib/analytics/track';
import { useSectionView } from '@/hooks/useSectionView';

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  useSectionView('contact', ref);

  return (
    <section
      ref={ref}
      id="contact"
      className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 py-24 text-center md:px-12"
    >
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #000 85%)' }}
      />

      <FadeUp as="p" className="mb-8 font-mono text-xs uppercase tracking-widest text-fg-muted">
        Get in Touch
      </FadeUp>

      <a
        href="mailto:tranngochai171@gmail.com"
        onClick={() => track('contact_email')}
        className="group relative inline-block"
      >
        <SplitReveal
          trigger="scroll"
          stagger={0.04}
          className="font-display text-[clamp(1.5rem,7vw,2.25rem)] font-light leading-none tracking-tight text-fg transition-colors [word-break:break-word] group-hover:text-accent sm:text-4xl md:text-7xl lg:text-8xl"
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
          onClick={() => track('contact_social', { network: 'linkedin' })}
          className="transition-colors hover:text-accent"
        >
          LinkedIn
        </a>
        <span className="text-fg-subtle">·</span>
        <a
          href="https://github.com/tranngochai171"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('contact_social', { network: 'github' })}
          className="transition-colors hover:text-accent"
        >
          GitHub
        </a>
        <span className="text-fg-subtle">·</span>
        <a
          href="/resume/Topy_Tran_Resume_2026.pdf"
          download
          onClick={() => track('resume_download', { source: 'contact' })}
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

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/sections/Contact.tsx
git commit -m "feat(analytics): track Contact link clicks + section view"
```

---

## Task 7: Instrument Hero section view

**Files:**
- Modify: `components/sections/Hero.tsx`

- [ ] **Step 1: Add useSectionView to Hero**

Replace file contents:

```tsx
'use client';

import { useRef, useCallback } from 'react';
import { ScrollVideo } from '@/components/motion/ScrollVideo';
import { HeroReveal } from '@/components/motion/HeroReveal';
import { useSectionView } from '@/hooks/useSectionView';

export function Hero() {
  const progressRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  useSectionView('hero', sectionRef);

  const onProgress = useCallback((p: number) => {
    progressRef.current = p;
  }, []);

  return (
    <section
      ref={sectionRef}
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

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/sections/Hero.tsx
git commit -m "feat(analytics): track Hero section view"
```

---

## Task 8: Instrument remaining sections

**Files:**
- Modify: `components/sections/About.tsx`, `Work.tsx`, `Skills.tsx`, `Timeline.tsx`

Each section needs `'use client'`, a `useRef<HTMLElement>`, attach to the `<section>` root, and call `useSectionView(<id>, ref)`.

**Note:** `Work.tsx`, `Skills.tsx`, `Timeline.tsx` are currently server components. Adding the hook turns them into client components. That's a real tradeoff — SSR still delivers the HTML, but React re-hydrates the subtree. Acceptable for a single-page resume site; call it out if anyone asks.

- [ ] **Step 1: Modify `components/sections/Work.tsx`**

Replace contents:

```tsx
'use client';

import { useRef } from 'react';
import { SectionNumber } from '@/components/ui/SectionNumber';
import { CaseCard } from './CaseCard';
import { cases } from '@/lib/work-data';
import { useSectionView } from '@/hooks/useSectionView';

export function Work() {
  const ref = useRef<HTMLElement>(null);
  useSectionView('work', ref);

  return (
    <section ref={ref} id="work" className="bg-bg px-6 py-24 md:px-12 md:py-48">
      <div className="mx-auto max-w-content">
        <SectionNumber number="02" title="Selected Work" />
        {cases.map((c) => (
          <CaseCard key={c.number} case={c} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Modify `components/sections/About.tsx`**

Read current file, then add the three changes:
1. Ensure top of file has `'use client';` (add if absent).
2. Add imports: `import { useRef } from 'react';` and `import { useSectionView } from '@/hooks/useSectionView';`.
3. Inside the component, before `return`: `const ref = useRef<HTMLElement>(null); useSectionView('about', ref);`.
4. On the root `<section id="about" ...>` add `ref={ref}`.

- [ ] **Step 3: Modify `components/sections/Skills.tsx`**

Same four changes as About, with `useSectionView('skills', ref)` and the `ref` attached to the `<section id="skills">` root.

- [ ] **Step 4: Modify `components/sections/Timeline.tsx`**

Same four changes, with `useSectionView('timeline', ref)` and the `ref` attached to the `<section id="timeline">` root.

- [ ] **Step 5: Type check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add components/sections/About.tsx components/sections/Work.tsx components/sections/Skills.tsx components/sections/Timeline.tsx
git commit -m "feat(analytics): track section views for About, Work, Skills, Timeline"
```

---

## Task 9: Smoke tests

**Files:**
- Modify: `tests/smoke.spec.ts`

Verify: `<Analytics />` ships the script, resume download click invokes the Vercel beacon queue (before the SDK sends it network-side), and sections register view events once.

Vercel's SDK exposes a global `window.va` function in production; in dev/local, `window.va` is `undefined` until the first `track()` call, then becomes a queue. We'll stub it pre-load and observe calls.

- [ ] **Step 1: Append analytics tests to `tests/smoke.spec.ts`**

Add these tests inside the existing `test.describe('Resume landing — smoke', ...)` block, just before the closing `});`:

```ts
test('analytics: resume_download fires on PDF click', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __va: unknown[] }).__va = [];
    (window as unknown as { va: (...args: unknown[]) => void }).va = (
      ...args: unknown[]
    ) => {
      (window as unknown as { __va: unknown[][] }).__va.push(args);
    };
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const pdf = page.getByRole('link', { name: /Download Resume/i });
  // Prevent navigation so the test doesn't race PDF download
  await pdf.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
  await pdf.click();

  const calls = await page.evaluate(
    () => (window as unknown as { __va: unknown[][] }).__va
  );
  const hit = calls.find(
    (c) => c[0] === 'event' && (c[1] as { name?: string }).name === 'resume_download'
  );
  expect(hit).toBeTruthy();
});

test('analytics: contact_social fires for GitHub click', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __va: unknown[] }).__va = [];
    (window as unknown as { va: (...args: unknown[]) => void }).va = (
      ...args: unknown[]
    ) => {
      (window as unknown as { __va: unknown[][] }).__va.push(args);
    };
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const gh = page.getByRole('link', { name: /GitHub/i });
  await gh.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
  await gh.click();

  const calls = await page.evaluate(
    () => (window as unknown as { __va: unknown[][] }).__va
  );
  const hit = calls.find(
    (c) =>
      c[0] === 'event' &&
      (c[1] as { name?: string; data?: { network?: string } }).name ===
        'contact_social' &&
      (c[1] as { data?: { network?: string } }).data?.network === 'github'
  );
  expect(hit).toBeTruthy();
});

test('analytics: section_view fires once for About after scroll', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __va: unknown[] }).__va = [];
    (window as unknown as { va: (...args: unknown[]) => void }).va = (
      ...args: unknown[]
    ) => {
      (window as unknown as { __va: unknown[][] }).__va.push(args);
    };
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.locator('#about').scrollIntoViewIfNeeded();
  // Give IntersectionObserver time to tick
  await page.waitForTimeout(500);

  // Scroll away and back to confirm dedup
  await page.locator('#hero').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const calls = await page.evaluate(
    () => (window as unknown as { __va: unknown[][] }).__va
  );
  const aboutHits = calls.filter(
    (c) =>
      c[0] === 'event' &&
      (c[1] as { name?: string; data?: { section?: string } }).name ===
        'section_view' &&
      (c[1] as { data?: { section?: string } }).data?.section === 'about'
  );
  expect(aboutHits).toHaveLength(1);
});
```

Note on Vercel's queue shape: when the SDK hasn't loaded yet, `window.va(...)` is a queue function. Calls look like `['event', { name: 'resume_download', data: { source: 'contact' } }]`. Our tests match that shape. If Vercel changes the shape, fix this one assertion block rather than scatter the knowledge.

- [ ] **Step 2: Run the new tests**

Run: `npx playwright test tests/smoke.spec.ts -g "analytics"`
Expected: all three pass.

- [ ] **Step 3: Run full smoke suite**

Run: `npx playwright test tests/smoke.spec.ts`
Expected: every test passes (existing + new).

- [ ] **Step 4: Commit**

```bash
git add tests/smoke.spec.ts
git commit -m "test(smoke): verify analytics events fire on click and scroll"
```

---

## Task 10: Verify in production

**Files:** none

- [ ] **Step 1: Push branch and deploy**

```bash
git push
```

Wait for Vercel preview build to succeed.

- [ ] **Step 2: Open Vercel dashboard → project → Analytics tab**

Expected: within ~30 minutes of production traffic, page views and `section_view` events appear. Custom events show under Events.

- [ ] **Step 3: Verify Speed Insights**

Vercel dashboard → project → Speed Insights tab. Expected: LCP / CLS / INP populate after a few visits.

- [ ] **Step 4: Manual click test on preview**

On the preview URL, click the resume PDF, open DevTools → Network → filter `/_vercel/insights/event`. Expected: one POST per click with body containing `resume_download`.

No commit — verification only.
