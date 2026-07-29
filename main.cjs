const secureStore = require("./secureStore.cjs");
const fluxService = require("./fluxService.cjs");
const openAIImageService = require("./openAIImageService.cjs");
const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

let mainWindow = null;
let currentProjectPath = null;

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
        {
          role: process.platform === "darwin" ? "close" : "quit",
        },
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
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function chooseSavePath(defaultName) {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save CyberSlide Project",
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

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const contents = await fs.readFile(filePath, "utf8");
  currentProjectPath = filePath;

  return {
    filePath,
    contents,
  };
});

ipcMain.handle(
  "project:save",
  async (_event, { contents, suggestedName, forceSaveAs }) => {
    let filePath = forceSaveAs ? null : currentProjectPath;

    if (!filePath) {
      filePath = await chooseSavePath(suggestedName || "Untitled Project");
    }

    if (!filePath) {
      return null;
    }

    if (!filePath.toLowerCase().endsWith(".cslide")) {
      filePath += ".cslide";
    }

    await fs.writeFile(filePath, contents, "utf8");
    currentProjectPath = filePath;

    return { filePath };
  },
);

ipcMain.handle("project:clear-current-path", () => {
  currentProjectPath = null;
});

ipcMain.handle("flux:save-api-key", async (_event, apiKey) => {
  await secureStore.setSecret("fluxApiKey", apiKey);
  return true;
});

ipcMain.handle("flux:has-api-key", async () => {
  return secureStore.hasSecret("fluxApiKey");
});

ipcMain.handle("flux:test-connection", async () => {
  const apiKey = await secureStore.getSecret("fluxApiKey");

  if (!apiKey) {
    throw new Error("No FLUX API key has been saved.");
  }

  return fluxService.testConnection(apiKey);
});

ipcMain.handle("flux:generate-background", async (_event, payload) => {
  const apiKey = await secureStore.getSecret("fluxApiKey");

  if (!apiKey) {
    throw new Error("No FLUX API key has been saved.");
  }

  return fluxService.submitGeneration({
    apiKey,
    ...payload,
  });
});


ipcMain.handle(
  "slide:save-final",
  async (_event, { dataUrl, slideNumber }) => {
    if (!currentProjectPath) {
      throw new Error(
        "Save the .cslide project before exporting the final PNG.",
      );
    }

    if (
      typeof dataUrl !== "string" ||
      !dataUrl.startsWith("data:image/png;base64,")
    ) {
      throw new Error("The final slide renderer returned an invalid PNG.");
    }

    if (!Number.isInteger(slideNumber) || slideNumber < 1) {
      throw new Error("A valid slide number is required.");
    }

    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    const imageBuffer = Buffer.from(base64, "base64");

    const assetsDirectory = path.join(
      path.dirname(currentProjectPath),
      "assets",
    );

    await fs.mkdir(assetsDirectory, { recursive: true });

    const filename = `slide-${String(slideNumber).padStart(2, "0")}-final.png`;
    const filePath = path.join(assetsDirectory, filename);

    await fs.writeFile(filePath, imageBuffer);

    return { filePath };
  },
);


ipcMain.handle("openai:save-api-key", async (_event, apiKey) => {
  if (typeof apiKey !== "string" || !apiKey.trim()) throw new Error("Enter an OpenAI API key.");
  await secureStore.setSecret("openAIApiKey", apiKey.trim());
  return true;
});

ipcMain.handle("openai:has-api-key", async () => secureStore.hasSecret("openAIApiKey"));

ipcMain.handle("openai:test-connection", async () => {
  const apiKey = await secureStore.getSecret("openAIApiKey");
  if (!apiKey) throw new Error("No OpenAI API key has been saved.");
  return openAIImageService.testConnection(apiKey);
});

ipcMain.handle("openai:generate-posters", async (_event, payload) => {
  const apiKey = await secureStore.getSecret("openAIApiKey");
  if (!apiKey) throw new Error("No OpenAI API key has been saved.");
  if (!currentProjectPath) throw new Error("Save the .cslide project before generating posters.");

  const slideNumber = Number(payload?.slideNumber);
  if (!Number.isInteger(slideNumber) || slideNumber < 1) throw new Error("A valid slide number is required.");

  const generated = await openAIImageService.generatePosters({
    apiKey,
    prompt: payload?.prompt,
    count: payload?.count,
    quality: payload?.quality,
    size: "1088x1920",
  });

  const assetsDirectory = path.join(path.dirname(currentProjectPath), "assets");
  await fs.mkdir(assetsDirectory, { recursive: true });

  const posters = [];
  for (let index = 0; index < generated.length; index += 1) {
    const image = generated[index];
    const buffer = Buffer.from(image.base64, "base64");
    const suffix = generated.length > 1 ? `-concept-${index + 1}` : "";
    const filename = `slide-${String(slideNumber).padStart(2, "0")}${suffix}-ai.png`;
    const filePath = path.join(assetsDirectory, filename);
    await fs.writeFile(filePath, buffer);
    posters.push({
      dataUrl: `data:image/png;base64,${image.base64}`,
      filePath,
      revisedPrompt: image.revisedPrompt,
    });
  }

  return { posters };
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

app.whenReady().then(() => {
  buildApplicationMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("flux:wait", async (_event, requestId) => {
  const apiKey = await secureStore.getSecret("fluxApiKey");

  if (!apiKey) {
    throw new Error("No FLUX API key saved.");
  }

  return fluxService.waitForGeneration({
    apiKey,
    requestId,
  });
});

ipcMain.handle(
  "flux:generate-and-save",
  async (_event, { prompt, slideNumber, model = "flux-pro-1.1" }) => {
    const apiKey = await secureStore.getSecret("fluxApiKey");

    if (!apiKey) {
      throw new Error("No FLUX API key has been saved.");
    }

    if (!currentProjectPath) {
      throw new Error("Save the .cslide project before generating an image.");
    }

    const submitted = await fluxService.submitGeneration({
      apiKey,
      prompt,
      model,
      width: 768,
      height: 1344,
    });

    if (!submitted.polling_url) {
      throw new Error("FLUX did not return a polling URL.");
    }

    const completed = await fluxService.waitForGeneration({
      apiKey,
      pollingUrl: submitted.polling_url,
    });

    const imageUrl = completed.result?.sample;

    if (!imageUrl) {
      throw new Error("FLUX returned no downloadable image.");
    }

    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(
        `Unable to download generated image: ${imageResponse.status}`,
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const assetsDirectory = path.join(
      path.dirname(currentProjectPath),
      "assets",
    );

    await fs.mkdir(assetsDirectory, { recursive: true });

    const filename = `slide-${String(slideNumber).padStart(2, "0")}.png`;
    const filePath = path.join(assetsDirectory, filename);

    await fs.writeFile(filePath, imageBuffer);

    return {
      requestId: submitted.id,
      filePath,
      dataUrl: `data:image/png;base64,${imageBuffer.toString("base64")}`,
    };
  },
);