# TODO
- [x] LLM - Generation Parameters - add info from https://unstructured.io/insights/what-does-the-temperature-parameter-mean-in-llms as a Pro Tip link.  Make extra md source file.
  - Added a Pro Tip info-box (linking the article) right after the Seed accordion in `llm:params`. Source notes saved to `docs/sources/temperature.md`.
- [x] LLM - Running LLM models locally - include links to Windows install
  - Added a Windows-specific install info-box to `llm:localllm` (Ollama-for-Windows installer/PowerShell one-liner, LM Studio GUI, prebuilt llama.cpp Windows binaries) — the existing Quick Start only covered macOS/Linux/WSL.
- [x] LLM - Tokenization - add link to https://platform.openai.com/tokenizer as a Pro Tip link.  keep as md source file.
  - Added a Pro Tip link above the hands-on exercise in `llm:tokens`. Source notes saved to `docs/sources/tokenization.md`.
- [x] LLM - Attention - add link to https://arxiv.org/abs/1706.03762 as a Pro Tip link.
  - Added directly under the "2017 breakthrough" info-box in `llm:attention`.
- [x] LLM - Attention - add sample from https://towardsdatascience.com/what-are-query-key-and-value-in-the-transformer-architecture-and-why-are-they-used-acbe73f731f2/ for Query, Key Value description
  - Added the article's YouTube search (title=Key, video=Value, search box=Query) analogy as a new info-box after the Q/K/V list, with source link.
- [x] LLM - Attention - Hands On - Can this be a Jupyter Notebook example
  - Yes — created `docs/notebooks/attention-hands-on.ipynb`, a runnable NumPy version of the same 3-token by-hand exercise (plus the follow-up exercise), linked from the panel.
- [x] LLM - Attention - Multi-Head Attention - add for KV Cache - https://huggingface.co/blog/not-lain/kv-caching
  - Linked from the "Why this is in an inference module too" info-box in the Modern Attention Variants section.
- [x] LLM - Attention - Link to this site. https://magazine.sebastianraschka.com/p/the-big-llm-architecture-comparison#%C2%A723-olmo-2-summary
  - Added as a new Pro Tip box right after the attention-variants table.
- [x] LLM - Attention - Also review site for best explanations on Q, K, V
  - Reviewed; used its YouTube search analogy directly (see the TDS item above) rather than duplicating both sites.
- [x] LLM - Architecture - Link to this site as Pro Tip Link - https://sebastianraschka.com/llm-architecture-gallery/
  - Added as a Pro Tip box at the end of `llm:architecture`, after the dense-vs-MoE exercise.
- [x] LLM - Quantization - Explain GGUF deeper (GPT-Generated Unified Format).  https://medium.com/@vimalkansal/understanding-the-gguf-format-a-comprehensive-guide-67de48848256
  - Split the old single "GGUF quantization levels" accordion into two: a new "GGUF — the file format itself" accordion (what it bundles, GGML predecessor, Georgi Gerganov name origin, deeper-guide link) plus the original levels accordion.
- [x] LLM - Quantization - Add a screenshot of video with outlink - https://www.youtube.com/live/lnfWvX66FUk?si=3KL4C68F8qHUzPHY
  - Added the video's YouTube thumbnail image (linked) plus a "Watch on YouTube" link at the end of `llm:quantization`.
- [x] LLM - Training - Go Deeper - Add LM Studio - https://lmstudio.ai/
  - Added as a new card in the `llm:godeeper` resource grid.
- [x] LLM - Training - Knowledge check - the green text for answers is too difficult to read due to lack of contrast.  Make the text a dark green.
  - `.quiz-fb.correct` was using `#6DFFC0` (light mint) on a light page background — nearly unreadable. Changed to `var(--green)` (`#047857`), matching the already-legible `.quiz-opt.correct` color. This is a shared CSS rule, so the fix applies to every course's quiz, not just LLM.
- [x] LLM - Training - Knowledge check - Make the incorrect answers longer and slightly plausible
  - Rewrote all 42 wrong options across the LLM course's 14 quiz questions — each is now a full-length, plausible-but-incorrect distractor (e.g. describing a real-but-wrong concept) instead of a short one-liner.
- [x] LLM - Training - Quick Reference - Make it better, more visual.  lIke this:  https://pasqualepillitteri.it/uploads/img/news/llm-anatomy-infographic.webp  Make it printable.
  - Redesigned `llm:cheatsheet`: each card now has an icon and a distinct accent-colored top border. Added a "Print / Save as PDF" button plus `@media print` rules (hides sidebar/topbar, lays cards out in a single column) — the print rules are global so they'll benefit every course's cheatsheet, not just LLM's.

  **Verification:** all of the above were captured live from `src/ai-academy.html` via a headless-Chromium screenshot pass (`node scripts/validate.js` also passed, 162/162 panels). See the compiled screenshot doc: https://claude.ai/code/artifact/8ca5c360-5521-4dfe-b012-c211c1efd3e0
- [x] LLM - Attention - Have hands-on less open in https://jupyter.org/try-jupyter/lab/
  - The Hands-On info-box link now opens the notebook live in Try Jupyter (`https://jupyter.org/try-jupyter/lab/index.html?fromURL=<raw GitHub URL of docs/notebooks/attention-hands-on.ipynb>`) instead of just linking the static `.ipynb` file — one click runs it in-browser, no local Jupyter install needed. Kept a secondary "raw file" link for anyone who wants to download it into their own Jupyter instead.

  **Verification:** updated the same screenshot doc (re-captured the Attention panel, marked the new item with a "new" badge): https://claude.ai/code/artifact/8ca5c360-5521-4dfe-b012-c211c1efd3e0
- [x] LLM - Attention - The link does not open properly.  The GitHub URL is wrong - it should be https://github.com/btaira/ai-academy/blob/master/docs/notebooks/attention-hands-on.ipynb.  Ensure it opens to Jupyter.org
  - [x] Investigated end-to-end in a real browser before changing anything. The panel's current link (`https://jupyter.org/try-jupyter/lab/index.html?fromURL=https://raw.githubusercontent.com/btaira/ai-academy/master/docs/notebooks/attention-hands-on.ipynb`) **does work** — tested live, it opens Try Jupyter and loads the notebook's real content, prompting to select a kernel (screenshot in the verification doc).
  - [x] Tested the suggested replacement (the `github.com/.../blob/...` URL) the same way, and it **fails**: GitHub's blob page doesn't send CORS headers, so JupyterLite's `fromURL` fetch throws `TypeError: Failed to fetch` (confirmed via console error in the test). Swapping to it would have broken the link, not fixed it.
  - [x] Kept the working `raw.githubusercontent.com` URL as-is. If the link still doesn't open for you, it's likely a transient issue (e.g. GitHub's raw-content CDN briefly lagging right after a push) rather than a wrong URL — try again in a minute, or let me know what error you actually see in the browser console.

  **Verification:** added the live end-to-end test screenshot (Try Jupyter successfully loading the real notebook) to the same doc: https://claude.ai/code/artifact/8ca5c360-5521-4dfe-b012-c211c1efd3e0
- [x] LLM - Attention - "Raw file" hands-on link resolved to https://btaira.github.io/docs/notebooks/attention-hands-on.ipynb instead of the real file
  - [x] Root cause: the app is being viewed via GitHub Pages (`btaira.github.io`), where `src/ai-academy.html` is served from the site root rather than from `src/`. The three links I'd written as relative paths (`../docs/sources/temperature.md`, `../docs/sources/tokenization.md`, `../docs/notebooks/attention-hands-on.ipynb`) assumed the file's on-disk location, so `..` collapsed at the domain root instead of climbing into `docs/` — exactly the broken URL reported. These worked fine when opening the file directly (`file://`) locally, which is why the earlier verification pass didn't catch it.
  - [x] Fixed all three to absolute GitHub blob URLs (`https://github.com/btaira/ai-academy/blob/master/docs/...`), which resolve correctly regardless of how/where the HTML is hosted. Verified all three render with the correct `href` in a live browser check, and all three URLs return HTTP 200.

  **Verification:** `node scripts/validate.js` passed (162/162 panels); see https://claude.ai/code/artifact/8ca5c360-5521-4dfe-b012-c211c1efd3e0
- At Prompting - Structured Output
- [ ] API - Add link to: https://developers.openai.com/api/docs, https://platform.claude.com/docs/en/home,
- [ ] Scrape this article and include it somewhere most valuable: https://www.fastcompany.com/91568873/stop-asking-employees-to-adopt-ai
