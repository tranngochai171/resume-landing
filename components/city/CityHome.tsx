'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Chakra_Petch, JetBrains_Mono } from 'next/font/google';
import { pickView, probeWebGL } from './support';
import './city.css';

const chakra = Chakra_Petch({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-city', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-city-mono', display: 'swap' });

// The 2D TOPY.OS page, loaded only when the city cannot run (no WebGL2, software GPU, reduced motion, errors).
const CyberHome = dynamic(() => import('@/components/cyber/CyberHome').then((m) => m.CyberHome), { ssr: false });

export function CityHome() {
  const [view, setView] = useState<'city' | '2d'>('city');

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (pickView(window.location.search, reduce, probeWebGL) === '2d') {
      setView('2d');
      return;
    }
    let dead = false;
    let handle: { dispose(): void } | null = null;
    import('./engine')
      .then((m) => {
        if (!dead) handle = m.createCity();
      })
      .catch((err) => {
        console.warn('[city] falling back to 2D:', err);
        if (!dead) setView('2d');
      });
    return () => {
      dead = true;
      handle?.dispose();
    };
  }, []);

  if (view === '2d') return <CyberHome />;

  return (
    <main id="main" className={`city ${chakra.variable} ${mono.variable}`}>
      <h1 className="city-sr">Tran Ngoc Hai (Topy) - Senior Fullstack Developer</h1>
      <div className="city-boot">
        <div className="city-boot-mark">T// TOPY.OS</div>
        <div className="city-boot-line">
          INITIALIZING RENDER CORE<span className="city-caret">_</span>
        </div>
      </div>
    </main>
  );
}
