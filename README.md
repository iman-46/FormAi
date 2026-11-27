# FormWise AI — Understand Paperwork. Know What To Do Next.

**#BuildHybridAI 2026 Competition Submission**

FormWise AI is an intelligent document understanding and workflow assistant built for desktop Google Chrome using **Firebase AI Logic** hybrid inference (on-device Chrome Gemini Nano + cloud Gemini fallback), **Firebase App Check**, **Firebase Authentication**, **Cloud Firestore**, and **Firebase Remote Config**.

> **Informational Disclaimer:** FormWise AI is an informational document assistant, not an official authority, legal advisor, or substitute for verifying requirements, fees, eligibility, or deadlines directly with the issuing organization.

---

## Core Capabilities

1. **Browser-First Document Analyzer**: Drag-and-drop upload for PDF (`pdfjs-dist`), DOCX (`mammoth`), TXT, and pasted text. Detects scanned/image-based PDFs honestly and offers a user-consented Cloud Multimodal OCR pathway instead of fabricating extracted text.
2. **AI Document Simplifier & Multi-Language Mode**: Breaks down dense clauses into *Original Clause*, *Simplified Explanation*, *Why It Matters*, and *What You Should Do* across three clarity levels (`Very Simple`, `Standard`, `Detailed`) and multiple languages (`Simple English`, `Hindi`, `Bengali`, `Spanish`, `French`).
3. **Action Plan Generator**: Generates ordered, editable, priority-ranked steps with completion checkboxes, deadlines, and document source references.
4. **Deadline Intelligence**: Extracts application, verification, payment, exam, and interview dates into Timeline and Calendar views, flagging ambiguous dates for manual verification without inventing missing dates.
5. **Document Requirement Checker**: Separates mandatory documents from optional/conditional recommendations using source wording and tracks user readiness (`Available`, `Missing`, `Needs Verification`, `Not Applicable`).
6. **Ask Your Document (Multi-Turn Cloud Chat)**: Grounded conversational assistant via Firebase AI Logic cloud chat with section citations and explicit uncertainty warnings.
7. **Document Comparison**: Compares two documents side by side using Cloud AI to isolate changed deadlines, fee updates, different requirements, and conflicting instructions.
8. **Hybrid AI Transparency Dashboard (`/ai-activity`)**: Displays live on-device model initialization/download progress, active inference mode, Remote Config cloud model ID, and real recorded `result.response.inferenceSource` (`on_device` vs `in_cloud`) counts and per-request logs.

---

## Hybrid AI Architecture (Firebase AI Logic)

All generative requests flow through `src/firebase/aiLogic.ts` and `src/services/hybridAIService.ts` using the official `firebase/ai` Web SDK:

```ts
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, {
  mode: InferenceMode.PREFER_ON_DEVICE,
  inCloudParams: { model: remoteConfigCloudModelId },
});
```

- **User-Triggered On-Device Initialization**: `model.initializeDeviceModel(progress => ...)` is invoked from explicit UI actions and reports real download progress (`0%`–`100%`) without blocking the workspace.
- **Official Inference Modes**: Supports `PREFER_ON_DEVICE`, `PREFER_IN_CLOUD`, `ONLY_ON_DEVICE` (for strict local verification), and `ONLY_IN_CLOUD` (for multi-turn chat, two-document comparison, and Cloud OCR).
- **Verifiable Source Telemetry**: Every operation inspects `result.response.inferenceSource` (`on_device` or `in_cloud`) directly from the SDK response—never guessed from browser user-agent checks.

---

## Firebase Setup Instructions

### 1. Project Configuration
Provisioned config lives in `firebase-applet-config.json`. To connect your own Firebase project:
1. Create or select a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firebase AI Logic** (Gemini Developer API / `GoogleAIBackend`).
3. Replace `firebase-applet-config.json` with your Web App config (including `firestoreDatabaseId` if using a named Firestore database).

### 2. Firebase App Check (Mandatory)
- **Local Development / Preview**: `src/firebase/appCheck.ts` sets `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` before `initializeAppCheck()`.
  1. Open Chrome DevTools Console while running the app locally and copy the generated App Check debug token UUID.
  2. In Firebase Console → **App Check** → **Apps** → your Web app → **Manage debug tokens**, register that token.
  3. Never commit debug tokens to GitHub.
- **Production**: Register a **reCAPTCHA v3** site key in Firebase App Check and set `VITE_FIREBASE_APPCHECK_SITE_KEY` in your deployment environment (or `recaptchaSiteKey` in `firebase-applet-config.json`).

### 3. Firebase Authentication
- **Google Sign-In**: Enabled via `signInWithPopup`.
- **Email & Password + Password Reset**: In Firebase Console → **Authentication** → **Sign-in method**, enable **Email/Password**. New email registrations automatically trigger `sendEmailVerification` so verified accounts satisfy Firestore security rules.

### 4. Cloud Firestore & Hardened Security Rules
- Schema blueprint: `firebase-blueprint.json`
- Production security rules: `firestore.rules` (validated with `@firebase/eslint-plugin-security-rules`)
- All private records live under `/users/{userId}/...` with strict owner verification, verified-email enforcement, key allowlisting, bounded string/array validation, and zero cross-user read/list access.
- Deploy rules with:
  ```bash
  npx firebase deploy --only firestore:rules
  ```

### 5. Firebase Remote Config
Publish the following keys in Firebase Console → **Remote Config** (safe defaults are bundled in `src/firebase/remoteConfig.ts`):
- `cloud_model_id` (String, default `gemini-3.5-flash-lite`)
- `hybrid_inference_mode` (String, default `prefer_on_device`)
- `max_input_chars` (Number, default `36000`)
- `max_output_tokens` (Number, default `2048`)
- `supported_languages` (String, default `Simple English,Hindi,Bengali,Spanish,French`)
- `enable_document_compare` (Boolean, default `true`)
- `enable_multi_language` (Boolean, default `true`)
- `enable_cloud_ocr` (Boolean, default `true`)

---

## Local Development & Deployment

```bash
npm install
npm run lint
npm run build
npm run dev
```

Deploy to Firebase Hosting:
```bash
npm run build
npx firebase deploy --only hosting,firestore:rules
```

---

## Competition Submission Materials

### Submission Description (Short)
**FormWise AI** helps people decode dense official forms, admission notices, and policy PDFs using genuine hybrid AI powered by Firebase AI Logic. Standard text extraction runs privately in the browser via PDF.js and Mammoth, single-turn clause simplifications and workflow extraction prioritize on-device Chrome Gemini Nano with transparent automatic fallback to cloud Gemini, and every request logs its verified `inferenceSource` alongside user-scoped Firestore persistence protected by Firebase App Check.

### 3-Minute YouTube Demo Script
- **0:00–0:30 (Problem & Landing Page)**: Introduce FormWise AI (`"Understand paperwork. Know what to do next."`), highlight privacy-first browser extraction and Firebase AI Logic hybrid routing, and click **Try Competition Demo**.
- **0:30–1:10 (Demo Document & On-Device Simplification)**: Show the fictional *Northbridge Institute Fall 2027 Admission Notice*. Click **Initialize On-Device Model** to show live download/readiness progress, switch explanation levels (`Very Simple` / `Standard` / `Detailed`) and `Hindi` translation, and point out the live `ON_DEVICE` / `IN_CLOUD` indicator.
- **1:10–1:55 (Action Plan, Deadlines & Checklist)**: Run **Analyze Everything**, check off a step in **Action Plans**, inspect the **Deadlines** timeline & calendar (highlighting ambiguous May 2027 date verification), and mark documents in **Document Checklist**.
- **1:55–2:35 (Cloud Multi-Turn Q&A & Document Comparison)**: Open **Ask AI**, approve the one-time **Cloud AI Consent Modal**, ask *"What happens if I miss the March 18 deadline?"*, then open **Compare Documents** to compare the original notice against *Addendum No. 1* and surface changed deadlines and fee updates.
- **2:35–3:00 (Hybrid AI Transparency & Security)**: Open **AI Activity** to show real recorded `ON_DEVICE`, `IN_CLOUD`, and `FALLBACK` counts, and briefly show **Settings** with App Check, Remote Config, and Firestore retention controls.

### Summary of Work Built
- React 19 + TypeScript + Vite + Tailwind v4 dual-theme SaaS workspace (13 views/routes).
- Browser-side PDF/DOCX/TXT ingestion with scanned-PDF detection and Cloud OCR fallback.
- Official `firebase/ai` hybrid integration (`PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, `PREFER_IN_CLOUD`, `ONLY_IN_CLOUD`), `initializeDeviceModel` progress tracking, and real `inferenceSource` telemetry.
- Hardened Firestore rules (`firestore.rules`) validated with `@firebase/eslint-plugin-security-rules`, Firebase App Check, Auth (Google + Email/Password), and Remote Config.
