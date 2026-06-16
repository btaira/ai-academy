#!/usr/bin/env node
/**
 * AI Engineering Academy — Build Stats
 * 
 * Prints a summary of the Academy: courses, modules, panels, file size.
 * 
 * Usage: node scripts/build-stats.js
 */

const fs   = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '..', 'src', 'ai-academy.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

// Parse COURSES
let COURSES;
const coursesMatch = html.match(/const COURSES = (\[[\s\S]*?\]); \/\/ end COURSES/);
eval(`COURSES = ${coursesMatch[1]}`); // eslint-disable-line no-eval

// Count panels
const panelKeys = new Set(
  [...html.matchAll(/'([a-z][a-z0-9]*:[a-z][a-z0-9]*)'\s*:\s*\(\)/g)].map(m => m[1])
);

const available = COURSES.filter(c => c.status === 'available');

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║      AI Engineering Academy — Build Stats    ║');
console.log('╚══════════════════════════════════════════════╝\n');

let totalModules = 0;
available.forEach((c, i) => {
  const mods = c.sections.reduce((a, s) => a + s.modules.length, 0);
  totalModules += mods;
  console.log(`  ${String(i+1).padStart(2)}. [${c.id.padEnd(8)}] ${c.longTitle.padEnd(35)} ${String(mods).padStart(2)} modules`);
});

const fileSizeKB = (html.length / 1024).toFixed(1);
const fileSizeMB = (html.length / 1024 / 1024).toFixed(2);

console.log('\n──────────────────────────────────────────────');
console.log(`  Courses:    ${available.length}`);
console.log(`  Modules:    ${totalModules}`);
console.log(`  Panels:     ${panelKeys.size}`);
console.log(`  File size:  ${fileSizeKB} KB (${fileSizeMB} MB)`);
console.log('──────────────────────────────────────────────\n');

// Accent color inventory
console.log('  Accent colors in use:');
available.forEach(c => {
  console.log(`    ${c.accentColor}  ${c.id}`);
});
console.log();
