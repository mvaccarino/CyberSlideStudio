import type {
  ProductionPackageInput,
  ProductionPackagePayload,
  ProductionSlide,
} from "./types";

const wordsPerSecond = 2.45;

function slug(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*]/g, "")   .replace(/[\r\n\t]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "CyberSlide-Project";
}

function narrationForSlide(slide: ProductionSlide): string {
  const title = slide.headline.trim();
  const body = slide.body.trim();
  const cta = slide.cta.trim();

  if (!title) return [body, cta].filter(Boolean).join(" ");
  if (!body) return [title, cta].filter(Boolean).join(". ");

  return `${title}. ${body}${cta ? ` ${cta}` : ""}`;
}

function secondsFor(text: string): number {
  const count = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2.8, Math.min(8, count / wordsPerSecond + 0.55));
}

function formatTime(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  const minutes = Math.floor(ms / 60000);
  const remainder = ms % 60000;
  const secs = Math.floor(remainder / 1000);
  const millis = remainder % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function buildTimeline(slides: ProductionSlide[]) {
  let cursor = 0;
  return slides.map((slide, index) => {
    const narration = narrationForSlide(slide);
    const duration = secondsFor(narration);
    const start = cursor;
    const end = start + duration;
    cursor = end;

    return {
      slide,
      index,
      narration,
      duration,
      start,
      end,
      animation: index % 3 === 0 ? "Slow zoom in to 105%" : index % 3 === 1 ? "Gentle pan right" : "Slow zoom out to 98%",
      transition: index === slides.length - 1 ? "Fade out, 0.8 sec" : index % 2 === 0 ? "Camera blur, 0.25 sec" : "Cross dissolve, 0.25 sec",
      captionAnimation: index % 2 === 0 ? "Fade Up" : "Pop Up",
    };
  });
}

function youtubePackage(input: ProductionPackageInput, totalDuration: number): string {
  const first = input.slides[0];
  const title = first?.headline || input.projectName;
  const keywords = input.slides.flatMap((s) => `${s.headline} ${s.body}`.split(/\s+/))
    .map((w) => w.replace(/[^\w-]/g, "").toLowerCase())
    .filter((w) => w.length > 4);
  const tags = [...new Set(keywords)].slice(0, 18);

  return `YOUTUBE SHORTS CONTENT PACKAGE

TITLE
${title} — What You Need to Know

DESCRIPTION
${input.slides.map((s) => s.body).filter(Boolean).join(" ")}

This short explains the key takeaways in under ${Math.ceil(totalDuration)} seconds.

CALL TO ACTION
Subscribe for practical cybersecurity tips.

HASHTAGS
#Cybersecurity #OnlineSafety #SecurityTips #YouTubeShorts

TAGS
${tags.join(", ")}

PINNED COMMENT
Which security habit do you want covered next?

THUMBNAIL TEXT
${title.toUpperCase()}

CATEGORY
Science & Technology
`;
}

function instagramPackage(input: ProductionPackageInput): string {
  const title = input.slides[0]?.headline || input.projectName;
  return `INSTAGRAM REELS CONTENT PACKAGE

COVER TITLE
${title.toUpperCase()}

CAPTION
${title}

${input.slides.map((s) => s.body).filter(Boolean).join(" ")}

Save this post and share it with someone who needs the reminder.

CTA
Follow for practical cybersecurity tips.

HASHTAGS
#Cybersecurity #CyberAwareness #OnlineSafety #TechTips #Reels

FIRST COMMENT
What cybersecurity topic should be next?
`;
}

function tiktokPackage(input: ProductionPackageInput): string {
  const title = input.slides[0]?.headline || input.projectName;
  return `TIKTOK CONTENT PACKAGE

HOOK
${title}

CAPTION
A fast cybersecurity lesson that could save your accounts.

SEARCH KEYWORDS
cybersecurity tips, online safety, password security, data protection

HASHTAGS
#Cybersecurity #SecurityTok #TechTok #OnlineSafety

ON-SCREEN CTA
Follow for more cybersecurity tips.

COMMENT PROMPT
What is the biggest security mistake people make?
`;
}

function htmlDocument(title: string, body: string): string {
  const escaped = body
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;color:#102235;margin:42px;line-height:1.5}
  h1{font-size:28px;color:#071827;border-bottom:3px solid #00aeea;padding-bottom:12px}
  pre{white-space:pre-wrap;font-family:Arial,sans-serif;font-size:12px}
  </style></head><body><h1>${title}</h1><pre>${escaped}</pre></body></html>`;
}

export function buildProductionPackage(
  input: ProductionPackageInput,
): ProductionPackagePayload {
  const timeline = buildTimeline(input.slides);
  const totalDuration = timeline.at(-1)?.end ?? 0;

  const fullVoiceover = timeline
    .map((item) => item.narration)
    .join("\n\n");

  const slideVoiceover = timeline
    .map(
      (item) => `SLIDE ${item.slide.number} — ${item.duration.toFixed(1)} sec
${item.narration}

DELIVERY
Confident, clear, conversational.

PAUSE
0.25 seconds after the headline.`,
    )
    .join("\n\n");

  const elevenLabs = timeline
    .map(
      (item) => `[Slide ${item.slide.number}]
${item.narration}
<break time="0.35s" />`,
    )
    .join("\n\n");

  const capCut = `CAPCUT EDITING BLUEPRINT

PROJECT SETTINGS
Resolution: 1080 × 1920
Frame rate: 30 FPS
Canvas: 9:16 vertical
Target length: ${totalDuration.toFixed(1)} seconds
Caption safe area: bottom 20%

AUDIO MIX
Voiceover: -6 to -3 dB
Music: -25 to -21 dB
Sound effects: -16 to -10 dB
Music fade in: 0.5 sec
Music fade out: 1.2 sec

${timeline
  .map(
    (item) => `SLIDE ${item.slide.number}
Timeline: ${formatTime(item.start)}–${formatTime(item.end)}
Duration: ${item.duration.toFixed(1)} sec
Animation: ${item.animation}
Transition: ${item.transition}
Voiceover starts: ${formatTime(item.start + 0.15)}
Caption: Bottom safe area; bold sans serif; ${item.captionAnimation}
Headline: ${item.slide.headline || "No headline"}
`,
  )
  .join("\n")}

EXPORT SETTINGS
Format: MP4
Codec: H.264
Resolution: 1080 × 1920
Frame rate: 30 FPS
Bitrate: 12–20 Mbps
Audio: AAC, 48 kHz, 320 kbps
`;

  const music = `MUSIC RECOMMENDATIONS

PRIMARY DIRECTION
Genre: Cinematic technology
Mood: Serious, modern, confident
Tempo: 90–105 BPM
Instrumentation: Pulsing synth, restrained percussion, subtle bass
Avoid: Vocals, playful melodies, aggressive dubstep

SEARCH TERMS
cinematic cyber technology
dark corporate technology
futuristic security documentary
minimal technology pulse
enterprise cybersecurity music

SOUND EFFECTS
Slide 1: Low cyber impact at ${formatTime(timeline[0]?.start ?? 0)}
Transitions: Soft digital whoosh, -14 dB
Key statistic or warning: Subtle UI hit
Final slide: Soft riser into clean impact
`;

  const checklist = `PRODUCTION CHECKLIST

[ ] Review every generated slide
[ ] Confirm all text is spelled correctly
[ ] Import slides into CapCut
[ ] Add voiceover
[ ] Add captions in the bottom safe area
[ ] Add music and sound effects
[ ] Verify audio levels
[ ] Export 1080 × 1920 MP4
[ ] Review final video on a phone
[ ] Add platform-specific title, caption, and hashtags
[ ] Schedule YouTube Shorts
[ ] Schedule Instagram Reels
[ ] Schedule TikTok
`;

  const metadata = {
    version: "11.3",
    projectName: input.projectName,
    theme: input.theme,
    layout: input.layout,
    slideCount: input.slides.length,
    estimatedDurationSeconds: Number(totalDuration.toFixed(2)),
    generatedAt: new Date().toISOString(),
    timeline: timeline.map((item) => ({
      slideNumber: item.slide.number,
      startSeconds: Number(item.start.toFixed(3)),
      endSeconds: Number(item.end.toFixed(3)),
      durationSeconds: Number(item.duration.toFixed(3)),
      narration: item.narration,
      animation: item.animation,
      transition: item.transition,
    })),
  };

  const summary = `CYBERSLIDE STUDIO PRODUCTION SUMMARY

Project: ${input.projectName}
Slides: ${input.slides.length}
Estimated video duration: ${totalDuration.toFixed(1)} seconds
Theme: ${input.theme}
Layout: ${input.layout}

PACKAGE CONTENTS
• Final or draft slide images
• CapCut editing blueprint
• Timeline JSON
• Full voiceover
• Slide-by-slide voiceover
• ElevenLabs-ready script
• Music and sound-effect recommendations
• YouTube Shorts content package
• Instagram Reels content package
• TikTok content package
• Production checklist
`;

  const files = [
    { relativePath: "Voiceover/Full-Voiceover-Script.txt", contents: fullVoiceover },
    { relativePath: "Voiceover/Slide-by-Slide-Voiceover.txt", contents: slideVoiceover },
    { relativePath: "Voiceover/ElevenLabs-Script.txt", contents: elevenLabs },
    { relativePath: "Voiceover/Timing.json", contents: JSON.stringify(metadata.timeline, null, 2) },
    { relativePath: "CapCut/CapCut-Editing-Blueprint.txt", contents: capCut },
    { relativePath: "CapCut/Timeline-Settings.json", contents: JSON.stringify(metadata, null, 2) },
    { relativePath: "CapCut/Caption-Plan.txt", contents: timeline.map((i) => `${formatTime(i.start)} ${i.slide.headline || i.narration}`).join("\n") },
    { relativePath: "Music/Music-Recommendations.txt", contents: music },
    { relativePath: "Social-Content/YouTube-Shorts.txt", contents: youtubePackage(input, totalDuration) },
    { relativePath: "Social-Content/Instagram-Reels.txt", contents: instagramPackage(input) },
    { relativePath: "Social-Content/TikTok.txt", contents: tiktokPackage(input) },
    { relativePath: "Metadata/Project-Summary.json", contents: JSON.stringify(metadata, null, 2) },
    { relativePath: "Production-Checklist.txt", contents: checklist },
  ];

  const images = input.slides
    .filter((slide) => slide.imageDataUrl)
    .map((slide) => ({
      relativePath: `Slides/${String(slide.number).padStart(2, "0")}.png`,
      dataUrl: slide.imageDataUrl as string,
    }));

  return {
    projectName: slug(input.projectName),
    files,
    images,
    pdfs: [
      {
        relativePath: "CapCut/CapCut-Editing-Blueprint.pdf",
        html: htmlDocument("CapCut Editing Blueprint", capCut),
      },
      {
        relativePath: "Production-Summary.pdf",
        html: htmlDocument("CyberSlide Studio Production Summary", summary),
      },
    ],
  };
}
