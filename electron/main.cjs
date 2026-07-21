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
