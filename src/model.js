import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createMaterials, randomSequence } from './materials.js';

const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const Z = v(0, 0, 1), Y = v(0, 1, 0);
const TAU = Math.PI * 2;

function framePaths(shape) {
  let arc;
  if (shape === 'moon') {
    // The reference is a bent branch with projecting ends, not a geometrical D hoop.
    arc = new THREE.CatmullRomCurve3([
      v(1.02, 2.04, 0.025), v(0.50, 1.98, -0.015), v(-0.14, 1.74, 0.015),
      v(-0.66, 1.31, -0.03), v(-0.94, 0.72, 0.02), v(-1.07, 0.20, 0.03),
      v(-0.94, -0.25, -0.01), v(-0.48, -0.56, 0.035), v(0.09, -0.78, 0.00), v(0.67, -0.89, 0.025)
    ]);
  } else {
    const points = Array.from({ length: 80 }, (_, i) => {
      const a = i / 80 * TAU;
      const ripple = 1 + Math.sin(a * 5.0 + 0.9) * 0.012 + Math.sin(a * 9) * 0.006;
      if (shape === 'circle') return v(Math.cos(a) * 1.19 * ripple, Math.sin(a) * 1.19 * ripple + 0.59, Math.sin(a * 3) * 0.02);
      return v(Math.sin(a) * 1.23 * (0.77 - 0.22 * Math.cos(a)) * ripple, Math.cos(a) * 1.41 + 0.61, Math.sin(a * 3) * 0.025);
    });
    arc = new THREE.CatmullRomCurve3(points, true);
  }
  const top = shape === 'moon' ? arc.getPointAt(0.105) : null;
  const bottom = shape === 'moon' ? arc.getPointAt(0.962) : null;
  const spine = shape === 'moon' ? new THREE.CatmullRomCurve3([
    top.clone().add(v(-0.035, 0.18, -0.055)), top.clone().add(v(0, 0, -0.055)),
    v(0.46, 1.02, -0.015), v(0.48, 0.22, 0.01), bottom.clone().add(v(0.02, 0, -0.045)), bottom.clone().add(v(0.10, -0.32, -0.035))
  ]) : null;
  function boundary(t) {
    t = ((t % 1) + 1) % 1;
    if (shape !== 'moon') return arc.getPointAt(t);
    if (t <= 0.7) return arc.getPointAt(0.105 + t / 0.7 * (0.962 - 0.105));
    const p = bottom.clone().lerp(top, (t - 0.7) / 0.3);
    p.x -= Math.sin((t - 0.7) / 0.3 * Math.PI) * 0.075;
    return p;
  }
  return { arc, spine, top, bottom, boundary };
}

// Merge the opaque details by material: thousands of fibers remain a few draw calls.
class Builder {
  constructor(group) { this.group = group; this.batches = new Map(); }
  add(geometry, material, position = v(0, 0), scale = [1, 1, 1], rotation = new THREE.Euler()) {
    geometry.applyMatrix4(new THREE.Matrix4().compose(position, new THREE.Quaternion().setFromEuler(rotation), new THREE.Vector3(...scale)));
    const list = this.batches.get(material) || []; list.push(geometry); this.batches.set(material, list);
  }
  tube(points, radius, material, segments = 32, radial = 6, closed = false) {
    const curve = points.isCurve ? points : new THREE.CatmullRomCurve3(points, closed, 'centripetal');
    this.add(new THREE.TubeGeometry(curve, segments, radius, radial, closed), material);
  }
  thread(a, b, material, radius = 0.0065, sag = 0) {
    if (sag) { this.tube([a, a.clone().lerp(b, 0.5).add(v(0, -sag, sag * 0.3)), b], radius, material, 5, 5); return; }
    const geometry = new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 5);
    const q = new THREE.Quaternion().setFromUnitVectors(Y, b.clone().sub(a).normalize());
    this.add(geometry, material, a.clone().lerp(b, 0.5), [1, 1, 1], new THREE.Euler().setFromQuaternion(q));
  }
  finish() {
    for (const [material, list] of this.batches) {
      const combined = mergeGeometries(list, false);
      list.forEach(g => g.dispose());
      const mesh = new THREE.Mesh(combined, material);
      mesh.castShadow = true; mesh.receiveShadow = true;
      this.group.add(mesh);
    }
    this.batches.clear();
  }
}
function branchGeometry(curve, radius, segments = 100) {
  const geometry = new THREE.TubeGeometry(curve, segments, radius, 12, false);
  const positions = geometry.attributes.position;
  for (let i = 0; i <= segments; i++) {
    const center = curve.getPointAt(i / segments);
    const width = 0.90 + 0.11 * Math.sin(i * 0.31) + 0.055 * Math.cos(i * 0.83);
    for (let j = 0; j <= 12; j++) {
      const index = i * 13 + j;
      const p = v(positions.getX(index), positions.getY(index), positions.getZ(index));
      p.sub(center).multiplyScalar(width * (1 + Math.sin(j / 12 * TAU * 3 + i * 0.42) * 0.055)).add(center);
      positions.setXYZ(index, p.x, p.y, p.z);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}
function pebbleGeometry(seed) {
  const base = new THREE.IcosahedronGeometry(1, 3);
  const geometry = mergeVertices(base); base.dispose();
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const warp = 1 + Math.sin(x * 3.2 + seed) * Math.sin(y * 4.3 + seed) * 0.19 + Math.cos(z * 5 + x * 2 - seed) * 0.055;
    const soften = coordinate => Math.sign(coordinate) * Math.pow(Math.abs(coordinate), 0.78);
    positions.setXYZ(i, soften(x) * warp, soften(y) * warp, soften(z) * warp);
  }
  geometry.computeVertexNormals();
  return geometry;
}
function addCrystal(group, geometry, material, pos, scale, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(pos); mesh.scale.set(...scale); mesh.rotation.set(...rotation);
  // Transparent stones do not cast solid black shadows, but still receive wood shadows.
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
function lines(group, coordinates, material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(coordinates, 3));
  group.add(new THREE.LineSegments(geometry, material));
}
export function createDreamcatcher(config, textures) {
  const model = new THREE.Group(); model.name = 'Handcrafted dream catcher';
  let mat = createMaterials(config, textures);
  const build = new Builder(model);
  const rnd = randomSequence(741), paths = framePaths(config.shape);
  const { arc, spine, boundary } = paths;
  const closed = config.shape !== 'moon';
  const frameRadius = 0.09;
  build.add(branchGeometry(arc, frameRadius, 180), mat.bark);
  if (spine) build.add(branchGeometry(spine, 0.071, 110), mat.bark);

  function cutEnd(curve, t, radius) {
    const pos = curve.getPointAt(t);
    const direction = curve.getTangentAt(t).multiplyScalar(t === 0 ? -1 : 1);
    const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, direction));
    build.add(new THREE.CircleGeometry(radius, 14), mat.cutWood, pos, [1, 0.86, 1], rotation);
  }
  if (!closed) { cutEnd(arc, 0, 0.086); cutEnd(arc, 1, 0.087); cutEnd(spine, 0, 0.060); cutEnd(spine, 1, 0.076); }

  // Uneven three-ply jute, with loose overwraps and individual flyaway fibers.
  const steps = 3600, turns = closed ? 228 : 182;
  const fuzz = [];
  const strandPaths = [[], [], []];
  for (let i = 0; i <= steps; i++) {
    const t = closed ? i / steps : 0.027 + i / steps * 0.948;
    const center = arc.getPointAt(t), tangent = arc.getTangentAt(t);
    const normal = v(-tangent.y, tangent.x).normalize();
    const binormal = tangent.clone().cross(normal).normalize();
    const angle = i / steps * turns * TAU + Math.sin(i / steps * 71) * 0.45;
    const radius = frameRadius + 0.013 + Math.sin(t * 37) * 0.009 + Math.sin(t * 127) * 0.004;
    const radial = normal.clone().multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle));
    const around = normal.clone().multiplyScalar(-Math.sin(angle)).addScaledVector(binormal, Math.cos(angle));
    const centerRope = center.clone().addScaledVector(radial, radius);
    for (let ply = 0; ply < 3; ply++) {
      const twist = i / steps * turns * 7.5 + ply * TAU / 3;
      strandPaths[ply].push(centerRope.clone().addScaledVector(radial, Math.cos(twist) * 0.010).addScaledVector(around, Math.sin(twist) * 0.010));
    }
    if (i % 3 === 0) {
      const root = centerRope.clone().addScaledVector(radial, 0.015);
      const tip = root.clone().addScaledVector(radial, 0.018 + rnd() * 0.047).addScaledVector(tangent, (rnd() - 0.5) * 0.065);
      fuzz.push(...root.toArray(), ...tip.toArray());
    }
  }
  strandPaths.forEach((points, i) => build.tube(points, i === 2 ? 0.008 : 0.011, i === 1 ? mat.ropeLight : mat.rope, steps, 5));
  for (let w = 0; w < 2; w++) {
    const points = Array.from({ length: 850 }, (_, i) => {
      const t = 0.035 + i / 849 * 0.935;
      const center = arc.getPointAt(t), tangent = arc.getTangentAt(t), normal = v(-tangent.y, tangent.x).normalize();
      const angle = i / 849 * TAU * (w === 0 ? 22 : -17) + w;
      return center.addScaledVector(normal, Math.cos(angle) * 0.126).add(v(0, 0, Math.sin(angle) * 0.126));
    });
    build.tube(points, 0.007, mat.ropeLight, 1000, 5);
  }
  lines(model, fuzz, mat.fuzz);

  if (spine) {
    // A little exposed branch nub, along with the hand-painted ivory dots.
    const nubRoot = arc.getPointAt(0.64);
    const nub = new THREE.CatmullRomCurve3([nubRoot, nubRoot.clone().add(v(-0.18, 0.075, -0.025)), nubRoot.clone().add(v(-0.31, 0.16, -0.015))]);
    build.add(branchGeometry(nub, 0.052, 18), mat.bark); cutEnd(nub, 1, 0.049);
    for (let i = 0; i < 30; i++) {
      const p = spine.getPointAt(0.035 + i / 29 * 0.93);
      p.add(v((rnd() - 0.5) * 0.018, 0, 0.069));
      build.add(new THREE.SphereGeometry(0.017 + rnd() * 0.010, 9, 6), mat.paint, p, [0.8 + rnd() * 0.3, 0.85 + rnd() * 0.4, 0.12]);
    }
    const spiral = Array.from({ length: 600 }, (_, i) => {
      const t = 0.04 + i / 599 * 0.92;
      const p = spine.getPointAt(t), a = t * TAU * 15;
      return p.add(v(Math.cos(a) * 0.077, 0, Math.sin(a) * 0.077));
    });
    build.tube(spiral, 0.005, mat.cotton, 700, 5);
    // Lash the two branches together where they meet.
    for (const at of [0.105, 0.959]) {
      const p = arc.getPointAt(at);
      for (let j = 0; j < 9; j++) {
        const a = j * 0.29;
        const loop = Array.from({ length: 25 }, (_, k) => {
          const theta = k / 24 * TAU;
          return p.clone().add(v(Math.cos(theta) * (0.11 + j * 0.001), Math.sin(theta) * 0.12 + (j - 4) * 0.012, Math.sin(theta + a) * 0.10));
        });
        build.tube(loop, 0.012, j % 2 ? mat.rope : mat.ropeLight, 35, 5);
      }
    }
  }

  // Each new course is stitched to the midpoint of the preceding one.
  // This produces open, irregular diamonds and an oval opening like real hand weaving.
  const nodeCount = config.pattern === 'dense' ? 21 : 15;
  const courses = config.pattern === 'dense' ? 6 : 4;
  const center = config.shape === 'moon' ? v(-0.23, 0.34, 0.025) : v(0, 0.49, 0.025);
  let previous = Array.from({ length: nodeCount }, (_, i) => {
    const p = boundary(i / nodeCount);
    p.z += 0.045;
    return p;
  });
  for (let layer = 0; layer < courses; layer++) {
    const current = Array.from({ length: nodeCount }, (_, i) => {
      const mid = previous[i].clone().lerp(previous[(i + 1) % nodeCount], 0.46 + rnd() * 0.08);
      const contraction = config.pattern === 'dense' ? 0.84 : 0.77 + layer * 0.017;
      return center.clone().lerp(mid, contraction).add(v((rnd() - 0.5) * 0.026, (rnd() - 0.5) * 0.025, (rnd() - 0.5) * 0.013));
    });
    for (let i = 0; i < nodeCount; i++) {
      build.thread(previous[i], current[i], mat.cotton, 0.0067, 0.008);
      build.thread(current[i], previous[(i + 1) % nodeCount], mat.cotton, 0.0067, 0.006);
      const knot = new THREE.TorusGeometry(0.010, 0.0035, 4, 8);
      build.add(knot, mat.cotton, current[i], [1, 0.75, 1], new THREE.Euler(0.2, 0.5, rnd()));
      if (layer === courses - 1) build.thread(current[i], current[(i + 1) % nodeCount], mat.cotton, 0.0067, 0.003);
      if (config.pattern === 'star' && layer === 1) build.thread(current[i], current[(i + 5) % nodeCount], mat.cotton, 0.0045);
    }
    previous = current;
  }
  const tail = previous[4];
  build.tube([tail, tail.clone().add(v(0.06, -0.035, 0.015)), tail.clone().add(v(0.10, 0.002, 0.013))], 0.006, mat.cotton, 10, 5);

  const pebbleShapes = Array.from({ length: 7 }, (_, i) => pebbleGeometry(i + 3));
  if (config.pebbles) {
    const positions = config.shape === 'moon' ? [0.03, 0.145, 0.27, 0.42, 0.52, 0.66, 0.79, 0.95] : [0.02, 0.15, 0.27, 0.4, 0.52, 0.65, 0.78, 0.91];
    positions.forEach((t, i) => {
      const p = arc.getPointAt(t); p.z += 0.15;
      const size = 0.12 + rnd() * 0.065;
      addCrystal(model, pebbleShapes[i % 7], mat.quartz, p, [size * (0.85 + rnd() * 0.5), size * (0.9 + rnd() * 0.35), size * 0.50], [rnd() * 0.6, rnd() * 0.6, rnd() * TAU]);
      // Fine retaining cotton winds around each uneven pebble.
      const tie = Array.from({ length: 25 }, (_, n) => {
        const a = n / 24 * TAU;
        return p.clone().add(v(Math.cos(a) * size * 0.88, Math.sin(a) * size * 0.8, Math.sin(a) * size * 0.51));
      });
      build.tube(tie, 0.0035, mat.cotton, 30, 4);
    });
  }
  const beadGeometry = new THREE.SphereGeometry(1, 24, 18);
  for (let i = 0; i < config.strands; i++) {
    const f = config.strands === 1 ? 0.5 : i / (config.strands - 1);
    const anchor = config.shape === 'moon' ? arc.getPointAt(0.67 + f * 0.28) : boundary(config.shape === 'circle' ? 0.64 + f * 0.23 : 0.36 + f * 0.28);
    anchor.z += 0.035;
    const strandLength = (config.shape === 'moon' ? 1.35 + f * 0.59 : 1.26 + Math.sin(f * Math.PI) * 0.56) * config.length;
    const bottom = anchor.clone().add(v((rnd() - 0.5) * 0.07, -strandLength, 0.02));
    build.thread(anchor, bottom, mat.cotton, 0.0075);
    const beadCount = config.shape === 'moon' ? Math.round(3 + f) : 3 + Math.round(Math.sin(f * Math.PI));
    for (let j = 0; j < beadCount; j++) {
      const p = anchor.clone().lerp(bottom, (j + 0.52) / beadCount);
      const size = 0.076 + rnd() * 0.012;
      const bead = addCrystal(model, beadGeometry, mat.bead, p, [size, size * (1.42 + rnd() * 0.12), size * 0.88], [0.04, rnd(), (rnd() - 0.5) * 0.15]);
      bead.castShadow = true;
      // Dense clusters of clear chips replace the disconnected floating spacers.
      const sectionLength = strandLength / beadCount;
      const start = 0.138, end = Math.max(start, sectionLength - 0.13);
      const chips = Math.max(3, Math.round((end - start) / 0.042));
      for (let k = 0; k < chips; k++) {
        const drop = start + (end - start) * k / Math.max(1, chips - 1);
        const chipPos = p.clone().add(v((rnd() - 0.5) * 0.069, -drop, (rnd() - 0.5) * 0.04));
        if (chipPos.y < bottom.y + 0.01) continue;
        const s = 0.041 + rnd() * 0.025;
        addCrystal(model, pebbleShapes[(j + k + i) % 7], mat.quartz, chipPos, [s * 1.12, s * 0.55, s * 0.75], [rnd() * 3, rnd() * 3, rnd() * 3]);
      }
    }
    // Tie the hanging cord directly onto the wrapped frame, including visible knots.
    build.add(new THREE.TorusGeometry(0.025, 0.008, 5, 12), mat.cotton, anchor.clone().add(v(0, -0.11, 0)), [1, 1.2, 1], new THREE.Euler(0, 0.3, 0.2));
    build.tube([bottom, bottom.clone().add(v(0.027, -0.025, 0.01)), bottom.clone().add(v(-0.023, -0.065, 0.01))], 0.007, mat.cotton, 10, 5);
  }
  if (config.pendant) {
    const anchor = config.shape === 'moon' ? arc.getPointAt(0.022).add(v(0, -0.055, 0.0)) : previous.reduce((top, node) => node.y > top.y ? node : top).clone();
    build.thread(anchor, anchor.clone().add(v(0, -0.04, 0)), mat.cotton, 0.006);
    build.add(new THREE.TorusGeometry(0.038, 0.008, 7, 18), mat.silver, anchor.clone().add(v(0, -0.072, 0)));
    build.add(new THREE.TorusGeometry(0.029, 0.007, 7, 18), mat.silver, anchor.clone().add(v(0, -0.123, 0)), [1, 1.35, 1], new THREE.Euler(0, 0.6, 0));
    const cap = anchor.clone().add(v(0, -0.207, 0.0));
    build.add(new THREE.CylinderGeometry(0.105, 0.106, 0.115, 6), mat.silver, cap);
    for (const dy of [-0.051, 0.051]) build.add(new THREE.TorusGeometry(0.106, 0.008, 6, 6), mat.silverDark, cap.clone().add(v(0, dy, 0)), [1, 1, 1], new THREE.Euler(Math.PI / 2, 0, 0));
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + Math.PI / 6;
      const p = cap.clone().add(v(Math.sin(a) * 0.093, 0, Math.cos(a) * 0.093));
      build.add(new THREE.TorusGeometry(0.023, 0.003, 4, 12, Math.PI * 1.5), mat.silverDark, p, [1, 0.72, 1], new THREE.Euler(0, a, 0.2));
    }
    const crystalCenter = cap.clone().add(v(0, -0.32, 0));
    const hex = new THREE.CylinderGeometry(0.101, 0.099, 0.52, 6, 1, false);
    addCrystal(model, hex, mat.pink, crystalCenter, [1, 1, 1], [0, Math.PI / 6, 0]);
    const tip = new THREE.ConeGeometry(0.099, 0.155, 6);
    addCrystal(model, tip, mat.pink, crystalCenter.clone().add(v(0, -0.337, 0)), [1, 1, 1], [Math.PI, Math.PI / 6, 0]);
    const inclusions = [];
    for (let i = 0; i < 13; i++) {
      const y = (rnd() - 0.5) * 0.44, x = (rnd() - 0.5) * 0.10;
      inclusions.push(crystalCenter.x + x, crystalCenter.y + y, crystalCenter.z + 0.045, crystalCenter.x + x + (rnd() - 0.5) * 0.07, crystalCenter.y + y + 0.015 + rnd() * 0.07, crystalCenter.z + 0.045);
    }
    lines(model, inclusions, mat.inclusion);
  }
  const suspension = config.shape === 'moon' ? arc.getPointAt(0.14) : boundary(config.shape === 'circle' ? 0.25 : 0);
  build.tube([suspension, suspension.clone().add(v(-0.07, 0.21, -0.02)), suspension.clone().add(v(-0.01, 0.31, -0.02)), suspension.clone().add(v(0.065, 0.20, -0.02)), suspension], 0.008, mat.cotton, 35, 6);
  build.finish();
  // Some configurations do not use all the shared geometries.
  const used = new Set(); model.traverse(o => { if (o.geometry) used.add(o.geometry); });
  for (const geometry of [...pebbleShapes, beadGeometry]) if (!used.has(geometry)) geometry.dispose();
  model.userData.config = { ...config };
  model.userData.updateMaterials = nextConfig => {
    const nextMaterials = createMaterials(nextConfig, textures);
    const replacements = new Map(Object.entries(mat).map(([key, material]) => [material, nextMaterials[key]]));
    model.traverse(object => {
      if (object.material) object.material = replacements.get(object.material) || object.material;
    });
    Object.values(mat).forEach(material => material.dispose());
    mat = nextMaterials;
    model.userData.config = { ...nextConfig };
  };
  model.userData.dispose = () => {
    used.forEach(g => g.dispose());
    Object.values(mat).forEach(m => m.dispose());
  };
  return model;
}
