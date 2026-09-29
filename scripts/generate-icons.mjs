import puppeteer from '../../gallinas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const svgPath = path.resolve(rootDir, 'public/icons/icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const executablePath = chromePaths.find((p) => fs.existsSync(p));

if (!executablePath) {
  console.error('No compatible browser found to render SVG');
  process.exit(1);
}

function createIcoFromPng(pngBuffer, size = 48) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Image type: 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // Number of images: 1

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
  dirEntry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
  dirEntry.writeUInt8(0, 2); // Color palette
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // Size of image data
  dirEntry.writeUInt32LE(22, 12); // Offset to image data (6 + 16 = 22)

  return Buffer.concat([icoHeader, dirEntry, pngBuffer]);
}

async function generate() {
  console.log(`Using browser at: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100vw; height: 100vh; overflow: hidden; background: transparent; }
          svg { width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'load' });

  const targets = [
    { file: 'public/icons/icon-512.png', size: 512 },
    { file: 'public/icons/icon-maskable-512.png', size: 512 },
    { file: 'public/icons/icon-192.png', size: 192 },
    { file: 'public/icons/icon-maskable-192.png', size: 192 },
    { file: 'public/icons/apple-touch-icon.png', size: 180 },
    { file: 'public/icons/icon-96.png', size: 96 },
    { file: 'public/icons/icon-48.png', size: 48 },
    { file: 'public/icons/icon-32.png', size: 32 },
  ];

  let png48Buffer = null;

  for (const target of targets) {
    const { file, size } = target;
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await new Promise((r) => setTimeout(r, 60));

    const outPath = path.resolve(rootDir, file);
    const buffer = await page.screenshot({
      type: 'png',
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size },
    });

    fs.writeFileSync(outPath, buffer);
    console.log(`✓ Generado: ${file} (${size}x${size}, ${buffer.length} bytes)`);

    if (size === 48) {
      png48Buffer = buffer;
    }
  }

  if (png48Buffer) {
    const icoBuffer = createIcoFromPng(png48Buffer, 48);
    const faviconSrc = path.resolve(rootDir, 'src/app/favicon.ico');
    const faviconPublic = path.resolve(rootDir, 'public/favicon.ico');
    fs.writeFileSync(faviconSrc, icoBuffer);
    fs.writeFileSync(faviconPublic, icoBuffer);
    console.log(`✓ Generado: src/app/favicon.ico y public/favicon.ico (${icoBuffer.length} bytes)`);
  }

  await browser.close();
  console.log('¡Todos los iconos de GRANJA OS HUB han sido generados exitosamente!');
}

generate().catch((err) => {
  console.error('Error generando iconos:', err);
  process.exit(1);
});
