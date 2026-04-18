'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { beats, beatOpacity } from '@/lib/hero-beats';

interface Props {
  progressRef: React.MutableRefObject<number>;
}

export function HeroReveal({ progressRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const scrollCueDismissed = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      // Final-state render: show portfolio + invitation beats, hide ticks scrub.
      root.querySelectorAll<HTMLElement>('[data-beat]').forEach((el) => {
        const id = el.dataset.beat;
        el.style.opacity = id === 'portfolio' || id === 'invitation' ? '1' : '0';
      });
      root.querySelectorAll<HTMLElement>('[data-corner]').forEach((el) => {
        el.style.opacity = '0';
      });
      root.querySelectorAll<HTMLElement>('[data-tick]').forEach((el) => {
        el.style.opacity = '1';
      });
      if (scrollCueRef.current) scrollCueRef.current.style.opacity = '0';
      return;
    }

    const tick = () => {
      const p = progressRef.current;

      // Beats
      root.querySelectorAll<HTMLElement>('[data-beat]').forEach((el) => {
        const id = el.dataset.beat as typeof beats[number]['id'];
        const beat = beats.find((b) => b.id === id);
        if (!beat) return;
        const o = beatOpacity(p, beat.range);
        el.style.opacity = String(o);
        el.style.visibility = o === 0 ? 'hidden' : 'visible';
      });

      // Name drift: intro beat translates Y -6px across 0→0.40.
      const intro = root.querySelector<HTMLElement>('[data-beat="intro"]');
      if (intro) {
        const drift = Math.min(p / 0.4, 1) * -6;
        intro.style.transform = `translate(-50%, calc(-50% + ${drift}px))`;
      }

      // Corner labels: 0–0.25 full, 0.25–0.35 top fades, 0.35–0.50 bottom fades.
      root.querySelectorAll<HTMLElement>('[data-corner]').forEach((el) => {
        const pos = el.dataset.corner ?? '';
        const isTop = pos.startsWith('top');
        const fadeStart = isTop ? 0.25 : 0.35;
        const fadeEnd = isTop ? 0.35 : 0.50;
        let o = 1;
        if (p >= fadeEnd) o = 0;
        else if (p > fadeStart) o = 1 - (p - fadeStart) / (fadeEnd - fadeStart);
        el.style.opacity = String(o);
      });

      // Progress ticks: 5 segments, light sequentially from 0.50 → 1.00.
      root.querySelectorAll<HTMLElement>('[data-tick]').forEach((el) => {
        const idx = Number(el.dataset.tick ?? 0);
        const appearAt = 0.50 + idx * 0.10; // 0.50, 0.60, 0.70, 0.80, 0.90
        const o = p >= appearAt ? 1 : 0;
        el.style.opacity = String(o);
      });

      // Scroll cue: visible until user scrolls past 50px.
      if (!scrollCueDismissed.current && scrollCueRef.current) {
        if (window.scrollY > 50) {
          scrollCueDismissed.current = true;
          gsap.to(scrollCueRef.current, { opacity: 0, duration: 0.4, ease: 'power2.out' });
        }
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [progressRef]);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-10">
      {/* Corner metadata (fades out 0.25–0.50) */}
      <div className="absolute inset-x-0 top-24 mx-auto flex max-w-content items-start justify-between px-6 md:px-12">
        <div
          data-corner="top-left"
          className="font-condensed text-xs font-bold uppercase leading-tight tracking-widest text-fg-muted"
        >
          Senior Fullstack
          <br />
          Developer
        </div>
        <div
          data-corner="top-right"
          className="text-right font-condensed text-xs font-bold uppercase leading-tight tracking-widest text-fg-muted"
        >
          Based in
          <br />
          Ho Chi Minh City, VN
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-12 mx-auto flex max-w-content items-end justify-between px-6 md:px-12">
        <div
          data-corner="bot-left"
          className="font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted"
        >
          Shipping since 2020
        </div>
        <div
          data-corner="bot-right"
          className="font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted"
        >
          Dalmore / Nestwell / Zeligate
        </div>
      </div>

      {/* Beats (all centered, absolute, mount together). drop-shadow ensures
          readability when text overlaps the bright open-MacBook screen. */}
      <h1
        data-beat="intro"
        role="img"
        aria-label="Tran Ngoc Hai"
        className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center font-display text-5xl font-light leading-none tracking-tight text-fg [text-shadow:0_2px_20px_rgba(0,0,0,0.85)] md:text-7xl lg:text-display-xl"
      >
        TRAN NGOC HAI
      </h1>
      <p
        data-beat="nickname"
        className="absolute left-1/2 top-[calc(50%+4.5rem)] w-full -translate-x-1/2 text-center font-body text-base italic text-fg/80 [text-shadow:0_2px_12px_rgba(0,0,0,0.85)] md:text-lg"
      >
        — but you can call me Topy —
      </p>
      <div
        data-beat="role"
        className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center"
      >
        <div className="font-display text-5xl font-light leading-none tracking-tight text-fg [text-shadow:0_2px_20px_rgba(0,0,0,0.85)] md:text-7xl">
          Senior Fullstack
        </div>
        <div className="mt-3 font-condensed text-xs font-bold uppercase tracking-widest text-fg/80 [text-shadow:0_2px_12px_rgba(0,0,0,0.85)]">
          6+ years shipping
        </div>
      </div>
      <div
        data-beat="portfolio"
        className="absolute left-1/2 top-[calc(50%-5rem)] w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center md:top-[calc(50%-6rem)]"
      >
        <div className="font-condensed text-lg font-bold uppercase tracking-[0.2em] text-fg [text-shadow:0_2px_20px_rgba(0,0,0,0.85)] md:text-2xl">
          Dalmore · Nestwell · Zeligate · Trailer2you
        </div>
        <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-fg/70 [text-shadow:0_2px_12px_rgba(0,0,0,0.85)]">
          &amp; more on the way
        </div>
      </div>
      <div
        data-beat="invitation"
        className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center"
      >
        <div className="font-condensed text-sm font-bold uppercase tracking-[0.3em] text-fg [text-shadow:0_2px_12px_rgba(0,0,0,0.85)]">
          See the work
        </div>
        <div className="mt-3 animate-pulse font-display text-3xl text-fg [text-shadow:0_2px_12px_rgba(0,0,0,0.85)]">↓</div>
      </div>

      {/* Progress ticks (watch-dial, bottom-center, 0.50→1.00) */}
      <div className="absolute inset-x-0 bottom-12 flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            data-tick={i}
            className="block h-[2px] w-8 bg-fg/80"
            style={{ opacity: 0 }}
          />
        ))}
      </div>

      {/* First-paint scroll cue */}
      <div
        ref={scrollCueRef}
        className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1"
      >
        <span className="font-condensed text-[10px] font-bold uppercase tracking-[0.3em] text-fg-muted">
          Scroll to discover
        </span>
        <span className="animate-bounce text-fg-muted">↓</span>
      </div>
    </div>
  );
}
