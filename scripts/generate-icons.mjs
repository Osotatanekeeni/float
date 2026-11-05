// Generates the PWA icons and the mark's vector source from one drawing (run: node scripts/generate-icons.mjs).
// The mark is two overlapping flowing lines, money moving across time (DESIGN.md 1); no currency symbol,
// coin, piggy bank or arrow. Maskable icons are full-bleed with the drawing inside the safe zone.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const TEAL = "#235E62";
const SAGE = "#75A99A";
const IVORY = "#F8F7F1";

const waves = (scale) => `
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)" fill="none" stroke-linecap="round" stroke-width="40">
    <path d="M92 276 C 150 176, 214 176, 256 240 S 362 304, 420 204" stroke="${IVORY}"/>
    <path d="M92 344 C 150 244, 214 244, 256 308 S 362 372, 420 272" stroke="${SAGE}"/>
  </g>`;

const svg = ({ radius, scale }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="${radius}" fill="${TEAL}"/>${waves(scale)}
</svg>`;

const any = svg({ radius: 112, scale: 1 });
const maskable = svg({ radius: 0, scale: 0.72 });

await mkdir("public/icons", { recursive: true });
await mkdir("src/pwa", { recursive: true });
await writeFile("src/pwa/mark.svg", `${any}\n`);

const out = [
  ["public/icons/icon-192.png", any, 192],
  ["public/icons/icon-512.png", any, 512],
  ["public/icons/maskable-192.png", maskable, 192],
  ["public/icons/maskable-512.png", maskable, 512],
  ["public/icons/apple-touch-icon.png", maskable, 180], // iOS rounds the corners itself
];
for (const [path, source, size] of out) {
  await sharp(Buffer.from(source)).resize(size, size).png().toFile(path);
  console.log("wrote", path);
}
