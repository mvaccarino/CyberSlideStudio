import { useMemo, useState } from "react";
import "./App.css";

type NavItem = "Scripts" | "Slides" | "Themes" | "Export" | "Settings";

const starterScript = `Slide 1

Title:
Protect Your Passwords

Body:
Stop reusing passwords across multiple accounts.

Slide 2

Title:
One Breach. Every Account.

Body:
A single leaked password can expose your email, banking, and social accounts.`;

function App() {
  const [activeNav, setActiveNav] = useState<NavItem>("Scripts");
  const [script, setScript] = useState(starterScript);
  const [title, setTitle] = useState("PROTECT YOUR\nPASSWORDS");
  const [body, setBody] = useState("Stop reusing passwords across multiple accounts.");
  const [theme, setTheme] = useState("Enterprise Cyber");
  const [layout, setLayout] = useState("Cinematic Hero");

  const wordCount = useMemo(() => {
    const trimmed = script.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [script]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <div className="brand-title">CyberSlide Studio</div>
            <div className="brand-subtitle">AI Cybersecurity Content Studio</div>
          </div>
        </div>

        <nav className="main-nav" aria-label="Primary navigation">
          {(["Scripts", "Slides", "Themes", "Export", "Settings"] as NavItem[]).map((item) => (
            <button key={item} type="button" className={activeNav === item ? "nav-button active" : "nav-button"} onClick={() => setActiveNav(item)}>
              {item}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <span className="status-dot" aria-hidden="true" />
          <span className="status-text">Project ready</span>
          <button className="primary-button" type="button">Generate Slides</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="left-panel panel">
          <div className="panel-heading">
            <div><p className="eyebrow">SCRIPT WORKSPACE</p><h1>Content Script</h1></div>
            <button className="ghost-button" type="button">New</button>
          </div>

          <div className="script-toolbar">
            <span>Cybersecurity Short</span><span className="toolbar-divider" /><span>{wordCount} words</span>
          </div>

          <textarea className="script-editor" value={script} onChange={(event) => setScript(event.target.value)} spellCheck={false} aria-label="CyberSlide script editor" />

          <div className="editor-footer">
            <span>{script.length} characters</span>
            <button className="secondary-button" type="button">Parse Script</button>
          </div>
        </aside>

        <section className="preview-column">
          <div className="preview-toolbar">
            <div><p className="eyebrow">LIVE PREVIEW</p><h2>Slide 1 of 2</h2></div>
            <div className="zoom-control" aria-label="Preview zoom"><button type="button">−</button><span>38%</span><button type="button">+</button></div>
          </div>

          <div className="preview-stage">
            <div className="slide-frame">
              <div className="slide-grid" />
              <div className="slide-orb orb-one" />
              <div className="slide-orb orb-two" />
              <div className="scan-line" />
              <div className="slide-content">
                <div className="slide-kicker"><span className="kicker-dot" />CYBERSECURITY AWARENESS</div>
                <h3>{title.split("\n").map((line) => <span key={line}>{line}</span>)}</h3>
                <p>{body}</p>
                <div className="slide-accent-line" />
              </div>
              <div className="caption-safe-zone"><span>20% CAPTION-SAFE ZONE</span></div>
            </div>
          </div>

          <div className="slide-strip">
            <button className="thumbnail active" type="button"><span className="thumbnail-number">01</span><span className="thumbnail-title">Protect Your Passwords</span></button>
            <button className="thumbnail" type="button"><span className="thumbnail-number">02</span><span className="thumbnail-title">One Breach</span></button>
            <button className="add-slide" type="button" aria-label="Add slide">+</button>
          </div>
        </section>

        <aside className="right-panel panel">
          <div className="panel-heading compact"><div><p className="eyebrow">DESIGN INSPECTOR</p><h2>Slide Settings</h2></div></div>

          <div className="inspector-section"><label htmlFor="slide-title">Headline</label><textarea id="slide-title" className="control-textarea title-control" value={title} onChange={(event) => setTitle(event.target.value)} /></div>
          <div className="inspector-section"><label htmlFor="slide-body">Supporting text</label><textarea id="slide-body" className="control-textarea" value={body} onChange={(event) => setBody(event.target.value)} /></div>

          <div className="inspector-grid">
            <div className="inspector-section"><label htmlFor="theme-select">Theme</label><select id="theme-select" value={theme} onChange={(event) => setTheme(event.target.value)}><option>Enterprise Cyber</option><option>Minimal Dark</option><option>Security Operations</option><option>Modern Technology</option></select></div>
            <div className="inspector-section"><label htmlFor="layout-select">Layout</label><select id="layout-select" value={layout} onChange={(event) => setLayout(event.target.value)}><option>Cinematic Hero</option><option>Split Statement</option><option>Bold Warning</option><option>Minimal CTA</option></select></div>
          </div>

          <div className="inspector-section"><div className="section-row"><label>Accent color</label><span className="value-chip">#20D7FF</span></div><div className="color-options">{["cyan", "blue", "violet", "green", "red"].map((color) => <button key={color} type="button" className={`color-swatch ${color} ${color === "cyan" ? "selected" : ""}`} aria-label={`${color} accent`} />)}</div></div>

          <div className="inspector-section"><div className="section-row"><label>Caption-safe zone</label><span className="value-chip">20%</span></div><input type="range" min="10" max="35" defaultValue="20" /></div>

          <div className="inspector-section"><div className="section-row"><label>Background artwork</label><button className="text-button" type="button">Replace</button></div><div className="background-card"><div className="background-preview" /><div><strong>Cyber grid environment</strong><span>AI background placeholder</span></div></div></div>

          <div className="inspector-actions"><button className="secondary-button full-width" type="button">Duplicate Slide</button><button className="primary-button full-width" type="button">Apply Changes</button></div>
        </aside>
      </main>

      <footer className="statusbar"><span>CyberSlide Studio v0.1.0</span><span>1080 × 1920 vertical canvas</span><span>Auto-save enabled</span></footer>
    </div>
  );
}

export default App;
