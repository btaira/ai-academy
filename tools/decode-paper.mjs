#!/usr/bin/env node
/**
 * decode-paper.mjs — turn a paper into a decoded JSON record for the AI Academy library.
 *
 *   node tools/decode-paper.mjs path/to/paper.pdf
 *   node tools/decode-paper.mjs path/to/paper.txt --id my-slug --tags rag,retrieval
 *   node tools/decode-paper.mjs 2407.21787              # arXiv id, fetches the abs page + PDF
 *   node tools/decode-paper.mjs paper.pdf --dry-run     # print, don't write
 *
 * Requires ANTHROPIC_API_KEY in the environment. No npm dependencies.
 * Writes src/papers/data/<id>.json and rewrites src/papers/data/index.json.
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DATA = path.join(ROOT, "src", "papers", "data");
const MODEL = process.env.DECODER_MODEL || "claude-sonnet-4-6";
const KEY = process.env.ANTHROPIC_API_KEY;

/* ------------------------------ args ------------------------------ */

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help")) {
  console.log("usage: node tools/decode-paper.mjs <file.pdf|file.txt|arxiv-id> [--id slug] [--tags a,b] [--links course-04/module-12] [--dry-run]");
  process.exit(argv.length ? 0 : 1);
}
const input = argv[0];
const flag = (name, dflt = null) => { const i = argv.indexOf("--" + name); return i > -1 ? argv[i + 1] : dflt; };
const has = (name) => argv.includes("--" + name);

if (!KEY) { console.error("ANTHROPIC_API_KEY is not set."); process.exit(1); }

/* ------------------------------ api ------------------------------- */

async function claude(system, content, maxTokens = 8000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content }] })
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  return (data.content || []).map(b => (b.type === "text" ? b.text : "")).join("\n").trim();
}

function parseJSON(text, label) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const a = clean.indexOf("{"), b = clean.lastIndexOf("}");
  try { return JSON.parse(a >= 0 ? clean.slice(a, b + 1) : clean); }
  catch (e) { throw new Error(`${label}: model did not return valid JSON — ${e.message}`); }
}

/* --------------------------- source load -------------------------- */

async function loadSource(spec) {
  // bare arXiv id
  if (/^\d{4}\.\d{4,5}(v\d+)?$/.test(spec)) {
    const id = spec;
    const url = `https://arxiv.org/pdf/${id}`;
    process.stderr.write(`fetching ${url}\n`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`arXiv fetch failed (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    return { kind: "pdf", data: buf.toString("base64"), suggestedId: "arxiv-" + id.replace(/v\d+$/, ""), url: `https://arxiv.org/abs/${id}` };
  }

  const abs = path.resolve(spec);
  const ext = path.extname(abs).toLowerCase();
  const buf = await fs.readFile(abs);
  const slug = path.basename(abs, ext).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  if (ext === ".pdf") return { kind: "pdf", data: buf.toString("base64"), suggestedId: slug, url: "" };
  return { kind: "text", data: buf.toString("utf8"), suggestedId: slug, url: "" };
}

// Every pass re-sends the source. For a PDF that means a document block;
// for text it means an inline excerpt.
function block(src, instruction, textLimit = 45000) {
  if (src.kind === "pdf") {
    return [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: src.data } },
      { type: "text", text: instruction }
    ];
  }
  return instruction + "\n\nDOCUMENT:\n" + src.data.slice(0, textLimit);
}

/* ---------------------------- extraction -------------------------- */

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
 "thesis": string,  // 3-5 sentences of flowing, conversational prose — not an abstract. Write it like you're explaining the paper's core idea and why it matters to a smart colleague over coffee: plain language, a concrete mental picture or analogy if one helps, no unexplained jargon. This is the first thing every reader sees, so it has to work as a stand-alone read, not a summary of what follows.
 "claims": [ {"tag": string, "h": string, "plain": [string], "body": [string]} ]  // 3-5 claims. tag is 2-3 words.
   // "plain" = 1-2 short sentences per claim, zero jargon, as if telling a smart friend outside tech what this finding means. This is what most readers actually read.
   // "body" = 2-4 items, each 1-3 sentences, for a reader with technical fluency. Use **bold** for terms being defined.
   // Include at least one claim covering limitations or what the document is honest about.
}`],

  ["concepts", `Return JSON: {"concepts":[{"t":string,"plain":string,"eng":string}]}
6-10 concepts a reader must understand to follow the document.
"plain" = 2-3 short sentences, zero jargon, as if explaining to a curious friend with no technical background. Use a concrete analogy if it helps. Spell out or avoid every acronym and term of art — this must read noticeably simpler than "eng", not as a denser rewording of it.
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

/* ------------------------------ main ------------------------------ */

const src = await loadSource(input);
const out = {};

for (const [label, instruction] of PASSES) {
  process.stderr.write(`· ${label}…`);
  const text = await claude(SYS, block(src, instruction));
  Object.assign(out, parseJSON(text, label));
  process.stderr.write(" ok\n");
}

const id = (flag("id") || out.id || src.suggestedId || "paper-" + Date.now())
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
  tags: (flag("tags") ? flag("tags").split(",").map(s => s.trim()) : out.tags) || [],
  course_links: flag("links") ? flag("links").split(",").map(s => s.trim()) : [],
  summary: out.summary || "",
  thesis: out.thesis || "",
  claims: out.claims || [],
  concepts: out.concepts || [],
  sections: out.sections || [],
  numbers: out.numbers || [],
  jargon: out.jargon || [],
  context: out.context || "",
  source_hash: "sha256:" + crypto.createHash("sha256").update(src.data).digest("hex").slice(0, 16)
};

/* ---------------------------- validation -------------------------- */

const problems = [];
if (!record.title || record.title === "Untitled") problems.push("no title extracted");
if (record.claims.length < 2) problems.push("fewer than 2 claims");
if (record.concepts.length < 4) problems.push("fewer than 4 concepts");
if (record.jargon.length < 5) problems.push("fewer than 5 glossary terms");
if (record.context.length < 800) problems.push("grounding context is thin — Ask will be weak");
if (problems.length) {
  process.stderr.write("\nwarnings:\n" + problems.map(p => "  ! " + p).join("\n") + "\n");
}

if (has("dry-run")) { console.log(JSON.stringify(record, null, 2)); process.exit(0); }

/* ------------------------------ write ----------------------------- */

await fs.mkdir(DATA, { recursive: true });
await fs.writeFile(path.join(DATA, `${id}.json`), JSON.stringify(record, null, 2) + "\n");

const indexPath = path.join(DATA, "index.json");
let index = { schema: 1, papers: [] };
try { index = JSON.parse(await fs.readFile(indexPath, "utf8")); } catch {}
index.papers = (index.papers || []).filter(p => p.id !== id);
index.papers.push({
  id, title: record.title, authors: record.authors, venue: record.venue,
  year: record.year, added: record.added, tags: record.tags, summary: record.summary
});
index.papers.sort((a, b) => String(b.added).localeCompare(String(a.added)));
await fs.writeFile(indexPath, JSON.stringify(index, null, 2) + "\n");

process.stderr.write(`\nwrote src/papers/data/${id}.json\nindex now holds ${index.papers.length} paper(s)\nopen: src/papers/paper.html?id=${id}\n`);
