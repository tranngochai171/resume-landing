import * as T from 'three';
import { SH } from '../data';
import { radialTex } from './textures';

type ShardObj = { g: T.Group; cg: T.Mesh; bm: T.Mesh<T.CylinderGeometry, T.MeshBasicMaterial>; y: number; fade: number };
export type Shards = { list: ShardObj[]; got: Set<number> };

const STORE = 'topy3d_shards';

/** The eight floating data shards, each with a light beam; already-collected ones stay hidden. */
export function buildShards(scene: T.Scene): Shards {
  let saved: number[] = [];
  try {
    saved = JSON.parse(localStorage.getItem(STORE) || '[]');
  } catch {}
  const got = new Set(saved.filter((i) => i < SH.length));
  const halo = radialTex(128, [[0, 'rgba(255,255,255,.9)'], [0.25, 'rgba(255,255,255,.3)'], [1, 'rgba(255,255,255,0)']]);
  const cols = { FILE: new T.Color(0.3, 1.6, 2.0), TIP: new T.Color(1.9, 0.35, 1.1), KEY: new T.Color(2.0, 1.4, 0.4) };
  const core = new T.OctahedronGeometry(0.55, 0), cage = new T.OctahedronGeometry(0.95, 0), beamG = new T.CylinderGeometry(0.1, 0.1, 90, 6, 1, true);
  beamG.translate(0, 45, 0);
  const list = SH.map((d, i) => {
    const col = cols[d.k], g = new T.Group();
    g.position.set(d.p[0], d.p[1], d.p[2]);
    g.add(new T.Mesh(core, new T.MeshBasicMaterial({ color: col, transparent: true })));
    const cg = new T.Mesh(cage, new T.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: 0.6 }));
    g.add(cg);
    const hl = new T.Sprite(new T.SpriteMaterial({ map: halo, color: col.clone().multiplyScalar(0.5), transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    hl.scale.set(5, 5, 1);
    g.add(hl);
    const bm = new T.Mesh(beamG, new T.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.35), transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false }));
    bm.position.set(d.p[0], 0, d.p[2]);
    scene.add(bm);
    scene.add(g);
    const done = got.has(i);
    g.visible = bm.visible = !done;
    return { g, cg, bm, y: d.p[1], fade: -1 };
  });
  return { list, got };
}

/** Spin and bob the shards; a collected shard swells and fades out over 0.6s. */
export function animShards(sh: Shards, dt: number, t: number) {
  sh.list.forEach((s, i) => {
    if (!s.g.visible) return;
    s.g.rotation.y += dt * 1.1;
    s.cg.rotation.x -= dt * 0.7;
    if (s.fade >= 0) {
      s.fade += dt;
      const k = Math.min(1, s.fade / 0.6);
      s.g.scale.setScalar(1 + k * 2.5);
      s.g.children.forEach((o) => {
        ((o as T.Mesh).material as T.Material).opacity = (o === s.cg ? 0.6 : 1) * (1 - k);
      });
      s.bm.material.opacity = 0.5 * (1 - k);
      if (k >= 1) s.g.visible = s.bm.visible = false;
    } else s.g.position.y = s.y + Math.sin(t * 1.4 + i) * 0.22;
  });
}

/** Collects any shard within reach of `p` (bigger reach for the airborne ones). Returns the indices collected. */
export function collectNear(sh: Shards, p: T.Vector3): number[] {
  const hits: number[] = [];
  sh.list.forEach((s, i) => {
    if (s.fade >= 0 || sh.got.has(i)) return;
    const d = SH[i].p, dx = p.x - d[0], dy = p.y - d[1], dz = p.z - d[2];
    if (dx * dx + dy * dy + dz * dz < (d[1] > 10 ? 36 : 14)) {
      sh.got.add(i);
      s.fade = 0;
      hits.push(i);
    }
  });
  if (hits.length)
    try {
      localStorage.setItem(STORE, JSON.stringify(Array.from(sh.got)));
    } catch {}
  return hits;
}
