import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
  new URL("../src/drive-motion.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022 },
});
const { drivePose } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("hero choreography stays bounded and its scan does not restart at the scroll handoff", () => {
  let previous = drivePose(0);
  for (let p = 0.001; p <= 3; p += 0.001) {
    const pose = drivePose(p);
    assert.ok(Object.values(pose).every(Number.isFinite));
    assert.ok(pose.x >= -0.4 && pose.x <= 0.5);
    assert.ok(pose.yaw >= -0.25 && pose.yaw <= 0.5);
    assert.ok(Math.abs(pose.x - previous.x) < 0.005);
    assert.ok(Math.abs(pose.yaw - previous.yaw) < 0.005);
    assert.ok(pose.travel >= previous.travel);
    if (p >= 0.91) assert.equal(pose.scanStrength, 0);
    previous = pose;
  }
  assert.deepEqual(drivePose(100), drivePose(2));
  assert.deepEqual(drivePose(NaN), drivePose(0));
});
