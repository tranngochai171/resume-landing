# Work Case Hero Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace typographic placeholders in 4 work case cards with real desktop + mobile hero screenshots captured from each company's live site.

**Architecture:** Playwright MCP captures 2 viewports per site (desktop 1600×1200 crop → 4:3, mobile 390×844 viewport → 3:4 crop). Images saved as JPG q85 to `public/images/work/`. `work-data.ts` image variant extended with `mobileSrc`. `CaseCard.tsx` uses responsive `<picture>` with breakpoint source + responsive aspect ratio.

**Tech Stack:** Next.js 14, React 18, Tailwind, Playwright MCP (for capture), `next/image` or plain `<picture>`.

**Spec:** `docs/superpowers/specs/2026-04-18-work-hero-images-design.md`

---

## Task 1: Prepare output directory

**Files:**
- Create: `public/images/work/.gitkeep` (if dir missing — current contains only `01-closed.jpg`)

- [ ] **Step 1:** Verify dir exists: `ls public/images/work/`. If missing, `mkdir -p public/images/work`.

- [ ] **Step 2:** No commit yet (empty dir).

---

## Task 2: Capture Dalmore Group (desktop + mobile)

**Files:**
- Create: `public/images/work/dalmore-desktop.jpg`
- Create: `public/images/work/dalmore-mobile.jpg`

- [ ] **Step 1: Resize browser to desktop**

```
mcp__playwright__browser_resize(width=1600, height=1200)
```

- [ ] **Step 2: Navigate**

```
mcp__playwright__browser_navigate(url="https://dalmoregroup.com/")
```

- [ ] **Step 3: Wait for hero to paint, dismiss any cookie banner**

```
mcp__playwright__browser_wait_for(time=2)
mcp__playwright__browser_snapshot()  # inspect for cookie/consent modal
# if present: mcp__playwright__browser_click on accept/dismiss
```

- [ ] **Step 4: Capture desktop screenshot**

```
mcp__playwright__browser_take_screenshot(
  type="jpeg",
  filename="D:/Works/resume-landing/public/images/work/dalmore-desktop.jpg",
  fullPage=false
)
```
Expected: 1600×1200 JPG saved. If hero weak, re-capture strongest section by scrolling first.

- [ ] **Step 5: Resize to mobile viewport**

```
mcp__playwright__browser_resize(width=390, height=844)
mcp__playwright__browser_navigate(url="https://dalmoregroup.com/")  # re-nav so mobile layout renders
mcp__playwright__browser_wait_for(time=2)
```

- [ ] **Step 6: Capture mobile screenshot**

```
mcp__playwright__browser_take_screenshot(
  type="jpeg",
  filename="D:/Works/resume-landing/public/images/work/dalmore-mobile.jpg",
  fullPage=false
)
```
Expected: 390×844 JPG saved. (Aspect ≈ 3:6.5; CaseCard `object-cover` in `aspect-[3/4]` will crop to 3:4.)

- [ ] **Step 7: Verify both files exist**

Run: `ls -la public/images/work/dalmore-*.jpg`
Expected: 2 files, non-zero size.

- [ ] **Step 8: Commit**

```bash
git add public/images/work/dalmore-desktop.jpg public/images/work/dalmore-mobile.jpg
git commit -m "assets: add Dalmore Group hero screenshots"
```

---

## Task 3: Capture Nestwell (desktop + mobile)

**Files:**
- Create: `public/images/work/nestwell-desktop.jpg`
- Create: `public/images/work/nestwell-mobile.jpg`

Same sequence as Task 2 with URL `https://gonestwell.com/` and filenames `nestwell-desktop.jpg` / `nestwell-mobile.jpg`.

- [ ] **Step 1:** `browser_resize(1600, 1200)`
- [ ] **Step 2:** `browser_navigate("https://gonestwell.com/")`
- [ ] **Step 3:** `browser_wait_for(time=2)` + dismiss cookie banner if present
- [ ] **Step 4:** `browser_take_screenshot(type="jpeg", filename=".../nestwell-desktop.jpg", fullPage=false)`
- [ ] **Step 5:** `browser_resize(390, 844)` + re-navigate
- [ ] **Step 6:** `browser_take_screenshot(type="jpeg", filename=".../nestwell-mobile.jpg", fullPage=false)`
- [ ] **Step 7:** Verify files: `ls -la public/images/work/nestwell-*.jpg`
- [ ] **Step 8:** Commit

```bash
git add public/images/work/nestwell-desktop.jpg public/images/work/nestwell-mobile.jpg
git commit -m "assets: add Nestwell hero screenshots"
```

---

## Task 4: Capture Zeligate (desktop + mobile)

**Files:**
- Create: `public/images/work/zeligate-desktop.jpg`
- Create: `public/images/work/zeligate-mobile.jpg`

- [ ] **Step 1:** `browser_resize(1600, 1200)`
- [ ] **Step 2:** `browser_navigate("https://www.zeligate.ai/")`
- [ ] **Step 3:** `browser_wait_for(time=2)` + dismiss cookie banner if present
- [ ] **Step 4:** `browser_take_screenshot(type="jpeg", filename=".../zeligate-desktop.jpg", fullPage=false)`
- [ ] **Step 5:** `browser_resize(390, 844)` + re-navigate
- [ ] **Step 6:** `browser_take_screenshot(type="jpeg", filename=".../zeligate-mobile.jpg", fullPage=false)`
- [ ] **Step 7:** Verify files
- [ ] **Step 8:** Commit

```bash
git add public/images/work/zeligate-desktop.jpg public/images/work/zeligate-mobile.jpg
git commit -m "assets: add Zeligate hero screenshots"
```

---

## Task 5: Capture Trailer2you (desktop + mobile)

**Files:**
- Create: `public/images/work/trailer2you-desktop.jpg`
- Create: `public/images/work/trailer2you-mobile.jpg`

Try `/about/` first. If hero visually weak (text-heavy, no imagery), fallback to home `https://trailer2you.com.au/`.

- [ ] **Step 1:** `browser_resize(1600, 1200)`
- [ ] **Step 2:** `browser_navigate("https://trailer2you.com.au/about/")`
- [ ] **Step 3:** `browser_wait_for(time=2)` + `browser_snapshot()` — judge visual strength. If weak, navigate home instead.
- [ ] **Step 4:** `browser_take_screenshot(type="jpeg", filename=".../trailer2you-desktop.jpg", fullPage=false)`
- [ ] **Step 5:** `browser_resize(390, 844)` + re-navigate (same URL chosen in Step 3)
- [ ] **Step 6:** `browser_take_screenshot(type="jpeg", filename=".../trailer2you-mobile.jpg", fullPage=false)`
- [ ] **Step 7:** Verify files
- [ ] **Step 8:** Commit

```bash
git add public/images/work/trailer2you-desktop.jpg public/images/work/trailer2you-mobile.jpg
git commit -m "assets: add Trailer2you hero screenshots"
```

---

## Task 6: Extend `Case` media type in `work-data.ts`

**Files:**
- Modify: `lib/work-data.ts:8` (media type union) + `lib/work-data.ts:21,36,51,66` (each case's `media` field)

- [ ] **Step 1: Update type union (line 8)**

Change:
```ts
media: { type: 'typographic' } | { type: 'image'; src: string } | { type: 'video'; src: string };
```
To:
```ts
media: { type: 'typographic' } | { type: 'image'; src: string; mobileSrc: string } | { type: 'video'; src: string };
```

- [ ] **Step 2: Update Dalmore case (line 21)**

```ts
media: { type: 'image', src: '/images/work/dalmore-desktop.jpg', mobileSrc: '/images/work/dalmore-mobile.jpg' },
```

- [ ] **Step 3: Update Nestwell case (line 36)**

```ts
media: { type: 'image', src: '/images/work/nestwell-desktop.jpg', mobileSrc: '/images/work/nestwell-mobile.jpg' },
```

- [ ] **Step 4: Update Zeligate case (line 51)**

```ts
media: { type: 'image', src: '/images/work/zeligate-desktop.jpg', mobileSrc: '/images/work/zeligate-mobile.jpg' },
```

- [ ] **Step 5: Update Trailer2you case (line 66)**

```ts
media: { type: 'image', src: '/images/work/trailer2you-desktop.jpg', mobileSrc: '/images/work/trailer2you-mobile.jpg' },
```

- [ ] **Step 6: Typecheck**

Run: `rtk tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/work-data.ts
git commit -m "feat(data): wire real hero images per work case"
```

---

## Task 7: Update `CaseCard.tsx` — responsive aspect + `<picture>`

**Files:**
- Modify: `components/sections/CaseCard.tsx:12-21`

- [ ] **Step 1: Replace media wrapper aspect + image block**

Change lines 12-21 from:
```tsx
<FadeUp className="aspect-[4/3] bg-bg-elev">
  {c.media.type === 'image' && (
    <Image
      src={c.media.src}
      alt={c.name}
      width={1200}
      height={900}
      className="h-full w-full object-cover"
    />
  )}
```
To:
```tsx
<FadeUp className="aspect-[3/4] bg-bg-elev md:aspect-[4/3]">
  {c.media.type === 'image' && (
    <picture>
      <source media="(min-width: 768px)" srcSet={c.media.src} />
      <img
        src={c.media.mobileSrc}
        alt={c.name}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </picture>
  )}
```

- [ ] **Step 2: Remove unused `Image` import if no other usage**

Check line 3 — if `Image` only used in block just removed, delete:
```tsx
import Image from 'next/image';
```
(Leave if used elsewhere in file.)

- [ ] **Step 3: Typecheck + lint**

Run: `rtk tsc --noEmit && rtk lint`
Expected: no errors.

- [ ] **Step 4: Start dev server and visually inspect**

```bash
rtk next dev
```
Open `http://localhost:3000`, scroll to Work section. Verify:
- Desktop (≥768px): each case shows landscape 4:3 desktop screenshot.
- Mobile (<768px): each case shows portrait 3:4 mobile screenshot.
- Resize browser across breakpoint — image swaps cleanly.

- [ ] **Step 5: Run Playwright smoke suite**

```bash
rtk playwright test
```
Expected: all tests pass (no regressions in existing 5×2 suite).

- [ ] **Step 6: Commit**

```bash
git add components/sections/CaseCard.tsx
git commit -m "feat(ui): responsive hero images in CaseCard (picture + aspect swap)"
```

---

## Task 8: Final verification

- [ ] **Step 1:** `rtk git status` — clean.
- [ ] **Step 2:** `rtk git log --oneline -10` — confirm 5 new commits (4 asset + 1 data + 1 ui, or combined as planned).
- [ ] **Step 3:** Production build sanity:

```bash
rtk next build
```
Expected: build succeeds, image paths resolved.

---

## Self-review notes

- **Spec coverage:** All 4 sites → Tasks 2-5. Data type extension → Task 6. Responsive `<picture>` + aspect swap → Task 7. ✓
- **No placeholders:** All code blocks complete. ✓
- **Type consistency:** `mobileSrc` used identically across type union (Task 6 Step 1) and all 4 case entries (Steps 2-5) and CaseCard consumer (Task 7 Step 1). ✓
- **Scope:** Single focused plan, no decomposition needed. ✓
