import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { applyBreeze } from './breeze.js';
import { createDreamcatcher } from './model.js';
import { createSurfaceTextures } from './materials.js';
import { defaults } from './config.js';

for (const shape of ['moon', 'circle', 'teardrop']) {
  test(`${shape} breeze stays attached, fits the preview and returns exactly to rest`, () => {
    const textures = createSurfaceTextures();
    const model = createDreamcatcher({ ...defaults, shape, strands: 7, length: 1.5 }, textures);
    const { frame, strands, pendant } = model.userData.breeze;
    model.updateMatrixWorld(true);
    const suspension = frame.getWorldPosition(new Vector3());
    const geometries = [], restingTransforms = [];
    model.traverse(object => {
      if (object.geometry) {
        geometries.push(object.geometry);
        restingTransforms.push(object.matrixWorld.clone());
      }
    });
    const distanceFromKnot = strands.map(({ pivot }) => {
      const stone = pivot.children[0].children.find(object => object.isMesh);
      return { stone, distance: stone.getWorldPosition(new Vector3()).distanceTo(pivot.getWorldPosition(new Vector3())) };
    });

    for (let time = 0; time < 60; time += 0.5) {
      applyBreeze(model, time, 1);
      model.updateMatrixWorld(true);
      assert.ok(frame.getWorldPosition(new Vector3()).distanceTo(suspension) < 1e-10, 'the suspension point remains fixed');
      assert.ok(model.userData.previewBounds.containsBox(new Box3().setFromObject(model)), 'moving strands stay within the reserved camera bounds');
      strands.forEach(({ pivot }, i) => {
        const { stone, distance } = distanceFromKnot[i];
        const actual = stone.getWorldPosition(new Vector3()).distanceTo(pivot.getWorldPosition(new Vector3()));
        assert.ok(Math.abs(actual - distance) < 1e-10, 'the cord and stone move together about their knot');
      });
    }
    assert.ok(strands.some(({ pivot }) => Math.abs(pivot.rotation.z) > 0.01), 'breeze produces visible strand motion');
    assert.ok(Math.abs(pendant.rotation.z) < 0.017, 'the heavier pendant has restrained movement');

    applyBreeze(model, 60, 0);
    model.updateMatrixWorld(true);
    let index = 0;
    model.traverse(object => {
      if (!object.geometry) return;
      assert.equal(object.geometry, geometries[index], 'motion reuses the original geometry');
      object.matrixWorld.elements.forEach((value, i) => {
        assert.ok(Math.abs(value - restingTransforms[index].elements[i]) < 1e-10, 'Still restores every part to its original pose');
      });
      index++;
    });
    model.userData.dispose(); textures.dispose();
  });
}

test('breeze works without the optional pendant and preserves material customization', () => {
  const textures = createSurfaceTextures();
  const config = { ...defaults, pendant: false, strands: 1, length: 0.7 };
  const model = createDreamcatcher(config, textures);
  applyBreeze(model, 4, 1);
  const pose = model.userData.breeze.strands[0].pivot.rotation.clone();
  model.userData.updateMaterials({ ...config, stone: 'amethyst' });
  assert.ok(model.userData.breeze.strands[0].pivot.rotation.equals(pose));
  assert.equal(model.userData.breeze.pendant, null);
  applyBreeze(model, 5, 0);
  model.userData.dispose(); textures.dispose();
});
