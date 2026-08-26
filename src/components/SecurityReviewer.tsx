import React, { useState } from "react";
import {
  FileCode2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Code,
} from "lucide-react";
import { SecurityReviewResult, SecurityVulnerability } from "../types";
import { VULNERABLE_CODE_PRESETS } from "../data/presets";

export const SecurityReviewer: React.FC = () => {
  const [codeSnippet, setCodeSnippet] = useState(VULNERABLE_CODE_PRESETS[0].code);
  const [selectedPreset, setSelectedPreset] = useState(VULNERABLE_CODE_PRESETS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SecurityReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPreset = (id: string) => {
    setSelectedPreset(id);
    const found = VULNERABLE_CODE_PRESETS.find((p) => p.id === id);
    if (found) {
      setCodeSnippet(found.code);
    }
  };

  const handleRunAudit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/security-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeSnippet }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }
      const data: SecurityReviewResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to run security audit");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Directives Context */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs tracking-wider uppercase">
              <FileCode2 className="w-4 h-4 text-emerald-700" />
              <span>Directives 2, 4 & 5: Security Reviewer & Zero-Hardcoding Hygiene</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mt-1">
              Automated Code & Config Security Auditor
            </h1>
            <p className="text-sm text-stone-600 mt-1 max-w-3xl">
              Inspects source code against OWASP Top 10 (Web & LLMs), flags hardcoded API keys (<code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">AIzaSy...</code>), detects permissive Firestore wildcards, and provides concrete remediation code diffs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg border border-stone-200 font-mono">
              Zero Hardcoded Secrets Policy
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Code Input Area */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              Select Sample or Paste Code to Audit
            </label>
            <div className="space-y-2 mb-4">
              {VULNERABLE_CODE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  id={`preset-code-${preset.id}`}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                    selectedPreset === preset.id
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium"
                      : "border-stone-200 hover:border-stone-300 bg-white text-stone-700"
                  }`}
                >
                  <div className="font-semibold text-stone-900">{preset.name}</div>
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Source Code / Configuration Block
            </label>
            <textarea
              id="code-input"
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              rows={11}
              aria-label="Source Code Input"
              className="w-full text-xs font-mono p-3 bg-stone-900 text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="// Paste TypeScript, Express, Firestore rules, or Python..."
            />

            <button
              id="run-security-audit-btn"
              onClick={handleRunAudit}
              disabled={isLoading || !codeSnippet.trim()}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Auditing against Directives...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Audit Code & Config</span>
                </>
              )}
            </button>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Audit Error:</strong> {error}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !isLoading && (
            <div className="bg-white p-12 rounded-xl border border-dashed border-stone-300 text-center flex flex-col items-center justify-center min-h-[380px]">
              <ShieldCheck className="w-12 h-12 text-stone-300 mb-3" />
              <h3 className="text-base font-semibold text-stone-700">Security Audit Ready</h3>
              <p className="text-xs text-stone-500 max-w-sm mt-1">
                Select a code sample or paste a custom script to inspect for hardcoded credentials, injection sinks, and permission flaws.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="bg-white p-12 rounded-xl border border-stone-200 text-center flex flex-col items-center justify-center min-h-[380px] space-y-4">
              <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <div>
                <h3 className="text-base font-semibold text-stone-800">Analyzing AST & Pattern Sinks</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Checking Secret Manager bindings, Firestore rule structures, and payload validation...
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Compliance & Score Card */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Security Posture Score</h3>
                    <p className="text-xs text-stone-600 mt-0.5">{result.summary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`text-2xl font-black px-4 py-1.5 rounded-lg border font-mono ${
                        result.riskScore >= 80
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : result.riskScore >= 50
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-rose-50 text-rose-800 border-rose-300"
                      }`}
                    >
                      {result.riskScore}/100
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    {result.complianceChecklist.zeroHardcodedKeys ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span className="text-stone-700">Zero Hardcoded Keys</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {result.complianceChecklist.ownerBoundFirestore ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span className="text-stone-700">Owner-Bound Rules</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {result.complianceChecklist.inputSanitization ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span className="text-stone-700">Input Sanitization</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {result.complianceChecklist.outputEncoding ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span className="text-stone-700">Output Encoding</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {result.complianceChecklist.leastPrivilegeIAM ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span className="text-stone-700">Least Privilege IAM</span>
                  </div>
                </div>
              </div>

              {/* Vulnerabilities & Concrete Diffs */}
              <div className="space-y-3">
                {result.vulnerabilities.map((vuln: SecurityVulnerability) => (
                  <div
                    key={vuln.id}
                    className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden"
                  >
                    <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                            vuln.severity === "Critical"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {vuln.severity}
                        </span>
                        <span className="text-xs font-bold text-stone-900">{vuln.title}</span>
                        {vuln.lineRange && (
                          <span className="text-[11px] text-stone-500 font-mono">({vuln.lineRange})</span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 font-mono">{vuln.owaspClassification}</span>
                    </div>

                    <div className="p-4 space-y-3 text-xs">
                      <p className="text-stone-600 leading-relaxed">{vuln.description}</p>

                      {/* Concrete Code Diff */}
                      <div className="space-y-2">
                        <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-stone-500" />
                          <span>Remediation Diff:</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Insecure Pattern */}
                          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg">
                            <div className="text-[11px] font-bold text-rose-800 mb-1 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" /> Insecure Anti-Pattern
                            </div>
                            <pre className="text-[11px] font-mono text-rose-950 overflow-x-auto whitespace-pre-wrap">
                              <code>{vuln.remediationDiff.insecure}</code>
                            </pre>
                          </div>

                          {/* Secure Remediation */}
                          <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-lg">
                            <div className="text-[11px] font-bold text-emerald-900 mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Compliant Remediation
                            </div>
                            <pre className="text-[11px] font-mono text-emerald-950 overflow-x-auto whitespace-pre-wrap">
                              <code>{vuln.remediationDiff.secure}</code>
                            </pre>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 text-stone-700 flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Recommendation:</strong> {vuln.recommendation}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
