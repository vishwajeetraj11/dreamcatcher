import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSurfaceTextures } from './materials.js';
import { createDreamcatcher } from './model.js';
import { createAtmosphere } from './atmosphere.js';
import { applyBreeze } from './breeze.js';
import { fitPerspectiveBounds, OVERVIEW_DIRECTION } from './camera-framing.js';

export function createStudio(container, initialConfig, onMotionPreferenceChange = () => {}) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D dream catcher. Drag to rotate; scroll or pinch to zoom.');
  renderer.domElement.setAttribute('role', 'img');
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 4.3;
  controls.maxDistance = 17;
  controls.maxPolarAngle = Math.PI * 0.82;
  controls.minPolarAngle = Math.PI * 0.18;

  const atmosphere = createAtmosphere(scene, renderer);
  const { sun } = atmosphere;

  const textures = createSurfaceTextures();
  let model, disposed = false, rotate = false, pendantFocused = false;
  let homeDistance = 10, homeTarget = new THREE.Vector3(0, -0.3, 0);
  let modelBounds = new THREE.Box3(), viewportSize = { width: 1, height: 1 };
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionPreference.matches, breeze = false;
  controls.enableDamping = !reducedMotion;
  let breezeTime = 0, breezeStrength = 0, previousTime = null;
  function stopBreeze() {
    breeze = false; breezeTime = 0; breezeStrength = 0;
    if (model) applyBreeze(model, 0, 0);
  }
  function updateMotionPreference(event) {
    reducedMotion = event.matches;
    controls.enableDamping = !reducedMotion;
    if (reducedMotion) {
      stopBreeze(); rotate = false; controls.autoRotate = false;
      // Flush any orbit inertia now rather than letting the camera coast.
      controls.update(); keepWholePieceVisible();
      atmosphere.finishTransition(); fitShadow();
      renderer.render(scene, camera);
    }
    onMotionPreferenceChange(reducedMotion);
  }
  motionPreference.addEventListener('change', updateMotionPreference);
  function overviewFrame(direction = OVERVIEW_DIRECTION) {
    return fitPerspectiveBounds(modelBounds, direction, viewportSize, camera.fov);
  }
  function fitCamera(reset = false) {
    if (!model) return;
    modelBounds.copy(model.userData.previewBounds);
    const frame = overviewFrame();
    homeTarget.copy(frame.target); homeDistance = frame.distance;
    controls.maxDistance = Math.max(17, homeDistance * 2.5);
    if (reset) {
      if (pendantFocused) focusPendant();
      else resetView();
    }
  }
  function keepWholePieceVisible() {
    if (pendantFocused || !model) return;
    const direction = camera.position.clone().sub(controls.target).normalize();
    const frame = overviewFrame(direction);
    controls.minDistance = frame.distance;
    controls.maxDistance = Math.max(controls.maxDistance, frame.distance * 2.5);
    const distance = Math.max(camera.position.distanceTo(controls.target), frame.distance);
    controls.target.copy(frame.target);
    camera.position.copy(controls.target).addScaledVector(direction, distance);
    camera.lookAt(controls.target);
  }
  function resetView() {
    pendantFocused = false;
    controls.minDistance = homeDistance;
    controls.target.copy(homeTarget);
    camera.position.copy(homeTarget).addScaledVector(OVERVIEW_DIRECTION, homeDistance);
    controls.update(); keepWholePieceVisible();
  }
  function focusPendant() {
    const pendant = model?.getObjectByName('rose-quartz-pendant');
    if (!pendant) {
      if (pendantFocused) resetView();
      return false;
    }
    // Keep the close-up steady and fit it using the same rest pose we render.
    applyBreeze(model, 0, 0);
    const bounds = new THREE.Box3().setFromObject(pendant);
    const size = bounds.getSize(new THREE.Vector3());
    const target = bounds.getCenter(new THREE.Vector3());
    // Include the cap and attachment in the inspection view, not just the stone.
    target.y += size.y * 0.16;
    const direction = camera.position.clone().sub(controls.target).normalize();
    pendantFocused = true;
    controls.minDistance = 0.45;
    const distance = Math.max(0.8, size.y * 3.3, size.x * 3.3 / camera.aspect);
    controls.target.copy(target);
    camera.position.copy(target).addScaledVector(direction, distance);
    controls.update();
    return true;
  }
  function fitShadow() {
    sun.shadow.updateMatrices(sun);
    const bounds = modelBounds.clone().applyMatrix4(sun.shadow.camera.matrixWorldInverse);
    Object.assign(sun.shadow.camera, {
      left: bounds.min.x - 0.3, right: bounds.max.x + 0.3,
      bottom: bounds.min.y - 0.3, top: bounds.max.y + 0.3,
      near: Math.max(0.1, -bounds.max.z - 0.5), far: -bounds.min.z + 0.5
    });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.needsUpdate = true;
  }
  function rebuild(config) {
    const geometryKeys = ['shape', 'pattern', 'strands', 'length', 'pendant', 'pebbles'];
    if (model && geometryKeys.every(key => model.userData.config[key] === config[key])) {
      model.userData.updateMaterials(config);
      return;
    }
    const direction = model ? camera.position.clone().sub(controls.target).normalize() : null;
    const zoom = model ? Math.max(1, camera.position.distanceTo(controls.target) / homeDistance) : 1;
    if (model) { model.userData.dispose(); scene.remove(model); }
    model = createDreamcatcher(config, textures); scene.add(model);
    fitCamera(!direction);
    fitShadow();
    applyBreeze(model, breezeTime, pendantFocused ? 0 : breezeStrength);
    if (pendantFocused) {
      focusPendant();
    } else if (direction) {
      controls.target.copy(homeTarget);
      controls.minDistance = overviewFrame(direction).distance;
      camera.position.copy(homeTarget).addScaledVector(direction, THREE.MathUtils.clamp(homeDistance * zoom, controls.minDistance, controls.maxDistance));
      controls.update(); keepWholePieceVisible();
    }
  }
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    viewportSize = { width, height };
    renderer.setSize(width, height);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    fitCamera(true);
  }
  const observer = new ResizeObserver(resize); observer.observe(container);
  resize(); rebuild(initialConfig);
  renderer.setAnimationLoop((time) => {
    if (disposed || document.hidden) { previousTime = null; return; }
    const delta = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    if (breeze && !reducedMotion && !pendantFocused) {
      breezeTime += delta;
      breezeStrength = Math.min(1, breezeStrength + delta * 0.6);
    }
    applyBreeze(model, breezeTime, breeze && !reducedMotion && !pendantFocused ? breezeStrength : 0);
    if (atmosphere.update(delta)) fitShadow();
    controls.autoRotate = rotate && !reducedMotion;
    controls.autoRotateSpeed = 1.2;
    controls.update(); keepWholePieceVisible();
    renderer.render(scene, camera);
  });
  return {
    rebuild, resetView, focusPendant,
    get reducedMotion() { return reducedMotion; },
    setRotate(value) { rotate = Boolean(value) && !reducedMotion; },
    setBreeze(value) {
      if (value && !reducedMotion) breeze = true;
      else stopBreeze();
    },
    setLighting(value) { atmosphere.setLighting(value, reducedMotion); fitShadow(); },
    zoom(delta) {
      keepWholePieceVisible();
      const direction = camera.position.clone().sub(controls.target);
      camera.position.copy(controls.target).add(direction.setLength(THREE.MathUtils.clamp(direction.length() + delta, controls.minDistance, controls.maxDistance)));
      controls.update(); keepWholePieceVisible();
    },
    screenshot() { keepWholePieceVisible(); renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    dispose() {
      disposed = true; observer.disconnect(); controls.dispose(); renderer.setAnimationLoop(null);
      motionPreference.removeEventListener('change', updateMotionPreference);
      model.userData.dispose(); textures.dispose(); atmosphere.dispose(); renderer.dispose();
    }
  };
}
