const $ = (s) => document.querySelector(s);
const el = (t, cls, txt) => { const n = document.createElement(t); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

// papers/ sits next to ai-academy.html in this repo, but GitHub Pages deploys
// that file renamed to index.html at the site root — "../" already lands on
// it there. Only local dev (file:// or a local server) can be opening the
// unrenamed file, so only probe for it in that case; a real GitHub Pages
// visitor never fires a request that's guaranteed to 404.
const isLocalDev = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
if (isLocalDev) {
  (async () => {
    const home = $(".home");
    if (!home) return;
    try {
      const res = await fetch("../ai-academy.html", { method: "HEAD" });
      if (res.ok) home.href = "../ai-academy.html";
    } catch {}
  })();
}

let papers = [];
let sort = "added";
const activeTags = new Set();

async function boot() {
  try {
    const res = await fetch("data/index.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    const idx = await res.json();
    papers = idx.papers || [];
  } catch (e) {
    $("#list").append(Object.assign(el("p", "err"), { textContent: "Couldn't load data/index.json — " + e.message }));
    return;
  }
  renderTags();
  render();
  $("#q").addEventListener("input", render);
  for (const [id, key] of [["#sort-added", "added"], ["#sort-year", "year"], ["#sort-title", "title"]]) {
    $(id).addEventListener("click", () => {
      sort = key;
      for (const b of document.querySelectorAll(".seg button")) b.setAttribute("aria-pressed", "false");
      $(id).setAttribute("aria-pressed", "true");
      render();
    });
  }
}

function renderTags() {
  const counts = new Map();
  for (const p of papers) for (const t of p.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
  const box = $("#tags");
  [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([t, n]) => {
    const b = el("button", "chip", `${t} · ${n}`);
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      if (activeTags.has(t)) { activeTags.delete(t); b.setAttribute("aria-pressed", "false"); }
      else { activeTags.add(t); b.setAttribute("aria-pressed", "true"); }
      render();
    });
    box.append(b);
  });
}

function render() {
  const q = $("#q").value.trim().toLowerCase();
  const rows = papers.filter(p => {
    if (activeTags.size && ![...activeTags].every(t => (p.tags || []).includes(t))) return false;
    if (!q) return true;
    const hay = [p.title, p.summary, (p.authors || []).join(" "), (p.tags || []).join(" "), p.venue, p.year]
      .join(" ").toLowerCase();
    return hay.includes(q);
  });

  rows.sort((a, b) =>
    sort === "title" ? a.title.localeCompare(b.title)
    : sort === "year" ? (b.year || 0) - (a.year || 0)
    : String(b.added || "").localeCompare(String(a.added || ""))
  );

  const list = $("#list");
  list.textContent = "";
  $("#empty").classList.toggle("hide", rows.length > 0);
  $("#count").textContent = `${papers.length} paper${papers.length === 1 ? "" : "s"}`;

  for (const p of rows) {
    const a = el("a", "paperlink");
    a.href = `paper.html?id=${encodeURIComponent(p.id)}`;
    const authors = (p.authors || []).slice(0, 2).join(", ") + ((p.authors || []).length > 2 ? " et al." : "");
    a.append(el("div", "meta", [authors, p.venue, p.year].filter(Boolean).join(" · ")));
    a.append(el("h3", null, p.title));
    a.append(el("p", "sum", p.summary || ""));
    if (p.tags?.length) {
      const c = el("div", "chips");
      for (const t of p.tags.slice(0, 4)) c.append(el("span", "chip static", t));
      a.append(c);
    }
    list.append(a);
  }
}

boot();
