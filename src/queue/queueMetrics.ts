import type { GenerationQueueItem, QueueSummary } from "./types";

export function calculateQueueSummary(
  items: GenerationQueueItem[],
): QueueSummary {
  const completedItems = items.filter((item) => item.status === "complete");
  const failedItems = items.filter((item) => item.status === "failed");
  const waitingItems = items.filter((item) => item.status === "waiting");
  const activeItem = items.find((item) => item.status === "generating");
  const finishedItems = items.filter(
    (item) => item.status === "complete" || item.status === "failed",
  );

  const durations = finishedItems
    .map((item) => item.durationMs ?? 0)
    .filter((duration) => duration > 0);

  const averageDurationMs = durations.length
    ? Math.round(
        durations.reduce((total, duration) => total + duration, 0) /
          durations.length,
      )
    : 0;

  const remainingJobs = waitingItems.length + (activeItem ? 1 : 0);
  const estimatedRemainingMs = averageDurationMs * remainingJobs;
  const finished = completedItems.length + failedItems.length;
  const isComplete = items.length > 0 && finished === items.length;

  const startedTimes = items
    .map((item) => item.startedAt)
    .filter((value): value is number => typeof value === "number");
  const completedTimes = finishedItems
    .map((item) => item.completedAt)
    .filter((value): value is number => typeof value === "number");

  const earliestStart = startedTimes.length ? Math.min(...startedTimes) : 0;
  const latestCompletion = completedTimes.length
    ? Math.max(...completedTimes)
    : 0;

  return {
    total: items.length,
    completed: completedItems.length,
    failed: failedItems.length,
    waiting: waitingItems.length,
    currentSlideNumber: activeItem?.slideNumber,
    averageDurationMs,
    estimatedRemainingMs: isComplete ? 0 : estimatedRemainingMs,
    estimatedCompletion: isComplete
      ? undefined
      : estimatedRemainingMs > 0
        ? new Date(Date.now() + estimatedRemainingMs)
        : undefined,
    completedAt: isComplete && latestCompletion
      ? new Date(latestCompletion)
      : undefined,
    totalElapsedMs:
      earliestStart && latestCompletion
        ? Math.max(0, latestCompletion - earliestStart)
        : 0,
    progressPercent: items.length
      ? Math.round((finished / items.length) * 100)
      : 0,
  };
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds === 0) return "0s";
  if (!milliseconds || milliseconds < 1000) return "Calculating…";

  const totalSeconds = Math.max(1, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}
