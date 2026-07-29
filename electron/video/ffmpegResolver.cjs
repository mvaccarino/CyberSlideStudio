const { app } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");

function candidates() {
  const executable = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const values = [];

  if (process.env.CYBERSLIDE_FFMPEG_PATH) {
    values.push(process.env.CYBERSLIDE_FFMPEG_PATH);
  }

  if (app.isPackaged) {
    values.push(path.join(process.resourcesPath, "ffmpeg", executable));
    values.push(path.join(process.resourcesPath, executable));
  } else {
    values.push(path.join(__dirname, "..", "..", "resources", "ffmpeg", executable));
    values.push(path.join(process.cwd(), "resources", "ffmpeg", executable));
  }

  values.push(executable);
  return [...new Set(values)];
}

function testExecutable(executable) {
  return new Promise((resolve) => {
    const child = spawn(executable, ["-version"], {
      windowsHide: true,
      shell: false,
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.once("error", () => resolve(null));
    child.once("close", (code) => {
      if (code !== 0) return resolve(null);
      const firstLine = output.split(/\r?\n/).find(Boolean) || "FFmpeg";
      resolve({ path: executable, version: firstLine });
    });
  });
}

async function resolveFfmpeg() {
  for (const candidate of candidates()) {
    if (path.isAbsolute(candidate) && !fs.existsSync(candidate)) continue;
    const result = await testExecutable(candidate);
    if (result) return result;
  }

  throw new Error(
    "FFmpeg was not found. Install FFmpeg or place ffmpeg.exe in " +
      "C:\\CyberSlideStudio\\resources\\ffmpeg\\ffmpeg.exe.",
  );
}

module.exports = { resolveFfmpeg };
