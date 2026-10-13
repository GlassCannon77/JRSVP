// Knock Knock API: events, RSVPs and photos, stored in Netlify Blobs.
// Guests never sign in. The host proves ownership with a secret key created
// with the event (only its SHA-256 hash is stored).
import { getStore } from "@netlify/blobs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const THEMES = ["halloween", "thanksgiving", "christmas", "hanukkah", "nye", "newyear", "valentines", "stpatricks", "spring", "july4", "birthday", "classic"];
const MOTIFS = ["none", "bats", "leaves", "snow", "sparkles", "confetti", "bubbles", "hearts", "clovers", "petals", "fireworks", "balloons"];
const MAX_RSVPS = 500, MAX_PHOTOS = 400;
const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];

const store = () => getStore({ name: "knockknock", consistency: "strong" });

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...headers } });
const sha = (s) => createHash("sha256").update(String(s)).digest("hex");
const token = (n = 24) => randomBytes(n).toString("base64url");
const ALPHA = "abcdefghjkmnpqrstuvwxyz23456789";
const shortId = (n = 8) => Array.from(randomBytes(n), (b) => ALPHA[b % ALPHA.length]).join("");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sameHash(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// --- input cleaning ---
const str = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : "");
const bool = (v, d) => (typeof v === "boolean" ? v : d);
const int = (v, lo, hi, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v : "");
const time = (v) => (/^\d{2}:\d{2}$/.test(v || "") ? v : "");
const color = (v) => (/^#[0-9a-fA-F]{6}$/.test(v || "") ? v.toLowerCase() : "");

function cleanEvent(b) {
  const c = b.custom || {}, cp = b.copy || {}, r = b.rsvp || {}, q = r.question || {}, ph = b.photos || {};
  const ev = {
    theme: THEMES.includes(b.theme) ? b.theme : "classic",
    title: str(b.title, 80) || "Party",
    hosts: str(b.hosts, 80),
    date: date(b.date), start: time(b.start), end: time(b.end),
    venue: str(b.venue, 80), address: str(b.address, 160),
    dress: str(b.dress, 80), note: str(b.note, 600),
    custom: {
      bg: color(c.bg), surface: color(c.surface), ink: color(c.ink), accent: color(c.accent),
      displayFont: str(c.displayFont, 40), bodyFont: str(c.bodyFont, 40),
      motif: MOTIFS.includes(c.motif) ? c.motif : "", motifAmount: int(c.motifAmount, 0, 3, 2),
    },
    copy: {},
    rsvp: {
      open: bool(r.open, true), deadline: date(r.deadline), allowMaybe: bool(r.allowMaybe, true),
      maxPlus: int(r.maxPlus, 0, 10, 2), askContact: bool(r.askContact, false), showList: bool(r.showList, true),
      question: { enabled: bool(q.enabled, true), label: str(q.label, 60), placeholder: str(q.placeholder, 60), public: bool(q.public, true) },
    },
    photos: { enabled: bool(ph.enabled, true), uploads: bool(ph.uploads, true), guestsCanView: bool(ph.guestsCanView, true) },
  };
  for (const k of ["eyebrow", "rsvpHeading", "yes", "maybe", "no", "photosHeading", "guestsHeading"]) ev.copy[k] = str(cp[k], 60);
  return ev;
}

// Read-modify-write with the blob's ETag so simultaneous RSVPs never overwrite each other.
async function mutate(key, fn, init) {
  const s = store();
  for (let i = 0; i < 8; i++) {
    const cur = await s.getWithMetadata(key, { type: "json" });
    const data = cur ? cur.data : init();
    const out = fn(data);
    const res = await s.setJSON(key, data, cur ? { onlyIfMatch: cur.etag } : { onlyIfNew: true });
    if (res && res.modified !== false) return out;
    await sleep(40 * (i + 1) + Math.random() * 60);
  }
  throw new HttpError(503, "Lots of people are answering at once. Try again in a moment.");
}

async function loadEvent(id) {
  if (!/^[a-z0-9]{6,12}$/.test(id || "")) throw new HttpError(404, "This invitation doesn't exist.");
  const ev = await store().get(`events/${id}`, { type: "json" });
  if (!ev) throw new HttpError(404, "This invitation doesn't exist.");
  return ev;
}
const isHost = (req, ev) => { const k = req.headers.get("x-host-key"); return !!k && sameHash(sha(k), ev.keyHash); };
function requireHost(req, ev) { if (!isHost(req, ev)) throw new HttpError(403, "This link can't manage the party. Use your host link."); }
const publicEvent = (ev) => { const { keyHash, ...rest } = ev; return rest; };

function rsvpClosed(ev) {
  if (!ev.rsvp.open) return "RSVPs are closed for this party.";
  if (ev.rsvp.deadline && ev.rsvp.deadline < new Date(Date.now() - 14 * 3600e3).toISOString().slice(0, 10)) return "The RSVP deadline has passed. Message the host directly.";
  return "";
}

function cleanRsvp(b, ev) {
  const attending = ["yes", "maybe", "no"].includes(b.attending) ? b.attending : "";
  if (!attending) throw new HttpError(400, "Choose whether you're coming.");
  if (attending === "maybe" && !ev.rsvp.allowMaybe) throw new HttpError(400, "Choose yes or no.");
  const name = str(b.name, 50);
  if (!name) throw new HttpError(400, "Add your name so the host knows who you are.");
  return {
    name, attending,
    plus: attending === "no" ? 0 : int(b.plus, 0, ev.rsvp.maxPlus, 0),
    answer: ev.rsvp.question.enabled ? str(b.answer, 120) : "",
    contact: ev.rsvp.askContact ? str(b.contact, 80) : "",
    message: str(b.message, 400),
  };
}

const publicRsvp = (r, ev) => ({ id: r.id, name: r.name, attending: r.attending, plus: r.plus, answer: ev.rsvp.question.public ? r.answer : "", at: r.createdAt });
function counts(list) {
  const c = { yes: 0, maybe: 0, no: 0, headcount: 0, responses: list.length };
  for (const r of list) { c[r.attending]++; if (r.attending === "yes") c.headcount += 1 + (r.plus || 0); }
  return c;
}

async function readBody(req) { try { return await req.json(); } catch { throw new HttpError(400, "That request wasn't readable."); } }

// --- routes ---
async function route(req, parts) {
  const m = req.method;
  const s = store();

  if (parts[0] === "config" && m === "GET") return json({ passcodeRequired: !!process.env.HOST_PASSCODE });

  if (parts[0] !== "events") throw new HttpError(404, "Not found.");
  const [, id, sub, subId, size] = parts;

  if (!id && m === "POST") {
    const b = await readBody(req);
    if (process.env.HOST_PASSCODE && !sameHash(sha(b.passcode || ""), sha(process.env.HOST_PASSCODE))) throw new HttpError(403, "That host passcode isn't right.");
    const key = token(), now = new Date().toISOString();
    let newId = shortId();
    for (let i = 0; i < 4 && (await s.getMetadata(`events/${newId}`)); i++) newId = shortId();
    const ev = { id: newId, ...cleanEvent(b.event || {}), keyHash: sha(key), createdAt: now, updatedAt: now };
    await s.setJSON(`events/${newId}`, ev, { onlyIfNew: true });
    return json({ id: newId, key, event: publicEvent(ev) }, 201);
  }

  const ev = await loadEvent(id);
  const host = isHost(req, ev);

  if (!sub) {
    if (m === "GET") {
      const rs = (await s.get(`rsvps/${id}`, { type: "json" })) || { list: [] };
      const ps = (await s.get(`photos/${id}`, { type: "json" })) || { list: [] };
      const out = { event: publicEvent(ev), counts: counts(rs.list), host };
      if (host) out.rsvps = rs.list.map(({ tokenHash, ...r }) => r);
      else if (ev.rsvp.showList) out.rsvps = rs.list.map((r) => publicRsvp(r, ev));
      out.photos = ev.photos.enabled && (host || ev.photos.guestsCanView) ? ps.list.map(({ tokenHash, ...p }) => p) : [];
      out.photoCount = ps.list.length;
      return json(out);
    }
    if (m === "PUT") {
      requireHost(req, ev);
      const b = await readBody(req);
      const next = { ...ev, ...cleanEvent(b.event || {}), id: ev.id, keyHash: ev.keyHash, createdAt: ev.createdAt, updatedAt: new Date().toISOString() };
      await s.setJSON(`events/${id}`, next);
      return json({ event: publicEvent(next) });
    }
    if (m === "DELETE") {
      requireHost(req, ev);
      const ps = (await s.get(`photos/${id}`, { type: "json" })) || { list: [] };
      for (const p of ps.list) { await s.delete(`photo/${id}/${p.id}/full`); await s.delete(`photo/${id}/${p.id}/thumb`); }
      await s.delete(`photos/${id}`); await s.delete(`rsvps/${id}`); await s.delete(`events/${id}`);
      return json({ deleted: true });
    }
  }

  if (sub === "rsvps") {
    if (!subId && m === "POST") {
      const b = await readBody(req);
      if (b.website) return json({ rsvp: { id: "ok" }, token: "ok" }, 201); // honeypot: bots fill hidden fields
      const closed = rsvpClosed(ev);
      if (closed && !host) throw new HttpError(409, closed);
      const r = cleanRsvp(b, ev), tok = token(18), now = new Date().toISOString();
      const rec = { id: shortId(10), ...r, tokenHash: sha(tok), createdAt: now, updatedAt: now };
      await mutate(`rsvps/${id}`, (d) => { if (d.list.length >= MAX_RSVPS) throw new HttpError(409, "This guest list is full."); d.list.push(rec); }, () => ({ list: [] }));
      const { tokenHash, ...pub } = rec;
      return json({ rsvp: pub, token: tok }, 201);
    }
    if (subId && m === "PUT") {
      const b = await readBody(req);
      const tok = req.headers.get("x-rsvp-token") || "";
      const closed = rsvpClosed(ev);
      if (closed && !host) throw new HttpError(409, closed);
      const r = cleanRsvp(b, ev);
      const out = await mutate(`rsvps/${id}`, (d) => {
        const rec = d.list.find((x) => x.id === subId);
        if (!rec) throw new HttpError(404, "That RSVP was removed. Send a new one.");
        if (!host && !sameHash(sha(tok), rec.tokenHash)) throw new HttpError(403, "You can only change your own RSVP.");
        Object.assign(rec, r, { updatedAt: new Date().toISOString() });
        const { tokenHash, ...pub } = rec; return pub;
      }, () => ({ list: [] }));
      return json({ rsvp: out });
    }
    if (subId && m === "DELETE") {
      const tok = req.headers.get("x-rsvp-token") || "";
      await mutate(`rsvps/${id}`, (d) => {
        const rec = d.list.find((x) => x.id === subId);
        if (!rec) return;
        if (!host && !sameHash(sha(tok), rec.tokenHash)) throw new HttpError(403, "You can only remove your own RSVP.");
        d.list = d.list.filter((x) => x.id !== subId);
      }, () => ({ list: [] }));
      return json({ deleted: true });
    }
  }

  if (sub === "photos") {
    if (!subId && m === "POST") {
      if (!ev.photos.enabled || (!ev.photos.uploads && !host)) throw new HttpError(409, "Photo uploads are turned off for this party.");
      let form; try { form = await req.formData(); } catch { throw new HttpError(400, "That upload wasn't readable."); }
      const full = form.get("full"), thumb = form.get("thumb");
      if (!full || typeof full === "string" || !thumb || typeof thumb === "string") throw new HttpError(400, "No photo in that upload.");
      if (!IMG_TYPES.includes(full.type) || !IMG_TYPES.includes(thumb.type)) throw new HttpError(415, "Photos must be JPG, PNG or WebP.");
      if (full.size > 4.5e6 || thumb.size > 6e5) throw new HttpError(413, "That photo is too large.");
      const pid = shortId(12), tok = token(18);
      const rec = { id: pid, tokenHash: sha(tok), name: str(form.get("name"), 50) || "Guest", w: int(form.get("w"), 1, 10000, 0), h: int(form.get("h"), 1, 10000, 0), at: new Date().toISOString() };
      const cur = (await s.get(`photos/${id}`, { type: "json" })) || { list: [] };
      if (cur.list.length >= MAX_PHOTOS) throw new HttpError(409, "The photo wall is full.");
      await s.set(`photo/${id}/${pid}/full`, await full.arrayBuffer(), { metadata: { type: full.type } });
      await s.set(`photo/${id}/${pid}/thumb`, await thumb.arrayBuffer(), { metadata: { type: thumb.type } });
      await mutate(`photos/${id}`, (d) => { d.list.unshift(rec); }, () => ({ list: [] }));
      const { tokenHash, ...pub } = rec;
      return json({ photo: pub, token: tok }, 201);
    }
    if (subId && m === "GET" && (size === "full" || size === "thumb")) {
      if (!/^[a-z0-9]{12}$/.test(subId)) throw new HttpError(404, "Not found.");
      const b = await s.getWithMetadata(`photo/${id}/${subId}/${size}`, { type: "arrayBuffer" });
      if (!b) throw new HttpError(404, "That photo was removed.");
      return new Response(b.data, { headers: {
        "content-type": (b.metadata && b.metadata.type) || "image/jpeg",
        "cache-control": "public, max-age=86400",
        "netlify-cdn-cache-control": "public, durable, max-age=86400",
      } });
    }
    if (subId && m === "DELETE") {
      const tok = req.headers.get("x-photo-token") || "";
      await mutate(`photos/${id}`, (d) => {
        const rec = d.list.find((x) => x.id === subId);
        if (!rec) return;
        if (!host && !(rec.tokenHash && sameHash(sha(tok), rec.tokenHash))) throw new HttpError(403, "You can only remove photos you added.");
        d.list = d.list.filter((x) => x.id !== subId);
      }, () => ({ list: [] }));
      await s.delete(`photo/${id}/${subId}/full`); await s.delete(`photo/${id}/${subId}/thumb`);
      return json({ deleted: true });
    }
  }

  throw new HttpError(405, "That action isn't supported.");
}

export default async (req) => {
  const parts = new URL(req.url).pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  try {
    return await route(req, parts);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Something went wrong on our side. Try again." }, 500);
  }
};

export const config = { path: "/api/*" };
