import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { getYearsOfExperience } from '@/lib/experience';
import { Analytics } from '@/components/analytics/Analytics';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

const condensed = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-condensed',
  weight: ['500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://topy-tran.vercel.app'),
  title: 'Tran Ngoc Hai — Senior Fullstack Developer',
  description:
    'Senior Fullstack Developer shipping production apps in FinTech, HealthTech, SaaS, and eCommerce — from SEC-regulated investment platforms to AI-powered recruitment tools.',
  openGraph: {
    title: 'Tran Ngoc Hai — Senior Fullstack Developer',
    description:
      `Senior Fullstack Developer · ${getYearsOfExperience()}+ years · FinTech · HealthTech · SaaS`,
    images: ['/og-image.jpg'],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${condensed.variable}`}
    >
      <head>
        <link
          rel="preload"
          as="image"
          href="/images/01-closed.webp"
          type="image/webp"
          fetchPriority="high"
        />
      </head>
      <body className="bg-bg text-fg font-body antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
