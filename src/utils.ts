import { addToHistory, } from "./history";
import type { aiProvider } from "./app.d";
export async function getSystemPrompt(){
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
`
    const response = await fetch('https://gist.githubusercontent.com/sourman-dev/1f8bc4876a5a300105ec657231fbfb30/raw/83244d4e424cc659bfc3f7e6301d4afcdfd0417f/prompt.txt');
    if (response.ok) {
      defaultPrompt = await response.text();
    }
    return defaultPrompt;
}

const finishStream = (data: any) => {
  let isFinish = false;
  let completionMessage = "";
  if (data.candidates && data.candidates[0]) {
    const candidate = data.candidates[0];
    const finishReason = candidate.finishReason !== undefined;
    const tokenCount = data.usageMetadata?.totalTokenCount;
    if (finishReason) {
      completionMessage = "\n[Translation completed]";
      if (tokenCount) {
        completionMessage += `\nTotal tokens used: ${tokenCount}`;
      }
      isFinish = true;
    }
  }
  return {
    isFinish,
    completionMessage,
  };
};

const finalPrompt = (text: string, appState: any) => {
  let systemPrompt = `${appState.settings.systemPrompt}\n`;
  const userPrompt = appState.settings.userPrompt;
  if (userPrompt && userPrompt.length > 0) {
    systemPrompt += `- Các yêu cầu mở rộng này sẽ được bổ sung vào yêu cầu trên:\n${userPrompt}\n`;
  }
  systemPrompt += `Hãy dịch đoạn văn bản sau:\n${text}`;
  return systemPrompt;
};

const geminiCompletions = async (
  text: string,
  onChunk: (chunk: string) => void,
  appState: any
) => {
  const currentProvider = appState.settings.aiProvider.find((p: aiProvider): boolean => p.selected);
  const GeminiKey = currentProvider?.apiKey;
  const modelName = currentProvider?.modelName;
  const ApiURL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent`;
  
  const systemPrompt = finalPrompt(text, appState);
  const requestData = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: appState.settings.aiProvider.temperature || 1.1,
    },
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };

  try {
    const response = await fetch(`${ApiURL}?key=${GeminiKey}`, requestOptions);
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to get stream reader");

    let buffer = "";
    const decoder = new TextDecoder();
    let translatedText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete chunks
      let startBrace = buffer.indexOf("{");
      while (startBrace !== -1) {
        let openBraces = 1;
        let currentPos = startBrace + 1;

        while (openBraces > 0 && currentPos < buffer.length) {
          if (buffer[currentPos] === "{") openBraces++;
          if (buffer[currentPos] === "}") openBraces--;
          currentPos++;
        }

        if (openBraces === 0) {
          try {
            const jsonStr = buffer.slice(startBrace, currentPos);
            const data = JSON.parse(jsonStr);

            if (
              data.candidates &&
              data.candidates[0]?.content?.parts[0]?.text
            ) {
              const chunkText = data.candidates[0].content.parts[0].text;
              const { completionMessage, isFinish } = finishStream(data);
              const finalText = chunkText + completionMessage;
              translatedText += finalText;
              if (isFinish) {
                const url = window.location.href;
                const title = document.title;
                await addToHistory(appState, url, title, translatedText);
              }
              onChunk(finalText);
            }

            buffer = buffer.slice(currentPos);
            startBrace = buffer.indexOf("{");
          } catch (e) {
            startBrace = buffer.indexOf("{", startBrace + 1);
          }
        } else {
          break;
        }
      }
    }

    // Handle any remaining complete JSON in the buffer
    if (buffer.trim()) {
      try {
        let startBrace = buffer.indexOf("{");
        if (startBrace !== -1) {
          let openBraces = 1;
          let currentPos = startBrace + 1;

          while (openBraces > 0 && currentPos < buffer.length) {
            if (buffer[currentPos] === "{") openBraces++;
            if (buffer[currentPos] === "}") openBraces--;
            currentPos++;
          }

          if (openBraces === 0) {
            const jsonStr = buffer.slice(startBrace, currentPos);
            const data = JSON.parse(jsonStr);
            if (data.candidates && data.candidates[0]) {
              const candidate = data.candidates[0];
              const { completionMessage, isFinish } = finishStream(data);

              if (candidate.content?.parts[0]?.text) {
                const chunkText = candidate.content.parts[0].text;
                const finalText = chunkText + completionMessage;
                translatedText += finalText;
                if (isFinish) {
                  const url = window.location.href;
                  const title = document.title;
                  await addToHistory(appState, url, title, translatedText);
                }
                onChunk(finalText);
              }
            }
          }
        }
      } catch (e) {
        console.error("Error parsing final chunk:", e);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const qwenCompletions = async (
  text: string,
  onChunk: (chunk: string) => void,
  appState: any
) => {
  const systemPrompt = finalPrompt(text, appState);
  const currentProvider = appState.settings.aiProvider.find((p: aiProvider): boolean => p.selected);
  const requestData = {
    stream: true,
    incremental_output: true,
    chat_type: "t2t",
    model: currentProvider?.modelName || "qwen-max-latest",
    messages: [
      {
        role: "user",
        content: systemPrompt,
        chat_type: "t2t",
        extra: {},
        feature_config: {
          thinking_enabled: false
        }
      }
    ],
    session_id: crypto.randomUUID(),
    chat_id:  crypto.randomUUID(),
    id: crypto.randomUUID()
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "bx-v": "2.5.28",
      "origin": "https://chat.qwen.ai",
      "priority": "u=1, i",
      "referer": "https://chat.qwen.ai",
      "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "source": "web",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      "x-accel-buffering": "no",
      "Cookie": currentProvider?.apiKey || ""
    },
    body: JSON.stringify(requestData)
  };

  try {
    const response = await fetch("https://chat.qwen.ai/api/chat/completions", requestOptions);
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to get stream reader");

    let buffer = "";
    const decoder = new TextDecoder();
    let translatedText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const data = JSON.parse(line.replace(/^data: /, ''));
          if (data.choices && data.choices[0]?.delta?.content) {
            const text = data.choices[0].delta.content;
            translatedText += text;
            onChunk(text);
          } else if (data.choices && data.choices[0] && !data.choices[0].delta?.content) {
            // Empty content indicates completion
            const url = window.location.href;
            const title = document.title;
            await addToHistory(appState, url, title, translatedText);
            onChunk("\n[Translation completed]");
            return;
          }
        } catch (e) {
          console.error("Error parsing chunk:", e);
        }
      }

      buffer = lines[lines.length - 1];
    }
  } catch (error) {
    console.error("Error:", error);
    onChunk("\n[Error: Failed to connect to Qwen API]");
  }
};

export const translateFunc = async (
  text: string,
  onChunk: (chunk: string) => void,
  appState: any
) => {
  const isGemini = appState.settings.aiProvider.find((p: aiProvider) => p.selected)?.name === 'Google';
  if (isGemini) {
    return geminiCompletions(text, onChunk, appState);
  } else {
    return qwenCompletions(text, onChunk, appState);
  }
};