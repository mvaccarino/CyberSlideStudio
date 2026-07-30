import type { LayoutBounds } from "./types";

export type LayoutTemplateId =
  | "editorial-left"
  | "editorial-right"
  | "documentary-center"
  | "news-alert"
  | "minimal"
  | "corporate-split"
  | "full-image-caption";

export type LayoutTemplate = {
  id: LayoutTemplateId;
  name: string;
  textZone: LayoutBounds;
  subjectZone: LayoutBounds;
  captionZone: LayoutBounds;
  headlineAlignment: "left" | "center" | "right";
  headlineWidth: number;
  headlineFontFamily: string[];
  headlineWeight: "Heavy" | "Black";
  headlineSizeRange: [number, number];
  lineSpacing: number;
  supportPlacement: "below-headline";
  supportWidth: number;
  supportSize: number;
  highlightBehavior: "whole-phrase";
  gradientDirection: "left-to-right" | "right-to-left" | "top-to-bottom" | "none";
  gradientOpacity: number;
  subjectSafeGutter: number;
  preferredSubjectSide: "left" | "center" | "right" | "any";
  fallbackLayoutIds: LayoutTemplateId[];
  uppercaseHeadline: boolean;
};

const fonts = ["Impact", "Anton", "Bahnschrift Condensed", "Arial Black", "Franklin Gothic Heavy", "Segoe UI Black"];
const template = (value: LayoutTemplate): LayoutTemplate => value;
export const LAYOUT_TEMPLATES: Record<LayoutTemplateId, LayoutTemplate> = {
  "editorial-left": template({id:"editorial-left",name:"Editorial Left",textZone:{x:40,y:90,width:400,height:1110},subjectZone:{x:500,y:70,width:580,height:1280},captionZone:{x:80,y:1440,width:920,height:300},headlineAlignment:"left",headlineWidth:400,headlineFontFamily:fonts,headlineWeight:"Black",headlineSizeRange:[118,172],lineSpacing:-8,supportPlacement:"below-headline",supportWidth:278,supportSize:44,highlightBehavior:"whole-phrase",gradientDirection:"left-to-right",gradientOpacity:.56,subjectSafeGutter:60,preferredSubjectSide:"right",fallbackLayoutIds:["editorial-right","documentary-center","full-image-caption"],uppercaseHeadline:true}),
  "editorial-right": template({id:"editorial-right",name:"Editorial Right",textZone:{x:640,y:90,width:400,height:1110},subjectZone:{x:0,y:70,width:580,height:1280},captionZone:{x:80,y:1440,width:920,height:300},headlineAlignment:"right",headlineWidth:400,headlineFontFamily:fonts,headlineWeight:"Black",headlineSizeRange:[118,172],lineSpacing:-8,supportPlacement:"below-headline",supportWidth:278,supportSize:44,highlightBehavior:"whole-phrase",gradientDirection:"right-to-left",gradientOpacity:.56,subjectSafeGutter:60,preferredSubjectSide:"left",fallbackLayoutIds:["editorial-left","documentary-center","full-image-caption"],uppercaseHeadline:true}),
  "documentary-center": template({id:"documentary-center",name:"Documentary Center",textZone:{x:150,y:90,width:780,height:430},subjectZone:{x:100,y:500,width:880,height:850},captionZone:{x:80,y:1440,width:920,height:300},headlineAlignment:"center",headlineWidth:780,headlineFontFamily:["Bahnschrift Condensed","Arial Black","Segoe UI Black"],headlineWeight:"Heavy",headlineSizeRange:[92,142],lineSpacing:-4,supportPlacement:"below-headline",supportWidth:570,supportSize:40,highlightBehavior:"whole-phrase",gradientDirection:"top-to-bottom",gradientOpacity:.46,subjectSafeGutter:50,preferredSubjectSide:"center",fallbackLayoutIds:["editorial-left","editorial-right","full-image-caption"],uppercaseHeadline:false}),
  "news-alert": template({id:"news-alert",name:"News Alert",textZone:{x:44,y:80,width:500,height:820},subjectZone:{x:600,y:100,width:480,height:1200},captionZone:{x:80,y:1440,width:920,height:300},headlineAlignment:"left",headlineWidth:500,headlineFontFamily:["Arial Black","Franklin Gothic Heavy","Segoe UI Black"],headlineWeight:"Black",headlineSizeRange:[108,158],lineSpacing:-5,supportPlacement:"below-headline",supportWidth:360,supportSize:42,highlightBehavior:"whole-phrase",gradientDirection:"left-to-right",gradientOpacity:.6,subjectSafeGutter:56,preferredSubjectSide:"right",fallbackLayoutIds:["editorial-left","editorial-right"],uppercaseHeadline:true}),
  minimal: template({id:"minimal",name:"Minimal",textZone:{x:100,y:140,width:520,height:640},subjectZone:{x:570,y:100,width:510,height:1250},captionZone:{x:90,y:1440,width:900,height:300},headlineAlignment:"left",headlineWidth:520,headlineFontFamily:["Bahnschrift Condensed","Segoe UI Black","Arial Black"],headlineWeight:"Heavy",headlineSizeRange:[82,126],lineSpacing:2,supportPlacement:"below-headline",supportWidth:400,supportSize:36,highlightBehavior:"whole-phrase",gradientDirection:"left-to-right",gradientOpacity:.34,subjectSafeGutter:50,preferredSubjectSide:"right",fallbackLayoutIds:["editorial-left","full-image-caption"],uppercaseHeadline:false}),
  "corporate-split": template({id:"corporate-split",name:"Corporate Split",textZone:{x:54,y:120,width:446,height:1040},subjectZone:{x:560,y:90,width:520,height:1260},captionZone:{x:90,y:1440,width:900,height:300},headlineAlignment:"left",headlineWidth:446,headlineFontFamily:["Arial Black","Bahnschrift Condensed","Segoe UI Black"],headlineWeight:"Heavy",headlineSizeRange:[92,138],lineSpacing:-2,supportPlacement:"below-headline",supportWidth:340,supportSize:38,highlightBehavior:"whole-phrase",gradientDirection:"left-to-right",gradientOpacity:.4,subjectSafeGutter:60,preferredSubjectSide:"right",fallbackLayoutIds:["editorial-left","editorial-right"],uppercaseHeadline:false}),
  "full-image-caption": template({id:"full-image-caption",name:"Full-Image Caption",textZone:{x:90,y:100,width:900,height:320},subjectZone:{x:40,y:380,width:1000,height:950},captionZone:{x:90,y:1440,width:900,height:300},headlineAlignment:"center",headlineWidth:900,headlineFontFamily:["Impact","Arial Black","Segoe UI Black"],headlineWeight:"Heavy",headlineSizeRange:[82,128],lineSpacing:-2,supportPlacement:"below-headline",supportWidth:620,supportSize:36,highlightBehavior:"whole-phrase",gradientDirection:"top-to-bottom",gradientOpacity:.38,subjectSafeGutter:40,preferredSubjectSide:"any",fallbackLayoutIds:["documentary-center","editorial-left"],uppercaseHeadline:true}),
};
export const DEFAULT_LAYOUT_TEMPLATE_ID: LayoutTemplateId = "editorial-left";
export const getLayoutTemplate = (id?: string | null): LayoutTemplate => LAYOUT_TEMPLATES[(id || DEFAULT_LAYOUT_TEMPLATE_ID) as LayoutTemplateId] || LAYOUT_TEMPLATES[DEFAULT_LAYOUT_TEMPLATE_ID];
export const listLayoutTemplates = (): LayoutTemplate[] => Object.values(LAYOUT_TEMPLATES);
