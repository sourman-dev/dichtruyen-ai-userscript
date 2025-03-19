export interface HistoryItem {
  url: string;
  title: string;
  timestamp: number;
}

export interface aiProvider{
  name: string;
  modelName: string;
  apiKey: string | null;
  temperature: number;
  selected: boolean;
}

export interface AppState {
    settings: {
      systemPrompt?: string;
      userPrompt?: string;
      aiProvider: aiProvider[];
    };
    history: HistoryItem[];
    readerView?: {
      backgroundColor?: string;
      fontFamily?: string;
      lineHeight?: string;
      fontSize?: number;
    };
}
