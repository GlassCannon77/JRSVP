// The photo drop: what guests land on after scanning the party's photo QR code.
// Two big buttons (camera, camera roll), an optional name, and live progress.
import { api } from "./api.js";
import { h, shrink } from "./invite-view.js";
import { resolveTheme, applyTheme } from "./themes.js";
import { iconSvg } from "./icons.js";
import { startMotif } from "./motifs.js";

const app = document.getElementById("app");
const id = (location.pathname.match(/^\/e\/([a-z0-9]+)/) || [])[1];
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};
const CAMERA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const PICS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>';

function fail(title, text) {
  app.replaceChildren(h("div", { class: "boot" }, h("div", null, h("h1", { text: title }), h("p", { text: text }))));
}

(async () => {
  if (!id) return fail("Photo drop not found", "Scan the code again, or ask the hosts for the link.");
  let res;
  try { res = await api(`/api/events/${id}`); }
  catch (e) { return fail(e.status === 404 ? "Photo drop not found" : "Couldn't open the photo drop", e.message); }
  const ev = res.event, t = resolveTheme(ev);
  document.title = `${ev.title} · Photo drop`;

  const art = h("article", { class: "inv" });
  applyTheme(art, t);
  const canvas = h("canvas", { class: "inv-motif", "aria-hidden": "true" });
  const wrap = h("div", { class: "inv-wrap drop-wrap" });
  art.append(canvas, wrap);
  app.replaceChildren(art);
  document.documentElement.style.background = t.colors.bg2; document.body.style.background = t.colors.bg2;
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = t.colors.bg;

  wrap.append(h("header", { class: "drop-hero" },
    h("div", { class: "inv-icon", html: iconSvg(t.icon, t.colors, 52) }),
    h("div", null, h("p", { text: "Photo drop" }), h("h1", { text: ev.title }))));

  const open = ev.photos && ev.photos.enabled && ev.photos.uploads;
  if (!open) {
    wrap.append(h("section", { class: "inv-card" }, h("p", { text: "The hosts have paused photo uploads for now. Check back later." }),
      h("a", { class: "inv-btn ghost", href: `/e/${id}` }, "Back to the invite")));
    startMotif(canvas, t.motif, t.motifColors, Math.min(t.density, 1));
    return;
  }

  // name: from their RSVP on this phone, or what they typed here last time
  let rsvpName = "";
  try { const r = JSON.parse(ls.get(`kk:rsvp:${id}`)); rsvpName = (r && r.body && r.body.name) || ""; } catch {}
  const nameIn = h("input", { type: "text", id: "drop-name", maxlength: 50, autocomplete: "name", placeholder: "Your name", value: rsvpName || ls.get("kk:photo-name") || "" });
  nameIn.addEventListener("change", () => ls.set("kk:photo-name", nameIn.value.trim()));

  const camIn = h("input", { type: "file", accept: "image/*", capture: "environment", hidden: true });
  const rollIn = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true });
  const camBtn = h("button", { class: "inv-btn primary big", type: "button", html: CAMERA + "<span>Take a photo</span>", onclick: () => camIn.click() });
  const rollBtn = h("button", { class: "inv-btn ghost big", type: "button", html: PICS + "<span>Choose from your photos</span>", onclick: () => rollIn.click() });

  const progress = h("div", { class: "drop-progress", "aria-live": "polite" });
  const summary = h("p", { class: "drop-summary", role: "status" });
  const links = h("div", { class: "drop-links" });
  if (ev.photos.guestsCanView) links.append(h("a", { class: "inv-btn ghost small", href: `/e/${id}#photos` }, "See the photo wall"));
  links.append(h("a", { class: "inv-btn ghost small", href: `/e/${id}` }, "Open the invite"));

  wrap.append(
    h("section", { class: "inv-card" },
      h("div", { class: "drop-actions" }, camBtn, rollBtn),
      h("div", { class: "drop-name" }, h("label", { class: "inv-label", for: "drop-name", text: rsvpName ? "Credited to" : "Your name (optional)" }), nameIn),
      h("p", { class: "inv-private", text: ev.photos.guestsCanView ? "Your photos go up on the party's photo wall for everyone at the party." : "Your photos go straight to the hosts." })),
    summary, progress, camIn, rollIn, links);

  let added = 0, failed = 0, busy = false;
  const queue = [];
  function enqueue(files) {
    for (const f of Array.from(files || []).slice(0, 30)) {
      const tile = h("div", { class: "drop-tile wait" }, h("img", { alt: "" }), h("span", { text: "Waiting…" }));
      try { tile.querySelector("img").src = URL.createObjectURL(f); } catch {}
      progress.prepend(tile);
      queue.push({ f, tile });
    }
    run();
  }
  async function run() {
    if (busy) return; busy = true;
    while (queue.length) {
      const { f, tile } = queue.shift(), label = tile.querySelector("span");
      label.textContent = "Uploading…";
      summary.textContent = `Adding photos… ${queue.length ? queue.length + " more to go" : ""}`.trim();
      try {
        const full = await shrink(f, 1600, 0.84), thumb = await shrink(f, 480, 0.76);
        const fd = new FormData();
        fd.append("full", full.blob, "full.jpg"); fd.append("thumb", thumb.blob, "thumb.jpg");
        fd.append("name", nameIn.value.trim() || "Guest"); fd.append("w", full.w); fd.append("h", full.h);
        await api(`/api/events/${id}/photos`, { method: "POST", form: fd });
        tile.className = "drop-tile done"; label.textContent = "Added"; added++;
      } catch (e) {
        tile.className = "drop-tile bad"; failed++;
        label.textContent = e.status ? "Didn't upload" : "Can't read this one";
        if (e.status === 409) { summary.textContent = e.message; queue.length = 0; break; }
      }
    }
    busy = false;
    if (added || failed) summary.textContent = failed
      ? `${added} added, ${failed} didn't upload. Try those again, or save them as JPG first.`
      : `${added} ${added === 1 ? "photo" : "photos"} added. Thanks! Keep them coming.`;
    if (nameIn.value.trim()) ls.set("kk:photo-name", nameIn.value.trim());
  }
  camIn.addEventListener("change", () => { enqueue(camIn.files); camIn.value = ""; });
  rollIn.addEventListener("change", () => { enqueue(rollIn.files); rollIn.value = ""; });

  startMotif(canvas, t.motif, t.motifColors, Math.min(t.density, 1));
})();
