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
function cloudyCrystal(params, { scale = 1.7, density = 0.7, fracture = 0.3, milk = '#f4e8d8' } = {}) {
  const material = new THREE.MeshPhysicalMaterial(params);
  // Sample a mineral field beneath the surface along the viewing ray. The pattern
  // stays inside each stone as it rotates, rather than reading as painted speckles.
  // This approximates inclusion scattering; Three still handles the refraction,
  // Fresnel reflections and attenuation through its physical material shader.
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, {
      crystalScale: { value: scale },
      crystalDensity: { value: density },
      crystalFractureStrength: { value: fracture },
      crystalMilk: { value: new THREE.Color(milk) }
    });
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      varying vec3 vStonePosition;
      varying vec3 vStoneRay;`).replace('#include <begin_vertex>', `#include <begin_vertex>
      vStonePosition = position;
      vec3 crystalWorldRay = (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition;
      // Inverse rotation AND scale, without a per-vertex matrix inversion.
      vStoneRay = vec3(
        dot(crystalWorldRay, modelMatrix[0].xyz) / dot(modelMatrix[0].xyz, modelMatrix[0].xyz),
        dot(crystalWorldRay, modelMatrix[1].xyz) / dot(modelMatrix[1].xyz, modelMatrix[1].xyz),
        dot(crystalWorldRay, modelMatrix[2].xyz) / dot(modelMatrix[2].xyz, modelMatrix[2].xyz)
      );`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vStonePosition;
      varying vec3 vStoneRay;
      uniform float crystalScale;
      uniform float crystalDensity;
      uniform float crystalFractureStrength;
      uniform vec3 crystalMilk;
      float mineralHash(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float mineralNoise(vec3 p) {
        vec3 cell = floor(p), f = fract(p);
        f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        return mix(
          mix(mix(mineralHash(cell), mineralHash(cell + vec3(1, 0, 0)), f.x),
              mix(mineralHash(cell + vec3(0, 1, 0)), mineralHash(cell + vec3(1, 1, 0)), f.x), f.y),
          mix(mix(mineralHash(cell + vec3(0, 0, 1)), mineralHash(cell + vec3(1, 0, 1)), f.x),
              mix(mineralHash(cell + vec3(0, 1, 1)), mineralHash(cell + vec3(1, 1, 1)), f.x), f.y), f.z);
      }
      float mineralCloud(vec3 p) {
        // Finer overlapping milk inclusions, with only a little broad mottling.
        // A strong warp makes quartz look like smoke suspended in tinted glass.
        p += vec3(mineralNoise(p * 0.74 + 5.1), mineralNoise(p * 0.81 + 19.4), mineralNoise(p * 0.68 + 34.2)) * 0.30;
        return mineralNoise(p) * 0.31 + mineralNoise(p * 2.13 + 7.1) * 0.44 + mineralNoise(p * 4.71 + 23.4) * 0.25;
      }
      float mineralFractures(vec3 p) {
        float warp = (mineralNoise(p * 3.1 + 9.0) - 0.5) * 0.09;
        float planeA = abs(dot(p, vec3(0.58, 0.39, 0.71)) + warp - 0.38);
        float planeB = abs(dot(p, vec3(-0.74, 0.57, 0.36)) + warp + 1.57);
        float planeC = abs(dot(p, vec3(0.27, 0.93, -0.25)) + warp + 3.65);
        float planeD = abs(dot(p, vec3(-0.64, 0.74, -0.20)) + warp + 5.2);
        float planeDistance = min(min(planeA, planeB), min(planeC, planeD));
        float antialias = max(fwidth(planeDistance), 0.004);
        float edges = 1.0 - smoothstep(0.004, 0.016 + antialias * 1.5, planeDistance);
        edges *= smoothstep(0.28, 0.68, mineralNoise(p * 4.8 + 52.0));
        // Small interrupted feather inclusions sit between the larger cleavages.
        // They brighten the body without painting a dark marble vein on it.
        float featherField = mineralNoise(p * vec3(3.1, 4.3, 2.7) + 23.0)
                           + mineralNoise(p * vec3(7.3, 3.2, 5.1) + 11.0) * 0.12;
        float feather = 1.0 - smoothstep(0.012, 0.040, abs(featherField - 0.55));
        feather *= smoothstep(0.42, 0.72, mineralNoise(p * 1.8 + 43.0));
        return max(edges, feather * 0.58);
      }`).replace('#include <color_fragment>', `#include <color_fragment>
      vec3 mineralPoint = vStonePosition * crystalScale + vec3(2.7, 0.8, 4.1);
      vec3 mineralRay = normalize(vStoneRay);
      float mineralSurface = mineralCloud(mineralPoint);
      float mineralInterior = mineralCloud(mineralPoint + mineralRay * 0.14) * 0.60
                            + mineralCloud(mineralPoint + mineralRay * 0.35) * 0.40;
      float mineralMilk = smoothstep(0.38, 0.66, mix(mineralSurface, mineralInterior, 0.70)) * crystalDensity;
      vec3 fracturePoint = vStonePosition * crystalScale;
      float mineralCracks = (mineralFractures(fracturePoint + mineralRay * 0.06) * 0.68
                          + mineralFractures(fracturePoint + mineralRay * 0.23) * 0.32) * crystalFractureStrength;
      float mineralScattering = clamp(mineralMilk + mineralCracks * 0.46, 0.0, 0.92);
      diffuseColor.rgb = mix(diffuseColor.rgb, crystalMilk, clamp(mineralMilk * 0.62 + mineralCracks * 0.64, 0.0, 0.88));
    `).replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = clamp(roughnessFactor + mineralMilk * 0.085 + mineralCracks * 0.06, 0.06, 0.65);
    `).replace('#include <transmission_fragment>', THREE.ShaderChunk.transmission_fragment.replace(
      'material.transmission = transmission;',
      'material.transmission = transmission * (1.0 - mineralScattering * 0.76);'
    ));
  };
  material.customProgramCacheKey = () => 'moon-woven-mineral-volume-v4';
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
    silver: standard({ color: '#b4a38d', metalness: 0.92, roughness: 0.37 }),
    silverDark: standard({ color: '#5d5141', metalness: 0.80, roughness: 0.54 }),
    bead: cloudyCrystal({ color: palettes.stone[config.stone].color, roughness: 0.19, metalness: 0, transmission: config.stone === 'clear' ? 0.72 : 0.16, thickness: 0.10, ior: 1.54, attenuationColor: new THREE.Color(palettes.stone[config.stone].color), attenuationDistance: 0.9, clearcoat: 0.14, clearcoatRoughness: 0.18, envMapIntensity: 0.88 }, { scale: 2.2, density: config.stone === 'clear' ? 0.70 : 0.50, fracture: config.stone === 'clear' ? 0.65 : 0.08, milk: config.stone === 'jade' ? '#d1ddbf' : '#f1e5df' }),
    quartz: cloudyCrystal({ color: '#f1e5df', roughness: 0.205, metalness: 0, transmission: 0.78, thickness: 0.09, ior: 1.54, attenuationColor: new THREE.Color('#f4e8e0'), attenuationDistance: 2.2, clearcoat: 0.06, clearcoatRoughness: 0.20, envMapIntensity: 0.90 }, { scale: 2.4, density: 0.85, fracture: 1.0, milk: '#fff1e8' }),
    pink: cloudyCrystal({ color: '#f4d1cb', roughness: 0.12, transmission: 0.88, thickness: 0.14, ior: 1.54, attenuationColor: new THREE.Color('#f0c9c1'), attenuationDistance: 1.8, clearcoat: 0.06, clearcoatRoughness: 0.16, envMapIntensity: 0.82 }, { scale: 12.2, density: 0.34, fracture: 0.68, milk: '#ffe6dc' }),
    inclusion: new THREE.LineBasicMaterial({ color: '#fff4e9', transparent: true, opacity: 0.17, depthWrite: false })
  };
  return result;
}
