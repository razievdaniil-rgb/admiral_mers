import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("all twelve deployed GLBs are complete and have matching source attribution", async () => {
  const credits = JSON.parse(
    await readFile("public/models/credits.json", "utf8"),
  );
  assert.equal(credits.length, 12);
  assert.deepEqual(
    credits,
    JSON.parse(await readFile("src/vehicle-credits.json", "utf8")),
  );
  const html = await readFile("public/models/credits.html", "utf8");
  for (const model of credits) {
    const bytes = await readFile("dist/models/" + model.file);
    assert.equal(bytes.readUInt32LE(0), 0x46546c67, model.file);
    assert.equal(bytes.readUInt32LE(4), 2);
    assert.equal(
      bytes.readUInt32LE(8),
      bytes.length,
      "truncated GLB: " + model.file,
    );
    assert.equal(model.credit.license, "CC Attribution");
    assert.ok(html.includes(model.credit.author));
    assert.ok(html.includes(model.credit.sourceUrl));
    const gltf = JSON.parse(
      bytes
        .subarray(20, 20 + bytes.readUInt32LE(12))
        .toString()
        .trim(),
    );
    assert.ok(gltf.meshes.length > 0);
    assert.ok(
      gltf.buffers.every((b) => !b.uri),
      "model must be self contained",
    );
  }
});
