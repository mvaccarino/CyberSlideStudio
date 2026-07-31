import {
  inspectPosterComposition,
  type SubtitleSafeArea,
} from "../composition/CompositionDirector";
import {
  compositionPrompt,
  type CompositionPlan,
  type CompositionValidationResult,
} from "../editorial/CompositionPlan";
export const MAX_COMPOSITION_ATTEMPTS = 2;
export const shouldRegenerateComposition = (attempt:number,accepted:boolean) => !accepted && attempt < MAX_COMPOSITION_ATTEMPTS;
export type GeneratedPoster = {
  dataUrl: string;
  filePath: string;
  revisedPrompt?: string | null;
  validationResult: CompositionValidationResult;
  finalPrompt: string;
  layoutFingerprint: string;
};
export async function generatePoster(input: {
  prompt: string;
  slideNumber: number;
  projectName: string;
  quality?: "low" | "medium" | "high";
  subtitleSafeArea?: SubtitleSafeArea;
  compositionPlan: CompositionPlan;
  layoutFingerprint: string;
  requestId?: string;
}): Promise<GeneratedPoster> {
  const safeArea = input.subtitleSafeArea ?? 25;
  let rejection = "";
  let lastPoster: Omit<GeneratedPoster, "validationResult" | "layoutFingerprint" | "finalPrompt"> | null = null;
  let lastInspection: Awaited<ReturnType<typeof inspectPosterComposition>> | null = null;
  let lastPrompt = "";
  for (let attempt = 1; attempt <= MAX_COMPOSITION_ATTEMPTS; attempt += 1) {
    lastPrompt = `${input.prompt}\n\n${compositionPrompt(input.compositionPlan, attempt === 2)}${rejection ? `\n\nPrevious composition validation failed: ${rejection}` : ""}`;
    if (typeof window !== "undefined" && window.location.hostname === "localhost") console.info("[LayoutFirst] OpenAI poster prompt", { slideNumber: input.slideNumber, layoutTemplateId: input.compositionPlan.layoutTemplateId, layoutFingerprint: input.layoutFingerprint, prompt: lastPrompt });
    if (typeof window !== "undefined" && window.location.hostname === "localhost") console.info("[ProjectUpdate] API request start", { requestId:input.requestId,slideNumber:input.slideNumber,attempt });
    const result = await window.cyberSlideStudio.generateOpenAIPosters({
      prompt: lastPrompt,
      slideNumber: input.slideNumber,
      projectName: input.projectName,
      count: 1,
      quality: input.quality ?? "low",
      subtitleSafeArea: safeArea,
      requestId: input.requestId,
    });
    if (typeof window !== "undefined" && window.location.hostname === "localhost") console.info("[ProjectUpdate] API response received", { requestId:input.requestId,slideNumber:input.slideNumber,attempt });
    const poster = result.posters[0];
    if (!poster) throw new Error("The AI provider returned no poster.");
    lastPoster = poster;
    lastInspection = await inspectPosterComposition(poster.dataUrl, safeArea, input.compositionPlan);
    if (lastInspection.accepted)
      return { ...poster, finalPrompt:lastPrompt, layoutFingerprint:input.layoutFingerprint, validationResult: { accepted:true, subjectInsideZone:lastInspection.subjectInsideZone, editorialZoneSafe:lastInspection.editorialZoneSafe, captionZoneSafe:lastInspection.captionZoneSafe, confidence:lastInspection.confidence, warnings:[], inspectedAt:new Date().toISOString(), regenerationAttempted:attempt===2 } };
    rejection = lastInspection.reason;
  }
  if (!lastPoster || !lastInspection) throw new Error("Composition validation produced no poster result.");
  return { ...lastPoster, finalPrompt:lastPrompt, layoutFingerprint:input.layoutFingerprint, validationResult: { accepted:false, subjectInsideZone:lastInspection.subjectInsideZone, editorialZoneSafe:lastInspection.editorialZoneSafe, captionZoneSafe:lastInspection.captionZoneSafe, confidence:lastInspection.confidence, warnings:[`Layout validation remains below threshold after one regeneration: ${lastInspection.reason}`], inspectedAt:new Date().toISOString(), regenerationAttempted:true } };
}export async function normalizePosterToFinalSize(
  dataUrl: string,
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Unable to load the generated poster."));
    img.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Final poster canvas is unavailable.");
  const scale = Math.max(
    canvas.width / image.width,
    canvas.height / image.height,
  );
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(
    image,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height,
  );
  return canvas.toDataURL("image/png");
}
