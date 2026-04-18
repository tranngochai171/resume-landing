# Implementation Notes

Concrete setup for the resume landing build. Matches the design system in `SKILL.md`.

## Project Setup

```bash
cd D:/Works/resume-landing
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
pnpm add gsap framer-motion
pnpm add -D @types/node
```

## Fonts — `app/layout.tsx`

```tsx
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz', 'SOFT', 'WONK'],
  display: 'swap',
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className="bg-black text-[#F5F5F4] font-body antialiased">{children}</body>
    </html>
  );
}
```

## Tailwind — `tailwind.config.ts`

```ts
export default {
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        'bg-elev': '#0A0A0A',
        fg: '#F5F5F4',
        'fg-muted': '#8A8A87',
        'fg-subtle': '#3F3F3E',
        accent: '#7DD3C8',
        'accent-dim': '#3A5D58',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        'display-xl': ['8rem', { lineHeight: '0.9', letterSpacing: '-0.02em' }],
        'display-lg': ['5rem', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '1.0', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        'glow-accent': '0 0 80px 0 rgba(125, 211, 200, 0.18)',
      },
    },
  },
};
```

## Scroll-Driven Video Hero

Key pattern: bind `video.currentTime` to scroll progress. Do NOT autoplay.

```tsx
'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function HeroScrollVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const onReady = () => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: () => `+=${window.innerHeight * 3}`, // 3 viewports of scroll
        pin: true,
        scrub: 0.5,
        onUpdate: (self) => {
          video.currentTime = video.duration * self.progress;
        },
      });
    };

    if (video.readyState >= 1) onReady();
    else video.addEventListener('loadedmetadata', onReady, { once: true });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <section ref={containerRef} className="relative h-screen w-full">
      <video
        ref={videoRef}
        src="/videos/macbook-scroll.mp4"
        muted
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
      />
      {/* Hero text overlay */}
    </section>
  );
}
```

**Hero video asset — READY:**
The stitched scroll video lives at `assets/videos/macbook-scroll.mp4` (~28 MB). Source: two Veo 3 clips joined into one continuous 6-second file. Copy to `public/videos/macbook-scroll.mp4` when scaffolding Next.js so the `/videos/…` path in the component below resolves.

```bash
# After `pnpm create next-app`, move the video into public/
mkdir -p public/videos
cp assets/videos/macbook-scroll.mp4 public/videos/macbook-scroll.mp4
```

**If you ever need to re-stitch** (added a third clip, re-exported, etc.):
```bash
ffmpeg -i v1.mp4 -i v2.mp4 -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[out]" -map "[out]" -c:v libx264 -crf 18 -movflags +faststart -pix_fmt yuv420p public/videos/macbook-scroll.mp4
```

**If the file is too large** (>10 MB noticeable on first load), re-encode:
```bash
ffmpeg -i macbook-scroll.mp4 -c:v libx264 -crf 22 -preset slow -vf scale=1920:1080 -movflags +faststart -pix_fmt yuv420p -an macbook-scroll-web.mp4
```
Target: under 8 MB for 6s at 1080p. Strip audio (`-an`) — scroll video is silent anyway.

## Image Fallback for Hero

Pre-load first frame as a `<picture>` behind the `<video>` — if JS is disabled or video fails, user still sees the closed MacBook.

## Performance

- `<video>` attrs: `preload="auto"`, `muted`, `playsInline` (required for iOS autoplay)
- Compress video aggressively — target <5MB for 6s clip at 1080p
- Use `next/image` for all static images with `priority` on above-fold
- Lighthouse target: LCP < 2.5s, CLS < 0.1

## Deployment

```bash
git add .
git commit -m "Initial scaffold"
gh repo create resume-landing --private --source=. --push
# then: import on vercel.com → zero-config Next.js deploy
```

Domain suggestion: `topy.dev` or `topytran.com`.
