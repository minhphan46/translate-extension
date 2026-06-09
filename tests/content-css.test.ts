import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("content stylesheet", () => {
  const css = readFileSync(resolve(process.cwd(), "src/content/content.css"), "utf8");

  it("does not inject Tailwind or global page resets into host websites", () => {
    expect(css).not.toMatch(/@tailwind\b/);
    expect(css).not.toMatch(/(^|[,{]\s*)(html|body|\*)\b/);
    expect(css).not.toContain("--tw-");
  });
});
