export interface ElectronAPI {
  getSettings: () => Promise<{ weaviateUrl: string; apiKey: string }>;
  saveSettings: (settings: { weaviateUrl: string; apiKey: string }) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
