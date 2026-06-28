import type { Metadata } from 'next';
import { ElegantHome } from '@/components/home/ElegantHome';

export const metadata: Metadata = {
  title: 'Tran Ngoc Hai — Senior Fullstack Developer · Portfolio',
  description:
    'Portfolio of Tran Ngoc Hai (Topy) — Senior Fullstack Developer. 6+ years shipping FinTech, HealthTech, SaaS and eCommerce: Dalmore, Nestwell, Zeligate, Trailer2you.',
  alternates: { canonical: '/elegant' },
  openGraph: {
    title: 'Tran Ngoc Hai — Senior Fullstack Developer',
    description: 'Senior Fullstack Developer · FinTech · HealthTech · SaaS · eCommerce · Ho Chi Minh City.',
    url: 'https://topy-tran.vercel.app/elegant',
    type: 'website',
    images: ['/og-image.jpg'],
  },
};

export default function ElegantPage() {
  return <ElegantHome />;
}
