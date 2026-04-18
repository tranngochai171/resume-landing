# Work Case Hero Images — Design

**Date:** 2026-04-18
**Scope:** Replace typographic placeholders in `CaseCard` with real hero imagery captured from each company's live site. Add mobile-specific variants.

## Goal

Each of the 4 `Case` entries in `lib/work-data.ts` (Dalmore Group, Nestwell, Zeligate, Trailer2you) currently uses `media: { type: 'typographic' }`. Swap to real screenshots captured from each company's site, with distinct desktop and mobile variants so the card looks right at both breakpoints.

## Sources

| Case | URL |
|---|---|
| Dalmore Group | https://dalmoregroup.com/ |
| Nestwell | https://gonestwell.com/ |
| Zeligate | https://www.zeligate.ai/ |
| Trailer2you | https://trailer2you.com.au/about/ (also check home) |

## Capture

Use playwright MCP. Two captures per site:

- **Desktop:** 1600×1200 viewport, crop/screenshot 4:3 landscape covering hero section.
- **Mobile:** 390×844 (iPhone 14 size) viewport so site renders its mobile layout; screenshot 3:4 portrait crop of hero.

Save as JPG q85 to:

- `public/images/work/<slug>-desktop.jpg`
- `public/images/work/<slug>-mobile.jpg`

Slugs: `dalmore`, `nestwell`, `zeligate`, `trailer2you`.

Framing rule: hero section preferred. If hero weak/generic, crop strongest secondary section (product UI, feature block). Skip cookie banners and sticky nav chrome if intrusive.

## Code changes

### `lib/work-data.ts`
Extend image variant:

```ts
media: { type: 'typographic' }
     | { type: 'image'; src: string; mobileSrc: string }
     | { type: 'video'; src: string };
```

Update all 4 cases to `type: 'image'` with `src` + `mobileSrc`.

### `components/sections/CaseCard.tsx`
- Wrapper aspect: `aspect-[3/4] md:aspect-[4/3]` (portrait on mobile, landscape md+).
- Replace `<Image>` with `<picture>` containing `<source media="(min-width: 768px)" srcSet={desktop}>` and fallback `<img src={mobile}>`. Use `next/image` if static import compatibility holds, else plain `<picture>` + `<img loading="lazy">`.
- Keep `object-cover` + `w-full h-full`.

## Non-goals

- No CDN / image optimization service changes.
- No moodboard copies.
- No PNG; JPG only.
- No other case fields touched (highlights, stack, etc.).

## Deliverable

- 8 JPGs under `public/images/work/`.
- Updated `work-data.ts` + `CaseCard.tsx`.
- Single commit: `feat: add hero imagery per work case (desktop + mobile)`.

## Open risks

- Sites may block automated screenshots or show cookie walls → dismiss/accept before capture.
- Trailer2you `/about` may lack visual hero → home fallback allowed.
- Dalmore is institutional/finance → imagery may be abstract; acceptable.
