import React from "react";
import {
  LogOut,
  Plus,
  BookOpen,
  History,
  ShieldCheck,
  Sparkles,
  Database,
  User,
  Key,
} from "lucide-react";
import { AuthUserProfile } from "../types";

interface DashboardHeaderProps {
  user: AuthUserProfile;
  currentTab: "editor" | "history" | "security";
  onTabChange: (tab: "editor" | "history" | "security") => void;
  onNewEntry: () => void;
  onSignOut: () => void;
  totalEntriesCount: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  currentTab,
  onTabChange,
  onNewEntry,
  onSignOut,
  totalEntriesCount,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 text-base leading-tight">
                  Gemini Reflection Studio
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden md:block">
                User-Isolated Firestore • Zero-Trust Security
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              id="tab-editor-btn"
              onClick={() => onTabChange("editor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === "editor"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>

            <button
              id="tab-history-btn"
              onClick={() => onTabChange("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === "history"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              {totalEntriesCount > 0 && (
                <span className="bg-stone-200 text-stone-700 text-[10px] px-1.5 py-0.2 rounded-full">
                  {totalEntriesCount}
                </span>
              )}
            </button>

            <button
              id="tab-security-btn"
              onClick={() => onTabChange("security")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === "security"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Security & Spec</span>
              <span className="sm:hidden">Spec</span>
            </button>
          </nav>

          {/* Right Action & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="new-entry-btn"
              onClick={onNewEntry}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Reflection</span>
              <span className="sm:hidden">New</span>
            </button>

            {/* User Profile dropdown/pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-7 h-7 rounded-full border border-stone-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 text-xs font-bold">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-stone-800 truncate max-w-[130px]">
                  {user.displayName || user.email || "User"}
                </p>
                <p className="text-[10px] text-stone-500 font-mono truncate max-w-[130px]">
                  {user.uid.slice(0, 10)}...
                </p>
              </div>

              <button
                id="sign-out-btn"
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Firestore Path Sub-bar */}
        <div className="py-1 px-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 bg-stone-50/60 rounded-b-md">
          <div className="flex items-center gap-2 font-mono truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-stone-600 font-medium">Firestore Owner Path:</span>
            <span className="text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-semibold truncate">
              /users/{user.uid}/entries
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[10px]">
            <span className="text-stone-500">Security Rule: <code className="text-stone-700 font-mono">request.auth.uid == userId</code></span>
            <span className="text-stone-400">•</span>
            <span className="text-stone-500">Model: <span className="font-semibold text-stone-700">gemini-3.6-flash</span></span>
          </div>
        </div>
      </div>
    </header>
  );
};
