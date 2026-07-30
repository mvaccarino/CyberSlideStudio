import type { Project } from "../../models/Project";
import { deriveLayoutStaleness } from "../../editorial/LayoutFreshness";

type Props = {
  project: Project;
  busy: boolean;
  onUpdate: () => Promise<void>;
};

export function ProjectUpdatePanel({ project, busy, onUpdate }: Props) {
  const stale = deriveLayoutStaleness(project);
  const scriptOrLayoutStale = stale.staleSlideIds.some((id) => {
    const slide = project.slides.find((item) => item.id === id);
    return Boolean(slide && slide.compositionFingerprint !== slide.approvedImageFingerprint);
  });
  const items = [
    scriptOrLayoutStale && "Script or layout inputs changed",
    stale.imageStale && `${stale.staleSlideIds.length} image${stale.staleSlideIds.length === 1 ? "" : "s"} need layout updates`,
    stale.textStale && "Editorial and caption assets need rebuilding",
    stale.videoStale && "Final video needs rendering",
  ].filter(Boolean) as string[];

  if (!items.length) return null;
  return (
    <section className="project-update-panel" aria-label="Project update required">
      <div>
        <p className="eyebrow">PROJECT UPDATE</p>
        <h2>Production assets are out of date</h2>
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
        <p>Approved images stay in place until you approve their replacements. Voice and music are preserved.</p>
      </div>
      <button className="primary-button" type="button" disabled={busy} onClick={() => void onUpdate()}>
        {busy ? "Updating..." : "Update Project"}
      </button>
    </section>
  );
}