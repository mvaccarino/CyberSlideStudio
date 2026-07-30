export type EditorialPosterStyle =
  | "Editorial Bold"
  | "CyberSlide Bold"
  | "Documentary"
  | "Corporate"
  | "Educational"
  | "Fast Social"
  | "Viral Alert"
  | "News Report"
  | "Minimal";
export type EditorialTextMode = "persistent" | "brief";
export type HeadlineStackLayout = "Left Stair" | "Right Stair" | "Center Stack" | "Editorial Rag" | "Block Stack";
export type HeadlineWeight = "Heavy" | "Black";
export type HeadlineLinePlan = { text:string; xOffset:number; width:number; fontSize:number; alignment:"left"|"center"|"right"; emphasized:boolean };
export type EditorialAlignment = "auto" | "left" | "center" | "right";
export type EditorialLayoutOverride = "auto" | "text-left" | "text-right" | "top-left" | "top-right";
export type PosterTextRegion = "upper-left" | "upper-center" | "upper-right" | "middle-left" | "middle-right";
export type LayoutBounds = { x:number; y:number; width:number; height:number };
export type LayoutAnchor = { x:number; y:number };
export type EditorialLayoutDecision = {
  alignment: "left" | "right";
  textRegionBounds: LayoutBounds;
  subjectRegionBounds: LayoutBounds;
  focalObjectBounds: LayoutBounds | null;
  headlineBounds: LayoutBounds;
  supportBounds: LayoutBounds;
  maximumHeadlineWidth: number;
  maximumSupportWidth: number;
  subjectSafeGutter: number;
  headlineAnchorPoint: LayoutAnchor;
  supportAnchorPoint: LayoutAnchor;
  safeCaptionBounds: LayoutBounds;
  layoutConfidence: number;
  layoutWarnings: string[];
  gradientStrength: number;
};
export type SlideEditorialLayout = {
  displayHeadline: string;
  emphasizedText: string;
  supportingLine: string;
  layoutAlignment: EditorialAlignment;
  posterTextRegion: PosterTextRegion;
  layoutOverride: EditorialLayoutOverride;
  headlineWidth: number;
  headlineSize: number;
  headlineFont: string;
  headlineWeight: HeadlineWeight;
  stackLayout: HeadlineStackLayout;
  lineSpacing: number;
  subjectGutter: number;
  lineOffsets: number[];
  headlineLines: HeadlineLinePlan[];
  supportWidth: number;
  supportSize: number;
  textVerticalPosition: number;
  highlightColor: string;
  decision: EditorialLayoutDecision;
  sourceImagePath: string | null;
  manualOverride: boolean;
  validationWarnings: string[];
};
