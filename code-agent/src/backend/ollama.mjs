import { DEFAULT_MODEL, OLLAMA_BASE_URL_CANDIDATES } from "./config.mjs";

let resolvedBaseUrl = null;

async function tryOllamaFetch(baseUrl, endpoint, init = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama request failed (${response.status}) at ${baseUrl}: ${body}`);
  }

  return response.json();
}

async function ollamaFetch(endpoint, init = {}) {
  const candidates = resolvedBaseUrl
    ? [resolvedBaseUrl, ...OLLAMA_BASE_URL_CANDIDATES.filter((candidate) => candidate !== resolvedBaseUrl)]
    : OLLAMA_BASE_URL_CANDIDATES;

  let lastError = null;
  for (const baseUrl of candidates) {
    try {
      const payload = await tryOllamaFetch(baseUrl, endpoint, init);
      resolvedBaseUrl = baseUrl;
      return payload;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("No Ollama endpoint could be reached.");
}

export async function listModels() {
  const payload = await ollamaFetch("/api/tags");
  return (payload.models ?? []).map((model) => ({
    name: model.name,
    size: model.size,
    modifiedAt: model.modified_at,
  }));
}

export async function chatJson({ model = DEFAULT_MODEL, messages }) {
  const payload = await ollamaFetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      options: {
        temperature: 0.2,
      },
      messages,
    }),
  });

  const raw = payload.message?.content?.trim() ?? "{}";
  return {
    raw,
    json: JSON.parse(raw),
  };
}

export async function chatText({ model = DEFAULT_MODEL, messages }) {
  const payload = await ollamaFetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      model,
      stream: false,
      options: {
        temperature: 0.2,
      },
      messages,
    }),
  });

  return payload.message?.content?.trim() ?? "";
}

export function getResolvedOllamaBaseUrl() {
  return resolvedBaseUrl;
}
