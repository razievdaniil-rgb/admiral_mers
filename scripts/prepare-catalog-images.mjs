import fs from "node:fs/promises";
import sharp from "sharp";
const sources = JSON.parse(
  await fs.readFile("public/media/catalog-v2/sources.json", "utf8"),
);
await fs.mkdir(".work/catalog-v2", { recursive: true });
let total = 0;
const queue = [...sources];
async function worker() {
  for (let item; (item = queue.shift());) {
    const sourceUrl = new URL(item.sourceImage);
    sourceUrl.searchParams.set("im", "Resize,width=1600");
    const response = await fetch(sourceUrl);
    if (!response.ok) throw Error(`${item.id}: HTTP ${response.status}`);
    const source = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(`.work/catalog-v2/${item.id}.png`, source);
    const car = await sharp(source)
      .trim({ threshold: 12 })
      .resize(800, 390, { fit: "inside" })
      .png()
      .toBuffer();
    await sharp({
      create: { width: 900, height: 500, channels: 4, background: "#00000000" },
    })
      .composite([{ input: car, gravity: "centre" }])
      .webp({ quality: 85, alphaQuality: 95, effort: 6 })
      .toFile("public/" + item.image);
    const meta = await sharp("public/" + item.image).metadata();
    if (meta.width !== 900 || meta.height !== 500 || !meta.hasAlpha)
      throw Error("Bad image " + item.id);
    total += (await fs.stat("public/" + item.image)).size;
    console.log(item.id, "ready");
  }
}
await Promise.all([worker(), worker(), worker()]);
console.log("Catalogue total bytes:", total);
const tiles = [];
for (let i = 0; i < sources.length; i++) {
  const item = sources[i];
  tiles.push({
    input: await sharp("public/" + item.image)
      .resize(300, 167)
      .png()
      .toBuffer(),
    left: (i % 3) * 300,
    top: Math.floor(i / 3) * 195,
  });
  tiles.push({
    input: Buffer.from(
      `<svg width="300" height="28"><text x="12" y="19" fill="#dbe3ed" font-family="sans-serif" font-size="14">${item.name} · ${item.generation}</text></svg>`,
    ),
    left: (i % 3) * 300,
    top: Math.floor(i / 3) * 195 + 167,
  });
}
await sharp({
  create: {
    width: 900,
    height: Math.ceil(sources.length / 3) * 195,
    channels: 3,
    background: "#0b0e13",
  },
})
  .composite(tiles)
  .png()
  .toFile(".work/catalog-v2/contact-sheet.png");
