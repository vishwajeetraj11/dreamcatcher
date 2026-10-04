import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const Y = v(0, 1, 0), TAU = Math.PI * 2;

// Merge the opaque details by material: thousands of fibers remain a few draw calls.
export class Builder {
  constructor(group) { this.group = group; this.batches = new Map(); }
  add(geometry, material, position = v(0, 0), scale = [1, 1, 1], rotation = new THREE.Euler()) {
    geometry.applyMatrix4(new THREE.Matrix4().compose(position, new THREE.Quaternion().setFromEuler(rotation), new THREE.Vector3(...scale)));
    const list = this.batches.get(material) || []; list.push(geometry); this.batches.set(material, list);
  }
  tube(points, radius, material, segments = 32, radial = 6, closed = false) {
    const curve = typeof points.getPoint === 'function' ? points : new THREE.CatmullRomCurve3(points, closed, 'centripetal');
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
      mesh.castShadow = true; mesh.receiveShadow = material.userData.receiveShadow !== false;
      this.group.add(mesh);
    }
    this.batches.clear();
  }
}
export function branchGeometry(curve, radius, segments = 100) {
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
export function addCrystal(group, geometry, material, pos, scale, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(pos); mesh.scale.set(...scale); mesh.rotation.set(...rotation);
  // Transparent stones do not cast solid black shadows, but still receive wood shadows.
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
export function lines(group, coordinates, material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(coordinates, 3));
  group.add(new THREE.LineSegments(geometry, material));
}
