// Seasonal invitation themes. Each theme is a starting point: the host can
// override colors, fonts, the animated motif and every piece of wording.

export const THEMES = {
  halloween: {
    name: "Halloween",
    colors: { bg: "#1b1226", bg2: "#0e0815", surface: "#271a37", ink: "#f3ead6", muted: "#b5a6c9", accent: "#ff7a1a", accentInk: "#2a1202", line: "#4a3866" },
    fonts: { display: "Creepster", body: "Bricolage Grotesque" },
    motif: "bats", icon: "pumpkin", motifColors: ["#5a4479", "#3b2a52"],
    copy: { eyebrow: "You have been summoned", rsvpHeading: "Will you rise for it?", yes: "I'll be there", maybe: "Maybe", no: "Can't make it", photosHeading: "Evidence from the night", guestsHeading: "Who's haunting" },
    question: { label: "Coming as", placeholder: "A ghost with a day job" },
    note: "Costumes strongly encouraged. Bring your worst jokes and your best scream.",
  },
  thanksgiving: {
    name: "Friendsgiving",
    colors: { bg: "#3a1e12", bg2: "#2a140b", surface: "#4a2a1a", ink: "#fbeedd", muted: "#dcbd9e", accent: "#e9a23b", accentInk: "#2b1704", line: "#6b4330" },
    fonts: { display: "Fraunces", body: "Work Sans" },
    motif: "leaves", icon: "leaf", motifColors: ["#e9a23b", "#c8562a", "#a23b1e", "#d98a2b"],
    copy: { eyebrow: "Pull up a chair", rsvpHeading: "Save you a seat?", yes: "Count me in", maybe: "Maybe", no: "Can't this year", photosHeading: "Second helpings", guestsHeading: "At the table" },
    question: { label: "Bringing a dish?", placeholder: "Grandma's mac and cheese" },
    note: "Bring an appetite and something to share. We've got the turkey.",
  },
  christmas: {
    name: "Christmas",
    colors: { bg: "#0f3b2e", bg2: "#0a281f", surface: "#164a3a", ink: "#fdf6ec", muted: "#b8d4c6", accent: "#e23b3b", accentInk: "#ffffff", line: "#2c6652" },
    fonts: { display: "Mountains of Christmas", body: "Nunito" },
    motif: "snow", icon: "tree", motifColors: ["#ffffff"],
    copy: { eyebrow: "You're on the nice list", rsvpHeading: "Home for the holidays?", yes: "Wouldn't miss it", maybe: "Maybe", no: "Can't make it", photosHeading: "Snapshots by the tree", guestsHeading: "Gathered round" },
    question: { label: "Secret Santa wish", placeholder: "Fuzzy socks, always" },
    note: "Ugly sweaters welcome. Cocoa, cookies and carols provided.",
  },
  hanukkah: {
    name: "Hanukkah",
    colors: { bg: "#0d2a5c", bg2: "#081c40", surface: "#143672", ink: "#f5f8ff", muted: "#a9bde6", accent: "#f2c94c", accentInk: "#1d1400", line: "#2a4f8f" },
    fonts: { display: "Suez One", body: "Assistant" },
    motif: "sparkles", icon: "candles", motifColors: ["#f2c94c", "#ffffff", "#9fc0ff"],
    copy: { eyebrow: "Eight nights, one party", rsvpHeading: "Will you light it up with us?", yes: "I'll be there", maybe: "Maybe", no: "Can't make it", photosHeading: "Glow from the night", guestsHeading: "Around the menorah" },
    question: { label: "Latke topping", placeholder: "Sour cream or applesauce?" },
    note: "Bring your dreidel game. Latkes and sufganiyot on us.",
  },
  nye: {
    name: "New Year's Eve",
    colors: { bg: "#121118", bg2: "#1d1a26", surface: "#1f1c28", ink: "#f4efe4", muted: "#aaa396", accent: "#d9b44a", accentInk: "#1a1400", line: "#3a3528" },
    fonts: { display: "Limelight", body: "Josefin Sans" },
    motif: "confetti", icon: "coupe", motifColors: ["#d9b44a", "#f4efe4", "#b9b2c9", "#e8cf7d"],
    copy: { eyebrow: "Ring in the new year", rsvpHeading: "Will you be here at midnight?", yes: "Pop the bubbly", maybe: "Maybe", no: "Can't make it", photosHeading: "Proof we made it to midnight", guestsHeading: "Counting down with" },
    question: { label: "Your resolution", placeholder: "Finally learn to cook" },
    note: "Dress to sparkle. Champagne toast at midnight.",
  },
  newyear: {
    name: "New Year's Day",
    colors: { bg: "#fff3ea", bg2: "#ffd9c4", surface: "#ffffff", ink: "#3a1d2b", muted: "#85606c", accent: "#f2542d", accentInk: "#ffffff", line: "#f0c9b8" },
    fonts: { display: "DM Serif Display", body: "DM Sans" },
    motif: "bubbles", icon: "sun", motifColors: ["#f2a65a", "#f2542d", "#ffd27a"],
    copy: { eyebrow: "First brunch of the year", rsvpHeading: "Join us for day one?", yes: "Save me a mimosa", maybe: "Maybe", no: "Can't make it", photosHeading: "Day one, documented", guestsHeading: "At brunch" },
    question: { label: "Mimosa or coffee?", placeholder: "Both, honestly" },
    note: "Recover in good company. Pajamas acceptable.",
  },
  valentines: {
    name: "Valentine's",
    colors: { bg: "#ffe6ee", bg2: "#ffcfdd", surface: "#ffffff", ink: "#5a0f2b", muted: "#9b5470", accent: "#d81b5c", accentInk: "#ffffff", line: "#f3b5c8" },
    fonts: { display: "Playball", body: "Quicksand" },
    motif: "hearts", icon: "heart", motifColors: ["#d81b5c", "#ff8fb1", "#ffffff"],
    copy: { eyebrow: "Be our guest, valentine", rsvpHeading: "Will you be there?", yes: "Yes, with love", maybe: "Maybe", no: "Can't make it", photosHeading: "Moments we loved", guestsHeading: "Sweethearts coming" },
    question: { label: "Your love song pick", placeholder: "Something we can all sing" },
    note: "Wear red or pink. Chocolate is mandatory.",
  },
  stpatricks: {
    name: "St. Patrick's",
    colors: { bg: "#0e4d2c", bg2: "#093a21", surface: "#145c37", ink: "#f4fbef", muted: "#b6d8bf", accent: "#f4c542", accentInk: "#1d1600", line: "#2b7a4f" },
    fonts: { display: "Uncial Antiqua", body: "Lato" },
    motif: "clovers", icon: "clover", motifColors: ["#5fd38d", "#2fa865", "#f4c542"],
    copy: { eyebrow: "Luck of the guest list", rsvpHeading: "Feeling lucky?", yes: "Sláinte, I'm in", maybe: "Maybe", no: "Can't make it", photosHeading: "Pot of gold", guestsHeading: "The lucky ones" },
    question: { label: "Your go-to toast", placeholder: "May the road rise to meet you" },
    note: "Wear green or get pinched.",
  },
  spring: {
    name: "Spring & Easter",
    colors: { bg: "#eef6e8", bg2: "#fbeaf2", surface: "#ffffff", ink: "#2f3b2a", muted: "#6c7a63", accent: "#d9578f", accentInk: "#ffffff", line: "#d4e3c9" },
    fonts: { display: "Fredoka", body: "Nunito" },
    motif: "petals", icon: "tulip", motifColors: ["#f7b6cf", "#ffffff", "#f9d977", "#b9dfa4"],
    copy: { eyebrow: "Spring has sprung", rsvpHeading: "Hop on over?", yes: "I'll be there", maybe: "Maybe", no: "Can't make it", photosHeading: "In full bloom", guestsHeading: "Coming to brunch" },
    question: { label: "Bringing for the table", placeholder: "Deviled eggs" },
    note: "Egg hunt at noon. Pastels encouraged.",
  },
  july4: {
    name: "Fourth of July",
    colors: { bg: "#0f2147", bg2: "#0a1733", surface: "#162a5a", ink: "#ffffff", muted: "#b9c4e0", accent: "#e63946", accentInk: "#ffffff", line: "#2e4580" },
    fonts: { display: "Bungee", body: "Barlow" },
    motif: "fireworks", icon: "star", motifColors: ["#e63946", "#ffffff", "#6fa8ff", "#ffd166"],
    copy: { eyebrow: "Stars, stripes & snacks", rsvpHeading: "Coming to the cookout?", yes: "Fire up the grill", maybe: "Maybe", no: "Can't make it", photosHeading: "Sparklers & snapshots", guestsHeading: "At the cookout" },
    question: { label: "Bringing to the grill", placeholder: "Burgers, dogs or veggie skewers" },
    note: "Fireworks at dark. Bring a lawn chair.",
  },
  birthday: {
    name: "Birthday",
    colors: { bg: "#ffde59", bg2: "#ffc933", surface: "#ffffff", ink: "#1d1a2f", muted: "#5e5675", accent: "#ff3d8b", accentInk: "#ffffff", line: "#e9b800" },
    fonts: { display: "Bagel Fat One", body: "Outfit" },
    motif: "balloons", icon: "cake", motifColors: ["#ff3d8b", "#3d8bff", "#22c39a", "#ff8a3d"],
    copy: { eyebrow: "Make a wish", rsvpHeading: "Coming to celebrate?", yes: "Wouldn't miss it", maybe: "Maybe", no: "Can't make it", photosHeading: "Cake, candles, chaos", guestsHeading: "Party people" },
    question: { label: "Birthday wish for the guest of honor", placeholder: "Another trip around the sun" },
    note: "Cake at 8. Gifts optional, good vibes required.",
  },
  classic: {
    name: "Classic",
    colors: { bg: "#eef1f4", bg2: "#e1e7ee", surface: "#ffffff", ink: "#18202b", muted: "#5b6674", accent: "#1f5f8b", accentInk: "#ffffff", line: "#cdd5de" },
    fonts: { display: "Cormorant Garamond", body: "Instrument Sans" },
    motif: "sparkles", icon: "sparkle", motifColors: ["#1f5f8b", "#9fb7cc"],
    copy: { eyebrow: "You're invited", rsvpHeading: "Can you make it?", yes: "I'll be there", maybe: "Maybe", no: "Can't make it", photosHeading: "Photos from the party", guestsHeading: "Who's coming" },
    question: { label: "Anything we should know?", placeholder: "Allergies, arrival time…" },
    note: "",
  },
};

export const THEME_ORDER = ["halloween", "thanksgiving", "christmas", "hanukkah", "nye", "newyear", "valentines", "stpatricks", "spring", "july4", "birthday", "classic"];

export const DISPLAY_FONTS = ["Creepster", "Fraunces", "Mountains of Christmas", "Suez One", "Limelight", "DM Serif Display", "Playball", "Uncial Antiqua", "Fredoka", "Bungee", "Bagel Fat One", "Cormorant Garamond", "Abril Fatface", "Pacifico", "Righteous", "Rye"];
export const BODY_FONTS = ["Bricolage Grotesque", "Work Sans", "Nunito", "Assistant", "Josefin Sans", "DM Sans", "Quicksand", "Lato", "Barlow", "Outfit", "Instrument Sans", "Karla"];

export const MOTIFS = {
  none: "None", bats: "Bats", leaves: "Falling leaves", snow: "Snow", sparkles: "Sparkles", confetti: "Confetti",
  bubbles: "Bubbles", hearts: "Hearts", clovers: "Clovers", petals: "Petals", fireworks: "Fireworks", balloons: "Balloons",
};

// Font weights requested per family (display faces need their bold cut where one exists).
const FONT_AXES = {
  "Fraunces": "wght@600;800", "Mountains of Christmas": "wght@700", "DM Serif Display": "", "Cormorant Garamond": "wght@600;700",
  "Fredoka": "wght@500;700", "Bricolage Grotesque": "opsz,wght@12..96,400;12..96,600;12..96,800",
  "Work Sans": "wght@400;600;700", "Nunito": "wght@400;600;800", "Assistant": "wght@400;600;800", "Josefin Sans": "wght@400;600;700",
  "DM Sans": "wght@400;600;700", "Quicksand": "wght@400;600;700", "Lato": "wght@400;700;900", "Barlow": "wght@400;600;800",
  "Outfit": "wght@400;600;800", "Instrument Sans": "wght@400;600;700", "Karla": "wght@400;600;800",
};
const FALLBACK = { display: "Georgia, 'Times New Roman', serif", body: "system-ui, -apple-system, 'Segoe UI', sans-serif" };
const loaded = new Set();

export function loadFonts(families) {
  const allowed = new Set([...DISPLAY_FONTS, ...BODY_FONTS]);
  const need = families.filter((f) => allowed.has(f) && !loaded.has(f));
  if (!need.length) return;
  need.forEach((f) => loaded.add(f));
  const q = need.map((f) => "family=" + encodeURIComponent(f).replace(/%20/g, "+") + (FONT_AXES[f] ? ":" + FONT_AXES[f] : "")).join("&");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?" + q + "&display=swap";
  document.head.appendChild(link);
}

const HEX = /^#[0-9a-fA-F]{6}$/;

// Merge a theme preset with the host's customizations into everything the renderer needs.
export function resolveTheme(event) {
  const base = THEMES[event.theme] || THEMES.classic;
  const c = event.custom || {};
  const colors = { ...base.colors };
  for (const k of ["bg", "surface", "ink", "accent"]) if (HEX.test(c[k] || "")) colors[k] = c[k];
  if (HEX.test(c.bg || "")) colors.bg2 = shade(c.bg, isLight(c.bg) ? -0.08 : -0.35);
  if (HEX.test(c.accent || "")) colors.accentInk = isLight(c.accent) ? "#16120c" : "#ffffff";
  if (HEX.test(c.ink || "") || HEX.test(c.bg || "")) {
    colors.muted = mix(colors.ink, colors.bg, 0.32);
    colors.line = mix(colors.ink, colors.bg, 0.72);
  }
  const fonts = {
    display: DISPLAY_FONTS.includes(c.displayFont) ? c.displayFont : base.fonts.display,
    body: BODY_FONTS.includes(c.bodyFont) ? c.bodyFont : base.fonts.body,
  };
  const motif = c.motif && MOTIFS[c.motif] ? c.motif : base.motif;
  const density = Number.isFinite(+c.motifAmount) ? Math.max(0, Math.min(3, +c.motifAmount)) : 2;
  const copy = { ...base.copy };
  for (const k of Object.keys(copy)) if (event.copy && typeof event.copy[k] === "string" && event.copy[k].trim()) copy[k] = event.copy[k].trim();
  const light = isLight(colors.bg);
  return {
    id: event.theme in THEMES ? event.theme : "classic", base, colors, fonts, motif, density, copy, light,
    icon: base.icon,
    motifColors: HEX.test(c.accent || "") ? [colors.accent, colors.ink] : base.motifColors,
    qr: { dark: light ? colors.ink : colors.bg, light: "#ffffff" },
  };
}

export function applyTheme(el, t) {
  loadFonts([t.fonts.display, t.fonts.body]);
  const s = el.style, c = t.colors;
  s.setProperty("--i-bg", c.bg); s.setProperty("--i-bg2", c.bg2); s.setProperty("--i-surface", c.surface);
  s.setProperty("--i-ink", c.ink); s.setProperty("--i-muted", c.muted); s.setProperty("--i-accent", c.accent);
  s.setProperty("--i-accent-ink", c.accentInk); s.setProperty("--i-line", c.line);
  s.setProperty("--i-display", `"${t.fonts.display}", ${FALLBACK.display}`);
  s.setProperty("--i-body", `"${t.fonts.body}", ${FALLBACK.body}`);
  el.dataset.theme = t.id;
  el.dataset.tone = t.light ? "light" : "dark";
  el.style.colorScheme = t.light ? "light" : "dark";
}

// --- color helpers ---
function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function hex(r, g, b) { return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
export function isLight(h) { const [r, g, b] = rgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6; }
function mix(a, b, t) { const x = rgb(a), y = rgb(b); return hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
function shade(h, amt) { return amt < 0 ? mix(h, "#000000", -amt) : mix(h, "#ffffff", amt); }
