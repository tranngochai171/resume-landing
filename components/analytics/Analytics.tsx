import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Their scripts are served by Vercel at /_vercel/*: render them only in Vercel builds (next.config
// sets the flag from VERCEL=1), so local and other static hosts get no 404s in the console.
export function Analytics() {
  if (process.env.NEXT_PUBLIC_VERCEL_ANALYTICS !== '1') return null;
  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
    </>
  );
}
