# AI Engineering Academy — Claude Code Context

## Project Brief
A single-file HTML interactive training platform covering AI engineering topics.
Built iteratively with Claude. 11 courses, 148 modules, ~735KB.
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
1. mcp — Model Context Protocol (15 modules)
2. agents — Agentic AI Systems (15 modules)
3. skills — AI Skills Training (16 modules)
4. rag — RAG Deep Dive (13 modules)
5. prompts — Prompt Engineering (13 modules)
6. llm — LLM Fundamentals (12 modules)
7. hwai — AI for Hardware Engineers (12 modules)
8. ctx — Context Engineering (13 modules)
9. vibe — Managing Vibe-Coded Projects (14 modules)
10. qa — QA Stack & GitHub Actions (13 modules)
11. docker — Docker with AI (12 modules)

## Accent Colors (do not reuse)
mcp=#00D4FF · agents=#FFB347 · skills=#4EEEA8 · rag=#2DD4BF · prompts=#A78BFA
llm=#F472B6 · hwai=#FB923C · ctx=#38BDF8 · vibe=#F59E0B · qa=#34D399 · docker=#60A5FA

## Current Focus
[Update this at the start of each session with what you're working on]
