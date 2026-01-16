import type { ProviderPreset, AiProvider, AiProviderModel } from "../types";

// 10 pre-configured OpenAI-compatible providers
// User can edit baseUrl for any provider (e.g., proxy)
// baseUrl should end with path before /chat/completions (usually /v1)
export const DEFAULT_PROVIDERS: ProviderPreset[] = [
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModels: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    supportsModelsEndpoint: true,
    note: "Industry standard. Requires paid API key."
  },
  {
    id: "gemini",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModels: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
    supportsModelsEndpoint: false,
    note: "Free tier available. Get key from <a href='https://aistudio.google.com/apikey' target='_blank'>AI Studio</a>."
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModels: ["deepseek-chat", "deepseek-coder"],
    supportsModelsEndpoint: true,
    note: "Best for Chinese/Vietnamese. Very cost-effective."
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModels: ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"],
    supportsModelsEndpoint: true,
    note: "Fastest inference (LPU). Generous free tier."
  },
  {
    id: "together",
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    defaultModels: ["meta-llama/Llama-3-70b-chat-hf", "mistralai/Mixtral-8x7B-Instruct-v0.1"],
    supportsModelsEndpoint: true,
    note: "$25 free credit. Open-source models."
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    defaultModels: ["accounts/fireworks/models/llama-v3p1-70b-instruct", "accounts/fireworks/models/qwen2p5-72b-instruct"],
    supportsModelsEndpoint: true,
    note: "Fast inference. $1 free credit."
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModels: ["anthropic/claude-3.5-sonnet", "google/gemini-pro-1.5", "openai/gpt-4o"],
    supportsModelsEndpoint: true,
    note: "Aggregator: 70+ models. Access Claude, GPT-4, Gemini with one key."
  },
  {
    id: "mistral",
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModels: ["mistral-large-latest", "mistral-small-latest", "codestral-latest"],
    supportsModelsEndpoint: true,
    note: "European provider. GDPR compliant."
  },
  {
    id: "novita",
    name: "Novita.ai",
    baseUrl: "https://api.novita.ai/v3/openai",
    defaultModels: ["gpt-4o", "llama-3.1-70b-instruct", "qwen2.5-72b-instruct"],
    supportsModelsEndpoint: true,
    note: "Aggregator. $0.50 free credit."
  },
  {
    id: "custom",
    name: "Custom...",
    baseUrl: "",
    defaultModels: [],
    supportsModelsEndpoint: true,
    note: "Add any OpenAI-compatible API."
  }
];

// Convert preset to AiProvider format
export function presetToProvider(preset: ProviderPreset, apiKey: string = ""): AiProvider {
  const models: AiProviderModel[] = preset.defaultModels.map((m, i) => ({
    name: m,
    selected: i === 0
  }));

  return {
    name: preset.name,
    baseUrl: preset.baseUrl,
    apiKey: apiKey || null,
    selected: false,
    models,
    isCustom: preset.id === "custom",
    supportsModelsEndpoint: preset.supportsModelsEndpoint,
    note: preset.note
  };
}

// Get preset by name
export function getPresetByName(name: string): ProviderPreset | undefined {
  return DEFAULT_PROVIDERS.find(p => p.name === name);
}

// Get default models for a provider
export function getDefaultModels(providerName: string): string[] {
  const preset = getPresetByName(providerName);
  return preset?.defaultModels || [];
}
