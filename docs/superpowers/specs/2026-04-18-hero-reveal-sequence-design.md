# Hero MacBook Reveal Sequence — Design

**Date:** 2026-04-18
**Scope:** Upgrade the pinned MacBook scroll section so that instead of a single static `TRAN NGOC HAI` overlay, an elegant staggered narrative reveals as the user scrubs through the pinned scroll. Corner labels morph into a watch-dial progress indicator. Adds a "scroll to discover" affordance on first paint. Luxury / cinematic feel.

## Current state

- `components/sections/Hero.tsx` contains:
  - `<ScrollVideo>` (MacBook closed→open scrub video)
  - `<SplitReveal>` rendering `TRAN NGOC HAI` once, centered, persistent
  - Four static corner labels (role / location / "Shipping since 2020" / companies list)
- `components/motion/ScrollVideo.tsx` pins the nearest `<section>` for `window.innerHeight * 3` of scroll on desktop, scrubbing `video.currentTime` against `self.progress` with `scrub: 0.5`.

## Goal

Drive a 5-beat content reveal against the same 0→1 scroll progress that already scrubs the video. Static overlays swap for progress-driven ones. Encourage the user to keep scrolling (discovery hook).

## Beat sequence

Progress ranges map to the existing pinned ScrollTrigger progress.

| Range | Beat | Content | Treatment |
|---|---|---|---|
| 0.00–0.20 | Intro | `TRAN NGOC HAI` | Split-reveal characters in, persists through range |
| 0.20–0.40 | Nickname | `— but you can call me Topy —` | Italic serif caption fades in 4px below the name; name stays |
| 0.40–0.60 | Role | `Senior Fullstack` (display) + `6+ years shipping` (mono caption) | Crossfade: name+nickname fade out while role fades in (~200ms overlap) |
| 0.60–0.85 | Portfolio | `DALMORE · NESTWELL · ZELIGATE · TRAILER2YOU` with small `+ more` suffix | Mono uppercase, letter-by-letter stagger (~30ms per glyph) |
| 0.85–1.00 | Invitation | `↓ See the work` with pulsing chevron | Hand-off to the next section |

## Corner labels — dynamic

| Range | Behavior |
|---|---|
| 0.00–0.25 | Static: current labels (role top-L, location top-R, "Shipping since 2020" bot-L, companies bot-R) |
| 0.25–0.50 | Fade out: top corners first (ends at 0.35), bottom corners next (ends at 0.50) |
| 0.50–1.00 | Replaced by progress ticks: 5 thin segments in bottom-center, lighting up sequentially as each beat activates. Watch-dial affordance + visible scroll-progress hint. |

## Discovery hook

- **First-paint scroll cue:** Below bottom-center, a small animated downward chevron + `SCROLL TO DISCOVER` (condensed uppercase, mono, subtle). Dismiss via GSAP opacity→0 the first time the user scrolls past 50px.
- **Name drift:** `TRAN NGOC HAI` translates Y by −6px across its 0.00→0.40 range, tying the headline's feel to scroll.

## Motion rules

- Easing: `power2.out` on beat transitions.
- Transitions are **progress-driven**, not time-driven — the user controls pacing by scroll.
- Overlap: 200ms window where outgoing beat fades out while incoming fades in (applied via crossfade at range boundaries, implemented as overlapping opacity ranges in GSAP timeline).
- `prefers-reduced-motion: reduce`:
  - No scrub, no drift, no pulse.
  - Display final-state composition: portfolio beat text visible, static chevron + `SEE THE WORK`, static corner labels.

## Architecture

### New files

1. `lib/hero-beats.ts` — beat config:
   ```ts
   export interface Beat {
     id: string;
     range: [number, number];           // progress range
     fadeOutRange?: [number, number];   // optional explicit fade-out
   }
   export const beats: Beat[] = [ /* 5 entries above */ ];
   ```

2. `components/motion/HeroReveal.tsx` — orchestrator. Receives a `progress` value (0–1), renders all beat DOM nodes, and drives opacity/transform via imperative GSAP quickTo-style updates in a `useEffect` reacting to progress. Keeps beat DOM nodes mounted so they can crossfade without remount cost.

### Modified files

3. `components/motion/ScrollVideo.tsx` — expose progress via a render-prop or `onProgress(progress)` callback prop so `Hero.tsx` can wire it to `<HeroReveal>`. Do NOT change pinning behavior; progress is already computed in `onUpdate`.

4. `components/sections/Hero.tsx` — replace inline `<SplitReveal>` name + corner label divs with:
   ```tsx
   <ScrollVideo ... onProgress={setProgress} />
   <HeroReveal progress={progress} />
   ```
   Keep section structure, id, and min-height identical so existing pin math continues to work.

### Progress wiring

- `Hero.tsx` holds `progress` in a `useRef` (not state) to avoid re-render storm; pass ref to both `ScrollVideo` (updater) and `HeroReveal` (reader) — `HeroReveal` uses GSAP's `ticker` or a shared `ScrollTrigger` `onUpdate` to read the ref and apply transforms.
- Alternative: use a tiny zustand store if already in the project; otherwise ref is lighter and acceptable for this case.
- Decision: **use a React context + useRef pair.** `<Hero>` creates `heroProgressRef = useRef(0)`, wraps children in a provider. `ScrollVideo` writes to the ref in its existing `onUpdate`. `HeroReveal` subscribes via `gsap.ticker.add` and reads the ref each tick, applying opacity/transform to its beat elements.

## Non-goals

- No new fonts or heavy deps (GSAP already in use).
- No change to pin duration (stays 3× viewport height).
- No change to video asset.
- No change to Work section or other pages.
- No change to Lighthouse-relevant bundle size beyond small HeroReveal component.

## Deliverables

1. `lib/hero-beats.ts` (new)
2. `components/motion/HeroReveal.tsx` (new)
3. `components/motion/ScrollVideo.tsx` (modified — expose progress)
4. `components/sections/Hero.tsx` (modified — wire HeroReveal, remove inline overlays)
5. Playwright smoke test extension: verify at 25% / 55% / 75% / 95% pinned-scroll positions the correct beat text is visible.
6. Single feature commit: `feat(hero): progressive MacBook reveal sequence with watch-dial progress`

## Risks + open questions resolved

- **Perf:** progress-driven DOM updates use GSAP ticker reading a ref — no React re-renders during scroll. Safe.
- **Layout stability:** beats are absolutely positioned center; mount all 5 at once with `opacity: 0` + `visibility: hidden` when out of range to avoid reflow.
- **Reduced motion:** explicit final-state render path. Tested.
- **Lighthouse impact:** no new network requests, no new fonts, no new JS libraries. ~2 KB gzipped of new component code. Negligible.

## Acceptance criteria

1. At scroll progress 0%, user sees intro beat + full corner labels + scroll cue.
2. At 30%, nickname caption visible below name; corner labels mid-fade.
3. At 55%, name gone; role beat centered; corners gone; progress ticks visible (2–3 lit).
4. At 75%, portfolio beat visible with letter stagger complete.
5. At 95%, invitation beat visible; 5/5 progress ticks lit.
6. `prefers-reduced-motion`: all beats in final arrangement, no scrub, no pulse, static progress ticks.
7. Existing Playwright smoke suite passes unchanged.
8. Lighthouse perf stays 100 (no regression > 2 points).
