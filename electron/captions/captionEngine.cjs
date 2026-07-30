const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { buildEditorialAss, PRESETS } = require("./editorialEngine.cjs");
const OVERLAY_THEMES = {
  "Cybersecurity Professional": {
    titleFont: "Arial",
    titleSize: 76,
    titleColor: "#FFFFFF",
  },
  "Netflix Documentary": {
    titleFont: "Georgia",
    titleSize: 72,
    titleColor: "#FFFFFF",
  },
  Corporate: { titleFont: "Arial", titleSize: 68, titleColor: "#FFFFFF" },
  Educational: { titleFont: "Arial", titleSize: 70, titleColor: "#FFFFFF" },
  "Fast Social": { titleFont: "Arial", titleSize: 82, titleColor: "#FFFFFF" },
  "Viral Short": { titleFont: "Arial", titleSize: 86, titleColor: "#FFFFFF" },
  "News Report": { titleFont: "Arial", titleSize: 70, titleColor: "#FFFFFF" },
};
const SUBTITLE_STYLES = {
  CyberSlide: { font: "Arial", color: "&H00FFFFFF", outline: 4, shadow: 2 },
  Professional: { font: "Arial", color: "&H00FFFFFF", outline: 3, shadow: 2 },
  Documentary: { font: "Georgia", color: "&H00FFFFFF", outline: 3, shadow: 2 },
  Minimal: { font: "Arial", color: "&H00FFFFFF", outline: 2, shadow: 1 },
  Energetic: { font: "Arial", color: "&H00FFFFFF", outline: 5, shadow: 2 },
  Corporate: { font: "Arial", color: "&H00FFFFFF", outline: 3, shadow: 1 },
};
const DEFAULT_OVERLAY = {
  enabled: true,
  headlineMode: "brief",
  posterStyle: "Editorial Bold",
  posterTextMode: "persistent",
  alignment: "auto",
  highlightColor: "#20D7FF",
  showLayoutGuides: false,
  theme: "Cybersecurity Professional",
  duration: 1.8,
  fontSize: 108,
  maximumLines: 5,
  topMargin: 180,
  fadeInDuration: 0.18,
  fadeOutDuration: 0.35,
  gradientEnabled: true,
  gradientOpacity: 0.42,
  titleFont: "Arial",
  titleColor: "#FFFFFF",
  bodyOverlayEnabled: false,
  generatedPath: null,
  generatedAt: null,
  freshness: null,
  layoutFingerprint: null,
};
const DEFAULT_SUBTITLES = {
  enabled: true,
  style: "CyberSlide",
  fontSize: 54,
  wordsPerGroup: 5,
  highlightColor: "#20D7FF",
  showLayoutGuides: false,
  safeAreaPercent: 25,
  safeMargin: 240,
  verticalPosition: "safe-center",
  gradientEnabled: true,
  gradientOpacity: 0.34,
  captionsJsonPath: null,
  srtPath: null,
  assPath: null,
  generatedAt: null,
  freshness: null,
  layoutWarnings: [],
};
const hash = (value) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const assTime = (seconds) => {
  const cs = Math.max(0, Math.round(seconds * 100));
  const h = Math.floor(cs / 360000),
    m = Math.floor((cs % 360000) / 6000),
    s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
};
const srtTime = (seconds) => {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3600000),
    m = Math.floor((ms % 3600000) / 60000),
    s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
};
const assText = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\N")
    .replace(/[{}]/g, "");
const hexToAss = (value) => {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(value || ""));
  if (!match) return "&H00FFFFFF";
  const v = match[1];
  return `&H00${v.slice(4, 6)}${v.slice(2, 4)}${v.slice(0, 2)}`.toUpperCase();
};
const opacityAlpha = (opacity) =>
  Math.round((1 - Math.max(0, Math.min(1, Number(opacity) || 0))) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
function wrapTwoLines(text, maxChars = 34) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "";
  const lines = [""];
  for (const word of words) {
    const current = lines.at(-1),
      candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || (lines.length === 1 && !current))
      lines[lines.length - 1] = candidate;
    else if (lines.length < 2) lines.push(word);
    else lines[1] += ` ${word}`;
  }
  return lines.join("\\N");
}
function groupCaptionWords(text, target = 5) {
  const words = String(text || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean),
    groups = [];
  let current = [];
  for (const word of words) {
    current.push(word);
    if (
      current.length >= 3 &&
      (/[.!?,;:]$/.test(word) ||
        current.length >= Math.max(3, Math.min(6, target)))
    ) {
      groups.push(current);
      current = [];
    }
  }
  if (
    current.length &&
    groups.length &&
    current.length < 3 &&
    groups.at(-1).length + current.length <= 6
  )
    groups.at(-1).push(...current);
  else if (current.length) groups.push(current);
  return groups;
}
function wordWeight(word) {
  return Math.max(
    0.65,
    1 +
      Math.max(0, String(word).replace(/[^\p{L}\p{N}]/gu, "").length - 5) *
        0.035 +
      (/[.!?]$/.test(word) ? 0.7 : /[,;:]$/.test(word) ? 0.35 : 0),
  );
}
function buildCaptionEvents(scenes, wordsPerGroup = 5) {
  const events = [];
  for (const scene of scenes) {
    const groups = groupCaptionWords(scene.text, wordsPerGroup);
    if (!groups.length) continue;
    const start =
        Number(scene.sceneStartSeconds) +
        Number(scene.paddingBeforeSeconds || 0),
      end = Math.max(
        start + 0.05,
        Number(scene.sceneEndSeconds) - Number(scene.paddingAfterSeconds || 0),
      ),
      weights = groups.map((group) =>
        group.reduce((sum, word) => sum + wordWeight(word), 0),
      ),
      total = weights.reduce((a, b) => a + b, 0);
    let cursor = start;
    groups.forEach((words, index) => {
      const eventEnd =
        index === groups.length - 1
          ? end
          : Math.min(end, cursor + ((end - start) * weights[index]) / total);
      events.push({
        slideNumber: scene.slideNumber,
        startSeconds: cursor,
        endSeconds: Math.max(cursor + 0.04, eventEnd),
        words,
        text: words.join(" "),
        lines: wrapTwoLines(words.join(" "), 28),
        source: "narration",
      });
      cursor = eventEnd;
    });
  }
  return events
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .map((event, index, array) =>
      index && event.startSeconds < array[index - 1].endSeconds
        ? { ...event, startSeconds: array[index - 1].endSeconds }
        : event,
    );
}
function assHeader(styles) {
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\n${styles.join("\n")}\n\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n`;
}
function gradientEvents(start, end, position, opacity) {
  const events = [],
    bands = 5;
  for (let index = 0; index < bands; index++) {
    const alpha = opacityAlpha(opacity * (1 - index / bands)),
      y1 = position === "top" ? index * 70 : 1920 - (bands - index) * 75,
      y2 =
        position === "top" ? (index + 1) * 70 : 1920 - (bands - index - 1) * 75;
    events.push(
      `Dialogue: 0,${start},${end},Gradient,,0,0,0,,{\\an7\\pos(0,0)\\p1\\1c&H000000&\\1a&H${alpha}&}m 0 ${y1} l 1080 ${y1} 1080 ${y2} 0 ${y2}`,
    );
  }
  return events;
}
function headlineDuplicatesNarration(title, narration) {
  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const headline = normalize(title),
    spoken = normalize(narration);
  if (!headline || !spoken) return false;
  if (spoken.startsWith(headline) || headline.startsWith(spoken)) return true;
  const titleWords = new Set(headline.split(" ")),
    opening = new Set(
      spoken.split(" ").slice(0, Math.max(titleWords.size + 2, 6)),
    ),
    intersection = [...titleWords].filter((word) => opening.has(word)).length;
  return intersection / Math.max(1, titleWords.size) >= 0.8;
}
function buildOverlayAss(slides, scenes, settings = {}) {
  return buildEditorialAss(slides, scenes, { ...DEFAULT_OVERLAY, ...settings });
}
function captionIntervals(events) {
  const map = new Map();
  for (const event of events) {
    const current = map.get(event.slideNumber);
    map.set(
      event.slideNumber,
      current
        ? {
            start: Math.min(current.start, event.startSeconds),
            end: Math.max(current.end, event.endSeconds),
          }
        : { start: event.startSeconds, end: event.endSeconds },
    );
  }
  return [...map.values()];
}
function captionY(safePercent=25,position="safe-center",fontSize=54){
  const safeTop=1920*(1-safePercent/100),safeBottom=1920-180,ratio=position==="high"?.34:position==="low"?.68:.52,halfHeight=Math.ceil(Math.max(42,Number(fontSize)*1.35)),target=Math.round(safeTop+(safeBottom-safeTop)*ratio);
  return Math.max(Math.round(safeTop+halfHeight),Math.min(Math.round(safeBottom-halfHeight),target));
}
function buildSubtitleAss(events, settings = {}) {
  const resolved = { ...DEFAULT_SUBTITLES, ...settings },
    preset = SUBTITLE_STYLES[resolved.style] || SUBTITLE_STYLES.CyberSlide,
    highlight = hexToAss(resolved.highlightColor),
    safePercent = [20, 25, 30].includes(Number(resolved.safeAreaPercent))
      ? Number(resolved.safeAreaPercent)
      : 25,
    captionPositionY = captionY(safePercent,resolved.verticalPosition,resolved.fontSize);
  const styles = [
      `Style: Gradient,Arial,1,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1`,
      `Style: Captions,${preset.font},${resolved.fontSize},${preset.color},${highlight},&H00101010,&H80000000,-1,0,0,0,100,100,0,0,1,${preset.outline},${preset.shadow},5,70,70,0,1`,
    ],
    lines = [];
  if (resolved.gradientEnabled !== false)
    for (const interval of captionIntervals(events))
      lines.push(
        ...gradientEvents(
          assTime(interval.start),
          assTime(interval.end),
          "bottom",
          Number(resolved.gradientOpacity) || 0.34,
        ),
      );
  for (const event of events) {
    const duration = Math.max(
        1,
        Math.round((event.endSeconds - event.startSeconds) * 100),
      ),
      per = Math.max(1, Math.floor(duration / event.words.length)),
      firstLineWords = String(event.lines || "").split("\\N")[0].trim().split(/\s+/).filter(Boolean).length,
      karaoke = event.words
        .map((word, index) => `{\\k${per}}${assText(word)}${index + 1 === firstLineWords && index + 1 < event.words.length ? "\\N" : ""}`)
        .join(" ");
    lines.push(
      `Dialogue: 2,${assTime(event.startSeconds)},${assTime(event.endSeconds)},Captions,,0,0,0,,{\\an5\\pos(540,${captionPositionY})\\t(0,120,\\fscx105\\fscy105)}${karaoke}`,
    );
  }
  return assHeader(styles) + lines.join("\n") + "\n";
}
function overlayFreshness(slides, scenes, settings) {
  const relevant = {
    enabled: settings.enabled,
    posterStyle: settings.posterStyle,
    posterTextMode: settings.posterTextMode,
    duration: settings.duration,
    alignment: settings.alignment,
    highlightColor: settings.highlightColor,
    gradientEnabled: settings.gradientEnabled,
    gradientOpacity: settings.gradientOpacity,
    titleFont: settings.titleFont,
    titleSize: settings.titleSize,
    safeMargins: settings.safeMargins,
    layoutFingerprint: settings.layoutFingerprint,
  };
  return hash({
    slides: slides.map((slide) => ({
      number: slide.number,
      title: slide.title,
      body: slide.body,
      editorial: slide.editorial,
    })),
    scenes: scenes.map((scene) => ({
      slideNumber: scene.slideNumber,
      start: scene.sceneStartSeconds,
      end: scene.sceneEndSeconds,
    })),
    settings: relevant,
  });
}
function subtitleFreshness(scenes, narrationPath, timingPath, settings) {
  return hash({
    narrationPath,
    timingPath,
    scenes: scenes.map((scene) => ({
      slideNumber: scene.slideNumber,
      text: scene.text,
      start: scene.sceneStartSeconds,
      end: scene.sceneEndSeconds,
      paddingBefore: scene.paddingBeforeSeconds,
      paddingAfter: scene.paddingAfterSeconds,
    })),
    settings: {
      ...settings,
      captionsJsonPath: null,
      srtPath: null,
      assPath: null,
      generatedAt: null,
      freshness: null,
      layoutWarnings: null,
    },
  });
}
async function exists(filePath) {
  if (!filePath) return false;
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function generateCaptionAssets({
  captionsDirectory,
  slides,
  scenes,
  narrationPath,
  timingPath,
  narrationMarker,
  overlaySettings = {},
  subtitleSettings = {},
  force = false,
}) {
  if (!Array.isArray(scenes) || !scenes.length)
    throw new Error(
      "Voice timing scenes are required to generate headlines and subtitles.",
    );
  await fs.mkdir(captionsDirectory, { recursive: true });
  const overlay = {
      ...DEFAULT_OVERLAY,
      ...overlaySettings,
      bodyOverlayEnabled: false,
    },
    subtitles = { ...DEFAULT_SUBTITLES, ...subtitleSettings },
    now = new Date().toISOString(),
    events = buildCaptionEvents(scenes, subtitles.wordsPerGroup),
    warnings = slides
      .filter((slide) => slide.layoutWarning)
      .map((slide) => `Slide ${slide.number}: ${slide.layoutWarning}`);
  subtitles.layoutWarnings = warnings;
  const overlayPath = path.join(captionsDirectory, "slide-overlay.ass"),
    jsonPath = path.join(captionsDirectory, "captions.json"),
    srtPath = path.join(captionsDirectory, "captions.srt"),
    assPath = path.join(captionsDirectory, "captions.ass"),
    overlayMark = overlayFreshness(slides, scenes, overlay),
    subtitleMark = subtitleFreshness(
      scenes,
      `${narrationPath || ""}|${narrationMarker || ""}`,
      timingPath,
      subtitles,
    ),
    headlineEnabled = overlay.enabled === true,
    overlayCurrent =
      !headlineEnabled ||
      (!force &&
        overlay.freshness === overlayMark &&
        (await exists(overlay.generatedPath))),
    subtitleCurrent =
      !force &&
      subtitles.freshness === subtitleMark &&
      (await exists(subtitles.captionsJsonPath)) &&
      (await exists(subtitles.srtPath)) &&
      (await exists(subtitles.assPath));
  if (headlineEnabled && !overlayCurrent)
    await fs.writeFile(
      overlayPath,
      buildOverlayAss(slides, scenes, overlay),
      "utf8",
    );
  if (!subtitleCurrent) {
    await fs.writeFile(
      jsonPath,
      JSON.stringify(
        {
          version: 2,
          generatedAt: now,
          source: "narration",
          layoutWarnings: warnings,
          events,
        },
        null,
        2,
      ),
      "utf8",
    );
    await fs.writeFile(
      srtPath,
      events
        .map(
          (event, index) =>
            `${index + 1}\n${srtTime(event.startSeconds)} --> ${srtTime(event.endSeconds)}\n${event.lines.replace(/\\N/g, "\n")}`,
        )
        .join("\n\n") + "\n",
      "utf8",
    );
    await fs.writeFile(assPath, buildSubtitleAss(events, subtitles), "utf8");
  }
  return {
    overlay: {
      ...overlay,
      generatedPath: headlineEnabled
        ? overlayCurrent
          ? overlay.generatedPath
          : overlayPath
        : null,
      generatedAt: headlineEnabled
        ? overlayCurrent
          ? overlay.generatedAt
          : now
        : null,
      freshness: overlayMark,
    },
    subtitles: {
      ...subtitles,
      captionsJsonPath: subtitleCurrent ? subtitles.captionsJsonPath : jsonPath,
      srtPath: subtitleCurrent ? subtitles.srtPath : srtPath,
      assPath: subtitleCurrent ? subtitles.assPath : assPath,
      generatedAt: subtitleCurrent ? subtitles.generatedAt : now,
      freshness: subtitleMark,
    },
    events,
    regenerated: {
      overlay: headlineEnabled && !overlayCurrent,
      subtitles: !subtitleCurrent,
    },
  };
}
function escapeAssFilterPath(filePath) {
  return path
    .resolve(String(filePath))
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}
module.exports = {
  DEFAULT_OVERLAY,
  DEFAULT_SUBTITLES,
  OVERLAY_THEMES,
  EDITORIAL_PRESETS: PRESETS,
  SUBTITLE_STYLES,
  buildCaptionEvents,
  buildOverlayAss,
  buildSubtitleAss,
  captionY,
  escapeAssFilterPath,
  generateCaptionAssets,
  groupCaptionWords,
  overlayFreshness,
  subtitleFreshness,
  wrapTwoLines,
};
