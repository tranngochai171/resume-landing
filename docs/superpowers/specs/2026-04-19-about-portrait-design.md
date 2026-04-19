# About Section Portrait — Design Spec

**Date:** 2026-04-19
**Section affected:** `01 About` (`components/sections/About.tsx`)
**Status:** Approved, ready for implementation plan

## Goal

Add a professional headshot of Topy Tran to the About section of the resume landing page. Match the site's dark luxurious editorial aesthetic. Preserve existing copy and section flow.

## Why About Section

The MacBook scroll Hero owns the opening narrative and must not be split with a face. Contact already has an ambient video background — adding a portrait would fight for attention. TopNav avatars read as LinkedIn-tier and undercut the anonymous-auteur brand positioning. About is the "who am I" moment in the scroll narrative and has existing 2-column structure that a portrait slots into naturally.

## Source Asset

- Path: `C:\Users\Admin\Downloads\Edit_the_attached_202604190722.png`
- Size: 2.2 MB, aspect roughly 4:5
- Subject: black suit, black shirt, neutral face, low-key cinematic lighting with subtle teal-cyan rim, pure black background
- Generated via Nano Banana (Gemini 2.5 Flash Image) to match site's `#000` + `#4FD1C5` accent palette

## 1. Layout

### Desktop (≥768px)

- Change About grid from `md:grid-cols-[1fr_2fr]` to `md:grid-cols-[1fr_1.5fr]`
- Add `md:items-end` to align column bottoms (baseline-aligned half-split)
- Left column: `<Portrait />` wrapped in `<ScrollDesaturate />`
- Right column: existing intro copy (`<FadeUp>`) + existing pull quote (`<SplitReveal>`), stacked with `gap-10`
- Portrait sized via `aspect-[4/5]` + `w-full` inside left column — natural height from column width

### Mobile (<768px)

- Single column, `grid-cols-1 gap-10`
- Stack order: Portrait → intro copy → pull quote
- Portrait centered, `max-w-[240px] mx-auto`

### Section numbering

- `SectionNumber number="01" title="About"` unchanged, stays at top

### Copy

- No changes to existing bio paragraphs or pull quote

## 2. Motion

### Treatment

Grayscale-to-color reveal. Portrait enters the layout already rendered, with `filter: grayscale(100%) brightness(0.85)`. When the portrait's top edge crosses 80% of the viewport (i.e. 20% scrolled into view), GSAP animates the filter to `grayscale(0%) brightness(1)` over 900ms with `power2.out` easing. Fires once (`scrollTrigger: { once: true }`).

### No fade, no y-offset

User chose motion variant C, not D. The portrait is in layout on page load — only the color activates on scroll.

### Reduced motion

If `prefers-reduced-motion: reduce` is set, skip GSAP entirely. Render the portrait with default (clean) filters from first paint. Matches project-wide pattern in `FadeUp`, `SplitReveal`, and `ScrollVideo`.

### GSAP + Lenis integration

Already wired in `SmoothScrollProvider`. The new `ScrollDesaturate` component uses the same `ScrollTrigger` registration pattern as existing motion primitives — no new setup needed.

## 3. Assets

### Conversion

One-off conversion from source PNG using `sharp-cli` (or `ffmpeg`). Output six files to `public/images/portrait/`:

```
portrait-2026-720.avif
portrait-2026-720.webp
portrait-2026-720.jpg
portrait-2026-480.avif
portrait-2026-480.webp
portrait-2026-480.jpg
```

Expected sizes:
- 720w AVIF: 70–100 KB
- 720w WebP: 120–180 KB
- 720w JPG: 150–220 KB
- 480w variants: ~50–60% of desktop sizes

### Conversion command (document in spec for reproducibility)

```bash
# With sharp-cli
npx sharp-cli -i source.png -o portrait-2026-720.avif --format avif --quality 70 resize 720
npx sharp-cli -i source.png -o portrait-2026-720.webp --format webp --quality 85 resize 720
npx sharp-cli -i source.png -o portrait-2026-720.jpg --format jpeg --quality 88 resize 720
# Repeat for 480w
```

No build-time image processing. No new runtime dependencies. `sharp-cli` is dev-only if used.

### Markup (matches CaseCard.tsx pattern)

```tsx
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
    loading="lazy"
    decoding="async"
    width="480"
    height="600"
    className="h-full w-full object-cover object-top"
  />
</picture>
```

### Accessibility

- Alt: `"Topy Tran"` — no "photo of" prefix (redundant on screen readers)
- Explicit `width`/`height` on `<img>` prevent CLS
- `loading="lazy"` — About section is below Hero, safe to defer

## 4. Component API

### A) `components/motion/ScrollDesaturate.tsx` (new)

**Purpose:** reusable GSAP + ScrollTrigger primitive that animates `filter` from grayscale to color once on scroll-in.

**Props:**
```ts
type ScrollDesaturateProps = {
  children: React.ReactNode;
  className?: string;
  duration?: number;   // default 0.9
  start?: string;      // ScrollTrigger start, default "top 80%"
};
```

**Behavior:**
- Wraps children in a `<div>` with forwarded `className`
- `useEffect`: on mount, register `gsap.fromTo` with `scrollTrigger: { trigger, start, once: true }`
- Reduced-motion check via `window.matchMedia('(prefers-reduced-motion: reduce)')` — skip GSAP if set, render children with no filter applied
- Cleanup: kill ScrollTrigger on unmount

### B) `components/ui/Portrait.tsx` (new)

**Purpose:** isolates the `<picture>` block and asset paths in one place. Caller handles sizing via className.

**Props:**
```ts
type PortraitProps = {
  className?: string;
};
```

**Behavior:**
- Renders the full `<picture>` element defined in section 3
- Caller `className` is applied to the inner `<img>` — sizing and object-fit live with the image, wrapper `<picture>` stays unstyled
- Alt text baked in
- No priority prop — `loading="lazy"` is correct for About section placement

### C) Edit `components/sections/About.tsx`

Changes:
- Import `Portrait` from `@/components/ui/Portrait`
- Import `ScrollDesaturate` from `@/components/motion/ScrollDesaturate`
- Change outer grid: `md:grid-cols-[1fr_2fr]` → `md:grid-cols-[1fr_1.5fr]`
- Add `md:items-end` to the grid wrapper
- Prepend portrait column:
  ```tsx
  <ScrollDesaturate className="mx-auto w-full max-w-[240px] md:max-w-none">
    <Portrait className="aspect-[4/5] w-full" />
  </ScrollDesaturate>
  ```
- Existing `<FadeUp>` + `<SplitReveal>` stay in right column, wrapped in a flex-col container with `gap-10`
- All existing copy preserved verbatim

## Testing

- Smoke test at `tests/smoke/about-portrait.spec.ts`: portrait `<img>` renders with non-empty `src`, `alt="Topy Tran"`
- Reduced-motion test: with `prefers-reduced-motion: reduce`, portrait element has no GSAP inline styles applied
- Mobile (375px) and desktop (1440px) visual check: layout order correct, no CLS
- Lighthouse regression check: portrait section should not drop performance score below current baseline

## Out of Scope

- Next/Image adoption (project has explicitly chosen plain `<picture>` — do not introduce)
- Hover interactions (no zoom, no tilt)
- Second portrait / candid variant
- Portrait in TopNav, Hero, or Contact
- Build-time image optimization pipeline (manual conversion is sufficient for one asset)

## File List

**New:**
- `components/motion/ScrollDesaturate.tsx`
- `components/ui/Portrait.tsx`
- `public/images/portrait/portrait-2026-720.avif`
- `public/images/portrait/portrait-2026-720.webp`
- `public/images/portrait/portrait-2026-720.jpg`
- `public/images/portrait/portrait-2026-480.avif`
- `public/images/portrait/portrait-2026-480.webp`
- `public/images/portrait/portrait-2026-480.jpg`
- `tests/smoke/about-portrait.spec.ts`

**Edited:**
- `components/sections/About.tsx`

## Success Criteria

- Portrait visible in About section on desktop (left column, 4:5, baseline-aligned with quote)
- Portrait visible on mobile (centered, 240px max-width, stacked above copy)
- Grayscale → color animation fires once when section scrolls into view
- `prefers-reduced-motion` disables the animation
- No CLS on initial load
- All image variants served at correct breakpoints (verified via devtools network tab)
- Lighthouse Performance score not regressed vs current baseline
- Smoke test passes
