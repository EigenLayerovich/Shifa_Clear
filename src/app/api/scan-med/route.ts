import { NextRequest, NextResponse } from 'next/server';
import { identifyMedicationBoxWithGemini, resolveApiKey } from '@/lib/ai/gemini';
import { UAE_DRUG_REGISTRY } from '@/lib/clinical/drugRegistry';
import { checkRateLimit } from '@/lib/security/rateLimit';

export const maxDuration = 30;
const MAX_BOX_IMAGE_BYTES = 4.2 * 1024 * 1024;

function matchRegistry(brandName: string, genericName?: string) {
  if (genericName) {
    const cleanGeneric = genericName.trim().toLowerCase();
    const exact = UAE_DRUG_REGISTRY.find((d) => d.genericName.toLowerCase() === cleanGeneric);
    if (exact) return exact;
  }

  const haystack = `${brandName} ${genericName || ''}`.toLowerCase();
  let best: { profile: (typeof UAE_DRUG_REGISTRY)[number]; len: number } | undefined;
  for (const drug of UAE_DRUG_REGISTRY) {
    for (const alias of drug.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const boundaryRegex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
      if (boundaryRegex.test(haystack) && (!best || alias.length > best.len)) {
        best = { profile: drug, len: alias.length };
      }
    }
  }
  return best?.profile;
}

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'scan-med', 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many scan requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
      );
    }

    const apiKey = resolveApiKey(req.headers.get('x-gemini-api-key'));
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required for live camera box scanning. Add one in QR & API or search manually below.' },
        { status: 400 },
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid multipart upload payload.' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'No medication photo provided.' }, { status: 400 });
    }
    if (file.size > MAX_BOX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'Medication photo exceeds the 4.2 MB limit. Try a smaller image.' },
        { status: 413 },
      );
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const detected = await identifyMedicationBoxWithGemini({
      apiKey,
      base64Data,
      mimeType,
    });

    const resolved = detected.map((item) => {
      const profile = matchRegistry(item.brandName, item.genericName);
      return {
        brandName: item.brandName,
        genericName: profile?.genericName || item.genericName || item.brandName,
        drugClass: profile ? profile.drugClass.replace(/_/g, ' ') : 'other',
        strength: item.strength,
        matchedInRegistry: Boolean(profile),
      };
    });

    return NextResponse.json({ medications: resolved });
  } catch (err) {
    console.error('[ShifaClear /api/scan-med] Error:', err);
    return NextResponse.json(
      { error: 'Could not scan medication photo right now. Please try again.' },
      { status: 500 },
    );
  }
}
