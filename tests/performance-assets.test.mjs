import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

test("all fifteen catalogue cars are distinct transparent local images with matching sources", async () => {
  const vehicles = JSON.parse(
    await readFile("src/catalog-vehicles.json", "utf8"),
  );
  const sources = JSON.parse(
    await readFile("dist/media/catalog-v2/sources.json", "utf8"),
  );
  assert.equal(vehicles.length, 15);
  assert.equal(new Set(vehicles.map((v) => v.id)).size, 15);
  let bytes = 0;
  const hashes = new Set();
  for (const vehicle of vehicles) {
    assert.ok(
      vehicle.image.startsWith("media/catalog-v2/"),
      "Never return unfinished legacy 3D captures",
    );
    const image = await readFile("dist/" + vehicle.image);
    bytes += image.length;
    const metadata = await sharp(image).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 900);
    assert.equal(metadata.height, 500);
    assert.ok(metadata.hasAlpha, "Keep cutout backgrounds transparent");
    hashes.add(createHash("sha256").update(image).digest("hex"));
    const source = sources.find((s) => s.id === vehicle.id);
    assert.ok(source);
    assert.equal(source.name, vehicle.name);
    assert.equal(source.generation, vehicle.generation);
    assert.equal(source.image, vehicle.image);
    assert.equal(
      new URL(source.sourceImage).hostname,
      "media.oneweb.mercedes-benz.com",
    );
    assert.equal(
      source.manufacturerCode,
      new URL(source.sourceImage).pathname.split("/")[5],
    );
  }
  assert.equal(hashes.size, 15, "Every model must have its own picture");
  assert.ok(
    bytes < 750_000,
    "The whole fifteen-car catalogue must stay below 750 KB",
  );
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

test("four wheel pivots retain only rolling parts and stay within scene budgets", async () => {
  const bytes = await readFile("dist/models/hero-optimized.glb");
  const gltf = JSON.parse(
    bytes
      .subarray(20, 20 + bytes.readUInt32LE(12))
      .toString()
      .trim(),
  );
  const wheels = gltf.nodes.filter((n) => n.name?.startsWith("Admiral_Wheel_"));
  assert.equal(
    wheels.length,
    4,
    "The tyres and rims must rotate around four independent axles",
  );
  const roots = gltf.scenes[0].nodes,
    centres = new Set();
  for (const wheel of wheels) {
    assert.equal(
      wheel.children.length,
      2,
      "Keep tyre and rim together, without rotating brake calipers",
    );
    assert.deepEqual(wheel.extras.spinAxis, [1, 0, 0]);
    assert.ok(wheel.extras.spinRadius > 0.2 && wheel.extras.spinRadius < 0.5);
    centres.add(wheel.translation.map((x) => x.toFixed(3)).join(","));
    for (const index of wheel.children) {
      assert.ok(
        !roots.includes(index),
        "Rolling parts must not also be duplicated at the scene root",
      );
      assert.ok(gltf.nodes[index].mesh !== undefined);
    }
  }
  assert.equal(centres.size, 4, "Wheel pivot centres must be distinct");
  let calls = 0,
    triangles = 0;
  const walk = (index) => {
    const node = gltf.nodes[index];
    if (node.mesh !== undefined)
      for (const primitive of gltf.meshes[node.mesh].primitives) {
        calls++;
        triangles += gltf.accessors[primitive.indices].count / 3;
      }
    for (const child of node.children ?? []) walk(child);
  };
  roots.forEach(walk);
  assert.ok(calls <= 60);
  assert.ok(
    triangles < 130000,
    "Count repeated wheel instances as well as unique meshes",
  );
});

test("textured customer SLK is complete and stays within hero payload and geometry budgets", async () => {
  const bytes = await readFile("dist/models/hero-slk.glb");
  assert.ok(
    bytes.length < 4_000_000,
    "Do not publish the original 47 MB source",
  );
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const length = bytes.readUInt32LE(12),
    gltf = JSON.parse(bytes.subarray(20, 20 + length).toString()),
    binary = 28 + length;
  assert.equal(
    gltf.nodes.filter((n) => n.extras?.scanProxy).length,
    2,
    "Keep real engine and cabin scan layers",
  );
  assert.equal(
    gltf.nodes.filter((n) => n.name?.startsWith("Admiral_Wheel_")).length,
    4,
  );
  assert.ok(!gltf.skins?.length, "No permanent skeletal animation cost");
  let triangles = 0,
    calls = 0,
    pixels = 0;
  for (const m of gltf.meshes)
    for (const p of m.primitives) {
      calls++;
      triangles += gltf.accessors[p.indices].count / 3;
    }
  assert.ok(calls <= 130);
  assert.ok(triangles < 180_000);
  assert.ok(gltf.images.length > 10, "Retain material textures");
  for (const image of gltf.images) {
    assert.equal(image.mimeType, "image/webp");
    const view = gltf.bufferViews[image.bufferView];
    assert.ok(view.byteOffset + view.byteLength <= bytes.length - binary);
    const meta = await sharp(
      bytes.subarray(
        binary + view.byteOffset,
        binary + view.byteOffset + view.byteLength,
      ),
    ).metadata();
    assert.ok(meta.width <= 512 && meta.height <= 512);
    pixels += meta.width * meta.height;
  }
  assert.ok(pixels < 11_000_000, "Keep decoded texture memory bounded");
  const poster = await sharp("dist/media/vehicles/slk55.webp").metadata();
  assert.equal(poster.width, 900);
  assert.equal(poster.height, 500);
});
