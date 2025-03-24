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

  export interface AiProvider{
    name: string;
    baseUrl: string;
    models: [AiProviderModel];
    apiKey: string | null;
    selected: boolean;
  }
  
  export interface AiProviderItem{
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
  