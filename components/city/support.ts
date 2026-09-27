// Decides whether `/` can run the 3D city or must render the 2D TOPY.OS page instead.

export type GlProbe = { webgl2: boolean; renderer: string };

/** Renderer strings of CPU rasterizers: the city would crawl there, so serve 2D. */
export const SOFTWARE_RENDERER = /swiftshader|llvmpipe|software|basic render/i;

/**
 * `?city=off` forces the 2D page and `?city=force` skips the software-renderer check
 * (test hooks). Reduced motion and missing WebGL2 always get the 2D page.
 */
export function pickView(search: string, reducedMotion: boolean, probe: () => GlProbe): 'city' | '2d' {
  const q = new URLSearchParams(search).get('city');
  if (q === 'off' || reducedMotion) return '2d';
  const p = probe();
  if (!p.webgl2) return '2d';
  if (q !== 'force' && SOFTWARE_RENDERER.test(p.renderer)) return '2d';
  return 'city';
}

export function probeWebGL(): GlProbe {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return { webgl2: false, renderer: '' };
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { webgl2: true, renderer };
  } catch {
    return { webgl2: false, renderer: '' };
  }
}
