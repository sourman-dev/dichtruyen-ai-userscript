import * as vanX from "vanjs-ext";
import van from "vanjs-core";
import { TranslateButton } from "./button";
import { getSystemPrompt } from "./utils";
const APP_VERSION = "0.0.1";

const DEFAULT_SETTINGS = JSON.stringify({
  version: APP_VERSION,
  settings: {
    userPrompt: "",
    aiProvider: [
      {
        name: "Google",
        modelName: "gemini-2.0-flash",
        apiKey: null,
        temperature: 0.0,
        selected: true
      },
      {
        name: "Qwen",
        modelName: "qwen-max-latest",
        apiKey: null,
        temperature: 0.0,
        selected: false
      },
    ],
  },
  readerView: {
    backgroundColor: "#F4F4F4",
    fontFamily: "system-ui",
    lineHeight: "1.6",
    fontSize: 16,
    bionicReading: false,
  },
  history: [],
});

const mergeConfigs = (oldConfig: any, defaultConfig: any) => {
  const merged = { ...defaultConfig };

  // Merge settings while preserving user customizations
  if (oldConfig.settings) {
    merged.settings = {
      ...defaultConfig.settings,
      ...oldConfig.settings,
    };
  }

  // Merge readerView settings
  if (oldConfig.readerView) {
    merged.readerView = {
      ...defaultConfig.readerView,
      ...oldConfig.readerView,
    };
  }

  // Preserve history
  if (oldConfig.history) {
    merged.history = oldConfig.history;
  }

  // Update version
  merged.version = APP_VERSION;

  return merged;
};

const savedState = localStorage.getItem("doctruyenState");
let initialState;

if (savedState) {
  const parsedState = JSON.parse(savedState);
  if (!parsedState.version || parsedState.version !== APP_VERSION) {
    // Version mismatch - merge configurations
    try {
      const defaultSettings = JSON.parse(DEFAULT_SETTINGS);
      defaultSettings.settings.systemPrompt = await getSystemPrompt();
      initialState = mergeConfigs(parsedState, defaultSettings);
    } catch (error) {
      console.error("Failed to fetch remote prompt:", error);
      initialState = mergeConfigs(parsedState, JSON.parse(DEFAULT_SETTINGS));
    }
  } else {
    initialState = parsedState;
  }
} else {
  const defaultSettings = JSON.parse(DEFAULT_SETTINGS);
  defaultSettings.settings.systemPrompt = await getSystemPrompt();
  initialState = defaultSettings;
}

const appState = vanX.reactive(initialState);

van.derive(() =>
  localStorage.setItem("doctruyenState", JSON.stringify(vanX.compact(appState)))
);

document.body.append(TranslateButton(appState));
