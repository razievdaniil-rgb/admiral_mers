// Uses the existing Git credential manager. No credential is written or logged.
import { spawnSync } from "node:child_process";
const repo = "razievdaniil-rgb/admiral_mers";
const mode = process.argv[2] || "status";
const credential = spawnSync("git", ["credential", "fill"], {
  input: "protocol=https\nhost=github.com\n\n",
  encoding: "utf8",
  windowsHide: true,
});
if (credential.status !== 0)
  throw new Error(
    "Git credential manager could not supply GitHub authentication.",
  );
const fields = Object.fromEntries(
  credential.stdout
    .trim()
    .split("\n")
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const api = async (path, method = "GET", body) => {
  const response = await fetch(`https://api.github.com/repos/${repo}/${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${fields.password}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const e = new Error(
      `GitHub ${response.status}: ${result.message || "request failed"}`,
    );
    e.status = response.status;
    throw e;
  }
  return result;
};
if (mode === "enable") {
  let exists = false;
  try {
    await api("pages");
    exists = true;
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  const p = await api("pages", exists ? "PUT" : "POST", {
    build_type: "workflow",
  });
  console.log(
    JSON.stringify({
      enabled: true,
      url: p.html_url || `https://razievdaniil-rgb.github.io/admiral_mers/`,
    }),
  );
} else if (mode === "runs") {
  const r = await api("actions/runs?per_page=3");
  console.log(
    JSON.stringify(
      r.workflow_runs.map((x) => ({
        id: x.id,
        status: x.status,
        conclusion: x.conclusion,
        head_sha: x.head_sha,
        url: x.html_url,
      })),
    ),
  );
} else if (mode === "logs") {
  const id = process.argv[3];
  if (!/^\d+$/.test(id || "")) throw new Error("Run ID required");
  const r = await api(`actions/runs/${id}/jobs`);
  console.log(
    JSON.stringify(
      r.jobs.map((j) => ({
        id: j.id,
        name: j.name,
        conclusion: j.conclusion,
        steps: j.steps.map((s) => ({ name: s.name, conclusion: s.conclusion })),
      })),
    ),
  );
} else {
  const p = await api("pages");
  console.log(
    JSON.stringify({
      status: p.status,
      url: p.html_url,
      build_type: p.build_type,
    }),
  );
}
