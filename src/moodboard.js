import './moodboard.css';

document.title = 'The Quiet Atelier — Moon Woven Moodboard';
document.querySelector('#app').innerHTML = `
  <main class="board">
    <header class="board-header">
      <a class="board-brand" href="/">moon woven<span>ART DIRECTION / 01</span></a>
      <div>THE HOMEPAGE MOODBOARD<span>Botanical · Tactile · Personal</span></div>
    </header>
    <section class="board-intro">
      <p class="board-label">THE SELECTED DIRECTION</p>
      <h1>The quiet <em>atelier.</em></h1>
      <p>Nature, with a little intention. A warm, editorial world where<br>the materials feel close and every choice feels personal.</p>
    </section>
    <div class="board-grid">
      <figure class="board-photo">
        <img src="/images/atelier-hero.jpg" alt="Crescent dream catcher in a warm, sunlit interior — original visual concept" width="1024" height="1536">
        <figcaption><span>01 / THE ATMOSPHERE</span>Afternoon light. Room to breathe.</figcaption>
      </figure>
      <section class="board-type">
        <span class="board-label">02 / THE VOICE</span>
        <h2>A little nature.<br>A little <em>wonder.</em></h2>
        <p class="board-type-caption">Cormorant Garamond & DM Sans</p>
        <div class="board-type-rule"></div>
        <p>Made of nature.<br>Made personal by you.</p>
        <span class="board-label board-type-small">EXPRESSIVE SERIF. QUIET DETAILS.</span>
      </section>
      <section class="board-palette">
        <span class="board-label">03 / THE PALETTE</span>
        <div class="board-swatches">
          <div style="--color:#f5f2e9"><span>Paper<small>#F5F2E9</small></span></div>
          <div style="--color:#303d30" class="swatch-light"><span>Forest<small>#303D30</small></span></div>
          <div style="--color:#7f8868" class="swatch-light"><span>Moss<small>#7F8868</small></span></div>
          <div style="--color:#ae8861"><span>Jute<small>#AE8861</small></span></div>
          <div style="--color:#d6b7a9"><span>Quartz<small>#D6B7A9</small></span></div>
        </div>
      </section>
      <figure class="board-materials">
        <img src="/images/atelier-materials.jpg" alt="Jute, fine cotton, aventurine and quartz on natural linen — original visual concept" width="1536" height="1024">
        <figcaption><span>04 / THE TEXTURE</span>Cotton web. Jute frame. A touch of stone.</figcaption>
      </figure>
      <section class="board-notes">
        <span class="board-label">05 / THE EXPERIENCE</span>
        <p>Generous margins.<br>Honest materials.<br><em>Small, considered details.</em></p>
        <ul><li>Editorial, asymmetrical composition</li><li>Fine rules and warm paper surfaces</li><li>Gentle reveals that respect reduced motion</li><li>A clear invitation into the 3D studio</li></ul>
      </section>
    </div>
    <footer class="board-footer"><span>MOON WOVEN · HOMEPAGE ART DIRECTION</span><span>Original AI-generated visual concepts · Product designs remain editable in the studio.</span><a href="/home">Explore the homepage ↗</a></footer>
  </main>`;
