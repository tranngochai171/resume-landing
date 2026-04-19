'use client';

import { SectionNumber } from '@/components/ui/SectionNumber';
import { FadeUp } from '@/components/motion/FadeUp';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { ScrollDesaturate } from '@/components/motion/ScrollDesaturate';
import { Portrait } from '@/components/ui/Portrait';

export function About() {
  return (
    <section
      id="about"
      className="relative bg-bg px-6 py-24 md:px-12 md:py-48"
    >
      <div className="mx-auto max-w-content">
        <SectionNumber number="01" title="About" />

        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.5fr] md:items-end md:gap-16">
          <ScrollDesaturate className="mx-auto w-full max-w-[240px] md:max-w-none">
            <Portrait className="aspect-[4/5] w-full object-cover object-top" />
          </ScrollDesaturate>

          <div className="flex flex-col gap-10">
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
              as="div"
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
      </div>
    </section>
  );
}
