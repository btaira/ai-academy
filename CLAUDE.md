# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Brief
A single-file HTML interactive training platform covering AI engineering topics.
Built iteratively with Claude. 11 courses, 148 modules, ~710KB.
The entire app — data, UI, logic, styles — lives in one file: `src/ai-academy.html`.

## Tech Stack
- **Runtime:** Pure HTML/CSS/JS, no build step, no framework, no dependencies
- **Delivery:** Open the HTML file directly in any browser
- **Architecture:** Data-driven single file — adding a course = add to COURSES array + add panels to PANEL_CONTENT object

## Directory Structure
```
ai-academy/
  src/
    ai-academy.html          # THE entire application (source of truth)
    papers/                  # Papers library — see "Papers library" section below
  tools/
    decode-paper.mjs         # Source document -> papers library record
    export-corpus.mjs        # Records -> SQL for a retrieval corpus
    paper-schema.json        # The record contract
  docs/
    architecture.md          # How the data-driven system works
    course-registry.md       # All 11 courses and their module IDs
    decisions.md             # Key architectural decisions log
    adding-a-course.md       # Step-by-step guide for new courses
  prompts/
    new-course.md            # Master prompt for adding a new course
    new-panels.md            # Master prompt for writing panel content
    debug.md                 # Prompts for diagnosing issues
  scripts/
    validate.js              # Syntax check + panel/registry cross-validation
    build-stats.js           # Count courses, modules, file size
  scratch/                   # Gitignored — experiments only
  CLAUDE.md                  # This file
  README.md                  # Human-facing overview
  .gitignore
```

## Architecture (read this before touching the file)

The app is data-driven. Three JS structures drive everything:

### 1. COURSES array
Each course object:
```js
{
  id: 'myid',           // short slug — used as CSS class prefix and panel key prefix
  title: 'Short',       // sidebar pill label (keep under 12 chars)
  longTitle: 'Full Title',
  icon: '🔤',
  accentClass: 'ca-myid',
  accentColor: '#HEXHEX',
  accentDim: 'rgba(R,G,B,0.10)',
  status: 'available',  // or 'coming-soon'
  description: '...',
  moduleTags: ['tag1', 'tag2'],
  sections: [
    { label: 'Section Name', modules: [
      { id: 'modid', icon: '📄', title: 'Module Title', badge: '1' },
    ]}
  ],
  quiz: [
    { q: "Question?", options: ["A","B","C","D"], correct: 1, explanation: "..." }
  ]
}
```

### 2. PANEL_CONTENT object
Keyed `'courseId:moduleId'` → arrow function returning HTML string:
```js
'myid:modid': () => `<div class="panel" id="panel-myid-modid">
  <div class="breadcrumb">CourseName › <span class="bc-accent">Section</span> › Module</div>
  <h1>Module <span class="hl">Title</span></h1>
  ...content...
</div>`,
```

### 3. CSS accent classes
Each course gets a CSS class in the style block:
```css
.ca-myid { --accent: #HEXHEX; --accent-dim: rgba(R,G,B,0.10); --accent-glow: rgba(R,G,B,0.20); }
```

## Critical Escaping Rules (will cause silent JS syntax errors if violated)

1. **Shell/Docker variables** like `${GIT_SHA}` inside panel HTML strings → escape as `&#36;{GIT_SHA}`
2. **GitHub Actions expressions** like `${{ github.sha }}` → escape as `&#36;{{ github.sha }}`
3. **Triple backticks** ` ``` ` in code examples → escape as `&#96;&#96;&#96;`
4. **Inline backticks** in prose (e.g. `` `npm run dev` ``) → use `<code class="inline">npm run dev</code>`
5. **Template literal `${`** in code examples → escape `$` as `&#36;`

## Key Commands
```bash
node scripts/validate.js          # syntax check + panel/registry cross-validation
node scripts/build-stats.js       # count courses, modules, file size
open src/ai-academy.html          # preview in browser (macOS)
start src/ai-academy.html         # preview in browser (Windows)
```

## CSS Component Classes (use these in panel HTML)
- `.card-grid` / `.card` — 2-4 column feature cards
- `.code-block` with `<span class="code-label">// TITLE</span>` — code examples
- `.info-box` — default blue; `.info-box.amber` `.info-box.green` `.info-box.red`
- `.accordion` / `.acc-header onclick="toggleAcc(this)"` / `.acc-body`
- `.tab-bar` / `.tab-btn` / `.tab-content` — tabbed content
- `.data-table` — styled table
- `.cap-list` / `.cap-icon` / `.cap-text` — capability list
- `.checklist` — bulleted checklist
- `.flow-node c-accent` / `.c-amber` / `.c-green` / `.c-violet` — diagram nodes
- `.diagram-wrap` — diagram container
- `.cheat-grid` / `.cheat-card` — quick reference grid
- `.hl` — cyan highlight span; `.hl-amber` `.hl-green` `.hl-violet` `.hl-red`
- `.tag` — small badge; `.tag.amber` `.tag.violet` `.tag.green` `.tag.red`
- `.bc-accent` — breadcrumb highlight

## Syntax Helpers
- `<span class="code-label">// LABEL</span>` inside `.code-block` — section label
- `<span class="c">comment text</span>` — comment color in code
- `<span class="k">keyword</span>` — keyword color
- `<span class="s">"string"</span>` — string color
- `<span class="n">name</span>` — name/key color
- `<span class="v">value</span>` — value/number color

## Quiz Format (required for every course)
```js
quiz: [
  {
    q: "Question text?",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correct: 1,           // 0-indexed
    explanation: "Why B is correct..."
  }
]
// Minimum 8 questions per course. Quiz panel id: 'courseid:quiz'
// Quiz container div id: 'quiz-container-{courseId}'
// Next button id: 'quiz-next-{courseId}'
// Score span id: 'quiz-score-{courseId}'
// Complete div id: 'quiz-complete-{courseId}'
```

## DO NOT
- Create separate CSS or JS files — everything stays in the single HTML file
- Add npm dependencies or a build step
- Use localStorage or sessionStorage (not supported in this environment)
- Add `${` shell variable syntax inside panel content without escaping
- Use raw backtick characters inside panel HTML strings
- Modify the quiz engine, switchTab(), toggleAcc(), navigate(), or switchCourse() functions
- Create new files outside the defined directory structure without asking

## Current Courses
Order follows the learner journey: model fundamentals → communicating with it → managing its inputs → grounding it in data → practical synthesis → connecting tools → autonomous agents → applying AI to software engineering practice → a specialized vertical.
1. llm — LLM Fundamentals (16 modules)
2. prompts — Prompt Engineering (14 modules)
3. ctx — Context Engineering (14 modules)
4. rag — RAG Deep Dive (14 modules)
5. skills — AI Skills Training (17 modules)
6. mcp — Model Context Protocol (16 modules)
7. agents — Agentic AI Systems (16 modules)
8. vibe — Managing Vibe-Coded Projects (15 modules)
9. qa — QA Stack & GitHub Actions (14 modules)
10. docker — Docker with AI (13 modules)
11. hwai — AI for Hardware Engineers (13 modules)

## Accent Colors (do not reuse)
mcp=#00D4FF · agents=#FFB347 · skills=#4EEEA8 · rag=#2DD4BF · prompts=#A78BFA
llm=#F472B6 · hwai=#FB923C · ctx=#38BDF8 · vibe=#F59E0B · qa=#34D399 · docker=#60A5FA

## Papers library (`src/papers/`)

A decoded-paper reader for the academy, linked from the sidebar as the "Research Papers"
pill. Static, no backend, no build step — lives next to `ai-academy.html` so relative
links resolve the same way whether the file is opened locally or served from GitHub
Pages (the Pages workflow copies `src/papers/` alongside the renamed `index.html`).

```
src/papers/
  index.html            library: search, tag filter, sort, in-browser "add paper"
  paper.html            reader: ?id=<paper-id>
  assets/               decoder.css, library.js, paper.js, claude-client.js, github-client.js, ingest.js
  data/
    index.json          manifest — cards only, no bodies
    <paper-id>.json     one decoded record per paper
tools/
  decode-paper.mjs      source document -> record + index update (CLI / Claude Code)
  export-corpus.mjs     records -> SQL for the retrieval corpus
  paper-schema.json     the record contract
```

### Conventions

- **One record per file, git-versioned.** `src/papers/data/` is the database. No server,
  no hosted DB, nothing to keep in sync.
- **`index.json` is derived, never hand-edited.** `decode-paper.mjs` (and the in-browser
  ingest flow) rewrite it. If it drifts from the record files, regenerate rather than
  patch.
- **Ids are stable and URL-safe.** `arxiv-2407.21787` for arXiv, otherwise a slug. The id
  is the filename stem, the `?id=` parameter, and the foreign key in the corpus export.
  Renaming one breaks inbound links — don't.
- **Never commit an API key or token.** The live features read an Anthropic key from
  the visitor's own `localStorage` (`ai-academy.anthropic-key`), and the in-browser
  publish flow reads a GitHub personal access token the same way
  (`ai-academy.github-token`, see `github-client.js`). Anyone without the Anthropic key
  gets the static views, which is the whole page minus go-deeper, term lookup, Ask and
  the in-browser ingest flow. This is a deliberate, scoped exception to the repo's
  no-localStorage rule: `papers/` is a separate static site (not previewed as a
  Claude.ai artifact), and every storage call is wrapped so it degrades gracefully
  wherever storage is genuinely unavailable.
- **Three ways to add a record, same output shape:** `node tools/decode-paper.mjs
  <source>` from a terminal (or the `/decode-paper` command in Claude Code, which also
  commits); the "+ add paper" button on the library page with a GitHub token configured,
  which commits the record and updated index straight to GitHub via the Contents API
  (`github-client.js`, two commits — record then index, not atomic); or the same button
  with no token, which produces a record + index.json download to drop into
  `src/papers/data/` and commit by hand — a static page can't write to the repo or run
  git on its own otherwise. Hand-editing an existing record afterwards is expected and
  fine.

### Quality bar for a record

The point of this library is that a paper's numbers arrive with their caveats attached.
A record that reads like a press release has failed. Before considering a decode done:

- At least one `claims` entry covers limitations, or what the paper is honest about.
  If every claim is a positive finding, something was dropped.
- Every `numbers` entry has a `c` that says what the figure does *not* show. A caveat
  that restates the meaning is not a caveat.
- `concepts[].eng` explains a mechanism and names a failure mode. "X is a technique for
  Y" is a definition, not an explanation — that belongs in `jargon`.
- `jargon` targets the reader's actual gap: machine-learning vocabulary, benchmark names,
  model names, metrics. Not terms the paper already defines inline.
- `context` is 500-900 words, contains the real figures, and is written for a model to
  answer from. It grounds Ask and becomes the paper row in the retrieval corpus.

### Linking papers to courses

`course_links` holds repo-relative module paths. The reader renders them as links back
into the course. Add the reverse link by hand in the module page so the relationship is
navigable both ways — a module points at the papers behind it, a paper points at the
modules that use it.

### Retrieval corpus

`node tools/export-corpus.mjs > papers.sql` emits one row per paper plus one row per
chunk (claim, concept, section, number, glossary entry), with FTS5 over the chunks. Each
chunk carries a `kind` so a hybrid retriever can weight structure — a `number` chunk and
a `concept` chunk answer different questions. This is the intended bridge to the wider
document corpus; keep the schema stable.

## Current Focus
Papers library lives at `src/papers/` (colocated with `ai-academy.html`) and is linked from the sidebar as the "Research Papers" pill. The in-browser "add paper" flow can now publish straight to GitHub via a personal access token (`github-client.js`), for use when running the site outside GitHub Pages (e.g. the Docker image) where there's no other way to get a decoded record back into the repo.

A `Dockerfile`/`.dockerignore` at the repo root build an nginx image serving the same output the GitHub Pages workflow deploys (`src/ai-academy.html` as `index.html`, `src/papers/` alongside it) — see the Dockerfile's comment for the exact mirroring.
