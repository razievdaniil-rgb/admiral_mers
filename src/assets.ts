// Original exports belong in public/media. Empty slots render without broken images.
export const media = {
  logo: "media/home-imgLayer1.svg",
  hero: "media/home-img1.webp",
  atmosphere: "media/home-img.webp",
  workshop: "media/home-imgRectangle12.webp",
  history: "media/home-imgRectangle11.webp",
  service: "media/280-imgRectangle11.webp",
  diagnosticIllustration: "media/home-imgRectangle10.webp",
  symbols: [
    "media/home-imgRectangle3.webp",
    "media/home-imgRectangle4.webp",
    "media/home-imgRectangle5.webp",
  ],
  promotions: [
    "media/home-imgRectangle8.webp",
    "media/home-imgRectangle9.webp",
    "media/home-imgRectangle10.webp",
  ],
  serviceIllustrations: [
    "media/219-imgRectangle15.webp",
    "media/219-imgRectangle25.webp",
    "media/219-imgRectangle19.webp",
    "media/219-imgRectangle20.webp",
    "media/219-imgRectangle23.webp",
    "media/219-imgRectangle21.webp",
    "media/219-imgRectangle24.webp",
    "media/219-imgRectangle22.webp",
  ],
  approachIllustrations: [
    "media/287-imgRectangle8.webp",
    "media/287-imgRectangle9.webp",
    "media/287-imgRectangle10.webp",
    "media/287-imgRectangle11.webp",
    "media/287-imgRectangle12.webp",
    "media/287-imgRectangle27.webp",
  ],
  models: {
    "e-W213": "media/219-imgRectangle16.webp",
    "s-W222": "media/219-imgRectangle17.webp",
    "gle-W166 (ML / GLE)": "media/219-imgRectangle18.webp",
  } as Record<string, string>,
};
export const assetUrl = (path: string) =>
  path ? `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}` : "";
