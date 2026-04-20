// hooks/useSectionView.ts
'use client';

import { useEffect, type RefObject } from 'react';
import { track } from '@/lib/analytics/track';
import type { SectionId } from '@/lib/analytics/events';

const fired = new Set<SectionId>();

export function useSectionView(
  id: SectionId,
  ref: RefObject<Element | null>
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    if (fired.has(id)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.has(id)) {
            fired.add(id);
            track('section_view', { section: id });
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [id, ref]);
}
