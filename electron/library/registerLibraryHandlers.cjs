const path = require("node:path");
const { shell } = require("electron");
const { ensureSeedTemplates } = require("./seedLibrary.cjs");
const { ensureLibrary, scanLibrary, readActivity, toggleFavorite, recordUsed } = require("./libraryService.cjs");

function validateId(id) {
  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]{1,127}$/i.test(id)) throw new Error("Invalid Content Library template id.");
  return id;
}

function registerLibraryHandlers({ ipcMain, app }) {
  const root = path.resolve(__dirname, "..", "..", "ContentLibrary");
  const activityPath = () => path.join(app.getPath("userData"), "content-library-activity.json");
  ipcMain.handle("library:scan", async () => {
    await ensureSeedTemplates(root);
    return scanLibrary(root);
  });
  ipcMain.handle("library:activity", () => readActivity(activityPath()));
  ipcMain.handle("library:toggle-favorite", (_event, id) => toggleFavorite(activityPath(), validateId(id)));
  ipcMain.handle("library:record-used", (_event, id) => recordUsed(activityPath(), validateId(id)));
  ipcMain.handle("library:open", async () => {
    await ensureLibrary(root);
    const error = await shell.openPath(root);
    if (error) throw new Error(`Unable to open Content Library: ${error}`);
  });
}

module.exports = { registerLibraryHandlers };
