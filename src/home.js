import './home.css';

document.title = 'Urban Mynah — Walls Hold Stories';
document.querySelector('meta[name="description"]').content = 'Handcrafted décor, natural textures, and a story for every wall. Discover Moon Woven and the Forest Echos collection by Urban Mynah.';
document.querySelector('meta[name="theme-color"]').content = '#f3f0e7';

const asset = name => `/images/urban-mynah/${name}`;
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
const diagonalArrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const plus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M7 10h6m-3-3v6"/></svg>';
const soundIcon = muted => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z"/>${muted ? '<path d="m16 9 6 6m0-6-6 6"/>' : '<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'}</svg>`;
const studioLink = name => `/studio?preset=${encodeURIComponent(name)}`;
const collection = [
  { name: 'Willow Weave', slug: 'willow-weave', number: '01', description: 'Crossed branches, woven cotton and little wooden charms.', shapes: 'Original · Square', alt: 'Willow Weave: a triangular branch frame with a cotton web, red pendant, beads, wooden charms and tassels' },
  { name: 'Sage Haven', slug: 'sage-haven', number: '02', description: 'An open web, intersecting branches and a single trailing strand.', shapes: 'Original · Circle · Square · Triangle', alt: 'Sage Haven: five intersecting branches around a cotton web, with a single beaded hanging strand' },
  { name: 'Amber Hush', slug: 'amber-hush', number: '03', description: 'A warm branch frame, amber tones and soft cotton leaves.', shapes: 'Original rectangle', alt: 'Amber Hush: a rectangular branch frame with a woven web and three combed cotton leaves' },
  { name: 'Moon Woven', slug: 'moon-woven', number: '04', description: 'A little crescent, fine cotton and the quiet gleam of quartz.', shapes: 'Original crescent · Circle · Teardrop · Pentagon', alt: 'Moon Woven: a jute-wrapped crescent with a cotton web, rose-quartz point and three hanging strands' },
];
const releasePhotos = [
  { src: asset('moon-woven-on-wall-realistic.png'), label: 'Moon Woven at home', detail: 'A little story for your wall', alt: 'Moon Woven suspended from a small hook on a textured sage-green wall, with soft daylight shadows above a wooden console and cream ceramic vases' },
  { src: asset('moon-woven-poster.png'), label: 'The original design', detail: 'The complete piece · Design 04', alt: `${collection[3].alt}, on the original forest-green poster with its title and caption` },
  { src: asset('moon-woven-detail-weave.png'), label: 'Cotton thread', detail: 'Softness in the weave', alt: 'Moon Woven cotton-thread web detail with the original caption: the central woven web is made from cotton thread, creating a delicate contrast against the rugged wood' },
  { src: asset('moon-woven-detail-rose-quartz.png'), label: 'Rose quartz', detail: 'A gentle touch of pink', alt: 'Moon Woven rose-quartz pendant detail, with its original caption describing the pink stone as a symbol of love, compassion and emotional harmony' },
  { src: asset('moon-woven-detail-clear-quartz.png'), label: 'Clear quartz', detail: 'A little light in each strand', alt: 'Moon Woven clear-quartz hanging-strand detail, with its original caption describing clarity, balance and amplified intentions' },
  { src: asset('moon-woven-detail-pebbles.png'), label: 'Transparent pebbles', detail: 'Light-catching accents', alt: 'Moon Woven transparent-pebble frame detail, with its original caption describing smooth, light-catching accents symbolising clarity, calm and simplicity' },
  { src: asset('moon-woven-lifestyle.jpg'), label: 'In natural light', detail: 'Texture, colour and a little daylight', alt: 'Moon Woven against grass, with a hand beneath its three green bead strands and a pale pink pendant beside the crescent' },
];

const brand = `<img src="${asset('urban-mynah-logo.png')}" alt="Urban Mynah — walls hold stories" width="747" height="603">`;

document.querySelector('#app').innerHTML = `
<a class="um-skip" href="#main-content">Skip to content</a>
<header class="um-header">
  <a class="um-brand" href="/home" aria-label="Urban Mynah home">${brand}</a>
  <nav class="um-nav" aria-label="Main navigation"><a href="#latest-release">The latest</a><a href="#collection">The collection</a><a href="#our-story">Our story</a></nav>
  <a class="um-header-studio" href="/studio">Make it yours ${diagonalArrow}</a>
</header>
<main id="main-content">
  <section class="um-release" id="latest-release" aria-labelledby="release-title">
    <div class="um-release-copy">
      <p class="um-eyebrow"><span></span> THE LATEST RELEASE / NO. 04</p>
      <h1 id="release-title">Moon<br><em>Woven.</em></h1>
      <p class="um-release-phrase">Slow down.<br>Let the night tell its stories.</p>
      <p class="um-release-description">A crescent of natural texture, fine cotton and quartz. A gentle reminder to dream freely.</p>
      <a class="um-button" href="${studioLink('Moon Woven')}">Make Moon Woven yours ${arrow}</a>
      <a class="um-release-explore" href="#collection">Discover Forest Echos <span aria-hidden="true">↓</span></a>
      <p class="um-release-edition">FOREST ECHOS <span>—</span> A STORY IN FOUR PIECES</p>
    </div>
    <div class="um-release-gallery" role="region" aria-roledescription="carousel" aria-label="Moon Woven photographs" tabindex="0">
      <div class="um-release-photo">
        <button class="um-photo-open" type="button" data-open-release aria-label="Enlarge Moon Woven photograph">
          <img id="release-photo" src="${releasePhotos[0].src}" alt="${releasePhotos[0].alt}" width="1122" height="1402" fetchpriority="high">
        </button>
      </div>
      <div class="um-gallery-caption">
        <div><p id="release-photo-label">${releasePhotos[0].label}</p><span id="release-photo-detail">${releasePhotos[0].detail}</span></div>
        <div class="um-gallery-arrows"><button type="button" data-open-release-detail aria-label="Enlarge current Moon Woven photograph">${plus}</button><button type="button" data-release-prev aria-label="Previous Moon Woven photograph">${arrow}</button><span id="release-count" aria-live="polite" aria-atomic="true">01 / ${String(releasePhotos.length).padStart(2, '0')}</span><button type="button" data-release-next aria-label="Next Moon Woven photograph">${arrow}</button></div>
      </div>
      <div class="um-photo-thumbnails" aria-label="Choose a Moon Woven photograph">${releasePhotos.map((photo, index) => `<button type="button" data-release-photo="${index}" aria-label="Show ${photo.label}" aria-pressed="${index === 0}" aria-controls="release-photo"><img src="${photo.src}" alt="" width="100" height="100" loading="lazy"><span>${photo.label}</span></button>`).join('')}</div>
    </div>
  </section>

  <section class="um-collection um-section" id="collection" aria-labelledby="collection-title">
    <div class="um-section-heading"><div><p class="um-eyebrow">THE COLLECTION / 01—04</p><h2 id="collection-title">Forest <em>Echos.</em></h2></div><p>Four little ways to bring<br>a little nature home.</p></div>
    <div class="um-collection-grid">${collection.map(piece => `
      <article class="um-piece">
        <div class="um-piece-topline"><span>NO. ${piece.number}</span><span>${piece.number === '04' ? 'LATEST RELEASE' : 'FOREST ECHOS'}</span></div>
        <button class="um-piece-photo" type="button" data-open-piece="${piece.slug}" aria-label="Enlarge ${piece.name} photograph"><img src="${asset(piece.slug + '-poster.png')}" alt="${piece.alt}, shown in the original poster with its forest-green background" width="1280" height="1600" loading="lazy"><span class="um-piece-zoom">${plus}</span></button>
        <div class="um-piece-title"><h3><a href="${studioLink(piece.name)}">${piece.name}</a></h3><span>${piece.number}</span></div>
        <p class="um-piece-description">${piece.description}</p>
        <p class="um-piece-shapes"><span>Shape choices</span>${piece.shapes}</p>
        <a class="um-piece-customize" href="${studioLink(piece.name)}" aria-label="Customize ${piece.name}">Make it yours ${diagonalArrow}</a>
      </article>`).join('')}
    </div>
    <p class="um-collection-note">Keep the original you love, or explore the shapes chosen for each design.</p>
  </section>

  <section class="um-story" id="our-story" aria-labelledby="story-title">
    <div class="um-story-copy"><p class="um-eyebrow">HELLO, WE’RE URBAN MYNAH</p><h2 id="story-title">Every wall<br>deserves <em>a story.</em></h2><p>Ever looked at an empty wall and felt like something was missing? We did too.</p><p>That’s why Urban Mynah creates handcrafted décor that brings warmth, character, and a touch of nature into your home—because every wall deserves a story.</p><a class="um-text-link" href="https://www.instagram.com/urbanmynah/" target="_blank" rel="noopener noreferrer">A little more of our world ${diagonalArrow}</a><span class="um-story-signature">walls hold stories</span></div>
    <div class="um-story-film">
      <div class="um-story-video"><video id="story-animation" autoplay muted loop playsinline preload="metadata" poster="/media/urban-mynah/first-reel-poster.jpg" aria-label="Urban Mynah’s first reel: an animated person working at a computer"><source src="/media/urban-mynah/first-reel.mp4" type="video/mp4"><p><a href="https://www.instagram.com/urbanmynah/reel/DbaIrRTCD98/">Watch Urban Mynah’s first reel on Instagram.</a></p></video><button class="um-sound-toggle" type="button" aria-controls="story-animation" aria-label="Unmute animation">${soundIcon(true)}<span>Unmute</span></button></div>
    </div>
  </section>
</main>
<footer class="um-footer"><a class="um-brand" href="/home" aria-label="Urban Mynah home">${brand}</a><p>Made by hand.<br><em>Made for home.</em></p><div><a href="/studio">Enter the design studio ${diagonalArrow}</a><a class="um-instagram" href="https://www.instagram.com/urbanmynah/" target="_blank" rel="noopener noreferrer" aria-label="Urban Mynah on Instagram (opens in a new tab)">Instagram · @urbanmynah ${diagonalArrow}</a><span>© ${new Date().getFullYear()} Urban Mynah</span></div></footer>

<dialog class="um-lightbox" aria-labelledby="lightbox-title">
  <div class="um-lightbox-header"><div><p class="um-eyebrow">A CLOSER LOOK</p><h2 id="lightbox-title"></h2></div><button type="button" class="um-lightbox-close" aria-label="Close photograph viewer">Close <span aria-hidden="true">×</span></button></div>
  <div class="um-lightbox-stage" tabindex="0" aria-label="Enlarged photograph; scroll to explore when zoomed"><div class="um-lightbox-canvas"><img id="lightbox-photo" alt=""></div></div>
  <div class="um-lightbox-controls"><div class="um-viewer-navigation"><button type="button" data-viewer-prev aria-label="Previous photograph">${arrow}</button><span id="lightbox-count" aria-live="polite" aria-atomic="true"></span><button type="button" data-viewer-next aria-label="Next photograph">${arrow}</button></div><div class="um-viewer-zoom"><button type="button" data-zoom-out aria-label="Zoom out">−</button><span id="lightbox-zoom" aria-live="polite">100%</span><button type="button" data-zoom-in aria-label="Zoom in">+</button><button type="button" data-zoom-reset>Fit photo</button></div></div>
</dialog>`;

const storyAnimation = document.querySelector('#story-animation');
const soundToggle = document.querySelector('.um-sound-toggle');
function updateSoundToggle() {
  const action = storyAnimation.muted ? 'Unmute' : 'Mute';
  soundToggle.innerHTML = `${soundIcon(storyAnimation.muted)}<span>${action}</span>`;
  soundToggle.setAttribute('aria-label', `${action} animation`);
}
soundToggle.addEventListener('click', () => { storyAnimation.muted = !storyAnimation.muted; });
storyAnimation.addEventListener('volumechange', updateSoundToggle);

let releaseIndex = 0;
const releaseGallery = document.querySelector('.um-release-gallery');
function showReleasePhoto(index) {
  releaseIndex = (index + releasePhotos.length) % releasePhotos.length;
  const photo = releasePhotos[releaseIndex];
  const image = document.querySelector('#release-photo');
  image.src = photo.src;
  image.alt = photo.alt;
  document.querySelector('#release-photo-label').textContent = photo.label;
  document.querySelector('#release-photo-detail').textContent = photo.detail;
  document.querySelector('#release-count').textContent = `${String(releaseIndex + 1).padStart(2, '0')} / ${String(releasePhotos.length).padStart(2, '0')}`;
  document.querySelector('[data-open-release]').setAttribute('aria-label', `Enlarge ${photo.label} photograph`);
  document.querySelectorAll('[data-release-photo]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.releasePhoto) === releaseIndex)));
}
document.querySelector('[data-release-prev]').addEventListener('click', () => showReleasePhoto(releaseIndex - 1));
document.querySelector('[data-release-next]').addEventListener('click', () => showReleasePhoto(releaseIndex + 1));
document.querySelectorAll('[data-release-photo]').forEach(button => button.addEventListener('click', () => showReleasePhoto(Number(button.dataset.releasePhoto))));
releaseGallery.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showReleasePhoto(releaseIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});

const viewer = document.querySelector('.um-lightbox');
const viewerStage = document.querySelector('.um-lightbox-stage');
let viewerPhotos = [];
let viewerIndex = 0;
let zoom = 1;
let returnFocus;
function setZoom(value) {
  zoom = Math.max(1, Math.min(3, value));
  viewer.style.setProperty('--zoom', zoom);
  document.querySelector('#lightbox-zoom').textContent = `${Math.round(zoom * 100)}%`;
  document.querySelector('[data-zoom-out]').disabled = zoom === 1;
  document.querySelector('[data-zoom-in]').disabled = zoom === 3;
  viewerStage.scrollLeft = (viewerStage.scrollWidth - viewerStage.clientWidth) / 2;
  viewerStage.scrollTop = (viewerStage.scrollHeight - viewerStage.clientHeight) / 2;
}
function showViewerPhoto(index) {
  viewerIndex = (index + viewerPhotos.length) % viewerPhotos.length;
  const photo = viewerPhotos[viewerIndex];
  document.querySelector('#lightbox-photo').src = photo.zoomSrc || photo.src;
  document.querySelector('#lightbox-photo').alt = photo.alt;
  document.querySelector('#lightbox-title').textContent = photo.label;
  document.querySelector('#lightbox-count').textContent = `${viewerIndex + 1} / ${viewerPhotos.length}`;
  document.querySelector('[data-viewer-prev]').disabled = viewerPhotos.length < 2;
  document.querySelector('[data-viewer-next]').disabled = viewerPhotos.length < 2;
  setZoom(1);
}
function openViewer(photos, index = 0) {
  returnFocus = document.activeElement;
  viewerPhotos = photos;
  showViewerPhoto(index);
  viewer.showModal();
  document.body.classList.add('um-viewer-open');
  document.querySelector('.um-lightbox-close').focus();
}
document.querySelector('[data-open-release]').addEventListener('click', () => openViewer(releasePhotos, releaseIndex));
document.querySelector('[data-open-release-detail]').addEventListener('click', () => openViewer(releasePhotos, releaseIndex));
document.querySelectorAll('[data-open-piece]').forEach(button => button.addEventListener('click', () => {
  const piece = collection.find(item => item.slug === button.dataset.openPiece);
  if (piece.slug === 'moon-woven') return openViewer(releasePhotos, 1);
  openViewer([{ src: asset(piece.slug + '-poster.png'), label: piece.name, alt: `${piece.alt}, with its original poster background` }]);
}));
document.querySelector('.um-lightbox-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer.addEventListener('close', () => { document.body.classList.remove('um-viewer-open'); returnFocus?.focus(); });
document.querySelector('[data-viewer-prev]').addEventListener('click', () => showViewerPhoto(viewerIndex - 1));
document.querySelector('[data-viewer-next]').addEventListener('click', () => showViewerPhoto(viewerIndex + 1));
document.querySelector('[data-zoom-out]').addEventListener('click', () => setZoom(zoom - .5));
document.querySelector('[data-zoom-in]').addEventListener('click', () => setZoom(zoom + .5));
document.querySelector('[data-zoom-reset]').addEventListener('click', () => setZoom(1));
viewer.addEventListener('keydown', event => {
  if (zoom > 1 && event.target === viewerStage && event.key.startsWith('Arrow')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showViewerPhoto(viewerIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  } else if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoom(zoom + .5); }
  else if (event.key === '-') { event.preventDefault(); setZoom(zoom - .5); }
});
