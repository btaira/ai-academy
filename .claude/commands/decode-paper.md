---
description: Decode a paper into the AI Academy papers library
argument-hint: <pdf path | txt path | arXiv id> [--links course-04/module-12]
allowed-tools: Bash(node tools/*), Read, Edit, Glob
---

Decode `$ARGUMENTS` into a record in the papers library.

Run this end to end without stopping to ask unless something actually fails.

1. Check `ANTHROPIC_API_KEY` is set. If not, stop and say so — don't proceed.
2. Run the decoder:
   ```
   node tools/decode-paper.mjs $ARGUMENTS
   ```
   It writes `src/papers/data/<id>.json` and updates `src/papers/data/index.json`.
3. Read the new record back. Check it against `tools/paper-schema.json` and against the
   quality bar in `CLAUDE.md`. Specifically:
   - Does at least one entry in `claims` cover limitations, caveats or something the
     paper is honest about? If every claim is a positive finding, the decode is
     incomplete — fix it by editing the record directly.
   - Do the `numbers` entries each have a real `c` (caveat) rather than a restatement
     of `m`? A number without its caveat is the failure mode this library exists to avoid.
   - Is `context` at least 500 words and does it contain the actual figures? It is the
     grounding for the Ask feature; a vague summary makes Ask useless.
   - Does `jargon` cover the terms a hardware or standards engineer would not know,
     rather than terms the paper itself defines in passing?
4. Fix anything that falls short by editing `src/papers/data/<id>.json` directly. Don't
   re-run the decoder for small problems — it costs a full set of API calls.
5. If `--links` was passed, confirm those module paths exist in the repo. Report any
   that don't rather than silently keeping a dead link.
6. Report: the id, the title, the counts (claims / concepts / sections / numbers /
   jargon), anything you edited and why, and the local URL
   `src/papers/paper.html?id=<id>`.

Do not commit. Leave the working tree for review.
