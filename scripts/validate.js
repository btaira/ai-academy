#!/usr/bin/env node
/**
 * AI Engineering Academy — Validation Script
 * 
 * Checks:
 * 1. JS syntax (node --check on the script block)
 * 2. Every module in COURSES has a matching panel in PANEL_CONTENT
 * 3. Reports stats: courses, modules, file size
 * 
 * Usage: node scripts/validate.js
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HTML_PATH = path.join(__dirname, '..', 'src', 'ai-academy.html');
const TMP_JS    = '/tmp/academy-validate.js';

// ── 1. Load the file ──────────────────────────────────────────────────────
if (!fs.existsSync(HTML_PATH)) {
  console.error(`✗ File not found: ${HTML_PATH}`);
  console.error('  Make sure you are running from the project root.');
  process.exit(1);
}

const html = fs.readFileSync(HTML_PATH, 'utf8');
console.log(`\n── AI Engineering Academy Validator ──`);
console.log(`File: ${HTML_PATH}`);
console.log(`Size: ${(html.length / 1024).toFixed(1)} KB\n`);

// ── 2. Extract the script block ───────────────────────────────────────────
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('✗ Could not find <script> block in HTML');
  process.exit(1);
}

fs.writeFileSync(TMP_JS, scriptMatch[1]);

// ── 3. Syntax check ───────────────────────────────────────────────────────
let syntaxOk = false;
try {
  execSync(`node --check ${TMP_JS}`, { stdio: 'pipe' });
  console.log('✓ JS syntax: clean');
  syntaxOk = true;
} catch (err) {
  console.error('✗ JS SYNTAX ERROR:');
  console.error(err.stderr.toString());
  console.error('\nCommon causes:');
  console.error('  • ${VAR} in panel HTML → escape as &#36;{VAR}');
  console.error('  • ${{ }} GitHub Actions expr → escape as &#36;{{ }}');
  console.error('  • Triple backticks → use &#96;&#96;&#96;');
  console.error('  • Raw backtick in panel content → use <code class="inline">text</code>');
  process.exit(1);
}

// ── 4. Extract COURSES and PANEL_CONTENT ─────────────────────────────────
let COURSES;
try {
  const coursesMatch = scriptMatch[1].match(/const COURSES = (\[[\s\S]*?\]); \/\/ end COURSES/);
  if (!coursesMatch) throw new Error('COURSES array not found');
  eval(`COURSES = ${coursesMatch[1]}`); // eslint-disable-line no-eval
} catch (e) {
  console.error('✗ Could not parse COURSES array:', e.message);
  process.exit(1);
}

const panelKeyPattern = /'([a-z][a-z0-9]*:[a-z][a-z0-9]*)'\s*:\s*\(\)/g;
const panelKeys = new Set();
let m;
while ((m = panelKeyPattern.exec(html)) !== null) {
  panelKeys.add(m[1]);
}

// ── 5. Cross-validate ─────────────────────────────────────────────────────
const available = COURSES.filter(c => c.status === 'available');
const comingSoon = COURSES.filter(c => c.status !== 'available');

console.log(`\nCourses: ${COURSES.length} total (${available.length} available, ${comingSoon.length} coming-soon)`);
console.log(`Panels:  ${panelKeys.size} panel keys found\n`);

let totalModules = 0;
let missingPanels = [];
let allGood = true;

available.forEach(course => {
  const courseMissing = [];
  let courseModules = 0;

  course.sections.forEach(section => {
    section.modules.forEach(mod => {
      courseModules++;
      totalModules++;
      const key = `${course.id}:${mod.id}`;
      if (!panelKeys.has(key)) {
        courseMissing.push(key);
        missingPanels.push(key);
        allGood = false;
      }
    });
  });

  const status = courseMissing.length === 0 ? '✓' : '✗';
  const detail = courseMissing.length > 0
    ? ` (${courseMissing.length} missing panels)`
    : ` (${courseModules} modules)`;
  console.log(`  ${status} [${course.id}] ${course.longTitle}${detail}`);

  if (courseMissing.length > 0) {
    courseMissing.forEach(k => console.log(`      ↳ missing: '${k}'`));
  }
});

if (comingSoon.length > 0) {
  console.log(`\n  ○ Coming soon: ${comingSoon.map(c => c.id).join(', ')}`);
}

// ── 6. Summary ────────────────────────────────────────────────────────────
console.log(`\n── Summary ──────────────────────────────────────────────`);
console.log(`  Courses:       ${available.length}`);
console.log(`  Total modules: ${totalModules}`);
console.log(`  Panel keys:    ${panelKeys.size}`);
console.log(`  File size:     ${(html.length / 1024).toFixed(1)} KB`);

if (allGood) {
  console.log(`\n✓ All panels matched. Academy is valid.\n`);
} else {
  console.log(`\n✗ ${missingPanels.length} panels missing. Add them to PANEL_CONTENT.\n`);
  process.exit(1);
}
