/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import type { Slide } from "../models/Slide";
import type { ElevenLabsVoice, VoiceGenerationProgress, VoiceGenerationResult, VoiceSettings } from "./types";

type Props = { projectName: string; slides: Slide[] };
const defaults: VoiceSettings = { modelId: "eleven_multilingual_v2", stability: 0.45, similarityBoost: 0.85, style: 0.18, speed: 1, speakerBoost: true };

export function VoiceTimingPanel({ projectName, slides }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [voiceId, setVoiceId] = useState("");
  const [settings, setSettings] = useState(defaults);
  const [padding, setPadding] = useState(0.35);
  const [progress, setProgress] = useState<VoiceGenerationProgress | null>(null);
  const [result, setResult] = useState<VoiceGenerationResult | null>(null);
  const [message, setMessage] = useState("Save your ElevenLabs key, then choose a voice.");
  const [busy, setBusy] = useState(false);

  const scenes = useMemo(() => slides.map((slide) => ({ slideNumber: slide.number, text: [slide.title, slide.body, slide.cta].filter(Boolean).join(". ") })).filter((scene) => scene.text.trim()), [slides]);

  const refreshVoices = async () => {
    setBusy(true);
    try {
      const list = await window.cyberSlideStudio.listElevenLabsVoices();
      setVoices(list);
      setVoiceId((current) => current || list[0]?.voiceId || "");
      setHasKey(true);
      setMessage(`${list.length} voices loaded.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load voices."); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    void window.cyberSlideStudio.hasElevenLabsApiKey().then((exists) => { setHasKey(exists); if (exists) void refreshVoices(); });
    return window.cyberSlideStudio.onVoiceGenerationProgress(setProgress);
  }, []);

  const saveKey = async () => {
    if (!apiKey.trim()) { setMessage("Enter your ElevenLabs API key."); return; }
    setBusy(true);
    try { await window.cyberSlideStudio.saveElevenLabsApiKey(apiKey); setApiKey(""); setHasKey(true); await refreshVoices(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save API key."); }
    finally { setBusy(false); }
  };

  const generate = async () => {
    setBusy(true); setResult(null); setProgress({ phase: "generating", completed: 0, total: scenes.length, percent: 0, message: "Starting voice generation…" });
    try {
      const generated = await window.cyberSlideStudio.generateProjectVoiceover({ projectName, voiceId, settings, scenePaddingSeconds: padding, scenes });
      setResult(generated); setMessage(`Voiceover ready: ${generated.timing.totalDurationSeconds.toFixed(1)} seconds.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Voice generation failed."); setProgress(null); }
    finally { setBusy(false); }
  };

  const setNumber = (key: keyof VoiceSettings, value: number) => setSettings((current) => ({ ...current, [key]: value }));

  return <div className="voice-panel">
    <p className="eyebrow">VOICE & TIMING ENGINE</p>
    <h2>ElevenLabs Narration</h2>
    <p className="voice-message">{message}</p>

    <label className="voice-label">ElevenLabs API key</label>
    <div className="voice-inline"><input type="password" value={apiKey} placeholder={hasKey ? "Key saved securely" : "xi-api-key"} onChange={(e) => setApiKey(e.target.value)} /><button type="button" onClick={() => void saveKey()} disabled={busy}>Save Key</button></div>

    <label className="voice-label">Voice</label>
    <div className="voice-inline"><select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} disabled={!voices.length}>{voices.map((voice) => <option key={voice.voiceId} value={voice.voiceId}>{voice.name} · {voice.category}</option>)}</select><button type="button" onClick={() => void refreshVoices()} disabled={busy || !hasKey}>Refresh</button></div>

    <div className="voice-grid">
      <label>Stability <strong>{Math.round(settings.stability * 100)}%</strong><input type="range" min="0" max="1" step="0.01" value={settings.stability} onChange={(e) => setNumber("stability", Number(e.target.value))} /></label>
      <label>Similarity <strong>{Math.round(settings.similarityBoost * 100)}%</strong><input type="range" min="0" max="1" step="0.01" value={settings.similarityBoost} onChange={(e) => setNumber("similarityBoost", Number(e.target.value))} /></label>
      <label>Style <strong>{Math.round(settings.style * 100)}%</strong><input type="range" min="0" max="1" step="0.01" value={settings.style} onChange={(e) => setNumber("style", Number(e.target.value))} /></label>
      <label>Speed <strong>{settings.speed.toFixed(2)}×</strong><input type="range" min="0.7" max="1.2" step="0.01" value={settings.speed} onChange={(e) => setNumber("speed", Number(e.target.value))} /></label>
    </div>
    <label className="voice-check"><input type="checkbox" checked={settings.speakerBoost} onChange={(e) => setSettings((current) => ({ ...current, speakerBoost: e.target.checked }))} /> Speaker boost</label>
    <label className="voice-label">Scene padding: {padding.toFixed(2)} sec</label><input type="range" min="0.1" max="1" step="0.05" value={padding} onChange={(e) => setPadding(Number(e.target.value))} />

    <div className="voice-summary"><span>{scenes.length} scenes</span><span>{scenes.reduce((n, s) => n + s.text.split(/\s+/).length, 0)} words</span><span>{result ? `${result.timing.totalDurationSeconds.toFixed(1)} sec` : "Not generated"}</span></div>
    {progress && <div className="voice-progress"><div style={{ width: `${progress.percent}%` }} /><span>{progress.message}</span></div>}
    <button className="primary-action voice-generate" type="button" onClick={() => void generate()} disabled={busy || !voiceId || !scenes.length}>{busy ? "Generating…" : "Generate Voiceover & Timing"}</button>
    <button className="secondary-action" type="button" onClick={() => void window.cyberSlideStudio.importVoiceover(projectName)}>Import Existing Voiceover</button>
    <div className="voice-inline"><button type="button" disabled={!result} onClick={() => result && void window.cyberSlideStudio.openVoiceFile(result.fullVoiceoverPath)}>Play Voiceover</button><button type="button" onClick={() => void window.cyberSlideStudio.openVoiceFolder(projectName)}>Open Voiceover Folder</button></div>
    {result && <div className="timing-list">{result.timing.scenes.map((scene) => <div key={scene.slideNumber}><strong>Slide {scene.slideNumber}</strong><span>{scene.narrationDurationSeconds.toFixed(2)}s narration</span><span>{scene.durationSeconds.toFixed(2)}s scene</span></div>)}</div>}
  </div>;
}
