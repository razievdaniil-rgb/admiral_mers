import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile("src/pricing.ts", "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { prices, searchPrices } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);
test("brake fluid is searchable without choosing a car or knowing its category", () => {
  for (const query of [
    "тормозная жидкость",
    "замена тормозной жидкости",
    "ТОРМОЗНАЯ",
  ]) {
    assert.ok(searchPrices(query).some((item) => item.id === "brake-fluid"));
  }
  assert.equal(searchPrices("тормозная жидкость")[0].price, 5250);
});
test("ТО searches a whole abbreviation rather than matching every automobile word", () => {
  const results = searchPrices("ТО");
  assert.ok(results.some((item) => item.id === "to"));
  assert.ok(!results.some((item) => item.id === "shocks"));
  assert.ok(results.length < prices.length / 2);
});
test("the approved price list has 26 distinct jobs and service-specific prices", () => {
  assert.equal(prices.length, 26);
  assert.equal(new Set(prices.map((p) => p.id)).size, 26);
  assert.equal(searchPrices("Xentry")[0].price, 3700);
  assert.equal(
    searchPrices("", "maintenance").find((p) => p.id === "to").price,
    7750,
  );
  assert.deepEqual(searchPrices("несуществующая работа"), []);
});
