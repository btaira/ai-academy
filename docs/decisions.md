# Architectural Decisions

Append-only log of significant decisions made during development.

---

## 2025-06 — Single-file HTML architecture
**Decision:** Keep everything in one HTML file with no build step.
**Alternatives considered:** React SPA, Astro, separate CSS/JS files.
**Reasoning:** Maximum portability — open in any browser with no server or install.
Team can share via email or file drop. No dependency rot over time.
**Tradeoff:** File grows large (~735KB at 11 courses). JS escaping constraints
for content inside template literals require discipline.

---

## 2025-06 — Data-driven course registry
**Decision:** All course metadata lives in a `COURSES` array; panel HTML lives in
a `PANEL_CONTENT` object keyed by `courseId:moduleId`.
**Reasoning:** Separates structure from content. Adding a course = add data,
no shell rewrite. Sidebar, progress bars, quiz engine all auto-build from COURSES.
**Tradeoff:** Panel content must escape JS template literal special characters.
A validate script catches errors before they reach the browser.

---

## 2025-06 — No localStorage / no sessionStorage
**Decision:** No browser storage APIs in panel content or scripts.
**Reasoning:** Not supported in the Claude.ai artifact environment where the
file is previewed. All state lives in JS variables for the session duration.
**Implication:** Quiz progress resets on reload. Acceptable for a training tool.

---

## 2025-06 — Python rfind injection for large content
**Decision:** Large panel batches are written to /tmp files then injected via
Python `rfind` on the `}; // end PANEL_CONTENT` marker.
**Reasoning:** Claude Code str_replace has a ~100KB argument limit. Panel
content for a full course (12–16 modules) often exceeds this.
**Pattern:** `content[:idx] + new_panels + '\n\n' + content[idx:]`

---

## 2025-06 — HTML entity escaping for problematic chars in panels
**Decision:** Shell variables (`${VAR}`), GitHub Actions expressions (`${{ }}`),
and triple backticks in code examples use HTML entities in panel content.
**Specific rules:**
- `${VAR}` → `&#36;{VAR}`
- `${{ expr }}` → `&#36;{{ expr }}`
- ` ``` ` → `&#96;&#96;&#96;`
- Inline backtick → `<code class="inline">text</code>`
**Reasoning:** Panel HTML lives inside JS template literals. These chars are
interpreted as template literal syntax and cause silent parse failures.

---

## 2025-06 — Minimum 8 quiz questions per course
**Decision:** Every course must have at least 8 quiz questions.
**Reasoning:** Below 8, the quiz feels trivial and provides poor coverage
of a course with 12–16 modules. 8–10 is the sweet spot for a sitting.

---

## 2025-06 — Accent color uniqueness per course
**Decision:** Each course gets a unique accent hex color; none are reused.
**Reasoning:** Switching courses visually signals the domain change.
Color becomes a navigational cue after a few sessions.
**Current allocation:** See CLAUDE.md accent colors list.
