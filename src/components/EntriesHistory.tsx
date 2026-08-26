import React, { useState } from "react";
import {
  Search,
  BookOpen,
  Calendar,
  Sparkles,
  Trash2,
  ArrowRight,
  Filter,
  CheckCircle2,
  FileText,
  Clock,
  Tag,
  Plus,
} from "lucide-react";
import { JournalEntry, AuthUserProfile } from "../types";
import { deleteJournalEntry } from "../firebase";

interface EntriesHistoryProps {
  user: AuthUserProfile;
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
}

export const EntriesHistory: React.FC<EntriesHistoryProps> = ({
  user,
  entries,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Categories list
  const categories = ["all", ...Array.from(new Set(entries.map((e) => e.category).filter(Boolean)))];

  // Filtered entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.summary?.overarchingTheme || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || entry.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this journal entry from Firestore?")) {
      return;
    }

    setIsDeletingId(entryId);
    try {
      await deleteJournalEntry(user.uid, entryId);
      onDeleteEntry(entryId);
    } catch (err) {
      console.error("Failed to delete entry:", err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const summarizedCount = entries.filter((e) => Boolean(e.summary)).length;
  const totalMessagesCount = entries.reduce((acc, e) => acc + e.messages.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900">
              Journal & Reflection Archive
            </h1>
            <p className="text-xs text-stone-500">
              Your private collection of past reflections and Gemini syntheses.
            </p>
          </div>

          <button
            onClick={onNewEntry}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Reflection</span>
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-100">
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
            <span className="text-[11px] text-stone-500 font-medium">Total Entries</span>
            <p className="text-lg font-bold text-stone-900">{entries.length}</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
            <span className="text-[11px] text-stone-500 font-medium">Executive Summaries</span>
            <p className="text-lg font-bold text-emerald-800">{summarizedCount}</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-stone-500 font-medium">Multi-Turn Turns</span>
            <p className="text-lg font-bold text-stone-900">{totalMessagesCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries, keywords, summaries..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl focus:outline-hidden transition-all text-stone-800"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap capitalize transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-700 text-white font-semibold"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List / Cards */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-800">
              {searchQuery || selectedCategory !== "all"
                ? "No matching journal entries found"
                : "No journal entries yet"}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search query or category filter."
                : "Start your first multi-turn reflection session with Gemini 3.6 Flash."}
            </p>
          </div>
          <button
            onClick={onNewEntry}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Start Reflection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const userTurns = entry.messages.filter((m) => m.role === "user").length;
            const geminiTurns = entry.messages.filter((m) => m.role === "gemini").length;
            const lastMessage = entry.messages[entry.messages.length - 1];

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-500 shadow-xs hover:shadow-sm p-5 space-y-3 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                        {entry.category || "General"}
                      </span>
                      {entry.mood && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold">
                          {entry.mood}
                        </span>
                      )}
                      {entry.summary && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                          <span>Summarized</span>
                        </span>
                      )}
                    </div>

                    <span className="text-stone-400 flex items-center gap-1 text-[10px] font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                    {entry.title || "Untitled Reflection"}
                  </h3>

                  {/* Preview or Summary snippet */}
                  {entry.summary ? (
                    <p className="text-xs text-stone-600 line-clamp-2 bg-stone-50 p-2 rounded-lg border border-stone-100 italic">
                      &quot;{entry.summary.overarchingTheme}&quot;
                    </p>
                  ) : lastMessage ? (
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-xs text-stone-400 italic">No messages in this session yet.</p>
                  )}
                </div>

                {/* Footer action bar */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                    <span>{entry.messages.length} messages</span>
                    <span>•</span>
                    <span className="font-mono">/users/{user.uid.slice(0, 6)}...</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDelete(e, entry.id)}
                      disabled={isDeletingId === entry.id}
                      title="Delete Entry"
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="flex items-center gap-1 text-emerald-700 font-semibold text-xs pl-2 group-hover:translate-x-0.5 transition-transform">
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
