# Prompts: New Course Planning & Registry

Use these prompts in sequence when adding a new course.

---

## PROMPT 1 — Plan the Course Structure

Paste this into Claude Code, fill in the blanks:

```
I want to add a new course to the AI Engineering Academy.

TOPIC: {course topic, e.g. "AI Observability & Monitoring"}
AUDIENCE: {who is this for, e.g. "engineers running LLM apps in production"}
GOAL: {what should learners be able to do after this course?}

Design a course structure with:
- A course ID (3-6 char slug, lowercase)
- A short title (≤12 chars for sidebar)
- An accent color (hex) NOT in this list:
  #00D4FF #FFB347 #4EEEA8 #2DD4BF #A78BFA #F472B6
  #FB923C #38BDF8 #F59E0B #34D399 #60A5FA
- 3-4 sections with 3-4 modules each
- A Training section at the end with: impl (Host Setup Guides), quiz, cheatsheet
- 8-10 quiz questions covering the key concepts

Format the output as:
1. The course registry JS object (ready to paste into COURSES array)
2. A module list with brief descriptions (what each panel should cover)
3. The CSS accent class line

Reference: existing courses in docs/course-registry.md
```

---

## PROMPT 2 — Add to the File

After reviewing the planned structure:

```
Add this new course to src/ai-academy.html.

COURSE REGISTRY OBJECT:
{paste the output from Prompt 1}

Steps to complete:
1. Add the CSS accent class after the last .ca-* line in the <style> block
2. Add the course registry object before ]; // end COURSES
3. Do NOT add panel content yet — we'll do that separately

After making the changes, run: node scripts/validate.js
The validation will report "MISSING" panels — that's expected at this stage.
```

---

## PROMPT 3 — Verify Registry Addition

```
Run node scripts/validate.js and show me the output.
It should show:
- ✓ Syntax clean
- A list of MISSING panels (one per module we just registered)
- The total course count should now be {N+1}

If there are JS syntax errors, diagnose and fix them before proceeding.
```

---

## PROMPT 4 — Plan Panel Content in Detail

```
For the new {courseName} course, plan the detailed content for each panel.

MODULE LIST:
{paste the module list from Prompt 1}

For each module, write:
- A one-paragraph description of what the panel covers
- 3-5 key concepts or topics to include
- Any code examples, diagrams, or tables that would be valuable
- The appropriate CSS components to use (card-grid, accordion, tab-bar, code-block, etc.)

This plan will guide panel writing in the next step.
```

---

## Notes

- Always validate after adding the registry (Step 3) before writing panels
- The validate script tells you exactly which panel keys are missing
- Panel writing is in `prompts/new-panels.md`
- Common pitfall: forgetting the quiz and cheatsheet module IDs in the registry
