import * as THREE from 'three';

// A diffuse window, reflector and dark studio walls. Keeping the radiance in
// linear HDR preserves gentle reflections without clipping every polished face
// to white. The broad, feathered sources avoid miniature room/box reflections.
export function createStudioEnvironment(renderer, tint = [1, 1, 1]) {
  const width = 512, height = 256;
  const pixels = new Float32Array(width * height * 4);
  const sources = [
    { direction: new THREE.Vector3(-3.5, 5, 6).normalize(), width: 0.42, height: 0.66, color: [3.8, 3.5, 3.15] },
    { direction: new THREE.Vector3(4, 0.8, 4).normalize(), width: 0.55, height: 0.85, color: [0.55, 0.60, 0.62] },
    { direction: new THREE.Vector3(-1, 4, -3).normalize(), width: 0.7, height: 0.45, color: [0.5, 0.46, 0.4] }
  ].map(source => ({
    ...source,
    right: new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), source.direction).normalize(),
    up: new THREE.Vector3()
  }));
  sources.forEach(source => source.up.crossVectors(source.direction, source.right));
  const direction = new THREE.Vector3();
  for (let y = 0; y < height; y++) {
    const latitude = ((y + 0.5) / height - 0.5) * Math.PI;
    for (let x = 0; x < width; x++) {
      const longitude = ((x + 0.5) / width - 0.5) * Math.PI * 2;
      direction.set(Math.cos(latitude) * Math.cos(longitude), Math.sin(latitude), Math.cos(latitude) * Math.sin(longitude));
      const i = (y * width + x) * 4;
      const ambient = 0.10 + 0.10 * (direction.y * 0.5 + 0.5);
      pixels[i] = ambient * 1.03;
      pixels[i + 1] = ambient;
      pixels[i + 2] = ambient * 0.9;
      for (const source of sources) {
        const facing = direction.dot(source.direction);
        if (facing <= 0) continue;
        const horizontal = Math.atan2(direction.dot(source.right), facing) / source.width;
        const vertical = Math.atan2(direction.dot(source.up), facing) / source.height;
        const falloff = Math.exp(-2 * (horizontal * horizontal + vertical * vertical));
        for (let channel = 0; channel < 3; channel++) pixels[i + channel] += source.color[channel] * falloff;
      }
      for (let channel = 0; channel < 3; channel++) pixels[i + channel] *= tint[channel];
      pixels[i + 3] = 1;
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(texture);
  texture.dispose();
  pmrem.dispose();
  return environment;
}
