# Adding a New Course

## Overview

Adding a course requires three additions to `src/ai-academy.html`:
1. A CSS accent class (2 lines)
2. A course object in the COURSES array
3. Panel content for every module in PANEL_CONTENT

Use the prompt templates in `prompts/new-course.md` and `prompts/new-panels.md`
to generate all three with AI assistance.

---

## Step 1 — Choose a Course ID and Accent Color

Pick a short slug (3–6 chars, lowercase, no hyphens): `myid`
Pick an accent color not already in use (see CLAUDE.md for taken colors).

Example: `id: 'obs'`, color: `#C084FC` (purple)

---

## Step 2 — Add the CSS Accent Class

Find the accent theming block (search for `ca-docker`). Add after the last entry:

```css
.ca-obs { --accent: #C084FC; --accent-dim: rgba(192,132,252,0.10); --accent-glow: rgba(192,132,252,0.20); }
```

---

## Step 3 — Add the Course Registry Entry

Find `]; // end COURSES` and insert before it:

```js
{
  id: 'obs',
  title: 'Observability',
  longTitle: 'AI Observability & Monitoring',
  icon: '🔭',
  accentClass: 'ca-obs',
  accentColor: '#C084FC',
  accentDim: 'rgba(192,132,252,0.10)',
  status: 'available',
  description: 'Monitor, trace, and debug LLM applications in production.',
  moduleTags: ['Tracing', 'Evals', 'Logging', 'Drift', 'Alerting'],
  sections: [
    { label: 'Foundations', modules: [
      { id: 'why',      icon: '🎯', title: 'Why Observe?',    badge: '1' },
      { id: 'tracing',  icon: '🔍', title: 'Tracing',         badge: '2' },
    ]},
    { label: 'Training', modules: [
      { id: 'quiz',     icon: '🎯', title: 'Knowledge Check', badge: '' },
      { id: 'cheatsheet', icon: '📋', title: 'Quick Reference', badge: '' },
    ]},
  ],
  quiz: [
    { q: "Question?", options: ["A","B","C","D"], correct: 1, explanation: "..." },
    // minimum 8 questions
  ],
},
```

---

## Step 4 — Write Panel Content

For each `moduleId` in sections.modules, you need an entry in PANEL_CONTENT:

```js
'obs:why': () => `<div class="panel" id="panel-obs-why">
  <div class="breadcrumb">Observability › <span class="bc-accent">Foundations</span> › Why Observe?</div>
  <h1>Why <span class="hl">Observe?</span></h1>
  <p class="lead">...</p>
  ...
</div>`,

'obs:quiz': () => `<div class="panel" id="panel-obs-quiz">
  <div class="breadcrumb">Observability › <span class="bc-accent">Training</span> › Knowledge Check</div>
  <h1>Knowledge <span class="hl">Check</span></h1>
  <p class="lead">Test your knowledge of AI observability.</p>
  <div id="quiz-container-obs"></div>
  <div class="quiz-controls">
    <button class="btn btn-primary" id="quiz-next-obs" onclick="quizNext('obs')" style="display:none">Next &rarr;</button>
    <button class="btn btn-outline" onclick="resetQuiz('obs')">&#8635; Restart</button>
    <span class="quiz-score-disp" id="quiz-score-obs"></span>
  </div>
  <div id="quiz-complete-obs" style="display:none"></div>
</div>`,
```

**For large panel sets:** write panels to a temp file and use the Python injection pattern.
See `docs/architecture.md` for the injection script.

---

## Step 5 — Validate

```bash
node scripts/validate.js
```

This checks:
- JS syntax (node --check)
- Every module in COURSES has a matching panel in PANEL_CONTENT
- Reports any missing panels by key

Fix all errors before committing.

---

## Step 6 — Preview

```bash
open src/ai-academy.html    # macOS
start src/ai-academy.html   # Windows
```

Check:
- New course appears as a pill in the top sidebar
- Clicking it switches to the correct accent color
- All modules are listed in the sidebar
- Each module panel renders correctly
- Quiz works (answer questions, check scoring)
- Cheat sheet displays the grid

---

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `${VAR}` in panel HTML | Blank page / JS parse error | Escape as `&#36;{VAR}` |
| `` ``` `` in code examples | JS parse error | Replace with `&#96;&#96;&#96;` |
| Quiz DOM IDs wrong | Quiz doesn't render | IDs must be `quiz-container-{courseId}` etc. |
| Missing panel for a module | Module click shows placeholder | Add the panel entry |
| Accent color already used | Visual clash | Check CLAUDE.md accent colors list |
| `quiz` array fewer than 8 | Thin quiz experience | Add more questions |
