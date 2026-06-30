'use client';
/* eslint-disable @next/next/no-img-element -- hand-rolled cyber layout relies on plain <img> + CSS object-fit; next/image's wrapper/sizing fights the dossier grid */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Chakra_Petch, JetBrains_Mono } from 'next/font/google';
import { BootLoader, type BootHandle } from './BootLoader';
import { CyberTerminal } from './CyberTerminal';
import { BreachGame } from './BreachGame';
import { scramble } from './scramble';
import './os.css';

// Scoped to the cyber routes only (preload:false keeps the elegant pages untouched).
const chakra = Chakra_Petch({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-cyber', display: 'swap', preload: true });
const cyberMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-cyber-mono', display: 'swap', preload: false });

const EMAIL = 'tranngochai171@gmail.com';
const RESUME = '/resume/Topy_Tran_Resume_2026_AI_Workflows.pdf';

type Accent = 'pink' | 'cyan';

const WORK = [
  {
    file: 'FILE://DALMORE.dossier', cat: 'FINTECH · SEC-REGULATED', status: '● SHIPPED', accent: 'pink' as Accent,
    img: '/images/work/dalmore-desktop.webp', num: '01', title: 'Dalmore Group',
    role: 'Frontend Developer · Adroit Technology Solutions', loc: '— Los Angeles, CA · 2024 – Feb 2026',
    bullets: [
      '3 interconnected portals (Investor, Issuer, Compliance) under SEC regs — Reg A, CF, D',
      'KYC/AML/Sanctions via Persona with role-based access + audit trails',
      'Multi-channel payments: Stripe, Plaid, ACH, Wire — primary + secondary markets',
    ],
    tags: ['React 18', 'TypeScript', 'Vite', 'Tailwind', 'Radix', 'Shadcn', 'TanStack Query', 'Zustand'],
    panel: {
      brief: 'A securities platform for a FINRA-registered broker-dealer running Reg A+, Reg CF and Reg D offerings across primary and secondary markets.',
      built: 'Three role-separated portals — investor, issuer and compliance — with Persona-driven KYC/AML and sanctions screening, granular role-based access and end-to-end audit trails. Wired multi-rail payments through Stripe, Plaid, ACH and wire.',
      impact: 'A fully auditable investing flow shipped under live SEC constraints — built in lockstep with compliance and C-suite on every release.',
    },
  },
  {
    file: 'FILE://PINNED-GOLF.dossier', cat: 'GOLF TECH · SOCIAL + GPS', status: '● LIVE', accent: 'cyan' as Accent,
    img: '/images/work/pinnedgolf-desktop.webp', num: '02', title: 'Pinned Golf',
    role: 'Software Developer · Insomnia Club', loc: '— Remote · 2026 – Present',
    bullets: [
      'Owned the social layer front-to-back — Flutter app + Ruby on Rails API',
      'Instagram-style asymmetric follows: follow / accept / reject, add friends to a round, instant-mutual befriend of co-players',
      'Course-ratings system with corrected aggregate averages + QA remediation',
    ],
    tags: ['Flutter', 'Dart', 'Ruby on Rails', 'REST', 'PostgreSQL'],
    panel: {
      brief: 'The companion app for Pinned’s Caddie GPS hardware — a digital caddie that maps courses, ranges distances, keeps score and connects golfers. Live on Google Play.',
      built: 'Owned the social/community layer end-to-end across the Flutter client and Rails server: pivoted friends to an Instagram-style asymmetric follow graph (follow / accept / reject), built the friends + community and game-set-up experience, added players to a round with instant-mutual befriend of co-players, and shipped a course-ratings system.',
      impact: 'Turned a solo scorekeeping app into a social one — golfers now follow each other, build rounds together, and rate the courses they play.',
    },
  },
  {
    file: 'FILE://NESTWELL.dossier', cat: 'HEALTHTECH · 0→1 BUILD', status: '● LIVE', accent: 'cyan' as Accent,
    img: '/images/work/nestwell-desktop.webp', num: '03', title: 'Nestwell',
    role: 'Software Developer · Insomnia Club', loc: '— Pompano Beach, FL · 2024 – Present',
    bullets: [
      'Built from scratch with Next.js 14 App Router + tRPC + Supabase',
      'Config-driven quiz engine, environmental scoring, PDF reports, SimpleLab marketplace',
      '600+ Vitest tests, Playwright E2E, RLS across 16 tables / 20+ migrations',
    ],
    tags: ['Next.js 14', 'tRPC', 'Supabase', 'Stripe', 'Tailwind', 'Vitest', 'Playwright'],
    panel: {
      brief: 'A HealthTech product taken from blank repo to production — environmental-health assessments with integrated lab ordering.',
      built: 'Next.js 14 App Router + tRPC + Supabase. A config-driven quiz engine, environmental scoring, generated PDF reports, and a SimpleLab test marketplace with Stripe checkout.',
      impact: '600+ Vitest tests and Playwright E2E, with row-level security across 16 tables and 20+ migrations — shipped reliably and still live.',
    },
  },
  {
    file: 'FILE://ZELIGATE.dossier', cat: 'AI · HR-TECH', status: '● SHIPPED', accent: 'pink' as Accent,
    img: '/images/work/zeligate-desktop.webp', num: '04', title: 'Zeligate',
    role: 'Frontend Developer · Freelance', loc: '— Gold Coast, QLD · 2024 – 2025',
    bullets: [
      'AI candidate shortlisting + ranking with 60s highlight reels',
      'ATS connectivity to 50+ platforms — Greenhouse, Workday, BambooHR',
      'Timezone-aware scheduling reducing coordinator overhead',
    ],
    tags: ['React', 'Next.js', 'TypeScript'],
    panel: {
      brief: 'An AI recruitment platform that shortlists and ranks candidates for high-volume hiring teams.',
      built: 'Candidate shortlisting with AI ranking and 60-second highlight reels, ATS connectivity to 50+ platforms (Greenhouse, Workday, BambooHR), and timezone-aware interview scheduling.',
      impact: 'Cut coordinator overhead and accelerated screening for recruiters working through high applicant volume.',
    },
  },
  {
    file: 'FILE://TRAILER2YOU.dossier', cat: 'ECOMMERCE · MARKETPLACE', status: '● SHIPPED', accent: 'cyan' as Accent,
    img: '/images/work/trailer2you-desktop.webp', num: '05', title: 'Trailer2you',
    role: 'Fullstack Developer · Spritely Apps', loc: '— Robina, QLD · 2022 – 2024',
    bullets: [
      '70% hands-on lead on customer + admin portals, bi-weekly releases for 2+ years',
      'Stripe booking payments, deposits, damage protection add-ons',
      'Mentored junior devs, reduced PR turnaround significantly',
    ],
    tags: ['React', 'Next.js', 'MUI', 'Node.js', 'Azure DevOps'],
    panel: {
      brief: 'A two-sided trailer-rental marketplace with separate customer and admin experiences.',
      built: '70% hands-on lead across customer and admin portals on a bi-weekly release cadence for 2+ years. Stripe booking payments, deposits and damage-protection add-ons.',
      impact: 'Mentored junior developers and cut PR turnaround, keeping a production marketplace shipping steadily.',
    },
  },
];

const STATS = [
  { n: 6, suffix: 'p', label: 'YEARS SHIPPING' },
  { n: 7, suffix: '', label: 'COMPANIES' },
  { n: 10, suffix: 'p', label: 'PROJECTS SHIPPED' },
  { n: 600, suffix: 'c', label: 'TESTS WRITTEN' },
];

const RAIL = [
  { id: 'top', num: '00' }, { id: 'about', num: '01' }, { id: 'work', num: '02' },
  { id: 'ledger', num: '03' }, { id: 'stack', num: '04' }, { id: 'terminal', num: '05' }, { id: 'contact', num: '06' },
];

const LEDGER: { period: string; role: string; org: string; place: string; accent: Accent }[] = [
  { period: '2024 — Present', role: 'Software Developer', org: 'Insomnia Club', place: '· Pompano Beach (Remote)', accent: 'pink' },
  { period: '2024 — Feb 2026', role: 'Frontend Developer', org: 'Adroit Technology Solutions', place: '· LA (Remote)', accent: 'pink' },
  { period: '2024 — 2025', role: 'Frontend Developer', org: 'Zeligate', place: '· Gold Coast (Remote)', accent: 'pink' },
  { period: '2022 — 2024', role: 'Fullstack Developer', org: 'Spritely Apps', place: '· Robina (Remote)', accent: 'pink' },
  { period: '2021 — 2022', role: 'Software Developer', org: 'RocketCart', place: '· Garden Grove (Remote)', accent: 'cyan' },
  { period: '2021', role: 'Frontend Developer', org: 'Kodebaze', place: '· Copenhagen (Remote)', accent: 'cyan' },
  { period: '2020 — 2021', role: 'Frontend Web Developer', org: 'CyberLogitec', place: '· Singapore (On-site)', accent: 'cyan' },
];

const STACK: { label: string; accent: Accent; items: string[] }[] = [
  { label: '▌FRONTEND', accent: 'pink', items: ['React 18', 'Next.js', 'TypeScript', 'Tailwind', 'Shadcn/ui', 'Radix', 'MUI', 'Ant Design'] },
  { label: '▌MOBILE', accent: 'cyan', items: ['Flutter', 'Dart'] },
  { label: '▌BACKEND', accent: 'pink', items: ['NestJS', 'Node.js', 'Ruby on Rails', 'tRPC', 'GraphQL', 'REST', 'Express', 'PostgreSQL'] },
  { label: '▌PAYMENTS', accent: 'cyan', items: ['Stripe', 'Plaid', 'Persona KYC/AML', 'BoldSign'] },
  { label: '▌STATE', accent: 'pink', items: ['TanStack Query', 'Zustand', 'Jotai', 'Redux Toolkit', 'RHF', 'Zod'] },
  { label: '▌CLOUD', accent: 'cyan', items: ['AWS', 'Supabase', 'Vercel', 'Azure DevOps', 'Docker'] },
  { label: '▌TESTING', accent: 'pink', items: ['Vitest', 'Playwright', 'RTL'] },
];

export function CyberHome() {
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const bootRef = useRef<BootHandle>(null);
  const [copied, setCopied] = useState(false);
  const [openPanels, setOpenPanels] = useState<Record<number, boolean>>({});
  const [sfxOn, setSfxOn] = useState(false);
  const [override, setOverride] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [breachOpen, setBreachOpen] = useState(false);

  const sfxOnRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const overrideTimer = useRef<number>();

  // ---- sound FX (Web Audio) ----
  const sfx = useCallback((t: string) => {
    if (!sfxOnRef.current) return;
    let ctx = ctxRef.current;
    if (!ctx) {
      try { ctx = ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { return; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const tone = (freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number) => {
      try {
        const o = ctx!.createOscillator(), g = ctx!.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, ctx!.currentTime);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx!.currentTime + dur);
        g.gain.setValueAtTime(0.0001, ctx!.currentTime);
        g.gain.exponentialRampToValueAtTime(gain, ctx!.currentTime + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx!.currentTime + dur);
        o.connect(g).connect(ctx!.destination);
        o.start(); o.stop(ctx!.currentTime + dur + 0.03);
      } catch {}
    };
    switch (t) {
      case 'hover': tone(880, 0.04, 'square', 0.016); break;
      case 'click': tone(420, 0.07, 'square', 0.04, 640); break;
      case 'key': tone(1300, 0.016, 'square', 0.01); break;
      case 'open': tone(300, 0.16, 'sawtooth', 0.04, 760); break;
      case 'success': tone(523, 0.09, 'square', 0.05); window.setTimeout(() => tone(784, 0.16, 'square', 0.05), 90); break;
      case 'error': tone(160, 0.25, 'sawtooth', 0.06, 90); break;
      case 'override': tone(120, 0.5, 'sawtooth', 0.07, 1400); window.setTimeout(() => tone(1400, 0.4, 'square', 0.05, 120), 200); break;
      default: tone(600, 0.05, 'square', 0.03);
    }
  }, []);

  const toggleSound = () => {
    const next = !sfxOnRef.current;
    sfxOnRef.current = next;
    setSfxOn(next);
    try { localStorage.setItem('topy_sfx', next ? '1' : '0'); } catch {}
    if (next) sfx('success');
  };

  // restore sound pref + global hover blips
  useEffect(() => {
    try { const v = localStorage.getItem('topy_sfx') === '1'; sfxOnRef.current = v; setSfxOn(v); } catch {}
    let last = 0;
    const over = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest?.('a,button');
      if (!el) return;
      const n = Date.now();
      if (n - last < 70) return;
      last = n;
      sfx('hover');
    };
    document.addEventListener('pointerover', over, { passive: true });
    return () => document.removeEventListener('pointerover', over);
  }, [sfx]);

  // ---- konami → system override ----
  const doOverride = useCallback(() => {
    sfx('override');
    document.body.style.animation = 'os-override 1.2s steps(2) 1';
    window.setTimeout(() => { document.body.style.animation = ''; }, 1300);
    setOverride(true);
    clearTimeout(overrideTimer.current);
    overrideTimer.current = window.setTimeout(() => setOverride(false), 2800);
  }, [sfx]);

  useEffect(() => {
    const seq = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) { pos = 0; return; }
      const k = (e.key || '').toLowerCase();
      if (k === seq[pos]) { pos++; if (pos === seq.length) { pos = 0; doOverride(); } }
      else { pos = k === seq[0] ? 1 : 0; }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [doOverride]);

  // ---- live HCMC clock ----
  useEffect(() => {
    const el = clockRef.current;
    if (!el) return;
    const tick = () => {
      try {
        el.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      } catch {
        el.textContent = new Date().toLocaleTimeString();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ---- cursor glow ----
  useEffect(() => {
    const glow = cursorRef.current;
    if (!glow) return;
    let coarse = false;
    try { coarse = window.matchMedia('(pointer: coarse)').matches; } catch {}
    if (coarse) { glow.style.display = 'none'; return; }
    const move = (e: MouseEvent) => { glow.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`; };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);

  // ---- side rail scroll-spy ----
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('.os-rail-link'));
    if (!links.length) return;
    const ids = links.map((a) => a.getAttribute('data-rail') || '');
    const setActive = (id: string) => links.forEach((a) => a.classList.toggle('on', a.getAttribute('data-rail') === id));
    const spy = () => {
      const mid = (window.innerHeight || 800) * 0.4;
      let current = ids[0];
      for (const id of ids) { const sec = document.getElementById(id); if (sec && sec.getBoundingClientRect().top <= mid) current = id; }
      setActive(current);
    };
    spy();
    let ticking = false;
    const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; spy(); }); };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll, true);
    return () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onScroll, true); };
  }, []);

  // ---- stats count-up ----
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const stats = Array.from(root.querySelectorAll<HTMLElement>('[data-countup]'));
    if (!stats.length) return;
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch {}
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const numOf = (el: HTMLElement) => el.querySelector<HTMLElement>('[data-countup-num]') || el;
    const animate = (el: HTMLElement) => {
      if ((el as { __done?: boolean }).__done) return;
      (el as { __done?: boolean }).__done = true;
      const target = parseFloat(el.getAttribute('data-countup') || '0') || 0;
      const numEl = numOf(el);
      if (reduce) { numEl.textContent = String(target); return; }
      const dur = 1400, start = performance.now();
      const step = () => {
        const p = Math.min(1, (performance.now() - start) / dur);
        numEl.textContent = String(Math.round(ease(p) * target));
        if (p < 1) requestAnimationFrame(step); else numEl.textContent = String(target);
      };
      requestAnimationFrame(step);
    };
    const vh = () => window.innerHeight || 800;
    const inView = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.top < vh() * 0.9 && r.bottom > 0; };
    const check = () => stats.forEach((el) => { if (!(el as { __done?: boolean }).__done && inView(el)) animate(el); });
    check();
    let ticking = false;
    const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; check(); }); };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll, true);
    const snap = window.setTimeout(() => stats.forEach((el) => { if (!(el as { __done?: boolean }).__done) animate(el); }), 4500);
    return () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onScroll, true); clearTimeout(snap); };
  }, []);

  // ---- scroll reveals + scramble ----
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const scrambles = Array.from(root.querySelectorAll<HTMLElement>('[data-scramble]'));
    scrambles.forEach((el) => { if (!el.getAttribute('data-text')) el.setAttribute('data-text', el.textContent || ''); });

    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch {}

    const all = items.slice();
    scrambles.forEach((el) => { if (!all.includes(el)) all.push(el); });
    const cancels: Array<() => void> = [];

    const revealNow = (el: HTMLElement) => {
      if ((el as { __revealed?: boolean }).__revealed) return;
      (el as { __revealed?: boolean }).__revealed = true;
      el.style.opacity = '1';
      el.style.transform = 'none';
      if (el.hasAttribute('data-scramble')) {
        if (reduce) el.textContent = el.getAttribute('data-text') || '';
        else cancels.push(scramble(el));
      }
    };

    if (reduce) { all.forEach(revealNow); return; }

    const vh = () => window.innerHeight || document.documentElement.clientHeight || 800;
    const inView = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.top < vh() * 0.92 && r.bottom > 0; };

    items.forEach((el) => { el.style.transition = 'opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1)'; });
    all.forEach((el) => {
      if ((el as { __revealed?: boolean }).__revealed) return;
      if (inView(el)) { revealNow(el); return; }
      if (el.hasAttribute('data-reveal')) { el.style.opacity = '0'; el.style.transform = 'translateY(22px)'; }
      if (el.hasAttribute('data-scramble')) el.textContent = '';
    });

    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { revealNow(e.target as HTMLElement); io!.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      all.forEach((el) => { if (!(el as { __revealed?: boolean }).__revealed) io!.observe(el); });
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; all.forEach((el) => { if (!(el as { __revealed?: boolean }).__revealed && inView(el)) revealNow(el); }); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    const safety = window.setTimeout(() => all.forEach(revealNow), 2400);

    return () => {
      io?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearTimeout(safety);
      cancels.forEach((c) => c());
    };
  }, []);

  const copyEmail = () => {
    try {
      navigator.clipboard.writeText(EMAIL).then(() => {
        setCopied(true);
        sfx('success');
        window.setTimeout(() => setCopied(false), 1500);
      }).catch(() => { window.location.href = `mailto:${EMAIL}`; });
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  const transmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const from = (emailRef.current?.value || '').trim();
    const msg = (msgRef.current?.value || '').trim();
    const flag = (el: HTMLInputElement | HTMLTextAreaElement | null | undefined) => { if (el) { el.style.borderColor = '#ff2d95'; el.setAttribute('aria-invalid', 'true'); el.focus(); } };
    if (!from || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from)) { flag(emailRef.current); sfx('error'); return; }
    if (!msg) { flag(msgRef.current); sfx('error'); return; }

    const key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
    // No key configured → fall back to the user's mail client (best we can do with no backend).
    if (!key) {
      sfx('click');
      const body = encodeURIComponent(`${msg}\n\n— ${from}`);
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Project inquiry via topy.os')}&body=${body}`;
      return;
    }

    setFormStatus('sending');
    sfx('click');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: key,
          subject: 'New transmission via topy.os',
          from_name: 'TOPY.OS contact form',
          email: from,
          replyto: from,
          message: msg,
        }),
      });
      if (!(await res.json().catch(() => ({})))?.success) throw new Error('send failed');
      setFormStatus('sent');
      sfx('success');
      if (emailRef.current) emailRef.current.value = '';
      if (msgRef.current) msgRef.current.value = '';
    } catch {
      setFormStatus('error');
      sfx('error');
    }
  };

  const clearFieldError = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '';
    e.currentTarget.removeAttribute('aria-invalid');
    if (formStatus === 'error') setFormStatus('idle');
  };

  const reboot = () => { sfx('click'); bootRef.current?.replay(); };
  const openBreach = useCallback(() => { setBreachOpen(true); }, []);
  const closeBreach = useCallback(() => { setBreachOpen(false); }, []);
  const togglePanel = (i: number) => { sfx(openPanels[i] ? 'click' : 'open'); setOpenPanels((p) => ({ ...p, [i]: !p[i] })); };

  return (
    <div className={`os ${chakra.variable} ${cyberMono.variable}`} ref={rootRef}>
      <BootLoader ref={bootRef} />

      {/* fixed FX layers */}
      <div className="os-cursor" ref={cursorRef} aria-hidden="true" />
      <div className="os-grain" aria-hidden="true" />
      <div className="os-scanlines" aria-hidden="true" />
      <div className="os-sweep" aria-hidden="true" />
      <div className="os-vignette" aria-hidden="true" />

      {/* side progress rail */}
      <div className="os-rail" aria-hidden="true">
        {RAIL.map((r) => (
          <a key={r.id} className="os-rail-link" tabIndex={-1} data-rail={r.id} href={`#${r.id}`} title={`${r.num} // ${r.id.toUpperCase()}`} onClick={() => sfx('click')}>
            <span className="os-rail-num">{r.num}</span>
            <span className="os-rail-tick" />
          </a>
        ))}
      </div>

      <nav className="os-nav">
        <a href="#top" className="os-nav-brand"><span className="t">T//</span><span className="nm">TOPY.OS</span></a>
        <div className="os-nav-right">
          <span className="os-nav-links">
            <a href="#work" className="os-nav-link">Work</a>
            <a href="#about" className="os-nav-link">About</a>
            <a href="#ledger" className="os-nav-link">Ledger</a>
            <a href="#stack" className="os-nav-link">Stack</a>
          </span>
          <button type="button" className={`os-sound${sfxOn ? ' on' : ''}`} title="Toggle sound FX" aria-pressed={sfxOn} onClick={toggleSound}>
            <span className="ic">{sfxOn ? '♫' : '♪'}</span> <span className="lbl">{sfxOn ? 'SFX On' : 'SFX Off'}</span>
          </button>
          <button type="button" className="os-reboot" title="Replay boot sequence" onClick={reboot}>
            <span className="ic">⟳</span> Reboot
          </button>
          <a href="#contact" className="os-cta">Get in Touch</a>
        </div>
      </nav>

      <main id="main">
        {/* ---------- hero ---------- */}
        <section className="os-hero" id="top">
          <div className="os-hero-floor"><div className="os-hero-grid" /></div>
          <div className="os-hero-glow-pink" aria-hidden="true" />
          <div className="os-hero-glow-cyan" aria-hidden="true" />

          <div className="os-hero-inner">
            <div className="os-hud">
              <span className="os-hud-online"><i />SYSTEM ONLINE</span>
              <span className="os-sep">|</span>
              <span>LAT 10.823 // LNG 106.630</span>
              <span className="os-sep">|</span>
              <span>HCMC <span className="os-clock" ref={clockRef}>--:--:--</span></span>
            </div>

            <div className="os-prompt">&gt; whoami --verbose</div>

            <h1 className="os-title">
              <span className="glitch pink" aria-hidden="true">TRAN NGOC<br />HAI</span>
              <span className="glitch cyan" aria-hidden="true">TRAN NGOC<br />HAI</span>
              <span className="base">TRAN NGOC<br />HAI</span>
            </h1>

            <div className="os-role">SENIOR_FULLSTACK_DEVELOPER <span className="dim">{'// you can call me'}</span> <span className="topy">TOPY</span></div>

            <div className="os-chips">
              <span className="os-chip">◇ HO CHI MINH CITY, VN</span>
              <span className="os-chip">◇ SHIPPING SINCE 2020</span>
              <span className="os-chip">◇ 6+ YEARS // FINTECH · HEALTHTECH · SAAS</span>
            </div>

            <div className="os-actions">
              <a href="#work" className="os-btn os-btn-cyan">See the Work ↓</a>
              <a href="#contact" className="os-btn os-btn-pink">Establish Connection</a>
            </div>
          </div>

          <div className="os-ticker-wrap">
            <div className="os-ticker">
              {[0, 1].map((dup) => (
                <span key={dup} style={{ display: 'contents' }}>
                  <span>DALMORE</span><span className="p">/</span><span>PINNED</span><span className="c">/</span><span>NESTWELL</span><span className="p">/</span>
                  <span>ZELIGATE</span><span className="c">/</span><span>TRAILER2YOU</span><span className="p">/</span>
                </span>
              ))}
            </div>
          </div>

          <div className="os-scrollcue">SCROLL TO DECRYPT<br /><span className="c">↓</span></div>
        </section>

        {/* ---------- about ---------- */}
        <section className="os-section os-section--pad" id="about">
          <div className="os-wrap">
            <div className="os-eyebrow" data-reveal>[ 01 // ABOUT ]</div>
            <div className="os-about-grid">
              <div className="os-portrait-frame" data-reveal>
                <span className="os-corner tl" /><span className="os-corner tr" /><span className="os-corner bl" /><span className="os-corner br" />
                <picture>
                  <source srcSet="/images/portrait/portrait-2026-720.webp" type="image/webp" />
                  <img className="os-portrait" src="/images/portrait/portrait-2026-720.jpg" alt="Topy Tran" width={720} height={900} loading="lazy" decoding="async" />
                </picture>
                <div className="os-portrait-meta"><span>SUBJECT: T. HAI</span><span className="ok">● VERIFIED</span></div>
              </div>
              <div>
                <h2 className="os-h2" data-reveal data-scramble data-text="ABOUT" style={{ marginBottom: 26, fontSize: 'clamp(38px,6vw,76px)', lineHeight: 0.95 }}>ABOUT</h2>
                <div className="os-mono-pink" data-reveal>&gt; cat profile.md</div>
                <p className="os-p" data-reveal>I build production apps — web and mobile — across <span className="c">FinTech</span>, <span className="c">HealthTech</span>, <span className="c">SaaS</span>, <span className="c">eCommerce</span>, and <span className="c">sports-tech</span>. React / Next.js and Flutter up front, Node / NestJS and Rails on the back, deep Stripe.</p>
                <p className="os-p" data-reveal style={{ marginBottom: 30 }}>From SEC-regulated investment platforms to AI-powered recruitment tools to a social golf app. I own delivery end-to-end on teams of <span className="p">5–25</span>, ship on aggressive timelines, and interface directly with C-suite.</p>
                <blockquote className="os-quote" data-reveal>“Six years shipping production apps — from SEC-regulated investment platforms to AI recruitment tools to a social golf platform.”</blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- stats ---------- */}
        <section className="os-stats-wrap" id="stats">
          <div className="os-stats">
            {STATS.map((s) => (
              <div className="os-stat" data-reveal data-countup={s.n} key={s.label}>
                <div className="os-stat-num">
                  <span data-countup-num>0</span>
                  {s.suffix === 'p' && <span className="p">+</span>}
                  {s.suffix === 'c' && <span className="c">+</span>}
                </div>
                <div className="os-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- selected work ---------- */}
        <section className="os-section" id="work">
          <div className="os-wrap">
            <div className="os-eyebrow" data-reveal>[ 02 // SELECTED WORK ]</div>
            <h2 className="os-h2" data-reveal data-scramble data-text="SELECTED WORK">SELECTED WORK</h2>
            <div className="os-dossiers">
              {WORK.map((w, i) => (
                <article className="os-dossier" data-reveal key={w.num} style={{ '--ac': `var(--${w.accent})` } as React.CSSProperties}>
                  <div className="os-dossier-head" style={{ background: `rgba(${w.accent === 'pink' ? '255,45,149' : '0,229,255'},.05)` }}>
                    <span className="os-dossier-file">{w.file}</span><span>{w.cat}</span><span className="os-dossier-status">{w.status}</span>
                  </div>
                  <div className="os-dossier-body">
                    <img className="os-dossier-img" src={w.img} alt={`${w.title} screenshot`} width={700} height={525} loading="lazy" decoding="async" />
                    <div className="os-dossier-main">
                      <div className="os-dossier-top"><span className="os-dossier-num">{w.num}</span><h3 className="os-dossier-title">{w.title}</h3></div>
                      <div className="os-dossier-sub">{w.role} <span className="dim">{w.loc}</span></div>
                      <div className="os-bullets">
                        {w.bullets.map((b, j) => <div className="os-bullet" key={j}><i>▸</i>{b}</div>)}
                      </div>
                      <div className="os-tags">{w.tags.map((t) => <span className="os-tag" key={t}>{t}</span>)}</div>

                      <button type="button" className="os-dossier-toggle" onClick={() => togglePanel(i)} aria-expanded={!!openPanels[i]} aria-controls={`os-dossier-panel-${i}`}>
                        <span>{openPanels[i] ? '▾' : '▸'}</span> <span>{openPanels[i] ? 'Collapse file' : 'Decrypt full file'}</span>
                      </button>
                      {openPanels[i] && (
                        <div className="os-dossier-panel" id={`os-dossier-panel-${i}`}>
                          <div className="stack">
                            <div><div className="os-panel-label p">▌ BRIEF</div><div className="os-panel-body">{w.panel.brief}</div></div>
                            <div><div className="os-panel-label c">▌ WHAT I BUILT</div><div className="os-panel-body">{w.panel.built}</div></div>
                            <div><div className="os-panel-label p">▌ IMPACT</div><div className="os-panel-body">{w.panel.impact}</div></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- ledger ---------- */}
        <section className="os-section" id="ledger">
          <div className="os-wrap">
            <div className="os-eyebrow" data-reveal>[ 03 // LEDGER ]</div>
            <h2 className="os-h2" data-reveal data-scramble data-text="LEDGER">LEDGER</h2>
            <div className="os-ledger">
              {LEDGER.map((r, i) => (
                <div className="os-ledger-row" data-reveal key={i} style={{ '--ac': `var(--${r.accent})` } as React.CSSProperties}>
                  <span className="os-ledger-dot" />
                  <span className="os-ledger-period">{r.period}</span>
                  <span className="os-ledger-role">{r.role}</span>
                  <span className="os-ledger-org">{r.org} <span className="dim">{r.place}</span></span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- stack ---------- */}
        <section className="os-section" id="stack">
          <div className="os-wrap">
            <div className="os-eyebrow" data-reveal>[ 04 // STACK ]</div>
            <h2 className="os-h2" data-reveal data-scramble data-text="STACK">STACK</h2>
            <div className="os-stack-grid">
              {STACK.map((g) => (
                <div className="os-stack-card" data-reveal key={g.label} style={{ '--ac': `var(--${g.accent})` } as React.CSSProperties}>
                  <div className="os-stack-label">{g.label}</div>
                  <div className="os-stack-tags">{g.items.map((t) => <span className="os-stack-tag" key={t}>{t}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- terminal ---------- */}
        <section className="os-section" id="terminal">
          <div className="os-wrap">
            <div className="os-eyebrow" data-reveal>[ 05 // TERMINAL ]</div>
            <h2 className="os-h2" data-reveal data-scramble data-text="TERMINAL" style={{ marginBottom: 16 }}>TERMINAL</h2>
            <p className="os-term-intro" data-reveal>Prefer a command line? This one&apos;s real. Type <span className="p">help</span> and look around — <span className="c">ls</span>, <span className="c">cat</span>, <span className="c">hire</span>. Or run <span className="p">breach</span> to jack in and play.</p>
            <div className="os-actions" data-reveal style={{ marginBottom: 22 }}>
              <button type="button" className="os-btn os-btn-cyan" onClick={() => { sfx('open'); openBreach(); }}>▶ RUN BREACH PROTOCOL</button>
            </div>
            <CyberTerminal sfx={sfx} onBreach={openBreach} />
          </div>
        </section>

        {/* ---------- contact ---------- */}
        <section className="os-section os-section--pad" id="contact">
          <div className="os-console" data-reveal>
            <span className="os-corner tl" /><span className="os-corner tr" /><span className="os-corner bl" /><span className="os-corner br" />
            <div className="os-console-head">
              <span className="os-traffic" style={{ background: 'var(--pink)' }} />
              <span className="os-traffic" style={{ background: 'var(--amber)' }} />
              <span className="os-traffic" style={{ background: 'var(--green)' }} />
              <span className="label">transmission@topy.os — secure channel</span>
            </div>
            <div className="os-console-body">
              <div className="os-terminal">
                <div><span className="g">&gt;</span> establishing secure channel<span className="d"> .......... </span><span className="g">OK</span></div>
                <div><span className="g">&gt;</span> operator: <span className="c">TOPY</span> {'// status:'} <span className="g">AVAILABLE FOR CONTRACT &amp; FULL-TIME</span></div>
              </div>
              <h2 className="os-h2" data-scramble data-text="GET IN TOUCH">GET IN TOUCH</h2>
              <p className="os-p">Building something in FinTech, HealthTech or SaaS and need someone who ships? Drop a line — I read every message.</p>

              <form className="os-form" onSubmit={transmit}>
                <input ref={emailRef} type="email" className="os-field" placeholder="> your email (so I can reply)" aria-label="Your email" aria-required="true" autoComplete="email" onInput={clearFieldError} />
                <textarea ref={msgRef} className="os-textarea" rows={3} placeholder="> type your message..." aria-label="Your message" aria-required="true" onInput={clearFieldError} />
                <button type="submit" className="os-transmit" disabled={formStatus === 'sending'}>
                  {formStatus === 'sending' ? 'Transmitting…' : <>Transmit Message <span style={{ fontSize: 14 }}>↗</span></>}
                </button>
                {formStatus === 'sent' && <div className="os-form-status ok" role="status">✓ Transmission received — I’ll reply within ~24h.</div>}
                {formStatus === 'error' && <div className="os-form-status err" role="alert">✗ Channel error. Email me directly below ↓</div>}
              </form>

              <div className="os-links">
                <button type="button" className="os-link cyan" onClick={copyEmail}>
                  <div className="k">EMAIL — CLICK TO COPY</div>
                  <div className={`v ${copied ? 'g' : 'c'}`}>{copied ? 'COPIED ✓' : EMAIL}</div>
                </button>
                <a className="os-link" href="https://linkedin.com/in/topytran" target="_blank" rel="noopener noreferrer">
                  <div className="k">NETWORK</div><div className="v">LinkedIn ↗</div>
                </a>
                <a className="os-link" href="https://github.com/tranngochai171" target="_blank" rel="noopener noreferrer">
                  <div className="k">SOURCE</div><div className="v">GitHub ↗</div>
                </a>
                <a className="os-link pink" href={RESUME} target="_blank" rel="noopener noreferrer">
                  <div className="k">DOSSIER</div><div className="v p">Download Résumé ↓</div>
                </a>
              </div>
            </div>
          </div>

          <footer className="os-footer">
            <span>© 2026 TRAN NGOC HAI · HCMC — TOPY.OS v2.6</span>
            <span className="os-footer-right">
              <button type="button" className="os-footer-reboot" title="Replay boot sequence" onClick={reboot}>⟳ REBOOT SYSTEM</button>
              <a href="#top">↑ RETURN TO TOP</a>
            </span>
          </footer>
        </section>
      </main>

      <BreachGame open={breachOpen} onClose={closeBreach} sfx={sfx} />

      {/* konami → system override */}
      <div className={`os-override-msg${override ? ' on' : ''}`} aria-hidden="true">
        <div className="os-override-card">
          <div className="k">ROOT ACCESS GRANTED</div>
          <div className="h">SYSTEM OVERRIDE</div>
          <div className="s">You found the override. Now type <span className="p">hire</span> in the terminal.</div>
        </div>
      </div>
    </div>
  );
}
