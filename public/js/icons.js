// Small emblem per theme. Returned as SVG markup with literal colors so the same
// drawing works inline on the page and when painted onto the QR card canvas.
// a = accent, i = ink, s = surface, m = muted

const ICONS = {
  pumpkin: (c) => `<path d="M30 14c0-5 3-8 8-9" stroke="${c.m}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="20" cy="38" rx="14" ry="20" fill="${c.a}"/><ellipse cx="44" cy="38" rx="14" ry="20" fill="${c.a}"/>
    <ellipse cx="32" cy="38" rx="13" ry="22" fill="${c.a}" stroke="${c.s}" stroke-opacity=".35" stroke-width="2"/>
    <path d="M21 32l6 6h-9zM43 32l3 6h-9zM20 46c6 6 18 6 24 0l-4 1-2 3-3-3-3 3-3-3-2 1z" fill="${c.s}"/>`,
  leaf: (c) => `<path d="M32 4C46 14 55 27 51 41c-3 9-10 15-19 17-9-2-16-8-19-17C9 27 18 14 32 4z" fill="${c.a}"/>
    <path d="M32 12v50M32 28l-9-7M32 28l9-7M32 40l-13-7M32 40l13-7" stroke="${c.s}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
  tree: (c) => `<path d="M32 10L16 30h8L12 44h10L8 56h48L42 44h10L40 30h8z" fill="${c.i}" fill-opacity=".92"/>
    <rect x="28" y="56" width="8" height="6" fill="${c.m}"/>
    <path d="M32 2l2.4 5 5.4.6-4 3.7 1.1 5.4L32 14l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" fill="${c.a}"/>
    <circle cx="26" cy="36" r="2.6" fill="${c.a}"/><circle cx="38" cy="47" r="2.6" fill="${c.a}"/><circle cx="34" cy="26" r="2.2" fill="${c.a}"/><circle cx="22" cy="50" r="2.4" fill="${c.a}"/>`,
  candles: (c) => `<rect x="8" y="50" width="48" height="4" rx="2" fill="${c.a}"/><rect x="29" y="54" width="6" height="6" fill="${c.a}"/>
    ${[10, 16, 22, 28, 36, 42, 48, 54].map((x) => `<rect x="${x - 1.5}" y="34" width="3" height="16" fill="${c.i}"/><path d="M${x} 26c2 3 2 5 0 7-2-2-2-4 0-7z" fill="${c.a}"/>`).join("")}
    <rect x="30.5" y="26" width="3" height="24" fill="${c.i}"/><path d="M32 17c2.4 3.4 2.4 6 0 8-2.4-2-2.4-4.6 0-8z" fill="${c.a}"/>`,
  coupe: (c) => `<path d="M10 16h44c0 12-10 20-22 20S10 28 10 16z" fill="${c.a}"/><path d="M12 16h40" stroke="${c.i}" stroke-width="2.5"/>
    <path d="M32 36v18M22 58h20" stroke="${c.i}" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="26" cy="24" r="1.8" fill="${c.s}"/><circle cx="34" cy="21" r="1.4" fill="${c.s}"/><circle cx="38" cy="27" r="1.6" fill="${c.s}"/>
    <circle cx="44" cy="8" r="2" fill="${c.a}"/><circle cx="50" cy="4" r="1.4" fill="${c.a}"/><circle cx="20" cy="7" r="1.6" fill="${c.a}"/>`,
  sun: (c) => `<path d="M14 44a18 18 0 0 1 36 0z" fill="${c.a}"/>
    ${[-80, -50, -20, 10, 40, 70].map((d) => { return `<path d="M${(32 + Math.sin(d * Math.PI / 180) * 23).toFixed(1)} ${(44 - Math.cos(d * Math.PI / 180) * 23).toFixed(1)}L${(32 + Math.sin(d * Math.PI / 180) * 30).toFixed(1)} ${(44 - Math.cos(d * Math.PI / 180) * 30).toFixed(1)}" stroke="${c.a}" stroke-width="4" stroke-linecap="round"/>`; }).join("")}
    <path d="M6 48h52M14 54h36" stroke="${c.i}" stroke-width="3.5" stroke-linecap="round"/>`,
  heart: (c) => `<path d="M32 56S8 42 8 24c0-8 6-14 13-14 5 0 9 3 11 7 2-4 6-7 11-7 7 0 13 6 13 14 0 18-24 32-24 32z" fill="${c.a}"/>
    <path d="M18 22c1-4 4-6 7-6" stroke="${c.s}" stroke-width="3" stroke-linecap="round" fill="none" stroke-opacity=".7"/>`,
  clover: (c) => `<path d="M33 36c2 9 6 16 12 22" stroke="${c.m}" stroke-width="4" stroke-linecap="round" fill="none"/>
    ${[0, 120, 240].map((r) => `<path transform="rotate(${r} 32 32)" d="M32 31C24 26 16 22 16 15c0-5 4-8 8-8 4 0 7 3 8 6 1-3 4-6 8-6 4 0 8 3 8 8 0 7-8 11-16 16z" fill="${c.m}"/>`).join("")}
    <circle cx="32" cy="32" r="3.5" fill="${c.a}"/>`,
  tulip: (c) => `<path d="M32 34v24M32 50c-6-2-12-8-14-14 8 0 12 6 14 14zM32 46c6-2 10-6 12-12-7 1-11 5-12 12z" stroke="${c.i}" stroke-width="3" fill="${c.i}" fill-opacity=".25" stroke-linejoin="round"/>
    <path d="M18 12c4 2 8 6 9 10 2-6 3-10 5-14 2 4 3 8 5 14 1-4 5-8 9-10 1 14-4 24-14 24S17 26 18 12z" fill="${c.a}"/>`,
  star: (c) => `<path d="M32 4l7.6 17 18.4 1.8-13.9 12.3 4 18.1L32 44l-16.1 9.2 4-18.1L6 22.8 24.4 21z" fill="${c.a}"/>
    <path d="M32 14l4.4 9.8 10.6 1-8 7 2.3 10.5L32 37l-9.3 5.3L25 31.8l-8-7 10.6-1z" fill="${c.i}" fill-opacity=".9"/>`,
  cake: (c) => `<path d="M32 4c3 4 3 7 0 9-3-2-3-5 0-9z" fill="${c.a}"/><rect x="30" y="13" width="4" height="10" fill="${c.i}"/>
    <rect x="14" y="23" width="36" height="14" rx="4" fill="${c.a}"/><rect x="8" y="37" width="48" height="20" rx="4" fill="${c.i}"/>
    <path d="M14 30c3 3 6 3 9 0s6-3 9 0 6 3 9 0 6-3 9 0M8 44c4 4 8 4 12 0s8-4 12 0 8 4 12 0 8-4 12 0" stroke="${c.s}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  sparkle: (c) => `<path d="M32 4c2 16 6 24 24 28-18 4-22 12-24 28-2-16-6-24-24-28 18-4 22-12 24-28z" fill="${c.a}"/>
    <path d="M50 6c.8 5 2 7 8 8-6 1-7.2 3-8 8-.8-5-2-7-8-8 6-1 7.2-3 8-8z" fill="${c.m}"/>`,
};

export function iconSvg(name, colors, size = 64) {
  const draw = ICONS[name] || ICONS.sparkle;
  const c = { a: colors.accent, i: colors.ink, s: colors.surface, m: colors.muted };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${draw(c)}</svg>`;
}
