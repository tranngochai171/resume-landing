import type { Metadata } from 'next';
import { getSiteVariant } from '@/lib/siteVariant';
import { ElegantHome } from '@/components/home/ElegantHome';
import { CyberHome } from '@/components/cyber/CyberHome';

// Metadata reflects the default variant (cyber). If NEXT_PUBLIC_SITE_VARIANT=elegant,
// adjust the title/description here to match.
export const metadata: Metadata = {
  title: 'TOPY.OS — Tran Ngoc Hai · Senior Fullstack Developer',
  description:
    'TOPY.OS — cyberpunk portfolio of Tran Ngoc Hai (Topy), Senior Fullstack Developer shipping production web & mobile apps across FinTech, HealthTech, SaaS, eCommerce and sports-tech. Based in Ho Chi Minh City.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'TOPY.OS — Tran Ngoc Hai · Senior Fullstack Developer',
    description: 'Senior Fullstack Developer · 6+ years · web & mobile · FinTech · HealthTech · SaaS.',
    url: 'https://topy-tran.vercel.app',
    type: 'website',
    images: ['/og-image.jpg'],
  },
};

// `/` serves whichever variant the NEXT_PUBLIC_SITE_VARIANT flag selects.
// Both are always reachable directly at /elegant and /os.
export default function HomePage() {
  return getSiteVariant() === 'cyber' ? <CyberHome /> : <ElegantHome />;
}
