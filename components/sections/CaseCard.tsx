'use client';

import { LeaderDots } from '@/components/ui/LeaderDots';
import { FadeUp } from '@/components/motion/FadeUp';
import type { Case } from '@/lib/work-data';

export function CaseCard({ case: c }: { case: Case }) {
  return (
    <article className="mb-32 md:mb-48">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-[2fr_1fr]">
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
          {c.media.type === 'video' && (
            <video
              src={c.media.src}
              muted
              loop
              playsInline
              autoPlay
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
          )}
          {c.media.type === 'typographic' && (
            <div className="flex h-full w-full items-center justify-center">
              <h3 className="font-display text-6xl font-light uppercase tracking-tight text-fg md:text-8xl">
                {c.name}
              </h3>
            </div>
          )}
        </FadeUp>

        <FadeUp className="flex flex-col justify-between">
          <div>
            <span className="font-mono text-xs text-fg-subtle">{c.number}</span>
            <h3 className="mt-2 font-display text-4xl font-light leading-tight tracking-tight text-fg md:text-5xl">
              {c.name}
            </h3>
            <p className="mt-3 font-mono text-xs uppercase tracking-widest text-fg-muted">
              {c.role}
            </p>
            <ul className="mt-8 space-y-4">
              {c.highlights.map((h) => (
                <li
                  key={h}
                  className="font-body text-base leading-relaxed text-fg-muted before:mr-3 before:text-accent before:content-['—']"
                >
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              {c.stack.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-fg-subtle px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-fg-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>

      <LeaderDots
        className="mt-8"
        left={c.company}
        center={c.location}
        right={c.dates}
      />
    </article>
  );
}
