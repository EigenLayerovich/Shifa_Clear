import { NextRequest, NextResponse } from 'next/server';
import {
  answerClinicalQuestionWithGemini,
  resolveApiKey,
} from '@/lib/ai/gemini';
import type {
  SupportedLanguage,
  VerifiedClinicalEvaluation,
} from '@/lib/clinical/types';
import { isValidLanguage } from '@/lib/clinical/validation';
import { checkRateLimit } from '@/lib/security/rateLimit';

function buildDeterministicQaFallback(
  question: string,
  evaluation: VerifiedClinicalEvaluation,
): string {
  const q = question.toLowerCase();

  if (evaluation.overallRisk === 'urgent') {
    return 'Because this report contains a critical clinical safety alert (such as critical potassium or acute kidney drop), please prioritize immediate Emergency Department evaluation or call 998 in the UAE before making dietary or medication adjustments at home.';
  }

  if (q.includes('ramadan') || q.includes('fast') || q.includes('صيام') || q.includes('رمضان')) {
    return 'If you plan to fast during Ramadan with diabetes, blood pressure, or kidney-related findings, schedule a pre-Ramadan medication review with your doctor 4–6 weeks ahead. Blood sugar pills (like Metformin/Glucophage), water pills (Lasix), and hydration timing between Iftar and Suhoor often need structured clinical guidance to prevent dehydration or low blood sugar—never adjust doses on your own.';
  }

  if (q.includes('coffee') || q.includes('karak') || q.includes('tea') || q.includes('قهوة') || q.includes('كرك')) {
    return 'Arabic coffee, karak tea, and milk can bind thyroid hormone (Levothyroxine/Euthyrox) and iron supplements in the stomach, reducing absorption. Take Euthyrox first thing with plain water only, wait 30–60 minutes before coffee or breakfast, and keep Calcium-D3 at least 4 hours later at lunchtime.';
  }

  if (q.includes('food') || q.includes('diet') || q.includes('potassium') || q.includes('ldl') || q.includes('أكل') || q.includes('غذاء')) {
    const hasHighK = evaluation.biomarkers.some(
      (b) => b.canonicalId === 'potassium' && (b.status === 'high' || b.status === 'critical_high'),
    );
    if (hasHighK) {
      return 'With elevated potassium, limit high-potassium UAE staples—especially dates, bananas, orange juice, potatoes, and salt substitutes—until your doctor rechecks your potassium and kidney function. Stay hydrated according to your physician’s fluid advice.';
    }
    return 'For heart and blood-sugar support in the UAE, focus on high-fiber grilled proteins, salads with olive oil, and whole grains while cutting back on sweetened karak tea, fruit juices, ghee-heavy dishes, and white rice/bread portions. Confirm personalized nutrition targets with your clinician or dietitian.';
  }

  return 'Based on your verified ShifaClear clinical summary, bring these exact values and any flagged medication alerts to your physician or pharmacist before making treatment changes. Use the Doctor Visit Prep questions above to guide your next appointment.';
}

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'qa', 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many follow-up questions. Please wait a moment.' },
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

    const question = typeof body.question === 'string' ? body.question.trim().slice(0, 800) : '';
    const rawLang = body.language ?? 'en';
    if (!isValidLanguage(rawLang)) {
      return NextResponse.json(
        { error: 'Unsupported language code. Use en, ar, ur, tl, or hi.' },
        { status: 400 },
      );
    }
    const language: SupportedLanguage = rawLang;
    const evaluation =
      body.evaluation && typeof body.evaluation === 'object'
        ? (body.evaluation as VerifiedClinicalEvaluation)
        : undefined;

    if (
      !question ||
      !evaluation ||
      !Array.isArray(evaluation.biomarkers) ||
      !Array.isArray(evaluation.alerts)
    ) {
      return NextResponse.json(
        { error: 'Question and verified evaluation are required.' },
        { status: 400 },
      );
    }

    const apiKey = resolveApiKey(req.headers.get('x-gemini-api-key'));
    if (!apiKey) {
      return NextResponse.json({
        answer: buildDeterministicQaFallback(question, evaluation),
        provider: 'clinical_guardrail_fallback',
      });
    }

    try {
      const { answer, modelUsed } = await answerClinicalQuestionWithGemini({
        apiKey,
        evaluation,
        question,
        language,
      });
      return NextResponse.json({ answer, provider: modelUsed });
    } catch (err) {
      console.warn('[ShifaClear /api/qa] Fallback used:', err);
      return NextResponse.json({
        answer: buildDeterministicQaFallback(question, evaluation),
        provider: 'clinical_guardrail_fallback',
      });
    }
  } catch (err) {
    console.error('[ShifaClear /api/qa] Error:', err);
    return NextResponse.json({ error: 'Unable to answer question right now.' }, { status: 500 });
  }
}
