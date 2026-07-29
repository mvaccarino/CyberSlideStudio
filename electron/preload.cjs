const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cyberSlideStudio", {
  platform: process.platform,
  version: "3.0.0-alpha.3-pro",
  openProject: () => ipcRenderer.invoke("project:open"),
  saveProject: (contents, suggestedName) => ipcRenderer.invoke("project:save", { contents, suggestedName, forceSaveAs: false }),
  saveProjectAs: (contents, suggestedName) => ipcRenderer.invoke("project:save", { contents, suggestedName, forceSaveAs: true }),
  clearCurrentProjectPath: () => ipcRenderer.invoke("project:clear-current-path"),
  saveFinalSlide: (payload) => ipcRenderer.invoke("slide:save-final", payload),
  exportProductionPackage: (payload) => ipcRenderer.invoke("production:export-package", payload),
  onProjectMenuAction: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on("menu:project-action", listener);
    return () => ipcRenderer.removeListener("menu:project-action", listener);
  },
  saveFluxApiKey: (apiKey) => ipcRenderer.invoke("flux:save-api-key", apiKey),
  hasFluxApiKey: () => ipcRenderer.invoke("flux:has-api-key"),
  testFluxConnection: () => ipcRenderer.invoke("flux:test-connection"),
  generateFluxBackground: (payload) => ipcRenderer.invoke("flux:generate-background", payload),
  waitForFluxGeneration: (requestId) => ipcRenderer.invoke("flux:wait", requestId),
  saveOpenAIApiKey: (apiKey) => ipcRenderer.invoke("openai:save-api-key", apiKey),
  hasOpenAIApiKey: () => ipcRenderer.invoke("openai:has-api-key"),
  testOpenAIConnection: () => ipcRenderer.invoke("openai:test-connection"),
  generateOpenAIPosters: (payload) => ipcRenderer.invoke("openai:generate-posters", payload),
  getCyberSlideVoiceStatus: () => ipcRenderer.invoke("voice:status"),
  prepareCyberSlideVoice: () => ipcRenderer.invoke("voice:prepare"),
  listCyberSlideVoices: () => ipcRenderer.invoke("voice:list"),
  previewCyberSlideVoice: (payload) => ipcRenderer.invoke("voice:preview", payload),
  generateCyberSlideVoice: (payload) => ipcRenderer.invoke("voice:generate", payload),
  openVoiceoverFolder: (projectName) => ipcRenderer.invoke("voice:open-folder", projectName),
  onCyberSlideVoiceProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on("voice:progress", listener);
    return () => ipcRenderer.removeListener("voice:progress", listener);
  },
});
