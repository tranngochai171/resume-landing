'use client';

import dynamic from 'next/dynamic';
import type { SiteVariant } from '@/lib/siteVariant';
import { CityHome } from '@/components/city/CityHome';

// Dynamic imports from a client component split per variant, so `/` does not ship the JS of the
// variants it does not render (they stay server-rendered when selected). Imported from the server
// page they would all ship. The city shell is the default and small, so it stays in the main chunk.
const ElegantHome = dynamic(() => import('./ElegantHome').then((m) => m.ElegantHome));
const CyberHome = dynamic(() => import('@/components/cyber/CyberHome').then((m) => m.CyberHome));

export function HomeVariant({ variant }: { variant: SiteVariant }) {
  if (variant === 'elegant') return <ElegantHome />;
  if (variant === 'cyber') return <CyberHome />;
  return <CityHome />;
}
