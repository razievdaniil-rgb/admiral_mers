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
const document = await io.read("public/models/mercedes-benz-mersedes-s65.glb");
await document.transform(dedup(), flatten());
const scene = document.getRoot().listScenes()[0];
const candidates = document
  .getRoot()
  .listNodes()
  .filter(
    (n) => n.getMesh() && /^(sw222_wheel_amg|Object_4\.)/.test(n.getName()),
  );
const tyres = candidates.filter((n) =>
  n.getName().startsWith("sw222_wheel_amg"),
);
if (tyres.length !== 4) throw Error("Expected four separate tyres");
const groups = tyres.map((n, i) => {
  const b = getBounds(n),
    center = b.min.map((x, j) => (x + b.max[j]) / 2);
  const group = document
    .createNode("Admiral_Wheel_" + i)
    .setTranslation(center)
    .setExtras({ spinAxis: [1, 0, 0], spinRadius: (b.max[1] - b.min[1]) / 2 });
  scene.addChild(group);
  return { group, center };
});
for (const node of candidates) {
  const b = getBounds(node),
    center = b.min.map((x, i) => (x + b.max[i]) / 2);
  let closest = 0;
  for (let i = 1; i < groups.length; i++) {
    const distance = (g) =>
      g.center.reduce((v, x, j) => v + (x - center[j]) ** 2, 0);
    if (distance(groups[i]) < distance(groups[closest])) closest = i;
  }
  const { group, center: origin } = groups[closest],
    position = node.getTranslation();
  node.setTranslation(position.map((x, i) => x - origin[i]));
  node.setName("Admiral_Rolling_" + node.getName());
  node.getMesh().setName("Admiral_Rolling_Mesh");
  group.addChild(node);
}
for (const node of document.getRoot().listNodes())
  if (!node.getName().startsWith("Admiral_")) {
    node.setName("");
    node.getMesh()?.setName("");
  }
await document.transform(
  join({ keepNamed: true }),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.25, error: 0.003 }),
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
await io.write("public/models/hero-optimized.glb", document);
