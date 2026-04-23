import { expect, test } from "@playwright/test";

async function clickNextPage(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /Next question/i }).first().click();
  await page.waitForTimeout(320);
}

async function clickCurrentStar(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /^Star$/i }).first().click();
  await page.waitForTimeout(320);
}

test("student can open dashboard and begin the guided mock", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Today'?s practice cockpit/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Syllabus mastery matrix/i })).toBeVisible();
  await expect(page.getByText(/Priority drill/i).first()).toBeVisible();
  await page.getByRole("button", { name: /Start guided mock/i }).click();
  await expect(page.getByRole("heading", { name: /Scan first/i })).toBeVisible();
  await page.getByRole("button", { name: /Begin scan/i }).click();
  await expect(page.getByRole("button", { name: /^Star$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Previous question/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Next question/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Scan all pages first/i })).toBeDisabled();
});

test("dashboard supports light and dark theme switching", async ({ page }) => {
  await page.goto("/dashboard");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: /Dark/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /Light/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("hint modal opens without leaking final numeric answers", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/exam/demo-attempt");
  await page.getByRole("button", { name: /Begin scan/i }).click();
  await clickCurrentStar(page);
  await expect(page.getByRole("heading", { name: /^Q2\./i })).toBeVisible();
  for (let index = 0; index < 7; index += 1) {
    await clickNextPage(page);
  }
  await page.getByRole("button", { name: /Finish scan/i }).click();
  await expect(page.getByRole("main").getByText(/Returning to page 1/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Q1\./i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Q9\./i })).toHaveCount(0);
  await page.getByRole("button", { name: /^Next$/i }).first().click();
  await page.getByRole("button", { name: /Hint/i }).first().click();

  const dialog = page.getByRole("dialog", { name: /Hint/i });
  await expect(dialog).toBeVisible();
  await expect(dialog).not.toContainText("12000");
  await expect(dialog).not.toContainText("1400");
  await expect(dialog).not.toContainText("36000");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("submitted records are saved and resit opens a fresh paper", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/exam/demo-attempt");
  await page.getByRole("button", { name: /Begin scan/i }).click();
  await clickCurrentStar(page);
  await expect(page.getByRole("heading", { name: /^Q2\./i })).toBeVisible();
  for (let index = 0; index < 7; index += 1) {
    await clickNextPage(page);
  }
  await page.getByRole("button", { name: /Finish scan/i }).click();
  await page.getByPlaceholder("Write your answer here...").first().fill("change in momentum 18000 force = change in momentum / time 12000 N");
  await page.getByRole("button", { name: /Mark question done/i }).click();
  await page.getByRole("button", { name: /Submit mock/i }).first().click();

  await expect(page.getByRole("heading", { name: /Results coach/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Saved test records/i })).toBeVisible();
  await expect(page.getByText(/5054\/21/).first()).toBeVisible();

  const resultsUrl = page.url();
  await page.getByRole("button", { name: /Resit paper/i }).first().click();
  await expect(page.getByRole("heading", { name: /Scan first/i })).toBeVisible();
  expect(page.url()).not.toBe(resultsUrl);
});

test("blank submitted attempt shows zero score and no fake loss analytics", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/exam/demo-attempt");
  await page.getByRole("button", { name: /Begin scan/i }).click();
  await clickCurrentStar(page);
  await expect(page.getByRole("heading", { name: /^Q2\./i })).toBeVisible();
  for (let index = 0; index < 7; index += 1) {
    await clickNextPage(page);
  }
  await page.getByRole("button", { name: /Finish scan/i }).click();
  await page.getByRole("button", { name: /Submit mock/i }).first().click();

  await expect(page.getByRole("heading", { name: /Results coach/i })).toBeVisible();
  await expect(page.getByText("0/80").first()).toBeVisible();
  await expect(page.getByText(/You answered 0 question parts/i)).toBeVisible();
  await expect(page.getByText(/No response evidence yet/i)).toBeVisible();
  await expect(page.getByText(/16\/80/)).toHaveCount(0);
});

test("re-star batch does not return to an already completed question", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/exam/demo-attempt");
  await page.getByRole("button", { name: /Begin scan/i }).click();
  await clickCurrentStar(page);
  await expect(page.getByRole("heading", { name: /^Q2\./i })).toBeVisible();
  for (let index = 0; index < 7; index += 1) {
    await clickNextPage(page);
  }
  await page.getByRole("button", { name: /Finish scan/i }).click();
  await page.getByRole("button", { name: /Mark question done/i }).click();
  await expect(page.getByRole("heading", { name: /choose the next easiest unanswered set/i })).toBeVisible();

  await page.getByRole("button", { name: /Scan and star next batch/i }).click();
  await expect(page.getByRole("heading", { name: /^Q2\./i })).toBeVisible();
  await clickNextPage(page);
  await clickNextPage(page);
  await expect(page.getByRole("heading", { name: /^Q4\./i })).toBeVisible();
  await clickCurrentStar(page);
  await expect(page.getByRole("heading", { name: /^Q5\./i })).toBeVisible();
  for (let index = 0; index < 4; index += 1) {
    await clickNextPage(page);
  }
  await page.getByRole("button", { name: /Finish scan/i }).click();

  await expect(page.getByRole("heading", { name: /^Q2\./i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Q1\./i })).toHaveCount(0);
  await page.getByRole("button", { name: /^Next$/i }).first().click();
  await expect(page.getByRole("heading", { name: /^Q4\./i })).toBeVisible();
});
