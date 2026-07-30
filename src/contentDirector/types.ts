import type { ProductionTemplate, TemplateSlide } from "../library/types";
export type AudienceProfile="Consumers"|"Small Business Owners"|"Parents"|"Employees"|"Executives"|"IT Professionals"|"Beginners";
export type ContentTone="Curiosity"|"Warning"|"Story"|"Myth vs Reality"|"Explainer"|"Mistake"|"News-style"|"Practical How-To";
export type ScriptFramework="What Could Happen"|"What Is It"|"Biggest Mistake"|"Warning Signs"|"Myth vs Reality"|"Mini Story"|"Before You Do This";
export type TopicBrief={topic:string;category:string;audience:AudienceProfile;tone:ContentTone;framework:ScriptFramework;definition:string;scenario:string;consequence:string;actions:string[];posterScene:string};
export type QualityDimensions={hookStrength:number;beginnerClarity:number;topicSpecificity:number;practicalUsefulness:number;naturalVoiceover:number;retentionPotential:number;emotionalRelevance:number;shareability:number;slideReadability:number;topicAccuracy:number};
export type QualityResult={score:number;dimensions:QualityDimensions;errors:string[]};
export type DirectedScript={hook:string;voiceScript:string;slides:TemplateSlide[]};
export type RewriteResult={template:ProductionTemplate;quality:QualityResult;attempts:number};
