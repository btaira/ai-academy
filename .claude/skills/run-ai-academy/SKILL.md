---
name: run-ai-academy
description: Run, screenshot, and drive the AI Engineering Academy (src/ai-academy.html). Use when asked to run the app, start it, open it in a browser, take a screenshot, or verify a change to a course/module/quiz actually renders.
---

This is a single static HTML file with no server and no build step —
`src/ai-academy.html` is the entire app. "Running" it means opening it
directly in a browser (`file://` URL). Since this is a headless Linux
container, drive it with the Playwright-based REPL driver at
`.claude/skills/run-ai-academy/driver.cjs` instead of a real browser
window.

All paths below are relative to the repo root (`ai-academy/`).

## Prerequisites

Nothing to install — Playwright is already present in the global npm
modules at `/opt/node22/lib/node_modules` (verified: `npm ls -g
--depth=0` lists `playwright@1.56.1`, and its Chromium binary launches
out of the box). It is **not** a local project dependency (this repo
has no `package.json` and no `node_modules/` — keep it that way; don't
`npm install` anything into the repo).

The driver is CommonJS (`.cjs`) and resolves `playwright` via
`NODE_PATH`, because `NODE_PATH` is **not** honored for ESM `import`
in Node — only for `require()`. That's the reason it's `.cjs`, not
`.mjs`.

## Build

None. There is no build step. (Optional sanity check before/after
editing panel content: `node scripts/validate.js`.)

## Run (agent path)

Pipe newline-separated commands to the driver over stdin:

```bash
NODE_PATH=/opt/node22/lib/node_modules node .claude/skills/run-ai-academy/driver.cjs <<'EOF'
nav
wait 400
screenshot home
h1
click Docker + AI
wait 250
click Knowledge Check
wait 250
screenshot quiz
h1
console
EOF
```

Screenshots land in `.claude/skills/run-ai-academy/screenshots/<name>.png`.

| command | what it does |
|---|---|
| `nav` | Opens `src/ai-academy.html` via `file://` |
| `wait <ms>` | Sleeps (use after `click`/`nav` — there's no router/network event to wait on) |
| `click <text>` | Clicks the first element whose text matches (sidebar pills, module list items, quiz options, buttons) |
| `screenshot <name>` | Saves `screenshots/<name>.png` |
| `h1` | Prints the `<h1>` text of the currently **visible** panel |
| `console` | Prints accumulated console/page errors as JSON |

Read the resulting screenshot file to confirm the UI actually
rendered — don't infer success from exit code alone.

## Run (human path)

```bash
open src/ai-academy.html        # macOS
start src/ai-academy.html       # Windows
xdg-open src/ai-academy.html    # Linux desktop
```

Useless in a headless container — there's no display. Use the agent
path above instead.

## Test

```bash
node scripts/validate.js     # JS syntax + COURSES/PANEL_CONTENT cross-check
node scripts/build-stats.js  # course/module/file-size summary
```

No browser-level test suite exists; the driver above is the closest
thing to one.

## Gotchas

- **`NODE_PATH` only works for `require()`, not ESM `import`.** An
  `.mjs` driver throws `ERR_MODULE_NOT_FOUND: Cannot find package
  'playwright'` even with `NODE_PATH` set correctly. Stick to `.cjs`
  (this driver) or `npm install playwright` locally (don't — see
  Prerequisites).
- **Old panels are never removed from the DOM, only hidden.** After
  navigating between modules, `document.querySelectorAll('.panel
  h1')` returns one element per panel ever rendered this session, in
  render order — not just the current one. Any selector you write
  against `.panel` must filter to the visible one
  (`.panel:visible h1`, as the `h1` driver command does), or you'll
  silently read stale content from a previous screen.
- **A `net::ERR_CERT_AUTHORITY_INVALID` console error on every load is
  expected and harmless.** The page's `<head>` preconnects to
  `fonts.googleapis.com` for Space Grotesk/Inter/JetBrains Mono; this
  container's network policy blocks or MITMs that, so the font
  request fails and the browser falls back to system fonts. The app
  itself has no bug — don't chase this error.
- **No `package.json` / `node_modules` in this repo, intentionally**
  (per `CLAUDE.md`: no build step, no dependencies). Don't `npm
  install` Playwright locally to "fix" the `NODE_PATH` requirement —
  that would add a dependency to a project whose entire premise is
  having none. Use the global install via `NODE_PATH` instead.

## Troubleshooting

- **`Cannot find module 'playwright'`**: you ran the driver without
  `NODE_PATH=/opt/node22/lib/node_modules` in the environment, or you
  ran it with `node --experimental-...` against an `.mjs` file. Use
  the exact invocation in "Run (agent path)".
- **`h1` prints content from the wrong course/module**: you queried
  `.panel h1` without `:visible` — see Gotchas above.
