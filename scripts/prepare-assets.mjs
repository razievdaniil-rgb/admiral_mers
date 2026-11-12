import sharp from "sharp";
import { readdir, unlink, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
const dir = resolve("public/media");
const files = (await readdir(dir)).filter((f) => f.endsWith(".png"));
const sizes = [];
for (const file of files) {
  const output = file.replace(/\.png$/, ".webp");
  const info = await sharp(join(dir, file))
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(join(dir, output));
  sizes.push({
    file: output,
    width: info.width,
    height: info.height,
    bytes: info.size,
  });
  await unlink(join(dir, file));
}
await writeFile("assets-info.local.json", JSON.stringify(sizes, null, 2));
console.log(
  `Prepared ${sizes.length} WebP images; total ${Math.round(sizes.reduce((n, x) => n + x.bytes, 0) / 1024)} KB`,
);
