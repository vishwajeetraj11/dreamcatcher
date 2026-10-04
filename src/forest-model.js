import * as THREE from 'three';
import { randomSequence } from './materials.js';
import { pebbleGeometry, pendantGeometry } from './mineral-geometry.js';
import { Builder, addCrystal, v } from './model-construction.js';
import { hangingPivot, attachBreezeRig } from './breeze.js';
import { createCraftSurfaces, createCraftMaterials } from './forest-materials.js';
import { frameDefinition, lowerFramePoint, twistedCord, naturalBranch, lash, hitch, addStick, addBentFrame, weave, macrameLeaf, tassel, woodenCharm } from './forest-craft.js';
import { collectionDesigns, normalizeConfig } from './config.js';

const TAU = Math.PI * 2;

function beadGeometry() {
  const geometry = new THREE.SphereGeometry(1, 24, 18), p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const ripple = 1 + Math.sin(x * 4 + y * 3) * Math.cos(z * 3) * 0.025;
    p.setXYZ(i, x * ripple * (1 - y * 0.027), y * ripple, z * ripple * (1 + x * 0.035));
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createForestDreamcatcher(config, textures) {
  config = normalizeConfig(config);
  const model = new THREE.Group(); model.name = `Forest Echos — ${collectionDesigns[config.design].name}`;
  const craft = createCraftSurfaces();
  let mat = createCraftMaterials(config, textures, craft);
  const build = new Builder(model), rnd = randomSequence(5831);
  const { vertices, curve, center, suspension, extensions } = frameDefinition(config.shape, config.design);
  const isWillow = config.design === 'willow', isAmber = config.design === 'amber', isSage = config.design === 'sage';
  const isOriginal = config.shape === collectionDesigns[config.design].originalShape;
  if (curve) addBentFrame(build, model, curve, mat, rnd);
  else vertices.forEach((a, i) => {
    const b = vertices[(i + 1) % vertices.length], direction = b.clone().sub(a).normalize();
    const horizontal = Math.abs(a.y - b.y) < 0.1;
    const extension = isAmber && horizontal ? 0.95 : isWillow && isOriginal && horizontal ? 0.50 : extensions;
    const start = a.clone().addScaledVector(direction, -extension), end = b.clone().addScaledVector(direction, extension);
    // Each free branch crosses over one neighbour and under the other.
    // Slight depth tilt makes these real overlapping sticks, rather than fused joints.
    if (isAmber) start.z = end.z = horizontal ? 0.055 : -0.055;
    else { start.z = 0.09; end.z = -0.09; }
    addStick(build, model, start, end, mat, rnd, { wrap: !isAmber || horizontal, sparse: isSage, extension: isAmber && horizontal ? 0.17 : extension, radius: isAmber && !horizontal ? 0.040 : isSage ? 0.076 : 0.064 });
    lash(build, a.clone().add(v(0, 0, 0.025)), mat, rnd, isAmber ? 0.105 : 0.122, -0.45 + i * 0.58);
  });
  weave(build, vertices, center, config.pattern, mat, rnd, config.design);
  if (isAmber) {
    twistedCord(build, [vertices[0], vertices[0].clone().lerp(suspension, 0.5).add(v(0.02, -0.025)), suspension, suspension.clone().lerp(vertices[3], 0.5).add(v(-0.02, -0.025)), vertices[3]], 0.014, mat.ropeLight, 120);
  }
  twistedCord(build, [suspension, suspension.clone().add(v(-0.045, 0.22)), suspension.clone().add(v(-0.006, 0.31)), suspension.clone().add(v(0.042, 0.23)), suspension], 0.009, mat.ropeLight, 75);

  const sphere = beadGeometry(), chips = Array.from({ length: 4 }, (_, i) => pebbleGeometry(i + 21));
  const moving = [];
  const bead = (contents, at, material = mat.bead, size = 0.070, stretch = 1.32, depth = 0.63) => {
    const mesh = addCrystal(contents, sphere, material, at, [size, size * stretch, size * depth], [0, 0.18, 0.08]);
    mesh.castShadow = material === mat.woodBead;
    // A recessed bore where the hanging cord enters each drilled bead.
    const hole = new THREE.Mesh(sphere, mat.hole);
    hole.position.copy(at).add(v(0, size * stretch * 0.92, 0.003));
    hole.scale.set(size * 0.16, size * 0.035, size * 0.13);
    contents.add(hole);
  };
  const chipCluster = (contents, at) => {
    if (!config.pebbles) return;
    for (let i = 0; i < 5; i++) addCrystal(contents, chips[i % 4], mat.quartz, at.clone().add(v((rnd() - 0.5) * 0.060, (i - 2) * 0.033, rnd() * 0.030)), [0.048, 0.034, 0.041], [rnd(), rnd(), rnd() * TAU]);
  };
  const pendant = (contents, sb, top, material, scale = 1) => {
    sb.add(new THREE.TorusGeometry(0.026 * scale, 0.005 * scale, 7, 18), mat.silver, top.clone().add(v(0, 0.095 * scale, 0)), [0.75, 1.25, 1], new THREE.Euler(0, 0.25, 0));
    sb.add(new THREE.TorusGeometry(0.020 * scale, 0.005 * scale, 7, 18), mat.silver, top.clone().add(v(0, 0.065 * scale, 0)), [0.85, 1.0, 1], new THREE.Euler(0, 1.15, 0));
    sb.add(new THREE.CylinderGeometry(0.112 * scale, 0.113 * scale, 0.075 * scale, 6), mat.silver, top.clone().add(v(0, 0.026 * scale, 0)));
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      sb.add(new THREE.TorusGeometry(0.022 * scale, 0.003 * scale, 5, 12), mat.silverDark, top.clone().add(v(Math.sin(a) * 0.10 * scale, 0.026 * scale, Math.cos(a) * 0.10 * scale)), [1, 1, 1], new THREE.Euler(0, a, 0));
    }
    const mesh = addCrystal(contents, pendantGeometry(), material, top, [scale, scale, scale], [0, 0, 0]);
    mesh.name = 'feature-pendant';
    mesh.userData.mineral = isWillow ? 'garnet' : isSage ? 'amber' : 'rose-quartz';
  };

  for (let i = 0; i < config.strands; i++) {
    const f = config.strands === 1 ? 0.5 : i / (config.strands - 1);
    const x = (f - 0.5) * (isAmber ? 2.43 : isWillow ? 1.62 : 1.10) + (config.strands === 1 ? 0 : Math.sin(i * 2.13) * 0.025);
    // Amber's lower crossbar projects beyond its two vertical branches. All
    // other silhouettes attach cords to their actual lower perimeter.
    const anchor = isAmber
      ? v(x, THREE.MathUtils.lerp(vertices[1].y, vertices[2].y, (x - vertices[1].x) / (vertices[2].x - vertices[1].x)), 0.06)
      : lowerFramePoint(vertices, x).add(v(0, 0, 0.06));
    const centerIndex = Math.floor(config.strands / 2);
    const cylinder = isWillow && config.strands >= 3 && i !== centerIndex && (i === 1 || i === config.strands - 2);
    const willowLengths = [1.34, 1.62, 1.69, 1.44, 1.35, 1.78, 1.55];
    const length = (isAmber ? 1.34 + Math.sin(f * Math.PI) * 0.43 + Math.sin(i * 1.8) * 0.04 : isWillow ? willowLengths[i] : 1.40) * config.length;
    const { pivot, contents } = hangingPivot(model, anchor, `hanging-strand-${i + 1}`);
    contents.name = `${config.design}-${isWillow ? cylinder ? 'tassel' : i === centerIndex ? 'wooden-charms' : 'beads' : isAmber ? 'macrame' : 'pendant-chain'}`;
    const sb = new Builder(contents);
    moving.push({ pivot, length: length + (config.feathers ? 0.50 : 0.15) });
    hitch(sb, anchor, mat, rnd, cylinder ? 1.16 : 0.67);
    const point = t => anchor.clone().add(v(Math.sin(t * 3 + i) * 0.017, -length * t, 0.02 * Math.sin(t * 4 + i)));
    const cordTop = anchor.clone().add(v(0, -0.13, 0.065));
    twistedCord(sb, [cordTop, point(0.52), point(1)], cylinder ? 0.014 : 0.0065, mat.cotton, 75, i * 0.71);
    if (isAmber) {
      bead(contents, point(0.18), mat.amberDisk, 0.13, 1.05, 0.28);
      bead(contents, point(0.39), mat.woodBead, 0.075, 1);
      chipCluster(contents, point(0.30));
      if (config.feathers) macrameLeaf(sb, point(0.47), length * 0.65, 0.31 + (i % 2) * 0.025, mat, rnd);
      else bead(contents, point(0.86));
      // Two side bead chains fill the space between the horizontal branches.
      if (i === 0 || i === config.strands - 1) {
        const topY = THREE.MathUtils.lerp(vertices[0].y, vertices[3].y, (x - vertices[0].x) / (vertices[3].x - vertices[0].x));
        const top = v(x, topY, 0.06);
        hitch(build, top, mat, rnd, 0.45);
        build.thread(top, anchor, mat.cotton, 0.0065);
        bead(model, top.clone().lerp(anchor, 0.32), mat.bead, 0.058, 1.25);
        bead(model, top.clone().lerp(anchor, 0.48), mat.woodBead, 0.070, 1);
        chipCluster(model, top.clone().lerp(anchor, 0.65));
      }
    } else if (isWillow) {
      if (cylinder) {
        const top = point(0.30), bottom = point(0.64);
        const axis = new THREE.CatmullRomCurve3([top, top.clone().lerp(bottom, 0.55).add(v(-0.014, 0, 0.009)), bottom]);
        sb.add(naturalBranch(axis, 0.055, i + 5, 38), mat.bark);
        for (const end of [top, bottom]) sb.add(new THREE.CircleGeometry(0.050, 12), mat.cutWood, end, [1, 1, 1], new THREE.Euler(Math.PI / 2, 0, 0));
        for (let n = 0; n < 5; n++) {
          const angle = n / 5 * TAU;
          const offset = v(Math.cos(angle) * 0.057, 0, Math.sin(angle) * 0.057);
          twistedCord(sb, [point(0.23), top.clone().add(offset), bottom.clone().add(offset), point(0.73)], 0.0075, n % 3 ? mat.cotton : mat.cottonShade, 65, n);
        }
        if (config.feathers) tassel(sb, point(0.75), length * 0.31, mat, rnd);
      } else if (i === centerIndex) {
        woodenCharm(sb, point(0.36), mat, rnd, 1.06, 0.58);
        woodenCharm(sb, point(0.83), mat, rnd, 1.15, 0.94);
      } else {
        bead(contents, point(0.30)); bead(contents, point(0.65));
        bead(contents, point(0.92), mat.woodBead, 0.060, 1);
        chipCluster(contents, point(0.48)); chipCluster(contents, point(0.79));
        if (config.feathers) tassel(sb, point(1), 0.14, mat, rnd);
      }
    } else {
      bead(contents, point(0.20)); bead(contents, point(0.40), mat.woodBead, 0.090, 1.2); bead(contents, point(0.63));
      for (const t of [0.08, 0.30, 0.53, 0.76]) chipCluster(contents, point(t));
      if (config.pendant && i === Math.floor(config.strands / 2)) pendant(contents, sb, point(0.87), mat.amber, 0.85);
      if (config.feathers) macrameLeaf(sb, point(1.22), 0.53, 0.19, mat, rnd);
    }
    sb.finish();
  }
  let pendantPivot = null;
  if (config.pendant && (isWillow || isAmber)) {
    const anchor = isWillow ? suspension.clone().add(v(0, -0.02, 0.065)) : v(0, 1.32, 0.07);
    const { pivot, contents } = hangingPivot(model, anchor, 'pendant-pivot');
    pendantPivot = pivot;
    const sb = new Builder(contents), top = anchor.clone().add(v(0, isWillow ? -1.13 : -0.53, 0));
    sb.thread(anchor, top.clone().add(v(0, 0.05, 0)), mat.cotton, 0.005);
    pendant(contents, sb, top, isWillow ? mat.garnet : mat.pink, isWillow ? 0.42 : 0.65);
    sb.finish();
  }
  build.finish();
  attachBreezeRig(model, suspension.clone().add(v(0, 0.32)), moving, pendantPivot);
  const used = new Set(); model.traverse(object => { if (object.geometry) used.add(object.geometry); });
  for (const geometry of [sphere, ...chips]) if (!used.has(geometry)) geometry.dispose();
  model.userData.config = { ...config };
  model.userData.updateMaterials = nextConfig => {
    const next = createCraftMaterials(nextConfig, textures, craft);
    const replacements = new Map(Object.entries(mat).map(([key, material]) => [material, next[key]]));
    model.traverse(object => { if (object.material) object.material = replacements.get(object.material) || object.material; });
    Object.values(mat).forEach(material => material.dispose());
    mat = next; model.userData.config = { ...nextConfig };
  };
  model.userData.dispose = () => { used.forEach(geometry => geometry.dispose()); Object.values(mat).forEach(material => material.dispose()); craft.dispose(); };
  return model;
}
