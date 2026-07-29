export type GeneratedPoster = {
  dataUrl: string;
  filePath: string;
  revisedPrompt?: string | null;
};

export async function generatePoster(input: {
  prompt: string;
  slideNumber: number;
  projectName: string;
  quality?: "low" | "medium" | "high";
}): Promise<GeneratedPoster> {
  const result = await window.cyberSlideStudio.generateOpenAIPosters({
    prompt: input.prompt,
    slideNumber: input.slideNumber,
    projectName: input.projectName,
    count: 1,
    quality: input.quality ?? "low",
  });

  const poster = result.posters[0];
  if (!poster) throw new Error("The AI provider returned no poster.");
  return poster;
}

export async function normalizePosterToFinalSize(
  dataUrl: string,
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Unable to load the generated poster."));
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Final poster canvas is unavailable.");

  const scale = Math.max(
    canvas.width / image.width,
    canvas.height / image.height,
  );
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(
    image,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height,
  );
  return canvas.toDataURL("image/png");
}
