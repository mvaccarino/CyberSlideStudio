export type QueueItemStatus =
  | "waiting"
  | "generating"
  | "complete"
  | "failed"
  | "cancelled";

export type GenerationQueueItem = {
  slideId: string;
  slideNumber: number;
  title: string;
  status: QueueItemStatus;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  error?: string;
};

export type QueueRunStatus =
  | "idle"
  | "running"
  | "paused"
  | "cancelling"
  | "complete"
  | "cancelled";

export type QueueSummary = {
  total: number;
  completed: number;
  failed: number;
  waiting: number;
  currentSlideNumber?: number;
  averageDurationMs: number;
  estimatedRemainingMs: number;
  estimatedCompletion?: Date;
  completedAt?: Date;
  totalElapsedMs: number;
  progressPercent: number;
};
