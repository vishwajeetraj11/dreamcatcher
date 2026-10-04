import './style.css';
import { createStudio } from './scene.js';
import { defaults, palettes, presets, normalizeConfig, readSaved } from './config.js';

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
  hand: '<path d="M5 12V8a2 2 0 0 1 4 0v4-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v6-3a2 2 0 0 1 4 0v6c0 4-3 7-7 7h-2c-3 0-5-3-7-5l-3-4a2 2 0 0 1 3-2l3 3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>'
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.moon}</svg>`;
function shapeIcon(shape) {
  const path = shape === 'moon' ? '<path d="M34 5C0 5 0 42 34 42ZM34 5 14 24l20 18M8 15l26 18M8 32 34 14"/>' : shape === 'circle' ? '<circle cx="24" cy="23" r="18"/><path d="m24 5 11 32L6 17h36L13 37Z"/>' : '<path d="M24 3C20 12 7 21 7 30a17 17 0 0 0 34 0c0-9-13-18-17-27ZM24 3v44M9 24l28 15M39 24 11 39"/>';
  return `<svg viewBox="0 0 48 56" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">${path}<path d="M17 44v7m7-6v10m7-11v7"/></svg>`;
}
let config = { ...defaults }, activePreset = 'Moon Woven', activeTab = 'design', rotating = false, pendantDetail = false, studio;
let saved = [];
try { saved = readSaved(localStorage); } catch { /* Browser storage may be unavailable. */ }
const app = document.querySelector('#app');
app.innerHTML = `
<header class="site-header">
  <a class="brand" href="./" aria-label="Moon Woven home"><span class="brand-symbol">${icon('moon')}</span><span>moon woven<span class="brand-tag">OBJECTS FOR YOUR QUIET MOMENTS</span></span></a>
  <div class="header-center">The dream catcher studio</div>
  <button class="saved-button" id="open-saved">${icon('bookmark')}<span>My designs</span><span class="count" id="saved-count">${saved.length}</span></button>
</header>
<main>
  <section class="intro"><div><div class="eyebrow"><span></span> MADE OF NATURE. MADE BY YOU.</div><h1>Weave a little <em>wonder.</em></h1></div><p>A shape, a stone, a little intention.<br>Make a dream catcher that feels like you.</p></section>
  <section class="studio" aria-label="Dream catcher design studio">
    <aside class="customizer">
      <div class="panel-heading"><h2>Make it yours</h2><button id="reset-design" class="text-button" title="Reset to Moon Woven">${icon('reset')} Reset</button></div>
      <div class="tabs" role="tablist" aria-label="Customizer"><button id="design-tab" role="tab" aria-selected="true" aria-controls="panel-content">Customize</button><button id="details-tab" role="tab" aria-selected="false" aria-controls="panel-content" tabindex="-1">Your design <span>↗</span></button></div>
      <div class="panel-content" id="panel-content" role="tabpanel" aria-labelledby="design-tab"></div>
      <div class="save-area"><button class="primary-button" id="save-design">${icon('bookmark')} Save my design ${icon('arrow')}</button><p>Your little creation, saved on this device.</p></div>
    </aside>
    <div class="preview">
      <div class="preview-top"><div class="preview-label"><span class="live-dot"></span> LIVE 3D PREVIEW</div><div class="preview-actions"><button class="detail-button" id="inspect-pendant" aria-pressed="false">${icon('inspect')}<span>Inspect pendant</span></button><button class="icon-button" id="take-photo" aria-label="Download preview image" title="Download preview image">${icon('download')}</button></div></div>
      <div class="scene" id="scene"></div>
      <div class="scene-caption"><span class="tiny-star">✧</span><div>Thoughtfully chosen.<br><em>Uniquely yours.</em></div></div>
      <div class="preview-bottom"><div class="object-name"><span id="object-title">Moon Woven</span><span id="object-subtitle">NATURAL JUTE · GREEN AVENTURINE</span></div><div class="view-tools"><button id="auto-rotate" class="icon-button" aria-label="Auto rotate" aria-pressed="false" title="Auto rotate">${icon('rotate')}</button><span class="tool-divider"></span><button id="zoom-out" class="icon-button" aria-label="Zoom out">${icon('minus')}</button><button id="zoom-in" class="icon-button" aria-label="Zoom in">${icon('plus')}</button><span class="tool-divider"></span><button id="reset-view" class="icon-button" aria-label="Reset camera" title="Reset camera">${icon('reset')}</button></div></div>
      <div class="gesture-hint"><span>↔</span> Drag to explore <span class="hint-dot">·</span> Scroll to get closer</div>
    </div>
  </section>
  <section class="below-studio"><div class="presets-label"><span class="eyebrow">A LITTLE INSPIRATION</span><h3>Start with a feeling.</h3></div><div class="preset-list">${Object.entries(presets).map(([name, c], i) => `<button class="preset ${i === 0 ? 'selected' : ''}" data-preset="${name}" aria-pressed="${i === 0}"><span class="preset-art preset-${i}">${shapeIcon(c.shape)}</span><span><strong>${name}</strong><small>${['Earthy & grounding', 'Warm & free-spirited', 'Soft & a little dreamy'][i]}</small></span><span class="preset-check">${icon('check')}</span></button>`).join('')}</div></section>
  <footer><span>${icon('leaf')} Inspired by nature. Finished by your imagination.</span><span>A small ritual of making something your own.</span></footer>
</main>
<dialog id="saved-dialog" aria-labelledby="saved-title"><div class="dialog-heading"><div><span class="eyebrow">YOUR PERSONAL COLLECTION</span><h2 id="saved-title">My designs</h2></div><button class="icon-button" id="close-saved" aria-label="Close saved designs">${icon('close')}</button></div><div id="saved-list"></div></dialog>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;

function swatches(type) {
  return `<div class="swatches ${type === 'stone' ? 'stone-swatches' : ''}" role="group" aria-label="${type} color">${Object.entries(palettes[type]).map(([key, p]) => `<button class="swatch ${config[type] === key ? 'selected' : ''}" data-type="${type}" data-value="${key}" style="--swatch:${p.color}" aria-label="${p.name}" aria-pressed="${config[type] === key}" title="${p.name}">${config[type] === key ? icon('check') : ''}</button>`).join('')}</div>`;
}
function renderPanel() {
  const panel = document.querySelector('#panel-content');
  if (activeTab === 'details') {
    panel.innerHTML = `<div class="design-summary"><span class="eyebrow">YOUR ONE-OF-A-KIND PIECE</span><h3>${activePreset || 'Your own kind of magic'}</h3><p>Every choice makes it a little more you.</p><dl>${[
      ['Frame shape', { moon: 'Crescent moon', circle: 'Full circle', teardrop: 'Teardrop' }[config.shape]],
      ['Frame finish', palettes.frame[config.frame].name], ['Weave', `${config.pattern[0].toUpperCase() + config.pattern.slice(1)} · ${palettes.thread[config.thread].name}`], ['Gemstones', palettes.stone[config.stone].name], ['Hanging strands', `${config.strands} · ${Math.round(config.length * 100)}% length`], ['Rose quartz pendant', config.pendant ? 'Included' : 'None'], ['Quartz accents', config.pebbles ? 'Included' : 'None']
    ].map(([label, val]) => `<div><dt>${label}</dt><dd>${val}</dd></div>`).join('')}</dl><button class="secondary-button" id="download-spec">${icon('download')} Download design</button><p class="summary-note">Your design is a visual concept. Download it to share your choices with a maker. Saving does not place an order.</p></div>`;
    document.querySelector('#download-spec').onclick = downloadSpec;
    return;
  }
  panel.innerHTML = `
    <section class="control-section"><div class="section-label"><h3><span>01</span> The foundation</h3></div><div class="shape-options" role="group" aria-label="Frame shape">${[['moon','Crescent'],['circle','Circle'],['teardrop','Teardrop']].map(([key,label]) => `<button class="shape-option ${config.shape === key ? 'selected' : ''}" data-type="shape" data-value="${key}" aria-pressed="${config.shape === key}">${shapeIcon(key)}<span>${label}</span></button>`).join('')}</div><div class="field-title"><span>Frame finish</span><span>${palettes.frame[config.frame].name}</span></div>${swatches('frame')}</section>
    <section class="control-section"><div class="section-label"><h3><span>02</span> The weave</h3><span class="material-note">Cotton thread</span></div><div class="segmented" role="group" aria-label="Weave pattern">${['classic','dense','star'].map(p => `<button data-type="pattern" data-value="${p}" class="${config.pattern === p ? 'selected' : ''}" aria-pressed="${config.pattern === p}">${p === 'dense' ? 'Intricate' : p[0].toUpperCase() + p.slice(1)}</button>`).join('')}</div><div class="field-title"><span>Thread color</span><span>${palettes.thread[config.thread].name}</span></div>${swatches('thread')}</section>
    <section class="control-section"><div class="section-label"><h3><span>03</span> A touch of stone</h3></div>${swatches('stone')}<div class="stone-name">${palettes.stone[config.stone].name}</div><p class="stone-note">${palettes.stone[config.stone].note}</p></section>
    <section class="control-section"><div class="section-label"><h3><span>04</span> The finishing touches</h3></div><div class="field-title range-title"><label for="strands">Hanging strands</label><output for="strands" id="strands-value">${config.strands}</output></div><input id="strands" type="range" min="1" max="7" step="1" value="${config.strands}" style="--progress:${(config.strands - 1) / 6 * 100}%"><div class="range-ends"><span>Less</span><span>More</span></div><div class="field-title"><label for="length">Strand length</label><output id="length-value" for="length">${Math.round(config.length * 100)}%</output></div><input id="length" type="range" min="70" max="150" step="5" value="${Math.round(config.length * 100)}" style="--progress:${(config.length - 0.7) / 0.8 * 100}%"><label class="toggle-row"><span>Rose quartz pendant</span><input type="checkbox" id="pendant" ${config.pendant ? 'checked' : ''}><span class="toggle" aria-hidden="true"></span></label><label class="toggle-row"><span>Clear quartz accents</span><input type="checkbox" id="pebbles" ${config.pebbles ? 'checked' : ''}><span class="toggle" aria-hidden="true"></span></label></section>`;
}
function updateMeta() {
  if (!config.pendant) pendantDetail = false;
  syncViewState();
  document.querySelectorAll('[data-preset]').forEach(button => {
    const selected = button.dataset.preset === activePreset;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected);
  });
}
function syncViewState() {
  const button = document.querySelector('#inspect-pendant');
  button.disabled = !config.pendant || !studio;
  button.setAttribute('aria-pressed', pendantDetail);
  button.querySelector('span').textContent = pendantDetail ? 'View whole piece' : 'Inspect pendant';
  document.querySelector('.preview').classList.toggle('detail-view', pendantDetail);
  document.querySelector('#object-title').textContent = pendantDetail ? 'Rose quartz' : activePreset || 'Your custom creation';
  document.querySelector('#object-subtitle').textContent = pendantDetail ? 'Facets, inclusions & silver' : `${palettes.frame[config.frame].name} · ${palettes.stone[config.stone].name}`;
}
function setDetailView(enabled) {
  if (enabled) pendantDetail = Boolean(studio?.focusPendant());
  else { studio?.resetView(); pendantDetail = false; }
  syncViewState();
}
function updateConfig(key, value, rerender = true) {
  config = normalizeConfig({ ...config, [key]: value }); activePreset = '';
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
  const data = { brand: 'Moon Woven', version: 1, name: activePreset || 'My dream catcher', savedAt: new Date().toISOString(), config, materials: { frame: palettes.frame[config.frame].name, thread: palettes.thread[config.thread].name, stone: palettes.stone[config.stone].name }, note: 'Design concept only. This is not an order.' };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  download(url, 'moon-woven-design.json'); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Your design file is ready to share.');
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
  if (['pendant', 'pebbles'].includes(el.id)) updateConfig(el.id, el.checked, false);
});
document.querySelectorAll('[data-preset]').forEach(button => button.onclick = () => {
  activePreset = button.dataset.preset; config = { ...presets[activePreset] }; studio?.rebuild(config); renderPanel(); updateMeta(); toast(`${activePreset} is your new starting point.`);
});
document.querySelector('#reset-design').onclick = () => { config = { ...defaults }; activePreset = 'Moon Woven'; studio?.rebuild(config); setDetailView(false); renderPanel(); updateMeta(); toast('Back to the original Moon Woven.'); };
document.querySelector('#reset-view').onclick = () => setDetailView(false);
document.querySelector('#inspect-pendant').onclick = () => setDetailView(!pendantDetail);
document.querySelector('#zoom-in').onclick = () => studio?.zoom(pendantDetail ? -0.14 : -0.7);
document.querySelector('#zoom-out').onclick = () => studio?.zoom(pendantDetail ? 0.14 : 0.7);
document.querySelector('#auto-rotate').onclick = (e) => { rotating = !rotating; studio?.setRotate(rotating); e.currentTarget.setAttribute('aria-pressed', rotating); };
document.querySelector('#take-photo').onclick = () => { if (studio) { download(studio.screenshot(), 'moon-woven-preview.png'); toast('A little snapshot of your creation.'); } };
document.querySelector('#save-design').onclick = () => {
  const entry = { id: crypto.randomUUID(), name: activePreset || `My dream catcher ${saved.length + 1}`, config: { ...config }, date: new Date().toISOString() };
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
    row.innerHTML = `<span class="saved-art">${shapeIcon(entry.config.shape)}</span><div class="saved-copy"><strong></strong><small></small></div><button class="text-button load-design">Open</button><button class="icon-button delete-design" aria-label="Delete saved design">${icon('close')}</button>`;
    row.querySelector('strong').textContent = entry.name;
    row.querySelector('small').textContent = `${palettes.stone[entry.config.stone].name} · ${entry.config.strands} strands`;
    row.querySelector('.load-design').onclick = () => { config = normalizeConfig(entry.config); activePreset = Object.keys(presets).find(name => JSON.stringify(presets[name]) === JSON.stringify(config)) || ''; studio?.rebuild(config); updateMeta(); renderPanel(); dialog.close(); toast('Your saved design is back in the studio.'); };
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
try { studio = createStudio(document.querySelector('#scene'), config); syncViewState(); }
catch (error) {
  console.error('3D preview unavailable', error);
  document.querySelector('#scene').innerHTML = '<div class="webgl-error"><h3>Your 3D preview couldn’t load.</h3><p>Refresh to try again, or use a browser with WebGL enabled. You can still customize, save, and download your design choices.</p></div>';
  for (const id of ['take-photo','zoom-in','zoom-out','auto-rotate','reset-view','inspect-pendant']) document.getElementById(id).disabled = true;
}
window.addEventListener('pagehide', event => { if (!event.persisted) studio?.dispose(); });
