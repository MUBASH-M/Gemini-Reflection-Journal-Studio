import React, { useState } from "react";
import {
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Code,
  Tag,
  Key,
  Server,
} from "lucide-react";

export const CloudRunDeploymentGuide: React.FC = () => {
  const [projectId, setProjectId] = useState("my-gcp-project-id");
  const [serviceName, setServiceName] = useState("cloud-run-ai-security-engine");
  const [region, setRegion] = useState("asia-southeast1");
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const handleCopy = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const secretManagerCmd = `# 1. Create Secret in Google Cloud Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic" --project=${projectId}
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=- --project=${projectId}

# 2. Grant Cloud Run Service Account Secret Accessor IAM Role
PROJECT_NUMBER=$(gcloud projects describe ${projectId} --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \\
  --member="serviceAccount:\${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \\
  --role="roles/secretmanager.secretAccessor" \\
  --project=${projectId}`;

  const firestoreRulesCmd = `# Deploy Owner-Bound Firestore Security Rules
firebase deploy --only firestore:rules --project=${projectId}`;

  const cloudRunDeployCmd = `# Deploy full-stack container to Google Cloud Run
gcloud run deploy ${serviceName} \\
  --source . \\
  --region ${region} \\
  --platform managed \\
  --allow-unauthenticated \\
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \\
  --set-env-vars="NODE_ENV=production" \\
  --project=${projectId}`;

  const campaignLabelCmd = `# Mandatory Challenge Verification Resource Label
gcloud run services update ${serviceName} \\
  --update-labels=dev-tutorial=cloud-run-ai-challenge \\
  --region=${region} \\
  --project=${projectId}`;

  const verifyLabelCmd = `# Verify service labels
gcloud run services describe ${serviceName} \\
  --region=${region} \\
  --format="value(metadata.labels)" \\
  --project=${projectId}`;

  return (
    <div className="space-y-6">
      {/* Header Directives Context */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs tracking-wider uppercase">
              <Terminal className="w-4 h-4 text-emerald-700" />
              <span>Directive 7: Production Cloud Run Deployment & Campaign Verification</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mt-1">
              Cloud Run Deployment & Verification Hub
            </h1>
            <p className="text-sm text-stone-600 mt-1 max-w-3xl">
              Step-by-step production deployment workflow with Secret Manager IAM bindings, Firestore security rules deployment, and the mandatory campaign challenge label{" "}
              <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded text-emerald-700 font-bold">
                dev-tutorial=cloud-run-ai-challenge
              </code>
              .
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-mono font-medium flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              dev-tutorial=cloud-run-ai-challenge
            </span>
          </div>
        </div>
      </div>

      {/* Deployment Parameter Inputs */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <h3 className="text-sm font-bold text-stone-900 mb-3">Deployment Configuration Variables</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">GCP Project ID</label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Cloud Run Service Name</label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Compute Region</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Deployment Steps Accordion / Cards */}
      <div className="space-y-4">
        {/* Step 1: Secret Manager */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <Key className="w-4 h-4 text-emerald-700" />
              <span>Secret Manager Creation & IAM Service Account Binding</span>
            </div>
            <button
              onClick={() => handleCopy(secretManagerCmd, "step1")}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              {copiedStep === "step1" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStep === "step1" ? "Copied" : "Copy Command"}</span>
            </button>
          </div>
          <div className="p-4">
            <pre className="bg-stone-900 text-stone-100 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{secretManagerCmd}</code>
            </pre>
          </div>
        </div>

        {/* Step 2: Firestore Rules */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Deploy Owner-Bound Cloud Firestore Security Rules</span>
            </div>
            <button
              onClick={() => handleCopy(firestoreRulesCmd, "step2")}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              {copiedStep === "step2" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStep === "step2" ? "Copied" : "Copy Command"}</span>
            </button>
          </div>
          <div className="p-4">
            <pre className="bg-stone-900 text-stone-100 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{firestoreRulesCmd}</code>
            </pre>
          </div>
        </div>

        {/* Step 3: Cloud Run Deploy */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                3
              </span>
              <Server className="w-4 h-4 text-emerald-700" />
              <span>Deploy Full-Stack App to Google Cloud Run</span>
            </div>
            <button
              onClick={() => handleCopy(cloudRunDeployCmd, "step3")}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              {copiedStep === "step3" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStep === "step3" ? "Copied" : "Copy Command"}</span>
            </button>
          </div>
          <div className="p-4">
            <pre className="bg-stone-900 text-stone-100 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{cloudRunDeployCmd}</code>
            </pre>
          </div>
        </div>

        {/* Step 4: Mandatory Campaign Label */}
        <div className="bg-emerald-50/70 rounded-xl border border-emerald-300 shadow-xs overflow-hidden">
          <div className="p-4 bg-emerald-100/60 border-b border-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
              <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">
                4
              </span>
              <Tag className="w-4 h-4 text-emerald-800" />
              <span>Mandatory Campaign Verification Labeling (dev-tutorial=cloud-run-ai-challenge)</span>
            </div>
            <button
              onClick={() => handleCopy(campaignLabelCmd, "step4")}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-medium text-emerald-950 transition-colors cursor-pointer"
            >
              {copiedStep === "step4" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStep === "step4" ? "Copied" : "Copy Command"}</span>
            </button>
          </div>
          <div className="p-4 space-y-3">
            <pre className="bg-stone-900 text-emerald-300 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{campaignLabelCmd}</code>
            </pre>

            <div className="pt-2">
              <span className="text-xs font-semibold text-emerald-900 block mb-1">
                Verification command:
              </span>
              <pre className="bg-stone-900 text-stone-200 p-2.5 rounded-lg text-xs font-mono overflow-x-auto">
                <code>{verifyLabelCmd}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
