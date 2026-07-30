import type { PipelineStage,PipelineStatus,StageState } from "./types";
export const PIPELINE_STAGES:PipelineStage[]=["script","images","voice","music","video","publish"];
export function statusThrough(completed:PipelineStage[],current:PipelineStage):PipelineStatus{const status={} as PipelineStatus;for(const stage of PIPELINE_STAGES)status[stage]=completed.includes(stage)?"completed":stage===current?"current":"waiting";return status;}
export function currentStage(status:PipelineStatus):PipelineStage{return PIPELINE_STAGES.find(s=>status[s]==="current")||PIPELINE_STAGES.find(s=>status[s]!=="completed")||"publish";}
export function advance(_status:PipelineStatus,completedStage:PipelineStage):PipelineStatus{const index=PIPELINE_STAGES.indexOf(completedStage);const completed=PIPELINE_STAGES.slice(0,index+1);return statusThrough(completed,PIPELINE_STAGES[Math.min(index+1,PIPELINE_STAGES.length-1)]);}
export function normalizePipeline(value:Partial<PipelineStatus>|undefined):PipelineStatus{let foundCurrent=false;const result={} as PipelineStatus;for(const stage of PIPELINE_STAGES){const state=value?.[stage];if(state==="completed")result[stage]="completed";else if(!foundCurrent){result[stage]="current";foundCurrent=true;}else result[stage]="waiting";}return result;}
export const stageLabel=(stage:PipelineStage)=>stage[0].toUpperCase()+stage.slice(1);
export type {StageState};

