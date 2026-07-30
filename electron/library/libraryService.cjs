const fs = require("node:fs/promises");
const path = require("node:path");

const CATEGORY_FOLDERS = ["Cybersecurity", "AI", "SmallBusiness", "Privacy", "FamilySafety", "ITManagement"];
const STRING_FIELDS = [
  "id", "title", "category", "description", "difficulty", "audience",
  "productionStyle", "cameraStyle", "captionStyle", "musicStyle", "voiceStyle",
  "effectsStyle", "thumbnailTitle", "youtubeTitle", "youtubeDescription",
  "tiktokCaption", "instagramCaption", "posterPrompt", "hook", "voiceScript", "version",
  "author", "created", "modified",
];

function validateTemplate(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["Template must be a JSON object."];
  for (const field of STRING_FIELDS) {
    if (typeof value[field] !== "string" || !value[field].trim()) errors.push(`${field} must be a non-empty string.`);
  }
  if (!Number.isFinite(value.estimatedSeconds) || value.estimatedSeconds <= 0) errors.push("estimatedSeconds must be a positive number.");
  for (const field of ["hashtags", "tags"]) {
    if (!Array.isArray(value[field]) || value[field].some((entry) => typeof entry !== "string")) errors.push(`${field} must be an array of strings.`);
  }
  if (!Array.isArray(value.slides) || !value.slides.length) errors.push("slides must be a non-empty array.");
  else value.slides.forEach((slide, index) => {
    if (!slide || typeof slide !== "object" || Array.isArray(slide)) errors.push(`slides[${index}] must be an object.`);
    else for (const field of ["title", "body", "cta"]) if (typeof slide[field] !== "string") errors.push(`slides[${index}].${field} must be a string.`);
  });
  return errors;
}

async function ensureLibrary(root) {
  if (typeof root !== "string" || !path.isAbsolute(root)) throw new Error("Content Library root must be an absolute path.");
  await fs.mkdir(root, { recursive: true });
  await Promise.all(CATEGORY_FOLDERS.map((folder) => fs.mkdir(path.join(root, folder), { recursive: true })));
  return root;
}

async function listJsonFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return listJsonFiles(target);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".json") ? [target] : [];
  }));
  return nested.flat();
}

async function scanLibrary(root) {
  await ensureLibrary(root);
  const templates = [];
  const errors = [];
  for (const filePath of await listJsonFiles(root)) {
    try {
      const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
      const validation = validateTemplate(parsed);
      if (validation.length) errors.push({ filePath, errors: validation });
      else templates.push(parsed);
    } catch (error) {
      errors.push({ filePath, errors: [`Invalid JSON: ${error.message}`] });
    }
  }
  templates.sort((a, b) => a.title.localeCompare(b.title));
  return { root, templates, errors };
}

function defaultActivity() { return { favorites: [], recentlyUsed: [] }; }
async function readActivity(filePath) {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((id) => typeof id === "string") : [],
      recentlyUsed: Array.isArray(parsed.recentlyUsed) ? parsed.recentlyUsed.filter((item) => item && typeof item.id === "string" && typeof item.usedAt === "string").slice(0, 30) : [],
    };
  } catch (error) {
    if (error.code === "ENOENT") return defaultActivity();
    throw new Error(`Unable to read Content Library activity: ${error.message}`);
  }
}
async function writeActivity(filePath, state) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  return state;
}
async function toggleFavorite(filePath, id) {
  if (typeof id !== "string" || !id.trim()) throw new Error("A valid template id is required.");
  const state = await readActivity(filePath);
  state.favorites = state.favorites.includes(id) ? state.favorites.filter((item) => item !== id) : [...state.favorites, id];
  return writeActivity(filePath, state);
}
async function recordUsed(filePath, id) {
  if (typeof id !== "string" || !id.trim()) throw new Error("A valid template id is required.");
  const state = await readActivity(filePath);
  state.recentlyUsed = [{ id, usedAt: new Date().toISOString() }, ...state.recentlyUsed.filter((item) => item.id !== id)].slice(0, 30);
  return writeActivity(filePath, state);
}

module.exports = { CATEGORY_FOLDERS, ensureLibrary, scanLibrary, validateTemplate, readActivity, toggleFavorite, recordUsed };
