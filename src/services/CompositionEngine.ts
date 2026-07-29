import {
  renderHeadlineDiagonal,
  renderHeadlineEditorial,
  renderHeadlineHero,
} from "./creative/headlineRenderers";
import {
  renderBodyAlert,
  renderBodyGlass,
  renderBodyHud,
} from "./creative/bodyRenderers";
import {
  renderCornerBrackets,
  renderFooterCta,
  renderSpeedLines,
  renderTechDots,
} from "./creative/decorations";
import type {
  BodyRenderer,
  CtaRenderer,
  DecorationRenderer,
  HeadlineRenderer,
} from "./creative/types";
import { randomItem } from "./creative/utils";

export type CreativeComposition = {
  id: "blockbuster" | "editorial" | "diagonal";
  headline: HeadlineRenderer;
  body: BodyRenderer;
  decorations: DecorationRenderer[];
  cta: CtaRenderer;
  headlineStartY: number;
  bodyGap: number;
};

const COMPOSITIONS: readonly CreativeComposition[] = [
  {
    id: "blockbuster",
    headline: renderHeadlineHero,
    body: renderBodyHud,
    decorations: [renderSpeedLines, renderCornerBrackets],
    cta: renderFooterCta,
    headlineStartY: 104,
    bodyGap: 56,
  },
  {
    id: "editorial",
    headline: renderHeadlineEditorial,
    body: renderBodyGlass,
    decorations: [renderCornerBrackets, renderTechDots],
    cta: renderFooterCta,
    headlineStartY: 122,
    bodyGap: 64,
  },
  {
    id: "diagonal",
    headline: renderHeadlineDiagonal,
    body: renderBodyAlert,
    decorations: [renderSpeedLines, renderTechDots],
    cta: renderFooterCta,
    headlineStartY: 106,
    bodyGap: 52,
  },
];

export function chooseCreativeComposition(): CreativeComposition {
  return randomItem(COMPOSITIONS);
}
