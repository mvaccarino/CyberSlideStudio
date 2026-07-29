const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cyberSlideStudio", {
  platform: process.platform,
  version: "2.0.0-alpha.1",
  openProject: () => ipcRenderer.invoke("project:open"),
  saveProject: (contents, suggestedName) => ipcRenderer.invoke("project:save", { contents, suggestedName, forceSaveAs: false }),
  saveProjectAs: (contents, suggestedName) => ipcRenderer.invoke("project:save", { contents, suggestedName, forceSaveAs: true }),
  clearCurrentProjectPath: () => ipcRenderer.invoke("project:clear-current-path"),
  saveFinalSlide: (payload) => ipcRenderer.invoke("slide:save-final", payload),
  onProjectMenuAction: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on("menu:project-action", listener);
    return () => ipcRenderer.removeListener("menu:project-action", listener);
  },
  saveFluxApiKey: (apiKey) => ipcRenderer.invoke("flux:save-api-key", apiKey),
  hasFluxApiKey: () => ipcRenderer.invoke("flux:has-api-key"),
  testFluxConnection: () => ipcRenderer.invoke("flux:test-connection"),
  generateFluxBackground: (payload) => ipcRenderer.invoke("flux:generate-background", payload),
  generateAndSaveFluxBackground: (payload) => ipcRenderer.invoke("flux:generate-and-save", payload),
  waitForFluxGeneration: (requestId) => ipcRenderer.invoke("flux:wait", requestId),
  saveOpenAIApiKey: (apiKey) => ipcRenderer.invoke("openai:save-api-key", apiKey),
  hasOpenAIApiKey: () => ipcRenderer.invoke("openai:has-api-key"),
  testOpenAIConnection: () => ipcRenderer.invoke("openai:test-connection"),
  generateOpenAIPosters: (payload) => ipcRenderer.invoke("openai:generate-posters", payload),
});
