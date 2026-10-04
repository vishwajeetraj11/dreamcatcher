import { Box3, Group, Vector3 } from 'three';

// Geometry stays in its original coordinates; the two groups place its pivot
// at the knot without copying or deforming any of the woven details.
export function hangingPivot(parent, anchor, name) {
  const pivot = new Group();
  pivot.name = name;
  pivot.position.copy(anchor);
  const contents = new Group();
  contents.position.copy(anchor).negate();
  pivot.add(contents);
  parent.add(pivot);
  return { pivot, contents };
}

export function attachBreezeRig(model, anchor, strands, pendant) {
  const frame = new Group();
  frame.name = 'suspension-pivot';
  frame.position.copy(anchor);
  const contents = new Group();
  contents.position.copy(anchor).negate();
  contents.add(...model.children);
  frame.add(contents);
  model.add(frame);
  model.userData.breeze = { frame, strands, pendant };

  // A fixed envelope prevents camera breathing as the piece sways. Reserve the
  // largest angular displacement of the frame plus its longest hanging part.
  const bounds = new Box3().setFromObject(model);
  const radius = Math.max(anchor.distanceTo(bounds.min), anchor.distanceTo(bounds.max));
  const longest = Math.max(0.8, ...strands.map(strand => strand.length + 0.15));
  const allowance = radius * 0.027 + longest * 0.075;
  model.userData.previewBounds = bounds.expandByVector(new Vector3(allowance, allowance * 0.3, allowance));
}

// A small, deterministic preview of a breeze, not a structural simulation.
// Long strands lag behind the frame; the compact stone pendant sways less.
export function applyBreeze(model, seconds, strength = 0) {
  const rig = model.userData.breeze;
  if (!rig) return;
  const amount = Math.max(0, Math.min(1, strength));
  const gust = Math.sin(seconds * 0.72) * 0.65 + Math.sin(seconds * 1.17) * 0.35;
  rig.frame.rotation.set(
    amount * Math.sin(seconds * 0.63) * 0.008,
    amount * Math.sin(seconds * 0.48) * 0.009,
    amount * gust * 0.015
  );
  rig.strands.forEach(({ pivot, length }, index) => {
    const phase = index * 0.68;
    const frequency = 1.45 / Math.sqrt(length);
    pivot.rotation.set(
      amount * Math.sin(seconds * frequency * 0.79 + phase) * 0.018,
      0,
      amount * (Math.sin(seconds * frequency - phase) * 0.042 + gust * 0.018)
    );
  });
  rig.pendant?.rotation.set(
    amount * Math.sin(seconds * 1.52) * 0.006,
    amount * Math.sin(seconds * 0.9) * 0.012,
    amount * (Math.sin(seconds * 1.8 - 0.3) * 0.012 + gust * 0.004)
  );
}
