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
 * the lockup render from one place at asset time). The wordmark paths are
 * generated from Nunito 700 (rounded letterforms matching the original brand
 * style) and shared with tennet-ui/src/tennet-wordmark.tsx.
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

const WORDMARK_PATHS = `M51.3 110 Q41.79 110 35.43 106.78 Q29.07 103.56 25.99 97.35 Q22.92 91.13 22.92 81.91 L22.92 50.75 L15.31 50.75 Q11.8 50.75 9.9 48.92 Q8 47.09 8 43.88 Q8 40.51 9.9 38.76 Q11.8 37 15.31 37 L22.92 37 L22.92 23.69 Q22.92 19.15 25.34 16.81 Q27.75 14.47 32.14 14.47 Q36.53 14.47 38.87 16.81 Q41.21 19.15 41.21 23.69 L41.21 37 L56.72 37 Q60.23 37 62.13 38.76 Q64.03 40.51 64.03 43.88 Q64.03 47.09 62.13 48.92 Q60.23 50.75 56.72 50.75 L41.21 50.75 L41.21 80.89 Q41.21 87.91 44.28 91.42 Q47.35 94.93 54.23 94.93 Q56.72 94.93 58.62 94.49 Q60.52 94.05 61.98 93.91 Q63.74 93.76 64.91 95 Q66.08 96.25 66.08 100.05 Q66.08 102.98 65.13 105.25 Q64.18 107.51 61.69 108.39 Q59.79 108.98 56.72 109.49 Q53.64 110 51.3 110 Z M109.97 110 Q97.82 110 89.05 105.46 Q80.27 100.93 75.51 92.59 Q70.76 84.25 70.76 72.84 Q70.76 61.72 75.37 53.38 Q79.98 45.05 88.1 40.29 Q96.21 35.54 106.6 35.54 Q114.21 35.54 120.28 38.02 Q126.35 40.51 130.67 45.19 Q134.98 49.87 137.25 56.53 Q139.52 63.19 139.52 71.52 Q139.52 74.16 137.69 75.55 Q135.86 76.94 132.5 76.94 L85.54 76.94 L85.54 66.4 L126.64 66.4 L124.3 68.6 Q124.3 61.87 122.33 57.33 Q120.35 52.8 116.62 50.39 Q112.89 47.97 107.33 47.97 Q101.19 47.97 96.87 50.82 Q92.56 53.68 90.29 58.87 Q88.02 64.06 88.02 71.23 L88.02 72.26 Q88.02 84.25 93.65 90.18 Q99.29 96.1 110.26 96.1 Q114.06 96.1 118.82 95.15 Q123.57 94.2 127.81 91.86 Q130.89 90.1 133.23 90.32 Q135.57 90.54 136.96 92.01 Q138.35 93.47 138.64 95.59 Q138.93 97.71 137.84 99.91 Q136.74 102.1 134.1 103.71 Q128.98 106.93 122.33 108.46 Q115.67 110 109.97 110 Z M163.07 109.71 Q158.68 109.71 156.34 107.29 Q154 104.88 154 100.34 L154 45.05 Q154 40.51 156.34 38.17 Q158.68 35.83 162.92 35.83 Q167.17 35.83 169.51 38.17 Q171.85 40.51 171.85 45.05 L171.85 54.99 L170.24 51.34 Q173.46 43.58 180.26 39.56 Q187.06 35.54 195.69 35.54 Q204.33 35.54 209.88 38.76 Q215.44 41.97 218.22 48.48 Q221 54.99 221 64.94 L221 100.34 Q221 104.88 218.66 107.29 Q216.32 109.71 211.93 109.71 Q207.54 109.71 205.13 107.29 Q202.72 104.88 202.72 100.34 L202.72 65.82 Q202.72 57.48 199.57 53.68 Q196.43 49.87 189.84 49.87 Q181.8 49.87 177.04 54.92 Q172.29 59.97 172.29 68.31 L172.29 100.34 Q172.29 109.71 163.07 109.71 Z M248.65 109.71 Q244.26 109.71 241.92 107.29 Q239.58 104.88 239.58 100.34 L239.58 45.05 Q239.58 40.51 241.92 38.17 Q244.26 35.83 248.51 35.83 Q252.75 35.83 255.09 38.17 Q257.43 40.51 257.43 45.05 L257.43 54.99 L255.82 51.34 Q259.04 43.58 265.84 39.56 Q272.64 35.54 281.28 35.54 Q289.91 35.54 295.47 38.76 Q301.03 41.97 303.8 48.48 Q306.58 54.99 306.58 64.94 L306.58 100.34 Q306.58 104.88 304.24 107.29 Q301.9 109.71 297.51 109.71 Q293.13 109.71 290.71 107.29 Q288.3 104.88 288.3 100.34 L288.3 65.82 Q288.3 57.48 285.15 53.68 Q282.01 49.87 275.42 49.87 Q267.38 49.87 262.62 54.92 Q257.87 59.97 257.87 68.31 L257.87 100.34 Q257.87 109.71 248.65 109.71 Z M360.42 110 Q348.28 110 339.5 105.46 Q330.72 100.93 325.97 92.59 Q321.21 84.25 321.21 72.84 Q321.21 61.72 325.82 53.38 Q330.43 45.05 338.55 40.29 Q346.67 35.54 357.06 35.54 Q364.66 35.54 370.73 38.02 Q376.81 40.51 381.12 45.19 Q385.44 49.87 387.7 56.53 Q389.97 63.19 389.97 71.52 Q389.97 74.16 388.14 75.55 Q386.31 76.94 382.95 76.94 L335.99 76.94 L335.99 66.4 L377.1 66.4 L374.76 68.6 Q374.76 61.87 372.78 57.33 Q370.81 52.8 367.08 50.39 Q363.35 47.97 357.79 47.97 Q351.64 47.97 347.33 50.82 Q343.01 53.68 340.74 58.87 Q338.48 64.06 338.48 71.23 L338.48 72.26 Q338.48 84.25 344.11 90.18 Q349.74 96.1 360.71 96.1 Q364.52 96.1 369.27 95.15 Q374.03 94.2 378.27 91.86 Q381.34 90.1 383.68 90.32 Q386.02 90.54 387.41 92.01 Q388.8 93.47 389.09 95.59 Q389.39 97.71 388.29 99.91 Q387.19 102.1 384.56 103.71 Q379.44 106.93 372.78 108.46 Q366.13 110 360.42 110 Z M437.22 110 Q427.72 110 421.35 106.78 Q414.99 103.56 411.92 97.35 Q408.84 91.13 408.84 81.91 L408.84 50.75 L401.24 50.75 Q397.73 50.75 395.82 48.92 Q393.92 47.09 393.92 43.88 Q393.92 40.51 395.82 38.76 Q397.73 37 401.24 37 L408.84 37 L408.84 23.69 Q408.84 19.15 411.26 16.81 Q413.67 14.47 418.06 14.47 Q422.45 14.47 424.79 16.81 Q427.13 19.15 427.13 23.69 L427.13 37 L442.64 37 Q446.15 37 448.05 38.76 Q449.95 40.51 449.95 43.88 Q449.95 47.09 448.05 48.92 Q446.15 50.75 442.64 50.75 L427.13 50.75 L427.13 80.89 Q427.13 87.91 430.2 91.42 Q433.27 94.93 440.15 94.93 Q442.64 94.93 444.54 94.49 Q446.44 94.05 447.9 93.91 Q449.66 93.76 450.83 95 Q452 96.25 452 100.05 Q452 102.98 451.05 105.25 Q450.1 107.51 447.61 108.39 Q445.71 108.98 442.64 109.49 Q439.57 110 437.22 110 Z`;

const wordmark = (x, y, scale, fill = '#FFFFFF') =>
  `<g transform="translate(${x},${y}) scale(${scale})" fill="${fill}" stroke="none">` +
  `<path d="${WORDMARK_PATHS}"/></g>`;

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
