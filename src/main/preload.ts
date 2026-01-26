import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: { weaviateUrl: string; apiKey: string }) =>
    ipcRenderer.invoke('save-settings', settings),
});

declare global {
  interface Window {
    electronAPI: {
      getSettings: () => Promise<{ weaviateUrl: string; apiKey: string }>;
      saveSettings: (settings: { weaviateUrl: string; apiKey: string }) => Promise<{ success: boolean }>;
    };
  }
}
