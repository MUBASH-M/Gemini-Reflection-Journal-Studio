import React, { useState } from "react";
import {
  ShieldAlert,
  Layers,
  Cpu,
  Brain,
  Wrench,
  Database,
  Share2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ThreatModelResult, ThreatZone } from "../types";
import { ARCHITECTURE_PRESETS } from "../data/presets";

const ZONE_ICONS: Record<ThreatZone, React.ElementType> = {
  "Input Surfaces": Layers,
  "Planning & Reasoning": Brain,
  "Tool Execution": Wrench,
  "Memory & State": Database,
  "Inter-System Communication": Share2,
};

const ZONE_COLORS: Record<ThreatZone, { badge: string; border: string; bg: string }> = {
  "Input Surfaces": { badge: "bg-blue-100 text-blue-800", border: "border-blue-200", bg: "bg-blue-50/50" },
  "Planning & Reasoning": { badge: "bg-purple-100 text-purple-800", border: "border-purple-200", bg: "bg-purple-50/50" },
  "Tool Execution": { badge: "bg-amber-100 text-amber-800", border: "border-amber-200", bg: "bg-amber-50/50" },
  "Memory & State": { badge: "bg-emerald-100 text-emerald-800", border: "border-emerald-200", bg: "bg-emerald-50/50" },
  "Inter-System Communication": { badge: "bg-rose-100 text-rose-800", border: "border-rose-200", bg: "bg-rose-50/50" },
};

export const ThreatModelingWorkbench: React.FC = () => {
  const [architecture, setArchitecture] = useState(ARCHITECTURE_PRESETS[0].architecture);
  const [selectedPreset, setSelectedPreset] = useState(ARCHITECTURE_PRESETS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ThreatModelResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterZone, setFilterZone] = useState<string>("ALL");
  const [expandedThreats, setExpandedThreats] = useState<Record<string, boolean>>({});

  const handleSelectPreset = (id: string) => {
    setSelectedPreset(id);
    const found = ARCHITECTURE_PRESETS.find((p) => p.id === id);
    if (found) {
      setArchitecture(found.architecture);
    }
  };

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/threat-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ architecture }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }
      const data: ThreatModelResult = await res.json();
      setResult(data);
      // Auto-expand all threats
      const expandMap: Record<string, boolean> = {};
      data.threatMatrix?.forEach((t) => {
        expandMap[t.id] = true;
      });
      setExpandedThreats(expandMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate threat model");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleThreat = (id: string) => {
    setExpandedThreats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    let md = `# ${result.title}\n\n${result.architectureSummary}\n\n## 5-Zone Threat Summary Table\n\n`;
    md += `| Zone | Threat | OWASP Category | Severity | Countermeasure |\n`;
    md += `|---|---|---|---|---|\n`;
    result.threatMatrix.forEach((t) => {
      md += `| ${t.zone} | ${t.threatDescription} | ${t.owaspCategory} | ${t.severity} | ${t.countermeasure} |\n`;
    });
    md += `\n## Mitigation Checklist\n\n`;
    result.mitigationPlan.forEach((m) => {
      md += `- ${m}\n`;
    });
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredThreats = result?.threatMatrix?.filter(
    (t) => filterZone === "ALL" || t.zone === filterZone
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header Directives Context */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs tracking-wider uppercase">
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              <span>Directive 1: Agentic Threat Modeling</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mt-1">
              5-Zone System & Agentic Threat Workbench
            </h1>
            <p className="text-sm text-stone-600 mt-1 max-w-3xl">
              Mandatory pre-synthesis threat modeling mapping potential attack vectors across the 5 Critical Zones:
              <strong className="text-stone-800"> Input Surfaces</strong>,{" "}
              <strong className="text-stone-800">Planning & Reasoning</strong>,{" "}
              <strong className="text-stone-800">Tool Execution</strong>,{" "}
              <strong className="text-stone-800">Memory & State</strong>, and{" "}
              <strong className="text-stone-800">Inter-System Communication</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg border border-stone-200 font-mono">
              OWASP Top 10 + LLM01-LLM10
            </span>
          </div>
        </div>
      </div>

      {/* Input Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              Select Architecture Blueprint / Blueprint Preset
            </label>
            <div className="space-y-2 mb-4">
              {ARCHITECTURE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  id={`preset-btn-${preset.id}`}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                    selectedPreset === preset.id
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium"
                      : "border-stone-200 hover:border-stone-300 bg-white text-stone-700"
                  }`}
                >
                  <div className="font-semibold text-stone-900">{preset.name}</div>
                  <div className="text-stone-500 text-[11px] mt-0.5">{preset.description}</div>
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Custom Architecture Description (YAML / Markdown / Flow)
            </label>
            <textarea
              id="architecture-input"
              value={architecture}
              onChange={(e) => setArchitecture(e.target.value)}
              rows={9}
              aria-label="Custom Architecture Blueprint"
              className="w-full text-xs font-mono p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Define components, tools, storage paths, authentication, and external APIs..."
            />

            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-stone-400" /> Resilient Gemini Fallback Ladder Active
              </span>
              <button
                id="run-threat-analysis-btn"
                onClick={handleRunAnalysis}
                disabled={isLoading || !architecture.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing 5 Zones...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Threat Analysis</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Analysis Error:</strong> {error}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !isLoading && (
            <div className="bg-white p-12 rounded-xl border border-dashed border-stone-300 text-center flex flex-col items-center justify-center min-h-[380px]">
              <ShieldAlert className="w-12 h-12 text-stone-300 mb-3" />
              <h3 className="text-base font-semibold text-stone-700">No Threat Model Generated Yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mt-1">
                Select an architecture blueprint on the left and click &quot;Run Threat Analysis&quot; to generate the mandatory 5-Zone Threat Summary Table.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="bg-white p-12 rounded-xl border border-stone-200 text-center flex flex-col items-center justify-center min-h-[380px] space-y-4">
              <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <div>
                <h3 className="text-base font-semibold text-stone-800">Synthesizing Threat Vectors</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Evaluating Input Surfaces, Planning, Tool Execution, Memory & State, and Inter-System Communication...
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Threat Model Summary Banner */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">{result.title}</h2>
                    <p className="text-xs text-stone-600 mt-0.5">{result.architectureSummary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="copy-threat-model-btn"
                      onClick={handleCopyMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied Markdown" : "Export Markdown"}</span>
                    </button>
                  </div>
                </div>

                {/* Model Attribution & Fallback Trace */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-stone-500">Evaluated by:</span>
                  <span className="font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                    {result.modelUsed}
                  </span>
                  {result.fallbackTrace && result.fallbackTrace.length > 0 && (
                    <span className="text-stone-400 text-[11px]">
                      ({result.fallbackTrace.length} ladder attempts logged)
                    </span>
                  )}
                </div>
              </div>

              {/* Threat Zones Filter Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {["ALL", "Input Surfaces", "Planning & Reasoning", "Tool Execution", "Memory & State", "Inter-System Communication"].map(
                  (zone) => (
                    <button
                      key={zone}
                      onClick={() => setFilterZone(zone)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                        filterZone === zone
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {zone}
                    </button>
                  )
                )}
              </div>

              {/* 5-Zone Threat Summary Cards */}
              <div className="space-y-3">
                {filteredThreats.map((threat) => {
                  const ZoneIcon = ZONE_ICONS[threat.zone] || Layers;
                  const zoneStyle = ZONE_COLORS[threat.zone] || ZONE_COLORS["Input Surfaces"];
                  const isExpanded = expandedThreats[threat.id];
                  const isCritical = threat.severity === "Critical";
                  const isHigh = threat.severity === "High";

                  return (
                    <div
                      key={threat.id}
                      id={`threat-card-${threat.id}`}
                      className={`bg-white rounded-xl border transition-all ${zoneStyle.border} shadow-xs overflow-hidden`}
                    >
                      {/* Card Header */}
                      <div
                        onClick={() => toggleThreat(threat.id)}
                        className="p-4 cursor-pointer hover:bg-stone-50/70 transition-colors flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${zoneStyle.bg} shrink-0 mt-0.5`}>
                            <ZoneIcon className="w-4 h-4 text-stone-700" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${zoneStyle.badge}`}>
                                {threat.zone}
                              </span>
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                  isCritical
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : isHigh
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-stone-100 text-stone-700"
                                }`}
                              >
                                {threat.severity} Severity
                              </span>
                              <span className="text-[11px] text-stone-500 font-mono">
                                {threat.owaspCategory}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-stone-900">{threat.threatDescription}</h4>
                          </div>
                        </div>

                        <button className="text-stone-400 hover:text-stone-600 p-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-stone-100 bg-stone-50/40 space-y-3 text-xs">
                          <div>
                            <span className="font-semibold text-stone-700">Attack Vector:</span>
                            <p className="text-stone-600 mt-0.5 leading-relaxed">{threat.attackVector}</p>
                          </div>

                          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-950">
                            <div className="font-semibold flex items-center gap-1.5 text-emerald-900 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Mandatory Countermeasure:</span>
                            </div>
                            <p className="leading-relaxed">{threat.countermeasure}</p>

                            {threat.codeSnippet && (
                              <div className="mt-2">
                                <span className="font-mono text-[10px] text-emerald-800 font-semibold block mb-1">
                                  Implementation Pattern:
                                </span>
                                <pre className="bg-stone-900 text-stone-100 p-2.5 rounded font-mono text-[11px] overflow-x-auto border border-stone-800">
                                  <code>{threat.codeSnippet}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mitigation Checklist */}
              {result.mitigationPlan && result.mitigationPlan.length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Directive Mitigation Checklist</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-stone-700">
                    {result.mitigationPlan.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
