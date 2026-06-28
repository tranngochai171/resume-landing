import type { Metadata } from 'next';
import { CyberHome } from '@/components/cyber/CyberHome';

export const metadata: Metadata = {
  title: 'TOPY.OS — Tran Ngoc Hai // Cyberpunk Portfolio',
  description:
    'Neon-noir cyberpunk portfolio of Tran Ngoc Hai (Topy) — Senior Fullstack Developer shipping production apps in FinTech, HealthTech, SaaS, and eCommerce.',
  // /os is the same content as the default `/` — canonical points there to avoid duplicate-content.
  alternates: { canonical: '/' },
  openGraph: {
    title: 'TOPY.OS — Tran Ngoc Hai // Cyberpunk Portfolio',
    description: 'Neon-noir cyberpunk portfolio — Senior Fullstack Developer · FinTech · HealthTech · SaaS · eCommerce.',
    url: 'https://topy-tran.vercel.app',
    type: 'website',
    images: ['/og-image.jpg'],
  },
};

export default function OsPage() {
  return <CyberHome />;
}
