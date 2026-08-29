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
const DEFAULT_MODEL = "claude-sonnet-4-6";

export const keyStore = {
  get: () => { try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; } },
  set: (v) => { try { localStorage.setItem(KEY_STORE, v.trim()); } catch {} },
  clear: () => { try { localStorage.removeItem(KEY_STORE); } catch {} },
  has: () => !!keyStore.get(),
  model: () => { try { return localStorage.getItem(MODEL_STORE) || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; } },
  setModel: (v) => { try { localStorage.setItem(MODEL_STORE, v.trim() || DEFAULT_MODEL); } catch {} }
};

export class NoKeyError extends Error {
  constructor() { super("No API key set on this browser."); this.name = "NoKeyError"; }
}

export async function callClaude(system, messages, { maxTokens = 1200 } = {}) {
  const key = keyStore.get();
  if (!key) throw new NoKeyError();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({ model: keyStore.model(), max_tokens: maxTokens, system, messages })
  });

  if (!res.ok) {
    let detail = res.status + "";
    try { const j = await res.json(); detail = j?.error?.message || detail; } catch {}
    if (res.status === 401) detail = "Key rejected. Check it in Settings.";
    throw new Error(detail);
  }

  const data = await res.json();
  return (data.content || []).map(b => (b.type === "text" ? b.text : "")).join("\n").trim();
}
