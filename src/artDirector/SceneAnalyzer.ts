import type { RegionScore, SceneAnalysis, SceneClass } from "./SceneTypes";

const SAMPLE_WIDTH = 90;
const SAMPLE_HEIGHT = 160;
const GRID_COLUMNS = 3;
const GRID_ROWS = 4;

type PixelStats = { brightness: number; detail: number; contrast: number };

function brightness(data: Uint8ClampedArray, index: number): number {
  return (data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722) / 255;
}

function regionStats(data: Uint8ClampedArray, width: number, x0: number, y0: number, x1: number, y1: number): PixelStats {
  let total = 0;
  let squared = 0;
  let detail = 0;
  let count = 0;

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * width + x) * 4;
      const current = brightness(data, i);
      total += current;
      squared += current * current;
      count += 1;

      if (x + 1 < x1) detail += Math.abs(current - brightness(data, i + 4));
      if (y + 1 < y1) detail += Math.abs(current - brightness(data, i + width * 4));
    }
  }

  const mean = count ? total / count : 0;
  const variance = count ? Math.max(0, squared / count - mean * mean) : 0;

  return {
    brightness: mean,
    detail: count ? detail / (count * 2) : 0,
    contrast: Math.sqrt(variance),
  };
}

function buildRegions(data: Uint8ClampedArray): RegionScore[] {
  const regions: RegionScore[] = [];

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      const x0 = Math.floor((column * SAMPLE_WIDTH) / GRID_COLUMNS);
      const x1 = Math.floor(((column + 1) * SAMPLE_WIDTH) / GRID_COLUMNS);
      const y0 = Math.floor((row * SAMPLE_HEIGHT) / GRID_ROWS);
      const y1 = Math.floor(((row + 1) * SAMPLE_HEIGHT) / GRID_ROWS);
      const stats = regionStats(data, SAMPLE_WIDTH, x0, y0, x1, y1);
      const lowDetail = 1 - Math.min(1, stats.detail * 7);
      const moderateBrightness = 1 - Math.abs(stats.brightness - 0.42);
      const placementScore = lowDetail * 0.62 + moderateBrightness * 0.23 + (1 - Math.min(1, stats.contrast * 2.5)) * 0.15;

      regions.push({
        x: column / GRID_COLUMNS,
        y: row / GRID_ROWS,
        width: 1 / GRID_COLUMNS,
        height: 1 / GRID_ROWS,
        brightness: stats.brightness,
        detail: stats.detail,
        contrast: stats.contrast,
        placementScore,
      });
    }
  }

  return regions.sort((a, b) => b.placementScore - a.placementScore);
}

function symmetryScore(data: Uint8ClampedArray): number {
  let difference = 0;
  let count = 0;

  for (let y = 0; y < SAMPLE_HEIGHT; y += 2) {
    for (let x = 0; x < SAMPLE_WIDTH / 2; x += 2) {
      const left = (y * SAMPLE_WIDTH + x) * 4;
      const right = (y * SAMPLE_WIDTH + (SAMPLE_WIDTH - 1 - x)) * 4;
      difference += Math.abs(brightness(data, left) - brightness(data, right));
      count += 1;
    }
  }

  return 1 - Math.min(1, difference / Math.max(1, count));
}

function estimateVisualWeight(data: Uint8ClampedArray): { x: number; y: number } {
  let weightedX = 0;
  let weightedY = 0;
  let total = 0;

  for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
    for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
      const i = (y * SAMPLE_WIDTH + x) * 4;
      const current = brightness(data, i);
      const right = x + 1 < SAMPLE_WIDTH ? brightness(data, i + 4) : current;
      const below = y + 1 < SAMPLE_HEIGHT ? brightness(data, i + SAMPLE_WIDTH * 4) : current;
      const weight = Math.abs(current - right) + Math.abs(current - below) + current * 0.18;

      weightedX += (x / SAMPLE_WIDTH) * weight;
      weightedY += (y / SAMPLE_HEIGHT) * weight;
      total += weight;
    }
  }

  return { x: total ? weightedX / total : 0.5, y: total ? weightedY / total : 0.5 };
}

function estimateVanishingPoint(data: Uint8ClampedArray): { x: number; y: number; confidence: number } {
  let bestX = 0.5;
  let bestY = 0.42;
  let bestScore = 0;

  for (let gy = 34; gy <= 108; gy += 6) {
    for (let gx = 24; gx <= 66; gx += 4) {
      let score = 0;
      for (let radius = 8; radius <= 34; radius += 6) {
        const samples = [[gx - radius, gy - radius], [gx + radius, gy - radius], [gx - radius, gy + radius], [gx + radius, gy + radius]];
        for (const [sx, sy] of samples) {
          if (sx < 1 || sy < 1 || sx >= SAMPLE_WIDTH - 1 || sy >= SAMPLE_HEIGHT - 1) continue;
          const i = (sy * SAMPLE_WIDTH + sx) * 4;
          const current = brightness(data, i);
          const towardX = sx < gx ? sx + 1 : sx - 1;
          const towardY = sy < gy ? sy + 1 : sy - 1;
          const toward = brightness(data, (towardY * SAMPLE_WIDTH + towardX) * 4);
          score += Math.abs(current - toward);
        }
      }

      score *= 0.75 + (1 - Math.abs(gx / SAMPLE_WIDTH - 0.5)) * 0.25;
      if (score > bestScore) {
        bestScore = score;
        bestX = gx / SAMPLE_WIDTH;
        bestY = gy / SAMPLE_HEIGHT;
      }
    }
  }

  return { x: bestX, y: bestY, confidence: Math.min(1, bestScore / 4) };
}

function classifyScene(symmetry: number, weightX: number, weightY: number, vanishingConfidence: number, centerDetail: number): SceneClass {
  if (symmetry > 0.78 && vanishingConfidence > 0.52) return "centered-corridor";
  if (symmetry > 0.72 && centerDetail > 0.08) return "centered-subject";
  if (weightX < 0.43) return "left-weighted";
  if (weightX > 0.57) return "right-weighted";
  if (weightY > 0.6) return "top-open";
  if (weightY < 0.42) return "bottom-open";
  if (symmetry > 0.62) return "balanced";
  return "abstract";
}

export async function analyzeScene(image: HTMLImageElement): Promise<SceneAnalysis> {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_WIDTH;
  canvas.height = SAMPLE_HEIGHT;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Scene analysis canvas is unavailable.");

  context.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const data = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
  const negativeSpace = buildRegions(data);
  const symmetry = symmetryScore(data);
  const weight = estimateVisualWeight(data);
  const vanishingPoint = estimateVanishingPoint(data);
  const center = regionStats(data, SAMPLE_WIDTH, 31, 40, 59, 120);
  const all = regionStats(data, SAMPLE_WIDTH, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);

  return {
    sceneClass: classifyScene(symmetry, weight.x, weight.y, vanishingPoint.confidence, center.detail),
    symmetry,
    centerBrightness: center.brightness,
    centerDetail: center.detail,
    visualWeightX: weight.x,
    visualWeightY: weight.y,
    dominantBrightness: all.brightness,
    negativeSpace,
    likelyVanishingPoint: vanishingPoint,
  };
}
