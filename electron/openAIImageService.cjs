const API_URL = "https://api.openai.com/v1/images/generations";

function assertString(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`);
  }
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body?.error?.message || `OpenAI request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.requestId = response.headers.get("x-request-id") || undefined;
    throw error;
  }

  return body;
}

async function testConnection(apiKey) {
  assertString(apiKey, "OpenAI API key");
  const response = await fetch("https://api.openai.com/v1/models/gpt-image-2", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error?.message || `OpenAI connection failed (${response.status}).`);
  }
  return { connected: true, model: "gpt-image-2" };
}

async function generatePosters({ apiKey, prompt, count = 1, quality = "high", size = "1088x1920" }) {
  assertString(apiKey, "OpenAI API key");
  assertString(prompt, "Poster prompt");

  const safeCount = Math.max(1, Math.min(4, Number(count) || 1));
  const payload = {
    model: "gpt-image-2",
    prompt,
    n: safeCount,
    size,
    quality,
    output_format: "png",
    background: "opaque",
    moderation: "auto",
  };

  const body = await requestJson(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const images = Array.isArray(body.data) ? body.data : [];
  if (!images.length) throw new Error("OpenAI returned no poster images.");

  return images.map((item, index) => {
    if (!item?.b64_json) throw new Error(`Poster ${index + 1} contained no image data.`);
    return { base64: item.b64_json, revisedPrompt: item.revised_prompt || null };
  });
}

module.exports = { testConnection, generatePosters };
