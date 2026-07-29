const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs/promises");

function escapePowerShell(value) {
  return String(value).replace(/'/g, "''");
}

function runPowerShell(script) {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded],
      { windowsHide: true, shell: false },
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) return resolve(stdout.trim());
      reject(new Error(stderr.trim() || `CyberSlide Voice exited with code ${code}.`));
    });
  });
}

async function listVoices() {
  if (process.platform !== "win32") {
    throw new Error("CyberSlide Voice currently requires Windows.");
  }

  const output = await runPowerShell(`
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices() | ForEach-Object {
  [PSCustomObject]@{
    name = $_.VoiceInfo.Name
    culture = $_.VoiceInfo.Culture.Name
    gender = $_.VoiceInfo.Gender.ToString()
    age = $_.VoiceInfo.Age.ToString()
    enabled = $_.Enabled
  }
}
$voices | ConvertTo-Json -Compress
`);

  if (!output) return [];
  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function wavDurationSeconds(buffer) {
  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF") {
    throw new Error("CyberSlide Voice created an invalid WAV file.");
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

async function synthesizeWav({ text, voiceName, rate, volume, outputPath }) {
  if (!String(text || "").trim()) throw new Error("Narration text is empty.");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const script = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('${escapePowerShell(voiceName)}')
$synth.Rate = ${Math.max(-10, Math.min(10, Number(rate) || 0))}
$synth.Volume = ${Math.max(0, Math.min(100, Number(volume) || 100))}
$synth.SetOutputToWaveFile('${escapePowerShell(outputPath)}')
$synth.Speak('${escapePowerShell(text)}')
$synth.Dispose()
`;

  await runPowerShell(script);
  const buffer = await fs.readFile(outputPath);
  return { outputPath, durationSeconds: wavDurationSeconds(buffer) };
}

module.exports = { listVoices, synthesizeWav, wavDurationSeconds };
