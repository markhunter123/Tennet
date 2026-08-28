/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Regenerate the canonical brand assets:
 *   tennet-desktop/assets/icon.png          — 1024x1024 app lockup
 *   .github/assets/tennet-hero.en.png       — 1774x887 English banner
 *   .github/assets/tennet-hero.zh-CN.png    — 1774x887 Chinese banner
 *
 * The beacon mark geometry is shared with scripts/generate-app-icons.py via
 * the exported SVGs below (same constants, duplicated here so the mark and
 * the lockup render from one place at asset time). The wordmark paths are the
 * traced outlines from tennet-ui/src/tennet-wordmark.tsx.
 *
 * Requires the Playwright chromium browser (bundled with the desktop suite).
 */

import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = fileURLToPath(new URL('..', import.meta.url));

// ---- beacon mark geometry (must match scripts/generate-app-icons.py) ------
const STROKE = 70;
const BAR = [[352, 200], [672, 200]];
const STEM = [[512, 235], [512, 700]];
const SIGNAL = [[476, 145], [512, 100], [548, 145]];
const MARK_BOX = { x: BAR[0][0] - STROKE / 2, y: SIGNAL[1][1] - STROKE / 2, w: 390, h: 670 };

function markPaths(colors) {
  const stroke = (points, color, cap = 'round') =>
    `<path d="M ${points.map((p) => `${p[0]} ${p[1]}`).join(' L ')}" stroke="${color}" stroke-width="${STROKE}" stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>`;
  return (
    stroke(STEM, colors.stem) +
    stroke(SIGNAL, colors.signal) +
    stroke(BAR, colors.bar)
  );
}

const WORDMARK_PATHS = `M2639 1187 c-38 -29 -39 -46 -39 -479 0 -400 1 -425 19 -455 23 -37 68 -50 108 -31 41 20 53 53 53 154 0 83 2 92 25 114 l24 23 143 -138 c79 -75 156 -143 171 -151 57 -30 127 14 127 79 0 32 -39 75 -217 238 l-82 75 130 103 c157 125 173 152 123 210 -21 25 -34 31 -65 31 -35 0 -55 -13 -209 -140 l-170 -139 0 229 0 228 -26 31 c-20 24 -34 31 -62 31 -21 0 -44 -6 -53 -13z M1926 969 c-109 -26 -216 -114 -264 -217 -24 -50 -27 -69 -27 -162 0 -95 3 -111 28 -162 39 -79 104 -143 185 -181 62 -29 75 -32 168 -32 94 0 105 2 164 33 35 18 64 31 64 30 18 -50 63 -74 111 -58 57 19 60 32 57 258 -2 176 -6 211 -23 258 -24 63 -100 151 -163 188 -84 49 -205 67 -300 45z m142 -170 c93 -20 171 -113 172 -205 0 -58 -45 -140 -97 -177 -112 -80 -278 -26 -328 107 -43 112 34 247 158 276 45 11 41 11 95 -1z M547 960 c-105 -18 -200 -90 -248 -187 -23 -45 -24 -60 -27 -268 -2 -120 -1 -229 3 -242 7 -30 58 -56 94 -48 16 3 38 16 49 28 19 20 21 36 24 227 3 226 8 248 69 290 69 50 157 44 215 -14 46 -46 54 -88 54 -297 0 -179 1 -186 23 -207 43 -40 100 -37 134 7 9 11 12 71 13 201 0 102 5 202 10 222 32 114 172 160 264 87 55 -44 60 -66 61 -284 1 -110 5 -208 9 -218 13 -27 63 -49 97 -42 16 4 38 18 49 32 19 24 20 40 20 228 0 224 -8 268 -61 348 -60 90 -158 139 -280 139 -62 1 -88 -4 -135 -26 -33 -15 -71 -38 -85 -52 l-27 -26 -50 36 c-82 60 -179 83 -275 66z M3659 960 c-137 -23 -264 -138 -299 -268 -53 -202 61 -407 260 -466 102 -30 242 -14 304 35 15 12 28 20 29 18 1 -2 7 -13 13 -24 26 -48 94 -55 135 -14 19 19 20 30 17 237 -3 214 -3 218 -31 273 -50 103 -163 186 -282 208 -65 12 -79 12 -146 1z m114 -201 c33 -65 48 -81 107 -112 59 -31 61 -49 10 -72 -52 -24 -93 -70 -115 -131 -10 -27 -24 -56 -32 -64 -11 -12 -15 -12 -26 0 -8 8 -19 35 -26 59 -14 48 -67 110 -121 139 -19 10 -35 25 -35 33 0 7 21 23 46 35 52 25 106 82 115 122 8 34 24 54 38 49 6 -2 23 -28 39 -58z`;

const wordmark = (x, y, scale, fill = '#FFFFFF') =>
  `<g transform="translate(${x},${y}) scale(${scale})"><g transform="translate(0,120) scale(0.1,-0.1)" fill="${fill}" stroke="none">` +
  `<path d="${WORDMARK_PATHS}"/></g></g>`;

const mark = (x, y, scale, colors) =>
  `<g transform="translate(${x - MARK_BOX.x * scale},${y - MARK_BOX.y * scale}) scale(${scale})">` +
  markPaths(colors) + '</g>';

// ---- icon.png: tile lockup -------------------------------------------------
function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="tile" x1="158.4" y1="158.4" x2="865.6" y2="865.6" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0B1F3F"/><stop offset="1" stop-color="#1F6FEB"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="229" ry="229" fill="url(#tile)"/>
  ${mark(512, 400, 0.40, { stem: '#BFD9FF', signal: '#FFFFFF', bar: '#FFFFFF' })}
  ${wordmark(302, 660, 420 / 460)}
</svg>`;
}

// ---- hero banners -----------------------------------------------------------
function heroSvg(tagline, fontFamily) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1774 887" width="1774" height="887">
  <defs>
    <linearGradient id="bg" x1="80" y1="80" x2="1694" y2="807" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#060B14"/><stop offset="0.55" stop-color="#0A1B36"/><stop offset="1" stop-color="#12315F"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#2F6CF6" stop-opacity="0.32"/><stop offset="1" stop-color="#2F6CF6" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#7FB0FF" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1774" height="887" fill="url(#bg)"/>
  <rect width="1774" height="887" fill="url(#grid)"/>
  <ellipse cx="360" cy="300" rx="640" ry="540" fill="url(#glow)"/>
  <path d="M 0 780 L 480 780 L 590 690 L 780 690" fill="none" stroke="#7FB0FF" stroke-opacity="0.16" stroke-width="2" stroke-linecap="round"/>
  <path d="M 1774 90 L 1620 90 L 1560 150" fill="none" stroke="#7FB0FF" stroke-opacity="0.12" stroke-width="2" stroke-linecap="round"/>
  ${mark(355, 443, 0.52, { stem: '#BFD9FF', signal: '#4DA3FF', bar: '#FFFFFF' })}
  ${wordmark(600, 250, 700 / 460)}
  <text x="604" y="520" font-family="${fontFamily}" font-size="46" fill="#9DB8E8">${tagline}</text>
  <g>
    <rect x="600" y="576" rx="20" width="128" height="42" fill="none" stroke="#6E9FE8" stroke-opacity="0.45" stroke-width="1.5"/>
    <text x="664" y="605" font-family="${fontFamily}" font-size="26" fill="#6E9FE8" text-anchor="middle">v1.0.0</text>
  </g>
</svg>`;
}

const html = (svg) => `<!DOCTYPE html><html><head><style>
  html,body{margin:0;padding:0;overflow:hidden;background:#000}
  svg{display:block}
</style></head><body>${svg}</body></html>`;

async function shoot(page, svg, width, height, path) {
  await page.setViewportSize({ width, height });
  await page.setContent(html(svg), { waitUntil: 'networkidle' });
  await page.locator('svg').waitFor({ state: 'visible' });
  await page.screenshot({ path, omitBackground: false });
  console.log(`wrote ${path}`);
}

const out = {
  icon: fileURLToPath(new URL('../tennet-desktop/assets/icon.png', import.meta.url)),
  heroEn: fileURLToPath(new URL('../.github/assets/tennet-hero.en.png', import.meta.url)),
  heroZh: fileURLToPath(new URL('../.github/assets/tennet-hero.zh-CN.png', import.meta.url)),
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await shoot(page, iconSvg(), 1024, 1024, out.icon);
  await shoot(page, heroSvg('Your personal AI agent', 'Segoe UI, sans-serif'), 1774, 887, out.heroEn);
  await shoot(page, heroSvg('你的个人 AI 助手', 'Microsoft YaHei, PingFang SC, sans-serif'), 1774, 887, out.heroZh);
} finally {
  await browser.close();
}
console.log('done');
