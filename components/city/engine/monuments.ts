import * as T from 'three';
import { CPS } from '../data';
import { canvasTex, type Fonts } from './textures';
import type { Uni } from './world';

export type Gate = { g: T.Group; holo: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>; scan: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>; hy: number };
export type ClockHands = { h: T.Object3D; m: T.Object3D };
export type GateMats = Record<'stoneM' | 'whiteM' | 'ochreM' | 'ochreL' | 'brickM' | 'woodM', T.MeshStandardMaterial> & { redWood: T.MeshBasicMaterial };
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

/**
 * The five sector gates, each a Vietnamese landmark: Ngọ Môn (Huế), Chùa Cầu (Hội An),
 * Khuê Văn Các (Hà Nội), Cầu Rồng with its fire-breathing dragon (Đà Nẵng), Chợ Bến Thành (Sài Gòn).
 */
export function buildGates(scene: T.Scene, { rnd, addSign, fonts, uni }: Ctx): GateBits {
  const gates: Gate[] = [];
  let dragonUni: DragonUni | null = null;
  let dragonHead = new T.Vector3();
  let clocks: ClockHands[] = [];
  const DS = T.DoubleSide;
  const darkM = new T.MeshStandardMaterial({ color: 0x120e1a, roughness: 0.8 });
  const tile = (c: number, e: number) => new T.MeshStandardMaterial({ color: c, emissive: e, roughness: 0.55, side: DS });
  const yellowTile = tile(0xa07a18, 0x2e2000), greenTile = tile(0x24684a, 0x082a18), clayTile = tile(0x6a2a18, 0x1a0804), darkTile = tile(0x4a4048, 0x16121a);
  const ridgeM = new T.MeshStandardMaterial({ color: 0x1c161c });
  const stoneM = new T.MeshStandardMaterial({ color: 0x3a3430, roughness: 0.95 }), whiteM = new T.MeshStandardMaterial({ color: 0x8c8578, emissive: 0x0a0907, roughness: 0.95 });
  const ochreM = new T.MeshStandardMaterial({ color: 0xa07c3a, emissive: 0x241808, roughness: 0.85 }), ochreL = new T.MeshStandardMaterial({ color: 0xc49a50, emissive: 0x2a1c0a, roughness: 0.85 }), brickM = new T.MeshStandardMaterial({ color: 0x5a2e22, roughness: 0.9 });
  const woodM = new T.MeshStandardMaterial({ color: 0x4a2414, emissive: 0x140804, roughness: 0.7 }), redWood = new T.MeshBasicMaterial({ color: new T.Color(0.3, 0.05, 0.035) });
  const gateMats: GateMats = { stoneM, whiteM, ochreM, ochreL, brickM, woodM, redWood };
  const goldB = new T.MeshBasicMaterial({ color: new T.Color(2.4, 1.6, 0.5) }), moonM = new T.MeshBasicMaterial({ color: new T.Color(2.3, 2.2, 1.7), side: DS }), sunM = new T.MeshBasicMaterial({ color: new T.Color(2.7, 0.9, 0.3), side: DS });
  const bronzeG = new T.MeshBasicMaterial({ color: new T.Color(0.25, 0.55, 0.42) }), ceramW = new T.MeshBasicMaterial({ color: new T.Color(1, 1, 0.95) });
  const LM_ = (c: P3) => new T.LineBasicMaterial({ color: new T.Color(c[0], c[1], c[2]) });
  const lG = LM_([2.4, 1.6, 0.5]), lGr = LM_([0.4, 1.8, 0.9]), lW = LM_([2.2, 0.9, 0.4]), lC = LM_([0.3, 1.9, 2.4]), lBW = LM_([1.2, 1.6, 2.4]);
  const hlG = new T.LatheGeometry([[0, -0.62], [0.24, -0.56], [0.46, -0.34], [0.54, 0], [0.46, 0.34], [0.24, 0.56], [0, 0.62]].map((a) => new T.Vector2(a[0], a[1])), 8);
  const haM = [[1.5, 1.05, 0.25], [1.5, 0.2, 0.15], [1.4, 0.3, 0.75], [0.8, 0.3, 1.4], [0.25, 0.7, 1.5], [0.3, 1.3, 0.5], [1.5, 0.65, 0.2]].map((c) => new T.MeshBasicMaterial({ color: new T.Color(c[0], c[1], c[2]) }));
  const YV = new T.Vector3(0, 1, 0);

  CPS.forEach((cp) => {
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
    // Hip-and-gable roof with gold upturned eave tips and an optional moon/sun ridge ornament.
    const vRoof = (W: number, D: number, H: number, x: number, y: number, z: number, mt: T.Material, lm: T.LineBasicMaterial, orn?: string) => {
      const hw = W / 2, hd = D / 2, rw = Math.max(0.5, hw - hd * 0.9), k = Math.min(0.7, Math.max(0.5, W / 30));
      const A: P3 = [-hw, 0, hd], B: P3 = [hw, 0, hd], C: P3 = [hw, 0, -hd], E: P3 = [-hw, 0, -hd], R1: P3 = [-rw, H, 0], R2: P3 = [rw, H, 0];
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute([A, B, R2, A, R2, R1, C, E, R1, C, R1, R2, E, A, R1, B, C, R2, A, E, C, A, C, B].flat(), 3));
      geo.computeVertexNormals();
      const r = new T.Mesh(geo, mt);
      r.position.set(x, y, z);
      g.add(r);
      const e = new T.LineSegments(new T.EdgesGeometry(geo), lm);
      e.position.set(x, y, z);
      g.add(e);
      box(rw * 2 + 0.8, 0.35, 0.4, x, y + H + 0.1, z, ridgeM);
      [A, B, C, E].forEach((c) => {
        const sx = Math.sign(c[0]), sz = Math.sign(c[2]);
        tube([V(x + c[0], y + 0.05, z + c[2]), V(x + c[0] + sx * 0.9 * k, y - 0.05, z + c[2] + sz * 0.9 * k), V(x + c[0] + sx * 1.25 * k, y + 1.2 * k, z + c[2] + sz * 1.25 * k)], 0.13 * k, goldB);
      });
      for (const sd of [-1, 1]) tube([V(x + sd * rw, y + H + 0.2, z), V(x + sd * (rw + 0.7 * k), y + H + 0.3, z), V(x + sd * (rw + 0.8 * k), y + H + 1.1 * k, z)], 0.12 * k, goldB);
      if (orn) longMoon(x, y + H + 0.3, z, Math.max(2, Math.min(rw, 3.5)), orn);
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

    if (cp.id === 'about') {
      // Ngọ Môn: stone base with arches, wooden pavilion, tiered green and yellow roofs.
      box(18, 11, 10, -20, 5.5, 0, stoneM);
      box(18, 11, 10, 20, 5.5, 0, stoneM);
      box(22, 2.5, 10, 0, 9.75, 0, stoneM);
      box(7, 11, 14, -25.5, 5.5, 12, stoneM);
      box(7, 11, 14, 25.5, 5.5, 12, stoneM);
      arch(0, 22, 8.5, zf, lG);
      arch(-20, 5, 6.5, zf, lW);
      arch(20, 5, 6.5, zf, lW);
      poly([[-29, 11.05, zf], [29, 11.05, zf]], lG);
      for (const sx of [-1, 1]) {
        box(6, 2.6, 6, sx * 25.5, 12.3, 15, woodM);
        vRoof(8.5, 8.5, 2.2, sx * 25.5, 13.6, 15, greenTile, lGr);
      }
      box(42, 0.5, 9, 0, 11.25, 0, ridgeM);
      box(38, 4.4, 7, 0, 13.7, 0, woodM);
      for (let k = -9; k <= 9; k++) box(0.3, 4.4, 0.3, k * 2, 13.7, 3.6, redWood);
      vRoof(46, 12, 2.4, 0, 15.9, 0, greenTile, lGr);
      box(34, 3.2, 5.5, 0, 18.6, 0, woodM);
      vRoof(10, 7.5, 3.4, 0, 20.2, 0, yellowTile, lG, 'moon');
      for (const sx of [-1, 1]) {
        vRoof(8, 7, 2.8, sx * 9.3, 19.8, 0, greenTile, lGr);
        vRoof(6.5, 6.5, 2.4, sx * 16.2, 19.5, 0, greenTile, lGr);
      }
      [-15, -9, -3, 3, 9, 15].forEach((x) => lantern(x, 14.4, 4.6));
      lantern(-6, 7.3, 5.8);
      lantern(6, 7.3, 5.8);
      hy = 31;
    } else if (cp.id === 'work') {
      // Chùa Cầu: the covered Japanese bridge with its arched clay roof.
      const X = 16.5, yR = (x: number) => 12.9 + 1.4 * (1 - (x / X) * (x / X));
      box(33, 0.8, 5, 0, 8.4, 0, woodM);
      for (const sx of [-1, 1]) for (const px of [13.2, 16]) for (const z of [-1.8, 1.8]) box(1.2, 8.1, 1.2, sx * px, 4.05, z, brickM);
      for (const z of [-2.35, 2.35]) {
        box(33, 0.15, 0.15, 0, 9.9, z, woodM);
        for (let x = -16; x <= 16.1; x += 2.2) box(0.28, 4.3, 0.28, x, 10.95, z, woodM);
      }
      const N = 14, ridge: P3[] = [], eF: P3[] = [], eB: P3[] = [];
      for (let k = 0; k < N; k++) {
        const x0 = -X - 1 + ((2 * X + 2) * k) / N, x1 = -X - 1 + ((2 * X + 2) * (k + 1)) / N, xm = (x0 + x1) / 2, y0 = yR(x0), y1 = yR(x1), len = Math.hypot(x1 - x0, y1 - y0) + 0.06, ang = Math.atan2(y1 - y0, x1 - x0);
        for (const sz of [-1, 1]) {
          const b = box(len, 0.25, 3.8, xm, (y0 + y1) / 2 + 0.6, sz * 1.6, clayTile);
          b.rotation.z = ang;
          b.rotation.x = sz * 0.5;
        }
      }
      for (let k = 0; k <= 30; k++) {
        const x = -X - 1 + ((2 * X + 2) * k) / 30;
        ridge.push([x, yR(x) + 1.55, 0]);
        eF.push([x, yR(x) - 0.3, 3.26]);
        eB.push([x, yR(x) - 0.3, -3.26]);
      }
      poly(ridge, lBW);
      poly(eF, lW);
      poly(eB, lW);
      vRoof(7, 5.6, 2, 0, yR(0) + 1.2, 0, clayTile, lW, 'sun');
      addSign('CHÙA CẦU', '#ffc53d', false, 5, 1.25, 0, 12.2, cp.z + 2.5, 0);
      for (const sx of [-1, 1]) {
        const eye = new T.Mesh(new T.CircleGeometry(0.35, 16), goldB);
        eye.position.set(sx * 0.9, 11.1, 2.52);
        g.add(eye);
      }
      for (let x = -14; x <= 14; x += 3.5) for (const z of [2.9, -2.9]) lantern(x, 12.1, z);
      hy = 24;
    } else if (cp.id === 'ledger') {
      // Khuê Văn Các: white pillars, a red pavilion with four sun windows, a double roof.
      for (const x of [-12, 12]) for (const z of [-10, 10]) box(3, 14, 3, x, 7, z, whiteM);
      box(28, 0.8, 26, 0, 14.4, 0, woodM);
      for (const z of [-12.9, 12.9]) poly([[-14, 15.5, z], [14, 15.5, z]], lW);
      for (const x of [-13.9, 13.9]) poly([[x, 15.5, -13], [x, 15.5, 13]], lW);
      for (let x = -13.5; x <= 13.6; x += 1.5) box(0.12, 1, 0.12, x, 15.3, 12.9, woodM);
      box(17, 7, 17, 0, 18.7, 0, redWood);
      for (const x of [-8.5, 8.5]) for (const z of [-8.5, 8.5]) box(0.5, 7, 0.5, x, 18.7, z, woodM);
      sunWindow(0, 18.4, 8.56, 0);
      sunWindow(0, 18.4, -8.56, Math.PI);
      sunWindow(8.56, 18.4, 0, Math.PI / 2);
      sunWindow(-8.56, 18.4, 0, -Math.PI / 2);
      addSign('KHUÊ VĂN CÁC', '#ffc53d', false, 5.6, 1.4, 0, 21.4, cp.z + 8.62, 0);
      vRoof(25, 25, 3, 0, 22.2, 0, darkTile, lG);
      box(10, 2, 10, 0, 26, 0, redWood);
      vRoof(15, 15, 2.8, 0, 27, 0, darkTile, lG, 'moon');
      lantern(-8.5, 12.8, 11.6);
      lantern(8.5, 12.8, 11.6);
      hy = 36;
    } else if (cp.id === 'stack') {
      const d = buildDragon(g, cp.z, uni, { V, YV, DS });
      dragonUni = d.uni;
      dragonHead = d.head;
      hy = 34;
    } else {
      // Chợ Bến Thành: ochre market facade, arched bays, the clock tower.
      box(4, 14, 10, -13, 7, 0, ochreM);
      box(4, 14, 10, 13, 7, 0, ochreM);
      box(22, 4, 10, 0, 12, 0, ochreM);
      box(19, 9, 10, -24.5, 4.5, 0, ochreM);
      box(19, 9, 10, 24.5, 4.5, 0, ochreM);
      [-15.4, -10.6, 10.6, 15.4].forEach((x) => box(0.8, 14, 0.4, x, 7, 5.15, ochreL));
      [-21.5, -26.5, -31.5, 21.5, 26.5, 31.5].forEach((x) => box(0.7, 9, 0.3, x, 4.5, 5.1, ochreL));
      arch(0, 21, 10, zf, lW);
      [-19, -24, -29, 19, 24, 29].forEach((x) => arch(x, 3.4, 5.5, zf, lW));
      poly([[-34, 9.05, zf], [-15, 9.05, zf]], lG);
      poly([[15, 9.05, zf], [34, 9.05, zf]], lG);
      poly([[-15, 14.05, zf], [15, 14.05, zf]], lG);
      for (const x of [-13, 13]) {
        box(2.4, 2.4, 0.2, x, 9.8, 5.12, bronzeG);
        box(1.3, 1.3, 0.22, x, 9.8, 5.14, ceramW);
      }
      [-19, -24, -29, 19, 24, 29].forEach((x) => box(1.8, 1.1, 0.2, x, 7.4, 5.12, bronzeG));
      addSign('CHỢ BẾN THÀNH', '#ffc53d', false, 14, 3.5, 0, 12, cp.z + 5.2, 0);
      box(10, 12, 9, 0, 20, 0, ochreM);
      const clock = (px: number, py: number, pz: number, ry: number): ClockHands => {
        const gr = new T.Group();
        gr.position.set(px, py, pz);
        gr.rotation.y = ry;
        g.add(gr);
        gr.add(new T.Mesh(new T.CircleGeometry(2.6, 40), new T.MeshBasicMaterial({ color: new T.Color(0.95, 0.9, 0.75) })));
        const rim = new T.Mesh(new T.TorusGeometry(2.65, 0.16, 6, 48), goldB);
        gr.add(rim);
        const hand = (len: number, th: number, z: number) => {
          const pv = new T.Group();
          pv.position.z = z;
          box(th, len, 0.05, 0, len / 2, 0, new T.MeshBasicMaterial({ color: 0x0a0810 }), pv);
          gr.add(pv);
          return pv;
        };
        return { h: hand(1.5, 0.26, 0.06), m: hand(2.2, 0.15, 0.09) };
      };
      clocks = [clock(0, 21, 4.56, 0), clock(-5.06, 21, 0, -Math.PI / 2), clock(5.06, 21, 0, Math.PI / 2)];
      box(11, 1, 10, 0, 26.5, 0, ochreL);
      box(8, 2, 7, 0, 28, 0, ochreM);
      const pyG = new T.ConeGeometry(5.2, 3, 4);
      const py = new T.Mesh(pyG, darkM);
      py.rotation.y = Math.PI / 4;
      py.position.y = 30.5;
      g.add(py);
      const pyE = new T.LineSegments(new T.EdgesGeometry(pyG), lC);
      pyE.rotation.y = Math.PI / 4;
      pyE.position.y = 30.5;
      g.add(pyE);
      box(0.3, 2, 0.3, 0, 33, 0, goldB);
      hy = 39;
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
  });
  if (!dragonUni) throw new Error('dragon gate missing');
  return { gates, gateMats, dragonUni, dragonHead, clocks };
}

/** Cầu Rồng: the golden dragon bridge, with scales, spines, legs, claws and a fire-breathing head. */
function buildDragon(
  g: T.Group,
  gateZ: number,
  uni: Uni,
  { V, YV, DS }: { V: (x: number, y: number, z: number) => T.Vector3; YV: T.Vector3; DS: T.Side },
) {
  const Z0 = 40, L = 215;
  const yF = (ph: number) => 19 + 5.5 * Math.sin(ph * Math.PI * 3 + 0.9) * (1 - ph * 0.3),
    xF = (ph: number) => Math.sin(ph * Math.PI * 2.4) * 5 * Math.min(1, ph * 3);
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
  const dragonUni = U();
  const HM = new T.ShaderMaterial({
    uniforms: dragonUni,
    vertexShader: WOB + 'varying vec3 vW;varying vec3 vN;varying vec2 vUv;void main(){vUv=uv;vec3 w=wob((modelMatrix*vec4(position,1.)).xyz);vW=w;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}',
    fragmentShader:
      'uniform float uFire;uniform vec3 fogColor;uniform float fogDensity;varying vec3 vW;varying vec3 vN;varying vec2 vUv;void main(){vec3 n=normalize(vN);vec2 q=vec2(vUv.x*300.,vUv.y*16.);q.y+=.5*mod(floor(q.x),2.);vec2 f=fract(q);vec2 fw=fwidth(q);float far=smoothstep(.25,.6,max(fw.x,fw.y));float dd=length(vec2(f.x*1.05,(f.y-.5)*1.3));float edge=smoothstep(.78-fw.x,.95+fw.x,dd)*(1.-far);float shine=(1.-f.x)*.3*(1.-far);float belly=smoothstep(-.25,-.55,n.y);float band=smoothstep(.1,.2,fract(vUv.x*170.))*(1.-far*.8);vec3 gold=vec3(.95,.6,.1)*(1.+shine)-edge*vec3(.5,.34,.06);vec3 bel=vec3(1.,.82,.45)*mix(.72,1.,band);vec3 base=mix(gold,bel,belly);float lam=.42+.7*max(0.,dot(n,normalize(vec3(.35,1.,.5))));vec3 vd=normalize(cameraPosition-vW);float rim=pow(1.-max(0.,dot(n,vd)),3.);vec3 c=base*lam+vec3(1.,.72,.25)*rim*.45+vec3(1.4,.4,.05)*uFire;' +
      FOGF +
      'gl_FragColor=vec4(mix(c,fogColor,fg),1.);}',
  });
  const wobMat = (r: number, g2: number, b2: number) =>
    new T.ShaderMaterial({
      side: DS,
      uniforms: Object.assign(U(), { uCol: { value: new T.Color(r, g2, b2) } }),
      vertexShader: WOB + 'varying vec3 vW;void main(){vec3 w=wob((modelMatrix*vec4(position,1.)).xyz);vW=w;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}',
      fragmentShader: 'uniform vec3 uCol;uniform vec3 fogColor;uniform float fogDensity;uniform float uFire;varying vec3 vW;void main(){vec3 c=uCol+vec3(.5,.18,0.)*uFire;' + FOGF + 'gl_FragColor=vec4(mix(c,fogColor,fg),1.);}',
    });
  const spineM = wobMat(1.45, 0.92, 0.24), flameM = wobMat(1.35, 0.3, 0.07), clawM = wobMat(1.5, 1.35, 0.95);
  const SEG = 420, RAD = 16,
    R = (u: number) => (u < 0.05 ? 1.2 + (u / 0.05) * 0.7 : u < 0.55 ? 1.9 + 0.12 * Math.sin(u * 50) : 1.9 - Math.pow((u - 0.55) / 0.45, 1.2) * 1.5);
  const tubeG = new T.TubeGeometry(curve, SEG, 1, RAD, false), pa = tubeG.attributes.position, ringP: T.Vector3[] = [];
  for (let r0 = 0; r0 <= SEG; r0++) ringP.push(curve.getPointAt(r0 / SEG));
  for (let k = 0; k < pa.count; k++) {
    const ring = Math.floor(k / (RAD + 1)), u = ring / SEG, pp = ringP[ring], r = R(u);
    pa.setXYZ(k, pp.x + (pa.getX(k) - pp.x) * r, pp.y + (pa.getY(k) - pp.y) * r, pp.z + (pa.getZ(k) - pp.z) * r);
  }
  tubeG.computeVertexNormals();
  g.add(new T.Mesh(tubeG, HM));
  const frame = (u: number) => {
    const P = curve.getPointAt(u), Tg = curve.getTangentAt(u), side = new T.Vector3().crossVectors(Tg, YV).normalize(), up = new T.Vector3().crossVectors(side, Tg).normalize();
    return { P, T: Tg, side, up };
  };
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
  for (let i = 0; i < 96; i++) {
    const u = 0.035 + (i / 96) * 0.93, fr = frame(u), h = (1.9 - u * 1.3) * (i % 2 ? 0.75 : 1);
    cone(0.55 - u * 0.3, h, i % 2 ? flameM : spineM, fr.P.clone().addScaledVector(fr.up, R(u) * 0.8), fr.up.clone().multiplyScalar(0.85).addScaledVector(fr.T, 0.55), fr.side);
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
      const sh = fr.P.clone().addScaledVector(sd, r * 0.7).addScaledVector(fr.up, -r * 0.35);
      const el = sh.clone().addScaledVector(sd, 1.8).addScaledVector(fr.up, -2.4).addScaledVector(fw, 1.6);
      const wr = el.clone().addScaledVector(sd, 0.2).addScaledVector(fr.up, -2.3).addScaledVector(fw, 1.5);
      ttube([sh, sh.clone().lerp(el, 0.5).addScaledVector(sd, 0.35).addScaledVector(fr.up, 0.25), el], 0.95, 0.6, HM);
      ttube([el, el.clone().lerp(wr, 0.5).addScaledVector(fw, -0.2), wr], 0.55, 0.36, HM);
      const kj = new T.Mesh(new T.SphereGeometry(0.62, 12, 8), HM);
      kj.position.copy(el);
      g.add(kj);
      for (let k = 0; k < 3; k++) cone(0.26, 1.8 - k * 0.3, flameM, el, fr.T.clone().multiplyScalar(front ? 1 : 0.4).addScaledVector(fr.up, 0.35 + k * 0.3).addScaledVector(sd, 0.3), sd);
      const hand = new T.Mesh(new T.SphereGeometry(0.5, 12, 8), HM);
      hand.position.copy(wr);
      g.add(hand);
      for (let k = 0; k < 4; k++) cone(0.15, 1.2, clawM, wr, fr.up.clone().multiplyScalar(-0.75).addScaledVector(fr.T, -0.55).addScaledVector(sd, (k - 1.5) * 0.4), null);
    }
  };
  legAt(0.13, true);
  legAt(0.5, false);
  const tf = frame(1);
  for (let k = 0; k < 9; k++) {
    const an = -1 + (k / 8) * 2;
    cone(0.4, 3.8 - Math.abs(an) * 1.4, k % 2 ? spineM : flameM, tf.P, tf.T.clone().multiplyScalar(Math.cos(an)).addScaledVector(tf.up, Math.sin(an)), tf.side);
  }
  const hornM = new T.MeshBasicMaterial({ color: new T.Color(1.35, 1.15, 0.75) }),
    whiskM = new T.MeshBasicMaterial({ color: new T.Color(1.5, 1.05, 0.35) }),
    eyeM = new T.MeshBasicMaterial({ color: new T.Color(0.3, 2.0, 2.4) }),
    inkM = new T.MeshBasicMaterial({ color: 0x0a0608 }),
    toothM = new T.MeshBasicMaterial({ color: new T.Color(1.15, 1.1, 0.95) }),
    mouthM = new T.MeshBasicMaterial({ color: new T.Color(0.9, 0.12, 0.06), side: DS }),
    flameB = new T.MeshBasicMaterial({ color: new T.Color(1.35, 0.3, 0.07), side: DS });
  const hd = new T.Group();
  g.add(hd);
  const P0 = curve.getPointAt(0), fwd = curve.getTangentAt(0).negate();
  hd.position.copy(P0).addScaledVector(fwd, 0.9);
  hd.quaternion.setFromUnitVectors(V(0, 0, 1), fwd);
  hd.rotateX(0.22);
  hd.scale.setScalar(1.2);
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
    ttube([V(sx * 0.55, 1.35, 0.1), V(sx * 0.95, 2.3, -1.4), V(sx * 1.1, 2.9, -3.2), V(sx * 1.0, 3.7, -4.6)], 0.28, 0.07, hornM, hd);
    ttube([V(sx * 1.0, 2.5, -1.9), V(sx * 1.5, 3.4, -2.1), V(sx * 1.75, 4.1, -2.9)], 0.15, 0.05, hornM, hd);
    ttube([V(sx * 1.0, 0.25, 4.7), V(sx * 2.4, 0.55, 4.8), V(sx * 3.6, -0.3, 3.0), V(sx * 4.4, -1.6, 0.2), V(sx * 4.7, -3.0, -2.5)], 0.11, 0.03, whiskM, hd);
    cone(0.3, 1.9, flameB, V(sx * 0.95, 1.4, 1.1), V(sx * 0.4, 0.9, -0.8), V(1, 0, 0), hd);
    for (let z = 3.3; z <= 5.1; z += 0.45) cone(0.1, z > 4.8 ? 0.8 : 0.45, toothM, V(sx * 0.78, -0.25, z), V(0, -1, 0.1), null, hd);
  }
  for (let i = 0; i < 14; i++) {
    const an = -0.25 * Math.PI + (i / 13) * 1.5 * Math.PI, dx = Math.cos(an), dy = Math.sin(an);
    cone(0.34, 2.4 + (i % 3) * 0.6, flameB, V(dx * 1.45, 0.3 + dy * 1.3, -1.0), V(dx * 0.6, dy * 0.5 + 0.2, -1), V(0, 0, 1).cross(V(dx, dy, 0)), hd);
  }
  for (let k = -1; k <= 1; k++) cone(0.24, 2 - Math.abs(k) * 0.4, flameB, V(k * 0.45, -1.3, 1.2), V(k * 0.3, -1, -0.7), V(1, 0, 0), hd);
  const jaw = new T.Group();
  jaw.position.set(0, -0.55, 0.6);
  jaw.rotation.x = 0.42;
  hd.add(jaw);
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
