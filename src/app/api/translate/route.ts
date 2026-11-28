import { NextRequest, NextResponse } from 'next/server';
import { generatePatientNarrativeWithGemini, resolveApiKey } from '@/lib/ai/gemini';
import { verifyNarrativeFactPreservation } from '@/lib/clinical/factCheck';
import type {
  PatientNarrative,
  ReadingLevel,
  SupportedLanguage,
  VerifiedClinicalEvaluation,
} from '@/lib/clinical/types';
import { isValidLanguage, isValidReadingLevel } from '@/lib/clinical/validation';
import { getDemoCaseById } from '@/lib/demo/cases';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'translate', 25, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many translation requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON request body.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
    }

    const rawLang = body.language ?? 'en';
    if (!isValidLanguage(rawLang)) {
      return NextResponse.json(
        { error: 'Unsupported language code. Use en, ar, ur, tl, or hi.' },
        { status: 400 },
      );
    }
    const language: SupportedLanguage = rawLang;

    const rawLevel = body.readingLevel ?? 'standard';
    if (!isValidReadingLevel(rawLevel)) {
      return NextResponse.json(
        { error: 'Unsupported reading level. Use simple, standard, or clinical.' },
        { status: 400 },
      );
    }
    const readingLevel: ReadingLevel = rawLevel;

    const demoCaseId = typeof body.demoCaseId === 'string' ? body.demoCaseId : undefined;
    const evaluation =
      body.evaluation && typeof body.evaluation === 'object'
        ? (body.evaluation as VerifiedClinicalEvaluation)
        : undefined;
    const apiKey = resolveApiKey(req.headers.get('x-gemini-api-key'));

    if (demoCaseId && readingLevel === 'standard') {
      const demo = getDemoCaseById(demoCaseId);
      if (demo) {
        const cached = demo.narratives[language] || demo.narratives.en;
        const narrative: PatientNarrative = {
          ...cached,
          language,
          source: 'verified_demo_cache',
        };
        const factCheck =
          evaluation && Array.isArray(evaluation.alerts) && Array.isArray(evaluation.biomarkers)
            ? verifyNarrativeFactPreservation(evaluation, narrative).report
            : undefined;
        return NextResponse.json({ narrative, factCheck });
      }
    }

    if (
      !evaluation ||
      !Array.isArray(evaluation.biomarkers) ||
      !Array.isArray(evaluation.alerts)
    ) {
      return NextResponse.json({ error: 'Missing or invalid evaluation payload.' }, { status: 400 });
    }

    if (!apiKey) {
      if (demoCaseId) {
        const demo = getDemoCaseById(demoCaseId);
        if (demo) {
          const cached = demo.narratives[language] || demo.narratives.en;
          return NextResponse.json({
            narrative: { ...cached, language, source: 'verified_demo_cache' },
          });
        }
      }
      return NextResponse.json(
        { error: 'GEMINI_API_KEY required to translate or adjust reading level.' },
        { status: 401 },
      );
    }

    const narrative = await generatePatientNarrativeWithGemini({
      apiKey,
      evaluation,
      language,
      readingLevel,
    });
    const { report: factCheck } = verifyNarrativeFactPreservation(evaluation, narrative);
    return NextResponse.json({ narrative, factCheck });
  } catch (err) {
    console.error('[ShifaClear /api/translate] Error:', err);
    return NextResponse.json(
      { error: 'Translation service is temporarily unavailable. Please try again.' },
      { status: 500 },
    );
  }
}
