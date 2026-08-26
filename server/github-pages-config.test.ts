import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");

describe("GitHub Pages static presentation configuration", () => {
  it("builds Vite under the repository subpath without bundling the server", () => {
    const packageJson = fs.readFileSync(path.join(projectRoot, "package.json"), "utf8");
    const viteConfig = fs.readFileSync(path.join(projectRoot, "vite.config.ts"), "utf8");

    expect(packageJson).toContain('"build:pages": "VITE_GITHUB_PAGES=true vite build && cp dist/public/index.html dist/public/404.html && touch dist/public/.nojekyll"');
    expect(viteConfig).toContain('base: isGitHubPagesBuild ? "/SIG-CDEJ/" : "/"');
  });

  it("publishes the static client through the official Pages workflow", () => {
    const workflow = fs.readFileSync(path.join(projectRoot, ".github/workflows/deploy-pages.yml"), "utf8");
    const landing = fs.readFileSync(path.join(projectRoot, "client/src/pages/GitHubPagesLanding.tsx"), "utf8");

    expect(workflow).toContain("actions/upload-pages-artifact@v3");
    expect(workflow).toContain("actions/deploy-pages@v4");
    expect(workflow).toContain("pnpm build:pages");
    expect(workflow).toContain("uses: pnpm/action-setup@v4");
    expect(workflow).not.toContain("version: 10");
    expect(landing).toContain("Version publique statique");
  });

  it("ships a fallback document for GitHub Pages deep links", () => {
    const packageJson = fs.readFileSync(path.join(projectRoot, "package.json"), "utf8");

    expect(packageJson).toContain("cp dist/public/index.html dist/public/404.html");
    expect(packageJson).toContain("touch dist/public/.nojekyll");
  });
});
