# Moon Woven — Dream Catcher Studio

A customer-facing Three.js customizer inspired by the supplied Moon Woven reference photographs. All 3D geometry is procedural: wrapped frames, a cotton web, quartz chips, stone strands, and a rose-quartz pendant.

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
- Download a transparent PNG preview or a JSON design specification.
- Responsive layout, keyboard controls, reduced-motion support, and WebGL fallback messaging.

Saved designs use localStorage. There is no account, checkout, order submission, or server persistence. The model is a visual concept, not a dimensionally calibrated manufacturing drawing. Google Fonts loads DM Sans and DM Serif Display; local fallback fonts work offline.

## Structure

- `src/scene.js`: Three.js model generation, materials, lighting, and camera.
- `src/config.js`: options, presets, validation, and saved-design parsing.
- `src/main.js`: customer controls and persistence.
- `src/style.css`: responsive studio interface.

Run `npm test` for configuration and saved-data validation tests.
