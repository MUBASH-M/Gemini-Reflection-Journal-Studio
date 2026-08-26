import React from "react";
import {
  ShieldCheck,
  Cpu,
  Flame,
  FileCode2,
  Terminal,
  Activity,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemHealth: {
    status: string;
    hasSecretManagerKey: boolean;
    modelLadder: readonly string[];
  } | null;
  currentUser: {
    uid: string;
    role: string;
    email: string;
  };
  setCurrentUser: React.Dispatch<
    React.SetStateAction<{
      uid: string;
      role: string;
      email: string;
    }>
  >;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  systemHealth,
  currentUser,
  setCurrentUser,
}) => {
  const tabs = [
    { id: "threat-model", label: "Threat Modeling", icon: ShieldCheck },
    { id: "fallback-ladder", label: "Model Fallback Ladder", icon: Cpu },
    { id: "security-review", label: "Security Reviewer", icon: FileCode2 },
    { id: "firestore-studio", label: "Firestore & Isolation", icon: Database },
    { id: "persistence-hub", label: "Transaction Hub", icon: Layers },
    { id: "cloud-run-deploy", label: "Cloud Run Deploy", icon: Terminal },
    { id: "test-walkthrough", label: "Test Walkthroughs", icon: Activity },
  ];

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-50">
      {/* Top Banner */}
      <div className="bg-stone-900 text-stone-200 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold tracking-wide text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CLOUD RUN AI SECURITY DIRECTIVES ENGINE</span>
          </div>
          <span className="text-stone-500 hidden md:inline">|</span>
          <div className="hidden md:flex items-center gap-2 text-stone-300">
            <span className="text-stone-400">Campaign Binding:</span>
            <span className="font-mono bg-stone-800 px-2 py-0.5 rounded text-emerald-300 text-[11px] border border-stone-700">
              dev-tutorial=cloud-run-ai-challenge
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Secret Manager status */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-[11px]">
            <span className="text-stone-400">Secret Manager:</span>
            {systemHealth?.hasSecretManagerKey ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Mounted
              </span>
            ) : (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Ready / Standard Env
              </span>
            )}
          </div>

          {/* User Role Switcher Simulation */}
          <div className="flex items-center gap-1.5 bg-stone-800 px-2 py-0.5 rounded border border-stone-700 text-[11px]">
            <span className="text-stone-400">Active Identity:</span>
            <select
              value={currentUser.role}
              onChange={(e) => {
                const role = e.target.value;
                setCurrentUser({
                  uid: role === "admin" ? "admin_sec_01" : "user_dev_889",
                  role,
                  email: role === "admin" ? "admin.security@cloud.internal" : "developer@company.dev",
                });
              }}
              aria-label="Active Security Identity"
              className="bg-stone-900 text-stone-200 border border-stone-700 rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="developer">user_dev_889 (Owner)</option>
              <option value="admin">admin_sec_01 (RBAC Admin)</option>
              <option value="unauthenticated">Unauthenticated (Anonymous)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between overflow-x-auto py-2">
          <nav className="flex space-x-1 sm:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-700" : "text-stone-500"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
