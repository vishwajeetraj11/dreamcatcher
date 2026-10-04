import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { palettes } from './config.js';

const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
export function createStudio(container, initialConfig) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D dream catcher. Drag to rotate; scroll or pinch to zoom.');
  renderer.domElement.setAttribute('role', 'img');
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 15;
  controls.maxPolarAngle = Math.PI * 0.82;
  controls.minPolarAngle = Math.PI * 0.18;
  controls.target.set(0, -0.4, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.55;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfff7e2, 0x67725d, 1.1));
  const sun = new THREE.DirectionalLight(0xfff3dc, 2.4);
  sun.position.set(-3, 5, 6);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.8);
  fill.position.set(4, 1, -3);
  scene.add(fill);
  let model = new THREE.Group(), disposed = false, rotate = false;
  scene.add(model);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const materials = new Set();
  const material = (params) => { const m = new THREE.MeshStandardMaterial(params); materials.add(m); return m; };
  function mesh(geometry, mat, pos, scale, group = model) {
    const object = new THREE.Mesh(geometry, mat);
    if (pos) object.position.copy(pos);
    if (scale) object.scale.set(...scale);
    group.add(object);
    return object;
  }
  function tube(points, radius, mat, closed = false, segments = 100) {
    const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
    return mesh(new THREE.TubeGeometry(curve, segments, radius, 6, closed), mat);
  }
  function thread(a, b, mat, radius = 0.007) {
    const distance = a.distanceTo(b);
    const obj = mesh(new THREE.CylinderGeometry(radius, radius, distance, 5), mat, a.clone().lerp(b, 0.5));
    obj.quaternion.setFromUnitVectors(v(0, 1), b.clone().sub(a).normalize());
    return obj;
  }
  function boundary(shape, t) {
    const a = t * Math.PI * 2;
    if (shape === 'circle') return v(Math.cos(a) * 1.27, Math.sin(a) * 1.27 + 0.63);
    if (shape === 'teardrop') return v(Math.sin(a) * 1.2 * (0.76 - 0.23 * Math.cos(a)), Math.cos(a) * 1.45 + 0.65);
    // A bent natural branch and its straight wooden spine, inspired by the supplied piece.
    if (t <= 0.73) {
      const angle = 1.25 + (t / 0.73) * 3.79;
      return v(Math.cos(angle) * 1.43 + 0.18, Math.sin(angle) * 1.35 + 0.73);
    }
    const bottom = boundary('moon', 0.73), top = boundary('moon', 0);
    return bottom.lerp(top, (t - 0.73) / 0.27);
  }
  function rebuild(config) {
    model.traverse(obj => obj.geometry?.dispose());
    for (const mat of materials) mat.dispose();
    materials.clear();
    scene.remove(model);
    model = new THREE.Group();
    scene.add(model);
    const wrap = material({ color: palettes.frame[config.frame].color, roughness: 0.96 });
    const fiber = material({ color: new THREE.Color(palettes.frame[config.frame].color).multiplyScalar(0.82), roughness: 1 });
    const wood = material({ color: '#6f5140', roughness: 0.96 });
    const cotton = material({ color: new THREE.Color(palettes.thread[config.thread].color).multiplyScalar(0.76), roughness: 1 });
    const gold = material({ color: '#baa275', metalness: 0.72, roughness: 0.3 });
    const bead = material({ color: palettes.stone[config.stone].color, roughness: 0.19, metalness: 0.05 });
    const quartz = new THREE.MeshPhysicalMaterial({ color: '#eee0d3', roughness: 0.12, transmission: 0.5, thickness: 0.3, ior: 1.46 });
    materials.add(quartz);
    const pink = new THREE.MeshPhysicalMaterial({ color: '#e9bfb4', roughness: 0.17, transmission: 0.3, thickness: 0.5 });
    materials.add(pink);
    const end = config.shape === 'moon' ? 0.73 : 1;
    const curvePoints = Array.from({ length: 100 }, (_, i) => boundary(config.shape, (i / 99) * end));
    tube(curvePoints, 0.072, wrap, config.shape !== 'moon', 170);
    // Continuous helical jute wrapping adds actual surface depth, including from the side.
    const helix = [];
    for (let i = 0; i <= 4200; i++) {
      const t = i / 4200 * end;
      const p = boundary(config.shape, t);
      const next = boundary(config.shape, Math.min(t + 0.0001, end));
      const tangent = next.sub(p).normalize();
      const normal = v(-tangent.y, tangent.x);
      const angle = i / 4200 * Math.PI * 2 * 205;
      helix.push(p.clone().addScaledVector(normal, Math.cos(angle) * 0.076).add(v(0, 0, Math.sin(angle) * 0.076)));
    }
    tube(helix, 0.012, fiber, false, 4200);
    if (config.shape === 'moon') {
      const lower = boundary('moon', 0.73), upper = boundary('moon', 0);
      tube([lower.clone().add(v(0.03, -0.22)), lower, upper, upper.clone().add(v(-0.015, 0.16))], 0.065, wood, false, 40);
      for (let i = 0; i < 22; i++) {
        const pos = lower.clone().lerp(upper, i / 21); pos.z = 0.065;
        mesh(new THREE.SphereGeometry(0.02, 8, 6), cotton, pos, [1, 1.2, 0.25]);
      }
      const spineWrap = Array.from({ length: 360 }, (_, i) => {
        const p = lower.clone().lerp(upper, i / 359); const a = i / 359 * Math.PI * 26;
        return p.add(v(Math.cos(a) * 0.068, 0, Math.sin(a) * 0.068));
      });
      tube(spineWrap, 0.008, cotton, false, 400);
    }
    const count = config.pattern === 'dense' ? 24 : 16;
    const layers = config.pattern === 'dense' ? 7 : 5;
    const center = v(config.shape === 'moon' ? -0.16 : 0, 0.65, 0.012);
    let previous = Array.from({ length: count }, (_, i) => boundary(config.shape, i / count));
    for (let layer = 1; layer <= layers; layer++) {
      const scale = 1 - layer / (layers + 1.65);
      const next = Array.from({ length: count }, (_, i) => {
        const point = boundary(config.shape, ((i + layer * 0.48) / count) % 1);
        return center.clone().lerp(point, scale).add(v(0, 0, (layer % 2) * 0.006));
      });
      for (let i = 0; i < count; i++) {
        thread(previous[i], next[i], cotton);
        thread(next[i], previous[(i + 1) % count], cotton);
        if (layer === layers) thread(next[i], next[(i + 1) % count], cotton);
        if (config.pattern === 'star' && layer === 2) thread(next[i], next[(i + 5) % count], cotton, 0.0045);
      }
      previous = next;
    }
    if (config.pebbles) for (let i = 0; i < 8; i++) {
      const t = config.shape === 'moon' ? 0.04 + i * 0.09 : i / 8;
      const pos = boundary(config.shape, t); pos.z = 0.105;
      const stone = mesh(new THREE.IcosahedronGeometry(0.13, 1), quartz, pos, [1, 0.8 + (i % 3) * 0.17, 0.7]);
      stone.rotation.set(i * 0.9, i * 0.4, i * 0.7);
    }
    for (let i = 0; i < config.strands; i++) {
      const fraction = config.strands === 1 ? 0.5 : i / (config.strands - 1);
      let pos;
      if (config.shape === 'moon') pos = boundary('moon', 0.49 + fraction * 0.23);
      else if (config.shape === 'circle') pos = boundary('circle', 0.62 + fraction * 0.26);
      else pos = boundary('teardrop', 0.36 + fraction * 0.28);
      const length = (1.22 + Math.sin(fraction * Math.PI) * 0.42 + (config.shape === 'moon' ? fraction * 0.28 : 0)) * config.length;
      const bottom = pos.clone().add(v(0, -length));
      thread(pos, bottom, cotton);
      const beadCount = 3 + (i % 2);
      for (let j = 0; j < beadCount; j++) {
        const p = pos.clone().lerp(bottom, (j + 0.65) / beadCount);
        mesh(new THREE.SphereGeometry(0.077, 16, 12), bead, p, [1, 1.45, 0.9]);
        for (const offset of [-0.14, 0.14]) {
          const chip = mesh(new THREE.IcosahedronGeometry(0.047, 0), quartz, p.clone().add(v(0.012, offset, 0)), [1.2, 0.65, 0.85]);
          chip.rotation.set(j * 1.3, i, j * 0.6);
        }
        mesh(new THREE.TorusGeometry(0.031, 0.009, 5, 12), gold, p.clone().add(v(0, 0.113, 0))).rotation.x = Math.PI / 2;
      }
    }
    if (config.pendant) {
      const anchor = config.shape === 'moon' ? boundary('moon', 0).add(v(0.15, -0.02)) : v(0, 0.64, 0.08);
      const hang = anchor.clone().add(v(0, -0.32));
      thread(anchor, hang, gold, 0.01);
      mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.10, 6), gold, hang);
      mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.40, 6), pink, hang.clone().add(v(0, -0.25)));
      mesh(new THREE.ConeGeometry(0.088, 0.13, 6), pink, hang.clone().add(v(0, -0.515))).rotation.z = Math.PI;
    }
    const top = config.shape === 'moon' ? boundary('moon', 0.13) : boundary(config.shape, config.shape === 'circle' ? 0.25 : 0);
    tube([top, top.clone().add(v(-0.07, 0.18)), top.clone().add(v(0, 0.3)), top.clone().add(v(0.07, 0.18)), top], 0.012, cotton, false, 30);
  }
  function resetView() { camera.position.set(0.1, -0.15, 9.4); controls.target.set(0, -0.4, 0); controls.update(); }
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(container);
  resetView(); rebuild(initialConfig); resize();
  renderer.setAnimationLoop((time) => {
    if (disposed) return;
    controls.autoRotate = rotate;
    controls.autoRotateSpeed = 1.7;
    controls.update();
    if (!reducedMotion) model.rotation.z = Math.sin(time * 0.00045) * 0.007;
    renderer.render(scene, camera);
  });
  return {
    rebuild,
    resetView,
    setRotate(value) { rotate = value; },
    zoom(delta) { const direction = camera.position.clone().sub(controls.target); camera.position.copy(controls.target).add(direction.setLength(THREE.MathUtils.clamp(direction.length() + delta, 5, 15))); controls.update(); },
    screenshot() { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    dispose() { disposed = true; observer.disconnect(); controls.dispose(); renderer.setAnimationLoop(null); model.traverse(o => o.geometry?.dispose()); materials.forEach(m => m.dispose()); environment.dispose(); renderer.dispose(); }
  };
}
