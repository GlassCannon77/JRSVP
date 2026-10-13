import { api, hostKey } from "./api.js";
import { mountInvite, h } from "./invite-view.js";

const app = document.getElementById("app");
const id = (location.pathname.match(/^\/e\/([a-z0-9]+)/) || [])[1];

function fail(title, text) {
  app.textContent = "";
  app.append(h("div", { class: "boot" }, h("div", null, h("h1", { text: title }), h("p", { text: text }), h("p", null, h("a", { href: "/", style: "color:#fff", text: "Make your own invitation" })))));
}

async function load() {
  const key = id ? hostKey.get(id) : null;
  return api(`/api/events/${id}`, { headers: key ? { "x-host-key": key } : {} });
}

(async () => {
  if (!id) return fail("Invitation not found", "Check the link you were sent.");
  let res;
  try { res = await load(); }
  catch (e) { return fail(e.status === 404 ? "Invitation not found" : "Couldn't open the invitation", e.message); }

  document.title = res.event.title || "You're invited";
  app.textContent = "";
  if (res.host) {
    app.append(h("div", { class: "hostbar" }, h("span", { text: "You're seeing what guests see." }),
      h("a", { href: `/e/${id}/host#k=${hostKey.get(id)}`, text: "Manage party" })));
  }
  const holder = h("div");
  app.append(holder);
  const view = mountInvite(holder, res.event, { data: res, host: false, onChange: refresh });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = view.theme.colors.bg;
  document.documentElement.style.background = view.theme.colors.bg2;
  document.body.style.background = view.theme.colors.bg2;

  if (location.hash === "#photos" || location.hash === "#rsvp") {
    const target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
  }

  async function refresh() {
    try { const next = await load(); view.setData(next); } catch {}
  }
  // Keep the guest list and photo wall current while the page is open.
  setInterval(() => { if (!document.hidden) refresh(); }, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
})();
