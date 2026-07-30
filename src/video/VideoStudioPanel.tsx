import { useEffect, useMemo, useState } from "react";
import type { Project } from "../models/Project";
import { buildNativeVideoPlan } from "./VideoPlanBuilder";
import {
  cancelNativeVideo,
  checkNativeVideoRenderer,
  onNativeVideoProgress,
  renderNativeVideo,
} from "./NativeVideoService";
import type {
  NativeVideoRenderProgress,
  NativeVideoRenderResult,
} from "./types";

type Props = { project: Project; projectName: string };
export function VideoStudioPanel({ project, projectName }: Props) {
  const [status, setStatus] = useState("Checking renderer…");
  const [progress, setProgress] = useState<NativeVideoRenderProgress | null>(
    null,
  );
  const [result, setResult] = useState<NativeVideoRenderResult | null>(null);
  const [busy, setBusy] = useState(false);
  const approved = project.slides.filter((s) => s.background.approvedImagePath);
  const duration = useMemo(
    () =>
      Math.max(
        0,
        approved.reduce(
          (n, s) =>
            n +
            (project.voiceover.scenes.find((v) => v.slideNumber === s.number)
              ?.sceneDurationSeconds || 4),
          0,
        ) -
          Math.max(0, approved.length - 1) * 0.3,
      ),
    [approved, project.voiceover.scenes],
  );
  useEffect(() => {
    void checkNativeVideoRenderer().then((r) =>
      setStatus(
        r.available
          ? `FFmpeg ready · ${r.version || r.ffmpegPath}`
          : r.error || "FFmpeg unavailable",
      ),
    );
    return onNativeVideoProgress(setProgress);
  }, []);
  async function render(mode: "preview" | "final") {
    setBusy(true);
    try {
      const plan = buildNativeVideoPlan({
        projectName,
        approvedAssetManifest: project.approvedAssetManifest,
        productionStyleName: project.productionStyle.name,
        slides: project.slides.map((s) => ({
          ...s,
          approvedImagePath: s.background.approvedImagePath,
        })),
        voiceScenes: project.voiceover.scenes,
        narrationPath: project.voiceover.narrationPath,
        finalMixPath: project.music.finalMixPath,
        overlayPath:
          project.slideTextOverlay.enabled &&
          project.slideTextOverlay.headlineMode === "brief"
            ? project.slideTextOverlay.generatedPath
            : null,
        subtitlePath: project.subtitles.enabled
          ? project.subtitles.assPath
          : null,
        renderMode: mode,
      });
      const next = await renderNativeVideo(plan);
      setResult(next);
      setStatus(`${mode === "preview" ? "Preview" : "Final"} render complete.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Render failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="director-panel">
      <p className="eyebrow">VIDEO STUDIO</p>
      <h2>Native Video Renderer</h2>
      <div className="music-summary">
        <strong>{approved.length} approved images</strong>
        <span>
          {duration.toFixed(1)} sec ·{" "}
          {project.voiceover.narrationPath ? "Narration ready" : "No narration"}{" "}
          · {project.music.finalMixPath ? "Final mix ready" : "No prepared mix"}
        </span>
      </div>
      <div className="panel-action-grid">
        <button
          onClick={() => void render("preview")}
          disabled={busy || !approved.length}
        >
          Render Preview
        </button>
        <button
          className="primary-button"
          onClick={() => void render("final")}
          disabled={busy || !approved.length}
        >
          Render Final MP4
        </button>
        <button
          onClick={() => progress && void cancelNativeVideo(progress.renderId)}
          disabled={!busy || !progress}
        >
          Cancel
        </button>
        <button
          onClick={() =>
            result && void window.cyberSlideStudio.openVideo(result.filePath)
          }
          disabled={!result}
        >
          Open Video
        </button>
        <button
          onClick={() =>
            void window.cyberSlideStudio.openVideoFolder(projectName)
          }
        >
          Open Output Folder
        </button>
      </div>
      {progress && (
        <div className="voice-progress">
          <div style={{ width: `${progress.percent}%` }} />
        </div>
      )}
      <div className="operation-status">{progress?.message || status}</div>
    </div>
  );
}
