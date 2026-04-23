import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { demoPaper } from "@/lib/paper-data";

const repoRoot = process.cwd();
const clientSourceRoots = ["src/app", "src/components"];
const forbiddenClientImports = ["/lib/grading", "paper-mark-scheme.server"];

function walkFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (absolutePath.includes(`${path.sep}api${path.sep}`)) {
        return [];
      }
      return walkFiles(absolutePath);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [absolutePath] : [];
  });
}

describe("public paper data privacy", () => {
  it("does not expose mark-scheme fields in the client-safe paper seed", () => {
    const serialized = JSON.stringify(demoPaper);
    expect(serialized).not.toContain("\"markScheme\"");
    expect(serialized).not.toContain("\"acceptable\"");
    expect(serialized).not.toContain("\"avoidRevealHint\"");
  });

  it("blocks client-facing imports of server-only marking modules", () => {
    const offenders = clientSourceRoots
      .flatMap((root) => walkFiles(path.join(repoRoot, root)))
      .filter((filePath) => !filePath.endsWith(".test.ts"))
      .filter((filePath) => {
        const source = fs.readFileSync(filePath, "utf8");
        return forbiddenClientImports.some((token) => source.includes(token));
      });

    expect(offenders.map((filePath) => path.relative(repoRoot, filePath))).toEqual([]);
  });
});
