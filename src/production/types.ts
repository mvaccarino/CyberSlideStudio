export type ProductionSlide = {
  number: number;
  headline: string;
  body: string;
  cta: string;
  imageDataUrl?: string;
};

export type ProductionPackageInput = {
  projectName: string;
  theme: string;
  layout: string;
  slides: ProductionSlide[];
};

export type ProductionPackagePayload = {
  projectName: string;
  files: Array<{ relativePath: string; contents: string }>;
  images: Array<{ relativePath: string; dataUrl: string }>;
  pdfs: Array<{ relativePath: string; html: string }>;
};
