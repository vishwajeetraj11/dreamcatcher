import * as THREE from 'three';
import { createStudioEnvironment } from './studio-lighting.js';

const LIGHTS = {
  studio: {
    backdrop: ['#58694e', '#506246', '#485b40'],
    sky: '#fff4e5', ground: '#555143', ambient: 0.42,
    key: '#fff0df', keyPower: 2.15, position: [-3.5, 5, 6],
    fill: '#eff3f4', fillPower: 0.3, rim: '#fff1df', rimPower: 0.38,
    environment: 0.85, exposure: 1, tint: [1, 1, 1]
  },
  daylight: {
    backdrop: ['#7d9180', '#687e6e', '#546b5d'],
    sky: '#f1f6ff', ground: '#71806a', ambient: 0.65,
    key: '#f5f8ff', keyPower: 2.65, position: [-4.5, 5.5, 6],
    fill: '#e1eeff', fillPower: 0.5, rim: '#fff6e6', rimPower: 0.42,
    environment: 1, exposure: 1.05, tint: [0.96, 1, 1.09]
  },
  evening: {
    backdrop: ['#555040', '#3d4335', '#2d362c'],
    sky: '#efc59e', ground: '#354238', ambient: 0.32,
    key: '#ffd1a3', keyPower: 1.8, position: [-4, 1.8, 5],
    fill: '#b8c9df', fillPower: 0.2, rim: '#ffc68e', rimPower: 0.62,
    environment: 0.62, exposure: 1, tint: [1.15, 0.86, 0.64]
  }
};

export function createAtmosphere(scene, renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const background = new THREE.CanvasTexture(canvas);
  background.colorSpace = THREE.SRGBColorSpace;
  scene.background = background;

  const ambient = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.normalBias = 0.004; sun.shadow.bias = -0.00008;
  sun.shadow.radius = 3;
  const fill = new THREE.DirectionalLight(); fill.position.set(4, 0.8, 4);
  const rim = new THREE.DirectionalLight(); rim.position.set(2, 3, -4);
  scene.add(ambient, sun, fill, rim);

  const environments = new Map();
  const colours = [ambient.color, ambient.groundColor, sun.color, fill.color, rim.color, ...LIGHTS.studio.backdrop.map(c => new THREE.Color(c))];
  let from, to, elapsed = 1;
  const duration = 0.65;
  function setLighting(name, immediate = false) {
    if (!Object.hasOwn(LIGHTS, name)) return;
    const preset = LIGHTS[name];
    if (!environments.has(name)) environments.set(name, createStudioEnvironment(renderer, preset.tint));
    scene.environment = environments.get(name).texture;
    from = {
      colours: colours.map(c => c.clone()), position: sun.position.clone(),
      values: [ambient.intensity, sun.intensity, fill.intensity, rim.intensity, scene.environmentIntensity, renderer.toneMappingExposure]
    };
    to = {
      colours: [preset.sky, preset.ground, preset.key, preset.fill, preset.rim, ...preset.backdrop].map(c => new THREE.Color(c)),
      position: new THREE.Vector3(...preset.position),
      values: [preset.ambient, preset.keyPower, preset.fillPower, preset.rimPower, preset.environment, preset.exposure]
    };
    elapsed = 0;
    if (immediate) update(duration);
  }
  function update(delta) {
    if (elapsed >= duration) return false;
    elapsed = Math.min(duration, elapsed + delta);
    const blend = 1 - Math.pow(1 - elapsed / duration, 3);
    colours.forEach((c, i) => c.lerpColors(from.colours[i], to.colours[i], blend));
    sun.position.lerpVectors(from.position, to.position, blend);
    const values = from.values.map((value, i) => THREE.MathUtils.lerp(value, to.values[i], blend));
    [ambient.intensity, sun.intensity, fill.intensity, rim.intensity, scene.environmentIntensity, renderer.toneMappingExposure] = values;
    // The backdrop is part of the scene so transparent quartz sees the same
    // light and colour as the viewer. Upload only during a lighting change.
    const gradient = ctx.createRadialGradient(105, 90, 15, 128, 128, 210);
    [0, 0.65, 1].forEach((stop, i) => gradient.addColorStop(stop, colours[i + 5].getStyle()));
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256);
    background.needsUpdate = true;
    return true;
  }
  setLighting('studio', true);
  return {
    sun, setLighting, update,
    finishTransition() { update(duration); },
    dispose() {
      background.dispose();
      environments.forEach(environment => environment.dispose());
      sun.shadow.map?.dispose();
      sun.shadow.mapPass?.dispose();
      scene.remove(ambient, sun, fill, rim);
    }
  };
}
