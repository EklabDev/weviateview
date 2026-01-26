//@ts-nocheck
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

type StoreType = {
  get: (key: string, defaultValue?: string) => string;
  set: (key: string, value: string) => void;
};

let store: StoreType | null = null;
let mainWindow: BrowserWindow | null = null;

// Initialize store using dynamic import (electron-store v11+ is ESM-only)
// Using Function constructor to ensure TypeScript doesn't transform it to require()
async function initializeStore(): Promise<StoreType> {
  if (!store) {
    // Use Function constructor to create a true dynamic import
    // This prevents TypeScript from transforming it to require()
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    const StoreModule = await dynamicImport('electron-store');
    const Store = StoreModule.default;
    store = new Store<{
      weaviateUrl?: string;
      apiKey?: string;
    }>({
      defaults: {
        weaviateUrl: '',
        apiKey: '',
      },
    }) as unknown as StoreType;
  }
  return store;
}

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  // Set app icon
  const iconPath = isDev
    ? path.join(__dirname, '../../icon.png')
    : path.join(__dirname, '../icon.png');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the renderer
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set app icon for dock/taskbar (macOS)
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const iconPath = isDev
    ? path.join(__dirname, '../../icon.png')
    : path.join(__dirname, '../icon.png');
  
  if (process.platform === 'darwin' && fs.existsSync(iconPath)) {
    app.dock.setIcon(iconPath);
  }
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for settings
ipcMain.handle('get-settings', async () => {
  const storeInstance = await initializeStore();
  return {
    weaviateUrl: storeInstance.get('weaviateUrl', ''),
    apiKey: storeInstance.get('apiKey', ''),
  };
});

ipcMain.handle('save-settings', async (_event, settings: { weaviateUrl: string; apiKey: string }) => {
  const storeInstance = await initializeStore();
  storeInstance.set('weaviateUrl', settings.weaviateUrl);
  storeInstance.set('apiKey', settings.apiKey);
  return { success: true };
});
