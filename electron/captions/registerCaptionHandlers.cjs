const { ipcMain, shell } = require("electron");
const fs = require("node:fs/promises");
const { generateCaptionAssets } = require("./captionEngine.cjs");

function registerCaptionHandlers({ ensureWorkspace }) {
  ipcMain.handle("captions:generate", async (_event, payload) => {
    if (!payload || !Array.isArray(payload.slides) || !payload.slides.length) throw new Error("Caption generation requires project slides.");
    const workspace = await ensureWorkspace(payload.projectName);
    return generateCaptionAssets({ captionsDirectory: workspace.captions, slides: payload.slides, scenes: payload.scenes, narrationPath: payload.narrationPath, timingPath: payload.timingPath, narrationMarker: payload.narrationMarker, overlaySettings: payload.overlaySettings, subtitleSettings: payload.subtitleSettings, force: payload.force === true });
  });
  ipcMain.handle("captions:open-folder", async (_event, projectName) => {
    const workspace = await ensureWorkspace(projectName);await fs.mkdir(workspace.captions,{recursive:true});const error=await shell.openPath(workspace.captions);if(error)throw new Error(`Unable to open Captions folder: ${error}`);return workspace.captions;
  });
}
module.exports={registerCaptionHandlers};
