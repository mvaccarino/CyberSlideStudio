const path = require("node:path");
const fs = require("node:fs/promises");

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const MODEL_DTYPE = "q8";

const VOICES = [
  { id: "am_adam", name: "Professional Documentary", gender: "Male", accent: "American", description: "Grounded, confident narration" },
  { id: "am_michael", name: "Cyber Investigator", gender: "Male", accent: "American", description: "Focused, serious cybersecurity tone" },
  { id: "am_fenrir", name: "Executive Presenter", gender: "Male", accent: "American", description: "Authoritative corporate delivery" },
  { id: "af_heart", name: "Professional Educator", gender: "Female", accent: "American", description: "Natural, warm, polished delivery" },
  { id: "af_bella", name: "News Presenter", gender: "Female", accent: "American", description: "Clear, composed, broadcast style" },
  { id: "af_nicole", name: "Documentary Narrator", gender: "Female", accent: "American", description: "Calm, cinematic narration" },
  { id: "bf_emma", name: "British Professional", gender: "Female", accent: "British", description: "Refined educational delivery" },
  { id: "bm_george", name: "British Documentary", gender: "Male", accent: "British", description: "Measured documentary narration" },
];

let ttsPromise = null;
let modelReady = false;

async function loadModel(onProgress) {
  if (!ttsPromise) {
    ttsPromise = (async () => {
      const { KokoroTTS } = await import("kokoro-js");
      const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: MODEL_DTYPE,
        device: "cpu",
        progress_callback: (progress) => {
          if (typeof onProgress === "function") onProgress(progress || {});
        },
      });
      modelReady = true;
      return tts;
    })().catch((error) => {
      ttsPromise = null;
      modelReady = false;
      throw error;
    });
  }
  return ttsPromise;
}

function listVoices() {
  return VOICES.map((voice) => ({ ...voice, enabled: true }));
}

function getVoice(voiceId) {
  const voice = VOICES.find((item) => item.id === voiceId);
  if (!voice) throw new Error("Select a CyberSlide Voice Pro voice.");
  return voice;
}

async function wavDurationSeconds(filePath) {
  const buffer = await fs.readFile(filePath);
  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF") {
    throw new Error("CyberSlide Voice Pro created an invalid WAV file.");
  }
  let offset = 12;
  let byteRate = 0;
  let dataSize = 0;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "fmt " && size >= 16) byteRate = buffer.readUInt32LE(offset + 16);
    if (id === "data") {
      dataSize = size;
      break;
    }
    offset += 8 + size + (size % 2);
  }
  if (!byteRate || !dataSize) throw new Error("Unable to determine narration duration.");
  return dataSize / byteRate;
}

async function synthesizeWav({ text, voiceId, speed, outputPath, onProgress }) {
  const cleanText = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleanText) throw new Error("Narration text is empty.");
  getVoice(voiceId);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const tts = await loadModel(onProgress);
  const audio = await tts.generate(cleanText, {
    voice: voiceId,
    speed: Math.max(0.75, Math.min(1.25, Number(speed) || 1)),
  });
  await audio.save(outputPath);
  return {
    outputPath,
    durationSeconds: await wavDurationSeconds(outputPath),
  };
}

function getStatus() {
  return {
    provider: "CyberSlide Voice Pro",
    engine: "Kokoro-82M ONNX",
    modelId: MODEL_ID,
    dtype: MODEL_DTYPE,
    modelReady,
    requiresSubscription: false,
    runsLocally: true,
  };
}

module.exports = {
  getStatus,
  listVoices,
  loadModel,
  synthesizeWav,
  wavDurationSeconds,
};
