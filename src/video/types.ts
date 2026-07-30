export type VideoMotionPreset = "slow-zoom-in" | "slow-zoom-out" | "push" | "pull" | "pan-left" | "pan-right" | "documentary-drift";
export type VideoTransitionPreset = "fade" | "dissolve" | "cinematic-dissolve" | "wipe-left" | "wipe-right" | "slide-left" | "slide-right";
export type VideoScene = { slideNumber:number; imagePath:string; durationSeconds:number; motion:VideoMotionPreset; transition:VideoTransitionPreset; transitionSeconds:number };
export type NativeVideoPlan = { projectName:string; layoutFingerprint?:string; width:1080; height:1920; fps:30; scenes:VideoScene[]; narrationPath?:string; voiceoverPath?:string; finalMixPath?:string; overlayPath?:string; subtitlePath?:string; outputFileName?:string; renderMode?:"preview"|"final" };
export type NativeVideoRenderProgress = { renderId:string; phase:"preparing"|"rendering-scenes"|"assembling"|"adding-audio"|"complete"|"cancelled"|"error"; sceneNumber?:number; completedScenes:number; totalScenes:number; percent:number; message:string };
export type NativeVideoRenderResult = { renderId:string; filePath:string; latestPath?:string; durationSeconds:number;width:number;height:number;fileSizeBytes:number;renderedAt:string };
