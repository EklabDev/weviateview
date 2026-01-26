export interface Settings {
  weaviateUrl: string;
  apiKey: string;
}

export async function getSettings(): Promise<Settings> {
  if (window.electronAPI) {
    return await window.electronAPI.getSettings();
  }
  // Fallback for development/testing
  const stored = localStorage.getItem('weaviate-settings');
  if (stored) {
    return JSON.parse(stored);
  }
  return { weaviateUrl: '', apiKey: '' };
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (window.electronAPI) {
    await window.electronAPI.saveSettings(settings);
  } else {
    // Fallback for development/testing
    localStorage.setItem('weaviate-settings', JSON.stringify(settings));
  }
}
