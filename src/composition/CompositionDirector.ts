import type { CompositionPlan } from "../editorial/CompositionPlan";
export type SubtitleSafeArea = 20 | 25 | 30;
export const DEFAULT_SUBTITLE_SAFE_AREA: SubtitleSafeArea = 25;
export const COMPOSITION_DIRECTIVE = `Compose the primary subject on the right side of the vertical frame when practical.

Reserve the left 30–40% as clean editorial negative space for a large stacked headline and short supporting line.

Keep a clear visual gutter between the editorial text zone and the visual subject zone.

Keep the bottom configured subtitle-safe area visually simple for dynamic narration captions.

Do not place faces, eyes, heads, hands, phones, laptops, screens, warning dialogs, security icons, focal objects, or important action inside the editorial text zone or caption-safe zone.

When right-side subject placement is impractical, reserve the clearest opposing side as editorial negative space while preserving the three distinct zones.`;
const STORAGE_KEY = "cyberslide:composition-settings";
export function normalizeSubtitleSafeArea(value: unknown): SubtitleSafeArea {
  return value === 20 || value === 30 ? value : 25;
}
export function loadSubtitleSafeArea(): SubtitleSafeArea {
  if (typeof localStorage === "undefined") return DEFAULT_SUBTITLE_SAFE_AREA;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as {
      subtitleSafeArea?: unknown;
    };
    return normalizeSubtitleSafeArea(stored.subtitleSafeArea);
  } catch {
    return DEFAULT_SUBTITLE_SAFE_AREA;
  }
}
export function saveSubtitleSafeArea(value: SubtitleSafeArea): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ subtitleSafeArea: value }),
  );
}
export function composePosterPrompt(
  prompt: string,
  safeArea: SubtitleSafeArea,
): string {
  const base = prompt
    .replace(COMPOSITION_DIRECTIVE, "")
    .replace(/\n*Active configured subtitle-safe area:[^\n]*/gi, "")
    .trim();
  return `${base}\n\n${COMPOSITION_DIRECTIVE}\n\nActive configured subtitle-safe area: the bottom ${safeArea}% of the frame. Keep this entire area free of primary-subject detail.`;
}
export type CompositionInspection = {
  accepted: boolean;
  protectedSaliencyRatio: number;
  editorialSaliencyRatio: number;
  subjectInsideZone: boolean;
  editorialZoneSafe: boolean;
  captionZoneSafe: boolean;
  confidence: number;
  reason: string;
};
export function validateCompositionMeasurements(protectedSaliencyRatio:number,editorialSaliencyRatio:number,subjectEnergyRatio:number){
  const captionZoneSafe=protectedSaliencyRatio<=1.12, editorialZoneSafe=editorialSaliencyRatio<=.92, subjectInsideZone=subjectEnergyRatio>1, confidence=Math.max(0,Math.min(1,1-(Math.max(0,protectedSaliencyRatio-1)*.45+Math.max(0,editorialSaliencyRatio-.75)*.55)));
  return {accepted:captionZoneSafe&&editorialZoneSafe&&subjectInsideZone&&confidence>=.72,captionZoneSafe,editorialZoneSafe,subjectInsideZone,confidence};
}
export async function inspectPosterComposition(
  dataUrl: string,
  safeArea: SubtitleSafeArea,
  plan?: CompositionPlan,
): Promise<CompositionInspection> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const candidate = new Image();
    candidate.onload = () => resolve(candidate);
    candidate.onerror = () => reject(new Error("Composition Director could not inspect the generated poster."));
    candidate.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 171;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Composition Director canvas analysis is unavailable.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const textZone = plan?.textZone ?? {x:0,y:0,width:432,height:1440};
  const subjectZone = plan?.subjectZone ?? {x:540,y:0,width:540,height:1440};
  const captionZone = plan?.captionZone ?? {x:0,y:1920*(1-safeArea/100),width:1080,height:1920*safeArea/100};
  let upperEnergy=0,protectedEnergy=0,upperCount=0,protectedCount=0,editorialEnergy=0,editorialCount=0,subjectEnergy=0,subjectCount=0;
  const luminance=(offset:number)=>pixels[offset]*.2126+pixels[offset+1]*.7152+pixels[offset+2]*.0722;
  const contains=(zone:{x:number;y:number;width:number;height:number},x:number,y:number)=>x>=zone.x&&x<=zone.x+zone.width&&y>=zone.y&&y<=zone.y+zone.height;
  for(let y=1;y<canvas.height-1;y+=1) for(let x=1;x<canvas.width-1;x+=1){
    const offset=(y*canvas.width+x)*4, edge=Math.abs(luminance(offset)-luminance(offset+4))+Math.abs(luminance(offset)-luminance(offset+canvas.width*4)), chroma=Math.max(pixels[offset],pixels[offset+1],pixels[offset+2])-Math.min(pixels[offset],pixels[offset+1],pixels[offset+2]), energy=edge+chroma*.18, frameX=x/canvas.width*1080, frameY=y/canvas.height*1920;
    if(contains(captionZone,frameX,frameY)){protectedEnergy+=energy;protectedCount+=1}else{upperEnergy+=energy;upperCount+=1}
    if(contains(textZone,frameX,frameY)){editorialEnergy+=energy;editorialCount+=1}
    if(contains(subjectZone,frameX,frameY)){subjectEnergy+=energy;subjectCount+=1}
  }
  const protectedSaliencyRatio=protectedEnergy/Math.max(1,protectedCount)/Math.max(1,upperEnergy/Math.max(1,upperCount));
  const editorialSaliencyRatio=editorialEnergy/Math.max(1,editorialCount)/Math.max(1,subjectEnergy/Math.max(1,subjectCount));
  const captionZoneSafe=protectedSaliencyRatio<=1.12, editorialZoneSafe=editorialSaliencyRatio<=.92, subjectInsideZone=subjectEnergy/Math.max(1,subjectCount)>editorialEnergy/Math.max(1,editorialCount), confidence=Math.max(0,Math.min(1,1-(Math.max(0,protectedSaliencyRatio-1)*.45+Math.max(0,editorialSaliencyRatio-.75)*.55)));
  const accepted=captionZoneSafe&&editorialZoneSafe&&subjectInsideZone&&confidence>=.72;
  return {accepted,protectedSaliencyRatio,editorialSaliencyRatio,subjectInsideZone,editorialZoneSafe,captionZoneSafe,confidence,reason:accepted?"Saved CompositionPlan zones passed saliency validation.":`CompositionPlan validation failed (caption ${protectedSaliencyRatio.toFixed(2)}, editorial ${editorialSaliencyRatio.toFixed(2)}, confidence ${confidence.toFixed(2)}).`};
}
