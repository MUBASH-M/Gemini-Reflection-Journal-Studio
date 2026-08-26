import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  CheckCheck,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { WalkthroughTestCase } from "../types";
import { INITIAL_TEST_CASES } from "../data/presets";

export const WalkthroughTestCases: React.FC = () => {
  const [testCases, setTestCases] = useState<WalkthroughTestCase[]>(INITIAL_TEST_CASES);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);

  const runTest = async (testId: string) => {
    setRunningTestId(testId);
    try {
      if (testId === "TC-01") {
        // Threat Model Test
        const res = await fetch("/api/threat-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ architecture: "Sample Agent with Tool Execution and Firestore state" }),
        });
        const data = await res.json();
        const passed = Array.isArray(data.threatMatrix) && data.threatMatrix.length >= 5;
        updateTestStatus(testId, passed ? "passed" : "failed");
      } else if (testId === "TC-02") {
        // Model Fallback Ladder 503 Recovery Test
        const res = await fetch("/api/generate-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: "Test resilient failover",
            forceFailureModels: ["gemini-3.6-flash"],
          }),
        });
        const data = await res.json();
        const passed = Boolean(data.text) && data.modelUsed !== "gemini-3.6-flash";
        updateTestStatus(testId, passed ? "passed" : "failed");
      } else if (testId === "TC-03") {
        // Security Reviewer Test
        const res = await fetch("/api/security-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codeSnippet: 'const API_KEY = "AIzaSyD-sample";\nmatch /{document=**} { allow read, write: if true; }',
          }),
        });
        const data = await res.json();
        const passed = Array.isArray(data.vulnerabilities) && data.vulnerabilities.length > 0;
        updateTestStatus(testId, passed ? "passed" : "failed");
      } else if (testId === "TC-04") {
        // Firestore Isolation Test
        const res = await fetch("/api/firestore-rule-tester", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authUid: "user_dev_889",
            path: "/users/user_dev_889/interactions/doc1",
            operation: "read",
          }),
        });
        const data = await res.json();
        const passed = data.outcome === "ALLOW";
        updateTestStatus(testId, passed ? "passed" : "failed");
      } else if (testId === "TC-05") {
        // Cloud Run Verification Binding Test
        const res = await fetch("/api/health");
        const data = await res.json();
        const passed = data.status === "ok";
        updateTestStatus(testId, passed ? "passed" : "failed");
      }
    } catch {
      updateTestStatus(testId, "failed");
    } finally {
      setRunningTestId(null);
    }
  };

  const updateTestStatus = (id: string, status: "passed" | "failed") => {
    setTestCases((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const runAllTests = async () => {
    for (const test of testCases) {
      await runTest(test.id);
    }
  };

  const resetAllTests = () => {
    setTestCases(INITIAL_TEST_CASES);
  };

  const passedCount = testCases.filter((t) => t.status === "passed").length;

  return (
    <div className="space-y-6">
      {/* Header Directives Context */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs tracking-wider uppercase">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span>Directive 6: Functional Stability & Testing Walkthroughs</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mt-1">
              End-to-End Functional Test Suite & Verification Matrix
            </h1>
            <p className="text-sm text-stone-600 mt-1 max-w-3xl">
              Concrete testing walkthroughs covering every process and user interaction across Threat Modeling, Fallback Ladder failover, Security Auditing, Firestore Owner Isolation, and Cloud Run challenge labeling.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="reset-tests-btn"
              onClick={resetAllTests}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              id="run-all-tests-btn"
              onClick={runAllTests}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors font-semibold shadow-xs cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Run Complete Verification Suite</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <div className="text-stone-600">
            Passed: <strong className="text-emerald-700">{passedCount}</strong> / {testCases.length} Test Cases
          </div>
          <div className="w-48 bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${(passedCount / testCases.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="space-y-4">
        {testCases.map((test) => {
          const isRunning = runningTestId === test.id;
          const isPassed = test.status === "passed";
          const isFailed = test.status === "failed";

          return (
            <div
              key={test.id}
              id={`test-case-${test.id}`}
              className={`bg-white rounded-xl border transition-all shadow-xs overflow-hidden ${
                isPassed
                  ? "border-emerald-300 bg-emerald-50/20"
                  : isFailed
                  ? "border-rose-300 bg-rose-50/20"
                  : "border-stone-200"
              }`}
            >
              <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-stone-700 bg-stone-200 px-2 py-0.5 rounded">
                    {test.id}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {test.category}
                  </span>
                  <h3 className="text-sm font-bold text-stone-900">{test.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status indicator */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {isPassed && (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> PASSED
                      </span>
                    )}
                    {isFailed && (
                      <span className="text-rose-700 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> FAILED
                      </span>
                    )}
                    {test.status === "pending" && (
                      <span className="text-stone-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> READY
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => runTest(test.id)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    {isRunning ? (
                      <div className="w-3.5 h-3.5 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-700" />
                    )}
                    <span>{isRunning ? "Verifying..." : "Execute Test"}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-stone-700">Trigger Action:</span>
                  <p className="text-stone-600 mt-0.5">{test.userAction}</p>
                </div>

                <div>
                  <span className="font-semibold text-stone-700">Expected Behavior:</span>
                  <p className="text-stone-600 mt-0.5">{test.expectedBehavior}</p>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="font-semibold text-stone-800 block mb-1.5">
                    Step-by-Step Test Procedure:
                  </span>
                  <ul className="space-y-1 text-stone-600 font-mono text-[11px]">
                    {test.verificationSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
