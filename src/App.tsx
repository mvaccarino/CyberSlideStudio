import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { parseCyberSlideScript } from "./parser/parseScript";
import {
  deserializeProject,
  projectNameFromPath,
  serializeProject,
} from "./services/ProjectFileService";
import {
  projectSlidesToScript,
  scriptToProjectSlides,
} from "./services/ScriptService";
import { useProjectStore } from "./state/useProjectStore";
import type { ProjectMenuAction } from "./types/electron";

type NavItem = "Scripts" | "Slides" | "Themes" | "Export" | "Settings";

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
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [fileMessage, setFileMessage] = useState("Ready");

  const currentScript = project.script || starterScript;
  const parserResult = useMemo(
    () => parseCyberSlideScript(currentScript),
    [currentScript],
  );

  const effectiveSlides = project.script
    ? project.slides
    : scriptToProjectSlides(starterScript, project.slides).slides;

  const activeSlide =
    effectiveSlides.find((slide) => slide.id === selectedSlideId) ??
    effectiveSlides[0] ??
    selectedSlide;

  const wordCount = currentScript.trim()
    ? currentScript.trim().split(/\s+/).length
    : 0;

  const issueCount =
    parserResult.globalIssues.length +
    effectiveSlides.reduce(
      (total, slide) => total + slide.validation.length,
      0,
    );

  const validSlideCount = effectiveSlides.filter(
    (slide) => slide.validation.length === 0,
  ).length;

  const projectForPersistence = useMemo(
    () => ({
      ...project,
      script: currentScript,
      slides: effectiveSlides,
    }),
    [project, currentScript, effectiveSlides],
  );

  const handleNewProject = useCallback(async () => {
    createNewProject();
    await window.cyberSlideStudio.clearCurrentProjectPath();
    setCurrentFilePath(null);
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

  const handleSlideFieldChange = (
    field: "title" | "body" | "cta" | "notes",
    value: string,
  ) => {
    if (!activeSlide) return;

    const updatedSlides = effectiveSlides.map((slide) =>
      slide.id === activeSlide.id
        ? {
            ...slide,
            [field]: value,
            validation: slide.validation.filter(
              (issue) => issue.field !== field,
            ),
            updatedAt: new Date().toISOString(),
          }
        : slide,
    );

    const preamble = parseCyberSlideScript(currentScript).ignoredPreamble;
    const nextScript = projectSlidesToScript(updatedSlides, preamble);
    const normalized = scriptToProjectSlides(nextScript, updatedSlides);

    setScriptAndSlides(nextScript, normalized.slides);
  };

  const previewTitle = activeSlide?.title.trim().toUpperCase() ?? "";

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
              {project.name} {isDirty ? "• Unsaved" : "• Saved"}
            </div>
          </div>
        </div>

        <nav className="main-nav" aria-label="Primary navigation">
          {(["Scripts", "Slides", "Themes", "Export", "Settings"] as NavItem[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                className={activeNav === item ? "nav-button active" : "nav-button"}
                onClick={() => setActiveNav(item)}
              >
                {item}
              </button>
            ),
          )}
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
          <button className="primary-button" type="button">
            Generate Slides
          </button>
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
            <span className="live-parser-badge">.CSLIDE</span>
          </div>
        </aside>

        <section className="preview-column">
          <div className="preview-toolbar">
            <div>
              <p className="eyebrow">LIVE PREVIEW</p>
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
            <div className="slide-frame">
              <div className="slide-grid" />
              <div className="slide-orb orb-one" />
              <div className="slide-orb orb-two" />
              <div className="scan-line" />

              <div className="slide-content">
                <div className="slide-kicker">
                  <span className="kicker-dot" />
                  CYBERSECURITY AWARENESS
                </div>

                <h3 className={!previewTitle ? "missing-content" : ""}>
                  {(previewTitle || "MISSING TITLE")
                    .split(/\s+/)
                    .map((word, index) => (
                      <span key={`${word}-${index}`}>{word}</span>
                    ))}
                </h3>

                <p className={!activeSlide?.body ? "missing-content" : ""}>
                  {activeSlide?.body || "Missing Body"}
                </p>

                {activeSlide?.cta && (
                  <div className="slide-cta">{activeSlide.cta}</div>
                )}

                <div className="slide-accent-line" />
              </div>

              <div className="caption-safe-zone">
                <span>20% CAPTION-SAFE ZONE</span>
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
              >
                <span className="thumbnail-number">
                  {String(slide.number).padStart(2, "0")}
                </span>
                <span className="thumbnail-title">
                  {slide.title || "⚠ Missing Title"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="right-panel panel validation-panel">
          <div className="panel-heading compact">
            <div>
              <p className="eyebrow">PROJECT VALIDATION</p>
              <h2>Slide Inspector</h2>
            </div>
            <span
              className={
                issueCount
                  ? "validation-summary warning"
                  : "validation-summary"
              }
            >
              {validSlideCount}/{effectiveSlides.length || 0} valid
            </span>
          </div>

          <div className="validation-list">
            {effectiveSlides.map((slide) => (
              <button
                key={slide.id}
                type="button"
                className={
                  activeSlide?.id === slide.id
                    ? "validation-item selected"
                    : "validation-item"
                }
                onClick={() => selectSlide(slide.id)}
              >
                <div
                  className={
                    slide.validation.length
                      ? "validation-icon warn"
                      : "validation-icon ok"
                  }
                >
                  {slide.validation.length ? "!" : "✓"}
                </div>
                <div className="validation-copy">
                  <strong>
                    Slide {slide.number}: {slide.title || "Untitled"}
                  </strong>
                  {slide.validation.length ? (
                    slide.validation.map((issue) => (
                      <span key={issue.id}>{issue.message}</span>
                    ))
                  ) : (
                    <span>Ready for rendering</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="inspector-divider" />

          <div className="inspector-section">
            <label htmlFor="slide-title">Headline</label>
            <textarea
              id="slide-title"
              className={`control-textarea title-control ${
                !activeSlide?.title ? "invalid-control" : ""
              }`}
              value={activeSlide?.title ?? ""}
              placeholder="Missing Title"
              onChange={(event) =>
                handleSlideFieldChange("title", event.target.value)
              }
              disabled={!activeSlide}
            />
          </div>

          <div className="inspector-section">
            <label htmlFor="slide-body">Supporting text</label>
            <textarea
              id="slide-body"
              className={`control-textarea ${
                !activeSlide?.body ? "invalid-control" : ""
              }`}
              value={activeSlide?.body ?? ""}
              placeholder="Missing Body"
              onChange={(event) =>
                handleSlideFieldChange("body", event.target.value)
              }
              disabled={!activeSlide}
            />
          </div>

          <div className="inspector-section">
            <label htmlFor="slide-cta">CTA</label>
            <textarea
              id="slide-cta"
              className="control-textarea compact-control"
              value={activeSlide?.cta ?? ""}
              placeholder="Optional CTA"
              onChange={(event) =>
                handleSlideFieldChange("cta", event.target.value)
              }
              disabled={!activeSlide}
            />
          </div>

          <div className="inspector-grid">
            <div className="inspector-section">
              <label htmlFor="theme-select">Theme</label>
              <select
                id="theme-select"
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
              >
                <option>Enterprise Cyber</option>
                <option>Minimal Dark</option>
                <option>Security Operations</option>
                <option>Modern Technology</option>
              </select>
            </div>

            <div className="inspector-section">
              <label htmlFor="layout-select">Layout</label>
              <select
                id="layout-select"
                value={layout}
                onChange={(event) => setLayout(event.target.value)}
              >
                <option>Cinematic Hero</option>
                <option>Split Statement</option>
                <option>Bold Warning</option>
                <option>Minimal CTA</option>
              </select>
            </div>
          </div>
        </aside>
      </main>

      <footer className="statusbar">
        <span>CyberSlide Studio v0.6.0</span>
        <span>{fileMessage}</span>
        <span>{isDirty ? "Unsaved project changes" : "Project saved"}</span>
      </footer>
    </div>
  );
}

export default App;
