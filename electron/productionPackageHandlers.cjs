const { BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

async function writePdf(html, filePath) {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true },
  });

  try {
    await win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );
    const buffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
      margins: { top: 0.35, bottom: 0.35, left: 0.35, right: 0.35 },
    });
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  } finally {
    win.destroy();
  }
}

function registerProductionPackageHandlers({ ensureWorkspace }) {
  ipcMain.handle("production:export-package", async (_event, payload) => {
    const workspace = await ensureWorkspace(payload?.projectName);
    const root = workspace.production;

    await fs.rm(root, { recursive: true, force: true });
    await fs.mkdir(root, { recursive: true });

    for (const file of payload?.files ?? []) {
      const filePath = path.join(root, file.relativePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, String(file.contents ?? ""), "utf8");
    }

    for (const image of payload?.images ?? []) {
      if (
        typeof image.dataUrl !== "string" ||
        !image.dataUrl.startsWith("data:image/png;base64,")
      ) {
        continue;
      }

      const filePath = path.join(root, image.relativePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const base64 = image.dataUrl.replace(
        /^data:image\/png;base64,/,
        "",
      );
      await fs.writeFile(filePath, Buffer.from(base64, "base64"));
    }

    for (const pdf of payload?.pdfs ?? []) {
      await writePdf(pdf.html, path.join(root, pdf.relativePath));
    }

    await shell.openPath(root);
    return { folderPath: root };
  });
}

module.exports = { registerProductionPackageHandlers };
