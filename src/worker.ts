import workerPool from "workerpool";
async function fetchApi(url: string, returnType: string = "json") {
  try {
    const response = await fetch(url);
    const data =
      returnType === "json" ? await response.json() : await response.text();
    return data;
  } catch (error) {
    throw new Error(`Fetch error: ${error}`);
  }
}

async function openAICompletion(options: any) {
  try {
    const apiURL = `${options.baseURL}chat/completions`;
    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify(options.data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get stream reader");
    }
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value);
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
        
        try {
          // Remove 'data: ' prefix and try parsing
          const jsonStr = trimmedLine.replace(/^data:\s*/, '');
          if (jsonStr === '[DONE]') {
            workerPool.workerEmit({type: 'complete', data: '\n[Translation completed]'});
            return;
          }

          const data = JSON.parse(jsonStr);
          const content = data.choices?.[0]?.delta?.content;
          const finishReason = data.choices?.[0]?.finish_reason;

          if (content) {
            workerPool.workerEmit({type: "stream", data: content});
          }

          if (finishReason === "stop") {
            workerPool.workerEmit({type: 'complete', data: '\n[Translation completed]'});
            return;
          }
        } catch (e) {
          console.warn("Error parsing chunk:", trimmedLine, e);
          continue; // Skip invalid JSON and continue with next line
        }
      }
    }
  } catch (error) {
    console.error("Stream error:", error);
    workerPool.workerEmit({type: 'error', data: error});
    throw error;
  }
}

workerPool.worker({
  fetchApi: fetchApi,
  openAICompletion: openAICompletion,
});
