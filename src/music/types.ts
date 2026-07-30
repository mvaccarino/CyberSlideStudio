import type { MusicConfiguration, MusicMode } from "../models/Project";
export type MusicTrack = { sourcePath: string; projectPath?: string; displayTitle: string; category: string; durationSeconds: number; selectionReason?: string };
export type MusicLibraryResult = { root: string; categories: string[]; tracks: MusicTrack[] };
export type { MusicConfiguration, MusicMode };
