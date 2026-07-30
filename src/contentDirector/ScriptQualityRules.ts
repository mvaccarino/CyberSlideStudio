export const FORBIDDEN_PHRASES=["affects everyday decisions","business resilience and trust","the first practical defense","spot the warning signs","weak controls","missing verification","behavior that does not match the normal pattern","build a stronger routine","clear ownership","layered safeguards","regular reviews","simple response plan","make protection repeatable","turn knowledge into action","choose one improvement","assign an owner","set a deadline","practical first step","start with awareness","take action today"];
export const TARGET_WORDS={min:78,max:140};
export const REQUIRED_THRESHOLDS={overall:85,hookStrength:80,beginnerClarity:90,topicSpecificity:90,practicalUsefulness:85};
export const countWords=(text:string)=>text.trim().split(/\s+/).filter(Boolean).length;
export const forbiddenMatches=(text:string)=>FORBIDDEN_PHRASES.filter(phrase=>text.toLowerCase().includes(phrase));
export function normalizedTokens(text:string):Set<string>{return new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(word=>word.length>3));}
