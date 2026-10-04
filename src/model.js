import * as THREE from 'three';
import { Builder, branchGeometry, addCrystal, lines } from './model-construction.js';
import { createForestDreamcatcher } from './forest-model.js';
import { createMaterials, randomSequence } from './materials.js';
import { pebbleGeometry, pendantGeometry } from './mineral-geometry.js';
import { hangingPivot, attachBreezeRig } from './breeze.js';
import { lowerFramePoint } from './forest-craft.js';
import { collectionDesigns, normalizeConfig } from './config.js';

const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const Z = v(0, 0, 1);
const TAU = Math.PI * 2;

export function framePaths(shape) {
  let arc;
  if (shape === 'moon') {
    // The reference is a bent branch with projecting ends, not a geometrical D hoop.
    arc = new THREE.CatmullRomCurve3([
      v(1.02, 2.04, 0.025), v(0.50, 1.98, -0.015), v(-0.14, 1.74, 0.015),
      v(-0.66, 1.31, -0.03), v(-0.94, 0.72, 0.02), v(-1.07, 0.20, 0.03),
      v(-0.94, -0.25, -0.01), v(-0.48, -0.56, 0.035), v(0.09, -0.78, 0.00), v(0.67, -0.89, 0.025)
    ]);
  } else if (shape === 'pentagon') {
    // Straight sides keep the requested silhouette geometric. The original
    // Moon wrap and cotton web are constructed around this same perimeter.
    const vertices = Array.from({ length: 5 }, (_, i) => {
      const angle = i / 5 * TAU;
      return v(-Math.sin(angle) * 1.30, Math.cos(angle) * 1.30 + 0.59);
    });
    arc = new THREE.CurvePath();
    vertices.forEach((point, i) => arc.add(new THREE.LineCurve3(point, vertices[(i + 1) % 5])));
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
  const lowerVertices = shape === 'moon' ? null : Array.from({ length: 320 }, (_, i) => boundary(i / 320));
  const width = lowerVertices ? Math.min(-Math.min(...lowerVertices.map(p => p.x)), Math.max(...lowerVertices.map(p => p.x))) * 0.72 : 0;
  const lowerAttachment = f => shape === 'moon'
    ? arc.getPointAt(0.67 + f * 0.28)
    : lowerFramePoint(lowerVertices, (f * 2 - 1) * width);
  const suspension = shape === 'moon' ? arc.getPointAt(0.14) : lowerVertices.reduce((highest, point) => point.y > highest.y ? point : highest).clone();
  return { arc, spine, top, bottom, boundary, lowerAttachment, suspension };
}

export function createDreamcatcher(config, textures) {
  config = normalizeConfig(config);
  if (collectionDesigns[config.design].forest) return createForestDreamcatcher(config, textures);
  const model = new THREE.Group(); model.name = 'Forest Echos — Moon Woven';
  let mat = createMaterials(config, textures);
  const build = new Builder(model);
  const rnd = randomSequence(741), paths = framePaths(config.shape);
  const { arc, spine, boundary, lowerAttachment, suspension } = paths;
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

  // The compressed underwrap fills the gaps between coils. Individual twisted
  // plies sit on it, as in tightly wound jute, instead of reading as a spring.
  const wrappedArc = new THREE.CatmullRomCurve3(Array.from({ length: 180 }, (_, i) => arc.getPointAt(closed ? i / 180 : 0.026 + i / 179 * 0.948)), closed);
  build.add(branchGeometry(wrappedArc, 0.101, 180), mat.wrap);
  // Uneven three-ply jute, with loose overwraps and individual flyaway fibers.
  const steps = 3600, turns = closed ? 228 : 182;
  const fuzz = [];
  const strandPaths = [[], [], []];
  for (let i = 0; i <= steps; i++) {
    const t = closed ? i / steps : 0.027 + i / steps * 0.948;
    const center = arc.getPointAt(t), tangent = arc.getTangentAt(t);
    const normal = v(-tangent.y, tangent.x).normalize();
    const binormal = tangent.clone().cross(normal).normalize();
    const phase = i / steps;
    const angle = phase * turns * TAU + Math.sin(phase * 17) * 3.1 + Math.sin(phase * 91) * 1.2 + Math.sin(phase * 241) * 0.27;
    const radius = frameRadius + 0.016 + Math.sin(t * 37) * 0.009 + Math.sin(t * 127) * 0.004 + Math.sin(t * 317) * 0.002;
    const radial = normal.clone().multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle));
    const around = normal.clone().multiplyScalar(-Math.sin(angle)).addScaledVector(binormal, Math.cos(angle));
    const centerRope = center.clone().addScaledVector(radial, radius);
    for (let ply = 0; ply < 3; ply++) {
      const twist = phase * turns * 7.5 + Math.sin(phase * 41) * 1.3 + ply * TAU / 3;
      strandPaths[ply].push(centerRope.clone().addScaledVector(radial, Math.cos(twist) * 0.010).addScaledVector(around, Math.sin(twist) * 0.010));
    }
    if (i % 3 === 0) {
      const root = centerRope.clone().addScaledVector(radial, 0.015);
      const flyaway = rnd() < 0.14;
      const lift = flyaway ? 0.025 + rnd() * 0.032 : 0.004 + rnd() * 0.012;
      const tip = root.clone().addScaledVector(radial, lift).addScaledVector(tangent, (rnd() - 0.5) * 0.10).addScaledVector(around, (rnd() - 0.5) * 0.042);
      const mid = root.clone().lerp(tip, 0.5).addScaledVector(radial, flyaway ? 0.015 : 0.004);
      fuzz.push(...root.toArray(), ...mid.toArray(), ...mid.toArray(), ...tip.toArray());
    }
  }
  strandPaths.forEach((points, i) => build.tube(points, i === 2 ? 0.008 : 0.011, i === 1 ? mat.ropeLight : mat.rope, steps, 5));
  for (let w = 0; w < 4; w++) {
    const points = Array.from({ length: 850 }, (_, i) => {
      const t = 0.035 + i / 849 * 0.935;
      const center = arc.getPointAt(t), tangent = arc.getTangentAt(t), normal = v(-tangent.y, tangent.x).normalize();
      const angle = i / 849 * TAU * [22, -17, 37, -29][w] + w * 2.1 + Math.sin(t * 49) * 0.64;
      const radius = 0.126 + Math.sin(t * 37) * 0.008 + Math.sin(t * 127 + w) * 0.004;
      return center.addScaledVector(normal, Math.cos(angle) * radius).add(v(0, 0, Math.sin(angle) * radius));
    });
    build.tube(points, w < 2 ? 0.006 : 0.0045, w % 2 ? mat.rope : mat.ropeLight, 1000, 5);
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
  const movingStrands = [];
  let pendantPivot = null;
  for (let i = 0; i < config.strands; i++) {
    const f = config.strands === 1 ? 0.5 : i / (config.strands - 1);
    const anchor = lowerAttachment(f);
    anchor.z += 0.035;
    const strandLength = (1.35 + f * 0.59) * config.length;
    const { pivot, contents } = hangingPivot(model, anchor, `hanging-strand-${i + 1}`);
    const strandBuild = new Builder(contents);
    movingStrands.push({ pivot, length: strandLength });
    const bottom = anchor.clone().add(v((rnd() - 0.5) * 0.07, -strandLength, 0.02));
    strandBuild.thread(anchor, bottom, mat.cotton, 0.0075);
    const beadCount = Math.round(3 + f);
    for (let j = 0; j < beadCount; j++) {
      const p = anchor.clone().lerp(bottom, (j + 0.52) / beadCount);
      const size = 0.076 + rnd() * 0.012;
      const bead = addCrystal(contents, beadGeometry, mat.bead, p, [size, size * (1.42 + rnd() * 0.12), size * 0.88], [0.04, rnd(), (rnd() - 0.5) * 0.15]);
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
        addCrystal(contents, pebbleShapes[(j + k + i) % 7], mat.quartz, chipPos, [s * 1.12, s * 0.55, s * 0.75], [rnd() * 3, rnd() * 3, rnd() * 3]);
      }
    }
    // Tie the hanging cord directly onto the wrapped frame, including visible knots.
    strandBuild.add(new THREE.TorusGeometry(0.025, 0.008, 5, 12), mat.cotton, anchor.clone().add(v(0, -0.11, 0)), [1, 1.2, 1], new THREE.Euler(0, 0.3, 0.2));
    strandBuild.tube([bottom, bottom.clone().add(v(0.027, -0.025, 0.01)), bottom.clone().add(v(-0.023, -0.065, 0.01))], 0.007, mat.cotton, 10, 5);
    strandBuild.finish();
  }
  if (config.pendant) {
    const anchor = config.shape === 'moon' ? arc.getPointAt(0.022).add(v(0, -0.055, 0.0)) : previous.reduce((top, node) => node.y > top.y ? node : top).clone();
    const { pivot, contents } = hangingPivot(model, anchor, 'pendant-pivot');
    pendantPivot = pivot;
    const build = new Builder(contents);
    // The cotton loop holds a pair of intersecting oval jump rings. Each ring
    // passes through the next, rather than floating on top of a closed cap.
    build.tube([anchor.clone().add(v(-0.018, 0.02, 0)), anchor.clone().add(v(-0.015, -0.063, 0.018)), anchor.clone().add(v(0.015, -0.061, 0.022)), anchor.clone().add(v(0.018, 0.02, 0))], 0.0055, mat.cotton, 22, 5);
    build.add(new THREE.TorusGeometry(0.024, 0.0048, 8, 28), mat.silver, anchor.clone().add(v(0, -0.075, 0.01)), [0.82, 1.6, 1], new THREE.Euler(0, 0.24, 0));
    build.add(new THREE.TorusGeometry(0.024, 0.0053, 8, 28), mat.silver, anchor.clone().add(v(0, -0.124, 0.01)), [0.82, 1.42, 1], new THREE.Euler(0, 1.24, 0));
    const cap = anchor.clone().add(v(0, -0.207, 0.0));
    const capGeometry = new THREE.CylinderGeometry(0.110, 0.112, 0.105, 6).toNonIndexed();
    capGeometry.computeVertexNormals();
    capGeometry.setIndex(Array.from({ length: capGeometry.attributes.position.count }, (_, i) => i));
    build.add(capGeometry, mat.silver, cap);
    // Low soldered bail joins the lower jump ring to the cap's top plate.
    build.add(new THREE.TorusGeometry(0.016, 0.0048, 7, 22), mat.silver, cap.clone().add(v(0, 0.061, 0)), [1, 1.16, 1]);
    for (const dy of [-0.052, -0.039, 0.049]) {
      const edge = Array.from({ length: 37 }, (_, j) => {
        const face = Math.floor(j / 6), t = j % 6 / 6;
        const a = Math.PI / 6 + face / 6 * TAU, b = a + TAU / 6;
        return cap.clone().add(v(THREE.MathUtils.lerp(Math.cos(a), Math.cos(b), t) * 0.113, dy, THREE.MathUtils.lerp(Math.sin(a), Math.sin(b), t) * 0.113));
      });
      build.tube(edge, dy === -0.039 ? 0.002 : 0.0037, dy === -0.039 ? mat.silverDark : mat.silver, 80, 5);
    }
    // Stamped three-arch motif with recessed oxidized grooves and a fine
    // raised rim; dimensions follow the broad, shallow cap in the photograph.
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      const n = v(Math.cos(a), 0, Math.sin(a)), tangent = v(-Math.sin(a), 0, Math.cos(a));
      const facePoint = (x, y, depth = 0) => cap.clone().addScaledVector(n, 0.0975 + depth).addScaledVector(tangent, x).add(v(0, y, 0));
      for (let arch = 0; arch < 3; arch++) {
        const width = 0.037 - arch * 0.009;
        const curve = Array.from({ length: 17 }, (_, j) => {
          const t = j / 16 * Math.PI;
          return facePoint(Math.cos(t) * width, -0.018 + arch * 0.0015 + Math.sin(t) * (0.042 - arch * 0.011));
        });
        build.tube(curve, 0.0026, mat.silverDark, 22, 5);
        build.tube(curve.map(p => p.clone().add(v(0, 0.004, 0)).addScaledVector(n, 0.0012)), 0.0018, mat.silver, 22, 5);
      }
      for (const side of [-1, 1]) {
        build.add(new THREE.SphereGeometry(0.004, 7, 5), mat.silver, facePoint(side * 0.041, -0.025, 0.001), [1, 1.2, 1]);
        build.tube([facePoint(side * 0.044, 0.008), facePoint(side * 0.038, 0.004), facePoint(side * 0.042, -0.007)], 0.002, mat.silverDark, 9, 4);
      }
    }
    const crystalTop = cap.clone().add(v(0, -0.041, 0));
    const pendant = addCrystal(contents, pendantGeometry(), mat.pink, crystalTop, [1, 1, 1], [0, 0, 0]);
    pendant.name = 'rose-quartz-pendant';
    pendant.userData.mineral = 'rose-quartz';
    build.finish();
  }
  build.tube([suspension, suspension.clone().add(v(-0.07, 0.21, -0.02)), suspension.clone().add(v(-0.01, 0.31, -0.02)), suspension.clone().add(v(0.065, 0.20, -0.02)), suspension], 0.008, mat.cotton, 35, 6);
  build.finish();
  attachBreezeRig(model, suspension.clone().add(v(-0.01, 0.31, -0.02)), movingStrands, pendantPivot);
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
