import * as T from 'three';
import { CPS } from '../data';
import { mkRng } from './pure';
import { canvasTex, radialTex, signTex, type Fonts } from './textures';
import { buildGates, type GateBits } from './monuments';
import type { Slice } from './yield';

export type Uni = {
  uTime: { value: number };
  fogColor: { value: T.Color };
  fogDensity: { value: number };
  uDist: { value: T.Texture };
  uWN: { value: T.Texture };
  uTex: { value: number };
};

/** A flying car of the sky-traffic grid. `_y` is its current (clearance-adjusted) height. */
export type Car = { x: number; y: number; z: number; v: number; ph: number; _y: number };

export type Fire = {
  n: number;
  pos: Float32Array;
  vel: Float32Array;
  life: Float32Array;
  max: Float32Array;
  sz: Float32Array;
  next: number;
  pts: T.Points<T.BufferGeometry, T.ShaderMaterial>;
  light: T.PointLight;
  /** Seconds since the last breath started, and cooldown until the next one. */
  t: number;
  cd: number;
};

export type World = GateBits & {
  uni: Uni;
  sky: T.Mesh;
  clearZ: { z0: number; z1: number; y: number }[];
  fire: Fire;
  sp: Car[];
  spBody: T.InstancedMesh;
  spLight: T.InstancedMesh;
  rain: T.LineSegments<T.BufferGeometry, T.ShaderMaterial>;
};

type Blk = { x: number; z: number; w: number; d: number; h: number; s: number; tube?: boolean };
type V3 = [number, number, number];

// GLSL shared by the city shaders: hash + fog.
const HS = 'float hs(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}';

/**
 * Builds the whole avenue: sky, towers and tube houses, road, lamps, wires, lanterns,
 * neon signage, gates (monuments.ts), dragon fire, sky traffic and rain.
 * Every rnd() call happens in the design's order so the seeded city matches it exactly.
 * `slice()` hands the main thread back between steps so the build never blocks input.
 */
export async function buildWorld(scene: T.Scene, FOG: T.Color, fonts: Fonts, texCache: Map<string, T.CanvasTexture>, slice: Slice): Promise<World> {
  const rnd = mkRng(1337),
    R = (a: number, b: number) => a + (b - a) * rnd();
  const ph1 = new T.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
  ph1.needsUpdate = true;
  const uni: Uni = { uTime: { value: 0 }, fogColor: { value: FOG }, fogDensity: { value: 0.0019 }, uDist: { value: ph1 }, uWN: { value: ph1 }, uTex: { value: 0 } };
  scene.add(new T.HemisphereLight(0x6a3aa0, 0x120818, 1.1));

  const sky = new T.Mesh(
    new T.SphereGeometry(5000, 32, 16),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: { fogColor: uni.fogColor, uTime: uni.uTime },
      vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'uniform vec3 fogColor;uniform float uTime;varying vec3 vP;' + HS +
        'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+1.),f.x),f.y);}float cf(vec2 p){return vn(p)*.5+vn(p*2.03)*.27+vn(p*4.1)*.15+vn(p*8.3)*.08;}void main(){vec3 dd=normalize(vP);float h=dd.y,t=uTime;vec3 hor=vec3(.34,.07,.3);vec3 top=vec3(.012,.008,.035);vec3 c=mix(fogColor,hor,smoothstep(-.02,.06,h));c=mix(c,top,smoothstep(.06,.55,h));c+=vec3(.05,.25,.35)*exp(-abs(h-.03)*60.)*.4;if(h>.05){vec2 sg=vec2(atan(dd.z,dd.x),asin(h))*170.;vec2 si=floor(sg);float r=hs(si);if(r>.984){vec2 sf=fract(sg)-.5-(vec2(hs(si+7.),hs(si+3.))-.5)*.6;c+=vec3(.8,.87,1.)*exp(-dot(sf,sf)*55.)*(.55+.45*sin(t*(1.+r*3.)+r*40.))*smoothstep(.05,.3,h)*(r-.984)*62.;}}if(h>.1){vec2 au=dd.xz/(h+.05);vec3 ac=vec3(0.);for(int i=0;i<3;i++){float fi=float(i);float y0=-1.3+fi*.95+.4*sin(au.x*.8+t*.05+fi*2.1)+.3*vn(vec2(au.x*1.2+fi*5.,t*.04));float d=au.y-y0;float up=clamp(-d*1.2+1.,0.,1.);float band=exp(-d*d*10.)*up*(.35+.65*vn(vec2(au.x*11.+t*.3+fi*3.,fi)))*(.6+.4*sin(au.x*3.+t*.2+fi));ac+=mix(vec3(.05,1.,.75),vec3(1.,.15,.75),clamp(fi*.45+.25*sin(au.x*.4+t*.03),0.,1.))*band;}c+=ac*.3*smoothstep(.1,.45,h);}vec3 P=normalize(vec3(.12,.31,-1.));vec3 R=normalize(cross(vec3(0.,1.,0.),P));vec3 U=cross(P,R);float dp=dot(dd,P);float pa=0.;if(dp>.5){vec2 q=vec2(dot(dd,R),dot(dd,U))/dp;float pr=.2,l=length(q);float tl=-.36;vec2 rq=vec2(cos(tl)*q.x-sin(tl)*q.y,sin(tl)*q.x+cos(tl)*q.y);float re=length(vec2(rq.x,rq.y/.23));float gap=smoothstep(.36,.37,re)*(1.-smoothstep(.385,.395,re));float ring=smoothstep(.265,.28,re)*(1.-smoothstep(.5,.53,re))*(.3+.7*vn(vec2(re*70.,1.)))*(1.-gap*.85);vec3 rc=mix(vec3(1.,.72,.95),vec3(.3,.85,1.2),vn(vec2(re*22.,7.)))*.85;vec3 pl=vec3(0.);if(l<pr){float z=sqrt(pr*pr-l*l)/pr;vec3 n=vec3(q/pr,z);float dif=clamp(dot(n,normalize(vec3(-.75,.4,.5))),0.,1.);float b=rq.y/pr;float bd=vn(vec2(b*7.+vn(q*14.+t*.004)*.9,2.));vec3 base=mix(vec3(.14,.04,.28),vec3(.62,.2,.5),bd);base=mix(base,vec3(.12,.4,.55),smoothstep(.55,.85,vn(vec2(b*19.,3.))));float rim=pow(1.-z,3.);pl=base*(.07+dif*.85)+vec3(1.3,.3,1.)*rim*(.35+dif*.9);pa=smoothstep(pr,pr-.003,l);}float halo=exp(-max(l-pr,0.)*24.)*step(pr-.002,l);c+=vec3(.9,.2,.75)*halo*.4;float rA=ring*.9;if(rq.y<0.){c=mix(c,pl,pa);c=mix(c,rc,rA);}else{c=mix(c,rc,rA);c=mix(c,pl,pa);}pa=max(pa,rA*.7);}if(h>0.){vec2 cu=dd.xz/(h+.12)*1.4;float cn=cf(cu);float cov=smoothstep(.48,.78,cn)*smoothstep(.01,.12,h)*(1.-smoothstep(.45,.85,h));vec3 cc=mix(vec3(.3,.08,.24),vec3(.06,.03,.09),smoothstep(.04,.35,h))*(.8+.4*cf(cu*1.7+3.));c=mix(c,cc,cov*(.85-.5*pa));}float sd=floor(t/5.5),ph=fract(t/5.5);if(ph<.28&&h>.18){vec2 a2=dd.xz/(h+.1);vec2 s0=vec2(hs(vec2(sd,1.))*4.-2.,hs(vec2(sd,2.))*3.-2.2);vec2 sv=normalize(vec2(hs(vec2(sd,3.))-.5,-1.));float k=ph/.28;vec2 w=a2-(s0+sv*k*3.2);float al=dot(w,-sv);float pp=length(w+sv*al);c+=vec3(.8,.95,1.3)*step(0.,al)*(1.-smoothstep(0.,.8,al))*exp(-pp*pp*30000.)*sin(k*3.1416)*2.2;}gl_FragColor=vec4(c,1.);}',
    }),
  );
  sky.renderOrder = -1;
  scene.add(sky);

  // Buildings: a front row of towers + narrow "nhà ống" tube houses on each side, a back row, the far city.
  const Bs: Omit<Blk, 's'>[] = [];
  const front: Blk[] = [];
  const tubes: Blk[] = [];
  for (const s of [-1, 1]) {
    let z = 420;
    while (z > -3700) {
      if (rnd() < 0.09) {
        const d = R(18, 34), w = R(16, 30), h = R(90, 320);
        const b = { x: s * (19 + w / 2), z: z - d / 2, w, d, h, s };
        Bs.push(b);
        front.push(b);
        z -= d + R(1, 3);
        continue;
      }
      const d = R(4.5, 8.5), w = R(14, 22), h = (3 + Math.floor(rnd() * 6)) * 3.4 + R(0, 1.2);
      const b = { x: s * (19 + w / 2), z: z - d / 2, w, d, h, s, tube: true };
      tubes.push(b);
      front.push(b);
      z -= d + (rnd() < 0.15 ? R(0.8, 2) : 0.05);
    }
    z = 420;
    while (z > -3700) {
      const d = R(20, 50), w = R(20, 40);
      Bs.push({ x: s * (19 + 34 + w / 2 + R(2, 10)), z: z - d / 2, w, d, h: R(60, 300) });
      z -= d + R(2, 8);
    }
  }
  for (let i = 0; i < 1700; i++) {
    const s = rnd() < 0.5 ? -1 : 1;
    Bs.push({ x: s * R(110, 1300), z: R(-4000, 800), w: R(20, 70), d: R(20, 70), h: R(40, 560) * (rnd() < 0.1 ? 1.4 : 1) });
  }
  for (let i = 0; i < 90; i++) {
    Bs.push({ x: R(-800, 800), z: R(-4400, -3900), w: R(30, 90), d: R(30, 90), h: R(80, 620) });
    Bs.push({ x: R(-800, 800), z: R(700, 1100), w: R(30, 90), d: R(30, 90), h: R(80, 500) });
  }

  const bGeo = new T.BoxGeometry(1, 1, 1);
  bGeo.translate(0, 0.5, 0);
  const bVert = `varying vec3 vW;varying vec3 vN;varying float vS;varying float vH;
void main(){vec4 w=modelMatrix*instanceMatrix*vec4(position,1.0);vW=w.xyz;vN=normalize(mat3(instanceMatrix)*normal);
vS=fract(sin(dot(instanceMatrix[3].xz,vec2(12.9898,78.233)))*43758.5453);vH=instanceMatrix[1][1];gl_Position=projectionMatrix*viewMatrix*w;}`;
  const bFrag = `uniform vec3 fogColor;uniform float fogDensity;uniform float uTime;uniform sampler2D uDist;uniform float uTex;varying vec3 vW;varying vec3 vN;varying float vS;varying float vH;
${HS}
void main(){vec3 n=normalize(vN);vec3 col;
if(n.y>0.5){col=vec3(.03,.025,.05);}else{
vec2 uv=abs(n.x)>0.5?vec2(vW.z,vW.y):vec2(vW.x,vW.y);
vec2 cs=vec2(2.6+vS*1.8,3.6);vec2 g2=uv/cs;vec2 id=floor(g2);vec2 f=fract(g2);
vec2 fw=fwidth(g2);float px=max(fw.x,fw.y);
float win=smoothstep(.2-fw.x,.2+fw.x,f.x)*smoothstep(.8+fw.x,.8-fw.x,f.x)*smoothstep(.28-fw.y,.28+fw.y,f.y)*smoothstep(.78+fw.y,.78-fw.y,f.y);
float band=step(.84,vS);win=mix(win,step(.35,f.y)*step(f.y,.6),band);
float h=hs(id+vec2(vS*97.,vS*13.));float lit=step(.6+vS*.22,h);
if(band>.5)lit=step(.4,hs(vec2(id.y,vS*51.)));
float tc=hs(id*1.37+5.3);vec3 wc=tc<.62?vec3(1.,.62,.34):(tc<.86?vec3(.55,.78,.92):vec3(.9,.38,.62));
if(band>.5)wc=vS>.92?vec3(.25,1.,1.2):vec3(1.2,.3,.75);
float fl=1.;
vec3 base=vec3(.03,.026,.05)+vec3(.35,.06,.28)*exp(-vW.y*.05)*.5;base*=.8+.4*hs(vec2(floor(uv.x/6.),vS*7.));
float far=smoothstep(.12,.45,px);float ints=.35+.65*hs(id*2.1+.7);float grad=mix(.7,1.15,f.y);base*=mix(1.,.72+.56*texture2D(uDist,uv*vec2(.025,.018)+vS).r,uTex);col=base+mix(win*lit*wc*ints*grad,vec3(.08,.06,.05),far)*.62*fl;
float roof=step(vH-1.,vW.y)*step(.6,vS);col+=roof*(vS>.8?vec3(1.3,.2,.75):vec3(.18,1.05,1.35));}
float d=length(vW-cameraPosition);float fg=1.-exp(-d*d*fogDensity*fogDensity);
gl_FragColor=vec4(mix(col,fogColor,clamp(fg,0.,1.)),1.);}`;
  const bMat = new T.ShaderMaterial({ uniforms: uni, vertexShader: bVert, fragmentShader: bFrag });
  const bim = new T.InstancedMesh(bGeo, bMat, Bs.length);
  const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3(), one = new T.Vector3(1, 1, 1);
  Bs.forEach((b, i) => {
    p.set(b.x, 0, b.z);
    sc.set(b.w, b.h, b.d);
    m.compose(p, q, sc);
    bim.setMatrixAt(i, m);
  });
  bim.frustumCulled = false;
  scene.add(bim);
  await slice();

  const tMat = new T.ShaderMaterial({
    uniforms: uni,
    vertexShader: `varying vec3 vW;varying vec3 vN;varying float vS;varying vec3 vC;varying vec3 vCt;varying vec3 vSc;
void main(){vec4 w=modelMatrix*instanceMatrix*vec4(position,1.0);vW=w.xyz;vN=normalize(mat3(instanceMatrix)*normal);vCt=instanceMatrix[3].xyz;
vSc=vec3(instanceMatrix[0][0],instanceMatrix[1][1],instanceMatrix[2][2]);vS=fract(sin(dot(vCt.xz,vec2(12.9898,78.233)))*43758.5453);
#ifdef USE_INSTANCING_COLOR
vC=instanceColor;
#else
vC=vec3(.6);
#endif
gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform vec3 fogColor;uniform float fogDensity;uniform float uTime;uniform sampler2D uDist;uniform float uTex;varying vec3 vW;varying vec3 vN;varying float vS;varying vec3 vC;varying vec3 vCt;varying vec3 vSc;
${HS}
void main(){vec3 n=normalize(vN);vec3 col;float side=sign(vCt.x);vec3 fac=vC*.13;float grm=texture2D(uDist,vec2(vW.z*.05+vS,vW.y*.035)).r;fac*=mix(1.,.62+.76*grm,uTex);
if(n.y>.5){col=vec3(.035,.03,.05);}
else if(n.x*side<-.5){
 float fl=floor(vW.y/3.4);float fy=fract(vW.y/3.4);float u=(vW.z-vCt.z)/vSc.z+.5;
 float inner=step(.06,u)*step(u,.94);
 if(fl<1.){
  vec3 shop=mix(vec3(1.,.74,.45),vec3(.78,1.,.95),step(.55,hs(vec2(vS,3.))));
  vec3 shut=vec3(.08,.07,.1);
  col=mix(fac,mix(shop*.5,shut,step(.75,vS)),inner);
 } else {
  col=fac;
  float wx=fract(u*2.);vec2 fw=vec2(fwidth(u*2.),fwidth(vW.y/3.4));
  float win=smoothstep(.14-fw.x,.14+fw.x,wx)*smoothstep(.86+fw.x,.86-fw.x,wx)*smoothstep(.3-fw.y,.3+fw.y,fy)*smoothstep(.86+fw.y,.86-fw.y,fy);
  float h=hs(vec2(fl,floor(u*2.))+vS*31.);float lit=step(.42,h);
  vec3 wc=(h>.8?vec3(.6,.82,.9):vec3(1.,.64,.36))*(.45+.55*hs(vec2(fl*1.7,floor(u*2.))+vS));
  float far=smoothstep(.15,.5,max(fw.x,fw.y));
  col+=mix(win*lit*wc*mix(.75,1.1,fy),vec3(.16,.12,.09),far)*.6;
  float rail=smoothstep(.1-fw.y,.1+fw.y,fy)*smoothstep(.3+fw.y,.3-fw.y,fy);col=mix(col,vec3(.03,.025,.04),rail*.55*(1.-far));
  float slab=smoothstep(.1+fw.y,.1-fw.y,fy)*(1.-far*.7);float neon=step(.87,hs(vec2(fl*3.1,vS)));
  col=mix(col,vS>.5?vec3(.9,.15,.55):vec3(.12,.75,.95),slab*neon);
  col=mix(col,vec3(.03,.025,.04),slab*(1.-neon));
 }
} else { col=vC*.07+vec3(.22,.04,.16)*exp(-vW.y*.08)*.4; }
float d=length(vW-cameraPosition);float fg=1.-exp(-d*d*fogDensity*fogDensity);
gl_FragColor=vec4(mix(col,fogColor,clamp(fg,0.,1.)),1.);}`,
  });
  const tim = new T.InstancedMesh(bGeo, tMat, tubes.length);
  const pastel = [[1, 0.85, 0.45], [0.45, 0.9, 0.85], [1, 0.6, 0.7], [0.6, 1, 0.7], [0.55, 0.75, 1], [1, 0.95, 0.85], [1, 0.65, 0.4]];
  tubes.forEach((b, i) => {
    p.set(b.x, 0, b.z);
    sc.set(b.w, b.h, b.d);
    m.compose(p, q, sc);
    tim.setMatrixAt(i, m);
    const c = pastel[(rnd() * pastel.length) | 0];
    tim.setColorAt(i, new T.Color(c[0], c[1], c[2]));
  });
  tim.frustumCulled = false;
  scene.add(tim);
  await slice();
  // Balcony AC units on the tube houses (own RNG stream).
  const ar = mkRng(99), acs: V3[] = [];
  tubes.forEach((b) => {
    const fl = Math.floor(b.h / 3.4);
    for (let k = 2; k < fl; k++) if (ar() < 0.38) acs.push([b.s * 18.72, k * 3.4 + 0.75, b.z + (ar() - 0.5) * (b.d - 1.4)]);
  });
  const acM = new T.InstancedMesh(new T.BoxGeometry(0.55, 0.62, 0.95), new T.MeshStandardMaterial({ color: 0x3a3842, roughness: 0.7, metalness: 0.3 }), acs.length);
  acs.forEach((a, i) => {
    m.compose(p.set(a[0], a[1], a[2]), q.identity(), one);
    acM.setMatrixAt(i, m);
  });
  acM.frustumCulled = false;
  scene.add(acM);
  await slice();

  // Landmark towers far down the avenue: a stepped spire and a round tower with a helipad.
  // uDist/uTex are bound (uTex 0 = untextured, as in the design) so no sampler is left without a texture.
  const lmMat = new T.ShaderMaterial({
    uniforms: { uTime: uni.uTime, fogColor: uni.fogColor, fogDensity: { value: 0.00035 }, uDist: uni.uDist, uTex: { value: 0 } },
    vertexShader: bVert,
    fragmentShader: bFrag,
  });
  const LM = [[70, -2950, 46, 40, 300], [70, -2950, 36, 32, 360], [70, -2950, 27, 24, 415], [70, -2950, 17, 15, 462]];
  const lmIm = new T.InstancedMesh(bGeo, lmMat, LM.length);
  LM.forEach((a, i) => {
    p.set(a[0], 0, a[1]);
    sc.set(a[2], a[4], a[3]);
    m.compose(p, q, sc);
    lmIm.setMatrixAt(i, m);
  });
  lmIm.frustumCulled = false;
  scene.add(lmIm);
  const lmN = new T.MeshBasicMaterial({ color: new T.Color(0.3, 1.6, 2.2), fog: false }),
    lmP = new T.MeshBasicMaterial({ color: new T.Color(2.2, 0.35, 1.3), fog: false }),
    lmG = new T.MeshBasicMaterial({ color: new T.Color(2.4, 1.6, 0.5), fog: false });
  [[23, 20, 300], [18, 16, 360], [13.5, 12, 415], [8.5, 7.5, 462]].forEach((a) => {
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const e = new T.Mesh(new T.BoxGeometry(0.5, a[2], 0.5), lmN);
        e.position.set(70 + sx * a[0], a[2] / 2, -2950 + sz * a[1]);
        scene.add(e);
      }
  });
  const spire = new T.Mesh(new T.CylinderGeometry(0.3, 1.4, 60, 6), lmP);
  spire.position.set(70, 492, -2950);
  scene.add(spire);
  const bxG = new T.CylinderGeometry(9, 16, 1, 28);
  bxG.translate(0, 0.5, 0);
  const bx = new T.InstancedMesh(bxG, lmMat, 1);
  m.compose(p.set(-150, 0, -1600), q, sc.set(1, 265, 1));
  bx.setMatrixAt(0, m);
  bx.frustumCulled = false;
  scene.add(bx);
  const pad = new T.Mesh(new T.CylinderGeometry(15, 15, 1.4, 32), new T.MeshBasicMaterial({ color: 0x0c0a14, fog: false }));
  pad.position.set(-142, 196, -1600);
  scene.add(pad);
  const padR = new T.Mesh(new T.TorusGeometry(15, 0.35, 6, 64), lmP);
  padR.rotation.x = Math.PI / 2;
  padR.position.set(-142, 196.8, -1600);
  scene.add(padR);
  const crown = new T.Mesh(new T.TorusGeometry(9.2, 0.3, 6, 48), lmG);
  crown.rotation.x = Math.PI / 2;
  crown.position.set(-150, 265, -1600);
  scene.add(crown);
  const bxS = new T.Mesh(new T.CylinderGeometry(0.2, 0.9, 40, 6), lmG);
  bxS.position.set(-150, 285, -1600);
  scene.add(bxS);
  await slice();

  const LEN = 4600, ZC = -1650;
  // The design drew an (unused) road texture here with 2600 random specks (5 rnd() each);
  // burn the same draws so everything seeded after it lands where the design put it.
  for (let i = 0; i < 2600 * 5; i++) rnd();
  const roadM = new T.ShaderMaterial({
    uniforms: uni,
    vertexShader: 'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: `uniform vec3 fogColor;uniform float fogDensity;uniform float uTime;uniform sampler2D uDist;uniform sampler2D uWN;uniform float uTex;varying vec3 vW;
${HS}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+1.),f.x),f.y);}
float fbm(vec2 p){return vn(p)*.55+vn(p*2.07)*.3+vn(p*4.3)*.15;}
vec3 fac(float y,float z,float s,float blur){vec3 c=vec3(0.);
 float hz=hs(vec2(floor(z/7.),s));vec3 sc=hz<.3?vec3(1.,.55,.25):hz<.55?vec3(.2,.8,1.):hz<.8?vec3(1.,.25,.6):vec3(.9,.8,.6);
 sc=mix(sc,vec3(.6,.5,.55),smoothstep(2.,6.,blur));c+=sc*smoothstep(.5,1.3,y)*smoothstep(4.6,3.7,y)*.5;
 vec2 g=vec2(z/2.6,(y-4.)/3.4);vec2 id=floor(g);vec2 f=fract(g)-.5;
 float lit=step(.55,hs(id+s*7.));float blob=smoothstep(.55,.12,length(f*vec2(1.,1.4)));
 vec3 wc=hs(id+3.)<.7?vec3(1.,.62,.32):vec3(.4,.78,1.);
 c+=mix(wc*lit*blob,vec3(.09,.07,.06),smoothstep(.6,2.5,blur))*.4*step(4.,y);
 float vz=fract(z/11.)-.5;float vs=step(.8,hs(vec2(floor(z/11.),s+9.)))*smoothstep(4.,6.,y)*smoothstep(18.,13.,y)*smoothstep(.12,.03,abs(vz));
 c+=(s<0.?vec3(1.,.25,.6):vec3(.25,.85,1.1))*vs*.7*(1.-smoothstep(3.,8.,blur));return c;}
void main(){vec3 V=normalize(vW-cameraPosition);vec2 p=vW.xz;
 float n=fbm(p*.16);float n2=fbm(p*.7+7.);float wet=smoothstep(.45,.62,n)*.7+.3;
 vec2 pr=(vec2(vn(p*1.7),vn(p*1.7+5.))-.5)*.05*(1.-wet*.7);vec3 wn=texture2D(uWN,p*.06).xyz*2.-1.;pr+=wn.xy*.03*uTex*(1.-wet*.5);
 vec3 N=normalize(vec3(pr.x,1.,pr.y));vec3 R=reflect(V,N);
 float sx=R.x<0.?-1.:1.;R.x=sx*max(abs(R.x),.003);
 float tt=(sx*18.8-vW.x)/R.x;vec3 h=vW+R*tt;float lt=(sx*10.9-vW.x)/R.x;vec3 h2=vW+R*lt;
 float blur=(fwidth(h.z)+fwidth(h.y))*(1.+(1.-wet)*3.);float lb=fwidth(h2.z)+fwidth(h2.y);
 vec3 refl=fac(h.y,h.z,sx,blur)*exp(-tt*.01)*smoothstep(60.,30.,h.y);
 float lz=h2.z-(sx>0.?19.:0.);float lm=abs(fract(lz/38.)-.5)*38.;
 refl+=vec3(1.,.72,.45)*smoothstep(.5+lb,0.,abs(h2.y-9.85))*smoothstep(1.3+lb,.2,lm)*exp(-lt*.01)*1.1;
 refl+=mix(vec3(.34,.07,.3)*.3,vec3(.015,.01,.03),smoothstep(0.,.25,R.y));
 refl*=step(0.,R.y);
 float fres=.03+.97*pow(1.-max(0.,-V.y),5.);
 vec3 base=vec3(.045,.04,.058)*(.65+.7*n2)*mix(1.,.6,wet);float ag=texture2D(uDist,p*.045).r;base*=mix(1.,.5+ag*1.1,uTex);
 float fx=fwidth(vW.x),fz=fwidth(vW.z)/48.;float dash=smoothstep(.43+fz,.43-fz,fract(vW.z/48.));
 float lane=0.;for(int k=-1;k<=1;k++){lane=max(lane,smoothstep(.1+fx,.1-fx,abs(vW.x-float(k)*5.5)));}
 base+=vec3(.2,.21,.24)*lane*dash*mix(1.,.6,wet);
 base+=vec3(1.1,.18,.6)*smoothstep(.12+fx,.12-fx,abs(vW.x+10.75))+vec3(.15,.85,1.1)*smoothstep(.12+fx,.12-fx,abs(vW.x-10.75));
 base+=(vec3(1.,.18,.6)*exp(-abs(vW.x+10.9)*1.2)+vec3(.15,.8,1.)*exp(-abs(vW.x-10.9)*1.2))*.06*wet;
 vec3 col=base+refl*fres*wet*1.1;
 float d=length(vW-cameraPosition);float fg=1.-exp(-d*d*fogDensity*fogDensity);
 gl_FragColor=vec4(mix(col,fogColor,clamp(fg,0.,1.)),1.);}`,
  });
  const road = new T.Mesh(new T.PlaneGeometry(22, LEN), roadM);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, ZC);
  scene.add(road);
  const ground = new T.Mesh(new T.PlaneGeometry(8000, 8000), new T.MeshBasicMaterial({ color: 0x07050c }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  scene.add(ground);
  await slice();
  const walkM = new T.MeshStandardMaterial({ color: 0x17131f, roughness: 0.7 });
  const neon = (r: number, g: number, b: number) => new T.MeshBasicMaterial({ color: new T.Color(r, g, b) });
  const nP = neon(1.3, 0.2, 0.75), nC = neon(0.16, 1.0, 1.3);
  for (const s of [-1, 1]) {
    const wk = new T.Mesh(new T.BoxGeometry(8, 0.3, LEN), walkM);
    wk.position.set(s * 15, 0.15, ZC);
    scene.add(wk);
    const cb = new T.Mesh(new T.BoxGeometry(0.14, 0.1, LEN), s < 0 ? nP : nC);
    cb.position.set(s * 11.05, 0.34, ZC);
    scene.add(cb);
  }

  // Lit shopfronts at street level of the front towers.
  const towersF = front.filter((b) => !b.tube);
  const shops = new T.InstancedMesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0xffffff }), towersF.length);
  const sCols = [[1.1, 0.7, 0.4], [0.3, 0.9, 1.1], [1.1, 0.3, 0.7], [0.7, 0.4, 1.1], [0.9, 0.9, 0.8]];
  towersF.forEach((b, i) => {
    q.setFromAxisAngle(new T.Vector3(0, 1, 0), (-b.s * Math.PI) / 2);
    p.set(b.s * 18.82, 2.4, b.z);
    sc.set(b.d * 0.8, 3.6, 1);
    m.compose(p, q, sc);
    shops.setMatrixAt(i, m);
    const c = sCols[(rnd() * sCols.length) | 0], k = R(0.18, 0.4);
    shops.setColorAt(i, new T.Color(c[0] * k, c[1] * k, c[2] * k));
  });
  scene.add(shops);
  await slice();

  // Street lamps with light pools and volumetric cones.
  const lamps: { s: number; z: number }[] = [];
  for (let z = 400; z > -3800; z -= 38) for (const s of [-1, 1]) lamps.push({ s, z: z + (s > 0 ? 19 : 0) });
  const poleG = new T.CylinderGeometry(0.1, 0.14, 10, 6);
  poleG.translate(0, 5, 0);
  const poles = new T.InstancedMesh(poleG, new T.MeshBasicMaterial({ color: 0x1a1826 }), lamps.length);
  const arms = new T.InstancedMesh(new T.BoxGeometry(2.6, 0.12, 0.12), new T.MeshBasicMaterial({ color: 0x1a1826 }), lamps.length);
  const heads = new T.InstancedMesh(new T.BoxGeometry(2.2, 0.16, 0.45), new T.MeshBasicMaterial({ color: 0xffffff }), lamps.length);
  const poolT = radialTex(128, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
  const pools = new T.InstancedMesh(new T.PlaneGeometry(13, 13), new T.MeshBasicMaterial({ map: poolT, transparent: true, blending: T.AdditiveBlending, depthWrite: false }), lamps.length);
  const lc = [[2.2, 0.4, 1.3], [0.35, 1.9, 2.3], [2.0, 1.4, 0.8]];
  const flat = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), -Math.PI / 2);
  lamps.forEach((l, i) => {
    m.compose(p.set(l.s * 12.6, 0, l.z), q.identity(), one);
    poles.setMatrixAt(i, m);
    m.compose(p.set(l.s * 11.4, 10, l.z), q, one);
    arms.setMatrixAt(i, m);
    m.compose(p.set(l.s * 10.9, 9.85, l.z), q, one);
    heads.setMatrixAt(i, m);
    m.compose(p.set(l.s * 8.2, 0.09, l.z), flat, one);
    pools.setMatrixAt(i, m);
    const c = lc[i % 3];
    heads.setColorAt(i, new T.Color(c[0], c[1], c[2]));
    pools.setColorAt(i, new T.Color(c[0] * 0.16, c[1] * 0.16, c[2] * 0.16));
  });
  [poles, arms, heads, pools].forEach((o) => scene.add(o));
  const coneG = new T.ConeGeometry(3.4, 9.6, 20, 1, true);
  coneG.translate(0, -4.8, 0);
  const coneM = new T.ShaderMaterial({
    uniforms: { fogColor: uni.fogColor, fogDensity: uni.fogDensity },
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    side: T.DoubleSide,
    vertexShader:
      'varying vec3 vN;varying vec3 vW;varying float vY;varying vec3 vC;void main(){vec4 w=modelMatrix*instanceMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix*instanceMatrix)*normal);vY=-position.y/9.6;\n#ifdef USE_INSTANCING_COLOR\nvC=instanceColor;\n#else\nvC=vec3(1.);\n#endif\ngl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:
      'uniform vec3 fogColor;uniform float fogDensity;varying vec3 vN;varying vec3 vW;varying float vY;varying vec3 vC;void main(){vec3 v=normalize(cameraPosition-vW);float e=pow(abs(dot(normalize(vN),v)),2.);float a=e*pow(1.-vY,1.3)*.07;float d=length(vW-cameraPosition);float fg=1.-exp(-d*d*fogDensity*fogDensity);a*=(1.-clamp(fg,0.,1.))*smoothstep(1.,6.,d);gl_FragColor=vec4(vC*a,1.);}',
  });
  const cones = new T.InstancedMesh(coneG, coneM, lamps.length);
  lamps.forEach((l, i) => {
    m.compose(p.set(l.s * 10.9, 9.75, l.z), q.identity(), one);
    cones.setMatrixAt(i, m);
    const c = lc[i % 3];
    cones.setColorAt(i, new T.Color(c[0] * 0.5, c[1] * 0.5, c[2] * 0.5));
  });
  cones.frustumCulled = false;
  scene.add(cones);
  await slice();

  // Tangled power lines between the lamp poles, and lantern strings across the street.
  const wp: number[] = [];
  const nearGate = (z0: number, z1: number) =>
    CPS.some((c) => {
      const lo = c.z - (c.id === 'stack' ? 210 : 45), hi = c.z + (c.id === 'stack' ? 70 : 45);
      return Math.max(z0, z1) > lo && Math.min(z0, z1) < hi;
    });
  const cat = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, sag: number, n = 16) => {
    const fp = (t: number) => [ax + (bx - ax) * t, ay + (by - ay) * t - sag * 4 * t * (1 - t), az + (bz - az) * t];
    for (let i = 0; i < n; i++) wp.push(...fp(i / n), ...fp((i + 1) / n));
  };
  for (const sd of [-1, 1]) {
    const ls = lamps.filter((l) => l.s === sd);
    for (let i = 0; i < ls.length - 1; i++) {
      const a = ls[i], b = ls[i + 1];
      if (nearGate(a.z, b.z)) continue;
      [[9.4, 0.9], [8.8, 1.1], [8.2, 1.3]].forEach((w) => cat(sd * 12.6, w[0], a.z, sd * 12.6, w[0], b.z, w[1]));
      if (i % 3 === 0) cat(sd * 12.6, 8.8, a.z, sd * 18.9, 10.5, a.z, 0.5, 10);
    }
  }
  lamps.forEach((l, i) => {
    if (l.s < 0 && i % 8 === 0 && !nearGate(l.z, l.z + 19)) [9.4, 8.6].forEach((y) => cat(-12.6, y, l.z, 12.6, y, l.z + 19, 1.4, 24));
  });
  const lan: V3[] = [], flg: V3[] = [];
  for (let z = 60; z > -2700; z -= 64) {
    if (nearGate(z, z)) continue;
    const y0 = 14, sag = 1.6;
    cat(-12.6, y0, z, 12.6, y0, z, sag, 24);
    for (let i = 1; i < 10; i++) {
      const t = i / 10;
      lan.push([-12.6 + 25.2 * t, y0 - sag * 4 * t * (1 - t) - 0.8, z]);
    }
    // Vietnamese flags hang between the lanterns.
    for (let i = 1; i < 9; i++) {
      const t = (i + 0.5) / 10;
      flg.push([-12.6 + 25.2 * t, y0 - sag * 4 * t * (1 - t) - 0.02, z]);
    }
  }
  tubes.forEach((b) => {
    if (rnd() < 0.24) lan.push([b.s * 18.3, 4.4 + 3.4 * Math.floor(rnd() * Math.max(1, b.h / 3.4 - 2)), b.z + R(-1, 1)]);
  });
  const wg = new T.BufferGeometry();
  wg.setAttribute('position', new T.Float32BufferAttribute(wp, 3));
  scene.add(new T.LineSegments(wg, new T.LineBasicMaterial({ color: 0x241a30, transparent: true, opacity: 0.85 })));
  const lg = new T.LatheGeometry([[0, -0.52], [0.2, -0.47], [0.38, -0.28], [0.45, 0], [0.38, 0.28], [0.2, 0.47], [0, 0.52]].map((a) => new T.Vector2(a[0], a[1])), 8);
  const lanM = new T.InstancedMesh(lg, new T.MeshBasicMaterial({ color: 0xffffff }), lan.length);
  const lcs = [[1.5, 1.05, 0.25], [1.5, 0.2, 0.15], [1.4, 0.3, 0.75], [0.8, 0.3, 1.4], [0.25, 0.7, 1.5], [0.3, 1.3, 0.5], [1.5, 0.65, 0.2]];
  lan.forEach((a, i) => {
    m.compose(p.set(a[0], a[1], a[2]), q.identity(), one);
    lanM.setMatrixAt(i, m);
    const c = lcs[(rnd() * lcs.length) | 0];
    lanM.setColorAt(i, new T.Color(c[0], c[1], c[2]));
  });
  scene.add(lanM);
  // Red flag, yellow star; the cloth waves more towards its free (lower) edge.
  const fTex = canvasTex(300, 200, (fx) => {
    fx.fillStyle = '#DA251D';
    fx.fillRect(0, 0, 300, 200);
    fx.fillStyle = '#FFE600';
    fx.beginPath();
    const R0 = 60, r0 = R0 * 0.382;
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r0 : R0;
      if (k) fx.lineTo(150 + Math.cos(a) * rr, 100 + Math.sin(a) * rr);
      else fx.moveTo(150 + Math.cos(a) * rr, 100 + Math.sin(a) * rr);
    }
    fx.closePath();
    fx.fill();
  });
  fTex.colorSpace = T.SRGBColorSpace;
  const fGeo = new T.PlaneGeometry(1.2, 0.8, 10, 5);
  fGeo.translate(0, -0.4, 0);
  const fMat = new T.ShaderMaterial({
    side: T.DoubleSide,
    uniforms: { uTime: uni.uTime, uMap: { value: fTex }, fogColor: uni.fogColor, fogDensity: uni.fogDensity },
    vertexShader:
      'uniform float uTime;varying vec2 vUv;varying float vSh;varying vec3 vW;void main(){vUv=uv;vec3 p=position;vec3 o=instanceMatrix[3].xyz;float ph=o.x*1.7+o.z*.37;float amp=clamp(-p.y/.8,0.,1.)*.75+.25;float w=sin(uTime*3.4+p.x*5.5+ph)*.13+sin(uTime*5.3+p.x*9.+p.y*4.+ph*1.3)*.045;p.z+=w*amp;p.y+=cos(uTime*2.1+ph)*.03*amp;float dw=cos(uTime*3.4+p.x*5.5+ph)*.7;vSh=.72+.28*dw;vec4 wp=modelMatrix*instanceMatrix*vec4(p,1.);vW=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}',
    fragmentShader:
      'uniform sampler2D uMap;uniform vec3 fogColor;uniform float fogDensity;varying vec2 vUv;varying float vSh;varying vec3 vW;void main(){vec3 c=texture2D(uMap,vUv).rgb;float st=step(.8,c.g);c*=mix(.95,1.35,st)*vSh;float d=length(vW-cameraPosition);float fg=clamp(1.-exp(-d*d*fogDensity*fogDensity),0.,1.);gl_FragColor=vec4(mix(c,fogColor,fg),1.);}',
  });
  const flags = new T.InstancedMesh(fGeo, fMat, flg.length);
  flg.forEach((a, i) => {
    m.compose(p.set(a[0], a[1], a[2]), q.identity(), one);
    flags.setMatrixAt(i, m);
  });
  flags.frustumCulled = false;
  scene.add(flags);
  await slice();

  // Neon signage, batched into one InstancedMesh per sign material.
  const VH = [['PHỞ 24H', '#FF2D95'], ['BÁNH MÌ', '#ffc53d'], ['CÀ PHÊ SỮA ĐÁ', '#00E5FF'], ['BIA HƠI', '#ffc53d'], ['KARAOKE', '#b26bff'], ['NHÀ NGHỈ', '#FF2D95'], ['CƠM TẤM', '#27e08a'], ['HỦ TIẾU', '#ff4d4d'], ['TRÀ SỮA', '#FF2D95'], ['BÚN BÒ HUẾ', '#ff4d4d'], ['TIỆM VÀNG', '#ffc53d'], ['KHÁCH SẠN', '#00E5FF'], ['ĐIỆN THOẠI', '#00E5FF'], ['SỬA XE', '#27e08a'], ['ỐC ĐÊM', '#b26bff'], ['LẨU DÊ', '#ff4d4d'], ['REACT.JS', '#00E5FF'], ['NEXT.JS', '#ECECF4'], ['STRIPE', '#b26bff'], ['TOPY.DEV', '#FF2D95']];
  const VV = [['PHỞ', '#ff4d4d'], ['CÀPHÊ', '#00E5FF'], ['KARAOKE', '#FF2D95'], ['BIA', '#ffc53d'], ['HOTEL', '#00E5FF'], ['SÀIGÒN', '#FF2D95'], ['TOPY', '#FF2D95'], ['24H', '#27e08a'], ['BÁNHMÌ', '#ffc53d'], ['NODE', '#27e08a'], ['MASSAGE', '#b26bff'], ['VÀNG', '#ffc53d']];
  const mats = new Map<string, T.MeshBasicMaterial>();
  const signMat = (txt: string, col: string, vert: boolean) => {
    const k = txt + col + vert;
    let mt = mats.get(k);
    if (!mt) {
      mt = new T.MeshBasicMaterial({ map: signTex(texCache, fonts, txt, col, vert), transparent: true, side: T.DoubleSide, depthWrite: false });
      mats.set(k, mt);
      // The design rolled a flicker chance per sign here (its flicker was a no-op); keep the draw for the seed.
      rnd();
    }
    return mt;
  };
  const pl = new T.PlaneGeometry(1, 1);
  const buckets = new Map<T.Material, number[][]>(), Y = new T.Vector3(0, 1, 0);
  const addSign = (txt: string, col: string, vert: boolean, w: number, h: number, x: number, y: number, z: number, ry: number) => {
    const mt = signMat(txt, col, vert);
    const l = buckets.get(mt) ?? [];
    l.push([w, h, x, y, z, ry]);
    buckets.set(mt, l);
  };
  const flushSigns = () =>
    buckets.forEach((l, mt) => {
      const im = new T.InstancedMesh(pl, mt, l.length);
      l.forEach((a, i) => {
        q.setFromAxisAngle(Y, a[5]);
        m.compose(p.set(a[2], a[3], a[4]), q, sc.set(a[0], a[1], 1));
        im.setMatrixAt(i, m);
      });
      im.frustumCulled = false;
      scene.add(im);
    });
  const pick = <X,>(a: X[]) => a[(rnd() * a.length) | 0];
  for (const b of front) {
    await slice();
    if (b.z > 400 || b.z < -3500) continue;
    const face = (-b.s * Math.PI) / 2;
    if (b.tube) {
      if (rnd() < 0.82) {
        const w = b.d * 0.94, sg = pick(VH);
        addSign(sg[0], sg[1], false, w, w / 4, b.s * 18.78, 3.5 + w / 8, b.z, face);
      }
      if (rnd() < 0.3 && b.h > 16) {
        const w = R(1.5, 2.3), sg = pick(VV);
        addSign(sg[0], sg[1], true, w, w * 4, b.s * (18.5 - w / 2), 5.5 + w * 2 + rnd() * Math.max(0, b.h - w * 4 - 7), b.z, 0);
      }
    } else {
      if (rnd() < 0.6) {
        const w = R(3, 5), sg = pick(VV);
        const y = Math.min(b.h - w * 2.2, R(12, 46));
        if (y > w * 2 + 4) addSign(sg[0], sg[1], true, w, w * 4, b.s * 18.8, y, b.z + R(-b.d / 3, b.d / 3), face);
      }
      if (rnd() < 0.5) {
        const w = R(8, 14), sg = pick(VH);
        addSign(sg[0], sg[1], false, w, w / 4, b.s * 18.8, R(6, 10), b.z, face);
      }
    }
  }
  ([['CHÀO MỪNG ĐẾN SÀI GÒN 2077', '#00E5FF', -470], ['CHỢ ĐÊM · NIGHT MARKET', '#FF2D95', -990], ['SHIP IT OR DIE', '#ffc53d', -1490], ['KHÔNG BUG · NO BUGS PAST HERE', '#27e08a', -1990], ['CÀ PHÊ SỮA ĐÁ DISTRICT', '#b26bff', -2480]] as [string, string, number][]).forEach((a) =>
    addSign(a[0], a[1], false, 20, 5, 0, 19, a[2], 0),
  );

  // The WHOAMI billboard over the start of the avenue.
  const hero = canvasTex(1024, 512, (g) => {
    g.fillStyle = 'rgba(8,4,18,.8)';
    g.fillRect(0, 0, 1024, 512);
    g.strokeStyle = '#00E5FF';
    g.lineWidth = 6;
    g.shadowColor = '#00E5FF';
    g.shadowBlur = 24;
    g.strokeRect(18, 18, 988, 476);
    g.strokeStyle = '#FF2D95';
    g.shadowColor = '#FF2D95';
    g.strokeRect(34, 34, 956, 444);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 30px ${fonts.mono}`;
    g.fillStyle = '#FF2D95';
    g.shadowBlur = 16;
    g.fillText('> WHOAMI --VERBOSE', 512, 110);
    g.font = `700 132px ${fonts.display}`;
    g.shadowColor = '#FF2D95';
    g.shadowBlur = 40;
    g.fillStyle = '#ff9fcf';
    g.fillText('TOPY TRAN', 512, 240);
    g.shadowBlur = 8;
    g.fillStyle = '#fff';
    g.fillText('TOPY TRAN', 512, 240);
    g.font = `700 38px ${fonts.mono}`;
    g.shadowColor = '#00E5FF';
    g.shadowBlur = 20;
    g.fillStyle = '#9ff4ff';
    g.fillText('SENIOR_FULLSTACK_DEVELOPER', 512, 360);
    g.font = `500 24px ${fonts.mono}`;
    g.fillStyle = '#c7c7da';
    g.shadowBlur = 6;
    g.fillText('SÀI GÒN · HO CHI MINH CITY // SINCE 2020', 512, 420);
  });
  const heroM = new T.Mesh(new T.PlaneGeometry(36, 18), new T.MeshBasicMaterial({ map: hero, transparent: true, side: T.DoubleSide, depthWrite: false }));
  heroM.position.set(0, 40, -40);
  scene.add(heroM);
  await slice();

  const gates = await buildGates(scene, { rnd, addSign, fonts, uni }, slice);

  // Height the sky traffic climbs to while crossing each gate.
  const CLR: Record<string, number> = { about: 36, work: 29, ledger: 41, stack: 40, contact: 54 };
  const clearZ = CPS.map((cp) => ({ z0: cp.z + (cp.id === 'stack' ? 64 : 24), z1: cp.z - (cp.id === 'stack' ? 200 : 18), y: CLR[cp.id] }));

  // Dragon fire particles.
  const NF = 1400;
  const pos = new Float32Array(NF * 3), life = new Float32Array(NF).fill(1), sz = new Float32Array(NF);
  for (let i = 0; i < NF; i++) pos[i * 3 + 1] = -999;
  const fgeo = new T.BufferGeometry();
  fgeo.setAttribute('position', new T.BufferAttribute(pos, 3));
  fgeo.setAttribute('aLife', new T.BufferAttribute(life, 1));
  fgeo.setAttribute('aSize', new T.BufferAttribute(sz, 1));
  const fireMat = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    uniforms: { uScale: { value: (innerHeight * Math.min(devicePixelRatio || 1, 1.5)) / 1.3 } },
    vertexShader:
      'attribute float aLife;attribute float aSize;varying float vL;varying float vNear;uniform float uScale;void main(){vL=aLife;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=min(260.,aSize*(1.+aLife*2.4)*uScale/max(1.,-mv.z));vNear=smoothstep(3.,16.,-mv.z);gl_Position=projectionMatrix*mv;}',
    fragmentShader:
      'varying float vL;varying float vNear;void main(){if(vL>=1.)discard;vec2 c=gl_PointCoord-.5;float r=length(c);if(r>.5)discard;float a=smoothstep(.5,0.,r);vec3 hot=vec3(1.9,1.6,1.);vec3 mid=vec3(1.8,.7,.15);vec3 cool=vec3(.9,.12,.04);vec3 col=vL<.3?mix(hot,mid,vL/.3):mix(mid,cool,(vL-.3)/.7);gl_FragColor=vec4(col,a*pow(1.-vL,1.4)*.38*vNear);}',
  });
  const firePts = new T.Points(fgeo, fireMat);
  firePts.frustumCulled = false;
  firePts.visible = false;
  scene.add(firePts);
  const fireLight = new T.PointLight(0xff8a2a, 0, 120, 0);
  fireLight.position.copy(gates.dragonHead);
  scene.add(fireLight);
  await slice();
  const fire: Fire = { n: NF, pos, vel: new Float32Array(NF * 3), life, max: new Float32Array(NF).fill(1), sz, next: 0, pts: firePts, light: fireLight, t: 99, cd: 0 };

  // Project billboards on the approach to the WORK gate.
  const wz = CPS[1].z;
  [['DALMORE', '#FF2D95'], ['NESTWELL', '#00E5FF'], ['ZELIGATE', '#FF2D95'], ['TRAILER2YOU', '#00E5FF']].forEach((a, i) => {
    const s = i % 2 ? 1 : -1;
    addSign(a[0], a[1], false, 12, 3, s * 14.5, 11, wz - 70 - i * 75, 0);
  });
  flushSigns();
  await slice();

  // Sky traffic: 36 low cars over the avenue, the rest in lanes above the city.
  const NS = 170;
  const sp: Car[] = [];
  for (let i = 0; i < NS; i++) {
    const low = i < 36, dir = rnd() < 0.5 ? -1 : 1;
    const x = low ? R(-5.5, 5.5) : (dir < 0 ? -1 : 1) * R(8, 110);
    const y = low ? R(12, 17) : R(28, 150);
    sp.push({ x, y, z: R(-2200, 400), v: dir * R(35, 110), ph: rnd() * 6, _y: y });
  }
  const spBody = new T.InstancedMesh(new T.BoxGeometry(4.4, 0.5, 5.8), new T.MeshStandardMaterial({ color: 0x1a1824, roughness: 0.4, metalness: 0.3 }), NS);
  const spLight = new T.InstancedMesh(new T.BoxGeometry(2.4, 0.22, 0.14), new T.MeshBasicMaterial({ color: 0xffffff }), NS * 2);
  for (let i = 0; i < NS; i++) {
    spLight.setColorAt(i * 2, new T.Color(2, 2.2, 2.4));
    spLight.setColorAt(i * 2 + 1, new T.Color(2.6, 0.15, 0.3));
  }
  spBody.frustumCulled = false;
  spLight.frustumCulled = false;
  scene.add(spBody);
  scene.add(spLight);
  await slice();

  // Rain streaks that wrap around the camera.
  const N = 3200, rpos = new Float32Array(N * 6), re = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    const x = R(-60, 60), y = R(0, 80), z = R(-60, 60);
    rpos.set([x, y, z, x, y, z], i * 6);
    re[i * 2] = 0;
    re[i * 2 + 1] = 1;
  }
  const rg = new T.BufferGeometry();
  rg.setAttribute('position', new T.BufferAttribute(rpos, 3));
  rg.setAttribute('e', new T.BufferAttribute(re, 1));
  const rain = new T.LineSegments(
    rg,
    new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCam: { value: new T.Vector3() }, uSp: { value: 0 }, uA: { value: 1 } },
      vertexShader:
        'attribute float e;uniform float uTime;uniform vec3 uCam;uniform float uSp;void main(){vec3 p=position;vec3 w;w.x=uCam.x+mod(p.x-uCam.x+60.,120.)-60.;w.z=uCam.z+mod(p.z-uCam.z+60.,120.)-60.;w.y=uCam.y+mod(p.y-uTime*58.-uCam.y+40.,80.)-40.;w.y+=e*1.4;w.z-=e*uSp*.02;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}',
      fragmentShader: 'uniform float uA;void main(){gl_FragColor=vec4(.5,.72,1.,.13*uA);}',
    }),
  );
  rain.frustumCulled = false;
  scene.add(rain);

  return { ...gates, uni, sky, clearZ, fire, sp, spBody, spLight, rain };
}
