import { GoogleGenAI } from '@google/genai';
import type {
  PatientNarrative,
  RawExtractedDocument,
  SupportedLanguage,
  VerifiedClinicalEvaluation,
} from '@/lib/clinical/types';
import { LANGUAGE_MAP } from '@/lib/i18n/uiStrings';

const MODEL_FALLBACK_CHAIN = Array.from(
  new Set([
    process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
  ]),
);
const DEFAULT_TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts';
const MODEL_TIMEOUT_MS = 18000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function runWithModelFallback<T>(
  runner: (model: string) => Promise<T>,
): Promise<{ result: T; modelUsed: string }> {
  let lastError: unknown;
  for (const model of MODEL_FALLBACK_CHAIN) {
    try {
      const result = await withTimeout(runner(model), MODEL_TIMEOUT_MS, model);
      return { result, modelUsed: model };
    } catch (err) {
      lastError = err;
      console.warn(`[ShifaClear Gemini] ${model} unavailable, trying next fallback:`, err instanceof Error ? err.message : err);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All Gemini models are temporarily unavailable.');
}

export function resolveApiKey(overrideKey?: string | null): string | undefined {
  const trimmed = overrideKey?.trim();
  if (trimmed) return trimmed;
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
}

function createClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    documentType: {
      type: 'string',
      enum: ['lab_report', 'prescription', 'mixed'],
    },
    reportDate: { type: 'string' },
    priorReportDate: {
      type: 'string',
      description: 'If multiple attached reports have DIFFERENT collection dates, put the older report date here.',
    },
    facilityName: { type: 'string' },
    patientAgeYears: {
      type: 'number',
      description: 'Patient age converted to numeric years (use decimals for infants, e.g., 11 months = 0.92, 11 months 11 days = 0.95, 6 weeks = 0.12). Omit if not printed.',
    },
    patientAgeLabel: {
      type: 'string',
      description: 'Exact age text printed on report header, e.g., "11 Mth 11 Days", "4 Years", "54Y". Omit if not printed.',
    },
    patientSex: {
      type: 'string',
      enum: ['male', 'female'],
      description: 'Patient sex printed on the primary report header ("male" or "female"). Omit if not printed.',
    },
    priorPatientAgeYears: {
      type: 'number',
      description: 'If a second/older document is attached, record the patient age (in years) printed on that second document so the safety engine can verify it is the same person.',
    },
    priorPatientSex: {
      type: 'string',
      enum: ['male', 'female'],
      description: 'If a second/older document is attached, record the patient sex printed on that second document.',
    },
    patientIdentityMismatch: {
      type: 'boolean',
      description: 'MUST be true if the uploaded files belong to TWO OR MORE DIFFERENT PEOPLE (different Patient Names, different Patient IDs/MRNs, incompatible ages/DOBs such as adult vs child, or different sex).',
    },
    detectedPatients: {
      type: 'array',
      description: 'When patientIdentityMismatch is true, list each distinct patient detected across the uploaded files.',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          ageLabel: { type: 'string' },
          sex: { type: 'string', enum: ['male', 'female'] },
          reportDate: { type: 'string' },
        },
        required: ['label'],
      },
    },
    biomarkers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'number' },
          unit: { type: 'string' },
          rawReferenceRange: { type: 'string' },
        },
        required: ['name', 'value', 'unit'],
      },
    },
    priorBiomarkers: {
      type: 'array',
      description: 'ONLY populate when multiple uploaded reports come from DIFFERENT dates (older visit values for longitudinal trend chart).',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'number' },
          unit: { type: 'string' },
        },
        required: ['name', 'value', 'unit'],
      },
    },
    medications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          brandName: { type: 'string' },
          genericName: { type: 'string' },
          dose: { type: 'string' },
          frequency: { type: 'string' },
          timingNotes: { type: 'string' },
          duration: { type: 'string' },
        },
        required: ['brandName', 'dose', 'frequency'],
      },
    },
  },
  required: ['documentType', 'biomarkers', 'medications'],
};

export async function identifyMedicationBoxWithGemini(params: {
  apiKey: string;
  base64Data: string;
  mimeType: string;
}): Promise<Array<{ brandName: string; genericName?: string; strength?: string }>> {
  const ai = createClient(params.apiKey);

  const schema = {
    type: 'object',
    properties: {
      medications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            brandName: { type: 'string' },
            genericName: { type: 'string' },
            strength: { type: 'string' },
          },
          required: ['brandName'],
        },
      },
    },
    required: ['medications'],
  };

  const { result: interaction } = await runWithModelFallback((model) =>
    ai.interactions.create({
      model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input: [
        {
          type: 'text',
          text: 'You are a UAE clinical pharmacy vision scanner. Identify every medication box, blister pack, bottle, or barcode label visible in the photo. Extract the exact brand name (e.g., Panadol Extra, Glucophage XR, Concor, Co-Diovan, Plavix), active generic ingredient(s), and dosage strength if visible. Return strictly valid JSON matching the schema.',
        },
        {
          type: 'image',
          data: params.base64Data,
          mime_type: params.mimeType,
        },
      ] as any,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema,
      },
    }),
  );

  const text = interaction.output_text;
  if (!text) return [];
  const parsed = JSON.parse(text) as {
    medications?: Array<{ brandName: string; genericName?: string; strength?: string }>;
  };
  return parsed.medications || [];
}

export async function extractClinicalDocumentWithGemini(params: {
  apiKey: string;
  rawText?: string;
  fileBase64?: string;
  mimeType?: string;
  files?: Array<{ base64: string; mimeType: string; fileName?: string }>;
}): Promise<RawExtractedDocument> {
  const client = createClient(params.apiKey);

  const allFiles: Array<{ base64: string; mimeType: string; fileName?: string }> = [
    ...(params.files || []),
    ...(params.fileBase64 && params.mimeType
      ? [{ base64: params.fileBase64, mimeType: params.mimeType }]
      : []),
  ];

  const instructionText = [
    'You are a precision clinical document OCR & structured extraction engine for a UAE hospital app.',
    allFiles.length > 1
      ? `You are given ${allFiles.length} separate pages/documents. CRITICAL JCI IPSG.1 PATIENT IDENTITY CHECK FIRST: Compare Patient Name, Patient ID/MRN, Date of Birth / Age, and Sex printed on EVERY file! ONLY merge same-date files or populate priorBiomarkers if ALL files clearly belong to the EXACT SAME PATIENT. If the files belong to DIFFERENT PEOPLE (e.g., different names, different MRNs, adult vs child/infant, or husband vs wife): (a) set patientIdentityMismatch=true, (b) list each distinct person in detectedPatients (first name or "Patient 1"/"Patient 2", ageLabel, sex, reportDate), (c) extract ONLY the primary (most recent) patient into biomarkers/medications/patientAgeYears/patientSex, and (d) leave priorBiomarkers COMPLETELY EMPTY — NEVER merge two different people or build a trajectory between two different people! Only if all files are confirmed to be the SAME person with different collection dates, put the MOST RECENT visit into reportDate/biomarkers and the OLDER visit into priorReportDate/priorBiomarkers (and record priorPatientAgeYears/priorPatientSex).`
      : 'Extract all lab biomarkers and medications from the attached medical document or medication photo.',
    '1. Extract patient demographics from the header if printed: patientAgeYears (numeric years — use decimals for infants/babies, e.g. "11 Mth 11 Days" -> 0.95, "6 Months" -> 0.5), patientAgeLabel (exact text like "11 Mth 11 Days"), and patientSex ("male" or "female").',
    '2. Extract EVERY numeric lab biomarker (name, numeric value, exact unit printed, exact rawReferenceRange printed on the report) and EVERY medication (brandName, genericName if visible, dose, frequency shorthand like OD/BD/TDS, timingNotes, duration).',
    '3. For CBC differential counts: keep "%" in the name for percentage rows (e.g., "Neutrophils %", "Lymphocytes %", "Monocytes %") so they stay distinct from absolute counts ("Neutrophils", "Lymphocytes" in 10^9/L). Never duplicate identical rows.',
    '4. Never invent values not present in the source. If a value has a ">" or "<" sign (e.g. eGFR > 90), extract the numeric value cleanly. Return strict JSON matching the schema.',
  ].join(' ');

  const inputParts: Array<Record<string, unknown>> = [
    {
      type: 'text',
      text: params.rawText
        ? `${instructionText}\n\nCLINICAL TEXT TO EXTRACT:\n${params.rawText}`
        : instructionText,
    },
  ];

  for (const f of allFiles) {
    const isPdf = f.mimeType === 'application/pdf';
    inputParts.push({
      type: isPdf ? 'document' : 'image',
      data: f.base64,
      mime_type: f.mimeType,
    });
  }

  const { result: interaction } = await runWithModelFallback((model) =>
    client.interactions.create({
      model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input: inputParts as any,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: EXTRACTION_SCHEMA,
      },
    }),
  );

  const text = interaction.output_text;
  if (!text) {
    throw new Error('Gemini returned an empty extraction response.');
  }

  const cleanStr = (val?: string) => {
    const s = val?.trim();
    if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'n/a') {
      return undefined;
    }
    return s;
  };

  const parsed = JSON.parse(text) as RawExtractedDocument;
  const rawAge = typeof parsed.patientAgeYears === 'number' && parsed.patientAgeYears >= 0 && parsed.patientAgeYears < 120
    ? Math.round(parsed.patientAgeYears * 100) / 100
    : undefined;
  const rawSex = parsed.patientSex === 'female' || parsed.patientSex === 'male'
    ? parsed.patientSex
    : undefined;

  const rawPriorAge =
    typeof parsed.priorPatientAgeYears === 'number' &&
    parsed.priorPatientAgeYears >= 0 &&
    parsed.priorPatientAgeYears < 120
      ? Math.round(parsed.priorPatientAgeYears * 100) / 100
      : undefined;
  const rawPriorSex =
    parsed.priorPatientSex === 'female' || parsed.priorPatientSex === 'male'
      ? parsed.priorPatientSex
      : undefined;
  const detectedPatients = Array.isArray(parsed.detectedPatients)
    ? parsed.detectedPatients
        .filter((p) => p && typeof p.label === 'string' && p.label.trim().length > 0)
        .map((p) => ({
          label: cleanStr(p.label) || 'Patient',
          ageLabel: cleanStr(p.ageLabel),
          sex: p.sex === 'female' || p.sex === 'male' ? p.sex : undefined,
          reportDate: cleanStr(p.reportDate),
        }))
    : undefined;
  const hasMismatch = Boolean(
    parsed.patientIdentityMismatch || (detectedPatients && detectedPatients.length > 1),
  );

  return {
    documentType: parsed.documentType || 'lab_report',
    reportDate: cleanStr(parsed.reportDate),
    priorReportDate: hasMismatch ? undefined : cleanStr(parsed.priorReportDate),
    facilityName: cleanStr(parsed.facilityName),
    patientAgeYears: rawAge,
    patientAgeLabel: cleanStr(parsed.patientAgeLabel),
    patientSex: rawSex,
    priorPatientAgeYears: rawPriorAge,
    priorPatientSex: rawPriorSex,
    patientIdentityMismatch: hasMismatch || undefined,
    detectedPatients,
    biomarkers: Array.isArray(parsed.biomarkers) ? parsed.biomarkers : [],
    priorBiomarkers:
      !hasMismatch && Array.isArray(parsed.priorBiomarkers) && parsed.priorBiomarkers.length > 0
        ? parsed.priorBiomarkers
        : undefined,
    medications: Array.isArray(parsed.medications) ? parsed.medications : [],
  };
}

const NARRATIVE_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    overallSummary: { type: 'string' },
    biomarkerItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          canonicalId: { type: 'string' },
          plainTitle: { type: 'string' },
          whatItMeasures: { type: 'string' },
          whatYourLevelMeans: { type: 'string' },
          practicalTip: { type: 'string' },
        },
        required: ['canonicalId', 'plainTitle', 'whatItMeasures', 'whatYourLevelMeans', 'practicalTip'],
      },
    },
    medicationItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          plainPurpose: { type: 'string' },
          howToTake: { type: 'string' },
          watchOutFor: { type: 'string' },
        },
        required: ['id', 'plainPurpose', 'howToTake', 'watchOutFor'],
      },
    },
    alertItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          explanation: { type: 'string' },
          action: { type: 'string' },
        },
        required: ['id', 'title', 'explanation', 'action'],
      },
    },
    doctorQuestions: {
      type: 'array',
      items: { type: 'string' },
    },
    caregiverWhatsappSummary: { type: 'string' },
    spokenSummaryScript: { type: 'string' },
  },
  required: [
    'headline',
    'overallSummary',
    'biomarkerItems',
    'medicationItems',
    'alertItems',
    'doctorQuestions',
    'caregiverWhatsappSummary',
    'spokenSummaryScript',
  ],
};

export async function generatePatientNarrativeWithGemini(params: {
  apiKey: string;
  evaluation: VerifiedClinicalEvaluation;
  language: SupportedLanguage;
}): Promise<PatientNarrative> {
  const client = createClient(params.apiKey);
  const langMeta = LANGUAGE_MAP[params.language];

  const compactFacts = {
    overallRisk: params.evaluation.overallRisk,
    patient: params.evaluation.patientContext,
    alerts: params.evaluation.alerts.map((a) => ({
      id: a.id,
      severity: a.severity,
      title: a.title,
      rationale: a.clinicalRationale,
      action: a.recommendedAction,
      emergencyNumber: a.emergencyNumber,
    })),
    biomarkers: params.evaluation.biomarkers.map((b) => ({
      canonicalId: b.canonicalId,
      name: b.displayName,
      si: `${b.siValue} ${b.siUnit}`,
      us: `${b.usValue} ${b.usUnit}`,
      refSI: b.refLabelSI,
      status: b.status,
      trend: b.trendDeltaText,
    })),
    medications: params.evaluation.medications.map((m) => ({
      id: m.id,
      brand: m.brandName,
      generic: m.genericName,
      dose: m.dose,
      slots: m.slots,
      timing: m.timingInstruction,
      safetyFlag: m.safetyFlagSummary,
    })),
  };

  const prompt = [
    `You are ShifaClear, a compassionate UAE clinical health communicator designed by an MD and Biomedical Engineer.`,
    `Write ALL user-facing text strictly in ${langMeta.englishLabel} (${langMeta.nativeLabel}) at a warm, clear grade-6 reading level.`,
    `CRITICAL SAFETY RULES:`,
    `1. NEVER contradict or change the deterministic statuses, numbers, or alerts provided below.`,
    `2. NEVER diagnose a disease or tell the patient to change/stop prescriptions on their own — always frame next steps as questions or prompts for their physician/pharmacist (or UAE 998 Emergency if an urgent alert is present).`,
    `3. Provide exactly 3 specific, practical Doctor Visit Questions.`,
    `4. Keep caregiverWhatsappSummary concise with clear bullet points.`,
    `5. Keep spokenSummaryScript natural and ~45-65 words so it sounds warm when read aloud to an elder.`,
    ``,
    `VERIFIED CLINICAL FACTS (SOURCE OF TRUTH):`,
    JSON.stringify(compactFacts),
  ].join('\n');

  const { result: interaction } = await runWithModelFallback((model) =>
    client.interactions.create({
      model,
      input: prompt,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: NARRATIVE_SCHEMA,
      },
    }),
  );

  const text = interaction.output_text;
  if (!text) {
    throw new Error('Gemini returned an empty narrative response.');
  }

  const parsed = JSON.parse(text) as {
    headline: string;
    overallSummary: string;
    biomarkerItems: Array<{
      canonicalId: string;
      plainTitle: string;
      whatItMeasures: string;
      whatYourLevelMeans: string;
      practicalTip: string;
    }>;
    medicationItems: Array<{
      id: string;
      plainPurpose: string;
      howToTake: string;
      watchOutFor: string;
    }>;
    alertItems: Array<{
      id: string;
      title: string;
      explanation: string;
      action: string;
    }>;
    doctorQuestions: string[];
    caregiverWhatsappSummary: string;
    spokenSummaryScript: string;
  };

  const biomarkerExplanations: PatientNarrative['biomarkerExplanations'] = {};
  for (const item of parsed.biomarkerItems || []) {
    biomarkerExplanations[item.canonicalId] = item;
  }

  const medicationExplanations: PatientNarrative['medicationExplanations'] = {};
  for (const item of parsed.medicationItems || []) {
    medicationExplanations[item.id] = item;
  }

  const alertTranslations: PatientNarrative['alertTranslations'] = {};
  for (const item of parsed.alertItems || []) {
    alertTranslations[item.id] = item;
  }

  return {
    language: params.language,
    headline: parsed.headline,
    overallSummary: parsed.overallSummary,
    biomarkerExplanations,
    medicationExplanations,
    alertTranslations,
    doctorQuestions: (parsed.doctorQuestions || []).slice(0, 4),
    caregiverWhatsappSummary: parsed.caregiverWhatsappSummary,
    spokenSummaryScript: parsed.spokenSummaryScript,
    source: 'gemini_live',
  };
}

export async function synthesizeSpeechWithGemini(params: {
  apiKey: string;
  text: string;
  language: SupportedLanguage;
}): Promise<{ audioBase64: string; mimeType: string }> {
  const client = new GoogleGenAI({
    apiKey: params.apiKey,
    httpOptions: { apiVersion: 'v1beta' },
  });

  const langMeta = LANGUAGE_MAP[params.language];
  const interaction = await client.interactions.create({
    model: DEFAULT_TTS_MODEL,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: [
      {
        type: 'user_input',
        content: [
          {
            type: 'text',
            text: params.text.slice(0, 900),
            annotations: [
              {
                type: 'speech_metadata',
                style: `calm, warm, reassuring clinical educator speaking clearly in ${langMeta.englishLabel}`,
              },
            ],
          },
        ],
      },
    ] as any,
    response_format: { type: 'audio' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generation_config: {
      speech_config: [{ voice: 'Kore' }],
    } as any,
  });

  const audio = interaction.output_audio;
  if (!audio?.data) {
    throw new Error('Gemini TTS did not return audio data.');
  }

  return {
    audioBase64: audio.data,
    mimeType: audio.mime_type || 'audio/wav',
  };
}

export async function answerClinicalQuestionWithGemini(params: {
  apiKey: string;
  evaluation: VerifiedClinicalEvaluation;
  question: string;
  language: SupportedLanguage;
}): Promise<{ answer: string; modelUsed: string }> {
  const client = createClient(params.apiKey);
  const langMeta = LANGUAGE_MAP[params.language];

  const compactFacts = {
    overallRisk: params.evaluation.overallRisk,
    patient: params.evaluation.patientContext,
    alerts: params.evaluation.alerts.map((a) => ({
      severity: a.severity,
      title: a.title,
      rationale: a.clinicalRationale,
      action: a.recommendedAction,
    })),
    biomarkers: params.evaluation.biomarkers.map((b) => ({
      name: b.displayName,
      si: `${b.siValue} ${b.siUnit}`,
      us: `${b.usValue} ${b.usUnit}`,
      status: b.status,
      trend: b.trendDeltaText,
    })),
    medications: params.evaluation.medications.map((m) => ({
      brand: m.brandName,
      generic: m.genericName,
      dose: m.dose,
      slots: m.slots,
      timing: m.timingInstruction,
      safetyFlag: m.safetyFlagSummary,
    })),
  };

  const prompt = [
    `You are ShifaClear, a compassionate UAE clinical health educator built by an MD & Biomedical Engineer.`,
    `Answer the patient or caregiver's follow-up question in ${langMeta.englishLabel} (${langMeta.nativeLabel}) in 3 to 5 concise, warm, practical sentences.`,
    `STRICT CLINICAL GUARDRAILS:`,
    `1. Ground every medical statement ONLY in the verified report facts below — never invent lab values or medications.`,
    `2. Tailor practical lifestyle guidance to UAE daily life when relevant (e.g., Ramadan fasting physician planning, Abu Dhabi heat hydration, local foods like dates, karak tea, ghee, Arabic coffee).`,
    `3. NEVER diagnose a disease or tell the user to stop/change prescription doses on their own. Frame medication adjustments as specific questions to confirm with their doctor or pharmacist.`,
    `4. If the verified report has an URGENT/CRITICAL alert (e.g., hyperkalemia >= 6.0), remind them to seek Emergency care / call 998 immediately first.`,
    ``,
    `VERIFIED REPORT FACTS:`,
    JSON.stringify(compactFacts),
    ``,
    `USER QUESTION: ${params.question}`,
  ].join('\n');

  const { result: interaction, modelUsed } = await runWithModelFallback((model) =>
    client.interactions.create({
      model,
      input: prompt,
    }),
  );

  const answer = interaction.output_text?.trim();
  if (!answer) {
    throw new Error('Empty Q&A response from Gemini.');
  }

  return { answer, modelUsed };
}
