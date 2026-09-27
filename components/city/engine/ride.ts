import { CPS } from '../data';
import type { Engine } from './engine';
import { animCockpit } from './cockpit';
import { collectNear } from './shards';
import { introLogCount, introPct, introStatus, kmh, laneLimit, railTop, sectorAt } from './pure';

/** Cold-boot flyover: ~11s along the camera path while the loader fills; then the "ready" card. */
export function intro(e: Engine, dt: number, t: number) {
  e.u += dt / 11;
  const u = Math.min(e.u, 1), c = e.cam;
  c.position.copy(e.path.getPointAt(u));
  if (e.u > 1) c.position.y += (e.u - 1) * 14;
  c.lookAt(e.v3.copy(c.position).add(e.path.getTangentAt(u)));
  c.rotateZ(Math.sin(t * 0.4) * 0.02);
  const pct = introPct(e.u);
  const pe = e.el('ld-pct');
  if (pe) pe.textContent = String(pct).padStart(2, '0');
  const be = e.el('ld-bar');
  if (be) be.style.width = pct + '%';
  const se = e.el('ld-status');
  if (se) se.textContent = introStatus(pct);
  const n = introLogCount(pct);
  if (n !== e.S.logN) e.set({ logN: n });
  if (pct >= 100 && e.S.phase === 'loading') e.set({ phase: 'ready' });
}

/** One frame of the ride: throttle / autopilot, steering, fly mode, camera, cockpit, gates, shards, HUD. */
export function ride(e: Engine, dt: number, t: number) {
  const b = e.bike, k = e.keys, S = e.S, fly = S.mode === 'fly';
  let thr = k.w ? 1 : 0, brk = k.s ? 1 : 0;
  const boost = !!k.boost;
  if (S.auto) {
    const tg = S.hold ? 0 : S.cruise ? 58 : 44;
    thr = b.v < tg - 1 ? 0.7 : 0;
    brk = b.v > tg + 3 ? (S.hold ? 1.3 : 0.4) : 0;
  }
  const maxV = (fly ? 120 : 90) * (boost ? 1.55 : 1);
  b.v += thr * (boost ? 62 : 34) * dt;
  b.v -= brk * 72 * dt;
  b.v -= b.v * 0.16 * dt * (thr ? 0.35 : 1);
  if (e.wheel) {
    if (!(S.auto && S.hold)) b.v += e.wheel * 0.03;
    e.wheel = 0;
  }
  b.v = Math.max(-8, Math.min(maxV, b.v));
  if (!thr && !brk && Math.abs(b.v) < 0.3) b.v = 0;
  const inp = (k.d ? 1 : 0) - (k.a ? 1 : 0);
  b.st += (inp - b.st) * Math.min(1, dt * 5);
  const air = fly || e.landing;
  b.x += b.st * (5 + Math.abs(b.v) * 0.2) * dt;
  const lim = laneLimit(air, b.z - CPS[0].z), cx = Math.max(-lim, Math.min(lim, b.x));
  b.x += (cx - b.x) * (air ? 1 : Math.min(1, dt * 5));
  const vUp = (k.up ? 1 : 0) - (k.dn ? 1 : 0);
  if (fly) e.alt = Math.max(6, Math.min(150, e.alt + vUp * 28 * dt));
  if (fly) {
    if (e.ckOut >= 0.3) b.y += (e.alt - b.y) * Math.min(1, dt * 2.2);
  } else if (e.landing) {
    b.y -= Math.max((b.y - 1.35) * 2.4, 14) * dt;
    if (b.y <= 1.35) {
      b.y = 1.35;
      e.landing = false;
      e.ckT = 0;
      e.tdT = 0;
      e.flash('TOUCHDOWN // BIKE MODE');
    }
  } else b.y = 1.35;
  e.tdT += dt;
  b.z -= b.v * dt;
  if (b.z < -2700) {
    b.z += 2850;
    e.visited.clear();
    e.flash(S.cruise ? 'LOOP ∞ // BACK DOWNTOWN' : 'SECTOR LOOP // BACK DOWNTOWN');
  }
  if (b.z > 170) {
    b.z = 170;
    if (b.v < 0) b.v = 0;
  }

  const c = e.cam, sp = Math.abs(b.v);
  const ml = Math.min(1, dt * 3);
  e.mx += (e.tmx - e.mx) * ml;
  e.my += (e.tmy - e.my) * ml;
  const bob = fly
    ? Math.sin(t * 1.3) * 0.25
    : e.landing
      ? 0
      : Math.sin(t * (4 + sp * 0.25)) * 0.012 * Math.min(sp / 30, 1) - (e.tdT < 0.45 ? 0.16 * Math.sin((e.tdT / 0.45) * Math.PI) : 0);
  c.position.set(b.x, b.y + bob, b.z);
  c.rotation.set(-e.my * 0.07 + (fly ? vUp * 0.12 - 0.05 : e.landing ? -0.14 * Math.min(1, (b.y - 1.35) / 6) : 0), -b.st * 0.07 - e.mx * 0.14, -b.st * (air ? 0.14 : 0.08));
  const fov = 66 + Math.min(10, sp * 0.07);
  if (Math.abs(c.fov - fov) > 0.05) {
    c.fov += (fov - c.fov) * Math.min(1, dt * 4);
    c.updateProjectionMatrix();
  }

  // Cockpit slides in on ignition / touchdown and drops away on lift-off.
  e.ckT += dt;
  const ease = Math.min(1, e.ckT / 1.3), ck = e.ck.ck;
  if (fly) {
    e.ckOut += dt;
    const o = Math.min(1, e.ckOut / 0.3);
    ck.visible = o < 1;
    ck.position.y = -0.1 - 0.9 * o * o;
  } else {
    ck.visible = !e.landing;
    ck.position.y = -0.1 - 0.9 * Math.pow(1 - ease, 3);
  }
  ck.rotation.z = -b.st * 0.05;
  if (ck.visible) e.boostOn = animCockpit(e.ck, dt, b.v, boost && thr > 0 && !fly);
  e.dashAcc += dt;
  if (e.dashAcc > 0.1) {
    e.dashAcc = 0;
    e.drawDash();
  }

  // Autopilot stops at each gate once per lap; the sector file opens around each gate.
  const cur = sectorAt(b.z);
  if (S.auto && !S.hold && !S.cruise)
    for (const cp of CPS) {
      if (!e.visited.has(cp.id) && b.z <= cp.z + 20 && b.z > cp.z - 60) {
        e.visited.add(cp.id);
        e.audio.sfx('blip');
        e.set({ hold: true });
      }
    }
  const id = cur ? cur.id : null;
  if (id !== S.section) {
    if (id) e.audio.sfx('open');
    e.set({ section: id, dismissed: null });
  }

  for (const i of collectNear(e.shards, c.position)) e.shardCollected(i);

  // HUD readouts every third frame.
  e.hf = (e.hf + 1) % 3;
  if (e.hf) return;
  const se = e.el('hud-spd');
  if (se) se.textContent = kmh(sp);
  const be = e.el('hud-bar');
  if (be) be.style.width = Math.min(100, (sp / 140) * 100) + '%';
  const ae = e.el('hud-alt');
  if (ae) ae.textContent = 'ALT ' + String(Math.round(b.y)).padStart(3, '0') + ' M · Z ' + String(Math.round(-b.z)).padStart(4, '0');
  const rd = e.el('rail-dot');
  if (rd) rd.style.top = railTop(b.z) + '%';
  const fx = e.el('fx-speed');
  if (fx) fx.style.opacity = String(Math.min(1, Math.max(0, (sp - 40) / 90)));
}
