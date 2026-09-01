import { callClaude, keyStore, NoKeyError } from "./claude-client.js";

const $ = (s) => document.querySelector(s);
const el = (t, cls, txt) => { const n = document.createElement(t); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

let doc = null;
let level = "eng";
let tab = "thesis";

const TABS = [["thesis", "Thesis"], ["concepts", "Concepts"], ["walk", "Walkthrough"],
              ["numbers", "Numbers"], ["jargon", "Jargon"], ["ask", "Ask"]];

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
  if (tab === "concepts" || tab === "thesis") renderTab();
}

/* ---------- rendering ---------- */

function renderTab() {
  const p = $("#panel");
  p.textContent = "";
  ({ thesis: viewThesis, concepts: viewConcepts, walk: viewWalk,
     numbers: viewNumbers, jargon: viewJargon, ask: viewAsk }[tab])(p);
}

function bold(text, node) {
  for (const part of text.split(/(\*\*[^*]+\*\*)/g)) {
    if (part.startsWith("**")) node.append(Object.assign(el("strong"), { textContent: part.slice(2, -2) }));
    else node.append(document.createTextNode(part));
  }
}

function viewThesis(p) {
  const g = el("div", "grid");
  for (const c of doc.claims || []) {
    const card = el("div", "card");
    const warn = /honest|limit|caveat|caution|weak/i.test(c.tag || "");
    card.append(el("span", "tag" + (warn ? " warn" : ""), c.tag || "claim"));
    card.append(el("h3", null, c.h));
    // Older records may not have a plain rewrite yet — fall back to body rather than show nothing.
    const usePlain = level === "plain" && c.plain && c.plain.length;
    for (const b of (usePlain ? c.plain : c.body) || []) { const para = el("p"); bold(b, para); card.append(para); }
    g.append(card);
  }
  p.append(g);
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

function viewWalk(p) {
  const g = el("div", "grid");
  g.style.gap = "8px";
  for (const s of doc.sections || []) {
    const row = el("div", "row");
    row.append(el("div", "clause", s.n || ""));
    const body = el("div");
    body.append(el("h4", null, s.h));
    body.append(el("p", null, s.s));
    if (s.read) body.append(el("span", "readif", s.read));
    row.append(body);
    g.append(row);
  }
  p.append(g);
}

function viewNumbers(p) {
  const nums = doc.numbers || [];
  if (!nums.length) { p.append(el("p", "note", "This document doesn't report quantitative results.")); return; }
  const g = el("div", "grid two");
  for (const n of nums) {
    const card = el("div", "num");
    card.append(el("div", "v", n.v));
    card.append(el("div", "k", n.k));
    card.append(el("div", "m", n.m));
    if (n.c) card.append(el("div", "caveat", n.c));
    g.append(card);
  }
  p.append(g);
}

function viewJargon(p) {
  const lookup = el("div", "card");
  lookup.style.marginTop = "22px";
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
  p.append(lookup);

  const g = el("div", "grid"); g.style.gap = "8px";
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
  p.append(g);
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
