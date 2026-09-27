import type { Metadata } from 'next';
import { CityHome } from '@/components/city/CityHome';

// `/` is the TOPY.OS Neon City (3D, falling back to TOPY.OS 2D in place when WebGL is unusable).
const TITLE = 'TOPY.OS Neon City | Tran Ngoc Hai · Senior Fullstack Developer';
const DESCRIPTION =
  'A 3D neon-city portfolio: ride through the work of Tran Ngoc Hai (Topy), Senior Fullstack Developer in FinTech, HealthTech, SaaS, eCommerce and sports-tech.';
const SOCIAL = 'Ride a 3D neon Sài Gòn through 6+ years of shipping · FinTech · HealthTech · SaaS · eCommerce · sports-tech.';
const IMAGE = { url: '/og-city.jpg', width: 1200, height: 630, alt: 'Riding a neon hover-bike toward the TOPY TRAN billboard down a 3D Sài Gòn avenue' };

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: TITLE,
    description: SOCIAL,
    url: 'https://topy-tran.vercel.app',
    type: 'website',
    images: [IMAGE],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: SOCIAL, images: [IMAGE] },
};

// The 2D versions live at /os and /elegant.
export default function HomePage() {
  return <CityHome />;
}
