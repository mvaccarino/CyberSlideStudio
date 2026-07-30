import { useEffect, useMemo, useState } from "react";
import type { Slide } from "../models/Slide";
import type {
  CyberSlideVoice,
  CyberSlideVoiceProgress,
  CyberSlideVoiceStatus,
  VoiceGenerationResult,
} from "./types";

type Props = { projectName: string; slides: Slide[]; onGenerated?: (result: VoiceGenerationResult) => void };

export function CyberSlideVoicePanel({ projectName, slides, onGenerated }: Props) {
  const [voices, setVoices] = useState<CyberSlideVoice[]>([]);
  const [voiceId, setVoiceId] = useState("am_adam");
  const [speed, setSpeed] = useState(1);
  const [paddingBefore, setPaddingBefore] = useState(0.12);
  const [paddingAfter, setPaddingAfter] = useState(0.28);
  const [engine, setEngine] = useState<CyberSlideVoiceStatus | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "generating" | "complete" | "error">("loading");
  const [message, setMessage] = useState("Loading CyberSlide Voice Proâ€¦");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VoiceGenerationResult | null>(null);

  useEffect(() => {
    const unsubscribe = window.cyberSlideStudio.onCyberSlideVoiceProgress((update: CyberSlideVoiceProgress) => {
      setProgress(update.percent || 0);
      setMessage(update.message);
    });
    Promise.all([
      window.cyberSlideStudio.listCyberSlideVoices(),
      window.cyberSlideStudio.getCyberSlideVoiceStatus(),
    ]).then(([items, statusResult]) => {
      setVoices(items.filter((voice) => voice.enabled));
      setEngine(statusResult);
      setVoiceId(items[0]?.id || "am_adam");
      setStatus("ready");
      setMessage(statusResult.modelReady ? "Local neural voice model ready." : "Ready. The neural voice model downloads once on first use.");
    }).catch((error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load CyberSlide Voice Pro.");
    });
    return unsubscribe;
  }, []);

  const selectedVoice = voices.find((voice) => voice.id === voiceId);
  const estimatedWords = useMemo(
    () => slides.reduce((total, slide) => total + [slide.title, slide.body, slide.cta].join(" ").trim().split(/\s+/).filter(Boolean).length, 0),
    [slides],
  );

  async function prepare() {
    try {
      setStatus("loading");
      setProgress(0);
      setMessage("Preparing the local neural voice modelâ€¦");
      const result = await window.cyberSlideStudio.prepareCyberSlideVoice();
      setEngine(result);
      setStatus("ready");
      setProgress(100);
      setMessage("CyberSlide Voice Pro is ready.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Voice model setup failed.");
    }
  }

  async function previewVoice() {
    try {
      setStatus("loading");
      setProgress(0);
      setMessage("Generating a professional voice previewâ€¦");
      await window.cyberSlideStudio.previewCyberSlideVoice({
        projectName,
        voiceId,
        speed,
        text: "A familiar voice is no longer proof of identity. Verify urgent requests before you act.",
      });
      setStatus("ready");
      setMessage("Voice preview opened.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Voice preview failed.");
    }
  }

  async function generate() {
    try {
      setStatus("generating");
      setProgress(0);
      setMessage(`Generating professional narration for ${slides.length} slidesâ€¦`);
      const generated = await window.cyberSlideStudio.generateCyberSlideVoice({
        projectName,
        voiceId,
        speed,
        paddingBefore,
        paddingAfter,
        slides,
      });
      setResult(generated);
      onGenerated?.(generated);
      setStatus("complete");
      setProgress(100);
      setMessage(`Professional narration complete Â· ${generated.totalDurationSeconds.toFixed(1)} seconds.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Narration generation failed.");
    }
  }

  return (
    <div className="voice-panel">
      <p className="eyebrow">CYBERSLIDE VOICE PRO</p>
      <h2>Professional Local Voiceover</h2>
      <p className="voice-intro">Natural neural narration generated directly on your computer. No subscription, API key, credits, or per-video charge.</p>

      <div className="voice-pro-badge-row">
        <span>LOCAL</span><span>NO SUBSCRIPTION</span><span>{engine?.engine || "Kokoro Neural TTS"}</span>
      </div>

      <label className="voice-field"><span>Voice Style</span><select value={voiceId} onChange={(event) => setVoiceId(event.target.value)} disabled={!voices.length || status === "generating"}>{voices.map((voice) => <option key={voice.id} value={voice.id}>{voice.name} Â· {voice.gender} Â· {voice.accent}</option>)}</select></label>
      {selectedVoice && <div className="voice-description"><strong>{selectedVoice.name}</strong><span>{selectedVoice.description}</span></div>}

      <label className="voice-field"><span>Delivery Speed <strong>{speed.toFixed(2)}Ã—</strong></span><input type="range" min="0.80" max="1.20" step="0.02" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /></label>
      <div className="voice-grid"><label className="voice-field"><span>Lead-in</span><input type="number" min="0" max="2" step="0.01" value={paddingBefore} onChange={(event) => setPaddingBefore(Number(event.target.value))} /></label><label className="voice-field"><span>Tail padding</span><input type="number" min="0" max="2" step="0.01" value={paddingAfter} onChange={(event) => setPaddingAfter(Number(event.target.value))} /></label></div>

      <div className="voice-summary"><span>{slides.length} scenes</span><span>{estimatedWords} words</span><span>{result ? `${result.totalDurationSeconds.toFixed(1)} sec` : "Timing pending"}</span></div>
      {!engine?.modelReady && <button className="secondary-button voice-action" type="button" onClick={() => void prepare()} disabled={status === "generating" || status === "loading"}>Download Voice Model</button>}
      <button className="secondary-button voice-action" type="button" onClick={() => void previewVoice()} disabled={!voiceId || status === "generating"}>Preview Voice</button>
      <button className="primary-button voice-action" type="button" onClick={() => void generate()} disabled={!voiceId || !slides.length || status === "generating"}>{status === "generating" ? "Generating Professional Voiceâ€¦" : "Generate Voiceover & Timing"}</button>
      <button className="ghost-button voice-action" type="button" onClick={() => void window.cyberSlideStudio.openVoiceoverFolder(projectName)}>Open Voiceover Folder</button>

      {(status === "loading" || status === "generating") && <div className="voice-progress"><div style={{ width: `${Math.max(2, progress)}%` }} /></div>}
      <div className={`voice-status ${status}`}>{message}</div>
      <p className="voice-first-use-note">First use downloads the compact neural model once. After that, voice generation runs locally without uploading your scripts.</p>
      {result && <div className="voice-scenes">{result.scenes.map((scene) => <div key={scene.slideNumber}><strong>Slide {scene.slideNumber}</strong><span>{scene.audioDurationSeconds.toFixed(2)}s audio</span><span>{scene.sceneDurationSeconds.toFixed(2)}s scene</span></div>)}</div>}
    </div>
  );
}
