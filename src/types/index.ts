export interface PromptItem {
  id: string;
  name: string;
  content: string | null;
  selected: boolean;
}

export interface HistoryItem {
  url: string;
  title: string;
  cachedAt: number;
  previous?: string | null;
  next?: string | null;
}

export interface AiProviderModel {
  name: string;
  selected: boolean;
}

export interface AiProvider {
  name: string;
  baseUrl: string;
  models: AiProviderModel[];
  apiKey: string | null;
  selected: boolean;
  note?: string | null;
  // Custom provider support
  isCustom?: boolean;
  supportsModelsEndpoint?: boolean;
}

// Provider preset for hardcoded defaults
export interface ProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  defaultModels: string[];
  supportsModelsEndpoint: boolean;
  note?: string;
}

// Model cache for GM storage
export interface ModelCache {
  providerId: string;
  models: string[];
  expiresAt: number;
}

// Response from /v1/models API
export interface ModelsApiResponse {
  object: "list";
  data: Array<{
    id: string;
    object: "model";
    created?: number;
    owned_by?: string;
  }>;
}

export interface AiProviderItem {
  name: string;
  model: string;
  apiKey: string | null;
  baseUrl: string;
}

export interface AppState {
  currentView: string;
  isTranslating: boolean;
  openReaderConfig: boolean;
}

export interface OpenAIOptions {
  baseURL: string;
  apiKey: string;
  data: any;
}

export interface FetchCachedOption {
  apiURL: string;
  apiType: string;
  parseJSON?: boolean;
  nameOfCache: string;
  needProcess?: boolean;
}

export interface Segment {
  content: string; // Nội dung đoạn cần dịch
  context?: string; // Ngữ cảnh từ các đoạn trước (nếu có)
}