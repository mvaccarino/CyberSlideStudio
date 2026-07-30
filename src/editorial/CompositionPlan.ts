import type { Slide } from "../models/Slide";
import type { LayoutBounds } from "./types";
import { DEFAULT_LAYOUT_TEMPLATE_ID, getLayoutTemplate, type LayoutTemplateId } from "./LayoutTemplates";

export type ProhibitedObjectZone = { bounds: LayoutBounds; prohibited: string[] };
export type CompositionValidationResult = { accepted:boolean; subjectInsideZone:boolean; editorialZoneSafe:boolean; captionZoneSafe:boolean; confidence:number; warnings:string[]; inspectedAt:string|null; regenerationAttempted:boolean };
export type CompositionPlan = {
  layoutTemplateId: LayoutTemplateId;
  textZone: LayoutBounds;
  subjectZone: LayoutBounds;
  captionZone: LayoutBounds;
  preferredSubjectSide: "left"|"center"|"right"|"any";
  subjectDescription: string;
  focalObjectDescription: string;
  backgroundTreatment: string;
  negativeSpaceInstruction: string;
  gradientInstruction: string;
  prohibitedObjectZones: ProhibitedObjectZone[];
  layoutConfidence: number;
  fallbackLayoutIds: LayoutTemplateId[];
  createdAt: string;
  sourceFingerprint: string;
};
const clean=(value:string)=>value.replace(/\s+/g," ").trim();
export const compositionFingerprint=(slide:Pick<Slide,"title"|"body"|"captionSafeZonePercent">,layoutTemplateId:LayoutTemplateId)=>`${layoutTemplateId}|${clean(slide.title)}|${clean(slide.body)}|${slide.captionSafeZonePercent}`;
export function createCompositionPlan(slide:Pick<Slide,"title"|"body"|"captionSafeZonePercent">,layoutTemplateId:LayoutTemplateId=DEFAULT_LAYOUT_TEMPLATE_ID):CompositionPlan{
  const selected=getLayoutTemplate(layoutTemplateId), subject=clean(slide.title)||"the topic's primary real-world subject", detail=clean(slide.body).split(/[.!?]/)[0]||subject;
  const captionTop=Math.round(1920*(1-slide.captionSafeZonePercent/100)), captionZone={...selected.captionZone,y:captionTop,height:Math.max(120,1740-captionTop)};
  return {layoutTemplateId:selected.id,textZone:{...selected.textZone},subjectZone:{...selected.subjectZone},captionZone,preferredSubjectSide:selected.preferredSubjectSide,subjectDescription:`A concrete cinematic scene illustrating ${subject}`,focalObjectDescription:detail,backgroundTreatment:"Cinematic photographic depth with a naturally dark editorial side and realistic environmental lighting.",negativeSpaceInstruction:`Keep the ${selected.headlineAlignment === "right" ? "right" : selected.headlineAlignment === "center" ? "upper" : "left"} editorial zone dark, clean, low-detail, and intentionally empty.`,gradientInstruction:`Use a natural ${selected.gradientDirection} luminance transition at approximately ${Math.round(selected.gradientOpacity*100)}% maximum darkness; never create a flat panel.`,prohibitedObjectZones:[{bounds:{...selected.textZone},prohibited:["faces","eyes","heads","hands","phones","laptops","screens","warning dialogs","logos","written text","primary action"]},{bounds:{...selected.captionZone},prohibited:["faces","hands","devices","screens","written text","essential action"]}],layoutConfidence:.92,fallbackLayoutIds:[...selected.fallbackLayoutIds],createdAt:new Date().toISOString(),sourceFingerprint:compositionFingerprint(slide,selected.id)};
}
export const needsCompositionPlan=(slide:Slide)=>!slide.compositionPlan||slide.compositionPlan.sourceFingerprint!==compositionFingerprint(slide,slide.layoutTemplateId);
export const ensureCompositionPlan=(slide:Slide):Slide=>needsCompositionPlan(slide)?{...slide,compositionPlan:createCompositionPlan(slide,slide.layoutTemplateId)}:slide;
export function compositionPrompt(plan:CompositionPlan,strong=false):string{
 const emphasis=strong?"This zone separation is mandatory. Increase the empty negative space and move all important subjects farther into the specified subject zone.":"";
 return `Create a cinematic vertical 9:16 scene designed for the ${getLayoutTemplate(plan.layoutTemplateId).name} editorial poster layout.\n\nPlace the primary person, object, and action mainly on the ${plan.preferredSubjectSide} side inside the subject zone (${plan.subjectZone.x}-${plan.subjectZone.x+plan.subjectZone.width} of 1080 horizontal pixels).\n\nReserve the ${plan.layoutTemplateId==="editorial-left"?"left 38-45%":"editorial region"} (${plan.textZone.x}-${plan.textZone.x+plan.textZone.width}) as dark, clean negative space for deterministic oversized stacked typography and a short explanatory line. ${plan.negativeSpaceInstruction}\n\n${plan.gradientInstruction}\n\nKeep the lower caption zone (${plan.captionZone.y}-${plan.captionZone.y+plan.captionZone.height} of 1920 vertical pixels) visually calm and free of faces, hands, devices, screens, text, and essential action for dynamic narration captions.\n\nDo not generate any written headline, caption, logo, watermark, interface label, or UI text inside the image. ${emphasis}`.trim();
}
export const emptyValidationResult=():CompositionValidationResult=>({accepted:false,subjectInsideZone:false,editorialZoneSafe:false,captionZoneSafe:false,confidence:0,warnings:["Existing approved image predates layout-first planning and may need regeneration."],inspectedAt:null,regenerationAttempted:false});
