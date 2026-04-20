---
title: Analytics Instrumentation
date: 2026-04-20
status: draft
---

# Analytics Instrumentation

## Purpose

Understand how visitors engage with the resume landing page so Topy can judge which sections and CTAs resonate. Track page views, key clicks, section scroll depth, and Core Web Vitals — all on Vercel's free hobby tier.

## Non-Goals

- No heatmaps, session replay, or funnel analysis.
- No third-party analytics beyond Vercel (no GA4, no Plausible).
- No cookie consent banner — stack must remain cookieless.

## Stack

- `@vercel/analytics` — page views + custom events.
- `@vercel/speed-insights` — LCP / CLS / INP per route.

Both hobby-tier free. Resume traffic is low; 2,500 events/mo quota is ample.

## Architecture

### Mount point

`app/layout.tsx` renders two components inside `<body>`:

```tsx
<Analytics />
<SpeedInsights />
```

Wrapped once in `components/analytics/Analytics.tsx` so `layout.tsx` stays clean.

### Event catalogue

Typed union in `lib/analytics/events.ts`:

| Event name        | Props                          | Fired when                                       |
| ----------------- | ------------------------------ | ------------------------------------------------ |
| `resume_download` | `{ source: 'contact' \| 'nav' }` | User clicks resume PDF link                      |
| `contact_email`   | —                              | `mailto:` link clicked                           |
| `contact_social`  | `{ network: 'github' \| 'linkedin' }` | Social link clicked                       |
| `project_click`   | `{ project: string }`          | Case card / project link clicked                 |
| `hero_cta`        | `{ label: string }`            | Hero CTA button clicked                          |
| `section_view`    | `{ section: SectionId }`       | Section ≥50% visible, first time in session      |

`SectionId = 'hero' | 'about' | 'work' | 'skills' | 'timeline' | 'contact'`.

### Track wrapper

`lib/analytics/track.ts` exports a typed `track(event, props)` that delegates to `@vercel/analytics`'s `track`. Union-typed event names prevent typos at call sites.

### Section view hook

`hooks/useSectionView.ts`:

- Takes a `SectionId` and a ref.
- Uses `IntersectionObserver` with `threshold: 0.5`.
- Dedupes via a module-level `Set<SectionId>` so each section fires at most once per page load.
- Guards against SSR (`typeof window`).

Each section component (`Hero`, `About`, `Work`, `Skills`, `Timeline`, `Contact`) calls the hook with its id and a ref attached to its root element.

### Click instrumentation

Direct `onClick` handlers on the existing links in `components/sections/Contact.tsx` and wherever project/hero CTAs live. No generic link wrapper — keep it explicit and grep-able.

`onClick` fires `track(...)` then lets the native navigation proceed (no `preventDefault`, no `await`).

## Data Flow

```
User action → onClick or IntersectionObserver
            → track(event, props)
            → @vercel/analytics → Vercel dashboard
Page nav     → <Analytics/> auto-captures pageview
Web vitals   → <SpeedInsights/> auto-captures
```

## Privacy

- No cookies; Vercel Analytics is cookieless by design.
- No PII in event props (email event has no props; socials use network name only).
- Respect DNT: Vercel's SDK already honours Do-Not-Track.

## Testing

- `@vercel/analytics` exposes a `debug` mode via `mode="development"`. In dev, events log to console — use to verify each call site fires once with correct props.
- Add a Playwright smoke test: load page, click resume download, assert `window.va` was called (Vercel's global) with `resume_download`. Stub the network call.
- Section-view dedup: scroll to About twice in one session, assert only one `section_view` fires.

## File Additions

```
components/analytics/Analytics.tsx     # mounts <Analytics/> + <SpeedInsights/>
lib/analytics/events.ts                # event name + props union types
lib/analytics/track.ts                 # typed track() wrapper
hooks/useSectionView.ts                # IntersectionObserver hook
tests/smoke/analytics.spec.ts          # Playwright smoke
```

## File Edits

- `app/layout.tsx` — render `<Analytics />` inside body.
- `components/sections/Contact.tsx` — `onClick` on email, linkedin, github, resume links.
- `components/sections/Hero.tsx` — `onClick` on CTA(s); call `useSectionView('hero')`.
- `components/sections/About.tsx`, `Work.tsx`, `Skills.tsx`, `Timeline.tsx`, `Contact.tsx` — call `useSectionView(<id>)`.
- `components/sections/CaseCard.tsx` — `onClick` firing `project_click` with project name prop.
- `package.json` — add `@vercel/analytics`, `@vercel/speed-insights`.

## Rollout

1. Install packages, mount components, deploy.
2. Verify in Vercel dashboard that pageviews + Speed Insights appear within 30 minutes.
3. Add click + section instrumentation.
4. Verify each event type shows in Vercel → Analytics → Events.

## Open Questions

None.
