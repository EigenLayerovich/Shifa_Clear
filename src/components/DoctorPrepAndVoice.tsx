'use client';

import React, { useState } from 'react';
import {
  Check,
  CheckSquare,
  Copy,
  Printer,
  Square,
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
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-labelledby="doctor-prep-heading"
      className="print-break-avoid grid gap-5 lg:grid-cols-12"
    >
      {/* Left 7 cols: Physician Visit Questions */}
      <div className="rounded-xl border border-neutral-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:col-span-7">
        <div className="border-b border-neutral-900/8 pb-3">
          <h2 id="doctor-prep-heading" className="text-base font-medium text-[#171717]">
            {t.doctorPrepHeading}
          </h2>
          <p className="mt-0.5 text-xs text-[#737373]">{t.doctorPrepSub}</p>
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
                  className={`flex min-h-[44px] w-full items-start gap-3 rounded-lg border p-3.5 text-start text-sm transition-colors duration-150 ${
                    isChecked
                      ? 'border-[#0f766e]/35 bg-[#fafafa] text-[#171717]'
                      : 'border-neutral-900/8 bg-white text-[#525252] hover:bg-[#fafafa] hover:text-[#171717]'
                  }`}
                >
                  <span className="mt-0.5 flex w-4 shrink-0 justify-center">
                    {isChecked ? (
                      <CheckSquare className="h-4 w-4 text-[#0f766e]" strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <Square className="h-4 w-4 text-[#737373]" strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </span>
                  <span className="leading-relaxed">{question}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right 5 cols: Voice Read-Aloud & Caregiver Card */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:col-span-5">
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-2 border-b border-neutral-900/8 pb-3">
            <h3 className="text-base font-medium text-[#171717]">
              {t.voiceHandoffHeading}
            </h3>
            {audioProviderLabel && (
              <span className="font-mono text-[11px] text-[#737373]">
                {audioProviderLabel}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isLoadingAudio}
            onClick={onToggleSpeak}
            className={`no-print flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors duration-150 active:scale-[0.98] disabled:opacity-50 ${
              isSpeaking
                ? 'bg-[#b91c1c] hover:bg-[#991b1b]'
                : 'bg-[#0f766e] hover:bg-[#115e59]'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span>{t.stopAudioBtn}</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span>{isLoadingAudio ? t.generatingAudioBtn : t.listenBtn}</span>
              </>
            )}
          </button>

          <div className="rounded-lg border border-neutral-900/8 bg-[#fafafa] p-3.5 text-xs leading-relaxed whitespace-pre-line text-[#525252]">
            {narrative.caregiverWhatsappSummary}
          </div>
        </div>

        <div className="no-print flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyWhatsapp}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-900/12 bg-white px-4 text-xs font-medium text-[#171717] transition-colors duration-150 hover:bg-[#f4f4f5] active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 shrink-0 text-[#15803d]" strokeWidth={1.5} aria-hidden="true" />
                <span>{t.copiedWhatsappBtn}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 shrink-0 text-[#737373]" strokeWidth={1.5} aria-hidden="true" />
                <span>{t.copyWhatsappBtn}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-neutral-900/12 bg-white px-4 text-xs font-medium text-[#171717] transition-colors duration-150 hover:bg-[#f4f4f5] active:scale-[0.98]"
          >
            <Printer className="h-4 w-4 shrink-0 text-[#737373]" strokeWidth={1.5} aria-hidden="true" />
            <span>{t.printBtn}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
