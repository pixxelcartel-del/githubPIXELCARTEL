import { describe, expect, it } from "vitest";
import { isThemeMode, resolveThemeMode } from "@/lib/theme";

describe("theme utilities", () => {
  it("resolves system theme from the OS preference", () => {
    expect(resolveThemeMode("system", true)).toBe("dark");
    expect(resolveThemeMode("system", false)).toBe("light");
  });

  it("keeps explicit themes stable", () => {
    expect(resolveThemeMode("light", true)).toBe("light");
    expect(resolveThemeMode("dark", false)).toBe("dark");
  });

  it("validates persisted theme modes", () => {
    expect(isThemeMode("light")).toBe(true);
    expect(isThemeMode("nope")).toBe(false);
  });
});
