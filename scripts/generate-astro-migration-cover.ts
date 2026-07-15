import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "src", "assets", "images", "posts", "astro-migration.webp");

const seed = 0x41535452;
let state = seed;
const random = () => {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let value = Math.imul(state ^ (state >>> 15), 1 | state);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
};

const stars = Array.from({ length: 68 }, () => {
  const x = Math.round(random() * 1500);
  const y = Math.round(random() * 1000);
  const radius = (0.7 + random() * 2).toFixed(1);
  const opacity = (0.12 + random() * 0.45).toFixed(2);
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="#fafafa" opacity="${opacity}" />`;
}).join("\n");

const flowDots = Array.from({ length: 13 }, (_, index) => {
  const offset = (index * 7.3).toFixed(1);
  const duration = (3.2 + (index % 4) * 0.45).toFixed(2);
  return `
    <circle r="4" fill="#fb923c" filter="url(#soft-glow)">
      <animateMotion dur="${duration}s" begin="-${offset}s" repeatCount="indefinite" path="M 520 500 C 650 405, 740 405, 850 500 S 1080 595, 1185 500" />
    </circle>`;
}).join("");

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1000" viewBox="0 0 1500 1000">
  <defs>
    <linearGradient id="background" x1="120" y1="70" x2="1380" y2="930" gradientUnits="userSpaceOnUse">
      <stop stop-color="#18181b" />
      <stop offset="0.52" stop-color="#09090b" />
      <stop offset="1" stop-color="#18181b" />
    </linearGradient>
    <radialGradient id="core" cx="0" cy="0" r="1" gradientTransform="translate(750 500) rotate(90) scale(240)">
      <stop stop-color="#f97316" stop-opacity="0.34" />
      <stop offset="0.45" stop-color="#f97316" stop-opacity="0.08" />
      <stop offset="1" stop-color="#f97316" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="orange-line" x1="490" y1="500" x2="1210" y2="500" gradientUnits="userSpaceOnUse">
      <stop stop-color="#a1a1aa" stop-opacity="0.25" />
      <stop offset="0.42" stop-color="#fb923c" />
      <stop offset="0.62" stop-color="#fdba74" />
      <stop offset="1" stop-color="#a1a1aa" stop-opacity="0.25" />
    </linearGradient>
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#71717a" stroke-width="1" opacity="0.075" />
    </pattern>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000" flood-opacity="0.4" />
    </filter>
    <filter id="soft-glow" x="-400%" y="-400%" width="800%" height="800%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <clipPath id="canvas"><rect width="1500" height="1000" rx="36" /></clipPath>
  </defs>

  <g clip-path="url(#canvas)">
    <rect width="1500" height="1000" fill="url(#background)" />
    <rect width="1500" height="1000" fill="url(#grid)" />
    ${stars}
    <circle cx="750" cy="500" r="240" fill="url(#core)" />

    <!-- Left: content and source file tree -->
    <g filter="url(#shadow)">
      <rect x="130" y="244" width="390" height="512" rx="22" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
      <circle cx="167" cy="282" r="6" fill="#f97316" />
      <circle cx="189" cy="282" r="6" fill="#52525b" />
      <circle cx="211" cy="282" r="6" fill="#52525b" />
      <path d="M 171 344 V 665" stroke="#3f3f46" stroke-width="2" />
      <path d="M 171 389 H 203 M 171 455 H 203 M 171 521 H 203 M 171 587 H 203 M 171 653 H 203" stroke="#52525b" stroke-width="2" />
      <g fill="#27272a" stroke="#52525b">
        <rect x="203" y="330" width="252" height="42" rx="9" />
        <rect x="203" y="396" width="218" height="42" rx="9" />
        <rect x="203" y="462" width="270" height="42" rx="9" />
        <rect x="203" y="528" width="232" height="42" rx="9" />
        <rect x="203" y="594" width="250" height="42" rx="9" />
        <rect x="203" y="660" width="196" height="42" rx="9" />
      </g>
      <g fill="#a1a1aa">
        <rect x="226" y="346" width="90" height="10" rx="5" />
        <rect x="226" y="412" width="132" height="10" rx="5" />
        <rect x="226" y="478" width="104" height="10" rx="5" />
        <rect x="226" y="544" width="120" height="10" rx="5" />
        <rect x="226" y="610" width="78" height="10" rx="5" />
        <rect x="226" y="676" width="114" height="10" rx="5" />
      </g>
      <g fill="#fb923c">
        <circle cx="433" cy="351" r="5" /><circle cx="399" cy="417" r="5" />
        <circle cx="451" cy="483" r="5" /><circle cx="413" cy="549" r="5" />
        <circle cx="431" cy="615" r="5" /><circle cx="377" cy="681" r="5" />
      </g>
    </g>

    <!-- Center: build-time transform and orbit -->
    <path d="M 520 500 C 650 405, 740 405, 850 500 S 1080 595, 1185 500" fill="none" stroke="url(#orange-line)" stroke-width="3" stroke-dasharray="7 12" />
    <ellipse cx="750" cy="500" rx="165" ry="92" fill="none" stroke="#fb923c" stroke-width="2" opacity="0.34" transform="rotate(-24 750 500)" />
    <ellipse cx="750" cy="500" rx="165" ry="92" fill="none" stroke="#a1a1aa" stroke-width="2" opacity="0.22" transform="rotate(34 750 500)" />
    <g filter="url(#shadow)">
      <path d="M 750 420 L 812 456 V 528 L 750 564 L 688 528 V 456 Z" fill="#18181b" stroke="#fb923c" stroke-width="3" />
      <circle cx="750" cy="492" r="30" fill="#f97316" opacity="0.14" />
      <path d="M 750 462 V 522 M 720 492 H 780 M 729 471 L 771 513 M 771 471 L 729 513" stroke="#fdba74" stroke-width="7" stroke-linecap="round" />
    </g>
    <circle cx="625" cy="422" r="8" fill="#fb923c" filter="url(#soft-glow)" />
    <circle cx="853" cy="585" r="6" fill="#fdba74" filter="url(#soft-glow)" />
    ${flowDots}

    <!-- Right: generated static pages -->
    <g filter="url(#shadow)">
      <rect x="1050" y="292" width="310" height="416" rx="20" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
      <rect x="1000" y="332" width="310" height="416" rx="20" fill="#202023" stroke="#52525b" stroke-width="2" />
      <rect x="950" y="372" width="310" height="416" rx="20" fill="#27272a" stroke="#71717a" stroke-width="2" />
      <rect x="986" y="412" width="238" height="126" rx="12" fill="#18181b" />
      <circle cx="1014" cy="442" r="9" fill="#f97316" />
      <path d="M 1038 438 H 1172 M 1038 462 H 1142" stroke="#71717a" stroke-width="10" stroke-linecap="round" />
      <path d="M 986 574 H 1224 M 986 614 H 1178 M 986 654 H 1206 M 986 694 H 1138" stroke="#a1a1aa" stroke-width="11" stroke-linecap="round" opacity="0.6" />
      <rect x="986" y="735" width="86" height="14" rx="7" fill="#fb923c" opacity="0.78" />
    </g>
  </g>
</svg>`;

await mkdir(path.dirname(output), { recursive: true });
await sharp(Buffer.from(svg))
  .resize(1500, 1000)
  .webp({ quality: 88, effort: 6, smartSubsample: true })
  .toFile(output);

const metadata = await sharp(output).metadata();
console.log(`Generated ${path.relative(root, output)} (${metadata.width}x${metadata.height}, seed ${seed})`);
