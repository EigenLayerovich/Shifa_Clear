import { NextRequest, NextResponse } from 'next/server';
import { generatePatientNarrativeWithGemini, resolveApiKey } from '@/lib/ai/gemini';
import type {
  PatientNarrative,
  SupportedLanguage,
  VerifiedClinicalEvaluation,
} from '@/lib/clinical/types';
import { getDemoCaseById } from '@/lib/demo/cases';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const language = (body.language || 'en') as SupportedLanguage;
    const demoCaseId = body.demoCaseId as string | undefined;
    const evaluation = body.evaluation as VerifiedClinicalEvaluation | undefined;

    if (demoCaseId) {
      const demo = getDemoCaseById(demoCaseId);
      if (demo) {
        const cached = demo.narratives[language] || demo.narratives.en;
        const narrative: PatientNarrative = {
          ...cached,
          language,
          source: 'verified_demo_cache',
        };
        return NextResponse.json({ narrative });
      }
    }

    if (!evaluation) {
      return NextResponse.json({ error: 'Missing evaluation payload.' }, { status: 400 });
    }

    const apiKey = resolveApiKey(req.headers.get('x-gemini-api-key'));
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY required to translate custom scans.' },
        { status: 401 },
      );
    }

    const narrative = await generatePatientNarrativeWithGemini({
      apiKey,
      evaluation,
      language,
    });
    return NextResponse.json({ narrative });
  } catch (err) {
    console.error('[ShifaClear /api/translate] Error:', err);
    const message = err instanceof Error ? err.message : 'Translation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
