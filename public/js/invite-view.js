// Renders an invitation. Used three ways: the live preview in the builder
// (preview: true, sample guests, nothing sent), the guest page, and the
// host's view of their own invite.
import { resolveTheme, applyTheme } from "./themes.js";
import { iconSvg } from "./icons.js";
import { startMotif } from "./motifs.js";
import { qrSvg } from "./qr.js";
import { api } from "./api.js";

// ---------- small helpers ----------
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "html") el.innerHTML = v; // only ever used with markup we generate (icons, QR)
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style") el.setAttribute("style", v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(String(k)));
  return el;
}

export function fmtDate(d, opts = { weekday: "long", month: "long", day: "numeric" }) {
  if (!d) return "";
  const x = new Date(d + "T12:00:00");
  const o = { ...opts };
  if (x.getFullYear() !== new Date().getFullYear()) o.year = "numeric";
  return x.toLocaleDateString("en-US", o);
}
export function fmtTime(t) {
  if (!t) return "";
  const [hh, mm] = t.split(":").map(Number);
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`;
}
const pad = (n) => String(n).padStart(2, "0");
function stamp(date, time) { return date.replace(/-/g, "") + (time ? "T" + time.replace(":", "") + "00" : ""); }
function endOf(ev) {
  if (!ev.start) return null;
  if (ev.end) {
    const same = ev.end > ev.start;
    const d = new Date(ev.date + "T12:00:00"); if (!same) d.setDate(d.getDate() + 1);
    return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: ev.end };
  }
  const [hh, mm] = ev.start.split(":").map(Number), d = new Date(ev.date + "T00:00:00"); d.setHours(hh + 3, mm);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}
const icsEsc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");

export function calendarFile(ev, url) {
  const where = [ev.venue, ev.address].filter(Boolean).join(", ");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Knock Knock//Invites//EN", "BEGIN:VEVENT",
    `UID:${ev.id || "preview"}@knockknock`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`];
  if (ev.start) { const e = endOf(ev); lines.push(`DTSTART:${stamp(ev.date, ev.start)}`, `DTEND:${stamp(e.date, e.time)}`); }
  else { const d = new Date(ev.date + "T12:00:00"); d.setDate(d.getDate() + 1); lines.push(`DTSTART;VALUE=DATE:${stamp(ev.date)}`, `DTEND;VALUE=DATE:${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`); }
  lines.push(`SUMMARY:${icsEsc(ev.title)}`);
  if (where) lines.push(`LOCATION:${icsEsc(where)}`);
  lines.push(`DESCRIPTION:${icsEsc([ev.hosts ? "Hosted by " + ev.hosts : "", ev.note, url].filter(Boolean).join("\n\n"))}`);
  if (url) lines.push(`URL:${url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
export function googleCalUrl(ev, url) {
  const where = [ev.venue, ev.address].filter(Boolean).join(", ");
  let dates;
  if (ev.start) { const e = endOf(ev); dates = `${stamp(ev.date, ev.start)}/${stamp(e.date, e.time)}`; }
  else { const d = new Date(ev.date + "T12:00:00"); d.setDate(d.getDate() + 1); dates = `${stamp(ev.date)}/${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; }
  const p = new URLSearchParams({ action: "TEMPLATE", text: ev.title, dates, location: where, details: [ev.hosts ? "Hosted by " + ev.hosts : "", url].filter(Boolean).join("\n") });
  return "https://calendar.google.com/calendar/render?" + p.toString();
}
export function saveFile(name, text, type) {
  const a = h("a", { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// Shrink a phone photo to a web size and a thumbnail before upload.
function shrink(file, max, quality) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve({ blob: b, w: c.width, h: c.height }) : reject(new Error("encode"))), "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
    img.src = url;
  });
}

const SAMPLE = (q) => [
  { id: "s1", name: "Maya R.", attending: "yes", plus: 1, answer: q || "" },
  { id: "s2", name: "Chris", attending: "yes", plus: 0, answer: "" },
  { id: "s3", name: "Dani", attending: "maybe", plus: 0, answer: "" },
];

// ---------- main ----------
export function mountInvite(root, event, opts = {}) {
  const { preview = false, origin = location.origin } = opts;
  let data = opts.data || { rsvps: [], photos: [], counts: null };
  const t = resolveTheme(event);
  const ev = event;
  const inviteUrl = ev.id ? `${origin}/e/${ev.id}` : `${origin}/e/your-party`;
  const photoUrl = inviteUrl + "#photos";
  const mine = () => (ev.id ? store.get(`kk:rsvp:${ev.id}`) : null);
  const qLabel = (ev.rsvp.question && ev.rsvp.question.label) || t.base.question.label;
  const qPlaceholder = (ev.rsvp.question && ev.rsvp.question.placeholder) || t.base.question.placeholder;

  root.textContent = "";
  const art = h("article", { class: "inv" });
  applyTheme(art, t);
  const canvas = h("canvas", { class: "inv-motif", "aria-hidden": "true" });
  const wrap = h("div", { class: "inv-wrap" });
  art.append(canvas, wrap);
  root.append(art);

  // Hero
  wrap.append(h("header", { class: "inv-hero" },
    h("div", { class: "inv-icon", html: iconSvg(t.icon, t.colors, 72) }),
    h("p", { class: "inv-eyebrow", text: t.copy.eyebrow }),
    h("h1", { class: "inv-title", text: ev.title || "Party" }),
    ev.hosts ? h("p", { class: "inv-hosts" }, "Hosted by ", h("strong", { text: ev.hosts })) : null,
  ));

  // Details
  const facts = h("dl", { class: "inv-facts" });
  const fact = (label, main, sub) => facts.append(h("div", { class: "inv-fact" }, h("dt", { class: "inv-label", text: label }), h("dd", null, main, sub ? h("span", { text: sub }) : null)));
  if (ev.date) fact("When", fmtDate(ev.date), ev.start ? fmtTime(ev.start) + (ev.end ? " – " + fmtTime(ev.end) : "") : "");
  else fact("When", "Date to be announced");
  if (ev.venue || ev.address) {
    const addr = ev.address ? h("a", { href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ev.address), target: "_blank", rel: "noopener", text: ev.address }) : null;
    facts.append(h("div", { class: "inv-fact" }, h("dt", { class: "inv-label", text: "Where" }),
      h("dd", null, ev.venue || addr, ev.venue && addr ? h("span", null, addr) : null)));
  }
  if (ev.dress) fact("Dress code", ev.dress);
  if (ev.rsvp.deadline) fact("RSVP by", fmtDate(ev.rsvp.deadline));
  const details = h("section", { class: "inv-card" }, facts);
  if (ev.note) details.append(h("p", { class: "inv-note", text: ev.note }));
  if (ev.date) {
    details.append(h("div", { class: "inv-actions" },
      h("button", { class: "inv-btn ghost small", type: "button", onclick: () => !preview && saveFile((ev.title || "party").replace(/[^\w]+/g, "-") + ".ics", calendarFile(ev, inviteUrl), "text/calendar") }, "Add to calendar"),
      h("a", { class: "inv-btn ghost small", href: preview ? null : googleCalUrl(ev, inviteUrl), target: "_blank", rel: "noopener" }, "Google Calendar"),
      ev.address ? h("a", { class: "inv-btn ghost small", href: "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(ev.address), target: "_blank", rel: "noopener" }, "Directions") : null,
    ));
  }
  wrap.append(details);

  // RSVP
  const rsvpSec = h("section", { class: "inv-section", id: "rsvp" }, h("h2", { text: t.copy.rsvpHeading }));
  const rsvpBody = h("div", { class: "inv-card" });
  rsvpSec.append(rsvpBody);
  wrap.append(rsvpSec);

  function renderForm(prefill) {
    rsvpBody.textContent = "";
    const closedMsg = !ev.rsvp.open ? "RSVPs are closed for this party." :
      ev.rsvp.deadline && ev.rsvp.deadline < new Date(Date.now() - 14 * 3600e3).toISOString().slice(0, 10) ? "The RSVP deadline has passed. Message the hosts directly." : "";
    if (closedMsg && !opts.host) { rsvpBody.append(h("p", { class: "inv-status", text: closedMsg })); return; }
    const p = prefill || {};
    const choices = [["yes", t.copy.yes], ...(ev.rsvp.allowMaybe ? [["maybe", t.copy.maybe]] : []), ["no", t.copy.no]];
    const f = h("form", { novalidate: true });
    const name = h("input", { type: "text", id: "rsvp-name", maxlength: 50, autocomplete: "name", value: p.name || "", required: true });
    f.append(h("div", { class: "inv-field" }, h("label", { class: "inv-label", for: "rsvp-name", text: "Your name" }), name));
    const group = h("div", { class: "inv-choices", role: "radiogroup", "aria-label": "Are you coming?", style: `--n:${choices.length}` },
      choices.map(([v, label]) => h("label", { class: "inv-choice" }, h("input", { type: "radio", name: "attending", value: v, checked: p.attending === v }), h("span", { text: label }))));
    f.append(h("div", { class: "inv-field" }, h("span", { class: "inv-label", text: "Are you coming?" }), group));
    const extra = h("div", { class: "inv-row" });
    let plusSel = null, answer = null;
    if (ev.rsvp.question.enabled) {
      answer = h("input", { type: "text", id: "rsvp-answer", maxlength: 120, placeholder: qPlaceholder, value: p.answer || "" });
      extra.append(h("div", { class: "inv-field" }, h("label", { class: "inv-label", for: "rsvp-answer", text: qLabel }), answer));
    }
    if (ev.rsvp.maxPlus > 0) {
      plusSel = h("select", { id: "rsvp-plus" }, Array.from({ length: ev.rsvp.maxPlus + 1 }, (_, i) => h("option", { value: i, selected: (p.plus || 0) === i, text: i === 0 ? "Just me" : "+" + i })));
      extra.append(h("div", { class: "inv-field" }, h("label", { class: "inv-label", for: "rsvp-plus", text: "Bringing" }), plusSel));
    }
    if (!answer && plusSel) extra.style.gridTemplateColumns = "1fr";
    if (extra.children.length) f.append(extra);
    let contact = null;
    if (ev.rsvp.askContact) {
      contact = h("input", { type: "text", id: "rsvp-contact", maxlength: 80, autocomplete: "tel", placeholder: "Phone or email", value: p.contact || "" });
      f.append(h("div", { class: "inv-field" }, h("label", { class: "inv-label", for: "rsvp-contact", text: "How to reach you" }), contact, h("span", { class: "inv-private", text: "Only the hosts see this." })));
    }
    const msg = h("textarea", { id: "rsvp-msg", maxlength: 400, rows: 2, placeholder: "Allergies, running late, can't wait…" }, p.message || "");
    f.append(h("div", { class: "inv-field" }, h("label", { class: "inv-label", for: "rsvp-msg", text: "Note to the hosts (optional)" }), msg));
    const hp = h("input", { type: "text", name: "website", tabindex: "-1", autocomplete: "off" });
    f.append(h("div", { class: "inv-hp", "aria-hidden": "true" }, hp));
    const status = h("p", { class: "inv-status", role: "status" });
    const btn = h("button", { class: "inv-btn primary", type: "submit", text: p.attending ? "Update my RSVP" : "Send RSVP" });
    f.append(h("div", { class: "inv-actions" }, btn), status);
    const syncPlus = () => { const a = f.querySelector("input[name=attending]:checked"); if (plusSel) plusSel.disabled = a && a.value === "no"; };
    group.addEventListener("change", syncPlus); syncPlus();

    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const a = f.querySelector("input[name=attending]:checked");
      const body = { name: name.value.trim(), attending: a ? a.value : "", plus: plusSel && !plusSel.disabled ? +plusSel.value : 0,
        answer: answer ? answer.value.trim() : "", contact: contact ? contact.value.trim() : "", message: msg.value.trim(), website: hp.value };
      status.classList.add("bad");
      if (!body.name) { status.textContent = "Add your name so the hosts know who you are."; name.focus(); return; }
      if (!body.attending) { status.textContent = "Choose whether you're coming."; return; }
      status.classList.remove("bad");
      if (preview) { status.textContent = "This is a preview. Guests' answers are saved once the invite is live."; return; }
      btn.disabled = true; status.textContent = "Sending…";
      try {
        const saved = mine();
        let res;
        if (saved && saved.id) {
          try { res = await api(`/api/events/${ev.id}/rsvps/${saved.id}`, { method: "PUT", body, headers: { "x-rsvp-token": saved.token } }); }
          catch (err) { if (err.status === 404) res = null; else throw err; }
        }
        if (!res) res = await api(`/api/events/${ev.id}/rsvps`, { method: "POST", body });
        const rec = res.rsvp;
        store.set(`kk:rsvp:${ev.id}`, { id: rec.id, token: res.token || (saved && saved.token), body });
        opts.onChange && opts.onChange();
        renderDone(body);
      } catch (err) {
        status.classList.add("bad"); status.textContent = err.message; btn.disabled = false;
      }
    });
    rsvpBody.append(f);
  }

  function renderDone(body) {
    const nameBox = root.querySelector("#photo-name"); if (nameBox) nameBox.hidden = true;
    rsvpBody.textContent = "";
    rsvpBody.classList.add("inv-done");
    const first = body.name.split(/\s+/)[0];
    const line = body.attending === "yes" ? `See you there, ${first}!` : body.attending === "maybe" ? `Thanks, ${first}. Hope you can make it.` : `Thanks for letting us know, ${first}.`;
    const bits = [];
    if (body.attending !== "no" && body.plus) bits.push(`+${body.plus}`);
    if (body.answer) bits.push(`${qLabel}: ${body.answer}`);
    rsvpBody.append(
      h("p", { class: "big", text: line }),
      h("p", { class: "inv-status", text: "Your RSVP is saved." + (bits.length ? " " + bits.join(" · ") : "") }),
      h("div", { class: "inv-actions", style: "justify-content:center" },
        h("button", { class: "inv-btn ghost small", type: "button", onclick: () => { rsvpBody.classList.remove("inv-done"); renderForm(body); } }, "Change my answer")),
    );
  }

  const existing = mine();
  if (existing && existing.body && !preview) renderDone(existing.body); else renderForm();

  // Guest list
  let guestSec = null;
  if (ev.rsvp.showList || opts.host) {
    guestSec = h("section", { class: "inv-section", id: "guests" });
    wrap.append(guestSec);
  }
  function renderGuests() {
    if (!guestSec) return;
    guestSec.textContent = "";
    const list = preview ? SAMPLE(ev.rsvp.question.enabled && ev.rsvp.question.public ? qPlaceholder : "") : (data.rsvps || []);
    const order = { yes: 0, maybe: 1, no: 2 };
    const sorted = [...list].sort((a, b) => order[a.attending] - order[b.attending] || String(a.at || "").localeCompare(String(b.at || "")));
    const c = { yes: 0, maybe: 0, no: 0, head: 0 };
    for (const r of list) { c[r.attending]++; if (r.attending === "yes") c.head += 1 + (r.plus || 0); }
    guestSec.append(h("h2", { text: t.copy.guestsHeading }));
    const card = h("div", { class: "inv-card" });
    card.append(h("div", { class: "inv-tally" },
      h("span", null, h("b", { text: c.head }), " coming"),
      ev.rsvp.allowMaybe ? h("span", null, h("b", { text: c.maybe }), " maybe") : null,
      h("span", null, h("b", { text: c.no }), " can't")));
    if (sorted.length) {
      const labels = { yes: "Coming", maybe: "Maybe", no: "Can't" };
      card.append(h("ul", { class: "inv-guests" }, sorted.map((r) => h("li", null,
        h("span", { class: "who", text: r.name + (r.attending !== "no" && r.plus ? ` +${r.plus}` : "") }),
        h("span", { class: `inv-pill ${r.attending}`, text: labels[r.attending] }),
        r.answer && r.attending !== "no" ? h("span", { class: "ans", text: `${qLabel}: ${r.answer}` }) : null))));
    } else card.append(h("p", { class: "inv-empty", text: "No RSVPs yet. Be the first." }));
    if (preview) card.append(h("p", { class: "inv-sample", text: "Sample guests shown in the preview only." }));
    guestSec.append(card);
  }
  renderGuests();

  // Photos
  let photoSec = null, grid = null, photoStatus = null;
  const viewer = h("dialog", { class: "inv-viewer" });
  if (ev.photos.enabled) {
    photoSec = h("section", { class: "inv-section", id: "photos" }, h("h2", { text: t.copy.photosHeading }));
    const card = h("div", { class: "inv-card" });
    if (ev.photos.uploads || opts.host) {
      const input = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true });
      const saved = mine();
      const nameIn = saved && saved.body ? null : h("input", { type: "text", id: "photo-name", maxlength: 50, placeholder: "Your name (optional)", "aria-label": "Your name" });
      const btn = h("button", { class: "inv-btn primary", type: "button", onclick: () => (preview ? (photoStatus.textContent = "Guests add photos here once the invite is live.") : input.click()) }, "Add photos");
      photoStatus = h("p", { class: "inv-status", role: "status", style: "text-align:center" });
      input.addEventListener("change", () => {
        const files = Array.from(input.files || []).slice(0, 20); input.value = "";
        const me = mine();
        if (files.length) upload(files, (me && me.body && me.body.name) || (nameIn && nameIn.value.trim()) || "Guest", btn);
      });
      card.append(h("div", { class: "inv-upload" }, nameIn, btn, input), photoStatus);
    }
    grid = h("div", { class: "inv-grid" });
    card.append(grid);
    photoSec.append(card);
    wrap.append(photoSec);
  }
  const photoSrc = (p, size) => p[size + "Url"] || `/api/events/${ev.id}/photos/${p.id}/${size}`;
  function renderPhotos() {
    if (!grid) return;
    grid.textContent = "";
    const list = preview ? [] : data.photos || [];
    const canView = opts.host || ev.photos.guestsCanView;
    if (!list.length || !canView) {
      grid.append(h("p", { class: "inv-empty", style: "grid-column:1/-1", text: !canView ? "Photos go straight to the hosts." : "No photos yet. Pictures taken at the party show up here for everyone." }));
      return;
    }
    list.forEach((p, i) => grid.append(h("button", { class: "inv-shot", type: "button", "aria-label": `Photo from ${p.name}`, onclick: () => openViewer(i) },
      h("img", { src: photoSrc(p, "thumb"), alt: "", loading: "lazy" }))));
  }
  function openViewer(i) {
    const list = data.photos || []; if (!list[i]) return;
    const p = list[i];
    viewer.textContent = "";
    viewer.append(h("img", { src: photoSrc(p, "full"), alt: `Photo from ${p.name}` }),
      h("div", { class: "bar" },
        h("span", { text: `From ${p.name}` }),
        h("span", { class: "inv-actions" },
          i > 0 ? h("button", { class: "inv-btn ghost small", type: "button", onclick: () => openViewer(i - 1) }, "Previous") : null,
          i < list.length - 1 ? h("button", { class: "inv-btn ghost small", type: "button", onclick: () => openViewer(i + 1) }, "Next") : null,
          h("a", { class: "inv-btn ghost small", href: photoSrc(p, "full"), download: `party-photo-${p.id}.jpg` }, "Save"),
          h("button", { class: "inv-btn ghost small", type: "button", onclick: () => viewer.close() }, "Close"))));
    if (!viewer.open) viewer.showModal();
  }
  async function upload(files, who, btn) {
    btn.disabled = true;
    let ok = 0, bad = 0, stop = "";
    for (let i = 0; i < files.length; i++) {
      photoStatus.classList.remove("bad");
      photoStatus.textContent = `Adding photo ${i + 1} of ${files.length}…`;
      try {
        const full = await shrink(files[i], 1600, 0.84), thumb = await shrink(files[i], 480, 0.76);
        const fd = new FormData();
        fd.append("full", full.blob, "full.jpg"); fd.append("thumb", thumb.blob, "thumb.jpg");
        fd.append("name", who); fd.append("w", full.w); fd.append("h", full.h);
        await api(`/api/events/${ev.id}/photos`, { method: "POST", form: fd });
        ok++;
      } catch (err) {
        if (err.status) { stop = err.message; if ([409, 413, 403].includes(err.status)) break; }
        bad++;
      }
    }
    btn.disabled = false;
    photoStatus.classList.toggle("bad", !!(stop || bad));
    photoStatus.textContent = stop ? `${ok ? ok + " added. " : ""}${stop}` : bad ? `${ok} added. ${bad} couldn't be read; try saving them as JPG first.` : ok === 1 ? "Photo added. Thanks!" : `${ok} photos added. Thanks!`;
    opts.onChange && opts.onChange();
  }
  renderPhotos();
  root.append(viewer);

  // QR ticket
  const codeBox = h("div", { class: "code" });
  const tabs = h("div", { class: "inv-tabs", role: "group", "aria-label": "Which code" });
  const stubTitle = h("h3"), stubText = h("p");
  function showCode(which) {
    const photos = which === "photos";
    codeBox.innerHTML = qrSvg(photos ? photoUrl : inviteUrl, { dark: "#17131c", light: "#ffffff", title: photos ? "QR code to add photos" : "QR code for this invitation" });
    stubTitle.textContent = photos ? "Photo drop" : "Pass it on";
    stubText.textContent = photos ? "At the party, scan this to add the pictures you take." : "Scan to open this invitation on another phone.";
    tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === which)));
  }
  if (ev.photos.enabled && (ev.photos.uploads || opts.host)) {
    tabs.append(h("button", { type: "button", "data-k": "invite", onclick: () => showCode("invite") }, "Invite"),
      h("button", { type: "button", "data-k": "photos", onclick: () => showCode("photos") }, "Photo drop"));
  }
  const ticket = h("section", { class: "inv-ticket", "aria-label": "QR code" },
    h("div", { class: "stub" }, h("span", { class: "inv-label", text: ev.title || "Party" }), stubTitle, stubText, tabs),
    codeBox);
  wrap.append(ticket);
  showCode("invite");

  wrap.append(h("p", { class: "inv-foot" }, "Made with ", h("a", { href: preview ? null : "/", text: "Knock Knock" })));

  // Motif
  const stop = startMotif(canvas, t.motif, t.motifColors, t.density);

  return {
    theme: t,
    setData(d) { data = d; renderGuests(); renderPhotos(); },
    destroy() { stop(); root.textContent = ""; },
  };
}
