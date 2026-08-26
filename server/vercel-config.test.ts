import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel deployment configuration", () => {
  it("serves the Vite client separately from the Express API function", () => {
    const configPath = path.resolve(import.meta.dirname, "../vercel.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    expect(config.outputDirectory).toBe("dist/public");
    expect(config.functions["api/**/*.ts"].maxDuration).toBe(30);
    expect(config.crons).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "/api/scheduled/activity-reminders", schedule: "0 7 * * *" }),
    ]));
    expect(config.rewrites).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "/((?!api/).*)", destination: "/index.html" }),
    ]));
    expect(fs.existsSync(path.resolve(import.meta.dirname, "../api/[...path].ts"))).toBe(true);
  });
});
