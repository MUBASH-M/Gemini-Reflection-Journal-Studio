# Cloud Run AI Security & Fallback Engine

A production-ready reference platform and developer workbench implementing strict **Agentic Threat Modeling**, **OWASP Top 10 Web & LLM Mitigations**, **Zero-Hardcoding Secret Hygiene**, **Firestore Security Isolation**, and the resilient **Gemini Model Fallback Ladder**.

---

## 🛠️ Architecture & Core Security Directives

1. **Agentic Threat Modeling**: 5-Zone threat analysis (Input Surfaces, Planning & Reasoning, Tool Execution, Memory & State, Inter-System Communication).
2. **Secure Coding Standard**: Zero trust input validation, indirect prompt injection defense, JWT auth verification, strict HTML/JS output encoding.
3. **Resilient Gemini Fallback Ladder**:
   - Primary: `gemini-3.6-flash`
   - High-Availability Fallback: `gemini-3.1-flash-lite`
   - Dynamic Alias: `gemini-flash-latest`
   - Deep Reasoning Fallback: `gemini-3.7-flash`
   - Automated HTTP error recovery (`503`, `429`, `404`, `500`).
4. **Zero-Hardcoding Hygiene**: Dynamic Secret Manager credential resolution and server-side secret encapsulation.
5. **Firestore Data Isolation**: Owner-bound documents (`request.auth.uid == userId`) and zero-insecure defaults.

---

## 🔐 1. Secret Management Setup (Google Cloud Secret Manager)

Create and bind your secrets securely without hardcoding:

```bash
# Set your GCP Project ID
export PROJECT_ID="YOUR_PROJECT_ID"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# 1. Create and populate the Gemini API Secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant Cloud Run runtime service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🛡️ 2. Cloud Firestore Security Rules Configuration

Deploy strict, owner-bound isolation rules ensuring zero unauthorized data leaks:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User Data Isolation
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /threat_models/{modelId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /security_audits/{auditId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Role-Based Access Control (RBAC)
    match /admin_audit_logs/{logId} {
      allow read, write: if request.auth != null && (
        request.auth.token.role == 'admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }

    // Zero Insecure Defaults
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy the rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 🚀 3. Google Cloud Run Deployment

Deploy the containerized full-stack application directly to Google Cloud Run:

```bash
# Deploy service with mounted Secret Manager environment variable
gcloud run deploy cloud-run-ai-security-engine \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production"
```

---

## 🏷️ 4. Mandatory Campaign Verification Binding

Apply the official challenge verification label to register your Cloud Run service for automated verification:

```bash
gcloud run services update cloud-run-ai-security-engine \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

Verify the labels applied:
```bash
gcloud run services describe cloud-run-ai-security-engine \
  --region=asia-southeast1 \
  --format="value(metadata.labels)"
```

---

## 🧪 5. Local Development

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Production build and bundle
npm run build
npm start
```
