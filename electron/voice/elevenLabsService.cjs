const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const { resolveFfmpeg } = require("../video/ffmpegResolver.cjs");

const API_BASE = "https://api.elevenlabs.io/v1";

async function readError(response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return parsed?.detail?.message || parsed?.detail || parsed?.message || text;
  } catch {
    return text || `HTTP ${response.status}`;
  }
}

async function listVoices(apiKey) {
  const response = await fetch(`${API_BASE}/voices?page_size=100&include_total_count=false`, {
    headers: { "xi-api-key": apiKey },
  });
  if (!response.ok) throw new Error(`ElevenLabs connection failed: ${await readError(response)}`);
  const payload = await response.json();
  return (payload.voices || []).map((voice) => ({
    voiceId: voice.voice_id,
    name: voice.name,
    category: voice.category || "voice",
    previewUrl: voice.preview_url || null,
    labels: voice.labels || {},
  }));
}

function normalizeAlignment(alignment) {
  const characters = alignment?.characters || alignment?.chars || [];
  const startsSeconds = alignment?.character_start_times_seconds || [];
  const durationsSeconds = alignment?.character_durations_seconds || [];
  const endsSeconds = alignment?.character_end_times_seconds || [];
  const startsMs = alignment?.char_start_times_ms || [];
  const durationsMs = alignment?.char_durations_ms || [];
  return {
    characters,
    starts: startsSeconds.length ? startsSeconds : startsMs.map((value) => Number(value) / 1000),
    durations: durationsSeconds.length
      ? durationsSeconds
      : durationsMs.length
        ? durationsMs.map((value) => Number(value) / 1000)
        : endsSeconds.map((end, index) => Math.max(0, Number(end) - Number(startsSeconds[index] || 0))),
  };
}

function alignmentToWords(alignment, offsetSeconds = 0) {
  const normalized = normalizeAlignment(alignment);
  if (!normalized.characters.length) return [];
  const words = [];
  let current = "";
  let start = null;
  let end = null;
  for (let i = 0; i < normalized.characters.length; i += 1) {
    const char = normalized.characters[i];
    const charStart = Number(normalized.starts[i] || 0) + offsetSeconds;
    const charEnd = charStart + Number(normalized.durations[i] || 0);
    if (/\s/.test(char)) {
      if (current) words.push({ word: current, start, end });
      current = "";
      start = null;
      end = null;
    } else {
      if (start === null) start = charStart;
      current += char;
      end = charEnd;
    }
  }
  if (current) words.push({ word: current, start, end });
  return words;
}

async function generateSpeechWithTiming({ apiKey, voiceId, text, settings }) {
  const url = `${API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}/stream/with-timestamps?output_format=mp3_44100_128`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: settings.modelId || "eleven_multilingual_v2",
      voice_settings: {
        stability: Number(settings.stability ?? 0.45),
        similarity_boost: Number(settings.similarityBoost ?? 0.85),
        style: Number(settings.style ?? 0.18),
        use_speaker_boost: settings.speakerBoost !== false,
        speed: Number(settings.speed ?? 1),
      },
    }),
  });
  if (!response.ok) throw new Error(`Voice generation failed: ${await readError(response)}`);

  const raw = await response.text();
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const audioChunks = [];
  const words = [];
  let duration = 0;
  let chunkOffset = 0;
  for (const line of lines) {
    let chunk;
    try { chunk = JSON.parse(line); } catch { continue; }
    if (chunk.audio_base64) audioChunks.push(Buffer.from(chunk.audio_base64, "base64"));
    const alignment = chunk.normalized_alignment || chunk.alignment;
    if (alignment) {
      const normalized = normalizeAlignment(alignment);
      const firstStart = Number(normalized.starts[0] || 0);
      const relativeOffset = firstStart < chunkOffset - 0.05 ? chunkOffset : 0;
      const chunkWords = alignmentToWords(alignment, relativeOffset);
      words.push(...chunkWords);
      const lastIndex = normalized.characters.length - 1;
      const last = Number(normalized.starts[lastIndex] || 0) + Number(normalized.durations[lastIndex] || 0) + relativeOffset;
      duration = Math.max(duration, last);
      chunkOffset = duration;
    }
  }
  if (!audioChunks.length) throw new Error("ElevenLabs returned no audio data.");
  return { audio: Buffer.concat(audioChunks), words, durationSeconds: duration };
}

function run(executable, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true, shell: false });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg failed (${code}): ${stderr.slice(-2000)}`)));
  });
}

async function concatenateAudio(files, outputPath) {
  if (files.length === 1) {
    await fs.copyFile(files[0], outputPath);
    return;
  }
  const ffmpeg = await resolveFfmpeg();
  const listPath = path.join(path.dirname(outputPath), "voiceover-concat.txt");
  const lines = files.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join("\n");
  await fs.writeFile(listPath, lines, "utf8");
  try {
    await run(ffmpeg.path, ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c:a", "libmp3lame", "-b:a", "192k", outputPath]);
  } finally {
    await fs.rm(listPath, { force: true });
  }
}

module.exports = { concatenateAudio, generateSpeechWithTiming, listVoices };
