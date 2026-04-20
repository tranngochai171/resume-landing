// lib/analytics/track.ts
import { track as vercelTrack } from '@vercel/analytics';
import type { EventName, PropsFor } from './events';

export function track<N extends EventName>(
  name: N,
  ...args: PropsFor<N> extends undefined ? [] : [props: PropsFor<N>]
): void {
  const props = args[0];
  if (props === undefined) {
    vercelTrack(name);
  } else {
    vercelTrack(name, props as Record<string, string>);
  }
}
