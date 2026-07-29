import { directSlide } from "../artDirector/ArtDirector";
import { getTemplate } from "../templates/TemplateRegistry";

export type FinalSlideRenderInput = {
  backgroundDataUrl: string;
  headline: string;
  supportingText: string;
  cta?: string;
  focalWords: string[];
  foreground: string;
  accent: string;
};

const WIDTH = 1080;
const HEIGHT = 1920;
const SAFE_ZONE_TOP = Math.round(HEIGHT * 0.8);

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the generated background."));
    image.src = source;
  });
}

function drawImageCover(context: CanvasRenderingContext2D, image: HTMLImageElement): void {
  const scale = Math.max(WIDTH / image.width, HEIGHT / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(image, (WIDTH - drawWidth) / 2, (HEIGHT - drawHeight) / 2, drawWidth, drawHeight);
}

function drawContrastOverlay(context: CanvasRenderingContext2D): void {
  const overlay = context.createLinearGradient(0, 0, 0, HEIGHT);
  overlay.addColorStop(0, "rgba(2,8,14,.04)");
  overlay.addColorStop(0.45, "rgba(2,8,14,.12)");
  overlay.addColorStop(0.74, "rgba(2,8,14,.38)");
  overlay.addColorStop(1, "rgba(2,8,14,.94)");
  context.fillStyle = overlay;
  context.fillRect(0, 0, WIDTH, HEIGHT);
}

export async function renderFinalSlide(input: FinalSlideRenderInput): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable.");

  const image = await loadImage(input.backgroundDataUrl);
  const plan = await directSlide(image);
  drawImageCover(context, image);
  drawContrastOverlay(context);

  getTemplate(plan.templateId).render({
    context,
    width: WIDTH,
    height: HEIGHT,
    safeZoneTop: SAFE_ZONE_TOP,
    headline: input.headline,
    supportingText: input.supportingText,
    cta: input.cta,
    focalWords: input.focalWords,
    foreground: input.foreground,
    plan,
  });

  const safeGradient = context.createLinearGradient(0, SAFE_ZONE_TOP, 0, HEIGHT);
  safeGradient.addColorStop(0, "rgba(2,8,14,.48)");
  safeGradient.addColorStop(1, "rgba(2,8,14,.96)");
  context.fillStyle = safeGradient;
  context.fillRect(0, SAFE_ZONE_TOP, WIDTH, HEIGHT - SAFE_ZONE_TOP);

  return canvas.toDataURL("image/png");
}
