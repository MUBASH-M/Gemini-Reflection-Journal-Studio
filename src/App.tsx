import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, mapFirebaseUser, subscribeToUserEntries } from "./firebase";
import { AuthUserProfile, JournalEntry } from "./types";
import { LandingAuth } from "./components/LandingAuth";
import { DashboardHeader } from "./components/DashboardHeader";
import { JournalEditor } from "./components/JournalEditor";
import { EntriesHistory } from "./components/EntriesHistory";
import { SecurityIsolationView } from "./components/SecurityIsolationView";
import { ShieldCheck } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState<"editor" | "history" | "security">("editor");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Helper to create initial default entry
  const createNewEmptyEntry = (userId: string): JournalEntry => ({
    id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title: "Today's Reflections & Strategy",
    category: "Personal Growth",
    mood: "Reflective",
    tags: ["reflection", "growth"],
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 1. Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const profile = mapFirebaseUser(user);
        setCurrentUser(profile);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time subscribe to user's isolated Firestore entries collection
  useEffect(() => {
    if (!currentUser?.uid) {
      setEntries([]);
      setSelectedEntry(null);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      currentUser.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        // If no active entry is selected or the active entry was updated, sync it
        setSelectedEntry((prev) => {
          if (!prev) {
            return fetchedEntries.length > 0
              ? fetchedEntries[0]
              : createNewEmptyEntry(currentUser.uid);
          }
          const matched = fetchedEntries.find((e) => e.id === prev.id);
          return matched || prev;
        });
      },
      (err) => {
        console.warn("Firestore entries subscription notice:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Handle New Entry Action
  const handleNewEntry = () => {
    if (!currentUser) return;
    const newEntry = createNewEmptyEntry(currentUser.uid);
    setSelectedEntry(newEntry);
    setCurrentTab("editor");
  };

  // Handle Sign Out
  const handleSignOut = () => {
    setCurrentUser(null);
    setSelectedEntry(null);
    setEntries([]);
    setCurrentTab("editor");
  };

  // Handle Entry updates from Editor
  const handleUpdateEntry = (updated: JournalEntry) => {
    setSelectedEntry(updated);
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
  };

  // Handle Entry selection from History
  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setCurrentTab("editor");
  };

  // Handle Entry deletion
  const handleDeleteEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    if (selectedEntry?.id === entryId) {
      const remaining = entries.filter((e) => e.id !== entryId);
      if (remaining.length > 0) {
        setSelectedEntry(remaining[0]);
      } else if (currentUser) {
        setSelectedEntry(createNewEmptyEntry(currentUser.uid));
      }
    }
  };

  // Initial Auth Loading Screen
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-medium">Initializing Security & Identity...</p>
        </div>
      </div>
    );
  }

  // Not authenticated -> Show Landing & Auth Portal
  if (!currentUser) {
    return <LandingAuth onAuthenticated={(user) => setCurrentUser(user)} />;
  }

  // Active entry fallback
  const activeEntry = selectedEntry || createNewEmptyEntry(currentUser.uid);

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col">
      {/* Authenticated Dashboard Header */}
      <DashboardHeader
        user={currentUser}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onNewEntry={handleNewEntry}
        onSignOut={handleSignOut}
        totalEntriesCount={entries.length}
      />

      {/* Main Workspace */}
      <main className="flex-1 w-full pb-12">
        {currentTab === "editor" && (
          <JournalEditor
            user={currentUser}
            currentEntry={activeEntry}
            onUpdateEntry={handleUpdateEntry}
            onEntrySaved={handleUpdateEntry}
          />
        )}

        {currentTab === "history" && (
          <EntriesHistory
            user={currentUser}
            entries={entries}
            onSelectEntry={handleSelectEntry}
            onNewEntry={handleNewEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        )}

        {currentTab === "security" && (
          <SecurityIsolationView user={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-3 px-4 sm:px-6 text-xs text-stone-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-semibold text-stone-700">
              Gemini Reflection & Journal Studio
            </span>
            <span className="text-stone-300">•</span>
            <span>Cloud Firestore Owner Isolation & Secret Manager Security</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-stone-500">
            <span>Auth: Firebase Google SSO</span>
            <span className="text-stone-300">•</span>
            <span>Model: gemini-3.6-flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
