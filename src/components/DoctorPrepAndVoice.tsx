'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  Printer,
  Square,
  CheckSquare,
  Stethoscope,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { PatientNarrative, SupportedLanguage } from '@/lib/clinical/types';
import { UI_STRINGS } from '@/lib/i18n/uiStrings';

interface DoctorPrepAndVoiceProps {
  narrative: PatientNarrative;
  language: SupportedLanguage;
  isSpeaking: boolean;
  isLoadingAudio: boolean;
  audioProviderLabel: string | null;
  onToggleSpeak: () => void;
}

export function DoctorPrepAndVoice({
  narrative,
  language,
  isSpeaking,
  isLoadingAudio,
  audioProviderLabel,
  onToggleSpeak,
}: DoctorPrepAndVoiceProps) {
  const t = UI_STRINGS[language];
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const handleCopyWhatsapp = async () => {
    try {
      await navigator.clipboard.writeText(narrative.caregiverWhatsappSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    } catch {
      // Fallback copy if clipboard restricted
      setCopied(false);
    }
  };

  return (
    <section
      aria-labelledby="doctor-prep-heading"
      className="print-break-avoid grid gap-5 lg:grid-cols-12"
    >
      {/* Doctor Visit Prep Checklist */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Stethoscope className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="doctor-prep-heading" className="text-base font-extrabold text-slate-900 sm:text-lg">
                {t.doctorPrepHeading}
              </h2>
              <p className="text-xs text-slate-600">{t.doctorPrepSub}</p>
            </div>
          </div>
        </div>

        <ul className="mt-4 space-y-2.5">
          {narrative.doctorQuestions.map((question, idx) => {
            const isChecked = Boolean(checkedQuestions[idx]);
            return (
              <li key={idx}>
                <button
                  type="button"
                  aria-pressed={isChecked}
                  onClick={() =>
                    setCheckedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }))
                  }
                  className={`flex min-h-[48px] w-full items-start gap-3 rounded-2xl border p-3.5 text-start text-sm font-semibold transition ${
                    isChecked
                      ? 'border-teal-300 bg-teal-50/70 text-teal-950'
                      : 'border-slate-200 bg-slate-50/50 text-slate-800 hover:border-teal-300 hover:bg-white'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
                  ) : (
                    <Square className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                  )}
                  <span className="leading-relaxed">{question}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Voice Read-Aloud & Caregiver Handoff Card */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 p-6 shadow-xs lg:col-span-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Voice &amp; Family Caregiver Card
            </h3>
            {audioProviderLabel && (
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-extrabold text-teal-900">
                {audioProviderLabel}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isLoadingAudio}
            onClick={onToggleSpeak}
            className={`no-print flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl px-5 text-sm font-extrabold shadow-sm transition disabled:opacity-60 ${
              isSpeaking
                ? 'bg-rose-700 text-white hover:bg-rose-800'
                : 'bg-teal-700 text-white hover:bg-teal-800'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-5 w-5" aria-hidden="true" />
                <span>{t.stopAudioBtn}</span>
              </>
            ) : (
              <>
                <Volume2 className="h-5 w-5" aria-hidden="true" />
                <span>{isLoadingAudio ? t.generatingAudioBtn : t.listenBtn}</span>
              </>
            )}
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-xs leading-relaxed whitespace-pre-line text-slate-700">
            {narrative.caregiverWhatsappSummary}
          </div>
        </div>

        <div className="no-print flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleCopyWhatsapp}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-teal-300 bg-white px-4 text-xs font-extrabold text-teal-900 shadow-xs transition hover:bg-teal-50"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                <span>{t.copiedWhatsappBtn}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-teal-700" aria-hidden="true" />
                <span>{t.copyWhatsappBtn}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-extrabold text-slate-800 shadow-xs transition hover:bg-slate-50"
          >
            <Printer className="h-4 w-4 text-slate-600" aria-hidden="true" />
            <span>{t.printBtn}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
