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
      let trigger: ScrollTrigger | null = null;
      // Pin the nearest <section> ancestor so overlays (name, corner metadata,
      // teasers) stay in sync with the scrubbed video. Without this, pinning
      // only the video div breaks the flex layout and the overlays scroll past.
      const pinTarget = (container.closest('section') as HTMLElement) ?? container;

      const onReady = () => {
        trigger = ScrollTrigger.create({
          trigger: pinTarget,
          start: 'top top',
          end: () => `+=${window.innerHeight * 3}`,
          pin: pinTarget,
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
