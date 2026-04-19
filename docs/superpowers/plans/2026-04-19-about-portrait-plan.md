# About Section Portrait Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a professional headshot to the About section with grayscale-to-color scroll reveal and responsive asset pipeline, matching the site's dark editorial aesthetic.

**Architecture:** Two new components (`Portrait` presentational + `ScrollDesaturate` GSAP motion primitive) composed inside an updated `About` section grid. Six pre-generated image variants (AVIF/WebP/JPG × 2 sizes) served via `<picture>` srcSet matching the existing `CaseCard` pattern.

**Tech Stack:** Next.js 14, React 18, TypeScript, GSAP 3.15 + ScrollTrigger, Tailwind CSS, Playwright smoke tests, `sharp` (new devDep) for one-off asset conversion.

**Source asset:** `C:\Users\Admin\Downloads\Edit_the_attached_202604190722.png` (2.2MB PNG, 4:5 aspect, generated via Nano Banana to match site palette).

**Design spec:** `docs/superpowers/specs/2026-04-19-about-portrait-design.md`

---

## Task 1: Asset Pipeline — Generate Portrait Variants

**Files:**
- Create: `scripts/build-portrait.mjs`
- Create: `public/images/portrait/portrait-2026-720.{avif,webp,jpg}` (3 files, generated)
- Create: `public/images/portrait/portrait-2026-480.{avif,webp,jpg}` (3 files, generated)
- Modify: `package.json` (add `sharp` to `devDependencies`, add `build:portrait` script)
- Modify: `.gitignore` (verify `public/images/portrait/` is NOT ignored)

### - [ ] Step 1: Install sharp as devDep

Run:
```bash
pnpm add -D sharp
```

Expected: `sharp` appears in `package.json` devDependencies, `pnpm-lock.yaml` updated.

### - [ ] Step 2: Create the conversion script

Create `scripts/build-portrait.mjs`:

```js
#!/usr/bin/env node
// One-off portrait conversion. Run with: pnpm build:portrait -- <source-png>
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const source = process.argv[2];
if (!source) {
  console.error('Usage: pnpm build:portrait -- <path-to-source.png>');
  process.exit(1);
}
if (!fs.existsSync(source)) {
  console.error(`Source file not found: ${source}`);
  process.exit(1);
}

const outDir = path.resolve('public/images/portrait');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [720, 480];
const formats = [
  { ext: 'avif', options: { quality: 70, effort: 6 } },
  { ext: 'webp', options: { quality: 85 } },
  { ext: 'jpg',  options: { quality: 88, mozjpeg: true } },
];

for (const width of sizes) {
  for (const { ext, options } of formats) {
    const out = path.join(outDir, `portrait-2026-${width}.${ext}`);
    const pipeline = sharp(source).resize({ width, withoutEnlargement: true });
    const produce =
      ext === 'avif' ? pipeline.avif(options) :
      ext === 'webp' ? pipeline.webp(options) :
                       pipeline.jpeg(options);
    await produce.toFile(out);
    const { size } = fs.statSync(out);
    console.log(`  ${path.basename(out).padEnd(30)} ${(size / 1024).toFixed(1)} KB`);
  }
}

console.log('\nPortrait variants written to public/images/portrait/');
```

### - [ ] Step 3: Add npm script

Modify `package.json` scripts block:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "build:portrait": "node scripts/build-portrait.mjs"
}
```

### - [ ] Step 4: Run the conversion

Run:
```bash
pnpm build:portrait -- "C:/Users/Admin/Downloads/Edit_the_attached_202604190722.png"
```

Expected output: 6 files printed with sizes, all under 250 KB. Desktop AVIF should be ~70–100 KB.

### - [ ] Step 5: Verify file sizes are reasonable

Run:
```bash
ls -la public/images/portrait/
```

Expected: 6 files. AVIF < WebP < JPG for the same width. If any file is over 400 KB, the source may need re-encoding — flag to user and stop.

### - [ ] Step 6: Commit

```bash
git add package.json pnpm-lock.yaml scripts/build-portrait.mjs public/images/portrait/
git commit -m "feat(portrait): generate responsive image variants

Add sharp-backed build:portrait script that produces AVIF/WebP/JPG
at 720w and 480w widths. One-off generation from Nano Banana source.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Portrait Component (Presentational)

**Files:**
- Create: `components/ui/Portrait.tsx`
- Modify: `tests/smoke.spec.ts` (add one assertion, see Task 5)

### - [ ] Step 1: Create the Portrait component

Create `components/ui/Portrait.tsx`:

```tsx
interface Props {
  className?: string;
}

export function Portrait({ className }: Props) {
  return (
    <picture>
      <source
        type="image/avif"
        media="(min-width: 768px)"
        srcSet="/images/portrait/portrait-2026-720.avif"
      />
      <source
        type="image/webp"
        media="(min-width: 768px)"
        srcSet="/images/portrait/portrait-2026-720.webp"
      />
      <source
        type="image/avif"
        srcSet="/images/portrait/portrait-2026-480.avif"
      />
      <source
        type="image/webp"
        srcSet="/images/portrait/portrait-2026-480.webp"
      />
      <img
        src="/images/portrait/portrait-2026-480.jpg"
        alt="Topy Tran"
        width={480}
        height={600}
        loading="lazy"
        decoding="async"
        className={className}
      />
    </picture>
  );
}
```

Notes:
- No `'use client'` — pure presentational, works as Server Component
- `width`/`height` set to 480×600 (4:5 ratio) — prevents CLS
- Caller sizes via className (`aspect-[4/5] w-full object-cover object-top`)

### - [ ] Step 2: Type-check

Run:
```bash
rtk tsc --noEmit
```

Expected: no errors in `Portrait.tsx`.

### - [ ] Step 3: Commit

```bash
git add components/ui/Portrait.tsx
git commit -m "feat(portrait): add Portrait presentational component

Renders <picture> with AVIF/WebP/JPG sources at 720w/480w breakpoints.
Alt text and dimensions baked in. Caller handles sizing via className.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: ScrollDesaturate Motion Primitive

**Files:**
- Create: `components/motion/ScrollDesaturate.tsx`

### - [ ] Step 1: Create the primitive

Create `components/motion/ScrollDesaturate.tsx`:

```tsx
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
```

Notes:
- Matches `SplitReveal` pattern: `useRef`, `useEffect`, `gsap.registerPlugin`, `matchMedia` reduced-motion check
- Inline `el.style.filter` for initial grayscale — avoids flash-of-color before GSAP takes over
- `data-scroll-desaturate` attribute aids debugging and tests
- Cleanup kills ScrollTrigger on unmount

### - [ ] Step 2: Type-check

Run:
```bash
rtk tsc --noEmit
```

Expected: no errors.

### - [ ] Step 3: Commit

```bash
git add components/motion/ScrollDesaturate.tsx
git commit -m "feat(motion): add ScrollDesaturate primitive

GSAP + ScrollTrigger primitive that animates filter from
grayscale(100%) brightness(0.85) to clean over 900ms on scroll-in.
Respects prefers-reduced-motion by skipping animation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Update About Section

**Files:**
- Modify: `components/sections/About.tsx`

### - [ ] Step 1: Rewrite About.tsx with portrait column

Replace the contents of `components/sections/About.tsx` with:

```tsx
'use client';

import { SectionNumber } from '@/components/ui/SectionNumber';
import { FadeUp } from '@/components/motion/FadeUp';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { ScrollDesaturate } from '@/components/motion/ScrollDesaturate';
import { Portrait } from '@/components/ui/Portrait';

export function About() {
  return (
    <section
      id="about"
      className="relative bg-bg px-6 py-24 md:px-12 md:py-48"
    >
      <div className="mx-auto max-w-content">
        <SectionNumber number="01" title="About" />

        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.5fr] md:items-end md:gap-16">
          <ScrollDesaturate className="mx-auto w-full max-w-[240px] md:max-w-none">
            <Portrait className="aspect-[4/5] w-full object-cover object-top" />
          </ScrollDesaturate>

          <div className="flex flex-col gap-10">
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
              as="div"
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
      </div>
    </section>
  );
}
```

Notes:
- Grid changed from `md:grid-cols-[1fr_2fr]` to `md:grid-cols-[1fr_1.5fr]` and added `md:items-end`
- Mobile portrait wrapper: `mx-auto max-w-[240px]` caps mobile size; `md:max-w-none` removes cap on desktop
- Right column wrapped in `flex flex-col gap-10` so copy + quote stack cleanly
- All existing copy preserved verbatim
- Mobile order is natural DOM order: portrait → copy → quote (matches spec)

### - [ ] Step 2: Type-check

Run:
```bash
rtk tsc --noEmit
```

Expected: no errors.

### - [ ] Step 3: Lint

Run:
```bash
pnpm lint
```

Expected: no errors in `About.tsx`.

### - [ ] Step 4: Commit

```bash
git add components/sections/About.tsx
git commit -m "feat(about): add portrait column with scroll reveal

Two-column baseline-aligned layout on desktop (1fr 1.5fr), stacked
on mobile. Portrait fades grayscale-to-color on scroll-in via
ScrollDesaturate. Existing copy and quote preserved.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Smoke Tests

**Files:**
- Modify: `tests/smoke.spec.ts`

### - [ ] Step 1: Write failing tests

Append the following test block to `tests/smoke.spec.ts` before the closing `});` of the `test.describe`:

```ts
  test('about portrait renders with correct alt and dimensions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const portrait = page.locator('#about img[alt="Topy Tran"]');
    await expect(portrait).toBeVisible();
    await expect(portrait).toHaveAttribute('width', '480');
    await expect(portrait).toHaveAttribute('height', '600');
    await expect(portrait).toHaveAttribute('loading', 'lazy');
  });

  test('about portrait has AVIF and WebP sources', async ({ page }) => {
    await page.goto('/');
    const sources = page.locator('#about picture source');
    const count = await sources.count();
    expect(count).toBeGreaterThanOrEqual(4);
    const types = await sources.evaluateAll((els) =>
      els.map((e) => e.getAttribute('type'))
    );
    expect(types).toContain('image/avif');
    expect(types).toContain('image/webp');
  });

  test('reduced-motion: portrait renders without grayscale filter', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const wrapper = page.locator('[data-scroll-desaturate]').first();
    await expect(wrapper).toBeVisible();
    const filter = await wrapper.evaluate((el) => getComputedStyle(el).filter);
    expect(filter === 'none' || filter === '').toBe(true);
    await context.close();
  });
```

### - [ ] Step 2: Run tests to verify they fail

Run:
```bash
pnpm exec playwright test tests/smoke.spec.ts -g "about portrait"
```

Expected: FAIL — if Tasks 1–4 are not yet merged into the running dev build, tests fail because portrait not rendered. If Tasks 1–4 ARE complete, this step proves the tests correctly detect the rendered portrait; in that case skip to Step 3.

> Note: this plan's task order (portrait components first, then tests) departs from strict TDD because the component is purely presentational and the value of the test is as a regression guard, not a design driver. If strict TDD is preferred, reorder: write tests → run & fail → build components → tests pass.

### - [ ] Step 3: Start dev server and run tests

In one terminal:
```bash
pnpm dev
```

In another terminal:
```bash
pnpm exec playwright test tests/smoke.spec.ts -g "about portrait"
```

Expected: all 3 new tests PASS.

### - [ ] Step 4: Run full smoke suite to confirm no regressions

Run:
```bash
pnpm exec playwright test tests/smoke.spec.ts
```

Expected: all tests PASS, including existing hero, mailto, and reduced-motion tests.

### - [ ] Step 5: Commit

```bash
git add tests/smoke.spec.ts
git commit -m "test(smoke): verify about portrait renders and respects reduced-motion

Three new smoke tests covering the portrait <img> attributes,
picture source types, and reduced-motion filter behavior.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Visual QA in Browser

**Files:** none

### - [ ] Step 1: Start dev server

Run:
```bash
pnpm dev
```

### - [ ] Step 2: Desktop check (1440px)

Open http://localhost:3000 in Chrome at 1440px wide.

Verify:
- Portrait visible in left column of About section
- Portrait is roughly 4:5 aspect, shoulders-up framing
- Bottom of portrait aligns with bottom of pull quote (baseline-aligned)
- On initial scroll into About, portrait starts grayscale-ish and animates to full color over ~900ms
- No layout shift when portrait loads

### - [ ] Step 3: Mobile check (375px)

Use Chrome devtools device mode at 375px wide (iPhone SE).

Verify:
- Portrait centered above copy
- Portrait caps at ~240px wide, does not fill viewport
- Order: portrait → intro copy → quote
- No horizontal scroll

### - [ ] Step 4: Reduced-motion check

In Chrome DevTools: `Rendering` panel → `Emulate CSS media feature prefers-reduced-motion` → `reduce`.

Reload page. Scroll to About.

Verify:
- Portrait renders fully saturated immediately, no grayscale flash
- No GSAP animation visible

### - [ ] Step 5: Network waterfall check

DevTools → Network tab, filter `Img`. Reload.

Verify on desktop (1440px):
- `portrait-2026-720.avif` is requested (not the 480w variant)
- No `portrait-2026-480.*` variants loaded when desktop media query matches

Throttle to mobile (375px), reload:
- `portrait-2026-480.avif` requested
- No 720w variants loaded

### - [ ] Step 6: Document QA result

No commit needed. Report in terminal: "Visual QA passed on desktop 1440, mobile 375, reduced-motion." If any check fails, fix inline and re-verify before marking plan complete.

---

## Self-Review Checklist

- **Spec coverage:** Layout (Task 4), Motion (Task 3), Assets (Task 1), Component API (Tasks 2 + 3), Testing (Task 5), Visual QA (Task 6). All spec sections covered.
- **Placeholders:** none.
- **Type consistency:** `Portrait.tsx` props `{ className?: string }` used in Task 4 as `<Portrait className="..." />`. `ScrollDesaturate.tsx` props `{ children, className, duration?, start? }` used in Task 4 with only `className` and `children`. Consistent.
- **File paths:** all absolute from project root. Verified against existing project structure (`components/motion/`, `components/ui/`, `components/sections/`, `tests/smoke.spec.ts`, `public/images/`, `docs/superpowers/`).
- **Verified patterns match:** `ScrollDesaturate` follows `SplitReveal` GSAP pattern. `Portrait` follows `CaseCard` `<picture>` pattern. Tests append to existing `tests/smoke.spec.ts` (project uses a single smoke file, not per-feature).
