const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cyberSlideStudio", {
  platform: process.platform,
  version: "3.0.0-alpha.3-pro",
  openProject: () => ipcRenderer.invoke("project:open"),
  openRecentProject: (filePath) => ipcRenderer.invoke("project:open-recent", filePath),
  saveProject: (contents, suggestedName) => ipcRenderer.invoke("project:save", { contents, suggestedName, forceSaveAs: false }),
  saveProjectAs: (contents, suggestedName) => ipcRenderer.invoke("project:save", { contents, suggestedName, forceSaveAs: true }),
  clearCurrentProjectPath: () => ipcRenderer.invoke("project:clear-current-path"),
  saveFinalSlide: (payload) => ipcRenderer.invoke("slide:save-final", payload),
  approveSlideImage: (payload) => ipcRenderer.invoke("slide:approve", payload),
  readSlideImage: (filePath) => ipcRenderer.invoke("slide:read-image", filePath),
  openWorkingFolder: (projectName) => ipcRenderer.invoke("slide:open-working-folder", projectName),
  checkNativeVideoRenderer: () => ipcRenderer.invoke("video:check-renderer"),
  renderNativeVideo: (plan) => ipcRenderer.invoke("video:render-native", plan),
  cancelNativeVideo: (renderId) => ipcRenderer.invoke("video:cancel-native", renderId),
  openVideo: (filePath) => ipcRenderer.invoke("video:open", filePath),
  getVideoPreviewUrl: (filePath) => ipcRenderer.invoke("video:preview-url", filePath),
  openVideoFolder: (projectName) => ipcRenderer.invoke("video:open-folder", projectName),
  onNativeVideoProgress: (callback) => { const listener=(_event,p)=>callback(p); ipcRenderer.on("video:render-progress",listener); return ()=>ipcRenderer.removeListener("video:render-progress",listener); },
  scanMusicLibrary: () => ipcRenderer.invoke("music:scan"),
  autoSelectMusic: (payload) => ipcRenderer.invoke("music:auto-select", payload),
  selectCustomMusic: (payload) => ipcRenderer.invoke("music:select-custom", payload),
  prepareMusicAudio: (payload) => ipcRenderer.invoke("music:prepare", payload),
  openMusicLibrary: () => ipcRenderer.invoke("music:open-library"),
  openProjectAudioFolder: (projectName) => ipcRenderer.invoke("music:open-audio-folder", projectName),
  scanContentLibrary: () => ipcRenderer.invoke("library:scan"),
  getContentLibraryActivity: () => ipcRenderer.invoke("library:activity"),
  toggleContentLibraryFavorite: (id) => ipcRenderer.invoke("library:toggle-favorite", id),
  recordContentLibraryUse: (id) => ipcRenderer.invoke("library:record-used", id),
  openContentLibrary: () => ipcRenderer.invoke("library:open"),
  generateCaptionAssets: (payload) => ipcRenderer.invoke("captions:generate", payload),
  openCaptionsFolder: (projectName) => ipcRenderer.invoke("captions:open-folder", projectName),
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
  cancelOpenAIPosterGeneration: (requestId) => ipcRenderer.invoke("openai:cancel-generate-posters", requestId),
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
