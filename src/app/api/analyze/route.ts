import { NextRequest, NextResponse } from 'next/server';
import {
  extractClinicalDocumentWithGemini,
  generatePatientNarrativeWithGemini,
  resolveApiKey,
} from '@/lib/ai/gemini';
import { evaluateClinicalDocument } from '@/lib/clinical/engine';
import { parseClinicalTextDeterministically } from '@/lib/clinical/textParser';
import type {
  PatientContext,
  PatientNarrative,
  RawExtractedDocument,
  ShifaClearAnalysisResponse,
  SupportedLanguage,
} from '@/lib/clinical/types';
import { getDemoCaseById } from '@/lib/demo/cases';

function parseContext(raw?: Partial<PatientContext>): PatientContext {
  const validLangs: SupportedLanguage[] = ['en', 'ar', 'ur', 'tl', 'hi'];
  const lang = validLangs.includes(raw?.language as SupportedLanguage)
    ? (raw?.language as SupportedLanguage)
    : 'en';
  const age = typeof raw?.age === 'number' && raw.age >= 0 && raw.age < 120 ? raw.age : 45;
  return {
    age,
    ageLabel: raw?.ageLabel,
    isPediatric: age < 18,
    sex: raw?.sex === 'female' ? 'female' : 'male',
    unitSystem: raw?.unitSystem === 'US' ? 'US' : 'SI',
    language: lang,
    autoDetectedFromReport: raw?.autoDetectedFromReport,
  };
}

function buildFallbackNarrative(
  evaluation: ReturnType<typeof evaluateClinicalDocument>,
  language: SupportedLanguage,
): PatientNarrative {
  const abnormal = evaluation.biomarkers.filter(
    (b) => b.status !== 'normal' && b.status !== 'unknown',
  );
  const headline =
    evaluation.overallRisk === 'urgent'
      ? 'Urgent Clinical Alert Detected — Seek Immediate Medical Attention'
      : abnormal.length > 0 || evaluation.alerts.length > 0
        ? `${abnormal.length} Lab Marker(s) & ${evaluation.alerts.length} Safety Check(s) Need Doctor Review`
        : 'Extracted Results Verified Within Target Clinical Ranges';

  const overallSummary = `Verified ${evaluation.biomarkers.length} biomarker(s) and ${evaluation.medications.length} medication(s) through ShifaClear's deterministic clinical rules engine. Review any highlighted alerts or out-of-range markers with your physician.`;

  return {
    language,
    headline,
    overallSummary,
    biomarkerExplanations: {},
    medicationExplanations: {},
    alertTranslations: {},
    doctorQuestions: [
      'Which of these out-of-range results or medication checks should we prioritize first?',
      'Do I need a repeat lab test or dose adjustment at my next follow-up?',
      'What warning symptoms should prompt earlier medical evaluation?',
    ],
    caregiverWhatsappSummary: `ShifaClear Summary: ${headline}. ${evaluation.biomarkers.length} lab markers, ${evaluation.medications.length} meds, ${evaluation.alerts.length} safety alerts.`,
    spokenSummaryScript: `${headline}. ${overallSummary}`,
    source: 'verified_demo_cache',
  };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const sessionApiKey = req.headers.get('x-gemini-api-key');
    const apiKey = resolveApiKey(sessionApiKey);

    let demoCaseId: string | undefined;
    let rawText: string | undefined;
    let fileBase64: string | undefined;
    let mimeType: string | undefined;
    let contextInput: Partial<PatientContext> = {};
    let forceLiveAI = false;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      rawText = (form.get('rawText') as string | null)?.trim() || undefined;
      demoCaseId = (form.get('demoCaseId') as string | null)?.trim() || undefined;
      const ctxStr = form.get('patientContext') as string | null;
      if (ctxStr) {
        contextInput = JSON.parse(ctxStr);
      }

      if (file && file instanceof File && file.size > 0) {
        if (file.size > 11 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'File exceeds the 10 MB limit. Please upload a smaller image or PDF.' },
            { status: 400 },
          );
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        fileBase64 = buffer.toString('base64');
        mimeType = file.type || 'image/jpeg';
      }
    } else {
      const body = await req.json();
      demoCaseId = body.demoCaseId;
      rawText = typeof body.rawText === 'string' ? body.rawText.trim() : undefined;
      contextInput = body.patientContext || {};
      forceLiveAI = Boolean(body.forceLiveAI);
    }

    // Path A: UAE Flagship Demo Case (runs LIVE through deterministic clinical engine!)
    if (demoCaseId) {
      const demo = getDemoCaseById(demoCaseId);
      if (!demo) {
        return NextResponse.json({ error: 'Unknown demo case ID.' }, { status: 404 });
      }

      const context = parseContext({
        ...demo.defaultContext,
        ...contextInput,
      });

      const evaluation = evaluateClinicalDocument(demo.rawDocument, context);
      let narrative: PatientNarrative;
      let aiPowered = false;

      if (forceLiveAI && apiKey) {
        narrative = await generatePatientNarrativeWithGemini({
          apiKey,
          evaluation,
          language: context.language,
        });
        aiPowered = true;
      } else {
        const cached = demo.narratives[context.language] || demo.narratives.en;
        narrative = {
          ...cached,
          language: context.language,
          source: 'verified_demo_cache',
        };
      }

      const payload: ShifaClearAnalysisResponse = {
        evaluation,
        narrative,
        demoCaseId: demo.id,
        aiPowered,
      };
      return NextResponse.json(payload);
    }

    // Path B: Live Upload (Photo / PDF) or Pasted Clinical Text
    if (!fileBase64 && !rawText) {
      return NextResponse.json(
        { error: 'Please upload a lab/prescription file, paste clinical text, or pick a UAE demo case.' },
        { status: 400 },
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'No GEMINI_API_KEY configured for live photo/text scanning. Add your Google AI Studio key in the QR & API dialog (or .env.local), or explore any of the 3 instant UAE Clinical Cases.',
        },
        { status: 401 },
      );
    }

    const context = parseContext(contextInput);
    let extracted: RawExtractedDocument;
    let usedLiveAI = false;

    try {
      extracted = await extractClinicalDocumentWithGemini({
        apiKey,
        rawText,
        fileBase64,
        mimeType,
      });
      usedLiveAI = true;
    } catch (extractErr) {
      if (rawText) {
        console.warn('[ShifaClear /api/analyze] Using deterministic text parser fallback:', extractErr);
        extracted = parseClinicalTextDeterministically(rawText);
      } else {
        throw extractErr;
      }
    }

    // Auto-override default UI demographics when the report header prints patient age/sex!
    const detectedAge =
      typeof extracted.patientAgeYears === 'number' && extracted.patientAgeYears >= 0 && extracted.patientAgeYears < 120
        ? extracted.patientAgeYears
        : undefined;
    const detectedSex = extracted.patientSex;
    const effectiveContext: PatientContext = {
      ...context,
      age: detectedAge ?? context.age,
      ageLabel: extracted.patientAgeLabel ?? context.ageLabel,
      isPediatric: (detectedAge ?? context.age) < 18,
      sex: detectedSex ?? context.sex,
      autoDetectedFromReport: Boolean(detectedAge !== undefined || detectedSex),
    };

    const evaluation = evaluateClinicalDocument(extracted, effectiveContext);

    let narrative: PatientNarrative;
    try {
      narrative = await generatePatientNarrativeWithGemini({
        apiKey,
        evaluation,
        language: context.language,
      });
      usedLiveAI = true;
    } catch {
      narrative = buildFallbackNarrative(evaluation, context.language);
    }

    const payload: ShifaClearAnalysisResponse = {
      evaluation,
      narrative,
      aiPowered: usedLiveAI,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[ShifaClear /api/analyze] Error:', err);
    const message = err instanceof Error ? err.message : 'Unexpected analysis error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
