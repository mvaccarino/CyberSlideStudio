import type { ScriptFramework } from "./types";
export const SCRIPT_FRAMEWORKS:Record<ScriptFramework,string[]>={
"What Could Happen":["Hook","Scenario","Explanation","Consequence","Protection","CTA"],
"What Is It":["Hook","Definition","How It Works","Why It Matters","Action","CTA"],
"Biggest Mistake":["Mistake","Consequence","Explanation","Fix","Proof","CTA"],
"Warning Signs":["Hook","Warning Signs","Immediate Response","Explanation","Prevention","CTA"],
"Myth vs Reality":["Belief","Reality","Explanation","Why It Matters","Practical Step","CTA"],
"Mini Story":["Incident","What Went Wrong","Explanation","Prevention","Lesson","CTA"],
"Before You Do This":["Common Action","Hidden Risk","Explanation","Safer Alternative","Check","CTA"]};
export const frameworkForIndex=(index:number):ScriptFramework=>(Object.keys(SCRIPT_FRAMEWORKS) as ScriptFramework[])[index%7];
