'use client';
/* eslint-disable @next/next/no-img-element -- fixed-size dossier slots use plain <picture>/<img> with object-fit, like the 2D TOPY.OS page */

import dynamic from 'next/dynamic';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Chakra_Petch, JetBrains_Mono } from 'next/font/google';
import { CPS, EMAIL, INITIAL_STATE, INTRO_LOG, SH, type CityState } from './data';
import type { CityHandle } from './engine';
import { pickView, probeWebGL } from './support';
import './city.css';

const chakra = Chakra_Petch({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-city', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-city-mono', display: 'swap' });
/** Canvas signage is drawn with the same (hashed) next/font families. */
const FONTS = { display: `${chakra.style.fontFamily}, sans-serif`, mono: `${mono.style.fontFamily}, monospace` };

// The 2D TOPY.OS page, loaded only when the city cannot run (no WebGL2, software GPU, reduced motion, errors).
const CyberHome = dynamic(() => import('@/components/cyber/CyberHome').then((m) => m.CyberHome), { ssr: false });

const RESUME = '/resume/Topy_Tran_Resume_2026_AI_Workflows.pdf';
const OS = '/os/';

const WORK = [
  { slug: 'dalmore', cat: '01 · FINTECH · SEC', pink: true, status: '● SHIPPED', title: 'Dalmore Group', role: 'Frontend Dev · Adroit Technology · 2024–2026', bullets: ['3 interconnected portals (Investor, Issuer, Compliance) under Reg A, CF, D', 'KYC/AML via Persona, role-based access, audit trails', 'Stripe, Plaid, ACH & Wire across primary + secondary markets'], tags: 'React 18 · TypeScript · Vite · Tailwind · Radix · TanStack Query · Zustand' },
  { slug: 'nestwell', cat: '02 · HEALTHTECH · 0→1', pink: false, status: '● LIVE', title: 'Nestwell', role: 'Software Dev · Insomnia Club · 2024–Present', bullets: ['Built from scratch: Next.js 14 App Router + tRPC + Supabase', 'Config-driven quiz engine, scoring, PDF reports, lab marketplace', '600+ Vitest tests, Playwright E2E, RLS across 16 tables'], tags: 'Next.js 14 · tRPC · Supabase · Stripe · Tailwind · Vitest · Playwright' },
  { slug: 'zeligate', cat: '03 · AI · HR-TECH', pink: true, status: '● SHIPPED', title: 'Zeligate', role: 'Frontend Dev · Freelance · 2024–2025', bullets: ['AI candidate shortlisting + ranking with 60s highlight reels', 'ATS connectivity to 50+ platforms - Greenhouse, Workday, BambooHR', 'Timezone-aware scheduling that cut coordinator overhead'], tags: 'React · Next.js · TypeScript' },
  { slug: 'trailer2you', cat: '04 · ECOMMERCE', pink: false, status: '● SHIPPED', title: 'Trailer2you', role: 'Fullstack Dev · Spritely Apps · 2022–2024', bullets: ['70% hands-on lead on customer + admin portals, bi-weekly releases', 'Stripe bookings, deposits, damage-protection add-ons', 'Mentored juniors and cut PR turnaround'], tags: 'React · Next.js · MUI · Node.js · Azure DevOps' },
];

const LEDGER = [
  { when: '2024 - PRESENT', role: 'Software Developer', org: 'Insomnia Club · Pompano Beach (Remote)', pink: true },
  { when: '2024 - FEB 2026', role: 'Frontend Developer', org: 'Adroit Technology Solutions · LA (Remote)', pink: true },
  { when: '2024 - 2025', role: 'Frontend Developer', org: 'Zeligate · Gold Coast (Remote)', pink: true },
  { when: '2022 - 2024', role: 'Fullstack Developer', org: 'Spritely Apps · Robina (Remote)', pink: true },
  { when: '2021 - 2022', role: 'Software Developer', org: 'RocketCart · Garden Grove (Remote)', pink: false },
  { when: '2021', role: 'Frontend Developer', org: 'Kodebaze · Copenhagen (Remote)', pink: false },
  { when: '2020 - 2021', role: 'Frontend Web Developer', org: 'CyberLogitec · Singapore (On-site)', pink: false },
];

const STACK: [string, string[]][] = [
  ['FRONTEND', ['React 18', 'Next.js', 'TypeScript', 'Tailwind', 'Shadcn/ui', 'Radix', 'MUI', 'Ant Design']],
  ['BACKEND', ['NestJS', 'Node.js', 'tRPC', 'GraphQL', 'REST', 'Express']],
  ['PAYMENTS', ['Stripe', 'Plaid', 'Persona KYC/AML', 'BoldSign']],
  ['STATE', ['TanStack Query', 'Zustand', 'Jotai', 'Redux Toolkit', 'RHF', 'Zod']],
  ['CLOUD', ['AWS', 'Supabase', 'Vercel', 'Azure DevOps', 'Docker']],
  ['TESTING', ['Vitest', 'Playwright', 'RTL']],
];

const READY_KEYS: [string, string][] = [['W/↑', 'THROTTLE'], ['A D', 'STEER'], ['SHIFT', 'BOOST'], ['SCROLL', 'CRUISE'], ['V', 'FLY MODE'], ['M', 'LOFI']];

const OFF = '#6a6a86';

/**
 * `/`: TOPY.OS - Neon City 3D. Ride a hover-bike down a neon Sài Gòn avenue; each gate opens a file
 * (about, work, ledger, stack, contact). The three.js engine is loaded on demand; when the city
 * cannot run, the 2D TOPY.OS page renders here instead. Panel content is always in the DOM.
 */
export function CityHome() {
  const [view, setView] = useState<'city' | '2d'>('city');
  const [s, setS] = useState<CityState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const eng = useRef<CityHandle | null>(null);

  useEffect(() => {
    if (pickView(window.location.search, window.matchMedia('(prefers-reduced-motion: reduce)').matches, probeWebGL) === '2d') {
      setView('2d');
      return;
    }
    let dead = false;
    const fallback = (err: unknown) => {
      console.warn('[city] falling back to 2D:', err);
      eng.current?.dispose();
      eng.current = null;
      if (!dead) setView('2d');
    };
    import('./engine')
      .then(({ createCity }) => {
        if (dead || !hostRef.current || !rootRef.current) return;
        eng.current = createCity(hostRef.current, rootRef.current, FONTS, { onState: setS, onFallback: fallback });
      })
      .catch(fallback);
    return () => {
      dead = true;
      eng.current?.dispose();
      eng.current = null;
    };
  }, []);

  const sec = s.section && s.section !== s.dismissed ? s.section : null;
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [sec]);

  if (view === '2d') return <CyberHome />;

  const act = (fn: (h: CityHandle) => void) => () => {
    if (eng.current) fn(eng.current);
  };
  const copyEmail = () => {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    };
    try {
      navigator.clipboard.writeText(EMAIL).then(done, () => (location.href = 'mailto:' + EMAIL));
    } catch {
      location.href = 'mailto:' + EMAIL;
    }
  };

  const { phase: ph, mobile } = s;
  const cp = CPS.find((c) => c.id === s.section);
  const sectorLabel = cp ? `SECTOR ${cp.n} // ${cp.t} · ${cp.loc}` : 'OPEN ROAD // DOWNTOWN';
  const showReopen = !!s.section && s.dismissed === s.section;
  const shardsText = `◆ DATA SHARDS ${s.shards}/${SH.length}${s.shards === SH.length ? ' · SECRET UNLOCKED' : ''}`;
  const autoOn = s.auto && !s.cruise;
  const cols = {
    sfx: s.sfx ? '#FF2D95' : OFF,
    eng: s.eng ? '#00E5FF' : OFF,
    rain: s.rain ? '#7fb8ff' : OFF,
    cruise: s.cruise ? '#ffc53d' : '#9a9ab4',
    auto: autoOn ? '#27e08a' : '#9a9ab4',
  };
  const rail = CPS.map((c) => ({ ...c, col: s.section === c.id ? c.c : OFF }));
  const rootCls = ['city', chakra.variable, mono.variable, mobile && 'city--m', s.hold && 'city--hold'].filter(Boolean).join(' ');

  return (
    <main id="main" ref={rootRef} className={rootCls}>
      <h1 className="city-sr">Tran Ngoc Hai (Topy) - Senior Fullstack Developer</h1>
      <div ref={hostRef} className="city-host" aria-hidden="true" />

      <div data-c="fx-speed" className="city-fx city-fx-speed" aria-hidden="true" />
      <div data-c="fx-fire" className="city-fx city-fx-fire" aria-hidden="true" />
      <div className="city-fx city-vignette" aria-hidden="true" />
      <div data-c="fx-flash" className="city-fx city-fx-flash" aria-hidden="true">
        <span data-c="fx-msg" />
      </div>
      <div data-c="shard-toast" className="city-toast" role="status">
        <span className="city-toast-head">SHARD</span>
        <span className="city-toast-body" />
      </div>

      {ph === 'boot' && (
        <div className="city-boot">
          <div className="city-boot-mark">T// TOPY.OS</div>
          <div className="city-boot-line">
            INITIALIZING RENDER CORE<span className="city-caret">_</span>
          </div>
        </div>
      )}

      {ph === 'loading' && (
        <div className="city-load">
          <div className="city-load-top">
            <span className="city-brand">
              <span className="city-t">T//</span>
              <span className="city-muted">TOPY.OS - NEON CITY</span>
            </span>
            <button type="button" className="city-skip" onClick={act((h) => h.skip())}>
              SKIP ▸▸
            </button>
          </div>
          <div className="city-load-left">
            <div className="city-load-tag">[ COLD BOOT // FLYOVER ]</div>
            <div className="city-load-log" aria-live="polite">
              {INTRO_LOG.slice(0, s.logN).map(([, line, st]) => (
                <div key={line}>
                  <span className="city-green">&gt;</span> {line} <span className="city-faint">....</span>{' '}
                  <span className={st === 'OK' ? 'city-green' : 'city-cyan'}>{st}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="city-load-right">
            <div className="city-load-pctrow">
              <span data-c="ld-pct" className="city-load-pct">
                00
              </span>
              <span className="city-load-pctsign">%</span>
            </div>
            <div className="city-load-track">
              <div data-c="ld-bar" className="city-load-bar" />
            </div>
            <div data-c="ld-status" className="city-load-status">
              RENDERING NEON CITY
            </div>
          </div>
        </div>
      )}

      {ph === 'ready' && (
        <div className="city-ready">
          <div className="city-ready-card">
            <div className="city-ready-status">
              <span className="city-dot city-dot--fast" />
              SYSTEM READY // BIKE TOPY-01 FUELED
            </div>
            <h2 className="city-ready-title">
              RIDE THROUGH
              <br />
              SIX YEARS OF SHIPPING
            </h2>
            <p className="city-ready-lead">
              Tran Ngoc Hai - <span className="city-cyan">Senior Fullstack Developer</span>. Every neon gate on the avenue unlocks a file: about, work, ledger, stack, contact.
              Eight data shards hide in the city - some only by air.
            </p>
            <div className="city-ready-actions">
              {!mobile ? (
                <>
                  <button type="button" className="city-ignite" onClick={act((h) => h.ignite(false))}>
                    IGNITE &amp; RIDE ▸ <span className="city-o6">[ENTER]</span>
                  </button>
                  <button type="button" className="city-tour" onClick={act((h) => h.ignite(true))}>
                    AUTOPILOT TOUR
                  </button>
                </>
              ) : (
                <button type="button" className="city-tour-m" onClick={act((h) => h.ignite(true))}>
                  START AUTOPILOT TOUR ▸
                </button>
              )}
              <a href={OS} className="city-classic">
                CLASSIC SITE
              </a>
            </div>
            {!mobile && (
              <div className="city-ready-keys">
                {READY_KEYS.map(([k, l]) => (
                  <span key={k}>
                    <span className="city-white">{k}</span> {l}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {ph === 'ride' && (
        <div className="city-ride">
          <div className="city-top">
            <div className="city-top-left">
              {!mobile && (
                <>
                  <span className="city-brand city-brand--ride">
                    <span className="city-t">T//</span>
                    <span className="city-muted">TOPY.OS</span>
                  </span>
                  <span className="city-sep">|</span>
                  <span className="city-sector">{sectorLabel}</span>
                </>
              )}
              {showReopen && (
                <button type="button" className="city-reopen" onClick={act((h) => h.reopen())}>
                  OPEN FILE
                </button>
              )}
            </div>
            {!mobile && (
              <div className="city-toggles">
                <button type="button" className="city-tg city-tg--sfx" style={{ color: cols.sfx }} aria-pressed={s.sfx} onClick={act((h) => h.toggleSfx())}>
                  ♪ {s.sfx ? 'LOFI ON' : 'LOFI OFF'} <span className="city-key">[M]</span>
                </button>
                <button type="button" className="city-tg city-tg--eng" style={{ color: cols.eng }} aria-pressed={s.eng} title="Engine / rotor sound" onClick={act((h) => h.toggleEng())}>
                  ⚙ {s.eng ? 'ENGINE ON' : 'ENGINE OFF'} <span className="city-key">[N]</span>
                </button>
                <button type="button" className="city-tg city-tg--rain" style={{ color: cols.rain }} aria-pressed={s.rain} title="Toggle rain" onClick={act((h) => h.toggleRain())}>
                  {s.rain ? 'RAIN ON' : 'RAIN OFF'} <span className="city-key">[R]</span>
                </button>
                <button type="button" className="city-tg city-tg--cruise" style={{ color: cols.cruise }} aria-pressed={s.cruise} title="Autopilot that never stops - loops the city forever" onClick={act((h) => h.toggleCruise())}>
                  {s.cruise ? 'CRUISE ∞ ON' : 'CRUISE ∞'} <span className="city-key">[L]</span>
                </button>
                <button type="button" className="city-tg city-tg--auto" style={{ color: cols.auto }} aria-pressed={autoOn} onClick={act((h) => h.toggleAuto())}>
                  {autoOn ? 'AUTOPILOT ON' : 'AUTOPILOT'} <span className="city-key">[C]</span>
                </button>
                <button type="button" className="city-tg city-tg--mode" onClick={act((h) => h.toggleMode())}>
                  MODE: {s.mode === 'fly' ? 'FLY' : 'BIKE'} <span className="city-key">[V]</span>
                </button>
                <a href={OS} className="city-tg city-tg--link" title="The 2D TOPY.OS page">
                  2D VIEW
                </a>
              </div>
            )}
            {mobile && (
              <div className="city-mhud">
                <div className="city-mtoggles">
                  <button type="button" style={{ color: cols.sfx }} aria-pressed={s.sfx} onClick={act((h) => h.toggleSfx())}>
                    ♪ LOFI
                  </button>
                  <button type="button" style={{ color: cols.eng }} aria-pressed={s.eng} onClick={act((h) => h.toggleEng())}>
                    ⚙ ENGINE
                  </button>
                  <button type="button" style={{ color: cols.rain }} aria-pressed={s.rain} onClick={act((h) => h.toggleRain())}>
                    RAIN
                  </button>
                  <button type="button" style={{ color: cols.cruise }} aria-pressed={s.cruise} onClick={act((h) => h.toggleCruise())}>
                    CRUISE ∞
                  </button>
                  <button type="button" className="city-mtoggles-mode" onClick={act((h) => h.toggleMode())}>
                    {s.mode === 'fly' ? '▼ BIKE' : '✈ FLY'}
                  </button>
                </div>
                <div className="city-mrail">
                  {rail.map((r) => (
                    <button type="button" key={r.id} style={{ borderTopColor: r.col, color: r.col }} aria-label={`Warp to sector ${r.n} ${r.t}`} onClick={act((h) => h.warp(r.id))}>
                      <span className="city-mrail-n">{r.n}</span>
                      <span>{r.t}</span>
                    </button>
                  ))}
                </div>
                <div className="city-mshards">
                  <span>{shardsText}</span>
                  <a href={OS} className="city-m2d">
                    2D VIEW
                  </a>
                </div>
              </div>
            )}
            {s.hints && !sec && !mobile && (
              <div className="city-hints">
                <span>
                  <span className="city-white">W/↑</span> THROTTLE
                </span>
                <span>
                  <span className="city-white">S/↓</span> BRAKE
                </span>
                <span>
                  <span className="city-white">A D</span> STEER
                </span>
                <span>
                  <span className="city-white">SHIFT</span> BOOST
                </span>
                <span>
                  <span className="city-white">SCROLL</span> CRUISE
                </span>
                <span>
                  <span className="city-white">V</span> FLY · <span className="city-white">Q/E</span> ALT
                </span>
                <span>
                  <span className="city-white">C</span> AUTOPILOT
                </span>
                <span>
                  <span className="city-white">M</span> LOFI · <span className="city-white">N</span> ENGINE
                </span>
              </div>
            )}
          </div>

          {!mobile && (
            <nav className="city-rail-wrap" aria-label="Sectors">
              <div className="city-rail">
                <div data-c="rail-dot" className="city-rail-dot" />
                {rail.map((r) => (
                  <button type="button" key={r.id} title="Warp to sector" className="city-rail-item" style={{ color: r.col }} onClick={act((h) => h.warp(r.id))}>
                    <span>{r.t}</span>
                    <span className="city-rail-n">{r.n}</span>
                    <span className="city-rail-bar" style={{ background: r.col }} />
                  </button>
                ))}
              </div>
            </nav>
          )}

          {!mobile && (
            <div className="city-speedo">
              <div className="city-speedo-label">VELOCITY</div>
              <div className="city-speedo-row">
                <span data-c="hud-spd" className="city-speedo-num">
                  000
                </span>
                <span className="city-speedo-unit">KM/H</span>
              </div>
              <div className="city-speedo-track">
                <div data-c="hud-bar" className="city-speedo-bar" />
              </div>
              <div data-c="hud-alt" className="city-speedo-alt">
                ALT 001 M · Z 0150
              </div>
              <div className="city-speedo-shards">{shardsText}</div>
            </div>
          )}

          {s.mode === 'fly' && (
            <div className="city-reticle" aria-hidden="true">
              <div className="city-reticle-dot" />
              <div className="city-reticle-l" />
              <div className="city-reticle-r" />
            </div>
          )}

          {s.auto && s.hold && (
            <div className="city-hold">
              <button type="button" onClick={act((h) => h.resume())}>
                CONTINUE RIDE ▸
              </button>
            </div>
          )}
        </div>
      )}

      <section ref={panelRef} data-panel className="city-panel" hidden={!(ph === 'ride' && sec)} aria-label={cp ? `${cp.t} file` : 'Sector file'}>
        <div className="city-panel-head">
          <span className="city-pink">FILE://{cp ? cp.id.toUpperCase() + '.dossier' : ''}</span>
          <button type="button" className="city-close" onClick={act((h) => h.close())}>
            CLOSE ✕
          </button>
        </div>
        <div className="city-panel-body">
          <div className="city-sec city-sec--14" hidden={sec !== 'about'}>
            <div className="city-sec-label">[ 01 // ABOUT ]</div>
            <div className="city-about-id">
              <div className="city-about-portrait">
                <picture>
                  <source srcSet="/images/portrait/portrait-2026-720.webp" type="image/webp" />
                  <img src="/images/portrait/portrait-2026-720.jpg" alt="Portrait of Tran Ngoc Hai (Topy)" width={720} height={1290} loading="lazy" decoding="async" />
                </picture>
              </div>
              <div className="city-about-name">
                <h2>TRAN NGOC HAI</h2>
                <div className="city-about-role">
                  SENIOR FULLSTACK DEV <span className="city-faint">{'// aka'}</span> <span className="city-pink">TOPY</span>
                </div>
                <div className="city-about-loc">◇ HO CHI MINH CITY · GMT+7</div>
              </div>
            </div>
            <p className="city-copy">
              I build production web apps for <span className="city-cyan">FinTech</span>, <span className="city-cyan">HealthTech</span>, <span className="city-cyan">SaaS</span> and{' '}
              <span className="city-cyan">eCommerce</span>. React / Next.js front, Node / NestJS back, deep Stripe.
            </p>
            <p className="city-copy">
              From SEC-regulated investment platforms to AI recruitment tools - I own delivery end-to-end on teams of <span className="city-pink">5–25</span>, ship on aggressive
              timelines, and talk directly with C-suite.
            </p>
            <div className="city-stats">
              <div>
                <div className="city-stat-n">
                  6<span className="city-pink">+</span>
                </div>
                <div className="city-stat-l">YEARS</div>
              </div>
              <div>
                <div className="city-stat-n">7</div>
                <div className="city-stat-l">COMPANIES</div>
              </div>
              <div>
                <div className="city-stat-n">4</div>
                <div className="city-stat-l">BUILDS</div>
              </div>
              <div>
                <div className="city-stat-n">
                  600<span className="city-cyan">+</span>
                </div>
                <div className="city-stat-l">TESTS</div>
              </div>
            </div>
            <div className="city-avail">
              <span className="city-dot" />
              AVAILABLE FOR CONTRACT &amp; FULL-TIME
            </div>
          </div>

          <div className="city-sec city-sec--16" hidden={sec !== 'work'}>
            <div className="city-sec-label">[ 02 // SELECTED WORK ]</div>
            {WORK.map((w) => (
              <article key={w.slug} className="city-work">
                <picture>
                  <source srcSet={`/images/work/${w.slug}-desktop.webp`} type="image/webp" />
                  <img src={`/images/work/${w.slug}-desktop.jpg`} alt={`${w.title} screenshot`} width={700} height={525} loading="lazy" decoding="async" />
                </picture>
                <div className="city-work-body">
                  <div className="city-work-meta">
                    <span className={w.pink ? 'city-pink' : 'city-cyan'}>{w.cat}</span>
                    <span className="city-green">{w.status}</span>
                  </div>
                  <h3>{w.title}</h3>
                  <div className="city-work-role">{w.role}</div>
                  <div className="city-work-bullets">
                    {w.bullets.map((b, i) => (
                      <Fragment key={b}>
                        {i > 0 && <br />}▸ {b}
                      </Fragment>
                    ))}
                  </div>
                  <div className="city-work-tags">{w.tags}</div>
                </div>
              </article>
            ))}
          </div>

          <div className="city-sec city-sec--14" hidden={sec !== 'ledger'}>
            <div className="city-sec-label">[ 03 // LEDGER ]</div>
            <div className="city-ledger">
              {LEDGER.map((l) => (
                <div key={l.when + l.org} className="city-ledger-item">
                  <span className={`city-ledger-dot${l.pink ? '' : ' city-ledger-dot--c'}`} />
                  <div className="city-ledger-when">{l.when}</div>
                  <div className="city-ledger-role">{l.role}</div>
                  <div className="city-ledger-org">{l.org}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="city-sec city-sec--16" hidden={sec !== 'stack'}>
            <div className="city-sec-label">[ 04 // STACK ]</div>
            {STACK.map(([group, items], i) => (
              <div key={group}>
                <div className={`city-stack-h ${i % 2 ? 'city-cyan' : 'city-pink'}`}>▌{group}</div>
                <div className="city-chips">
                  {items.map((it) => (
                    <span key={it}>{it}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="city-sec city-sec--14" hidden={sec !== 'contact'}>
            <div className="city-sec-label">[ 05 // CONTACT ]</div>
            <div className="city-badges">
              <span className="city-badge-on">
                <span className="city-dot" />
                AVAILABLE NOW
              </span>
              <span className="city-badge">REPLIES ~24H</span>
            </div>
            <h2 className="city-contact-title">
              END OF THE ROAD.
              <br />
              LET&apos;S BUILD.
            </h2>
            <p className="city-copy">Shipping something in FinTech, HealthTech or SaaS and need someone who owns delivery? Drop a line - I read every message.</p>
            <button type="button" className="city-copy-email" onClick={copyEmail}>
              <div className="city-copy-email-l">EMAIL - CLICK TO COPY</div>
              <div className="city-copy-email-v">{copied ? 'COPIED ✓' : EMAIL}</div>
            </button>
            <div className="city-links">
              <a href="https://linkedin.com/in/topytran" target="_blank" rel="noopener noreferrer">
                LINKEDIN ↗
              </a>
              <a href="https://github.com/tranngochai171" target="_blank" rel="noopener noreferrer">
                GITHUB ↗
              </a>
              <a href={RESUME} target="_blank" rel="noopener" className="city-links-resume">
                RESUME ↓
              </a>
            </div>
            <a href={`mailto:${EMAIL}?subject=Project%20inquiry%20via%20topy.os`} className="city-transmit">
              TRANSMIT MESSAGE ↗
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
