const { ipcMain, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { resolveFfmpeg } = require("./ffmpegResolver.cjs");
const {
  cancelNativeVideo,
  renderNativeVideo,
} = require("./nativeVideoRenderer.cjs");

function registerNativeVideoHandlers({ getMainWindow, ensureWorkspace }) {
  ipcMain.handle("video:check-renderer", async () => {
    try {
      const result = await resolveFfmpeg();
      return {
        available: true,
        ffmpegPath: result.path,
        version: result.version,
      };
    } catch (error) {
      return {
        available: false,
        error:
          error instanceof Error
            ? error.message
            : "FFmpeg is unavailable.",
      };
    }
  });

  ipcMain.handle("video:render-native", async (_event, plan) => {
    const workspace = await ensureWorkspace(plan?.projectName);
    const outputDirectory = path.join(workspace.video, plan?.renderMode === "preview" ? "Preview" : "History");
    const window = getMainWindow();

    const result = await renderNativeVideo({
      plan,
      outputDirectory,
      onProgress(progress) {
        if (window && !window.isDestroyed()) {
          window.webContents.send("video:render-progress", progress);
        }
      },
    });

    await shell.showItemInFolder(result.filePath);
    return result;
  });

  ipcMain.handle("video:open", async (_event, filePath) => shell.openPath(path.resolve(String(filePath || ""))));
  ipcMain.handle("video:preview-url", async (_event, filePath) => { const resolved=path.resolve(String(filePath||""));if(path.extname(resolved).toLowerCase()!==".mp4")throw new Error("Only rendered MP4 files can be previewed.");await fs.access(resolved);return pathToFileURL(resolved).href; });
  ipcMain.handle("video:open-folder", async (_event, projectName) => { const workspace=await ensureWorkspace(projectName); await shell.openPath(workspace.video); return workspace.video; });

  ipcMain.handle("video:cancel-native", async (_event, renderId) =>
    cancelNativeVideo(renderId),
  );
}

module.exports = { registerNativeVideoHandlers };
