---
name: design-inspiration
description: Design system, typography, colors, motion, and moodboard references for Topy Tran's personal resume landing page. Use when designing, building, or iterating on the resume-landing project at D:/Works/resume-landing. Covers dark luxurious elegant aesthetic, teal-cyan accent, scroll-driven MacBook hero, editorial typography, and candidate content from Topy_Tran_Resume_2026.
---

# Design Inspiration — Topy Tran Resume Landing

Personal resume landing page. Dark, elegant, luxurious, unique. Scroll-driven MacBook hero. Apple-keynote meets editorial luxury.

**Project repo:** `D:/Works/resume-landing/`

---

## Brand

| Field | Value |
|-------|-------|
| Name | Tran Ngoc Hai (Topy Tran) |
| Role | Senior Fullstack Web Developer |
| Location | Ho Chi Minh City, Vietnam |
| Experience | 6+ years |
| Email | tranngochai171@gmail.com |
| Phone | +84 90 292 9453 |
| LinkedIn | linkedin.com/in/topytran |
| GitHub | github.com/tranngochai171 |

**Positioning line** (hero candidate):
> Senior Fullstack Developer shipping production apps in FinTech, HealthTech, SaaS, and eCommerce — from SEC-regulated investment platforms to AI-powered recruitment tools.

**Signature expertise**: React / Next.js frontends + NestJS / Node.js backends + deep Stripe payment integration.

See `references/resume-content.md` for full experience + skills breakdown.

---

## Color System — Dark Void + Teal Glow

Locked across hero images 1-3 and Veo video. Commit to it site-wide.

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#000000` | Page background — pure void |
| `--bg-elev` | `#0A0A0A` | Elevated surfaces (cards), barely visible |
| `--fg` | `#F5F5F4` | Primary text (off-white, not pure #FFF) |
| `--fg-muted` | `#8A8A87` | Secondary text, metadata |
| `--fg-subtle` | `#3F3F3E` | Dividers, very faint text |
| `--accent` | `#7DD3C8` | Teal-cyan glow — links, hover, highlights |
| `--accent-glow` | `rgba(125, 211, 200, 0.18)` | Soft ambient glow behind hero/focal elements |
| `--accent-dim` | `#3A5D58` | Low-emphasis accent (visited links, borders) |

**Rules:**
- Pure `#000` background everywhere — no dark-gray fallback
- Accent color used sparingly — one element per section max
- Never use pure white (`#FFF`) for text — harsh on pure black. Use `#F5F5F4` or dimmer
- Glow effects via `box-shadow` or `radial-gradient`, never solid fills

---

## Typography

**Pairing: Display serif + neutral sans**

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display (hero name, section titles) | **Fraunces** (or PP Editorial Old / Migra) | 300–500 | Oversized editorial serif, high contrast. Optical size 144. |
| Body | **Geist** (or Inter) | 400–500 | Clean neutral sans, excellent on dark bg |
| Mono (code tags, metadata) | **Geist Mono** (or JetBrains Mono) | 400 | Skill tags, location labels, dates |

**Scale (rem, 16px base):**

| Token | Size | Use |
|-------|------|-----|
| `display-xl` | 8rem (128px) | Hero name — full bleed |
| `display-lg` | 5rem (80px) | Section titles |
| `display-md` | 3rem (48px) | Subsection titles |
| `body-xl` | 1.5rem (24px) | Hero tagline, pull quotes |
| `body-lg` | 1.125rem (18px) | Body copy |
| `body-md` | 1rem (16px) | Secondary body |
| `body-sm` | 0.875rem (14px) | Metadata, captions |
| `mono-sm` | 0.75rem (12px) | Skill tags, timestamps |

**Tracking:**
- Display serifs: `tracking-tight` (−0.02em) — tight elegant stack
- Body: `tracking-normal` — default
- Mono/labels: `tracking-widest` (0.1em) + `uppercase` — keynote-style

**Line height:**
- Display: 0.9–1.0 (tight, dramatic)
- Body: 1.6–1.7 (comfortable reading on dark bg)

---

## Layout

- **Asymmetric editorial grid** — NOT centered cards. Text left, visuals right. Break the grid for hero moments.
- **Generous whitespace** — `py-32` minimum between sections. Luxury = breathing room.
- **Max content width** `max-w-[1440px]`. Text column `max-w-[640px]` for readability.
- **Section rhythm**: Hero (full-bleed) → About (asymmetric text+image) → Experience (editorial timeline) → Selected Work (large visual cards) → Contact (oversized CTA).
- **Border radius**: `rounded-none` for editorial feel. Only rounded on interactive elements (`rounded-full` for pill tags, `rounded-lg` for buttons).

---

## Motion

Powered by GSAP ScrollTrigger + Framer Motion.

| Element | Motion |
|---------|--------|
| Hero MacBook video | Scroll-scrubbed via `video.currentTime` bound to scroll position. 6-second clip = full first viewport scroll. |
| Hero name | Fade-up + stagger reveal on load |
| Section titles | Fade-up on scroll entry, 40px Y offset, 0.8s ease-out |
| Body text | Word-by-word fade-in on scroll (optional — use for 1-2 hero statements only) |
| Images | Fade + scale from 0.96 to 1.0 on scroll entry |
| Hover states | Accent glow underline for links, 200ms ease |

**Rules:**
- Motion is subtle and slow — never bouncy, never fast. Luxury moves deliberately.
- Never animate on every scroll — pick 3-5 key moments per section
- Respect `prefers-reduced-motion`

---

## Hero Concept — Scroll-Driven MacBook

Core unique element. Three image states + two video clips stitched into one continuous 6-second MP4.

1. **Image 1** — MacBook closed, glowing teal Apple logo (`assets/images/01-closed.jpeg`)
2. **Video segment 1** — Hand opens lid to fully upright
3. **Image 2** — MacBook fully open, teal gradient wallpaper
4. **Video segment 2** — Lid auto-tilts forward halfway
5. **Image 3** — Half-closed wedge, teal glow escaping

All share: pure black void, front 3/4 angle, teal/cyan accent, keynote lighting.

**Hero video — READY:** `assets/videos/macbook-scroll.mp4` (~28 MB, 6s, 1080p). Two Veo 3 clips stitched into one continuous file. Copy to `public/videos/macbook-scroll.mp4` after Next.js scaffold.

**Implementation:**
- Single `<video>` element loading `/videos/macbook-scroll.mp4`
- GSAP ScrollTrigger binds `scrollProgress` → `video.currentTime`
- Hero name overlays the video, scale-down on scroll
- Positioning tagline reveals at mid-scroll when MacBook is fully open
- If >10 MB hurts initial load, re-encode via ffmpeg (see `references/implementation-notes.md`)

**Prompts used to generate assets**: see `references/hero-prompts.md`

---

## Moodboard References

Captured from Dribbble at `D:/Works/resume-landing/moodboard/`.

**Primary references** (deep analysis at `moodboard/deep-refs/ANALYSIS.md`):

- **MARCEAU — Jenkate MW** — Cinematic filmmaker portfolio. Blueprint for the HERO: oversized display type behind a cinematic subject, corner metadata blocks (role top-left, location top-right), teaser project nav at hero base, pure black void with colored rim-light glow. The #1 structural reference for your hero.
- **PMA Architecture Studio — LAIN** — Editorial minimalist portfolio. Blueprint for BODY sections: asymmetric 70/30 photo-left + editorial-text-right splits, uppercase pull quotes with wide tracking, leader-dot caption strips (`PROJECT · · · · · · · · LOCATION`), superscript section numbers, subtle technical drafting overlays. Designer's stated philosophy — *"translate architectural thinking into a digital experience"* — translates directly to *"translate engineering thinking into a digital experience"* for Topy's site.

**Secondary references:**

| Source | Why |
|--------|-----|
| HASHAM / Venge | Pure dark keynote aesthetic with teal accents matching the locked color system. |
| Dhruvi Savaliya — Crafting Stories | Editorial dark layout with warm photo accents. |
| Nicolas Mariotti — Rouge | Red/black editorial typography inspiration. |

Also worth browsing: awwwards.com (dark theme filter), godly.website, siteinspire.com.

### Hero Corner-Metadata Pattern (from MARCEAU)

```
[greeting chip]                                    [menu]
SENIOR FULLSTACK DEVELOPER      BASED IN HO CHI MINH CITY
              [ MacBook scroll video ]
              T R A N   N G O C   H A I   (oversized display)
STARTING...      DALMORE / NESTWELL / ZELIGATE (teaser nav)
```

Corner blocks use `font-mono`, UPPERCASE, `tracking-widest`, `text-fg-muted`. 12-14px max. Small is luxurious.

### Typography Alternative

MARCEAU uses a **bold condensed display sans** for the name, not a serif. Consider that direction for Topy — more cinematic/modern/engineer-brand than Fraunces serif. Candidates: **Druk Wide**, **Migra Extrabold**, **PP Neue Machina**, or **Geist** at 900 weight with `font-stretch: condensed`. Pick ONE (serif OR condensed sans) and commit.

---

## Recommended Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS |
| Fonts | `next/font` for Fraunces + Geist |
| Scroll animation | GSAP + ScrollTrigger |
| Micro-interactions | Framer Motion |
| Deployment | Vercel |
| Analytics | Vercel Analytics (optional: Plausible) |

Rationale: matches Topy's own stack (Next.js + Tailwind) — the site itself is a demonstration of skill.

---

## Section Structure

1. **Hero** — Scroll-driven MacBook + name + one-line positioning
2. **About** — 3-4 sentence summary, asymmetric with headshot or minimal graphic
3. **Selected Work** — 3-4 case cards: Dalmore, Nestwell, Zeligate, Trailer2you. Each with role, stack, outcome.
4. **Experience Timeline** — Editorial timeline of all companies, tight type, dates in mono
5. **Technical Skills** — Grouped skill tags (Frontend / Backend / Payments / Cloud / Testing)
6. **Contact** — Oversized email CTA, social links. Single-screen dramatic finale.

---

## Don'ts

- No rounded cards, no soft shadows, no generic SaaS aesthetic
- No purple/pink accents — stay in teal/cyan lane
- No centered-everything layouts — commit to asymmetric editorial
- No stock icons — use typography or custom SVG only
- No loading spinners — if something loads, fade it in
- No cookie banner modal as first interaction — use passive bar if needed

---

## Reference Files

| File | Read When |
|------|-----------|
| `references/resume-content.md` | Writing hero copy, case cards, experience section |
| `references/hero-prompts.md` | Regenerating or iterating hero images/video |
| `references/implementation-notes.md` | Starting build, picking packages, scroll setup |
