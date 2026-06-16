# Prompts: Debugging & Diagnostics

---

## PROMPT 1 — JS Syntax Error (blank page or parse failure)

```
The Academy isn't loading / shows a blank page. This usually means a JS syntax error.

Run this to diagnose:
node scripts/validate.js

If validate.js itself fails with a regex error, run:
node -e "
const fs = require('fs');
const html = fs.readFileSync('src/ai-academy.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
fs.writeFileSync('/tmp/academy.js', m[1]);
" && node --check /tmp/academy.js

The error output will show:
- The line number in /tmp/academy.js
- The problematic token

Common fixes:
- ${VAR} in panel HTML → replace with &#36;{VAR}
- ${{ }} in YAML examples → replace with &#36;{{ }}
- Triple backtick → replace with &#96;&#96;&#96;
- Raw backtick in panel content → use <code class="inline">text</code>
```

---

## PROMPT 2 — Panel Not Rendering (module click shows placeholder)

```
Clicking module '{courseId}:{moduleId}' shows a grey placeholder instead of content.

Diagnose:
1. Run: node scripts/validate.js
   Check if '{courseId}:{moduleId}' appears in the missing panels list.

2. If it's listed as missing, the panel key is not in PANEL_CONTENT.
   Search for the key in src/ai-academy.html:
   grep -n "'{courseId}:{moduleId}'" src/ai-academy.html

3. If the key exists but doesn't render, check:
   - The panel ID attribute: should be id="panel-{courseId}-{moduleId}"
   - The function syntax: 'key': () => `...`  (arrow function, backtick string)
   - Any syntax error earlier in the file that cuts off PANEL_CONTENT parsing

4. Fix the missing or malformed panel and re-run: node scripts/validate.js
```

---

## PROMPT 3 — Quiz Not Working

```
The quiz for course '{courseId}' isn't rendering / buttons don't work.

Check in order:
1. Quiz panel DOM IDs — they must be exactly:
   - id="quiz-container-{courseId}"
   - id="quiz-next-{courseId}"
   - id="quiz-score-{courseId}"
   - id="quiz-complete-{courseId}"
   Any deviation breaks the quiz engine.

2. Quiz data in COURSES array — the quiz: [] array must have at least 8 items,
   each with: q (string), options (array of 4 strings), correct (0-3), explanation (string)

3. onclick attributes in the quiz panel:
   - Next button: onclick="quizNext('{courseId}')"
   - Restart button: onclick="resetQuiz('{courseId}')"

Search for '{courseId}' in the quiz section of src/ai-academy.html and verify all four.
```

---

## PROMPT 4 — Tabs or Accordions Not Working

```
The tab switcher / accordion in panel '{courseId}:{moduleId}' isn't working.

Tab requirements:
- Each .tab-btn needs: onclick="switchTab(this, 'GROUP_ID', 'TARGET_ID')"
- GROUP_ID is the container div's id (e.g. 'ot1')
- TARGET_ID is the .tab-content div's id
- First tab-btn should have class "active", first tab-content should have class "active"
- Every tab-content div needs a unique id

Accordion requirements:
- Each .acc-header needs: onclick="toggleAcc(this)"
- The next sibling must be .acc-body
- No additional attributes required

Find the broken component and verify these attributes are correct.
```

---

## PROMPT 5 — Course Not Appearing in Sidebar

```
The new course '{courseId}' isn't showing in the top navigation bar.

Check:
1. The course object is in the COURSES array (not commented out)
2. status: 'available' (not 'coming-soon')
3. No JS syntax error before the course object in the COURSES array
   (an error earlier in the array can prevent the rest from parsing)

Run: node scripts/validate.js
If it reports a syntax error, fix that first. The sidebar is built from
COURSES at boot time — a parse error means the array never loads.
```

---

## PROMPT 6 — File Got Too Large / Performance Issues

```
The HTML file is now over 1MB and the browser is slow to load it.

Options in order of preference:
1. Split PANEL_CONTENT: move course panels into separate JS files loaded on demand
   (requires changing the architecture — discuss before implementing)

2. Minify HTML in panels: strip unnecessary whitespace from panel HTML strings
   (can reduce file size 15-20% with no quality loss)

3. Lazy-load courses: only load PANEL_CONTENT for courses that exist in the sidebar
   (already implemented — panels are lazy-rendered, not pre-rendered)

For option 2, run this to measure current redundant whitespace:
node -e "
const fs = require('fs');
const html = fs.readFileSync('src/ai-academy.html', 'utf8');
console.log('Total:', html.length, 'bytes');
console.log('Courses:', (html.match(/'[a-z]+:[a-z]+': \(\)/g) || []).length, 'panels');
"
```
