import type { Project } from "../../models/Project";
import type { PipelineStage } from "../../aiDirector/types";
import { currentStage, PIPELINE_STAGES, stageLabel } from "../../aiDirector/pipelineState";
import { deriveLayoutStaleness } from "../../editorial/LayoutFreshness";

type Props = { project: Project; busy: boolean; message: string; onStage: (stage: PipelineStage) => void; onGenerateEverything: () => Promise<void> };

export function ProductionPipeline({ project, busy, message, onStage, onGenerateEverything }: Props) {
  const freshness = deriveLayoutStaleness(project);
  const complete = Boolean(project.finalRender) && project.pipelineStatus.video === "completed" && !freshness.imageStale && !freshness.textStale && !freshness.videoStale;
  const current = currentStage(project.pipelineStatus);
  const staleStages = new Set<PipelineStage>();
  if (freshness.imageStale) staleStages.add("images");
  if (freshness.textStale) staleStages.add("video");
  if (freshness.videoStale) staleStages.add("video");

  return <section className="production-pipeline">
    <div className="pipeline-title"><p className="eyebrow">AI-DIRECTED PIPELINE</p><h2>Production</h2></div>
    {PIPELINE_STAGES.map((stage) => {
      const state = project.pipelineStatus[stage];
      const stale = staleStages.has(stage);
      const active = complete ? stage === "publish" : state !== "waiting" || stale;
      return <button key={stage} className={`pipeline-stage ${stale ? "stale" : state}`} onClick={() => active && onStage(stage)} disabled={!active}>
        <span>{stale ? "!" : state === "completed" ? "✓" : state === "current" ? "●" : "○"}</span>
        <div><strong>{stageLabel(stage)}</strong><small>{stale ? "stale" : state}</small>{!stale && state === "completed" && <em>{stage === "images" ? `${project.approvedAssetManifest.length} approved` : stage === "voice" ? "Narration ready" : stage === "music" ? project.music.displayTitle || "No music" : stage === "video" ? "Final MP4 ready" : "Complete"}</em>}</div>
      </button>;
    })}
    <button className="primary-button full-width" onClick={() => void onGenerateEverything()} disabled={busy || complete}>{complete ? "✓ Production Complete" : busy ? "AI Director Working..." : freshness.resumeStage === "publish" ? "Generate Everything" : "Resume Generate Everything"}</button>
    {(freshness.imageStale || freshness.textStale || freshness.videoStale) && <div className="operation-status">Stale production assets — update from {freshness.resumeStage}</div>}
    {message && <div className="operation-status">{message}</div>}
    <p className="pipeline-current">Current stage: {stageLabel(current)}</p>
  </section>;
}