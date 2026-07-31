const { ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { spawn } = require("node:child_process");
const { resolveFfmpeg } = require("../video/ffmpegResolver.cjs");
const {
  getStatus,
  listVoices,
  loadModel,
  synthesizeWav,
} = require("./cyberSlideVoicePro.cjs");


function run(executable, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true, shell: false });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg narration assembly failed (${code}). ${stderr.slice(-1200)}`)));
  });
}

async function buildFullNarration(scenes, outputPath) {
  const ffmpeg = await resolveFfmpeg();
  const args = ["-y"];
  scenes.forEach((scene) => args.push("-i", scene.audioPath));
  const filters = scenes.map((scene, index) => {
    const delay = Math.round(scene.paddingBeforeSeconds * 1000);
    return `[${index}:a]adelay=${delay}|${delay},apad,atrim=0:${scene.sceneDurationSeconds.toFixed(3)}[a${index}]`;
  });
  filters.push(`${scenes.map((_scene, index) => `[a${index}]`).join("")}concat=n=${scenes.length}:v=0:a=1[out]`);
  args.push("-filter_complex", filters.join(";"), "-map", "[out]", "-ar", "48000", "-ac", "2", outputPath);
  await run(ffmpeg.path, args);
}
function narrationForSlide(slide) {
  return String(slide?.editorialPackage?.narration || "").trim();
}

function registerCyberSlideVoiceHandlers({ ensureWorkspace, getMainWindow }) {
  const sendProgress = (payload) => {
    const window = typeof getMainWindow === "function" ? getMainWindow() : null;
    if (window && !window.isDestroyed()) {
      window.webContents.send("voice:progress", payload);
    }
  };

  ipcMain.handle("voice:status", async () => getStatus());
  ipcMain.handle("voice:list", async () => listVoices());

  ipcMain.handle("voice:prepare", async () => {
    sendProgress({ phase: "model", percent: 0, message: "Preparing CyberSlide Voice Proâ€¦" });
    await loadModel((progress) => {
      const percent = Number(progress?.progress || 0);
      sendProgress({
        phase: "model",
        percent: Number.isFinite(percent) ? Math.round(percent) : 0,
        message: progress?.file ? `Downloading ${progress.file}â€¦` : "Loading the local neural voice modelâ€¦",
      });
    });
    sendProgress({ phase: "ready", percent: 100, message: "CyberSlide Voice Pro is ready." });
    return getStatus();
  });

  ipcMain.handle("voice:generate", async (_event, payload) => {
    const slides = Array.isArray(payload?.slides) ? payload.slides : [];
    if (!slides.length) throw new Error("Add at least one slide before generating narration.");
    if (!payload?.voiceId) throw new Error("Select a CyberSlide Voice Pro voice.");

    const workspace = await ensureWorkspace(payload?.projectName);
    const voiceRoot = workspace.voiceover;
    const sceneRoot = path.join(voiceRoot, "Scene-Audio");
    await fs.mkdir(sceneRoot, { recursive: true });

    const timing = [];
    let cursor = 0;
    const paddingBefore = Math.max(0, Number(payload?.paddingBefore) || 0.12);
    const paddingAfter = Math.max(0, Number(payload?.paddingAfter) || 0.28);

    for (let index = 0; index < slides.length; index += 1) {
      const slide = slides[index];
      const text = narrationForSlide(slide);
      if (!text) continue;
      const slideNumber = slide.number || index + 1;
      const outputPath = path.join(sceneRoot, `slide-${String(slideNumber).padStart(2, "0")}.wav`);

      sendProgress({
        phase: "scene",
        percent: Math.round((index / slides.length) * 100),
        currentScene: index + 1,
        totalScenes: slides.length,
        message: `Generating professional narration for slide ${slideNumber}â€¦`,
      });

      const result = await synthesizeWav({
        text,
        voiceId: payload.voiceId,
        speed: payload.speed,
        outputPath,
        onProgress: (progress) => {
          sendProgress({
            phase: "model",
            percent: Math.round(Number(progress?.progress || 0)),
            message: "Downloading the local neural voice model for first useâ€¦",
          });
        },
      });

      const sceneDuration = paddingBefore + result.durationSeconds + paddingAfter;
      timing.push({
        slideNumber,
        text,
        audioPath: outputPath,
        audioDurationSeconds: result.durationSeconds,
        paddingBeforeSeconds: paddingBefore,
        paddingAfterSeconds: paddingAfter,
        sceneStartSeconds: cursor,
        sceneEndSeconds: cursor + sceneDuration,
        sceneDurationSeconds: sceneDuration,
      });
      cursor += sceneDuration;
    }

    if (!timing.length) throw new Error("No narration text was found in the slides.");

    const timingPath = path.join(voiceRoot, "timing.json");
    const manifest = {
      provider: "CyberSlide Voice Pro",
      engine: "Kokoro-82M ONNX",
      model: "onnx-community/Kokoro-82M-v1.0-ONNX",
      voiceId: payload.voiceId,
      speed: Number(payload.speed) || 1,
      generatedAt: new Date().toISOString(),
      totalDurationSeconds: cursor,
      scenes: timing,
    };
    await fs.writeFile(timingPath, JSON.stringify(manifest, null, 2), "utf8");
    const narrationPath = path.join(voiceRoot, "Full-Narration.wav");
    await buildFullNarration(timing, narrationPath);

    sendProgress({ phase: "complete", percent: 100, message: "Professional narration complete." });
    return { folderPath: voiceRoot, timingPath, narrationPath, totalDurationSeconds: cursor, generatedAt: manifest.generatedAt, scenes: timing };
  });

  ipcMain.handle("voice:preview", async (_event, payload) => {
    const workspace = await ensureWorkspace(payload?.projectName || "CyberSlide Preview");
    const outputPath = path.join(workspace.cache, "voice-pro-preview.wav");
    const result = await synthesizeWav({
      text: payload?.text || "CyberSlide Voice Pro is ready to narrate your next cybersecurity video.",
      voiceId: payload?.voiceId,
      speed: payload?.speed,
      outputPath,
      onProgress: (progress) => sendProgress({
        phase: "model",
        percent: Math.round(Number(progress?.progress || 0)),
        message: "Downloading the local neural voice model for first useâ€¦",
      }),
    });
    await shell.openPath(result.outputPath);
    return result;
  });

  ipcMain.handle("voice:open-folder", async (_event, projectName) => {
    const workspace = await ensureWorkspace(projectName);
    const folderPath = workspace.voiceover;
    await fs.mkdir(folderPath, { recursive: true });
    await shell.openPath(folderPath);
    return folderPath;
  });
}

module.exports = { registerCyberSlideVoiceHandlers };
