# Lighthouse Baseline

**Date:** 2026-04-18
**Environment:** `pnpm build && pnpm exec serve out -l 3001` (production static export)
**Run:** `pnpm exec lighthouse http://localhost:3001 --chrome-flags="--headless"`

## Scores

| Category | Score | Target | Pass? |
|----------|-------|--------|-------|
| Performance | **100** | ≥92 | ✅ |
| Accessibility | **100** | ≥98 | ✅ |
| Best Practices | **100** | 100 | ✅ |
| SEO | **100** | 100 | ✅ |

## Core Web Vitals

| Metric | Value | Target |
|--------|-------|--------|
| LCP (Largest Contentful Paint) | 1.4s | <2.5s ✅ |
| CLS (Cumulative Layout Shift) | 0.005 | <0.05 ✅ |
| TBT (Total Blocking Time) | 0ms | — |

## What it took to get here

Starting scores: Perf 75, A11y 91, BP 100, SEO 91 — LCP 13.6s (hero PNG was 2 MB).

Fixes applied:
1. **Poster PNG → JPG**: 2.1 MB PNG → 42 KB JPG (50× smaller). LCP: 13.6s → 2.7s → 1.4s.
2. **Video re-encode**: 27 MB 4K60 → 7.1 MB 1080p30 keyframe-dense x264.
3. **Color contrast**: `--fg-subtle` #3F3F3E (1.99:1) → #767676 (4.5:1) for WCAG AA on pure black.
4. **Blockquote aria-label**: removed `<blockquote>` wrapper from About section pull quote (SplitText adds aria-label, which is prohibited on generic blockquote without role).
5. **SplitText + link-name**: added `role="img"` + `aria-label` to SplitText containers so screen readers announce full text instead of letter-by-letter, and `<a>` elements wrapping SplitText get an accessible name.
6. **robots.txt**: added at `public/robots.txt`.
7. **metadataBase**: added to `app/layout.tsx` for proper OG image resolution.
8. **OG image**: 609 KB PNG → 24 KB JPG crop of hero poster.

## To re-run

```bash
cd D:/Works/resume-landing
pnpm build
pnpm exec serve out -l 3001 -s &
pnpm exec lighthouse http://localhost:3001 \
  --output=json --output-path=./lighthouse-report.json \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,best-practices,seo \
  --quiet
```

## Known LCP caveat

Run-to-run LCP varies between 1.3s and 3.1s in local testing — hero video decode time is variable. Production (Vercel edge CDN + Brotli) should stabilize this under the 2.5s target.
