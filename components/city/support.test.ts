import { describe, expect, it } from 'vitest';
import { pickView, type GlProbe } from './support';

const gpu = (renderer: string, webgl2 = true) => (): GlProbe => ({ webgl2, renderer });
const NVIDIA = 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)';
const SWIFT = 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)';

describe('pickView', () => {
  it('runs the city on a real GPU', () => {
    expect(pickView('', false, gpu(NVIDIA))).toBe('city');
  });

  it('serves 2D without WebGL2', () => {
    expect(pickView('', false, gpu('', false))).toBe('2d');
  });

  it('serves 2D on software renderers', () => {
    for (const r of [SWIFT, 'llvmpipe (LLVM 15.0.7, 256 bits)', 'Microsoft Basic Render Driver', 'Software Rasterizer']) {
      expect(pickView('', false, gpu(r))).toBe('2d');
    }
  });

  it('serves 2D for reduced motion without probing the GPU', () => {
    expect(pickView('', true, () => { throw new Error('should not probe'); })).toBe('2d');
  });

  it('honours the ?city test hooks', () => {
    expect(pickView('?city=off', false, gpu(NVIDIA))).toBe('2d');
    expect(pickView('?city=force', false, gpu(SWIFT))).toBe('city');
    expect(pickView('?city=force', false, gpu('', false))).toBe('2d');
    expect(pickView('?city=force', true, gpu(SWIFT))).toBe('2d');
  });
});
