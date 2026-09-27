import * as T from 'three';
import type { GateMats } from './monuments';
import type { Uni } from './world';
import { yieldToMain } from './yield';

// PMREMGenerator internals used to allocate its targets and filter materials ahead of time, so its
// shaders can be compiled asynchronously. Guarded: if a three update renames them, we simply skip that.
type PmremInternals = {
  _setSize?: (size: number) => void;
  _allocateTargets?: () => T.WebGLRenderTarget;
  _blurMaterial?: T.Material | null;
  _ggxMaterial?: T.Material | null;
};

/**
 * Texture and environment slots, filled with neutral stand-ins until the real assets arrive:
 * white 1x1 maps (colour x 1, roughness x 1) and a black environment of the exact size PMREM will
 * produce (adds nothing, like having none). Rendering is identical to "not loaded yet", but every
 * shader is already the final variant, so swapping the real assets in never recompiles mid-ride.
 */
export type AssetSlots = { white: T.DataTexture; pmrem: T.PMREMGenerator; envStandIn: T.WebGLRenderTarget | null; filterMaterials: T.Material[] };

const ENV_SIZE = 256;

export function reserveAssetSlots(renderer: T.WebGLRenderer, scene: T.Scene, G: GateMats): AssetSlots {
  const white = new T.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  white.needsUpdate = true;
  for (const mt of [G.woodM, G.redWood, G.stoneM, G.whiteM, G.ochreM, G.ochreL, G.brickM]) mt.map = white;
  G.woodM.roughnessMap = white;
  const pmrem = new T.PMREMGenerator(renderer);
  const p = pmrem as unknown as PmremInternals;
  let envStandIn: T.WebGLRenderTarget | null = null;
  const filterMaterials: T.Material[] = [];
  if (p._setSize && p._allocateTargets) {
    p._setSize(ENV_SIZE);
    envStandIn = p._allocateTargets(); // fresh cube-UV target: zero-initialised, i.e. black
    scene.environment = envStandIn.texture;
    for (const m of [p._blurMaterial, p._ggxMaterial]) if (m) filterMaterials.push(m);
  }
  return { white, pmrem, envStandIn, filterMaterials };
}

export type CityTextures = { wn: T.Texture | null; dist: T.Texture | null; hw: T.Texture | null; hwr: T.Texture | null };

/** Start downloading the design's detail textures (road, facades, gate wood / stone). */
export function fetchTextures(maxAniso: number): Promise<CityTextures> {
  const tl = new T.TextureLoader();
  const tex = (u: string) =>
    new Promise<T.Texture | null>((res) =>
      tl.load(
        '/textures/city/' + u,
        (t) => {
          t.wrapS = t.wrapT = T.RepeatWrapping;
          t.anisotropy = maxAniso;
          res(t);
        },
        undefined,
        () => res(null),
      ),
    );
  return Promise.all([tex('waternormals.jpg'), tex('disturb.jpg'), tex('hardwood2_diffuse.jpg'), tex('hardwood2_roughness.jpg')]).then(([wn, dist, hw, hwr]) => ({ wn, dist, hw, hwr }));
}

/**
 * Put the textures in place of the stand-ins, then bake a PMREM environment of the (now textured)
 * city for the metal surfaces, as the design does. Uploads run one per task; the swaps reuse the
 * warmed-up shaders, so nothing recompiles. Returns every texture/target created, for disposal.
 */
export async function applyAssets(renderer: T.WebGLRenderer, scene: T.Scene, uni: Uni, G: GateMats, slots: AssetSlots, texs: CityTextures, hideDuringBake: T.Object3D, isDead: () => boolean) {
  const { wn, dist, hw, hwr } = texs;
  const owned = [wn, dist, hw, hwr].filter((t): t is T.Texture => !!t);
  const w2 = hw ? hw.clone() : null, d2 = dist ? dist.clone() : null;
  if (w2) {
    w2.needsUpdate = true;
    w2.repeat.set(0.35, 0.35);
    owned.push(w2);
  }
  if (d2) {
    d2.needsUpdate = true;
    d2.repeat.set(0.25, 0.25);
    owned.push(d2);
  }
  const result: { owned: T.Texture[]; env: T.WebGLRenderTarget | null } = { owned, env: null };
  // Decode + upload one texture per task instead of all of them inside one frame.
  for (const t of owned) {
    await yieldToMain();
    if (isDead()) return result;
    renderer.initTexture(t);
  }
  if (dist) {
    uni.uDist.value = dist;
    uni.uTex.value = 1;
  }
  if (wn) uni.uWN.value = wn;
  if (w2) {
    for (const mt of [G.woodM, G.redWood]) mt.map = w2;
    if (hwr) G.woodM.roughnessMap = hwr;
    G.redWood.color.multiplyScalar(1.9);
    G.woodM.color.multiplyScalar(1.6);
  }
  if (d2)
    for (const mt of [G.stoneM, G.whiteM, G.ochreM, G.ochreL, G.brickM]) {
      mt.map = d2;
      mt.color.multiplyScalar(1.5);
    }
  await yieldToMain();
  if (isDead()) return result;
  try {
    const vis = hideDuringBake.visible;
    hideDuringBake.visible = false;
    result.env = slots.pmrem.fromScene(scene, 0.035, 0.5, 6000, { size: ENV_SIZE });
    hideDuringBake.visible = vis;
    scene.environment = result.env.texture;
    slots.envStandIn?.dispose();
    slots.envStandIn = null;
  } catch (e) {
    console.warn('[city] env', e);
  }
  slots.pmrem.dispose();
  return result;
}
