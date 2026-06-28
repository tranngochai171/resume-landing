import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { getYearsOfExperience } from '@/lib/experience';
import { Analytics } from '@/components/analytics/Analytics';
import './globals.css';

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Tran Ngoc Hai',
  alternateName: 'Topy Tran',
  jobTitle: 'Senior Fullstack Developer',
  url: 'https://topy-tran.vercel.app',
  image: 'https://topy-tran.vercel.app/images/portrait/portrait-2026-720.jpg',
  email: 'tranngochai171@gmail.com',
  sameAs: [
    'https://github.com/tranngochai171',
    'https://linkedin.com/in/topytran',
  ],
  knowsAbout: ['FinTech', 'HealthTech', 'SaaS', 'eCommerce', 'React', 'Next.js', 'Node.js'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Ho Chi Minh City',
    addressCountry: 'VN',
  },
};

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500'],
  display: 'optional',
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
  authors: [{ name: 'Tran Ngoc Hai', url: 'https://topy-tran.vercel.app' }],
  keywords: ['Tran Ngoc Hai', 'Topy Tran', 'Senior Fullstack Developer', 'React', 'Next.js', 'Node.js', 'Flutter', 'Ruby on Rails', 'FinTech', 'HealthTech', 'Ho Chi Minh City'],
  openGraph: {
    title: 'Tran Ngoc Hai — Senior Fullstack Developer',
    description:
      `Senior Fullstack Developer · ${getYearsOfExperience()}+ years · FinTech · HealthTech · SaaS`,
    url: 'https://topy-tran.vercel.app',
    type: 'website',
    images: ['/og-image.jpg'],
  },
  twitter: { card: 'summary_large_image', images: ['/og-image.jpg'] },
};

export const viewport: Viewport = {
  themeColor: '#05050c',
  width: 'device-width',
  initialScale: 1,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
      </head>
      <body className="bg-bg text-fg font-body antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:font-bold focus:uppercase focus:tracking-widest focus:text-bg focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
