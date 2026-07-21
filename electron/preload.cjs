const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cyberSlideStudio", {
  platform: process.platform,
  version: "0.6.0",

  openProject: () => ipcRenderer.invoke("project:open"),

  saveProject: (contents, suggestedName) =>
    ipcRenderer.invoke("project:save", {
      contents,
      suggestedName,
      forceSaveAs: false,
    }),

  saveProjectAs: (contents, suggestedName) =>
    ipcRenderer.invoke("project:save", {
      contents,
      suggestedName,
      forceSaveAs: true,
    }),

  clearCurrentProjectPath: () =>
    ipcRenderer.invoke("project:clear-current-path"),

  onProjectMenuAction: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on("menu:project-action", listener);

    return () => {
      ipcRenderer.removeListener("menu:project-action", listener);
    };
  },
});
