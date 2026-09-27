import * as T from 'three';
import type { Car } from './world';
import { radialTex } from './textures';

export type Craft = {
  K: number;
  D: T.Vector3[];
  body: T.InstancedMesh;
  glow: T.InstancedMesh;
  rot: T.InstancedMesh;
  stat: T.InstancedMesh[];
  cols: T.Color[];
  gcols: T.Color[];
  idx: number[];
  hide: T.Matrix4;
  m: T.Matrix4;
  r: T.Matrix4;
  t: T.Matrix4;
  e: T.Euler;
  /** Frames until the nearest-car sort runs again. */
  st: number;
};

/**
 * Detailed quad-rotor air cars. The K cars of the sky traffic nearest the camera are drawn with this
 * model instead of the plain box body, so the traffic looks rich up close and stays cheap far away.
 */
export function buildCraft(scene: T.Scene, cars: Car[]): Craft {
  const K = 16, hide = new T.Matrix4().makeScale(1e-4, 1e-4, 1e-4).setPosition(0, -500, 0), V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
  const merge = (gs: T.BufferGeometry[]) => {
    const P: number[] = [], N: number[] = [], U: number[] = [];
    gs.forEach((g) => {
      const q = g.index ? g.toNonIndexed() : g;
      P.push(...Array.from(q.attributes.position.array));
      N.push(...Array.from(q.attributes.normal.array));
      if (q.attributes.uv) U.push(...Array.from(q.attributes.uv.array));
      else U.push(...new Array(q.attributes.position.count * 2).fill(0.5));
    });
    const o = new T.BufferGeometry();
    o.setAttribute('position', new T.Float32BufferAttribute(P, 3));
    o.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
    o.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
    return o;
  };
  const mk = (geo: T.BufferGeometry, mat: T.Material, n = K) => {
    const im = new T.InstancedMesh(geo, mat, n);
    im.frustumCulled = false;
    for (let j = 0; j < n; j++) im.setMatrixAt(j, hide);
    scene.add(im);
    return im;
  };
  const D = [V(2.15, -0.05, 1.5), V(-2.15, -0.05, 1.5), V(2.15, -0.05, -1.7), V(-2.15, -0.05, -1.7)];
  const prof = [[0.04, 3.3], [0.3, 3.05], [0.62, 2.5], [0.86, 1.6], [0.98, 0.5], [1.0, -0.4], [0.9, -1.5], [0.66, -2.5], [0.42, -3.05], [0.3, -3.25], [0.04, -3.3]].map((p) => new T.Vector2(p[0], p[1]));
  const fus = new T.LatheGeometry(prof, 28);
  fus.rotateX(Math.PI / 2);
  fus.scale(1.15, 0.62, 1);
  fus.computeVertexNormals();
  {
    const nn = fus.attributes.normal;
    for (let k = 0; k < nn.count; k++) {
      const x = nn.getX(k), y = nn.getY(k), z = nn.getZ(k), l = Math.hypot(x, y, z);
      if (!(l > 1e-4)) nn.setXYZ(k, 0, 1, 0);
      else nn.setXYZ(k, x / l, y / l, z / l);
    }
  }
  const bodyM = new T.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.7, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 });
  const body = mk(fus, bodyM);
  const can = new T.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  can.scale(0.6, 0.42, 1.25);
  can.translate(0, 0.28, 1.2);
  const canopy = mk(can, new T.MeshStandardMaterial({ color: 0x05060a, metalness: 0.9, roughness: 0.05, emissive: 0x06202a }));
  const arm1 = new T.BoxGeometry(4.3, 0.14, 0.42);
  arm1.translate(0, -0.05, 1.5);
  const arm2 = arm1.clone();
  arm2.translate(0, 0, -3.2);
  const fin = new T.BoxGeometry(0.08, 0.85, 1.0);
  fin.rotateX(-0.5);
  fin.translate(0, 0.62, -2.55);
  const stab = new T.BoxGeometry(1.8, 0.05, 0.5);
  stab.translate(0, 0.12, -2.9);
  const hubs = D.map((d) => {
    const h = new T.CylinderGeometry(0.16, 0.2, 0.3, 10);
    h.translate(d.x, d.y, d.z);
    return h;
  });
  const rings = D.map((d) => {
    const r = new T.TorusGeometry(0.84, 0.15, 8, 28);
    r.rotateX(Math.PI / 2);
    r.translate(d.x, d.y, d.z);
    return r;
  });
  const darkM = new T.MeshStandardMaterial({ color: 0x1c1d24, metalness: 0.85, roughness: 0.38 });
  const frame = mk(merge([arm1, arm2, fin, stab, ...hubs, ...rings]), darkM);
  const bl = new T.BoxGeometry(1.5, 0.025, 0.12), bl2 = bl.clone();
  bl2.rotateY(Math.PI / 2);
  const rot = mk(merge([bl, bl2]), new T.MeshStandardMaterial({ color: 0x2a2b33, metalness: 0.6, roughness: 0.5 }), K * 4);
  const glT = radialTex(64, [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
  const disc = D.map((d) => {
    const c = new T.CircleGeometry(0.95, 20);
    c.rotateX(Math.PI / 2);
    c.translate(d.x, d.y - 0.22, d.z);
    return c;
  });
  const noz = new T.CircleGeometry(0.55, 16);
  noz.rotateY(Math.PI);
  noz.translate(0, 0, -3.3);
  const under = new T.CircleGeometry(2.4, 20);
  under.rotateX(Math.PI / 2);
  under.translate(0, -0.7, -0.1);
  const glow = mk(merge([...disc, noz, under]), new T.MeshBasicMaterial({ map: glT, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  const blur = D.map((d) => {
    const c = new T.CircleGeometry(0.72, 24);
    c.rotateX(-Math.PI / 2);
    c.translate(d.x, d.y + 0.02, d.z);
    return c;
  });
  const blurM = mk(merge(blur), new T.MeshBasicMaterial({ color: new T.Color(0.14, 0.14, 0.17), transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  const sph = (x: number, y: number, z: number, r: number) => {
    const g = new T.SphereGeometry(r, 8, 6);
    g.translate(x, y, z);
    return g;
  };
  const navR = mk(sph(-3.0, -0.05, 1.5, 0.09), new T.MeshBasicMaterial({ color: new T.Color(2.4, 0.15, 0.1) }));
  const navG = mk(sph(3.0, -0.05, 1.5, 0.09), new T.MeshBasicMaterial({ color: new T.Color(0.15, 2.2, 0.5) }));
  const hA = new T.BoxGeometry(0.34, 0.08, 0.08);
  hA.translate(0.42, -0.18, 2.95);
  const hB = hA.clone();
  hB.translate(-0.84, 0, 0);
  const head = mk(merge([hA, hB, sph(0, 1.02, -2.8, 0.07)]), new T.MeshBasicMaterial({ color: new T.Color(2.2, 2.3, 2.5) }));
  const cols = [0x2a2d34, 0xc9c9cc, 0x1f3a4a, 0xc47a14, 0x5a1020, 0x3b3f2e].map((c) => new T.Color(c)),
    gcols = [new T.Color(0.35, 0.9, 1.25), new T.Color(1.2, 0.3, 0.8), new T.Color(1.2, 0.7, 0.3)];
  return {
    K, D, body, glow, rot,
    stat: [body, canopy, frame, glow, blurM, navR, navG, head],
    cols, gcols,
    idx: cars.map((_, i) => i),
    hide, m: new T.Matrix4(), r: new T.Matrix4(), t: new T.Matrix4(), e: new T.Euler(), st: 0,
  };
}

/** Swap the K cars nearest `cp` to the detailed model (re-sorted every 12 frames) and spin their rotors. */
export function placeCraft(F: Craft, sp: Car[], spBody: T.InstancedMesh, spLight: T.InstancedMesh, cp: T.Vector3, t: number) {
  const d2 = (i: number) => {
    const s = sp[i], dx = s.x - cp.x, dy = (s._y || s.y) - cp.y, dz = s.z - cp.z;
    return dx * dx + dy * dy + dz * dz;
  };
  F.st -= 1;
  if (F.st <= 0) {
    F.idx.sort((a, b) => d2(a) - d2(b));
    F.st = 12;
  }
  for (let j = 0; j < F.K; j++) {
    const i = F.idx[j], s = sp[i];
    F.e.set(0.05, s.v > 0 ? 0 : Math.PI, Math.sin(t * 0.7 + s.ph) * 0.05, 'YXZ');
    F.m.makeRotationFromEuler(F.e);
    F.m.setPosition(s.x, s._y, s.z);
    F.stat.forEach((p) => p.setMatrixAt(j, F.m));
    F.body.setColorAt(j, F.cols[i % F.cols.length]);
    F.glow.setColorAt(j, F.gcols[i % 3]);
    for (let r = 0; r < 4; r++) {
      F.r.makeRotationY(t * 7 * (r % 2 ? 1 : -1) + j);
      F.r.setPosition(F.D[r]);
      F.t.multiplyMatrices(F.m, F.r);
      F.rot.setMatrixAt(j * 4 + r, F.t);
    }
    spBody.setMatrixAt(i, F.hide);
    spLight.setMatrixAt(i * 2, F.hide);
    spLight.setMatrixAt(i * 2 + 1, F.hide);
  }
  [...F.stat, F.rot].forEach((p) => (p.instanceMatrix.needsUpdate = true));
  if (F.body.instanceColor) F.body.instanceColor.needsUpdate = true;
  if (F.glow.instanceColor) F.glow.instanceColor.needsUpdate = true;
}
