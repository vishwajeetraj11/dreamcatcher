export const defaults = Object.freeze({ shape: 'moon', frame: 'jute', thread: 'ivory', pattern: 'classic', stone: 'jade', strands: 3, length: 1, pendant: true, pebbles: true });
export const palettes = {
  frame: { jute: { name: 'Natural jute', color: '#b89870' }, walnut: { name: 'Dark walnut', color: '#665044' }, cotton: { name: 'Ivory cotton', color: '#e4d9bf' } },
  thread: { ivory: { name: 'Ivory', color: '#f2e7cd' }, sage: { name: 'Sage', color: '#9da987' }, blush: { name: 'Blush', color: '#caa49b' }, charcoal: { name: 'Charcoal', color: '#5c5c55' } },
  stone: { jade: { name: 'Green aventurine', color: '#a1c9b3', note: 'A little room for possibility.' }, rose: { name: 'Rose quartz', color: '#dfb5af', note: 'A gentle touch of warmth.' }, amethyst: { name: 'Amethyst', color: '#a99bb8', note: 'For your quiet, creative moments.' }, amber: { name: 'Honey amber', color: '#c49a58', note: 'A little golden-hour glow.' }, clear: { name: 'Clear quartz', color: '#e5e3d6', note: 'Simple, luminous, and light.' } }
};
export const presets = {
  'Moon Woven': { ...defaults },
  'Desert Sun': { ...defaults, shape: 'circle', stone: 'amber', frame: 'jute', strands: 5, pattern: 'star' },
  'Lavender Haze': { ...defaults, shape: 'teardrop', stone: 'amethyst', frame: 'cotton', thread: 'blush', strands: 3, pattern: 'dense' }
};
export function normalizeConfig(input) {
  const out = { ...defaults };
  if (!input || typeof input !== 'object') return out;
  for (const key of ['frame', 'thread', 'stone']) if (Object.hasOwn(palettes[key], input[key])) out[key] = input[key];
  if (['moon', 'circle', 'teardrop'].includes(input.shape)) out.shape = input.shape;
  if (['classic', 'dense', 'star'].includes(input.pattern)) out.pattern = input.pattern;
  if (Number.isInteger(input.strands) && input.strands >= 1 && input.strands <= 7) out.strands = input.strands;
  if (Number.isFinite(input.length)) out.length = Math.min(1.5, Math.max(0.7, input.length));
  for (const key of ['pendant', 'pebbles']) if (typeof input[key] === 'boolean') out[key] = input[key];
  return out;
}
export function readSaved(storage) {
  try {
    const parsed = JSON.parse(storage.getItem('moon-woven-designs') || '[]');
    return Array.isArray(parsed) ? parsed.filter(d => d && typeof d.id === 'string' && typeof d.name === 'string' && d.config).slice(0, 30).map(d => ({ ...d, config: normalizeConfig(d.config) })) : [];
  } catch { return []; }
}
