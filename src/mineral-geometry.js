import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { randomSequence } from './materials.js';

const TAU = Math.PI * 2;
const vector = (x, y, z) => new THREE.Vector3(x, y, z);

// Six hand-cut faces separated by narrow polished arrises. Keeping each broad
// face's normal distinct matters: averaged cylinder normals make quartz look
// like a lipstick tube, even when the silhouette has six sides.
export function pendantGeometry() {
  const corners = Array.from({ length: 6 }, (_, i) => {
    const angle = i / 6 * TAU + Math.PI / 6;
    const r = 0.105 * [1.012, 0.988, 1.009, 1.018, 0.99, 1][i];
    return vector(Math.cos(angle) * r, 0, Math.sin(angle) * r);
  });
  const outline = corners.flatMap((point, i) => [
    point.clone().lerp(corners[(i + 5) % 6], 0.055),
    point.clone().lerp(corners[(i + 1) % 6], 0.055)
  ]);
  const rings = [
    outline.map(p => vector(p.x * 0.97, 0, p.z * 0.97)),
    outline.map(p => vector(p.x, -0.009, p.z)),
    outline.map((p, i) => vector(p.x * 0.986 + 0.001, -0.529 + Math.sin(i / 2) * 0.003, p.z * 0.989)),
    outline.map((p, i) => vector(p.x * 0.95 + 0.001, -0.537 + Math.sin(i / 2) * 0.003, p.z * 0.954)),
    outline.map(p => vector(p.x * 0.053 - 0.005, -0.644, p.z * 0.053 + 0.003))
  ];
  const point = vector(-0.005, -0.65, 0.003);
  const positions = [], normals = [], uv = [];
  function triangle(a, b, c, ua, ub, uc, outward) {
    const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    if (normal.dot(outward) < 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub]; normal.negate(); }
    for (const p of [a, b, c]) { positions.push(...p.toArray()); normals.push(...normal.toArray()); }
    uv.push(...ua, ...ub, ...uc);
  }
  for (let layer = 0; layer < rings.length - 1; layer++) {
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      const a = rings[layer][i], b = rings[layer][j], c = rings[layer + 1][j], d = rings[layer + 1][i];
      const outward = a.clone().add(b).setY(0);
      const ua = [i / 12, -a.y / 0.65], ub = [(i + 1) / 12, -b.y / 0.65];
      const uc = [(i + 1) / 12, -c.y / 0.65], ud = [i / 12, -d.y / 0.65];
      triangle(a, b, d, ua, ub, ud, outward);
      triangle(b, c, d, ub, uc, ud, outward);
    }
  }
  for (let i = 0; i < outline.length; i++) {
    const j = (i + 1) % outline.length;
    triangle(vector(0, 0, 0), rings[0][i], rings[0][j], [0.5, 0.5], [0, 0], [1, 0], vector(0, 1, 0));
    triangle(rings.at(-1)[i], rings.at(-1)[j], point, [i / 12, 0.99], [(i + 1) / 12, 0.99], [(i + 0.5) / 12, 1], vector(0, -1, 0));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeBoundingSphere();
  return geometry;
}

// A tumbled stone starts with fractured mineral planes, then loses its sharp
// corners. An exponent-warped sphere instead produces the same rounded cube
// over and over. Smooth minimum blends the random supporting planes here.
export function pebbleGeometry(seed) {
  const random = randomSequence(seed * 313 + 41);
  const planes = Array.from({ length: 11 }, (_, i) => {
    const y = 1 - 2 * (i + 0.5) / 11;
    const angle = i * Math.PI * (3 - Math.sqrt(5)) + (random() - 0.5) * 0.22;
    const radius = Math.sqrt(1 - y * y);
    return { normal: vector(Math.cos(angle) * radius, y, Math.sin(angle) * radius), distance: 0.69 + random() * 0.23 };
  });
  const base = new THREE.IcosahedronGeometry(1, 7);
  // UV coordinates split otherwise identical vertices. Weld the actual surface
  // first so polished quartz does not inherit dark seams in its reflection.
  base.deleteAttribute('uv'); base.deleteAttribute('normal');
  const geometry = mergeVertices(base); base.dispose();
  const positions = geometry.attributes.position;
  const uvs = [];
  for (let i = 0; i < positions.count; i++) {
    const direction = vector(positions.getX(i), positions.getY(i), positions.getZ(i)).normalize();
    const distances = planes.map(plane => plane.distance / Math.max(0.001, plane.normal.dot(direction)));
    const nearest = Math.min(...distances);
    const smoothing = 0.06;
    const radius = nearest - smoothing * Math.log(distances.reduce((sum, distance) => sum + Math.exp(-(distance - nearest) / smoothing), 0));
    const ripple = 1 + Math.sin(direction.x * 9 + seed) * Math.sin(direction.y * 8 + seed * 2) * 0.009;
    const p = direction.clone().multiplyScalar(radius * ripple);
    positions.setXYZ(i, p.x, p.y, p.z);
    uvs.push(0.5 + Math.atan2(direction.z, direction.x) / TAU, 0.5 + Math.asin(direction.y) / Math.PI);
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}
