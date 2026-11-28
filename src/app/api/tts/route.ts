import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey, synthesizeSpeechWithGemini } from '@/lib/ai/gemini';
import type { SupportedLanguage } from '@/lib/clinical/types';
import { isValidLanguage } from '@/lib/clinical/validation';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'tts', 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many voice requests. Please wait a moment.' },
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

    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 2000) : '';
    const rawLang = body.language ?? 'en';
    if (!isValidLanguage(rawLang)) {
      return NextResponse.json(
        { error: 'Unsupported language code. Use en, ar, ur, tl, or hi.' },
        { status: 400 },
      );
    }
    const language: SupportedLanguage = rawLang;

    if (!text) {
      return NextResponse.json({ error: 'No text provided for speech synthesis.' }, { status: 400 });
    }

    const apiKey = resolveApiKey(req.headers.get('x-gemini-api-key'));
    if (!apiKey) {
      return NextResponse.json({ fallback: 'web_speech' });
    }

    try {
      const result = await synthesizeSpeechWithGemini({ apiKey, text, language });
      return NextResponse.json({
        audioBase64: result.audioBase64,
        mimeType: result.mimeType,
        provider: 'gemini-3.8-flash-lite-tts',
      });
    } catch (ttsErr) {
      console.warn('[ShifaClear /api/tts] Gemini TTS fallback to Web Speech:', ttsErr);
      return NextResponse.json({ fallback: 'web_speech' });
    }
  } catch (err) {
    console.error('[ShifaClear /api/tts] Error:', err);
    return NextResponse.json({ fallback: 'web_speech' });
  }
}
