import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, presets, normalizeConfig, readSaved } from './config.js';
test('all presets survive validation', () => {
  for (const preset of Object.values(presets)) assert.deepEqual(normalizeConfig(preset), preset);
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
