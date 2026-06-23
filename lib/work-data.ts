export interface Case {
  number: string;
  name: string;
  role: string;
  company: string;
  location: string;
  dates: string;
  media: { type: 'typographic' } | { type: 'image'; src: string; mobileSrc: string } | { type: 'video'; src: string };
  highlights: string[];
  stack: string[];
}

export const cases: Case[] = [
  {
    number: '01',
    name: 'Dalmore Group',
    role: 'Frontend Developer · Adroit Technology Solutions',
    company: 'Dalmore',
    location: 'Los Angeles, CA',
    dates: '2024 – Feb 2026',
    media: { type: 'image', src: '/images/work/dalmore-desktop.jpg', mobileSrc: '/images/work/dalmore-mobile.jpg' },
    highlights: [
      '3 interconnected portals (Investor, Issuer, Compliance) under SEC regs — Reg A, CF, D',
      'KYC/AML/Sanctions via Persona with role-based access + audit trails',
      'Multi-channel payments: Stripe, Plaid, ACH, Wire — primary + secondary markets',
    ],
    stack: ['React 18', 'TypeScript', 'Vite', 'Tailwind', 'Radix', 'Shadcn', 'TanStack Query', 'Zustand'],
  },
  {
    number: '02',
    name: 'Nestwell',
    role: 'Software Developer · Insomnia Club',
    company: 'Nestwell',
    location: 'Pompano Beach, FL',
    dates: '2024 – Present',
    media: { type: 'image', src: '/images/work/nestwell-desktop.jpg', mobileSrc: '/images/work/nestwell-mobile.jpg' },
    highlights: [
      'Built from scratch with Next.js 14 App Router + tRPC + Supabase',
      'Config-driven quiz engine, environmental scoring, PDF reports, SimpleLab marketplace',
      '600+ Vitest tests, Playwright E2E, RLS across 16 tables / 20+ migrations',
    ],
    stack: ['Next.js 14', 'tRPC', 'Supabase', 'Stripe', 'Tailwind', 'Vitest', 'Playwright'],
  },
  {
    number: '03',
    name: 'Zeligate',
    role: 'Frontend Developer · Freelance',
    company: 'Zeligate',
    location: 'Gold Coast, QLD',
    dates: '2024 – 2025',
    media: { type: 'image', src: '/images/work/zeligate-desktop.jpg', mobileSrc: '/images/work/zeligate-mobile.jpg' },
    highlights: [
      'AI candidate shortlisting + ranking with 60s highlight reels',
      'ATS connectivity to 50+ platforms — Greenhouse, Workday, BambooHR',
      'Timezone-aware scheduling reducing coordinator overhead',
    ],
    stack: ['React', 'Next.js', 'TypeScript'],
  },
  {
    number: '04',
    name: 'Trailer2you',
    role: 'Fullstack Developer · Spritely Apps',
    company: 'Trailer2you',
    location: 'Robina, QLD',
    dates: '2022 – 2024',
    media: { type: 'image', src: '/images/work/trailer2you-desktop.jpg', mobileSrc: '/images/work/trailer2you-mobile.jpg' },
    highlights: [
      '70% hands-on lead on customer + admin portals, bi-weekly releases for 2+ years',
      'Stripe booking payments, deposits, damage protection add-ons',
      'Mentored junior devs, reduced PR turnaround significantly',
    ],
    stack: ['React', 'Next.js', 'MUI', 'Node.js', 'Azure DevOps'],
  },
];
