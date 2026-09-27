import * as T from 'three';
import { canvasTex, type Fonts } from './textures';

type Beam = { m: T.Mesh; sd: number; ph: number; sp: number };
type Ship = { g: T.Group; k: number; blink: T.Mesh[]; prev: T.Vector3 };
export type Airships = { beams: Beam[]; ships: Ship[]; screen: T.MeshBasicMaterial };

/** Searchlight beams sweeping the sky over the avenue, and two airships with TOPY.OS screens on their flanks. */
export function buildAirships(scene: T.Scene, fonts: Fonts): Airships {
  const H = 950, bg = new T.CylinderGeometry(34, 1.4, H, 24, 1, true);
  bg.translate(0, H / 2, 0);
  // Brightest along the silhouette edges and near the ground; fades with height and distance.
  const beamMat = (col: [number, number, number]) =>
    new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      side: T.DoubleSide,
      uniforms: { uC: { value: new T.Color(col[0], col[1], col[2]) } },
      vertexShader: 'varying float vY;varying float vE;varying float vD;void main(){vY=position.y/950.;vec4 mv=modelViewMatrix*vec4(position,1.);vec3 n=normalize(normalMatrix*normal);vE=abs(dot(n,normalize(-mv.xyz)));vD=length(mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'uniform vec3 uC;varying float vY;varying float vE;varying float vD;void main(){float a=pow(vE,2.2)*pow(1.-vY,1.6)*.16*(1.-exp(-vD*.02))*exp(-vD*.0009);gl_FragColor=vec4(uC*a,1.);}',
    });
  const cols: [number, number, number][] = [[0.1, 0.8, 1], [1, 0.2, 0.7], [0.85, 0.8, 1]];
  const beams: Beam[] = [];
  for (let i = 0; i < 12; i++) {
    const sd = i % 2 ? 1 : -1, m = new T.Mesh(bg, beamMat(cols[i % 3]));
    m.position.set(sd * (38 + ((i * 17) % 34)), 0, 220 - Math.floor(i / 2) * 250);
    m.frustumCulled = false;
    scene.add(m);
    beams.push({ m, sd, ph: i * 1.7, sp: 0.18 + (i % 4) * 0.05 });
  }

  const hullM = new T.MeshStandardMaterial({ color: 0x1a1726, metalness: 0.7, roughness: 0.35 });
  const stripM = new T.MeshBasicMaterial({ color: new T.Color(0.2, 1.3, 1.6) }), stripP = new T.MeshBasicMaterial({ color: new T.Color(1.6, 0.25, 0.9) });
  const scrTex = canvasTex(2730, 512, (g) => {
    g.fillStyle = '#020104';
    g.fillRect(0, 0, 2730, 512);
    g.fillStyle = '#FF2D95';
    g.fillRect(0, 0, 2730, 16);
    g.fillRect(0, 496, 2730, 16);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `800 400px ${fonts.display}`;
    g.lineJoin = 'round';
    g.lineWidth = 26;
    g.strokeStyle = '#FF2D95';
    g.strokeText('TOPY.OS', 1365, 275);
    g.fillStyle = '#ffffff';
    g.fillText('TOPY.OS', 1365, 275);
  });
  scrTex.anisotropy = 16;
  scrTex.colorSpace = T.SRGBColorSpace;
  const screen = new T.MeshBasicMaterial({ map: scrTex, color: new T.Color(1, 1, 1), fog: false, toneMapped: false });
  const redL = new T.MeshBasicMaterial({ color: new T.Color(3, 0.2, 0.2), fog: false }), grnL = new T.MeshBasicMaterial({ color: new T.Color(0.2, 3, 0.6), fog: false });
  // Light cone shining down from the gondola.
  const cone = new T.CylinderGeometry(1.5, 26, 150, 20, 1, true);
  cone.translate(0, -75, 0);
  const coneM = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    side: T.DoubleSide,
    vertexShader: 'varying float vY;varying float vE;void main(){vY=-position.y/150.;vec4 mv=modelViewMatrix*vec4(position,1.);vE=abs(dot(normalize(normalMatrix*normal),normalize(-mv.xyz)));gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying float vY;varying float vE;void main(){float a=pow(vE,2.)*pow(1.-vY,2.)*.22;gl_FragColor=vec4(vec3(.7,.95,1.)*a,1.);}',
  });
  const ships: Ship[] = [];
  for (let k = 0; k < 2; k++) {
    const sh = new T.Group();
    scene.add(sh);
    const add = (geo: T.BufferGeometry, mt: T.Material, x = 0, y = 0, z = 0) => {
      const o = new T.Mesh(geo, mt);
      o.position.set(x, y, z);
      sh.add(o);
      return o;
    };
    add(new T.SphereGeometry(1, 40, 20), hullM).scale.set(15, 13, 62);
    for (const z of [-40, -14, 14, 40]) {
      const rr = Math.sqrt(1 - (z / 62) ** 2);
      add(new T.TorusGeometry(1, 0.012, 6, 48), k ? stripP : stripM, 0, 0, z).scale.set(15.1 * rr, 13.1 * rr, 1);
    }
    add(new T.BoxGeometry(5, 4, 34), hullM, 0, -13);
    add(new T.BoxGeometry(5.2, 0.4, 34), k ? stripM : stripP, 0, -11.2);
    for (const sd of [-1, 1]) {
      add(new T.BoxGeometry(0.6, 13.4, 66), hullM, sd * 15, 1);
      add(new T.PlaneGeometry(64, 12), screen, sd * 15.32, 1).rotation.y = (sd * Math.PI) / 2;
      add(new T.BoxGeometry(0.8, 14, 12), hullM, sd * 8, 6, 54).rotation.z = sd * 0.5;
    }
    add(new T.BoxGeometry(0.8, 16, 14), hullM, 0, 12, 54);
    const blink = [add(new T.SphereGeometry(1.1, 10, 8), redL, -15.5, 0, 6), add(new T.SphereGeometry(1.1, 10, 8), grnL, 15.5, 0, 6), add(new T.SphereGeometry(1.2, 10, 8), redL, 0, 20, 54)];
    add(cone, coneM, 0, -15).frustumCulled = false;
    ships.push({ g: sh, k, blink, prev: new T.Vector3() });
  }
  return { beams, ships, screen };
}

/** Sweep the beams, flicker the screens, fly the airships on slow loops and blink their nav lights. */
export function animAirships(A: Airships, t: number) {
  for (const b of A.beams) b.m.rotation.set(0.28 * Math.sin(t * b.sp * 0.8 + b.ph * 2.3), 0, -b.sd * (0.3 + 0.24 * Math.sin(t * b.sp + b.ph)));
  const f = 0.9 + 0.1 * Math.sin(t * 2.2) - (Math.sin(t * 17) > 0.97 ? 0.35 : 0);
  A.screen.color.setRGB(f, f, f);
  for (const S of A.ships) {
    const a = t * 0.018 + S.k * Math.PI, g = S.g;
    g.position.set(Math.sin(a * 1.7) * (70 + S.k * 30), 165 + S.k * 45 + Math.sin(t * 0.3 + S.k) * 3, -450 + Math.cos(a) * 720);
    const vx = g.position.x - S.prev.x, vz = g.position.z - S.prev.z;
    if (vx * vx + vz * vz > 1e-6) g.rotation.y = Math.atan2(vx, vz) + Math.PI;
    g.rotation.z = Math.sin(t * 0.25 + S.k) * 0.03;
    S.prev.copy(g.position);
    const on = (t * 1.1 + S.k * 0.5) % 1.6 < 0.14;
    S.blink.forEach((m) => (m.visible = on));
  }
}
