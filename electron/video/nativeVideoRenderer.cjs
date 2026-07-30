const path = require("node:path");
const fs = require("node:fs/promises");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { resolveFfmpeg } = require("./ffmpegResolver.cjs");
const { totalDuration, validatePlan } = require("./videoPlan.cjs");
const { escapeAssFilterPath } = require("../captions/captionEngine.cjs");

const activeRenders = new Map();

function runProcess(executable, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      windowsHide: true,
      shell: false,
      ...options,
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      options.onStderr?.(text);
    });

    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) return resolve();
      if (signal === "SIGTERM" || signal === "SIGKILL") {
        return reject(new Error("Video render cancelled."));
      }

      reject(
        new Error(`FFmpeg exited with code ${code}.\n${stderr.slice(-3000)}`),
      );
    });

    options.onChild?.(child);
  });
}

function motionFilter(scene, width, height, fps) {
  const frames = Math.max(1, Math.round(scene.durationSeconds * fps));
  const common =
    `scale=${width + 160}:${height + 284}:force_original_aspect_ratio=increase,` +
    `crop=${width + 120}:${height + 220}`;

  if (scene.motion === "slow-zoom-out" || scene.motion === "pull") {
    return (
      `${common},zoompan=` +
      `z='if(eq(on,1),1.075,max(1.0,zoom-0.00032))':` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
      `d=${frames}:s=${width}x${height}:fps=${fps}`
    );
  }

  if (scene.motion === "documentary-drift") {
    return (
      `${common},zoompan=` +
      `z='min(1.055,1.015+on*0.00018)':` +
      `x='iw/2-(iw/zoom/2)+sin(on/35)*10':y='ih/2-(ih/zoom/2)+cos(on/42)*8':` +
      `d=${frames}:s=${width}x${height}:fps=${fps}`
    );
  }
  if (scene.motion === "pan-left") {
    return (
      `${common},zoompan=` +
      `z='1.045':x='max(0,(iw-iw/zoom)*(1-on/${frames}))':` +
      `y='ih/2-(ih/zoom/2)':d=${frames}:s=${width}x${height}:fps=${fps}`
    );
  }

  if (scene.motion === "pan-right") {
    return (
      `${common},zoompan=` +
      `z='1.045':x='min(iw-iw/zoom,(iw-iw/zoom)*(on/${frames}))':` +
      `y='ih/2-(ih/zoom/2)':d=${frames}:s=${width}x${height}:fps=${fps}`
    );
  }

  return (
    `${common},zoompan=` +
    `z='min(1.075,1.0+on*0.00032)':` +
    `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
    `d=${frames}:s=${width}x${height}:fps=${fps}`
  );
}

function ffmpegTransition(value) {
  const map = {
    fade: "fade",
    dissolve: "dissolve",
    "cinematic-dissolve": "dissolve",
    "wipe-left": "wipeleft",
    "wipe-right": "wiperight",
    "slide-left": "slideleft",
    "slide-right": "slideright",
  };
  return map[value] || "fade";
}

async function renderScene({
  ffmpegPath,
  scene,
  outputPath,
  width,
  height,
  fps,
  registerChild,
}) {
  const filter = `${motionFilter(scene, width, height, fps)},format=yuv420p`;

  await runProcess(
    ffmpegPath,
    [
      "-y",
      "-loop",
      "1",
      "-i",
      scene.imagePath,
      "-t",
      scene.durationSeconds.toFixed(3),
      "-vf",
      filter,
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(fps),
      outputPath,
    ],
    { onChild: registerChild },
  );
}

function buildXfadeGraph(plan) {
  if (plan.scenes.length === 1) return null;

  const filters = [];
  let cumulative = plan.scenes[0].durationSeconds;
  let previous = "[0:v]";

  for (let index = 1; index < plan.scenes.length; index += 1) {
    const scene = plan.scenes[index];
    const transitionSeconds = scene.transitionSeconds;
    const offset = Math.max(0, cumulative - transitionSeconds);
    const output = index === plan.scenes.length - 1 ? "[vout]" : `[v${index}]`;

    filters.push(
      `${previous}[${index}:v]xfade=` +
        `transition=${ffmpegTransition(scene.transition)}:` +
        `duration=${transitionSeconds.toFixed(3)}:` +
        `offset=${offset.toFixed(3)}${output}`,
    );

    previous = output;
    cumulative += scene.durationSeconds - transitionSeconds;
  }

  return filters.join(";");
}

async function assembleScenes({
  ffmpegPath,
  plan,
  scenePaths,
  outputPath,
  registerChild,
}) {
  if (scenePaths.length === 1) {
    await fs.copyFile(scenePaths[0], outputPath);
    return;
  }

  const args = ["-y"];
  scenePaths.forEach((scenePath) => {
    args.push("-i", scenePath);
  });

  args.push(
    "-filter_complex",
    buildXfadeGraph(plan),
    "-map",
    "[vout]",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    outputPath,
  );

  await runProcess(ffmpegPath, args, { onChild: registerChild });
}

async function muxVoiceover({
  ffmpegPath,
  videoPath,
  voiceoverPath,
  outputPath,
  durationSeconds,
  registerChild,
}) {
  await runProcess(
    ffmpegPath,
    [
      "-y",
      "-i",
      videoPath,
      "-i",
      voiceoverPath,
      "-filter:a",
      "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "256k",
      "-t",
      durationSeconds.toFixed(3),
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { onChild: registerChild },
  );
}

async function applyTextLayers({
  ffmpegPath,
  videoPath,
  overlayPath,
  subtitlePath,
  outputPath,
  registerChild,
}) {
  const layers = [overlayPath, subtitlePath].filter(Boolean);
  if (!layers.length) {
    await fs.copyFile(videoPath, outputPath);
    return;
  }
  for (const layer of layers) {
    try {
      await fs.access(layer);
    } catch {
      throw new Error(`Text rendering asset is unavailable: ${layer}`);
    }
    if (path.extname(layer).toLowerCase() !== ".ass")
      throw new Error(`Text rendering asset must be an ASS file: ${layer}`);
  }
  const filter = layers
    .map((layer) => `ass=filename='${escapeAssFilterPath(layer)}'`)
    .join(",");
  try {
    await runProcess(
      ffmpegPath,
      [
        "-y",
        "-i",
        videoPath,
        "-vf",
        filter,
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      { onChild: registerChild },
    );
  } catch (error) {
    throw new Error(
      `FFmpeg could not burn the text/subtitle layers. Verify the ASS assets and installed fonts. ${error.message}`,
    );
  }
}
async function renderNativeVideo({
  plan: rawPlan,
  outputDirectory,
  onProgress,
}) {
  const plan = validatePlan(rawPlan);
  const ffmpeg = await resolveFfmpeg();
  const renderId = crypto.randomUUID();
  const tempDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "cyberslide-video-"),
  );
  const durationSeconds = totalDuration(plan);
  const outputPath = path.join(outputDirectory, plan.outputFileName);
  const scenePaths = [];
  let child = null;
  let cancelled = false;

  activeRenders.set(renderId, {
    cancel() {
      cancelled = true;
      if (child && !child.killed) child.kill("SIGTERM");
    },
  });

  const progress = (payload) =>
    onProgress?.({
      renderId,
      totalScenes: plan.scenes.length,
      completedScenes: 0,
      percent: 0,
      ...payload,
    });

  const registerChild = (value) => {
    child = value;
    if (cancelled && child && !child.killed) child.kill("SIGTERM");
  };

  try {
    await fs.mkdir(outputDirectory, { recursive: true });

    progress({
      phase: "preparing",
      message: "Preparing the native video renderÃ¢â‚¬Â¦",
    });

    for (let index = 0; index < plan.scenes.length; index += 1) {
      if (cancelled) throw new Error("Video render cancelled.");

      const scene = plan.scenes[index];
      const scenePath = path.join(
        tempDirectory,
        `scene-${String(index + 1).padStart(3, "0")}.mp4`,
      );
      scenePaths.push(scenePath);

      progress({
        phase: "rendering-scenes",
        sceneNumber: scene.slideNumber,
        completedScenes: index,
        percent: Math.round((index / plan.scenes.length) * 70),
        message:
          `Rendering motion for slide ${scene.slideNumber} ` +
          `(${index + 1} of ${plan.scenes.length})Ã¢â‚¬Â¦`,
      });

      await renderScene({
        ffmpegPath: ffmpeg.path,
        scene,
        outputPath: scenePath,
        width: plan.width,
        height: plan.height,
        fps: plan.fps,
        registerChild,
      });
    }

    const assembledPath = path.join(tempDirectory, "assembled.mp4");

    progress({
      phase: "assembling",
      completedScenes: plan.scenes.length,
      percent: 76,
      message: "Adding transitions and assembling the videoÃ¢â‚¬Â¦",
    });

    await assembleScenes({
      ffmpegPath: ffmpeg.path,
      plan,
      scenePaths,
      outputPath: assembledPath,
      registerChild,
    });

    const layeredPath = path.join(tempDirectory, "layered.mp4");
    progress({
      phase: "assembling",
      completedScenes: plan.scenes.length,
      percent: 84,
      message: "Burning temporary headlines and narration subtitlesâ€¦",
    });
    await applyTextLayers({
      ffmpegPath: ffmpeg.path,
      videoPath: assembledPath,
      overlayPath: plan.overlayPath,
      subtitlePath: plan.subtitlePath,
      outputPath: layeredPath,
      registerChild,
    });

    const audioPath =
      plan.finalMixPath || plan.narrationPath || plan.voiceoverPath;
    if (audioPath) {
      progress({
        phase: "adding-audio",
        completedScenes: plan.scenes.length,
        percent: 91,
        message: "Normalizing and adding the voiceoverÃ¢â‚¬Â¦",
      });

      await muxVoiceover({
        ffmpegPath: ffmpeg.path,
        videoPath: layeredPath,
        voiceoverPath: audioPath,
        outputPath,
        durationSeconds,
        registerChild,
      });
    } else {
      await fs.copyFile(layeredPath, outputPath);
    }

    progress({
      phase: "complete",
      completedScenes: plan.scenes.length,
      percent: 100,
      message: "Final MP4 render complete.",
    });

    const outputStat = await fs.stat(outputPath);
    return {
      renderId,
      filePath: outputPath,
      durationSeconds,
      width: plan.width,
      height: plan.height,
      fileSizeBytes: outputStat.size,
      renderedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (cancelled || String(error?.message).includes("cancelled")) {
      progress({
        phase: "cancelled",
        completedScenes: 0,
        percent: 0,
        message: "Video render cancelled.",
      });
    } else {
      progress({
        phase: "error",
        completedScenes: 0,
        percent: 0,
        message:
          error instanceof Error ? error.message : "Video render failed.",
      });
    }
    throw error;
  } finally {
    activeRenders.delete(renderId);
    await fs.rm(tempDirectory, { recursive: true, force: true });
  }
}

function cancelNativeVideo(renderId) {
  const render = activeRenders.get(renderId);
  if (!render) return false;
  render.cancel();
  return true;
}

module.exports = {
  cancelNativeVideo,
  renderNativeVideo,
};
