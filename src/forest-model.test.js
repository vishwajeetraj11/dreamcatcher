import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { createDreamcatcher } from './model.js';
import { createSurfaceTextures } from './materials.js';
import { presets, normalizeConfig, readSaved } from './config.js';
import { applyBreeze } from './breeze.js';
import { fitPerspectiveBounds, OVERVIEW_DIRECTION } from './camera-framing.js';

for (const name of ['Willow Weave', 'Sage Haven', 'Amber Hush']) {
  test(`${name}: customization, motion, framing and resource cleanup`, () => {
    const config = { ...presets[name], strands: 7, length: 1.5, pattern: 'dense', pendant: true, feathers: true };
    const textures = createSurfaceTextures(), model = createDreamcatcher(config, textures);
    const geometries = new Set(), oldMaterials = new Set(), ownedTextures = new Set();
    const sharedTextures = new Set(Object.values(textures));
    model.traverse(object => {
      if (object.material) {
        oldMaterials.add(object.material);
        for (const texture of [object.material.map, object.material.bumpMap]) {
          if (texture && !sharedTextures.has(texture)) ownedTextures.add(texture);
        }
      }
      if (!object.geometry) return;
      geometries.add(object.geometry);
      for (const value of object.geometry.attributes.position.array) assert.ok(Number.isFinite(value));
    });
    assert.equal(model.userData.breeze.strands.length, 7);
    assert.ok(model.getObjectByName('feature-pendant')?.isMesh, 'pendant inspection has a target');
    for (let time = 0; time < 50; time += 0.5) {
      applyBreeze(model, time, 1);
      assert.ok(model.userData.previewBounds.containsBox(new Box3().setFromObject(model)), 'moving leaves and crystals fit the preview envelope');
    }
    for (const [width, height] of [[340, 390], [900, 680]]) {
      const bounds = model.userData.previewBounds;
      const { distance, target, limits } = fitPerspectiveBounds(bounds, OVERVIEW_DIRECTION, { width, height });
      const camera = new PerspectiveCamera(34, width / height, 0.1, 100);
      camera.position.copy(target).addScaledVector(OVERVIEW_DIRECTION, distance); camera.lookAt(target); camera.updateMatrixWorld();
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new Vector3(x, y, z).project(camera);
        assert.ok(Math.abs(point.x) <= limits.side && point.y <= limits.top && point.y >= -limits.bottom);
      }
    }
    let released = 0;
    const textureDisposals = new Map();
    for (const texture of ownedTextures) texture.addEventListener('dispose', () => textureDisposals.set(texture, (textureDisposals.get(texture) || 0) + 1));
    for (const material of oldMaterials) material.addEventListener('dispose', () => released++);
    model.userData.updateMaterials({ ...config, frame: 'cotton', thread: 'sage', stone: 'amethyst' });
    model.traverse(object => {
      if (object.geometry) assert.ok(geometries.has(object.geometry), 'changing colors reuses all geometry');
      if (object.material) assert.ok(!oldMaterials.has(object.material), 'every decoration receives its replacement material');
    });
    assert.equal(released, oldMaterials.size);
    assert.equal(textureDisposals.size, 0, 'changing colors retains the handcrafted surface textures');
    const disposals = new Map();
    for (const geometry of geometries) geometry.addEventListener('dispose', () => disposals.set(geometry, (disposals.get(geometry) || 0) + 1));
    model.userData.dispose();
    assert.equal(disposals.size, geometries.size);
    assert.ok([...disposals.values()].every(count => count === 1));
    assert.equal(textureDisposals.size, ownedTextures.size, 'model-owned surface textures are released');
    assert.ok([...textureDisposals.values()].every(count => count === 1));
    const minimal = createDreamcatcher({ ...presets[name], pendant: false, pebbles: false, feathers: false, strands: 1 }, textures);
    assert.equal(minimal.getObjectByName('feature-pendant'), undefined);
    minimal.userData.dispose(); textures.dispose();
  });
}

test('Forest Echos presets round-trip through saved designs; older designs gain safe defaults', () => {
  for (const [name, config] of Object.entries(presets)) {
    const saved = [{ id: name, name, config }];
    assert.deepEqual(readSaved({ getItem: () => JSON.stringify(saved) }), saved);
  }
  assert.equal(normalizeConfig({ shape: 'moon' }).feathers, false);
  assert.equal(normalizeConfig({ shape: '__proto__', feathers: 'yes' }).shape, 'moon');
});
