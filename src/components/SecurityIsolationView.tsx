import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  XCircle,
  Play,
  Terminal,
  Key,
  Flame,
  FileCode,
} from "lucide-react";
import { AuthUserProfile } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

interface SecurityIsolationViewProps {
  user: AuthUserProfile;
}

export const SecurityIsolationView: React.FC<SecurityIsolationViewProps> = ({
  user,
}) => {
  const [testTargetPath, setTestTargetPath] = useState<string>(
    `/users/${user.uid}/entries/entry_123`
  );
  const [testAuthUid, setTestAuthUid] = useState<string>(user.uid);
  const [testResult, setTestResult] = useState<{
    outcome: "ALLOW" | "DENY";
    ruleMatched: string;
    details: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const runRuleTest = async () => {
    setIsTesting(true);
    try {
      const res = await fetch("/api/firestore-rule-tester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUid: testAuthUid || null,
          path: testTargetPath,
          operation: "read",
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error("Rule test error:", err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900">
              Security Architecture & User Isolation
            </h1>
            <p className="text-xs text-stone-500">
              Technical verification of Firebase Authentication, Cloud Firestore isolation, and Gemini Secret Management.
            </p>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Identity Layer</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Google Sign-In with Firebase Auth. No raw passwords stored in database.
            </p>
            <div className="text-[10px] font-mono bg-white p-1 rounded border border-stone-200 text-stone-600 truncate">
              UID: {user.uid}
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span>Document Isolation</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Entries partitioned under <code className="text-emerald-800 font-mono">/users/&#123;uid&#125;/*</code>.
            </p>
            <div className="text-[10px] font-mono bg-white p-1 rounded border border-stone-200 text-stone-600 truncate">
              DB: {firebaseConfig.projectId}
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Cpu className="w-3.5 h-3.5 text-emerald-700" />
              <span>Gemini 3.6 Flash</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Multi-turn conversational reflections with auto-fallback ladder resilience.
            </p>
            <div className="text-[10px] font-mono bg-white p-1 rounded border border-stone-200 text-stone-600 truncate">
              Primary: gemini-3.6-flash
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Key className="w-3.5 h-3.5 text-emerald-700" />
              <span>Secret Manager</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Keys are strictly server-side. Zero client-side API token leakage.
            </p>
            <div className="text-[10px] font-mono bg-white p-1 rounded border border-stone-200 text-emerald-800 font-semibold truncate">
              Status: Injected Server-Side
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Firestore Rules Sandbox / Validator */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Live Firestore Access Rule Evaluation
              </h2>
              <p className="text-xs text-stone-500">
                Simulate authorization requests against active Firestore security rules.
              </p>
            </div>
          </div>

          <button
            onClick={runRuleTest}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3" />
            <span>Evaluate Rule</span>
          </button>
        </div>

        {/* Test Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700">Authenticated UID (request.auth.uid)</label>
            <input
              type="text"
              value={testAuthUid}
              onChange={(e) => setTestAuthUid(e.target.value)}
              className="w-full font-mono bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-800"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setTestAuthUid(user.uid)}
                className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
              >
                Set to My UID (Owner)
              </button>
              <span className="text-stone-300">•</span>
              <button
                onClick={() => setTestAuthUid("adversary_user_999")}
                className="text-[11px] text-red-600 hover:underline cursor-pointer"
              >
                Set to Other User (Attacker)
              </button>
              <span className="text-stone-300">•</span>
              <button
                onClick={() => setTestAuthUid("")}
                className="text-[11px] text-stone-500 hover:underline cursor-pointer"
              >
                Set to Unauthenticated (null)
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700">Target Document Path</label>
            <input
              type="text"
              value={testTargetPath}
              onChange={(e) => setTestTargetPath(e.target.value)}
              className="w-full font-mono bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-800"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setTestTargetPath(`/users/${user.uid}/entries/entry_123`)}
                className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
              >
                My Entries Path
              </button>
              <span className="text-stone-300">•</span>
              <button
                onClick={() => setTestTargetPath(`/users/victim_user_888/entries/secret_doc`)}
                className="text-[11px] text-red-600 hover:underline cursor-pointer"
              >
                Another User&apos;s Path
              </button>
            </div>
          </div>
        </div>

        {/* Evaluation Output */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              testResult.outcome === "ALLOW"
                ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                : "bg-rose-50/70 border-rose-300 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {testResult.outcome === "ALLOW" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Access Permitted: ALLOW</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-700" />
                  <span>Access Rejected: DENY</span>
                </>
              )}
            </div>

            <p className="leading-relaxed">{testResult.details}</p>

            <div className="pt-2 border-t border-stone-200/40">
              <span className="font-semibold text-[11px]">Matched Rule:</span>
              <pre className="font-mono text-[10px] bg-white/80 p-2 rounded mt-1 overflow-x-auto">
                {testResult.ruleMatched}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Actual Deployed firestore.rules Code Preview */}
      <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl border border-stone-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-stone-300 font-bold">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Deployed firestore.rules</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            Deployed & Active
          </span>
        </div>

        <pre className="font-mono text-xs text-stone-300 bg-stone-950/80 p-4 rounded-xl overflow-x-auto leading-relaxed border border-stone-800/80">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. User Data Isolation: Owner-bound path checking
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /{allPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // 2. Zero Insecure Defaults: Explicit deny for all unspecified collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
};
