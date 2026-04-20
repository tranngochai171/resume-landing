'use client';

import { useRef, useCallback } from 'react';
import { ScrollVideo } from '@/components/motion/ScrollVideo';
import { HeroReveal } from '@/components/motion/HeroReveal';
import { useSectionView } from '@/hooks/useSectionView';

export function Hero() {
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
          poster="/images/01-closed.jpg"
          className="relative z-0 h-[60vh] w-full max-w-[1200px]"
          onProgress={onProgress}
        />
      </div>

      <HeroReveal progressRef={progressRef} />
    </section>
  );
}
