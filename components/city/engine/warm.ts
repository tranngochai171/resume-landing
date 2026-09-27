import * as T from 'three';
import type { Post } from './post';
import type { Slice } from './yield';

type Drawable = T.Mesh | T.Points | T.Line | T.Sprite;
type Program = { getUniforms(): unknown; getAttributes(): unknown; isReady(): boolean };
/** What three keeps per material: the program for every variant (light setup) compiled so far. */
type MaterialProps = { programs?: Map<string, Program> };

/** Materials whose shaders depend on the lights in view (three switches their program when lights change). */
const isLit = (m: T.Material) =>
  (m as T.MeshStandardMaterial).isMeshStandardMaterial || (m as T.MeshLambertMaterial).isMeshLambertMaterial || (m as T.MeshPhongMaterial).isMeshPhongMaterial || (m instanceof T.ShaderMaterial && m.lights);

const materialsOf = (d: Drawable) => (Array.isArray(d.material) ? d.material : [d.material]);

/**
 * Compile every shader the city uses before its first frame, without blocking the page.
 * compileAsync starts the GPU compiles in parallel (KHR_parallel_shader_compile) and resolves when
 * they are linked; the CPU part runs one object per slice. Without this, WebGL compiled on first
 * use, freezing the page for seconds while the flyover brought each gate into view.
 *
 * Resolves once the flyover can render; `ride` then compiles, in the background, the variants of
 * lit materials with the cockpit's two point lights, which riding needs.
 */
export async function warmUp(renderer: T.WebGLRenderer, scene: T.Scene, cam: T.Camera, cockpit: T.Object3D, extra: T.Material[], slice: Slice) {
  const reps = new Map<string, Drawable>();
  scene.traverse((o) => {
    const d = o as Drawable;
    if (!('material' in d) || !d.material) return;
    const im = o as T.InstancedMesh;
    const kind = `${o.type}|${im.isInstancedMesh ? 'I' : ''}${im.instanceColor ? 'C' : ''}`;
    for (const m of materialsOf(d)) if (!reps.has(m.uuid + kind)) reps.set(m.uuid + kind, d);
  });
  const all = Array.from(reps.values());
  const compile = async (objs: Drawable[], withCockpit: boolean) => {
    const jobs: Promise<unknown>[] = [];
    const was = cockpit.visible;
    for (const obj of objs) {
      cockpit.visible = withCockpit;
      jobs.push(renderer.compileAsync(obj, cam, scene));
      cockpit.visible = was;
      await slice();
    }
    await Promise.all(jobs);
  };
  await compile(all, false);
  // Full-screen passes (post-processing, PMREM filters) draw geometry with only position + uv (no
  // normals, which would change the program), like three's fullscreen triangle.
  const quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new T.BufferGeometry();
  quad.setAttribute('position', new T.Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
  quad.setAttribute('uv', new T.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
  const jobs: Promise<unknown>[] = [];
  for (const m of extra) {
    jobs.push(renderer.compileAsync(new T.Mesh(quad, m), quadCam));
    await slice();
  }
  await Promise.all(jobs);
  quad.dispose();
  const materials = new Set<T.Material>(extra);
  all.forEach((d) => materialsOf(d).forEach((m) => materials.add(m)));
  const touched = new Set<Program>();
  await touchPrograms(renderer, materials, touched, slice);
  const ride = (async () => {
    await compile(
      all.filter((d) => materialsOf(d).some(isLit)),
      true,
    );
    await touchPrograms(renderer, materials, touched, slice);
  })();
  return { ride };
}

/**
 * A linked program still looks up its uniforms and attributes on first use: synchronous GPU round
 * trips, ~5-10 ms each. Do it here, one program per slice, instead of inside the first frames.
 */
async function touchPrograms(renderer: T.WebGLRenderer, materials: Set<T.Material>, touched: Set<Program>, slice: Slice) {
  for (const m of Array.from(materials)) {
    const progs = (renderer.properties.get(m) as MaterialProps).programs;
    for (const p of progs ? Array.from(progs.values()) : []) {
      if (touched.has(p)) continue;
      while (!p.isReady()) await new Promise((r) => setTimeout(r, 16));
      touched.add(p);
      p.getUniforms();
      p.getAttributes();
      await slice();
    }
  }
}

/** Materials of the post-processing chain, for warm-up. */
export function postMaterials({ composer, guard, lens, bloom }: Post): T.Material[] {
  return [composer.copyPass.material, guard.material, lens.material, bloom.materialHighPassFilter, ...bloom.separableBlurMaterials, bloom.compositeMaterial, bloom.blendMaterial];
}
