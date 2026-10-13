// Free, offline QR codes: the encoder ships with the site (vendor/qrcode.js),
// so no QR service, account or API key is involved. Codes are drawn in the
// invitation's own colors and fonts.
import { iconSvg } from "./icons.js";

export function qrSvg(text, { dark = "#000", light = "#fff", margin = 2, title = "QR code" } = {}) {
  const m = window.QRMatrix(text, "M"), n = m.length, size = n + margin * 2;
  let d = "";
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!m[r][c]) { c++; continue; }
      let e = c; while (e < n && m[r][e]) e++;
      d += `M${c + margin} ${r + margin}h${e - c}v1h-${e - c}z`;
      c = e;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="${title.replace(/"/g, "")}"><rect width="${size}" height="${size}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
}

function drawMatrix(g, text, x, y, px, dark) {
  const m = window.QRMatrix(text, "M"), n = m.length, cell = px / n;
  g.fillStyle = dark;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) g.fillRect(Math.floor(x + c * cell), Math.floor(y + r * cell), Math.ceil(cell), Math.ceil(cell));
}

function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }

function wrap(g, text, maxW) {
  const words = String(text).split(/\s+/), lines = [];
  let line = "";
  for (const w of words) { const t = line ? line + " " + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}

// A shareable card (1080 x 1350, the shape phones and Instagram like) with the
// party name, a call to action and the code.
export async function qrCardCanvas({ url, title, label, sub, theme }) {
  const W = 1080, H = 1350, c = theme.colors;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  const disp = `"${theme.fonts.display}"`, body = `"${theme.fonts.body}"`;
  try { await Promise.all([document.fonts.load(`88px ${disp}`), document.fonts.load(`600 40px ${body}`)]); } catch (e) {}

  const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, c.bg); grad.addColorStop(1, c.bg2);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.strokeStyle = c.line; g.lineWidth = 4; g.setLineDash([18, 14]); g.strokeRect(40, 40, W - 80, H - 80); g.setLineDash([]);

  try {
    const svg = iconSvg(theme.icon, c, 128);
    const img = await loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
    g.drawImage(img, W / 2 - 64, 92, 128, 128);
  } catch (e) {}

  g.textAlign = "center"; g.fillStyle = c.accent;
  let size = 104; g.font = `${size}px ${disp}, Georgia, serif`;
  let lines = wrap(g, title, W - 200);
  while (lines.length > 2 && size > 60) { size -= 8; g.font = `${size}px ${disp}, Georgia, serif`; lines = wrap(g, title, W - 200); }
  lines = lines.slice(0, 2);
  let y = 300;
  for (const l of lines) { g.fillText(l, W / 2, y); y += size * 1.02; }

  g.fillStyle = c.ink; g.font = `600 44px ${body}, system-ui, sans-serif`;
  g.fillText(label, W / 2, y + 30);

  const box = 600, bx = (W - box) / 2, by = Math.min(y + 80, H - box - 190);
  g.fillStyle = theme.qr.light;
  roundRect(g, bx - 30, by - 30, box + 60, box + 60, 28); g.fill();
  drawMatrix(g, url, bx, by, box, theme.qr.dark);

  g.fillStyle = c.muted; g.font = `400 34px ${body}, system-ui, sans-serif`;
  if (sub) g.fillText(sub, W / 2, by + box + 100);
  g.font = `400 26px ui-monospace, Menlo, monospace`;
  g.fillText(url.replace(/^https?:\/\//, ""), W / 2, by + box + 150);
  return cv;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export async function downloadQrCard(opts, filename) {
  const cv = await qrCardCanvas(opts);
  const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
