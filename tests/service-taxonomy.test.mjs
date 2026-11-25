import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import ts from "typescript";
const moduleUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64")}`;
const contentUrl = moduleUrl(await readFile("src/service-content.ts", "utf8"));
const source = (await readFile("src/data.ts", "utf8")).replace(
  '"./service-content"',
  JSON.stringify(contentUrl),
);
const { services, allServices } = await import(moduleUrl(source));
const { media } = await import(
  moduleUrl(await readFile("src/assets.ts", "utf8"))
);

test("body repair and climate control are independent directions with distinct content", () => {
  const body = allServices.find((s) => s.id === "body");
  const climate = allServices.find((s) => s.id === "climate");
  assert.ok(body && climate);
  assert.doesNotMatch(
    [body.title, body.intro, ...body.works].join(" "),
    /климат|кондицион|вентиляц|обогрев/i,
  );
  const works = climate.works.join(" ");
  for (const system of [/обогрев/i, /кондицион/i, /вентиля/i])
    assert.match(works, system);
  assert.notEqual(body.image, climate.image);
  assert.equal(
    allServices.find((s) => s.id === "electrics").title,
    "Электрика",
  );
});

test("every service card resolves its own illustration after inserting a direction", async () => {
  assert.equal(new Set(allServices.map((s) => s.id)).size, allServices.length);
  for (const service of services) {
    assert.ok(media.serviceIllustrations[service.id], service.id);
    await access(`public/${media.serviceIllustrations[service.id]}`);
    await access(`public/${service.image}`);
  }
});
