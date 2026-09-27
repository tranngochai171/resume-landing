import type { Metadata } from 'next';
import { getSiteVariant } from '@/lib/siteVariant';
import { HomeVariant } from '@/components/home/HomeVariant';

// Metadata describes the default variant: the TOPY.OS Neon City (3D, with TOPY.OS 2D as its fallback).
// If NEXT_PUBLIC_SITE_VARIANT selects another home for `/`, adjust the copy here to match.
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

// `/` serves whichever variant the NEXT_PUBLIC_SITE_VARIANT flag selects (city by default).
// The 2D versions are always reachable directly at /elegant and /os.
export default function HomePage() {
  return <HomeVariant variant={getSiteVariant()} />;
}
