# Urban Mynah — Dream Catcher Studio

A customer-facing Three.js customizer inspired by the supplied Moon Woven reference photographs. All 3D geometry is procedural: irregular bark-covered branches, three-ply jute with loose fibers, knotted cotton webs, tumbled quartz, cloudy stone beads, and a faceted rose-quartz pendant with an engraved metal cap. Physically based materials, self-shadowing, and an olive studio backdrop bring the model closer to the reference photographs.

## Run locally

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite. `npm run build` creates the production bundle in `dist/`; `npm run preview` serves that bundle. Node.js 22.12+ is recommended.

## Homepage and original media

- `/home`: the Urban Mynah homepage. Moon Woven is the current release, followed by all four Forest Echos pieces and the brand introduction with its original first Instagram reel.
- `/moodboard`: the earlier botanical atelier concept board, retained as design history.
- `/` and `/studio`: the customizer. Collection links pass a validated `preset` query parameter, for example `/studio?preset=Willow%20Weave`.

Collection cards and enlarged product views preserve the complete artwork and backgrounds supplied in `urbanmynah.pdf`. The material slideshow displays the original detail pages. The opening Moon Woven wall scene is a user-requested AI edit that corrects scale, hanging support, wall texture, lighting and shadows; its source artwork remains available, and its prompts are recorded in `design/moon-woven-wall-edit.json`. The logo from `logobrand.pdf` includes the exact tagline “walls hold stories”. `design/urban-mynah-assets.json` records asset sources, processing, dimensions, and checksums.

The original first Instagram reel is served locally as a browser-compatible MP4, with its artwork, audio, and timing preserved. It autoplays and loops muted with a custom mute/unmute button. Both homepage and studio footers link to @urbanmynah. `design/urban-mynah-instagram.json` records the verified reel and brand-introduction sources, processing, and checksums. Product images are in `public/images/urban-mynah/`; video assets are in `public/media/urban-mynah/`.

The homepage loads independently from the Three.js studio and supports mobile layouts, keyboard navigation, and reduced motion. Earlier AI concept images and procedural catalogue renders are retained for the moodboard and development history; the homepage does not use them for product display. Open `/design/catalog-render.html` on the development server to regenerate procedural preview thumbnails. That internal utility is not included in the production build.

## Forest Echos collection

The collection contains exactly four designs. Every original remains available; alternate shapes are limited to those selected for that design. The reviewed Instagram sources and original construction notes are recorded in `design/forest-echos-references.json`.

| Order | Design | Original form | Additional shapes |
| --- | --- | --- | --- |
| 1 | Willow Weave | Intersecting triangular branches | Square |
| 2 | Sage Haven | Intersecting pentagonal branches | Circle, square, triangle |
| 3 | Amber Hush | Rectangular branch arrangement | None; the original form is fixed |
| 4 | Moon Woven | Crescent | Circle, teardrop, pentagon |

Configuration stores a stable `design` identity (`willow`, `sage`, `amber`, or `moon`) separately from `shape`. Choosing a new shape preserves the design's ornaments and arrangement. Validation restricts each design to its permitted shapes and restores the original form when an unsupported shape is supplied. Saved configurations created before the `design` field are migrated from their original shape identity.

## Features

- Original branch and crescent designs, with design-specific circle, square, triangle, teardrop and pentagon alternatives; three finishes, three weave patterns, four thread colors, and five stone colors.
- Adjustable strand count and length; optional quartz pendant and accents.
- Orbit, zoom, automatic rotation, Fit whole piece, and an Inspect pendant close-up that stays focused while materials change. The main view keeps the full model inside the preview, including after resizing or extending strands.
- Optional Studio, Daylight, and Evening lighting, with matching reflections and backdrop.
- Still (default) or Gentle breeze: the frame and individual hanging strands sway about their attachment points. Motion pauses for pendant inspection and respects changes to the system's reduced-motion preference. Atmosphere affects the preview and PNG export, not the saved design specification.
- Four preset starting points: Willow Weave, Sage Haven, Amber Hush, and Moon Woven. Their intersecting branches, painted tips, wooden charms, crystal drops, cotton tassels, combed macramé leaves, and crescent webs are modeled procedurally from the supplied references.
- Optional leaves and tassels on the branch designs; pendant inspection follows each design's garnet, amber, or rose-quartz drop.
- Save, reopen, and delete up to 30 designs on the current browser/device.
- Download a studio PNG preview or a JSON design specification.
- Responsive layout, keyboard controls, reduced-motion support, and WebGL fallback messaging.

Saved designs use localStorage. There is no account, checkout, order submission, or server persistence. The model is a visual concept, not a dimensionally calibrated manufacturing drawing. Google Fonts loads DM Sans and DM Serif Display; local fallback fonts work offline.

## Structure

- `src/scene.js`: lighting, olive studio backdrop, camera controls, and renderer lifecycle.
- `src/atmosphere.js`: lighting presets, transitions, and cached reflection environments.
- `src/breeze.js`: hanging pivots, lightweight breeze motion, and a fixed envelope for camera fitting.
- `src/camera-framing.js`: perspective fitting with space reserved for preview controls.
- `src/model.js`: procedural geometry, woven construction, and geometry batching.
- `src/forest-model.js`: reference-based Willow Weave, Sage Haven, and Amber Hush models.
- `src/forest-craft.js`: overlapping natural branches, crossed lashings, twisted cords, individual cotton fibers, and asymmetric ornament details.
- `src/forest-materials.js`: aligned wood grain, cotton nap, and mineral inclusions, with model-owned texture cleanup.
- `src/model-construction.js`: shared geometry builders and batching.
- `src/materials.js`: coherent volumetric mineral inclusions, local scattering, roughness, and seeded surface textures.
- `src/mineral-geometry.js`: continuous beveled quartz facets and rounded fractured pebble surfaces.
- `src/studio-lighting.js`: local HDR soft-window environment; no remote assets required.
- `src/config.js`: options, presets, validation, and saved-design parsing.
- `src/main.js`: customer controls and persistence.
- `src/style.css`: responsive studio interface.

Run `npm test` for configuration, saved-data, geometry integrity, pendant watertightness, and resource-lifecycle checks.

Reference photos, downloaded reels, and video contact sheets are in `references/urban-mynah/`. The downloaded videos and raw metadata stay local and are ignored by Git; none of the research media is included in the production bundle. These are visual interpretations of the references, not calibrated replicas.
