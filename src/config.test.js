import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, presets, legacyPresets, collectionDesigns, shapeOptions, pendantLabel, normalizeConfig, readSaved } from './config.js';
test('all presets survive validation', () => {
  for (const preset of Object.values(presets)) assert.deepEqual(normalizeConfig(preset), preset);
});
test('Forest Echos exposes exactly the four designs in collection order', () => {
  assert.deepEqual(Object.keys(presets), ['Willow Weave', 'Sage Haven', 'Amber Hush', 'Moon Woven']);
  assert.deepEqual(Object.values(presets).map(config => config.design), ['willow', 'sage', 'amber', 'moon']);
  assert.deepEqual(Object.keys(collectionDesigns), ['willow', 'sage', 'amber', 'moon']);
});
test('each design offers its original frame and only its permitted geometric variations', () => {
  const expected = {
    willow: ['triangle', 'square'],
    sage: ['pentagon', 'circle', 'square', 'triangle'],
    amber: ['rectangle'],
    moon: ['moon', 'circle', 'teardrop', 'pentagon']
  };
  for (const preset of Object.values(presets)) {
    const options = shapeOptions(preset);
    assert.deepEqual(options.map(option => option.value), expected[preset.design]);
    assert.equal(options[0].label, 'Original design');
    assert.equal(options[0].original, true);
    for (const option of options) {
      const result = normalizeConfig({ ...preset, shape: option.value });
      assert.equal(result.design, preset.design);
      assert.equal(result.shape, option.value);
    }
    for (const shape of ['moon', 'circle', 'teardrop', 'pentagon', 'triangle', 'square', 'rectangle', '__proto__']) {
      if (expected[preset.design].includes(shape)) continue;
      const result = normalizeConfig({ ...preset, shape });
      assert.equal(result.design, preset.design);
      assert.equal(result.shape, preset.shape, `${preset.design} rejects ${shape}`);
    }
  }
});
test('shared frame shapes retain design identity, details, and ornaments', () => {
  const willow = normalizeConfig({ ...presets['Willow Weave'], shape: 'square', frame: 'walnut' });
  const sage = normalizeConfig({ ...presets['Sage Haven'], shape: 'square', feathers: true });
  assert.equal(willow.design, 'willow');
  assert.equal(sage.design, 'sage');
  assert.equal(willow.strands, 7);
  assert.equal(sage.strands, 1);
  assert.equal(willow.feathers, true);
  assert.equal(sage.feathers, true);
  assert.equal(pendantLabel(willow), 'Garnet pendant');
  assert.equal(pendantLabel(sage), 'Amber pendant');
  assert.equal(pendantLabel(normalizeConfig({ design: 'moon', shape: 'pentagon' })), 'Rose quartz pendant');
});
test('malformed options cannot reach geometry generation', () => {
  const result = normalizeConfig({ shape: 'evil', stone: '__proto__', frame: 'constructor', strands: 1e6, length: Infinity, pendant: 'true' });
  assert.deepEqual(result, defaults);
  assert.equal(normalizeConfig({ length: 99 }).length, 1.5);
  assert.equal(normalizeConfig({ length: -1 }).length, 0.7);
});
test('saved designs tolerate corrupt, missing, and unavailable storage', () => {
  for (const raw of ['bad JSON', '{}', 'null', '[null, {}, 123]']) assert.deepEqual(readSaved({ getItem: () => raw }), []);
  assert.deepEqual(readSaved({ getItem() { throw Error('blocked'); } }), []);
});
test('saved designs normalize loaded configuration and cap collection size', () => {
  const values = Array.from({ length: 35 }, (_, i) => ({ id: String(i), name: `Design ${i}`, config: { strands: -4, length: 900 } }));
  const actual = readSaved({ getItem: () => JSON.stringify(values) });
  assert.equal(actual.length, 30);
  assert.equal(actual[0].config.strands, 3);
  assert.equal(actual[0].config.length, 1.5);
});
test('legacy saved designs infer collection identity without losing their materials', () => {
  const legacy = [
    ['triangle', 'willow'], ['pentagon', 'sage'], ['rectangle', 'amber'],
    ['moon', 'moon'], ['circle', 'moon'], ['teardrop', 'moon']
  ].map(([shape, design], i) => ({ id: String(i), name: `My dream catcher ${i}`, config: { shape, frame: 'walnut', stone: 'rose' }, expectedDesign: design }));
  const actual = readSaved({ getItem: () => JSON.stringify(legacy) });
  actual.forEach((entry, i) => {
    assert.equal(entry.config.design, legacy[i].expectedDesign);
    assert.equal(entry.config.shape, legacy[i].config.shape);
    assert.equal(entry.config.frame, 'walnut');
    assert.equal(entry.config.stone, 'rose');
  });
  const named = readSaved({ getItem: () => JSON.stringify([{ id: 'named', name: 'Sage Haven', config: { shape: 'circle' } }]) });
  assert.equal(named[0].config.design, 'sage');
  assert.equal(named[0].config.shape, 'circle');
});
test('saved customized designs remain distinct after a round trip even with the same shape', () => {
  const entries = ['Willow Weave', 'Sage Haven'].map((name, i) => ({
    id: String(i), name: 'My square dream catcher', config: normalizeConfig({ ...presets[name], shape: 'square' })
  }));
  assert.deepEqual(readSaved({ getItem: () => JSON.stringify(entries) }), entries);
  const conflictingName = { ...entries[1], name: 'Willow Weave' };
  assert.equal(readSaved({ getItem: () => JSON.stringify([conflictingName]) })[0].config.design, 'sage');
});
test('legacy preset links resolve to allowed Moon Woven variations', () => {
  for (const preset of Object.values(legacyPresets)) {
    assert.equal(preset.design, 'moon');
    assert.deepEqual(normalizeConfig(preset), preset);
  }
});
