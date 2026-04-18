---
name: gsap-lenis-patterns
description: GSAP + Lenis + Framer Motion integration patterns for the resume-landing scroll-driven hero and section animations. Use when building any motion component, debugging scroll-scrubbed video, integrating Lenis with ScrollTrigger, or writing SplitText character reveals. Covers reduced-motion fallbacks and mobile branching.
---

# GSAP + Lenis + Framer Motion Patterns

Motion source of truth for the resume-landing build.

## Stack

- **GSAP 3.12+** — ScrollTrigger (scroll-scrubbed hero) + SplitText (type reveals)
- **Lenis 1.x** — weighted smooth scroll, desktop + tablet only
- **Framer Motion 11+** — declarative entry animations + hover micro-interactions only

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
