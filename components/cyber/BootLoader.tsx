'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { scramble } from './scramble';

export interface BootHandle {
  replay: () => void;
}

const LOG_LINES = [
  'mounting kernel modules ........ OK',
  'loading portfolio.dat .......... OK',
  'decrypting work_history[7] ..... OK',
  'verifying stripe // plaid certs  OK',
  'uplink -> Ho Chi Minh City ..... OK',
  'compositing neon shaders ....... OK',
  'render pipeline ................ OK',
];
const DURATION = 1850;

// Once per full page load: a real reload replays, in-session re-mounts don't double-fire.
let bootedThisLoad = false;

const hex = () => {
  let s = '';
  for (let k = 0; k < 6; k++) s += Math.floor(Math.random() * 65536).toString(16).padStart(4, '0').toUpperCase() + ' ';
  return s.trim();
};

type LogEntry = { kind: 'ok'; head: string } | { kind: 'hex'; text: string };

export const BootLoader = forwardRef<BootHandle>(function BootLoader(_props, ref) {
  const [visible, setVisible] = useState(false);
  const [pct, setPct] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [online, setOnline] = useState(false);
  const [tag, setTag] = useState('// COLD BOOT');
  const [off, setOff] = useState(false);
  const [glitch, setGlitch] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const raf = useRef(0);
  const cancelScramble = useRef<() => void>();

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (raf.current) cancelAnimationFrame(raf.current);
    cancelScramble.current?.();
  };
  const after = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  const finish = () => {
    clearAll();
    document.body.style.overflow = '';
    bootedThisLoad = true;
    setVisible(false);
  };

  const run = () => {
    clearAll();
    document.body.style.overflow = 'hidden';
    setOff(false);
    setGlitch(false);
    setOnline(false);
    setPct(0);
    setTag('// COLD BOOT');
    setLog([]);
    if (statusRef.current) statusRef.current.textContent = '> DECRYPTING IDENTITY...';

    // streaming boot log
    let li = 0;
    const streamStep = () => {
      setLog((prev) => {
        const next: LogEntry[] = li < LOG_LINES.length
          ? [...prev, { kind: 'ok', head: LOG_LINES[li] }]
          : [...prev, { kind: 'hex', text: hex() }];
        return next.slice(-24);
      });
      li++;
      after(streamStep, 85 + Math.random() * 75);
    };
    streamStep();

    after(() => {
      const el = statusRef.current;
      if (el) {
        el.setAttribute('data-text', '> IDENTITY CONFIRMED: TRAN NGOC HAI');
        cancelScramble.current = scramble(el);
      }
    }, 650);

    // progress meter
    const start = performance.now();
    let exited = false;
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / DURATION);
      setPct(p < 1 && Math.random() < 0.22 ? Math.floor(Math.random() * 100) : Math.floor(p * 100));
      if (p < 1) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      if (exited) return;
      exited = true;
      setPct(100);
      setTag('// ONLINE');
      setOnline(true);
      after(() => setGlitch(true), 340);
      after(() => setOff(true), 720);
      after(finish, 1260);
    };
    raf.current = requestAnimationFrame(tick);

    // hard safety: never trap the page
    after(finish, 7000);
  };

  const skip = () => {
    setOff(false);
    setGlitch(false);
    finish();
  };

  useImperativeHandle(ref, () => ({
    replay: () => {
      try { window.scrollTo(0, 0); } catch {}
      setVisible(true);
      requestAnimationFrame(run); // let the overlay paint before re-running
    },
  }));

  useEffect(() => {
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch {}
    if (reduce || bootedThisLoad) {
      bootedThisLoad = true;
      return;
    }
    setVisible(true);
    run();
    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className={`os-boot${off ? ' off' : ''}`} aria-hidden="true">
      <div className="os-boot-scanlines" />
      <div className="os-boot-floor"><div className="os-boot-grid" /></div>
      <div className={`os-boot-inner${glitch ? ' glitch' : ''}`}>
        <div className="os-boot-head">
          <span className="v">TOPY.OS v2.6</span>
          <span>{tag}</span>
        </div>
        <h2 className="os-boot-title">
          <span className="glitch pink" aria-hidden="true">TOPY.OS</span>
          <span className="glitch cyan" aria-hidden="true">TOPY.OS</span>
          <span className="base">TOPY.OS</span>
        </h2>
        <div className="os-boot-status" ref={statusRef}>&gt; DECRYPTING IDENTITY...</div>
        <div className="os-boot-log">
          {log.map((e, i) =>
            e.kind === 'ok' ? (
              <div key={i}>
                <span className="g">&gt;</span> {e.head.replace(/ OK$/, '')}
                {e.head.endsWith('OK') && <span className="g"> OK</span>}
              </div>
            ) : (
              <div key={i}><span className="h">{e.text}</span></div>
            )
          )}
        </div>
        <div className="os-boot-meter">
          <div className="os-boot-pct">{String(pct).padStart(3, '0')}<span className="u">%</span></div>
          <div className="os-boot-bar-wrap"><div className="os-boot-bar" style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="os-boot-foot">
          <div className={`os-boot-online${online ? ' on' : ''}`}>SYSTEM ONLINE<span className="cur" /></div>
          <button className="os-boot-skip" onClick={skip}>SKIP ⏎</button>
        </div>
      </div>
    </div>
  );
});
