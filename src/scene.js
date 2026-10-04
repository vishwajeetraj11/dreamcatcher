import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSurfaceTextures } from './materials.js';
import { createDreamcatcher } from './model.js';
import { createStudioEnvironment } from './studio-lighting.js';
import { fitPerspectiveBounds, OVERVIEW_DIRECTION } from './camera-framing.js';

export function createStudio(container, initialConfig) {
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

  const environment = createStudioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.85;

  // The olive photographic backdrop also refracts through the quartz.
  // A CSS-only background would make transmissive stones reflect an empty scene.
  const backgroundCanvas = document.createElement('canvas');
  backgroundCanvas.width = backgroundCanvas.height = 512;
  const ctx = backgroundCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(210, 180, 30, 256, 256, 420);
  gradient.addColorStop(0, '#58694e'); gradient.addColorStop(0.65, '#506246'); gradient.addColorStop(1, '#485b40');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512);
  const background = new THREE.CanvasTexture(backgroundCanvas);
  background.colorSpace = THREE.SRGBColorSpace;
  scene.background = background;
  scene.backgroundIntensity = 1;

  scene.add(new THREE.HemisphereLight(0xfff4e5, 0x555143, 0.42));
  const sun = new THREE.DirectionalLight(0xfff0df, 2.15);
  sun.position.set(-3.5, 5, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -4.5, near: 0.5, far: 20 });
  sun.shadow.normalBias = 0.004; sun.shadow.bias = -0.00008;
  sun.shadow.radius = 3;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xeff3f4, 0.3); fill.position.set(4, 0.8, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xfff1df, 0.38); rim.position.set(2, 3, -4); scene.add(rim);

  const textures = createSurfaceTextures();
  let model, disposed = false, rotate = false, pendantFocused = false;
  let homeDistance = 10, homeTarget = new THREE.Vector3(0, -0.3, 0);
  let modelBounds = new THREE.Box3(), viewportSize = { width: 1, height: 1 };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function overviewFrame(direction = OVERVIEW_DIRECTION) {
    return fitPerspectiveBounds(modelBounds, direction, viewportSize, camera.fov);
  }
  function fitCamera(reset = false) {
    if (!model) return;
    modelBounds.setFromObject(model);
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
    const bounds = new THREE.Box3().setFromObject(model).applyMatrix4(sun.shadow.camera.matrixWorldInverse);
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
    fitShadow();
    fitCamera(!direction);
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
    if (disposed || document.hidden) return;
    controls.autoRotate = rotate;
    controls.autoRotateSpeed = 1.2;
    controls.update(); keepWholePieceVisible();
    if (!reducedMotion) model.rotation.z = Math.sin(time * 0.0004) * 0.005;
    renderer.render(scene, camera);
  });
  return {
    rebuild, resetView, focusPendant,
    setRotate(value) { rotate = value; },
    zoom(delta) {
      keepWholePieceVisible();
      const direction = camera.position.clone().sub(controls.target);
      camera.position.copy(controls.target).add(direction.setLength(THREE.MathUtils.clamp(direction.length() + delta, controls.minDistance, controls.maxDistance)));
      controls.update(); keepWholePieceVisible();
    },
    screenshot() { keepWholePieceVisible(); renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    dispose() {
      disposed = true; observer.disconnect(); controls.dispose(); renderer.setAnimationLoop(null);
      model.userData.dispose(); textures.dispose(); background.dispose(); environment.dispose();
      sun.shadow.map?.dispose(); renderer.dispose();
    }
  };
}
