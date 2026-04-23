import { chromium, devices } from "@playwright/test";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const baseUrl = process.env.L2L_BENCHMARK_URL ?? "http://127.0.0.1:3001";
const outDir = path.join(repoRoot, "test-results", "benchmark-latest");
const ciMode = process.argv.includes("--ci");
const skipGates = process.argv.includes("--skip-gates");
const knownLeaks = [
  { label: "Change in momentum", pattern: /Change in momentum/ },
  { label: "Force relationship", pattern: /Force relationship/ },
  { label: "Final force", pattern: /Final force/ },
  { label: "Orbital speed substitution", pattern: /Orbital speed substitution/ },
  { label: "Mass answer", pattern: /Mass answer/ },
  { label: "12000", pattern: /(?<![A-Za-z0-9_.-])12000(?![A-Za-z0-9_.-])/ },
  { label: "1400", pattern: /(?<![A-Za-z0-9_.-])1400(?![A-Za-z0-9_.-]|px)/ },
  { label: "36000", pattern: /(?<![A-Za-z0-9_.-])36000(?![A-Za-z0-9_.-])/ },
];

fs.mkdirSync(outDir, { recursive: true });
for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
  if (entry.name.startsWith("start-local-demo.")) {
    continue;
  }
  const target = path.join(outDir, entry.name);
  try {
    if (entry.isDirectory()) {
      fs.rmSync(target, { recursive: true, force: true });
    } else {
      fs.unlinkSync(target);
    }
  } catch {
    // Windows may hold screenshot/log handles briefly; stale artifacts are reported by timestamped output below.
  }
}

const checks = [];
const browserFindings = {
  consoleErrors: [],
  failedRequests: [],
};

function log(message) {
  console.log(`[benchmark] ${message}`);
  fs.appendFileSync(path.join(outDir, "benchmark-progress.log"), `${new Date().toISOString()} ${message}\n`);
}

function installDemoProfileScript(page) {
  return page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem("l2l:student-user", JSON.stringify({
      id: "demo-google-student@gmail.com",
      email: "student@gmail.com",
      name: "Student",
      provider: "demo-google",
      createdAt: new Date().toISOString(),
    }));
    window.localStorage.setItem("l2l:student-profile", JSON.stringify({
      board: "Cambridge",
      qualification: "O Level",
      curriculumTrack: "International",
      subjects: ["Physics"],
      primarySubject: "Physics",
      targetSession: "Oct/Nov 2025",
      weeklyMockTarget: 2,
      bootCompletedAt: new Date().toISOString(),
    }));
  });
}

function addCheck(category, name, points, passed, detail = "") {
  checks.push({ category, name, points, passed: Boolean(passed), detail });
}

function run(command, label) {
  log(`${label}: ${command}`);
  const started = Date.now();
  const result = spawnSync(command, {
    cwd: repoRoot,
    shell: true,
    stdio: "inherit",
    env: { ...process.env, CI: process.env.CI ?? "1" },
    timeout: command.includes("e2e") ? 360_000 : 240_000,
  });
  return {
    passed: result.status === 0,
    durationMs: Date.now() - started,
    status: result.status,
  };
}

async function isLive(url = `${baseUrl}/dashboard`) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function ensureProductionServer() {
  fs.mkdirSync(outDir, { recursive: true });
  const stopResult = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      "$pids = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($id in $pids) { if ($id -and $id -ne $PID) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue } }",
    ],
    { cwd: repoRoot, encoding: "utf8", timeout: 30_000 },
  );

  const stdoutPath = path.join(outDir, "benchmark-next-start.out.log");
  const stderrPath = path.join(outDir, "benchmark-next-start.err.log");
  const stdout = fs.openSync(stdoutPath, "a");
  const stderr = fs.openSync(stderrPath, "a");
  const child = spawn("npm run start -- -p 3001", {
    cwd: repoRoot,
    detached: true,
    shell: true,
    stdio: ["ignore", stdout, stderr],
  });
  child.unref();
  fs.closeSync(stdout);
  fs.closeSync(stderr);

  let live = false;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (await isLive()) {
      live = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return {
    passed: live,
    detail: live
      ? `Restarted production demo on 3001 with process ${child.pid}.`
      : `Could not verify 3001. stop=${stopResult.status} stdout=${stdoutPath} stderr=${stderrPath}`,
  };
}

function walk(directory, matcher = () => true) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walk(absolutePath, matcher);
    }
    return matcher(absolutePath) ? [absolutePath] : [];
  });
}

function scanClientBundles() {
  const staticDir = path.join(repoRoot, ".next", "static");
  const files = walk(staticDir, (filePath) => /\.(js|css|html)$/.test(filePath));
  const leaks = [];
  for (const filePath of files) {
    const text = fs.readFileSync(filePath, "utf8");
    for (const leak of knownLeaks) {
      if (leak.pattern.test(text)) {
        leaks.push(`${path.relative(repoRoot, filePath)} :: ${leak.label}`);
      }
    }
  }
  return leaks;
}

function scanClientSourceImports() {
  const roots = [path.join(repoRoot, "src", "app"), path.join(repoRoot, "src", "components")];
  const offenders = [];
  for (const filePath of roots.flatMap((root) => walk(root, (item) => /\.(ts|tsx)$/.test(item)))) {
    if (filePath.includes(`${path.sep}api${path.sep}`) || filePath.endsWith(".test.ts")) {
      continue;
    }
    const source = fs.readFileSync(filePath, "utf8");
    if (source.includes("@/lib/grading") || source.includes("paper-mark-scheme.server")) {
      offenders.push(path.relative(repoRoot, filePath));
    }
  }
  return offenders;
}

function checkSupabasePolicies() {
  const migrationDir = path.join(repoRoot, "supabase", "migrations");
  const sql = fs.readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .map((file) => fs.readFileSync(path.join(migrationDir, file), "utf8"))
    .join("\n");
  const publicMarkScheme = /mark_scheme_items[\s\S]{0,220}for select[\s\S]{0,220}using\s*\(\s*true\s*\)/i.test(sql);
  const publicChunks = /resource_chunks[\s\S]{0,220}for select[\s\S]{0,220}using\s*\(\s*true\s*\)/i.test(sql);
  const hasL2lSchema = /create schema if not exists l2l/i.test(sql);
  const hasFirebaseOwner = /firebase_uid text/i.test(sql) && /auth\.jwt\(\)\s*->>\s*'sub'/i.test(sql);
  const hasPrivateBuckets = /l2l-source-documents/i.test(sql) && /l2l-extraction-artifacts/i.test(sql);
  return {
    passed: !publicMarkScheme && !publicChunks && hasL2lSchema && hasFirebaseOwner && hasPrivateBuckets,
    publicMarkScheme,
    publicChunks,
    hasL2lSchema,
    hasFirebaseOwner,
    hasPrivateBuckets,
  };
}

function largestJsChunk() {
  const chunkDir = path.join(repoRoot, ".next", "static", "chunks");
  const chunks = walk(chunkDir, (filePath) => filePath.endsWith(".js")).map((filePath) => ({
    file: path.relative(repoRoot, filePath),
    bytes: fs.statSync(filePath).size,
  }));
  return chunks.sort((a, b) => b.bytes - a.bytes)[0] ?? { file: "none", bytes: 0 };
}

function releaseScriptsAvoidDirectProdDeploy() {
  const scriptDir = path.join(repoRoot, "scripts");
  const offenders = walk(scriptDir, (filePath) => /\.(ps1|mjs|js|ts|sh|cmd|bat)$/.test(filePath))
    .filter((filePath) => /vercel\s+(deploy\s+)?--prod|vercel\s+deploy\s+--prod/i.test(fs.readFileSync(filePath, "utf8")))
    .map((filePath) => path.relative(repoRoot, filePath));
  return { passed: offenders.length === 0, offenders };
}

async function fetchJson(route, body) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { response, json, text };
}

async function attachPageDiagnostics(page) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserFindings.consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    browserFindings.consoleErrors.push(error.message);
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "";
    if (!/ERR_ABORTED|NS_BINDING_ABORTED/i.test(failure)) {
      browserFindings.failedRequests.push(`${request.url()} :: ${failure}`);
    }
  });
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && !/favicon\.ico|__nextjs_original-stack-frame/i.test(url)) {
      browserFindings.failedRequests.push(`${response.status()} ${url}`);
    }
  });
}

async function hasNoHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2);
}

async function unlabeledInteractiveCount(page) {
  return page.evaluate(() => {
    const selector = "button,a,input,textarea,select,[role='button'],[role='link']";
    return Array.from(document.querySelectorAll(selector)).filter((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return false;
      }
      const text = (element.textContent || "").trim();
      const label =
        element.getAttribute("aria-label") ||
        element.getAttribute("title") ||
        element.getAttribute("placeholder") ||
        element.getAttribute("alt");
      return !text && !label;
    }).length;
  });
}

async function tinyTextCount(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll("body *")).filter((element) => {
      const rect = element.getBoundingClientRect();
      const text = (element.textContent || "").trim();
      if (!text || rect.width === 0 || rect.height === 0) {
        return false;
      }
      const style = window.getComputedStyle(element);
      return Number.parseFloat(style.fontSize) < 11 && style.visibility !== "hidden";
    }).length;
  });
}

async function runBrowserBenchmark() {
  log("Launching browser benchmark");
  const browser = await chromium.launch();
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await desktop.newPage();
    page.setDefaultTimeout(7000);
    page.setDefaultNavigationTimeout(15000);
    await attachPageDiagnostics(page);
    await installDemoProfileScript(page);

    const started = Date.now();
    log("Opening dashboard desktop");
    const dashboardResponse = await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(600);
    const dashboardMs = Date.now() - started;
    await page.screenshot({ path: path.join(outDir, "dashboard-desktop.png"), fullPage: true });

    const dashboardNoOverflow = await hasNoHorizontalOverflow(page);
    const dashboardUnlabeled = await unlabeledInteractiveCount(page);
    const dashboardTiny = await tinyTextCount(page);
    const dashboardActionableBars =
      (await page.getByText(/Star-system tutorial/i).count()) > 0 &&
      (await page.getByText(/Supabase resource pipeline/i).count()) > 0 &&
      (await page.getByText(/Topic and subtopic mastery/i).count()) > 0;

    log("Opening exam and entering scan mode");
    await page.goto(`${baseUrl}/exam/benchmark-attempt`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /Begin scan/i }).click({ timeout: 7000 });
    const scanNavigationVisible =
      (await page.getByRole("button", { name: /Previous question/i }).first().isVisible({ timeout: 7000 })) &&
      (await page.getByRole("button", { name: /Next question/i }).first().isVisible({ timeout: 7000 }));
    const finishInitiallyDisabled = await page.getByRole("button", { name: /Scan all pages first/i }).isDisabled({ timeout: 7000 });
    const confidenceControls = await page.getByText(/confidence rating|rate confidence|confidence mismatch/i).count();
    await page.screenshot({ path: path.join(outDir, "exam-scan-desktop.png"), fullPage: true });

    log("Driving first star batch");
    await page.getByRole("button", { name: /^Star$/i }).first().click({ timeout: 7000 });
    await page.waitForTimeout(320);
    const starAutoAdvancedToQ2 = await page.getByRole("heading", { name: /^Q2\./i }).isVisible({ timeout: 7000 });
    for (let index = 0; index < 7; index += 1) {
      await page.getByRole("button", { name: /Next question/i }).first().click({ timeout: 7000 });
      await page.waitForTimeout(320);
    }
    const finishButton = page.getByRole("button", { name: /Finish scan/i });
    const finishEnabledAfterVisit = !(await finishButton.isDisabled({ timeout: 7000 }));
    await finishButton.click({ timeout: 7000 });
    await page.waitForTimeout(250);
    const landedQ1 = await page.getByRole("heading", { name: /^Q1\./i }).isVisible({ timeout: 7000 });
    const staleQ9Heading = await page.getByRole("heading", { name: /^Q9\./i }).first().isVisible().catch(() => false);
    await page.screenshot({ path: path.join(outDir, "exam-answer-desktop.png"), fullPage: true });

    log("Driving re-star batch");
    await page.getByRole("button", { name: /Mark question done/i }).click({ timeout: 7000 });
    const restarPromptVisible = await page.getByRole("heading", { name: /choose the next easiest unanswered set/i }).isVisible({ timeout: 7000 });
    await page.getByRole("button", { name: /Scan and star next batch/i }).click({ timeout: 7000 });
    const restarStartsQ2 = await page.getByRole("heading", { name: /^Q2\./i }).isVisible({ timeout: 7000 });
    await page.getByRole("button", { name: /Next question/i }).first().click({ timeout: 7000 });
    await page.waitForTimeout(320);
    await page.getByRole("button", { name: /^Star$/i }).first().click({ timeout: 7000 });
    await page.waitForTimeout(320);
    const restarAutoAdvancedAfterStar = await page.getByRole("heading", { name: /^Q4\./i }).isVisible({ timeout: 7000 });
    for (let index = 0; index < 5; index += 1) {
      await page.getByRole("button", { name: /Next question/i }).first().click({ timeout: 7000 });
      await page.waitForTimeout(320);
    }
    await page.getByRole("button", { name: /Finish scan/i }).click({ timeout: 7000 });
    await page.waitForTimeout(250);
    await page.getByRole("button", { name: /^Next$/i }).first().click({ timeout: 7000 });
    const nextStarReachedQ3 = await page.getByRole("heading", { name: /^Q3\./i }).isVisible({ timeout: 7000 });

    log("Checking results resit");
    await page.goto(`${baseUrl}/results/demo-attempt`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(500);
    const beforeResit = page.url();
    await page.getByRole("button", { name: /Resit paper/i }).first().click({ timeout: 7000 });
    await page.waitForURL(/\/exam\//, { timeout: 7000 });
    const resitFresh = page.url() !== beforeResit && (await page.getByRole("heading", { name: /Scan first/i }).isVisible({ timeout: 7000 }));

    log("Submitting blank attempt for zero-score integrity");
    await page.goto(`${baseUrl}/exam/benchmark-blank-attempt`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.evaluate(() => {
      const user = window.localStorage.getItem("l2l:student-user");
      const profile = window.localStorage.getItem("l2l:student-profile");
      window.localStorage.clear();
      if (user) window.localStorage.setItem("l2l:student-user", user);
      if (profile) window.localStorage.setItem("l2l:student-profile", profile);
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Begin scan/i }).click({ timeout: 7000 });
    await page.getByRole("button", { name: /^Star$/i }).first().click({ timeout: 7000 });
    await page.waitForTimeout(320);
    for (let index = 0; index < 7; index += 1) {
      await page.getByRole("button", { name: /Next question/i }).first().click({ timeout: 7000 });
      await page.waitForTimeout(320);
    }
    await page.getByRole("button", { name: /Finish scan/i }).click({ timeout: 7000 });
    await page.getByRole("button", { name: /Submit mock/i }).first().click({ timeout: 7000 });
    await page.getByRole("heading", { name: /Results coach/i }).waitFor({ timeout: 15000 });
    const zeroSubmitDisplaysZero =
      (await page.getByText("0/80").first().isVisible({ timeout: 7000 })) &&
      (await page.getByText(/You answered 0 question parts/i).isVisible({ timeout: 7000 })) &&
      (await page.getByText(/No response evidence yet/i).isVisible({ timeout: 7000 })) &&
      ((await page.getByText(/16\/80/).count()) === 0);

    const mobile = await browser.newContext(devices["Pixel 7"]);
    const mobilePage = await mobile.newPage();
    mobilePage.setDefaultTimeout(7000);
    mobilePage.setDefaultNavigationTimeout(15000);
    await attachPageDiagnostics(mobilePage);
    await installDemoProfileScript(mobilePage);
    log("Capturing mobile results");
    await mobilePage.goto(`${baseUrl}/results/demo-attempt`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await mobilePage.waitForTimeout(500);
    const mobileNoOverflow = await hasNoHorizontalOverflow(mobilePage);
    const mobileUnlabeled = await unlabeledInteractiveCount(mobilePage);
    const mobileTiny = await tinyTextCount(mobilePage);
    await mobilePage.screenshot({ path: path.join(outDir, "results-mobile.png"), fullPage: true });

    return {
      dashboardStatus: dashboardResponse?.status() ?? 0,
      dashboardMs,
      finishInitiallyDisabled,
      scanNavigationVisible,
      confidenceControls,
      starAutoAdvancedToQ2,
      finishEnabledAfterVisit,
      landedQ1,
      staleQ9Heading,
      restarPromptVisible,
      restarStartsQ2,
      restarAutoAdvancedAfterStar,
      nextStarReachedQ3,
      resitFresh,
      zeroSubmitDisplaysZero,
      noOverflow: dashboardNoOverflow && mobileNoOverflow,
      unlabeledCount: dashboardUnlabeled + mobileUnlabeled,
      tinyTextCount: dashboardTiny + mobileTiny,
      dashboardActionableBars,
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

function screenshotArtifactsExist() {
  return ["dashboard-desktop.png", "exam-scan-desktop.png", "exam-answer-desktop.png", "results-mobile.png"].every((name) =>
    fs.existsSync(path.join(outDir, name)),
  );
}

function writeReport(score, cappedScore, p0Failures) {
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    score,
    cappedScore,
    p0Failures,
    checks,
    browserFindings,
  };
  fs.writeFileSync(path.join(outDir, "benchmark-report.json"), `${JSON.stringify(report, null, 2)}\n`);

  const grouped = checks.reduce((acc, check) => {
    acc[check.category] ??= [];
    acc[check.category].push(check);
    return acc;
  }, {});
  const markdown = [
    `# L2L Benchmark Report`,
    ``,
    `Final score: **${cappedScore}/100**`,
    p0Failures.length ? `P0 cap: ${p0Failures.join(", ")}` : `P0 cap: none`,
    ``,
    ...Object.entries(grouped).flatMap(([category, items]) => [
      `## ${category}`,
      ...items.map((item) => `- ${item.passed ? "PASS" : "FAIL"} (${item.points}) ${item.name}${item.detail ? ` â€” ${item.detail}` : ""}`),
      ``,
    ]),
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "benchmark-report.md"), markdown);
}

async function main() {
  const skippedGate = { passed: true, durationMs: 0, status: 0 };
  const gateResults = skipGates
    ? { typecheck: skippedGate, lint: skippedGate, unit: skippedGate, build: skippedGate, e2e: skippedGate }
    : {
        typecheck: run("npm run typecheck", "TypeScript"),
        lint: run("npm run lint", "ESLint"),
        unit: run("npm test", "Vitest"),
        build: run("npm run build", "Next production build"),
        e2e: run("npm run e2e", "Playwright E2E"),
      };

  const bundleLeaks = scanClientBundles();
  addCheck("Exam Integrity", "No answer-bearing mark-scheme strings in .next/static", 15, bundleLeaks.length === 0, bundleLeaks.join("; "));

  const gradingServerOnly =
    fs.readFileSync(path.join(repoRoot, "src", "lib", "grading.ts"), "utf8").includes('import "server-only"') &&
    fs.readFileSync(path.join(repoRoot, "src", "lib", "paper-mark-scheme.server.ts"), "utf8").includes('import "server-only"') &&
    scanClientSourceImports().length === 0;
  addCheck("Exam Integrity", "Grading/hint/audit use server-only mark-scheme access", 5, gradingServerOnly);

  const policies = checkSupabasePolicies();
  addCheck(
    "Exam Integrity",
    "Supabase mark-scheme/resource policies are not public-readable",
    5,
    policies.passed,
    policies.publicMarkScheme || policies.publicChunks ? JSON.stringify(policies) : "",
  );

  const privacyTestExists = fs.existsSync(path.join(repoRoot, "src", "lib", "paper-privacy.test.ts"));
  addCheck("Exam Integrity", "Regression tests block client imports of server-only modules", 5, privacyTestExists);

  const launcher = await ensureProductionServer();
  addCheck("Performance / Reliability", "Local production launcher reliably starts 3001", 3, launcher.passed, launcher.detail);

  const routes = ["/dashboard", "/papers/5054-w25-21", "/exam/demo-attempt", "/results/demo-attempt", "/login"];
  const routeStatuses = await Promise.all(
    routes.map(async (route) => {
      try {
        const response = await fetch(`${baseUrl}${route}`, { cache: "no-store" });
        return { route, status: response.status };
      } catch {
        return { route, status: 0 };
      }
    }),
  );
  addCheck(
    "Performance / Reliability",
    "All benchmarked routes return 200",
    3,
    routeStatuses.every((item) => item.status === 200),
    routeStatuses.map((item) => `${item.route}:${item.status}`).join(", "),
  );

  const browser = await runBrowserBenchmark();
  addCheck(
    "Core Guided Mock Flow",
    "Scan requires all questions visited before first batch",
    5,
    browser.finishInitiallyDisabled && browser.finishEnabledAfterVisit && browser.scanNavigationVisible,
    `finishDisabled=${browser.finishInitiallyDisabled}, finishEnabled=${browser.finishEnabledAfterVisit}, navVisible=${browser.scanNavigationVisible}`,
  );
  addCheck(
    "Core Guided Mock Flow",
    "Stars are simple top-level batch toggles only",
    5,
    browser.confidenceControls === 0 && browser.starAutoAdvancedToQ2,
    `confidenceControls=${browser.confidenceControls}, starAutoAdvance=${browser.starAutoAdvancedToQ2}`,
  );
  addCheck(
    "Core Guided Mock Flow",
    "Finish scan visibly lands on Q1 after transition",
    5,
    browser.landedQ1 && !browser.staleQ9Heading,
    `landedQ1=${browser.landedQ1}, staleQ9=${browser.staleQ9Heading}`,
  );
  addCheck(
    "Core Guided Mock Flow",
    "Next * skips completed/non-active starred questions",
    5,
    browser.restarPromptVisible && browser.restarStartsQ2 && browser.restarAutoAdvancedAfterStar && browser.nextStarReachedQ3,
    `prompt=${browser.restarPromptVisible}, startsQ2=${browser.restarStartsQ2}, restarAutoAdvance=${browser.restarAutoAdvancedAfterStar}, nextStarQ3=${browser.nextStarReachedQ3}`,
  );
  addCheck("Core Guided Mock Flow", "Saved records and resit create non-mutating fresh attempts", 5, browser.resitFresh);
  addCheck("Exam Integrity", "Zero-answer submit displays 0/80 with no sample-grade leakage", 0, browser.zeroSubmitDisplaysZero);

  const qualityGatePass = gateResults.typecheck.passed && gateResults.lint.passed && gateResults.unit.passed && gateResults.build.passed;
  addCheck("Automated Quality Gates", "typecheck, lint, unit, build pass", 8, qualityGatePass);
  addCheck("Automated Quality Gates", "E2E desktop/mobile pass", 6, gateResults.e2e.passed);

  const hint = await fetchJson("/api/hint", {
    paperId: "5054-w25-21",
    questionId: "q1",
    subQuestionId: "q1a",
    answerDraft: "",
  });
  const hintText = JSON.stringify(hint.json ?? hint.text);
  const hintNoLeaks = hint.response.status === 200 && !knownLeaks.some((leak) => leak.pattern.test(hintText));
  addCheck("Automated Quality Gates", "Hint leak guard blocks known final answers", 3, hintNoLeaks, hintNoLeaks ? "" : hintText.slice(0, 400));

  const grade = await fetchJson("/api/grade", { responses: {}, hintUsage: {}, attemptOrder: [], batchHistory: [], questionTimeSeconds: {} });
  const audit = await fetchJson("/api/audit", { responses: {}, hintUsage: {}, attemptOrder: [], batchHistory: [], questionTimeSeconds: {} });
  const apiContracts =
    grade.response.status === 200 &&
    grade.json?.totalAwarded === 0 &&
    grade.json?.provenance === "deterministic" &&
    grade.json?.answeredPartCount === 0 &&
    Array.isArray(grade.json?.awards) &&
    audit.response.status === 200 &&
    typeof audit.json?.grade?.totalAwarded === "number" &&
    Array.isArray(audit.json?.audit?.nextSession);
  addCheck("Automated Quality Gates", "API contract checks pass", 3, apiContracts);
  const releaseScripts = releaseScriptsAvoidDirectProdDeploy();
  addCheck("Automated Quality Gates", "No direct Vercel production deploy script", 0, releaseScripts.passed, releaseScripts.offenders.join(", "));

  addCheck("Performance / Reliability", "Dashboard desktop benchmark under 2200ms", 3, browser.dashboardStatus === 200 && browser.dashboardMs < 2200, `${browser.dashboardMs}ms`);
  const largest = largestJsChunk();
  addCheck("Performance / Reliability", "Largest JS chunk under 300 KB", 3, largest.bytes < 300 * 1024, `${largest.file} ${(largest.bytes / 1024).toFixed(1)} KB`);
  addCheck(
    "Performance / Reliability",
    "No console/page errors or failed non-aborted requests",
    3,
    browserFindings.consoleErrors.length === 0 && browserFindings.failedRequests.length === 0,
    [...browserFindings.consoleErrors, ...browserFindings.failedRequests].slice(0, 5).join("; "),
  );

  addCheck("UX / Accessibility", "No horizontal overflow desktop/mobile", 2, browser.noOverflow);
  addCheck("UX / Accessibility", "No unlabeled interactive elements", 2, browser.unlabeledCount === 0, `${browser.unlabeledCount} unlabeled`);
  addCheck("UX / Accessibility", "No tiny unreadable text flags", 2, browser.tinyTextCount === 0, `${browser.tinyTextCount} tiny text nodes`);
  addCheck("UX / Accessibility", "Dashboard metric bars are named and actionable", 2, browser.dashboardActionableBars);
  addCheck("UX / Accessibility", "Screenshots generated for dashboard, exam scan, exam answer, results mobile", 2, screenshotArtifactsExist());

  const rawScore = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);
  const p0Failures = checks
    .filter((check) => check.category === "Exam Integrity" && !check.passed)
    .map((check) => check.name);
  const finalScore = p0Failures.length > 0 ? Math.min(rawScore, 89) : rawScore;

  writeReport(rawScore, finalScore, p0Failures);

  console.log(`\nL2L benchmark score: ${finalScore}/100`);
  console.log(`Artifacts: ${path.join(outDir, "benchmark-report.md")}`);

  if (finalScore <= 90 || p0Failures.length > 0) {
    process.exitCode = 1;
  }

  if (ciMode && process.exitCode) {
    console.error("Benchmark failed CI threshold.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
