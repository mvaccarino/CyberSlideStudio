import { useMemo, useState } from "react";
import "./App.css";
import {
  parseCyberSlideScript,
  type ParsedSlide,
} from "./parser/parseScript";

type NavItem = "Scripts" | "Slides" | "Themes" | "Export" | "Settings";

const starterScript = `Create the next cybersecurity slideshow using our standard template.

Slide 1

Title:
Why Password Managers Matter

Body:
No—you don't have to remember 200 different passwords.

Slide 2

Body:
Many people reuse passwords because it's easier. Unfortunately, if one website suffers a data breach, attackers often try that same password on other accounts.

Slide 3

Title:
Use a Password Manager

Body:
A password manager generates long, unique passwords and stores them securely, so you only need to remember one strong master password.`;

const emptySlide: ParsedSlide = {
  id: "empty-slide",
  number: 1,
  title: "",
  body: "",
  cta: "",
  notes: "",
  issues: [],
  isValid: false,
};

function App() {
  const [activeNav, setActiveNav] = useState<NavItem>("Scripts");
  const [script, setScript] = useState(starterScript);
  const parsed = useMemo(() => parseCyberSlideScript(script), [script]);
  const slides = parsed.slides;

  const [selectedSlideId, setSelectedSlideId] = useState(
    () => parsed.slides[0]?.id ?? emptySlide.id
  );
  const [theme, setTheme] = useState("Enterprise Cyber");
  const [layout, setLayout] = useState("Cinematic Hero");

  const wordCount = useMemo(() => {
    const trimmed = script.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [script]);

  const selectedSlide =
    slides.find((slide) => slide.id === selectedSlideId) ??
    slides[0] ??
    emptySlide;

  const issueCount =
    parsed.globalIssues.length +
    slides.reduce((total, slide) => total + slide.issues.length, 0);

  const validSlideCount = slides.filter((slide) => slide.isValid).length;

  const previewTitle = selectedSlide.title.trim().toUpperCase();

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
            <div className="brand-subtitle">AI Cybersecurity Content Studio</div>
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
            )
          )}
        </nav>

        <div className="topbar-actions">
          <span
            className={issueCount ? "status-dot warning" : "status-dot"}
            aria-hidden="true"
          />
          <span className="status-text">
            {slides.length} slides · {issueCount} issues
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
              <p className="eyebrow">SCRIPT WORKSPACE</p>
              <h1>Content Script</h1>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => setScript("")}
            >
              New
            </button>
          </div>

          <div className="script-toolbar">
            <span>Live parsing enabled</span>
            <span className="toolbar-divider" />
            <span>{wordCount} words</span>
          </div>

          <textarea
            className="script-editor"
            value={script}
            onChange={(event) => setScript(event.target.value)}
            spellCheck={false}
            aria-label="CyberSlide script editor"
          />

          <div className="editor-footer">
            <span>{script.length} characters</span>
            <span className="live-parser-badge">LIVE</span>
          </div>
        </aside>

        <section className="preview-column">
          <div className="preview-toolbar">
            <div>
              <p className="eyebrow">LIVE PREVIEW</p>
              <h2>
                Slide {selectedSlide.number} of {Math.max(slides.length, 1)}
              </h2>
            </div>

            <div className="zoom-control" aria-label="Preview zoom">
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

                <p className={!selectedSlide.body ? "missing-content" : ""}>
                  {selectedSlide.body || "Missing Body"}
                </p>

                {selectedSlide.cta && (
                  <div className="slide-cta">{selectedSlide.cta}</div>
                )}

                <div className="slide-accent-line" />
              </div>

              <div className="caption-safe-zone">
                <span>20% CAPTION-SAFE ZONE</span>
              </div>
            </div>
          </div>

          <div className="slide-strip">
            {slides.map((slide) => (
              <button
                key={slide.id}
                className={
                  selectedSlide.id === slide.id
                    ? `thumbnail active ${slide.isValid ? "" : "has-warning"}`
                    : `thumbnail ${slide.isValid ? "" : "has-warning"}`
                }
                type="button"
                onClick={() => setSelectedSlideId(slide.id)}
              >
                <span className="thumbnail-number">
                  {String(slide.number).padStart(2, "0")}
                </span>
                <span className="thumbnail-title">
                  {slide.title || "⚠ Missing Title"}
                </span>
              </button>
            ))}

            {!slides.length && (
              <div className="empty-strip-message">
                Start the script with “Slide 1”.
              </div>
            )}
          </div>
        </section>

        <aside className="right-panel panel validation-panel">
          <div className="panel-heading compact">
            <div>
              <p className="eyebrow">PARSER RESULTS</p>
              <h2>Validation</h2>
            </div>
            <span className={issueCount ? "validation-summary warning" : "validation-summary"}>
              {validSlideCount}/{slides.length || 0} valid
            </span>
          </div>

          {parsed.ignoredPreamble.length > 0 && (
            <div className="ignored-preamble">
              <strong>Preamble ignored</strong>
              <span>
                {parsed.ignoredPreamble.length} line
                {parsed.ignoredPreamble.length === 1 ? "" : "s"} before Slide 1
              </span>
            </div>
          )}

          {parsed.globalIssues.map((issue) => (
            <div className="global-error" key={issue.message}>
              <span>✕</span>
              <div>
                <strong>Script Error</strong>
                <p>{issue.message}</p>
              </div>
            </div>
          ))}

          <div className="validation-list">
            {slides.map((slide) => (
              <button
                key={slide.id}
                type="button"
                className={
                  selectedSlide.id === slide.id
                    ? "validation-item selected"
                    : "validation-item"
                }
                onClick={() => setSelectedSlideId(slide.id)}
              >
                <div className={slide.isValid ? "validation-icon ok" : "validation-icon warn"}>
                  {slide.isValid ? "✓" : "!"}
                </div>
                <div className="validation-copy">
                  <strong>
                    Slide {slide.number}: {slide.title || "Untitled"}
                  </strong>
                  {slide.isValid ? (
                    <span>Ready for rendering</span>
                  ) : (
                    slide.issues.map((issue) => (
                      <span key={`${issue.field}-${issue.message}`}>
                        {issue.message}
                      </span>
                    ))
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
                !selectedSlide.title ? "invalid-control" : ""
              }`}
              value={selectedSlide.title}
              placeholder="Missing Title"
              readOnly
            />
          </div>

          <div className="inspector-section">
            <label htmlFor="slide-body">Supporting text</label>
            <textarea
              id="slide-body"
              className={`control-textarea ${
                !selectedSlide.body ? "invalid-control" : ""
              }`}
              value={selectedSlide.body}
              placeholder="Missing Body"
              readOnly
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
        <span>CyberSlide Studio v0.3.0</span>
        <span>Strict Parser · Live Validation</span>
        <span>{issueCount ? `${issueCount} issues require attention` : "All slides valid"}</span>
      </footer>
    </div>
  );
}

export default App;
