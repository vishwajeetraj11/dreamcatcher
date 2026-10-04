import * as THREE from 'three';
import { createMaterials, cloudyCrystal } from './materials.js';

const fract = x => x - Math.floor(x);
const hash = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = fract(x), fy = fract(y);
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix, iy), hash(ix + 1, iy), fx), THREE.MathUtils.lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), fx), fy);
}
function surface(size, sample, color = false) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const values = sample(x / size, y / size), i = (y * size + x) * 4;
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(255 * THREE.MathUtils.clamp(Array.isArray(values) ? values[c] : values, 0, 1));
    data[i + 3] = 255;
  }
  const result = new THREE.DataTexture(data, size, size);
  result.wrapS = result.wrapT = THREE.RepeatWrapping;
  result.magFilter = THREE.LinearFilter;
  result.minFilter = THREE.LinearMipmapLinearFilter;
  result.generateMipmaps = true;
  result.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  result.needsUpdate = true;
  return result;
}

// Tube u follows the stick, v wraps its circumference. The long grain and
// short weathered patches therefore remain aligned on every crossing branch.
export function createCraftSurfaces() {
  const wood = surface(512, (u, v) => {
    const grain = Math.pow(0.5 + 0.5 * Math.sin(v * 270 + noise(u * 4, v * 14) * 6), 18);
    const weathering = noise(u * 8, v * 20), bark = noise(u * 30, v * 75);
    const light = 0.57 + weathering * 0.18 + bark * 0.07 - grain * 0.08;
    return [light * 1.03, light * 0.89, light * 0.72];
  }, true);
  const woodRelief = surface(256, (u, v) => {
    const ridges = Math.sin(v * 270 + noise(u * 4, v * 14) * 6);
    return 0.45 + ridges * 0.11 + noise(u * 14, v * 82) * 0.26;
  });
  const cotton = surface(256, (u, v) => 0.72 + noise(u * 85, v * 38) * 0.15 + Math.sin(v * 510 + u * 48) * 0.045);
  return { wood, woodRelief, cotton, dispose() { for (const t of [wood, woodRelief, cotton]) t.dispose(); } };
}

export function createCraftMaterials(config, textures, craft) {
  const mat = createMaterials(config, textures);
  mat.bark.map = craft.wood;
  mat.bark.bumpMap = craft.woodRelief;
  mat.bark.bumpScale = 0.008;
  mat.bark.color.set(config.frame === 'walnut' ? '#92785e' : config.design === 'willow' ? '#b89c7b' : '#d2b899');
  mat.bark.roughness = 0.88;
  mat.cutWood.color.set('#d5bd93');
  // The original warm cotton was blown out into white wire at this scale.
  mat.cotton.color.multiplyScalar(0.91);
  mat.cotton.bumpMap = craft.cotton;
  mat.cotton.bumpScale = 0.0018;
  mat.web = mat.cotton.clone();
  mat.web.color.multiplyScalar(0.84);
  mat.cottonShade = mat.cotton.clone();
  mat.cottonShade.color.multiplyScalar(0.76);
  // Combed cotton is matte even along its fine strands. Keep the scattering
  // tint tied to the chosen thread so dark/custom colors don't acquire white fuzz.
  mat.leafFiber = new THREE.MeshPhysicalMaterial({ name: 'Combed cotton fibers', color: mat.cotton.color.clone(), roughness: 1, metalness: 0, specularIntensity: 0.18, sheen: 0.16, sheenRoughness: 1, sheenColor: mat.cotton.color.clone(), bumpMap: craft.cotton, bumpScale: 0.00045 });
  // Shadow-map texels are wider than these fibers. Their self-shadowing aliases
  // into dark speckles; retain the cast silhouette and use diffuse yarn shading.
  mat.leafFiber.userData.receiveShadow = false;
  mat.leafShade = mat.leafFiber.clone();
  mat.leafShade.name = 'Cotton fiber depth';
  mat.leafShade.color.multiplyScalar(0.88);
  mat.leafKnot = mat.leafFiber.clone();
  mat.leafKnot.name = 'Cotton leaf knots';
  mat.leafKnot.color.multiplyScalar(0.93);
  mat.leafKnot.userData.receiveShadow = true;
  mat.woodBead = new THREE.MeshStandardMaterial({ color: '#bba281', map: craft.wood, bumpMap: craft.woodRelief, bumpScale: 0.002, roughness: 0.65 });
  mat.hole = new THREE.MeshStandardMaterial({ color: '#594d3b', roughness: 1 });
  mat.charm = new THREE.MeshStandardMaterial({ color: '#dec297', map: craft.wood, bumpMap: craft.woodRelief, bumpScale: 0.002, roughness: 0.92 });
  mat.leafPaint = new THREE.MeshStandardMaterial({ color: '#445438', roughness: 0.92 });
  mat.paint.color.set('#e6d7b8');
  mat.paint.roughness = 1;
  if (config.stone === 'jade') {
    mat.bead.color.set('#9ec99a');
    mat.bead.attenuationColor.set('#a5c492');
    mat.bead.transmission = 0.42;
    mat.bead.thickness = 0.17;
    mat.bead.roughness = 0.23;
  }
  // Construct these with their mineral shader; Material.clone does not copy
  // onBeforeCompile and previously turned both stones into plain tinted glass.
  mat.amber = cloudyCrystal({ color: '#e5c891', roughness: 0.22, transmission: 0.67, thickness: 0.14, ior: 1.54, attenuationColor: new THREE.Color('#c7a461'), attenuationDistance: 1.2, envMapIntensity: 0.85 }, { scale: 9, density: 0.55, fracture: 0.5, milk: '#f9e2b5' });
  mat.amberDisk = cloudyCrystal({ color: '#e9d9b1', roughness: 0.16, transmission: 0.84, thickness: 0.055, ior: 1.54, attenuationColor: new THREE.Color('#d5be8a'), attenuationDistance: 1.8, envMapIntensity: 0.75 }, { scale: 1.8, density: 0.28, fracture: 0.22, milk: '#f9eccc' });
  mat.garnet = cloudyCrystal({ color: '#843d31', roughness: 0.19, transmission: 0.48, thickness: 0.12, ior: 1.7, attenuationColor: new THREE.Color('#642019'), attenuationDistance: 0.5, envMapIntensity: 0.8 }, { scale: 11, density: 0.25, fracture: 0.35, milk: '#dca68b' });
  return mat;
}
