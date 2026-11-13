import credits from "./vehicle-credits.json";
export const vehicles = [
  ["s65", "S-Класс", "W222 · S65 AMG", "mercedes-benz-mersedes-s65.glb"],
  ["e212", "E-Класс", "W212", "mercedes-benz-mersedes-e-class.glb"],
  ["c202", "C-Класс", "W202 · C180", "mercedes-benz-c180.glb"],
  ["cls", "CLS", "C219", "mercedes-benz-cls.glb"],
  ["gls", "GLS", "Внедорожник", "mercedes-benz-mersedes-gls.glb"],
  ["g", "G-Класс", "Внедорожник", "mercedes-gclass.glb"],
  ["amg", "Mercedes-AMG GT", "Купе", "mercedes-benz-amg-gt.glb"],
  ["sl65", "SL", "SL65 AMG", "mercedes-benz-sl65-amg.glb"],
  ["300sl", "300 SL", "Gullwing", "mercedes-300sl.glb"],
  [
    "sprinter",
    "Sprinter",
    "Коммерческий транспорт",
    "mercedes-benz-sprinter.glb",
  ],
  ["190", "190 E", "Evolution", "mercedes-benz-190e-evo.glb"],
  [
    "scoupe",
    "S-Класс Coupé",
    "S63 · Brabus 800",
    "mercedes-benz-s63-coupe.glb",
  ],
].map(([id, name, generation, file]) => ({
  id,
  name,
  generation,
  file,
  credit: credits.find((c) => c.file === file)!.credit,
}));
export type VehicleAsset = (typeof vehicles)[number];
export const vehicleLabel = (vehicle: VehicleAsset) =>
  `${vehicle.name} ${vehicle.generation}`;
