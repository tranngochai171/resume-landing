# Luxury Polish Pass — Design

**Date:** 2026-05-13
**Scope:** Tier A — polish existing site. No new sections, no motion language rebuild.
**Goal:** Close wayfinding bugs, raise perceived craft to luxury bar, restore intentional accent colour.

---

## 1. Wayfinding Fixes

### 1.1 Timeline anchor

`components/sections/Timeline.tsx` — add `id="timeline"` to the `<section>` element. Currently the section is unreachable via hash link.

### 1.2 TopNav adds Ledger

`components/ui/TopNav.tsx` — extend desktop nav array from `['Work', 'About', 'Skills']` to `['Work', 'About', 'Ledger', 'Skills']`. `Ledger` hrefs to `#timeline`. No other change to desktop styling.

### 1.3 Mobile drawer nav

New component: `components/ui/MobileNav.tsx`.

- Trigger: hamburger icon button, top-right of TopNav, visible only `md:hidden`. Replaces the current always-visible `Get in Touch` pill on mobile (the pill stays on desktop).
- Drawer: full-viewport overlay (`fixed inset-0 z-[60]`), `bg-bg/95 backdrop-blur-2xl`.
- Content: vertically centered stack — `Work`, `About`, `Ledger`, `Skills`, `Contact`, then divider, then `LinkedIn / GitHub / Download Resume`.
- Typography: links use `font-display text-4xl`, social row uses `font-mono text-xs uppercase tracking-widest`.
- Motion: drawer fades + translates `y:8px → 0` (200ms). Links stagger-reveal (`framer-motion` variants, 40ms stagger).
- Dismiss: hamburger toggles to close-X, ESC key, click on scrim, or link click.
- A11y: `aria-expanded`, `aria-controls`, focus trap, scroll lock via `overflow-hidden` on `<html>` while open. Respects `prefers-reduced-motion` (instant open, no stagger).

### 1.4 Hero mobile wordmark

`components/sections/Hero.tsx` mobile branch — overlay the `TRAN NGOC HAI` wordmark on the final laptop frame so mobile users get the same brand reveal as desktop.

- Position: absolute, vertically centered over the laptop image, full-width with `px-6`.
- Type: `font-display font-light text-[clamp(2.5rem,12vw,4rem)] tracking-tight text-fg`.
- Motion: fade-in at scroll progress matching desktop (or simply fade-in on mount for mobile, since scroll-pinned hero is desktop-only).
- Decision: re-use existing `SplitReveal` if mobile hero is in-view at mount; otherwise plain opacity transition.

---

## 2. Accent Moments (teal-cyan)

Token: `text-accent` / `bg-accent` (existing Tailwind token). Reserve for the four moments below.

### 2.1 Section numbers in accent

`components/ui/SectionNumber.tsx` — change the number span from `text-fg-subtle` (or whatever current colour) to `text-accent`. Title stays muted. Affects About (01), Work (02), Timeline (03), Skills (04). Hero stays unnumbered — it is the cover, not a chapter; the signature stroke (2.2) is Hero's accent moment.

### 2.2 Hero signature stroke

In Hero, beneath the `TRAN NGOC HAI` wordmark, add an SVG hairline that animates from `pathLength: 0 → 1` after the name reveal completes.

- Stroke: 1px, `stroke-accent`, slight asymmetry (signature feel — start lifted, end dropped ~4px).
- Width: ~60% of wordmark width, anchored left-aligned beneath the name.
- Timing: starts at `+200ms` after wordmark reveal, duration 600ms, `ease: [0.6, 0.01, 0.05, 0.95]`.
- Reduced-motion: appears instantly, no draw animation.

### 2.3 Timeline accent indicator

`components/sections/Timeline.tsx` — prepend a 6px teal dot (`bg-accent rounded-full`) to the most-recent role row only (first item in array). On row hover, dot expands to a 24px hairline `bg-accent h-px w-6`. Other rows show a transparent dot of the same size for grid alignment.

### 2.4 Case cards: accent on CTAs

`components/sections/CaseCard.tsx` — any "Visit site" / arrow links currently `text-fg` switch to `text-accent` with `hover:text-fg` (reverse polarity). External-link arrow glyph (`→` or SVG) also accent.

---

## 3. Contact Email — Two-line Display

`components/sections/Contact.tsx` line 76-88.

Replace single `SplitReveal` of `tranngochai171@gmail.com` with two stacked `SplitReveal` lines:

```
tranngochai171
@gmail.com
```

- Same anchor `<a href="mailto:…">` wraps both spans.
- Display type `font-display text-[clamp(2rem,9vw,5rem)] font-light leading-[0.95] tracking-tight`.
- Second line (`@gmail.com`) renders in `text-fg-muted` for tonal split; whole anchor `group-hover:text-accent`.
- Reduces max clamp from `text-8xl` to `text-7xl` to avoid edge-touching at xl breakpoints.
- Each line gets its own stagger (no mid-domain break possible).

Update smoke test if it asserts the email anchor's text content (probably unaffected since `aria-label` or anchor text still resolves).

---

## 4. Page-load Curtain

New component: `components/motion/LoadCurtain.tsx`.

- Mounted in `app/page.tsx` as the **first child** of the returned tree, outside `SmoothScrollProvider`, so ScrollTrigger initialises against the final layout. Renders a `fixed inset-0 z-[100] bg-bg flex items-center justify-center` div.
- Centerpiece: `T` glyph in Fraunces, `text-[clamp(4rem,12vw,8rem)] font-light text-fg`.
- Below the glyph, a 1px `bg-accent w-12` hairline at 50% opacity.
- Sequence:
  1. `t=0`: curtain visible, glyph at `opacity-0`.
  2. `t=0→400ms`: glyph fades to `opacity-1` (`ease-out`).
  3. `t=400→600ms`: hold.
  4. `t=600→1100ms`: curtain translates `y: 0 → -100%` (`ease: [0.7, 0, 0.2, 1]`). Glyph fades to 0 at `t=600→900`.
  5. `t=1100ms`: component unmounts.
- Guard: read `sessionStorage.getItem('curtainSeen')`. If truthy, skip render. On mount, set the key.
- `prefers-reduced-motion`: skip entirely (no curtain, no flag write).
- Lock body scroll while curtain is up.

Concern to verify in implementation: if ScrollTrigger still measures off-by-curtain-height despite the mount order, dispatch `window.dispatchEvent(new Event('resize'))` and call `ScrollTrigger.refresh()` after curtain unmount.

---

## 5. Footer

New component: `components/ui/Footer.tsx`, mounted in `app/page.tsx` after `<Contact />` inside `<main>`.

Layout (single `<footer>`, three flex/grid rows on desktop, stacked on mobile):

```
© 2026 Tran Ngoc Hai          Last shipped 2026-05-13          ↑ Top
Set in Fraunces & JetBrains Mono · Built with Next.js
```

- Typography: all `font-mono text-[10px] uppercase tracking-widest text-fg-subtle`.
- Spacing: `py-12 px-6 md:px-12`, `border-t border-fg-subtle/20`.
- `Last shipped` date: injected at build time via `process.env.NEXT_PUBLIC_BUILD_DATE` set in `next.config.js` (or read from `package.json` build script). Falls back to a literal `2026-05-13` if env missing.
- `↑ Top` is an anchor `href="#main"` with `focus-visible` outline.
- Mobile: stack rows vertically, left-align all text, back-to-top becomes its own row.

Remove the existing `Ho Chi Minh City · 2026` paragraph from `Contact.tsx` — its info migrates into the footer's first row as a `·` suffix: `© 2026 Tran Ngoc Hai · HCMC`.

---

## 6. Microcopy

`components/sections/Contact.tsx` — change eyebrow line 73 from `Get in Touch` to `Contact`. Nav button keeps `Get in Touch` (CTA verb).

---

## 7. Files Touched

**Modified:**
- `app/page.tsx` — mount `LoadCurtain`, mount `Footer`.
- `components/ui/TopNav.tsx` — add `Ledger`, swap mobile CTA for hamburger.
- `components/ui/SectionNumber.tsx` — accent colour.
- `components/sections/Hero.tsx` — mobile wordmark, signature stroke SVG.
- `components/sections/Timeline.tsx` — `id="timeline"`, accent dot.
- `components/sections/Contact.tsx` — two-line email, eyebrow microcopy, remove HCMC line.
- `components/sections/CaseCard.tsx` — accent CTAs.
- `next.config.js` — expose `NEXT_PUBLIC_BUILD_DATE`.

**New:**
- `components/ui/MobileNav.tsx`
- `components/ui/Footer.tsx`
- `components/motion/LoadCurtain.tsx`

**Tests:**
- `tests/smoke.spec.ts` — extend nav assertion to include `Ledger`. Add assertion that `#timeline` is reachable. Add assertion that mobile drawer opens and contains links. Add footer assertion (`© 2026`, `Last shipped`).

---

## 8. Out of Scope (deferred)

- Timeline editorial redesign (indexed ledger with hover detail)
- Skills marquee / card treatment
- Trailer2You case tonal rewrite
- Custom dot cursor
- Cookie consent banner
- Case-study modals

These are Tier B+ candidates and tracked separately.

---

## 9. Success Criteria

- All four navigation links resolve to in-view sections at desktop and mobile.
- Mobile drawer opens, traps focus, closes via ESC / scrim / link click.
- Hero shows the wordmark on mobile.
- Section numbers `00`–`04` render in teal-cyan.
- Hero signature stroke draws on first reveal, instant on reduced-motion.
- Timeline most-recent role shows the accent dot; hover expands.
- Contact email renders on two lines at every breakpoint, no mid-word break.
- Load curtain runs once per session, skipped on reduced-motion.
- Footer renders below Contact with all four items.
- Smoke + a11y tests pass.
- No console errors.
- Lighthouse perf score not regressed by more than 3 points vs current.
