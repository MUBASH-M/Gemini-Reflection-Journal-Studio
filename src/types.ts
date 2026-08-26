export type ReflectionMode = "reflection" | "summary" | "brainstorm" | "reframing";

export interface ChatMessage {
  id: string;
  role: "user" | "gemini";
  content: string;
  timestamp: string;
  modelUsed?: string;
  mode?: ReflectionMode;
}

export interface EntrySummary {
  overarchingTheme: string;
  keyTakeaways: string[];
  actionItems: string[];
  moodAnalysis?: string;
  generatedAt: string;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  category: string;
  mood?: string;
  tags: string[];
  messages: ChatMessage[];
  summary?: EntrySummary;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

export interface AuthUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  providerId?: string;
}

export interface ReflectionApiResponse {
  reply: string;
  modelUsed: string;
  latencyMs: number;
  followUpQuestions?: string[];
  suggestedActionItems?: string[];
  timestamp: string;
}

export interface SummaryApiResponse {
  overarchingTheme: string;
  keyTakeaways: string[];
  actionItems: string[];
  moodAnalysis: string;
  modelUsed: string;
  latencyMs: number;
  timestamp: string;
}

// Auxiliary types for system security specifications and fallbacks
export type ThreatZone =
  | "Input Surfaces"
  | "Planning & Reasoning"
  | "Tool Execution"
  | "Memory & State"
  | "Inter-System Communication";

export interface ThreatItem {
  id: string;
  zone: ThreatZone;
  threatDescription: string;
  attackVector: string;
  owaspCategory: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  countermeasure: string;
  codeSnippet?: string;
}

export interface ThreatModelResult {
  title: string;
  architectureSummary: string;
  threatMatrix: ThreatItem[];
  mitigationPlan: string[];
  reviewedAt: string;
  modelUsed: string;
  fallbackTrace: FallbackAttempt[];
}

export interface FallbackAttempt {
  model: string;
  status: "success" | "failed" | "skipped";
  durationMs: number;
  statusCode?: number;
  errorMessage?: string;
}

export interface SecurityVulnerability {
  id: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  owaspClassification: string;
  lineRange?: string;
  description: string;
  codeSnippet: string;
  remediationDiff: {
    insecure: string;
    secure: string;
  };
  recommendation: string;
}

export interface SecurityReviewResult {
  summary: string;
  riskScore: number;
  vulnerabilities: SecurityVulnerability[];
  complianceChecklist: {
    zeroHardcodedKeys: boolean;
    ownerBoundFirestore: boolean;
    inputSanitization: boolean;
    outputEncoding: boolean;
    leastPrivilegeIAM: boolean;
  };
  modelUsed: string;
  fallbackTrace: FallbackAttempt[];
}

export interface GenerationResult {
  text: string;
  modelUsed: string;
  latencyMs: number;
  fallbackTrace: FallbackAttempt[];
  timestamp: string;
}

export interface FirestoreTestScenario {
  id: string;
  name: string;
  authUid: string | null;
  userRole?: string;
  path: string;
  operation: "read" | "write" | "delete";
  payload?: Record<string, unknown>;
  expectedOutcome: "ALLOW" | "DENY";
}

export interface FirestoreTestResult {
  scenarioId: string;
  scenarioName: string;
  outcome: "ALLOW" | "DENY";
  expectedOutcome: "ALLOW" | "DENY";
  passed: boolean;
  ruleMatched: string;
  details: string;
  sanitizedPayload?: Record<string, unknown>;
}

export interface SavedInteractionRecord {
  id: string;
  userId: string;
  timestamp: string;
  inputPrompt: string;
  generatedOutput: string;
  modelUsed: string;
  persistedSuccessfully: boolean;
  sanitizedFieldsCount: number;
}

export interface WalkthroughTestCase {
  id: string;
  category: "Threat Modeling" | "Model Fallback Ladder" | "Security Audit" | "Firestore Isolation" | "Cloud Run Deployment";
  title: string;
  userAction: string;
  expectedBehavior: string;
  verificationSteps: string[];
  status: "pending" | "passed" | "failed";
}
