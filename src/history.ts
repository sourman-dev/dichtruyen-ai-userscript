import { set, get, del, createStore } from 'idb-keyval';
import type { AppState, HistoryItem } from './app';

export const useStore = createStore('doctruyenCached', 'doctruyen-store');

export const db = {
  get: async (key: string) => {
    return await get(key, useStore);
  },
  set: async (key: string, value: any) => {
    return await set(key, value, useStore);
  },
  del: async (key: string) => {
    return await del(key, useStore);
  },
};

export const addToHistory = async (appState: AppState, url: string, title: string, translated: string) => {
  const newItem: HistoryItem = {
    url,
    title,
    timestamp: Date.now()
  };

  // Update app state history (keep only last 10 items)
  appState.history = [newItem, ...appState.history].slice(0, 10);

  // Store translation in IndexedDB
  try {
    await db.set(`history:${url}`, newItem);
    await db.set(`translation:${url}`, translated);
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
};

export const getFromHistory = async (url: string) => {
  try {
    return await db.get(`history:${url}`);
  } catch (error) {
    console.error('Failed to get from history:', error);
    return null;
  }
};

export const deleteHistoryItem = async (appState: AppState, url: string) => {
  try {
    await db.del(`history:${url}`);
    await db.del(`translation:${url}`);
    appState.history = appState.history.filter((item) => item.url !== url);
    return await getFromHistory(url);
  } catch (error) {
    console.error('Failed to delete history item:', error);
    throw error;
  }
};

export const clearHistory = async (appState: AppState) => {
  appState.history = [];
  try {
    const keys = await db.get('historyKeys') || [];
    for (const key of keys) {
      await db.del(key);
    }
    await db.del('historyKeys');
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
};
