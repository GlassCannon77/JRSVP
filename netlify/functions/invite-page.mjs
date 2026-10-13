// Serves /e/:id with the party's own title and details in the link-preview
// tags, so a texted invite shows "Halloween Party · Mon, Oct 19" instead of a
// generic page name.
import { getStore } from "@netlify/blobs";

const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function when(ev) {
  if (!ev.date) return "";
  const d = new Date(ev.date + "T12:00:00Z");
  let s = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  if (ev.start) { const [h, m] = ev.start.split(":").map(Number); s += ` at ${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""} ${h < 12 ? "AM" : "PM"}`; }
  return s;
}

export default async (req, context) => {
  const res = await fetch(new URL("/invite.html", req.url));
  let html = await res.text();
  try {
    const id = context.params && context.params.id;
    const ev = /^[a-z0-9]{6,12}$/.test(id || "") ? await getStore({ name: "knockknock" }).get(`events/${id}`, { type: "json" }) : null;
    if (ev) {
      const title = ev.title || "You're invited";
      const desc = [ev.hosts ? `Hosted by ${ev.hosts}` : "", when(ev), "Tap to RSVP"].filter(Boolean).join(" · ");
      const tags = `<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta name="twitter:card" content="summary">`;
      html = html.replace(/<title>[\s\S]*?<\/title>/, tags);
    }
  } catch (e) { console.error(e); }
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" } });
};

export const config = { path: "/e/:id" };
