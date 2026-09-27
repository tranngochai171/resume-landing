import * as T from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/** The design's bloom strength (tuned on three r160). */
const BLOOM = 0.6;

const VERT = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';

export type Post = { composer: EffectComposer; guard: ShaderPass; lens: ShaderPass; bloom: UnrealBloomPass };

/** Render → NaN/overflow guard → bloom → "lens" (speed blur, chromatic aberration, ACES grade, vignette, grain). */
export function buildPost(r: T.WebGLRenderer, scene: T.Scene, cam: T.Camera, w: number, h: number): Post {
  const composer = new EffectComposer(r);
  composer.addPass(new RenderPass(scene, cam));
  const guard = new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: VERT,
    fragmentShader:
      'uniform sampler2D tDiffuse;varying vec2 vUv;bool bad(float x){return !(x<0.||x>0.||x==0.)||abs(x)>1e4;}void main(){vec4 c=texture2D(tDiffuse,vUv);if(bad(c.r)||bad(c.g)||bad(c.b))c=vec4(0.,0.,0.,1.);gl_FragColor=vec4(clamp(c.rgb,0.,24.),1.);}',
  });
  composer.addPass(guard);
  const bloom = new UnrealBloomPass(new T.Vector2(w / 3, h / 3), 1.0, 0.55, 0.68);
  // Match r160's bloom, which the design was tuned on. The current pass adds 3*strength*bloom
  // (premultiplied); r160 added bloom*alpha with alpha = 3*strength, i.e. 3*strength^2*bloom.
  bloom.strength = BLOOM * BLOOM;
  // r160 picked bright pixels with Rec.601 luma; newer three uses Rec.709 (less bloom on pinks).
  const hp = bloom.materialHighPassFilter;
  hp.fragmentShader = hp.fragmentShader.replace('luminance( texel.xyz )', 'dot( texel.xyz, vec3( 0.299, 0.587, 0.114 ) )');
  hp.needsUpdate = true;
  composer.addPass(bloom);
  const lens = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uSpeed: { value: 0 }, uTime: { value: 0 }, uAsp: { value: w / h }, uOn: { value: 1 } },
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tDiffuse;uniform float uSpeed;uniform float uTime;uniform float uAsp;uniform float uOn;varying vec2 vUv;
float hs(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
vec3 aces(vec3 x){return clamp(x*(2.51*x+.03)/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){vec2 c=vUv-.5;float r=length(c*vec2(uAsp,1.));
 vec3 col=vec3(0.);float bl=uSpeed*smoothstep(.12,.7,r)*.045;
 float ca=.0022*r*r*uOn;
 if(bl<.0004){col=vec3(texture2D(tDiffuse,vUv+c*ca).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-c*ca).b);}
 else{for(int i=0;i<4;i++){float k=float(i)/3.;vec2 uv=vUv-c*bl*k;col+=vec3(texture2D(tDiffuse,uv+c*ca).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-c*ca).b);}col/=4.;}
 if(uOn>.5){col=aces(col*1.25);
  float l=dot(col,vec3(.299,.587,.114));col=mix(col,col*vec3(.92,1.,1.1),(1.-smoothstep(.0,.35,l))*.5);col=mix(col,col*vec3(1.06,1.,.92),smoothstep(.45,1.,l)*.4);
  col*=1.-smoothstep(.55,1.25,r)*.42;
  col+=(hs(vUv*vec2(1920.,1080.)+floor(uTime*12.))-.5)*.022;}
 gl_FragColor=vec4(col,1.);}`,
  });
  composer.addPass(lens);
  return { composer, guard, lens, bloom };
}
