'use client';

import React, { useMemo, useState } from 'react';
import { MessageSquareHeart, Send, ShieldCheck, Sparkles } from 'lucide-react';
import type {
  SupportedLanguage,
  VerifiedClinicalEvaluation,
} from '@/lib/clinical/types';

interface ClinicalQaPanelProps {
  evaluation: VerifiedClinicalEvaluation;
  language: SupportedLanguage;
  sessionApiKey: string;
}

interface QaTurn {
  id: string;
  question: string;
  answer: string;
  provider: string;
}

function getContextualChips(
  evaluation: VerifiedClinicalEvaluation,
  language: SupportedLanguage,
): string[] {
  const hasThyroid = evaluation.medications.some((m) => m.drugClass === 'thyroid_hormone');
  const hasHighK = evaluation.biomarkers.some(
    (b) => b.canonicalId === 'potassium' && (b.status === 'high' || b.status === 'critical_high'),
  );
  const hasDiabetesOrLipids = evaluation.biomarkers.some(
    (b) => b.canonicalId === 'hba1c' || b.canonicalId === 'ldl',
  );

  if (language === 'ar') {
    const chips: string[] = [];
    if (hasThyroid) chips.push('هل يمكن شرب القهوة العربية أو الكرك مع دواء الغدة يوثايروكس؟');
    if (hasHighK) chips.push('هل التمر والموز آمنان مع ارتفاع البوتاسيوم هذا؟');
    if (hasDiabetesOrLipids) chips.push('كيف أستعد لصيام رمضان مع هذه النتائج بأمان؟');
    chips.push('ما الأطعمة الإماراتية التي يُنصح بتقليلها بناءً على هذه النتائج؟');
    chips.push('متى يُفضل إعادة هذه التحاليل مع الطبيب؟');
    return chips.slice(0, 3);
  }

  const chips: string[] = [];
  if (hasThyroid) chips.push('Can my mother drink Arabic coffee or karak near Euthyrox?');
  if (hasHighK) chips.push('Which UAE foods (like dates or bananas) raise potassium?');
  if (hasDiabetesOrLipids) chips.push('How does Ramadan fasting affect these results and meds?');
  chips.push('What UAE diet swaps help improve these specific markers?');
  chips.push('When should these labs or medications be rechecked by a doctor?');
  return chips.slice(0, 3);
}

export function ClinicalQaPanel({
  evaluation,
  language,
  sessionApiKey,
}: ClinicalQaPanelProps) {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<QaTurn[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const chips = useMemo(
    () => getContextualChips(evaluation, language),
    [evaluation, language],
  );

  const submitQuestion = async (qText: string) => {
    const trimmed = qText.trim();
    if (!trimmed || isAsking) return;

    setQuestion('');
    setIsAsking(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionApiKey.trim()) headers['x-gemini-api-key'] = sessionApiKey.trim();

      const res = await fetch('/api/qa', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: trimmed,
          evaluation,
          language,
        }),
      });
      const data = await res.json();
      if (res.ok && data.answer) {
        setTurns((prev) => [
          ...prev,
          {
            id: `${Date.now()}`,
            question: trimmed,
            answer: data.answer,
            provider: data.provider || 'gemini',
          },
        ]);
      }
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <section
      aria-labelledby="clinical-qa-heading"
      className="no-print rounded-3xl border border-slate-200 bg-white p-6 shadow-xs"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <MessageSquareHeart className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="clinical-qa-heading" className="text-base font-extrabold text-slate-900 sm:text-lg">
              {language === 'ar' ? 'اسأل عن نتائجك (بإشراف قواعد السلامة)' : 'Ask About My Results (UAE Clinical Q&A)'}
            </h2>
            <p className="text-xs text-slate-600">
              {language === 'ar'
                ? 'إجابات مبنية حصراً على تقريرك المُتحقق منه — دون تشخيص أو تعديل جرعات'
                : 'Grounded strictly in your verified report — tailored to UAE lifestyle, Ramadan planning & family care'}
            </p>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold text-teal-800 ring-1 ring-teal-200">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Non-Diagnostic Guardrail</span>
        </span>
      </div>

      {/* 1-Click UAE Quick Chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={isAsking}
            onClick={() => submitQuestion(chip)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/60 px-3.5 py-1.5 text-start text-xs font-bold text-teal-900 transition hover:bg-teal-100 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden="true" />
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* Q&A Conversation Thread */}
      {turns.length > 0 && (
        <div className="mt-4 space-y-3">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2"
            >
              <p className="text-xs font-extrabold text-teal-900 sm:text-sm">
                Q: {turn.question}
              </p>
              <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-line">
                {turn.answer}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Verified Report Grounding • {turn.provider}
              </p>
            </div>
          ))}
        </div>
      )}

      {isAsking && (
        <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/60 p-3">
          <p className="text-xs font-bold text-teal-900">
            Checking verified report facts...
          </p>
          <progress aria-label="Generating grounded answer" className="mt-1.5 h-1.5 w-full rounded-full accent-teal-700" />
        </div>
      )}

      {/* Free-Text Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuestion(question);
        }}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="clinical-qa-input" className="visually-hidden">
          Ask a follow-up question about your verified results
        </label>
        <input
          id="clinical-qa-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isAsking}
          placeholder={
            language === 'ar'
              ? 'اكتب سؤالك هنا (مثلاً: هل أستطيع ممارسة المشي اليوم؟)...'
              : 'Ask a follow-up question (e.g., "Can I fast during Ramadan?" or "What foods help LDL?")...'
          }
          className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-slate-50/50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white"
        />
        <button
          type="submit"
          disabled={isAsking || question.trim().length < 3}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white shadow-xs transition hover:bg-teal-800 disabled:opacity-50"
        >
          <Send className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          <span>{language === 'ar' ? 'اسأل' : 'Ask'}</span>
        </button>
      </form>
    </section>
  );
}
