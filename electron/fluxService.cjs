const FLUX_API_BASE = "https://api.bfl.ai";

function getErrorMessage(data, status) {
  const detail = data?.detail ?? data?.message ?? data?.error;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;

        if (item?.msg) {
          const location = Array.isArray(item.loc)
            ? item.loc.join(".")
            : "";

          return location ? `${location}: ${item.msg}` : item.msg;
        }

        return JSON.stringify(item);
      })
      .join("; ");
  }

  if (detail && typeof detail === "object") {
    return JSON.stringify(detail);
  }

  return `FLUX request failed with status ${status}.`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      `FLUX request failed with status ${response.status}.`;

    throw new Error(getErrorMessage(data, response.status));
  }

  return data;
}

async function testConnection(apiKey) {
  if (!apiKey) {
    throw new Error("FLUX API key is missing.");
  }

  const result = await requestJson(`${FLUX_API_BASE}/v1/credits`, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-key": apiKey,
    },
  });

  return {
    connected: true,
    credits: result.credits,
  };
}

async function submitGeneration({
  apiKey,
  prompt,
  width = 1080,
  height = 1920,
  model = "flux-pro-1.1",
}) {
  if (!apiKey) {
    throw new Error("FLUX API key is missing.");
  }

  if (!prompt?.trim()) {
    throw new Error("A FLUX prompt is required.");
  }

  return requestJson(`${FLUX_API_BASE}/v1/${model}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-key": apiKey,
    },
    body: JSON.stringify({
      prompt: prompt.trim(),
      width,
      height,
      output_format: "png",
      safety_tolerance: 2,
    }),
  });
}

async function getGenerationResult({ apiKey, pollingUrl }) {
  if (!apiKey) {
    throw new Error("FLUX API key is missing.");
  }

  if (!pollingUrl) {
    throw new Error("A FLUX polling URL is required.");
  }

  return requestJson(pollingUrl, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-key": apiKey,
    },
  });
}

async function waitForGeneration({
  apiKey,
  pollingUrl,
  intervalMs = 1500,
  timeoutMs = 180000,
}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await getGenerationResult({
      apiKey,
      pollingUrl,
    });

    if (result.status === "Ready") {
      if (!result.result?.sample) {
        throw new Error("FLUX finished but returned no image URL.");
      }

      return result;
    }

    if (
      result.status === "Error" ||
      result.status === "Failed" ||
      result.status === "Request Moderated" ||
      result.status === "Content Moderated"
    ) {
      throw new Error(
        result.error ||
          result.details?.error ||
          `FLUX generation ended with status: ${result.status}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("FLUX generation timed out.");
}

module.exports = {
  testConnection,
  submitGeneration,
  getGenerationResult,
  waitForGeneration,
};