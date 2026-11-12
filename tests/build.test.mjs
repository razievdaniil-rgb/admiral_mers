import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve("dist");
test("production entry and bundled fonts resolve beneath the GitHub Pages project path", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const refs = [
    ...html.matchAll(/(?:src|href)="(\/admiral_mers\/[^"?#]+)"/g),
  ].map((m) => m[1]);
  assert.ok(refs.length >= 2, "JS and CSS entries must be present");
  for (const ref of refs)
    await access(resolve(root, ref.replace("/admiral_mers/", "")));
  const cssRef = refs.find((r) => r.endsWith(".css"));
  const css = await readFile(
    resolve(root, cssRef.replace("/admiral_mers/", "")),
    "utf8",
  );
  const fonts = [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) =>
    m[1].replaceAll('"', ""),
  );
  assert.equal(
    fonts.length,
    4,
    "Latin and Cyrillic subsets of both fonts must be local",
  );
  for (const font of fonts)
    await access(resolve(root, font.replace("/admiral_mers/", "")));
});
test("production bundle uses local Figma exports without temporary asset URLs or lead endpoints", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const jsRef = [
    ...html.matchAll(/src="(\/admiral_mers\/[^"?#]+\.js)"/g),
  ][0][1];
  const js = await readFile(
    resolve(root, jsRef.replace("/admiral_mers/", "")),
    "utf8",
  );
  assert.ok(
    !js.includes("figma.com/api/mcp/asset"),
    "Temporary Figma URLs must never ship",
  );
  assert.ok(
    !js.includes("api.telegram.org"),
    "No Telegram bot credential or send endpoint in demo",
  );
  for (const file of [
    "home-imgLayer1.svg",
    "home-img1.webp",
    "home-img.webp",
    "home-imgRectangle11.webp",
    "home-imgRectangle12.webp",
    "home-imgRectangle10.webp",
    "280-imgRectangle11.webp",
    "219-imgRectangle16.webp",
    "219-imgRectangle17.webp",
    "219-imgRectangle18.webp",
  ]) {
    const buffer = await readFile(resolve(root, "media", file));
    assert.ok(buffer.length > 100, `${file} must not be empty`);
  }
});
