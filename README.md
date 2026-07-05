# AI Engineering Academy

An interactive single-file HTML training platform covering AI engineering from foundations to production deployment.

## Quick Start

```bash
# Clone and open — no install required
git clone <repo-url>
open src/ai-academy.html        # macOS
start src/ai-academy.html       # Windows
xdg-open src/ai-academy.html    # Linux
```

## What's Inside

11 courses, 162 modules of hands-on AI engineering training. Course order
follows the learner journey: model fundamentals → communicating with it →
managing its inputs → grounding it in data → practical synthesis →
connecting tools → autonomous agents → applying AI to software engineering
practice → a specialized vertical.

| # | Course | Modules | Topics |
|---|--------|---------|--------|
| 1 | LLM Fundamentals | 16 | Tokens, attention, sampling, quantization, local models |
| 2 | Prompt Engineering | 14 | Zero-shot, few-shot, CoT, system prompts, optimization |
| 3 | Context Engineering | 14 | Token budget, ordering, compression, memory, failure modes |
| 4 | RAG Deep Dive | 14 | Embeddings, vector DBs, chunking, reranking, evaluation |
| 5 | AI Skills Training | 17 | Prompting, evaluation, tool design, automation, ethics |
| 6 | Model Context Protocol | 16 | Architecture, protocol, web, mobile, CLI, vendors |
| 7 | Agentic AI Systems | 16 | Reasoning, memory, planning, tools, multi-agent, safety |
| 8 | Managing Vibe-Coded Projects | 15 | Structure, CLAUDE.md, anti-bloat, git hygiene, refactoring |
| 9 | QA Stack & GitHub Actions | 14 | Unit tests, integration, E2E, GitHub Actions, AI test gen |
| 10 | Docker with AI | 13 | Dockerfile, Compose, images, scripts, AI prompts |
| 11 | AI for Hardware Engineers | 13 | Compliance, schematic review, BOM, test data, documentation |

Every course ends with a Go Deeper resource list, a scored Knowledge Check
quiz, and a printable Quick Reference cheatsheet.

## Architecture

Everything lives in `src/ai-academy.html` — one file, no build step, no dependencies.

The platform is **data-driven**: adding a course means adding an entry to the `COURSES` array and corresponding panels to the `PANEL_CONTENT` object. The sidebar, navigation, quiz engine, and progress tracking all build themselves from those structures.

See `docs/architecture.md` for the full technical walkthrough.
See `docs/adding-a-course.md` to add new courses.

Some panels link out to supplementary content stored alongside the app
rather than inlined in the HTML:
- `docs/sources/` — source notes backing a panel's external "Pro Tip" links
- `docs/notebooks/` — runnable Jupyter notebooks for hands-on exercises (e.g. `attention-hands-on.ipynb`, also openable with one click in [Try Jupyter](https://jupyter.org/try-jupyter/lab/), no install required)

These are linked with absolute `github.com/.../blob/...` URLs, not relative
paths — the app is viewed both as a local file and via GitHub Pages, and
relative paths resolve differently (and break) between the two.

## Browser & Device Support

Plain HTML/CSS/JS, no storage APIs, includes a `viewport` meta tag — it
runs in any modern browser with no install. Verified responsive down to
tablet width (768px). Below that there's a single breakpoint
(`@media (max-width: 740px)`) that narrows the sidebar to 210px rather
than collapsing it into a menu, so on narrow phone screens (≤~430px
portrait) the content column gets cramped. Landscape phone widths and
anything tablet-sized or larger look as intended.

## Development with Claude Code

```bash
# Validate after any edit
node scripts/validate.js

# See stats
node scripts/build-stats.js
```

To see a change rendered without a real browser (e.g. in this
container), use the `run-ai-academy` skill — drives the file headlessly
via Playwright and takes screenshots. See
`.claude/skills/run-ai-academy/SKILL.md`.

Read `CLAUDE.md` before starting any session — it's the AI's briefing document.

## Contributing

See `docs/adding-a-course.md` for the process. The prompt templates in `prompts/` are the fastest path to high-quality new content.
