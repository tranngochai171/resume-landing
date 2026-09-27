export type SiteVariant = 'city' | 'elegant' | 'cyber';

/**
 * Which homepage `/` serves. Defaults to the Neon City 3D experience (city),
 * which itself falls back to TOPY.OS 2D when WebGL is unusable.
 * Set NEXT_PUBLIC_SITE_VARIANT=elegant or =cyber to serve those instead.
 * The other versions stay directly reachable at /elegant and /os regardless.
 */
export function getSiteVariant(): SiteVariant {
  const v = process.env.NEXT_PUBLIC_SITE_VARIANT;
  return v === 'elegant' || v === 'cyber' ? v : 'city';
}
