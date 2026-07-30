import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentLibrary } from "./ContentLibrary";
import { TemplateLoader } from "./TemplateLoader";
import type { ProductionTemplate, TemplateFilters } from "./types";
import { loadBrandSettings } from "../brand/BrandSettingsService";
import type { CtaPreference } from "../brand/BrandCTAEngine";

type Props = {
  onCreateProject: (
    template: ProductionTemplate,
    ctaPreference: CtaPreference,
  ) => void;
};
type View = "all" | "favorites" | "recent" | "added";

export function ContentLibraryScreen({ onCreateProject }: Props) {
  const [library] = useState(() => new ContentLibrary());
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState(
    () => localStorage.getItem("cyberslide:library-search") || "",
  );
  const [filters, setFilters] = useState<TemplateFilters>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("cyberslide:library-filters") || "{}",
      );
    } catch {
      return {};
    }
  });
  const [selected, setSelected] = useState<ProductionTemplate | null>(null);
  const [view, setView] = useState<View>(
    () => (localStorage.getItem("cyberslide:library-view") as View) || "all",
  );
  const [status, setStatus] = useState("Loading Content Libraryâ€¦");

  const reload = useCallback(() => {
    void library
      .load()
      .then(() => {
        setRevision((value) => value + 1);
        setStatus(`${library.index.all().length} production templates ready`);
      })
      .catch((error: unknown) =>
        setStatus(
          error instanceof Error
            ? error.message
            : "Unable to load Content Library.",
        ),
      );
  }, [library]);
  useEffect(() => {
    reload();
  }, [reload]);
  useEffect(() => {
    localStorage.setItem("cyberslide:library-search", query);
  }, [query]);
  useEffect(() => {
    localStorage.setItem("cyberslide:library-filters", JSON.stringify(filters));
  }, [filters]);
  useEffect(() => {
    localStorage.setItem("cyberslide:library-view", view);
  }, [view]);

  const templates = useMemo(() => {
    if (revision < 0) return [];
    let items = library.search(query, filters);
    if (view === "favorites")
      items = items.filter((item) =>
        library.activity.favorites.includes(item.id),
      );
    if (view === "recent") {
      const order = new Map(
        library.activity.recentlyUsed.map((item, index) => [item.id, index]),
      );
      items = items
        .filter((item) => order.has(item.id))
        .sort((a, b) => Number(order.get(a.id)) - Number(order.get(b.id)));
    }
    if (view === "added")
      items = [...items].sort(
        (a, b) => Date.parse(b.modified) - Date.parse(a.modified),
      );
    return items;
  }, [library, query, filters, view, revision]);

  const setFilter = (key: keyof TemplateFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  const create = async (template: ProductionTemplate) => {
    await library.used(template.id);
    setRevision((value) => value + 1);
    const templateCTA = template.slides.at(-1)?.cta.trim() || "";
    const defaultCTA = loadBrandSettings().defaultCTA.trim();
    const ctaPreference: CtaPreference =
      templateCTA &&
      templateCTA !== defaultCTA &&
      window.confirm(
        "Use Template CTA?`n`nOK: Use Template CTA`nCancel: Replace with Default Brand CTA",
      )
        ? "template"
        : "default";
    onCreateProject(template, ctaPreference);
  };

  return (
    <div className="content-library-screen">
      <header className="library-header">
        <div>
          <p className="eyebrow">PRODUCTION TEMPLATE SYSTEM</p>
          <h1>Content Library</h1>
          <p>
            {status}
            {library.validationErrors.length
              ? ` Â· ${library.validationErrors.length} invalid file(s) skipped`
              : ""}
          </p>
        </div>
        <div>
          <button
            className="ghost-button"
            onClick={() => void TemplateLoader.openFolder()}
          >
            Open Folder
          </button>
          <button className="secondary-button" onClick={() => void reload()}>
            Rescan
          </button>
        </div>
      </header>
      <div className="library-tools">
        <input
          aria-label="Search templates"
          placeholder="Search titles, scripts, slides, prompts, or tagsâ€¦"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {(
          ["category", "difficulty", "audience", "productionStyle"] as const
        ).map((field) => (
          <select
            key={field}
            aria-label={`Filter by ${field}`}
            value={String(filters[field] ?? "")}
            onChange={(event) => setFilter(field, event.target.value)}
          >
            <option value="">
              All {field === "productionStyle" ? "styles" : field}
            </option>
            {library.index.facets(field).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        ))}
        <select
          aria-label="Filter by length"
          value={filters.maxEstimatedSeconds ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              maxEstimatedSeconds: event.target.value
                ? Number(event.target.value)
                : undefined,
            }))
          }
        >
          <option value="">Any length</option>
          <option value="60">Up to 60 sec</option>
          <option value="90">Up to 90 sec</option>
        </select>
      </div>
      <nav className="library-tabs">
        {(["all", "favorites", "recent", "added"] as View[]).map((item) => (
          <button
            key={item}
            className={view === item ? "active" : ""}
            onClick={() => setView(item)}
          >
            {item === "recent"
              ? "Recently Used"
              : item === "added"
                ? "Recently Added"
                : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>
      <main className="library-grid">
        {templates.map((template) => (
          <article
            className="template-card"
            key={template.id}
            onDoubleClick={() => void create(template)}
          >
            <div className="template-thumbnail">
              <span>{template.thumbnailTitle}</span>
            </div>
            <div className="template-card-body">
              <small>{template.category}</small>
              <h2>{template.title}</h2>
              <dl>
                <div>
                  <dt>Difficulty</dt>
                  <dd>{template.difficulty}</dd>
                </div>
                <div>
                  <dt>Length</dt>
                  <dd>{template.estimatedSeconds}s</dd>
                </div>
                <div>
                  <dt>Style</dt>
                  <dd>{template.productionStyle}</dd>
                </div>
                <div>
                  <dt>Audience</dt>
                  <dd>{template.audience}</dd>
                </div>
              </dl>
              <div className="template-actions">
                <button onClick={() => setSelected(template)}>Preview</button>
                <button
                  className="primary-button"
                  onClick={() => void create(template)}
                >
                  Create Project
                </button>
                <button
                  aria-label={`Favorite ${template.title}`}
                  className={
                    library.activity.favorites.includes(template.id)
                      ? "favorite active"
                      : "favorite"
                  }
                  onClick={async () => {
                    await library.favorite(template.id);
                    setRevision((value) => value + 1);
                  }}
                >
                  â˜…
                </button>
              </div>
            </div>
          </article>
        ))}
        {!templates.length && (
          <p className="library-empty">
            No templates match the current search and filters.
          </p>
        )}
      </main>
      {selected && (
        <div
          className="template-preview-backdrop"
          onClick={() => setSelected(null)}
        >
          <section
            className="template-preview"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="preview-close" onClick={() => setSelected(null)}>
              Ã—
            </button>
            <p className="eyebrow">{selected.category}</p>
            <h1>{selected.title}</h1>
            <h3>Hook</h3>
            <p>{selected.hook}</p>
            <h3>Voice Script</h3>
            <p className="preview-script">{selected.voiceScript}</p>
            <h3>Slides</h3>
            <ol>
              {selected.slides.map((slide) => (
                <li key={slide.title}>
                  <strong>{slide.title}</strong>
                  <span>{slide.body}</span>
                </li>
              ))}
            </ol>
            <h3>Poster Prompt</h3>
            <p>{selected.posterPrompt}</p>
            <div className="preview-suggestions">
              <span>
                <b>Music</b>
                {selected.musicStyle}
              </span>
              <span>
                <b>Motion</b>
                {selected.cameraStyle}
              </span>
              <span>
                <b>Production Style</b>
                {selected.productionStyle}
              </span>
            </div>
            <button
              className="primary-button"
              onClick={() => void create(selected)}
            >
              Create Project
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
