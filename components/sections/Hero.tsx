'use client';

import { useRef, useCallback } from 'react';
import { preload } from 'react-dom';
import { ScrollVideo } from '@/components/motion/ScrollVideo';
import { HeroReveal } from '@/components/motion/HeroReveal';
import { useSectionView } from '@/hooks/useSectionView';

const POSTER = '/images/01-closed.webp';

export function Hero() {
  // The poster is the LCP element: fetch it first, from the document head.
  preload(POSTER, { as: 'image', fetchPriority: 'high' });
  const progressRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  useSectionView('hero', sectionRef);

  const onProgress = useCallback((p: number) => {
    progressRef.current = p;
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen w-full overflow-hidden bg-bg"
    >
      <div className="relative flex min-h-screen items-center justify-center">
        <ScrollVideo
          src="/videos/macbook-scroll.mp4"
          poster={POSTER}
          className="relative z-0 h-[60vh] w-full max-w-[1200px]"
          onProgress={onProgress}
        />
      </div>

      <HeroReveal progressRef={progressRef} />
    </section>
  );
}
