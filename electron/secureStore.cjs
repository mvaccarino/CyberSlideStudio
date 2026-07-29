const { app, safeStorage } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const STORE_FILENAME = "secure-settings.json";

function getStorePath() {
  return path.join(app.getPath("userData"), STORE_FILENAME);
}

async function readStore() {
  try {
    const contents = await fs.readFile(getStorePath(), "utf8");
    const parsed = JSON.parse(contents);

    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }

    throw new Error(`Unable to read secure settings: ${error.message}`);
  }
}

async function writeStore(store) {
  const storePath = getStorePath();

  await fs.mkdir(path.dirname(storePath), {
    recursive: true,
  });

  await fs.writeFile(storePath, JSON.stringify(store, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
}

function encryptValue(value) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure credential encryption is unavailable.");
  }

  return safeStorage.encryptString(value).toString("base64");
}

function decryptValue(value) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure credential encryption is unavailable.");
  }

  return safeStorage.decryptString(Buffer.from(value, "base64"));
}

async function setSecret(key, value) {
  if (typeof key !== "string" || !key.trim()) {
    throw new TypeError("A valid secret key name is required.");
  }

  if (typeof value !== "string") {
    throw new TypeError("Secret values must be strings.");
  }

  const store = await readStore();

  if (!value.trim()) {
    delete store[key];
  } else {
    store[key] = encryptValue(value.trim());
  }

  await writeStore(store);
}

async function getSecret(key) {
  if (typeof key !== "string" || !key.trim()) {
    throw new TypeError("A valid secret key name is required.");
  }

  const store = await readStore();
  const encryptedValue = store[key];

  if (typeof encryptedValue !== "string" || !encryptedValue) {
    return null;
  }

  try {
    return decryptValue(encryptedValue);
  } catch {
    throw new Error(`Unable to decrypt the saved secret "${key}".`);
  }
}

async function hasSecret(key) {
  const store = await readStore();
  return typeof store[key] === "string" && store[key].length > 0;
}

async function deleteSecret(key) {
  const store = await readStore();

  if (key in store) {
    delete store[key];
    await writeStore(store);
  }
}

module.exports = {
  setSecret,
  getSecret,
  hasSecret,
  deleteSecret,
};