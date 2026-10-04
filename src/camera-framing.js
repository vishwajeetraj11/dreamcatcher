import { MathUtils, Vector3 } from 'three';

const UP = new Vector3(0, 1, 0);
export const OVERVIEW_DIRECTION = new Vector3(0.085, 0.018, 1).normalize();

// Solve the perspective constraints for all eight corners, including depth.
// Width/height-only fitting clips rotated objects and ignores overlay controls.
export function fitPerspectiveBounds(bounds, direction, viewport, fov = 34) {
  const width = Math.max(1, viewport.width), height = Math.max(1, viewport.height);
  const backward = direction.clone().normalize();
  const right = UP.clone().cross(backward).normalize();
  if (right.lengthSq() < 0.001) right.set(1, 0, 0);
  const up = backward.clone().cross(right).normalize();
  const target = bounds.getCenter(new Vector3());
  const tanY = Math.tan(MathUtils.degToRad(fov / 2));
  const tanX = tanY * width / height;
  const top = Math.min(56, height * 0.14);
  const bottom = Math.min(90, height * 0.22);
  const side = Math.min(28, width * 0.08);
  const limits = { top: 1 - 2 * top / height, bottom: 1 - 2 * bottom / height, side: 1 - 2 * side / width };
  const centerShift = (bottom - top) / height;
  const usableHeight = 1 - (top + bottom) / height;
  let distance = 0;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const point = new Vector3(x, y, z).sub(target);
    const horizontal = point.dot(right), vertical = point.dot(up), depth = point.dot(backward);
    distance = Math.max(distance,
      depth + Math.abs(horizontal) / (tanX * limits.side),
      (vertical / tanY + limits.top * depth) / usableHeight,
      (-vertical / tanY + limits.bottom * depth) / usableHeight);
  }
  // Small extra allowance covers the ornament's gentle sway and edge antialiasing.
  distance = Math.max(0.5, distance * 1.04);
  target.addScaledVector(up, -centerShift * distance * tanY);
  return { target, distance, limits };
}
