import * as vanX from "vanjs-ext";
import van from "vanjs-core";
import { getSystemPrompt, getAiProviders, getRelease } from "./utils";
import type { PromptItem, AiProvider, AppState } from "./types";
import { GM } from "$";

const APP_VERSION = __APP_VERSION__;

export const DEFAULT_SETTINGS = {
  version: APP_VERSION,
  prompt: {
    systemPrompts: [] as PromptItem[],
    userPrompts: [
      {
        id: "default-0",
        name: "Default",
        content: "",
        selected: true,
      },
    ] as PromptItem[],
    // extractorLink: ""
  },
  providers: [] as unknown as AiProvider[],
  readerView: {
    backgroundColor: "#F4F4F4",
    fontFamily: "system-ui",
    lineHeight: "1.2",
    fontSize: 18,
    bionicReading: false,
    includeTitle: false,
  },
  isVietPharseFirst: false
};

let initialState: typeof DEFAULT_SETTINGS;

export const settingsState = vanX.reactive(DEFAULT_SETTINGS);

export const appState = vanX.reactive({
  currentView: "empty",
  isTranslating: false,
  openReaderConfig: false
} as AppState);



export const mergeProviders = async (
  oldVal: typeof DEFAULT_SETTINGS,
) => {
  const aiProviders = await getAiProviders(true);
  if (aiProviders?.providers) {
    oldVal.providers = aiProviders.providers.map((newProvider: AiProvider) => {
      const existingProvider = oldVal.providers.find(
        (p: AiProvider) => p.name === newProvider.name
      );
      if (
        existingProvider &&
        (existingProvider.apiKey || existingProvider.selected)
      ) {
        return {
          ...newProvider,
          apiKey: existingProvider.apiKey,
          selected: existingProvider.selected,
        } as AiProvider;
      }
      return newProvider;
    });
  }
  return oldVal;
};

export const mergeSystemPrompt = async (oldVal: typeof DEFAULT_SETTINGS) => {
  const systemPrompt = await getSystemPrompt(true);
  // Update default system prompt
  const defaultPrompt = oldVal.prompt.systemPrompts.find(
    (p) => p.id === "default-0"
  );
  if (defaultPrompt) {
    defaultPrompt.content = systemPrompt;
  } else {
    oldVal.prompt.systemPrompts.push({
      id: "default-0",
      name: "Default",
      content: systemPrompt,
      selected: true,
    });
  }
  return oldVal;
};

export const replaceAppState = (newVal: Partial<AppState>) => {
  vanX.replace(appState, Object.assign(appState, newVal));
}

export const replaceReaderState = (newVal: Partial<typeof DEFAULT_SETTINGS.readerView>) => {
  vanX.replace(settingsState.readerView, Object.assign({},settingsState.readerView, newVal))
}

export async function initStore() {
  const savedState = await GM.getValue("dichtruyen-ai");
  const releaseData = await getRelease(true);
  
  // console.log(aiProviders)
  
  // console.log(releaseData)
  if (!savedState) {
    const systemPrompt = await getSystemPrompt();
    const defaultSettings = DEFAULT_SETTINGS;
    defaultSettings.prompt.systemPrompts.push({
      id: "default-0",
      name: "Default",
      content: systemPrompt,
      selected: true,
    });
    // defaultSettings.prompt.extractorLink = await getExtractorPrompt();
    const aiProviders = await getAiProviders();
    defaultSettings.providers = aiProviders?.providers;

    initialState = defaultSettings;
    console.log(initialState)
  } else {
    let parsedState = JSON.parse(savedState) as typeof DEFAULT_SETTINGS;
    
    const isBug = parsedState.prompt.systemPrompts.length ==0 || parsedState.providers.length === 0
    if (parsedState.version !== releaseData.version || isBug) {
      // console.log(parsedState)
      try {
        // const defaultSettings = DEFAULT_SETTINGS;
        parsedState.version = releaseData.version;
        parsedState = await mergeSystemPrompt(parsedState);
        parsedState = await mergeProviders(parsedState);
        
        initialState = parsedState;
        console.log(initialState)
      } catch (error) {
        console.error("Failed to fetch remote prompt:", error);
        // initialState = Object.assign({}, parsedState, DEFAULT_SETTINGS);
      }
    } else {
      initialState = parsedState;
    }
  }

  vanX.replace(settingsState, initialState);
  van.derive(async () => {
    console.log('Saved setting', new Date().toUTCString())
    // console.log(vanX.compact(settingsState.readerView))
    await GM.setValue(
      "dichtruyen-ai",
      JSON.stringify(vanX.compact(settingsState))
    );
  });
}