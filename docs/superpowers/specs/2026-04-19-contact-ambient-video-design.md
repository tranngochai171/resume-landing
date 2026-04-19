# Contact Section — Ambient Video Background

**Date:** 2026-04-19
**Scope:** Add a subtle looping video background to the Contact section, tuned to whisper behind the oversized email CTA.

## Goal

Elevate the Contact section from flat `#000` + type to an on-brand luxury finale with ambient teal caustics motion. The CTA (email) remains the unambiguous subject; the video is atmosphere.

## Assets (already in repo)

- `public/videos/contact-ambient.mp4` — 16s seamless ping-pong loop, 1920×1080, 24fps, ~7.6 MB
- `public/images/contact-poster.jpg` — mid-frame poster, used as the `poster` attribute

## Component Changes

Single file: `components/sections/Contact.tsx`.

Insert a `<video>` element and a radial vignette overlay as the first two children of the `<section>`, both absolutely positioned behind the existing content.

```tsx
<section id="contact" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 py-24 text-center md:px-12">
  <video
    src="/videos/contact-ambient.mp4"
    poster="/images/contact-poster.jpg"
    autoPlay
    muted
    loop
    playsInline
    preload="metadata"
    aria-hidden
    className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-25 mix-blend-screen motion-reduce:hidden"
  />
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 -z-10"
    style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #000 85%)' }}
  />
  {/* existing content unchanged */}
</section>
```

### Required tweaks to the existing section element

- Add `overflow-hidden` (clip video to section bounds)
- Add `relative` (already present — verify stacking context)

### Layer order

1. Section `bg-bg` (`#000`)
2. `<video>` — `-z-10`, `opacity 0.25`, `mix-blend-screen`
3. Radial vignette — `-z-10`, fades video to pure `#000` at corners
4. Existing content (default z)

## Behavior

| Scenario | Result |
|----------|--------|
| Default desktop | Video autoplays muted, loops forever, whisper-level opacity |
| Mobile / small viewport | Same video, same styling. `preload="metadata"` defers byte download until scroll |
| `prefers-reduced-motion` | `motion-reduce:hidden` removes video from flow. Section falls back to pure `#000` + CTA |
| Autoplay blocked (rare, muted+playsInline should allow) | Poster image shows via the video element's fallback |
| Slow network | Poster renders first, video streams in |

## Accessibility

- Video is decorative. `aria-hidden` on both video and vignette.
- `prefers-reduced-motion` support via `motion-reduce:hidden` Tailwind variant.
- CTA contrast unaffected — vignette drops corners to `#000`, CTA sits at center where video peaks at 0.25 opacity but underlying text is `#F5F5F4` on `#000` with teal hover.

## Out of Scope

- No scroll-triggered fade-in on the video (it's ambient, not a reveal moment).
- No Lenis / GSAP integration — `<video>` handles its own loop.
- No new motion libraries or hooks.
- No viewport-based video swap (same file served everywhere).
- No further compression pass — 7.6 MB ships as-is for now. Flag for follow-up if Lighthouse regresses.

## Verification

1. `pnpm dev` — load `/`, scroll to Contact section.
2. Confirm caustics whisper visible at section center, fading to pure black at corners.
3. Confirm email CTA remains fully legible and the teal hover glow still reads.
4. Toggle OS reduced-motion — video disappears, section falls back to `#000` + text.
5. Lighthouse check — Contact section should not introduce CLS; LCP unaffected (CTA is the LCP candidate).
6. Optional: extend `tests/smoke.spec.ts` with a Contact `<video>` presence assertion.

## Risks

- **File size (7.6 MB):** borderline-heavy. Mitigation: `preload="metadata"`. If Lighthouse mobile score drops, re-encode at `-crf 28` to ~4 MB.
- **Autoplay policy on iOS:** mitigated by `muted` + `playsInline`.
- **`mix-blend-screen` cost:** small repaint on scroll; negligible at this size.
