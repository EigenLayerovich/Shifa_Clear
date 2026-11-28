import { NextRequest, NextResponse } from 'next/server';
import {
  extractClinicalDocumentWithGemini,
  generatePatientNarrativeWithGemini,
  resolveApiKey,
} from '@/lib/ai/gemini';
import { evaluateClinicalDocument } from '@/lib/clinical/engine';
import {
  getSafeDisplayNarrative,
  verifyNarrativeFactPreservation,
} from '@/lib/clinical/factCheck';
import { redactClinicalPII } from '@/lib/clinical/piiRedactor';
import { parseClinicalTextDeterministically } from '@/lib/clinical/textParser';
import type {
  PatientContext,
  PatientNarrative,
  RawExtractedDocument,
  ReadingLevel,
  ShifaClearAnalysisResponse,
  SupportedLanguage,
} from '@/lib/clinical/types';
import { isValidLanguage, isValidReadingLevel } from '@/lib/clinical/validation';
import { getDemoCaseById } from '@/lib/demo/cases';
import { checkRateLimit } from '@/lib/security/rateLimit';

export const maxDuration = 60;
const MAX_VERCEL_SAFE_BYTES = 4.2 * 1024 * 1024;

function parseContext(raw?: Partial<PatientContext>): PatientContext {
  const lang: SupportedLanguage = isValidLanguage(raw?.language) ? raw.language : 'en';
  const readingLevel: ReadingLevel = isValidReadingLevel(raw?.readingLevel)
    ? raw.readingLevel
    : 'standard';
  const age = typeof raw?.age === 'number' && Number.isFinite(raw.age) && raw.age >= 0 && raw.age < 120 ? raw.age : 45;
  return {
    age,
    ageLabel: raw?.ageLabel,
    isPediatric: age < 18,
    sex: raw?.sex === 'female' ? 'female' : 'male',
    unitSystem: raw?.unitSystem === 'US' ? 'US' : 'SI',
    language: lang,
    readingLevel,
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
    const rate = checkRateLimit(req, 'analyze', 25, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
      );
    }

    const contentType = req.headers.get('content-type') || '';
    const sessionApiKey = req.headers.get('x-gemini-api-key');
    const apiKey = resolveApiKey(sessionApiKey);

    let demoCaseId: string | undefined;
    let rawText: string | undefined;
    const uploadedFiles: Array<{ base64: string; mimeType: string; fileName: string }> = [];
    let contextInput: Partial<PatientContext> = {};
    let forceLiveAI = false;

    if (contentType.includes('multipart/form-data')) {
      let form: FormData;
      try {
        form = await req.formData();
      } catch {
        return NextResponse.json({ error: 'Invalid multipart upload payload.' }, { status: 400 });
      }
      rawText = (form.get('rawText') as string | null)?.trim() || undefined;
      demoCaseId = (form.get('demoCaseId') as string | null)?.trim() || undefined;
      const ctxStr = form.get('patientContext') as string | null;
      if (ctxStr) {
        try {
          contextInput = JSON.parse(ctxStr);
        } catch {
          return NextResponse.json({ error: 'Invalid patientContext JSON.' }, { status: 400 });
        }
      }

      const rawFileEntries = [...form.getAll('files'), ...form.getAll('file')].filter(
        (item): item is File => item instanceof File && item.size > 0,
      );

      if (rawFileEntries.length > 6) {
        return NextResponse.json(
          { error: 'Please upload up to 6 documents/photos at once.' },
          { status: 400 },
        );
      }

      let totalBytes = 0;
      for (const file of rawFileEntries) {
        totalBytes += file.size;
        if (totalBytes > MAX_VERCEL_SAFE_BYTES) {
          return NextResponse.json(
            {
              error:
                'Uploaded files exceed the 4.2 MB serverless upload limit. Try compressing large PDFs or uploading fewer photos at once.',
            },
            { status: 413 },
          );
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        uploadedFiles.push({
          base64: buffer.toString('base64'),
          mimeType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          fileName: file.name,
        });
      }
    } else {
      let body: Record<string, unknown>;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: 'Malformed JSON request body.' }, { status: 400 });
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
      }
      demoCaseId = typeof body.demoCaseId === 'string' ? body.demoCaseId : undefined;
      rawText = typeof body.rawText === 'string' ? body.rawText.trim() : undefined;
      contextInput =
        body.patientContext && typeof body.patientContext === 'object'
          ? (body.patientContext as Partial<PatientContext>)
          : {};
      if (contextInput.language !== undefined && !isValidLanguage(contextInput.language)) {
        return NextResponse.json(
          { error: 'Unsupported language code. Use en, ar, ur, tl, or hi.' },
          { status: 400 },
        );
      }
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

      if ((forceLiveAI || context.readingLevel !== 'standard') && apiKey) {
        try {
          narrative = await generatePatientNarrativeWithGemini({
            apiKey,
            evaluation,
            language: context.language,
            readingLevel: context.readingLevel,
          });
          aiPowered = true;
        } catch {
          const cached = demo.narratives[context.language] || demo.narratives.en;
          narrative = { ...cached, language: context.language, source: 'verified_demo_cache' };
        }
      } else {
        const cached = demo.narratives[context.language] || demo.narratives.en;
        narrative = {
          ...cached,
          language: context.language,
          source: 'verified_demo_cache',
        };
      }

      const { report: factCheck, auditStep } = verifyNarrativeFactPreservation(evaluation, narrative);
      evaluation.factCheck = factCheck;
      evaluation.auditTrail.push(auditStep);

      const payload: ShifaClearAnalysisResponse = {
        evaluation,
        narrative,
        demoCaseId: demo.id,
        aiPowered,
      };
      return NextResponse.json(payload);
    }

    // Path B: Live Upload (1–6 Photos / PDFs) or Pasted Clinical Text
    if (uploadedFiles.length === 0 && !rawText) {
      return NextResponse.json(
        { error: 'Please upload one or more lab/prescription files, paste clinical text, or pick a UAE demo case.' },
        { status: 400 },
      );
    }

    // Photos/PDFs require vision OCR via Gemini; pasted text works offline via our deterministic parser!
    if (!apiKey && uploadedFiles.length > 0) {
      return NextResponse.json(
        {
          error:
            'No GEMINI_API_KEY configured for photo/PDF OCR. Add your Google AI Studio key in the QR & API dialog (or .env.local), paste clinical text for offline deterministic parsing, or explore the 3 instant UAE Clinical Cases.',
        },
        { status: 401 },
      );
    }

    const context = parseContext(contextInput);
    const scrubbedText = rawText ? redactClinicalPII(rawText).sanitizedText : undefined;
    let extracted: RawExtractedDocument;
    let usedLiveAI = false;

    if (!apiKey && scrubbedText) {
      extracted = parseClinicalTextDeterministically(scrubbedText);
    } else {
      try {
        extracted = await extractClinicalDocumentWithGemini({
          apiKey: apiKey!,
          rawText: scrubbedText,
          files: uploadedFiles,
        });
        usedLiveAI = true;
      } catch (extractErr) {
        if (scrubbedText) {
          console.warn('[ShifaClear /api/analyze] Using deterministic text parser fallback:', extractErr);
          extracted = parseClinicalTextDeterministically(scrubbedText);
        } else {
          throw extractErr;
        }
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
    if (apiKey) {
      try {
        narrative = await generatePatientNarrativeWithGemini({
          apiKey,
          evaluation,
          language: context.language,
          readingLevel: context.readingLevel,
        });
        usedLiveAI = true;
      } catch {
        narrative = buildFallbackNarrative(evaluation, context.language);
      }
    } else {
      narrative = buildFallbackNarrative(evaluation, context.language);
    }

    const { report: factCheck, auditStep } = verifyNarrativeFactPreservation(evaluation, narrative);
    evaluation.factCheck = factCheck;
    evaluation.auditTrail.push(auditStep);
    if (!factCheck.verified) {
      const safe = getSafeDisplayNarrative(evaluation, narrative);
      narrative = {
        ...narrative,
        headline: safe.headline,
        overallSummary: safe.overallSummary,
      };
    }

    const payload: ShifaClearAnalysisResponse = {
      evaluation,
      narrative,
      aiPowered: usedLiveAI,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[ShifaClear /api/analyze] Error:', err);
    const isTimeout = err instanceof Error && /timed out|abort/i.test(err.message);
    return NextResponse.json(
      {
        error: isTimeout
          ? 'Document OCR timed out on this upload. Please tap Analyze again or upload one page at a time.'
          : 'Unable to complete clinical analysis right now. Please try again.',
      },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
