# ShifaClear — Multilingual Med & Lab Demystifier

Built for the **KUEC Sandbox Series — Vibe Coding Hackathon (Khalifa University, Nov 27–28, 2026)** • Track: **Health & Wellbeing**.

## Clinical Architecture ("AI Extracts & Translates — Deterministic Medicine Verifies")
1. **Multimodal Intake:** Upload lab reports (JPG/PNG/PDF), prescription photos, pasted clinical text, or launch 3 UAE flagship clinical cases.
2. **Deterministic MD Safety Engine (`src/lib/clinical/`):**
   - SI ↔ Conventional unit normalization (`mmol/L` ↔ `mg/dL`, `µmol/L` ↔ `mg/dL`, `nmol/L` ↔ `ng/mL`, `g/L` ↔ `g/dL`).
   - Age- and sex-specific clinical reference ranges across **77 LOINC-coded biomarkers** (10 organ groups, adult + pediatric ranges) with strict specimen, unit, and physiological plausibility guards.
   - Hard-coded Critical ("Panic") Value alerts with immediate **UAE 998 Ambulance** escalation, **JCI IPSG.1 Wrong-Patient Merge Blocker**, and **Post-Generation Fact-Preservation Guardrail**.
   - **150 clinical drug profiles / 620+ UAE & Gulf brands**, **40 deterministic clinical rules** (RxList contraindications, duplicate therapy, "Triple Whammy" AKI, Levothyroxine/Alendronate 4-hour separation, CKD-EPI 2021 auto-eGFR, and pediatric guardrails).
   - **On-device UAE PDPL PII scrubbing** for pasted/dictated text, **Zod 4** extraction validation, **HL7 FHIR R4 (Malaffi)** export, and **33 unit & clinical safety regression tests** (`npm test`).
3. **Multilingual & Family Accessibility:** English, Arabic (RTL), Urdu (RTL), Tagalog, and Hindi + **Elder Mode** + **Gemini 3.8 Flash-Lite TTS** (with automatic Web Speech fallback).

## Local Setup
```bash
npm install
cp .env.example .env.local # Add GEMINI_API_KEY
npm test
npm run dev
```

## 1-Click Vercel Deployment
1. Push this repository to GitHub (or run `npx vercel` directly in this folder).
2. In Vercel Project Settings → **Environment Variables**, add:
   - `GEMINI_API_KEY` = your Google AI Studio key
3. Deploy — then click **QR & API** in the header to display a scannable live mobile QR code on your final pitch slide!
