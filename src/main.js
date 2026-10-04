import './style.css';
import { createStudio } from './scene.js';
import { defaults, palettes, presets, legacyPresets, presetNotes, shapes, collectionDesigns, designName, shapeOptions, pendantLabel, normalizeConfig, readSaved } from './config.js';

const icons = {
  moon: '<path d="M18.8 3.6A9 9 0 1 0 20.4 18 10 10 0 0 1 18.8 3.6Z"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  reset: '<path d="M4 9a8 8 0 1 1 0 7M4 3v6h6"/>',
  rotate: '<path d="M20 8c-2-5-14-5-16 0s2 9 8 9h8m-4-4 4 4-4 4"/>',
  inspect: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5m-13-10h5m-2.5-2.5v5"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  leaf: '<path d="M5 19C-2 7 11 3 21 3c0 12-5 19-13 13M4 21 16 9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  wind: '<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a2 2 0 1 0-2-2M4 16h9a3 3 0 1 1-3 3"/>',
  hand: '<path d="M5 12V8a2 2 0 0 1 4 0v4-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v6-3a2 2 0 0 1 4 0v6c0 4-3 7-7 7h-2c-3 0-5-3-7-5l-3-4a2 2 0 0 1 3-2l3 3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>'
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.moon}</svg>`;
function shapeIcon(shape, original = false) {
  const forestPaths = { triangle: '<path d="m10 45 26-39M38 45 10 6M3 38h42M14 28l20 10M34 28 14 38"/>', pentagon: '<path d="m2 24 32-22M14 2l32 24M5 13l10 33M43 13 33 46M7 38h34M24 13l14 20H10Z"/>', rectangle: '<path d="M3 17h42M3 36h42M14 11v31m20-31v31M14 17l10-10 10 10M14 17l20 19m0-19L14 36"/>' };
  const geometricPaths = {
    moon: '<path d="M34 5C0 5 0 42 34 42ZM34 5 14 24l20 18M8 15l26 18M8 32 34 14"/>',
    circle: '<circle cx="24" cy="24" r="18"/>',
    teardrop: '<path d="M24 3C20 12 7 21 7 30a17 17 0 0 0 34 0c0-9-13-18-17-27Z"/>',
    triangle: '<path d="m24 5 20 37H4Z"/>',
    pentagon: '<path d="m24 4 21 16-8 24H11L3 20Z"/>',
    rectangle: '<rect x="5" y="11" width="38" height="28"/>',
    square: '<rect x="6" y="6" width="36" height="36"/>'
  };
  const path = (original && forestPaths[shape]) || geometricPaths[shape];
  return `<svg viewBox="0 0 48 56" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">${path}<path d="M17 44v7m7-6v10m7-11v7"/></svg>`;
}
const requestedPreset = new URLSearchParams(window.location.search).get('preset');
const startingConfig = Object.hasOwn(presets, requestedPreset) ? presets[requestedPreset] : Object.hasOwn(legacyPresets, requestedPreset) ? legacyPresets[requestedPreset] : defaults;
let config = normalizeConfig(startingConfig), activeTab = 'design', rotating = false, pendantDetail = false, studio;
let lighting = 'studio', breeze = false;
let saved = [];
try { saved = readSaved(localStorage); } catch { /* Browser storage may be unavailable. */ }
const app = document.querySelector('#app');
app.innerHTML = `
<header class="site-header">
  <a class="brand" href="/home" aria-label="Urban Mynah home"><img class="studio-brand-image" src="/images/urban-mynah/urban-mynah-logo.png" alt="Urban Mynah — walls hold stories" /></a>
  <div class="header-center">The dream catcher studio</div>
  <button class="saved-button" id="open-saved">${icon('bookmark')}<span>My designs</span><span class="count" id="saved-count">${saved.length}</span></button>
</header>
<main>
  <section class="intro"><div><div class="eyebrow"><span></span> MADE OF NATURE. MADE BY YOU.</div><h1>Weave a little <em>wonder.</em></h1></div><p>A shape, a stone, a little intention.<br>Make a dream catcher that feels like you.</p></section>
  <section class="studio" aria-label="Dream catcher design studio">
    <aside class="customizer">
      <div class="panel-heading"><h2>Make it yours</h2><button id="reset-design" class="text-button" title="Reset this design">${icon('reset')} Reset</button></div>
      <div class="tabs" role="tablist" aria-label="Customizer"><button id="design-tab" role="tab" aria-selected="true" aria-controls="panel-content">Customize</button><button id="details-tab" role="tab" aria-selected="false" aria-controls="panel-content" tabindex="-1">Your design <span>↗</span></button></div>
      <div class="panel-content" id="panel-content" role="tabpanel" aria-labelledby="design-tab"></div>
      <div class="save-area"><button class="primary-button" id="save-design">${icon('bookmark')} Save my design ${icon('arrow')}</button><p>Your little creation, saved on this device.</p></div>
    </aside>
    <div class="preview">
      <div class="preview-stage">
      <div class="preview-top"><div class="preview-label"><span class="live-dot"></span> LIVE 3D PREVIEW</div><div class="preview-actions"><button class="detail-button" id="inspect-pendant" aria-pressed="false">${icon('inspect')}<span>Inspect pendant</span></button><button class="icon-button" id="take-photo" aria-label="Download preview image" title="Download preview image">${icon('download')}</button></div></div>
      <div class="scene" id="scene"></div>
      <div class="scene-caption"><span class="tiny-star">✧</span><div>Thoughtfully chosen.<br><em>Uniquely yours.</em></div></div>
      <div class="preview-bottom"><div class="object-name"><span id="object-title">Moon Woven</span><span id="object-subtitle">NATURAL JUTE · GREEN AVENTURINE</span></div><div class="view-tools"><button id="auto-rotate" class="icon-button" aria-label="Auto rotate" aria-pressed="false" title="Auto rotate">${icon('rotate')}</button><span class="tool-divider"></span><button id="zoom-out" class="icon-button" aria-label="Zoom out">${icon('minus')}</button><button id="zoom-in" class="icon-button" aria-label="Zoom in">${icon('plus')}</button><span class="tool-divider"></span><button id="reset-view" class="icon-button" aria-label="Fit whole piece" title="Fit whole piece">${icon('reset')}</button></div></div>
      <div class="gesture-hint"><span>↔</span> Drag to explore <span class="hint-dot">·</span> Scroll to get closer</div>
      </div>
      <section class="atmosphere" aria-label="Preview atmosphere">
        <div class="atmosphere-heading"><h3>Set the mood</h3><span>Just for the preview</span></div>
        <div class="atmosphere-options">
          <div class="atmosphere-field"><span class="atmosphere-label" id="light-label">${icon('sun')} Lighting</span><div class="atmosphere-segmented" role="group" aria-labelledby="light-label">${[['studio', 'Studio'], ['daylight', 'Daylight'], ['evening', 'Evening']].map(([key, label]) => `<button data-lighting="${key}" aria-pressed="${key === 'studio'}">${label}</button>`).join('')}</div></div>
          <div class="atmosphere-field"><span class="atmosphere-label" id="air-label">${icon('wind')} Air</span><div class="atmosphere-segmented" role="group" aria-labelledby="air-label"><button data-breeze="off" aria-pressed="true">Still</button><button data-breeze="on" aria-pressed="false" aria-describedby="atmosphere-note">Gentle breeze</button></div></div>
        </div>
        <p class="atmosphere-note" id="atmosphere-note" role="status">See your piece in a different light.</p>
      </section>
    </div>
  </section>
  <section class="below-studio" aria-label="Forest Echos collection"><div class="presets-label"><span class="eyebrow">FOREST ECHOS</span><h3>Choose your design.</h3></div><div class="preset-list">${Object.entries(presets).map(([name, c], i) => `<button class="preset ${c.design === config.design ? 'selected' : ''}" data-preset="${name}" aria-pressed="${c.design === config.design}"><span class="preset-art preset-${i}">${shapeIcon(c.shape, true)}</span><span><strong>${name}</strong><small>${presetNotes[name]}</small></span><span class="preset-check">${icon('check')}</span></button>`).join('')}</div></section>
  <footer class="studio-footer"><span>${icon('leaf')} Inspired by nature. Finished by your imagination.</span><div class="studio-footer-links"><span class="footer-note">A small ritual of making something your own.</span><a class="footer-instagram" href="https://www.instagram.com/urbanmynah/" target="_blank" rel="noopener noreferrer" aria-label="Urban Mynah on Instagram (opens in a new tab)">Instagram · @urbanmynah</a></div></footer>
</main>
<dialog id="saved-dialog" aria-labelledby="saved-title"><div class="dialog-heading"><div><span class="eyebrow">YOUR PERSONAL COLLECTION</span><h2 id="saved-title">My designs</h2></div><button class="icon-button" id="close-saved" aria-label="Close saved designs">${icon('close')}</button></div><div id="saved-list"></div></dialog>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;

function swatches(type) {
  return `<div class="swatches ${type === 'stone' ? 'stone-swatches' : ''}" role="group" aria-label="${type} color">${Object.entries(palettes[type]).map(([key, p]) => `<button class="swatch ${config[type] === key ? 'selected' : ''}" data-type="${type}" data-value="${key}" style="--swatch:${p.color}" aria-label="${p.name}" aria-pressed="${config[type] === key}" title="${p.name}">${config[type] === key ? icon('check') : ''}</button>`).join('')}</div>`;
}
function renderShapeOptions() {
  const options = shapeOptions(config);
  if (options.length === 1) return `<div class="fixed-shape">${shapeIcon(config.shape, true)}<div><strong>Original design</strong><span>Fixed frame · ${designName(config)}</span></div>${icon('check')}</div><p class="shape-note">The original frame preserves its knotted-leaf composition.</p>`;
  return `<div class="shape-options" role="group" aria-label="Frame shape for ${designName(config)}">${options.map(({value, label, original}) => `<button class="shape-option ${config.shape === value ? 'selected' : ''}" data-type="shape" data-value="${value}" aria-pressed="${config.shape === value}">${shapeIcon(value, original)}<span>${label}</span></button>`).join('')}</div>`;
}
function renderPanel() {
  const panel = document.querySelector('#panel-content');
  if (activeTab === 'details') {
    panel.innerHTML = `<div class="design-summary"><span class="eyebrow">FOREST ECHOS · YOUR DESIGN</span><h3>${designName(config)}</h3><p>Every choice makes it a little more you.</p><dl>${[
      ['Frame shape', config.shape === collectionDesigns[config.design].originalShape ? 'Original design' : shapes[config.shape]],
      ['Frame finish', palettes.frame[config.frame].name], ['Weave', `${config.pattern[0].toUpperCase() + config.pattern.slice(1)} · ${palettes.thread[config.thread].name}`], ['Gemstones', palettes.stone[config.stone].name], ['Hanging strands', `${config.strands} · ${Math.round(config.length * 100)}% length`], [pendantLabel(config), config.pendant ? 'Included' : 'None'], ['Quartz accents', config.pebbles ? 'Included' : 'None'], ...(isForest() ? [['Cotton leaves & tassels', config.feathers ? 'Included' : 'None']] : [])
    ].map(([label, val]) => `<div><dt>${label}</dt><dd>${val}</dd></div>`).join('')}</dl><button class="secondary-button" id="download-spec">${icon('download')} Download design</button><p class="summary-note">Your design is a visual concept. Download it to share your choices with a maker. Saving does not place an order.</p></div>`;
    document.querySelector('#download-spec').onclick = downloadSpec;
    return;
  }
  panel.innerHTML = `
    <section class="control-section"><div class="section-label"><h3><span>01</span> The foundation</h3></div><p class="design-context">${designName(config)}</p>${renderShapeOptions()}<div class="field-title"><span>Frame finish</span><span>${palettes.frame[config.frame].name}</span></div>${swatches('frame')}</section>
    <section class="control-section"><div class="section-label"><h3><span>02</span> The weave</h3><span class="material-note">Cotton thread</span></div><div class="segmented" role="group" aria-label="Weave pattern">${['classic','dense','star'].map(p => `<button data-type="pattern" data-value="${p}" class="${config.pattern === p ? 'selected' : ''}" aria-pressed="${config.pattern === p}">${p === 'dense' ? 'Intricate' : p[0].toUpperCase() + p.slice(1)}</button>`).join('')}</div><div class="field-title"><span>Thread color</span><span>${palettes.thread[config.thread].name}</span></div>${swatches('thread')}</section>
    <section class="control-section"><div class="section-label"><h3><span>03</span> A touch of stone</h3></div>${swatches('stone')}<div class="stone-name">${palettes.stone[config.stone].name}</div><p class="stone-note">${palettes.stone[config.stone].note}</p></section>
    <section class="control-section"><div class="section-label"><h3><span>04</span> The finishing touches</h3></div><div class="field-title range-title"><label for="strands">Hanging strands</label><output for="strands" id="strands-value">${config.strands}</output></div><input id="strands" type="range" min="1" max="7" step="1" value="${config.strands}" style="--progress:${(config.strands - 1) / 6 * 100}%"><div class="range-ends"><span>Less</span><span>More</span></div><div class="field-title"><label for="length">Strand length</label><output id="length-value" for="length">${Math.round(config.length * 100)}%</output></div><input id="length" type="range" min="70" max="150" step="5" value="${Math.round(config.length * 100)}" style="--progress:${(config.length - 0.7) / 0.8 * 100}%"><label class="toggle-row"><span>${pendantLabel(config)}</span><input type="checkbox" id="pendant" ${config.pendant ? 'checked' : ''}><span class="toggle" aria-hidden="true"></span></label><label class="toggle-row"><span>Clear quartz accents</span><input type="checkbox" id="pebbles" ${config.pebbles ? 'checked' : ''}><span class="toggle" aria-hidden="true"></span></label>${isForest() ? `<label class="toggle-row"><span>Cotton leaves & tassels</span><input type="checkbox" id="feathers" ${config.feathers ? 'checked' : ''}><span class="toggle" aria-hidden="true"></span></label>` : ''}</section>`;
}
function updateMeta() {
  if (!config.pendant) pendantDetail = false;
  syncViewState();
  document.querySelectorAll('[data-preset]').forEach(button => {
    const selected = presets[button.dataset.preset].design === config.design;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected);
  });
  document.querySelector('#reset-design').title = `Reset to the original ${designName(config)}`;
}
function syncViewState() {
  const button = document.querySelector('#inspect-pendant');
  button.disabled = !config.pendant || !studio;
  button.setAttribute('aria-pressed', pendantDetail);
  button.querySelector('span').textContent = pendantDetail ? 'View whole piece' : 'Inspect pendant';
  document.querySelector('.preview').classList.toggle('detail-view', pendantDetail);
  document.querySelector('#object-title').textContent = pendantDetail ? pendantLabel(config).replace(' pendant', '') : designName(config);
  document.querySelector('#object-subtitle').textContent = pendantDetail ? 'Facets, inclusions & silver' : `${palettes.frame[config.frame].name} · ${palettes.stone[config.stone].name}`;
  syncAtmosphere();
}
function syncAtmosphere() {
  const reduced = Boolean(studio?.reducedMotion);
  if (reduced) { breeze = false; rotating = false; }
  document.querySelectorAll('[data-lighting]').forEach(button => {
    button.setAttribute('aria-pressed', button.dataset.lighting === lighting);
    button.disabled = !studio;
  });
  document.querySelectorAll('[data-breeze]').forEach(button => {
    button.setAttribute('aria-pressed', (button.dataset.breeze === 'on') === breeze);
    button.disabled = !studio || (reduced && button.dataset.breeze === 'on');
  });
  const rotateButton = document.querySelector('#auto-rotate');
  rotateButton.disabled = !studio || reduced;
  rotateButton.setAttribute('aria-pressed', rotating);
  rotateButton.title = reduced ? 'Auto rotation is off for reduced motion' : 'Auto rotate';
  document.querySelector('#atmosphere-note').textContent = !studio ? 'Atmosphere is available when the 3D preview loads.'
    : reduced ? 'Motion is off to respect your reduced-motion preference.'
    : breeze && pendantDetail ? 'Breeze paused while you inspect the pendant.'
    : breeze ? 'A soft sway, from the frame to the hanging stones.'
    : 'See your piece in a different light.';
}
function setDetailView(enabled) {
  if (enabled) pendantDetail = Boolean(studio?.focusPendant());
  else { studio?.resetView(); pendantDetail = false; }
  syncViewState();
}
function isForest() { return collectionDesigns[config.design].forest; }
function updateConfig(key, value, rerender = true) {
  config = normalizeConfig({ ...config, [key]: value });
  studio?.rebuild(config); updateMeta();
  if (rerender) {
    renderPanel();
    document.querySelector(`[data-type="${key}"][data-value="${value}"]`)?.focus({ preventScroll: true });
  }
}
function toast(message) {
  const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 3500);
}
function download(href, filename) {
  const link = document.createElement('a'); link.href = href; link.download = filename; link.click();
}
function downloadSpec() {
  const data = { brand: 'Urban Mynah', collection: 'Forest Echos', version: 2, name: designName(config), savedAt: new Date().toISOString(), config, materials: { frame: palettes.frame[config.frame].name, thread: palettes.thread[config.thread].name, stone: palettes.stone[config.stone].name }, note: 'Design concept only. This is not an order.' };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  download(url, 'urban-mynah-design.json'); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Your design file is ready to share.');
}
function setTab(tab) {
  activeTab = tab;
  for (const name of ['design', 'details']) { const btn = document.querySelector(`#${name}-tab`); btn.setAttribute('aria-selected', name === tab); btn.tabIndex = name === tab ? 0 : -1; }
  document.querySelector('#panel-content').setAttribute('aria-labelledby', `${tab}-tab`);
  renderPanel();
}
document.querySelector('#design-tab').onclick = () => setTab('design');
document.querySelector('#details-tab').onclick = () => setTab('details');
document.querySelector('.tabs').onkeydown = (e) => {
  if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) { e.preventDefault(); setTab(activeTab === 'design' ? 'details' : 'design'); document.querySelector(`#${activeTab}-tab`).focus(); }
};
document.querySelector('#panel-content').addEventListener('click', e => {
  const button = e.target.closest('[data-type]'); if (button) updateConfig(button.dataset.type, button.dataset.value);
});
document.querySelector('#panel-content').addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'strands' || el.id === 'length') {
    const value = Number(el.value); updateConfig(el.id, el.id === 'length' ? value / 100 : value, false);
    document.querySelector(`#${el.id}-value`).textContent = el.id === 'length' ? `${value}%` : value;
    el.style.setProperty('--progress', `${(value - Number(el.min)) / (Number(el.max) - Number(el.min)) * 100}%`);
  }
  if (['pendant', 'pebbles', 'feathers'].includes(el.id)) updateConfig(el.id, el.checked, false);
});
document.querySelectorAll('[data-preset]').forEach(button => button.onclick = () => {
  config = { ...presets[button.dataset.preset] }; studio?.rebuild(config); renderPanel(); updateMeta(); toast(`${designName(config)} is your new starting point.`);
});
document.querySelector('#reset-design').onclick = () => { config = { ...presets[designName(config)] }; studio?.rebuild(config); setDetailView(false); renderPanel(); updateMeta(); toast(`Back to the original ${designName(config)}.`); };
document.querySelector('#reset-view').onclick = () => setDetailView(false);
document.querySelector('#inspect-pendant').onclick = () => setDetailView(!pendantDetail);
document.querySelector('#zoom-in').onclick = () => studio?.zoom(pendantDetail ? -0.14 : -0.7);
document.querySelector('#zoom-out').onclick = () => studio?.zoom(pendantDetail ? 0.14 : 0.7);
document.querySelector('#auto-rotate').onclick = (e) => { rotating = !rotating; studio?.setRotate(rotating); e.currentTarget.setAttribute('aria-pressed', rotating); };
document.querySelectorAll('[data-lighting]').forEach(button => button.onclick = () => {
  lighting = button.dataset.lighting;
  studio?.setLighting(lighting);
  syncAtmosphere();
});
document.querySelectorAll('[data-breeze]').forEach(button => button.onclick = () => {
  breeze = button.dataset.breeze === 'on';
  studio?.setBreeze(breeze);
  syncAtmosphere();
});
document.querySelector('#take-photo').onclick = () => { if (studio) { download(studio.screenshot(), 'urban-mynah-preview.png'); toast('A little snapshot of your creation.'); } };
document.querySelector('#save-design').onclick = () => {
  const entry = { id: crypto.randomUUID(), name: designName(config), config: { ...config }, date: new Date().toISOString() };
  const next = [entry, ...saved].slice(0, 30);
  try { localStorage.setItem('moon-woven-designs', JSON.stringify(next)); saved = next; document.querySelector('#saved-count').textContent = saved.length; toast('Saved to My designs. Make another, or keep dreaming.'); }
  catch { toast('This browser couldn’t save your design. Download it from Your design instead.'); }
};
const dialog = document.querySelector('#saved-dialog');
function renderSaved() {
  const list = document.querySelector('#saved-list'); list.replaceChildren();
  if (!saved.length) { list.innerHTML = `<div class="empty-state">${icon('moon')}<h3>A little space for your dreams.</h3><p>Save a creation and it will be waiting here.<br>Your designs stay on this device.</p></div>`; return; }
  saved.forEach(entry => {
    const row = document.createElement('div'); row.className = 'saved-row';
    row.innerHTML = `<span class="saved-art">${shapeIcon(entry.config.shape, entry.config.shape === collectionDesigns[entry.config.design].originalShape)}</span><div class="saved-copy"><strong></strong><small></small></div><button class="text-button load-design">Open</button><button class="icon-button delete-design" aria-label="Delete saved design">${icon('close')}</button>`;
    row.querySelector('strong').textContent = entry.name;
    row.querySelector('small').textContent = `${designName(entry.config)} · ${shapes[entry.config.shape]} · ${palettes.stone[entry.config.stone].name}`;
    row.querySelector('.load-design').onclick = () => { config = normalizeConfig(entry.config, entry.name); studio?.rebuild(config); updateMeta(); renderPanel(); dialog.close(); toast('Your saved design is back in the studio.'); };
    row.querySelector('.delete-design').onclick = () => {
      const next = saved.filter(d => d.id !== entry.id);
      try { localStorage.setItem('moon-woven-designs', JSON.stringify(next)); saved = next; document.querySelector('#saved-count').textContent = saved.length; renderSaved(); toast('Saved design removed.'); } catch { toast('Couldn’t update saved designs. Please try again.'); }
    };
    list.append(row);
  });
}
document.querySelector('#open-saved').onclick = () => { renderSaved(); dialog.showModal(); };
document.querySelector('#close-saved').onclick = () => dialog.close();
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
renderPanel();
updateMeta();
try { studio = createStudio(document.querySelector('#scene'), config, syncAtmosphere); updateMeta(); }
catch (error) {
  console.error('3D preview unavailable', error);
  document.querySelector('#scene').innerHTML = '<div class="webgl-error"><h3>Your 3D preview couldn’t load.</h3><p>Refresh to try again, or use a browser with WebGL enabled. You can still customize, save, and download your design choices.</p></div>';
  for (const id of ['take-photo','zoom-in','zoom-out','auto-rotate','reset-view','inspect-pendant']) document.getElementById(id).disabled = true;
  syncAtmosphere();
}
window.addEventListener('pagehide', event => { if (!event.persisted) studio?.dispose(); });
