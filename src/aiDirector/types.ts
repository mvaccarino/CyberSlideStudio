export type ProductionStyleName = "Cybersecurity Professional" | "Netflix Documentary" | "Corporate" | "Educational" | "Fast Social" | "Viral Short" | "News Report";
export type ProductionStyle = { name:ProductionStyleName; posterPromptStyle:string; cameraStyle:string; captionStyle:string; musicStyle:string; transitionStyle:string; voiceStyle:string; effectsStyle:string };
export type PipelineStage = "script"|"images"|"voice"|"music"|"video"|"publish";
export type StageState = "completed"|"current"|"waiting";
export type PipelineStatus = Record<PipelineStage,StageState>;
export type ApprovedAsset = { slideId:string; slideNumber:number; path:string; approvedAt:string; motion?:string; transition?:string; analysis?:{primarySubject:string;subjectPosition:"left"|"center"|"right";visualWeight:"light"|"balanced"|"heavy";cameraFocus:string;focalObjectPosition?:"left"|"center"|"right"|"high"|"low";negativeSpaceRegion?:"left"|"right"|"top-left"|"top-right"|"none";subjectExtendsIntoCaptionZone?:boolean;focalObjectBounds?:{x:number;y:number;width:number;height:number};faceBounds?:Array<{x:number;y:number;width:number;height:number}>} };
