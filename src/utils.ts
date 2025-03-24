// import { textVide } from "text-vide";
import { oneLine, stripIndent } from "common-tags";
import { addToHistory } from "./cached";
import type { HistoryItem } from "./types";
import { replaceAppState, settingsState } from "./store";
import { openAICompletion } from "./ai";
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

export async function getSystemPrompt() {
  let defaultPrompt = `"Bạn là một AI chuyển ngữ văn học chuyên nghiệp. Hãy dịch đoạn văn bản sau sang tiếng Việt với văn phong tự nhiên, đúng ngữ pháp và diễn đạt mượt mà, trôi chảy. Tuân thủ nghiêm ngặt các yêu cầu sau:  
 1. Không sử dụng ký tự Trung Quốc (Hán tự) trong bản dịch. Nếu phát hiện ký tự Trung Quốc, thay thế ngay bằng từ tiếng Việt tương đương.  
 2. Hạn chế sử dụng từ Hán Việt, chỉ giữ lại các từ phổ biến, dễ hiểu với độc giả hiện đại, đồng thời đảm bảo cách diễn đạt phù hợp với văn phong tiếng Việt hiện đại, mượt mà, tránh lối diễn đạt cứng nhắc hoặc dịch từng từ.  
 3. Xử lý tên riêng (nhân vật, địa danh, đồ vật, động thực vật...) như sau:  
    - Giữ nguyên tất cả tên riêng và không thay đổi chúng thành bất kỳ tên nào khác (ví dụ: không thay thế tên riêng bằng "Cức").  
    - Viết hoa chữ cái đầu tiên của tên riêng theo đúng quy tắc tiếng Việt (ví dụ: "Thanh Long", "Diệp Hi", "Hi Thành").  
    - Không dịch nghĩa các tên riêng để bảo toàn tính nguyên bản và ý nghĩa trong ngữ cảnh truyện.  
    - Đảm bảo tính nhất quán: Một khi tên riêng đã được giữ nguyên, hãy sử dụng nguyên bản đó xuyên suốt toàn bộ văn bản.  
    - Ví dụ:  
      - "Tù trưởng Cức" → Giữ nguyên "Tù trưởng Cức" (không dịch thành "Tù trưởng Gai").  
      - "Bộ lạc Cức" → Giữ nguyên "Bộ lạc Cức" (không dịch thành "Bộ lạc Gai").  
 4. Trong đối thoại ưu tiên dụng cách xưng hô "ta-ngươi" để phù hợp với bối cảnh cổ đại và phong cách truyện tiên hiệp.  
 5. Xử lý góc nhìn nhân vật:  
    - Phân tích ngữ cảnh để lựa chọn phù hợp:  
      - Nếu đối tượng được nhắc đến không phải kẻ thù hoặc mang tính thân thiện/trung lập hoặc không chắc chắn là thù địch, hãy sử dụng "họ" hoặc "bọn họ".  
      - Nếu đối tượng được nhắc đến là kẻ thù hoặc mang tính tiêu cực, hãy sử dụng "bọn nó", "chúng nó", hoặc "chúng".  
    - Ví dụ:  
      - "Bọn họ xây tường thành" → Giữ nguyên "bọn họ" hoặc "họ" nếu đối tượng không phải kẻ thù.  
      - "Bọn họ phá hủy tường thành" → Dịch thành "bọn nó" hoặc "chúng nó" nếu đối tượng là kẻ thù.  
 6. Kiểm tra kỹ bản dịch để loại bỏ hoàn toàn ký tự Trung Quốc và lỗi ngữ pháp.  
 7. Chỉ cung cấp bản dịch hoàn chỉnh, không thêm tóm tắt, bình luận hay giải thích.  
 `;
  // const response = await pool.exec('fetchApi', ["https://gist.githubusercontent.com/sourman-dev/1f8bc4876a5a300105ec657231fbfb30/raw", "text"])
  const response = await fetchApi(
    "https://gist.githubusercontent.com/sourman-dev/1f8bc4876a5a300105ec657231fbfb30/raw",
    "text"
  );
  if (response) {
    defaultPrompt = response;
  }
  return defaultPrompt;
}

export async function getAiProviders() {
  const response = await fetchApi(
    "https://gist.githubusercontent.com/sourman-dev/7d393f0f46987eec725da4388e278813/raw",
    "text"
  );
  return response ? JSON.parse(response) : null;
}

export async function getExtractorPrompt() {
  return await fetchApi(
    "https://gist.githubusercontent.com/sourman-dev/a18096721de47a98355b2a3d07ed888c/raw",
    "text"
  );
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

    const options = {
      baseURL: currentAi?.baseURL,
      apiKey: currentAi?.apiKey,
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
    // const task = await pool.exec("openAICompletion", [options], {
    //   on: async function(payload: any){
    //     if(payload.type === "stream"){
    //       console.log('In progress...');
    //       translated += payload.data;
    //       onChunk(translated);
    //     }else if(payload.type === "complete"){
    //       console.log('Done!');
    //       const history = {
    //         url: window.location.href,
    //         title: document.title,
    //         cachedAt: Date.now(),
    //         ...findPrevNextChapterLinks()
    //       } as HistoryItem;
    //       translated += payload.data;
    //       onChunk(translated);
    //       replaceAppState({isTranslating: false, currentView: "reader"})
    //       await addToHistory(history, translated);
    //     }
    //   }
    // });
    // for await (const chunk of stream) {
    //   translated += chunk.content;

    //   if (chunk.isFinished) {
    //     console.log('Stream completed with finish_reason: stop');
    //     translated += "\n[Translate completed]"
    //   }
    //   onChunk(translated)
    // }

    // return task;
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
        .filter((link) => {
          const href = link.getAttribute("href");
          return href && href.includes(middleSegment);
        })
        .map((p) => p.href)
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
  // console.log(matchingLinks)
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

// export const bionicReading = (text: string) => {
//   const bionicReading = van.derive(() => settingsState.readerView.bionicReading)
//   return bionicReading.val === true ? textVide(text) : text;
// };

export const fetchResource = async (url: string) => {
  return await fetchApi(url, "text");
};
