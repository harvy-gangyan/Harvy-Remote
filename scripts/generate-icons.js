import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

// Ensure public directory exists
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function drawRemoteIcon(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const scale = size / 512;

  // Colors
  const cyan = [56, 189, 248, 255]; // #38bdf8
  const red = [239, 68, 68, 255]; // #ef4444
  const borderSlate = [51, 65, 85, 255];

  function setPixel(x, y, color) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (size * Math.floor(y) + Math.floor(x)) << 2;
    png.data[idx] = color[0];
    png.data[idx + 1] = color[1];
    png.data[idx + 2] = color[2];
    png.data[idx + 3] = color[3];
  }

  // 1. Fill entire canvas with dark gradient
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distFromCenter = Math.hypot(x - center, y - center) / (size * 0.7);
      const factor = Math.min(1, Math.max(0, distFromCenter));
      const r = Math.round(15 * (1 - factor) + 4 * factor);
      const g = Math.round(23 * (1 - factor) + 7 * factor);
      const b = Math.round(42 * (1 - factor) + 18 * factor);
      setPixel(x, y, [r, g, b, 255]);
    }
  }

  // 2. Draw Remote Chassis
  const chassisWidth = size * (isMaskable ? 0.45 : 0.55);
  const chassisHeight = size * (isMaskable ? 0.72 : 0.85);
  const left = center - chassisWidth / 2;
  const right = center + chassisWidth / 2;
  const top = center - chassisHeight / 2;
  const bottom = center + chassisHeight / 2;
  const cornerRadius = chassisWidth * 0.28;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside = false;
      let onBorder = false;

      if (x >= left && x <= right && y >= top && y <= bottom) {
        // Check rounded corners
        let cx = x < left + cornerRadius ? left + cornerRadius : (x > right - cornerRadius ? right - cornerRadius : x);
        let cy = y < top + cornerRadius ? top + cornerRadius : (y > bottom - cornerRadius ? bottom - cornerRadius : y);
        const dist = Math.hypot(x - cx, y - cy);

        if (dist <= cornerRadius) {
          inside = true;
          if (dist >= cornerRadius - 3 * scale) {
            onBorder = true;
          }
        }
      }

      if (onBorder) {
        setPixel(x, y, cyan);
      } else if (inside) {
        // Gradient on chassis
        const chassisFactor = (y - top) / chassisHeight;
        const cr = Math.round(30 * (1 - chassisFactor) + 15 * chassisFactor);
        const cg = Math.round(41 * (1 - chassisFactor) + 23 * chassisFactor);
        const cb = Math.round(59 * (1 - chassisFactor) + 42 * chassisFactor);
        setPixel(x, y, [cr, cg, cb, 255]);
      }
    }
  }

  // 3. Top IR Blaster LED
  const ledW = chassisWidth * 0.35;
  const ledH = Math.max(2, Math.round(6 * scale));
  const ledY = top + 14 * scale;
  for (let y = ledY; y < ledY + ledH; y++) {
    for (let x = center - ledW / 2; x < center + ledW / 2; x++) {
      setPixel(x, y, cyan);
    }
  }

  // 4. Power Button (Red)
  const powerY = top + 42 * scale;
  const powerR = 14 * scale;
  for (let y = powerY - powerR; y <= powerY + powerR; y++) {
    for (let x = center - powerR; x <= center + powerR; x++) {
      if (Math.hypot(x - center, y - powerY) <= powerR) {
        setPixel(x, y, red);
      }
    }
  }

  // 5. Directional Pad (Outer Ring + OK Center)
  const dpadY = center + 15 * scale;
  const dpadOuterR = chassisWidth * 0.38;
  const dpadInnerR = chassisWidth * 0.16;

  for (let y = dpadY - dpadOuterR; y <= dpadY + dpadOuterR; y++) {
    for (let x = center - dpadOuterR; x <= center + dpadOuterR; x++) {
      const dist = Math.hypot(x - center, y - dpadY);
      if (dist <= dpadOuterR) {
        if (dist <= dpadInnerR) {
          // OK button (cyan)
          setPixel(x, y, cyan);
        } else if (dist >= dpadOuterR - 2 * scale || dist <= dpadInnerR + 2 * scale) {
          setPixel(x, y, borderSlate);
        } else {
          setPixel(x, y, [40, 50, 70, 255]);
        }
      }
    }
  }

  // 6. Navigation Buttons (3 dots below D-Pad)
  const navY = dpadY + dpadOuterR + 22 * scale;
  const navR = 8 * scale;
  const offsets = [-chassisWidth * 0.25, 0, chassisWidth * 0.25];
  for (const ox of offsets) {
    for (let y = navY - navR; y <= navY + navR; y++) {
      for (let x = center + ox - navR; x <= center + ox + navR; x++) {
        if (Math.hypot(x - (center + ox), y - navY) <= navR) {
          setPixel(x, y, [51, 65, 85, 255]);
        }
      }
    }
  }

  return png;
}

// Generate all standard PWA icons
const icons = [
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: false },
  { file: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { file: 'pwa-maskable-192x192.png', size: 192, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
  { file: 'favicon.png', size: 64, maskable: false },
];

for (const icon of icons) {
  const png = drawRemoteIcon(icon.size, icon.maskable);
  const buffer = PNG.sync.write(png);
  const targetPath = path.join(publicDir, icon.file);
  fs.writeFileSync(targetPath, buffer);
  console.log(`Generated ${icon.file} (${icon.size}x${icon.size})`);
}
