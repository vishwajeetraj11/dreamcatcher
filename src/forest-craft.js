import * as THREE from 'three';
import { v, lines } from './model-construction.js';

const TAU = Math.PI * 2;

export function frameDefinition(shape, design) {
  if (shape === 'square') {
    const vertices = [v(-1.03, 1.68), v(-1.03, -0.38), v(1.03, -0.38), v(1.03, 1.68)];
    return { vertices, center: v(0, 0.65), suspension: v(0, 1.68), extensions: 0.18 };
  }
  if (shape === 'circle') {
    const vertices = Array.from({ length: 96 }, (_, i) => {
      const angle = i / 96 * TAU;
      return v(-Math.sin(angle) * 1.10, Math.cos(angle) * 1.10 + 0.65);
    });
    const curve = new THREE.CatmullRomCurve3(vertices, true);
    return { vertices, curve, center: v(0, 0.65), suspension: vertices[0].clone(), extensions: 0 };
  }
  if (shape === 'triangle') {
    if (design === 'sage') {
      const vertices = [v(0, 1.82), v(-1.13, 1.82 - Math.sqrt(3) * 1.13), v(1.13, 1.82 - Math.sqrt(3) * 1.13)];
      return { vertices, center: v(0, 0.52), suspension: vertices[0].clone(), extensions: 0.18 };
    }
    const vertices = [v(-0.05, 1.80), v(-1.04, -0.10), v(1.12, -0.15)];
    return { vertices, center: v(0.02, 0.52), suspension: vertices[0].clone(), extensions: 0.41 };
  }
  if (shape === 'rectangle') {
    const vertices = [v(-0.67, 1.35), v(-0.70, 0.18), v(0.67, 0.23), v(0.64, 1.38)];
    return { vertices, center: v(-0.03, 0.76), suspension: v(-0.02, 1.94), extensions: 0.22 };
  }
  const vertices = [v(-0.08, 1.76), v(-1.08, 0.93), v(-0.73, -0.29), v(0.70, -0.43), v(1.06, 0.82)];
  return { vertices, center: v(-0.02, 0.63), suspension: vertices[0].clone(), extensions: 0.40 };
}

// Intersect a vertical hanging cord with the lower silhouette. Polygon indexing
// cannot describe circles or squares reliably, and vertical edges have no slope.
export function lowerFramePoint(vertices, x) {
  const intersections = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length];
    const dx = b.x - a.x;
    if (Math.abs(dx) < 1e-8) {
      if (Math.abs(x - a.x) < 1e-8) intersections.push(a.clone(), b.clone());
      continue;
    }
    const t = (x - a.x) / dx;
    if (t >= -1e-8 && t <= 1 + 1e-8) intersections.push(a.clone().lerp(b, THREE.MathUtils.clamp(t, 0, 1)));
  }
  if (!intersections.length) throw new RangeError('Hanging cord must attach inside the frame width.');
  return intersections.reduce((lowest, point) => point.y < lowest.y ? point : lowest);
}

export function twistedCord(build, points, radius, material, segments = 40, phase = 0) {
  const curve = Array.isArray(points) ? new THREE.CatmullRomCurve3(points) : points;
  const length = curve.getLength(), turns = length / (radius * 9);
  build.tube(curve, radius * 0.58, material, segments, 5);
  for (let ply = 0; ply < 3; ply++) {
    const path = Array.from({ length: segments + 1 }, (_, i) => {
      const t = i / segments, tangent = curve.getTangentAt(t);
      const normal = tangent.clone().cross(Math.abs(tangent.z) > 0.9 ? v(0, 1) : v(0, 0, 1)).normalize();
      const binormal = tangent.clone().cross(normal);
      const a = t * TAU * turns + ply * TAU / 3 + phase;
      return curve.getPointAt(t).addScaledVector(normal, Math.cos(a) * radius * 0.48).addScaledVector(binormal, Math.sin(a) * radius * 0.48);
    });
    build.tube(path, radius * 0.43, material, segments, 4);
  }
}

// Flattened, crossing wraps with short frapping turns. A stack of front-facing
// circular rings reads as a decorative rosette instead of a structural knot.
export function lash(build, at, mat, rnd, radius = 0.14, angle = -0.5) {
  const rotate = p => v(p.x * Math.cos(angle) - p.y * Math.sin(angle), p.x * Math.sin(angle) + p.y * Math.cos(angle), p.z).add(at);
  for (let j = 0; j < 7; j++) {
    const offset = (j - 3) * 0.021 + (rnd() - 0.5) * 0.010;
    const r = radius * (0.95 + rnd() * 0.12);
    const points = Array.from({ length: 33 }, (_, i) => {
      const a = i / 32 * TAU;
      return rotate(v(Math.cos(a) * r, offset + Math.sin(a * 2) * 0.018, Math.sin(a) * r * 0.95));
    });
    twistedCord(build, points, 0.014, j % 3 ? mat.rope : mat.ropeLight, 70, j * 0.72);
  }
  for (let j = 0; j < 2; j++) {
    const points = Array.from({ length: 29 }, (_, i) => {
      const a = i / 28 * TAU;
      return rotate(v((j - 0.5) * 0.025 + Math.sin(a * 2) * 0.015, Math.cos(a) * radius * 0.70, Math.sin(a) * radius * 1.12));
    });
    twistedCord(build, points, 0.012, mat.ropeLight, 54, j);
  }
  const tail = rotate(v(0.03, -0.065, radius * 1.13));
  twistedCord(build, [tail, tail.clone().add(v(-0.06, -0.10, 0.01)), tail.clone().add(v(-0.11, -0.13, -0.005))], 0.009, mat.rope, 22);
}

export function hitch(build, at, mat, rnd, size = 1) {
  for (let j = 0; j < 9; j++) {
    const offset = (j - 4) * 0.010 * size;
    const points = Array.from({ length: 25 }, (_, i) => {
      const a = i / 24 * TAU;
      return at.clone().add(v(offset * (0.65 + Math.cos(a) * 0.35), Math.cos(a) * 0.085 * size - 0.025 * size, Math.sin(a) * 0.100 * size));
    });
    twistedCord(build, points, 0.009 * size, j % 3 ? mat.cotton : mat.cottonShade, 38, rnd() * 5);
  }
  const knot = at.clone().add(v(0.007, -0.12 * size, 0.07));
  for (let j = 0; j < 3; j++) {
    const points = Array.from({ length: 17 }, (_, i) => {
      const a = i / 16 * TAU;
      return knot.clone().add(v(Math.cos(a) * 0.025 * size, -j * 0.013, Math.sin(a) * 0.025 * size));
    });
    build.tube(points, 0.008, mat.cotton, 24, 5);
  }
}

export function naturalBranch(curve, radius, seed = 1, segments = 100, closed = false) {
  const geometry = new THREE.TubeGeometry(curve, segments, radius, 14, closed);
  const positions = geometry.attributes.position;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, center = curve.getPointAt(t);
    const swelling = 0.07 * Math.exp(-Math.pow((t - 0.36 - Math.sin(seed) * 0.08) / 0.06, 2));
    const width = closed
      ? 0.97 + Math.sin(t * TAU * 3 + seed) * 0.045 + Math.sin(t * TAU * 8 + seed * 3) * 0.025
      : 0.97 - t * 0.085 + Math.sin(t * 17 + seed) * 0.045 + Math.sin(t * 53 + seed * 3) * 0.025 + swelling;
    for (let j = 0; j <= 14; j++) {
      const a = j / 14 * TAU, index = i * 15 + j;
      const p = v(positions.getX(index), positions.getY(index), positions.getZ(index));
      const lobes = 1 + Math.sin(a * 3 + seed + t * (closed ? TAU : 4)) * 0.045 + Math.sin(a * 7 + t * (closed ? TAU * 4 : 25)) * 0.017;
      p.sub(center).multiplyScalar(width * lobes).add(center);
      positions.setXYZ(index, p.x, p.y, p.z);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

// A bent branch keeps Sage's exposed wood and fine cotton binding on a circle;
// treating the sampled perimeter as separate sticks would create 96 spiked joints.
export function addBentFrame(build, model, curve, mat, rnd) {
  const radius = 0.076;
  build.add(naturalBranch(curve, radius, 4.7, 200, true), mat.bark);
  const turns = Math.round(curve.getLength() * 7), steps = turns * 22;
  const rope = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps, tangent = curve.getTangentAt(t);
    const normal = v(-tangent.y, tangent.x).normalize(), binormal = tangent.clone().cross(normal);
    const angle = t * turns * TAU + Math.sin(t * TAU * 3) * 0.7;
    const width = radius * (0.97 + Math.sin(t * TAU * 3 + 4.7) * 0.045 + Math.sin(t * TAU * 8 + 14.1) * 0.025) + 0.010;
    return curve.getPointAt(t).addScaledVector(normal, Math.cos(angle) * width).addScaledVector(binormal, Math.sin(angle) * width);
  });
  build.tube(rope, 0.006, mat.cotton, steps, 5);
  for (let i = 0; i < 40; i++) {
    const t = (i + 0.5) / 40, point = curve.getPointAt(t).add(v(0, 0, radius * 0.96));
    const tangent = curve.getTangentAt(t);
    const rotation = new THREE.Euler(0, 0, -Math.atan2(tangent.x, tangent.y));
    if (i % 3 === 1) build.add(new THREE.TorusGeometry(0.022, 0.0042, 5, 13), mat.paint, point, [0.60, 1.1, 0.22], rotation);
    else build.add(new THREE.SphereGeometry(0.011 + rnd() * 0.003, 8, 5), mat.paint, point, [0.7, 1.15, 0.10], rotation);
  }
  lash(build, curve.getPointAt(0), mat, rnd, 0.105, 0);
}

export function addStick(build, model, a, b, mat, rnd, { wrap = true, radius = 0.07, sparse = false, extension = 0.35 } = {}) {
  const direction = b.clone().sub(a).normalize(), length = a.distanceTo(b), seed = rnd() * 9;
  const normal = v(-direction.y, direction.x).normalize();
  const curve = new THREE.CatmullRomCurve3([a,
    a.clone().lerp(b, 0.25).addScaledVector(normal, (rnd() - 0.5) * 0.043).add(v(0, 0, 0.012)),
    a.clone().lerp(b, 0.64).addScaledVector(normal, (rnd() - 0.5) * 0.041).add(v(0, 0, -0.014)), b]);
  build.add(naturalBranch(curve, radius, seed), mat.bark);
  for (const t of [0, 1]) {
    const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(v(0, 0, 1), curve.getTangentAt(t).multiplyScalar(t ? 1 : -1)));
    const cap = curve.getPointAt(t).addScaledVector(curve.getTangentAt(t), t ? 0.001 : -0.001);
    build.add(new THREE.CircleGeometry(radius * (t ? 0.88 : 0.96), 14), mat.cutWood, cap, [1, 0.96, 1], rotation);
  }
  const trim = Math.max(0.06, (extension - 0.055) / length);
  const fuzz = [];
  if (wrap) {
    const turns = Math.round(length * (1 - trim * 2) * (sparse ? 7 : 60));
    const steps = Math.max(120, turns * 18);
    if (!sparse) {
      const underwrap = new THREE.CatmullRomCurve3(Array.from({ length: 50 }, (_, i) => curve.getPointAt(trim + i / 49 * (1 - 2 * trim))));
      build.add(naturalBranch(underwrap, radius + 0.007, seed, 100), mat.wrap);
    }
    for (let ply = 0; ply < (sparse ? 1 : 3); ply++) {
      const rope = Array.from({ length: steps + 1 }, (_, i) => {
        const phase = i / steps, t = trim + phase * (1 - 2 * trim);
        const tangent = curve.getTangentAt(t), n = v(-tangent.y, tangent.x).normalize(), binormal = tangent.clone().cross(n);
        const a = phase * turns * TAU + Math.sin(phase * 21 + seed) * 1.5 + Math.sin(phase * 113) * 0.3;
        const r = radius * (0.97 - t * 0.085 + Math.sin(t * 17 + seed) * 0.045) + 0.014;
        const radial = n.clone().multiplyScalar(Math.cos(a)).addScaledVector(binormal, Math.sin(a));
        const p = curve.getPointAt(t).addScaledVector(radial, r);
        p.addScaledVector(radial, Math.cos(a * 4.1 + ply * TAU / 3) * 0.005);
        p.addScaledVector(tangent, Math.sin(a * 4.1 + ply * TAU / 3) * 0.005);
        if (!ply && i % 9 === 0) {
          const tip = p.clone().addScaledVector(radial, rnd() * 0.020 + 0.003).addScaledVector(tangent, (rnd() - 0.5) * 0.064);
          const mid = p.clone().lerp(tip, 0.5).addScaledVector(radial, 0.006);
          fuzz.push(...p.toArray(), ...mid.toArray(), ...mid.toArray(), ...tip.toArray());
        }
        return p;
      });
      build.tube(rope, sparse ? 0.006 : 0.008, sparse ? mat.cotton : ply === 1 ? mat.ropeLight : mat.rope, steps, 5);
    }
    // A few stray, slack turns interrupt the otherwise tight jute winding.
    if (!sparse) for (let j = 0; j < 2; j++) {
      const points = Array.from({ length: 220 }, (_, i) => {
        const t = trim + i / 219 * (1 - trim * 2), angle = i / 219 * TAU * (length * 5) + j * 2.3;
        return curve.getPointAt(t).addScaledVector(normal, Math.cos(angle) * (radius + 0.035)).add(v(0, 0, Math.sin(angle) * (radius + 0.035)));
      });
      build.tube(points, 0.0035, mat.ropeLight, 300, 4);
    }
  }
  if (fuzz.length) lines(model, fuzz, mat.fuzz);
  const exposedLength = wrap ? trim * length : length;
  const count = Math.max(3, Math.floor(exposedLength / 0.068));
  for (let i = 0; i < count; i++) {
    const positions = wrap ? [0.02 + i / count * trim * 0.89, 0.98 - i / count * trim * 0.89] : [0.035 + i / count * 0.92];
    for (const t of positions) {
      const at = curve.getPointAt(t).add(v((rnd() - 0.5) * 0.012, 0, radius * 0.94));
      const rotation = new THREE.Euler(0, 0, -Math.atan2(direction.x, direction.y) + (rnd() - 0.5) * 0.16);
      if (i % 3 === 1) build.add(new THREE.TorusGeometry(0.022, 0.0042, 5, 13), mat.paint, at, [0.60, 1.1, 0.22], rotation);
      else build.add(new THREE.SphereGeometry(0.011 + rnd() * 0.003, 8, 5), mat.paint, at, [0.7, 1.15, 0.10], rotation);
    }
  }
}

export function weave(build, vertices, center, pattern, mat, rnd, design) {
  const fine = design === 'willow';
  const contraction = design === 'amber' ? 0.80 : design === 'sage' ? 0.90 : 0.86;
  const count = pattern === 'dense' ? 25 : 19, courses = pattern === 'dense' ? 8 : 6;
  const lengths = vertices.map((p, i) => p.distanceTo(vertices[(i + 1) % vertices.length]));
  const perimeter = lengths.reduce((a, b) => a + b, 0), radius = fine ? 0.0028 : 0.0034;
  let previous = Array.from({ length: count }, (_, i) => {
    let distance = (i + 0.08 + (rnd() - 0.5) * 0.16) / count * perimeter;
    for (let j = 0; j < lengths.length; j++) {
      if (distance <= lengths[j]) return vertices[j].clone().lerp(vertices[(j + 1) % vertices.length], distance / lengths[j]).add(v(0, 0, 0.083));
      distance -= lengths[j];
    }
    return vertices[0].clone();
  });
  for (let course = 0; course < courses; course++) {
    const next = previous.map((p, i) => center.clone().lerp(p.clone().lerp(previous[(i + 1) % count], 0.46 + rnd() * 0.08), contraction + (rnd() - 0.5) * 0.030).add(v((rnd() - 0.5) * 0.020, (rnd() - 0.5) * 0.014, 0.042 + rnd() * 0.010)));
    next.forEach((p, i) => {
      build.thread(previous[i], p, mat.web, radius * (0.91 + rnd() * 0.16), 0.003 + rnd() * 0.006);
      build.thread(p, previous[(i + 1) % count], mat.web, radius, 0.003);
      build.add(new THREE.TorusGeometry(0.0055, 0.002, 4, 7), mat.web, p, [1, 0.73, 1], new THREE.Euler(0.1, 0.3, rnd()));
      if (course === courses - 1) build.thread(p, next[(i + 1) % count], mat.web, radius);
      if (pattern === 'star' && course === 2) build.thread(p, next[(i + 6) % count], mat.web, radius * 0.8);
    });
    previous = next;
  }
}

export function macrameLeaf(build, top, height, width, mat, rnd) {
  const phase = rnd() * TAU, lean = (rnd() - 0.5) * width * 0.25;
  const turn = (rnd() - 0.5) * 0.32, cup = 0.025 + rnd() * 0.018;
  const center = t => top.clone().add(v(lean * t + Math.sin(t * 4 + phase) * width * 0.035 * t,
    -height * t, Math.sin(t * 3 + phase) * 0.024));
  const surfacePoint = (t, x, lift = 0) => center(t).add(v(x * Math.cos(turn), 0,
    x * Math.sin(turn) + cup * Math.pow(Math.abs(x) / width, 1.5) + lift));
  const contour = (t, side) => width * Math.pow(Math.sin(Math.PI * (0.11 + Math.pow(t, 0.85) * 0.89)), 0.60) * (1 - t * 0.22)
    * (1 + Math.sin(t * 11 + phase + side) * 0.035);

  // Every visible part is yarn, including the silhouette. A solid backing made
  // the old leaf look cut from felt, especially when rotated or backlit.
  const addFiber = (points, radius, material, taper = 0.20) => {
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 9, radius, 4, false);
    const positions = geometry.attributes.position;
    for (let row = 0; row <= 9; row++) {
      const t = row / 9, at = curve.getPointAt(t);
      const end = 1 - (1 - taper) * Math.pow(Math.max(0, (t - 0.72) / 0.28), 1.3);
      for (let ring = 0; ring <= 4; ring++) {
        const i = row * 5 + ring;
        const p = v(positions.getX(i), positions.getY(i), positions.getZ(i)).sub(at);
        p.z *= 0.74;
        p.multiplyScalar(end).add(at);
        positions.setXYZ(i, p.x, p.y, p.z);
      }
    }
    geometry.computeVertexNormals();
    // A strand stands in for many unresolved cotton filaments. Broad normals
    // approximate their diffuse scattering and avoid glittering subpixel ridges.
    const normals = geometry.attributes.normal;
    for (let i = 0; i < normals.count; i++) {
      const n = v(normals.getX(i), normals.getY(i), normals.getZ(i));
      n.lerp(v(0, 0, n.z < 0 ? -1 : 1), 0.50).normalize();
      normals.setXYZ(i, n.x, n.y, n.z);
    }
    build.add(geometry, material);
  };

  // Short knots release long, combed ends. Their tips fan progressively down
  // the leaf; the lower third is loose cotton, without a cord running to the tip.
  const rows = 156;
  for (const side of [-1, 1]) for (let row = 0; row < rows; row++) {
    const edgeT = 0.018 + (row + rnd() * 0.8) / rows * 0.97;
    const rootT = edgeT * 0.60;
    const bundlePhase = rnd() * TAU;
    const edgeWidth = contour(edgeT, side) * (0.94 + rnd() * 0.12);
    for (let ply = 0; ply < 3; ply++) {
      const tipT = Math.min(0.996, edgeT + (rnd() - 0.5) * 0.018);
      const tipX = side * edgeWidth * (0.97 + rnd() * 0.055);
      const rootX = side * (0.013 + rnd() * 0.007);
      const layer = (ply - 1) * 0.009 + Math.sin(row * 1.73 + phase) * 0.004;
      const wave = 0.002 + rnd() * 0.003;
      const points = Array.from({ length: 10 }, (_, i) => {
        const t = i / 9, fan = Math.sin(t * Math.PI * 0.5);
        const x = THREE.MathUtils.lerp(rootX, tipX, fan);
        const y = THREE.MathUtils.lerp(rootT, tipT, Math.pow(t, 1.22));
        const p = surfacePoint(y, x, layer + Math.sin(t * Math.PI) * 0.011);
        const loosen = Math.sin(t * Math.PI * 0.85);
        p.x += Math.sin(t * 17 + bundlePhase + ply * 0.7) * wave * loosen;
        p.y += Math.sin(t * 22 + bundlePhase) * wave * loosen;
        p.z += Math.sin(t * 15 + bundlePhase + ply) * wave * 0.7 * loosen;
        return p;
      });
      addFiber(points, 0.0021 + rnd() * 0.0009, (row + ply) % 7 === 0 ? mat.leafShade : mat.leafFiber);
      // Unravelled filaments lift away from a few ends, breaking the clipped edge.
      if (ply === 2 && row % 3 === 0) {
        const tip = points[9].clone().add(v(side * (0.004 + rnd() * 0.009), -rnd() * 0.022, 0.004 + rnd() * 0.01));
        addFiber([points[6], points[7].clone().add(v(0, 0, 0.009)), tip], 0.00065 + rnd() * 0.0004, mat.leafFiber, 0.08);
      }
    }
  }

  // The last knots also release a central tuft. It fills the space between the
  // two fans and trails to an uneven point instead of leaving a split leaf.
  for (let i = 0; i < 180; i++) {
    const tipT = 0.84 + Math.pow(rnd(), 0.55) * 0.17;
    const rootT = 0.48 + rnd() * 0.12;
    const x = (rnd() * 2 - 1) * width * (1.02 - tipT) * 1.6;
    const startX = (rnd() - 0.5) * 0.035;
    const phase = rnd() * TAU, layer = (rnd() - 0.5) * 0.024;
    const points = Array.from({ length: 10 }, (_, j) => {
      const t = j / 9;
      const p = surfacePoint(THREE.MathUtils.lerp(rootT, tipT, t), THREE.MathUtils.lerp(startX, x, t), layer);
      p.x += Math.sin(t * 16 + phase) * 0.004 * Math.sin(t * Math.PI);
      p.z += Math.sin(t * 12 + phase) * 0.006 * Math.sin(t * Math.PI);
      return p;
    });
    addFiber(points, 0.0018 + rnd() * 0.001, i % 7 ? mat.leafFiber : mat.leafShade);
  }

  const knotCount = Math.max(10, Math.round(height * 17));
  const knotEnd = 0.60, step = height * knotEnd / knotCount;
  const core = Array.from({ length: 24 }, (_, i) => surfacePoint(i / 23 * knotEnd, 0, 0.016));
  twistedCord(build, core, 0.012, mat.leafShade, knotCount * 6);
  for (let row = 0; row < knotCount; row++) {
    const t = (row + 0.25) / knotCount * knotEnd;
    const at = surfacePoint(t, 0, 0.022);
    const extent = 0.021 * (1 - t * 0.20) * (0.93 + rnd() * 0.14);
    for (const side of [-1, 1]) {
      const z = side === (row % 2 ? 1 : -1) ? 0.007 : 0;
      const points = [
        at.clone().add(v(-side * 0.009, step * 0.36, 0.005 + z)),
        at.clone().add(v(side * extent * 0.85, step * 0.38, 0.015 + z)),
        at.clone().add(v(side * extent, -step * 0.12, 0.009)),
        at.clone().add(v(side * 0.007, -step * 0.42, 0.017 + z)),
        at.clone().add(v(-side * 0.015, -step * 0.48, 0.004)),
      ];
      twistedCord(build, points, 0.0105, mat.leafKnot, 18, row * 0.72 + side);
    }
    const cross = row % 2 ? 1 : -1;
    twistedCord(build, [at.clone().add(v(-cross * 0.014, step * 0.26, 0.025)),
      at.clone().add(v(cross * 0.009, -step * 0.03, 0.035)),
      at.clone().add(v(cross * 0.012, -step * 0.37, 0.016))], 0.008, mat.leafKnot, 12, row);
  }
}

export function tassel(build, top, length, mat, rnd) {
  for (let i = 0; i < 68; i++) {
    const a = i / 68 * TAU, phase = rnd() * TAU, drop = length * (0.82 + rnd() * 0.22);
    const root = top.clone().add(v(Math.cos(a) * 0.027, 0, Math.sin(a) * 0.023));
    const points = Array.from({ length: 16 }, (_, j) => {
      const t = j / 15, spread = 0.019 * t + 0.065 * t * t;
      return root.clone().add(v(Math.cos(a) * spread + Math.sin(t * 14 + phase) * 0.007 * t,
        -drop * t, Math.sin(a) * spread * 0.8 + Math.sin(t * 12 + phase) * 0.009 * t));
    });
    build.tube(points, 0.003 + rnd() * 0.0016, i % 8 ? mat.cotton : mat.cottonShade, 24, 4);
  }
  twistedCord(build, [top.clone().add(v(-0.01, 0.07)), top, top.clone().add(v(0.005, -0.05))], 0.019, mat.cotton, 26);
  for (let i = 0; i < 4; i++) build.add(new THREE.TorusGeometry(0.029, 0.005, 5, 12), mat.cottonShade, top.clone().add(v(0, -i * 0.011, 0)), [1, 1, 1], new THREE.Euler(Math.PI / 2 + 0.05, 0, 0));
}

export function woodenCharm(build, at, mat, rnd, size = 1, turn = Math.PI / 4) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.137, -0.133); shape.lineTo(0.131, -0.139); shape.lineTo(0.141, 0.135); shape.lineTo(-0.134, 0.139); shape.closePath();
  const plaque = new THREE.ExtrudeGeometry(shape, { depth: 0.017, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.004, bevelThickness: 0.003 });
  const rotation = new THREE.Euler(-0.06, 0.14, turn);
  build.add(plaque, mat.charm, at, [size, size, size], rotation);
  const local = (x, y, z) => v(x * size, y * size, z * size).applyEuler(rotation).add(at);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + 0.12, p = local(Math.cos(a) * 0.035, Math.sin(a) * 0.035, 0.022);
    const rotate = new THREE.Euler(-0.06, 0.14, turn + a - Math.PI / 2);
    build.add(new THREE.SphereGeometry(0.030, 10, 6), mat.paint, p, [0.65 * size, 1.35 * size, 0.04], rotate);
    build.add(new THREE.SphereGeometry(0.021, 9, 6), mat.leafPaint, p.clone().add(v(0, 0, 0.0015)), [0.67 * size, 1.28 * size, 0.04], rotate);
  }
  build.add(new THREE.SphereGeometry(0.009, 8, 5), mat.paint, local(0, 0, 0.024), [1, 1, 0.08]);
  const eyelet = local(0.117, 0.116, 0.023);
  build.add(new THREE.TorusGeometry(0.009, 0.003, 5, 12), mat.silverDark, eyelet, [1, 1, 1], rotation);
  build.thread(eyelet, at.clone().add(v(0, 0.23 * size, 0)), mat.web, 0.004);
}
