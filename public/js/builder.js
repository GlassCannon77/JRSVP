import { THEMES, THEME_ORDER, DISPLAY_FONTS, BODY_FONTS, MOTIFS, resolveTheme, loadFonts } from "./themes.js";
import { iconSvg } from "./icons.js";
import { mountInvite, h, fmtDate } from "./invite-view.js";
import { qrSvg, downloadQrCard } from "./qr.js";
import { api, hostKey, myParties, rememberParty, forgetParty } from "./api.js";

const $ = (s, r = document) => r.querySelector(s);
const form = $("#builder"), preview = $("#preview"), status = $("#pub-status");
const AMOUNTS = ["Off", "A little", "Some", "Lots"];

function seasonalTheme(d = new Date()) {
  const m = d.getMonth() + 1, day = d.getDate();
  if (m === 10 || (m === 9 && day > 20)) return "halloween";
  if (m === 11) return "thanksgiving";
  if (m === 12) return day > 26 ? "nye" : "christmas";
  if (m === 1) return "newyear";
  if (m === 2) return "valentines";
  if (m === 3) return "stpatricks";
  if (m === 4 || m === 5) return "spring";
  if (m === 6 || m === 7) return "july4";
  return "birthday";
}

function blankEvent(theme) {
  const b = THEMES[theme];
  return {
    theme, title: `${b.name} Party`, hosts: "", date: "", start: "", end: "", venue: "", address: "", dress: "", note: b.note,
    custom: { bg: "", surface: "", ink: "", accent: "", displayFont: "", bodyFont: "", motif: "", motifAmount: 2 },
    copy: { eyebrow: "", rsvpHeading: "", yes: "", maybe: "", no: "", photosHeading: "", guestsHeading: "" },
    rsvp: { open: true, deadline: "", allowMaybe: true, maxPlus: 2, askContact: false, showList: true, question: { enabled: true, label: "", placeholder: "", public: true } },
    photos: { enabled: true, uploads: true, guestsCanView: true },
  };
}

const params = new URLSearchParams(location.search);
const editId = params.get("edit");
let editKey = editId ? hostKey.get(editId) : null;
let currentEdit = editId;
let draft;
try { draft = editId ? null : JSON.parse(localStorage.getItem("kk:draft")); } catch { draft = null; }
if (!draft || !THEMES[draft.theme]) draft = blankEvent(seasonalTheme());
draft = merge(blankEvent(draft.theme), draft);

function merge(base, over) {
  for (const [k, v] of Object.entries(over || {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object") merge(base[k], v);
    else if (k in base) base[k] = v;
  }
  return base;
}
const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
function setPath(o, p, v) { const ks = p.split("."), last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; }

// ---------- theme picker ----------
const themesEl = $("#themes");
loadFonts(THEME_ORDER.map((id) => THEMES[id].fonts.display));
for (const id of THEME_ORDER) {
  const t = THEMES[id], c = t.colors;
  const input = h("input", { type: "radio", name: "theme", value: id, "aria-label": t.name });
  const sw = h("span", { style: `background:linear-gradient(160deg, ${c.bg}, ${c.bg2}); color:${c.ink}` },
    h("i", { html: iconSvg(t.icon, c, 30), style: "display:block" }),
    h("b", { text: t.name, style: `font-family:"${t.fonts.display}", Georgia, serif; color:${c.accent}` }));
  themesEl.append(h("label", { class: "theme-opt" }, input, sw));
}
themesEl.addEventListener("change", (e) => {
  const next = e.target.value, prev = THEMES[draft.theme];
  if (!THEMES[next] || next === draft.theme) return;
  if (!draft.title || draft.title === `${prev.name} Party`) draft.title = `${THEMES[next].name} Party`;
  if (!draft.note || draft.note === prev.note) draft.note = THEMES[next].note;
  draft.theme = next;
  draft.custom = { ...blankEvent(next).custom, motifAmount: draft.custom.motifAmount };
  syncForm(); changed();
});

// ---------- selects ----------
function fillSelects() {
  const base = THEMES[draft.theme];
  const opt = (v, label) => h("option", { value: v, text: label });
  $("#f-dfont").replaceChildren(opt("", `Theme default (${base.fonts.display})`), ...DISPLAY_FONTS.map((f) => opt(f, f)));
  $("#f-bfont").replaceChildren(opt("", `Theme default (${base.fonts.body})`), ...BODY_FONTS.map((f) => opt(f, f)));
  $("#f-motif").replaceChildren(opt("", `Theme default (${MOTIFS[base.motif]})`), ...Object.entries(MOTIFS).map(([k, v]) => opt(k, v)));
}

// ---------- form <-> draft ----------
function syncForm() {
  fillSelects();
  const base = THEMES[draft.theme], t = resolveTheme(draft);
  themesEl.querySelectorAll("input").forEach((i) => (i.checked = i.value === draft.theme));
  $("#sum-theme").textContent = base.name;
  form.querySelectorAll("[data-k]").forEach((el) => {
    const v = getPath(draft, el.dataset.k);
    if (el.type === "checkbox") el.checked = !!v; else el.value = v == null ? "" : v;
  });
  form.querySelectorAll("[data-c]").forEach((el) => (el.value = draft.custom[el.dataset.c] || t.colors[el.dataset.c]));
  const ph = { "copy.eyebrow": base.copy.eyebrow, "copy.rsvpHeading": base.copy.rsvpHeading, "copy.yes": base.copy.yes, "copy.maybe": base.copy.maybe, "copy.no": base.copy.no,
    "copy.photosHeading": base.copy.photosHeading, "copy.guestsHeading": base.copy.guestsHeading, "rsvp.question.label": base.question.label, "rsvp.question.placeholder": base.question.placeholder };
  for (const [k, v] of Object.entries(ph)) { const el = form.querySelector(`[data-k="${k}"]`); if (el) el.placeholder = v; }
  syncDependents();
}
function syncDependents() {
  $("#amount-label").textContent = AMOUNTS[draft.custom.motifAmount] || "Some";
  const q = draft.rsvp.question.enabled;
  $("#q-fields").hidden = !q; $("#q-public").hidden = !q;
  $('[data-k="copy.maybe"]').disabled = !draft.rsvp.allowMaybe;
  const ph = draft.photos.enabled;
  form.querySelectorAll('[data-k="photos.uploads"], [data-k="photos.guestsCanView"]').forEach((el) => (el.disabled = !ph));
}

form.addEventListener("input", (e) => {
  const el = e.target;
  if (el.dataset.k) {
    let v = el.type === "checkbox" ? el.checked : el.value;
    if ("num" in el.dataset) v = Number(v);
    setPath(draft, el.dataset.k, v);
    syncDependents(); changed();
  } else if (el.dataset.c) {
    draft.custom[el.dataset.c] = el.value; changed();
  }
});
form.addEventListener("click", (e) => {
  const r = e.target.closest("[data-reset]");
  if (!r) return;
  e.preventDefault();
  draft.custom[r.dataset.reset] = "";
  syncForm(); changed();
});

// ---------- preview ----------
let view = null, timer = 0;
function renderPreview() {
  const scroll = preview.scrollTop;
  view && view.destroy();
  view = mountInvite(preview, { ...draft, id: currentEdit || "" }, { preview: true });
  preview.scrollTop = scroll;
}
function changed() {
  if (!currentEdit) { try { localStorage.setItem("kk:draft", JSON.stringify(draft)); } catch {} }
  clearTimeout(timer); timer = setTimeout(renderPreview, 120);
}

// ---------- phone view switch ----------
document.querySelectorAll(".switch button").forEach((b) => b.addEventListener("click", () => {
  $("#studio").dataset.view = b.dataset.view;
  document.querySelectorAll(".switch button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  window.scrollTo(0, 0);
}));

// ---------- your parties ----------
function renderMine() {
  const list = myParties();
  $("#mine").hidden = !list.length;
  $("#mine-list").replaceChildren(...list.map((p) => h("li", null,
    h("div", null, h("div", { class: "t", text: p.title || "Party" }), h("div", { class: "d", text: [p.date ? fmtDate(p.date, { weekday: "short", month: "short", day: "numeric" }) : "", THEMES[p.theme] ? THEMES[p.theme].name : ""].filter(Boolean).join(" · ") })),
    h("div", { class: "row" },
      h("a", { class: "btn ghost small", href: `/e/${p.id}`, text: "Invite" }),
      h("a", { class: "btn primary small", href: `/e/${p.id}/host#k=${p.key}`, text: "Manage" }),
      h("button", { class: "btn ghost small", type: "button", title: "Remove from this list", onclick: () => { forgetParty(p.id); renderMine(); } }, "Hide")))));
}

// ---------- publish ----------
function showDone(id, key, isEdit) {
  const invite = `${location.origin}/e/${id}`, hostUrl = `${location.origin}/e/${id}/host#k=${key}`;
  const t = resolveTheme(draft);
  const copyBtn = (text, label) => h("button", { class: "btn ghost small", type: "button", onclick: async (e) => {
    try { await navigator.clipboard.writeText(text); e.target.textContent = "Copied"; } catch { e.target.closest(".linkline")?.querySelector("input")?.select(); e.target.textContent = "Press Ctrl+C"; }
    setTimeout(() => (e.target.textContent = label), 1800);
  } }, label);
  const msg = `You're invited: ${draft.title}${draft.date ? " on " + fmtDate(draft.date, { weekday: "short", month: "short", day: "numeric" }) : ""}. RSVP here: ${invite}`;
  const done = $("#done");
  done.replaceChildren(
    h("h3", { text: isEdit ? "Changes saved" : "Your invitation is live" }),
    h("div", { class: "split" },
      h("div", { class: "qr-mini", html: qrSvg(invite, { dark: t.qr.dark, light: "#fff", title: "Invitation QR code" }) }),
      h("div", null,
        h("span", { class: "lbl", text: "Send this link to guests" }),
        h("div", { class: "linkline" }, h("input", { type: "text", readonly: true, value: invite, "aria-label": "Guest link" }), copyBtn(invite, "Copy")),
        h("div", { class: "row" },
          navigator.share ? h("button", { class: "btn primary small", type: "button", onclick: () => navigator.share({ title: draft.title, text: msg.replace(invite, "").trim(), url: invite }).catch(() => {}) }, "Share…") : null,
          h("a", { class: "btn ghost small", href: `sms:?&body=${encodeURIComponent(msg)}` }, "Text it"),
          h("a", { class: "btn ghost small", href: invite, target: "_blank", rel: "noopener" }, "Open")))),
    h("div", { class: "field" },
      h("span", { class: "lbl", text: "Your host link" }),
      h("div", { class: "linkline" }, h("input", { type: "text", readonly: true, value: hostUrl, "aria-label": "Host link" }), copyBtn(hostUrl, "Copy")),
      h("p", { class: "warn", text: "This link manages the party: RSVPs, photos and edits. Anyone who has it can do the same, so don't share it. Bookmark it or save it in your notes." })),
    h("div", { class: "row" },
      h("a", { class: "btn primary small", href: hostUrl }, "See RSVPs"),
      h("button", { class: "btn ghost small", type: "button", onclick: () => downloadQrCard({ url: invite, title: draft.title, label: "Scan to RSVP", sub: draft.date ? fmtDate(draft.date) : "", theme: t }, "invite-qr.png") }, "Download QR card"),
      h("a", { class: "btn ghost small", href: `/e/${id}/poster?for=photos`, target: "_blank", rel: "noopener" }, "Print photo sign")),
  );
  done.hidden = false;
  done.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!draft.title.trim()) { status.className = "status bad"; status.textContent = "Give the party a name."; $("#f-title").focus(); return; }
  const btn = $("#publish");
  btn.disabled = true; status.className = "status"; status.textContent = currentEdit ? "Saving…" : "Creating your invitation…";
  try {
    if (currentEdit) {
      const res = await api(`/api/events/${currentEdit}`, { method: "PUT", body: { event: draft }, headers: { "x-host-key": editKey } });
      rememberParty({ id: currentEdit, key: editKey, title: res.event.title, date: res.event.date, theme: res.event.theme });
      status.className = "status ok"; status.textContent = "Saved. Guests see the changes right away.";
      showDone(currentEdit, editKey, true);
    } else {
      const res = await api("/api/events", { method: "POST", body: { event: draft, passcode: $("#f-pass").value } });
      rememberParty({ id: res.id, key: res.key, title: res.event.title, date: res.event.date, theme: res.event.theme });
      try { localStorage.removeItem("kk:draft"); } catch {}
      status.className = "status ok"; status.textContent = "Created.";
      showDone(res.id, res.key, false);
      history.replaceState(null, "", `/?edit=${res.id}#k=${res.key}`);
      enterEdit(res.id, res.key);
    }
    renderMine();
  } catch (err) {
    status.className = "status bad"; status.textContent = err.message;
    if (err.status === 403 && !currentEdit) $("#pass-field").hidden = false;
  } finally { btn.disabled = false; }
});

function enterEdit(id, key) {
  currentEdit = id; editKey = key;
  $("#mode-title").textContent = "Edit invitation";
  $("#mode-sub").textContent = "Changes go live for guests as soon as you save.";
  $("#publish").textContent = "Save changes";
  $("#edit-tools").hidden = false;
}
$("#new-btn").addEventListener("click", () => { location.href = "/"; });

// ---------- start ----------
(async () => {
  renderMine();
  try { const cfg = await api("/api/config"); if (cfg.passcodeRequired && !editId) $("#pass-field").hidden = false; } catch {}
  if (editId) {
    enterEdit(editId, editKey);
    try {
      if (!editKey) throw Object.assign(new Error("Open this page from your host link to edit the party."), { status: 403 });
      const res = await api(`/api/events/${editId}`, { headers: { "x-host-key": editKey } });
      if (!res.host) throw new Error("This device doesn't have the host key for that party. Open your host link first.");
      draft = merge(blankEvent(res.event.theme), res.event);
    } catch (err) {
      status.className = "status bad"; status.textContent = err.message;
      draft = blankEvent(seasonalTheme());
      $("#publish").disabled = true;
    }
  }
  syncForm(); renderPreview();
})();
