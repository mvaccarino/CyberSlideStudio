export type SlideStatus =
  | "draft"
  | "ready"
  | "generating"
  | "generated"
  | "error";

export type SlideLayout =
  | "cinematic-hero"
  | "split-statement"
  | "bold-warning"
  | "minimal-cta"
  | "auto";

export type SlideTheme =
  | "enterprise-cyber"
  | "minimal-dark"
  | "security-operations"
  | "modern-technology"
  | "project-default";

export type ValidationSeverity = "info" | "warning" | "error";

export type SlideValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  field: "title" | "body" | "cta" | "notes" | "layout" | "background" | "slide";
  message: string;
};

export type SlideBackground = {
  prompt: string;
  negativePrompt: string;
  imagePath: string | null;
  provider: "flux" | "local" | "none";
  generationId: string | null;
};

export type SlideTypography = {
  focalWords: string[];
  titleScale: number;
  bodyScale: number;
  titleAlignment: "left" | "center" | "right";
  bodyAlignment: "left" | "center" | "right";
};

export type Slide = {
  id: string;
  number: number;
  title: string;
  body: string;
  cta: string;
  notes: string;
  layout: SlideLayout;
  theme: SlideTheme;
  background: SlideBackground;
  typography: SlideTypography;
  captionSafeZonePercent: number;
  status: SlideStatus;
  validation: SlideValidationIssue[];
  createdAt: string;
  updatedAt: string;
};
