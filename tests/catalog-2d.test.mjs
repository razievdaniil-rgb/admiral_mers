import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import sharp from "sharp";

test("all fifteen 2D catalogue illustrations are distinct, transparent and lightweight", async () => {
  const catalogue = JSON.parse(
    await readFile("src/catalog-vehicles.json", "utf8"),
  );
  assert.equal(catalogue.length, 15);
  assert.equal(new Set(catalogue.map((car) => car.image)).size, 15);
  let total = 0;
  for (const car of catalogue) {
    const bytes = await readFile(`dist/${car.image}`);
    const image = await sharp(bytes).metadata();
    assert.equal(image.width, 900);
    assert.equal(image.height, 500);
    assert.equal(image.hasAlpha, true);
    total += bytes.length;
  }
  assert.ok(total < 1_000_000, "The entire catalogue must stay under 1 MB");
});

test("the published 2D version contains no 3D model downloads", async () => {
  async function files(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(`${directory}/${entry.name}`)
          : [`${directory}/${entry.name}`],
      ),
    );
    return nested.flat();
  }
  assert.deepEqual(
    (await files("dist")).filter((file) => /\.(glb|gltf|usdz)$/i.test(file)),
    [],
  );
});
