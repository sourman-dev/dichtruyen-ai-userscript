// import { textVide } from "text-vide";
import { oneLine, stripIndent } from "common-tags";
import { addToHistory } from "./cached";
import type { FetchCachedOption, HistoryItem } from "./types";
import { replaceAppState, settingsState } from "./store";
import { openAICompletion } from "./ai";
import { GM } from "$";
// import van from "vanjs-core";

export async function fetchApi(url: string, returnType: string = "json") {
  try {
    const response = await fetch(url);
    const data =
      returnType === "json" ? await response.json() : await response.text();
    return data;
  } catch (error) {
    throw new Error(`Fetch error: ${error}`);
  }
}

async function fetchAndCached(options: FetchCachedOption, isForced: boolean = false){
  const { apiURL, apiType, nameOfCache } = options;
  const lastCheck = await GM.getValue(`${nameOfCache}-check`);
  const cached = await GM.getValue(nameOfCache);
  const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  if (isForced || !lastCheck || !cached || Date.now() - lastCheck > twelveHours) {
    try {
      let data = await fetchApi(apiURL, apiType);
      if(options.parseJSON){
        data = data ? JSON.parse(data) : null
      }
      // const releaseData = {
      //   version: data.tag_name,
      //   description: data.body,
      //   fileUrl: data.assets[0]?.browser_download_url || null
      // };

      if(data){
        await GM.setValue(nameOfCache, options.parseJSON ? JSON.stringify(data): data);
        await GM.setValue(`${nameOfCache}-check`, Date.now());
      }

      return data;
    } catch (error) {
      console.error("Error fetching:", error);
      return cached ? JSON.parse(cached) : null;
    }
  }

  return options.parseJSON ? JSON.parse(cached): cached;
}

export async function getSystemPrompt(isForced: boolean = false) {
 const options: FetchCachedOption = {
  apiURL: "https://gist.githubusercontent.com/sourman-dev/1f8bc4876a5a300105ec657231fbfb30/raw",
  apiType: "text",
  nameOfCache: "dichtruyen:ai-systemPrompt"
 }

 return await fetchAndCached(options, isForced);
}


export async function getAiProviders(isForced: boolean = false) {
  const options: FetchCachedOption = {
    apiURL: "https://gist.githubusercontent.com/sourman-dev/7d393f0f46987eec725da4388e278813/raw",
    apiType: "text",
    nameOfCache: "dichtruyen-ai:providers",
    parseJSON: true
  }
  return await fetchAndCached(options, isForced);
  // const lastCheck = await GM.getValue("dichtruyen-ai:providers-check");
  // const cachedProviders = await GM.getValue("dichtruyen-ai:providers");
  // const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  // if (isForced || !lastCheck || !cachedProviders || Date.now() - lastCheck > twelveHours) {
  //   const response = await fetchApi(
  //     "https://gist.githubusercontent.com/sourman-dev/7d393f0f46987eec725da4388e278813/raw",
  //     "text"
  //   );
  //   const providers = response ? JSON.parse(response) : null;
    
  //   if (providers) {
  //     await GM.setValue("dichtruyen-ai:providers", JSON.stringify(providers));
  //     await GM.setValue("dichtruyen-ai:providers-check", Date.now());
  //   }
    
  //   return providers;
  // }

  // return JSON.parse(cachedProviders);
}

export async function getExtractorPrompt(isForced: boolean = false) {
  const options: FetchCachedOption = {
    apiURL: "https://gist.githubusercontent.com/sourman-dev/a18096721de47a98355b2a3d07ed888c/raw",
    apiType: "text",
    nameOfCache: "dichtruyen-ai:extractor-prompt",
  }
  return await fetchAndCached(options, isForced);
}

export const translateFunc = async (
  text: string | null | undefined,
  onChunk: (chunk: string) => void
) => {
  try {
    const currentAi = currentAiProvider();
    if (!text || text.length <= 5) return;
    const prompt = currentPrompt(text);
    if (!currentAi || !prompt.isValid) return;
    replaceAppState({ isTranslating: true, currentView: "reader" });

    if (!currentAi?.baseURL || !currentAi?.apiKey) {
      throw new Error("AI provider configuration is incomplete.");
    }

    const options = {
      baseURL: currentAi.baseURL,
      apiKey: currentAi.apiKey,
      data: {
        model: currentAi?.model,
        messages: [{ role: "user", content: prompt.content }],
        stream: true,
      },
    };

    // console.log(currentAi)

    let translated = "";

    // const stream = await pool.exec("openAICompletion", [options]);
    await openAICompletion(options, (chunk: string) => {
      console.log("In progress...");
      translated += chunk;
      onChunk(translated);
    });
    
    console.log("Done!");
    const history = {
      url: window.location.href,
      title: document.title,
      cachedAt: Date.now(),
      ...findPrevNextChapterLinks(),
    } as HistoryItem;
    replaceAppState({ isTranslating: false, currentView: "reader" });
    await addToHistory(history, translated);
  } catch (error) {
    console.error(error);
  } finally {
    replaceAppState({ isTranslating: false });
  }
};

export function currentAiProvider() {
  const provider = {
    name: null as string | null,
    baseURL: null as string | null,
    model: null as string | null,
    apiKey: null as string | null,
  };
  const selectedProvider = settingsState.providers.find(
    (p) => p.selected === true
  );
  if (selectedProvider) {
    provider.name = selectedProvider.name;
    provider.baseURL = selectedProvider.baseUrl;
    provider.apiKey = selectedProvider.apiKey;
    const selectedModel = selectedProvider.models.find(
      (p) => p.selected === true
    );
    if (selectedModel) {
      provider.model = selectedModel.name;
    }
  }
  if (provider.apiKey !== null && provider.model !== null) {
    return provider;
  }
}

export function currentPrompt(text: string) {
  const systemPrompt = settingsState.prompt.systemPrompts.find(
    (p) => p.selected
  )?.content;
  const userPrompt = settingsState.prompt.userPrompts.find(
    (p) => p.selected
  )?.content;
  const isValid =
    systemPrompt !== undefined &&
    systemPrompt !== null &&
    systemPrompt.length > 10;

  return {
    isValid,
    content: stripIndent`${oneLine`${systemPrompt}\n${userPrompt}`}\n<content>${text}</content>`,
  };
}

export function findPrevNextChapterLinks() {
  const current = window.location.href;
  const origin = window.location.origin;
  const lastSegment = current.split("/").pop() || "";
  const middleSegment = current.replace(origin, "").replace(lastSegment, "");
  const allLinks = document.getElementsByTagName("a");

  const matchingLinks = [
    ...new Set(
      Array.from(allLinks)
        .map((p) => p.href)
        .filter((link) => {
          return link && link.lastIndexOf(`${origin}${middleSegment}`) !== -1;
        })
        .filter((p) => {
          const lastSegment = p.split("/").pop();
          return (
            p !== `${origin}${middleSegment}` &&
            lastSegment?.match(/\d+/) != null
          );
        })
        .concat(current)
    ),
  ].sort((a, b) => {
    // Lấy segment cuối của URL (sau dấu / cuối cùng)
    const lastA = a.split('/').pop();
    const lastB = b.split('/').pop();

    // Trích xuất số từ segment cuối
    const numA = parseInt(lastA?.match(/\d+/)?.[0] ?? "0", 10);
    const numB = parseInt(lastB?.match(/\d+/)?.[0] ?? "0", 10);

    return numA - numB; // Tăng dần: từ bé đến lớn
});
  // console.log(matchingLinks, middleSegment)
  if (matchingLinks.length === 2) {
    if (matchingLinks[0] === current) {
      return { previous: null, next: matchingLinks[1] };
    } else if (matchingLinks[1] === current) {
      return { previous: matchingLinks[0], next: null };
    }
  } else if (matchingLinks.length === 3 && matchingLinks[1] === current) {
    return { previous: matchingLinks[0], next: matchingLinks[2] };
  }

  return { previous: null, next: null };
}

export const fetchResource = async (url: string) => {
  return await fetchApi(url, "text");
};

export const getRelease = async (isForced: boolean = false) => {
  const options: FetchCachedOption = {
    apiURL: "https://api.github.com/repos/sourman-dev/dichtruyen-ai-userscript/releases/latest",
    apiType: "text",
    nameOfCache: "dichtruyen-ai:release",
    parseJSON: true
  }
  const data = await fetchAndCached(options, isForced);
  const releaseData = {
    version: data.tag_name,
    description: data.body,
    fileUrl: data.assets[0]?.browser_download_url || null
  };
  await GM.setValue("dichtruyen-ai:release", JSON.stringify(releaseData));
  return releaseData;
}
