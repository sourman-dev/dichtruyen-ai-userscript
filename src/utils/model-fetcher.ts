import type { AiProvider, ModelCache, ModelsApiResponse } from "../types";
import { getDefaultModels } from "../constants/default-providers";
import { GM } from "$";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Cache key generator
function getCacheKey(provider: AiProvider): string {
  if (provider.isCustom) {
    // Hash baseUrl for custom providers
    return `models_cache_custom_${btoa(provider.baseUrl).slice(0, 16)}`;
  }
  return `models_cache_${provider.name.toLowerCase().replace(/\s+/g, "_")}`;
}

// Promisified GM.xmlHttpRequest
function gmFetch(options: {
  method: string;
  url: string;
  headers: Record<string, string>;
  timeout?: number;
}): Promise<{ status: number; responseText: string }> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: options.method as "GET" | "POST",
      url: options.url,
      headers: options.headers,
      timeout: options.timeout || REQUEST_TIMEOUT,
      onload: (response: { status: number; responseText: string }) =>
        resolve({
          status: response.status,
          responseText: response.responseText
        }),
      onerror: () => reject(new Error("Network error")),
      ontimeout: () => reject(new Error("Request timeout"))
    });
  });
}

// Get cached models from GM storage
async function getCachedModels(provider: AiProvider): Promise<string[] | null> {
  const key = getCacheKey(provider);
  const cached = await GM.getValue(key);

  if (!cached) return null;

  try {
    const data: ModelCache = JSON.parse(cached as string);
    if (Date.now() > data.expiresAt) {
      await GM.deleteValue(key);
      return null;
    }
    return data.models;
  } catch {
    await GM.deleteValue(key);
    return null;
  }
}

// Save models to cache
async function cacheModels(provider: AiProvider, models: string[]): Promise<void> {
  const key = getCacheKey(provider);
  const cache: ModelCache = {
    providerId: key,
    models,
    expiresAt: Date.now() + CACHE_TTL
  };
  await GM.setValue(key, JSON.stringify(cache));
}

// Clear cache for a provider
export async function clearModelCache(provider: AiProvider): Promise<void> {
  const key = getCacheKey(provider);
  await GM.deleteValue(key);
}

// Normalize baseUrl (only remove trailing slash, keep /v1 if present)
export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

// Ensure baseUrl ends with /v1 for OpenAI-compatible APIs
function ensureV1Path(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  // If already ends with /v1, /v1beta, /openai, etc. - keep as is
  if (/\/(v1|v1beta|openai)$/i.test(normalized)) {
    return normalized;
  }
  // Otherwise append /v1
  return `${normalized}/v1`;
}

// Fetch models from API
async function fetchModelsFromApi(provider: AiProvider): Promise<string[]> {
  const baseUrl = ensureV1Path(provider.baseUrl);

  const response = await gmFetch({
    method: "GET",
    url: `${baseUrl}/models`,
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json"
    },
    timeout: REQUEST_TIMEOUT
  });

  if (response.status === 401) {
    throw new Error("Invalid API key");
  }

  if (response.status === 403) {
    throw new Error("Quota exceeded or access forbidden");
  }

  if (response.status === 404) {
    throw new Error("Models endpoint not supported");
  }

  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: ModelsApiResponse = JSON.parse(response.responseText);

  // Extract model IDs, filter non-chat models
  return data.data
    .map((m) => m.id)
    .filter(
      (id) =>
        !id.includes("embed") && !id.includes("tts") && !id.includes("whisper")
    )
    .slice(0, 50); // Limit to 50 models
}

// Fetch result type
export interface FetchModelsResult {
  models: string[];
  fromCache: boolean;
  error?: string;
}

// Main export: fetch models with cache support
export async function fetchModels(
  provider: AiProvider,
  forceRefresh: boolean = false
): Promise<FetchModelsResult> {
  // Get default models for fallback
  const defaultModels = getDefaultModels(provider.name);

  // Check if provider supports models endpoint
  const supportsEndpoint = provider.supportsModelsEndpoint !== false;

  if (!supportsEndpoint) {
    return { models: defaultModels, fromCache: false };
  }

  // Require API key
  if (!provider.apiKey) {
    return {
      models: defaultModels,
      fromCache: false,
      error: "API key required"
    };
  }

  // Check cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cached = await getCachedModels(provider);
    if (cached && cached.length > 0) {
      return { models: cached, fromCache: true };
    }
  }

  // Fetch from API
  try {
    const models = await fetchModelsFromApi(provider);
    await cacheModels(provider, models);
    return { models, fromCache: false };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.warn(`Failed to fetch models for ${provider.name}:`, errorMessage);

    // Return defaults with error info
    return {
      models: defaultModels,
      fromCache: false,
      error: errorMessage
    };
  }
}

// Convert string array to AiProviderModel format
export function toProviderModels(
  modelIds: string[],
  selectedModel?: string
): Array<{ name: string; selected: boolean }> {
  return modelIds.map((id, index) => ({
    name: id,
    selected: selectedModel ? id === selectedModel : index === 0
  }));
}
