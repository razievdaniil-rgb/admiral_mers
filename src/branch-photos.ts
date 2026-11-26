export type BranchPhoto = {
  name: "Фасад" | "Ремзона" | "Приёмка";
  src: string;
  preview: string;
  alt: string;
};

function series(
  branch: "kiev" | "hotel",
  kind: string,
  name: BranchPhoto["name"],
  count: number,
): BranchPhoto[] {
  const address = branch === "kiev" ? "Киевская" : "Гостиничный проезд";
  return Array.from({ length: count }, (_, i) => ({
    name,
    src: `media/branches/${branch}-${kind}-${i + 1}.webp`,
    preview: `media/branches/${branch}-${kind}-${i + 1}-preview.webp`,
    alt: `${name} техцентра Адмирал — ${address}, фото ${i + 1}`,
  }));
}

// Client confirmed: attachments 1–6 Kiev; 7 Gostinichny reception, 8–9 workshop;
// 10–11 / 12–14 facades;
// 15–17 Kiev reception. Do not reuse one branch's images for another branch.
const kievFacades = series("kiev", "facade", "Фасад", 2);
const hotelFacades = series("hotel", "facade", "Фасад", 3);
export const branchPhotos: Record<"kiev" | "hotel", BranchPhoto[]> = {
  kiev: [
    kievFacades[1],
    kievFacades[0],
    ...series("kiev", "workshop", "Ремзона", 6),
    ...series("kiev", "reception", "Приёмка", 3),
  ],
  hotel: [
    hotelFacades[1],
    hotelFacades[0],
    hotelFacades[2],
    ...series("hotel", "workshop", "Ремзона", 3).slice(1),
    ...series("hotel", "reception", "Приёмка", 1),
  ],
};
