import type { Engine } from './engine';
import { animShards } from './shards';
import { placeCraft } from './craft';
import { animAirships } from './airships';

/** Per-frame life of the city: lens, rain, searchlights and airships, sky traffic, gate holograms, the dragon's fire, Bến Thành clocks. */
export function animateWorld(e: Engine, dt: number, t: number) {
  const c = e.cam, W = e.w, ride = e.S.phase === 'ride';
  W.sky.position.copy(c.position);
  animAirships(e.airships, t);
  animShards(e.shards, dt, t);
  if (e.post) {
    const L = e.post.lens.uniforms, tg = ride ? Math.max(0, Math.min(1, (Math.abs(e.bike.v) - 45) / 100)) : 0;
    L.uSpeed.value += (tg - L.uSpeed.value) * Math.min(1, dt * 3);
    L.uTime.value = t;
  }
  const ru = W.rain.material.uniforms;
  ru.uTime.value = t;
  ru.uCam.value.copy(c.position);
  ru.uSp.value = ride ? e.bike.v : 30;

  // Sky traffic wraps around the camera and climbs over the gates.
  const m = e.m4, cz = c.position.z;
  W.sp.forEach((s, i) => {
    s.z += s.v * dt;
    if (s.z < cz - 1900) s.z += 2300;
    if (s.z > cz + 400) s.z -= 2300;
    let y = s.y + Math.sin(t * 0.8 + s.ph) * 0.4;
    const d = Math.sign(s.v);
    if (Math.abs(s.x) < 36)
      for (const zc of W.clearZ) {
        if (y >= zc.y) continue;
        const ds = Math.max(0, s.z - zc.z0, zc.z1 - s.z);
        if (ds < 70) {
          const k = 1 - ds / 70;
          y += (zc.y - y) * k * k * (3 - 2 * k);
        }
      }
    s._y = y;
    m.makeTranslation(s.x, y, s.z);
    W.spBody.setMatrixAt(i, m);
    m.makeTranslation(s.x, y, s.z + d * 3.3);
    W.spLight.setMatrixAt(i * 2, m);
    m.makeTranslation(s.x, y + 0.1, s.z - d * 3.3);
    W.spLight.setMatrixAt(i * 2 + 1, m);
  });
  placeCraft(e.craft, W.sp, W.spBody, W.spLight, c.position, t);
  W.spBody.instanceMatrix.needsUpdate = true;
  W.spLight.instanceMatrix.needsUpdate = true;

  W.gates.forEach((g, i) => {
    g.holo.material.opacity = 0.85 + 0.08 * Math.sin(t * 1.2 + i);
    g.holo.position.y = g.hy + Math.sin(t * 1.2 + i) * 0.35;
    g.scan.material.opacity = 0.3 + 0.12 * Math.sin(t * 1.2 + i);
  });

  // The dragon breathes fire for 3.2s whenever the camera comes within range (7s cooldown).
  const F = W.fire, hp = W.dragonHead, dist = c.position.z - hp.z, DUR = 3.2;
  F.cd -= dt;
  if (dist > 8 && dist < 170 && F.cd <= 0) {
    F.t = 0;
    F.cd = 7;
    e.audio.sfx('fire');
  }
  F.t += dt;
  const on = F.t < DUR ? Math.sin(Math.min(1, F.t / DUR) * Math.PI) : 0;
  if (F.t < DUR) {
    let n = Math.floor(dt * 560 * (0.4 + on) + Math.random());
    while (n-- > 0) {
      const i = F.next, k = i * 3;
      F.next = (F.next + 1) % F.n;
      F.pos[k] = hp.x + (Math.random() - 0.5) * 0.6;
      F.pos[k + 1] = hp.y + (Math.random() - 0.5) * 0.6;
      F.pos[k + 2] = hp.z;
      F.vel[k] = (Math.random() - 0.5) * 7;
      F.vel[k + 1] = -7 + (Math.random() - 0.5) * 5;
      F.vel[k + 2] = 38 + Math.random() * 20;
      F.life[i] = 0;
      F.max[i] = 0.9 + Math.random() * 0.8;
      F.sz[i] = 0.8 + Math.random() * 1.1;
    }
  }
  let alive = false;
  for (let i = 0; i < F.n; i++) {
    if (F.life[i] >= 1) continue;
    alive = true;
    const k = i * 3;
    F.life[i] = Math.min(1, F.life[i] + dt / F.max[i]);
    F.vel[k] = F.vel[k] * (1 - dt * 0.9) + Math.sin(t * 9 + i) * dt * 7;
    F.vel[k + 1] = F.vel[k + 1] * (1 - dt * 0.9) + 3.5 * dt;
    F.vel[k + 2] *= 1 - dt * 0.6;
    F.pos[k] += F.vel[k] * dt;
    F.pos[k + 1] += F.vel[k + 1] * dt;
    F.pos[k + 2] += F.vel[k + 2] * dt;
  }
  F.pts.visible = alive;
  if (alive) {
    const ga = F.pts.geometry.attributes;
    ga.position.needsUpdate = true;
    ga.aLife.needsUpdate = true;
    ga.aSize.needsUpdate = true;
  }
  F.light.intensity = on * (2.2 + Math.sin(t * 11) * 0.3);
  W.dragonUni.uFire.value = on * 0.6;
  const fe = e.el('fx-fire');
  if (fe) fe.style.opacity = String(on * Math.max(0, 1 - Math.abs(dist - 50) / 150));

  // Bến Thành clock faces show Saigon time (UTC+7).
  const now = new Date(), hr = (now.getUTCHours() + 7) % 12, mn = now.getUTCMinutes() + now.getUTCSeconds() / 60;
  W.clocks.forEach((ck) => {
    ck.h.rotation.z = (-(hr + mn / 60) / 12) * Math.PI * 2;
    ck.m.rotation.z = (-mn / 60) * Math.PI * 2;
  });
}
