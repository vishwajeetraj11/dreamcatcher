import './home.css';

document.title = 'Moon Woven — A Little Nature. A Little Wonder.';
document.querySelector('meta[name="description"]').content = 'A shape, a stone, a little intention. Explore nature-inspired dream catchers and make one your own in the Moon Woven 3D studio.';
document.querySelector('meta[name="theme-color"]').content = '#f5f2e9';

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
const diagonalArrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const moon = '<svg viewBox="0 0 42 48" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path d="M29 5A18 18 0 1 0 29 41 21 21 0 0 1 29 5Z"/><path d="m11 11 10 18L5 26l22 9M6 17l16 6-11 13" stroke-width=".6"/><path d="M14 41v5m7-3v5m6-7v5"/></svg>';
const star = '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width=".8" aria-hidden="true"><path d="M14 2c0 8-4 12-12 12 8 0 12 4 12 12 0-8 4-12 12-12-8 0-12-4-12-12Z"/></svg>';
const collection = [
  {name:'Moon Woven',slug:'moon-woven',tag:'THE ORIGINAL',mood:'Earthy. Gentle. Grounding.',material:'Jute · Cotton · Green aventurine',color:'#a1c9b3'},
  {name:'Desert Sun',slug:'desert-sun',tag:'A LITTLE GOLDEN HOUR',mood:'Warm. Wild. Free-spirited.',material:'Jute · Cotton · Honey amber',color:'#c49a58'},
  {name:'Lavender Haze',slug:'lavender-haze',tag:'THE SOFTER SIDE',mood:'Soft. Still. A little dreamy.',material:'Cotton · Blush thread · Amethyst',color:'#a99bb8'}
];

document.querySelector('#app').innerHTML = `
<a class="mw-skip" href="#main-content">Skip to content</a>
<div class="mw-announcement">OBJECTS FOR YOUR QUIET MOMENTS <span aria-hidden="true">✧</span> MADE PERSONAL BY YOU</div>
<header class="mw-header">
  <a class="mw-brand" href="/home" aria-label="Moon Woven home">${moon}<span>moon woven<small>A LITTLE CLOSER TO NATURE</small></span></a>
  <button class="mw-menu-toggle" aria-expanded="false" aria-controls="home-navigation"><span>Menu</span><span class="mw-menu-lines" aria-hidden="true"></span></button>
  <nav class="mw-nav" id="home-navigation" aria-label="Main navigation"><a href="#collection">The collection</a><a href="#materials">The materials</a><a href="#your-ritual">The little details</a></nav>
  <a class="mw-nav-cta" href="/studio">Enter the studio ${diagonalArrow}</a>
</header>
<main id="main-content">
  <section class="mw-hero" aria-labelledby="hero-title">
    <div class="mw-hero-copy">
      <p class="mw-eyebrow"><span class="mw-tiny-line"></span> NATURE, WITH A LITTLE INTENTION</p>
      <h1 id="hero-title">A little nature.<br>A little <em>wonder.</em><br>Entirely you.</h1>
      <p class="mw-hero-description">For the corner you call your own.<br> Dream catchers shaped by nature,<br> and finished by your imagination.</p>
      <a class="mw-button" href="/studio">Create your own ${arrow}</a>
      <a class="mw-text-link mw-hero-explore" href="#collection">Find your starting point <span aria-hidden="true">↓</span></a>
      <div class="mw-hero-footnote"><span class="mw-handwritten">a small piece of your world</span><span class="mw-drawn-arrow" aria-hidden="true">⤴</span></div>
    </div>
    <figure class="mw-hero-visual">
      <img class="mw-hero-image" src="/images/atelier-hero.jpg" srcset="/images/atelier-hero-small.jpg 640w, /images/atelier-hero.jpg 1024w" sizes="(max-width: 700px) 100vw, 52vw" width="1024" height="1536" fetchpriority="high" alt="A crescent dream catcher with a cotton web, jute frame and pale green stones in a sunlit corner">
      <figcaption><span>A ROOM TO IMAGINE</span><span>01 — THE QUIET CORNER</span></figcaption>
    </figure>
    <div class="mw-hero-index" aria-hidden="true">NATURAL TEXTURES. PERSONAL STORIES.</div>
  </section>
  <div class="mw-material-strip" aria-label="Our material palette"><span>Natural jute</span>${star}<span>Fine cotton webs</span>${star}<span>A touch of stone</span>${star}<span>Your own kind of beautiful</span></div>

  <section class="mw-collection mw-section" id="collection" aria-labelledby="collection-title">
    <div class="mw-section-heading" data-reveal><div><p class="mw-eyebrow">01 / THE STUDIO EDIT</p><h2 id="collection-title">Begin with a <em>feeling.</em></h2></div><p>Find a piece that speaks to you.<br>Every detail is just a starting point.</p></div>
    <div class="mw-collection-grid">${collection.map((piece,i)=>`
      <article class="mw-piece mw-piece-${i}" data-reveal>
        <a class="mw-piece-link" href="/studio?preset=${encodeURIComponent(piece.name)}" aria-label="Customize ${piece.name}">
          <div class="mw-piece-image"><img src="/images/${piece.slug}.webp" width="720" height="900" loading="lazy" alt="${piece.name} — ${piece.material}"><span class="mw-piece-tag">${piece.tag}</span><span class="mw-piece-action">Make it yours ${diagonalArrow}</span></div>
          <div class="mw-piece-title"><h3>${piece.name}</h3><span class="mw-piece-circle">${diagonalArrow}</span></div>
          <p class="mw-piece-mood">${piece.mood}</p>
          <p class="mw-piece-material"><span style="--stone:${piece.color}" aria-hidden="true"></span>${piece.material}</p>
        </a>
      </article>`).join('')}
    </div>
    <div class="mw-collection-note"><p>See something you love? Change the shape, the thread, the stones. Make it unmistakably yours.</p><a class="mw-text-link" href="/studio">Explore the studio ${arrow}</a></div>
  </section>

  <section class="mw-materials" id="materials" aria-labelledby="materials-title">
    <figure class="mw-materials-visual" data-reveal><img src="/images/atelier-materials.jpg" width="1536" height="1024" loading="lazy" alt="Coarse jute, fine cotton thread, green aventurine and rose quartz on linen"><figcaption>THE BEAUTY IS IN THE LITTLE THINGS.</figcaption><span class="mw-material-number" aria-hidden="true">Fig. 02</span></figure>
    <div class="mw-materials-copy" data-reveal><p class="mw-eyebrow">02 / CLOSE TO NATURE</p><h2 id="materials-title">Beautiful by<br><em>nature.</em></h2><p>Rough edges. Soft threads. A stone that catches the light. The loveliest things have a little character.</p>
      <dl class="mw-material-list"><div><dt><span>01</span> A natural foundation</dt><dd>Earthy jute around a wooden frame, with all its texture on show.</dd></div><div><dt><span>02</span> A softer connection</dt><dd>Fine cotton thread, woven into an airy web of little connections.</dd></div><div><dt><span>03</span> A personal finishing touch</dt><dd>Aventurine, quartz, amethyst or amber. Choose the color that feels like you.</dd></div></dl>
      <a class="mw-text-link" href="/studio">Get closer in 3D ${diagonalArrow}</a>
    </div>
  </section>

  <section class="mw-ritual mw-section" id="your-ritual" aria-labelledby="ritual-title">
    <div class="mw-section-heading" data-reveal><div><p class="mw-eyebrow">03 / A SMALL RITUAL OF MAKING</p><h2 id="ritual-title">A few choices.<br><em>A piece of you.</em></h2></div><p>No right way. No perfect combination.<br>Just follow what feels like you.</p></div>
    <ol class="mw-steps"><li data-reveal><span class="mw-step-number">01</span><div><h3>Find your shape.</h3><p>A crescent, a circle, a little something unexpected. Give your idea a place to begin.</p></div></li><li data-reveal><span class="mw-step-number">02</span><div><h3>Follow your feeling.</h3><p>Earthy or colorful? Simple or intricate? Bring your threads, stones and finishing touches together.</p></div></li><li data-reveal><span class="mw-step-number">03</span><div><h3>See it come together.</h3><p>Turn it in 3D. Change the light. Let a gentle breeze catch it. Save the design you love.</p></div></li></ol>
  </section>

  <section class="mw-invitation" aria-labelledby="invitation-title">
    <div class="mw-invitation-orbit" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="mw-invitation-copy" data-reveal><p class="mw-eyebrow">SOMETHING ONLY YOU COULD MAKE</p><h2 id="invitation-title">Your own little<br><em>piece of wonder.</em></h2><p>A shape. A stone. A story that starts with you.</p><a class="mw-button mw-button-light" href="/studio">Let’s make it yours ${arrow}</a><span class="mw-invitation-note">Explore freely. Save your design when it feels right.</span></div>
    <div class="mw-invitation-aside">Made of nature.<br><em>Made personal.</em>${star}</div>
  </section>

  <section class="mw-faq mw-section" aria-labelledby="faq-title"><div><p class="mw-eyebrow">BEFORE YOU BEGIN</p><h2 id="faq-title">A little<br><em>good to know.</em></h2></div><div class="mw-questions">
    <details><summary>What can I make my own?<span aria-hidden="true">+</span></summary><p>Choose your frame shape and finish, cotton thread color, weave pattern, gemstones and hanging strands. You can also add or remove the available pendant and quartz accents. The 3D preview updates as you go.</p></details>
    <details><summary>Can I see it in a different light?<span aria-hidden="true">+</span></summary><p>Yes. Inside the studio, switch between Studio, Daylight and Evening lighting, or try a gentle breeze. Drag to see the piece from different angles and inspect the pendant up close.</p></details>
    <details><summary>Does saving a design place an order?<span aria-hidden="true">+</span></summary><p>No. Your design is saved on this browser and device. You can download an image or a design specification to share your choices with a maker. The studio is a place to explore your idea; it does not take payments or submit orders.</p></details>
  </div></section>
</main>
<footer class="mw-footer"><div class="mw-footer-top"><a class="mw-brand" href="/home" aria-label="Moon Woven home">${moon}<span>moon woven<small>OBJECTS FOR YOUR QUIET MOMENTS</small></span></a><p>A little nature.<br>A little intention. <em>A little you.</em></p><a class="mw-text-link" href="/studio">Find your quiet ${diagonalArrow}</a></div><div class="mw-footer-bottom"><span>© ${new Date().getFullYear()} Moon Woven</span><span>Inspired by nature. Finished by your imagination.</span><a href="#main-content">Back to the top ↑</a></div></footer>`;

const menuButton = document.querySelector('.mw-menu-toggle');
const navigation = document.querySelector('.mw-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); }
});
document.addEventListener('click', event => { if (!event.target.closest('.mw-header')) closeMenu(); });
window.matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let revealObserver;
function setMotionPreference() {
  revealObserver?.disconnect();
  document.documentElement.classList.toggle('mw-motion', !motionPreference.matches);
  if (motionPreference.matches || !('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible'));
    return;
  }
  revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
  }, {threshold: .08});
  document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
}
setMotionPreference();
motionPreference.addEventListener('change', setMotionPreference);
