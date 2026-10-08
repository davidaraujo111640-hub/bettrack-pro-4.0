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
