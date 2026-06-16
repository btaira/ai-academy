# Prompts: Writing Panel Content

Use these prompts after the course registry is added and validated.

---

## PROMPT 1 — Write Panels for a Section

Write panels one section at a time. Paste this for each section:

```
Write panel content for the {Section Name} section of the {courseName} course.

COURSE ID: {courseid}
SECTION: {Section Name}
ACCENT COLOR: {#HEXHEX}

MODULES IN THIS SECTION:
{list each module: id, title, description from the content plan}

REQUIREMENTS FOR EACH PANEL:
- Opens with: <div class="panel" id="panel-{courseid}-{moduleid}">
- Breadcrumb: <div class="breadcrumb">{CourseName} › <span class="bc-accent">{Section}</span> › {Module Title}</div>
- H1 with: <h1>First Word <span class="hl">Rest of Title</span></h1>
- Lead paragraph (<p class="lead">) summarizing what this module covers
- At least one info-box with a key insight
- 2-4 substantial content sections using appropriate components
- Closes with: </div>`  (backtick + comma, on its own line)

ESCAPING RULES (critical — violations cause JS parse errors):
- Shell variables ${VAR} → &#36;{VAR}
- GitHub Actions ${{ expr }} → &#36;{{ expr }}
- Triple backticks → &#96;&#96;&#96;
- Inline backtick code → <code class="inline">text</code>

COMPONENTS TO USE FREELY:
- .card-grid / .card for feature overviews
- .code-block with <span class="code-label">// TITLE</span> for code
- .info-box (blue), .info-box.amber, .info-box.green, .info-box.red
- .accordion / .acc-header onclick="toggleAcc(this)" / .acc-body
- .tab-bar / .tab-btn / .tab-content (with switchTab)
- .data-table for comparisons
- .cap-list / .cap-icon / .cap-text for capability lists
- .checklist for bullet lists
- .flow-node.c-accent for diagrams
- .cheat-grid / .cheat-card for quick reference (cheatsheet module only)

PANEL KEYS FORMAT: 'courseid:moduleid': () => `...`

Output all panels for this section as a single JS block,
ready to be placed in the PANEL_CONTENT object.
```

---

## PROMPT 2 — Quiz Panel

Every course needs a quiz panel. Copy this exactly, substituting courseId:

```
Write the quiz panel for course ID: {courseid}

The quiz panel HTML is always identical in structure — only the course ID changes.
Use exactly this template:

'courseid:quiz': () => `<div class="panel" id="panel-courseid-quiz">
  <div class="breadcrumb">{CourseName} › <span class="bc-accent">{Last Section Name}</span> › Knowledge Check</div>
  <h1>Knowledge <span class="hl">Check</span></h1>
  <p class="lead">Test your understanding of {course topic summary}.</p>
  <div id="quiz-container-courseid"></div>
  <div class="quiz-controls">
    <button class="btn btn-primary" id="quiz-next-courseid" onclick="quizNext('courseid')" style="display:none">Next &rarr;</button>
    <button class="btn btn-outline" onclick="resetQuiz('courseid')">&#8635; Restart</button>
    <span class="quiz-score-disp" id="quiz-score-courseid"></span>
  </div>
  <div id="quiz-complete-courseid" style="display:none"></div>
</div>`,

Replace 'courseid' with the actual course ID throughout.
```

---

## PROMPT 3 — Inject Large Panel Sets

When panel content is too large for a single edit (>~80KB):

```
The panel content for {section} is too large for a single str_replace.
Write it to a temp file and inject it using the Python rfind pattern.

Steps:
1. Write the panel JS to /tmp/{courseid}_{section}_panels.js
2. Run this Python script to inject it:

python3 << 'EOF'
with open('src/ai-academy.html', 'r') as f:
    content = f.read()

with open('/tmp/{courseid}_{section}_panels.js', 'r') as f:
    panels = f.read()

marker = '}; // end PANEL_CONTENT'
idx = content.rfind(marker)
new_content = content[:idx] + panels + '\n\n' + content[idx:]

with open('src/ai-academy.html', 'w') as f:
    f.write(new_content)
print(f"Injected. Size: {len(new_content):,} chars")
EOF

3. Run: node scripts/validate.js
4. Check that the injected panels appear in the missing-panels list as resolved.
```

---

## PROMPT 4 — Fix Syntax Errors

When validate.js reports a syntax error:

```
node scripts/validate.js reported a JS syntax error. Help me fix it.

ERROR OUTPUT:
{paste the full error including the line number and snippet}

Common causes:
1. ${VAR} shell variable not escaped as &#36;{VAR}
2. ${{ }} GitHub Actions expression not escaped
3. Triple backtick ``` not replaced with &#96;&#96;&#96;
4. Raw backtick inside a code example in a panel string

Check the line number in /tmp/academy.js (extracted by validate.js)
and find the corresponding panel content in src/ai-academy.html.
Apply the appropriate escape and re-run validate.js.
```

---

## PROMPT 5 — Generate Missing Panel Keys List

```
Run node scripts/validate.js and show me which panel keys are still missing.
Then write the panels for those specific keys, following the panel content
conventions from CLAUDE.md.

Missing keys will look like: 'courseid:moduleid'
```

---

## Quality Checklist for Panel Content

Before considering panels done, verify each panel has:
- [ ] Correct panel ID: `panel-{courseid}-{moduleid}`
- [ ] Correct breadcrumb with bc-accent span
- [ ] H1 with hl span on part of the title
- [ ] Lead paragraph (`<p class="lead">`)
- [ ] At least one info-box
- [ ] Substantive content (not just a definition — include examples, patterns, code)
- [ ] No raw `${`, `` ` `` (backtick), or `${{` without escaping
- [ ] Closes with `</div>\`,` on its own line
