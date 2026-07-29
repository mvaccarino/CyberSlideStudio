const { ipcMain, shell } = require("electron");
const path = require("node:path");
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
    const outputDirectory = path.join(workspace.root, "Video");
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

  ipcMain.handle("video:cancel-native", async (_event, renderId) =>
    cancelNativeVideo(renderId),
  );
}

module.exports = { registerNativeVideoHandlers };
