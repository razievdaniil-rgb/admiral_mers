import fs from "node:fs/promises";
const revision = "2d18dfd9db96bbf0d9cffa949deaf7f571388cbf";
const source =
  "https://raw.githubusercontent.com/pedrosoandre/carros/" + revision;
const catalogResponse = await fetch(source + "/cars.json");
if (!catalogResponse.ok) throw Error("Cannot load pinned catalog");
const catalog = (await catalogResponse.json()).cars;
const selected = [
  "mercedes-benz-mersedes-s65",
  "mercedes-benz-mersedes-e-class",
  "mercedes-benz-c180",
  "mercedes-benz-cls",
  "mercedes-benz-mersedes-gls",
  "mercedes-gclass",
  "mercedes-benz-amg-gt",
  "mercedes-benz-sl65-amg",
  "mercedes-300sl",
  "mercedes-benz-sprinter",
  "mercedes-benz-190e-evo",
  "mercedes-benz-s63-coupe",
];
await fs.mkdir("public/models", { recursive: true });
const result = [];
for (const id of selected) {
  const model = catalog.find((m) => m.id === id);
  if (!model || model.credit.license !== "CC Attribution")
    throw Error("Unverified model " + id);
  const path = "public/models/" + model.file;
  const existing = await fs.stat(path).catch(() => null);
  if (!existing || existing.size !== model.bytes) {
    const response = await fetch(
      `https://raw.githubusercontent.com/pedrosoandre/carros/${revision}/assets/${model.file}`,
    );
    if (!response.ok) throw Error(`${id}: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.readUInt32LE(0) !== 0x46546c67) throw Error("Invalid GLB");
    await fs.writeFile(path, bytes);
  }
  const bytes = await fs.readFile(path);
  const json = JSON.parse(
    bytes
      .subarray(20, 20 + bytes.readUInt32LE(12))
      .toString("utf8")
      .trim(),
  );
  console.log(
    id,
    bytes.length,
    JSON.stringify(json.extensionsRequired || []),
    json.meshes?.length,
  );
  result.push({ ...model, revision });
}
await fs.writeFile(
  "public/models/credits.json",
  JSON.stringify(result, null, 2),
);
await fs.writeFile("src/vehicle-credits.json", JSON.stringify(result, null, 2));
const licenseResponse = await fetch(source + "/LICENSE-3D-MODELS.md");
if (!licenseResponse.ok) throw Error("Cannot load model license");
await fs.writeFile(
  "public/models/LICENSE-3D-MODELS.md",
  await licenseResponse.text(),
);
