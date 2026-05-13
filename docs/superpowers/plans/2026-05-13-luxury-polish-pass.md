# Luxury Polish Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close wayfinding bugs and raise perceived craft across the resume-landing site through accent moments, mobile parity, page-load curtain, and a footer.

**Architecture:** Tier A polish — no new sections, no motion-language rebuild. Adds three new components (`MobileNav`, `LoadCurtain`, `Footer`), modifies seven existing files, extends the Playwright smoke test. All visual changes respect `prefers-reduced-motion` via existing `useReducedMotion` hook or CSS `motion-reduce:` utilities.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind (custom tokens `accent #7DD3C8`, `bg #000000`, `fg #F5F5F4`), framer-motion 12, GSAP 3 + Lenis, Playwright 1.59.

**Commit policy:** No intermediate commits. Single final commit at the end (per user instruction).

---

## File Structure

**New files:**
- `components/ui/MobileNav.tsx` — full-screen drawer for phones
- `components/ui/Footer.tsx` — site footer
- `components/motion/LoadCurtain.tsx` — once-per-session page-load overlay

**Modified files:**
- `app/page.tsx` — mount LoadCurtain + Footer
- `components/ui/TopNav.tsx` — add Ledger link; swap mobile CTA for hamburger trigger
- `components/ui/SectionNumber.tsx` — accent number colour
- `components/sections/Hero.tsx` — pass mobile flag for wordmark
- `components/motion/HeroReveal.tsx` — signature stroke SVG, mobile wordmark
- `components/sections/Timeline.tsx` — `id="timeline"`, accent dot on most-recent row
- `components/sections/Contact.tsx` — two-line email, eyebrow microcopy, remove HCMC line
- `components/sections/CaseCard.tsx` — case number in accent
- `next.config.js` — expose `NEXT_PUBLIC_BUILD_DATE`
- `tests/smoke.spec.ts` — coverage for new behaviour

---

## Task 1: Timeline anchor + Ledger nav link

**Files:**
- Modify: `components/sections/Timeline.tsx:28`
- Modify: `components/ui/TopNav.tsx:25`
- Modify: `tests/smoke.spec.ts:31` (anchor list)

- [ ] **Step 1: Add the failing test**

In `tests/smoke.spec.ts`, extend the `all section anchors exist` test to include `timeline`:

```ts
for (const id of ['hero', 'about', 'work', 'timeline', 'skills', 'contact']) {
  await expect(page.locator(`#${id}`)).toBeAttached();
}
```

Add a new test below it:

```ts
test('top nav exposes Ledger link to #timeline', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: /^Ledger$/i });
  await expect(link).toHaveAttribute('href', '#timeline');
});
```

- [ ] **Step 2: Run test to confirm it fails**

```
npx playwright test tests/smoke.spec.ts -g "anchors|Ledger"
```

Expected: both assertions FAIL (`#timeline` not attached; `Ledger` link not found).

- [ ] **Step 3: Add `id="timeline"` to the Timeline section**

`components/sections/Timeline.tsx` line 28:

```tsx
<section ref={ref} id="timeline" className="bg-bg px-6 py-24 md:px-12 md:py-48">
```

- [ ] **Step 4: Add Ledger to TopNav**

`components/ui/TopNav.tsx` line 25, change the labels array:

```tsx
{['Work', 'About', 'Ledger', 'Skills'].map((label) => (
  <a
    key={label}
    href={`#${label === 'Ledger' ? 'timeline' : label.toLowerCase()}`}
    className="font-mono text-xs uppercase tracking-widest text-fg-muted transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
  >
    {label}
  </a>
))}
```

- [ ] **Step 5: Run tests to confirm they pass**

```
npx playwright test tests/smoke.spec.ts -g "anchors|Ledger"
```

Expected: PASS.

---

## Task 2: SectionNumber in accent

**Files:**
- Modify: `components/ui/SectionNumber.tsx:11`

- [ ] **Step 1: Change the number colour**

`components/ui/SectionNumber.tsx` line 11:

```tsx
<span className="font-mono text-xs text-accent">{number}</span>
```

- [ ] **Step 2: Visual verify**

Open `http://localhost:3000`, scroll through About / Work / Timeline / Skills. Numbers `01 02 03 04` should read teal-cyan (`#7DD3C8`). Titles stay muted grey.

---

## Task 3: CaseCard number in accent

**Files:**
- Modify: `components/sections/CaseCard.tsx:46`

- [ ] **Step 1: Update number span**

`components/sections/CaseCard.tsx` line 46:

```tsx
<span className="font-mono text-xs text-accent">{c.number}</span>
```

- [ ] **Step 2: Visual verify**

Scroll Work section. Each case's `c.number` (e.g. `01`, `02`, `03`, `04`) renders teal-cyan above the case title.

---

## Task 4: Timeline accent indicator

**Files:**
- Modify: `components/sections/Timeline.tsx:38-50`

- [ ] **Step 1: Add accent dot prefix to most-recent row**

In `Timeline.tsx`, change the grid template to include a leading column for the dot, and render an accent dot only for the first item. Replace the `motion.li` block (lines 38-50) with:

```tsx
{roles.map((r, idx) => (
  <motion.li
    key={`${r.dates}-${r.company}`}
    variants={row}
    whileHover={{ y: -2 }}
    className="group grid grid-cols-[12px_auto_1fr_1fr_auto] items-center gap-4 py-4 font-mono text-xs uppercase tracking-widest text-fg-muted tabular-nums transition-colors hover:text-fg md:text-sm"
  >
    <span
      aria-hidden
      className={
        idx === 0
          ? 'h-1.5 w-1.5 rounded-full bg-accent transition-all group-hover:w-3 group-hover:rounded-sm'
          : 'h-1.5 w-1.5 rounded-full bg-transparent transition-all group-hover:bg-accent/60'
      }
    />
    <span className="text-fg-subtle">{r.dates}</span>
    <span>{r.role}</span>
    <span className="text-fg">{r.company}</span>
    <span className="text-right text-fg-subtle">{r.location}</span>
  </motion.li>
))}
```

- [ ] **Step 2: Visual verify**

Scroll Timeline. First row (`2024 — 2025 ZELIGATE`) shows a small teal dot at the left. Hover that row — dot widens into a hairline. Hover other rows — their dots tint accent at 60% opacity.

---

## Task 5: Hero mobile wordmark + signature stroke

**Files:**
- Modify: `components/motion/HeroReveal.tsx:96-204`
- Modify: `hooks/useMediaQuery.ts` (verify it exists — read first)

- [ ] **Step 1: Read existing media query hook**

```
cat hooks/useMediaQuery.ts
```

Confirm signature is `useMediaQuery(query: string): boolean`. If different, adapt usage in Step 3.

- [ ] **Step 2: Add signature stroke SVG below the `intro` beat**

In `HeroReveal.tsx`, immediately after the `<h1 data-beat="intro">…</h1>` block (around line 141), add:

```tsx
<svg
  data-beat="intro"
  aria-hidden
  viewBox="0 0 600 24"
  preserveAspectRatio="none"
  className="absolute left-1/2 top-[calc(50%+3.5rem)] w-[60%] max-w-[700px] -translate-x-1/2 md:top-[calc(50%+5rem)]"
  style={{ opacity: 0 }}
>
  <path
    ref={(el) => { if (el) signatureRef.current = el; }}
    d="M 20 14 Q 200 4, 380 12 T 580 18"
    stroke="#7DD3C8"
    strokeWidth="1"
    fill="none"
    pathLength={1}
    strokeDasharray={1}
    strokeDashoffset={1}
  />
</svg>
```

Add a ref near the top of the component (after `scrollCueDismissed`):

```tsx
const signatureRef = useRef<SVGPathElement | null>(null);
```

- [ ] **Step 3: Animate the stroke inside the existing tick loop**

In the `tick` function, after the existing `intro` beat logic (around line 60), add:

```tsx
// Signature stroke: draws across 0.05→0.35 (after name fades in).
const sig = signatureRef.current;
if (sig) {
  const draw = Math.max(0, Math.min(1, (p - 0.05) / 0.30));
  sig.style.strokeDashoffset = String(1 - draw);
  const svg = sig.closest('svg') as HTMLElement | null;
  if (svg) svg.style.opacity = String(draw > 0 ? 1 : 0);
}
```

And in the reduced-motion branch (around line 25-39), after the existing beat handling, add:

```tsx
const sigEl = root.querySelector<SVGPathElement>('[data-beat="intro"] + svg path');
if (sigEl) {
  sigEl.style.strokeDashoffset = '0';
  const svg = sigEl.closest('svg') as HTMLElement | null;
  if (svg) svg.style.opacity = '1';
}
```

- [ ] **Step 4: Add the mobile wordmark to the final-frame layout**

The current `HeroReveal` always renders the centered beats; on mobile the laptop scroll is replaced by the static final frame (see `ScrollVideo` mobile branch). The `intro` beat (`TRAN NGOC HAI`) only renders during scroll progress 0.0–0.4. On mobile this beat completes very early and disappears.

In `HeroReveal.tsx` add a second persistent wordmark for mobile only. Inside the return block, immediately before the `intro` beat `<h1>`:

```tsx
<h1
  aria-hidden
  className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center font-display text-[clamp(2.5rem,12vw,4rem)] font-light leading-none tracking-tight text-fg [text-shadow:0_2px_20px_rgba(0,0,0,0.85)] motion-reduce:opacity-100 md:hidden"
>
  TRAN NGOC HAI
</h1>
```

Note: on `md:` viewports this is hidden by `md:hidden`; the existing scroll-driven `[data-beat="intro"]` h1 handles the desktop reveal. The `aria-hidden` avoids a duplicate heading for screen readers; the desktop one already exposes the name via `aria-label`.

- [ ] **Step 5: Visual verify**

Desktop 1440×900: scroll into hero, after the name appears a thin teal hairline draws beneath it across ~600ms. Final state holds.

Mobile 390×844: the `TRAN NGOC HAI` wordmark is visible centered over the laptop image from first paint.

Reduced motion (DevTools → Rendering → emulate `prefers-reduced-motion: reduce`): both desktop and mobile wordmarks render instantly; signature stroke is fully drawn at load.

---

## Task 6: Two-line email + eyebrow microcopy + remove HCMC line

**Files:**
- Modify: `components/sections/Contact.tsx:72-126`

- [ ] **Step 1: Replace the eyebrow text**

`Contact.tsx` line 72-74:

```tsx
<FadeUp as="p" className="mb-8 font-mono text-xs uppercase tracking-widest text-fg-muted">
  Contact
</FadeUp>
```

- [ ] **Step 2: Replace the single-line email with two stacked SplitReveals**

Replace the `<a href="mailto:…">` block (lines 76-88) with:

```tsx
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
```

- [ ] **Step 3: Remove the HCMC paragraph**

Delete lines 124-126 (the `<FadeUp as="p" … >Ho Chi Minh City · 2026</FadeUp>` block). The city info migrates to the footer (Task 9).

- [ ] **Step 4: Visual verify (desktop + mobile)**

The email renders on two lines at every breakpoint. No mid-word break. Hover the anchor — both lines tint to accent. Reduced motion: both lines fully visible at load.

---

## Task 7: MobileNav drawer

**Files:**
- Create: `components/ui/MobileNav.tsx`
- Modify: `components/ui/TopNav.tsx`
- Modify: `tests/smoke.spec.ts`

- [ ] **Step 1: Add the failing test**

Append to `tests/smoke.spec.ts`:

```ts
test('mobile drawer opens and shows links', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const trigger = page.getByRole('button', { name: /open menu/i });
  await expect(trigger).toBeVisible();
  await trigger.click();

  for (const label of ['Work', 'About', 'Ledger', 'Skills', 'Contact']) {
    await expect(page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') })).toBeVisible();
  }
  await page.keyboard.press('Escape');
  await expect(trigger).toBeVisible();
  await ctx.close();
});
```

- [ ] **Step 2: Run test to confirm it fails**

```
npx playwright test tests/smoke.spec.ts -g "mobile drawer"
```

Expected: FAIL (`Open menu` button not found).

- [ ] **Step 3: Create the MobileNav component**

Write `components/ui/MobileNav.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Ledger', href: '#timeline' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
];

const SOCIAL = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/topytran', external: true },
  { label: 'GitHub', href: 'https://github.com/tranngochai171', external: true },
  { label: 'Download Resume', href: '/resume/Topy_Tran_Resume_2026_AI_Workflows.pdf', external: false, download: true },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-drawer"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className="relative z-[70] flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className={`block h-px w-6 bg-fg transition-transform ${open ? 'translate-y-[3px] rotate-45' : ''}`} />
        <span className={`block h-px w-6 bg-fg transition-transform ${open ? '-translate-y-[3px] -rotate-45' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-bg/95 px-6 backdrop-blur-2xl md:hidden"
          >
            <nav className="flex flex-col items-center gap-6">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.04, duration: 0.25 }}
                  className="font-display text-4xl font-light tracking-tight text-fg transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <div className="h-px w-12 bg-fg-subtle/40" />
            <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  {...(s.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  {...(s.download ? { download: true } : {})}
                  onClick={() => setOpen(false)}
                  className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 4: Mount MobileNav in TopNav and hide Get-in-Touch pill on mobile**

`components/ui/TopNav.tsx`, replace the rightmost flex container (lines 23-46) with:

```tsx
<div className="flex items-center gap-8">
  <div className="hidden items-center gap-8 md:flex">
    {['Work', 'About', 'Ledger', 'Skills'].map((label) => (
      <a
        key={label}
        href={`#${label === 'Ledger' ? 'timeline' : label.toLowerCase()}`}
        className="font-mono text-xs uppercase tracking-widest text-fg-muted transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {label}
      </a>
    ))}
  </div>
  <a
    href="#contact"
    className={cn(
      'hidden font-mono text-xs uppercase tracking-widest md:inline-block',
      'rounded-full border border-fg-subtle px-4 py-2',
      'transition-colors hover:border-accent hover:text-accent',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
    )}
  >
    Get in Touch
  </a>
  <MobileNav />
</div>
```

Add the import at the top of `TopNav.tsx`:

```tsx
import { MobileNav } from '@/components/ui/MobileNav';
```

- [ ] **Step 5: Run the test to confirm it passes**

```
npx playwright test tests/smoke.spec.ts -g "mobile drawer"
```

Expected: PASS.

---

## Task 8: LoadCurtain

**Files:**
- Create: `components/motion/LoadCurtain.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create LoadCurtain**

Write `components/motion/LoadCurtain.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'curtainSeen';

export function LoadCurtain() {
  const [visible, setVisible] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const r = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduce(r);
    if (r) return; // skip entirely
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(true);
    document.documentElement.style.overflow = 'hidden';
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 1100);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (visible) return;
    document.documentElement.style.overflow = '';
  }, [visible]);

  if (reduce) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.5, ease: [0.7, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="font-display text-[clamp(4rem,12vw,8rem)] font-light leading-none text-fg"
          >
            T
          </motion.span>
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 0.5, width: 48 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-4 h-px bg-accent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Mount LoadCurtain as the first child of the page**

`app/page.tsx`:

```tsx
import { SmoothScrollProvider } from '@/components/motion/SmoothScrollProvider';
import { LoadCurtain } from '@/components/motion/LoadCurtain';
import { TopNav } from '@/components/ui/TopNav';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Work } from '@/components/sections/Work';
import { Timeline } from '@/components/sections/Timeline';
import { Skills } from '@/components/sections/Skills';
import { Contact } from '@/components/sections/Contact';
import { Footer } from '@/components/ui/Footer';

export default function HomePage() {
  return (
    <>
      <LoadCurtain />
      <SmoothScrollProvider>
        <TopNav />
        <main id="main">
          <Hero />
          <About />
          <Work />
          <Timeline />
          <Skills />
          <Contact />
        </main>
        <Footer />
      </SmoothScrollProvider>
    </>
  );
}
```

(Note: `Footer` import is for Task 9 — leave the import in place even before Task 9 runs to keep TypeScript clean. If the agent executes Task 8 before Task 9, temporarily stub the Footer in Task 9 ordering: it's safe to add the import only after Task 9. Pick whichever order works for you, but the final state matches this snippet.)

- [ ] **Step 3: Visual verify**

Hard refresh `http://localhost:3000` in an Incognito window. A black overlay with a centered `T` fades in, holds, then lifts up to reveal the hero. Reload again — curtain skipped (sessionStorage flag). Open new Incognito — curtain runs again. With `prefers-reduced-motion: reduce`, no curtain at all.

- [ ] **Step 4: Verify ScrollTrigger is not broken**

Scroll into the hero. The MacBook scroll-pinned video must still scrub correctly. If it doesn't, edit `LoadCurtain` to fire `window.dispatchEvent(new Event('resize'))` and (if `ScrollTrigger` is in scope) `ScrollTrigger.refresh()` immediately after `setVisible(false)`.

---

## Task 9: Footer with build date

**Files:**
- Create: `components/ui/Footer.tsx`
- Modify: `next.config.js` (or `next.config.mjs` — read first)
- Modify: `app/page.tsx` (mount already added in Task 8)
- Modify: `tests/smoke.spec.ts`

- [ ] **Step 1: Add the failing test**

Append to `tests/smoke.spec.ts`:

```ts
test('footer renders with copyright, ship date, colophon, back-to-top', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer).toBeVisible();
  await expect(footer).toContainText(/©\s*2026\s*Tran Ngoc Hai/i);
  await expect(footer).toContainText(/Last shipped/i);
  await expect(footer).toContainText(/Fraunces/i);
  await expect(footer.getByRole('link', { name: /top/i })).toHaveAttribute('href', '#main');
});
```

- [ ] **Step 2: Confirm test fails**

```
npx playwright test tests/smoke.spec.ts -g "footer renders"
```

Expected: FAIL — no `footer` element.

- [ ] **Step 3: Find the Next config file**

```
ls next.config.*
```

Use whichever extension is present (`.js` or `.mjs`).

- [ ] **Step 4: Expose build date as env var**

In `next.config.js` (or `.mjs`), inside the config object, add:

```js
env: {
  NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
},
```

If `env` already exists, merge the key in.

- [ ] **Step 5: Create the Footer component**

Write `components/ui/Footer.tsx`:

```tsx
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE ?? '2026-05-13';

export function Footer() {
  return (
    <footer className="border-t border-fg-subtle/20 px-6 py-12 md:px-12">
      <div className="mx-auto flex max-w-content flex-col gap-4 font-mono text-[10px] uppercase tracking-widest text-fg-subtle md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1 md:flex-row md:gap-6">
          <span>© 2026 Tran Ngoc Hai · HCMC</span>
          <span>Last shipped {BUILD_DATE}</span>
        </div>
        <span className="text-fg-subtle/80">
          Set in Fraunces &amp; JetBrains Mono · Built with Next.js
        </span>
        <a
          href="#main"
          className="self-start transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:self-auto"
        >
          ↑ Top
        </a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Confirm Footer is mounted**

`app/page.tsx` should already contain `<Footer />` from Task 8. If not, add the import and place `<Footer />` inside `<SmoothScrollProvider>` after `</main>`.

- [ ] **Step 7: Run the test to confirm it passes**

```
npx playwright test tests/smoke.spec.ts -g "footer renders"
```

Expected: PASS.

---

## Task 10: Full smoke regression + visual sweep

**Files:**
- None (verification only)

- [ ] **Step 1: Run the full Playwright suite**

```
npx playwright test
```

Expected: all tests pass. If the existing `mailto + social + PDF links wired` test fails because the email anchor now wraps two `SplitReveal` children, update its selector to match by `href`:

```ts
await expect(page.locator('a[href="mailto:tranngochai171@gmail.com"]')).toBeVisible();
```

- [ ] **Step 2: Manual visual sweep at 1440×900**

Open `http://localhost:3000` in a fresh Incognito window. Verify:

- Load curtain shows once, lifts cleanly.
- Hero name renders, signature stroke draws after the name.
- Section numbers `01 02 03 04` all teal-cyan.
- Timeline first row has accent dot; hover expands it.
- Contact eyebrow reads "Contact"; email on two lines, no mid-word break; hover tints accent.
- Footer present with all four items.
- TopNav has `Work · About · Ledger · Skills · Get in Touch`. Ledger link scrolls to Timeline.

- [ ] **Step 3: Manual visual sweep at 390×844 (mobile)**

DevTools device emulation iPhone 12 Pro. Reload.

- Curtain skipped after first run (sessionStorage already set from desktop sweep — clear it if needed).
- Hero shows `TRAN NGOC HAI` wordmark over the laptop.
- Hamburger top-right opens drawer with five primary links + LinkedIn / GitHub / Download Resume. ESC closes. Tap a link closes and scrolls.
- All sections reachable.
- Footer stacks vertically.

- [ ] **Step 4: Reduced-motion sweep**

DevTools → Rendering → emulate `prefers-reduced-motion: reduce`. Reload.

- No curtain.
- Hero signature stroke fully drawn at load.
- Mobile drawer opens instantly (no stagger).
- All sections render final state.

- [ ] **Step 5: Console clean**

DevTools Console: 0 errors. (Hydration warnings are red flags — investigate the offending component.)

---

## Task 11: Final commit

**Files:**
- All changes

- [ ] **Step 1: Stage and review**

```
git status
git diff --stat
```

Confirm only the files listed in the File Structure section are touched (plus screenshots/test artefacts which should be gitignored).

- [ ] **Step 2: Commit**

```
git add -A
git commit -m "feat: luxury polish pass (Tier A)

- Wayfinding: timeline id, Ledger nav link, mobile drawer, mobile hero wordmark
- Accent: section numbers, hero signature stroke, timeline dot, case card numbers
- Contact: two-line email display, microcopy
- New: LoadCurtain (once-per-session), Footer with build date
- Tests: smoke coverage for Ledger link, mobile drawer, footer

Spec: docs/superpowers/specs/2026-05-13-luxury-polish-design.md"
```

(No `Co-Authored-By` line — per user preference, keep the trailer off.)

- [ ] **Step 3: Confirm**

```
git log -1 --stat
```

---

## Out of Scope (deferred — Tier B+)

- Timeline editorial redesign (indexed ledger with hover detail)
- Skills marquee / card treatment
- Trailer2You case tonal rewrite
- Custom dot cursor
- Cookie consent banner
- Case-study modals
