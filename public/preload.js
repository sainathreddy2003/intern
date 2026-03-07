const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Store methods
  getStoreValue: (key) => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('set-store-value', key, value),
  
  // Dialog methods
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Quick cash calculation
  quickCash: (amount) => ipcRenderer.invoke('quick-cash', amount),
  
  // Menu event listeners
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-bill', callback);
    ipcRenderer.on('menu-reprint-bill', callback);
    ipcRenderer.on('menu-purchase-entry', callback);
    ipcRenderer.on('menu-day-end', callback);
    ipcRenderer.on('menu-download-sync', callback);
    ipcRenderer.on('menu-upload-sync', callback);
    ipcRenderer.on('menu-items-master', callback);
    ipcRenderer.on('menu-customers', callback);
    ipcRenderer.on('menu-suppliers', callback);
    ipcRenderer.on('menu-reports', callback);
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Expose node environment variables
contextBridge.exposeInMainWorld('nodeEnv', {
  isDev: process.env.NODE_ENV === 'development'
});
