import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import ts from "typescript";
const source = await readFile("src/branch-photos.ts", "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { branchPhotos } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);
test("all seventeen client photographs belong to their confirmed branch and resolve locally", async () => {
  assert.equal(branchPhotos.kiev.length, 11);
  assert.equal(branchPhotos.hotel.length, 6);
  const all = Object.values(branchPhotos).flat();
  assert.equal(new Set(all.map((p) => p.src)).size, 17);
  for (const [branch, photos] of Object.entries(branchPhotos)) {
    for (const photo of photos) {
      assert.match(photo.src, new RegExp(`/branches/${branch}-`));
      await access(`public/${photo.src}`);
      await access(`public/${photo.preview}`);
    }
  }
  assert.equal(branchPhotos.kiev.filter((p) => p.name === "Ремзона").length, 6);
  assert.equal(
    branchPhotos.hotel.filter((p) => p.name === "Ремзона").length,
    3,
  );
  assert.equal(branchPhotos.kiev.filter((p) => p.name === "Приёмка").length, 3);
  assert.ok(!branchPhotos.hotel.some((p) => p.name === "Приёмка"));
});
