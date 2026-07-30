export type PosterStyleId =
  | "enterprise-security"
  | "cinematic-cyber"
  | "editorial-tech"
  | "minimal-premium";

export type PosterPlatform = "short-form-vertical" | "instagram-story" | "youtube-short";
export type PosterAudience = "small-business" | "employees" | "executives" | "general-public";

export type PosterBrief = {
  headline: string;
  supportingText: string;
  cta?: string;
  focalWords: string[];
  styleId: PosterStyleId;
  platform: PosterPlatform;
  audience: PosterAudience;
  theme: string;
  layoutHint: string;
  conceptIndex: number;
  highlightColor: string;
  compositionInstruction?: string;
};

export type PosterPromptResult = {
  prompt: string;
  directionName: string;
  styleId: PosterStyleId;
};
