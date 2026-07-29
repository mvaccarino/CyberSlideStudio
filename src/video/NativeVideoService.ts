import type {
  NativeVideoPlan,
  NativeVideoRenderProgress,
  NativeVideoRenderResult,
} from "./types";

export async function renderNativeVideo(
  plan: NativeVideoPlan,
): Promise<NativeVideoRenderResult> {
  return window.cyberSlideStudio.renderNativeVideo(plan);
}

export async function cancelNativeVideo(renderId: string): Promise<boolean> {
  return window.cyberSlideStudio.cancelNativeVideo(renderId);
}

export function onNativeVideoProgress(
  callback: (progress: NativeVideoRenderProgress) => void,
): () => void {
  return window.cyberSlideStudio.onNativeVideoProgress(callback);
}

export async function checkNativeVideoRenderer(): Promise<{
  available: boolean;
  ffmpegPath?: string;
  version?: string;
  error?: string;
}> {
  return window.cyberSlideStudio.checkNativeVideoRenderer();
}
