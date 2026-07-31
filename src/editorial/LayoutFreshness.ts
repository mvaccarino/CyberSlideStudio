import type { Project } from "../models/Project";
import type { Slide } from "../models/Slide";
import { compositionPrompt } from "./CompositionPlan";
import { resolveProjectCTA } from "../brand/BrandCTAEngine";

export const LAYOUT_ENGINE_VERSION = "layout-first-2.0.0";
const stable=(value:unknown):string=>{
  if(value===null||typeof value!=="object")return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(stable).join(",")}]`;
  return `{${Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>`${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
};
export const fingerprint=(value:unknown):string=>{
  const input=stable(value);let hash=2166136261;
  for(let index=0;index<input.length;index+=1){hash^=input.charCodeAt(index);hash=Math.imul(hash,16777619)}
  return `${LAYOUT_ENGINE_VERSION}:${(hash>>>0).toString(16).padStart(8,"0")}`;
};
const semanticPlan=(slide:Slide)=>slide.compositionPlan?{...slide.compositionPlan,createdAt:undefined,sourceFingerprint:undefined}:null;
export function slideLayoutFingerprint(slide:Slide):string{
  return fingerprint({layoutEngineVersion:LAYOUT_ENGINE_VERSION,layoutTemplateId:slide.layoutTemplateId,compositionPlan:semanticPlan(slide),headline:slide.editorialPackage.displayHeadline,emphasizedPhrase:slide.editorialPackage.highlightPhrase,supportText:slide.editorialPackage.supportLine,safeAreaPercent:slide.captionSafeZonePercent,imagePromptCompositionInstructions:slide.compositionPlan?compositionPrompt(slide.compositionPlan):""});
}
export function voiceInputFingerprint(project: Project): string {
  return fingerprint({
    cta: resolveProjectCTA(project),
    slides: project.slides.map(({ number, editorialPackage }) => ({ number, narration: editorialPackage.narration })),
  });
}
export function projectLayoutFingerprint(project:Pick<Project,"slides"|"settings">):string{
  return fingerprint({layoutEngineVersion:LAYOUT_ENGINE_VERSION,safeAreaPercent:project.settings.captionSafeZonePercent,slides:project.slides.map(slide=>({id:slide.id,fingerprint:slideLayoutFingerprint(slide)}))});
}
export type LayoutStaleness={projectFingerprint:string;imageStale:boolean;textStale:boolean;videoStale:boolean;staleSlideIds:string[];resumeStage:"images"|"video"|"publish"};
export function deriveLayoutStaleness(project:Project):LayoutStaleness{
  const projectFingerprint=projectLayoutFingerprint(project),staleSlideIds=project.slides.filter(slide=>!slide.background.approvedImagePath||slide.approvedImageFingerprint!==slideLayoutFingerprint(slide)).map(slide=>slide.id),imageStale=staleSlideIds.length>0,textStale=project.slideTextOverlay.layoutFingerprint!==projectFingerprint||!project.slideTextOverlay.freshness,videoStale=!project.finalRender||project.finalRender.layoutFingerprint!==projectFingerprint;
  return {projectFingerprint,imageStale,textStale,videoStale,staleSlideIds,resumeStage:imageStale?"images":textStale||videoStale?"video":"publish"};
}
export const withDesiredFingerprint=(slide:Slide):Slide=>({...slide,compositionFingerprint:slideLayoutFingerprint(slide)});
