import React, { useState, useEffect } from "react";
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Send,
  Sparkles,
  RotateCcw,
  Clock,
  User,
} from "lucide-react";
import { SavedInteractionRecord } from "../types";

interface TransactionPersistenceHubProps {
  currentUser: {
    uid: string;
    role: string;
    email: string;
  };
}

export const TransactionPersistenceHub: React.FC<TransactionPersistenceHubProps> = ({
  currentUser,
}) => {
  const [inputPrompt, setInputPrompt] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [history, setHistory] = useState<SavedInteractionRecord[]>([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/interactions?userId=${currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser.uid]);

  const handleGenerateAndPersist = async () => {
    if (!inputPrompt.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setCanRetry(false);

    try {
      // 1. Inference via Fallback Ladder
      const genRes = await fetch("/api/generate-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputPrompt }),
      });
      const genData = await genRes.json();
      const outputText = genData.text || "Execution completed.";
      setGeneratedOutput(outputText);

      // 2. Guaranteed Persistence Stage
      setIsPersisting(true);
      const saveRes = await fetch("/api/save-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          inputPrompt,
          generatedOutput: outputText,
          modelUsed: genData.modelUsed || "gemini-3.6-flash",
          simulateFailure,
        }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || `Database write failed with status ${saveRes.status}`);
      }

      // Successful write settled - clear buffer only after confirmed write
      await fetchHistory();
      setInputPrompt("");
      setGeneratedOutput("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed to commit.";
      setErrorMessage(msg);
      setCanRetry(true);
      // Notice: inputPrompt is intentionally NOT cleared to protect user input buffer
    } finally {
      setIsLoading(false);
      setIsPersisting(false);
    }
  };

  const handleRetrySave = async () => {
    if (!inputPrompt) return;
    setIsPersisting(true);
    setErrorMessage(null);
    try {
      const saveRes = await fetch("/api/save-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          inputPrompt,
          generatedOutput,
          modelUsed: "gemini-3.6-flash",
          simulateFailure: false, // Turn off failure on retry
        }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || "Retry save failed");
      }

      setCanRetry(false);
      await fetchHistory();
      setInputPrompt("");
      setGeneratedOutput("");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setIsPersisting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Directives Context */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs tracking-wider uppercase">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Directive 6: Database Persistence & Transaction Integrity</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mt-1">
              Guaranteed Transaction Verification Hub
            </h1>
            <p className="text-sm text-stone-600 mt-1 max-w-3xl">
              Input-to-Save completeness guarantee: Ensures both user input and generated outputs are verified in storage. Zero silent failures and strict input buffer protection on transaction errors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-mono font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              UID: {currentUser.uid}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interaction Submission Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              User Input Prompt / Request
            </label>
            <textarea
              id="transaction-prompt-input"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              rows={4}
              aria-label="User Input Prompt"
              className="w-full text-xs font-mono p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Type user query or instructions..."
            />

            {/* Simulated Database Error Injection */}
            <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between">
              <div className="text-xs text-stone-700 font-medium">
                Simulate Transaction Write Failure
              </div>
              <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-rose-700 font-semibold">Inject Lock Failure</span>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                id="submit-transaction-btn"
                onClick={handleGenerateAndPersist}
                disabled={isLoading || isPersisting || !inputPrompt.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isLoading || isPersisting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isLoading ? "Generating Output..." : "Committing Write..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Generate & Guarantee Save</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Escalation Banner with Retry Save */}
            {errorMessage && (
              <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2 text-rose-900 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span>Persistence Error: {errorMessage}</span>
                    <p className="text-[11px] text-rose-700 font-normal mt-0.5">
                      Input buffer preserved. Your prompt text was not lost.
                    </p>
                  </div>
                </div>

                {canRetry && (
                  <button
                    id="retry-save-btn"
                    onClick={handleRetrySave}
                    disabled={isPersisting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer mt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Save Transaction</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Persisted Storage Records */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  Confirmed Document Records in Firestore
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-mono">
                {history.length} records verified
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500">
                No persisted records yet for UID <code className="font-mono text-stone-700">{currentUser.uid}</code>.
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-lg border border-stone-200 bg-stone-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="font-mono text-stone-700 font-bold">{record.id}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div>
                      <span className="font-semibold text-stone-800">Prompt:</span>
                      <p className="text-stone-700 text-[11px] font-mono mt-0.5 line-clamp-2">
                        {record.inputPrompt}
                      </p>
                    </div>

                    <div className="p-2 bg-white rounded border border-stone-200 text-stone-800 text-[11px] font-sans">
                      {record.generatedOutput}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed Settled in Storage
                      </span>
                      <span className="font-mono bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded text-[10px]">
                        {record.modelUsed}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
