'use client';

import { ScrollVideo } from '@/components/motion/ScrollVideo';
import { SplitReveal } from '@/components/motion/SplitReveal';

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen w-full overflow-hidden bg-bg"
    >
      {/* Corner metadata */}
      <div className="pointer-events-none absolute inset-x-0 top-24 z-10 mx-auto flex max-w-content items-start justify-between px-6 md:px-12">
        <div className="font-condensed text-xs font-bold uppercase leading-tight tracking-widest text-fg-muted">
          Senior Fullstack
          <br />
          Developer
        </div>
        <div className="text-right font-condensed text-xs font-bold uppercase leading-tight tracking-widest text-fg-muted">
          Based in
          <br />
          Ho Chi Minh City, VN
        </div>
      </div>

      {/* Centered MacBook video */}
      <div className="relative flex min-h-screen items-center justify-center">
        <ScrollVideo
          src="/videos/macbook-scroll.mp4"
          poster="/images/01-closed.jpg"
          className="relative z-0 h-[60vh] w-full max-w-[1200px]"
        />

        {/* Name overlay */}
        <SplitReveal
          as="h1"
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-full -translate-x-1/2 -translate-y-1/2 text-center font-display text-5xl font-light leading-none tracking-tight text-fg md:text-7xl lg:text-display-xl"
          stagger={0.04}
        >
          TRAN NGOC HAI
        </SplitReveal>
      </div>

      {/* Teaser nav at base */}
      <div className="pointer-events-none absolute inset-x-0 bottom-12 z-10 mx-auto flex max-w-content items-end justify-between px-6 md:px-12">
        <div className="font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted">
          Shipping since 2020
        </div>
        <div className="font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted">
          Dalmore / Nestwell / Zeligate
        </div>
      </div>
    </section>
  );
}
