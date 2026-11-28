import { NextRequest, NextResponse } from 'next/server';
import { generatePatientNarrativeWithGemini, resolveApiKey } from '@/lib/ai/gemini';
import { verifyNarrativeFactPreservation } from '@/lib/clinical/factCheck';
import type {
  PatientNarrative,
  ReadingLevel,
  SupportedLanguage,
  VerifiedClinicalEvaluation,
} from '@/lib/clinical/types';
import { getDemoCaseById } from '@/lib/demo/cases';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const language = (body.language || 'en') as SupportedLanguage;
    const readingLevel = (body.readingLevel || 'standard') as ReadingLevel;
    const demoCaseId = body.demoCaseId as string | undefined;
    const evaluation = body.evaluation as VerifiedClinicalEvaluation | undefined;
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
        const factCheck = evaluation
          ? verifyNarrativeFactPreservation(evaluation, narrative).report
          : undefined;
        return NextResponse.json({ narrative, factCheck });
      }
    }

    if (!evaluation) {
      return NextResponse.json({ error: 'Missing evaluation payload.' }, { status: 400 });
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
    const message = err instanceof Error ? err.message : 'Translation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
