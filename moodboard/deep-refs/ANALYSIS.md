# Deep Reference Analysis — 2 Primary Picks

Screenshots in this folder. Narrowed from broader mood board to the two sites whose DNA maps closest to your brief: dark, elegant, luxurious, unique resume landing with scroll-driven MacBook hero.

---

## Pick 1 — MARCEAU (Jenkate MW) — **PRIMARY**

**Type:** Filmmaker & Director portfolio
**Why it's the #1 pick:** This is functionally a one-person portfolio landing — same shape as your resume site. It solves the exact problem you're solving.

**Screenshots:** `ref2-MARCEAU-hero.jpeg`, `ref2-MARCEAU-detail.jpeg`
**Dribbble:** https://dribbble.com/shots/26583755

### What to steal

| Element | Pattern |
|---------|---------|
| **Hero structure** | Oversized display type ("LÉANDRE MARCEAU") set BEHIND a cinematic portrait photo. Name crosses the subject at eye level. Hero is a full-bleed photo-meets-type composition, not a card. |
| **Corner metadata blocks** | Role/location top-left ("AN AWARD-WINNING FILMMAKER/DIRECTOR"), secondary location top-right ("BASED IN PARIS, FRANCE"). Small mono caps with loose tracking. → Apply directly to Topy: top-left "SENIOR FULLSTACK DEVELOPER", top-right "BASED IN HO CHI MINH CITY, VIETNAM" |
| **Bottom-of-hero nav** | Three clickable project teasers ("THE LAST ROAD", "THROUGH THE GLASS", "BENEATH THE SURFACE") as navigation peeking from the base of the hero. → Apply: Dalmore / Nestwell / Zeligate as hero footer teasers. |
| **Color + mood** | Pure black background, dramatic cinematic portrait with colored rim light (purple/blue glow). Glow is part of the photo, not a CSS effect. → Apply: your MacBook frames already have this — teal glow from screen replaces the purple/blue. |
| **Greeting chip** | Tiny "BONJOUR! :)" chip in a top-left system-tray style pill. Feels personal, breaks the formality. → Apply: "Hi, I'm Topy 👋" or "Say hi →" chip at top-left, subtle. |
| **Signature typography stack** | Huge display serif/sans mixed with small mono labels. Labels always UPPERCASE + wide tracking. |

### Hero layout (adapted for Topy)

```
┌──────────────────────────────────────────────────────────┐
│ [Hi, I'm Topy 👋]                              [Menu ▾] │
│                                                          │
│  SENIOR FULLSTACK                   BASED IN             │
│  DEVELOPER                          HO CHI MINH CITY, VN │
│                                                          │
│        ┌────────────────────────────────────────┐        │
│        │                                        │        │
│        │       [MacBook scroll video]           │        │
│        │       T  R  A  N   H A I               │        │
│        │       ↑ oversized display serif        │        │
│        │         overlaid on the video          │        │
│        └────────────────────────────────────────┘        │
│                                                          │
│  STARTING...        DALMORE / NESTWELL / ZELIGATE       │
│                                                          │
│                       6+ YEARS · FINTECH · HEALTHTECH    │
└──────────────────────────────────────────────────────────┘
```

---

## Pick 2 — PMA Architecture Studio (LAIN) — **SECONDARY**

**Type:** Editorial minimalist architecture studio portfolio
**Why it's the #2 pick:** Best reference for layout discipline and editorial typography. Your secondary sections (work / timeline / skills) should feel like this.

**Screenshots:** `ref1-PMA-hero.jpeg`, `ref1-PMA-detail1.jpeg`
**Dribbble:** https://dribbble.com/shots/27159288

### Designer's stated philosophy (direct quote from the case)

> "Translate architectural thinking into a digital experience. Large monochrome imagery highlights the geometry of the buildings, while the typography and grid system mirror the discipline and precision found in architectural plans."

**Apply that philosophy verbatim to Topy:** translate *engineering* thinking into a digital experience. Large monochrome product imagery (the MacBook), typography and grid that mirror the discipline of system architecture. The site IS the portfolio.

### What to steal

| Element | Pattern |
|---------|---------|
| **Asymmetric two-pane layout** | Hero is NOT centered — it's a large-photo-left (70%) / editorial-text-right (30%) split. Headline "Peter Marino Architect" stacked in oversized sans, text column sits beside it with tracked uppercase pull quotes. → Apply: Selected Work sections use this split. Screenshot left, case description right. |
| **Pull quotes in uppercase** | Short editorial statements in wide-tracked uppercase, spanning 2-3 lines max: *"STONE, STEEL, AND GLASS DEFINE THE ARCHITECTURAL STRUCTURE..."* → Apply: intersperse Topy's summary as a pull quote: *"SIX YEARS SHIPPING PRODUCTION APPS — FROM SEC-REGULATED INVESTMENT PLATFORMS TO AI RECRUITMENT TOOLS."* |
| **Caption strip at bottom of images** | Thin strip with project name + metadata: `CHANEL 57TH STREET . . . . . . . . . . . NEW YORK`. Dots act as leader lines. → Apply: `DALMORE GROUP · · · · · · · · · LOS ANGELES · · · · · · · · · 2024–PRESENT`. |
| **Circular/linear guide overlays** | Faint circular + straight-line overlays on imagery (architectural drafting motif). Adds technical sophistication. → Apply: very subtle vector grid / crosshair overlay on hero MacBook video — tech-product drafting motif. Keep barely visible, 4-6% opacity. |
| **Tiny numbered pagination** | Top-right `CHANEL 57TH STREET^10` — superscript numbers suggesting editorial pagination. → Apply: superscript section numbers on each section header (`01 SELECTED WORK`, `02 EXPERIENCE`). |

### Section layout for your body

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  01                                                      │
│  SELECTED                                                │
│  WORK                       ┌─────────────────┐          │
│                             │                 │          │
│  ─── Dalmore Group          │  [screenshot]   │          │
│  SEC-regulated investment   │                 │          │
│  platform with KYC/AML,     │                 │          │
│  Stripe + Plaid + ACH...    └─────────────────┘          │
│                             DALMORE · · · · · · · 2024   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## How They Combine for Your Site

| Section | Reference |
|---------|-----------|
| Hero (MacBook + name + positioning) | **MARCEAU** — cinematic, type-behind-subject, corner metadata, teaser nav at base |
| About / positioning statement | **PMA** — editorial pull quote, asymmetric split |
| Selected Work (Dalmore, Nestwell, Zeligate, Trailer2you) | **PMA** — large image left, editorial copy right, leader-dot captions |
| Experience timeline | **PMA** — tight mono labels, editorial restraint |
| Contact finale | **MARCEAU** — oversized display type, dark void, one-line CTA |
| Motion + mood | **MARCEAU** — cinematic, glow, slow deliberate reveals |

---

## Live Preview Links (for scroll-through study)

- MARCEAU live template: check Jenkate MW's shot page for the "Live Preview" link — mentioned in `ref2-MARCEAU-detail.jpeg` at y=520. Browse the actual interactive site to see motion choices.
- PMA: no live link — static Dribbble mockup only. Treat as visual-only reference for composition and type.

---

## Updates to Make to SKILL.md

Based on this deeper analysis, two refinements to the design-inspiration skill:

1. **Add typography detail** — MARCEAU uses a bold condensed display sans (not serif) for the name. Consider offering both options: serif (PMA-style, elegant/editorial) OR condensed display sans (MARCEAU-style, cinematic/bold). Topy's engineer brand leans toward the condensed display sans — more confident, modern.

2. **Add "corner metadata" pattern to hero spec** — not in the current SKILL.md but is a defining feature of MARCEAU and maps perfectly to Topy's location/role pair.
