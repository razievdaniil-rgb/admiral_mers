import fs from "node:fs/promises";
import sharp from "sharp";
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
await fs.mkdir("public/media/vehicles", { recursive: true });
const thumbs = [];
let total = 0;
for (let i = 0; i < ids.length; i++) {
  const id = ids[i],
    src = ".work/render/" + id + ".png";
  const out = "public/media/vehicles/" + id + ".webp";
  const { data, info } = await sharp(src)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bg = [data[0], data[1], data[2]];
  let x0 = info.width,
    y0 = info.height,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const n = (y * info.width + x) * info.channels;
      if (Math.max(...bg.map((v, c) => Math.abs(data[n + c] - v))) > 8) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
  const padX = Math.round((x1 - x0) * 0.1),
    padY = Math.round((y1 - y0) * 0.1);
  x0 = Math.max(0, x0 - padX);
  y0 = Math.max(0, y0 - padY);
  x1 = Math.min(info.width - 1, x1 + padX);
  y1 = Math.min(info.height - 1, y1 + padY);
  await sharp(src)
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize(900, 500, {
      fit: "contain",
      background: { r: bg[0], g: bg[1], b: bg[2] },
    })
    .webp({ quality: 87, effort: 6 })
    .toFile(out);
  total += (await fs.stat(out)).size;
  thumbs.push({
    input: await sharp(src).resize(300, 167).png().toBuffer(),
    left: (i % 3) * 300,
    top: Math.floor(i / 3) * 190,
  });
  thumbs.push({
    input: Buffer.from(
      '<svg width="300" height="23"><text x="12" y="17" fill="white" font-family="sans-serif" font-size="14">' +
        id +
        "</text></svg>",
    ),
    left: (i % 3) * 300,
    top: Math.floor(i / 3) * 190 + 167,
  });
}
await sharp({
  create: { width: 900, height: 760, channels: 3, background: "#0b0e13" },
})
  .composite(thumbs)
  .png()
  .toFile(".work/render/contact-sheet.png");
console.log("12 WebP bytes:", total);
const b = await fs.readFile("public/models/hero-optimized.glb"),
  j = JSON.parse(
    b
      .subarray(20, 20 + b.readUInt32LE(12))
      .toString()
      .trim(),
  );
console.log(
  "Hero:",
  b.length,
  "bytes,",
  j.meshes.length,
  "draw calls,",
  j.meshes.reduce(
    (n, m) =>
      n +
      m.primitives.reduce((t, p) => t + j.accessors[p.indices].count / 3, 0),
    0,
  ),
  "triangles",
);
