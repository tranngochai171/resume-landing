import * as T from 'three';
import { gearOf, kmh, rpmOf } from './pure';
import type { Fonts } from './textures';

export type Cockpit = {
  ck: T.Group;
  nP: T.MeshBasicMaterial;
  nC: T.MeshBasicMaterial;
  chevM: T.MeshBasicMaterial;
  chevTex: T.CanvasTexture;
  tread: T.MeshBasicMaterial;
  spin: T.Group;
  /** Smoothed boost 0..1. */
  bz: number;
  dashG: CanvasRenderingContext2D | null;
  dashTex: T.CanvasTexture;
};

type P3 = number[];

/** First-person hover-bike: faceted bonnet, neon piping, instrument pod, smoked screen, mirrors, hubless wheel. */
export function buildCockpit(cam: T.PerspectiveCamera): Cockpit {
  const ck = new T.Group();
  cam.add(ck);
  ck.visible = false;
  const DS = T.DoubleSide, C = (r: number, g: number, b: number) => new T.Color(r, g, b);
  const dark = new T.MeshPhysicalMaterial({ color: 0x16131f, metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06, flatShading: true, side: DS });
  const black = new T.MeshStandardMaterial({ color: 0x07060b, metalness: 0.3, roughness: 0.7 });
  const gold = new T.MeshStandardMaterial({ color: 0xd9a24a, metalness: 1, roughness: 0.22 });
  const chrome = new T.MeshStandardMaterial({ color: 0xb8c4d6, metalness: 1, roughness: 0.04 });
  const rubber = new T.MeshStandardMaterial({ color: 0x0b0a0e, metalness: 0.1, roughness: 0.65 });
  const glass = new T.MeshPhysicalMaterial({ color: 0x6a4a9a, metalness: 0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.16, side: DS, depthWrite: false });
  const nP = new T.MeshBasicMaterial({ color: C(1.1, 0.18, 0.65) }), nC = new T.MeshBasicMaterial({ color: C(0.15, 0.85, 1.1) });
  const nPd = new T.MeshBasicMaterial({ color: C(0.5, 0.08, 0.3) }), nCd = new T.MeshBasicMaterial({ color: C(0.07, 0.4, 0.52) });
  const hot = new T.MeshBasicMaterial({ color: C(2.2, 2.4, 2.6) }), tread = new T.MeshBasicMaterial({ color: C(0.2, 1.2, 1.5) });
  const V = (p: P3) => new T.Vector3(p[0], p[1], p[2]);
  ck.updateMatrixWorld(true);
  const put = (geo: T.BufferGeometry, mat: T.Material, x: number, y: number, z: number, par: T.Object3D = ck) => {
    const o = new T.Mesh(geo, mat);
    o.position.set(x, y, z);
    par.add(o);
    return o;
  };
  const tube = (pts: P3[], r: number, mat: T.Material) => {
    const o = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(V)), Math.max(12, pts.length * 5), r, 6, false), mat);
    ck.add(o);
    return o;
  };
  const rod = (a: P3, b: P3, r: number, mat: T.Material) => {
    const A = V(a), B = V(b), g = new T.CylinderGeometry(r, r, A.distanceTo(B), 12);
    g.rotateX(Math.PI / 2);
    const o = new T.Mesh(g, mat);
    o.position.copy(A).add(B).multiplyScalar(0.5);
    ck.add(o);
    o.lookAt(ck.localToWorld(B.clone()));
    return o;
  };
  const surf = (fn: (u: number, v: number) => P3, nu: number, nv: number, mat: T.Material, u0 = -1, u1 = 1, v0 = 0, v1 = 1) => {
    const P: number[] = [], UV: number[] = [], I: number[] = [];
    for (let j = 0; j <= nv; j++)
      for (let i = 0; i <= nu; i++) {
        const u = u0 + ((u1 - u0) * i) / nu, v = v0 + ((v1 - v0) * j) / nv;
        P.push(...fn(u, v));
        UV.push(i / nu, j / nv);
      }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const q = j * (nu + 1) + i;
        I.push(q, q + 1, q + nu + 1, q + 1, q + nu + 2, q + nu + 1);
      }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(UV, 2));
    g.setIndex(I);
    g.computeVertexNormals();
    const o = new T.Mesh(g, mat);
    ck.add(o);
    return o;
  };
  const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

  // Hood: faceted cyber-bonnet with a central ridge.
  const W = (v: number) => 0.5 * Math.pow(Math.max(0, 1 - Math.pow(v, 2.6)), 0.6) + 0.025;
  const H = (u: number, v: number) => -0.6 - 0.2 * Math.pow(v, 1.3) + 0.075 * (1 - Math.abs(u)) * (1 - 0.5 * v) - 0.04 * u * u;
  const D = (v: number) => 0.6 + 1.74 * v;
  const hood = (u: number, v: number, lift = 0): P3 => [u * W(v), H(u, v) + lift, -D(v)];
  surf((u, v) => hood(u, v), 16, 48, dark);
  for (const s of [-1, 1]) surf((t, v) => [s * W(v) * (1 - 0.3 * t), H(s, v) - 0.24 * t, -D(v)], 4, 40, dark, 0, 1);
  // Energy spine: scrolling chevrons down the ridge.
  const cc = document.createElement('canvas');
  cc.width = 64;
  cc.height = 128;
  const cg = cc.getContext('2d');
  if (cg) {
    cg.strokeStyle = '#fff';
    cg.lineWidth = 13;
    cg.lineJoin = 'miter';
    cg.beginPath();
    cg.moveTo(6, 104);
    cg.lineTo(32, 44);
    cg.lineTo(58, 104);
    cg.stroke();
  }
  const chevTex = new T.CanvasTexture(cc);
  chevTex.wrapS = chevTex.wrapT = T.RepeatWrapping;
  chevTex.repeat.set(1, 16);
  const chevM = new T.MeshBasicMaterial({ map: chevTex, color: C(1, 0.2, 0.7), transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false });
  surf((u, v) => hood(u, v, 0.005), 2, 60, chevM, -0.05, 0.05, 0.1, 0.96);
  // Neon piping.
  for (const s of [-1, 1]) {
    tube(range(0.05, 1, 30).map((v) => hood(s, v, 0.008)), 0.009, s < 0 ? nP : nC);
    tube(range(0.3, 0.86, 14).map((v) => hood(s * 0.5, v, 0.004)), 0.004, s < 0 ? nPd : nCd);
    tube(range(0.12, 0.7, 14).map((t) => [s * W(0.97) * (1 - 0.3 * t), H(s, 0.97) - 0.24 * t, -D(0.97)]), 0.006, s < 0 ? nP : nC);
    for (let k = 0; k < 3; k++) {
      const p = hood(s * 0.64, 0.4 + k * 0.075, 0.006);
      const slot = put(new T.BoxGeometry(0.16, 0.018, 0.03), black, p[0], p[1], p[2]);
      slot.rotation.set(0, s * 0.55, -s * 0.15);
      const gl = put(new T.BoxGeometry(0.13, 0.006, 0.008), s < 0 ? nP : nC, p[0], p[1] + 0.011, p[2]);
      gl.rotation.copy(slot.rotation);
    }
  }
  // Headlamp brow.
  tube([[-0.8, 0.86], [-0.4, 0.905], [0, 0.95], [0.4, 0.905], [0.8, 0.86]].map((q) => hood(q[0], q[1], 0.01)), 0.008, hot);

  // Instrument pod.
  const pod = new T.Group();
  pod.position.set(0, -0.455, -1.2);
  pod.rotation.x = -0.8;
  ck.add(pod);
  put(new T.BoxGeometry(0.52, 0.27, 0.05), dark, 0, 0, 0, pod);
  put(new T.BoxGeometry(0.48, 0.24, 0.01), black, 0, 0, 0.026, pod);
  const dc = document.createElement('canvas');
  dc.width = 512;
  dc.height = 256;
  const dashG = dc.getContext('2d');
  const dashTex = new T.CanvasTexture(dc);
  dashTex.anisotropy = 8;
  put(new T.PlaneGeometry(0.46, 0.23), new T.MeshBasicMaterial({ map: dashTex }), 0, 0, 0.032, pod);
  put(new T.BoxGeometry(0.55, 0.018, 0.1), dark, 0, 0.142, 0.03, pod);
  put(new T.BoxGeometry(0.44, 0.007, 0.008), nC, 0, -0.139, 0.03, pod);
  for (const s of [-1, 1]) put(new T.BoxGeometry(0.014, 0.1, 0.014), nP, s * 0.262, 0, 0.02, pod);

  // Wraparound smoked screen.
  const scr = (u: number, t: number): P3 => [
    0.36 * u * (1 - 0.15 * t),
    (-0.58 + 0.02 * u * u) * (1 - t) + (-0.31 - 0.06 * u * u) * t,
    (-1.42 + 0.2 * u * u) * (1 - t) + (-1.28 + 0.12 * u * u) * t,
  ];
  surf(scr, 20, 4, glass, -1, 1, 0, 1);
  tube(range(-1, 1, 20).map((u) => scr(u, 1)), 0.006, nC);

  // Mirrors.
  for (const s of [-1, 1]) {
    rod([s * 0.3, -0.5, -1.3], [s * 0.55, -0.42, -1.08], 0.011, black);
    const mg = new T.Group();
    mg.position.set(s * 0.62, -0.4, -1.05);
    mg.rotation.y = s * 0.22;
    ck.add(mg);
    const sh = new T.Shape();
    [[-0.13, -0.035], [0.1, -0.045], [0.145, 0.03], [-0.11, 0.045]].forEach((q, i) => (i ? sh.lineTo(s * q[0], q[1]) : sh.moveTo(s * q[0], q[1])));
    const hg = new T.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
    hg.translate(0, 0, -0.035);
    mg.add(new T.Mesh(hg, dark));
    const gs = new T.Shape();
    [[-0.115, -0.026], [0.092, -0.035], [0.128, 0.022], [-0.1, 0.035]].forEach((q, i) => (i ? gs.lineTo(s * q[0], q[1]) : gs.moveTo(s * q[0], q[1])));
    put(new T.ShapeGeometry(gs), chrome, 0, 0, 0.0095, mg);
    const e = new T.Mesh(new T.TubeGeometry(new T.LineCurve3(new T.Vector3(s * -0.11, 0.05, 0.004), new T.Vector3(s * 0.145, 0.035, 0.004)), 4, 0.004, 6), s < 0 ? nP : nC);
    mg.add(e);
    put(new T.BoxGeometry(0.03, 0.012, 0.012), nP, s * 0.15, -0.012, -0.01, mg);
  }

  // Hubless front wheel + gold forks.
  const wh = new T.Group();
  wh.position.set(0, -0.9, -2.85);
  ck.add(wh);
  const tire = new T.Mesh(new T.TorusGeometry(0.32, 0.065, 14, 64), rubber);
  tire.rotation.y = Math.PI / 2;
  wh.add(tire);
  for (const x of [-0.05, 0.05]) {
    const r = new T.Mesh(new T.TorusGeometry(0.262, 0.01, 8, 72), x < 0 ? nP : nC);
    r.rotation.y = Math.PI / 2;
    r.position.x = x;
    wh.add(r);
  }
  const spin = new T.Group();
  wh.add(spin);
  for (let i = 0; i < 18; i++) {
    const a2 = (i / 18) * Math.PI * 2, m = new T.Mesh(new T.BoxGeometry(0.05, 0.012, 0.07), tread);
    m.position.set(0, Math.cos(a2) * 0.386, Math.sin(a2) * 0.386);
    m.rotation.x = -a2;
    spin.add(m);
  }
  for (let i = 0; i < 3; i++) {
    const arc = new T.Mesh(new T.TorusGeometry(0.235, 0.014, 6, 20, 0.9), hot);
    arc.rotation.set(0, Math.PI / 2, 0);
    const pv = new T.Group();
    pv.rotation.x = (i / 3) * Math.PI * 2;
    pv.add(arc);
    spin.add(pv);
  }
  for (const s of [-1, 1]) {
    rod([s * 0.105, -0.76, -2.15], [s * 0.105, -0.9, -2.85], 0.022, gold);
    rod([s * 0.105, -0.9, -2.85], [s * 0.105, -0.93, -2.87], 0.03, black);
  }

  const spot = new T.SpotLight(0xcff4ff, 3.2, 170, 0.5, 0.6, 0);
  spot.position.set(0, -0.6, -2);
  const tgt = new T.Object3D();
  tgt.position.set(0, -3, -40);
  cam.add(tgt);
  spot.target = tgt;
  cam.add(spot);
  const p1 = new T.PointLight(0xff2d95, 2.4, 4, 0);
  p1.position.set(0, -0.2, -0.5);
  ck.add(p1);
  const p2 = new T.PointLight(0x00e5ff, 1.4, 4, 0);
  p2.position.set(0, -0.3, -1.7);
  ck.add(p2);
  return { ck, nP, nC, chevM, chevTex, tread, spin, bz: 0, dashG, dashTex };
}

/** Wheel spin, boost glow and chevron flow. Returns whether boost is visibly on. */
export function animCockpit(A: Cockpit, dt: number, v: number, boost: boolean) {
  const sp = Math.abs(v);
  A.spin.rotation.x -= Math.max(-20, Math.min(v, 95)) * 0.28 * dt;
  A.bz += ((boost && sp > 2 ? 1 : 0) - A.bz) * Math.min(1, dt * 5);
  const k = 0.7 + Math.min(1, sp / 90) * 0.7 + A.bz * 1.3;
  A.nP.color.setRGB(1.1 * k, 0.18 * k, 0.65 * k);
  A.nC.color.setRGB(0.15 * k, 0.85 * k, 1.1 * k);
  A.tread.color.setRGB(0.2 * k + A.bz, 1.2 * k, 1.5 * k);
  A.chevTex.offset.y = (A.chevTex.offset.y - (0.25 + sp * 0.05 + A.bz * 2) * dt) % 1;
  A.chevM.color.setRGB(1 + A.bz, 0.2 + A.bz * 1.4, 0.7 + A.bz * 1.2);
  A.chevM.opacity = 0.5 + Math.min(1, sp / 60) * 0.5;
  return A.bz > 0.5;
}

/** Redraw the dashboard screen: rev bar, speed, drive mode, boost and gear. */
export function drawDash(A: Cockpit, fonts: Fonts, v: number, modeLabel: string, auto: boolean, boostOn: boolean) {
  const g = A.dashG;
  if (!g) return;
  const W = 512, H = 256;
  g.fillStyle = '#05040a';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(0,229,255,0.04)';
  for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
  g.strokeStyle = '#00E5FF';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(24, 4);
  g.lineTo(W - 4, 4);
  g.lineTo(W - 4, H - 24);
  g.lineTo(W - 24, H - 4);
  g.lineTo(4, H - 4);
  g.lineTo(4, 24);
  g.closePath();
  g.stroke();
  const gi = gearOf(v);
  const rpm = rpmOf(v, gi);
  for (let i = 0; i < 28; i++) {
    const x = 20 + i * 16.6, h = 10 + i * 1.9, on = i < rpm * 28;
    g.fillStyle = on ? (i >= 22 ? '#FF2D95' : '#00E5FF') : '#17162a';
    g.beginPath();
    g.moveTo(x, 112);
    g.lineTo(x + 11, 112);
    g.lineTo(x + 17, 112 - h);
    g.lineTo(x + 6, 112 - h);
    g.closePath();
    g.fill();
  }
  const mono = (w: number, px: number) => `${w} ${px}px ${fonts.mono}`;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#7c7c98';
  g.font = mono(700, 18);
  g.fillText('TOPY-01', 22, 36);
  g.fillStyle = '#00E5FF';
  g.font = mono(700, 108);
  g.fillText(kmh(v), 16, 230);
  g.fillStyle = '#FF2D95';
  g.font = mono(700, 20);
  g.fillText('KM/H', 218, 230);
  g.fillStyle = auto ? '#27e08a' : '#9a9ab4';
  g.font = mono(700, 17);
  g.fillText(modeLabel, 218, 158);
  g.fillStyle = boostOn ? '#FF2D95' : '#2a2840';
  g.fillText('BOOST', 218, 186);
  g.strokeStyle = gi === 6 && rpm > 0.9 ? '#FF2D95' : '#00E5FF';
  g.lineWidth = 2;
  g.strokeRect(384, 128, 106, 104);
  g.fillStyle = '#7c7c98';
  g.font = mono(700, 13);
  g.fillText('GEAR', 394, 148);
  g.fillStyle = '#fff';
  g.font = mono(700, 78);
  g.textAlign = 'center';
  g.fillText(gi ? String(gi) : 'N', 437, 220);
  A.dashTex.needsUpdate = true;
}
