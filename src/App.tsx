import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  createCreativeRecommendation,
  type CreativeRecommendation,
} from "./creative/CreativeRecommendation";
import {
  analyzeSlideMessage,
  type MessageAnalysis,
} from "./creative/MessageAnalyzer";
import { parseCyberSlideScript } from "./parser/parseScript";
import {
  deserializeProject,
  projectNameFromPath,
  serializeProject,
} from "./services/ProjectFileService";
import { scriptToProjectSlides } from "./services/ScriptService";
import { buildPosterPrompt } from "./services/PosterPromptBuilder";
import { generatePoster, normalizePosterToFinalSize } from "./services/PosterGenerationService";
import { useProjectStore } from "./state/useProjectStore";
import type { ProjectMenuAction } from "./types/electron";
import { AISettings } from "./settings/AISettings";
import { CyberSlideVoicePanel } from "./voice/CyberSlideVoicePanel";
import { CreativeDirectorPanel } from "./components/CreativeDirector/CreativeDirectorPanel";
import { buildProductionPackage } from "./production/ProductionPackageBuilder";
import { calculateQueueSummary } from "./queue/queueMetrics";
import type { GenerationQueueItem, QueueRunStatus } from "./queue/types";
import {
  focalWordsFromHeadline,
  generateHeadlineOptions,
  type HeadlineOption,
} from "./headlines/HeadlineGenerator";

type NavItem =
  | "Scripts"
  | "Slides"
  | "Themes"
  | "AI"
  | "Export"
  | "Voice"
  | "Settings";

const starterScript = `Create the next cybersecurity slideshow using our standard template.

Slide 1

Title:
Why Password Managers Matter

Body:
No—you don't have to remember 200 different passwords.

Slide 2

Title:

Body:
Many people reuse passwords because it's easier. Unfortunately, if one website suffers a data breach, attackers often try that same password on other accounts.

Slide 3

Title:
Use a Password Manager

Body:
A password manager generates long, unique passwords and stores them securely, so you only need to remember one strong master password.`;

function App() {
  const {
    project,
    selectedSlide,
    selectedSlideId,
    isDirty,
    selectSlide,
    setProject,
    setScriptAndSlides,
    createNewProject,
    markSaved,
  } = useProjectStore();

  const [activeNav, setActiveNav] = useState<NavItem>("Scripts");
  const [theme, setTheme] = useState("Enterprise Cyber");
  const [layout, setLayout] = useState("Cinematic Hero");
  const [highlightColor, setHighlightColor] = useState("#00B7FF");
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [fileMessage, setFileMessage] = useState("Ready");
  const [analysisBySlide, setAnalysisBySlide] = useState<
    Record<string, MessageAnalysis>
  >({});
  const [recommendationBySlide, setRecommendationBySlide] = useState<
    Record<string, CreativeRecommendation>
  >({});
  const [headlineOptionsBySlide, setHeadlineOptionsBySlide] = useState<
    Record<string, HeadlineOption[]>
  >({});

  const [backgroundBySlide, setBackgroundBySlide] = useState<
    Record<string, { dataUrl: string; filePath: string }>
  >({});

  const [generationStatus, setGenerationStatus] = useState<
    "idle" | "generating" | "complete" | "error"
  >("idle");

  const [generationMessage, setGenerationMessage] = useState("");

  const [queueItems, setQueueItems] = useState<GenerationQueueItem[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueRunStatus>("idle");
  const pauseQueueRef = useRef(false);
  const cancelQueueRef = useRef(false);

  const [exportStatus, setExportStatus] = useState<
    "idle" | "rendering" | "complete" | "error"
  >("idle");

  const [exportMessage, setExportMessage] = useState("");
  const [productionStatus, setProductionStatus] = useState<
    "idle" | "exporting" | "complete" | "error"
  >("idle");
  const [productionMessage, setProductionMessage] = useState("");

  const currentScript = project.script || starterScript;
  const parserResult = useMemo(
    () => parseCyberSlideScript(currentScript),
    [currentScript],
  );

  const effectiveSlides = project.script
    ? project.slides
    : scriptToProjectSlides(starterScript, project.slides).slides;

  const effectiveProjectName = useMemo(() => {
    const currentName = project.name.trim();
    if (currentName && currentName !== "Untitled Project") return currentName;

    const firstTitle = effectiveSlides
      .map((slide) => slide.title.trim())
      .find(Boolean);

    return firstTitle || "CyberSlide Project";
  }, [effectiveSlides, project.name]);

  const activeSlide =
    effectiveSlides.find((slide) => slide.id === selectedSlideId) ??
    effectiveSlides[0] ??
    selectedSlide;

  const activeAnalysis = activeSlide
    ? analysisBySlide[activeSlide.id]
    : undefined;

  const activeRecommendation = activeSlide
    ? recommendationBySlide[activeSlide.id]
    : undefined;

  const activeHeadlineOptions = activeSlide
    ? headlineOptionsBySlide[activeSlide.id] ?? []
    : [];

  const wordCount = currentScript.trim()
    ? currentScript.trim().split(/\s+/).length
    : 0;

  const issueCount =
    parserResult.globalIssues.length +
    effectiveSlides.reduce(
      (total, slide) => total + slide.validation.length,
      0,
    );

  const queueSummary = useMemo(
    () => calculateQueueSummary(queueItems),
    [queueItems],
  );

  const projectForPersistence = useMemo(
    () => ({
      ...project,
      name: effectiveProjectName,
      script: currentScript,
      slides: effectiveSlides,
    }),
    [project, effectiveProjectName, currentScript, effectiveSlides],
  );

  const handleNewProject = useCallback(async () => {
    createNewProject();
    await window.cyberSlideStudio.clearCurrentProjectPath();
    setCurrentFilePath(null);
    setAnalysisBySlide({});
    setRecommendationBySlide({});
    setHeadlineOptionsBySlide({});
    setBackgroundBySlide({});
    setGenerationStatus("idle");
    setGenerationMessage("");
    setQueueItems([]);
    setQueueStatus("idle");
    pauseQueueRef.current = false;
    cancelQueueRef.current = false;
    setExportStatus("idle");
    setExportMessage("");
    setFileMessage("New project created");
  }, [createNewProject]);

  const handleOpenProject = useCallback(async () => {
    try {
      const result = await window.cyberSlideStudio.openProject();
      if (!result) return;

      const openedProject = deserializeProject(result.contents);
      setProject({
        ...openedProject,
        name:
          openedProject.name === "Untitled Project"
            ? projectNameFromPath(result.filePath)
            : openedProject.name,
      });
      setCurrentFilePath(result.filePath);
      setAnalysisBySlide({});
      setRecommendationBySlide({});
      setHeadlineOptionsBySlide({});
      setBackgroundBySlide({});
      setGenerationStatus("idle");
      setGenerationMessage("");
      setQueueItems([]);
      setQueueStatus("idle");
      pauseQueueRef.current = false;
      cancelQueueRef.current = false;
      setExportStatus("idle");
      setExportMessage("");
      setFileMessage(`Opened ${projectNameFromPath(result.filePath)}`);
    } catch (error) {
      setFileMessage(
        error instanceof Error ? error.message : "Unable to open project",
      );
    }
  }, [setProject]);

  const handleSaveProject = useCallback(
    async (forceSaveAs = false) => {
      try {
        const contents = serializeProject(projectForPersistence);
        const result = forceSaveAs
          ? await window.cyberSlideStudio.saveProjectAs(
              contents,
              projectForPersistence.name,
            )
          : await window.cyberSlideStudio.saveProject(
              contents,
              projectForPersistence.name,
            );

        if (!result) return;

        setCurrentFilePath(result.filePath);
        markSaved();
        setFileMessage(`Saved ${projectNameFromPath(result.filePath)}`);
      } catch (error) {
        setFileMessage(
          error instanceof Error ? error.message : "Unable to save project",
        );
      }
    },
    [markSaved, projectForPersistence],
  );

  useEffect(() => {
    return window.cyberSlideStudio.onProjectMenuAction(
      (action: ProjectMenuAction) => {
        if (action === "new") void handleNewProject();
        if (action === "open") void handleOpenProject();
        if (action === "save") void handleSaveProject(false);
        if (action === "saveAs") void handleSaveProject(true);
      },
    );
  }, [handleNewProject, handleOpenProject, handleSaveProject]);

  const handleScriptChange = (script: string) => {
    const result = scriptToProjectSlides(script, effectiveSlides);
    setScriptAndSlides(script, result.slides);
  };

  const createRecommendationForSlide = useCallback((slide: (typeof effectiveSlides)[number]) => {
    const hasScriptTitle = Boolean(slide.title?.trim());
    const headlineOptions = hasScriptTitle
      ? []
      : generateHeadlineOptions(slide.body);
    const selectedHeadline = hasScriptTitle
      ? slide.title.trim()
      : headlineOptions[0]?.text ?? "SECURITY STARTS HERE";

    const analysis = analyzeSlideMessage({
      title: selectedHeadline,
      body: slide.body,
      cta: slide.cta,
    });
    const baseRecommendation = createCreativeRecommendation(analysis);
    const recommendation: CreativeRecommendation = {
      ...baseRecommendation,
      headline: selectedHeadline.toUpperCase(),
      focalWords:
        baseRecommendation.focalWords.length > 0
          ? baseRecommendation.focalWords
          : focalWordsFromHeadline(selectedHeadline),
    };

    setAnalysisBySlide((current) => ({
      ...current,
      [slide.id]: analysis,
    }));
    setRecommendationBySlide((current) => ({
      ...current,
      [slide.id]: recommendation,
    }));
    setHeadlineOptionsBySlide((current) => ({
      ...current,
      [slide.id]: headlineOptions,
    }));

    return { analysis, recommendation };
  }, []);

  const selectHeadlineOption = useCallback((headline: string) => {
    if (!activeSlide) return;

    const existing = recommendationBySlide[activeSlide.id] ??
      createRecommendationForSlide(activeSlide).recommendation;
    const nextRecommendation: CreativeRecommendation = {
      ...existing,
      headline: headline.toUpperCase(),
      focalWords: focalWordsFromHeadline(headline),
    };

    setRecommendationBySlide((current) => ({
      ...current,
      [activeSlide.id]: nextRecommendation,
    }));
    setGenerationMessage("Headline selected. Generate the slide to use it.");
  }, [activeSlide, createRecommendationForSlide, recommendationBySlide]);

  const regenerateHeadlineOptions = useCallback(() => {
    if (!activeSlide || activeSlide.title?.trim()) return;
    const options = generateHeadlineOptions(activeSlide.body);
    const rotated = options.length > 1 ? [...options.slice(1), options[0]] : options;
    setHeadlineOptionsBySlide((current) => ({
      ...current,
      [activeSlide.id]: rotated,
    }));
    if (rotated[0]) selectHeadlineOption(rotated[0].text);
  }, [activeSlide, selectHeadlineOption]);

  const runCreativeDirector = () => {
    if (!activeSlide) return;

    const { recommendation } = createRecommendationForSlide(activeSlide);
    setLayout(
      recommendation.layout
        .split("-")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" "),
    );
  };

  const previewTitle =
    activeRecommendation?.headline ??
    activeAnalysis?.primaryMessage ??
    activeSlide?.title.trim().toUpperCase() ??
    "";

  const previewBody =
    activeRecommendation?.supportingText ??
    activeAnalysis?.supportingMessage ??
    activeSlide?.body ??
    "";

  const previewFocalWords =
    activeRecommendation?.focalWords ??
    activeAnalysis?.focalWords ??
    [];

  const generateSlidePoster = useCallback(
    async (
      slide: (typeof effectiveSlides)[number],
      quality: "low" | "medium" | "high" = "low",
    ) => {
      const existingRecommendation = recommendationBySlide[slide.id];
      const recommendation =
        existingRecommendation ?? createRecommendationForSlide(slide).recommendation;
      const slideLayout = recommendation.layout
        .split("-")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ");

      const posterPrompt = buildPosterPrompt({
        headline: recommendation.headline,
        supportingText: recommendation.supportingText,
        cta: slide.cta,
        theme,
        layout: slideLayout,
        focalWords: recommendation.focalWords,
        highlightColor,
      });

      const result = await generatePoster({
        prompt: posterPrompt,
        slideNumber: slide.number,
        projectName: effectiveProjectName,
        quality,
      });

      setBackgroundBySlide((current) => ({
        ...current,
        [slide.id]: {
          dataUrl: result.dataUrl,
          filePath: result.filePath,
        },
      }));

      return result;
    },
    [
      createRecommendationForSlide,
      effectiveProjectName,
      highlightColor,
      recommendationBySlide,
      theme,
    ],
  );

  const generateActiveBackground = async () => {
    if (!activeSlide || queueStatus === "running" || queueStatus === "paused") return;

    try {
      setGenerationStatus("generating");
      setGenerationMessage("Generating draft poster for the current slide…");
      await generateSlidePoster(activeSlide, "low");
      setGenerationStatus("complete");
      setGenerationMessage("Draft poster complete. Final export will use High quality.");
    } catch (error) {
      setGenerationStatus("error");
      setGenerationMessage(
        error instanceof Error ? error.message : "Image generation failed.",
      );
    }
  };

  const waitWhilePaused = useCallback(async () => {
    while (pauseQueueRef.current && !cancelQueueRef.current) {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
  }, []);

  const runQueue = useCallback(
    async (slideIds: string[]) => {
      const slidesToGenerate = effectiveSlides.filter((slide) =>
        slideIds.includes(slide.id),
      );

      if (!slidesToGenerate.length) return;

      cancelQueueRef.current = false;
      pauseQueueRef.current = false;
      setQueueStatus("running");
      setGenerationStatus("generating");
      setGenerationMessage(`Preparing ${slidesToGenerate.length} draft poster${slidesToGenerate.length === 1 ? "" : "s"}…`);
      setQueueItems(
        slidesToGenerate.map((slide) => ({
          slideId: slide.id,
          slideNumber: slide.number,
          title: recommendationBySlide[slide.id]?.headline || slide.title || `Slide ${slide.number}`,
          status: "waiting",
        })),
      );

      for (const slide of slidesToGenerate) {
        await waitWhilePaused();

        if (cancelQueueRef.current) {
          setQueueItems((current) =>
            current.map((item) =>
              item.status === "waiting"
                ? { ...item, status: "cancelled" }
                : item,
            ),
          );
          setQueueStatus("cancelled");
          setGenerationStatus("idle");
          setGenerationMessage("Queue cancelled after the active request finished.");
          return;
        }

        const startedAt = Date.now();
        setQueueItems((current) =>
          current.map((item) =>
            item.slideId === slide.id
              ? { ...item, status: "generating", startedAt, error: undefined }
              : item,
          ),
        );
        setGenerationMessage(`Generating draft poster for slide ${slide.number} of ${slidesToGenerate.length}…`);

        try {
          await generateSlidePoster(slide, "low");
          const completedAt = Date.now();
          setQueueItems((current) =>
            current.map((item) =>
              item.slideId === slide.id
                ? {
                    ...item,
                    status: "complete",
                    completedAt,
                    durationMs: completedAt - startedAt,
                  }
                : item,
            ),
          );
        } catch (error) {
          const completedAt = Date.now();
          setQueueItems((current) =>
            current.map((item) =>
              item.slideId === slide.id
                ? {
                    ...item,
                    status: "failed",
                    completedAt,
                    durationMs: completedAt - startedAt,
                    error:
                      error instanceof Error
                        ? error.message
                        : "Poster generation failed.",
                  }
                : item,
            ),
          );
        }
      }

      setQueueStatus("complete");
      setGenerationStatus("complete");
      setGenerationMessage("Draft queue complete. Review each slide before final export.");
    },
    [
      effectiveSlides,
      generateSlidePoster,
      recommendationBySlide,
      waitWhilePaused,
    ],
  );

  const generateAllSlides = async () => {
    if (queueStatus === "running" || queueStatus === "paused") return;
    await runQueue(effectiveSlides.map((slide) => slide.id));
  };

  const retryFailedSlides = async () => {
    const failedIds = queueItems
      .filter((item) => item.status === "failed")
      .map((item) => item.slideId);
    await runQueue(failedIds);
  };

  const pauseQueue = () => {
    if (queueStatus !== "running") return;
    pauseQueueRef.current = true;
    setQueueStatus("paused");
    setGenerationMessage("Queue paused. The active API request will finish first.");
  };

  const resumeQueue = () => {
    if (queueStatus !== "paused") return;
    pauseQueueRef.current = false;
    setQueueStatus("running");
    setGenerationMessage("Queue resumed…");
  };

  const cancelQueue = () => {
    if (queueStatus !== "running" && queueStatus !== "paused") return;
    cancelQueueRef.current = true;
    pauseQueueRef.current = false;
    setQueueStatus("cancelling");
    setGenerationMessage("Cancelling after the active API request finishes…");
  };

  const exportActiveFinalSlide = async () => {
    if (!effectiveSlides.length) {
      setExportStatus("error");
      setExportMessage("No slides are available to finalize.");
      return;
    }

    cancelQueueRef.current = false;
    pauseQueueRef.current = false;

    setExportStatus("rendering");
    setExportMessage(
      `Preparing ${effectiveSlides.length} High-quality final poster${
        effectiveSlides.length === 1 ? "" : "s"
      }…`,
    );
    setQueueStatus("running");
    setQueueItems(
      effectiveSlides.map((slide) => ({
        slideId: slide.id,
        slideNumber: slide.number,
        title:
          recommendationBySlide[slide.id]?.headline ||
          slide.title ||
          `Slide ${slide.number}`,
        status: "waiting",
      })),
    );

    let completedCount = 0;
    const failures: string[] = [];

    for (const slide of effectiveSlides) {
      await waitWhilePaused();

      if (cancelQueueRef.current) {
        setQueueItems((current) =>
          current.map((item) =>
            item.status === "waiting"
              ? { ...item, status: "cancelled" }
              : item,
          ),
        );
        setQueueStatus("cancelled");
        setExportStatus("idle");
        setExportMessage(
          "Final export cancelled after the active request finished.",
        );
        return;
      }

      const startedAt = Date.now();

      setQueueItems((current) =>
        current.map((item) =>
          item.slideId === slide.id
            ? {
                ...item,
                status: "generating",
                startedAt,
                completedAt: undefined,
                durationMs: undefined,
                error: undefined,
              }
            : item,
        ),
      );

      setExportMessage(
        `Generating High-quality final poster ${slide.number} of ${effectiveSlides.length}…`,
      );

      try {
        const finalPoster = await generateSlidePoster(slide, "high");
        const dataUrl = await normalizePosterToFinalSize(finalPoster.dataUrl);
        const result = await window.cyberSlideStudio.saveFinalSlide({
          dataUrl,
          slideNumber: slide.number,
          projectName: effectiveProjectName,
        });

        completedCount += 1;
        const completedAt = Date.now();

        setBackgroundBySlide((current) => ({
          ...current,
          [slide.id]: {
            dataUrl,
            filePath: result.filePath,
          },
        }));

        setQueueItems((current) =>
          current.map((item) =>
            item.slideId === slide.id
              ? {
                  ...item,
                  status: "complete",
                  completedAt,
                  durationMs: completedAt - startedAt,
                }
              : item,
          ),
        );
      } catch (error) {
        const completedAt = Date.now();
        const message =
          error instanceof Error
            ? error.message
            : "High-quality final generation failed.";

        failures.push(`Slide ${slide.number}: ${message}`);

        setQueueItems((current) =>
          current.map((item) =>
            item.slideId === slide.id
              ? {
                  ...item,
                  status: "failed",
                  completedAt,
                  durationMs: completedAt - startedAt,
                  error: message,
                }
              : item,
          ),
        );
      }
    }

    setQueueStatus("complete");

    if (failures.length > 0) {
      setExportStatus("error");
      setExportMessage(
        `${completedCount} of ${effectiveSlides.length} final posters completed. ${failures.length} failed. Use Retry Failed Slides to try them again.`,
      );
      return;
    }

    setExportStatus("complete");
    setExportMessage(
      `All ${completedCount} slides were finalized and saved in High quality.`,
    );
  };

  const exportProductionPackage = async () => {
    if (!currentFilePath) {
      setProductionStatus("error");
      setProductionMessage("Save the .cslide project before exporting the production package.");
      return;
    }

    try {
      setProductionStatus("exporting");
      setProductionMessage(
        "Building CapCut, voiceover, music, social, and project-summary files…",
      );

      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      const slides = effectiveSlides.map((slide) => {
        const recommendation =
          recommendationBySlide[slide.id] ??
          createRecommendationForSlide(slide).recommendation;
        return {
          number: slide.number,
          headline: recommendation.headline,
          body: recommendation.supportingText || slide.body,
          cta: slide.cta,
          imageDataUrl: backgroundBySlide[slide.id]?.dataUrl,
        };
      });

      const payload = buildProductionPackage({
        projectName: effectiveProjectName,
        theme,
        layout,
        slides,
      });

      const result = await window.cyberSlideStudio.exportProductionPackage(payload);
      if (!result) {
        setProductionStatus("idle");
        setProductionMessage("");
        return;
      }

      setProductionStatus("complete");
      setProductionMessage(`Production package exported: ${result.folderPath}`);
    } catch (error) {
      setProductionStatus("error");
      setProductionMessage(
        error instanceof Error ? error.message : "Production package export failed.",
      );
    }
  };

  const activeBackground = activeSlide
    ? backgroundBySlide[activeSlide.id]
    : undefined;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="brand-title">CyberSlide Studio</div>
            <div className="brand-subtitle">
              {effectiveProjectName} {isDirty ? "• Unsaved" : "• Saved"}
            </div>
          </div>
        </div>

    <nav className="main-nav" aria-label="Primary navigation">
  {(
    ["Scripts", "Slides", "Themes", "AI", "Voice", "Export", "Settings"] as NavItem[]
  ).map((item) => (
    <button
      key={item}
      type="button"
      className={activeNav === item ? "nav-button active" : "nav-button"}
      onClick={() => setActiveNav(item)}
    >
      {item}
    </button>
  ))}
</nav>

        <div className="topbar-actions">
          <button className="ghost-button" type="button" onClick={handleOpenProject}>
            Open
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void handleSaveProject(false)}
          >
            Save
          </button>
          <span
            className={issueCount ? "status-dot warning" : "status-dot"}
            aria-hidden="true"
          />
          <span className="status-text">
            {effectiveSlides.length} slides · {issueCount} issues
          </span>
        </div>
      </header>

      <main className="workspace">
        <aside className="left-panel panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">PROJECT STORE</p>
              <h1>Content Script</h1>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => void handleNewProject()}
            >
              New
            </button>
          </div>

          <div className="script-toolbar">
            <span>{currentFilePath ?? "Not saved to disk"}</span>
            <span className="toolbar-divider" />
            <span>{wordCount} words</span>
          </div>

          <textarea
            className="script-editor"
            value={currentScript}
            onChange={(event) => handleScriptChange(event.target.value)}
            spellCheck={false}
            aria-label="CyberSlide script editor"
          />

          <div className="editor-footer">
            <span>{currentScript.length} characters</span>
            <span className="live-parser-badge">DIRECTOR</span>
          </div>
        </aside>

        <section className="preview-column">
          <div className="preview-toolbar">
            <div>
              <p className="eyebrow">CREATIVE RECOMMENDATION PREVIEW</p>
              <h2>
                Slide {activeSlide?.number ?? 1} of{" "}
                {Math.max(effectiveSlides.length, 1)}
              </h2>
            </div>

            <div className="zoom-control">
              <button type="button">−</button>
              <span>38%</span>
              <button type="button">+</button>
            </div>
          </div>

          <div className="preview-stage">
            <div
              className="slide-frame"
              style={
                activeBackground
                  ? {
                      backgroundImage: `linear-gradient(
                        rgba(2,8,14,.25),
                        rgba(2,8,14,.75)
                      ), url("${activeBackground.dataUrl}")`,
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "cover",
                      backgroundPosition: "center center",
                      color:
                        activeRecommendation?.palette.foreground ?? "#F1FBFF",
                    }
                  : activeRecommendation
                    ? {
                        backgroundColor:
                          activeRecommendation.palette.background,
                        color: activeRecommendation.palette.foreground,
                      }
                    : undefined
              }
            >
              {!activeBackground && (
                <>
                                <div className="slide-grid" />
                                <div className="slide-orb orb-one" />
                                <div className="slide-orb orb-two" />
                                <div className="scan-line" />

                                <div className="slide-content">

                                  <h3 className={!previewTitle ? "missing-content" : ""}>
                                    {(previewTitle || "MISSING TITLE")
                                      .split(/\s+/)
                                      .map((word, index) => (
                                        <span
                                          key={`${word}-${index}`}
                                          className={
                                            previewFocalWords.includes(
                                              word.replace(/[^\w]/g, "").toUpperCase(),
                                            )
                                              ? "focal-word"
                                              : ""
                                          }
                                        >
                                          {word}
                                        </span>
                                      ))}
                                  </h3>

                                  <p className={`slide-body-card ${!previewBody ? "missing-content" : ""}`}>
                                    {previewBody || "Missing Body"}
                                  </p>

                                  {activeSlide?.cta && (
                                    <div className="slide-cta">{activeSlide.cta}</div>
                                  )}

                                  <div className="slide-accent-line" />
                                </div>

                                <div className="caption-safe-zone">
                                  <span>20% CAPTION-SAFE ZONE</span>
                                </div>
                </>
              )}
            </div>
          </div>

          <div className="slide-strip">
            {effectiveSlides.map((slide) => (
              <button
                key={slide.id}
                className={
                  activeSlide?.id === slide.id
                    ? `thumbnail active ${
                        slide.validation.length ? "has-warning" : ""
                      }`
                    : `thumbnail ${
                        slide.validation.length ? "has-warning" : ""
                      }`
                }
                type="button"
                onClick={() => selectSlide(slide.id)}
              >
                <span className="thumbnail-number">
                  {String(slide.number).padStart(2, "0")}
                </span>
                <span className="thumbnail-title">
                  {recommendationBySlide[slide.id]?.headline ??
                    slide.title ??
                    "⚠ Missing Title"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="right-panel panel validation-panel">
          {activeNav === "AI" ? (
            <AISettings />
          ) : activeNav === "Voice" ? (
            <CyberSlideVoicePanel projectName={effectiveProjectName} slides={effectiveSlides} />
          ) : (
            <CreativeDirectorPanel
              activeSlideExists={Boolean(activeSlide)}
              activeRecommendation={activeRecommendation}
              headlineOptions={activeHeadlineOptions}
              scriptTitleIsBlank={!activeSlide?.title?.trim()}
              onSelectHeadline={selectHeadlineOption}
              onRegenerateHeadlines={regenerateHeadlineOptions}
              generationStatus={generationStatus}
              generationMessage={generationMessage}
              onCreateRecommendation={runCreativeDirector}
              onGenerateBackground={generateActiveBackground}
              onGenerateAllSlides={generateAllSlides}
              onRetryFailedSlides={retryFailedSlides}
              onPauseQueue={pauseQueue}
              onResumeQueue={resumeQueue}
              onCancelQueue={cancelQueue}
              queueItems={queueItems}
              queueStatus={queueStatus}
              queueSummary={queueSummary}
              backgroundReady={Boolean(activeBackground)}
              exportStatus={exportStatus}
              exportMessage={exportMessage}
              onExportFinalSlide={exportActiveFinalSlide}
              onExportProductionPackage={exportProductionPackage}
              productionStatus={productionStatus}
              productionMessage={productionMessage}
              theme={theme}
              layout={layout}
              setTheme={setTheme}
              setLayout={setLayout}
              highlightColor={highlightColor}
              setHighlightColor={setHighlightColor}
            />
          )}
        </aside>
      </main>

      <footer className="statusbar">
        <span>CyberSlide Studio v3.0.0 Alpha 3</span>
        <span>{fileMessage}</span>
        <span>
          {activeRecommendation
            ? `Creative recommendation ready · ${activeRecommendation.palette.name}`
            : "Creative Director ready"}
        </span>
      </footer>
    </div>
  );
}

export default App;