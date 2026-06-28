'use client';

import { useEffect, useRef } from 'react';

const RESUME = '/resume/Topy_Tran_Resume_2026_AI_Workflows.pdf';
const P = '#FF2D95', CY = '#00E5FF', G = '#27e08a', M = '#7c7c98', W = '#fff';
const c = (t: string, col: string) => `<span style="color:${col}">${t}</span>`;
const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface ExecResult { out?: string; clear?: boolean; resume?: boolean; openId?: string }

function terminalData() {
  const stack = [
    c('FRONTEND ', P) + 'React 18 · Next.js · TypeScript · Tailwind · Shadcn · Radix · MUI',
    c('MOBILE   ', CY) + 'Flutter · Dart',
    c('BACKEND  ', P) + 'NestJS · Node · Ruby on Rails · tRPC · GraphQL · REST · PostgreSQL',
    c('PAYMENTS ', CY) + 'Stripe · Plaid · Persona KYC/AML · BoldSign',
    c('CLOUD    ', P) + 'AWS · Supabase · Vercel · Azure DevOps · Docker',
    c('TESTING  ', CY) + 'Vitest · Playwright · RTL',
  ].join('\n');
  const ledger = [
    c('2024-now ', CY) + 'Software Developer · Insomnia Club',
    c('2024-26  ', CY) + 'Frontend Developer · Adroit Technology Solutions',
    c('2024-25  ', CY) + 'Frontend Developer · Zeligate',
    c('2022-24  ', CY) + 'Fullstack Developer · Spritely Apps',
    c('2021-22  ', CY) + 'Software Developer · RocketCart',
    c('2021     ', CY) + 'Frontend Developer · Kodebaze',
    c('2020-21  ', CY) + 'Frontend Web Developer · CyberLogitec',
  ].join('\n');
  const contact = c('email    ', M) + c('tranngochai171@gmail.com', CY) + '\n' + c('location ', M) + 'Ho Chi Minh City, VN (GMT+7)\n' + c('status   ', M) + c('available for contract & full-time', G);
  const files = [
    { name: 'about.md', color: CY, body: c('# TOPY // Tran Ngoc Hai', W) + '\nSenior fullstack developer, 6+ yrs. FinTech · HealthTech · SaaS · eCommerce · sports-tech.\nWeb and mobile: React/Next and Flutter up front, Node/NestJS and Rails on the back, deep Stripe.\nOwns delivery end-to-end on teams of 5-25. Based in Ho Chi Minh City (GMT+7).' },
    { name: 'dalmore.dossier', color: P, body: c('DALMORE GROUP', W) + c('  · FinTech · SEC-regulated', M) + '\nFrontend Developer @ Adroit Technology Solutions (2024-Feb 2026)\n• 3 portals - investor / issuer / compliance - under Reg A+, CF, D\n• Persona KYC/AML + sanctions, role-based access, audit trails\n• Multi-rail payments: Stripe · Plaid · ACH · wire' },
    { name: 'pinnedgolf.dossier', color: CY, body: c('PINNED GOLF', W) + c('  · GolfTech · social + GPS', M) + '\nSoftware Developer @ Insomnia Club (2026-present)\n• Social layer front-to-back: Flutter app + Ruby on Rails API\n• Instagram-style follows, add-friends-to-round, befriend co-players\n• Course ratings with corrected aggregate averages\n• Live on Google Play' },
    { name: 'nestwell.dossier', color: CY, body: c('NESTWELL', W) + c('  · HealthTech · 0->1', M) + '\nSoftware Developer @ Insomnia Club (2024-present)\n• Built from scratch: Next.js 14 · tRPC · Supabase\n• Quiz engine, environmental scoring, PDF reports, SimpleLab marketplace\n• 600+ Vitest tests · Playwright E2E · RLS over 16 tables / 20+ migrations' },
    { name: 'zeligate.dossier', color: P, body: c('ZELIGATE', W) + c('  · AI · HR-Tech', M) + '\nFrontend Developer · Freelance (2024-2025)\n• AI candidate shortlisting + ranking, 60s highlight reels\n• ATS connectivity to 50+ platforms (Greenhouse, Workday, BambooHR)\n• Timezone-aware scheduling' },
    { name: 'trailer2you.dossier', color: CY, body: c('TRAILER2YOU', W) + c('  · eCommerce · marketplace', M) + '\nFullstack Developer @ Spritely Apps (2022-2024)\n• 70% hands-on lead, bi-weekly releases for 2+ yrs\n• Stripe bookings, deposits, damage-protection add-ons\n• Mentored juniors, cut PR turnaround' },
    { name: 'stack.cfg', color: G, body: stack },
    { name: 'ledger.log', color: G, body: ledger },
    { name: 'contact.vcf', color: G, body: contact },
  ];
  const help = [
    c('COMMANDS', M),
    c('  help', CY) + '            this list',
    c('  ls', CY) + '              list files',
    c('  cat', CY) + ' <file>      read a file',
    c('  whoami', CY) + '          the short version',
    c('  open', CY) + ' <section>  jump there (about/work/ledger/stack/contact)',
    c('  stack', CY) + '           tech stack',
    c('  ledger', CY) + '          work history',
    c('  resume', CY) + '          download the CV',
    c('  hire', CY) + ' / ' + c('contact', CY) + '   start a conversation',
    c('  social', CY) + '          links',
    c('  clear', CY) + '           clear screen',
    c('tip: try ', M) + c('cat nestwell.dossier', P),
  ].join('\n');
  const whoami = c('topy', G) + ' - senior fullstack developer\n6+ years shipping production web & mobile apps. FinTech, HealthTech, SaaS, eCommerce, sports-tech.\nCurrently open to contract & full-time. Type ' + c('hire', P) + ' to start.';
  const social = c('LinkedIn ', M) + 'linkedin.com/in/topytran\n' + c('GitHub   ', M) + 'github.com/tranngochai171\n' + c('Resume   ', M) + 'type ' + c('resume', P) + ' to download';
  const hire = c('// LET’S BUILD', P) + '\nTell me what you’re shipping and your timeline.\nI’ll reply within ~24h. Opening the transmission console…';
  return { files, help, whoami, stack, ledger, social, contact, hire };
}

function terminalExec(name: string, args: string[], d: ReturnType<typeof terminalData>): ExecResult {
  const span = (t: string, col: string) => `<span style="color:${col}">${t}</span>`;
  switch (name) {
    case '': return {};
    case 'help': case '?': return { out: d.help };
    case 'ls': case 'dir': return { out: d.files.map((f) => span(f.name, f.color)).join('   ') };
    case 'cat': case 'less': case 'more': {
      if (!args[0]) return { out: span('usage: cat <file> - try: ', M) + d.files.map((f) => f.name).join(', ') };
      const key = args[0].toLowerCase();
      let f = d.files.find((x) => x.name === key);
      if (!f) f = d.files.find((x) => x.name.split('.')[0] === key.split('.')[0]);
      if (!f) return { out: span('cat: ' + esc(args[0]) + ': no such file', '#ff6b6b') };
      return { out: f.body };
    }
    case 'whoami': return { out: d.whoami };
    case 'stack': return { out: d.stack };
    case 'ledger': return { out: d.ledger };
    case 'social': case 'links': return { out: d.social };
    case 'contact': return { out: d.contact, openId: 'contact' };
    case 'hire': return { out: d.hire, openId: 'contact' };
    case 'resume': case 'cv': return { out: span('downloading resume.pdf …', G), resume: true };
    case 'open': case 'cd': case 'goto': {
      const t = (args[0] || '').toLowerCase().replace(/[/]/g, '');
      const map: Record<string, string> = { about: 'about', work: 'work', projects: 'work', ledger: 'ledger', stack: 'stack', terminal: 'terminal', contact: 'contact', top: 'top', home: 'top' };
      const id = map[t];
      if (!id) return { out: span('open: unknown section. try about/work/ledger/stack/contact', '#ff6b6b') };
      return { out: span('navigating to /' + id + ' …', G), openId: id };
    }
    case 'clear': return { clear: true };
    case 'sudo': return { out: span('permission granted - you already have my attention. type ', M) + span('hire', P) + span('.', M) };
    case 'date': {
      let s = '';
      try { s = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()); } catch { s = new Date().toString(); }
      return { out: s + span('  (HCMC)', M) };
    }
    case 'echo': return { out: esc(args.join(' ')) };
    case 'rm': case 'del': return { out: span('rm: nice try.', '#ff6b6b') };
    case 'exit': case 'quit': return { out: span('there’s no escape. type ', M) + span('hire', P) + span('.', M) };
    default: return { out: span('command not found: ' + esc(name) + ' - type ', M) + span('help', CY) };
  }
}

export function CyberTerminal({ sfx }: { sfx: (t: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const input = inputRef.current, output = outputRef.current, body = bodyRef.current;
    if (!input || !output || !body) return;
    output.innerHTML = ''; // idempotent: clear stale output so a re-run (StrictMode double-mount in dev) doesn't duplicate the welcome line
    const data = terminalData();

    const print = (html: string) => {
      const d = document.createElement('div');
      d.className = 'os-term-line';
      d.innerHTML = html;
      output.appendChild(d);
      body.scrollTop = body.scrollHeight;
    };
    const printPrompt = (cmd: string) => print('<span class="g">topy@os</span><span class="pc">:</span><span class="cy">~</span><span class="pc">$</span> ' + esc(cmd));

    print('<span style="color:#9a9ab4">TOPY.OS shell ready. Type </span><span style="color:#FF2D95">help</span><span style="color:#9a9ab4"> to begin.</span>');

    const history: string[] = [];
    let hi = -1;
    const run = (raw: string) => {
      const cmd = (raw || '').trim();
      printPrompt(cmd);
      if (cmd) history.push(cmd);
      hi = history.length;
      const parts = cmd.split(/\s+/);
      const name = (parts.shift() || '').toLowerCase();
      let res: ExecResult = {};
      try { res = terminalExec(name, parts, data) || {}; } catch { res = { out: '<span style="color:#ff6b6b">error</span>' }; }
      if (res.clear) { output.innerHTML = ''; return; }
      if (res.out != null && res.out !== '') print(res.out);
      if (res.resume) { try { window.open(RESUME, '_blank'); } catch {} }
      if (res.openId) {
        const sec = document.getElementById(res.openId);
        if (sec) {
          const y = sec.getBoundingClientRect().top + window.scrollY - 60;
          try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch { window.scrollTo(0, y); }
        }
      }
    };

    const onKey = (e: KeyboardEvent) => {
      sfx('key');
      if (e.key === 'Enter') { run(input.value); input.value = ''; }
      else if (e.key === 'ArrowUp') { if (history.length) { hi = Math.max(0, hi - 1); input.value = history[hi] || ''; e.preventDefault(); } }
      else if (e.key === 'ArrowDown') { if (history.length) { hi = Math.min(history.length, hi + 1); input.value = history[hi] || ''; e.preventDefault(); } }
    };
    const focus = (e: MouseEvent) => { if ((e.target as HTMLElement)?.tagName === 'A') return; try { input.focus(); } catch {} };
    input.addEventListener('keydown', onKey);
    body.addEventListener('click', focus);
    return () => { input.removeEventListener('keydown', onKey); body.removeEventListener('click', focus); };
  }, [sfx]);

  return (
    <div className="os-term" data-reveal>
      <div className="os-term-head">
        <span className="os-traffic" style={{ background: 'var(--pink)' }} />
        <span className="os-traffic" style={{ background: 'var(--amber)' }} />
        <span className="os-traffic" style={{ background: 'var(--green)' }} />
        <span className="label">topy@os — /bin/sh</span>
      </div>
      <div className="os-term-body" ref={bodyRef}>
        <div ref={outputRef} role="log" aria-live="polite" aria-label="Terminal output" />
        <div className="os-term-promptline">
          <span className="g">topy@os</span><span className="pc">:</span><span className="cy">~</span><span className="pc">$</span>
          <input ref={inputRef} className="os-term-input" autoComplete="off" autoCapitalize="off" spellCheck={false} aria-label="terminal input" />
        </div>
      </div>
    </div>
  );
}
