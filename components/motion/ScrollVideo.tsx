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
  onProgress?: (p: number) => void;
}

export function ScrollVideo({ src, poster, className, onProgress }: Props) {
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
      onProgress?.(1);
      return;
    }

    if (isDesktop && !isTouch) {
      let trigger: ScrollTrigger | null = null;
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
            onProgress?.(self.progress);
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
      // Mobile / touch: video loops independently via `loop` attr;
      // beats advance on a 14s timeline decoupled from the video.
      let beatsTimeline: gsap.core.Tween | null = null;
      const progressProxy = { value: 0 };

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
              if (!beatsTimeline) {
                beatsTimeline = gsap.to(progressProxy, {
                  value: 1,
                  duration: 12,
                  ease: 'none',
                  repeat: -1,
                  onRepeat: () => { progressProxy.value = 0; },
                  onUpdate: () => onProgress?.(progressProxy.value),
                });
              }
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(container);
      return () => {
        observer.disconnect();
        beatsTimeline?.kill();
      };
    }
  }, [isDesktop, onProgress]);

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
        aria-hidden="true"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
