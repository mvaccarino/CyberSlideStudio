import type { ApprovedAsset } from "../aiDirector/types";
import type { EditorialLayoutDecision, EditorialLayoutOverride, HeadlineLinePlan, HeadlineStackLayout, LayoutBounds } from "./types";
import type { CompositionPlan } from "./CompositionPlan";
import { getLayoutTemplate } from "./LayoutTemplates";

const FRAME_WIDTH=1080, FRAME_HEIGHT=1920, SIDE_MARGIN=60, GUTTER=64;
const bounds=(x:number,y:number,width:number,height:number):LayoutBounds=>({x,y,width,height});
export const boundsOverlap=(a:LayoutBounds,b:LayoutBounds,gutter=0)=>a.x < b.x+b.width+gutter && a.x+a.width+gutter > b.x && a.y < b.y+b.height+gutter && a.y+a.height+gutter > b.y;
export type LayoutAnalysis = NonNullable<ApprovedAsset["analysis"]> & {
  negativeSpaceRegion?: "left"|"right"|"top-left"|"top-right"|"none";
  subjectExtendsIntoCaptionZone?: boolean;
  focalObjectBounds?: LayoutBounds;
  faceBounds?: LayoutBounds[];
};
export type LayoutInput={analysis?:LayoutAnalysis;override?:EditorialLayoutOverride;captionSafePercent?:20|25|30;headlineWidth?:number;supportWidth?:number;textVerticalPosition?:number};

function chooseSide(input:LayoutInput):{side:"left"|"right";confidence:number;warnings:string[]} {
  const a=input.analysis, warnings:string[]=[];
  if(input.override && input.override!=="auto") return {side:input.override.includes("right")?"right":"left",confidence:1,warnings};
  const focalCenter = a?.focalObjectBounds ? a.focalObjectBounds.x + a.focalObjectBounds.width / 2 : null;
  const faceCenter = a?.faceBounds?.length ? a.faceBounds.reduce((sum,face)=>sum+face.x+face.width/2,0)/a.faceBounds.length : null;
  if(a?.subjectPosition==="right"||a?.focalObjectPosition==="right"||(focalCenter!==null&&focalCenter>540)||(faceCenter!==null&&faceCenter>540)) return {side:"left",confidence:.94,warnings};
  if(a?.subjectPosition==="left"||a?.focalObjectPosition==="left"||(focalCenter!==null&&focalCenter<540)||(faceCenter!==null&&faceCenter<540)) return {side:"right",confidence:.94,warnings};
  if(a?.negativeSpaceRegion?.includes("right")) return {side:"right",confidence:.88,warnings};
  if(a?.negativeSpaceRegion?.includes("left")) return {side:"left",confidence:.88,warnings};
  if(a?.visualWeight==="heavy"||a?.negativeSpaceRegion==="none"){
    warnings.push("No clear text region exists; use compact stacking and consider regenerating the image.");
    return {side:"left",confidence:.42,warnings};
  }
  if(a?.subjectPosition==="center") warnings.push("Centered subject: using the preferred top-left negative-space fallback.");
  return {side:"left",confidence:a?.subjectPosition==="center"?.68:.76,warnings};
}
export function decisionFromCompositionPlan(plan:CompositionPlan,analysis?:LayoutAnalysis):EditorialLayoutDecision{
  const selected=getLayoutTemplate(plan.layoutTemplateId), text={...plan.textZone}, subject={...plan.subjectZone}, supportWidth=Math.min(selected.supportWidth,text.width), supportX=selected.headlineAlignment==="right"?text.x+text.width-supportWidth:text.x, headlineHeight=Math.min(680,Math.max(430,text.height-300)), supportY=Math.min(plan.captionZone.y-220,text.y+headlineHeight+18), warnings:string[]=[];
  if(analysis?.subjectExtendsIntoCaptionZone)warnings.push("Detected subject detail enters the planned caption zone; regenerate for layout or review manually.");
  if(analysis?.focalObjectBounds&&boundsOverlap(analysis.focalObjectBounds,text,selected.subjectSafeGutter))warnings.push("Detected focal object crosses the planned editorial zone.");
  return {alignment:selected.headlineAlignment==="right"?"right":"left",textRegionBounds:text,subjectRegionBounds:subject,focalObjectBounds:analysis?.focalObjectBounds??null,headlineBounds:bounds(text.x,text.y,text.width,headlineHeight),supportBounds:bounds(supportX,supportY,supportWidth,Math.max(140,plan.captionZone.y-supportY-30)),maximumHeadlineWidth:selected.headlineWidth,maximumSupportWidth:supportWidth,subjectSafeGutter:selected.subjectSafeGutter,headlineAnchorPoint:{x:selected.headlineAlignment==="right"?text.x+text.width:text.x,y:text.y},supportAnchorPoint:{x:supportX,y:supportY},safeCaptionBounds:{...plan.captionZone},layoutConfidence:plan.layoutConfidence,layoutWarnings:warnings,gradientStrength:selected.gradientOpacity};
}
export function decideEditorialLayout(input:LayoutInput={}):EditorialLayoutDecision {
  const captionPercent=input.captionSafePercent??25, captionTop=Math.round(FRAME_HEIGHT*(1-captionPercent/100));
  const {side,confidence,warnings}=chooseSide(input), crowded=confidence<.55;
  const width=Math.max(300,Math.min(368,input.headlineWidth??(crowded?310:336)));
  const supportWidth=Math.max(230,Math.min(width*.82,input.supportWidth??274));
  const x=side==="left"?SIDE_MARGIN:FRAME_WIDTH-SIDE_MARGIN-width;
  const y=Math.max(80,Math.min(620,input.textVerticalPosition??110));
  if(input.analysis?.subjectExtendsIntoCaptionZone) warnings.push("Subject or focal object enters the caption-safe zone; strengthen the bottom gradient and review placement.");
  if(input.analysis?.focalObjectPosition==="high"&&y<300) warnings.push("High focal object detected; text uses compact side stacking to avoid it.");
  const subjectX=side==="left"?x+width+GUTTER:SIDE_MARGIN;
  const subjectWidth=Math.max(300,side==="left"?FRAME_WIDTH-subjectX-SIDE_MARGIN:x-GUTTER-SIDE_MARGIN);
  const subjectRegion=bounds(subjectX,70,subjectWidth,captionTop-110);
  const headlineBounds=bounds(x,y,width,570);
  const supportX=side==="left"?x:x+width-supportWidth;
  const supportBounds=bounds(supportX,y+590,supportWidth,240);
  if(boundsOverlap(supportBounds,subjectRegion,GUTTER)) warnings.push("Support copy was constrained to preserve the subject-safe gutter.");
  return {alignment:side,textRegionBounds:bounds(x,y,width,Math.max(420,captionTop-y-70)),subjectRegionBounds:subjectRegion,focalObjectBounds:input.analysis?.focalObjectBounds??null,headlineBounds,supportBounds,maximumHeadlineWidth:width,maximumSupportWidth:supportWidth,subjectSafeGutter:GUTTER,headlineAnchorPoint:{x:side==="left"?x:x+width,y},supportAnchorPoint:{x:supportX,y:supportBounds.y},safeCaptionBounds:bounds(90,captionTop+55,900,FRAME_HEIGHT-captionTop-180),layoutConfidence:confidence,layoutWarnings:warnings,gradientStrength:input.analysis?.subjectExtendsIntoCaptionZone?.66:crowded?.62:.54};
}

export function balancedHeadlineWrap(value:string,maxWidth:number,fontSize:number,maxLines=5):string[] {
  const words=value.trim().split(/\s+/).filter(Boolean); if(!words.length)return [];
  const capacity=Math.max(5,Math.floor(maxWidth/(fontSize*.54))), lineCount=Math.min(maxLines,Math.max(2,Math.ceil(words.join(" ").length/capacity)));
  const target=words.join(" ").length/lineCount, lines:string[]=[]; let current="";
  for(const word of words){const candidate=current?`${current} ${word}`:word; if(current&&lines.length<lineCount-1&&candidate.length>target*1.16){lines.push(current);current=word;}else current=candidate;}
  if(current)lines.push(current);
  if(lines.length>1&&lines.at(-1)!.split(" ").length===1&&lines.at(-2)!.split(" ").length>2){const prior=lines[lines.length-2].split(" ");lines[lines.length-1]=`${prior.pop()} ${lines.at(-1)}`;lines[lines.length-2]=prior.join(" ");}
  return lines.filter(line=>line.trim()&&!/^[\\/.,:;!?-]+$/.test(line.trim())).slice(0,maxLines);
}

export const EDITORIAL_BOLD_FONTS = ["Impact","Arial Black","Bahnschrift Condensed","Franklin Gothic Heavy","Segoe UI Black","Arial Bold"] as const;
export const EDITORIAL_BOLD_MIN_SIZE = 112;
const tokenKey=(value:string)=>value.toLocaleUpperCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}'-]/gu,"");
export function phraseTokenRange(headline:string,phrase:string):{start:number;end:number}|null{
  const source=headline.split(/\s+/).map(tokenKey), target=phrase.split(/\s+/).map(tokenKey).filter(Boolean);
  if(!target.length)return null;
  for(let start=0;start<=source.length-target.length;start++)if(target.every((token,index)=>source[start+index]===token))return {start,end:start+target.length};
  return null;
}
export function designHeadlineStack(value:string,phrase:string,width:number,requestedSize=146,layout:HeadlineStackLayout="Editorial Rag",customOffsets:number[]=[]):HeadlineLinePlan[]{
  const effective=Math.max(EDITORIAL_BOLD_MIN_SIZE,Math.min(164,requestedSize));
  const range=phraseTokenRange(value,phrase), words=value.trim().split(/\s+/);
  const before=range?words.slice(0,range.start):words, emphasized=range?words.slice(range.start,range.end).join(" "):"", after=range?words.slice(range.end):[];
  const lines=[...balancedHeadlineWrap(before.join(" "),width,effective,Math.max(1,3-(emphasized?1:0))),...(emphasized?[emphasized]:[]),...balancedHeadlineWrap(after.join(" "),width,effective,1)].filter(Boolean).slice(0,4);
  let cursor=0;
  const patterns:Record<HeadlineStackLayout,number[]>={"Editorial Rag":[0,4,8,3,0],"Left Stair":[0,8,16,24,32],"Right Stair":[32,24,16,8,0],"Center Stack":[0,0,0,0,0],"Block Stack":[0,0,0,0,0]};
  return lines.map((text,index)=>{const count=text.split(/\s+/).length,start=cursor,end=cursor+count,emphasized=!!range&&start<range.end&&end>range.start,offset=customOffsets[index]??patterns[layout][index]??0;cursor=end;return{text,xOffset:offset,width:Math.max(220,width-Math.max(0,offset)),fontSize:Math.round(effective*(emphasized?1.06:1)),alignment:layout==="Center Stack"?"center":layout==="Right Stair"?"right":"left",emphasized};});
}
