const secureStore = require("./secureStore.cjs");
const fluxService = require("./fluxService.cjs");
const openAIImageService = require("./openAIImageService.cjs");
const {
  registerProductionPackageHandlers,
} = require("./productionPackageHandlers.cjs");
const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const { registerCyberSlideVoiceHandlers } = require("./voice/registerVoiceHandlers.cjs");
const path = require("node:path");
const fs = require("node:fs/promises");

let mainWindow = null;
let currentProjectPath = null;

function sanitizeProjectName(value) {
  return String(value || "CyberSlide Project")
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/[\r\n\t]/g, "")
    .trim()
    .replace(/[. ]+$/g, "") || "CyberSlide Project";
}

function workspaceRoot() {
  const drive = process.env.SystemDrive || "C:";
  return path.join(`${drive}${path.sep}`, "CyberSlide Projects");
}

function projectWorkspace(projectName) {
  const name = sanitizeProjectName(projectName);
  const root = path.join(workspaceRoot(), name);
  return {
    name,
    root,
    projectFile: path.join(root, `${name}.cslide`),
    draft: path.join(root, "Draft"),
    final: path.join(root, "Final"),
    production: path.join(root, "Production Package"),
    history: path.join(root, "History"),
    cache: path.join(root, "Cache"),
    voiceover: path.join(root, "Voiceover"),
  };
}

async function ensureWorkspace(projectName) {
  const workspace = projectWorkspace(projectName);
  await Promise.all([
    fs.mkdir(workspace.root, { recursive: true }),
    fs.mkdir(workspace.draft, { recursive: true }),
    fs.mkdir(workspace.final, { recursive: true }),
    fs.mkdir(workspace.production, { recursive: true }),
    fs.mkdir(workspace.history, { recursive: true }),
    fs.mkdir(workspace.cache, { recursive: true }),
    fs.mkdir(workspace.voiceover, { recursive: true }),
  ]);
  return workspace;
}

function sendMenuAction(action) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("menu:project-action", action);
  }
}

function buildApplicationMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Project",
          accelerator: "CmdOrCtrl+N",
          click: () => sendMenuAction("new"),
        },
        {
          label: "Open Project…",
          accelerator: "CmdOrCtrl+O",
          click: () => sendMenuAction("open"),
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => sendMenuAction("save"),
        },
        {
          label: "Save As…",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => sendMenuAction("saveAs"),
        },
        { type: "separator" },
        { role: process.platform === "darwin" ? "close" : "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { label: "Window", submenu: [{ role: "minimize" }, { role: "close" }] },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function chooseSavePath(defaultName) {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save CyberSlide Project As",
    defaultPath: defaultName.endsWith(".cslide")
      ? defaultName
      : `${defaultName}.cslide`,
    filters: [
      { name: "CyberSlide Project", extensions: ["cslide"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  return result.canceled ? null : result.filePath;
}

ipcMain.handle("project:open", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Open CyberSlide Project",
    properties: ["openFile"],
    filters: [
      { name: "CyberSlide Project", extensions: ["cslide"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const contents = await fs.readFile(filePath, "utf8");
  currentProjectPath = filePath;
  return { filePath, contents };
});

ipcMain.handle(
  "project:save",
  async (_event, { contents, suggestedName, forceSaveAs }) => {
    const workspace = await ensureWorkspace(suggestedName);
    let filePath = forceSaveAs ? await chooseSavePath(workspace.name) : currentProjectPath;

    if (!filePath) {
      filePath = workspace.projectFile;
    }

    if (!filePath) return null;
    if (!filePath.toLowerCase().endsWith(".cslide")) filePath += ".cslide";

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, contents, "utf8");
    currentProjectPath = filePath;
    return { filePath };
  },
);

ipcMain.handle("project:clear-current-path", () => {
  currentProjectPath = null;
});

ipcMain.handle("slide:save-final", async (_event, payload) => {
  const { dataUrl, slideNumber, projectName } = payload || {};
  if (
    typeof dataUrl !== "string" ||
    !dataUrl.startsWith("data:image/png;base64,")
  ) {
    throw new Error("The final slide renderer returned an invalid PNG.");
  }
  if (!Number.isInteger(slideNumber) || slideNumber < 1) {
    throw new Error("A valid slide number is required.");
  }

  const workspace = await ensureWorkspace(projectName);
  const filename = `slide-${String(slideNumber).padStart(2, "0")}-final.png`;
  const filePath = path.join(workspace.final, filename);
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  await fs.writeFile(filePath, Buffer.from(base64, "base64"));
  return { filePath };
});

ipcMain.handle("openai:save-api-key", async (_event, apiKey) => {
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error("Enter an OpenAI API key.");
  }
  await secureStore.setSecret("openAIApiKey", apiKey.trim());
  return true;
});

ipcMain.handle(
  "openai:has-api-key",
  async () => secureStore.hasSecret("openAIApiKey"),
);

ipcMain.handle("openai:test-connection", async () => {
  const apiKey = await secureStore.getSecret("openAIApiKey");
  if (!apiKey) throw new Error("No OpenAI API key has been saved.");
  return openAIImageService.testConnection(apiKey);
});

ipcMain.handle("openai:generate-posters", async (_event, payload) => {
  const apiKey = await secureStore.getSecret("openAIApiKey");
  if (!apiKey) throw new Error("No OpenAI API key has been saved.");

  const slideNumber = Number(payload?.slideNumber);
  if (!Number.isInteger(slideNumber) || slideNumber < 1) {
    throw new Error("A valid slide number is required.");
  }

  const workspace = await ensureWorkspace(payload?.projectName);
  const quality = payload?.quality || "low";
  const outputDirectory = quality === "high"
    ? workspace.final
    : workspace.draft;

  const generated = await openAIImageService.generatePosters({
    apiKey,
    prompt: payload?.prompt,
    count: payload?.count,
    quality,
    size: "1088x1920",
  });

  const posters = [];
  for (let index = 0; index < generated.length; index += 1) {
    const image = generated[index];
    const buffer = Buffer.from(image.base64, "base64");
    const suffix = generated.length > 1 ? `-concept-${index + 1}` : "";
    const stage = quality === "high" ? "final" : "draft";
    const filename =
      `slide-${String(slideNumber).padStart(2, "0")}${suffix}-${stage}.png`;
    const filePath = path.join(outputDirectory, filename);
    await fs.writeFile(filePath, buffer);
    posters.push({
      dataUrl: `data:image/png;base64,${image.base64}`,
      filePath,
      revisedPrompt: image.revisedPrompt,
    });
  }

  return { posters };
});

ipcMain.handle("flux:save-api-key", async (_event, apiKey) => {
  await secureStore.setSecret("fluxApiKey", apiKey);
  return true;
});
ipcMain.handle("flux:has-api-key", async () =>
  secureStore.hasSecret("fluxApiKey"),
);
ipcMain.handle("flux:test-connection", async () => {
  const apiKey = await secureStore.getSecret("fluxApiKey");
  if (!apiKey) throw new Error("No FLUX API key has been saved.");
  return fluxService.testConnection(apiKey);
});
ipcMain.handle("flux:generate-background", async (_event, payload) => {
  const apiKey = await secureStore.getSecret("fluxApiKey");
  if (!apiKey) throw new Error("No FLUX API key has been saved.");
  return fluxService.submitGeneration({ apiKey, ...payload });
});
ipcMain.handle("flux:wait", async (_event, requestId) => {
  const apiKey = await secureStore.getSecret("fluxApiKey");
  if (!apiKey) throw new Error("No FLUX API key saved.");
  return fluxService.waitForGeneration({ apiKey, requestId });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#07111f",
    title: "CyberSlide Studio",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

registerProductionPackageHandlers({
  getMainWindow: () => mainWindow,
  ensureWorkspace,
});

registerCyberSlideVoiceHandlers({ ensureWorkspace, getMainWindow: () => mainWindow });

app.whenReady().then(() => {
  buildApplicationMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
