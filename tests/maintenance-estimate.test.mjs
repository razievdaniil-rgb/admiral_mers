import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const url = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const pricingUrl = url(compile(await readFile("src/pricing.ts", "utf8")));
const estimateCode = compile(
  await readFile("src/maintenance-estimate.ts", "utf8"),
).replace('from "./pricing"', `from "${pricingUrl}"`);
const { estimateMaintenance, maintenanceDraft } = await import(
  url(estimateCode)
);
test("scheduled maintenance never adds individual work prices a second time", () => {
  assert.equal(estimateMaintenance("scheduled", ["oil", "filter"]), 7750);
});
test("individual work uses approved prices and rejects duplicates or unknown ids", () => {
  assert.equal(estimateMaintenance("individual", ["oil", "filter"]), 4550);
  assert.equal(
    estimateMaintenance("individual", ["oil", "oil", "unknown", "to"]),
    3150,
  );
  assert.equal(estimateMaintenance("individual", []), 0);
});
test("the message draft contains the chosen car, work and the estimate boundaries", () => {
  const draft = maintenanceDraft(
    "individual",
    ["oil", "filter"],
    "S-Класс W140",
  );
  assert.match(draft, /W140/);
  assert.match(draft, /4550/);
  assert.match(draft, /без запчастей/);
  assert.match(draft, /масла и масляного фильтра/);
});
