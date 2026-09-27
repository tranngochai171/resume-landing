// Public entry of the Neon City engine. CityHome loads this with import() so three.js stays out of the initial bundle.
import { Engine, type CityCallbacks } from './engine';
import type { Fonts } from './textures';

export type { CityCallbacks, Fonts };

export type CityHandle = Pick<
  Engine,
  'dispose' | 'skip' | 'ignite' | 'toggleMode' | 'toggleAuto' | 'toggleCruise' | 'toggleEng' | 'toggleRain' | 'toggleSfx' | 'warp' | 'close' | 'reopen' | 'resume'
>;

/**
 * Mounts the city canvas into `host`. `root` is the React shell whose `data-c` elements
 * (loader, HUD readouts, overlays) the engine updates directly every frame.
 */
export function createCity(host: HTMLElement, root: HTMLElement, fonts: Fonts, cb: CityCallbacks): CityHandle {
  const e = new Engine(host, root, fonts, cb);
  e.start();
  return e;
}
