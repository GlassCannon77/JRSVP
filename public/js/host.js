import { api, hostKey, rememberParty, forgetParty } from "./api.js";
import { h, fmtDate, fmtTime, saveFile } from "./invite-view.js";
import { resolveTheme, applyTheme } from "./themes.js";
import { qrSvg, downloadQrCard } from "./qr.js";

const app = document.getElementById("app");
const id = (location.pathname.match(/^\/e\/([a-z0-9]+)/) || [])[1];
const key = id ? hostKey.get(id) : null;
const auth = { "x-host-key": key || "" };
let state = null, filter = "all";

function fail(msg) {
  app.replaceChildren(h("div", { class: "host-wrap" }, h("div", { class: "box", style: "margin-top:24px" },
    h("h2", { text: "Can't open this host page" }), h("p", { text: msg }),
    h("p", { class: "hint", text: "Open the host link you saved when you created the party. It ends with #k= followed by your key." }))));
}

async function load() {
  const res = await api(`/api/events/${id}`, { headers: auth });
  if (!res.host) throw new Error("This device doesn't have the host key for this party.");
  return res;
}

const copy = async (text, btn, label) => {
  try { await navigator.clipboard.writeText(text); btn.textContent = "Copied"; } catch { btn.textContent = "Copy failed"; }
  setTimeout(() => (btn.textContent = label), 1600);
};

function armed(btn, label, run) {
  btn.addEventListener("click", async () => {
    if (!btn.classList.contains("armed")) {
      btn.classList.add("armed"); btn.textContent = "Tap again to confirm";
      setTimeout(() => { btn.classList.remove("armed"); btn.textContent = label; }, 4000); return;
    }
    btn.disabled = true;
    try { await run(); } catch (e) { btn.textContent = e.message; btn.disabled = false; }
  });
  return btn;
}

function csv(rows) {
  const esc = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

function render() {
  const { event: ev, rsvps = [], photos = [] } = state;
  const t = resolveTheme(ev);
  const invite = `${location.origin}/e/${id}`, photoLink = `${invite}/photos`;
  document.title = `${ev.title} · Host`;

  // header in the party's own colors
  const head = h("section", { class: "host-head" },
    h("p", { text: [ev.date ? fmtDate(ev.date) : "Date to be announced", ev.start ? fmtTime(ev.start) : "", ev.venue].filter(Boolean).join(" · ") }),
    h("h1", { text: ev.title }),
    ev.hosts ? h("p", { text: `Hosted by ${ev.hosts}` }) : null,
    h("div", { class: "row" },
      h("a", { class: "btn primary small", href: invite, target: "_blank", rel: "noopener" }, "View invite"),
      h("a", { class: "btn ghost small", href: `/?edit=${id}#k=${key}` }, "Edit invitation")));
  applyTheme(head, t);
  head.style.background = `linear-gradient(160deg, ${t.colors.bg}, ${t.colors.bg2})`;
  head.style.color = t.colors.ink;

  // tallies
  const c = { yes: 0, maybe: 0, no: 0, head: 0 };
  for (const r of rsvps) { c[r.attending]++; if (r.attending === "yes") c.head += 1 + (r.plus || 0); }
  const tile = (n, label, lead) => h("div", { class: "tile" + (lead ? " lead" : "") }, h("b", { text: n }), h("span", { text: label }));
  const tiles = h("div", { class: "tiles" }, tile(c.head, "people coming", true), tile(c.yes, "said yes"), tile(c.maybe, "maybe"), tile(c.no, "can't make it"), tile(photos.length, "photos"));

  // RSVP table
  const qLabel = (ev.rsvp.question && ev.rsvp.question.label) || t.base.question.label;
  const shown = rsvps.filter((r) => filter === "all" || r.attending === filter)
    .sort((a, b) => ({ yes: 0, maybe: 1, no: 2 }[a.attending] - { yes: 0, maybe: 1, no: 2 }[b.attending]) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const labels = { yes: "Coming", maybe: "Maybe", no: "Can't" };
  const filters = h("div", { class: "filters", role: "group", "aria-label": "Filter RSVPs" },
    [["all", `All ${rsvps.length}`], ["yes", `Coming ${c.yes}`], ["maybe", `Maybe ${c.maybe}`], ["no", `Can't ${c.no}`]]
      .filter(([k]) => k !== "maybe" || ev.rsvp.allowMaybe || c.maybe)
      .map(([k, l]) => h("button", { type: "button", "aria-pressed": String(filter === k), onclick: () => { filter = k; render(); } }, l)));
  const rsvpBox = h("section", { class: "box" },
    h("div", { class: "box-head" }, h("h2", { text: "RSVPs" }),
      h("button", { class: "btn ghost small", type: "button", disabled: !rsvps.length, onclick: () => {
        const rows = [["Name", "Answer", "Extra guests", qLabel, "Contact", "Note", "Answered"]].concat(
          rsvps.map((r) => [r.name, labels[r.attending], r.plus || 0, r.answer, r.contact, r.message, new Date(r.updatedAt || r.createdAt).toLocaleString()]));
        saveFile(`${ev.title.replace(/[^\w]+/g, "-")}-rsvps.csv`, csv(rows), "text/csv");
      } }, "Download spreadsheet")),
    filters);
  if (!shown.length) rsvpBox.append(h("p", { class: "empty-state", text: rsvps.length ? "Nobody in this group yet." : "No RSVPs yet. Send the invite link and answers will show up here." }));
  else {
    const tbody = h("tbody");
    for (const r of shown) {
      const del = armed(h("button", { class: "linkbtn", type: "button", text: "Remove" }), "Remove", async () => {
        await api(`/api/events/${id}/rsvps/${r.id}`, { method: "DELETE", headers: auth }); await refresh();
      });
      tbody.append(h("tr", null,
        h("td", null, h("strong", { text: r.name }), r.contact ? h("div", { class: "sub", text: r.contact }) : null),
        h("td", null, h("span", { class: `pill ${r.attending}`, text: labels[r.attending] })),
        h("td", { class: "num", text: r.attending === "no" ? "–" : "+" + (r.plus || 0) }),
        h("td", null, r.answer || h("span", { class: "sub", text: "–" }), r.message ? h("div", { class: "sub", text: `Note: ${r.message}` }) : null),
        h("td", null, h("span", { class: "sub", text: new Date(r.updatedAt || r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }), h("div", null, del))));
    }
    rsvpBox.append(h("div", { class: "table-wrap" }, h("table", { class: "rsvps" },
      h("thead", null, h("tr", null, ["Guest", "Answer", "Extra", qLabel, "When"].map((x) => h("th", { scope: "col", text: x })))), tbody)));
  }

  // share + QR
  const msg = `You're invited: ${ev.title}${ev.date ? " on " + fmtDate(ev.date, { weekday: "short", month: "short", day: "numeric" }) : ""}. RSVP here: ${invite}`;
  const cb = h("button", { class: "btn ghost small", type: "button", text: "Copy" });
  cb.addEventListener("click", () => copy(invite, cb, "Copy"));
  const qrBlock = (url, label, sub, file, poster) => h("div", null,
    h("div", { class: "qr-mini", html: qrSvg(url, { dark: t.qr.dark, light: "#fff", title: label }) }),
    h("strong", { text: label }),
    h("button", { class: "btn ghost small", type: "button", onclick: () => downloadQrCard({ url, title: ev.title, label, sub, theme: t }, file) }, "Download card"),
    h("a", { class: "btn ghost small", href: `/e/${id}/poster?for=${poster}`, target: "_blank", rel: "noopener" }, "Print sign"));
  const share = h("section", { class: "box" },
    h("h2", { text: "Share" }),
    h("div", { class: "linkline" }, h("input", { type: "text", readonly: true, value: invite, "aria-label": "Guest link" }), cb),
    h("div", { class: "row" },
      navigator.share ? h("button", { class: "btn primary small", type: "button", onclick: () => navigator.share({ title: ev.title, url: invite }).catch(() => {}) }, "Share…") : null,
      h("a", { class: "btn ghost small", href: `sms:?&body=${encodeURIComponent(msg)}` }, "Text it")),
    h("div", { class: "qr-pair" },
      qrBlock(invite, "Scan to RSVP", ev.date ? fmtDate(ev.date) : "", "invite-qr.png", "invite"),
      ev.photos.enabled ? qrBlock(photoLink, "Scan to add photos", "Share what you shoot tonight", "photo-qr.png", "photos") : null));

  // quick switches
  const toggle = (label, path, sub) => {
    const [a, b] = path.split(".");
    const input = h("input", { type: "checkbox", checked: !!ev[a][b] });
    input.addEventListener("change", async () => {
      input.disabled = true;
      const next = structuredClone(ev); next[a][b] = input.checked;
      try { const res = await api(`/api/events/${id}`, { method: "PUT", body: { event: next }, headers: auth }); state.event = res.event; render(); }
      catch (e) { input.checked = !input.checked; input.disabled = false; alertBox.textContent = e.message; }
    });
    return h("label", { class: "check" }, input, h("span", null, label, sub ? h("small", { text: sub }) : null));
  };
  const alertBox = h("p", { class: "status bad", role: "status" });
  const switches = h("section", { class: "box" }, h("h2", { text: "Right now" }),
    h("div", { class: "toggles" },
      toggle("Accepting RSVPs", "rsvp.open", "Turn off to close the guest list."),
      toggle("Show guest list to guests", "rsvp.showList"),
      ev.photos.enabled ? toggle("Guests can add photos", "photos.uploads") : null,
      ev.photos.enabled ? toggle("Guests can see the photo wall", "photos.guestsCanView") : null),
    alertBox);

  // photos
  const photoBox = h("section", { class: "box" }, h("div", { class: "box-head" }, h("h2", { text: `Photos (${photos.length})` })));
  if (!ev.photos.enabled) photoBox.append(h("p", { class: "empty-state", text: "The photo wall is off. Turn it on in Edit invitation." }));
  else if (!photos.length) photoBox.append(h("p", { class: "empty-state", text: "No photos yet. Print the photo sign or show guests the photo QR code at the party." }));
  else photoBox.append(h("div", { class: "photo-grid" }, photos.map((p) => {
    const del = armed(h("button", { class: "linkbtn", type: "button", text: "Delete" }), "Delete", async () => {
      await api(`/api/events/${id}/photos/${p.id}`, { method: "DELETE", headers: auth }); await refresh();
    });
    return h("figure", null,
      h("a", { href: `/api/events/${id}/photos/${p.id}/full`, target: "_blank", rel: "noopener" }, h("img", { src: `/api/events/${id}/photos/${p.id}/thumb`, alt: `Photo from ${p.name}`, loading: "lazy" })),
      h("figcaption", null, h("span", { text: p.name }), del));
  })));

  // danger zone
  const delParty = armed(h("button", { class: "btn danger small", type: "button", text: "Delete this party" }), "Delete this party", async () => {
    await api(`/api/events/${id}`, { method: "DELETE", headers: auth });
    forgetParty(id); location.href = "/";
  });
  const danger = h("section", { class: "box" }, h("h2", { text: "Delete party" }),
    h("p", { class: "hint", text: "Removes the invitation, every RSVP and every photo for good. The guest link stops working." }), h("div", null, delParty));

  app.replaceChildren(head, h("div", { class: "host-wrap", style: "margin-top:18px" }, tiles,
    h("div", { class: "cols" },
      h("div", { style: "display:flex;flex-direction:column;gap:18px;min-width:0" }, rsvpBox, photoBox),
      h("div", { style: "display:flex;flex-direction:column;gap:18px;min-width:0" }, share, switches, danger))));
}

async function refresh() {
  try { state = await load(); render(); } catch (e) { if (e.status === 404) fail(e.message); }
}

(async () => {
  if (!id) return fail("That link is missing the party.");
  if (!key) return fail("This device doesn't have the host key for this party.");
  try { state = await load(); } catch (e) { return fail(e.status === 403 ? "That host key doesn't match this party." : e.message); }
  rememberParty({ id, key, title: state.event.title, date: state.event.date, theme: state.event.theme });
  render();
  setInterval(() => { if (!document.hidden && !document.querySelector(".armed")) refresh(); }, 20000);
})();
