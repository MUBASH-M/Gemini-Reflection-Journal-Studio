import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  FileText,
  CheckCircle2,
  ListChecks,
  Compass,
  Lightbulb,
  RefreshCw,
  Copy,
  Check,
  Tag,
  Smile,
  Clock,
  ArrowRight,
  Database,
  Share2,
  Download,
  Flame,
  HelpCircle,
} from "lucide-react";
import {
  JournalEntry,
  ChatMessage,
  ReflectionMode,
  EntrySummary,
  AuthUserProfile,
  ReflectionApiResponse,
  SummaryApiResponse,
} from "../types";
import { saveJournalEntry } from "../firebase";

interface JournalEditorProps {
  user: AuthUserProfile;
  currentEntry: JournalEntry;
  onUpdateEntry: (entry: JournalEntry) => void;
  onEntrySaved: (entry: JournalEntry) => void;
}

const CATEGORIES = [
  "Personal Growth",
  "Strategy & Work",
  "Emotional Wellness",
  "Creative Ideation",
  "Daily Reflection",
  "Decision Making",
];

const MOODS = [
  { label: "Inspired", emoji: "✨", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { label: "Focused", emoji: "🎯", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { label: "Reflective", emoji: "🌿", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { label: "Challenged", emoji: "⚡", color: "bg-orange-50 text-orange-800 border-orange-200" },
  { label: "Optimistic", emoji: "☀️", color: "bg-teal-50 text-teal-800 border-teal-200" },
];

const PROMPT_STARTERS = [
  "What was the most important decision I made today, and what trade-offs did it involve?",
  "I'm feeling stuck between two competing priorities. Help me evaluate them objectively.",
  "Help me reflect on a recent conversation that didn't go as expected.",
  "Brainstorm 4 creative angles to improve team velocity without burnout.",
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  user,
  currentEntry,
  onUpdateEntry,
  onEntrySaved,
}) => {
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<ReflectionMode>("reflection");
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [followUpPrompts, setFollowUpPrompts] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentEntry.messages, isLoading]);

  // Persist entry changes to Firestore with feedback
  const triggerSave = async (updated: JournalEntry) => {
    setIsSaving(true);
    try {
      await saveJournalEntry(user.uid, updated);
      onEntrySaved(updated);
      setSaveStatus("Saved to Firestore");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error("Error saving entry to Firestore:", err);
      setSaveStatus("Failed to sync with Firestore");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    const updated = { ...currentEntry, title: newTitle, updatedAt: new Date().toISOString() };
    onUpdateEntry(updated);
  };

  const handleTitleBlur = () => {
    triggerSave(currentEntry);
  };

  const handleCategoryChange = (category: string) => {
    const updated = { ...currentEntry, category, updatedAt: new Date().toISOString() };
    onUpdateEntry(updated);
    triggerSave(updated);
  };

  const handleMoodSelect = (mood: string) => {
    const updated = { ...currentEntry, mood, updatedAt: new Date().toISOString() };
    onUpdateEntry(updated);
    triggerSave(updated);
  };

  // Send message to Gemini 3.6 Flash reflection endpoint
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputText;
    if (!promptToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: promptToSend.trim(),
      timestamp: new Date().toISOString(),
      mode,
    };

    const updatedMessages = [...currentEntry.messages, userMessage];
    const updatedEntryWithUser = {
      ...currentEntry,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    onUpdateEntry(updatedEntryWithUser);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: userMessage.content,
          messages: currentEntry.messages,
          mode,
          entryTitle: currentEntry.title,
          category: currentEntry.category,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data: ReflectionApiResponse = await response.json();

      const geminiMessage: ChatMessage = {
        id: `msg_${Date.now()}_gemini`,
        role: "gemini",
        content: data.reply,
        timestamp: data.timestamp || new Date().toISOString(),
        modelUsed: data.modelUsed,
        mode,
      };

      if (data.followUpQuestions && data.followUpQuestions.length > 0) {
        setFollowUpPrompts(data.followUpQuestions);
      }

      const finalizedEntry: JournalEntry = {
        ...updatedEntryWithUser,
        messages: [...updatedMessages, geminiMessage],
        updatedAt: new Date().toISOString(),
      };

      onUpdateEntry(finalizedEntry);
      await triggerSave(finalizedEntry);
    } catch (err: unknown) {
      console.error("Gemini reflection call failed:", err);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: "gemini",
        content: `*Notice: Service connection issue. Please verify your GEMINI_API_KEY secret or network status.*`,
        timestamp: new Date().toISOString(),
        modelUsed: "fallback-notice",
      };
      const updatedWithError = {
        ...updatedEntryWithUser,
        messages: [...updatedMessages, errorMessage],
      };
      onUpdateEntry(updatedWithError);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Executive Summary
  const handleGenerateSummary = async () => {
    if (currentEntry.messages.length === 0 || isSummarizing) return;
    setIsSummarizing(true);

    try {
      const res = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentEntry.messages,
          entryTitle: currentEntry.title,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate summary");
      const summaryData: SummaryApiResponse = await res.json();

      const summary: EntrySummary = {
        overarchingTheme: summaryData.overarchingTheme,
        keyTakeaways: summaryData.keyTakeaways,
        actionItems: summaryData.actionItems,
        moodAnalysis: summaryData.moodAnalysis,
        generatedAt: summaryData.timestamp || new Date().toISOString(),
        modelUsed: summaryData.modelUsed,
      };

      const updated = {
        ...currentEntry,
        summary,
        updatedAt: new Date().toISOString(),
      };

      onUpdateEntry(updated);
      await triggerSave(updated);
    } catch (err) {
      console.error("Error summarizing entry:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopySummary = () => {
    if (!currentEntry.summary) return;
    const text = `Title: ${currentEntry.title}
Theme: ${currentEntry.summary.overarchingTheme}

Key Takeaways:
${currentEntry.summary.keyTakeaways.map((t) => `• ${t}`).join("\n")}

Action Items:
${currentEntry.summary.actionItems.map((a) => `[ ] ${a}`).join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleExportMarkdown = () => {
    let md = `# ${currentEntry.title}\n\n`;
    md += `**Category:** ${currentEntry.category} | **Date:** ${new Date(currentEntry.createdAt).toLocaleDateString()}\n\n`;
    if (currentEntry.summary) {
      md += `## Executive Summary\n${currentEntry.summary.overarchingTheme}\n\n`;
      md += `### Key Takeaways\n${currentEntry.summary.keyTakeaways.map((t) => `- ${t}`).join("\n")}\n\n`;
      md += `### Action Items\n${currentEntry.summary.actionItems.map((a) => `- [ ] ${a}`).join("\n")}\n\n`;
    }
    md += `## Journal Transcript\n\n`;
    for (const msg of currentEntry.messages) {
      md += `### ${msg.role === "user" ? "User Reflection" : "Gemini Reflection Partner"}\n${msg.content}\n\n`;
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentEntry.title.toLowerCase().replace(/[^a-z0-9]/g, "-") || "reflection"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Meta Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title Input */}
          <div className="flex-1">
            <input
              id="entry-title-input"
              type="text"
              value={currentEntry.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Give your reflection a meaningful title..."
              className="w-full text-xl sm:text-2xl font-extrabold text-stone-900 placeholder:text-stone-300 border-b border-transparent hover:border-stone-200 focus:border-emerald-600 focus:outline-hidden pb-1 transition-colors"
            />
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Firestore sync status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-[11px] font-mono text-stone-600">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isSaving ? "Syncing..." : saveStatus || "Firestore Synced"}</span>
            </div>

            {/* Export Markdown */}
            <button
              onClick={handleExportMarkdown}
              title="Export as Markdown"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {/* Summarize button */}
            <button
              id="summarize-entry-btn"
              onClick={handleGenerateSummary}
              disabled={isSummarizing || currentEntry.messages.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              {isSummarizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isSummarizing ? "Synthesizing..." : "Summarize Session"}</span>
            </button>
          </div>
        </div>

        {/* Category & Mood Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-xs">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={currentEntry.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-stone-700 font-medium rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-600 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Mood Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Smile className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-500 font-medium">State:</span>
            {MOODS.map((m) => (
              <button
                key={m.label}
                onClick={() => handleMoodSelect(m.label)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                  currentEntry.mood === m.label
                    ? m.color + " font-bold ring-1 ring-emerald-600 shadow-2xs"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                <span>{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Multi-turn Chat & Summary Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Multi-Turn Conversation Thread */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          {/* Messages Container */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-6 min-h-[420px] max-h-[600px] overflow-y-auto space-y-5">
            {currentEntry.messages.length === 0 ? (
              <div className="text-center py-12 space-y-4 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-800">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-stone-800">Begin Your Multi-Turn Reflection</h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Type your thoughts or pick a starter below. Gemini 3.6 Flash will converse, ask insightful follow-ups, and help you distill clarity.
                  </p>
                </div>

                {/* Starter Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left max-w-lg mx-auto">
                  {PROMPT_STARTERS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3 bg-stone-50 hover:bg-emerald-50/70 border border-stone-200 hover:border-emerald-300 rounded-xl text-left text-xs text-stone-700 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span className="line-clamp-2 leading-relaxed">{prompt}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              currentEntry.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "gemini" && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-1 ${
                      msg.role === "user"
                        ? "bg-emerald-800 text-white rounded-tr-xs"
                        : "bg-stone-50 border border-stone-200 text-stone-800 rounded-tl-xs shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 font-mono mb-1">
                      <span>{msg.role === "user" ? "You" : "Gemini 3.6 Flash"}</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                      {msg.content}
                    </div>

                    {msg.modelUsed && msg.role === "gemini" && (
                      <div className="pt-1 text-[10px] text-stone-400 font-mono">
                        via {msg.modelUsed}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-3 items-center text-stone-500 text-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                  <span>Gemini 3.6 Flash is synthesizing insights...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Follow-up Prompts suggestions chips */}
          {followUpPrompts.length > 0 && !isLoading && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1.5">
                <HelpCircle className="w-3 h-3 text-emerald-700" />
                <span>Suggested Follow-Up Reflections:</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {followUpPrompts.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="text-left text-xs bg-white hover:bg-emerald-100 text-stone-800 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode Selector & Input Bar */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            {/* Mode selection tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider pl-1">
                Mode:
              </span>
              {[
                { id: "reflection", label: "Reflective Synthesis", icon: Compass },
                { id: "brainstorm", label: "Brainstorming", icon: Lightbulb },
                { id: "reframing", label: "Cognitive Reframing", icon: RefreshCw },
                { id: "summary", label: "Executive Synthesis", icon: FileText },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as ReflectionMode)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-emerald-100/90 text-emerald-900 font-bold border border-emerald-300"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Form */}
            <div className="flex items-end gap-2">
              <textarea
                id="reflection-input-textarea"
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Write your journal entry, thought, dilemma, or question... (Enter to send, Shift+Enter for newline)"
                className="flex-1 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl p-3 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden resize-none transition-all"
              />

              <button
                id="send-reflection-btn"
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputText.trim()}
                className="p-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Summary & Action Plan Inspector */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <ListChecks className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">Executive Summary & Actions</h3>
              </div>

              {currentEntry.summary && (
                <button
                  onClick={handleCopySummary}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-md transition-colors cursor-pointer"
                  title="Copy summary"
                >
                  {copiedSummary ? (
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            {currentEntry.summary ? (
              <div className="space-y-4 text-xs">
                {/* Overarching Theme */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Overarching Theme
                  </span>
                  <p className="text-stone-800 leading-relaxed font-medium">
                    {currentEntry.summary.overarchingTheme}
                  </p>
                  {currentEntry.summary.moodAnalysis && (
                    <div className="pt-1 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                      <span>Tone:</span>
                      <span className="bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-200">
                        {currentEntry.summary.moodAnalysis}
                      </span>
                    </div>
                  )}
                </div>

                {/* Key Takeaways */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Key Insights & Realizations
                  </span>
                  <ul className="space-y-1.5">
                    {currentEntry.summary.keyTakeaways.map((takeaway, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-stone-700 bg-stone-50/70 p-2 rounded-lg border border-stone-100"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                        <span className="leading-snug">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Cultivated Action Items
                  </span>
                  <ul className="space-y-1.5">
                    {currentEntry.summary.actionItems.map((action, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-stone-700 bg-emerald-50/40 p-2 rounded-lg border border-emerald-100"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                        />
                        <span className="leading-snug">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-stone-100 text-[10px] text-stone-400 flex items-center justify-between font-mono">
                  <span>Generated via {currentEntry.summary.modelUsed || "Gemini 3.6 Flash"}</span>
                  <span>{new Date(currentEntry.summary.generatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-stone-700">No summary generated yet</p>
                  <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                    Converse with Gemini in the studio, then click &quot;Summarize Session&quot; to synthesize key insights and action items.
                  </p>
                </div>

                <button
                  onClick={handleGenerateSummary}
                  disabled={currentEntry.messages.length === 0 || isSummarizing}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
                >
                  Synthesize Summary
                </button>
              </div>
            )}
          </div>

          {/* User Isolation Badge Card */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-stone-800 font-bold">
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span>Owner-Isolated Cloud Firestore</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              This session is bound to your user record:
            </p>
            <div className="p-2 bg-white rounded-lg border border-stone-200 font-mono text-[10px] text-stone-700 break-all">
              /users/{user.uid}/entries/{currentEntry.id}
            </div>
            <p className="text-[10px] text-emerald-800 font-semibold">
              🔒 Other users are prevented from reading or writing this document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
