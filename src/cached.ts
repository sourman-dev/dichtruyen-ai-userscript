import { set, get, del } from 'idb-keyval';
import type { HistoryItem } from './types';

// export const useStore = createStore('dichtruyenCached', 'dichtruyen-ai-store');

export const db = {
  get: async (key: string) => {
    return await get(key);
  },
  set: async (key: string, value: any) => {
    return await set(key, value);
  },
  del: async (key: string) => {
    return await del(key);
  },
};

export const addToHistory = async (history: HistoryItem, translated: string) => {
  try {
    if (!history?.url) return;
    
    let last20Items = JSON.parse(localStorage.getItem("dichtruyen-ai:history") || "[]") as HistoryItem[];
    // Filter out null items and ensure valid URLs
    last20Items = last20Items.filter(item => item && item.url);
    
    const existingIndex = last20Items.findIndex(item => item.url === history.url);
    
    if (existingIndex !== -1) {
      last20Items[existingIndex] = history;
    } else {
      if (last20Items.length >= 20) {
        last20Items.shift();
      }
      last20Items.push(history);
    }
    
    localStorage.setItem("dichtruyen-ai:history", JSON.stringify(last20Items));
    await db.set(`history:${history.url}`, history);
    await db.set(`translated:${history.url}`, translated);
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
};

export const getFromHistory = async (url: string) => {
  try {
    return await db.get(`translated:${url}`);
  } catch (error) {
    console.error('Failed to get from history:', error);
    return null;
  }
};

export const deleteHistoryItem = async (url: string) => {
  try {
    await db.del(`history:${url}`);
    await db.del(`translated:${url}`);
    let last20Items = JSON.parse(localStorage.getItem("dichtruyen-ai:history") || "[]") as HistoryItem[];
    last20Items = last20Items.filter((item) => item.url !== url);
    localStorage.setItem("dichtruyen-ai:history", JSON.stringify(last20Items));
    return true;
  } catch (error) {
    console.error('Failed to delete history item:', error);
    throw error;
  }
};

// export const clearHistory = async (appState: AppState) => {

//   try {
//     const keys = await db.get('historyKeys') || [];
//     for (const key of keys) {
//       await db.del(key);
//     }
//     await db.del('historyKeys');
//   } catch (error) {
//     console.error('Failed to clear history:', error);
//   }
// };
