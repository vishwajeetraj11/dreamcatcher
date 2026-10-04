import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createSurfaceTextures } from './materials.js';
import { createDreamcatcher } from './model.js';

export function createStudio(container, initialConfig) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
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

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.035);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.65;
  room.dispose(); pmrem.dispose();

  // The olive photographic backdrop also refracts through the quartz.
  // A CSS-only background would make transmissive stones reflect an empty scene.
  const backgroundCanvas = document.createElement('canvas');
  backgroundCanvas.width = backgroundCanvas.height = 512;
  const ctx = backgroundCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(210, 180, 30, 256, 256, 420);
  gradient.addColorStop(0, '#637456'); gradient.addColorStop(0.65, '#536648'); gradient.addColorStop(1, '#43543d');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512);
  const background = new THREE.CanvasTexture(backgroundCanvas);
  background.colorSpace = THREE.SRGBColorSpace;
  scene.background = background;
  scene.backgroundIntensity = 1;

  scene.add(new THREE.HemisphereLight(0xfff2db, 0x4f6046, 0.8));
  const sun = new THREE.DirectionalLight(0xffead1, 3.3);
  sun.position.set(-3.5, 5, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -4.5, near: 0.5, far: 20 });
  sun.shadow.normalBias = 0.018; sun.shadow.bias = -0.0002;
  sun.shadow.radius = 3;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xe6eedb, 0.75); fill.position.set(4, 0.8, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xfff5e6, 1.5); rim.position.set(2, 3, -4); scene.add(rim);

  const textures = createSurfaceTextures();
  let model, disposed = false, rotate = false;
  let homeDistance = 10, homeTarget = new THREE.Vector3(0, -0.3, 0);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fitCamera(reset = false) {
    if (!model) return;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    homeTarget = bounds.getCenter(new THREE.Vector3());
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    homeDistance = Math.max(size.y / (2 * Math.tan(halfFov)), size.x / (2 * Math.tan(halfFov) * camera.aspect)) * 1.18;
    if (reset) resetView();
  }
  function resetView() {
    controls.target.copy(homeTarget);
    camera.position.copy(homeTarget).add(new THREE.Vector3(0.085, 0.018, 1).normalize().multiplyScalar(homeDistance));
    controls.update();
  }
  function rebuild(config) {
    const geometryKeys = ['shape', 'pattern', 'strands', 'length', 'pendant', 'pebbles'];
    if (model && geometryKeys.every(key => model.userData.config[key] === config[key])) {
      model.userData.updateMaterials(config);
      return;
    }
    const direction = model ? camera.position.clone().sub(controls.target).normalize() : null;
    const zoom = model ? camera.position.distanceTo(controls.target) / homeDistance : 1;
    if (model) { model.userData.dispose(); scene.remove(model); }
    model = createDreamcatcher(config, textures); scene.add(model);
    fitCamera(!direction);
    if (direction) {
      controls.target.copy(homeTarget);
      camera.position.copy(homeTarget).addScaledVector(direction, THREE.MathUtils.clamp(homeDistance * zoom, controls.minDistance, controls.maxDistance));
      controls.update();
    }
  }
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
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
    controls.update();
    if (!reducedMotion) model.rotation.z = Math.sin(time * 0.0004) * 0.005;
    renderer.render(scene, camera);
  });
  return {
    rebuild, resetView,
    setRotate(value) { rotate = value; },
    zoom(delta) {
      const direction = camera.position.clone().sub(controls.target);
      camera.position.copy(controls.target).add(direction.setLength(THREE.MathUtils.clamp(direction.length() + delta, controls.minDistance, controls.maxDistance)));
      controls.update();
    },
    screenshot() { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    dispose() {
      disposed = true; observer.disconnect(); controls.dispose(); renderer.setAnimationLoop(null);
      model.userData.dispose(); textures.dispose(); background.dispose(); environment.dispose();
      sun.shadow.map?.dispose(); renderer.dispose();
    }
  };
}
