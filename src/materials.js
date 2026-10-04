import * as THREE from 'three';
import { palettes } from './config.js';

// Fixed seeds keep the handmade variations stable while customers change options.
export function randomSequence(seed = 47) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const fract = value => value - Math.floor(value);
function hash(x, y) { return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123); }
function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = fract(x), fy = fract(y);
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix, iy), hash(ix + 1, iy), fx), THREE.MathUtils.lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), fx), fy);
}
function texture(size, sample, color = false) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const values = sample(x / size, y / size);
    const i = (y * size + x) * 4;
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(THREE.MathUtils.clamp(Array.isArray(values) ? values[c] : values, 0, 1) * 255);
    data[i + 3] = 255;
  }
  const result = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  result.wrapS = result.wrapT = THREE.RepeatWrapping;
  result.magFilter = THREE.LinearFilter;
  result.minFilter = THREE.LinearMipmapLinearFilter;
  result.generateMipmaps = true;
  result.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  result.needsUpdate = true;
  return result;
}
export function createSurfaceTextures() {
  const bark = texture(256, (u, v) => {
    const grain = noise(u * 8, v * 110) * 0.46 + noise(u * 35, v * 180) * 0.2;
    const grooves = Math.pow(Math.abs(Math.sin(v * 185 + noise(u * 8, v * 17) * 7)), 9) * 0.22;
    const value = 0.38 + grain - grooves;
    return [value * 1.04, value * 0.87, value * 0.72];
  }, true);
  bark.repeat.set(3, 1);
  const jute = texture(128, (u, v) => 0.48 + noise(u * 12, v * 95) * 0.34 + Math.sin(v * 460 + u * 28) * 0.1);
  jute.repeat.set(16, 2);
  const stone = texture(128, (u, v) => {
    const cloud = noise(u * 6, v * 8) * 0.65 + noise(u * 17, v * 18) * 0.25 + noise(u * 41, v * 32) * 0.1;
    return 0.70 + cloud * 0.3;
  }, true);
  const endGrain = texture(128, (u, v) => {
    const r = Math.hypot(u - 0.5, v - 0.5);
    const ring = Math.sin(r * 160 + noise(u * 9, v * 9) * 4);
    const value = 0.65 + ring * 0.08 + noise(u * 40, v * 40) * 0.12;
    return [value, value * 0.77, value * 0.51];
  }, true);
  return { bark, jute, stone, endGrain, dispose() { [bark, jute, stone, endGrain].forEach(t => t.dispose()); } };
}
function cloudyCrystal(params) {
  const material = new THREE.MeshPhysicalMaterial(params);
  // Object-space inclusions give quartz depth without baking a photograph onto it.
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vStonePosition;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvStonePosition = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vStonePosition;
      float crystalCloud(vec3 p) {
        return sin(p.x * 23.0 + sin(p.z * 17.0)) * sin(p.y * 31.0 + p.x * 8.0) * sin(p.z * 29.0 + p.y * 11.0);
      }`).replace('#include <color_fragment>', `#include <color_fragment>
      float cloud = smoothstep(0.30, 0.8, crystalCloud(vStonePosition));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.9, 0.84), cloud * 0.26);`);
  };
  material.customProgramCacheKey = () => 'moon-woven-crystal-v1';
  return material;
}
export function createMaterials(config, surfaces) {
  const frameColor = new THREE.Color(palettes.frame[config.frame].color);
  const threadColor = new THREE.Color(palettes.thread[config.thread].color);
  const standard = params => new THREE.MeshStandardMaterial(params);
  const result = {
    bark: standard({ color: '#937565', map: surfaces.bark, bumpMap: surfaces.bark, bumpScale: 0.035, roughness: 0.94 }),
    cutWood: standard({ color: '#bfa17a', map: surfaces.endGrain, roughness: 1 }),
    wrap: standard({ color: frameColor, bumpMap: surfaces.jute, bumpScale: 0.012, roughness: 0.97 }),
    rope: standard({ color: frameColor.clone().multiplyScalar(0.83), bumpMap: surfaces.jute, bumpScale: 0.009, roughness: 0.93 }),
    ropeLight: standard({ color: frameColor.clone().lerp(new THREE.Color('#e5c698'), 0.22), roughness: 1 }),
    fuzz: new THREE.LineBasicMaterial({ color: frameColor.clone().multiplyScalar(1.17), transparent: true, opacity: 0.53, depthWrite: false }),
    cotton: standard({ color: threadColor, bumpMap: surfaces.jute, bumpScale: 0.003, roughness: 0.93 }),
    paint: standard({ color: '#f2e6c9', roughness: 0.96 }),
    silver: standard({ color: '#a8a395', metalness: 0.87, roughness: 0.28 }),
    silverDark: standard({ color: '#6c695e', metalness: 0.74, roughness: 0.4 }),
    bead: cloudyCrystal({ color: palettes.stone[config.stone].color, map: surfaces.stone, roughness: 0.21, metalness: 0, transmission: config.stone === 'clear' ? 0.86 : 0.12, thickness: 0.18, ior: 1.48, clearcoat: 0.75, clearcoatRoughness: 0.16, envMapIntensity: 0.95 }),
    quartz: cloudyCrystal({ color: '#f4e8df', roughness: 0.11, metalness: 0, transmission: 0.94, thickness: 0.21, ior: 1.46, attenuationColor: new THREE.Color('#ecddcb'), attenuationDistance: 1.2, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.15 }),
    pink: cloudyCrystal({ color: '#f4cfca', roughness: 0.18, transmission: 0.65, thickness: 0.32, ior: 1.46, attenuationColor: new THREE.Color('#dfa99a'), attenuationDistance: 0.7, clearcoat: 0.7, clearcoatRoughness: 0.16 }),
    inclusion: new THREE.LineBasicMaterial({ color: '#fff4e9', transparent: true, opacity: 0.17, depthWrite: false })
  };
  return result;
}
