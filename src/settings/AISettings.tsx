import { useEffect, useState } from "react";

type State = "idle" | "saving" | "testing" | "success" | "error";

export function AISettings() {
  const [apiKey, setApiKey] = useState("");
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [status, setStatus] = useState<State>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => { void window.cyberSlideStudio.hasOpenAIApiKey().then(setHasSavedKey); }, []);

  const saveKey = async () => {
    if (!apiKey.trim()) { setStatus("error"); setMessage("Enter your OpenAI API key."); return; }
    try {
      setStatus("saving"); setMessage("Saving API key securely...");
      await window.cyberSlideStudio.saveOpenAIApiKey(apiKey.trim());
      setHasSavedKey(true); setApiKey(""); setStatus("success"); setMessage("OpenAI API key saved securely.");
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Unable to save API key."); }
  };

  const testConnection = async () => {
    try {
      setStatus("testing"); setMessage("Testing GPT Image connection...");
      const result = await window.cyberSlideStudio.testOpenAIConnection();
      setStatus("success"); setMessage(`Connected to ${result.model}.`);
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "OpenAI connection failed."); }
  };

  return <section className="ai-settings-panel">
    <div><p className="eyebrow">AI SETTINGS</p><h2>OpenAI Images</h2></div>
    <div className="ai-settings-card">
      <label htmlFor="openai-api-key">API Key</label>
      <input id="openai-api-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={hasSavedKey ? "API key saved securely" : "Paste OpenAI API key"} autoComplete="off" />
      <div className="ai-settings-actions">
        <button type="button" className="secondary-button" onClick={saveKey} disabled={status === "saving"}>{status === "saving" ? "Saving..." : "Save API Key"}</button>
        <button type="button" className="primary-button" onClick={testConnection} disabled={!hasSavedKey || status === "testing"}>{status === "testing" ? "Testing..." : "Test GPT Image"}</button>
      </div>
      {message && <div className={`ai-settings-status ${status}`}>{message}</div>}
      <p className="settings-help">The key stays in CyberSlide Studio's secure store and is only used by the Electron main process.</p>
    </div>
  </section>;
}
