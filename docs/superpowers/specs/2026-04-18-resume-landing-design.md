# Resume Landing — Design Spec

**Date:** 2026-04-18
**Project:** `D:/Works/resume-landing` — personal resume landing for Topy Tran
**Status:** Design approved, ready for implementation planning

---

## Goal

Ship an elegant, professional, luxurious resume landing page that functions as both Topy Tran's calling card AND a demonstration of his engineering skill. Dark, editorial, cinematic. One page, scroll-driven, static export, deployed to Vercel.

**Success:** A senior hiring manager lands on the site, scrolls through in 60 seconds, and walks away with three takeaways: (1) this person ships beautiful production work, (2) they know React/Next.js/Stripe/full-stack deeply, (3) they deserve a conversation.

---

## Brand + Content

**Subject:** Tran Ngoc Hai (Topy Tran) — Senior Fullstack Web Developer, 6+ years, Ho Chi Minh City, Vietnam.

**Positioning line:** *Senior Fullstack Developer shipping production apps in FinTech, HealthTech, SaaS, and eCommerce — from SEC-regulated investment platforms to AI-powered recruitment tools.*

Full resume content extracted and locked at `.claude/skills/design-inspiration/references/resume-content.md`.

---

## Design References (locked)

Deep analysis at `moodboard/deep-refs/ANALYSIS.md`.

- **MARCEAU (Jenkate MW)** — HERO blueprint. Cinematic filmmaker portfolio. Oversized display type behind a cinematic subject, corner metadata blocks, teaser project nav at hero base, dark void with teal glow accent.
- **PMA Architecture Studio (LAIN)** — BODY blueprint. Editorial minimalist portfolio. Asymmetric 70/30 photo-left + editorial-text-right splits, uppercase pull quotes with wide tracking, leader-dot caption strips, superscript section numbers.

---

## Design System (locked in design-inspiration skill)

### Color

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#000000` | Page background — pure void |
| `--bg-elev` | `#0A0A0A` | Elevated surfaces |
| `--fg` | `#F5F5F4` | Primary text |
| `--fg-muted` | `#8A8A87` | Secondary text |
| `--fg-subtle` | `#3F3F3E` | Dividers, faint text |
| `--accent` | `#7DD3C8` | Teal-cyan glow (links, hover, highlights) |
| `--accent-glow` | `rgba(125, 211, 200, 0.18)` | Soft ambient glow |
| `--accent-dim` | `#3A5D58` | Low-emphasis accent |

### Typography (hybrid — locked in Q1)

- **Display serif (hero name + pull quotes):** Fraunces, weights 300-500, optical size 144, `tracking-tight -0.02em`, `line-height 0.9`
- **Uppercase labels + section numbers:** PP Neue Machina or Druk Wide (condensed bold sans), `tracking-widest 0.1em`, `uppercase`
- **Body:** Geist Sans, weights 400-500, `line-height 1.65`
- **Mono (tags, timeline, metadata):** Geist Mono, weights 400

Scale:

| Token | Size | Mobile override |
|-------|------|-----------------|
| `display-xl` | 8rem (128px) | 3.5rem (56px) |
| `display-lg` | 5rem (80px) | 2.5rem (40px) |
| `display-md` | 3rem (48px) | 1.75rem (28px) |
| `body-lg` | 1.125rem | — |
| `body-md` | 1rem | — |
| `body-sm` | 0.875rem | — |
| `mono-sm` | 0.75rem | — |

### Layout

- Pure `#000` background, asymmetric editorial grid, generous whitespace (`py-48` desktop / `py-24` mobile between sections).
- `rounded-none` by default. Only rounded on pills (`rounded-full`) and buttons (`rounded-lg`).
- Max content width `1440px`, text columns `max-w-[640px]`.

---

## Tech Stack

**Framework:** Next.js 14 App Router, **static export** (`output: 'export'`, `images: { unoptimized: true }`).
**Styling:** Tailwind CSS with tokens above.
**Deployment:** Vercel (connect GitHub, zero-config).
**Domain:** `topytran.vercel.app` initially, custom domain (`topy.dev` or `topytran.com`) post-launch.

**Motion stack** (locked in Q4):

| Library | Purpose | Size |
|---------|---------|------|
| GSAP + ScrollTrigger + SplitText | Scroll-scrubbed video hero, character-by-character type reveals | ~50kb |
| `@studio-freight/lenis` | Weighted smooth scroll (desktop/tablet only) | ~3kb |
| framer-motion (minimal subset) | Entry animations, hover micro-interactions | ~15-20kb |

**Initial JS bundle budget:** <120kb.

**Fonts:** `next/font/google` for Fraunces + Geist Sans + Geist Mono. PP Neue Machina / Druk Wide self-hosted or Adobe Fonts.

---

## Responsive Strategy

| Breakpoint | Behavior |
|------------|----------|
| `<768px` (mobile) | Autoplay muted loop on hero (no scroll-scrub), native scroll (Lenis off), 1-column stacked sections, nav drops anchor links (keeps monogram + `CONTACT`), display type scales to ~56px |
| `768-1023px` (tablet) | Autoplay loop hero, Lenis on, hybrid layouts (hero 2-col, Work stacked), full nav |
| `≥1024px` (desktop) | Scroll-scrubbed video hero, Lenis on, PMA 70/30 asymmetric layouts, full nav |

Hero video component detects `isDesktop && !isTouch`:
- **True** → GSAP ScrollTrigger scrub mode
- **False** → IntersectionObserver autoplay when visible

Poster (`01-closed.png`) always renders immediately. Video layers on top. If video fails, poster stays. Zero broken states.

---

## Page Structure

Single page, six sections + sticky top nav + thin footer.

### 0. Top Nav (sticky, blurred glass)

- Left: `[T]` monogram + `Hi, I'm Topy 👋` greeting chip
- Right: `Work · About · Skills · [GET IN TOUCH]`
- Mobile: drops middle anchors, keeps monogram + `CONTACT`

### 1. Hero (100vh, pinned on desktop scroll-scrub)

- Scroll-scrubbed MacBook video (desktop) / autoplay loop (mobile)
- Corner metadata top-left: `SENIOR FULLSTACK DEVELOPER`
- Corner metadata top-right: `BASED IN HO CHI MINH CITY, VIETNAM`
- Centered oversized name: `TRAN NGOC HAI` (Fraunces 300, display-xl), crossfades opacity with video
- Subtitle at scroll end: `Senior Fullstack Developer · 6+ years · FinTech · HealthTech · SaaS`
- Teaser nav at base: `SHIPPING SINCE 2020 · DALMORE / NESTWELL / ZELIGATE`

### 2. About (~80vh asymmetric split)

Section number `01`, left body column (30-40 words max) + right pull quote in PP Neue Machina uppercase (`"SIX YEARS SHIPPING PRODUCTION APPS FROM SEC-REGULATED INVESTMENT PLATFORMS TO AI RECRUITMENT TOOLS."`).

### 3. Selected Work (~130vh per card, 4 cards)

PMA 70/30 asymmetric per card. Hybrid imagery (locked in Q5):

| # | Project | Media | Copy |
|---|---------|-------|------|
| 01 | Dalmore Group | Typographic hero (NDA-gated SEC platform — no screenshot) | Role + 3 bullets: 3-portal architecture, KYC/AML+Persona, Stripe+Plaid+ACH+Wire |
| 02 | Nestwell | Real screenshot (user owns the product) | Role + 3 bullets: tRPC+Supabase from scratch, quiz/scoring/PDF reports, 600+ tests+RLS+20 migrations |
| 03 | Zeligate | Short video loop of AI reel UI OR typographic fallback | Role + 3 bullets: AI ranking/shortlisting, 50+ ATS integrations, timezone-aware scheduling |
| 04 | Trailer2you | Typographic (no live access) | Role + 3 bullets: 2yr 70% hands-on lead, Stripe bookings, mentorship |

Each card's caption strip at base: `PROJECT · · · · · · · · LOCATION · · · · · · · · DATES` (mono caps, leader dots, `text-fg-subtle`).

### 4. Timeline / Ledger (~60vh)

Section number `02`. Compressed one-line-per-role ledger for all 7 positions (2020-present). Geist Mono 13px, `tabular-nums`, thin `border-b` between rows. Row hover: lifts 2px, company name shifts to `text-accent`.

### 5. Skills (~50vh)

Section number `03`. Grouped pill grid:

- FRONTEND: React 18, Next.js, TypeScript, Tailwind, Shadcn/ui, Radix
- BACKEND: NestJS, Node.js, tRPC, GraphQL, REST
- PAYMENTS: Stripe, Plaid, Persona KYC/AML
- STATE: TanStack Query, Zustand, Jotai, Redux Toolkit, RHF+Zod
- CLOUD: AWS, Supabase, Vercel, Azure DevOps, Docker
- TESTING: Vitest, Playwright, RTL

### 6. Contact (100vh, dramatic finale)

- Small label: `GET IN TOUCH`
- Oversized email: `tranngochai171@gmail.com` (Fraunces 300, 96px desktop)
- Supporting row below: `LINKEDIN · GITHUB · DOWNLOAD RESUME (PDF)` (mono caps, wide tracking)
- Footer line: `Ho Chi Minh City · 2026`

No contact form, no Cal.com (Q6 = D minus book-a-call). PDF = `public/resume/Topy_Tran_Resume_2026.pdf`.

---

## Animation System

Full detail of every motion moment.

### Global: Lenis smooth scroll

- File: `components/motion/SmoothScrollProvider.tsx`
- `duration: 1.2`, exponential ease-out, `smoothWheel: true`, `smoothTouch: false`
- RAF loop wraps the whole app; `ScrollTrigger.scrollerProxy` reads Lenis scroll values
- **Rule:** every scroll-bound animation reads from Lenis, never `window.scrollY`

### Hero: scroll-scrubbed video (desktop ≥1024px only)

- File: `components/motion/ScrollVideo.tsx`
- Pin length: `+=${innerHeight * 3}` (3 viewport scrolls to play 6s video)
- Scrub: `0.5` (half-second catch-up = weighted feel)
- 0→40%: segment 1 (hand opens lid)
- 40→60%: hold on "fully open"; name fades `1 → 0.3`
- 60→100%: segment 2 (lid auto-closes half); name fades back `0.3 → 1`
- Mobile/tablet: IntersectionObserver autoplay on viewport entry, no scroll binding

### Hero: name reveal on load

- File: `components/motion/SplitReveal.tsx` (GSAP SplitText + ScrollTrigger)
- `TRAN NGOC HAI` splits by character, each fades in from `y:24px, opacity:0, filter: blur(8px)` → normal, 0.04s stagger, 0.8s total
- Corner metadata stagger in 0.3s after name completes

### Section entries (About, Timeline, Skills, Contact)

- File: `components/motion/FadeUp.tsx` (Framer Motion variant)
- `{opacity:0, y:40} → {opacity:1, y:0}`, duration 0.8s, `ease: [0.215, 0.61, 0.355, 1]`
- `viewport: { once: true, margin: '-100px' }`

### Selected Work: case cards

- GSAP ScrollTrigger inline in `components/sections/Work.tsx`
- Image/typographic block: `{opacity:0, scale:0.96, y:40} → normal`, 0.8s, `power2.out`, triggers at 20% viewport
- Text column: word-by-word fade-in via SplitText, 0.03s stagger, triggers 0.2s after image
- Leader-dot caption: left-to-right reveal via `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)`, 0.6s

### Timeline: ledger rows

- Framer Motion inline in `components/sections/Timeline.tsx`
- Container `staggerChildren: 0.08`; each row `{opacity:0, x:-20} → {opacity:1, x:0}`, 0.5s
- Hover: `y:-2` lift + company name color shifts to `text-accent`

### Skills: pills

- Framer Motion inline in `components/sections/Skills.tsx`
- Container `staggerChildren: 0.03`; each pill `{opacity:0, scale:0.9} → normal`, 0.25s
- Deliberately fast — ~30 pills

### Contact finale

- GSAP SplitText inline in `components/sections/Contact.tsx`
- `GET IN TOUCH` label fades first (0.4s)
- Email address character-split + blur reveal, 0.04s stagger (rhymes with hero name)
- Supporting links fade up 0.5s after email completes
- Email hover: underline slides in left-to-right via `transform: scaleX()` on `::after` pseudo-element

### Reduced-motion branch

`useReducedMotion()` in `SmoothScrollProvider`:

- Lenis disabled, native scroll
- GSAP ScrollTriggers still pin but scrub disabled (video stays on poster)
- Framer Motion `duration: 0`
- SplitText skipped, final state shown

Site fully usable with zero motion. Poster is the LCP element.

### Animation discipline rules

1. No elastic/bounce/back easing — `power3.out` or `expo.out` only
2. No animation <0.25s or >1.2s (except SplitText character staggers)
3. No `initial` animation on page load below the fold — scroll-triggered only
4. Every ScrollTrigger `kill()` on unmount
5. `will-change` only while animating, removed after

---

## File Structure

```
resume-landing/
├── app/
│   ├── layout.tsx                   fonts, metadata, Lenis provider, OG tags
│   ├── page.tsx                     <Hero /> <About /> <Work /> <Timeline /> <Skills /> <Contact />
│   └── globals.css                  tokens + Lenis base styles
├── components/
│   ├── motion/
│   │   ├── SmoothScrollProvider.tsx
│   │   ├── ScrollVideo.tsx
│   │   ├── SplitReveal.tsx
│   │   └── FadeUp.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Work.tsx
│   │   ├── Timeline.tsx
│   │   ├── Skills.tsx
│   │   └── Contact.tsx
│   └── ui/
│       ├── TopNav.tsx
│       ├── LeaderDots.tsx
│       └── SectionNumber.tsx
├── hooks/
│   └── useMediaQuery.ts
├── public/
│   ├── videos/macbook-scroll.mp4    (copied from assets/videos/ during scaffold)
│   ├── images/01-closed.png
│   ├── images/02-open.jpeg          (pending — user to generate/copy)
│   ├── images/03-half-closed.jpeg   (pending — user to generate/copy)
│   ├── resume/Topy_Tran_Resume_2026.pdf
│   └── og-image.png                 (1200x630, derived from 01-closed.png)
├── assets/                          (source files — ignored from build)
├── moodboard/                       (references — ignored from build)
├── docs/superpowers/
│   ├── specs/                       (this file)
│   └── plans/                       (writing-plans output goes here)
├── .claude/skills/
│   ├── design-inspiration/          (exists)
│   └── gsap-lenis-patterns/         (TO CREATE — see Skills section below)
├── next.config.mjs                  output: 'export', images unoptimized
├── tailwind.config.ts               tokens from design-inspiration
├── tsconfig.json
└── package.json
```

---

## Skills to Create

Two skills at end state. Both project-scoped in `.claude/skills/`:

1. **`design-inspiration`** (EXISTS) — aesthetic, content, hero prompts, implementation notes. Source of truth for "what it looks like".

2. **`gsap-lenis-patterns`** (NEW) — motion patterns specific to this build. Source of truth for "how it moves". Contents:

```
gsap-lenis-patterns/
├── SKILL.md                         main patterns + do-not rules
└── references/
    ├── scrollvideo-recipe.md        <ScrollVideo> full recipe w/ desktop/mobile branch
    ├── splittext-recipe.md          GSAP SplitText setup + cleanup + reduced-motion
    ├── lenis-integration.md         Lenis + ScrollTrigger.scrollerProxy wiring
    ├── framer-variants.md           Shared FadeUp/Stagger variants
    └── easing-palette.md            Allowed easings + cubic-beziers
```

Frontmatter description: *GSAP + Lenis + Framer Motion integration patterns for the resume-landing scroll-driven hero and section animations. Use when building any motion component, debugging scroll-scrubbed video, integrating Lenis with ScrollTrigger, or writing SplitText character reveals.*

**Skills explicitly NOT created:** lenis-setup (too narrow), nextjs-static-export (one-time config), luxury-typography (duplicate of design-inspiration).

---

## Performance Budget

| Metric | Target |
|--------|--------|
| LCP | <2.5s |
| INP | <200ms |
| CLS | <0.05 |
| TTFB | <400ms |
| Initial JS | <120kb |
| Total page weight | <3MB |
| Lighthouse Performance | ≥92 |
| Lighthouse Accessibility | ≥98 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |

**Critical:** re-encode `macbook-scroll.mp4` from 28MB → ~8MB using keyframe-dense ffmpeg (`-g 6 -crf 23 -vf scale=1920:1080 -movflags +faststart -pix_fmt yuv420p -an`). Keyframe density required for smooth scroll scrubbing.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scroll-scrub stalls on iOS Safari | High | Kills hero | Mobile uses autoplay loop; poster fallback; tested on real iOS device |
| 28MB video hurts LCP | High | Lighthouse drops | Re-encode to ~8MB via ffmpeg keyframe-dense command |
| Lenis + ScrollTrigger desync | Medium | Scroll broken | Single `scrollerProxy` recipe captured in gsap-lenis-patterns skill |
| Font swap flash | Medium | Jarring first load | `next/font` + preload hero weight + Fraunces 300 only |
| SplitText breaks on re-mount | Medium | Hero name disappears | Captured cleanup pattern via `.revert()` on unmount |
| Missing Nestwell screenshot / Zeligate video | Medium | Work section visuals flat | Fallback to typographic treatment; generate via NBP if needed |
| Stack pill overflow on narrow mobile | Low | Horizontal scroll | `flex-wrap` + max-width clamping |
| Reduced-motion hero broken | Medium | Accessibility failure | Branch in SmoothScrollProvider; poster-only state tested |

---

## Testing / Verification

No unit tests — static presentation site, near-zero logic.

**Verification approach:**

1. **Visual regression (Playwright)** — screenshot each section at 375 / 768 / 1440px breakpoints, stored in `.playwright/screenshots/`
2. **Motion smoke test (Playwright)** — scroll-to-bottom, assert: video has duration, ScrollTrigger pin fires on desktop viewport, no JS errors, CLS <0.05
3. **Accessibility audit** — axe-core via Playwright; must hit Lighthouse A11y ≥98
4. **Reduced-motion audit** — Playwright with `prefers-reduced-motion: reduce` — verify video doesn't play, poster is LCP, text immediately visible, Lenis off
5. **Cross-device smoke** — Chrome desktop, Safari macOS, iOS Safari (real device), Android Chrome on Vercel preview URL
6. **Lighthouse on production build** — `pnpm build && pnpm start`, not dev. Dev builds lie.

---

## Definition of Done

- [ ] Deployed to Vercel preview URL
- [ ] All 6 sections render, animate, and link correctly
- [ ] Mobile autoplay + desktop scroll-scrub both verified on real devices
- [ ] Reduced-motion fully functional
- [ ] Lighthouse Perf ≥92, A11y ≥98, Best Practices 100, SEO 100
- [ ] PDF resume downloads on all browsers
- [ ] Email, LinkedIn, GitHub links open correctly
- [ ] OG image renders when URL pasted into Slack / LinkedIn / Twitter
- [ ] Both skills (`design-inspiration`, `gsap-lenis-patterns`) reflect final implementation — no lies
- [ ] Pushed to GitHub under new repo
- [ ] Video re-encoded to <10MB
- [ ] All 3 hero images present: closed / open / half-closed

---

## Open Questions for Implementation

These surface during the plan phase, not blocking the design:

1. Exact font file for condensed uppercase labels — PP Neue Machina (paid) vs Druk Wide (paid) vs free alternative (e.g. Space Grotesk at 900 with stretch)
2. Nestwell screenshot — does user have a clean no-PII version ready, or do we capture fresh from the live site
3. Zeligate video loop — does user have access to record, or fall back to typographic
4. OG image — derive from `01-closed.png` (add text overlay) or generate fresh via NBP
5. Custom domain timing — purchase before or after launch

---

**End of spec.**
