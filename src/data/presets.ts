import { WalkthroughTestCase } from "../types";

export const ARCHITECTURE_PRESETS = [
  {
    id: "agentic-cloud-run",
    name: "Autonomous Cloud Run Agent with Function Calling & Tools",
    description: "Multi-tool autonomous agent running on Cloud Run with dynamic Google Sheets & Cloud SQL execution.",
    architecture: `Architecture Blueprint:
- Frontend: Single Page React client communicating with Cloud Run Express proxy.
- Backend: Express.js running on Google Cloud Run with Secret Manager binding (GEMINI_API_KEY).
- AI Engine: Gemini 3.6 Flash / 3.1 Flash Lite with dynamic function calling (search, database query, workspace export).
- State & Persistence: Google Cloud Firestore with /users/{userId}/interactions paths.
- External Integrations: Google Workspace API (OAuth2 client-side popup) and Cloud SQL connector.
- Memory: Vector embeddings and conversation history persisted in Firestore.`,
  },
  {
    id: "rag-document-pipeline",
    name: "Multi-Tenant Document Intelligence & RAG Pipeline",
    description: "Document ingestion service parsing untrusted PDFs and generating semantic answers.",
    architecture: `Architecture Blueprint:
- Ingestion: User uploads PDFs and text files parsed via Cloud Storage bucket triggers.
- Processing: Unstructured text chunking and indexing into Vector Search.
- Inference: Gemini model retrieves relevant chunks and synthesizes summaries for authenticated users.
- Access Boundary: RBAC with multi-tenant isolation where tenant_id is checked in JWT token.
- Output: Markdown rendered in React UI with streaming SSE.`,
  },
  {
    id: "customer-support-voice",
    name: "Real-Time Customer Support Voice & Live Agent",
    description: "Gemini Live API WebSocket streaming service handling customer voice and CRM updates.",
    architecture: `Architecture Blueprint:
- Transport: Bidirectional WebSocket connection (/live) bridging browser AudioContext to Gemini Live API.
- Audio Formats: 16kHz PCM input and 24kHz PCM output.
- Server Layer: Cloud Run container orchestrating session state and tool calls for ticketing systems.
- Credentials: Service account with roles/secretmanager.secretAccessor retrieving API keys at runtime.`,
  },
];

export const VULNERABLE_CODE_PRESETS = [
  {
    id: "hardcoded-and-open-rules",
    name: "Hardcoded API Key & Insecure Firestore Wildcard",
    code: `import express from "express";
import { GoogleGenAI } from "@google/genai";

// VULNERABILITY 1: Hardcoded API Key
const API_KEY = "AIzaSyD98fExampleKeyInsecureHardcodedKey";
const ai = new GoogleGenAI({ apiKey: API_KEY });

const app = express();

// VULNERABILITY 2: Insecure Firestore Rule (conceptually embedded)
// service cloud.firestore { match /{document=**} { allow read, write: if true; } }

// VULNERABILITY 3: Direct Prompt Concatenation (Indirect Prompt Injection)
app.post("/api/ask", async (req, res) => {
  const userInput = req.body.userInput;
  const prompt = "You are a customer assistant. Process this: " + userInput;
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt
  });
  res.json({ result: response.text });
});`,
  },
  {
    id: "broken-access-control",
    name: "Broken Access Control & Missing Sanitization",
    code: `import express from "express";
const app = express();

// VULNERABILITY 1: Missing JSON body parser ordering guarantee
// routes defined before app.use(express.json())

app.post("/api/user/:targetUserId/data", async (req, res) => {
  // VULNERABILITY 2: Broken Access Control - Trusts client param without JWT auth check
  const targetUserId = req.params.targetUserId;
  const payload = req.body;
  
  // VULNERABILITY 3: Missing undefined stripping - crashes database driver if undefined keys exist
  await database.collection("users").doc(targetUserId).set(payload);
  res.json({ success: true });
});`,
  },
];

export const INITIAL_TEST_CASES: WalkthroughTestCase[] = [
  {
    id: "TC-01",
    category: "Threat Modeling",
    title: "Verify 5-Zone Threat Summary Table Generation",
    userAction: "Select an architecture preset and click 'Generate Threat Model'.",
    expectedBehavior: "System maps architecture against Input Surfaces, Planning, Tool Execution, Memory, and Inter-System Communication with OWASP classifications and mitigation code.",
    verificationSteps: [
      "1. Navigate to 'Threat Modeling' tab.",
      "2. Select 'Autonomous Cloud Run Agent'.",
      "3. Click 'Run Agentic Threat Analysis'.",
      "4. Verify 5 distinct zone cards appear with severity tags and countermeasures.",
    ],
    status: "pending",
  },
  {
    id: "TC-02",
    category: "Model Fallback Ladder",
    title: "Verify Model Ladder Recovery on Primary Service Interruption (503)",
    userAction: "Enable 'Simulate 503 on gemini-3.6-flash' and send a generation request.",
    expectedBehavior: "Primary model attempt fails gracefully with 503 trace, and system automatically falls back to 'gemini-3.1-flash-lite' without user error.",
    verificationSteps: [
      "1. Navigate to 'Model Fallback Ladder' tab.",
      "2. Check 'Simulate 503 on gemini-3.6-flash'.",
      "3. Click 'Execute Prompt with Fallback Ladder'.",
      "4. Inspect Fallback Trace: Step 1 shows 'failed (503)' and Step 2 shows 'success' with green status.",
    ],
    status: "pending",
  },
  {
    id: "TC-03",
    category: "Security Audit",
    title: "Verify Automated Detection of Hardcoded Keys & Insecure Rules",
    userAction: "Load sample code containing 'AIzaSy...' and open Firestore rules, then click 'Run Security Audit'.",
    expectedBehavior: "Auditor flags Critical severity vulnerabilities, provides side-by-side code diffs, and computes risk score.",
    verificationSteps: [
      "1. Navigate to 'Security Reviewer' tab.",
      "2. Load 'Hardcoded API Key & Insecure Firestore Wildcard'.",
      "3. Click 'Audit Code & Config'.",
      "4. Confirm diff shows migration to process.env.GEMINI_API_KEY and owner-bound Firestore rules.",
    ],
    status: "pending",
  },
  {
    id: "TC-04",
    category: "Firestore Isolation",
    title: "Verify Owner-Bound Isolation & Strict Undefined Stripping",
    userAction: "Run test requests for authenticated owner vs. unauthenticated/cross-user requests with undefined properties.",
    expectedBehavior: "Owner request to /users/user_123 succeeds (ALLOW), cross-user request to /users/user_456 is blocked (DENY), and undefined properties are stripped clean.",
    verificationSteps: [
      "1. Navigate to 'Firestore & Storage Studio' tab.",
      "2. Test 'Owner Access' scenario -> Confirm 'ALLOW'.",
      "3. Test 'Cross-User Access' scenario -> Confirm 'DENY'.",
      "4. Test 'Undefined Payload Sanitizer' -> Confirm 0 undefined keys reach storage.",
    ],
    status: "pending",
  },
  {
    id: "TC-05",
    category: "Cloud Run Deployment",
    title: "Verify Challenge Labeling & Secret Manager Bindings",
    userAction: "Inspect generated deployment script and verification label commands.",
    expectedBehavior: "Commands include exact Secret Manager IAM bindings, Cloud Run deploy, and mandatory label --update-labels=dev-tutorial=cloud-run-ai-challenge.",
    verificationSteps: [
      "1. Navigate to 'Cloud Run Deployment' tab.",
      "2. Review Secret Manager creation commands.",
      "3. Confirm presence of '--update-labels=dev-tutorial=cloud-run-ai-challenge'.",
      "4. Click 'Copy Complete Deployment Script' and verify clipboard content.",
    ],
    status: "pending",
  },
];
