export const collectionDesigns = Object.freeze({
  willow: Object.freeze({ name: 'Willow Weave', originalShape: 'triangle', customShapes: Object.freeze(['square']), forest: true }),
  sage: Object.freeze({ name: 'Sage Haven', originalShape: 'pentagon', customShapes: Object.freeze(['circle', 'square', 'triangle']), forest: true }),
  amber: Object.freeze({ name: 'Amber Hush', originalShape: 'rectangle', customShapes: Object.freeze([]), forest: true }),
  moon: Object.freeze({ name: 'Moon Woven', originalShape: 'moon', customShapes: Object.freeze(['circle', 'teardrop', 'pentagon']), forest: false })
});
export const defaults = Object.freeze({ design: 'moon', shape: 'moon', frame: 'jute', thread: 'ivory', pattern: 'classic', stone: 'jade', strands: 3, length: 1, pendant: true, pebbles: true, feathers: false });
export const shapes = { moon: 'Crescent', circle: 'Circle', teardrop: 'Teardrop', triangle: 'Triangle', pentagon: 'Pentagon', rectangle: 'Rectangle', square: 'Square' };
const legacyShapeDesigns = { triangle: 'willow', pentagon: 'sage', rectangle: 'amber', moon: 'moon', circle: 'moon', teardrop: 'moon' };
export function inferDesign(input, savedName) {
  if (Object.hasOwn(collectionDesigns, input?.design)) return input.design;
  const normalizedName = typeof savedName === 'string' ? savedName.trim().toLowerCase() : '';
  const namedDesign = Object.entries(collectionDesigns).find(([, design]) => design.name.toLowerCase() === normalizedName);
  if (namedDesign) return namedDesign[0];
  return Object.hasOwn(legacyShapeDesigns, input?.shape) ? legacyShapeDesigns[input.shape] : defaults.design;
}
export const designName = config => collectionDesigns[inferDesign(config)].name;
export function shapeOptions(config) {
  const design = collectionDesigns[inferDesign(config)];
  return [
    { value: design.originalShape, label: 'Original design', original: true },
    ...design.customShapes.map(value => ({ value, label: shapes[value], original: false }))
  ];
}
export const pendantLabel = config => inferDesign(config) === 'willow' ? 'Garnet pendant' : inferDesign(config) === 'sage' ? 'Amber pendant' : 'Rose quartz pendant';
export const palettes = {
  frame: { jute: { name: 'Natural jute', color: '#b89870' }, walnut: { name: 'Dark walnut', color: '#665044' }, cotton: { name: 'Ivory cotton', color: '#e4d9bf' } },
  thread: { ivory: { name: 'Ivory', color: '#f2e7cd' }, sage: { name: 'Sage', color: '#9da987' }, blush: { name: 'Blush', color: '#caa49b' }, charcoal: { name: 'Charcoal', color: '#5c5c55' } },
  stone: { jade: { name: 'Green aventurine', color: '#a1c9b3', note: 'A little room for possibility.' }, rose: { name: 'Rose quartz', color: '#dfb5af', note: 'A gentle touch of warmth.' }, amethyst: { name: 'Amethyst', color: '#a99bb8', note: 'For your quiet, creative moments.' }, amber: { name: 'Honey amber', color: '#c49a58', note: 'A little golden-hour glow.' }, clear: { name: 'Clear quartz', color: '#e5e3d6', note: 'Simple, luminous, and light.' } }
};
export const presets = {
  'Willow Weave': { ...defaults, design: 'willow', shape: 'triangle', strands: 7, feathers: true },
  'Sage Haven': { ...defaults, design: 'sage', shape: 'pentagon', strands: 1 },
  'Amber Hush': { ...defaults, design: 'amber', shape: 'rectangle', strands: 3, pendant: false, feathers: true },
  'Moon Woven': { ...defaults }
};
// Keep older shared links useful without adding extra collection designs.
export const legacyPresets = {
  'Desert Sun': { ...defaults, shape: 'circle', stone: 'amber', strands: 5, pattern: 'star' },
  'Lavender Haze': { ...defaults, shape: 'teardrop', stone: 'amethyst', frame: 'cotton', thread: 'blush', pattern: 'dense' }
};
export const presetNotes = { 'Willow Weave': 'Branches, beads & charms', 'Sage Haven': 'A quiet woodland keepsake', 'Amber Hush': 'Softly knotted leaves', 'Moon Woven': 'Earthy & grounding' };
export function normalizeConfig(input, savedName) {
  if (!input || typeof input !== 'object') return { ...defaults };
  const design = inferDesign(input, savedName);
  const out = { ...presets[collectionDesigns[design].name] };
  for (const key of ['frame', 'thread', 'stone']) if (Object.hasOwn(palettes[key], input[key])) out[key] = input[key];
  if (shapeOptions(out).some(option => option.value === input.shape)) out.shape = input.shape;
  if (['classic', 'dense', 'star'].includes(input.pattern)) out.pattern = input.pattern;
  if (Number.isInteger(input.strands) && input.strands >= 1 && input.strands <= 7) out.strands = input.strands;
  if (Number.isFinite(input.length)) out.length = Math.min(1.5, Math.max(0.7, input.length));
  for (const key of ['pendant', 'pebbles', 'feathers']) if (typeof input[key] === 'boolean') out[key] = input[key];
  return out;
}
export function readSaved(storage) {
  try {
    const parsed = JSON.parse(storage.getItem('moon-woven-designs') || '[]');
    return Array.isArray(parsed) ? parsed.filter(d => d && typeof d.id === 'string' && typeof d.name === 'string' && d.config).slice(0, 30).map(d => ({ ...d, config: normalizeConfig(d.config, d.name) })) : [];
  } catch { return []; }
}
