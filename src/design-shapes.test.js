import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Line3, Vector3 } from 'three';
import { collectionDesigns, presets } from './config.js';
import { createDreamcatcher, framePaths } from './model.js';
import { createSurfaceTextures } from './materials.js';
import { frameDefinition, lowerFramePoint } from './forest-craft.js';
import { applyBreeze } from './breeze.js';

const minerals = { willow: 'garnet', sage: 'amber', moon: 'rose-quartz' };
const distanceToPerimeter = (point, vertices, closed = true) => Math.min(...vertices.slice(0, closed ? vertices.length : -1).map((a, i) => {
  const b = vertices[(i + 1) % vertices.length];
  return a.distanceToSquared(b) < 1e-12 ? point.distanceTo(a) : point.distanceTo(new Line3(a, b).closestPointToPoint(point, true, new Vector3()));
}));

for (const [design, definition] of Object.entries(collectionDesigns)) {
  for (const shape of [definition.originalShape, ...definition.customShapes]) {
    test(`${definition.name} / ${shape}: keeps its identity, attachments and owned resources`, () => {
      const config = { ...presets[definition.name], shape };
      const textures = createSurfaceTextures(), model = createDreamcatcher(config, textures);
      const geometries = new Set(), originalMaterials = new Set(), ownedTextures = new Set();
      const sharedTextures = new Set(Object.values(textures));
      model.traverse(object => {
        if (object.geometry && !geometries.has(object.geometry)) {
          geometries.add(object.geometry);
          for (const attribute of ['position', 'normal']) {
            for (const value of object.geometry.getAttribute(attribute)?.array || []) assert.ok(Number.isFinite(value), 'geometry stays finite');
          }
        }
        if (object.material) {
          originalMaterials.add(object.material);
          for (const texture of [object.material.map, object.material.bumpMap]) if (texture && !sharedTextures.has(texture)) ownedTextures.add(texture);
        }
      });
      assert.equal(model.userData.config.design, design);
      assert.equal(model.userData.config.shape, shape);
      assert.equal(model.userData.breeze.strands.length, config.strands, 'custom shape keeps the collection strand count');
      const pendant = model.getObjectByName(design === 'moon' ? 'rose-quartz-pendant' : 'feature-pendant');
      if (config.pendant) {
        assert.ok(pendant?.isMesh, 'original pendant construction remains available');
        assert.equal(pendant.userData.mineral, minerals[design]);
      } else assert.equal(pendant, undefined);
      if (design === 'willow') {
        assert.ok(model.getObjectByName('willow-wooden-charms'));
        assert.ok(model.getObjectByName('willow-tassel'));
      }
      if (design === 'moon') assert.equal(model.getObjectByName('feature-pendant'), undefined, 'Moon pentagon must never become Sage Haven');

      if (design !== 'amber') {
        const frame = design === 'moon' ? framePaths(shape) : frameDefinition(shape, design);
        const vertices = design === 'moon'
          ? Array.from({ length: 601 }, (_, i) => frame.arc.getPointAt(i / 600))
          : frame.vertices;
        for (const { pivot } of model.userData.breeze.strands) {
          const point = pivot.position.clone(); point.z -= design === 'moon' ? 0.035 : 0.06;
          assert.ok(distanceToPerimeter(point, vertices, shape !== 'moon') < 0.012, 'every hanging cord meets the frame');
        }
        const loopBase = model.userData.breeze.frame.position.clone().sub(new Vector3(design === 'moon' ? -0.01 : 0, design === 'moon' ? 0.31 : 0.32, design === 'moon' ? -0.02 : 0));
        assert.ok(distanceToPerimeter(loopBase, vertices, shape !== 'moon') < 0.012, 'suspension loop meets the upper frame');
      }
      for (const seconds of [0, 1.5, 4, 8, 13, 22, 39]) {
        applyBreeze(model, seconds, 1);
        assert.ok(model.userData.previewBounds.containsBox(new Box3().setFromObject(model)), 'motion remains inside preview framing');
      }
      const releasedMaterials = new Set(), releasedTextures = new Map(), releasedGeometry = new Map();
      for (const material of originalMaterials) material.addEventListener('dispose', () => releasedMaterials.add(material));
      for (const texture of ownedTextures) texture.addEventListener('dispose', () => releasedTextures.set(texture, (releasedTextures.get(texture) || 0) + 1));
      for (const geometry of geometries) geometry.addEventListener('dispose', () => releasedGeometry.set(geometry, (releasedGeometry.get(geometry) || 0) + 1));
      model.userData.updateMaterials({ ...config, frame: 'walnut', thread: 'sage', stone: 'amethyst' });
      model.traverse(object => {
        if (object.geometry) assert.ok(geometries.has(object.geometry), 'material changes reuse all geometry');
        if (object.material) assert.ok(!originalMaterials.has(object.material), 'all visible details change materials');
      });
      assert.equal(releasedMaterials.size, originalMaterials.size);
      assert.equal(releasedTextures.size, 0, 'material changes keep the model surface textures');
      model.userData.dispose();
      assert.equal(releasedGeometry.size, geometries.size);
      assert.ok([...releasedGeometry.values()].every(count => count === 1));
      assert.equal(releasedTextures.size, ownedTextures.size);
      assert.ok([...releasedTextures.values()].every(count => count === 1));
      textures.dispose();
    });
  }
}

test('custom polygons have equal sides, and vertical edges support safe hanging attachments', () => {
  for (const [shape, design] of [['square', 'willow'], ['square', 'sage'], ['triangle', 'sage']]) {
    const { vertices } = frameDefinition(shape, design);
    const lengths = vertices.map((point, i) => point.distanceTo(vertices[(i + 1) % vertices.length]));
    assert.ok(Math.max(...lengths) - Math.min(...lengths) < 1e-10);
    const left = Math.min(...vertices.map(point => point.x));
    assert.ok(Number.isFinite(lowerFramePoint(vertices, left).y));
  }
  const pentagon = framePaths('pentagon').arc;
  assert.equal(pentagon.curves.length, 5);
  const sides = pentagon.curves.map(curve => curve.getLength());
  assert.ok(Math.max(...sides) - Math.min(...sides) < 1e-10);
});
