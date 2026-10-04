import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { fitPerspectiveBounds, OVERVIEW_DIRECTION } from './camera-framing.js';

const bounds = new Box3(new Vector3(-1.45, -3.7, -0.34), new Vector3(1.4, 2.5, 0.34));
for (const [name, width, height] of [['desktop', 950, 680], ['narrow desktop', 310, 680], ['phone', 340, 460], ['tall preview', 800, 1100]]) {
  test(`complete longest design fits ${name}, including after orbiting`, () => {
    for (const direction of [OVERVIEW_DIRECTION, new Vector3(1, 0.4, 1).normalize(), new Vector3(0.1, 1, 0.1).normalize(), new Vector3(0, 0, -1)]) {
      const { distance, target, limits } = fitPerspectiveBounds(bounds, direction, { width, height });
      const camera = new PerspectiveCamera(34, width / height, 0.1, 100);
      camera.position.copy(target).addScaledVector(direction, distance); camera.lookAt(target); camera.updateMatrixWorld();
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new Vector3(x, y, z).project(camera);
        assert.ok(Math.abs(point.x) <= limits.side, 'no left/right clipping');
        assert.ok(point.y <= limits.top, 'suspension clears the top toolbar');
        assert.ok(point.y >= -limits.bottom, 'strands clear the bottom toolbar');
        assert.ok(point.z > -1 && point.z < 1, 'geometry is inside the camera depth range');
      }
    }
  });
}

test('longer strands and narrower panels increase the required viewing distance', () => {
  const short = new Box3(new Vector3(-1.45, -2.4, -0.34), bounds.max.clone());
  const normal = fitPerspectiveBounds(short, OVERVIEW_DIRECTION, { width: 900, height: 680 });
  const extended = fitPerspectiveBounds(bounds, OVERVIEW_DIRECTION, { width: 900, height: 680 });
  const narrow = fitPerspectiveBounds(bounds, OVERVIEW_DIRECTION, { width: 150, height: 680 });
  assert.ok(extended.distance > normal.distance);
  assert.ok(narrow.distance > extended.distance);
});
