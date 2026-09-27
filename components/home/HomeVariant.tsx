'use client';

import dynamic from 'next/dynamic';
import type { SiteVariant } from '@/lib/siteVariant';

// Dynamic imports from a client component split per variant, so `/` ships only the JS, CSS and
// fonts of the variant it renders (still server-rendered). Imported from the server page they
// would all ship.
const CityHome = dynamic(() => import('@/components/city/CityHome').then((m) => m.CityHome));
const ElegantHome = dynamic(() => import('./ElegantHome').then((m) => m.ElegantHome));
const CyberHome = dynamic(() => import('@/components/cyber/CyberHome').then((m) => m.CyberHome));

export function HomeVariant({ variant }: { variant: SiteVariant }) {
  if (variant === 'elegant') return <ElegantHome />;
  if (variant === 'cyber') return <CyberHome />;
  return <CityHome />;
}
