import { chromium, devices, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const preferredBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";
const fallbackBaseUrl = "http://127.0.0.1:3000";
const outDir = path.join(repoRoot, "test-results", "e2e-l2l");
fs.mkdirSync(outDir, { recursive: true });

async function seedDemoProfile(page, baseUrl) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
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

async function isLive(url) {
  try {
    const response = await fetch(`${url}/dashboard`, { cache: "no-store" });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function getBaseUrl() {
  if (await isLive(preferredBaseUrl)) {
    return { baseUrl: preferredBaseUrl, stop: async () => {} };
  }

  const stdout = fs.openSync(path.join(outDir, "dev.out.log"), "a");
  const stderr = fs.openSync(path.join(outDir, "dev.err.log"), "a");
  const child = spawn("npm run dev -- -p 3000", {
    cwd: repoRoot,
    shell: true,
    stdio: ["ignore", stdout, stderr],
  });
  fs.closeSync(stdout);
  fs.closeSync(stderr);

  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (await isLive(fallbackBaseUrl)) {
      return {
        baseUrl: fallbackBaseUrl,
        stop: async () => {
          child.kill("SIGTERM");
        },
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  child.kill("SIGTERM");
  throw new Error("Could not start or find an L2L test server.");
}

async function clickNextQuestion(page) {
  await page.getByRole("button", { name: /Next question/i }).first().click();
  await page.waitForTimeout(280);
}

async function clickCurrentStar(page) {
  await page.getByRole("button", { name: /^Star$/i }).first().click();
  await page.waitForTimeout(280);
}

async function scanAllWithFirstStar(page) {
  await page.getByRole("button", { name: /Begin scan/i }).click();
  await expect(page.getByRole("button", { name: /Previous question/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Next question/i }).first()).toBeVisible();
  await clickCurrentStar(page);
  await expect(page.getByRole("heading", { name: /^Q2\./i })).toBeVisible();
  for (let index = 0; index < 7; index += 1) {
    await clickNextQuestion(page);
  }
}

async function runDesktopFlow(baseUrl) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(9000);
    await seedDemoProfile(page, baseUrl);

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Physics cockpit for Cambridge O Level/i })).toBeVisible();
    await expect(page.getByText(/Complete a mock to unlock real records|Waiting/i).first()).toBeVisible();

    await page.goto(`${baseUrl}/exam/e2e-scored`, { waitUntil: "domcontentloaded" });
    await scanAllWithFirstStar(page);
    await page.getByRole("button", { name: /Finish scan/i }).click();
    await expect(page.getByRole("heading", { name: /^Q1\./i })).toBeVisible();
    await page.getByPlaceholder("Write your answer here...").first().fill("change in momentum 18000 force = change in momentum / time, so 12000 N");
    await page.getByRole("button", { name: /Hint/i }).first().click();
    const dialog = page.getByRole("dialog", { name: /Hint/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).not.toContainText("12000");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Mark question done/i }).click();
    await page.getByRole("button", { name: /Submit mock/i }).first().click();
    await expect(page.getByRole("heading", { name: /Results coach/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Saved test records/i })).toBeVisible();

    await page.goto(`${baseUrl}/exam/e2e-blank`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const user = window.localStorage.getItem("l2l:student-user");
      const profile = window.localStorage.getItem("l2l:student-profile");
      window.localStorage.clear();
      if (user) window.localStorage.setItem("l2l:student-user", user);
      if (profile) window.localStorage.setItem("l2l:student-profile", profile);
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await scanAllWithFirstStar(page);
    await page.getByRole("button", { name: /Finish scan/i }).click();
    await page.getByRole("button", { name: /Submit mock/i }).first().click();
    await expect(page.getByRole("heading", { name: /Results coach/i })).toBeVisible();
    await expect(page.getByText("0/80").first()).toBeVisible();
    await expect(page.getByText(/You answered 0 question parts/i)).toBeVisible();
    await expect(page.getByText(/No response evidence yet/i)).toBeVisible();
    await expect(page.getByText(/16\/80/)).toHaveCount(0);

    const resultsUrl = page.url();
    await page.getByRole("button", { name: /Resit paper/i }).first().click();
    await page.waitForURL(/\/exam\//);
    if (page.url() === resultsUrl) {
      throw new Error("Resit did not create a fresh attempt URL.");
    }
  } finally {
    await browser.close();
  }
}

async function runMobileSmoke(baseUrl) {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext(devices["Pixel 7"]);
    const page = await context.newPage();
    page.setDefaultTimeout(9000);
    await seedDemoProfile(page, baseUrl);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Physics cockpit for Cambridge O Level/i })).toBeVisible();
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2);
    if (!noOverflow) {
      throw new Error("Mobile dashboard has horizontal overflow.");
    }
  } finally {
    await browser.close();
  }
}

const server = await getBaseUrl();
try {
  await runDesktopFlow(server.baseUrl);
  await runMobileSmoke(server.baseUrl);
  console.log(`L2L E2E passed against ${server.baseUrl}`);
} finally {
  await server.stop();
}
