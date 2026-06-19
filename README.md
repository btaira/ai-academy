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

11 courses, 148 modules of hands-on AI engineering training:

| # | Course | Modules | Topics |
|---|--------|---------|--------|
| 1 | Model Context Protocol | 15 | MCP architecture, servers, security, host setup |
| 2 | Agentic AI Systems | 15 | Agent loop, memory, tools, multi-agent, frameworks |
| 3 | AI Skills Training | 16 | Prompting, evaluation, RAG, fine-tuning, cost |
| 4 | RAG Deep Dive | 13 | Embeddings, chunking, hybrid search, reranking, evals |
| 5 | Prompt Engineering | 13 | CoT, few-shot, structured output, injection defense |
| 6 | LLM Fundamentals | 12 | Tokens, attention, training, RLHF, inference |
| 7 | AI for Hardware Engineers | 12 | Compliance, schematic review, BOM, test data |
| 8 | Context Engineering | 13 | Token budget, compression, memory, agent context |
| 9 | Managing Vibe-Coded Projects | 14 | Directory structure, CLAUDE.md, bloat prevention |
| 10 | QA Stack & GitHub Actions | 13 | Unit/integration/E2E tests, CI pipelines, AI test gen |
| 11 | Docker with AI | 12 | Dockerfiles, Compose, session scripts, CI/CD |

## Architecture

Everything lives in `src/ai-academy.html` — one file, no build step, no dependencies.

The platform is **data-driven**: adding a course means adding an entry to the `COURSES` array and corresponding panels to the `PANEL_CONTENT` object. The sidebar, navigation, quiz engine, and progress tracking all build themselves from those structures.

See `docs/architecture.md` for the full technical walkthrough.
See `docs/adding-a-course.md` to add new courses.

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
