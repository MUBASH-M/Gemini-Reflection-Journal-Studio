import React, { useState } from "react";
import {
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RefreshCw,
  Clock,
  Code,
  Check,
  Copy,
} from "lucide-react";
import { GenerationResult, FallbackAttempt } from "../types";

const LADDER_MODELS = [
  { id: "gemini-3.6-flash", role: "Primary Endpoint", desc: "Lowest latency standard production inference", speed: "Ultra Fast" },
  { id: "gemini-3.1-flash-lite", role: "High-Availability Fallback", desc: "Lightweight fallback tier for burst traffic & 503 recovery", speed: "Instantaneous" },
  { id: "gemini-flash-latest", role: "Dynamic Alias", desc: "Auto-updating canonical flash model alias", speed: "Balanced" },
  { id: "gemini-3.7-flash", role: "Deep Reasoning Fallback", desc: "High-capacity reasoning engine for complex synthesis", speed: "Deep Inference" },
];

export const ModelFallbackPlayground: React.FC = () => {
  const [prompt, setPrompt] = useState(
    "Explain how owner-bound Firestore security rules prevent cross-user data tampering in multi-tenant LLM apps."
  );
  const [forceFailures, setForceFailures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const toggleForceFailure = (modelId: string) => {
    setForceFailures((prev) =>
      prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
    );
  };

  const handleExecutePrompt = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          forceFailureModels: forceFailures,
        }),
      });
      const data: GenerationResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyHelper = () => {
    const code = `// Standard Gemini Model Fallback Helper
import { GoogleGenAI } from "@google/genai";

const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",      // 1. Primary
  "gemini-3.1-flash-lite", // 2. High-Availability Fallback
  "gemini-flash-latest",   // 3. Dynamic Alias
  "gemini-3.7-flash",      // 4. Deep Reasoning Fallback
] as const;

export async function generateContentWithFallback(ai: GoogleGenAI, contents: string) {
  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({ model, contents });
      if (response.text?.trim()) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(\`[Fallback Ladder] \${model} failed (\${err.message}). Retrying next model...\`);
    }
  }
  throw new Error("All models in the fallback ladder were exhausted.");
}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Directives Context */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs tracking-wider uppercase">
              <Cpu className="w-4 h-4 text-emerald-700" />
              <span>Directive 6: Gemini Model Resilience & Fallback Protocol</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mt-1">
              Zero-Downtime Model Fallback Ladder
            </h1>
            <p className="text-sm text-stone-600 mt-1 max-w-3xl">
              Automatic sequential failover across the 4-tier model ladder with error recovery matrix catching{" "}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono text-xs">503 UNAVAILABLE</code>,{" "}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono text-xs">429 RESOURCE_EXHAUSTED</code>,{" "}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono text-xs">404</code>, and{" "}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono text-xs">500</code>.
            </p>
          </div>

          <button
            id="copy-helper-btn"
            onClick={handleCopyHelper}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors font-medium cursor-pointer shrink-0"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Code className="w-4 h-4" />}
            <span>{copiedCode ? "Copied Helper Code" : "Copy Fallback Ladder Helper"}</span>
          </button>
        </div>
      </div>

      {/* Model Ladder Hierarchy Visualizer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {LADDER_MODELS.map((model, idx) => {
          const isForcedFailed = forceFailures.includes(model.id);
          const isResolved = result?.modelUsed === model.id;

          return (
            <div
              key={model.id}
              className={`p-4 rounded-xl border transition-all ${
                isResolved
                  ? "bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20"
                  : isForcedFailed
                  ? "bg-rose-50/60 border-rose-300"
                  : "bg-white border-stone-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-stone-500 font-mono">
                  Tier 0{idx + 1}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isResolved
                      ? "bg-emerald-200 text-emerald-900"
                      : isForcedFailed
                      ? "bg-rose-200 text-rose-900"
                      : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {isResolved ? "RESOLVED" : isForcedFailed ? "SIMULATING 503" : model.speed}
                </span>
              </div>

              <h4 className="font-mono text-sm font-bold text-stone-900">{model.id}</h4>
              <div className="text-xs font-medium text-emerald-800 mt-0.5">{model.role}</div>
              <p className="text-[11px] text-stone-500 mt-1 leading-normal">{model.desc}</p>

              {/* Simulation Toggle */}
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11px] text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isForcedFailed}
                    onChange={() => toggleForceFailure(model.id)}
                    className="rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Inject 503 Outage</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Test Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              Test Prompt for Fallback Ladder Execution
            </label>
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              aria-label="Prompt Input"
              className="w-full text-xs font-mono p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Enter prompt to execute..."
            />

            <div className="mt-3 text-xs text-stone-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {forceFailures.length === 0
                  ? "Normal operation: Primary model (gemini-3.6-flash) executes."
                  : `Simulating outage on ${forceFailures.length} model(s). Ladder will auto-failover.`}
              </span>
            </div>

            <button
              id="execute-fallback-btn"
              onClick={handleExecutePrompt}
              disabled={isLoading || !prompt.trim()}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Traversing Model Ladder...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Execute with Fallback Ladder</span>
                </>
              )}
            </button>
          </div>

          {/* Error Recovery Matrix Details */}
          <div className="bg-stone-900 text-stone-200 p-5 rounded-xl border border-stone-800 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4" />
              <span>Directives Error Recovery Matrix</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-stone-300 font-mono">
              <li className="flex items-center justify-between">
                <span>503 UNAVAILABLE</span>
                <span className="text-emerald-400">Next Ladder Tier</span>
              </li>
              <li className="flex items-center justify-between">
                <span>429 RESOURCE_EXHAUSTED</span>
                <span className="text-emerald-400">Next Ladder Tier</span>
              </li>
              <li className="flex items-center justify-between">
                <span>404 NOT_FOUND</span>
                <span className="text-emerald-400">Next Ladder Tier</span>
              </li>
              <li className="flex items-center justify-between">
                <span>500 INTERNAL_ERROR</span>
                <span className="text-emerald-400">Next Ladder Tier</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Live Fallback Trace & Response Output */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="space-y-4">
              {/* Fallback Attempt Trace */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
                <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Execution Trace & Fallback Progression</span>
                </h3>

                <div className="space-y-2">
                  {result.fallbackTrace.map((attempt: FallbackAttempt, idx: number) => {
                    const isSuccess = attempt.status === "success";
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                          isSuccess
                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium"
                            : "bg-rose-50/70 border-rose-200 text-rose-900"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isSuccess ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <div>
                            <div className="font-mono font-bold text-stone-900">
                              Tier 0{idx + 1}: {attempt.model}
                            </div>
                            <div className="text-[11px] text-stone-600 mt-0.5">
                              {isSuccess
                                ? "Inference resolved successfully without client disruption"
                                : attempt.errorMessage || `Service code ${attempt.statusCode}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{attempt.durationMs} ms</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-600">
                  <div>
                    Resolved By: <strong className="text-emerald-700 font-mono">{result.modelUsed}</strong>
                  </div>
                  <div>
                    Total Roundtrip Latency: <strong className="text-stone-900 font-mono">{result.latencyMs} ms</strong>
                  </div>
                </div>
              </div>

              {/* Model Output Preview */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
                <h3 className="text-sm font-bold text-stone-900 mb-2">Synthesized Response Payload</h3>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 leading-relaxed font-sans whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {result.text}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-dashed border-stone-300 text-center flex flex-col items-center justify-center min-h-[380px]">
              <Cpu className="w-12 h-12 text-stone-300 mb-3" />
              <h3 className="text-base font-semibold text-stone-700">Fallback Ladder Ready</h3>
              <p className="text-xs text-stone-500 max-w-sm mt-1">
                Trigger prompt execution with or without simulated 503/429 outages to view the automated fallback sequence and trace.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
