/* Bring-your-own-token client for publishing a decoded paper straight to GitHub.
 *
 * The token is stored in localStorage on this browser only, exactly like the
 * Anthropic key in claude-client.js — never committed, never sent anywhere but
 * api.github.com. Use a fine-grained personal access token scoped to just this
 * repo's Contents (read and write), not a classic token with broad "repo" scope.
 *
 * Writes go through the Contents API (one file = one commit each). That's two
 * small commits per paper (the record, then the index) rather than one atomic
 * commit — simpler and more robust than assembling a tree via the Git Data API,
 * at the cost of a brief window where the record exists but isn't indexed yet
 * if the second call fails.
 */

const TOKEN_STORE = "ai-academy.github-token";
const REPO_STORE = "ai-academy.github-repo";
const BRANCH_STORE = "ai-academy.github-branch";
const DEFAULT_REPO = "btaira/ai-academy";
const DEFAULT_BRANCH = "master";

export const githubStore = {
  get: () => { try { return localStorage.getItem(TOKEN_STORE) || ""; } catch { return ""; } },
  set: (v) => { try { localStorage.setItem(TOKEN_STORE, v.trim()); return localStorage.getItem(TOKEN_STORE) === v.trim(); } catch { return false; } },
  clear: () => { try { localStorage.removeItem(TOKEN_STORE); } catch {} },
  has: () => !!githubStore.get(),
  repo: () => { try { return localStorage.getItem(REPO_STORE) || DEFAULT_REPO; } catch { return DEFAULT_REPO; } },
  setRepo: (v) => { try { localStorage.setItem(REPO_STORE, v.trim() || DEFAULT_REPO); } catch {} },
  branch: () => { try { return localStorage.getItem(BRANCH_STORE) || DEFAULT_BRANCH; } catch { return DEFAULT_BRANCH; } },
  setBranch: (v) => { try { localStorage.setItem(BRANCH_STORE, v.trim() || DEFAULT_BRANCH); } catch {} }
};

export class NoGitHubTokenError extends Error {
  constructor() { super("No GitHub token set on this browser."); this.name = "NoGitHubTokenError"; }
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

function utf8ToBase64(str) {
  return bytesToBase64(new TextEncoder().encode(str));
}

function base64ToUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

async function gh(path, opts = {}) {
  const token = githubStore.get();
  if (!token) throw new NoGitHubTokenError();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    return await fetch(`https://api.github.com${path}`, {
      ...opts,
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opts.body ? { "content-type": "application/json" } : {}),
        ...(opts.headers || {})
      }
    });
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Timed out talking to api.github.com after 30s.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function apiError(res, detail) {
  if (res.status === 401) return "GitHub token rejected. Check it in key settings.";
  if (res.status === 403) return "GitHub token doesn't have write access to this repo — needs a fine-grained token scoped to this repo's Contents (read and write).";
  if (res.status === 404) return `Repo or branch not found — check "${githubStore.repo()}" @ "${githubStore.branch()}" in key settings.`;
  return detail;
}

// Reads a file from the repo. Returns { sha, content } or null if it doesn't exist.
export async function readFile(path) {
  const res = await gh(`/repos/${githubStore.repo()}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(githubStore.branch())}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    let detail = res.status + "";
    try { const j = await res.json(); detail = j?.message || detail; } catch {}
    throw new Error(apiError(res, detail));
  }
  const j = await res.json();
  return { sha: j.sha, content: base64ToUtf8(j.content) };
}

// Creates or updates one file as its own commit. `content` is a UTF-8 string
// for text files, or a Uint8Array/ArrayBuffer for binary ones (e.g. a
// rendered figure image) — either way it goes to GitHub as base64. Pass `sha`
// when updating an existing file (from a prior readFile) — omit it to create
// a new one.
export async function writeFile(path, content, message, sha) {
  const bytes = content instanceof ArrayBuffer ? new Uint8Array(content) : content;
  const base64 = bytes instanceof Uint8Array ? bytesToBase64(bytes) : utf8ToBase64(content);
  const res = await gh(`/repos/${githubStore.repo()}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: base64,
      branch: githubStore.branch(),
      ...(sha ? { sha } : {})
    })
  });
  if (!res.ok) {
    let detail = res.status + "";
    try { const j = await res.json(); detail = j?.message || detail; } catch {}
    throw new Error(apiError(res, detail));
  }
  const j = await res.json();
  return { commitSha: j.commit?.sha || "", commitUrl: j.commit?.html_url || "" };
}
