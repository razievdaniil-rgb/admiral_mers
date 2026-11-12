// Original exports belong in public/media. Empty slots render without broken images.
export const media = {
  logo: "media/home-imgLayer1.svg",
  hero: "media/home-img1.webp",
  atmosphere: "media/home-img.webp",
  workshop: "media/home-imgRectangle12.webp",
  history: "media/home-imgRectangle11.webp",
  service: "media/280-imgRectangle11.webp",
  diagnosticIllustration: "media/home-imgRectangle10.webp",
  models: {
    "e-W213": "media/219-imgRectangle16.webp",
    "s-W222": "media/219-imgRectangle17.webp",
    "gle-W166 (ML / GLE)": "media/219-imgRectangle18.webp",
  } as Record<string, string>,
};
export const assetUrl = (path: string) =>
  path ? `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}` : "";
