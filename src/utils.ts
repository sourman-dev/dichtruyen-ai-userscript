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
}

export async function getExtractorPrompt(isForced: boolean = false) {
  const options: FetchCachedOption = {
    apiURL: "https://gist.githubusercontent.com/sourman-dev/a18096721de47a98355b2a3d07ed888c/raw",
    apiType: "text",
    nameOfCache: "dichtruyen-ai:extractor-prompt",
  }
  return await fetchAndCached(options, isForced);
}

async function vietPhraseTrans(content: string, type: number = 0): Promise<string>{
  const func = type === 0 ? "TranslateHanViet" : "TranslateVietPhraseS"
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: "POST",
      url: `https://vietphrase.info/Vietphrase/${func}`,
      data: JSON.stringify({ chineseContent: content }),
      headers: {
        "Content-Type": "application/json",
      },
      onload: function (response) {
        resolve(response.responseText); // Thành công, trả về dữ liệu
      },
      onerror: function (error) {
        reject(error); // Lỗi, từ chối Promise
      },
    });
  });
}

export async function useVietPhrase(content: string) {
  try {
    let translated = await vietPhraseTrans(content);
    const chineseRegex = /[\u4E00-\u9FFF]+/g;
    
    // Extract all Chinese characters/words
    const chineseMatches = translated.match(chineseRegex) || [];
    
    // Make unique array and format to [word], pattern
    const uniqueWords = [...new Set(chineseMatches)]
      .map(word => `[${word}]`)
      .join(',');
    
    if (uniqueWords.length > 0) {
      // Get VietPhrase translations
      const vietPhraseResult = await vietPhraseTrans(uniqueWords, 1);
      console.log(uniqueWords, vietPhraseResult);
      // Parse the results and create replacement map
      const translations = vietPhraseResult.split(',')
        .reduce((acc, curr) => {
          const match = curr.match(/\[([\u4E00-\u9FFF]+)\]=(.*)/);
          if (match) {
            acc[match[1]] = match[2].trim();
          }
          return acc;
        }, {} as Record<string, string>);
      
      // Replace all Chinese words with their translations
      for (const [chinese, viet] of Object.entries(translations)) {
        const regex = new RegExp(chinese, 'g');
        translated = translated.replace(regex, viet);
      }
    }

    return translated;
  } catch (e) {
    console.error("use VietPharse error: ", e);
  }
}

export const translateFunc = async (
  text: string | null | undefined,
  onChunk: (chunk: string) => void
) => {
  try {
    const currentAi = currentAiProvider();
    if (!text || text.length <= 5) return;
    const content = currentAi?.isVietPharseFirst ? await useVietPhrase(text) : text;
    const prompt = currentPrompt(content as string);
    if (!currentAi || !prompt.isValid) return;
    replaceAppState({ isTranslating: true, currentView: "reader" });

    if (!currentAi?.baseURL || !currentAi?.apiKey) {
      throw new Error("AI provider configuration is incomplete.");
    }


    let translated = "";
    const options = {
      baseURL: currentAi.baseURL,
      apiKey: currentAi.apiKey,
      data: {
        model: currentAi?.model,
        messages: [{ role: "user", content: prompt.content }],
        stream: true,
      },
    };
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
    isVietPharseFirst: settingsState.isVietPharseFirst ?? false
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
  try{
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
  }catch(e){
    return {
      version: __APP_VERSION__,
      description: null,
      fileUrl: null
    }
  }
}
