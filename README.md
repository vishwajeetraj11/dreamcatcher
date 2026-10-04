# Moon Woven — Dream Catcher Studio

A customer-facing Three.js customizer inspired by the supplied Moon Woven reference photographs. All 3D geometry is procedural: irregular bark-covered branches, three-ply jute with loose fibers, knotted cotton webs, tumbled quartz, cloudy stone beads, and a faceted rose-quartz pendant with an engraved metal cap. Physically based materials, self-shadowing, and an olive studio backdrop bring the model closer to the reference photographs.

## Run locally

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite. `npm run build` creates the production bundle in `dist/`; `npm run preview` serves that bundle. Node.js 22.12+ is recommended.

## Features

- Crescent, circle, and teardrop frames, three finishes, three weave patterns, four thread colors, and five stone colors.
- Adjustable strand count and length; optional quartz pendant and accents.
- Orbit, zoom, automatic rotation, and reset camera controls.
- Three preset starting points.
- Save, reopen, and delete up to 30 designs on the current browser/device.
- Download a studio PNG preview or a JSON design specification.
- Responsive layout, keyboard controls, reduced-motion support, and WebGL fallback messaging.

Saved designs use localStorage. There is no account, checkout, order submission, or server persistence. The model is a visual concept, not a dimensionally calibrated manufacturing drawing. Google Fonts loads DM Sans and DM Serif Display; local fallback fonts work offline.

## Structure

- `src/scene.js`: lighting, olive studio backdrop, camera fitting, and renderer lifecycle.
- `src/model.js`: procedural geometry, woven construction, and geometry batching.
- `src/materials.js`: seeded surface textures and physically based stone materials.
- `src/config.js`: options, presets, validation, and saved-design parsing.
- `src/main.js`: customer controls and persistence.
- `src/style.css`: responsive studio interface.

Run `npm test` for configuration and saved-data validation tests.
