import { useMemo, useState } from "react";
import type { Project } from "../models/Project";
import {
  normalizeSubtitleSafeArea,
  type SubtitleSafeArea,
} from "../composition/CompositionDirector";
import { generateEditorialLayouts } from "../editorial/EditorialDirector";
import { decideEditorialLayout, decisionFromCompositionPlan } from "../editorial/EditorialLayoutDirector";
import type {
  EditorialLayoutOverride,
  EditorialPosterStyle,
  EditorialTextMode,
  SlideEditorialLayout,
  LayoutBounds,
} from "../editorial/types";
import { resolveProjectCTA } from "../brand/BrandCTAEngine";
import { createCompositionPlan, emptyValidationResult } from "../editorial/CompositionPlan";
import { listLayoutTemplates, type LayoutTemplateId } from "../editorial/LayoutTemplates";
import { deriveLayoutStaleness, slideLayoutFingerprint } from "../editorial/LayoutFreshness";
import { statusThrough } from "../aiDirector/pipelineState";
const emphasisKey = (value: string) => value.toUpperCase().replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}'-]/gu, "");
function previewTokens(line: string, phrase: string): Array<{ text: string; emphasized: boolean }> {
  const source = line.split(/\s+/), target = phrase.split(/\s+/).map(emphasisKey).filter(Boolean);
  let match = -1;
  for (let index = 0; index <= source.length - target.length; index += 1)
    if (target.every((token, offset) => emphasisKey(source[index + offset]) === token)) { match = index; break; }
  return source.map((text, index) => ({ text, emphasized: match >= 0 && index >= match && index < match + target.length }));
}
const guideBounds = (value: LayoutBounds) => ({
  left: `${value.x / 10.8}%`,
  top: `${value.y / 19.2}%`,
  width: `${value.width / 10.8}%`,
  height: `${value.height / 19.2}%`,
});
const POSTER_STYLES: EditorialPosterStyle[] = [
    "Editorial Bold",
    "Documentary",
    "Corporate",
    "Educational",
    "Fast Social",
    "Viral Alert",
    "News Report",
    "Minimal",
  ],
  SUBTITLE_STYLES = [
    "CyberSlide",
    "Professional",
    "Documentary",
    "Minimal",
    "Energetic",
    "Corporate",
  ];
export function TextSubtitlesPanel({
  project,
  projectName,
  selectedSlideId,
  onChange,
  onRegenerateImage,
  onRebuildLayoutAndRender,
}: {
  project: Project;
  projectName: string;
  selectedSlideId: string | null;
  onChange: (project: Project) => void;
  onRegenerateImage?: (slideId: string) => Promise<void>;
  onRebuildLayoutAndRender?: () => Promise<void>;
}) {
  const [message, setMessage] = useState(
      "Editorial poster text and narration captions are generated independently.",
    ),
    [busy, setBusy] = useState(false),
    overlay = project.slideTextOverlay,
    subtitles = project.subtitles,
    safeArea = normalizeSubtitleSafeArea(
      project.settings.captionSafeZonePercent,
    ),
    selected = useMemo(
      () =>
        project.slides.find((slide) => slide.id === selectedSlideId) ||
        project.slides[0],
      [project.slides, selectedSlideId],
    ),
    editorial = selected?.editorial,
    previewDecision = editorial?.decision || (selected?.compositionPlan ? decisionFromCompositionPlan(selected.compositionPlan) : null),
    layoutFreshness = deriveLayoutStaleness(project),
    desiredSlideFingerprint = selected ? slideLayoutFingerprint(selected) : "";
  const patchOverlay = (patch: Partial<typeof overlay>) =>
      onChange({
        ...project,
        slideTextOverlay: {
          ...overlay,
          ...patch,
          bodyOverlayEnabled: false,
          freshness: null,
          layoutFingerprint: null,
        },
      }),
    patchSubtitles = (patch: Partial<typeof subtitles>) =>
      onChange({
        ...project,
        subtitles: { ...subtitles, ...patch, freshness: null },
      }),
    setSafeArea = (value: SubtitleSafeArea) =>
      onChange({
        ...project,
        settings: { ...project.settings, captionSafeZonePercent: value },
        slides: project.slides.map((slide) => ({
          ...slide,
          captionSafeZonePercent: value,
        })),
        subtitles: { ...subtitles, safeAreaPercent: value, freshness: null },
        slideTextOverlay: { ...overlay, freshness: null, layoutFingerprint: null },
        pipelineStatus: statusThrough(["script"], "images"),
      }),
    patchEditorial = (patch: Partial<SlideEditorialLayout>) => {
      if (!selected) return;
      onChange({
        ...project,
        slides: project.slides.map((slide) =>
          slide.id === selected.id
            ? {
                ...slide,
                editorialPackage: {
                  ...slide.editorialPackage,
                  displayHeadline: patch.displayHeadline ?? slide.editorialPackage.displayHeadline,
                  highlightPhrase: patch.emphasizedText ?? slide.editorialPackage.highlightPhrase,
                  supportLine: patch.supportingLine ?? slide.editorialPackage.supportLine,
                  headlineScale: patch.headlineSize ? patch.headlineSize / 138 : slide.editorialPackage.headlineScale,
                  supportScale: patch.supportSize ? patch.supportSize / 44 : slide.editorialPackage.supportScale,
                  manuallyEdited: true,
                },
                editorial: {
                  ...(slide.editorial || {
                    displayHeadline: "",
                    emphasizedText: "",
                    supportingLine: "",
                    layoutAlignment: "left",
                    posterTextRegion: "upper-left",
                    layoutOverride: "auto",
                    headlineWidth: 390,
                    headlineSize: 146,
                    headlineFont: "Impact",
                    headlineWeight: "Heavy",
                    stackLayout: "Editorial Rag",
                    lineSpacing: -8,
                    subjectGutter: 54,
                    lineOffsets: [],
                    headlineLines: [],
                    supportWidth: 390,
                    supportSize: 44,
                    textVerticalPosition: 150,
                    highlightColor: overlay.highlightColor,
                    decision: decideEditorialLayout({ captionSafePercent: safeArea }),
                    sourceImagePath: null,
                    validationWarnings: [],
                  }),
                  ...patch,
                  manualOverride: true,
                },
              }
            : slide,
        ),
        slideTextOverlay: { ...overlay, freshness: null, layoutFingerprint: null },
        pipelineStatus: statusThrough(["script"], "images"),
      });
    };
  const setLayoutTemplate = (value: string) => {
    if (!selected) return;
    const layoutTemplateId=(value==="auto"?"editorial-left":value) as LayoutTemplateId;
    onChange({...project,slides:project.slides.map(slide=>slide.id===selected.id?{...slide,layoutTemplateId,editorialPackage:{...slide.editorialPackage,layoutTemplate:layoutTemplateId,manuallyEdited:true},compositionPlan:createCompositionPlan(slide,layoutTemplateId),editorial:null,compositionValidation:slide.background.approvedImagePath?emptyValidationResult():null,layoutWarnings:slide.background.approvedImagePath?["Approved image is preserved but may not match the new layout. Use Regenerate Image for Layout when ready."]:[]}:slide),slideTextOverlay:{...overlay,freshness:null,layoutFingerprint:null},pipelineStatus:statusThrough(["script"],"images")});
    setMessage("Layout template selected before image generation. Existing approved artwork was preserved.");
  };
  const regenerate = () => {
    const reset = project.slides.map((slide) =>
        slide.id === selected?.id ? { ...slide, editorial: null } : slide,
      ),
      slides = generateEditorialLayouts(
        reset,
        project.approvedAssetManifest,
        resolveProjectCTA(project),
      );
    onChange({
      ...project,
      slides,
      slideTextOverlay: { ...overlay, freshness: null },
    });
    setMessage("Regenerated editorial text for the selected slide.");
  };
  const generateAssets = async () => {
    if (!project.voiceover.scenes.length) {
      setMessage("Generate Voice before creating captions.");
      return;
    }
    setBusy(true);
    try {
      const slides = generateEditorialLayouts(
          project.slides,
          project.approvedAssetManifest,
          resolveProjectCTA(project),
        ),
        result = await window.cyberSlideStudio.generateCaptionAssets({
          projectName,
          slides: slides.map(({ number, editorialPackage, editorial }) => ({
            number,
            editorialPackage,
            editorial,
          })),
          scenes: project.voiceover.scenes,
          narrationPath: project.voiceover.narrationPath,
          timingPath: project.voiceover.timingPath,
          narrationMarker: project.voiceover.generatedAt,
          overlaySettings: overlay,
          subtitleSettings: { ...subtitles, safeAreaPercent: safeArea },
          force: true,
        });
      onChange({
        ...project,
        slides,
        slideTextOverlay: result.overlay,
        subtitles: result.subtitles,
      });
      setMessage(
        `Generated editorial poster text and ${result.events.length} narration caption groups.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Editorial rendering failed.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="director-panel text-subtitles-panel">
      <p className="eyebrow">EDITORIAL LAYOUT</p>
      <h2>Poster Text + Captions</h2>
      <label className="toggle-row">
        <span>Poster text enabled</span>
        <input
          type="checkbox"
          checked={overlay.enabled}
          onChange={(event) => patchOverlay({ enabled: event.target.checked })}
        />
      </label>
      <label>
        Layout Template
        <select value={selected?.layoutTemplateId || "editorial-left"} onChange={(event)=>setLayoutTemplate(event.target.value)}>
          <option value="auto">Auto (Editorial Left)</option>
          {listLayoutTemplates().map(template=><option key={template.id} value={template.id}>{template.name}</option>)}
        </select>
      </label>      <label>
        Poster style
        <select
          value={overlay.posterStyle}
          onChange={(event) =>
            patchOverlay({
              posterStyle: event.target.value as EditorialPosterStyle,
            })
          }
        >
          {POSTER_STYLES.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label>
        Poster timing
        <select
          value={overlay.posterTextMode}
          onChange={(event) =>
            patchOverlay({
              posterTextMode: event.target.value as EditorialTextMode,
            })
          }
        >
          <option value="persistent">Persistent Poster Text</option>
          <option value="brief">Brief Poster Text</option>
        </select>
      </label>
      {overlay.posterTextMode === "brief" && (
        <label>
          Brief duration{" "}
          <input
            type="number"
            min="1.5"
            max="6"
            step=".1"
            value={overlay.duration}
            onChange={(event) =>
              patchOverlay({ duration: Number(event.target.value) })
            }
          />
        </label>
      )}
      <label>
        Display headline
        <textarea
          value={selected?.editorialPackage.displayHeadline || ""}
          onChange={(event) =>
            patchEditorial({
              displayHeadline: event.target.value.toUpperCase(),
            })
          }
        />
      </label>
      <label>
        Highlight phrase
        <input
          value={selected?.editorialPackage.highlightPhrase || ""}
          onChange={(event) =>
            patchEditorial({ emphasizedText: event.target.value.toUpperCase() })
          }
        />
      </label>
      <label>
        Highlight color
        <input
          type="color"
          value={editorial?.highlightColor || overlay.highlightColor}
          onChange={(event) => patchEditorial({ highlightColor: event.target.value })}
        />
      </label>
      <label>
        Supporting line
        <textarea
          value={selected?.editorialPackage.supportLine || ""}
          onChange={(event) =>
            patchEditorial({ supportingLine: event.target.value })
          }
        />
      </label>
      <label>
        Narration
        <textarea value={selected?.editorialPackage.narration || ""} onChange={(event) => selected && onChange({...project,slides:project.slides.map(slide=>slide.id===selected.id?{...slide,editorialPackage:{...slide.editorialPackage,narration:event.target.value,manuallyEdited:true}}:slide),subtitles:{...subtitles,freshness:null},pipelineStatus:statusThrough(["script","images"],"voice")})} />
      </label>
      <label>
        Layout override
        <select
          value={editorial?.layoutOverride || "auto"}
          onChange={(event) =>
            patchEditorial({
              layoutOverride: event.target.value as EditorialLayoutOverride,
            })
          }
        >
          {[
            ["auto", "Auto"],
            ["text-left", "Text Left"],
            ["text-right", "Text Right"],
            ["top-left", "Top Left"],
            ["top-right", "Top Right"],
          ].map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>Headline width <input type="number" min="300" max="454" value={editorial?.headlineWidth || 390} onChange={(event)=>patchEditorial({headlineWidth:Number(event.target.value)})}/></label>
      <label>Headline size <input type="number" min="72" max="132" value={editorial?.headlineSize || 146} onChange={(event)=>patchEditorial({headlineSize:Number(event.target.value)})}/></label>
      <label>Headline weight <select value={editorial?.headlineWeight || "Heavy"} onChange={(event)=>patchEditorial({headlineWeight:event.target.value as "Heavy"|"Black"})}><option>Heavy</option><option>Black</option></select></label>
      <label>Stack layout <select value={editorial?.stackLayout || "Editorial Rag"} onChange={(event)=>patchEditorial({stackLayout:event.target.value as SlideEditorialLayout["stackLayout"]})}>{["Editorial Rag","Left Stair","Right Stair","Center Stack","Block Stack"].map(value=><option key={value}>{value}</option>)}</select></label>
      <label>Line spacing <input type="number" min="-24" max="30" value={editorial?.lineSpacing ?? -8} onChange={(event)=>patchEditorial({lineSpacing:Number(event.target.value)})}/></label>
      <label>Subject gutter <input type="number" min="40" max="100" value={editorial?.subjectGutter || 54} onChange={(event)=>patchEditorial({subjectGutter:Number(event.target.value)})}/></label>      <label>Support width <input type="number" min="220" max="454" value={editorial?.supportWidth || 278} onChange={(event)=>patchEditorial({supportWidth:Number(event.target.value)})}/></label><label>Support scale <input type="number" min="32" max="58" value={editorial?.supportSize || 44} onChange={(event)=>patchEditorial({supportSize:Number(event.target.value)})}/></label>
      <label>Text vertical position <input type="number" min="100" max="620" value={editorial?.textVerticalPosition || 150} onChange={(event)=>patchEditorial({textVerticalPosition:Number(event.target.value)})}/></label>
      <label className="toggle-row"><span>Show Layout Guides</span><input type="checkbox" checked={overlay.showLayoutGuides} onChange={(event)=>patchOverlay({showLayoutGuides:event.target.checked})}/></label>      <label>
        Subtitle-safe area
        <select
          value={safeArea}
          onChange={(event) =>
            setSafeArea(Number(event.target.value) as SubtitleSafeArea)
          }
        >
          <option value={20}>20%</option>
          <option value={25}>25% (default)</option>
          <option value={30}>30%</option>
        </select>
      </label>
      <label>Caption vertical position <select value={subtitles.verticalPosition || "safe-center"} onChange={(event)=>patchSubtitles({verticalPosition:event.target.value as "low"|"safe-center"|"high"})}><option value="low">Low</option><option value="safe-center">Safe Center</option><option value="high">High</option></select></label>
      <label>
        Subtitle style
        <select
          value={subtitles.style}
          onChange={(event) => patchSubtitles({ style: event.target.value })}
        >
          {SUBTITLE_STYLES.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <div
        className={`caption-preview editorial-layout-preview align-${editorial?.layoutAlignment || "auto"}`}
      >
        <div className="editorial-zone" style={previewDecision ? { left: `${previewDecision.textRegionBounds.x / 10.8}%`, top: `${previewDecision.textRegionBounds.y / 19.2}%`, width: `${previewDecision.textRegionBounds.width / 10.8}%` } : undefined}>
          <div className="editorial-stack" style={{ fontFamily: editorial?.headlineFont || "Impact" }}>
            {(editorial?.headlineLines?.length ? editorial.headlineLines : [{ text: editorial?.displayHeadline || "EDITORIAL HEADLINE", xOffset: 0, fontSize: editorial?.headlineSize || 146 }]).map((line, index) => (
              <strong key={`${line.text}-${index}`} style={{ marginLeft: `${line.xOffset || 0}px`, fontSize: `${Math.max(24, line.fontSize / 4)}px`, lineHeight: `${Math.max(22, (line.fontSize + (editorial?.lineSpacing ?? -8)) / 4)}px`, fontWeight: 900 }}>
                {previewTokens(line.text, editorial?.emphasizedText || "").map((token, tokenIndex) => <span key={`${token.text}-${tokenIndex}`} style={token.emphasized ? { color: editorial?.highlightColor || overlay.highlightColor } : undefined}>{token.text}{tokenIndex < line.text.split(/\s+/).length - 1 ? " " : ""}</span>)}
              </strong>
            ))}
          </div>
          <i>
            {editorial?.supportingLine ||
              "A concise support line clarifies the visual."}
          </i>
        </div>
        {overlay.showLayoutGuides && previewDecision && <><div className="target-zone-guide">REFERENCE-INSPIRED TARGET</div><div className="actual-bounds headline-bounds" style={guideBounds(previewDecision.headlineBounds)}>HEADLINE</div><div className="actual-bounds support-bounds" style={guideBounds(previewDecision.supportBounds)}>SUPPORT</div><div className="actual-bounds subject-bounds" style={guideBounds(previewDecision.subjectRegionBounds)}>DETECTED SUBJECT</div>{previewDecision.focalObjectBounds ? <div className="actual-bounds focal-bounds" style={guideBounds(previewDecision.focalObjectBounds)}>FOCAL OBJECT</div> : null}<div className="actual-bounds caption-bounds" style={guideBounds(previewDecision.safeCaptionBounds)}>CAPTION SAFE</div>{previewDecision.layoutWarnings.length ? <div className="layout-warning-guide">OVERLAP / LAYOUT WARNING</div> : null}</>}
        <div className="subtitle-region" style={{ height: `${safeArea}%` }}>
          {overlay.showLayoutGuides && <small>CAPTION SAFE ZONE</small>}<span>
            NARRATION <em>CAPTIONS</em>
          </span>
        </div>
      </div>
      {editorial?.validationWarnings.map((warning) => (
        <p className="operation-status" key={warning}>
          {warning}
        </p>
      ))}
      <button className="secondary-button" disabled={!selected||busy||!onRegenerateImage} onClick={async()=>{if(!selected||!onRegenerateImage)return;setBusy(true);try{await onRegenerateImage(selected.id);setMessage("Generated a new Working image from the saved CompositionPlan. Approve it after review.");}catch(error){setMessage(error instanceof Error?error.message:"Layout regeneration failed.");}finally{setBusy(false);}}}>Regenerate Image for Layout</button>      <button className="secondary-button" disabled={busy||!onRebuildLayoutAndRender} onClick={async()=>{if(!onRebuildLayoutAndRender)return;setBusy(true);try{await onRebuildLayoutAndRender();setMessage("Rebuilt editorial assets and rendered a fingerprint-current video.");}catch(error){setMessage(error instanceof Error?error.message:"Layout rebuild failed.");}finally{setBusy(false);}}}>Rebuild Layout and Render</button><button className="secondary-button" onClick={regenerate}>
        Regenerate Editorial Text
      </button>
      <button
        className="primary-button"
        disabled={busy}
        onClick={() => void generateAssets()}
      >
        {busy ? "Generating..." : "Regenerate Text Assets"}
      </button>
      {import.meta.env.DEV && <section className="layout-fingerprint-inspector"><p className="eyebrow">LAYOUT RUNTIME INSPECTOR</p><dl><dt>Active template</dt><dd>{selected?.layoutTemplateId || "editorial-left"}</dd><dt>Composition fingerprint</dt><dd>{desiredSlideFingerprint}</dd><dt>Approved image fingerprint</dt><dd>{selected?.approvedImageFingerprint || "missing / legacy"}</dd><dt>Text-asset fingerprint</dt><dd>{overlay.layoutFingerprint || "missing"}</dd><dt>Render fingerprint</dt><dd>{project.finalRender?.layoutFingerprint || "missing"}</dd><dt>Status</dt><dd>{`image:${layoutFreshness.imageStale?"stale":"current"} text:${layoutFreshness.textStale?"stale":"current"} video:${layoutFreshness.videoStale?"stale":"current"}`}</dd></dl><label>Final OpenAI prompt<textarea readOnly value={selected?.lastImagePrompt || "No layout-aware prompt has been sent for this slide."}/></label></section>}      <p className="operation-status">{message}</p>
    </div>
  );
}
