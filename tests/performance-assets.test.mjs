import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

test("twelve distinct catalogue posters stay within the static image budget", async () => {
  const ids = [
    "s65",
    "e212",
    "c202",
    "cls",
    "gls",
    "g",
    "amg",
    "sl65",
    "300sl",
    "sprinter",
    "190",
    "scoupe",
  ];
  let bytes = 0;
  const hashes = new Set();
  for (const id of ids) {
    const image = await readFile("dist/media/vehicles/" + id + ".webp");
    bytes += image.length;
    const metadata = await sharp(image).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 900);
    assert.equal(metadata.height, 500);
    hashes.add(createHash("sha256").update(image).digest("hex"));
  }
  assert.equal(hashes.size, 12, "Do not accidentally publish repeated frames");
  assert.ok(bytes < 512_000, "The whole 2D catalogue must remain below 500 KB");
});

test("hero keeps its geometry and download budgets", async () => {
  const file = await readFile("dist/models/hero-optimized.glb");
  assert.ok(file.length < 1_000_000, "Hero GLB must remain below 1 MB");
  assert.equal(file.readUInt32LE(8), file.length);
  const gltf = JSON.parse(
    file
      .subarray(20, 20 + file.readUInt32LE(12))
      .toString()
      .trim(),
  );
  let primitives = 0,
    triangles = 0;
  for (const mesh of gltf.meshes)
    for (const primitive of mesh.primitives) {
      primitives++;
      triangles += gltf.accessors[primitive.indices].count / 3;
    }
  assert.ok(
    primitives <= 60,
    "Avoid restoring hundreds of separate draw calls",
  );
  assert.ok(triangles < 110_000, "Avoid restoring the original dense geometry");
  assert.ok(
    gltf.materials.some((m) => /interior/.test(m.name)),
    "Actual interior must be retained",
  );
  assert.ok(
    gltf.materials.some((m) => /gavril_v8/.test(m.name)),
    "Actual engine must be retained",
  );
});
