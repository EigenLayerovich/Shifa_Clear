import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey, synthesizeSpeechWithGemini } from '@/lib/ai/gemini';
import type { SupportedLanguage } from '@/lib/clinical/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const language = (body.language || 'en') as SupportedLanguage;

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
