import { ShifaClearApp } from '@/components/ShifaClearApp';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const hasServerApiKey = Boolean(
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim(),
  );

  return <ShifaClearApp hasServerApiKey={hasServerApiKey} />;
}
