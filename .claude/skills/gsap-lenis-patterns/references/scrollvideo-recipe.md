# ScrollVideo Recipe

The hero video component. Desktop gets scroll-scrub. Mobile gets autoplay loop. Video failure → poster stays.

## Component

```tsx
// components/motion/ScrollVideo.tsx
'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMediaQuery } from '@/hooks/useMediaQuery';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  src: string;
  poster: string;
  className?: string;
}

export function ScrollVideo({ src, poster, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const isTouch = 'ontouchstart' in window;
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    if (isDesktop && !isTouch) {
      // Desktop: scroll-scrub
      let trigger: ScrollTrigger | null = null;

      const onReady = () => {
        trigger = ScrollTrigger.create({
          trigger: container,
          start: 'top top',
          end: () => `+=${window.innerHeight * 3}`,
          pin: true,
          scrub: 0.5,
          onUpdate: (self) => {
            if (video.duration && !isNaN(video.duration)) {
              video.currentTime = video.duration * self.progress;
            }
          },
        });
      };

      if (video.readyState >= 1) {
        onReady();
      } else {
        video.addEventListener('loadedmetadata', onReady, { once: true });
      }

      return () => {
        trigger?.kill();
      };
    } else {
      // Mobile/tablet: autoplay on viewport entry
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().catch(() => {
                /* Autoplay blocked — poster stays */
              });
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(container);

      return () => observer.disconnect();
    }
  }, [isDesktop]);

  return (
    <div ref={containerRef} className={className}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="metadata"
        loop={!isDesktop}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
```

## Behavior matrix

| Device | Reduced motion | Behavior |
|--------|----------------|----------|
| Desktop ≥1024 | off | Pin hero, scrub video via ScrollTrigger |
| Desktop ≥1024 | on | No pin, no scrub, poster stays |
| Tablet 768-1023 | off | Autoplay loop on viewport entry |
| Mobile <768 | off | Autoplay loop on viewport entry |
| Any | Video fails to load | Poster stays (handled by `<video poster>` native behavior) |

## Never do this

- `video.play()` on mount — iOS blocks autoplay without visibility trigger
- Scroll-scrub on touch devices — iOS Safari stalls `currentTime` seeks
- `loop` attribute on desktop — ScrollTrigger needs a linear duration
