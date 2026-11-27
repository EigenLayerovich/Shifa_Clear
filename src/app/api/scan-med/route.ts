import { NextRequest, NextResponse } from 'next/server';
import { identifyMedicationBoxWithGemini, resolveApiKey } from '@/lib/ai/gemini';
import { UAE_DRUG_REGISTRY } from '@/lib/clinical/drugRegistry';

export const maxDuration = 30;

function matchRegistry(brandName: string, genericName?: string) {
  const haystack = `${brandName} ${genericName || ''}`.toLowerCase();
  let best: { profile: (typeof UAE_DRUG_REGISTRY)[number]; len: number } | undefined;
  for (const drug of UAE_DRUG_REGISTRY) {
    for (const alias of drug.aliases) {
      if (haystack.includes(alias.toLowerCase()) && (!best || alias.length > best.len)) {
        best = { profile: drug, len: alias.length };
      }
    }
  }
  return best?.profile;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = resolveApiKey(req.headers.get('x-gemini-api-key'));
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required for live camera box scanning. Add one in QR & API or search manually below.' },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No medication photo provided.' }, { status: 400 });
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
    const message = err instanceof Error ? err.message : 'Could not scan medication photo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
