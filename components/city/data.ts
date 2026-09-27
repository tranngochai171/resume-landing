// Shared, three-free data for the Neon City: used by the React shell and the engine.

export type SectorId = 'about' | 'work' | 'ledger' | 'stack' | 'contact';

export type Sector = { id: SectorId; n: string; t: string; z: number; c: string; sub: string; loc: string };

/** The five gates along the avenue. `z` is where each gate stands. */
export const CPS: Sector[] = [
  { id: 'about', n: '01', t: 'ABOUT', z: -250, c: '#FF2D95', sub: 'SUBJECT PROFILE', loc: 'NGỌ MÔN · HUẾ' },
  { id: 'work', n: '02', t: 'WORK', z: -750, c: '#00E5FF', sub: 'FOUR SHIPPED BUILDS', loc: 'CHÙA CẦU · HỘI AN' },
  { id: 'ledger', n: '03', t: 'LEDGER', z: -1250, c: '#FF2D95', sub: 'SEVEN ROLES · SIX YEARS', loc: 'KHUÊ VĂN CÁC · HÀ NỘI' },
  { id: 'stack', n: '04', t: 'STACK', z: -1750, c: '#00E5FF', sub: 'TOOLS OF THE TRADE', loc: 'CẦU RỒNG · ĐÀ NẴNG' },
  { id: 'contact', n: '05', t: 'CONTACT', z: -2250, c: '#FF2D95', sub: 'OPEN A CHANNEL', loc: 'CHỢ BẾN THÀNH · SÀI GÒN' },
];

export type ShardKind = 'FILE' | 'TIP' | 'KEY';

/** Eight collectible data shards: position, kind, message. */
export const SH: { p: [number, number, number]; k: ShardKind; t: string }[] = [
  { p: [2.75, 1.7, -130], k: 'FILE', t: 'BASED IN HỒ CHÍ MINH CITY · UTC+7' },
  { p: [-2.75, 1.7, -470], k: 'TIP', t: 'PRESS V TO FLY - SOME SHARDS ONLY EXIST ABOVE THE ROOFTOPS' },
  { p: [0, 30, -600], k: 'FILE', t: '6+ YEARS SHIPPING PRODUCTION WEB APPS' },
  { p: [5.5, 1.7, -1020], k: 'FILE', t: '600+ AUTOMATED TESTS WRITTEN' },
  { p: [-5.5, 1.7, -1420], k: 'TIP', t: 'HOLD SHIFT TO BOOST · THE DRAGON AWAITS AT GATE 04' },
  { p: [0, 36, -1700], k: 'FILE', t: 'FINTECH · HEALTHTECH · AI RECRUITMENT' },
  { p: [2.75, 1.7, -2020], k: 'FILE', t: '7 ROLES · 4 SHIPPED BUILDS' },
  { p: [0, 42, -2380], k: 'KEY', t: 'THE LAST SHARD FLOATS BEYOND THE MARKET' },
];

/** Cold-boot log shown during the flyover: [percent threshold, line, status]. */
export const INTRO_LOG: [number, string, string][] = [
  [0, 'mounting /dev/neon', 'OK'],
  [10, 'raising 900 nhà ống tube houses', 'OK'],
  [22, 'tangling power lines · hanging lanterns', 'OK'],
  [36, 'compiling rain.glsl', 'OK'],
  [50, 'sky traffic grid', 'ONLINE'],
  [64, 'decrypting subject: TRAN NGOC HAI', 'OK'],
  [78, 'fueling bike TOPY-01', 'OK'],
  [92, 'all systems', 'NOMINAL'],
];

export const EMAIL = 'tranngochai171@gmail.com';

export type Phase = 'boot' | 'loading' | 'ready' | 'ride';

/** UI state owned by the engine and mirrored into React for rendering. */
export type CityState = {
  phase: Phase;
  section: SectorId | null;
  dismissed: SectorId | null;
  mode: 'bike' | 'fly';
  auto: boolean;
  hold: boolean;
  cruise: boolean;
  hints: boolean;
  sfx: boolean;
  eng: boolean;
  rain: boolean;
  mobile: boolean;
  /** Collected data shards. */
  shards: number;
  /** Intro log lines revealed so far. */
  logN: number;
};

export const INITIAL_STATE: CityState = {
  phase: 'boot',
  section: null,
  dismissed: null,
  mode: 'bike',
  auto: false,
  hold: false,
  cruise: false,
  hints: true,
  sfx: true,
  eng: false,
  rain: false,
  mobile: false,
  shards: 0,
  logN: 0,
};
