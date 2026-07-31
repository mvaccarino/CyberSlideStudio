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
import { generatePoster } from "./services/PosterGenerationService";
import { normalizeSubtitleSafeArea } from "./composition/CompositionDirector";
import { generateEditorialLayouts } from "./editorial/EditorialDirector";
import { createCompositionPlan, ensureCompositionPlan } from "./editorial/CompositionPlan";
import { deriveLayoutStaleness, projectLayoutFingerprint, slideLayoutFingerprint, voiceInputFingerprint, withDesiredFingerprint } from "./editorial/LayoutFreshness";
import { useProjectStore } from "./state/useProjectStore";
import type { ProjectMenuAction } from "./types/electron";
import type { Project } from "./models/Project";
import { BrandSettingsPage } from "./settings/BrandSettingsPage";
import { applyProjectCTA, resolveProjectCTA } from "./brand/BrandCTAEngine";
import { ProductionPipeline } from "./components/Pipeline/ProductionPipeline";
import { ProjectUpdatePanel, type UpdateSettings } from "./components/Pipeline/ProjectUpdatePanel";
import { idleUpdateQueue, runControlledUpdateQueue, UpdateQueueController, type UpdateQueueSnapshot, type ProjectUpdateResult } from "./components/Pipeline/ProjectUpdateWorkflow";
import { ProjectDashboard } from "./components/Pipeline/ProjectDashboard";
import { ContentLibraryScreen } from "./library/ContentLibraryScreen";
import { projectFromTemplate } from "./library/TemplateProjectFactory";
import { TextSubtitlesPanel } from "./captions/TextSubtitlesPanel";
import { FinalReviewScreen } from "./finalReview/FinalReviewScreen";
import { PublishScreen } from "./finalReview/PublishScreen";
import { CompletionDialog } from "./finalReview/CompletionDialog";
import { HomeScreen, type RecentProject } from "./home/HomeScreen";
import { WorkingImageReview } from "./imageReview/WorkingImageReview";
import { applyApprovedReplacement, nextReviewSlideId } from "./imageReview/ImageReviewWorkflow";
import { AIDirectorPanel } from "./components/Pipeline/AIDirectorPanel";
import {
  advance,
  currentStage,
  statusThrough,
} from "./aiDirector/pipelineState";
import type { PipelineStage } from "./aiDirector/types";
import { directMotions } from "./aiDirector/MotionDirector";
import { buildNativeVideoPlan } from "./video/VideoPlanBuilder";
import { renderNativeVideo } from "./video/NativeVideoService";
import { buildProductionPackage } from "./production/ProductionPackageBuilder";
import { calculateQueueSummary } from "./queue/queueMetrics";
import type { GenerationQueueItem, QueueRunStatus } from "./queue/types";
import {
  focalWordsFromHeadline,
  generateHeadlineOptions,
  type HeadlineOption,
} from "./headlines/HeadlineGenerator";

type NavItem =
  | "Home"
  | "Scripts"
  | "Slides"
  | "Themes"
  | "AI"
  | "Export"
  | "Voice"
  | "Music"
  | "Video"
  | "Director"
  | "Library"
  | "Text"
  | "Image Review"
  | "Final Review"
  | "Publish"
  | "Settings";

const starterScript = `Create the next cybersecurity slideshow using our standard template.

Slide 1

Title:
Why Password Managers Matter

Body:
NoÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âyou don't have to remember 200 different passwords.

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
    updateSlide,
  } = useProjectStore();

  const [activeNav, setActiveNav] = useState<NavItem>("Home");
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
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState("");
  const [updateProgress, setUpdateProgress] = useState<UpdateQueueSnapshot>(idleUpdateQueue);
  const updateControllerRef = useRef<UpdateQueueController | null>(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [reviewSlideIds, setReviewSlideIds] = useState<string[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("cyberslide:recent-projects") || "[]",
      ) as RecentProject[];
    } catch {
      return [];
    }
  });

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
    ? (headlineOptionsBySlide[activeSlide.id] ?? [])
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
    setCompletionOpen(false);
    setVideoPreviewUrl("");
    setActiveNav("Scripts");
  }, [createNewProject]);

  const handleOpenProject = useCallback(async () => {
    try {
      const result = await window.cyberSlideStudio.openProject();
      if (!result) return;
      const openedProject = deserializeProject(result.contents);
      const normalizedProject = {
        ...openedProject,
        name:
          openedProject.name === "Untitled Project"
            ? projectNameFromPath(result.filePath)
            : openedProject.name,
      };
      setProject(normalizedProject);
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
      const recent = [
        {
          name: normalizedProject.name,
          filePath: result.filePath,
          updatedAt: new Date().toISOString(),
        },
        ...recentProjects.filter((item) => item.filePath !== result.filePath),
      ].slice(0, 8);
      setRecentProjects(recent);
      localStorage.setItem(
        "cyberslide:recent-projects",
        JSON.stringify(recent),
      );
      if (normalizedProject.finalRender && !deriveLayoutStaleness(normalizedProject).videoStale) {
        setVideoPreviewUrl(
          await window.cyberSlideStudio.getVideoPreviewUrl(
            normalizedProject.finalRender.filePath,
          ),
        );
        setActiveNav("Final Review");
      } else setActiveNav("Scripts");
    } catch (error) {
      setFileMessage(
        error instanceof Error ? error.message : "Unable to open project",
      );
    }
  }, [setProject, recentProjects]);
  const handleOpenRecentProject = useCallback(
    async (item: RecentProject) => {
      if (!item.filePath) return;
      try {
        const result = await window.cyberSlideStudio.openRecentProject(
          item.filePath,
        );
        const opened = deserializeProject(result.contents);
        setProject(opened);
        setCurrentFilePath(result.filePath);
        setFileMessage(`Opened ${opened.name}`);
        if (opened.finalRender && !deriveLayoutStaleness(opened).videoStale) {
          setVideoPreviewUrl(
            await window.cyberSlideStudio.getVideoPreviewUrl(
              opened.finalRender.filePath,
            ),
          );
          setActiveNav("Final Review");
        } else setActiveNav("Scripts");
      } catch (error) {
        setFileMessage(
          error instanceof Error
            ? error.message
            : "Unable to open recent project",
        );
      }
    },
    [setProject],
  );
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
        const recent = [
          {
            name: projectForPersistence.name,
            filePath: result.filePath,
            updatedAt: new Date().toISOString(),
          },
          ...recentProjects.filter((item) => item.filePath !== result.filePath),
        ].slice(0, 8);
        setRecentProjects(recent);
        localStorage.setItem(
          "cyberslide:recent-projects",
          JSON.stringify(recent),
        );
      } catch (error) {
        setFileMessage(
          error instanceof Error ? error.message : "Unable to save project",
        );
      }
    },
    [markSaved, projectForPersistence, recentProjects],
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

  const createRecommendationForSlide = useCallback(
    (slide: (typeof effectiveSlides)[number]) => {
      const hasScriptTitle = Boolean(slide.title?.trim());
      const headlineOptions = hasScriptTitle
        ? []
        : generateHeadlineOptions(slide.body);
      const selectedHeadline = hasScriptTitle
        ? slide.title.trim()
        : (headlineOptions[0]?.text ?? "SECURITY STARTS HERE");

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
    },
    [],
  );

  const selectHeadlineOption = useCallback(
    (headline: string) => {
      if (!activeSlide) return;

      const existing =
        recommendationBySlide[activeSlide.id] ??
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
    },
    [activeSlide, createRecommendationForSlide, recommendationBySlide],
  );

  const regenerateHeadlineOptions = useCallback(() => {
    if (!activeSlide || activeSlide.title?.trim()) return;
    const options = generateHeadlineOptions(activeSlide.body);
    const rotated =
      options.length > 1 ? [...options.slice(1), options[0]] : options;
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
    activeRecommendation?.focalWords ?? activeAnalysis?.focalWords ?? [];

  const generateSlidePoster = useCallback(
    async (
      slide: (typeof effectiveSlides)[number],
      quality: "low" | "medium" | "high" = "high",
      replaceApproved = false,
      requestId?: string,
    ) => {
      void quality;
      const plannedSlide = withDesiredFingerprint(ensureCompositionPlan(generateEditorialLayouts([slide], project.approvedAssetManifest.filter(asset=>asset.slideId===slide.id), resolveProjectCTA(project))[0]));
      const desiredLayoutFingerprint = slideLayoutFingerprint(plannedSlide);
      const existingRecommendation = recommendationBySlide[slide.id];
      const recommendation =
        existingRecommendation ??
        createRecommendationForSlide(slide).recommendation;
      const slideLayout = recommendation.layout
        .split("-")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ");

      if (slide.background.approvalLocked && !replaceApproved)
        throw new Error(
          "This slide is approved and locked. Use Regenerate to replace it explicitly.",
        );
      const posterPrompt =
        slide.background.promptOverride?.trim() ||
        `${buildPosterPrompt({
          headline: recommendation.headline,
          supportingText: recommendation.supportingText,
          cta: slide.cta,
          theme,
          layout: slideLayout,
          focalWords: recommendation.focalWords,
          highlightColor,
          compositionPlan: plannedSlide.compositionPlan || undefined,
        })}
Production style: ${project.productionStyle.posterPromptStyle}`;

      const result = await generatePoster({
        prompt: posterPrompt,
        slideNumber: slide.number,
        projectName: effectiveProjectName,
        quality: "high",
        subtitleSafeArea: normalizeSubtitleSafeArea(
          project.settings.captionSafeZonePercent,
        ),
        compositionPlan: plannedSlide.compositionPlan!,
        layoutFingerprint: desiredLayoutFingerprint,
        requestId,
      });

      updateSlide(slide.id, {
        layoutTemplateId: plannedSlide.layoutTemplateId,
        compositionPlan: plannedSlide.compositionPlan,
        compositionValidation: result.validationResult,
        layoutWarnings: result.validationResult.warnings,
        compositionFingerprint: desiredLayoutFingerprint,
        workingImageFingerprint: desiredLayoutFingerprint,
        workingGeneratedAt: new Date().toISOString(),
        lastImagePrompt: result.finalPrompt,
        editorial: plannedSlide.editorial,
        headlineLineBreaks: plannedSlide.headlineLineBreaks,
        background: {
          ...slide.background,
          imagePath: result.filePath,
          workingImagePath: result.filePath,
          approvedImagePath: replaceApproved ? slide.background.approvedImagePath : null,
          approvedAt: replaceApproved ? slide.background.approvedAt : null,
          approvalLocked: false,
        },
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
      project,
      updateSlide,
    ],
  );

  const generateActiveBackground = async () => {
    if (!activeSlide || queueStatus === "running" || queueStatus === "paused")
      return;

    try {
      setGenerationStatus("generating");
      setGenerationMessage(
        "Generating draft poster for the current slideÃ¢â‚¬Â¦",
      );
      await generateSlidePoster(activeSlide, "low");
      setGenerationStatus("complete");
      setGenerationMessage(
        "Draft poster complete. Final export will use High quality.",
      );
    } catch (error) {
      setGenerationStatus("error");
      setGenerationMessage(
        error instanceof Error ? error.message : "Image generation failed.",
      );
    }
  };

  const regenerateActiveSlide = useCallback(async () => {
    if (!activeSlide) return;
    updateSlide(activeSlide.id, {
      background: { ...activeSlide.background, approvalLocked: false },
      layoutWarnings: ["Approved image preserved while a new layout-aware Working image is generated."],
    });
    setGenerationStatus("generating");
    try {
      await generateSlidePoster(activeSlide, "high", true);
      setGenerationStatus("complete");
      setGenerationMessage(
        "Replacement Working image generated. Review and approve it.",
      );
    } catch (error) {
      setGenerationStatus("error");
      setGenerationMessage(
        error instanceof Error ? error.message : "Regeneration failed.",
      );
    }
  }, [activeSlide, generateSlidePoster, updateSlide]);

  const editActivePrompt = useCallback(() => {
    if (!activeSlide) return;
    const next = window.prompt(
      "Edit the production image prompt",
      activeSlide.background.promptOverride ||
        activeSlide.background.prompt ||
        "",
    );
    if (next !== null)
      updateSlide(activeSlide.id, {
        background: { ...activeSlide.background, promptOverride: next },
      });
  }, [activeSlide, updateSlide]);
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
      setGenerationMessage(
        `Preparing ${slidesToGenerate.length} draft poster${slidesToGenerate.length === 1 ? "" : "s"}Ã¢â‚¬Â¦`,
      );
      setQueueItems(
        slidesToGenerate.map((slide) => ({
          slideId: slide.id,
          slideNumber: slide.number,
          title:
            recommendationBySlide[slide.id]?.headline ||
            slide.title ||
            `Slide ${slide.number}`,
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
          setGenerationMessage(
            "Queue cancelled after the active request finished.",
          );
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
        setGenerationMessage(
          `Generating draft poster for slide ${slide.number} of ${slidesToGenerate.length}Ã¢â‚¬Â¦`,
        );

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
      setGenerationMessage(
        "Draft queue complete. Review each slide before final export.",
      );
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
    setGenerationMessage(
      "Queue paused. The active API request will finish first.",
    );
  };

  const resumeQueue = () => {
    if (queueStatus !== "paused") return;
    pauseQueueRef.current = false;
    setQueueStatus("running");
    setGenerationMessage("Queue resumedÃ¢â‚¬Â¦");
  };

  const cancelQueue = () => {
    if (queueStatus !== "running" && queueStatus !== "paused") return;
    cancelQueueRef.current = true;
    pauseQueueRef.current = false;
    setQueueStatus("cancelling");
    setGenerationMessage(
      "Cancelling after the active API request finishesÃ¢â‚¬Â¦",
    );
  };

  const exportActiveFinalSlide = async () => {
    let slides = [...project.slides];
    const pending = slides.filter((slide) => Boolean(slide.background.workingImagePath) && (!slide.background.approvedImagePath || slide.workingImageFingerprint !== slide.approvedImageFingerprint));
    if (pending.some((slide) => !slide.background.workingImagePath)) {
      setExportStatus("error");
      setExportMessage("Every slide needs a Working image before approval.");
      return;
    }
    setExportStatus("rendering");
    try {
      for (const slide of pending) {
        const approved = await window.cyberSlideStudio.approveSlideImage({
          sourcePath: slide.background.workingImagePath as string,
          slideNumber: slide.number,
          projectName: effectiveProjectName,
        });
        slides = slides.map((item) =>
          item.id === slide.id
            ? {
                ...item,
                background: {
                  ...item.background,
                  imagePath: approved.filePath,
                  approvedImagePath: approved.filePath,
                  approvedAt: approved.approvedAt,
                  approvalLocked: true,
                },
                approvedImageFingerprint: item.workingImageFingerprint || item.compositionFingerprint,
                layoutWarnings: [],
              }
            : item,
        );
      }
      const manifest = directMotions(
        slides.map((slide) => ({
          slideId: slide.id,
          slideNumber: slide.number,
          path: slide.background.approvedImagePath as string,
          title: slide.title,
          body: slide.body,
        })),
        project.productionStyle.name,
      );
      setProject({
        ...project,
        slides,
        approvedAssetManifest: manifest,
        pipelineStatus: advance(project.pipelineStatus, "images"),
      });
      setExportStatus("complete");
      setExportMessage(`All ${slides.length} slides are approved.`);
    } catch (error) {
      setExportStatus("error");
      setExportMessage(
        error instanceof Error ? error.message : "Approval failed.",
      );
    }
  };

  const exportProductionPackage = async () => {
    if (!currentFilePath) {
      setProductionStatus("error");
      setProductionMessage(
        "Save the .cslide project before exporting the production package.",
      );
      return;
    }

    try {
      setProductionStatus("exporting");
      setProductionMessage(
        "Building CapCut, voiceover, music, social, and project-summary filesÃ¢â‚¬Â¦",
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
        music: project.music,
        slideTextOverlay: project.slideTextOverlay,
        subtitles: project.subtitles,
      });

      const result =
        await window.cyberSlideStudio.exportProductionPackage(payload);
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
        error instanceof Error
          ? error.message
          : "Production package export failed.",
      );
    }
  };

  const selectPipelineStage = (stage: PipelineStage) => {
    const nav: Record<PipelineStage, NavItem> = {
      script: "Scripts",
      images: "Slides",
      voice: "Voice",
      music: "Music",
      video: "Video",
      publish: "Publish",
    };
    setActiveNav(nav[stage]);
  };

  const estimateProjectDuration = (value: typeof project) => {
    const approved = value.slides.filter(
      (slide) => slide.background.approvedImagePath,
    );
    return Math.max(
      0,
      approved.reduce(
        (total, slide) =>
          total +
          (value.voiceover.scenes.find(
            (scene) => scene.slideNumber === slide.number,
          )?.sceneDurationSeconds ??
            Math.max(
              3.2,
              Math.min(
                8,
                [slide.title, slide.body]
                  .join(" ")
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean).length /
                  2.5 +
                  0.65,
              ),
            )),
        0,
      ) -
        Math.max(0, approved.length - 1) * 0.3,
    );
  };

  const runImageStage = async (base = project) => {
    let slides = generateEditorialLayouts(base.slides, base.approvedAssetManifest, resolveProjectCTA(base)).map(ensureCompositionPlan).map(withDesiredFingerprint);
    setProject({...base, slides});
    for (const slide of slides) {
      if (slide.background.approvedImagePath && slide.background.approvalLocked) {
        const desired = slideLayoutFingerprint(slide);
        if (slide.approvedImageFingerprint === desired) continue;
        throw new Error(`Slide ${slide.number} uses an Approved image from an older layout. Use Regenerate Image for New Layout, review the Working image, then Approve it.`);
      }
      if (slide.background.approvedImagePath && !slide.background.approvalLocked && slide.background.workingImagePath && slide.workingImageFingerprint === slideLayoutFingerprint(slide))
        throw new Error(`Slide ${slide.number} has a current layout-aware Working image awaiting approval. Review it and click Approve before continuing.`);
      setPipelineMessage(
        `Generating Working image ${slide.number} of ${slides.length}Ã¢â‚¬Â¦`,
      );
      const generated = await generateSlidePoster(slide, "high", false);
      const approved = await window.cyberSlideStudio.approveSlideImage({
        sourcePath: generated.filePath,
        slideNumber: slide.number,
        projectName: effectiveProjectName,
      });
      slides = slides.map((item) =>
        item.id === slide.id
          ? {
              ...item,
              background: {
                ...item.background,
                imagePath: approved.filePath,
                workingImagePath: generated.filePath,
                approvedImagePath: approved.filePath,
                approvedAt: approved.approvedAt,
                approvalLocked: true,
              },
              compositionValidation: generated.validationResult,
              layoutWarnings: generated.validationResult.warnings,
              compositionFingerprint: generated.layoutFingerprint,
              workingImageFingerprint: generated.layoutFingerprint,
          workingGeneratedAt: new Date().toISOString(),
              approvedImageFingerprint: generated.layoutFingerprint,
              lastImagePrompt: generated.finalPrompt,
            }
          : item,
      );
      setBackgroundBySlide((current) => ({
        ...current,
        [slide.id]: { dataUrl: generated.dataUrl, filePath: approved.filePath },
      }));
    }
    const manifest = directMotions(
      slides
        .filter((slide) => slide.background.approvedImagePath)
        .map((slide) => ({
          slideId: slide.id,
          slideNumber: slide.number,
          path: slide.background.approvedImagePath as string,
          title: slide.title,
          body: slide.body,
        })),
      base.productionStyle.name,
    );
    const next = {
      ...base,
      slides,
      approvedAssetManifest: manifest,
      pipelineStatus: advance(base.pipelineStatus, "images"),
    };
    setProject(next);
    return next;
  };
  const runVoiceStage = async (base = project) => {
    const prepared = applyProjectCTA(base);
    const cta = resolveProjectCTA(prepared);
    if (
      prepared.voiceover.narrationPath &&
      prepared.voiceover.ctaFingerprint === cta &&
      prepared.voiceover.sourceFingerprint === voiceInputFingerprint(prepared)
    ) {
      const next = {
        ...prepared,
        pipelineStatus: advance(prepared.pipelineStatus, "voice"),
      };
      setProject(next);
      return next;
    }
    setPipelineMessage("Generating narration and scene timingÃ¢â‚¬Â¦");
    const result = await window.cyberSlideStudio.generateCyberSlideVoice({
      projectName: effectiveProjectName,
      voiceId: "am_adam",
      speed: 1,
      paddingBefore: 0.12,
      paddingAfter: 0.28,
      slides: prepared.slides,
    });
    const next = {
      ...prepared,
      voiceover: {
        narrationPath: result.narrationPath,
        timingPath: result.timingPath,
        totalDurationSeconds: result.totalDurationSeconds,
        generatedAt: result.generatedAt,
        ctaFingerprint: cta,
        sourceFingerprint: voiceInputFingerprint(prepared),
        scenes: result.scenes,
      },
      pipelineStatus: advance(prepared.pipelineStatus, "voice"),
    };
    setProject(next);
    return next;
  };

  const runCaptionStage = async (base = project, force = false) => {
    if (!base.voiceover.scenes.length)
      throw new Error(
        "Generate Voice before creating text and subtitle assets.",
      );
    setPipelineMessage(
      "Generating temporary headlines and narration subtitle layersÃ¢â‚¬Â¦",
    );
    const editorialSlides = generateEditorialLayouts(
      base.slides,
      base.approvedAssetManifest,
      resolveProjectCTA(base),
    );
    const layoutFingerprint = projectLayoutFingerprint({...base,slides:editorialSlides});
    const result = await window.cyberSlideStudio.generateCaptionAssets({
      projectName: effectiveProjectName,
      slides: editorialSlides.map(({ number, editorialPackage, editorial }) => ({
        number,
        editorialPackage,
        editorial,
      })),
      scenes: base.voiceover.scenes,
      narrationPath: base.voiceover.narrationPath,
      timingPath: base.voiceover.timingPath,
      narrationMarker: base.voiceover.generatedAt,
      overlaySettings: {...base.slideTextOverlay,layoutFingerprint},
      subtitleSettings: {
        ...base.subtitles,
        safeAreaPercent: normalizeSubtitleSafeArea(
          base.settings.captionSafeZonePercent,
        ),
      },
      force,
    });
    const next = {
      ...base,
      slides: editorialSlides,
      slideTextOverlay: result.overlay,
      subtitles: result.subtitles,
    };
    setProject(next);
    return next;
  };
  const runMusicStage = async (base = project) => {
    if (base.music.finalMixPath) {
      const next = {
        ...base,
        pipelineStatus: advance(base.pipelineStatus, "music"),
      };
      setProject(next);
      return next;
    }
    setPipelineMessage("AI Director is selecting and preparing musicÃ¢â‚¬Â¦");
    let music = base.music;
    if (music.mode !== "none" && !music.sourcePath && !music.projectPath) {
      try {
        const track = await window.cyberSlideStudio.autoSelectMusic({
          mode: music.mode,
          text: [
            base.name,
            base.script,
            ...base.slides.flatMap((slide) => [slide.title, slide.body]),
            base.musicStyle,
          ].join(" "),
        });
        music = { ...music, ...track, projectPath: track.projectPath ?? null };
      } catch {
        music = {
          ...music,
          mode: "none",
          sourcePath: null,
          projectPath: null,
          displayTitle: "",
          category: "",
          selectionReason:
            "No library track was available; narration-only mix prepared.",
        };
      }
    }
    const prepared = await window.cyberSlideStudio.prepareMusicAudio({
      projectName: effectiveProjectName,
      config: music,
      narrationPath: base.voiceover.narrationPath,
      durationSeconds: estimateProjectDuration(base),
    });
    const next = {
      ...base,
      music: prepared,
      pipelineStatus: advance(base.pipelineStatus, "music"),
    };
    setProject(next);
    return next;
  };

  const runVideoStage = async (base = project, force = false) => {
    const layoutFingerprint = projectLayoutFingerprint(base);
    if (!force && base.pipelineStatus.video === "completed" && base.finalRender?.layoutFingerprint === layoutFingerprint) return base;
    setPipelineMessage("Rendering the AI-directed final videoÃ¢â‚¬Â¦");
    const plan = buildNativeVideoPlan({
      projectName: effectiveProjectName,
      slides: base.slides.map((slide) => ({
        ...slide,
        approvedImagePath: slide.background.approvedImagePath,
      })),
      approvedAssetManifest: base.approvedAssetManifest,
      productionStyleName: base.productionStyle.name,
      voiceScenes: base.voiceover.scenes,
      narrationPath: base.voiceover.narrationPath,
      finalMixPath: base.music.finalMixPath,
      overlayPath: base.slideTextOverlay.enabled ? base.slideTextOverlay.generatedPath : null,
      layoutFingerprint,
      subtitlePath: base.subtitles.enabled ? base.subtitles.assPath : null,
      renderMode: "final",
    });
    const rendered = await renderNativeVideo(plan);
    const next = {
      ...base,
      finalRender: {...rendered,layoutFingerprint},
      pipelineStatus: advance(base.pipelineStatus, "video"),
    };
    setProject(next);
    return next;
  };

  const generateEverything = async () => {
    if (pipelineBusy) return;
    setPipelineBusy(true);
    try {
      const preparedSlides = generateEditorialLayouts(project.slides, project.approvedAssetManifest, resolveProjectCTA(project)).map(ensureCompositionPlan).map(withDesiredFingerprint);
      const preparedProject = {...project,slides:preparedSlides};
      const stale = deriveLayoutStaleness(preparedProject);
      let next = {
        ...preparedProject,
        pipelineStatus: !project.script.trim()
          ? project.pipelineStatus
          : stale.imageStale
            ? statusThrough(["script"], "images")
            : stale.textStale || stale.videoStale
              ? statusThrough(["script","images","voice","music"], "video")
              : project.pipelineStatus,
      };
      if (!project.script.trim()) throw new Error("Add a script before running production.");
      if (stale.imageStale) next = await runImageStage(next);
      else next = {...next,pipelineStatus:advance(next.pipelineStatus,"images")};      next = await runVoiceStage(next);
      next = await runCaptionStage(next);
      next = await runMusicStage(next);
      next = await runVideoStage(next);
      setProject(next);
      setPipelineMessage("Production complete. Ready to publish.");
      setActiveNav("Final Review");
      setCompletionOpen(true);
    } catch (error) {
      setPipelineMessage(
        error instanceof Error ? error.message : "AI Director pipeline failed.",
      );
    } finally {
      setPipelineBusy(false);
    }
  };
  const applyProjectUpdateSettings = (base: Project, settings: UpdateSettings): Project => {
    const targetIds = new Set(settings.scope === "current" && activeSlide ? [activeSlide.id] : base.slides.map(slide => slide.id));
    const slides = base.slides.map(slide => targetIds.has(slide.id) ? {
      ...slide,
      layoutTemplateId: settings.layoutTemplateId,
      editorialPackage: { ...slide.editorialPackage, layoutTemplate: settings.layoutTemplateId, manuallyEdited: true },
      captionSafeZonePercent: settings.safeArea,
      compositionPlan: createCompositionPlan({ ...slide, captionSafeZonePercent: settings.safeArea }, settings.layoutTemplateId),
      editorial: null,
      compositionFingerprint: null,
      layoutWarnings: slide.background.approvedImagePath ? ["Layout settings changed. Approved image preserved until replacement approval."] : [],
    } : slide);
    return {
      ...base,
      slides,
      settings: { ...base.settings, captionSafeZonePercent: settings.safeArea },
      slideTextOverlay: { ...base.slideTextOverlay, posterStyle: settings.headlineStyle, highlightColor: settings.highlightColor, freshness: null, layoutFingerprint: null },
      subtitles: { ...base.subtitles, safeAreaPercent: settings.safeArea, freshness: null },
      pipelineStatus: statusThrough(["script"], "images"),
    };
  };
  const applyProjectUpdateLayout = (settings: UpdateSettings) => setProject(applyProjectUpdateSettings(project, settings));
  const cancelProjectUpdate = () => {
    const controller = updateControllerRef.current;
    if (!controller) return;
    controller.cancel(window.cyberSlideStudio.cancelOpenAIPosterGeneration);
    setPipelineMessage("Cancelling active image request and preserving completed Working images...");
  };
  const updateProjectAssets = async (settings: UpdateSettings, onlyFailed = false): Promise<ProjectUpdateResult[]> => {
    if (pipelineBusy) return [];
    setPipelineBusy(true);
    const controller = new UpdateQueueController();
    updateControllerRef.current = controller;
    const startedAt = Date.now();
    try {
      const configured = applyProjectUpdateSettings(project, settings);
      let slides = generateEditorialLayouts(configured.slides, configured.approvedAssetManifest, resolveProjectCTA(configured)).map(ensureCompositionPlan).map(withDesiredFingerprint);
      const stale = deriveLayoutStaleness({ ...configured, slides });
      const failedIds = new Set(updateProgress.items.filter(item => item.status === "failed").map(item => item.slideId));
      const targetIds = settings.scope === "current" && activeSlide ? new Set([activeSlide.id]) : new Set(stale.staleSlideIds);
      const targets = slides.filter(slide => targetIds.has(slide.id) && (!onlyFailed || failedIds.has(slide.id)));
      const queueItems = targets.map(slide => ({ slideId:slide.id,slideNumber:slide.number,title:slide.title,status:"pending" as const,error:null,elapsedMs:0 }));
      setUpdateProgress({ running:true,cancelled:false,stage:"Preparing composition prompts",startedAt,currentSlide:null,items:queueItems });
      const completed = new Map<string, Awaited<ReturnType<typeof generateSlidePoster>>>();
      if (import.meta.env.DEV) console.info("[ProjectUpdate] selected layout", { layoutTemplateId:settings.layoutTemplateId,scope:settings.scope,slides:targets.map(slide=>slide.number),concurrency:settings.concurrency,timeoutSeconds:settings.timeoutSeconds });
      const finalItems = await runControlledUpdateQueue({
        items:queueItems,
        concurrency:settings.concurrency,
        timeoutMs:settings.timeoutSeconds*1000,
        controller,
        cancelRequest:window.cyberSlideStudio.cancelOpenAIPosterGeneration,
        onChange:(items,currentSlide,stage)=>setUpdateProgress({ running:true,cancelled:controller.cancelled,stage,startedAt,currentSlide,items }),
        execute:async(item,requestId)=>{
          const slide=slides.find(value=>value.id===item.slideId);
          if(!slide)throw new Error("Slide disappeared from the update queue.");
          if(import.meta.env.DEV)console.info("[ProjectUpdate] prompt construction start",{requestId,slideNumber:slide.number,layout:slide.layoutTemplateId});
          const result=await generateSlidePoster(slide,"high",true,requestId);
          await window.cyberSlideStudio.readSlideImage(result.filePath);
          completed.set(slide.id,result);
          if(import.meta.env.DEV)console.info("[ProjectUpdate] completion",{requestId,slideNumber:slide.number,filePath:result.filePath});
        },
      });
      slides=slides.map(slide=>{const generated=completed.get(slide.id);return generated?{...slide,compositionValidation:generated.validationResult,layoutWarnings:generated.validationResult.warnings,compositionFingerprint:generated.layoutFingerprint,workingImageFingerprint:generated.layoutFingerprint,lastImagePrompt:generated.finalPrompt,background:{...slide.background,imagePath:generated.filePath,workingImagePath:generated.filePath,approvedImagePath:slide.background.approvedImagePath,approvedAt:slide.background.approvedAt,approvalLocked:false}}:slide});
      let next:Project={...configured,slides,slideTextOverlay:{...configured.slideTextOverlay,freshness:null,layoutFingerprint:null},pipelineStatus:statusThrough(["script"],"images")};
      if(!controller.cancelled){
        if(!next.voiceover.narrationPath||next.voiceover.sourceFingerprint!==voiceInputFingerprint(next))next=await runVoiceStage(next);
        if(next.voiceover.scenes.length)next=await runCaptionStage(next,true);
      }
      setProject(next);
      setUpdateProgress({running:false,cancelled:controller.cancelled,stage:controller.cancelled?"Cancelled":"Update complete",startedAt,currentSlide:null,items:finalItems});
      const successfulIds=finalItems.filter(item=>item.status==="completed"&&completed.has(item.slideId)).map(item=>item.slideId);
      if(successfulIds.length){setReviewSlideIds(successfulIds);selectSlide(successfulIds[0]);setActiveNav("Image Review");}
      setPipelineMessage(controller.cancelled?"Update cancelled. Completed Working images were preserved.":finalItems.some(item=>item.status==="failed")?"Update finished with failed slides. Review errors or retry them.":"Working images and editorial assets updated. Approve replacements before rendering.");
      return finalItems.map(item=>{const slide=next.slides.find(value=>value.id===item.slideId);return {success:item.status==="completed"&&Boolean(slide?.background.workingImagePath),slideId:item.slideId,workingImagePath:slide?.background.workingImagePath||null,approvedImagePath:slide?.background.approvedImagePath||null,warnings:slide?.layoutWarnings||[],validationResult:slide?.compositionValidation||null,error:item.error};});
    } catch(error){
      setUpdateProgress(current=>({...current,running:false,stage:"Update failed",items:current.items.map(item=>item.status==="active"?{...item,status:"failed",error:error instanceof Error?error.message:"Update failed."}:item)}));
      setPipelineMessage(error instanceof Error?error.message:"Project update failed.");
      if(import.meta.env.DEV)console.error("[ProjectUpdate] failure",error);
      return [{success:false,slideId:activeSlide?.id||"",workingImagePath:null,approvedImagePath:activeSlide?.background.approvedImagePath||null,warnings:[],validationResult:null,error:error instanceof Error?error.message:"Project update failed."}];
    } finally {
      updateControllerRef.current=null;
      setPipelineBusy(false);
    }
  };
  const advanceImageReview = (slideId: string) => {
    const nextId=nextReviewSlideId(reviewSlideIds,slideId);
    if(nextId)selectSlide(nextId);else setPipelineMessage("Image review complete. Approve any remaining replacements when ready.");
  };
  const approveReviewReplacement = async (slide: Project["slides"][number]) => {
    if(!slide.background.workingImagePath)throw new Error("No Working image exists for this slide.");
    await window.cyberSlideStudio.readSlideImage(slide.background.workingImagePath);
    const approved=await window.cyberSlideStudio.approveSlideImage({sourcePath:slide.background.workingImagePath,slideNumber:slide.number,projectName:effectiveProjectName});
    let next:Project=applyApprovedReplacement(project,slide.id,approved.filePath,approved.approvedAt);
    next={...next,approvedAssetManifest:directMotions(next.slides.filter(item=>item.background.approvedImagePath).map(item=>({slideId:item.id,slideNumber:item.number,path:item.background.approvedImagePath as string,title:item.title,body:item.body})),next.productionStyle.name)};
    if(next.voiceover.scenes.length)await runCaptionStage(next,true);else setProject(next);
    advanceImageReview(slide.id);
  };
  const regenerateReviewSlide = async (slide: Project["slides"][number]) => {
    const result=await generateSlidePoster(slide,"high",true);
    await window.cyberSlideStudio.readSlideImage(result.filePath);
    setPipelineMessage(`New Working image generated for Slide ${slide.number}.`);
  };
  const keepExistingApproval = (slide: Project["slides"][number]) => {
    setPipelineMessage(`Kept the existing Approved image for Slide ${slide.number}. The Working image remains available.`);
    advanceImageReview(slide.id);
  };
  const previewSelectedLayout = () => {
    if(!activeSlide)return;
    setReviewSlideIds([activeSlide.id]);
    selectSlide(activeSlide.id);
    setActiveNav("Image Review");
  };
  const rebuildLayoutAndRender = async () => {
    if (pipelineBusy) return;
    setPipelineBusy(true);
    try {
      const slides=generateEditorialLayouts(project.slides,project.approvedAssetManifest,resolveProjectCTA(project)).map(ensureCompositionPlan).map(withDesiredFingerprint);
      let next={...project,slides,pipelineStatus:statusThrough(["script","images","voice","music"],"video")};
      next=await runCaptionStage(next,false);
      next=await runVideoStage(next,true);
      setProject(next);
      setPipelineMessage("Layout assets rebuilt and final video rendered from current geometry.");
    } finally { setPipelineBusy(false); }
  };
  const approvedSlidesForVideo = effectiveSlides.filter(
    (slide) => slide.background.approvedImagePath,
  );
  const nativeVideoDuration = Math.max(
    0,
    approvedSlidesForVideo.reduce((total, slide) => {
      const exact = project.voiceover.scenes.find(
        (scene) => scene.slideNumber === slide.number,
      )?.sceneDurationSeconds;
      const words = [slide.title, slide.body]
        .join(" ")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      return total + (exact ?? Math.max(3.2, Math.min(8, words / 2.5 + 0.65)));
    }, 0) -
      Math.max(0, approvedSlidesForVideo.length - 1) * 0.3,
  );
  const currentPipelineStage = currentStage(project.pipelineStatus);

  const activeBackground = activeSlide
    ? backgroundBySlide[activeSlide.id]
    : undefined;

  // Retained orchestration helpers remain available while staged controls replace their scattered UI.
  void [
    setTheme,
    setHighlightColor,
    generationStatus,
    generationMessage,
    exportStatus,
    exportMessage,
    productionStatus,
    productionMessage,
    activeHeadlineOptions,
    queueSummary,
    regenerateHeadlineOptions,
    runCreativeDirector,
    generateActiveBackground,
    editActivePrompt,
    retryFailedSlides,
    pauseQueue,
    resumeQueue,
    cancelQueue,
  ];

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
              {effectiveProjectName}{" "}
              {isDirty ? "Ã¢â‚¬Â¢ Unsaved" : "Ã¢â‚¬Â¢ Saved"}
            </div>
          </div>
        </div>

        <nav className="main-nav" aria-label="Primary navigation">
          {(
            [
              "Home",
              "Library",
              "Text",
              "Director",
              ...(project.finalRender && !deriveLayoutStaleness(project).videoStale ? ["Final Review"] : []),
              "Settings",
            ] as NavItem[]
          ).map((item) => (
            <button
              key={item}
              type="button"
              className={
                activeNav === item ? "nav-button active" : "nav-button"
              }
              onClick={() => setActiveNav(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={handleOpenProject}
          >
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
            {effectiveSlides.length} slides Ã‚Â· {issueCount} issues
          </span>
        </div>
      </header>

      {activeNav !== "Home" && (
        <ProjectDashboard
          project={project}
          estimatedLength={nativeVideoDuration}
        />
      )}

      {activeNav !== "Home" && activeNav !== "Image Review" && (
        <ProjectUpdatePanel project={project} selectedSlideId={activeSlide?.id ?? null} progress={updateProgress} onApply={applyProjectUpdateLayout} onPreview={previewSelectedLayout} onUpdate={updateProjectAssets} onCancel={cancelProjectUpdate} />
      )}

      {activeNav === "Home" ? (
        <HomeScreen
          projectName={effectiveProjectName}
          canContinue={Boolean(project.script.trim())}
          recent={recentProjects}
          onContinue={() =>
            setActiveNav(project.finalRender && !deriveLayoutStaleness(project).videoStale ? "Final Review" : "Scripts")
          }
          onTemplates={() => setActiveNav("Library")}
          onNew={() => void handleNewProject()}
          onRecent={(item) => void handleOpenRecentProject(item)}
        />
      ) : activeNav === "Image Review" && activeSlide ? (
        <WorkingImageReview
          key={activeSlide.id}
          project={project}
          slideId={activeSlide.id}
          reviewSlideIds={reviewSlideIds.length ? reviewSlideIds : [activeSlide.id]}
          onSelect={selectSlide}
          onApprove={approveReviewReplacement}
          onRegenerate={regenerateReviewSlide}
          onKeep={keepExistingApproval}
          onEdit={() => setActiveNav("Text")}
          onClose={() => setActiveNav("Scripts")}
        />      ) : activeNav === "Final Review" && project.finalRender && !deriveLayoutStaleness(project).videoStale ? (
        <FinalReviewScreen
          project={project}
          videoUrl={videoPreviewUrl}
          onPublish={() => setActiveNav("Publish")}
          onEdit={() => setActiveNav("Scripts")}
          onOpenFolder={() =>
            void window.cyberSlideStudio.openVideoFolder(effectiveProjectName)
          }
          onExport={() => void exportProductionPackage()}
        />
      ) : activeNav === "Publish" ? (
        <PublishScreen onBack={() => setActiveNav("Final Review")} />
      ) : activeNav === "Library" ? (
        <ContentLibraryScreen
          onCreateProject={(template, ctaPreference) => {
            setProject(projectFromTemplate(template, ctaPreference));
            setCurrentFilePath(null);
            void window.cyberSlideStudio.clearCurrentProjectPath();
            setFileMessage(`Created from ${template.title}`);
            setActiveNav("Scripts");
          }}
        />
      ) : (
        <main className="workspace">
          <aside className="left-panel panel">
            <ProductionPipeline
              project={project}
              busy={pipelineBusy}
              message={pipelineMessage}
              onStage={selectPipelineStage}
              onGenerateEverything={generateEverything}
            />
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
                <button type="button">-</button>
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

                      <p
                        className={`slide-body-card ${!previewBody ? "missing-content" : ""}`}
                      >
                        {previewBody || "Missing Body"}
                      </p>

                      {activeSlide?.cta && (
                        <div className="slide-cta">{activeSlide.cta}</div>
                      )}

                      <div className="slide-accent-line" />
                    </div>
                  </>
                )}
                <div
                  className="caption-safe-zone"
                  style={{
                    height: `${normalizeSubtitleSafeArea(project.settings.captionSafeZonePercent)}%`,
                  }}
                >
                  <span>
                    {normalizeSubtitleSafeArea(
                      project.settings.captionSafeZonePercent,
                    )}
                    % SUBTITLE-SAFE AREA
                  </span>
                </div>
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
                  onContextMenu={(event) => {
                    event.preventDefault();
                    selectSlide(slide.id);
                    if (window.confirm(`Regenerate slide ${slide.number} for the current layout? The Approved image will be preserved.`)) {
                      void generateSlidePoster(slide, "high", true);
                    }
                  }}
                >
                  <span className="thumbnail-number">
                    {String(slide.number).padStart(2, "0")}
                  </span>
                  <span className="thumbnail-title">
                    {recommendationBySlide[slide.id]?.headline ??
                      slide.title ??
                      "ÃƒÂ¢Ã…Â¡Ã‚Â  Missing Title"}
                  </span>
                </button>
              ))}
            </div>
            <button className="secondary-button slide-layout-action" type="button" disabled={!activeSlide || pipelineBusy} onClick={() => void regenerateActiveSlide()}>
              Regenerate Image for Layout
            </button>
          </section>

          <aside className="right-panel panel validation-panel">
            {activeNav === "Text" ? (
              <TextSubtitlesPanel
                project={project}
                projectName={effectiveProjectName}
                selectedSlideId={activeSlide?.id ?? null}
                onChange={setProject}
                onRebuildLayoutAndRender={rebuildLayoutAndRender}
                onRegenerateImage={async (slideId) => {
                  const slide = project.slides.find(item => item.id === slideId);
                  if (!slide) throw new Error("Slide not found.");
                  await generateSlidePoster(slide, "high", true);
                }}
              />
            ) : activeNav === "Director" ? (
              <AIDirectorPanel project={project} onChange={setProject} />
            ) : activeNav === "Settings" ? (
              <BrandSettingsPage
                project={project}
                onProjectChange={setProject}
              />
            ) : currentPipelineStage === "images" ? (
              <div className="director-panel">
                <p className="eyebrow">IMAGE STAGE</p>
                <h2>Approved Visuals</h2>
                <button
                  className="primary-button"
                  onClick={() => void generateAllSlides()}
                  disabled={pipelineBusy}
                >
                  Generate Images
                </button>
                <button
                  className="secondary-button"
                  onClick={() => void exportActiveFinalSlide()}
                >
                  Approve
                </button>
                <button
                  className="secondary-button"
                  onClick={() => void regenerateActiveSlide()}
                >
                  Regenerate
                </button>
              </div>
            ) : currentPipelineStage === "voice" ? (
              <div className="director-panel">
                <p className="eyebrow">VOICE STAGE</p>
                <h2>Narration</h2>
                <button
                  className="primary-button"
                  onClick={() => void runVoiceStage()}
                >
                  Generate Voice
                </button>
              </div>
            ) : currentPipelineStage === "music" ? (
              <div className="director-panel">
                <p className="eyebrow">MUSIC STAGE</p>
                <h2>Soundtrack + Mix</h2>
                <button
                  className="primary-button"
                  onClick={() => void runMusicStage()}
                >
                  Prepare Music
                </button>
              </div>
            ) : currentPipelineStage === "video" ? (
              <div className="director-panel">
                <p className="eyebrow">VIDEO STAGE</p>
                <h2>Final Render</h2>
                <button
                  className="primary-button"
                  onClick={() => void runVideoStage()}
                >
                  Render Final Video
                </button>
              </div>
            ) : currentPipelineStage === "publish" ? (
              <div className="director-panel">
                <p className="eyebrow">PUBLISH STAGE</p>
                <h2>Production Package</h2>
                <button
                  className="primary-button"
                  onClick={() => void exportProductionPackage()}
                >
                  Export Production Package
                </button>
              </div>
            ) : (
              <AIDirectorPanel project={project} onChange={setProject} />
            )}
          </aside>
        </main>
      )}

      {completionOpen && (
        <CompletionDialog
          onPublish={() => {
            setCompletionOpen(false);
            setActiveNav("Publish");
          }}
          onTemplates={() => {
            setCompletionOpen(false);
            setActiveNav("Library");
          }}
          onNew={() => {
            setCompletionOpen(false);
            void handleNewProject();
          }}
        />
      )}

      <footer className="statusbar">
        <span>CyberSlide Studio v3.0.0 Alpha 3</span>
        <span>{fileMessage}</span>
        <span>
          {activeRecommendation
            ? `Creative recommendation ready Ã‚Â· ${activeRecommendation.palette.name}`
            : "Creative Director ready"}
        </span>
      </footer>
    </div>
  );
}

export default App;
