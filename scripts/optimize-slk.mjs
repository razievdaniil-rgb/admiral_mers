import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  flatten,
  join,
  weld,
  simplify,
  prune,
  meshopt,
  getBounds,
} from "@gltf-transform/functions";
import {
  MeshoptDecoder,
  MeshoptEncoder,
  MeshoptSimplifier,
} from "meshoptimizer";
import sharp from "sharp";
await Promise.all([
  MeshoptDecoder.ready,
  MeshoptEncoder.ready,
  MeshoptSimplifier.ready,
]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });
const doc = await io.read(
  ".work/new-slk/Mercedes_SLK55_AMG_2012_FM7_Sketchfab.glb",
);
for (const a of doc.getRoot().listAnimations()) a.dispose();
// Rest pose is the closed body. Remove skin attributes before flattening rigid parts.
for (const n of doc.getRoot().listNodes()) n.setSkin(null);
for (const m of doc.getRoot().listMeshes())
  for (const p of m.listPrimitives())
    for (const a of ["JOINTS_0", "WEIGHTS_0", "JOINTS_1", "WEIGHTS_1"])
      p.setAttribute(a, null);
for (const s of doc.getRoot().listSkins()) s.dispose();
await doc.transform(dedup(), flatten());
const scene = doc.getRoot().listScenes()[0];
console.log("bounds", getBounds(scene));
const rolling = doc
  .getRoot()
  .listNodes()
  .filter((n) => n.getMesh() && /^(rim|tyre)_(LF|RF|LR|RR)_/.test(n.getName()));
let wheel = 0;
for (const side of ["LF", "RF", "LR", "RR"]) {
  const nodes = rolling.filter(
    (n) =>
      n.getName().startsWith("rim_" + side + "_") ||
      n.getName().startsWith("tyre_" + side + "_"),
  );
  const tyre = nodes.filter((n) => n.getName().startsWith("tyre_"));
  const boxes = tyre.map(getBounds),
    min = [0, 1, 2].map((i) => Math.min(...boxes.map((b) => b.min[i]))),
    max = [0, 1, 2].map((i) => Math.max(...boxes.map((b) => b.max[i]))),
    center = min.map((v, i) => (v + max[i]) / 2);
  const g = doc
    .createNode("Admiral_Wheel_" + wheel++)
    .setTranslation(center)
    .setExtras({ spinAxis: [1, 0, 0], spinRadius: (max[1] - min[1]) / 2 });
  scene.addChild(g);
  for (const n of nodes) {
    n.setTranslation(n.getTranslation().map((v, i) => v - center[i]));
    n.setName("");
    n.getMesh().setName("");
    g.addChild(n);
  }
}

// Two dedicated scan proxies retain the real internal geometry without duplicating draw calls.
for (const part of ["Engine", "Cabin"]) {
  const nodes = doc
    .getRoot()
    .listNodes()
    .filter(
      (n) =>
        n.getMesh() &&
        (part === "Engine"
          ? /^engine_/.test(n.getName())
          : /^(seat|steeringWheel|centerConsole|dashboard|dash_|doorCard)/.test(
              n.getName(),
            )),
    );
  const group = doc
    .createNode("Admiral_Scan_" + part)
    .setExtras({ scanProxy: part });
  scene.addChild(group);
  const mat = doc
    .createMaterial("ScanProxy" + part)
    .setBaseColorFactor([0.06, 0.28, 0.4, 1]);
  for (const n of nodes) {
    const mesh = doc.createMesh();
    for (const p of n.getMesh().listPrimitives()) {
      const copy = p.clone().setMaterial(mat);
      for (const sem of copy.listSemantics())
        if (sem !== "POSITION" && sem !== "NORMAL")
          copy.setAttribute(sem, null);
      mesh.addPrimitive(copy);
    }
    group.addChild(
      doc
        .createNode()
        .setTranslation(n.getTranslation())
        .setRotation(n.getRotation())
        .setScale(n.getScale())
        .setMesh(mesh),
    );
  }
}
for (const n of doc.getRoot().listNodes())
  if (n.getMesh()) {
    n.setName("");
    n.getMesh().setName("");
  }
// Keep normal/detail textures but cap GPU memory and payload at 512 px per image.
for (const t of doc.getRoot().listTextures()) {
  const bytes = t.getImage();
  if (!bytes) continue;
  const output = await sharp(bytes)
    .resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  t.setImage(output).setMimeType("image/webp");
}
await doc.transform(
  dedup(),
  join({ keepNamed: true }),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.5, error: 0.001 }),
  prune(),
);
// Rebuild smooth paint normals across split UV vertices, retaining hard panel edges.
for (const mesh of doc.getRoot().listMeshes())
  for (const p of mesh.listPrimitives()) {
    if (!/paint/.test(p.getMaterial()?.getName() ?? "")) continue;
    const pos = p.getAttribute("POSITION"),
      old = p.getAttribute("NORMAL"),
      indices = p.getIndices();
    if (!pos || !old || !indices) continue;
    const count = pos.getCount(),
      sums = Array.from({ length: count }, () => [0, 0, 0]);
    const at = (i) => pos.getElement(i, [0, 0, 0]);
    for (let t = 0; t < indices.getCount(); t += 3) {
      const ids = [
        indices.getScalar(t),
        indices.getScalar(t + 1),
        indices.getScalar(t + 2),
      ];
      const [a, b, c] = ids.map(at),
        u = b.map((v, i) => v - a[i]),
        v = c.map((v, i) => v - a[i]);
      const n = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
      for (const i of ids) for (let j = 0; j < 3; j++) sums[i][j] += n[j];
    }
    const groups = new Map();
    for (let i = 0; i < count; i++) {
      const key = at(i)
        .map((v) => v.toFixed(5))
        .join(",");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(i);
    }
    const normal = new Float32Array(count * 3);
    for (const group of groups.values())
      for (const i of group) {
        const ref = old.getElement(i, [0, 0, 0]),
          n = [0, 0, 0];
        for (const k of group) {
          const f = sums[k],
            l = Math.hypot(...f) || 1;
          if (f.reduce((v, x, j) => v + x * ref[j], 0) / l > 0.45)
            for (let j = 0; j < 3; j++) n[j] += f[j];
        }
        const l = Math.hypot(...n);
        for (let j = 0; j < 3; j++) normal[i * 3 + j] = l ? n[j] / l : ref[j];
      }
    p.setAttribute("NORMAL", old.clone().setArray(normal));
  }
await doc.transform(
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
await io.write("public/models/hero-slk.glb", doc);
console.log(
  "Done",
  doc.getRoot().listMeshes().length,
  "meshes",
  doc.getRoot().listMaterials().length,
  "materials",
);
