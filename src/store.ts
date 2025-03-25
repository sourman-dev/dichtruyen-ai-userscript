import * as vanX from "vanjs-ext";
import van from "vanjs-core";
import { getSystemPrompt, getAiProviders } from "./utils";
import type { PromptItem, AiProvider, AppState } from "./types";
import { GM } from "$";

const APP_VERSION = "v0.0.2";

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
};

let initialState: typeof DEFAULT_SETTINGS;

export const settingsState = vanX.reactive(DEFAULT_SETTINGS);

export const appState = vanX.reactive({
  currentView: "empty",
  isTranslating: false,
  openReaderConfig: false
} as AppState);

export async function initStore() {
  const savedState = await GM.getValue("dichtruyen-ai");
  // const releaseData = await getRelease(true);
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
  } else {
    const parsedState = JSON.parse(savedState);
    if (!parsedState.version || parsedState.version !== APP_VERSION) {
      try {
        const defaultSettings = DEFAULT_SETTINGS;
        const systemPrompt = await getSystemPrompt();
        defaultSettings.prompt.systemPrompts.push({
          id: "default-0",
          name: "Default",
          content: systemPrompt,
          selected: true,
        });
        initialState = Object.assign({}, parsedState, defaultSettings);
      } catch (error) {
        console.error("Failed to fetch remote prompt:", error);
        initialState = Object.assign({}, parsedState, DEFAULT_SETTINGS);
      }
    } else {
      initialState = parsedState;
    }
  }
  // const API_KEYS: Partial<AiProviderItem>[] = getGlobalVal() || [];
  // // console.log(API_KEYS);
  // if (API_KEYS.length > 0) {
  //   initialState.providers.forEach((p) => {
  //     const ak = API_KEYS.find((a) => a.name === p.name) as AiProviderItem | undefined;
  //     if (ak) {
  //       p.apiKey = ak.apiKey;
  //     }
  //   });
  // }
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

// export const saveGlobalVal = () => {
//   const currentAi = currentAiProvider();
//   if (currentAi) {
//     const apiKeys: { name: string | null }[] = JSON.parse(
//       GM_getValue("API_KEYS", "[]")
//     );
//     const existingIndex = apiKeys.findIndex((ak) => ak.name === currentAi.name);
//     if (existingIndex >= 0) {
//       apiKeys[existingIndex] = currentAi;
//     } else {
//       apiKeys.push(currentAi);
//     }
//     GM_setValue("API_KEYS", JSON.stringify(apiKeys));
//     console.info("Save global value");
//   }
// };

// const getGlobalVal = (key: string = "API_KEYS") => {
//   const val = GM_getValue(key);
//   return val ? JSON.parse(val) : null;
// };

export const replaceAppState = (newVal: Partial<AppState>) => {
  vanX.replace(appState, Object.assign(appState, newVal));
}

export const replaceReaderState = (newVal: Partial<typeof DEFAULT_SETTINGS.readerView>) => {
  vanX.replace(settingsState.readerView, Object.assign({},settingsState.readerView, newVal))
}