import type { Dispatch, SetStateAction } from "react";
import type { CreativeRecommendation } from "../../creative/CreativeRecommendation";
import type { HeadlineOption } from "../../headlines/HeadlineGenerator";
import { formatDuration } from "../../queue/queueMetrics";
import type {
  GenerationQueueItem,
  QueueRunStatus,
  QueueSummary,
} from "../../queue/types";

type GenerationStatus = "idle" | "generating" | "complete" | "error";
type ExportStatus = "idle" | "rendering" | "complete" | "error";
type ProductionStatus = "idle" | "exporting" | "complete" | "error";

type CreativeDirectorPanelProps = {
  activeSlideExists: boolean;
  activeRecommendation?: CreativeRecommendation;
  headlineOptions: HeadlineOption[];
  scriptTitleIsBlank: boolean;
  onSelectHeadline: (headline: string) => void;
  onRegenerateHeadlines: () => void;
  generationStatus: GenerationStatus;
  generationMessage: string;
  onCreateRecommendation: () => void;
  onGenerateBackground: () => Promise<void>;
  onApproveImage: () => Promise<void>;
  onRegenerateImage: () => Promise<void>;
  onEditPrompt: () => void;
  imageApproved: boolean;
  onGenerateAllSlides: () => Promise<void>;
  onRetryFailedSlides: () => Promise<void>;
  onPauseQueue: () => void;
  onResumeQueue: () => void;
  onCancelQueue: () => void;
  queueItems: GenerationQueueItem[];
  queueStatus: QueueRunStatus;
  queueSummary: QueueSummary;
  backgroundReady: boolean;
  exportStatus: ExportStatus;
  exportMessage: string;
  onExportFinalSlide: () => Promise<void>;
  onExportProductionPackage: () => Promise<void>;
  productionStatus: ProductionStatus;
  productionMessage: string;
  theme: string;
  layout: string;
  setTheme: Dispatch<SetStateAction<string>>;
  setLayout: Dispatch<SetStateAction<string>>;
  highlightColor: string;
  setHighlightColor: Dispatch<SetStateAction<string>>;
};

export function CreativeDirectorPanel({
  activeSlideExists,
  activeRecommendation,
  headlineOptions,
  scriptTitleIsBlank,
  onSelectHeadline,
  onRegenerateHeadlines,
  generationStatus,
  generationMessage,
  onCreateRecommendation,
  onGenerateBackground,
  onApproveImage,
  onRegenerateImage,
  onEditPrompt,
  imageApproved,
  onGenerateAllSlides,
  onRetryFailedSlides,
  onPauseQueue,
  onResumeQueue,
  onCancelQueue,
  queueItems,
  queueStatus,
  queueSummary,
  backgroundReady,
  exportStatus,
  exportMessage,
  onExportFinalSlide,
  onExportProductionPackage,
  productionStatus,
  productionMessage,
  theme,
  layout,
  setTheme,
  setLayout,
  highlightColor,
  setHighlightColor,
}: CreativeDirectorPanelProps) {
  const queueActive =
    queueStatus === "running" ||
    queueStatus === "paused" ||
    queueStatus === "cancelling";
  const failedCount = queueItems.filter((item) => item.status === "failed").length;

  return (
    <>
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">BATCH CREATIVE STUDIO</p>
          <h2>Queue + Headline Writer</h2>
        </div>
      </div>

      <div className="creative-director-actions">
        <button
          className="primary-button full-width analysis-button"
          type="button"
          onClick={onCreateRecommendation}
          disabled={!activeSlideExists || queueActive}
        >
          Create Recommendation
        </button>

        <button
          className="secondary-button full-width"
          type="button"
          onClick={() => void onGenerateBackground()}
          disabled={!activeSlideExists || queueActive || generationStatus === "generating"}
        >
          Generate Current Slide — Working
        </button>

        <div className="inspector-grid">
          <button className="secondary-button" type="button" onClick={() => void onApproveImage()} disabled={!backgroundReady || imageApproved}>Approve</button>
          <button className="secondary-button" type="button" onClick={() => void onRegenerateImage()} disabled={!activeSlideExists || generationStatus === "generating"}>Regenerate</button>
          <button className="ghost-button" type="button" onClick={onEditPrompt}>Edit Prompt</button>
          <span className="value-chip">{imageApproved ? "APPROVED · LOCKED" : "WORKING"}</span>
        </div>

        <button className="secondary-button full-width" type="button" onClick={() => void onGenerateAllSlides()}
          disabled={queueActive || generationStatus === "generating"}
        >
          Generate All Slides — Working
        </button>

        {failedCount > 0 && !queueActive && (
          <button
            className="secondary-button full-width"
            type="button"
            onClick={() => void onRetryFailedSlides()}
          >
            Retry Failed Slides ({failedCount})
          </button>
        )}

        <button
          className="secondary-button full-width"
          type="button"
          onClick={() => void onExportFinalSlide()}
          disabled={!activeSlideExists || !backgroundReady || exportStatus === "rendering" || queueActive}
        >
          {exportStatus === "rendering"
            ? "Approving Working Images…"
            : "Approve All Working Slides"}
        </button>

        <button
          className="primary-button full-width production-package-button"
          type="button"
          onClick={() => void onExportProductionPackage()}
          disabled={queueActive || productionStatus === "exporting"}
        >
          {productionStatus === "exporting"
            ? "Exporting Production Package…"
            : "Export Production Package"}
        </button>
      </div>

      {(exportStatus !== "idle" || productionStatus !== "idle") && (
        <section className="operation-status-card" aria-live="polite">
          {exportStatus !== "idle" && (
            <div className={`operation-status-row ${exportStatus}`}>
              <span>FINAL EXPORT</span>
              <strong>
                {exportStatus === "rendering"
                  ? "High-quality project finalization in progress"
                  : exportStatus === "complete"
                    ? "High-quality project finalization complete"
                    : "High-quality project finalization needs attention"}
              </strong>
              {exportMessage && <p>{exportMessage}</p>}
            </div>
          )}

          {productionStatus !== "idle" && (
            <div className={`operation-status-row ${productionStatus}`}>
              <span>PRODUCTION PACKAGE</span>
              <strong>
                {productionStatus === "exporting"
                  ? "Package export in progress"
                  : productionStatus === "complete"
                    ? "Production package complete"
                    : "Production package export needs attention"}
              </strong>
              {productionMessage && <p>{productionMessage}</p>}
            </div>
          )}
        </section>
      )}

      {queueItems.length > 0 && (
        <section className="queue-card" aria-label="Poster generation queue">
          <div className="queue-card-header">
            <div>
              <span>PROJECT RENDER QUEUE</span>
              <strong>
                {queueSummary.completed + queueSummary.failed} / {queueSummary.total} finished
              </strong>
            </div>
            <b>{queueSummary.progressPercent}%</b>
          </div>

          <div className="queue-progress-track" aria-hidden="true">
            <i style={{ width: `${queueSummary.progressPercent}%` }} />
          </div>

          <div className="queue-metrics">
            <div>
              <span>Current</span>
              <strong>
                {queueSummary.currentSlideNumber
                  ? `Slide ${queueSummary.currentSlideNumber}`
                  : queueStatus.replaceAll("-", " ")}
              </strong>
            </div>
            <div>
              <span>Average</span>
              <strong>{formatDuration(queueSummary.averageDurationMs)}</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>{formatDuration(queueSummary.estimatedRemainingMs)}</strong>
            </div>
            <div>
              <span>Finish</span>
              <strong>
                {queueSummary.estimatedCompletion
                  ? queueSummary.estimatedCompletion.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Calculating…"}
              </strong>
            </div>
          </div>

          {queueStatus === "complete" && (
            <div className="queue-completion-summary">
              <strong>Generation complete</strong>
              <span>
                {queueSummary.completed} poster{queueSummary.completed === 1 ? "" : "s"} generated
              </span>
              <span>Average: {formatDuration(queueSummary.averageDurationMs)}</span>
              <span>Total: {formatDuration(queueSummary.totalElapsedMs)}</span>
            </div>
          )}

          {queueActive && (
            <div className="queue-controls">
              {queueStatus === "paused" ? (
                <button type="button" onClick={onResumeQueue}>Resume</button>
              ) : (
                <button
                  type="button"
                  onClick={onPauseQueue}
                  disabled={queueStatus === "cancelling"}
                >
                  Pause
                </button>
              )}
              <button
                type="button"
                onClick={onCancelQueue}
                disabled={queueStatus === "cancelling"}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="queue-list">
            {queueItems.map((item) => (
              <div key={item.slideId} className={`queue-item ${item.status}`}>
                <span>{String(item.slideNumber).padStart(2, "0")}</span>
                <div>
                  <strong>{item.title || `Slide ${item.slideNumber}`}</strong>
                  <small>{item.error ?? item.status}</small>
                </div>
                <b>{item.durationMs ? formatDuration(item.durationMs) : ""}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      {generationMessage && (
        <div className={`generation-message ${generationStatus}`}>
          {generationMessage}
        </div>
      )}

      {scriptTitleIsBlank && activeRecommendation && headlineOptions.length > 0 && (
        <section className="headline-writer-card" aria-label="Smart headline writer">
          <div className="headline-writer-header">
            <div>
              <span>SMART HEADLINE WRITER</span>
              <strong>Blank script title detected</strong>
            </div>
            <button
              type="button"
              onClick={onRegenerateHeadlines}
              disabled={queueActive}
            >
              More options
            </button>
          </div>
          <p>
            CyberSlide selected a headline from the body. Choose another option before generating.
          </p>
          <div className="headline-option-list">
            {headlineOptions.map((option) => {
              const selected =
                option.text.toUpperCase() === activeRecommendation.headline.toUpperCase();
              return (
                <button
                  key={option.id}
                  type="button"
                  className={selected ? "headline-option selected" : "headline-option"}
                  onClick={() => onSelectHeadline(option.text)}
                  disabled={queueActive}
                >
                  <strong>{option.text}</strong>
                  <span>{option.rationale}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {activeRecommendation ? (
        <div className="recommendation-card">
          <div className="recommendation-section hero-recommendation">
            <span>Recommended headline</span>
            <strong>{activeRecommendation.headline}</strong>
          </div>

          <div className="recommendation-section">
            <span>Supporting text</span>
            <p>{activeRecommendation.supportingText}</p>
          </div>

          <div className="recommendation-grid">
            <div>
              <span>Layout</span>
              <strong>{activeRecommendation.layout.replaceAll("-", " ")}</strong>
            </div>
            <div>
              <span>Emotion</span>
              <strong>{activeRecommendation.emotion}</strong>
            </div>
            <div>
              <span>Typography</span>
              <strong>
                {activeRecommendation.typography.style.replaceAll("-", " ")}
              </strong>
            </div>
            <div>
              <span>Confidence</span>
              <strong>{Math.round(activeRecommendation.confidence * 100)}%</strong>
            </div>
          </div>

          <div className="recommendation-section">
            <span>Background concept</span>
            <strong>{activeRecommendation.backgroundConcept}</strong>
          </div>

          <div className="recommendation-section">
            <span>Focal words</span>
            <div className="focal-chips">
              {activeRecommendation.focalWords.map((word) => (
                <b key={word}>{word}</b>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="analysis-empty">
          Recommendations are created automatically during Generate All Slides.
        </div>
      )}

      <div className="inspector-divider" />

      <div className="inspector-grid">
        <div className="inspector-section">
          <label htmlFor="theme-select">Theme</label>
          <select
            id="theme-select"
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            disabled={queueActive}
          >
            <option>Enterprise Cyber</option>
            <option>Minimal Dark</option>
            <option>Security Operations</option>
            <option>Modern Technology</option>
          </select>
        </div>

        <div className="inspector-section highlight-color-section">
          <label htmlFor="highlight-color-picker">Highlighted text color</label>
          <div className="highlight-color-control">
            <input
              id="highlight-color-picker"
              type="color"
              value={highlightColor}
              onChange={(event) => setHighlightColor(event.target.value.toUpperCase())}
              disabled={queueActive}
              aria-label="Highlighted text color"
            />
            <input
              className="highlight-color-hex"
              type="text"
              value={highlightColor}
              onChange={(event) => {
                const value = event.target.value.toUpperCase();
                if (/^#[0-9A-F]{0,6}$/.test(value)) setHighlightColor(value);
              }}
              onBlur={() => {
                if (!/^#[0-9A-F]{6}$/.test(highlightColor)) setHighlightColor("#00B7FF");
              }}
              disabled={queueActive}
              maxLength={7}
              spellCheck={false}
              aria-label="Highlighted text hex color"
            />
          </div>
          <div className="highlight-color-presets" aria-label="Highlight color presets">
            {["#00B7FF", "#20D7FF", "#3177FF", "#8D5CFF", "#FF4D67", "#FFD400", "#39E7A1"].map((color) => (
              <button
                key={color}
                type="button"
                className={highlightColor === color ? "highlight-preset selected" : "highlight-preset"}
                style={{ background: color }}
                onClick={() => setHighlightColor(color)}
                disabled={queueActive}
                title={color}
                aria-label={`Use ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="inspector-section">
          <label htmlFor="layout-select">Layout</label>
          <select
            id="layout-select"
            value={layout}
            onChange={(event) => setLayout(event.target.value)}
            disabled={queueActive}
          >
            <option>Cinematic Hero</option>
            <option>Bold Warning</option>
            <option>Split Statement</option>
            <option>Minimal Cta</option>
            <option>Comparison</option>
            <option>Checklist</option>
          </select>
        </div>
      </div>
    </>
  );
}
