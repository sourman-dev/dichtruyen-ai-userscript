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

// function splitChapterIntoSegments(
//   chapter: string,
//   maxSentences: number = 5,
//   contextSegments: number = 2
// ): Segment[] {
//   // Regex tách dựa trên \n, dấu chấm (.), dấu phẩy (,), và dấu chấm tiếng Trung (。)
//   const splitRegex = /(\n|[.,！？]|\u3002)\s*/;
//   const parts = chapter.split(splitRegex);

//   // Ghép lại các phần tử để giữ dấu câu
//   const sentences = parts
//     .reduce((acc: string[], part: string, index: number, arr: string[]) => {
//       if (index % 2 === 0 && part.trim()) {
//         acc.push(part + (arr[index + 1] || ""));
//       }
//       return acc;
//     }, [])
//     .filter((s) => s.trim());

//   // Tách thành các đoạn dựa trên maxSentences
//   const segments: Segment[] = [];
//   for (let i = 0; i < sentences.length; i += maxSentences) {
//     const segmentSentences = sentences.slice(i, i + maxSentences);
//     const content = segmentSentences.join("");

//     // Lấy ngữ cảnh từ các đoạn trước
//     const contextStart = Math.max(0, i - maxSentences * contextSegments);
//     const contextSentences = sentences.slice(contextStart, i);
//     const context = contextSentences.length > 0 ? contextSentences.join("") : undefined;

//     segments.push({ content, context });
//   }

//   return segments;
// }

// function extractNames(text: string):string[] {
//   const nameRegex = /(?:战|叶|令|张|王|李|赵|杨|徐|卢|墨|田)[\u4e00-\u9fa5]{1,3}(?=[\s“的]|$)/g;
//   return [...new Set(text.match(nameRegex) || [])];
// }

// async function dictationNames(text: string): Promise<string> {
//   const names = extractNames(text);
//   if(names.length <= 0) return "";
//   // Tạo chuỗi với format "index=name"
//   const str = names.map((name, index) => `${index}=${name}`).join(", ");
  
//   // Dịch chuỗi
//   const translated = await vietPhraseTrans(str);
  
//   // Tách các cặp đã dịch
//   const translatedPairs = translated.split(", ");
  
//   // Tạo object để lưu kết quả dịch cho mỗi index
//   const translationMap: { [key: string]: string } = {};
//   translatedPairs.forEach(pair => {
//       const [index, trans] = pair.split("=").map(s => s.trim());
//       translationMap[index] = trans;
//   });
  
//   // Kết hợp tên gốc với bản dịch
//   return names.map((name, index) => `${name}= ${translationMap[index]}`).join(", ");
// }

async function combinePrompt(text: string){
  const prompt = currentPrompt();
  if(!prompt.isValid)return "";
  const hanViet = await vietPhraseTrans(text);
  const vietTho = await vietPhraseTrans(text, 1);
  let str = `${prompt.basePrompt}\nDựa trên:\n`
    str += `**Bản dịch Hán Việt** (Lấy danh từ riêng): <hanviet>${hanViet}</hanviet>`
    str+=`**Bản dịch máy**(tham khảo từ khó): <dichmay>${vietTho}</dichmay>\n`
    str+=`**Bản cần dịch:** <content>${text}</content>`
    return str;
}

export const translateFunc = async (
  text: string | null | undefined,
  onChunk: (chunk: string) => void
) => {
  try {
    console.log("[Translate Debug] text:", text);
    const currentAi = currentAiProvider();
    console.log("[Translate Debug] currentAi:", JSON.stringify(currentAi, null, 2));
    if (!text || text.length <= 5) return;
    
    const prompt = currentPrompt();
    if (!currentAi || !prompt.isValid) return;
    if (!currentAi?.baseURL || !currentAi?.apiKey) {
      throw new Error("AI provider configuration is incomplete.");
    }
    let translated = "";
    replaceAppState({ isTranslating: true, currentView: "reader" });
    const content = await combinePrompt(text)
    const options = {
      baseURL: currentAi.baseURL as string,
      apiKey: currentAi.apiKey as string,
      data: {
        model: currentAi?.model,
        messages: [{ role: "user", content: content }],
        stream: true,
        temperature: 0.8,
        top_p: 0.95
      },
    }
    await openAICompletion(options, (chunk: string) => {
      console.log("In progress...");
      translated += chunk;
      onChunk(translated);
    });

    // const content = currentAi?.isVietPharseFirst ? await useVietPhrase(text) : text;
    // const _names = !currentAi?.isVietPharseFirst ? await dictationNames(text) : "";
    // const _dictationNames = _names.length > 0 ? `[Dịch tên nhân vật như sau: ${_names}]` : ""
    // // console.log(_dictationNames)
    // replaceAppState({ isTranslating: true, currentView: "reader" });
    // const segments = splitChapterIntoSegments(content as string, 12, 4);
    // // console.log(segments)
    // const newOptions = async  (segment: Segment) => {
    //   // const names = extractNames(segment.content);
    //   // let names2 = names.join(',');
    //   // if(names.length > 0){
    //   //   names2 = await vietPhraseTrans(names.join(","))
    //   // }
    //   // console.log(names2, names)
    //   const text = segment.context ? `Dùng xưng hô phù hợp dựa trên ngữ cảnh trước: [${segment.context}]\n${_dictationNames}\nChỉ dịch phần này: <content>${segment.content}</content>` : `${_dictationNames}\n<content>${segment.content}</content>`
    //   const segmentPrompt  = `${prompt.basePrompt}${text}`
    //   return {
    //     baseURL: currentAi.baseURL as string,
    //     apiKey: currentAi.apiKey as string,
    //     data: {
    //       model: currentAi?.model,
    //       messages: [{ role: "user", content: segmentPrompt }],
    //       stream: true,
    //       temperature: 0.8,
    //       top_p: 0.95
    //     },
    //   };
      
    // }

    // let translated = "";
    
    // for(const seg of segments){
    //   const options = await newOptions(seg);
    //   // console.log(seg)
    //   await openAICompletion(options, (chunk: string) => {
    //     console.log("In progress...");
    //     translated += chunk;
    //     onChunk(translated);
    //   });
    // }
    
    console.log("Done!");
    onChunk(translated + "\n[Translation completed]");
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
  console.log("[Provider Debug] settingsState.providers:", JSON.stringify(settingsState.providers, null, 2));
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
    // Find selected model, or fallback to first model if none selected
    let selectedModel = selectedProvider.models.find(
      (p) => p.selected === true
    );
    if (!selectedModel && selectedProvider.models.length > 0) {
      // Auto-select first model and save
      selectedProvider.models[0].selected = true;
      selectedModel = selectedProvider.models[0];
      console.log("[Provider Debug] Auto-selected first model:", selectedModel.name);
    }
    if (selectedModel) {
      provider.model = selectedModel.name;
    }
  }
  if (provider.apiKey !== null && provider.model !== null) {
    return provider;
  }
}

export function currentPrompt() {
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
    basePrompt: stripIndent`${oneLine`${systemPrompt}\n${userPrompt}`}\n`,
  };
}

export function findElementByIndicators(indicators: string[]): { element: HTMLAnchorElement | null, indicator: string | null } {
  const links = document.querySelectorAll('a');
  let foundElement = null;
  let foundIndicator = null;

  for (const link of links) {
    const linkText = link.textContent?.trim() || '';
    const ariaLabel = link.getAttribute('aria-label') || '';
    const title = link.getAttribute('title') || '';
    const combinedText = `${linkText} ${ariaLabel} ${title}`;

    const found = indicators.find(indicator => 
      combinedText.toLowerCase().includes(indicator.toLowerCase())
    );

    if (found) {
      foundElement = link;
      foundIndicator = found;
      break;
    }
  }

  return {
    element: foundElement,
    indicator: foundIndicator
  };
}

export function findPrevNextChapterLinks() {
  const previousIndicators = [
    'trước', 'previous', 'prev', '<', '←', '«',
    '上一章', '上一節', 'back', 'Previous Chapter',
    'Prev Chapter', '上章', 'Chương trước'
  ];

  const nextIndicators = [
    'sau', 'next', '>', '→', '»', 'tiếp',
    '下一章', '下一節', 'Next Chapter',
    '下章', 'Chương sau', 'tiếp theo'
  ];

  const prevResult = findElementByIndicators(previousIndicators);
  const nextResult = findElementByIndicators(nextIndicators);

  let prevUrl = prevResult.element?.href || null;
  let nextUrl = nextResult.element?.href || null;

  // Fallback to URL pattern matching if no links found
  if (!isValidUrl(prevUrl) || !isValidUrl(nextUrl)) {
    const currentUrl = window.location.href;
    const urlNumber = currentUrl.match(/\d+/)?.[0];

    if (urlNumber) {
      const currentNum = parseInt(urlNumber);
      const links = document.querySelectorAll('a');
      
      links.forEach(link => {
        const href = link.href;
        const hrefNumber = href.match(/\d+/)?.[0];
        
        if (hrefNumber) {
          const num = parseInt(hrefNumber);
          if (num === currentNum - 1) {
            prevUrl = href;
          } else if (num === currentNum + 1) {
            nextUrl = href;
          }
        }
      });
    }
  }

  return {
    previous: isValidUrl(prevUrl) ? prevUrl : prevResult.indicator,
    next: isValidUrl(nextUrl) ? nextUrl : nextResult.indicator,
  };
}

export const isValidUrl = (url: string | null) => {
  if (!url) return false;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol !== 'javascript:';
  } catch {
    return false;
  }
};

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
