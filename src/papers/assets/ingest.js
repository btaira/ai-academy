// In-browser "add paper" flow. Runs the same five extraction passes as
// tools/decode-paper.mjs, using the visitor's own key (see claude-client.js).
// A static page can't write into the repo, so the result is two downloads —
// the record and an updated index — that get dropped into src/papers/data/
// and committed like any other file.
import { callClaude, keyStore, NoKeyError } from "./claude-client.js";

const $ = (s) => document.querySelector(s);
const el = (t, cls, txt) => { const n = document.createElement(t); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

const SYS = "You decode technical documents for a senior engineer who is expert in another field (hardware, standards, systems) and new to machine learning. Return ONLY valid JSON. No markdown fences, no commentary before or after.";

const PASSES = [
  ["metadata and thesis", `Return JSON with exactly these keys:
{"title": string,
 "authors": [string],
 "venue": string,
 "year": number,
 "url": string ("" if unknown),
 "tags": [string]  // 3-6 lowercase-hyphenated topic tags
 "summary": string  // one sentence, under 30 words, for the library card
 "thesis": string,  // 2 sentences: what the document claims and why it matters
 "claims": [ {"tag": string, "h": string, "body": [string]} ]  // 3-5 claims. tag is 2-3 words. body is 2-4 items, each 1-3 sentences. Use **bold** for terms being defined. Include at least one claim covering limitations or what the document is honest about.
}`],
  ["concepts", `Return JSON: {"concepts":[{"t":string,"plain":string,"eng":string}]}
6-10 concepts a reader must understand to follow the document.
"plain" = 2-3 sentences assuming zero background.
"eng" = 3-5 sentences for a senior engineer from another field: the mechanism, why it behaves that way, and the practical caveat.
Prioritise ideas the reader is least likely to already know.`],
  ["sections and numbers", `Return JSON:
{"sections":[{"n":string,"h":string,"s":string,"read":string}],
 "numbers":[{"v":string,"k":string,"m":string,"c":string}]}
sections: up to 12, in document order. "n" is the section number or a short label. "s" is 2 sentences: what it does and the takeaway. "read" is short guidance, e.g. "read closely" / "skim" / "reference only".
numbers: up to 8 headline figures. "v" is the figure, "k" is a short caption of what it measures, "m" is what it means, "c" is the caveat or what it does not show. Empty array if the document has no quantitative results.`],
  ["glossary", `Return JSON: {"jargon":[{"t":string,"h":string,"d":string}]}
8-16 terms. "h" is a 3-5 word gloss. "d" is 60-100 words: what it is, why it exists, how this document uses it.
Weight heavily toward vocabulary, benchmark names, model names and metrics a non-specialist engineer would not know.`],
  ["grounding context", `Return JSON: {"context": string}
A dense factual digest of the document, 500-900 words, written for another model to answer questions from. Include the method, every headline result with its exact numbers, hyperparameters, datasets, named limitations and any self-reported defects. Plain prose, no markdown. This is reference data, not an explanation.`]
];

let mode = "pdf";

function boot() {
  wireKeyPanel();
  wireSourceTabs();
  $("#add-btn").addEventListener("click", () => {
    $("#ingestpanel").classList.toggle("hide");
    if (!$("#ingestpanel").classList.contains("hide")) $("#ingestpanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  $("#ingest-run").addEventListener("click", run);
}

function wireKeyPanel() {
  $("#settings-btn").addEventListener("click", () => { $("#keypanel").classList.toggle("hide"); keyState(); });
  $("#key-save").addEventListener("click", saveKey);
  $("#key-input").addEventListener("keydown", e => { if (e.key === "Enter") saveKey(); });
  $("#key-clear").addEventListener("click", () => { keyStore.clear(); keyState(); });
  $("#model-input").value = keyStore.model();
  keyState();
}

function saveKey() {
  const v = $("#key-input").value.trim();
  if (!v) return;
  const ok = keyStore.set(v);
  keyStore.setModel($("#model-input").value);
  if (ok) $("#key-input").value = "";
  keyState(!ok);
}

function keyState(saveFailed) {
  $("#settings-btn").classList.toggle("key-set", !saveFailed && keyStore.has());
  $("#key-state").textContent = saveFailed
    ? "Couldn't save — this browser is blocking local storage for this site (private browsing, tracking protection, or an extension). Try a different browser or disable that blocking for this page."
    : keyStore.has()
    ? "Key set on this browser. You can decode papers below."
    : "No key set. Add one above before decoding a paper.";
}

function wireSourceTabs() {
  const tabs = [["#src-pdf", "pdf"], ["#src-text", "text"], ["#src-arxiv", "arxiv"]];
  for (const [id, key] of tabs) {
    $(id).addEventListener("click", () => {
      mode = key;
      for (const [otherId, otherKey] of tabs) $(otherId).setAttribute("aria-pressed", String(otherKey === key));
      $("#src-pdf-panel").classList.toggle("hide", key !== "pdf");
      $("#src-text-panel").classList.toggle("hide", key !== "text");
      $("#src-arxiv-panel").classList.toggle("hide", key !== "arxiv");
    });
  }
}

/* ---------- base64 / hashing helpers (Web APIs only, no deps) ---------- */

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

async function sha256Hex16(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

/* ---------- source loading ---------- */

async function loadSource() {
  if (mode === "pdf") {
    const file = $("#pdf-input").files[0];
    if (!file) throw new Error("Choose a PDF file first.");
    const buf = new Uint8Array(await file.arrayBuffer());
    const slug = file.name.replace(/\.pdf$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return { kind: "pdf", bytes: buf, data: bytesToBase64(buf), suggestedId: slug, url: "" };
  }
  if (mode === "text") {
    const text = $("#text-input").value.trim();
    if (!text) throw new Error("Paste some text first.");
    return { kind: "text", bytes: new TextEncoder().encode(text), data: text, suggestedId: "paper-" + Date.now(), url: "" };
  }
  // arxiv
  const id = $("#arxiv-input").value.trim();
  if (!/^\d{4}\.\d{4,5}(v\d+)?$/.test(id)) throw new Error('That doesn\'t look like an arXiv id (expected e.g. "2407.21787").');
  let res;
  try {
    res = await fetch(`https://arxiv.org/pdf/${id}`);
  } catch (e) {
    throw new Error("Couldn't reach arxiv.org from this browser (likely blocked cross-origin). Download the PDF and use \"upload pdf\" instead.");
  }
  if (!res.ok) throw new Error(`arXiv fetch failed (${res.status}).`);
  const buf = new Uint8Array(await res.arrayBuffer());
  return { kind: "pdf", bytes: buf, data: bytesToBase64(buf), suggestedId: "arxiv-" + id.replace(/v\d+$/, ""), url: `https://arxiv.org/abs/${id}` };
}

function block(src, instruction) {
  if (src.kind === "pdf") {
    return [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: src.data } },
      { type: "text", text: instruction }
    ];
  }
  return instruction + "\n\nDOCUMENT:\n" + src.data.slice(0, 45000);
}

function parseJSON(text, label) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const a = clean.indexOf("{"), b = clean.lastIndexOf("}");
  try { return JSON.parse(a >= 0 ? clean.slice(a, b + 1) : clean); }
  catch (e) { throw new Error(`${label}: model did not return valid JSON — ${e.message}`); }
}

/* ---------- run ---------- */

async function run() {
  const log = $("#ingest-log");
  const status = $("#ingest-status");
  const resultBox = $("#ingest-result");
  log.textContent = "";
  resultBox.classList.add("hide");
  resultBox.textContent = "";

  if (!keyStore.has()) {
    status.textContent = "Add your API key under key settings first.";
    return;
  }

  const btn = $("#ingest-run");
  btn.disabled = true;
  status.textContent = "";

  const step = (label) => {
    const row = el("div", "step");
    row.append(el("span", "mark", "·"), el("span", null, label));
    log.append(row);
    return row;
  };

  try {
    const loading = step("reading source…");
    let src;
    try {
      src = await loadSource();
      loading.classList.add("ok"); loading.querySelector(".mark").textContent = "✓";
    } catch (e) {
      loading.classList.add("err"); loading.querySelector(".mark").textContent = "✗";
      throw e;
    }

    const out = {};
    for (const [label, instruction] of PASSES) {
      const row = step(label + "…");
      try {
        const text = await callClaude(SYS, [{ role: "user", content: block(src, instruction) }], { maxTokens: 8000 });
        Object.assign(out, parseJSON(text, label));
        row.classList.add("ok"); row.querySelector(".mark").textContent = "✓";
      } catch (e) {
        row.classList.add("err"); row.querySelector(".mark").textContent = "✗";
        throw e;
      }
    }

    const idField = $("#ingest-id").value.trim();
    const tagsField = $("#ingest-tags").value.trim();
    const linksField = $("#ingest-links").value.trim();

    const id = (idField || out.id || src.suggestedId || "paper-" + Date.now())
      .toLowerCase().replace(/[^a-z0-9._-]+/g, "-");

    const record = {
      schema: 1,
      id,
      title: out.title || "Untitled",
      authors: out.authors || [],
      venue: out.venue || "",
      year: out.year || new Date().getFullYear(),
      url: out.url || src.url || "",
      added: new Date().toISOString().slice(0, 10),
      tags: (tagsField ? tagsField.split(",").map(s => s.trim()).filter(Boolean) : out.tags) || [],
      course_links: linksField ? linksField.split(",").map(s => s.trim()).filter(Boolean) : [],
      summary: out.summary || "",
      thesis: out.thesis || "",
      claims: out.claims || [],
      concepts: out.concepts || [],
      sections: out.sections || [],
      numbers: out.numbers || [],
      jargon: out.jargon || [],
      context: out.context || "",
      source_hash: "sha256:" + await sha256Hex16(src.bytes)
    };

    const problems = [];
    if (!record.title || record.title === "Untitled") problems.push("no title extracted");
    if (record.claims.length < 2) problems.push("fewer than 2 claims");
    if (record.concepts.length < 4) problems.push("fewer than 4 concepts");
    if (record.jargon.length < 5) problems.push("fewer than 5 glossary terms");
    if (record.context.length < 800) problems.push("grounding context is thin — Ask will be weak");

    await showResult(record, problems);
    status.textContent = "Done.";
  } catch (e) {
    status.textContent = e instanceof NoKeyError ? "Add your API key under key settings first." : e.message;
  }
  btn.disabled = false;
}

async function showResult(record, problems) {
  const box = $("#ingest-result");
  box.classList.remove("hide");

  if (problems.length) {
    const p = el("p", null, "This record is thin in a few spots — worth fixing by hand before it ships:");
    const ul = el("ul", "warn-list");
    for (const w of problems) ul.append(el("li", null, w));
    box.append(p, ul);
  } else {
    box.append(el("p", "note", "Passed the quality bar — no thin spots flagged."));
  }

  let index = null;
  let indexError = null;
  try {
    const res = await fetch("data/index.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    index = await res.json();
  } catch (e) { indexError = e; }

  const dlRow = el("div", "dl-row");
  dlRow.append(dlButton(`${record.id}.json`, record, "download record"));

  if (index) {
    index.papers = (index.papers || []).filter(p => p.id !== record.id);
    index.papers.push({
      id: record.id, title: record.title, authors: record.authors, venue: record.venue,
      year: record.year, added: record.added, tags: record.tags, summary: record.summary
    });
    index.papers.sort((a, b) => String(b.added).localeCompare(String(a.added)));
    dlRow.append(dlButton("index.json", index, "download updated index"));
  } else {
    box.append(el("p", "note", "Couldn't load the current index.json (" + indexError.message + ") — merge this paper into it by hand instead of downloading a fresh one."));
  }

  box.append(dlRow);
  box.append(el("p", "note", `Save both files into src/papers/data/ (overwriting index.json), then reload this page. Reader: paper.html?id=${record.id}`));
}

function dlButton(filename, obj, label) {
  const btn = el("button", "ghost", label);
  btn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(obj, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = el("a"); a.href = url; a.download = filename;
    document.body.append(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });
  return btn;
}

boot();
