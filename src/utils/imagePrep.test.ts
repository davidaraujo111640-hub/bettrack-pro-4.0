import { describe, expect, it } from 'vitest';
import { fitSize, MAX_IMAGE_SIDE } from './imagePrep';

describe('fitSize', () => {
  it('no toca las imágenes que ya caben', () => {
    expect(fitSize(800, 1200)).toEqual({ width: 800, height: 1200 });
    expect(fitSize(MAX_IMAGE_SIDE, 900)).toEqual({ width: MAX_IMAGE_SIDE, height: 900 });
  });

  it('reduce una captura de móvil manteniendo la proporción', () => {
    expect(fitSize(1170, 2532)).toEqual({ width: 739, height: 1600 });
  });

  it('reduce una imagen apaisada por su lado largo', () => {
    expect(fitSize(4000, 2000)).toEqual({ width: 1600, height: 800 });
  });
});

describe('iconos', () => {
  it('los iconos se reducen a un lado máximo de 192 px', () => {
    expect(fitSize(1000, 500, 192)).toEqual({ width: 192, height: 96 });
    expect(fitSize(100, 100, 192)).toEqual({ width: 100, height: 100 });
  });
});
