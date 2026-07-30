import type { DirectedScript, TopicBrief } from "./types";
import { SCRIPT_FRAMEWORKS } from "./ScriptFrameworks";
import { DEFAULT_BRAND_CTA } from "../brand/BrandCTAEngine";
export class ViralContentDirector {
  direct(brief: TopicBrief, brandCTA = DEFAULT_BRAND_CTA): DirectedScript {
    const labels = SCRIPT_FRAMEWORKS[brief.framework];
    const hook = `${brief.scenario} Here's what ${brief.topic.toLowerCase()} actually means.`;
    const slides = [
      { title: `${brief.topic} Warning`, body: brief.consequence, cta: "" },
      {
        title: `${brief.topic}: Plain English`,
        body: brief.definition,
        cta: "",
      },
      { title: labels[2], body: brief.scenario, cta: "" },
      { title: labels[3], body: brief.consequence, cta: "" },
      { title: labels[4], body: brief.actions.slice(0, 2).join(" "), cta: "" },
      {
        title: `Your ${brief.topic} Check`,
        body: brief.actions.at(-1) ?? "",
        cta: brandCTA,
      },
    ];
    const voiceScript = [
      hook,
      brief.definition,
      brief.scenario,
      brief.consequence,
      ...brief.actions,
      slides.at(-1)?.cta,
    ].join(" ");
    return { hook, slides, voiceScript };
  }
}
