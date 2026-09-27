import type { CityState } from '../data';

/** What the audio reads from the engine each frame. */
export type AudioView = {
  S: CityState;
  keys: Record<string, boolean>;
  speed: () => number;
  rainK: () => number;
  landing: () => boolean;
};

type Osc = OscillatorNode;
type RainBits = { bus: GainNode; washG: GainNode; washF: BiquadFilterNode; hsG: GainNode; gb: AudioBuffer; gust: number; gustT: number; gustTg?: number; next: number };

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/**
 * All generated in Web Audio, nothing downloaded: a 72 bpm lo-fi loop, a bike engine / rotor drone,
 * procedural rain and a few SFX. Created on the first user gesture only (browsers block autoplay).
 */
export class CityAudio {
  ac: AudioContext | null = null;
  private master!: GainNode;
  private warm!: BiquadFilterNode;
  private echo!: DelayNode;
  private wobG!: GainNode;
  private engBus!: GainNode;
  private eng!: { g: GainNode; lp: BiquadFilterNode; e1: Osc; e2: Osc; e3: Osc; puls: Osc };
  private ev!: { g: GainNode; lp: BiquadFilterNode; hum: Osc };
  private rainA: RainBits | null = null;
  private noise!: AudioBuffer;
  private lofi = { bpm: 72, step: 0, next: 0 };
  private lofiT = 0;
  private rainT = 0;

  constructor(private v: AudioView) {}

  init() {
    const S = this.v.S;
    if (this.ac) {
      if (this.ac.state === 'suspended' && !document.hidden) void this.ac.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    this.ac = ac;
    const master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);
    this.master = master;
    master.gain.setTargetAtTime(S.sfx ? 0.5 : 0, ac.currentTime, 1.2);
    const warm = ac.createBiquadFilter();
    warm.type = 'lowpass';
    warm.frequency.value = 2200;
    warm.Q.value = 0.5;
    warm.connect(master);
    this.warm = warm;
    const dl = ac.createDelay(1.5);
    dl.delayTime.value = 0.55;
    const fb = ac.createGain();
    fb.gain.value = 0.28;
    const dlf = ac.createBiquadFilter();
    dlf.type = 'lowpass';
    dlf.frequency.value = 1400;
    const wet = ac.createGain();
    wet.gain.value = 0.22;
    dl.connect(dlf);
    dlf.connect(fb);
    fb.connect(dl);
    dlf.connect(wet);
    wet.connect(warm);
    this.echo = dl;
    const wob = ac.createOscillator();
    wob.frequency.value = 0.35;
    const wobG = ac.createGain();
    wobG.gain.value = 4;
    wob.connect(wobG);
    wob.start();
    this.wobG = wobG;

    // Bike engine: detuned triangle + sub, pulsed, through a lowpass.
    const engBus = ac.createGain();
    engBus.gain.value = S.eng ? 1 : 0;
    engBus.connect(master);
    this.engBus = engBus;
    const eng = ac.createGain();
    eng.gain.value = 0;
    eng.connect(engBus);
    const eLp = ac.createBiquadFilter();
    eLp.type = 'lowpass';
    eLp.frequency.value = 260;
    eLp.Q.value = 0.4;
    eLp.connect(eng);
    const e1 = ac.createOscillator();
    e1.type = 'triangle';
    e1.frequency.value = 42;
    const e2 = ac.createOscillator();
    e2.type = 'sine';
    e2.frequency.value = 21;
    const e3 = ac.createOscillator();
    e3.type = 'sine';
    e3.frequency.value = 84.4;
    const e3g = ac.createGain();
    e3g.gain.value = 0.25;
    e3.connect(e3g);
    e3g.connect(eLp);
    const puls = ac.createOscillator();
    puls.frequency.value = 9;
    const pulsG = ac.createGain();
    pulsG.gain.value = 0.18;
    const am = ac.createGain();
    am.gain.value = 0.82;
    puls.connect(pulsG);
    pulsG.connect(am.gain);
    e1.connect(am);
    e2.connect(am);
    am.connect(eLp);
    [e1, e2, e3, puls].forEach((o) => o.start());
    this.eng = { g: eng, lp: eLp, e1, e2, e3, puls };

    // Fly mode: filtered brown-noise air + hum.
    const ev = ac.createGain();
    ev.gain.value = 0;
    ev.connect(engBus);
    const nb = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), nd = nb.getChannelData(0);
    let br = 0;
    for (let i = 0; i < nd.length; i++) {
      br = (br + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      nd[i] = br * 3.5;
    }
    const air = ac.createBufferSource();
    air.buffer = nb;
    air.loop = true;
    const evLp = ac.createBiquadFilter();
    evLp.type = 'lowpass';
    evLp.frequency.value = 380;
    evLp.Q.value = 0.2;
    const evHp = ac.createBiquadFilter();
    evHp.type = 'highpass';
    evHp.frequency.value = 60;
    air.connect(evHp);
    evHp.connect(evLp);
    evLp.connect(ev);
    const hum = ac.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 55;
    const humg = ac.createGain();
    humg.gain.value = 0.12;
    hum.connect(humg);
    humg.connect(ev);
    const bp = ac.createOscillator();
    bp.frequency.value = 0.18;
    const bpg = ac.createGain();
    bpg.gain.value = 60;
    bp.connect(bpg);
    bpg.connect(evLp.frequency);
    air.start();
    hum.start();
    bp.start();
    this.ev = { g: ev, lp: evLp, hum };

    // Shared white noise for the whoosh / fire SFX.
    this.noise = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate);
    const wn = this.noise.getChannelData(0);
    for (let i = 0; i < wn.length; i++) wn[i] = Math.random() * 2 - 1;

    this.initRain(ac, master);
    this.lofi = { bpm: 72, step: 0, next: ac.currentTime + 0.3 };
    const tick = () => {
      if (!this.ac || this.ac.state !== 'running') return;
      while (this.lofi.next < this.ac.currentTime + 0.25) {
        this.lofiStep(this.lofi.step, this.lofi.next);
        this.lofi.step++;
        this.lofi.next += 60 / this.lofi.bpm / 2;
      }
    };
    this.lofiT = window.setInterval(tick, 60);
  }

  private initRain(ac: AudioContext, master: GainNode) {
    const SR = ac.sampleRate, bus = ac.createGain();
    bus.gain.value = 0;
    bus.connect(master);
    const pink = (sec: number) => {
      const bf = ac.createBuffer(1, SR * sec, SR), d = bf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
      return bf;
    };
    const pan = (v: number): AudioNode => {
      if (ac.createStereoPanner) {
        const p = ac.createStereoPanner();
        p.pan.value = v;
        return p;
      }
      return ac.createGain();
    };
    // Far wash: two decorrelated pink beds, L/R.
    const washF = ac.createBiquadFilter();
    washF.type = 'lowpass';
    washF.frequency.value = 5200;
    washF.Q.value = 0.3;
    const washH = ac.createBiquadFilter();
    washH.type = 'highpass';
    washH.frequency.value = 280;
    const washG = ac.createGain();
    washG.gain.value = 0.55;
    washH.connect(washF);
    washF.connect(washG);
    washG.connect(bus);
    [-0.7, 0.7].forEach((pv) => {
      const src = ac.createBufferSource();
      src.buffer = pink(5 + pv);
      src.loop = true;
      const p = pan(pv);
      src.connect(p);
      p.connect(washH);
      src.start(0, Math.random() * 3);
    });
    // Sizzle: fine spray hiss, very high.
    const hb = ac.createBuffer(2, SR * 3, SR);
    for (let c = 0; c < 2; c++) {
      const d = hb.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const hs = ac.createBufferSource();
    hs.buffer = hb;
    hs.loop = true;
    const hsF = ac.createBiquadFilter();
    hsF.type = 'bandpass';
    hsF.frequency.value = 7500;
    hsF.Q.value = 0.6;
    const hsG = ac.createGain();
    hsG.gain.value = 0.05;
    hs.connect(hsF);
    hsF.connect(hsG);
    hsG.connect(bus);
    hs.start();
    // Low roof/street rumble.
    const rm = ac.createBufferSource();
    rm.buffer = pink(4);
    rm.loop = true;
    const rmF = ac.createBiquadFilter();
    rmF.type = 'lowpass';
    rmF.frequency.value = 320;
    const rmG = ac.createGain();
    rmG.gain.value = 0.35;
    rm.connect(rmF);
    rmF.connect(rmG);
    rmG.connect(bus);
    rm.start();
    // Droplet grain.
    const gb = ac.createBuffer(1, Math.floor(SR * 0.06), SR), gd = gb.getChannelData(0);
    for (let i = 0; i < gd.length; i++) gd[i] = Math.random() * 2 - 1;
    this.rainA = { bus, washG, washF, hsG, gb, gust: 0, gustT: 0, next: ac.currentTime };
    const drop = (t: number, near: boolean) => {
      const A = this.rainA;
      if (!A) return;
      const src = ac.createBufferSource();
      src.buffer = A.gb;
      const f = ac.createBiquadFilter(), g = ac.createGain(), p = pan((Math.random() * 2 - 1) * (near ? 0.5 : 0.95));
      const dec = near ? 0.012 + Math.random() * 0.02 : 0.006 + Math.random() * 0.03;
      if (near) {
        f.type = 'bandpass';
        f.frequency.value = 900 + Math.random() * 1600;
        f.Q.value = 2.5 + Math.random() * 3;
      } else {
        f.type = 'bandpass';
        f.frequency.value = 1800 + Math.random() * 6500;
        f.Q.value = 0.8 + Math.random() * 2.2;
      }
      const pk = (near ? 0.35 : 0.1) * Math.pow(Math.random(), 1.8) + 0.015;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(pk, t + 0.0015);
      g.gain.exponentialRampToValueAtTime(0.0005, t + dec);
      src.connect(f);
      f.connect(g);
      g.connect(p);
      p.connect(A.bus);
      src.start(t, Math.random() * 0.02, dec + 0.01);
      if (Math.random() < (near ? 0.22 : 0.05)) {
        // Puddle / metal plink.
        const o = ac.createOscillator(), og = ac.createGain(), f0 = 1400 + Math.random() * 2600;
        o.type = 'sine';
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f0 * (1.25 + Math.random() * 0.4), t + 0.035);
        og.gain.setValueAtTime(0, t);
        og.gain.linearRampToValueAtTime(pk * 0.28, t + 0.002);
        og.gain.exponentialRampToValueAtTime(0.0003, t + 0.05 + Math.random() * 0.05);
        o.connect(og);
        og.connect(p);
        o.start(t);
        o.stop(t + 0.12);
      }
    };
    const tick = () => {
      const A = this.rainA;
      if (!this.ac || this.ac.state !== 'running' || !A) return;
      const k = this.v.rainK(), now = ac.currentTime;
      if (A.next < now) A.next = now;
      if (k < 0.02) {
        A.next = now + 0.1;
        return;
      }
      const S = this.v.S;
      const onBike = S.phase === 'ride' && S.mode !== 'fly' && !this.v.landing();
      const rate = (26 + 30 * A.gust) * k;
      while (A.next < now + 0.2) {
        A.next += -Math.log(1 - Math.random()) / rate;
        drop(A.next, onBike && Math.random() < 0.3);
      }
    };
    this.rainT = window.setInterval(tick, 50);
  }

  private lofiStep(st: number, t: number) {
    const ac = this.ac;
    if (!ac) return;
    const out = this.warm;
    const CH = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], BS = [41, 40, 38, 36];
    const bar = Math.floor(st / 8) % 4, e = st % 8, beat = 60 / this.lofi.bpm, sw = e % 2 ? beat * 0.08 : 0;
    t += sw;
    const note = (fq: number, t0: number, dur: number, vol: number, type: OscillatorType = 'sine', att = 0.02, toEcho = false) => {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = fq;
      this.wobG.connect(o.detune);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + att);
      g.gain.setTargetAtTime(0.0001, t0 + att, dur / 3);
      o.connect(g);
      g.connect(out);
      if (toEcho) g.connect(this.echo);
      o.start(t0);
      o.stop(t0 + dur + 0.5);
    };
    if (e === 0) {
      CH[bar].forEach((m, i) => {
        const t0 = t + i * 0.025;
        note(mtof(m), t0, beat * 3.6, 0.03, 'sine', 0.06, true);
        note(mtof(m + 12), t0, beat * 2, 0.008, 'triangle', 0.08);
      });
      note(mtof(BS[bar] - 12), t, beat * 1.8, 0.1, 'sine', 0.03);
    }
    if (e === 5) note(mtof(BS[bar] - 12 + 7), t, beat * 0.9, 0.06, 'sine', 0.03);
    if (e === 0 || e === 5 || (e === 3 && bar % 2)) {
      // Kick.
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 0.4);
    }
    if (e === 4) {
      // Rim / snare tick.
      const o = ac.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(260, t);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.08);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.025, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g);
      g.connect(out);
      g.connect(this.echo);
      o.start(t);
      o.stop(t + 0.2);
    }
    const PENT = [72, 74, 76, 79, 81, 84];
    if ((e === 2 || e === 6 || e === 7) && Math.random() < 0.3) note(mtof(PENT[(Math.random() * PENT.length) | 0]), t, beat * 1.4, 0.018, 'sine', 0.01, true);
  }

  /** One-shot SFX; silent while the LOFI toggle is off (as in the design). */
  sfx(type: 'open' | 'blip' | 'whoosh' | 'fire') {
    const ac = this.ac;
    if (!ac || !this.v.S.sfx) return;
    const t = ac.currentTime;
    if (type === 'whoosh') {
      // Filtered-noise sweep for the flash transitions (ignition, warp, mode switch, weather).
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = this.noise;
      f.type = 'bandpass';
      f.Q.value = 0.9;
      f.frequency.setValueAtTime(320, t);
      f.frequency.exponentialRampToValueAtTime(2600, t + 0.22);
      f.frequency.exponentialRampToValueAtTime(420, t + 0.75);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.16);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      src.connect(f);
      f.connect(g);
      g.connect(this.warm);
      g.connect(this.echo);
      src.start(t, Math.random() * 3);
      src.stop(t + 0.85);
      return;
    }
    if (type === 'fire') {
      // Dragon breath: a low roar with a hissing top, shaped like the 3.2s flame.
      const roar = ac.createBufferSource(), rf = ac.createBiquadFilter(), hf = ac.createBiquadFilter(), hg = ac.createGain(), g = ac.createGain();
      roar.buffer = this.noise;
      rf.type = 'lowpass';
      rf.Q.value = 0.8;
      rf.frequency.setValueAtTime(260, t);
      rf.frequency.linearRampToValueAtTime(760, t + 0.5);
      rf.frequency.linearRampToValueAtTime(380, t + 3.2);
      hf.type = 'bandpass';
      hf.frequency.value = 2400;
      hf.Q.value = 0.7;
      hg.gain.value = 0.25;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.11, t + 0.45);
      g.gain.linearRampToValueAtTime(0.08, t + 2.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      roar.connect(rf);
      rf.connect(g);
      roar.connect(hf);
      hf.connect(hg);
      hg.connect(g);
      g.connect(this.warm);
      roar.start(t, Math.random() * 0.5);
      roar.stop(t + 3.3);
      return;
    }
    [76, 83].forEach((m, i) => {
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.value = mtof(m);
      const g = ac.createGain();
      const ts = t + i * 0.12;
      g.gain.setValueAtTime(0.0001, ts);
      g.gain.linearRampToValueAtTime(0.025, ts + 0.02);
      g.gain.setTargetAtTime(0.0001, ts + 0.02, 0.25);
      o.connect(g);
      g.connect(this.warm);
      g.connect(this.echo);
      o.start(ts);
      o.stop(ts + 1.4);
    });
  }

  /** Per frame: tone follows speed, panels muffle, rain gusts, engine vs rotor drone. */
  update() {
    const ac = this.ac;
    if (!ac || !this.warm) return;
    const S = this.v.S, ride = S.phase === 'ride';
    const sp = ride ? this.v.speed() : 0;
    const now = ac.currentTime;
    this.warm.frequency.setTargetAtTime(S.section ? 2600 : 1500 + Math.min(900, sp * 8), now, 1.5);
    const RA = this.rainA;
    if (RA) {
      RA.gustT -= 1 / 60;
      if (RA.gustT <= 0) {
        RA.gustT = 2 + Math.random() * 5;
        RA.gustTg = Math.random();
      }
      RA.gust += ((RA.gustTg ?? 0.5) - RA.gust) * 0.01;
      const kk = this.v.rainK(), fly = S.mode === 'fly';
      RA.bus.gain.setTargetAtTime(0.32 * kk * (S.section ? 0.6 : 1), now, 0.3);
      RA.washG.gain.setTargetAtTime(0.4 + RA.gust * 0.3 + Math.min(0.35, sp / 260), now, 0.8);
      RA.washF.frequency.setTargetAtTime(3800 + RA.gust * 1800 + Math.min(2500, sp * 25) + (fly ? 1200 : 0), now, 0.8);
      RA.hsG.gain.setTargetAtTime(0.03 + RA.gust * 0.03 + Math.min(0.05, sp / 2000), now, 0.8);
    }
    const E = this.eng;
    if (!E) return;
    const keys = this.v.keys;
    const fly = S.mode === 'fly', r = Math.min(1.2, sp / 110), thr = ride && (keys.w || S.auto) ? 1 : 0, boost = ride && keys.boost ? 1 : 0;
    const base = (fly ? 58 : 36) + r * (fly ? 60 : 78) + boost * 12;
    E.e1.frequency.setTargetAtTime(base, now, 0.35);
    E.e2.frequency.setTargetAtTime(base / 2, now, 0.35);
    E.e3.frequency.setTargetAtTime(base * 2.01, now, 0.35);
    E.puls.frequency.setTargetAtTime(fly ? 5 : 7 + r * 14, now, 0.4);
    E.lp.frequency.setTargetAtTime(200 + r * 520 + thr * 80 + boost * 160, now, 0.4);
    const quiet = S.section ? 0.55 : 1;
    E.g.gain.setTargetAtTime(ride && !fly ? (0.1 + r * 0.1 + thr * 0.03) * quiet : 0, now, 0.6);
    const W = this.ev;
    if (W) {
      W.lp.frequency.setTargetAtTime(300 + r * 320 + boost * 120, now, 0.8);
      W.hum.frequency.setTargetAtTime(52 + r * 14, now, 1.0);
      W.g.gain.setTargetAtTime(ride && fly ? (0.05 + r * 0.06) * quiet : 0, now, 0.8);
    }
  }

  setEngine(on: boolean) {
    if (this.ac && this.engBus) this.engBus.gain.setTargetAtTime(on ? 1 : 0, this.ac.currentTime, 0.25);
  }

  setMaster(on: boolean) {
    if (this.ac && this.master) this.master.gain.setTargetAtTime(on ? 0.5 : 0, this.ac.currentTime, 0.4);
  }

  suspend(hidden: boolean) {
    if (!this.ac) return;
    if (hidden) void this.ac.suspend();
    else if (this.v.S.sfx) void this.ac.resume();
  }

  dispose() {
    clearInterval(this.lofiT);
    clearInterval(this.rainT);
    if (this.ac) void this.ac.close().catch(() => {});
    this.ac = null;
  }
}
