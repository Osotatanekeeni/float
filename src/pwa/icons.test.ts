import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  expect(buf.subarray(1, 4).toString("ascii"), `${path} is a PNG`).toBe("PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// FLT-PWA-01: installable icons, including maskable at 192 and 512
describe("PWA icons", () => {
  const expected: [string, number][] = [
    ["public/icons/icon-192.png", 192],
    ["public/icons/icon-512.png", 512],
    ["public/icons/maskable-192.png", 192],
    ["public/icons/maskable-512.png", 512],
    ["public/icons/apple-touch-icon.png", 180],
  ];

  it.each(expected)("%s is %ipx square", (path, size) => {
    expect(pngSize(path)).toEqual({ width: size, height: size });
  });

  it("keeps a vector source for the mark", () => {
    expect(readFileSync("src/pwa/mark.svg", "utf8")).toContain("<svg");
  });

  it("avoids the imagery DESIGN.md rules out (no currency symbols, coins or arrows)", () => {
    const svg = readFileSync("src/pwa/mark.svg", "utf8");
    expect(svg).not.toMatch(/<text|₦|\$|coin|arrow/i);
  });
});
