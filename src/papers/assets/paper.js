import { callClaude, keyStore, NoKeyError } from "./claude-client.js";

const $ = (s) => document.querySelector(s);
const el = (t, cls, txt) => { const n = document.createElement(t); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

let doc = null;
let level = "eng";
let tab = "overview";

// Thesis, walkthrough, numbers and jargon are dense but each thin on its own,
// so they're combined into one scannable "Overview" infogram instead of four
// separate tabs. Concepts stays separate — it's the one place worth lingering.
const TABS = [["overview", "Overview"], ["concepts", "Concepts"], ["ask", "Ask"]];

/* ---------- boot ---------- */

async function boot() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) return fail("No paper id in the URL. Go back to the library and pick one.");
  if (!/^[A-Za-z0-9._-]+$/.test(id)) return fail("That id doesn't look valid.");

  try {
    const res = await fetch(`data/${id}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status === 404 ? "no record with that id" : res.status);
    doc = await res.json();
  } catch (e) { return fail("Couldn't load the record — " + e.message); }

  document.title = doc.title + " — AI Academy";
  $("#eyebrow").textContent = [doc.venue, doc.year].filter(Boolean).join(" · ") || "paper";
  $("#title").textContent = doc.title;
  $("#thesis").textContent = doc.thesis || "";
  $("#byline").textContent = [(doc.authors || []).join(", "), doc.venue, doc.year].filter(Boolean).join(" · ");
  if (doc.url) $("#source-link").href = doc.url; else $("#source-link").classList.add("hide");

  for (const link of doc.course_links || []) {
    const a = el("a", null, link.replace(/[/_-]/g, " "));
    a.href = `../${link}`;
    $("#linkback").append(a);
  }

  buildTabs();
  wireControls();
  renderTab();
}

function fail(msg) { $("#title").textContent = "Not found"; $("#thesis").textContent = msg; $("#eyebrow").textContent = "error"; }

function buildTabs() {
  const nav = $("#tabs");
  for (const [k, label] of TABS) {
    const b = el("button", null, label);
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", String(k === tab));
    b.addEventListener("click", () => { tab = k; for (const x of nav.children) x.setAttribute("aria-selected", "false"); b.setAttribute("aria-selected", "true"); renderTab(); });
    nav.append(b);
  }
}

function wireControls() {
  $("#lvl-plain").addEventListener("click", () => setLevel("plain"));
  $("#lvl-eng").addEventListener("click", () => setLevel("eng"));

  $("#settings-btn").addEventListener("click", () => { $("#keypanel").classList.toggle("hide"); keyState(); });
  $("#key-save").addEventListener("click", saveKey);
  $("#key-input").addEventListener("keydown", e => { if (e.key === "Enter") saveKey(); });
  $("#key-clear").addEventListener("click", () => { keyStore.clear(); keyState(); renderTab(); });
  $("#model-input").value = keyStore.model();
  $("#workspace-input").value = keyStore.workspace();
  $("#workspace-input").addEventListener("keydown", e => { if (e.key === "Enter") saveKey(); });
  keyState();
}

function saveKey() {
  const v = $("#key-input").value.trim();
  // The key field clears after a successful save, so re-clicking Save with it empty
  // just updates model/workspace without touching the already-stored key.
  const ok = v ? keyStore.set(v) : true;
  keyStore.setModel($("#model-input").value);
  keyStore.setWorkspace($("#workspace-input").value);
  if (ok && v) $("#key-input").value = "";
  keyState(!ok);
  renderTab();
}

function keyState(saveFailed) {
  $("#settings-btn").classList.toggle("key-set", !saveFailed && keyStore.has());
  $("#key-state").textContent = saveFailed
    ? "Couldn't save — this browser is blocking local storage for this site (private browsing, tracking protection, or an extension). Try a different browser or disable that blocking for this page."
    : keyStore.has()
    ? "Key set on this browser. Live features are on."
    : "No key set. Static views work; live features are off.";
}

function setLevel(v) {
  level = v;
  $("#lvl-plain").setAttribute("aria-pressed", String(v === "plain"));
  $("#lvl-eng").setAttribute("aria-pressed", String(v === "eng"));
  $("#lvl-note").textContent = v === "plain" ? "No background assumed." : "Assumes technical fluency, not ML fluency.";
  if (tab === "concepts" || tab === "overview") renderTab();
}

/* ---------- rendering ---------- */

function renderTab() {
  const p = $("#panel");
  p.textContent = "";
  ({ overview: viewOverview, concepts: viewConcepts, ask: viewAsk }[tab])(p);
}

function bold(text, node) {
  for (const part of text.split(/(\*\*[^*]+\*\*)/g)) {
    if (part.startsWith("**")) node.append(Object.assign(el("strong"), { textContent: part.slice(2, -2) }));
    else node.append(document.createTextNode(part));
  }
}

// Overview is one continuous poster, not four stacked sections: a single spine
// runs top to bottom, claims and numbers alternate left/right off it like a
// classic timeline infographic, walkthrough continues the same spine in
// reading order, and glossary breaks out at the bottom as a dense reference
// grid — deliberately NOT on the spine, since it's browsed, not read in order.
function viewOverview(p) {
  const poster = el("div", "poster");
  const spined = el("div", "poster-spine-wrap");
  spined.append(el("div", "poster-spine"));
  spined.append(posterZone("the claims", "tint", claimRows()));
  spined.append(posterZone("the numbers", "", numberRows(), "This document doesn't report quantitative results."));
  spined.append(posterZone("section by section", "tint", walkRows()));
  poster.append(spined, glossaryZone());
  p.append(poster);
}

function posterZone(label, extraClass, rows, emptyNote) {
  const zone = el("div", "poster-zone" + (extraClass ? " " + extraClass : ""));
  zone.append(el("div", "zone-label", label));
  if (rows.length) rows.forEach(r => zone.append(r));
  else zone.append(el("p", "note", emptyNote || "Nothing here."));
  return zone;
}

function posterRow(index, cardEl) {
  const row = el("div", "poster-row " + (index % 2 === 0 ? "left" : "right"));
  row.append(el("div", "poster-node", String(index + 1)), cardEl);
  return row;
}

function claimRows() {
  return (doc.claims || []).map((c, i) => {
    const card = el("div", "card poster-card");
    const warn = /honest|limit|caveat|caution|weak/i.test(c.tag || "");
    card.append(el("span", "tag" + (warn ? " warn" : ""), c.tag || "claim"));
    card.append(el("h3", null, c.h));
    // Older records may not have a plain rewrite yet — fall back to body rather than show nothing.
    const usePlain = level === "plain" && c.plain && c.plain.length;
    for (const b of (usePlain ? c.plain : c.body) || []) { const para = el("p"); bold(b, para); card.append(para); }
    return posterRow(i, card);
  });
}

function viewConcepts(p) {
  const g = el("div", "grid two");
  for (const c of doc.concepts || []) {
    const card = el("div", "card");
    card.append(el("span", "tag", "concept"));
    card.append(el("h3", null, c.t));
    card.append(el("p", null, level === "plain" ? c.plain : (c.eng || c.plain)));

    const btn = el("button", "ghost", "go deeper →");
    btn.addEventListener("click", async () => {
      btn.disabled = true; btn.textContent = "thinking…";
      try {
        const out = await callClaude(
          "You explain AI/ML concepts to a senior engineer from another discipline — fluent in physics, standards and systems thinking, not in machine learning. Concrete and mechanistic. No preamble, no headings, no bullets. 120-170 words of plain prose. Do not repeat what they already know.",
          [{ role: "user", content: `Document: ${doc.title}\n\nContext:\n${(doc.context || "").slice(0, 6000)}\n\nConcept: "${c.t}"\n\nAlready read: ${c.eng || c.plain}\n\nGo one level deeper: the underlying mechanism, why it behaves that way, and the failure mode a practitioner would actually worry about.` }]
        );
        const para = el("p", null, out);
        para.style.borderTop = "1px dashed var(--line)";
        para.style.paddingTop = "10px";
        card.insertBefore(para, btn);
        btn.remove();
      } catch (e) {
        btn.disabled = false; btn.textContent = "go deeper →";
        card.append(el("div", "err", e instanceof NoKeyError ? "Add your API key under key settings to use this." : e.message));
      }
    });
    card.append(btn);
    g.append(card);
  }
  p.append(g);
}

function walkRows() {
  return (doc.sections || []).map((s, i) => {
    const card = el("div", "card poster-card");
    if (s.n) card.append(el("div", "tl-n", s.n));
    card.append(el("h3", null, s.h));
    card.append(el("p", null, s.s));
    if (s.read) {
      const cls = /read/i.test(s.read) ? "read" : /skim/i.test(s.read) ? "skim" : "ref";
      card.append(el("span", "tl-pill " + cls, s.read));
    }
    return posterRow(i, card);
  });
}

// Numbers that are an explicit before -> after pair (the paper's most common
// shape for a headline result) get a dumbbell. "A vs B" gets a two-bar
// comparison. A lone percentage (optionally a tight range) gets a meter.
// Only what's left without a real numeric shape — formulas, bare counts,
// wide multi-way splits — falls back to a stat tile. Per the dataviz skill's
// choosing-a-form guide: pick the form the data's job actually calls for
// before reaching for a big number.
const ARROW_PAIR = /^\s*([\d.,]+)\s*%\s*(?:→|->)\s*([\d.,]+)\s*%\s*$/;
const VS_PAIR = /^\s*(.+?)\s+vs\.?\s+(.+?)\s*$/i;
const SINGLE_PCT = /^\s*[~>≥]?\s*([\d.]+)\s*(?:[–-]\s*([\d.]+)\s*)?%\s*$/;
const RATIO = /^\s*([\d,]+)\s*\/\s*([\d,]+)\s*$/;

function numberRows() {
  return (doc.numbers || []).map((n, i) => {
    let card;
    let m;
    if ((m = ARROW_PAIR.exec(n.v))) {
      card = dumbbellCard(n, +m[1], +m[2]);
    } else if ((m = VS_PAIR.exec(n.v))) {
      const aNum = parseFloat(m[1].replace(/[^0-9.]/g, ""));
      const bNum = parseFloat(m[2].replace(/[^0-9.]/g, ""));
      card = (isFinite(aNum) && isFinite(bNum) && (aNum || bNum))
        ? compareCard(n, m[1].trim(), aNum, m[2].trim(), bNum)
        : statCard(n);
    } else if ((m = SINGLE_PCT.exec(n.v))) {
      const lo = +m[1], hi = m[2] ? +m[2] : lo;
      card = meterCard(n, (lo + hi) / 2);
    } else if ((m = RATIO.exec(n.v)) && +m[2].replace(/,/g, "") > 0) {
      const part = +m[1].replace(/,/g, ""), whole = +m[2].replace(/,/g, "");
      card = meterCard(n, (part / whole) * 100);
    } else {
      card = statCard(n);
    }
    card.classList.add("poster-card");
    return posterRow(i, card);
  });
}

function statCard(n) {
  const card = el("div", "num");
  card.append(el("div", "v", n.v));
  card.append(el("div", "k", n.k));
  card.append(el("div", "m", n.m));
  if (n.c) card.append(el("div", "caveat", n.c));
  return card;
}

function dumbbellCard(n, before, after) {
  const card = el("div", "num dumbbell-card");
  card.append(el("div", "k", n.k));

  const track = el("div", "dumbbell-track");
  const lo = Math.min(before, after), hi = Math.max(before, after);
  const line = el("div", "dumbbell-line");
  line.style.left = lo + "%"; line.style.width = (hi - lo) + "%";
  track.append(line);

  const beforeVal = el("div", "dumbbell-val before", before + "%");
  beforeVal.style.left = before + "%";
  const beforeDot = el("div", "dumbbell-dot before");
  beforeDot.style.left = before + "%";
  const afterVal = el("div", "dumbbell-val after", after + "%");
  afterVal.style.left = after + "%";
  const afterDot = el("div", "dumbbell-dot after");
  afterDot.style.left = after + "%";
  track.append(beforeVal, beforeDot, afterVal, afterDot);

  card.append(track);
  card.append(el("div", "m", n.m));
  if (n.c) card.append(el("div", "caveat", n.c));
  return card;
}

function meterCard(n, pct) {
  const card = el("div", "num meter-card");
  card.append(el("div", "v", n.v));
  card.append(el("div", "k", n.k));
  const track = el("div", "meter-track");
  const fill = el("div", "meter-fill");
  fill.style.width = Math.max(0, Math.min(100, pct)) + "%";
  track.append(fill);
  card.append(track);
  card.append(el("div", "m", n.m));
  if (n.c) card.append(el("div", "caveat", n.c));
  return card;
}

function compareCard(n, aLabel, aNum, bLabel, bNum) {
  const card = el("div", "num compare-card");
  card.append(el("div", "k", n.k));
  const bars = el("div", "compare-bars");
  const max = Math.max(aNum, bNum) || 1;
  for (const [label, num, shade] of [[aLabel, aNum, "after"], [bLabel, bNum, "before"]]) {
    const row = el("div", "compare-row");
    const track = el("div", "compare-track");
    const fill = el("div", "compare-fill " + shade);
    fill.style.width = Math.max(2, (num / max) * 100) + "%";
    track.append(fill);
    row.append(track, el("span", "compare-label", label));
    bars.append(row);
  }
  card.append(bars);
  card.append(el("div", "m", n.m));
  if (n.c) card.append(el("div", "caveat", n.c));
  return card;
}

function glossaryZone() {
  const zone = el("div", "poster-zone glossary-zone");
  zone.append(el("div", "zone-label", "glossary"));

  const lookup = el("div", "card");
  lookup.append(el("span", "tag", "open lookup"));
  lookup.append(el("h3", null, "Look up any term"));
  lookup.append(el("p", "note", "Anything in the paper, or anything adjacent — attention, KV cache, LoRA, distillation, MoE routing."));
  const row = el("div"); row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  const input = el("input"); input.type = "text"; input.placeholder = "e.g. speculative decoding"; input.style.flex = "1 1 240px";
  const go = el("button", "solid", "define");
  const run = async () => {
    if (!input.value.trim()) return;
    go.disabled = true; go.textContent = "…";
    lookup.querySelectorAll(".lookup-out").forEach(n => n.remove());
    try {
      const out = await callClaude(
        "You are a glossary for AI and machine-learning terminology, written for a senior engineer from a different technical field. Define the term in 90-140 words of plain prose: what it is, why it exists, where it shows up in practice. If it appears in the supplied document, say how it is used there. No headings, no bullets, no preamble.",
        [{ role: "user", content: `Document: ${doc.title}\n\nContext:\n${(doc.context || "").slice(0, 5000)}\n\nTerm: ${input.value.trim()}` }]
      );
      const para = el("p", "lookup-out", out); para.style.marginTop = "14px"; lookup.append(para);
    } catch (e) {
      lookup.append(el("div", "err lookup-out", e instanceof NoKeyError ? "Add your API key under key settings to use this." : e.message));
    }
    go.disabled = false; go.textContent = "define";
  };
  go.addEventListener("click", run);
  input.addEventListener("keydown", e => { if (e.key === "Enter") run(); });
  row.append(input, go); lookup.append(row);
  zone.append(lookup);

  const g = el("div", "glossary-grid");
  for (const j of doc.jargon || []) {
    const box = el("div", "term");
    const head = el("button");
    head.append(el("span", "t", j.t), el("span", "hint", j.h || ""), el("span", "chev", "+"));
    const body = el("div", "body", j.d);
    body.classList.add("hide");
    head.setAttribute("aria-expanded", "false");
    head.addEventListener("click", () => {
      const open = body.classList.toggle("hide");
      head.querySelector(".chev").textContent = open ? "+" : "−";
      head.setAttribute("aria-expanded", String(!open));
    });
    box.append(head, body);
    g.append(box);
  }
  zone.append(g);
  return zone;
}

function viewAsk(p) {
  const log = [];
  const wrap = el("div"); wrap.style.marginTop = "22px";

  const intro = el("div", "card");
  intro.append(el("span", "tag", "grounded in this paper"));
  intro.append(el("h3", null, "Ask about this document"));
  intro.append(el("p", "note", keyStore.has()
    ? "Answers come from the record's context field. Jargon gets defined as it comes up."
    : "Add your API key under key settings to turn this on."));
  wrap.append(intro);

  const stream = el("div");
  wrap.append(stream);

  const bar = el("div"); bar.style.cssText = "display:flex;gap:8px;margin-top:12px;flex-wrap:wrap";
  const ta = el("textarea"); ta.rows = 2; ta.placeholder = "Ask a question about the document"; ta.style.flex = "1 1 260px";
  const send = el("button", "solid", "send");

  const post = async () => {
    const q = ta.value.trim();
    if (!q) return;
    log.push({ role: "user", content: q });
    const mine = el("div", "msg you"); mine.append(el("div", "who", "you")); mine.append(document.createTextNode(q));
    stream.append(mine);
    ta.value = ""; send.disabled = true;
    const wait = el("div", "spin", "reading…"); stream.append(wait);
    try {
      const out = await callClaude(
        `You are helping a senior engineer — strong in physics, standards and systems, new to machine learning — understand a specific document. Answer only from the supplied context; if it doesn't cover something, say so plainly and then give the general background needed. Define ML jargon inline the first time you use it. Prose, not bullets, unless a list is genuinely clearest. Under 220 words.\n\nDOCUMENT: ${doc.title}\n\nCONTEXT:\n${(doc.context || "").slice(0, 14000)}`,
        log.slice(-8)
      );
      log.push({ role: "assistant", content: out });
      wait.remove();
      const ans = el("div", "msg"); ans.append(el("div", "who", "answer")); ans.append(document.createTextNode(out));
      stream.append(ans);
    } catch (e) {
      wait.remove();
      log.pop();
      stream.append(el("div", "err", e instanceof NoKeyError ? "Add your API key under key settings to use this." : e.message));
    }
    send.disabled = false;
  };

  send.addEventListener("click", post);
  ta.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); post(); } });
  bar.append(ta, send);
  wrap.append(bar);
  p.append(wrap);
}

boot();
