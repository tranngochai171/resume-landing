export type SiteVariant = 'elegant' | 'cyber';

/**
 * Which homepage `/` serves. Defaults to TOPY.OS (cyber); set
 * NEXT_PUBLIC_SITE_VARIANT=elegant to fall back to the elegant site.
 * Both versions stay directly reachable at /elegant and /os regardless.
 */
export function getSiteVariant(): SiteVariant {
  return process.env.NEXT_PUBLIC_SITE_VARIANT === 'elegant' ? 'elegant' : 'cyber';
}
