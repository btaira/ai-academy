#!/usr/bin/env node
// Headless-Chromium REPL driver for src/ai-academy.html (a static file — no server).
// Commands are read one per line from stdin. Mirrors the chromium-cli command
// vocabulary (nav/click/screenshot/console) so the same mental model applies
// even though this repo has no chromium-cli install and uses Playwright directly.
//
// Usage:
//   NODE_PATH=/opt/node22/lib/node_modules node driver.cjs <<'EOF'
//   nav
//   wait 300
//   screenshot home
//   click Docker + AI
//   wait 200
//   click Knowledge Check
//   wait 200
//   screenshot quiz
//   console
//   EOF
//
// Screenshots land in ./screenshots/<name>.png next to this file.

const path = require('path');
const readline = require('readline');
const { chromium } = require('playwright');

const HTML_PATH = path.join(__dirname, '..', '..', '..', 'src', 'ai-academy.html');
const SHOT_DIR = path.join(__dirname, 'screenshots');
const FILE_URL = 'file://' + HTML_PATH;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

  const rl = readline.createInterface({ input: process.stdin, terminal: false });

  for await (const raw of rl) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [cmd, ...rest] = line.split(' ');
    const arg = rest.join(' ');

    try {
      if (cmd === 'nav') {
        await page.goto(FILE_URL);
        console.log(`[nav] ${FILE_URL}`);
      } else if (cmd === 'wait') {
        await page.waitForTimeout(parseInt(arg, 10) || 300);
        console.log(`[wait] ${arg}ms`);
      } else if (cmd === 'click') {
        await page.click(`text=${arg}`);
        console.log(`[click] "${arg}"`);
      } else if (cmd === 'screenshot') {
        const file = path.join(SHOT_DIR, `${arg || 'shot'}.png`);
        await page.screenshot({ path: file });
        console.log(`[screenshot] ${file}`);
      } else if (cmd === 'h1') {
        // Old panels stay in the DOM (hidden) after navigation, so
        // `.panel h1` alone grabs whichever one rendered first. Filter to
        // the one actually visible.
        const text = await page.locator('.panel:visible h1').first().innerText();
        console.log(`[h1] ${text}`);
      } else if (cmd === 'console') {
        console.log(`[console-errors] ${JSON.stringify(consoleErrors)}`);
      } else {
        console.log(`[?] unknown command: ${line}`);
      }
    } catch (err) {
      console.log(`[error] ${cmd} ${arg} -> ${err.message}`);
    }
  }

  await browser.close();
}

main();
