#!/usr/bin/env node
/**
 * export-corpus.mjs — emit the decoded papers as SQL for a retrieval corpus.
 *
 *   node tools/export-corpus.mjs > papers.sql
 *   sqlite3 corpus.db < papers.sql
 *
 * Produces one row per paper plus one row per retrievable chunk (each claim,
 * concept, section, number and glossary entry becomes its own chunk), with an
 * FTS5 index over the chunk text. Chunks carry their paper id and a kind tag so
 * a hybrid retriever can filter or boost by structure — a "numbers" chunk is a
 * different thing to a "concept" chunk and usually wants different weighting.
 *
 * No dependencies. Writes SQL to stdout so you decide which database it lands in.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DATA = path.join(ROOT, "src", "papers", "data");

const q = (s) => "'" + String(s ?? "").replace(/'/g, "''") + "'";

const files = (await fs.readdir(DATA)).filter(f => f.endsWith(".json") && f !== "index.json");

const lines = [
  "PRAGMA journal_mode=WAL;",
  "BEGIN;",
  `CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY, title TEXT, authors TEXT, venue TEXT, year INTEGER,
  url TEXT, added TEXT, tags TEXT, summary TEXT, thesis TEXT, context TEXT, source_hash TEXT
);`,
  `CREATE TABLE IF NOT EXISTS chunks (
  chunk_id TEXT PRIMARY KEY, paper_id TEXT, kind TEXT, heading TEXT, body TEXT,
  FOREIGN KEY(paper_id) REFERENCES papers(id)
);`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  heading, body, kind UNINDEXED, paper_id UNINDEXED, content='chunks', content_rowid='rowid'
);`,
  "CREATE INDEX IF NOT EXISTS idx_chunks_paper ON chunks(paper_id);",
  "CREATE INDEX IF NOT EXISTS idx_chunks_kind ON chunks(kind);"
];

let nChunks = 0;

for (const f of files) {
  const p = JSON.parse(await fs.readFile(path.join(DATA, f), "utf8"));

  lines.push(`DELETE FROM chunks WHERE paper_id = ${q(p.id)};`);
  lines.push(`INSERT OR REPLACE INTO papers VALUES (${[
    q(p.id), q(p.title), q((p.authors || []).join("; ")), q(p.venue), p.year || "NULL",
    q(p.url), q(p.added), q((p.tags || []).join(",")), q(p.summary), q(p.thesis),
    q(p.context), q(p.source_hash)
  ].join(", ")});`);

  const push = (kind, i, heading, body) => {
    if (!body) return;
    lines.push(`INSERT INTO chunks VALUES (${[q(`${p.id}#${kind}-${i}`), q(p.id), q(kind), q(heading), q(body)].join(", ")});`);
    nChunks++;
  };

  push("thesis", 0, p.title, p.thesis);
  (p.claims || []).forEach((c, i) => push("claim", i, c.h, (c.body || []).join(" ").replace(/\*\*/g, "")));
  (p.concepts || []).forEach((c, i) => push("concept", i, c.t, [c.plain, c.eng].filter(Boolean).join(" ")));
  (p.sections || []).forEach((s, i) => push("section", i, `${s.n || ""} ${s.h || ""}`.trim(), s.s));
  (p.numbers || []).forEach((n, i) => push("number", i, `${n.v} — ${n.k}`, [n.m, n.c].filter(Boolean).join(" Caveat: ")));
  (p.jargon || []).forEach((j, i) => push("glossary", i, j.t, [j.h, j.d].filter(Boolean).join(". ")));
}

lines.push("INSERT INTO chunks_fts(chunks_fts) VALUES('rebuild');");
lines.push("COMMIT;");

console.log(lines.join("\n"));
process.stderr.write(`${files.length} paper(s), ${nChunks} chunk(s)\n`);
