import { prices } from "./pricing";
export const maintenanceWorkIds = [
  "oil",
  "filter",
  "fuel",
  "plugs",
  "brake-fluid",
  "coolant",
  "atf",
  "diff",
  "transfer",
];
export const maintenanceWorks = maintenanceWorkIds.map((id) =>
  prices.find((work) => work.id === id)!,
);
export function estimateMaintenance(
  mode: "scheduled" | "individual",
  selected: string[],
) {
  if (mode === "scheduled")
    return prices.find((work) => work.id === "to")!.price;
  const ids = new Set(selected);
  return maintenanceWorks
    .filter((work) => ids.has(work.id))
    .reduce((sum, work) => sum + work.price, 0);
}
export function maintenanceDraft(
  mode: "scheduled" | "individual",
  selected: string[],
  model: string,
) {
  const works =
    mode === "scheduled"
      ? ["Плановое ТО"]
      : maintenanceWorks
          .filter((work) => selected.includes(work.id))
          .map((work) => work.name);
  return `Здравствуйте! Хочу уточнить состав и стоимость обслуживания Mercedes-Benz${model ? ` ${model}` : ""}.\nВыбранные работы: ${works.join("; ")}.\nПредварительная стоимость работ на сайте: от ${estimateMaintenance(mode, selected)} ₽, без запчастей и расходных материалов. Прошу подтвердить расчёт для моего автомобиля.`;
}
