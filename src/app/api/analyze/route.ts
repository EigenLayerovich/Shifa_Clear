import { NextRequest, NextResponse } from 'next/server';
import {
  extractClinicalDocumentWithGemini,
  generatePatientNarrativeWithGemini,
  resolveApiKey,
} from '@/lib/ai/gemini';
import { evaluateClinicalDocument } from '@/lib/clinical/engine';
import { verifyNarrativeFactPreservation } from '@/lib/clinical/factCheck';
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
import { getDemoCaseById } from '@/lib/demo/cases';

function parseContext(raw?: Partial<PatientContext>): PatientContext {
  const validLangs: SupportedLanguage[] = ['en', 'ar', 'ur', 'tl', 'hi'];
  const lang = validLangs.includes(raw?.language as SupportedLanguage)
    ? (raw?.language as SupportedLanguage)
    : 'en';
  const validLevels: ReadingLevel[] = ['simple', 'standard', 'clinical'];
  const readingLevel = validLevels.includes(raw?.readingLevel as ReadingLevel)
    ? (raw?.readingLevel as ReadingLevel)
    : 'standard';
  const age = typeof raw?.age === 'number' && raw.age >= 0 && raw.age < 120 ? raw.age : 45;
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
    const contentType = req.headers.get('content-type') || '';
    const sessionApiKey = req.headers.get('x-gemini-api-key');
    const apiKey = resolveApiKey(sessionApiKey);

    let demoCaseId: string | undefined;
    let rawText: string | undefined;
    const uploadedFiles: Array<{ base64: string; mimeType: string; fileName: string }> = [];
    let contextInput: Partial<PatientContext> = {};
    let forceLiveAI = false;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      rawText = (form.get('rawText') as string | null)?.trim() || undefined;
      demoCaseId = (form.get('demoCaseId') as string | null)?.trim() || undefined;
      const ctxStr = form.get('patientContext') as string | null;
      if (ctxStr) {
        contextInput = JSON.parse(ctxStr);
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
        if (file.size > 11 * 1024 * 1024 || totalBytes > 20 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Uploaded files exceed the size limit. Try smaller images or fewer PDFs.' },
            { status: 400 },
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
    const scrubbedText = rawText ? redactClinicalPII(rawText).sanitizedText : undefined;
    let extracted: RawExtractedDocument;
    let usedLiveAI = false;

    try {
      extracted = await extractClinicalDocumentWithGemini({
        apiKey,
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
        readingLevel: context.readingLevel,
      });
      usedLiveAI = true;
    } catch {
      narrative = buildFallbackNarrative(evaluation, context.language);
    }

    const { report: factCheck, auditStep } = verifyNarrativeFactPreservation(evaluation, narrative);
    evaluation.factCheck = factCheck;
    evaluation.auditTrail.push(auditStep);

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
