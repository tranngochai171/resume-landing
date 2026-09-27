import * as T from 'three';
import { CPS, INITIAL_STATE, SH, type CityState, type SectorId } from '../data';
import { buildWorld, type World } from './world';
import { buildCockpit, drawDash, type Cockpit } from './cockpit';
import { buildShards, type Shards } from './shards';
import { buildCraft, type Craft } from './craft';
import { buildAirships, type Airships } from './airships';
import { buildPost, type Post } from './post';
import { CityAudio } from './audio';
import { animateWorld } from './animate';
import { intro, ride } from './ride';
import { deadzone } from './pure';
import { applyAssets, fetchTextures, reserveAssetSlots, type AssetSlots } from './assets';
import { postMaterials, warmUp } from './warm';
import { CANCELLED, slicer } from './yield';
import type { Fonts } from './textures';

export type CityCallbacks = {
  /** Called with a fresh copy whenever the UI state changes. */
  onState: (s: CityState) => void;
  /** The city cannot run (init error, lost WebGL context): render the 2D page instead. */
  onFallback: (reason: unknown) => void;
};

/** Keyboard map: arrows / WASD drive, Shift or Space boosts, E/R climb and Q/F descend in fly mode. */
const KEYMAP: Record<string, string> = { arrowup: 'w', arrowdown: 's', arrowleft: 'a', arrowright: 'd', w: 'w', s: 's', a: 'a', d: 'd', shift: 'boost', ' ': 'boost', e: 'up', r: 'up', q: 'dn', f: 'dn' };

/** Work per main-thread task during start-up (a mid-range phone runs ~4x slower than this budget). */
const SLICE_MS = 8;

/** The flyover camera path: from high above downtown, down the avenue, up over the dragon. */
const FLYOVER: [number, number, number][] = [[0, 300, 760], [0, 170, 380], [6, 70, 130], [-4, 26, 20], [0, 11, -150], [0, 5, -250], [5, 9, -380], [-5, 9, -640], [0, 5.5, -750], [4, 9, -900], [0, 9, -1150], [0, 8, -1250], [-5, 10, -1400], [0, 40, -1650], [0, 110, -1850], [0, 190, -1960]];

/**
 * TOPY.OS - Neon City. Owns the three.js scene, the ride simulation and the UI state
 * (mirrored to React through `onState`). The React shell renders the HUD and calls the actions.
 */
export class Engine {
  S: CityState = { ...INITIAL_STATE };
  keys: Record<string, boolean> = {};
  wheel = 0;
  /** Smoothed and target mouse-look offsets (-1..1). */
  mx = 0;
  my = 0;
  tmx = 0;
  tmy = 0;
  /** Gates the autopilot already stopped at on this lap. */
  visited = new Set<SectorId>();
  /** Flyover progress (1 = end of path). */
  u = 0;
  alt = 34;
  dashAcc = 0;
  rainK = 0;
  ckT = 0;
  ckOut = 9;
  landing = false;
  tdT = 9;
  hf = 0;
  boostOn = false;
  bike = { x: 0, y: 1.35, z: 150, v: 0, st: 0 };

  renderer!: T.WebGLRenderer;
  scene!: T.Scene;
  cam!: T.PerspectiveCamera;
  path!: T.CatmullRomCurve3;
  w!: World;
  ck!: Cockpit;
  shards!: Shards;
  craft!: Craft;
  airships!: Airships;
  post: Post | null = null;
  audio: CityAudio;
  v3 = new T.Vector3();
  m4 = new T.Matrix4();

  private texCache = new Map<string, T.CanvasTexture>();
  private loaded: T.Texture[] = [];
  private env: T.WebGLRenderTarget | null = null;
  private slots: AssetSlots | null = null;
  private pr = 1;
  private prMax = 1;
  private perf = { acc: 0, n: 0, cool: 2 };
  private dead = false;
  private failed = false;
  /** Set once init has finished and the first frame is scheduled; before that the renderer exists but the city may not. */
  private running = false;
  private raf = 0;
  private last = 0;
  private t0 = 0;
  private timers: Record<'hints' | 'toast' | 'flash', number> = { hints: 0, toast: 0, flash: 0 };
  private off: (() => void) | null = null;

  constructor(
    private host: HTMLElement,
    private root: HTMLElement,
    readonly fonts: Fonts,
    private cb: CityCallbacks,
  ) {
    this.audio = new CityAudio({ S: this.S, keys: this.keys, speed: () => Math.abs(this.bike.v), rainK: () => this.rainK, landing: () => this.landing });
  }

  set(p: Partial<CityState>) {
    if (this.dead) return;
    Object.assign(this.S, p);
    this.cb.onState({ ...this.S });
  }

  /** HUD / overlay element rendered by React with `data-c={name}`, or null when not mounted. */
  el(name: string) {
    return this.root.querySelector<HTMLElement>(`[data-c="${name}"]`);
  }

  start() {
    let eng = false, rain = false;
    try {
      eng = localStorage.getItem('topy3d_eng2') === '1';
      const rv = localStorage.getItem('topy3d_rain2');
      if (rv !== null) rain = rv === '1';
    } catch {}
    this.rainK = rain ? 1 : 0;
    this.set({ eng, rain });
    const chkMob = () => {
      const m = matchMedia('(pointer:coarse)').matches || innerWidth < 760;
      if (m !== this.S.mobile) {
        this.set({ mobile: m });
        if (m && this.S.phase === 'ride' && !this.S.auto) this.set({ auto: true, hold: false });
      }
    };
    chkMob();
    const kd = (e: KeyboardEvent) => this.onKey(e, true), ku = (e: KeyboardEvent) => this.onKey(e, false);
    const wh = (e: WheelEvent) => {
      if (this.S.phase === 'ride' && !(e.target as Element | null)?.closest?.('[data-panel]')) this.wheel += e.deltaY;
    };
    const mm = (e: MouseEvent) => {
      if (!this.renderer || e.target !== this.renderer.domElement) {
        this.tmx = 0;
        this.tmy = 0;
        return;
      }
      this.tmx = deadzone((e.clientX / innerWidth) * 2 - 1);
      this.tmy = deadzone((e.clientY / innerHeight) * 2 - 1);
    };
    const ml = () => {
      this.tmx = 0;
      this.tmy = 0;
    };
    const bl = () => {
      for (const k in this.keys) delete this.keys[k];
      this.tmx = 0;
      this.tmy = 0;
    };
    const pd = () => {
      if (this.S.sfx) this.audio.init();
    };
    // Tab hidden: pause rendering and audio.
    const vis = () => {
      this.audio.suspend(document.hidden);
      if (document.hidden) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      } else if (this.running && !this.raf && !this.dead && !this.failed) {
        this.last = performance.now();
        this.raf = requestAnimationFrame(this.loop);
      }
    };
    // Clicked buttons give focus back to the page so the keys keep driving.
    const up = (e: PointerEvent) => {
      const b = (e.target as Element | null)?.closest?.('button');
      if (b) setTimeout(() => b.blur(), 0);
    };
    const rs = () => {
      chkMob();
      this.resize();
    };
    addEventListener('keydown', kd);
    addEventListener('keyup', ku);
    addEventListener('wheel', wh, { passive: true });
    addEventListener('mousemove', mm);
    addEventListener('resize', rs);
    document.addEventListener('mouseleave', ml);
    addEventListener('blur', bl);
    addEventListener('pointerup', up);
    addEventListener('pointerdown', pd);
    document.addEventListener('visibilitychange', vis);
    this.off = () => {
      removeEventListener('keydown', kd);
      removeEventListener('keyup', ku);
      removeEventListener('wheel', wh);
      removeEventListener('mousemove', mm);
      removeEventListener('resize', rs);
      document.removeEventListener('mouseleave', ml);
      removeEventListener('blur', bl);
      removeEventListener('pointerup', up);
      removeEventListener('pointerdown', pd);
      document.removeEventListener('visibilitychange', vis);
    };
    this.init().catch((err) => {
      if (err !== CANCELLED) this.fail(err);
    });
  }

  private async init() {
    const { display, mono } = this.fonts;
    // Canvas signage needs the webfonts (incl. Vietnamese glyphs) before it is drawn; wait up to 1.5s.
    try {
      await Promise.race([
        Promise.all([document.fonts.load(`700 64px ${display}`, 'ÀẢỞỪĐ'), document.fonts.load(`700 40px ${mono}`, 'ÀẢỞỪĐ'), document.fonts.load(`500 26px ${mono}`, 'ÀẢỞỪĐ')]),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch {}
    if (this.dead) return;
    T.ColorManagement.enabled = false;
    const host = this.host;
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    const r = new T.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
    r.outputColorSpace = T.LinearSRGBColorSpace;
    this.prMax = Math.min(devicePixelRatio || 1, 1.25);
    this.pr = Math.min(this.prMax, 1);
    r.setPixelRatio(this.pr);
    r.setSize(w, h);
    r.domElement.style.display = 'block';
    r.domElement.addEventListener('webglcontextlost', this.onLost);
    host.appendChild(r.domElement);
    this.renderer = r;
    const scene = new T.Scene();
    this.scene = scene;
    const FOG = new T.Color(0.09, 0.035, 0.13);
    scene.fog = new T.FogExp2(FOG, 0.0019);
    scene.background = FOG;
    const cam = new T.PerspectiveCamera(66, w / h, 0.25, 7000);
    cam.rotation.order = 'YXZ';
    this.cam = cam;
    scene.add(cam);
    cam.updateMatrixWorld();
    const textures = fetchTextures(r.capabilities.getMaxAnisotropy());
    // Build in short slices so the page (SKIP, keys) stays responsive and no task blocks the thread.
    // Every step checks for disposal: an unmount or fallback mid-build stops the build right there.
    const slice = slicer(SLICE_MS, { cancelled: () => this.dead });
    await slice();
    this.w = await buildWorld(scene, FOG, this.fonts, this.texCache, slice);
    if (this.dead) return;
    this.ck = buildCockpit(cam);
    this.drawDash();
    await slice();
    this.shards = buildShards(scene);
    this.craft = buildCraft(scene, this.w.sp);
    this.airships = buildAirships(scene, this.fonts);
    this.slots = reserveAssetSlots(r, scene, this.w.gateMats);
    try {
      this.post = buildPost(r, scene, cam, w, h);
    } catch (e) {
      console.warn('[city] post-processing unavailable', e);
      this.post = null;
    }
    this.path = new T.CatmullRomCurve3(FLYOVER.map((a) => new T.Vector3(a[0], a[1], a[2])), false, 'catmullrom', 0.4);
    // Upload the canvas-drawn textures and compile every shader now, off the first frames.
    const uploads = new Set<T.Texture>();
    scene.traverse((o) => {
      const m = (o as T.Mesh).material;
      for (const mt of Array.isArray(m) ? m : m ? [m] : []) {
        Object.values(mt).forEach((v) => v instanceof T.Texture && uploads.add(v));
        if (mt instanceof T.ShaderMaterial) Object.values(mt.uniforms).forEach((u) => u?.value instanceof T.Texture && uploads.add(u.value));
      }
    });
    for (const t of Array.from(uploads)) {
      if (t.isRenderTargetTexture) continue;
      r.initTexture(t);
      await slice();
    }
    const { ride } = await warmUp(r, scene, cam, this.ck.ck, [...(this.post ? postMaterials(this.post) : []), ...this.slots.filterMaterials], slice);
    if (this.dead) return;
    ride.catch((e) => e !== CANCELLED && console.warn('[city] warm-up', e));
    const slots = this.slots;
    textures
      .then((t) => applyAssets(r, scene, this.w.uni, this.w.gateMats, slots, t, this.ck.ck, () => this.dead))
      .then((res) => {
        this.loaded.push(...res.owned);
        this.env = res.env;
        if (this.dead) this.releaseAssets();
      })
      .catch((e) => console.warn('[city] assets', e));
    // Resizes during the build were ignored (see resize()); apply the current size once, then go live.
    this.running = true;
    this.resize();
    this.set({ phase: 'loading', shards: this.shards.got.size });
    this.t0 = this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private releaseAssets() {
    this.loaded.forEach((t) => t.dispose());
    this.loaded = [];
    this.env?.dispose();
    this.env = null;
    if (this.slots) {
      this.slots.white.dispose();
      this.slots.envStandIn?.dispose();
      this.slots.pmrem.dispose();
    }
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.fail(new Error('WebGL context lost'));
  };

  private onKey(e: KeyboardEvent, down: boolean) {
    const tgt = e.target as HTMLElement | null;
    const tag = tgt?.tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const k = (e.key || '').toLowerCase();
    // Enter / Space on a focused button or link activates it rather than driving.
    if ((k === 'enter' || k === ' ') && tgt?.closest?.('button,a')) return;
    const ph = this.S.phase;
    const mk = KEYMAP[k];
    if (mk) {
      this.keys[mk] = down;
      if (ph === 'ride') {
        e.preventDefault();
        if (down && this.S.auto && !this.S.mobile && (mk === 'w' || mk === 's')) this.set({ auto: false, hold: false, cruise: false });
      }
    }
    if (!down) return;
    if (k === 'm') this.toggleSfx();
    if (k === 'n') this.toggleEng();
    if (k === 'r') this.toggleRain();
    if (k === 'enter' && (ph === 'ready' || ph === 'loading')) this.ignite(false);
    if (ph !== 'ride') return;
    if (k === 'v') this.toggleMode();
    if (k === 'c') this.toggleAuto();
    if (k === 'l') this.toggleCruise();
    if (k === 'escape') this.close();
  }

  /** Stop rendering and hand over to the 2D page, exactly once (init error, frame error, lost context). */
  private fail(err: unknown) {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.dead || this.failed) return;
    this.failed = true;
    this.cb.onFallback(err);
  }

  // A throwing frame would otherwise repeat every frame and freeze the scene (possibly on the loader).
  private loop = () => {
    if (this.dead || this.failed) return;
    try {
      this.frame();
    } catch (err) {
      this.fail(err);
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private frame() {
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.05), t = (now - this.t0) / 1000;
    this.last = now;
    this.w.uni.uTime.value = t;
    if (this.S.phase === 'ride') ride(this, dt, t);
    else intro(this, dt, t);
    animateWorld(this, dt, t);
    const rT = this.S.rain ? 1 : 0;
    this.rainK += (rT - this.rainK) * Math.min(1, dt * 1.6);
    if (Math.abs(rT - this.rainK) < 0.003) this.rainK = rT;
    this.w.rain.visible = this.rainK > 0.004;
    this.w.rain.material.uniforms.uA.value = this.rainK;
    this.audio.update();
    if (this.post) this.post.composer.render();
    else this.renderer.render(this.scene, this.cam);
    // Adaptive resolution: drop the pixel ratio under 42 fps, raise it again above 57.
    const P = this.perf;
    if (!document.hidden) {
      P.acc += dt;
      P.n++;
      P.cool -= dt;
      if (P.acc >= 1.2) {
        const fps = P.n / P.acc;
        P.acc = 0;
        P.n = 0;
        if (P.cool <= 0) {
          let np = this.pr;
          if (fps < 42) np = Math.max(0.55, this.pr - 0.15);
          else if (fps > 57) np = Math.min(this.prMax, this.pr + 0.08);
          if (Math.abs(np - this.pr) > 0.01) {
            this.pr = np;
            this.renderer.setPixelRatio(np);
            this.post?.composer.setPixelRatio(np);
            this.resize();
            P.cool = 2.5;
          }
        }
      }
    }
  }

  private resize() {
    if (!this.running) return;
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    if (this.post) {
      this.post.composer.setSize(w, h);
      this.post.lens.uniforms.uAsp.value = w / h;
    }
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
    this.w.fire.pts.material.uniforms.uScale.value = (h * Math.min(devicePixelRatio || 1, 1.5)) / 1.3;
  }

  drawDash() {
    const S = this.S;
    drawDash(this.ck, this.fonts, Math.abs(this.bike.v), S.cruise ? 'CRUISE ∞' : S.auto ? 'AUTO' : 'MANUAL', S.auto, this.boostOn);
  }

  /** Full-screen flash with a status line (ignition, warp, mode and weather changes). */
  flash(msg: string) {
    this.audio.sfx('whoosh');
    const el = this.el('fx-flash'), m = this.el('fx-msg');
    if (!el) return;
    if (m) m.textContent = msg;
    el.style.transition = 'none';
    el.style.opacity = '1';
    clearTimeout(this.timers.flash);
    this.timers.flash = window.setTimeout(() => {
      el.style.transition = 'opacity .9s ease-out';
      el.style.opacity = '0';
    }, 30);
  }

  toast(head: string, body: string, col: string, ms: number) {
    const el = this.el('shard-toast');
    if (!el) return;
    const [h, b] = Array.from(el.children) as HTMLElement[];
    h.textContent = head;
    h.style.color = col;
    b.textContent = body;
    el.style.borderColor = col;
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%,0)';
    clearTimeout(this.timers.toast);
    this.timers.toast = window.setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%,-8px)';
    }, ms);
  }

  shardCollected(i: number) {
    this.audio.sfx('open');
    const n = this.shards.got.size, N = SH.length, all = n === N, d = SH[i];
    this.set({ shards: n });
    this.toast(
      'SHARD ' + n + '/' + N + ' · ' + (all ? 'ALL DECRYPTED' : d.k),
      all ? 'EVERY SHARD FOUND - DIRECT LINE: TRANNGOCHAI171@GMAIL.COM' : d.t,
      all ? '#ffc53d' : d.k === 'TIP' ? '#FF2D95' : d.k === 'KEY' ? '#ffc53d' : '#00E5FF',
      all ? 8000 : 4200,
    );
  }

  // ---- Actions (HUD buttons and keys) ----

  /** Jump the flyover to its end (the "ready" card). */
  skip() {
    this.u = Math.max(this.u, 0.9);
  }

  ignite(auto: boolean) {
    const ph = this.S.phase;
    if (ph !== 'loading' && ph !== 'ready') return;
    if (this.S.sfx) this.audio.init();
    this.flash('IGNITION // TOPY-01');
    Object.assign(this.bike, { x: -2.75, y: 1.35, z: 150, v: 0, st: 0 });
    this.ckT = 0;
    this.visited = new Set();
    this.cam.fov = 66;
    this.cam.updateProjectionMatrix();
    this.set({ phase: 'ride', auto: auto || this.S.mobile, cruise: false, hold: false, section: null, dismissed: null, hints: true, mode: 'bike' });
    clearTimeout(this.timers.hints);
    this.timers.hints = window.setTimeout(() => this.set({ hints: false }), 14000);
  }

  toggleMode() {
    for (const k in this.keys) delete this.keys[k];
    const fly = this.S.mode !== 'fly';
    if (fly) {
      this.alt = 34;
      this.landing = false;
      this.ckOut = 0;
    } else this.landing = this.bike.y > 1.8;
    this.flash(fly ? 'LIFT-OFF // FLY MODE' : this.landing ? 'DESCENDING // BIKE MODE' : 'TOUCHDOWN // BIKE MODE');
    this.set({ mode: fly ? 'fly' : 'bike' });
  }

  toggleAuto() {
    if (this.S.mobile && this.S.auto) return;
    const on = !this.S.auto;
    if (on) {
      const bz = this.bike.z;
      this.visited = new Set(CPS.filter((c) => bz < c.z + 20).map((c) => c.id));
    }
    this.set({ auto: on, hold: false, cruise: false });
  }

  toggleCruise() {
    const on = !this.S.cruise, mob = this.S.mobile;
    this.set({ cruise: on, auto: on || mob, hold: false });
    this.flash(on ? 'CRUISE ∞ // NON-STOP LOOP' : mob ? 'CRUISE OFF // AUTOPILOT' : 'CRUISE OFF // MANUAL');
  }

  /** Rail click: jump to just before a gate. */
  warp(id: SectorId) {
    const cp = CPS.find((c) => c.id === id);
    if (this.S.phase !== 'ride' || !cp) return;
    this.flash('WARP // SECTOR ' + cp.n);
    this.bike.z = cp.z + 90;
    this.bike.v = Math.min(Math.abs(this.bike.v), 30);
    this.visited = new Set(CPS.filter((c) => c.z > cp.z).map((c) => c.id));
    this.set({ hold: false, dismissed: null });
  }

  toggleEng() {
    const on = !this.S.eng;
    this.set({ eng: on });
    try {
      localStorage.setItem('topy3d_eng2', on ? '1' : '0');
    } catch {}
    this.audio.setEngine(on);
  }

  toggleRain() {
    const on = !this.S.rain;
    this.set({ rain: on });
    try {
      localStorage.setItem('topy3d_rain2', on ? '1' : '0');
    } catch {}
    this.flash(on ? 'WEATHER // RAIN ON' : 'WEATHER // CLEAR SKIES');
  }

  toggleSfx() {
    const on = !this.S.sfx;
    this.set({ sfx: on });
    if (on) this.audio.init();
    this.audio.setMaster(on);
  }

  /** Close the open sector file (it can be reopened while still in that sector). */
  close() {
    this.set({ dismissed: this.S.section });
  }

  reopen() {
    this.set({ dismissed: null });
  }

  /** Leave an autopilot stop. */
  resume() {
    this.set({ hold: false });
  }

  dispose() {
    if (this.dead) return;
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.off?.();
    Object.values(this.timers).forEach((id) => clearTimeout(id));
    this.audio.dispose();
    if (this.scene) disposeScene(this.scene);
    this.texCache.forEach((t) => t.dispose());
    this.releaseAssets();
    if (this.post) {
      this.post.composer.passes.forEach((p) => p.dispose());
      this.post.composer.dispose();
    }
    if (this.renderer) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.onLost);
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement.remove();
    }
  }
}

/** Free every geometry, material and texture reachable from the scene graph. */
function disposeScene(scene: T.Scene) {
  const texs = new Set<T.Texture>();
  const grab = (v: unknown) => {
    if (v instanceof T.Texture) texs.add(v);
  };
  scene.traverse((o) => {
    const m = o as T.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mt of mats) {
      Object.values(mt).forEach(grab);
      if (mt instanceof T.ShaderMaterial) Object.values(mt.uniforms).forEach((u) => grab(u?.value));
      mt.dispose();
    }
    if (o instanceof T.InstancedMesh) o.dispose();
  });
  texs.forEach((t) => t.dispose());
  scene.environment = null;
}
