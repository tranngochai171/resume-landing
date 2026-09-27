import * as T from 'three';
import { CPS } from '../data';
import { canvasTex, type Fonts } from './textures';
import type { Uni } from './world';
import type { Slice } from './yield';

export type Gate = { g: T.Group; holo: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>; scan: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>; hy: number };
export type ClockHands = { h: T.Object3D; m: T.Object3D };
/** Gate materials that take the downloaded wood / disturb textures (assets.ts). */
export type GateMats = Record<'ochreL' | 'woodM', T.MeshStandardMaterial>;
export type DragonUni = { uTime: { value: number }; fogColor: { value: T.Color }; fogDensity: { value: number }; uFire: { value: number }; uHZ: { value: number } };

export type GateBits = {
  gates: Gate[];
  gateMats: GateMats;
  dragonUni: DragonUni;
  /** World position of the dragon's mouth, where its fire comes from. */
  dragonHead: T.Vector3;
  clocks: ClockHands[];
};

type Ctx = {
  rnd: () => number;
  addSign: (txt: string, col: string, vert: boolean, w: number, h: number, x: number, y: number, z: number, ry: number) => void;
  fonts: Fonts;
  uni: Uni;
};
type P3 = [number, number, number];
/** A column: x, z, base height, height, optional radius scale. */
type Col = [number, number, number, number, number?];

/**
 * The five sector gates, each a Vietnamese landmark: Ngọ Môn (Huế), Chùa Cầu (Hội An),
 * Khuê Văn Các (Hà Nội), Cầu Rồng with its fire-breathing dragon (Đà Nẵng), Chợ Bến Thành (Sài Gòn).
 */
export async function buildGates(scene: T.Scene, { rnd, addSign, fonts, uni }: Ctx, slice: Slice): Promise<GateBits> {
  const gates: Gate[] = [];
  let dragonUni: DragonUni | null = null;
  let dragonHead = new T.Vector3();
  let clocks: ClockHands[] = [];
  const DS = T.DoubleSide;
  const darkM = new T.MeshStandardMaterial({ color: 0x120e1a, roughness: 0.8 });
  const ridgeM = new T.MeshStandardMaterial({ color: 0x1c161c });
  const ochreL = new T.MeshStandardMaterial({ color: 0xc49a50, emissive: 0x2a1c0a, roughness: 0.85 });
  const woodM = new T.MeshStandardMaterial({ color: 0x4a2414, emissive: 0x140804, roughness: 0.7 });
  const gateMats: GateMats = { ochreL, woodM };
  const goldB = new T.MeshBasicMaterial({ color: new T.Color(2.4, 1.6, 0.5) }), moonM = new T.MeshBasicMaterial({ color: new T.Color(2.3, 2.2, 1.7), side: DS }), sunM = new T.MeshBasicMaterial({ color: new T.Color(2.7, 0.9, 0.3), side: DS });
  const bronzeG = new T.MeshBasicMaterial({ color: new T.Color(0.25, 0.55, 0.42) }), ceramW = new T.MeshBasicMaterial({ color: new T.Color(1, 1, 0.95) });
  const LM_ = (c: P3) => new T.LineBasicMaterial({ color: new T.Color(c[0], c[1], c[2]) });
  const lG = LM_([2.4, 1.6, 0.5]), lGr = LM_([0.4, 1.8, 0.9]), lW = LM_([2.2, 0.9, 0.4]);
  const hlG = new T.LatheGeometry([[0, -0.62], [0.24, -0.56], [0.46, -0.34], [0.54, 0], [0.46, 0.34], [0.24, 0.56], [0, 0.62]].map((a) => new T.Vector2(a[0], a[1])), 8);
  const haM = [[1.5, 1.05, 0.25], [1.5, 0.2, 0.15], [1.4, 0.3, 0.75], [0.8, 0.3, 1.4], [0.25, 0.7, 1.5], [0.3, 1.3, 0.5], [1.5, 0.65, 0.2]].map((c) => new T.MeshBasicMaterial({ color: new T.Color(c[0], c[1], c[2]) }));
  const YV = new T.Vector3(0, 1, 0);
  const m4 = new T.Matrix4(), q0 = new T.Quaternion(), vS = new T.Vector3(), vP = new T.Vector3();

  // Canvas-painted surfaces: stone blocks, glazed roof tiles, weathered plaster.
  const paint = (size: number, draw: (x: CanvasRenderingContext2D) => void) => {
    const t = canvasTex(size, size, draw);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const stoneMat = () => {
    const stT = paint(256, (sg) => {
      sg.fillStyle = '#5e5852';
      sg.fillRect(0, 0, 256, 256);
      for (let r = 0; r < 8; r++)
        for (let c = -1; c < 5; c++) {
          const x = c * 64 + (r % 2) * 32, v = 0.78 + rnd() * 0.34;
          sg.fillStyle = 'rgb(' + ((108 * v) | 0) + ',' + ((101 * v) | 0) + ',' + ((92 * v) | 0) + ')';
          sg.fillRect(x + 1, r * 32 + 1, 62, 30);
        }
      sg.strokeStyle = 'rgba(24,21,19,.95)';
      sg.lineWidth = 2.5;
      for (let r = 0; r <= 8; r++) {
        sg.beginPath();
        sg.moveTo(0, r * 32);
        sg.lineTo(256, r * 32);
        sg.stroke();
        for (let c = 0; c <= 5; c++) {
          const x = c * 64 + (r % 2) * 32;
          sg.beginPath();
          sg.moveTo(x, r * 32);
          sg.lineTo(x, r * 32 + 32);
          sg.stroke();
        }
      }
      for (let k = 0; k < 3000; k++) {
        const al = rnd() * 0.14;
        sg.fillStyle = rnd() < 0.55 ? 'rgba(0,0,0,' + al + ')' : 'rgba(255,248,235,' + al * 0.5 + ')';
        sg.fillRect(rnd() * 256, rnd() * 256, 2, 2);
      }
      for (let k = 0; k < 16; k++) {
        const x = rnd() * 256, w = 3 + rnd() * 16, gr = sg.createLinearGradient(0, 0, 0, 256);
        gr.addColorStop(0, 'rgba(14,20,14,.42)');
        gr.addColorStop(1, 'rgba(14,20,14,0)');
        sg.fillStyle = gr;
        sg.fillRect(x, 0, w, 256 * (0.25 + rnd() * 0.75));
      }
    });
    return new T.MeshStandardMaterial({ map: stT, color: 0xc4bcb2, roughness: 0.95, emissive: 0x2a2520, emissiveMap: stT });
  };
  const tileTex = (base: string) =>
    paint(64, (x) => {
      x.fillStyle = base;
      x.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 4; i++) {
        const gr = x.createLinearGradient(i * 16, 0, i * 16 + 16, 0);
        gr.addColorStop(0, 'rgba(0,0,0,.6)');
        gr.addColorStop(0.35, 'rgba(255,255,255,.22)');
        gr.addColorStop(0.6, 'rgba(255,255,255,.06)');
        gr.addColorStop(1, 'rgba(0,0,0,.6)');
        x.fillStyle = gr;
        x.fillRect(i * 16, 0, 16, 64);
      }
      for (let j = 0; j < 4; j++) {
        x.fillStyle = 'rgba(0,0,0,.3)';
        x.fillRect(0, j * 16 + 13, 64, 3);
      }
    });
  const plasterTex = (base: string) =>
    paint(256, (x) => {
      x.fillStyle = base;
      x.fillRect(0, 0, 256, 256);
      for (let k = 0; k < 2500; k++) {
        const al = rnd() * 0.1;
        x.fillStyle = rnd() < 0.6 ? 'rgba(0,0,0,' + al + ')' : 'rgba(255,250,235,' + al * 0.6 + ')';
        x.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 3, 1 + rnd() * 3);
      }
      for (let k = 0; k < 22; k++) {
        const px = rnd() * 256, w = 2 + rnd() * 14, gr = x.createLinearGradient(0, 0, 0, 256);
        gr.addColorStop(0, 'rgba(30,26,18,.34)');
        gr.addColorStop(1, 'rgba(30,26,18,0)');
        x.fillStyle = gr;
        x.fillRect(px, 0, w, 256 * (0.2 + rnd() * 0.8));
      }
      const gb = x.createLinearGradient(0, 180, 0, 256);
      gb.addColorStop(0, 'rgba(40,50,30,0)');
      gb.addColorStop(1, 'rgba(40,50,30,.35)');
      x.fillStyle = gb;
      x.fillRect(0, 180, 256, 76);
      x.strokeStyle = 'rgba(40,30,20,.35)';
      x.lineWidth = 1;
      for (let k = 0; k < 5; k++) {
        let px = rnd() * 256, py = rnd() * 256;
        x.beginPath();
        x.moveTo(px, py);
        for (let j = 0; j < 6; j++) {
          px += (rnd() - 0.5) * 18;
          py += rnd() * 14;
          x.lineTo(px, py);
        }
        x.stroke();
      }
    });
  const pMat = (base: string, em: number) => {
    const t = plasterTex(base);
    return new T.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: em, roughness: 0.95, side: DS });
  };
  const tMat = (base: string, em: number) => {
    const t = tileTex(base);
    return new T.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: em, roughness: 0.4, metalness: 0.1, side: DS });
  };
  const yT = tileTex('#d9a21e'), gT = tileTex('#2e8058');
  const yTile = new T.MeshStandardMaterial({ map: yT, emissiveMap: yT, emissive: 0x6a5838, roughness: 0.3, metalness: 0.15, side: DS });
  const gTile = new T.MeshStandardMaterial({ map: gT, emissiveMap: gT, emissive: 0x405a4c, roughness: 0.3, metalness: 0.15, side: DS });
  const redLac = new T.MeshStandardMaterial({ color: 0x8e1c12, emissive: 0x3a0806, roughness: 0.45 });
  const panelM = new T.MeshStandardMaterial({ color: 0x9a6a2a, emissive: 0x2a1806, roughness: 0.7 });
  const soffit = new T.MeshBasicMaterial({ color: new T.Color(0.09, 0.03, 0.025), side: DS });
  const woodDk = new T.MeshStandardMaterial({ color: 0x3a1c12, emissive: 0x140604, roughness: 0.7 });
  /** Round-headed doorway silhouette, `r` wide each side, springing at `h`. */
  const doorGeo = (r: number, h: number) => {
    const s = new T.Shape();
    s.moveTo(-r, 0);
    s.lineTo(-r, h);
    s.absarc(0, h, r, Math.PI, 0, true);
    s.lineTo(r, 0);
    s.lineTo(-r, 0);
    return new T.ShapeGeometry(s);
  };
  const DIRS: P3[] = [[0, 1, 0], [0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]];

  for (const cp of CPS) {
    await slice();
    const g = new T.Group();
    g.position.z = cp.z;
    const zf = 5.06;
    let hy = 31;
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, mt: T.Material, par?: T.Object3D) => {
      const b = new T.Mesh(new T.BoxGeometry(w, h, d), mt);
      b.position.set(x, y, z);
      (par || g).add(b);
      return b;
    };
    const poly = (pts: P3[], lm: T.LineBasicMaterial) => g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts.map((a) => new T.Vector3(a[0], a[1], a[2]))), lm));
    const arch = (cx: number, w: number, h: number, z: number, lm: T.LineBasicMaterial) => {
      const r = w / 2, sp = h - r * 0.6, pts: P3[] = [[cx - r, 0.2, z], [cx - r, sp, z]];
      for (let k = 0; k <= 24; k++) {
        const a = Math.PI - (k / 24) * Math.PI;
        pts.push([cx + Math.cos(a) * r, sp + Math.sin(a) * r * 0.6, z]);
      }
      pts.push([cx + r, 0.2, z]);
      poly(pts, lm);
    };
    const lantern = (x: number, y: number, z: number) => {
      const mt = haM[(rnd() * haM.length) | 0];
      const l = new T.Mesh(hlG, mt);
      l.position.set(x, y, z);
      l.scale.setScalar(1.2);
      g.add(l);
      box(0.06, 0.6, 0.06, x, y - 1.05, z, mt);
    };
    const tube = (pts: T.Vector3[], r: number, mt: T.Material) =>
      g.add(new T.Mesh(new T.TubeGeometry(pts.length === 3 ? new T.QuadraticBezierCurve3(pts[0], pts[1], pts[2]) : new T.CatmullRomCurve3(pts), 12, r, 5), mt));
    const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
    const longMoon = (x: number, y: number, z: number, span: number, kind: string) => {
      const disc = new T.Mesh(new T.CircleGeometry(0.75, 24), kind === 'sun' ? sunM : moonM);
      disc.position.set(x, y + 1.15, z);
      g.add(disc);
      for (const sd of [-1, 1])
        tube([[1, 0], [0.75, 0.9], [0.5, 0.35], [0.28, 1.1], [0.02, 1.2]].map((a) => V(x + sd * (a[0] * span + (a[0] < 0.1 ? 0.95 : 0)), y + a[1], z)), 0.16, goldB);
    };
    const sunWindow = (x: number, y: number, z: number, ry: number) => {
      const gr = new T.Group();
      gr.position.set(x, y, z);
      gr.rotation.y = ry;
      g.add(gr);
      gr.add(new T.Mesh(new T.TorusGeometry(2.3, 0.16, 8, 48), goldB));
      for (let k = 0; k < 8; k++) {
        const sp = box(4.5, 0.1, 0.1, 0, 0, 0.02, goldB, gr);
        sp.rotation.z = (k * Math.PI) / 8;
      }
    };
    // Every gate paints its own stone (the design's draw order, so the seeded city stays the same).
    const stone = stoneMat();
    await slice();
    // Box whose UVs are world-scaled (4 units per texture repeat) so the stone courses line up across blocks.
    const SW = 4;
    const sbox = (w: number, h: number, d: number, x: number, y: number, z: number, mt: T.Material = stone) => {
      const geo = new T.BoxGeometry(w, h, d), uv = geo.attributes.uv, dims = [[d, h, z], [d, h, z], [w, d, x], [w, d, x], [w, h, x], [w, h, x]];
      for (let f = 0; f < 6; f++)
        for (let k = 0; k < 4; k++) {
          const i = f * 4 + k, D = dims[f];
          uv.setXY(i, (uv.getX(i) * D[0] + D[2] - D[0] / 2) / SW, f === 2 || f === 3 ? (uv.getY(i) * D[1]) / SW : (uv.getY(i) * h + y - h / 2) / SW);
        }
      const o = new T.Mesh(geo, mt);
      o.position.set(x, y, z);
      g.add(o);
      return o;
    };
    // Hip-and-gable roof: dark soffit underneath, gold upturned eave tips, optional moon/sun ridge ornament.
    const tRoof = (W: number, D: number, H: number, x: number, y: number, z: number, mt: T.Material, lm: T.LineBasicMaterial, orn?: string) => {
      const hw = W / 2, hd = D / 2, rw = Math.max(0.5, hw - hd * 0.9), k = Math.min(0.7, Math.max(0.5, W / 30));
      const A: P3 = [-hw, 0, hd], B: P3 = [hw, 0, hd], C: P3 = [hw, 0, -hd], E: P3 = [-hw, 0, -hd], R1: P3 = [-rw, H, 0], R2: P3 = [rw, H, 0];
      const P: number[] = [], U: number[] = [];
      ([[A, B, R2, 0], [A, R2, R1, 0], [C, E, R1, 0], [C, R1, R2, 0], [E, A, R1, 1], [B, C, R2, 1]] as [P3, P3, P3, number][]).forEach(([a, b, c, hip]) => {
        for (const p of [a, b, c]) {
          P.push(p[0], p[1], p[2]);
          U.push((hip ? p[2] : p[0]) / 1.8, (hip ? hw - Math.abs(p[0]) : hd - Math.abs(p[2])) / 1.8);
        }
      });
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(P, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
      geo.computeVertexNormals();
      const r = new T.Mesh(geo, mt);
      r.position.set(x, y, z);
      g.add(r);
      const bot = new T.Mesh(new T.PlaneGeometry(W, D), soffit);
      bot.rotation.x = -Math.PI / 2;
      bot.position.set(x, y + 0.02, z);
      g.add(bot);
      const e = new T.LineSegments(new T.EdgesGeometry(geo), lm);
      e.position.set(x, y, z);
      g.add(e);
      box(rw * 2 + 0.8, 0.4, 0.45, x, y + H + 0.12, z, ridgeM);
      [A, B, C, E].forEach((c) => {
        const sx = Math.sign(c[0]), sz = Math.sign(c[2]);
        tube([V(x + c[0], y + 0.05, z + c[2]), V(x + c[0] + sx * 0.9 * k, y - 0.05, z + c[2] + sz * 0.9 * k), V(x + c[0] + sx * 1.3 * k, y + 1.3 * k, z + c[2] + sz * 1.3 * k)], 0.13 * k, goldB);
      });
      for (const sd of [-1, 1]) tube([V(x + sd * rw, y + H + 0.2, z), V(x + sd * (rw + 0.7 * k), y + H + 0.3, z), V(x + sd * (rw + 0.8 * k), y + H + 1.2 * k, z)], 0.12 * k, goldB);
      if (orn) longMoon(x, y + H + 0.3, z, Math.max(2, Math.min(rw, 3.5)), orn);
    };
    // Columns and balustrade posts are collected, then drawn as two InstancedMeshes by flush().
    const cols: Col[] = [], posts: [number, number][] = [];
    const colRow = (x0: number, x1: number, n: number, z: number, y0: number, h: number) => {
      for (let k = 0; k < n; k++) cols.push([x0 + ((x1 - x0) * k) / (n - 1), z, y0, h]);
    };
    const postRun = (x0: number, z0: number, x1: number, z1: number) => {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.25));
      for (let k = 0; k <= n; k++) posts.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n]);
      const rl = Math.atan2(z1 - z0, x1 - x0);
      for (const [yy, hh] of [[12.25, 0.2], [11.5, 0.18]]) {
        const bx = box(L, hh, 0.22, (x0 + x1) / 2, yy, (z0 + z1) / 2, ochreL);
        bx.rotation.y = -rl;
      }
    };
    const flush = (cm: T.Material = redLac) => {
      if (cols.length) {
        const im = new T.InstancedMesh(new T.CylinderGeometry(0.26, 0.3, 1, 10), cm, cols.length);
        cols.forEach(([x, z, y0, h, r], i) => {
          m4.compose(vP.set(x, y0 + h / 2, z), q0, vS.set(r || 1, h, r || 1));
          im.setMatrixAt(i, m4);
        });
        g.add(im);
      }
      if (posts.length) {
        const pm = new T.InstancedMesh(new T.BoxGeometry(0.26, 1, 0.26), ochreL, posts.length);
        posts.forEach(([x, z], i) => {
          m4.compose(vP.set(x, 11.85, z), q0, vS.set(1, 1, 1));
          pm.setMatrixAt(i, m4);
        });
        g.add(pm);
      }
    };
    const inst = (geo: T.BufferGeometry, mt: T.Material, arr: P3[]) => {
      const im = new T.InstancedMesh(geo, mt, arr.length);
      arr.forEach((a, i) => {
        m4.compose(vP.set(a[0], a[1], a[2]), q0, vS.set(1, 1, 1));
        im.setMatrixAt(i, m4);
      });
      g.add(im);
      return im;
    };
    // Long gable roof along x whose eave follows yE(x) (the arched bridge), with flared slopes and gable ends.
    const gableRoof = (par: T.Object3D, x0: number, x1: number, yE: (x: number) => number, rise: number, hw: number, mt: T.Material, n: number, lm: T.LineBasicMaterial | null, gm: T.Material | null, ends = [true, true]) => {
      const NS = 6, cn = n + 1, P: number[] = [], U: number[] = [], I: number[] = [], slope = Math.hypot(hw, rise), fo = (t: number) => 1 - Math.pow(1 - t, 1.5);
      for (const sd of [-1, 1]) {
        const b0 = P.length / 3;
        for (let j = 0; j <= NS; j++) {
          const t = j / NS, f = fo(t);
          for (let i = 0; i <= n; i++) {
            const x = x0 + ((x1 - x0) * i) / n;
            P.push(x, yE(x) + rise * (1 - f), sd * hw * t);
            U.push(x / 1.8, (t * slope) / 1.8);
          }
        }
        for (let j = 0; j < NS; j++)
          for (let i = 0; i < n; i++) {
            const a = b0 + j * cn + i;
            I.push(a, a + 1, a + cn, a + 1, a + cn + 1, a + cn);
          }
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(P, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
      geo.setIndex(I);
      geo.computeVertexNormals();
      par.add(new T.Mesh(geo, mt));
      const so = new T.Mesh(geo, soffit);
      so.position.y = -0.16;
      par.add(so);
      for (let i = 0; i < n; i++) {
        const xa = x0 + ((x1 - x0) * i) / n, xb = x0 + ((x1 - x0) * (i + 1)) / n, ya = yE(xa) + rise, yb = yE(xb) + rise;
        const r = box(Math.hypot(xb - xa, yb - ya) + 0.04, 0.45, 0.55, (xa + xb) / 2, (ya + yb) / 2 + 0.15, 0, ridgeM, par);
        r.rotation.z = Math.atan2(yb - ya, xb - xa);
      }
      if (lm) {
        const L = (pts: T.Vector3[]) => par.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), lm)),
          xs = Array.from({ length: n + 1 }, (_, i) => x0 + ((x1 - x0) * i) / n);
        for (const sd of [-1, 1]) L(xs.map((x) => V(x, yE(x) - 0.02, sd * hw)));
        L(xs.map((x) => V(x, yE(x) + rise + 0.4, 0)));
      }
      [x0, x1].forEach((xe, k) => {
        if (gm && ends[k]) {
          const xin = xe + (k ? -0.6 : 0.6), sh = new T.Shape(), pts: [number, number][] = [];
          for (let j = 0; j <= 10; j++) {
            const t = 0.84 * (1 - j / 10);
            pts.push([-hw * t, rise * (1 - fo(t)) - 0.08]);
          }
          for (let j = 1; j <= 10; j++) {
            const t = (0.84 * j) / 10;
            pts.push([hw * t, rise * (1 - fo(t)) - 0.08]);
          }
          pts.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
          sh.lineTo(-hw * 0.84, rise * (1 - fo(0.84)) - 0.08);
          const tri = new T.Mesh(new T.ShapeGeometry(sh), gm);
          tri.rotation.y = k ? Math.PI / 2 : -Math.PI / 2;
          tri.position.set(xin, yE(xin), 0);
          par.add(tri);
        }
        if (par === g)
          for (const sz of [-1, 1]) {
            const ye = yE(xe), sx = k ? 1 : -1;
            tube([V(xe, ye, sz * hw), V(xe + sx * 0.55, ye + 0.05, sz * (hw + 0.45)), V(xe + sx * 0.75, ye + 0.85, sz * (hw + 0.65))], 0.1, goldB);
          }
      });
    };
    const door = (r: number, h: number, x: number, y: number, z: number, back = false) => {
      const dm = new T.Mesh(doorGeo(r, h), darkM);
      dm.position.set(x, y, z);
      if (back) dm.rotation.y = Math.PI;
      g.add(dm);
    };

    if (cp.id === 'about') {
      // Ngọ Môn: U-shaped stone base (main body + two forward wings), the two-storey Lầu Ngũ Phụng on top.
      for (const sx of [-1, 1]) {
        sbox(15, 11, 10, sx * 21.5, 5.5, 0);
        sbox(15.6, 1, 10.6, sx * 21.5, 0.5, 0);
        sbox(2.5, 11, 10, sx * 7.75, 5.5, 0);
        sbox(5, 4, 10, sx * 11.5, 9, 0);
        sbox(7, 11, 14, sx * 25.5, 5.5, 12);
        sbox(7.6, 1, 14.6, sx * 25.5, 0.5, 12);
        sbox(7.6, 0.5, 14.6, sx * 25.5, 11.15, 12, ridgeM);
        box(5, 7, 0.3, sx * 11.5, 3.5, -1.5, darkM);
        box(0.2, 7, 10, sx * 9.05, 3.5, 0, darkM);
        box(0.2, 7, 10, sx * 13.95, 3.5, 0, darkM);
        poly([[sx * 9, 0.2, zf], [sx * 9, 7, zf], [sx * 14, 7, zf], [sx * 14, 0.2, zf]], lW);
        door(1.8, 4.2, sx * 25.5, 0.1, 19.03);
        arch(sx * 25.5, 3.6, 6.1, 19.07, lW);
        box(0.25, 8.3, 3.2, sx * 6.3, 4.15, -3.3, redLac);
        for (let k = 0; k < 5; k++)
          for (let j = 0; j < 2; j++) {
            const st = new T.Mesh(new T.SphereGeometry(0.09, 6, 4), goldB);
            st.position.set(sx * 6.15, 1.2 + k * 1.5, -4.3 + j * 2);
            g.add(st);
          }
      }
      sbox(13, 2.5, 10, 0, 9.75, 0);
      sbox(58.6, 0.5, 10.6, 0, 11.15, 0, ridgeM);
      poly([[-6.5, 0.2, zf], [-6.5, 8.5, zf], [6.5, 8.5, zf], [6.5, 0.2, zf]], lG);
      poly([[-22, 11.45, zf + 0.25], [22, 11.45, zf + 0.25]], lG);
      // Warm floodlight pools washing up the stone.
      const flT = canvasTex(128, 256, (fg) => {
        const rg = fg.createRadialGradient(64, 262, 4, 64, 262, 250);
        rg.addColorStop(0, 'rgba(255,196,120,.9)');
        rg.addColorStop(0.45, 'rgba(255,150,80,.28)');
        rg.addColorStop(1, 'rgba(255,120,60,0)');
        fg.fillStyle = rg;
        fg.fillRect(0, 0, 128, 256);
      });
      const flM = new T.MeshBasicMaterial({ map: flT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.55 });
      [[-24, 5.07, 9], [-17, 5.07, 6], [-7.75, 5.07, 2.4], [7.75, 5.07, 2.4], [17, 5.07, 6], [24, 5.07, 9], [-25.5, 19.07, 7], [25.5, 19.07, 7]].forEach(([x, z, w]) => {
        const p = new T.Mesh(new T.PlaneGeometry(w, 11), flM);
        p.position.set(x, 5.5, z);
        g.add(p);
      });
      // Glazed balustrade around the platform.
      postRun(-22.3, 4.7, 22.3, 4.7);
      postRun(-28.7, -4.7, 28.7, -4.7);
      for (const sx of [-1, 1]) {
        postRun(sx * 22.3, 4.7, sx * 22.3, 18.7);
        postRun(sx * 22.3, 18.7, sx * 28.7, 18.7);
        postRun(sx * 28.7, 18.7, sx * 28.7, -4.7);
      }
      // Lầu Ngũ Phụng, lower storey.
      box(41, 0.3, 7.6, 0, 11.55, 0, woodM);
      colRow(-19.6, 19.6, 17, 3.3, 11.7, 3.7);
      colRow(-19.6, 19.6, 17, -3.3, 11.7, 3.7);
      box(39.2, 3.3, 0.2, 0, 13.4, 2.45, panelM);
      box(39.2, 3.3, 0.2, 0, 13.4, -2.45, panelM);
      const lat: number[] = [];
      for (let k = 0; k < 16; k++) {
        const x0 = -19.6 + k * 2.45 + 0.4, x1 = x0 + 1.65;
        if (k === 7 || k === 8) continue;
        lat.push(x0, 12.3, 2.57, x1, 12.3, 2.57, x1, 12.3, 2.57, x1, 14.3, 2.57, x1, 14.3, 2.57, x0, 14.3, 2.57, x0, 14.3, 2.57, x0, 12.3, 2.57, (x0 + x1) / 2, 12.3, 2.57, (x0 + x1) / 2, 14.3, 2.57);
      }
      const lg = new T.BufferGeometry();
      lg.setAttribute('position', new T.Float32BufferAttribute(lat, 3));
      g.add(new T.LineSegments(lg, lW));
      box(4.2, 2.8, 0.1, 0, 13.3, 2.58, darkM);
      box(41.2, 0.55, 7.2, 0, 15.45, 0, redLac);
      addSign('NGỌ MÔN', '#ffc53d', false, 4.2, 1.2, 0, 14.35, cp.z + 3.62, 0);
      tRoof(46, 11.5, 2.2, 0, 15.6, 0, gTile, lGr);
      // Upper storey: the imperial-yellow centre pavilion flanked by green ones.
      box(11, 3.4, 5.4, 0, 18.7, 0, panelM);
      colRow(-5.3, 5.3, 5, 2.85, 17, 3.4);
      colRow(-5.3, 5.3, 5, -2.85, 17, 3.4);
      box(11.4, 0.4, 5.8, 0, 20.35, 0, redLac);
      tRoof(15, 9, 1.6, 0, 20.4, 0, yTile, lG);
      box(8, 1.6, 4.2, 0, 22.4, 0, panelM);
      colRow(-3.8, 3.8, 4, 2.15, 21.6, 1.6);
      tRoof(11, 6.6, 2.6, 0, 23.1, 0, yTile, lG, 'moon');
      for (const sx of [-1, 1]) {
        box(7, 2.6, 4.6, sx * 12, 18.5, 0, panelM);
        colRow(sx * 9, sx * 15, 4, 2.45, 17.2, 2.6);
        box(7.4, 0.35, 5, sx * 12, 19.85, 0, redLac);
        tRoof(10, 7.6, 1.3, sx * 12, 19.9, 0, gTile, lGr);
        box(4.5, 1.2, 3.4, sx * 12, 21.6, 0, panelM);
        tRoof(7.6, 5.6, 2, sx * 12, 22.1, 0, gTile, lGr);
        box(4, 2, 4, sx * 18.3, 18.2, 0, panelM);
        tRoof(5.8, 6, 1.6, sx * 18.3, 19.1, 0, gTile, lGr);
        // Wing pavilions over the U arms.
        box(5.2, 3, 5.2, sx * 25.5, 13, 14.5, panelM);
        for (const cx of [-2.6, 0, 2.6]) for (const cz of [-2.6, 2.6]) cols.push([sx * 25.5 + cx, 14.5 + cz, 11.4, 3.3]);
        box(5.6, 0.4, 5.6, sx * 25.5, 14.75, 14.5, redLac);
        tRoof(8.5, 8.5, 1.5, sx * 25.5, 14.9, 14.5, gTile, lGr);
        box(3.4, 1.4, 3.4, sx * 25.5, 17, 14.5, panelM);
        tRoof(6, 6, 2.2, sx * 25.5, 17.6, 14.5, gTile, lGr);
      }
      flush();
      [-15, -9, -3, 3, 9, 15].forEach((x) => lantern(x, 14.2, 5.2));
      lantern(-25.5, 13.6, 17.8);
      lantern(25.5, 13.6, 17.8);
      hy = 32;
    } else if (cp.id === 'work') {
      // Chùa Cầu: the arched covered bridge on stone piers, with its little temple jutting out of the middle.
      const XL = 19, yD = (x: number) => 8.9 + 1.2 * (1 - (x / XL) ** 2), yD0 = yD(0);
      const bTile = tMat('#8c4c2e', 0x3a2418), yWall = pMat('#d9a93e', 0x3a2c10);
      for (const sx of [-1, 1]) {
        sbox(6.4, 9.2, 7, sx * 16.4, 4.6, 0);
        sbox(7, 0.6, 7.6, sx * 16.4, 0.3, 0);
        for (const sz of [-1, 1]) door(1.3, 2.6, sx * 16.4, 0.6, sz * 3.52, sz < 0);
        arch(sx * 16.4, 2.6, 4.6, 3.56, lW);
      }
      const NSg = 20;
      for (let k = 0; k < NSg; k++) {
        const x0 = -XL + (2 * XL * k) / NSg, x1 = -XL + (2 * XL * (k + 1)) / NSg, xm = (x0 + x1) / 2, y0 = yD(x0), y1 = yD(x1), ym = (y0 + y1) / 2, len = Math.hypot(x1 - x0, y1 - y0) + 0.05, ang = Math.atan2(y1 - y0, x1 - x0);
        const rz = (o: T.Mesh) => (o.rotation.z = ang);
        rz(box(len, 0.9, 5.4, xm, ym - 0.45, 0, woodDk));
        rz(box(len, 0.25, 5.2, xm, ym + 0.12, 0, woodM));
        for (const sz of [-1, 1]) {
          if (sz > 0 && Math.abs(xm) < 3.6) continue;
          rz(box(len, 1.0, 0.15, xm, ym + 0.7, sz * 2.55, panelM));
        }
        for (const sz of [-1, 1]) rz(box(len, 0.5, 0.36, xm, ym + 3.4, sz * 2.55, woodDk));
      }
      poly(
        Array.from({ length: 31 }, (_, i): P3 => {
          const x = -XL + (2 * XL * i) / 30;
          return [x, yD(x) - 0.92, 2.72];
        }),
        lW,
      );
      for (let x = -18; x <= 18.01; x += 1.9) box(0.3, 0.35, 5.6, x, yD(x) - 1.05, 0, woodDk);
      for (let x = -18; x <= 18.01; x += 2.25)
        for (const sz of [-1, 1]) {
          if (sz > 0 && Math.abs(x) < 3.4) continue;
          cols.push([x, sz * 2.55, yD(x), 3.2]);
        }
      gableRoof(g, -XL - 1.2, XL + 1.2, (x) => yD(x) + 3.35, 2.1, 3.7, bTile, 36, lW, yWall);
      // The temple that juts out of the bridge.
      sbox(6.8, 3.1, 5, 0, yD0 + 1.55, 5.1, yWall);
      box(7.6, 0.6, 5.8, 0, yD0 - 0.3, 5.1, woodDk);
      for (const sx of [-1, 1]) tube([V(sx * 3, yD0 - 2.6, 2.7), V(sx * 3, yD0 - 0.6, 3.2), V(sx * 3, yD0 - 0.55, 7.6)], 0.2, woodDk);
      box(3.2, 2.6, 0.14, 0, yD0 + 1.3, 7.62, redLac);
      for (let x = -1.4; x <= 1.41; x += 0.4) poly([[x, yD0 + 0.1, 7.7], [x, yD0 + 2.55, 7.7]], lW);
      for (const sx of [-1, 1]) {
        const wx = sx * 2.35;
        box(1.1, 1.1, 0.1, wx, yD0 + 1.9, 7.62, darkM);
        poly([[wx - 0.55, yD0 + 1.35, 7.68], [wx + 0.55, yD0 + 1.35, 7.68], [wx + 0.55, yD0 + 2.45, 7.68], [wx - 0.55, yD0 + 2.45, 7.68], [wx - 0.55, yD0 + 1.35, 7.68]], lW);
      }
      const pent = box(7.9, 0.16, 1.7, 0, yD0 + 3.05, 8.25, bTile);
      pent.rotation.x = 0.38;
      const tg = new T.Group();
      tg.rotation.y = Math.PI / 2;
      g.add(tg);
      gableRoof(tg, -8.9, -0.5, () => yD0 + 3.0, 1.9, 4.3, bTile, 8, lW, yWall, [true, false]);
      addSign('LAI VIỄN KIỀU', '#ffc53d', false, 4.2, 0.85, 0, yD0 + 3.75, cp.z + 8.42, 0);
      addSign('CHÙA CẦU', '#ffc53d', false, 5, 1.15, 0, yD0 - 1.2, cp.z + 8.02, 0);
      for (let x = -15; x <= 15.01; x += 3)
        for (const sz of [-1, 1]) {
          if (sz > 0 && Math.abs(x) < 4.8) continue;
          lantern(x, yD(x) + 2.45, sz * 3.15);
        }
      lantern(-2.6, yD0 + 2.2, 8.5);
      lantern(2.6, yD0 + 2.2, 8.5);
      flush(woodDk);
      hy = 24;
    } else if (cp.id === 'ledger') {
      // Khuê Văn Các: four white-plastered pillars, a balustraded terrace, the red pavilion with four sun windows.
      const dTile = tMat('#76503e', 0x2a1a14), wWall = pMat('#d8d0bf', 0x2c2a26), pShade = pMat('#b8ae9a', 0x221f1a), oWall = pMat('#bca57a', 0x2a2214);
      const PX = 12, PZ = 9;
      for (const x of [-PX, PX])
        for (const z of [-PZ, PZ]) {
          sbox(4.2, 1.2, 4.2, x, 0.6, z);
          sbox(3.4, 0.5, 3.4, x, 1.45, z, wWall);
          sbox(2.8, 10.6, 2.8, x, 7, z, wWall);
          sbox(3.4, 0.5, 3.4, x, 12.55, z, wWall);
          sbox(3.8, 0.45, 3.8, x, 13.02, z, wWall);
          for (const [dx, dz, ry] of [[0, 1, 0], [0, -1, 0], [1, 0, Math.PI / 2], [-1, 0, Math.PI / 2]]) {
            const pn = box(1.9, 8.2, 0.1, x + dx * 1.43, 7.2, z + dz * 1.43, pShade);
            pn.rotation.y = ry;
          }
        }
      for (const z of [-PZ, PZ]) box(2 * PX + 3.8, 1.1, 1.6, 0, 13.8, z, redLac);
      for (const x of [-PX, PX]) box(1.6, 1.1, 2 * PZ + 3.8, x, 13.8, 0, redLac);
      box(29, 0.5, 25, 0, 14.6, 0, woodDk);
      const sof = new T.Mesh(new T.PlaneGeometry(29, 25), soffit);
      sof.rotation.x = -Math.PI / 2;
      sof.position.y = 14.33;
      g.add(sof);
      const bal: P3[] = [];
      for (let x = -14.1; x <= 14.11; x += 0.7) bal.push([x, 15.35, 12.1], [x, 15.35, -12.1]);
      for (let z = -11.4; z <= 11.41; z += 0.7) bal.push([14.1, 15.35, z], [-14.1, 15.35, z]);
      inst(new T.BoxGeometry(0.14, 1, 0.14), redLac, bal);
      for (const y of [14.95, 15.88]) {
        for (const z of [-12.1, 12.1]) box(28.4, 0.16, 0.2, 0, y, z, redLac);
        for (const x of [-14.1, 14.1]) box(0.2, 0.16, 24.4, x, y, 0, redLac);
      }
      poly([[-14.2, 15.98, 12.2], [14.2, 15.98, 12.2], [14.2, 15.98, -12.2], [-14.2, 15.98, -12.2], [-14.2, 15.98, 12.2]], lW);
      const by0 = 14.85, BH = 6.6;
      box(16, BH, 16, 0, by0 + BH / 2, 0, redLac);
      box(16.5, 0.6, 16.5, 0, by0 + BH - 0.3, 0, woodDk);
      const latP: number[] = [];
      for (let x = -1.6; x <= 1.61; x += 0.4) latP.push(x, -2.2, 0, x, 2.2, 0);
      for (let y = -2.2; y <= 2.21; y += 0.55) latP.push(-1.6, y, 0, 1.6, y, 0);
      const latG = new T.BufferGeometry();
      latG.setAttribute('position', new T.Float32BufferAttribute(latP, 3));
      const lWd = LM_([0.5, 0.24, 0.1]);
      for (const [nx, nz, ry] of DIRS) {
        for (const off of [-5.9, 5.9]) {
          const px = nz ? off : nx * 8.08, pz = nz ? nz * 8.08 : off;
          const pn = box(3.4, 4.6, 0.12, px, by0 + 2.9, pz, panelM);
          pn.rotation.y = ry;
          const ln = new T.LineSegments(latG, lWd);
          ln.position.set(px + nx * 0.08, by0 + 2.9, pz + nz * 0.08);
          ln.rotation.y = ry;
          g.add(ln);
        }
        const dk = new T.Mesh(new T.CircleGeometry(2.25, 32), darkM);
        dk.position.set(nx * 8.04, by0 + 2.9, nz * 8.04);
        dk.rotation.y = ry;
        g.add(dk);
        sunWindow(nx * 8.1, by0 + 2.9, nz * 8.1, ry);
        for (const t of [-8, -3.9, 3.9]) cols.push([nz ? t : nx * 8, nz ? nz * 8 : t, by0, BH, 1.35]);
      }
      addSign('KHUÊ VĂN CÁC', '#ffc53d', false, 7, 1.2, 0, 13.8, cp.z + 9.86, 0);
      tRoof(24, 24, 2.2, 0, by0 + BH - 0.1, 0, dTile, lG);
      box(10, 3, 10, 0, 23.5, 0, redLac);
      box(10.4, 0.4, 10.4, 0, 24.85, 0, woodDk);
      for (const [nx, nz, ry] of DIRS) {
        const ln = new T.LineSegments(latG, lWd);
        ln.scale.set(1.6, 0.5, 1);
        ln.position.set(nx * 5.06, 23.4, nz * 5.06);
        ln.rotation.y = ry;
        g.add(ln);
      }
      tRoof(16, 16, 3, 0, 24.9, 0, dTile, lG, 'moon');
      // Side gates and the low courtyard walls.
      for (const sx of [-1, 1]) {
        sbox(6, 6.4, 2.6, sx * 22, 3.2, 0, oWall);
        for (const sz of [-1, 1]) door(1.2, 2.8, sx * 22, 0.05, sz * 1.32, sz < 0);
        arch(sx * 22, 2.4, 4.4, 1.36, lW);
        tRoof(8.2, 4.6, 1.5, sx * 22, 6.4, 0, dTile, lGr);
        sbox(4.8, 3.4, 0.9, sx * 16.6, 1.7, 0, oWall);
        box(5, 0.35, 1.3, sx * 16.6, 3.57, 0, dTile);
        sbox(14, 3.4, 0.9, sx * 32, 1.7, 0, oWall);
        box(14.2, 0.35, 1.3, sx * 32, 3.57, 0, dTile);
      }
      [-9, -3, 3, 9].forEach((x) => lantern(x, 13.3, 12.2));
      flush(redLac);
      hy = 36;
    } else if (cp.id === 'stack') {
      const d = await buildDragon(g, cp.z, uni, { V, YV, DS }, slice);
      dragonUni = d.uni;
      dragonHead = d.head;
      hy = 34;
    } else {
      // Chợ Bến Thành: cream facade with the great arched entrance, the clock tower, red-tiled market halls.
      const cream = pMat('#e6d493', 0x3a3214), trimW = new T.MeshStandardMaterial({ color: 0xf2ecd8, emissive: 0x302c22, roughness: 0.8 });
      const redT = tMat('#b8442a', 0x401810), orT = tMat('#d27234', 0x442008), teal = new T.MeshStandardMaterial({ color: 0x3a9a9a, emissive: 0x0c2a2a, roughness: 0.5 });
      const ventM = new T.MeshBasicMaterial({ color: new T.Color(0.55, 0.8, 0.95) }), posterM = new T.MeshBasicMaterial({ color: new T.Color(0.95, 0.2, 0.25) });
      const AW = 8, PH = 18, FZ = 5;
      for (const sx of [-1, 1]) box(7, PH, 10, sx * 11.5, PH / 2, 0, cream);
      const spS = new T.Shape();
      spS.moveTo(-AW, AW);
      spS.lineTo(-AW, PH);
      spS.lineTo(AW, PH);
      spS.lineTo(AW, AW);
      spS.absarc(0, AW, AW, 0, Math.PI, false);
      const sp = new T.Mesh(new T.ExtrudeGeometry(spS, { depth: 10, bevelEnabled: false, curveSegments: 32 }), cream);
      sp.position.z = -5;
      g.add(sp);
      const av = new T.Mesh(new T.TorusGeometry(AW + 0.3, 0.35, 8, 40, Math.PI), trimW);
      av.position.set(0, AW, FZ + 0.05);
      g.add(av);
      box(1.2, 1.6, 0.5, 0, AW * 2 + 0.3, FZ + 0.1, trimW);
      const ap: P3[] = [[-AW, 0.2, FZ + 0.12], [-AW, AW, FZ + 0.12]];
      for (let k = 0; k <= 32; k++) {
        const an = Math.PI - (k / 32) * Math.PI;
        ap.push([Math.cos(an) * AW, AW + Math.sin(an) * AW, FZ + 0.12]);
      }
      ap.push([AW, 0.2, FZ + 0.12]);
      poly(ap, lW);
      [-14.6, -8.6, 8.6, 14.6].forEach((x) => box(0.9, PH, 0.4, x, PH / 2, FZ + 0.15, trimW));
      box(31.4, 0.7, 11, 0, PH + 0.35, 0, trimW);
      box(30.6, 0.35, 10.6, 0, PH - 1.2, 0, trimW);
      for (const sx of [-1, 1]) {
        box(2, 2.6, 0.2, sx * 11.6, 12.5, FZ + 0.12, bronzeG);
        box(1.1, 1.5, 0.22, sx * 11.6, 12.5, FZ + 0.14, ceramW);
        box(1.6, 1.6, 0.2, sx * 11.6, 5.5, FZ + 0.12, bronzeG);
      }
      const TB = PH + 0.7, TT = 36, TW = 10;
      box(TW, TT - TB, 9, 0, (TB + TT) / 2, 0, cream);
      for (const sx of [-1, 1]) for (const fz of [1, -1]) box(0.8, TT - TB, 0.8, sx * (TW / 2 - 0.2), (TB + TT) / 2, fz * 4.4, trimW);
      box(TW + 0.6, 0.45, 9.6, 0, 23.4, 0, trimW);
      box(TW + 0.9, 0.6, 9.9, 0, TT, 0, trimW);
      addSign('CHỢ BẾN THÀNH', '#ffc53d', false, 13, 2.2, 0, 21.2, cp.z + FZ - 0.3 + 0.12, 0);
      for (const sx of [-1, 1]) box(1.2, 8.4, 0.2, sx * 3.3, 29.4, 4.56, trimW);
      const clock = (px: number, py: number, pz: number, ry: number): ClockHands => {
        const gr = new T.Group();
        gr.position.set(px, py, pz);
        gr.rotation.y = ry;
        g.add(gr);
        gr.add(new T.Mesh(new T.CircleGeometry(2.3, 40), new T.MeshBasicMaterial({ color: new T.Color(0.35, 0.72, 1.0) })));
        gr.add(new T.Mesh(new T.TorusGeometry(2.4, 0.22, 6, 48), trimW));
        const hm = new T.MeshBasicMaterial({ color: new T.Color(1.6, 1.6, 1.6) });
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          const tk = box(0.14, 0.45, 0.04, Math.sin(a) * 1.9, Math.cos(a) * 1.9, 0.03, hm, gr);
          tk.rotation.z = -a;
        }
        const hand = (len: number, th: number, z: number) => {
          const pv = new T.Group();
          pv.position.z = z;
          box(th, len, 0.05, 0, len / 2, 0, hm, pv);
          gr.add(pv);
          return pv;
        };
        return { h: hand(1.3, 0.24, 0.06), m: hand(1.95, 0.14, 0.09) };
      };
      clocks = [clock(0, 29.4, 4.56, 0), clock(-5.06, 29.4, 0, -Math.PI / 2), clock(5.06, 29.4, 0, Math.PI / 2)];
      box(TW - 0.4, 2.4, 8.6, 0, TT + 1.5, 0, cream);
      box(6, 0.9, 0.2, 0, TT + 1.5, 4.36, bronzeG);
      for (const sx of [-1, 1]) box(0.7, 2.4, 0.6, sx * 4.4, TT + 1.5, 4.2, trimW);
      const rfG = new T.ConeGeometry(9.4, 3.2, 4, 1);
      const rf = new T.Mesh(rfG, orT);
      rf.rotation.y = Math.PI / 4;
      rf.position.y = TT + 2.7 + 1.6;
      g.add(rf);
      const rfE = new T.LineSegments(new T.EdgesGeometry(rfG), lW);
      rfE.rotation.y = Math.PI / 4;
      rfE.position.copy(rf.position);
      g.add(rfE);
      const sof = new T.Mesh(new T.PlaneGeometry(13.2, 13.2), soffit);
      sof.rotation.x = -Math.PI / 2;
      sof.position.y = TT + 2.72;
      g.add(sof);
      box(0.5, 1.6, 0.5, 0, TT + 6.5, 0, goldB);
      const fin = new T.Mesh(new T.ConeGeometry(0.28, 1.2, 8), goldB);
      fin.position.y = TT + 7.9;
      g.add(fin);
      const sph = new T.Mesh(new T.SphereGeometry(0.42, 12, 8), goldB);
      sph.position.y = TT + 7.3;
      g.add(sph);
      tRoof(32, 10, 3.6, 0, PH - 0.4, -8, redT, lW);
      for (const sx of [-1, 1]) {
        box(12, 10, 9, sx * 21, 5, -0.5, cream);
        box(12.6, 0.6, 9.6, sx * 21, 10.2, -0.5, trimW);
        box(0.8, 10, 0.4, sx * 27, 5, 4.15, trimW);
        box(8, 5.2, 0.2, sx * 21, 2.6, 4.05, teal);
        for (let k = 0; k < 8; k++) box(8, 0.06, 0.22, sx * 21, 0.4 + k * 0.65, 4.07, darkM);
        box(8.4, 1.2, 0.22, sx * 21, 6.4, 4.06, ventM);
        box(8.8, 0.3, 0.5, sx * 21, 7.1, 4.1, trimW);
        tRoof(12.6, 9.4, 3, sx * 21, 10.5, -0.5, redT, lW);
        box(13, 8, 9, sx * 33.5, 4, -0.5, cream);
        box(13.6, 0.5, 9.6, sx * 33.5, 8.2, -0.5, trimW);
        for (const ox of [30.5, 36.5]) {
          const x = sx * ox;
          door(2.2, 4, x, 0.05, 4.03);
          box(3.6, 2.6, 0.1, x, 3.2, 4.1, posterM);
          arch(x, 4.4, 6.0, 4.12, lW);
        }
        tRoof(13.6, 9.4, 2.6, sx * 33.5, 8.4, -0.5, redT, lW);
      }
      flush(trimW);
      hy = 50;
    }

    // Floating holo label and the scan line on the road in front of each gate.
    const ht = canvasTex(1024, 256, (c) => {
      c.fillStyle = 'rgba(6,4,16,.55)';
      c.fillRect(0, 0, 1024, 256);
      c.strokeStyle = cp.c;
      c.lineWidth = 5;
      c.shadowColor = cp.c;
      c.shadowBlur = 22;
      c.strokeRect(10, 10, 1004, 236);
      c.textBaseline = 'middle';
      c.textAlign = 'left';
      c.font = `700 120px ${fonts.display}`;
      c.fillStyle = cp.c;
      c.shadowBlur = 36;
      c.fillText(cp.n, 50, 112);
      c.fillStyle = '#fff';
      c.shadowBlur = 20;
      c.fillText('// ' + cp.t, 230, 112);
      c.font = `700 32px ${fonts.mono}`;
      c.fillStyle = '#ffc53d';
      c.shadowColor = '#ffc53d';
      c.shadowBlur = 10;
      c.fillText(cp.loc, 54, 204);
      const lw = c.measureText(cp.loc).width;
      c.font = `500 26px ${fonts.mono}`;
      c.fillStyle = '#c7c7da';
      c.shadowBlur = 4;
      c.fillText('  -  ' + cp.sub, 54 + lw, 205);
    });
    const holo = new T.Mesh(new T.PlaneGeometry(26, 6.5), new T.MeshBasicMaterial({ map: ht, transparent: true, side: DS, depthWrite: false, blending: T.AdditiveBlending }));
    holo.position.set(0, hy, 0);
    g.add(holo);
    const isP = cp.c === '#FF2D95';
    const scan = new T.Mesh(
      new T.PlaneGeometry(22, 1.4),
      new T.MeshBasicMaterial({ color: isP ? new T.Color(1.6, 0.25, 0.9) : new T.Color(0.2, 1.3, 1.6), transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false }),
    );
    scan.rotation.x = -Math.PI / 2;
    scan.position.set(0, 0.06, 6);
    g.add(scan);
    scene.add(g);
    gates.push({ g, holo, scan, hy });
  }
  if (!dragonUni) throw new Error('dragon gate missing');
  return { gates, gateMats, dragonUni, dragonHead, clocks };
}

/** Cầu Rồng: the golden dragon bridge, with bump-lit scales, flame fins, legs, claws and a fire-breathing maned head. */
async function buildDragon(
  g: T.Group,
  gateZ: number,
  uni: Uni,
  { V, YV, DS }: { V: (x: number, y: number, z: number) => T.Vector3; YV: T.Vector3; DS: T.Side },
  slice: Slice,
) {
  const Z0 = 40, L = 215;
  const yF = (ph: number) => 19.5 + 8.5 * Math.sin(ph * Math.PI * 3 + 0.9) * (1 - ph * 0.3),
    xF = (ph: number) => Math.sin(ph * Math.PI * 2.4) * 9 * Math.min(1, ph * 3);
  const pts = [V(0, 26.4, 47.5), V(0, 25.5, 44.5)];
  for (let k = 0; k <= 90; k++) {
    const ph = k / 90;
    pts.push(V(xF(ph), yF(ph), Z0 - ph * L));
  }
  const curve = new T.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const uFire = { value: 0 }, uHZ = { value: gateZ + 44 };
  // The body undulates more the further it is from the head (uHZ).
  const WOB = 'uniform float uTime;uniform float uHZ;vec3 wob(vec3 w){float amp=smoothstep(0.,45.,uHZ-w.z);w.y+=sin(w.z*.045-uTime*1.1)*1.6*amp;w.x+=cos(w.z*.03-uTime*.8)*1.1*amp;return w;}';
  const FOGF = 'float d=length(vW-cameraPosition);float fg=clamp(1.-exp(-d*d*fogDensity*fogDensity),0.,1.);';
  const U = () => ({ uTime: uni.uTime, fogColor: uni.fogColor, fogDensity: uni.fogDensity, uFire, uHZ });
  // Gold scales (uSc = scale count along / around the body), bump-lit from their height field, cream belly plates.
  const DFS =
    'uniform float uFire;uniform vec2 uSc;uniform vec3 fogColor;uniform float fogDensity;varying vec3 vW;varying vec3 vN;varying vec2 vUv;void main(){vec3 n=normalize(vN);vec2 q=vUv*uSc;q.y+=.5*mod(floor(q.x),2.);vec2 f=fract(q);vec2 fw=fwidth(q);float far=smoothstep(.3,.75,max(fw.x,fw.y));float dd=length(vec2(f.x*1.1,(f.y-.5)*1.25));float belly=smoothstep(-.2,-.55,n.y);float h=(1.-smoothstep(.5,1.,dd))*(1.-f.x*.5)*(1.-far);float edge=smoothstep(.7,.98,dd)*(1.-far);float hs=fract(sin(dot(floor(q),vec2(12.9898,78.233)))*43758.55);vec3 dp1=dFdx(vW),dp2=dFdy(vW);float h1=dFdx(h),h2=dFdy(h);vec3 r1=cross(dp2,n),r2=cross(n,dp1);float det=dot(dp1,r1);vec3 gr=sign(det)*(h1*r1+h2*r2);vec3 bn=normalize(abs(det)*n-gr*1.4*(1.-belly)+n*1e-6);float band=fract(vUv.x*uSc.x*.55);float crease=smoothstep(0.,.1,band)*smoothstep(1.,.85,band);vec3 gold=mix(vec3(1.,.7,.26),vec3(.9,.55,.18),hs*.5)*(.75+.45*h);vec3 sc=mix(gold,vec3(.3,.15,.04),edge*.9);vec3 bel=vec3(1.05,.86,.52)*mix(.32,1.,mix(crease,1.,far));vec3 base=mix(sc,bel,belly);vec3 L=normalize(vec3(.35,1.,.5));float lam=.28+.85*max(0.,dot(bn,L));vec3 vd=normalize(cameraPosition-vW);vec3 hv=normalize(L+vd);float sp=pow(max(0.,dot(bn,hv)),36.)*1.4;float rim=pow(1.-max(0.,dot(n,vd)),3.);vec3 c=base*lam+vec3(1.,.82,.45)*sp*(1.-belly*.6)+vec3(1.,.78,.4)*rim*.55+vec3(1.4,.4,.05)*uFire;' +
    FOGF +
    'gl_FragColor=vec4(mix(c,fogColor,fg),1.);}';
  const DVS = WOB + 'varying vec3 vW;varying vec3 vN;varying vec2 vUv;void main(){vUv=uv;vec3 w=wob((modelMatrix*vec4(position,1.)).xyz);vW=w;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}';
  const dragonUni = Object.assign(U(), { uSc: { value: new T.Vector2(210, 13) } });
  const BM = new T.ShaderMaterial({ uniforms: dragonUni, vertexShader: DVS, fragmentShader: DFS });
  const HM = new T.ShaderMaterial({ uniforms: Object.assign(U(), { uSc: { value: new T.Vector2(34, 16) } }), vertexShader: DVS, fragmentShader: DFS });
  // Flame fins: red at the root to gold at the tip, fluttering (uv.x runs along the body, uv.y root to tip).
  const finMat = new T.ShaderMaterial({
    side: DS,
    uniforms: U(),
    vertexShader: WOB + 'varying vec3 vW;varying vec2 vF;void main(){vF=uv;vec3 w=wob((modelMatrix*vec4(position,1.)).xyz);w.y+=sin(uTime*5.+uv.x*90.)*.25*uv.y;w.x+=cos(uTime*4.+uv.x*70.)*.2*uv.y;vW=w;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}',
    fragmentShader: 'uniform float uFire;uniform vec3 fogColor;uniform float fogDensity;varying vec3 vW;varying vec2 vF;void main(){float t=vF.y;float st=.5+.5*sin(vF.x*1400.+t*6.);vec3 c=mix(vec3(.85,.48,.13),vec3(1.6,1.28,.68),smoothstep(.1,.9,t));c*=.8+.28*st;c+=vec3(.5,.2,0.)*uFire;' + FOGF + 'gl_FragColor=vec4(mix(c,fogColor,fg),1.);}',
  });
  const wobMat = (r: number, g2: number, b2: number) =>
    new T.ShaderMaterial({
      side: DS,
      uniforms: Object.assign(U(), { uCol: { value: new T.Color(r, g2, b2) } }),
      vertexShader: WOB + 'varying vec3 vW;void main(){vec3 w=wob((modelMatrix*vec4(position,1.)).xyz);vW=w;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}',
      fragmentShader: 'uniform vec3 uCol;uniform vec3 fogColor;uniform float fogDensity;uniform float uFire;varying vec3 vW;void main(){vec3 c=uCol+vec3(.5,.18,0.)*uFire;' + FOGF + 'gl_FragColor=vec4(mix(c,fogColor,fg),1.);}',
    });
  const spineM = wobMat(1.5, 1.12, 0.52), flameM = wobMat(1.2, 0.8, 0.3), clawM = wobMat(1.5, 1.35, 0.95);
  const SEG = 420, RAD = 16,
    R = (u: number) => (u < 0.05 ? 1.5 + (u / 0.05) * 0.5 : u < 0.5 ? 2.0 + 0.1 * Math.sin(u * 50) : 2.0 - Math.pow((u - 0.5) / 0.5, 1.1) * 1.7);
  const tubeG = new T.TubeGeometry(curve, SEG, 1, RAD, false), pa = tubeG.attributes.position, ringP: T.Vector3[] = [];
  for (let r0 = 0; r0 <= SEG; r0++) ringP.push(curve.getPointAt(r0 / SEG));
  for (let k = 0; k < pa.count; k++) {
    const ring = Math.floor(k / (RAD + 1)), u = ring / SEG, pp = ringP[ring], r = R(u);
    pa.setXYZ(k, pp.x + (pa.getX(k) - pp.x) * r, pp.y + (pa.getY(k) - pp.y) * r, pp.z + (pa.getZ(k) - pp.z) * r);
  }
  tubeG.computeVertexNormals();
  g.add(new T.Mesh(tubeG, BM));
  await slice();
  const frame = (u: number) => {
    const P = curve.getPointAt(u), Tg = curve.getTangentAt(u), side = new T.Vector3().crossVectors(Tg, YV).normalize(), up = new T.Vector3().crossVectors(side, Tg).normalize();
    return { P, T: Tg, side, up };
  };
  type Frame = ReturnType<typeof frame>;
  const ttube = (pp: T.Vector3[], r0: number, r1: number, mat: T.Material, par?: T.Object3D) => {
    const cv = new T.CatmullRomCurve3(pp), sg = 20, rs = 8, geo = new T.TubeGeometry(cv, sg, 1, rs, false), at = geo.attributes.position;
    for (let k = 0; k < at.count; k++) {
      const ring = Math.floor(k / (rs + 1)), u = ring / sg, c = cv.getPointAt(u), r = r0 + (r1 - r0) * u;
      at.setXYZ(k, c.x + (at.getX(k) - c.x) * r, c.y + (at.getY(k) - c.y) * r, c.z + (at.getZ(k) - c.z) * r);
    }
    geo.computeVertexNormals();
    const m = new T.Mesh(geo, mat);
    (par || g).add(m);
    return m;
  };
  const cone = (r: number, h: number, mat: T.Material, pos: T.Vector3, dir: T.Vector3, thin: T.Vector3 | null, par?: T.Object3D) => {
    const geo = new T.ConeGeometry(r, h, thin ? 4 : 7);
    geo.translate(0, h / 2, 0);
    const m = new T.Mesh(geo, mat);
    const y = dir.clone().normalize();
    m.position.copy(pos);
    if (thin) {
      const z = thin.clone().addScaledVector(y, -thin.dot(y)).normalize(), x = new T.Vector3().crossVectors(y, z);
      m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z));
      m.scale.z = 0.28;
    } else m.quaternion.setFromUnitVectors(YV, y);
    (par || g).add(m);
    return m;
  };
  // A fin strip along the body from u0 to u1: root edge on the body (baseF), tip edge from tipF.
  const ribbon = (u0: number, u1: number, N: number, baseF: (u: number, fr: Frame) => T.Vector3, tipF: (u: number, fr: Frame, b: T.Vector3) => T.Vector3) => {
    const pos: number[] = [], uvs: number[] = [], idx: number[] = [];
    for (let i = 0; i <= N; i++) {
      const u = u0 + ((u1 - u0) * i) / N, fr = frame(u), b = baseF(u, fr), t2 = tipF(u, fr, b);
      pos.push(b.x, b.y, b.z, t2.x, t2.y, t2.z);
      uvs.push(u, 0, u, 1);
      if (i < N) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    const m = new T.Mesh(geo, finMat);
    m.frustumCulled = false;
    g.add(m);
  };
  // Saw-tooth fin profile: n teeth per unit of u.
  const tooth = (u: number, n: number) => 0.2 + 0.8 * Math.pow(1 - ((u * n) % 1), 2.4), finH = (u: number) => 2.8 - u * 1.9;
  ribbon(0.03, 0.985, 1500, (u, fr) => fr.P.clone().addScaledVector(fr.up, R(u) * 0.82), (u, fr, b) => {
    const h = finH(u) * tooth(u, 105);
    return b.clone().addScaledVector(fr.up, h).addScaledVector(fr.T, h * 0.75);
  });
  await slice();
  for (let i = 0; i < 48; i++) {
    const u = 0.035 + (i / 48) * 0.93, fr = frame(u);
    cone(0.6 - u * 0.35, 1.9 - u * 1.2, spineM, fr.P.clone().addScaledVector(fr.up, R(u) * 0.8), fr.up.clone().multiplyScalar(0.8).addScaledVector(fr.T, 0.6), fr.side);
  }
  for (let i = 0; i < 16; i++) {
    const u = 0.004 + ((i % 8) / 8) * 0.05, fr = frame(u), sd = i < 8 ? -1 : 1, ang = (i % 8) / 8;
    const out = fr.side.clone().multiplyScalar(sd * Math.cos(ang * 1.2)).addScaledVector(fr.up, Math.sin(ang * 1.2 + 0.3));
    cone(0.4, 2.4 + (i % 3) * 0.5, flameM, fr.P.clone().addScaledVector(out, R(u) * 0.8), out.clone().multiplyScalar(0.5).addScaledVector(fr.T, 0.9), fr.up);
  }
  const legAt = (u: number, front: boolean) => {
    const fr = frame(u), r = R(u);
    for (const sx of [-1, 1]) {
      const sd = fr.side.clone().multiplyScalar(sx), fw = fr.T.clone().multiplyScalar(front ? -1 : 0.6);
      // Shoulder bulge where the leg meets the body.
      const sh = fr.P.clone().addScaledVector(sd, r * 0.3).addScaledVector(fr.up, -r * 0.2), sb = fr.P.clone().addScaledVector(sd, r * 0.62).addScaledVector(fr.up, -r * 0.42);
      const bul = new T.Mesh(new T.SphereGeometry(1, 18, 12), HM);
      bul.position.copy(sb);
      bul.quaternion.setFromUnitVectors(YV, fr.T);
      bul.scale.set(r * 0.62, r * 1.05, r * 0.62);
      g.add(bul);
      const el = sb.clone().addScaledVector(sd, 1.9).addScaledVector(fr.up, -3.2).addScaledVector(fw, 2.1);
      const wr = el.clone().addScaledVector(sd, 0.3).addScaledVector(fr.up, -3.0).addScaledVector(fw, 2.0);
      ttube([sh, sb, sb.clone().lerp(el, 0.5).addScaledVector(sd, 0.3).addScaledVector(fr.up, 0.2), el], 1.35, 0.95, HM);
      ttube([el, el.clone().lerp(wr, 0.5).addScaledVector(fw, -0.2), wr], 0.9, 0.6, HM);
      const kj = new T.Mesh(new T.SphereGeometry(0.98, 14, 10), HM);
      kj.position.copy(el);
      g.add(kj);
      for (let k = 0; k < 3; k++) cone(0.36, 2.6 - k * 0.4, flameM, el, fr.T.clone().multiplyScalar(front ? 1 : 0.4).addScaledVector(fr.up, 0.35 + k * 0.3).addScaledVector(sd, 0.3), sd);
      // Foot: wrist, palm, four jointed toes forward and a dewclaw behind, each ending in a hooked claw.
      const dn = fr.up.clone().negate(), ff = fr.T.clone().multiplyScalar(front ? -1 : 1), pc = wr.clone().addScaledVector(dn, 0.55).addScaledVector(ff, 0.45);
      ttube([wr, wr.clone().lerp(pc, 0.5).addScaledVector(ff, -0.05), pc], 0.62, 0.52, HM);
      const palm = new T.Mesh(new T.SphereGeometry(0.62, 16, 12), HM);
      palm.position.copy(pc);
      palm.scale.set(1.15, 0.8, 1.15);
      g.add(palm);
      const dir0 = ff.clone().addScaledVector(sd, 0.35).normalize(), lat = new T.Vector3().crossVectors(dn, dir0).normalize();
      const toe = (dir: T.Vector3, L1: number, L2: number, rr: number, tl: number) => {
        const b0 = pc.clone().addScaledVector(dir, 0.35), k1 = b0.clone().addScaledVector(dir, L1).addScaledVector(dn, 0.05), k2 = k1.clone().addScaledVector(dir, L2).addScaledVector(dn, 0.4);
        ttube([b0, b0.clone().lerp(k1, 0.5).addScaledVector(dn, -0.12), k1], rr, rr * 0.8, HM);
        const kn = new T.Mesh(new T.SphereGeometry(rr * 0.85, 10, 8), HM);
        kn.position.copy(k1);
        g.add(kn);
        ttube([k1, k1.clone().lerp(k2, 0.5).addScaledVector(dn, -0.08), k2], rr * 0.78, rr * 0.62, HM);
        const kn2 = new T.Mesh(new T.SphereGeometry(rr * 0.66, 10, 8), HM);
        kn2.position.copy(k2);
        g.add(kn2);
        ttube([k2, k2.clone().addScaledVector(dir, tl * 0.55).addScaledVector(dn, tl * 0.1), k2.clone().addScaledVector(dir, tl * 0.8).addScaledVector(dn, tl * 0.55), k2.clone().addScaledVector(dir, tl * 0.65).addScaledVector(dn, tl)], rr * 0.62, 0.012, clawM);
      };
      for (let k = 0; k < 4; k++) {
        const an = (k - 1.5) * 0.42;
        toe(dir0.clone().multiplyScalar(Math.cos(an)).addScaledVector(lat, Math.sin(an)).addScaledVector(dn, 0.15).normalize(), 1.05 - Math.abs(k - 1.5) * 0.12, 0.85, 0.3, 1.25);
      }
      toe(ff.clone().negate().addScaledVector(sd, 0.4).addScaledVector(dn, 0.3).normalize(), 0.5, 0.45, 0.24, 0.9);
      for (let k = 0; k < 3; k++) cone(0.3, 1.9 - k * 0.35, flameM, wr, ff.clone().multiplyScalar(-0.9).addScaledVector(fr.up, 0.45 + k * 0.25).addScaledVector(sd, 0.2 + k * 0.15), sd);
    }
  };
  await slice();
  legAt(0.13, true);
  legAt(0.5, false);
  await slice();
  // Tail plume: 11 wavy locks fanning out of the tip.
  const tf = frame(0.975);
  for (let k = 0; k < 11; k++) {
    const an = -1.15 + (k / 10) * 2.3,
      dir = tf.T.clone().multiplyScalar(Math.cos(an)).addScaledVector(tf.up, Math.sin(an)),
      pr = tf.up.clone().multiplyScalar(-Math.sin(an)).addScaledVector(tf.side, ((k % 3) - 1) * 0.6),
      L = 8.5 - Math.abs(an) * 3 + (k % 2) * 1.2;
    ttube([tf.P, tf.P.clone().addScaledVector(dir, L * 0.35).addScaledVector(pr, 0.4), tf.P.clone().addScaledVector(dir, L * 0.7).addScaledVector(pr, -0.5), tf.P.clone().addScaledVector(dir, L).addScaledVector(pr, 0.9)], 0.62 - Math.abs(an) * 0.15, 0.02, k % 2 ? spineM : flameM);
  }
  const hornM = new T.MeshBasicMaterial({ color: new T.Color(1.35, 1.15, 0.75) }),
    whiskM = new T.MeshBasicMaterial({ color: new T.Color(1.5, 1.05, 0.35) }),
    eyeM = new T.MeshBasicMaterial({ color: new T.Color(2.4, 1.3, 0.25) }),
    inkM = new T.MeshBasicMaterial({ color: 0x0a0608 }),
    toothM = new T.MeshBasicMaterial({ color: new T.Color(1.15, 1.1, 0.95) }),
    mouthM = new T.MeshBasicMaterial({ color: new T.Color(0.9, 0.12, 0.06), side: DS }),
    flameB = new T.MeshBasicMaterial({ color: new T.Color(1.2, 0.8, 0.3), side: DS }),
    maneY = new T.MeshBasicMaterial({ color: new T.Color(1.6, 1.3, 0.7), side: DS });
  const hd = new T.Group();
  g.add(hd);
  const P0 = curve.getPointAt(0), fwd = curve.getTangentAt(0).negate();
  hd.position.copy(P0).addScaledVector(fwd, 1.2);
  hd.quaternion.setFromUnitVectors(V(0, 0, 1), fwd);
  hd.rotateX(0.22);
  hd.scale.setScalar(1.55);
  const mesh = (geo: T.BufferGeometry, mt: T.Material, p: number[], sc?: number[]) => {
    const m = new T.Mesh(geo, mt);
    m.position.set(p[0], p[1], p[2]);
    if (sc) m.scale.set(sc[0], sc[1], sc[2]);
    hd.add(m);
    return m;
  };
  mesh(new T.SphereGeometry(1.7, 22, 16), HM, [0, 0.3, 0], [1.05, 0.95, 1.25]);
  const snG = new T.CylinderGeometry(0.85, 1.25, 4.2, 14);
  snG.rotateX(Math.PI / 2);
  mesh(snG, HM, [0, 0.05, 2.9], [1.15, 0.62, 1]);
  mesh(new T.SphereGeometry(0.75, 14, 10), HM, [0, 0.38, 4.9], [1.35, 0.8, 0.9]);
  for (const sx of [-1, 1]) {
    mesh(new T.SphereGeometry(0.17, 8, 6), inkM, [sx * 0.45, 0.58, 5.45]);
    mesh(new T.SphereGeometry(0.62, 12, 8), HM, [sx * 0.85, 1.12, 1.3], [0.85, 0.5, 1.35]);
    mesh(new T.SphereGeometry(0.42, 14, 10), eyeM, [sx * 1.08, 0.82, 1.6]);
    mesh(new T.SphereGeometry(0.17, 8, 6), inkM, [sx * 1.4, 0.86, 1.8]);
    // Antler horns (main beam + two tines), whiskers and a fang.
    ttube([V(sx * 0.55, 1.35, 0.1), V(sx * 1.0, 2.5, -1.6), V(sx * 1.3, 3.3, -3.6), V(sx * 1.2, 4.6, -5.8)], 0.36, 0.06, hornM, hd);
    ttube([V(sx * 1.05, 2.7, -2.0), V(sx * 1.7, 3.7, -2.2), V(sx * 2.0, 4.6, -3.1)], 0.18, 0.04, hornM, hd);
    ttube([V(sx * 1.25, 3.2, -3.4), V(sx * 1.9, 4.2, -3.9), V(sx * 2.1, 5.0, -4.9)], 0.15, 0.03, hornM, hd);
    cone(0.16, 1.4, toothM, V(sx * 0.62, -0.2, 5.0), V(0, -1, 0.05), null, hd);
    ttube([V(sx * 1.0, 0.25, 4.7), V(sx * 2.4, 0.55, 4.8), V(sx * 3.6, -0.3, 3.0), V(sx * 4.8, -1.6, 0.2), V(sx * 5.6, -3.6, -3.5), V(sx * 5.4, -5.6, -7), V(sx * 6.8, -5.2, -10.5), V(sx * 8.2, -3.4, -13)], 0.1, 0.015, whiskM, hd);
    cone(0.3, 1.9, flameB, V(sx * 0.95, 1.4, 1.1), V(sx * 0.4, 0.9, -0.8), V(1, 0, 0), hd);
    for (let z = 3.3; z <= 5.1; z += 0.45) cone(0.1, z > 4.8 ? 0.8 : 0.45, toothM, V(sx * 0.78, -0.25, z), V(0, -1, 0.1), null, hd);
  }
  // Mane: 24 swept-back locks, alternating red flame and gold.
  for (let i = 0; i < 24; i++) {
    const an = -0.22 * Math.PI + (i / 23) * 1.44 * Math.PI, dx = Math.cos(an), dy = Math.sin(an), Ln = 5 + (i % 4) * 1.4, s0 = V(dx * 1.3, 0.4 + dy * 1.2, -0.6);
    ttube([s0, s0.clone().add(V(dx * 1.2, dy * 0.9 + 0.7, -Ln * 0.35)), s0.clone().add(V(dx * 2.0, dy * 1.3 + 0.2, -Ln * 0.7)), s0.clone().add(V(dx * 2.6, dy * 1.2 + 1.1, -Ln))], 0.34, 0.03, i % 2 ? maneY : flameB, hd);
  }
  for (let k = -1; k <= 1; k++) cone(0.24, 2 - Math.abs(k) * 0.4, flameB, V(k * 0.45, -1.3, 1.2), V(k * 0.3, -1, -0.7), V(1, 0, 0), hd);
  const jaw = new T.Group();
  jaw.position.set(0, -0.55, 0.6);
  jaw.rotation.x = 0.55;
  hd.add(jaw);
  // Beard under the jaw, the tongue, two lower fangs.
  for (let k = 0; k < 7; k++) {
    const x = (k - 3) * 0.28, s0 = V(x, -0.45, 2.0 - Math.abs(k - 3) * 0.2);
    ttube([s0, s0.clone().add(V(x * 0.5, -1.3, -0.5)), s0.clone().add(V(x * 0.8, -2.6, -1.7)), s0.clone().add(V(x, -3.3, -3.4))], 0.2, 0.02, k % 2 ? maneY : flameB, jaw);
  }
  ttube([V(0, 0.05, 0.8), V(0, 0.3, 2.4), V(0, 0.1, 3.8), V(0, 0.6, 5.0)], 0.32, 0.08, mouthM, jaw);
  for (const sx of [-1, 1]) cone(0.14, 1.1, toothM, V(sx * 0.5, 0.1, 3.9), V(0, 1, 0.1), null, jaw);
  const jG = new T.CylinderGeometry(0.55, 0.95, 3.9, 12);
  jG.rotateX(Math.PI / 2);
  const jm = new T.Mesh(jG, HM);
  jm.scale.set(1.05, 0.45, 1);
  jm.position.set(0, -0.15, 2.3);
  jaw.add(jm);
  for (const sx of [-1, 1])
    for (let z = 1.6; z <= 3.8; z += 0.5) {
      const tt = new T.Mesh(new T.ConeGeometry(0.09, 0.4, 5), toothM);
      tt.position.set(sx * 0.55, 0.15, z);
      jaw.add(tt);
    }
  const mo = mesh(new T.PlaneGeometry(1.3, 3.2), mouthM, [0, -0.6, 3.1]);
  mo.rotation.x = -Math.PI / 2 + 0.2;
  g.updateMatrixWorld(true);
  return { uni: dragonUni, head: hd.localToWorld(V(0, -0.5, 5.2)) };
}
