/* Bring-your-own-key client for the live "go deeper" / lookup / ask features.
 *
 * The key is stored in localStorage on this browser only. It is never committed,
 * never sent anywhere except api.anthropic.com, and every static visitor to the
 * public site simply sees these controls disabled until they add their own.
 *
 * Direct browser calls require the dangerous-direct-browser-access header.
 * That is fine for a personal key on your own machine. Do not paste an
 * organisation key into a shared computer.
 */

const KEY_STORE = "ai-academy.anthropic-key";
const MODEL_STORE = "ai-academy.anthropic-model";
const WORKSPACE_STORE = "ai-academy.anthropic-workspace";
const DEFAULT_MODEL = "claude-sonnet-4-6";

export const keyStore = {
  get: () => { try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; } },
  // Returns true on success, false if this browser is blocking/restricting storage —
  // callers should surface that rather than let the save silently no-op.
  set: (v) => { try { localStorage.setItem(KEY_STORE, v.trim()); return localStorage.getItem(KEY_STORE) === v.trim(); } catch { return false; } },
  clear: () => { try { localStorage.removeItem(KEY_STORE); } catch {} },
  has: () => !!keyStore.get(),
  model: () => { try { return localStorage.getItem(MODEL_STORE) || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; } },
  setModel: (v) => { try { localStorage.setItem(MODEL_STORE, v.trim() || DEFAULT_MODEL); } catch {} },
  // Some Anthropic API keys are "identity-linked" and scoped to a person rather than a
  // single workspace — those require the workspace to act in named on every request.
  // Legacy workspace-scoped keys don't need this at all, so it's optional.
  workspace: () => { try { return localStorage.getItem(WORKSPACE_STORE) || ""; } catch { return ""; } },
  setWorkspace: (v) => { try { localStorage.setItem(WORKSPACE_STORE, v.trim()); } catch {} }
};

export class NoKeyError extends Error {
  constructor() { super("No API key set on this browser."); this.name = "NoKeyError"; }
}

export async function callClaude(system, messages, { maxTokens = 1200 } = {}) {
  const key = keyStore.get();
  if (!key) throw new NoKeyError();

  const headers = {
    "content-type": "application/json",
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true"
  };
  const workspace = keyStore.workspace();
  if (workspace) headers["anthropic-workspace-id"] = workspace;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({ model: keyStore.model(), max_tokens: maxTokens, system, messages })
  });

  if (!res.ok) {
    let detail = res.status + "";
    try { const j = await res.json(); detail = j?.error?.message || detail; } catch {}
    if (res.status === 401) detail = "Key rejected. Check it in Settings.";
    else if (!workspace && /workspace/i.test(detail)) detail = "This key needs a workspace id — find it at console.anthropic.com → Settings → Workspaces, add it under key settings, then try again.";
    throw new Error(detail);
  }

  const data = await res.json();
  return (data.content || []).map(b => (b.type === "text" ? b.text : "")).join("\n").trim();
}
