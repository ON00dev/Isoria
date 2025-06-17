const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  readDir: (path) => ipcRenderer.invoke('read-dir', path),
});