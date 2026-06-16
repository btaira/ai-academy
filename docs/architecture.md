# Architecture

The AI Engineering Academy is a data-driven single-file HTML application.
Every course, module, quiz, and UI component derives from two JS data structures.

## The Single-File Constraint

`src/ai-academy.html` contains everything:
- The full CSS design system (~400 lines)
- The COURSES data array
- The PANEL_CONTENT object (panel HTML for every module)
- The application JS (navigation, quiz engine, tabs, accordions)

**Why single-file?** Portability and simplicity. Open it in any browser with no server,
no install, no build. This is intentional and must be preserved.

## Data Flow

```
COURSES array
  └─ defines: course metadata, sections, module list, quiz questions
  └─ drives:  sidebar pills, module nav, progress bars, quiz engine

PANEL_CONTENT object
  └─ keyed: 'courseId:moduleId'
  └─ value:  arrow function () => HTML string
  └─ lazy-rendered into #panels-mount on first navigation
```

## COURSES Array Schema

```js
{
  id:          string,   // slug, e.g. 'rag'
  title:       string,   // short sidebar label, ≤12 chars
  longTitle:   string,   // full display name
  icon:        string,   // emoji
  accentClass: string,   // CSS class, e.g. 'ca-rag'
  accentColor: string,   // hex, e.g. '#2DD4BF'
  accentDim:   string,   // rgba with 0.10 alpha
  status:      'available' | 'coming-soon',
  description: string,
  moduleTags:  string[], // 4-5 topic keywords shown on course card
  sections: [
    {
      label:   string,
      modules: [
        { id: string, icon: string, title: string, badge: string }
      ]
    }
  ],
  quiz: [
    { q: string, options: string[4], correct: number, explanation: string }
  ]
}
```

## PANEL_CONTENT Object

```js
const PANEL_CONTENT = {
  'courseId:moduleId': () => `<div class="panel" id="panel-courseId-moduleId">
    ...HTML content...
  </div>`,
  // ...
}; // end PANEL_CONTENT
```

The `}; // end PANEL_CONTENT` comment is the injection marker used by
the Python injection script. Do not remove or modify it.

## Navigation Model

```
switchCourse(courseId)
  → sets body accent class (.ca-{courseId})
  → activates sidebar pill
  → calls navigate(courseId, firstModuleId)

navigate(courseId, moduleId)
  → lazy-renders PANEL_CONTENT['courseId:moduleId'] into #panels-mount
  → updates sidebar active module
  → updates topbar breadcrumb
  → initialises quiz if moduleId === 'quiz'
```

## Quiz Engine

Driven entirely by `COURSES[i].quiz` array. One engine handles all courses.
State stored in `quizState` object, keyed by courseId.

Functions: `initQuiz(courseId)`, `renderQuiz(courseId)`, `selectAnswer(courseId, qIdx, optIdx)`,
`quizNext(courseId)`, `showQuizResults(courseId)`, `resetQuiz(courseId)`.

Required DOM IDs in the quiz panel:
- `#quiz-container-{courseId}` — question renders here
- `#quiz-next-{courseId}` — next button
- `#quiz-score-{courseId}` — score display
- `#quiz-complete-{courseId}` — results screen

## CSS Design System

Dark IDE palette:
```css
--bg:      #080D1A   /* page background */
--surface: #0F1628   /* sidebar / topbar */
--card:    #161F35   /* card backgrounds */
--border:  #1E2D4A   /* dividers */
--text:    #E2E8F0   /* primary text */
--muted:   #94A3B8   /* secondary text */
--muted2:  #64748B   /* tertiary text */
--accent:  (per course, set by .ca-{id} class)
```

Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (code blocks).

## Injection Pattern for Large Content

When panel content is too large for a single str_replace (>100KB argument limit),
use the Python rfind injection pattern:

```python
with open('src/ai-academy.html', 'r') as f:
    content = f.read()

marker = '}; // end PANEL_CONTENT'
idx = content.rfind(marker)
new_content = content[:idx] + new_panels + '\n\n' + content[idx:]

with open('src/ai-academy.html', 'w') as f:
    f.write(new_content)
```

Always run `node scripts/validate.js` after any injection.
