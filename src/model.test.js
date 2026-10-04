import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { createDreamcatcher } from './model.js';
import { createSurfaceTextures } from './materials.js';
import { defaults } from './config.js';

for (const shape of ['moon', 'circle', 'teardrop']) {
  test(`${shape} renders valid geometry with maximum strands and intricate weaving`, () => {
    const textures = createSurfaceTextures();
    const model = createDreamcatcher({ ...defaults, shape, strands: 7, length: 1.5, pattern: 'dense' }, textures);
    const checked = new Set();
    model.traverse(object => {
      const geometry = object.geometry;
      if (!geometry || checked.has(geometry)) return;
      checked.add(geometry);
      for (const value of geometry.attributes.position.array) assert.ok(Number.isFinite(value));
    });
    const size = new Box3().setFromObject(model).getSize(new Vector3());
    assert.ok(size.y > 4 && size.y < 7, 'the complete ornament fits a sensible camera range');
    assert.ok(size.z > 0.2 && size.z < 1, 'the frame and quartz have real depth');
    const disposals = new Map();
    checked.forEach(geometry => geometry.addEventListener('dispose', () => disposals.set(geometry, (disposals.get(geometry) || 0) + 1)));
    model.userData.dispose();
    assert.equal(disposals.size, checked.size);
    assert.ok([...disposals.values()].every(count => count === 1), 'shared crystal geometry is disposed exactly once');
    textures.dispose();
  });
}

test('color changes reuse geometry and leave shared textures available', () => {
  const textures = createSurfaceTextures();
  const model = createDreamcatcher(defaults, textures);
  const geometries = [], materials = [];
  model.traverse(object => { if (object.geometry) { geometries.push(object.geometry); materials.push(object.material); } });
  let textureDisposals = 0;
  for (const texture of [textures.bark, textures.jute, textures.stone, textures.endGrain]) texture.addEventListener('dispose', () => textureDisposals++);
  model.userData.updateMaterials({ ...defaults, stone: 'rose', frame: 'walnut', thread: 'blush' });
  let i = 0;
  model.traverse(object => {
    if (!object.geometry) return;
    assert.equal(object.geometry, geometries[i]);
    assert.notEqual(object.material, materials[i++]);
  });
  model.userData.dispose();
  assert.equal(textureDisposals, 0);
  textures.dispose();
  assert.equal(textureDisposals, 4);
});

test('pendant is a single closed beveled crystal and can be removed', () => {
  const textures = createSurfaceTextures();
  const model = createDreamcatcher(defaults, textures);
  const pendant = model.getObjectByName('rose-quartz-pendant');
  assert.ok(pendant?.isMesh, 'detail view has a stable mesh to focus');
  const geometry = pendant.geometry;
  const positions = geometry.attributes.position;
  const keys = Array.from({ length: positions.count }, (_, i) => [positions.getX(i), positions.getY(i), positions.getZ(i)].map(value => value.toFixed(5)).join(','));
  const indices = geometry.index ? [...geometry.index.array] : Array.from({ length: positions.count }, (_, i) => i);
  const edges = new Map();
  for (let i = 0; i < indices.length; i += 3) {
    for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
      const edge = [keys[indices[i + a]], keys[indices[i + b]]].sort().join('|');
      edges.set(edge, (edges.get(edge) || 0) + 1);
    }
  }
  assert.ok([...edges.values()].every(count => count === 2), 'body and point form a watertight surface without an internal seam');
  model.userData.dispose();
  const without = createDreamcatcher({ ...defaults, pendant: false }, textures);
  assert.equal(without.getObjectByName('rose-quartz-pendant'), undefined);
  without.userData.dispose(); textures.dispose();
});
