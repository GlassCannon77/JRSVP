// Full-screen photo viewer shared by the invite and the host page.
// Ways out: the X button, tapping the dark area, Escape, or the phone's
// back gesture (the viewer adds a history entry while it is open).
// Ways around: arrow buttons, swiping, or the keyboard arrows.

const CSS = `
.pv { position: fixed; inset: 0; z-index: 1000; background: rgb(8 6 12 / .96); color: #fff; display: flex; flex-direction: column;
  font: 15px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; touch-action: pan-y; }
.pv[hidden] { display: none; }
.pv-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; padding-top: calc(10px + env(safe-area-inset-top, 0px)); }
.pv-count { font-weight: 700; font-variant-numeric: tabular-nums; }
.pv-who { color: #c9c3d1; font-size: .9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.pv-close { flex: none; width: 48px; height: 48px; border-radius: 50%; border: 0; background: #fff; color: #111; display: grid; place-items: center; cursor: pointer; box-shadow: 0 4px 16px rgb(0 0 0 / .4); }
.pv-close svg { width: 22px; height: 22px; }
.pv-stage { position: relative; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 8px; }
.pv-stage img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px; user-select: none; -webkit-user-drag: none; }
.pv-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 46px; height: 46px; border-radius: 50%; border: 0; background: rgb(255 255 255 / .16); color: #fff; cursor: pointer; display: grid; place-items: center; }
.pv-nav:hover { background: rgb(255 255 255 / .28); }
.pv-nav svg { width: 22px; height: 22px; }
.pv-prev { left: 10px; } .pv-next { right: 10px; }
.pv-bar { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; padding: 12px 12px; padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px)); }
.pv-bar button { font: inherit; font-weight: 700; min-height: 46px; padding: 10px 20px; border-radius: 999px; cursor: pointer; border: 1.5px solid rgb(255 255 255 / .35); background: transparent; color: #fff; }
.pv-bar button.pv-primary { background: #fff; color: #111; border-color: #fff; }
.pv-bar button.pv-danger { color: #ff8f99; border-color: rgb(255 143 153 / .5); }
.pv-bar button.armed { background: #c62f3c; border-color: #c62f3c; color: #fff; }
.pv-bar button:disabled { opacity: .5; }
.pv-msg { text-align: center; color: #c9c3d1; font-size: .85rem; min-height: 1.2em; padding: 0 12px; }
.pv :focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
@media (max-width: 520px) { .pv-nav { width: 40px; height: 40px; background: rgb(0 0 0 / .4); } }
`;
const X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';

let root = null, state = null;

function build() {
  if (root) return;
  const style = document.createElement("style"); style.textContent = CSS; document.head.append(style);
  root = document.createElement("div");
  root.className = "pv"; root.hidden = true;
  root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Photo");
  root.innerHTML = `
    <div class="pv-top"><div style="min-width:0"><div class="pv-count"></div><div class="pv-who"></div></div>
      <button class="pv-close" type="button" aria-label="Close photo">${X}</button></div>
    <div class="pv-stage"><img alt=""><button class="pv-nav pv-prev" type="button" aria-label="Previous photo">${L}</button><button class="pv-nav pv-next" type="button" aria-label="Next photo">${R}</button></div>
    <p class="pv-msg" role="status"></p>
    <div class="pv-bar"></div>`;
  document.body.append(root);
  const $ = (s) => root.querySelector(s);
  $(".pv-close").addEventListener("click", () => close());
  $(".pv-prev").addEventListener("click", (e) => { e.stopPropagation(); step(-1); });
  $(".pv-next").addEventListener("click", (e) => { e.stopPropagation(); step(1); });
  $(".pv-stage").addEventListener("click", (e) => { if (e.target.classList.contains("pv-stage")) close(); });
  root.addEventListener("click", (e) => { if (e.target === root) close(); });
  document.addEventListener("keydown", (e) => {
    if (root.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });
  let x0 = null, y0 = null;
  $(".pv-stage").addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  $(".pv-stage").addEventListener("touchend", (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close(); // swipe down to close
  });
  window.addEventListener("popstate", () => { if (!root.hidden && state && state.pushed) { state.pushed = false; close(true); } });
}

function render() {
  const { list, i, opts } = state, p = list[i];
  const $ = (s) => root.querySelector(s);
  $(".pv-count").textContent = list.length > 1 ? `${i + 1} of ${list.length}` : "Photo";
  $(".pv-who").textContent = p.name ? `From ${p.name}` : "";
  const img = $(".pv-stage img");
  img.src = opts.src(p, "full"); img.alt = p.name ? `Photo from ${p.name}` : "Party photo";
  $(".pv-prev").hidden = i === 0; $(".pv-next").hidden = i === list.length - 1;
  $(".pv-msg").textContent = "";
  const bar = $(".pv-bar"); bar.textContent = "";
  const btn = (label, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; if (cls) b.className = cls; b.addEventListener("click", fn); bar.append(b); return b; };
  btn("Save photo", "pv-primary", () => saveOne(p));
  if (opts.onDelete && (!opts.canDelete || opts.canDelete(p))) {
    const label = opts.deleteLabel || "Delete";
    const del = btn(label, "pv-danger", async () => {
      if (!del.classList.contains("armed")) { del.classList.add("armed"); del.textContent = "Tap again to remove"; setTimeout(() => { del.classList.remove("armed"); del.textContent = label; }, 3500); return; }
      del.disabled = true;
      try {
        await opts.onDelete(p);
        list.splice(i, 1);
        if (!list.length) return close();
        state.i = Math.min(i, list.length - 1); render();
      } catch (e) { $(".pv-msg").textContent = e.message; del.disabled = false; }
    });
  }
  btn("Close", "", () => close());
  // preload neighbours so swiping feels instant
  for (const j of [i - 1, i + 1]) if (list[j]) { const im = new Image(); im.src = opts.src(list[j], "full"); }
}

async function saveOne(p) {
  const msg = root.querySelector(".pv-msg"), url = state.opts.src(p, "full");
  try {
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], `${(state.opts.filePrefix || "party-photo").replace(/[^\w-]+/g, "-")}-${p.id}.jpg`, { type: blob.type || "image/jpeg" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name;
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
    msg.textContent = "Saved to your downloads.";
  } catch (e) {
    if (e && e.name === "AbortError") return;
    msg.textContent = "Couldn't save that photo. Press and hold the photo to save it instead.";
  }
}

function step(d) {
  if (!state) return;
  const n = state.i + d;
  if (n < 0 || n >= state.list.length) return;
  state.i = n; render();
}

export function openViewer(list, i, opts) {
  build();
  const wasOpen = !root.hidden;
  state = { list: list.slice(), i, opts, pushed: wasOpen && state ? state.pushed : false, focus: document.activeElement };
  root.hidden = false;
  document.documentElement.style.overflow = "hidden";
  if (!state.pushed) { try { history.pushState({ pv: 1 }, ""); state.pushed = true; } catch {} }
  render();
  root.querySelector(".pv-close").focus({ preventScroll: true });
}

export function close(fromHistory) {
  if (!root || root.hidden) return;
  root.hidden = true;
  root.querySelector(".pv-stage img").removeAttribute("src");
  document.documentElement.style.overflow = "";
  const s = state; state = null;
  if (s && s.pushed && !fromHistory) { try { history.back(); } catch {} }
  if (s && s.opts.onClose) s.opts.onClose();
  if (s && s.focus && s.focus.focus) s.focus.focus({ preventScroll: true });
}
