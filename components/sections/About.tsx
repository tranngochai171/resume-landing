'use client';

import { SectionNumber } from '@/components/ui/SectionNumber';
import { FadeUp } from '@/components/motion/FadeUp';
import { SplitReveal } from '@/components/motion/SplitReveal';

export function About() {
  return (
    <section
      id="about"
      className="relative bg-bg px-6 py-24 md:px-12 md:py-48"
    >
      <div className="mx-auto max-w-content">
        <SectionNumber number="01" title="About" />

        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_2fr]">
          <FadeUp as="div" className="max-w-readable">
            <p className="font-body text-lg leading-relaxed text-fg">
              I build production web apps for FinTech, HealthTech, SaaS, and
              eCommerce. React / Next.js front, Node / NestJS back, deep
              Stripe.
            </p>
            <p className="mt-6 font-body text-lg leading-relaxed text-fg-muted">
              From SEC-regulated investment platforms to AI-powered
              recruitment tools. I own delivery end-to-end on teams of 5–25,
              ship on aggressive timelines, interface directly with C-suite.
            </p>
          </FadeUp>

          <SplitReveal
            as="blockquote"
            trigger="scroll"
            splitBy="words"
            stagger={0.03}
            className="font-condensed text-3xl font-bold uppercase leading-tight tracking-wide text-fg-muted md:text-5xl"
          >
            &ldquo;Six years shipping production apps — from SEC-regulated
            investment platforms to AI recruitment tools.&rdquo;
          </SplitReveal>
        </div>
      </div>
    </section>
  );
}
