// Fetch wrapper for the site's own API. Errors carry the server's message
// (written for people) and the HTTP status.
export async function api(path, { method = "GET", body, form, headers = {} } = {}) {
  const init = { method, headers: { ...headers } };
  if (form) init.body = form;
  else if (body !== undefined) { init.body = JSON.stringify(body); init.headers["content-type"] = "application/json"; }
  let res;
  try { res = await fetch(path, init); }
  catch { const e = new Error("You seem to be offline. Check your connection and try again."); e.status = 0; throw e; }
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const e = new Error((data && data.error) || (res.status === 413 ? "That photo is too large." : "Something went wrong. Try again."));
    e.status = res.status; throw e;
  }
  return data;
}

export const hostKey = {
  get(id) {
    const m = location.hash.match(/(?:^#|&)k=([A-Za-z0-9_-]+)/);
    if (m) { try { localStorage.setItem(`kk:host:${id}`, m[1]); } catch {} return m[1]; }
    try { return localStorage.getItem(`kk:host:${id}`); } catch { return null; }
  },
};

export function myParties() { try { return JSON.parse(localStorage.getItem("kk:parties")) || []; } catch { return []; } }
export function rememberParty(p) {
  const list = myParties().filter((x) => x.id !== p.id);
  list.unshift(p);
  try { localStorage.setItem("kk:parties", JSON.stringify(list.slice(0, 30))); localStorage.setItem(`kk:host:${p.id}`, p.key); } catch {}
}
export function forgetParty(id) {
  try { localStorage.setItem("kk:parties", JSON.stringify(myParties().filter((x) => x.id !== id))); localStorage.removeItem(`kk:host:${id}`); } catch {}
}
