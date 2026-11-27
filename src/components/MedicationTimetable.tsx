'use client';

import React from 'react';
import {
  CloudSun,
  Moon,
  Sun,
  Sunset,
  Volume2,
} from 'lucide-react';
import type {
  EvaluatedMedication,
  MedicationExplanation,
  SupportedLanguage,
  TimeSlot,
} from '@/lib/clinical/types';
import { UI_STRINGS } from '@/lib/i18n/uiStrings';

interface MedicationTimetableProps {
  medications: EvaluatedMedication[];
  explanations: Record<string, MedicationExplanation>;
  language: SupportedLanguage;
  elderMode: boolean;
  onSpeakText: (text: string) => void;
}

const SLOT_ORDER: TimeSlot[] = ['morning', 'afternoon', 'evening', 'bedtime'];

export function MedicationTimetable({
  medications,
  explanations,
  language,
  elderMode,
  onSpeakText,
}: MedicationTimetableProps) {
  if (medications.length === 0) return null;
  const t = UI_STRINGS[language];

  const slotMeta: Record<
    TimeSlot,
    { label: string; timeHint: string; Icon: typeof Sun }
  > = {
    morning: { label: t.morningSlot, timeHint: '07:00 – 09:00', Icon: Sun },
    afternoon: { label: t.afternoonSlot, timeHint: '12:30 – 14:30', Icon: CloudSun },
    evening: { label: t.eveningSlot, timeHint: '18:30 – 20:30', Icon: Sunset },
    bedtime: { label: t.bedtimeSlot, timeHint: '21:30 – 23:00', Icon: Moon },
  };

  return (
    <section aria-labelledby="medications-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2.5">
          <h2 id="medications-heading" className="text-base font-medium text-[#171717]">
            {t.medicationsHeading}
          </h2>
          <span className="font-mono text-xs text-[#737373]">
            <bdi dir="ltr">{medications.length}</bdi>
          </span>
        </div>
        {elderMode && (
          <span className="text-xs font-medium text-[#0f766e]">
            Large-print caregiver schedule active
          </span>
        )}
      </div>

      {/* Quiet Clinical 4-Period Grid */}
      <div
        className={`grid gap-4 ${
          elderMode ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {SLOT_ORDER.map((slot) => {
          const slotMeds = medications.filter((m) => m.slots.includes(slot));
          const meta = slotMeta[slot];
          const SlotIcon = meta.Icon;

          return (
            <div
              key={slot}
              className="print-break-avoid flex flex-col rounded-xl border border-neutral-900/8 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="mb-3 flex items-center justify-between border-b border-neutral-900/8 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex w-4 shrink-0 justify-center text-[#737373]">
                    <SlotIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-[#171717]">{meta.label}</h3>
                    <p className="font-mono text-[11px] text-[#737373]">
                      <bdi dir="ltr">{meta.timeHint}</bdi>
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs tabular-nums text-[#737373]">
                  <bdi dir="ltr">{slotMeds.length}</bdi>
                </span>
              </div>

              {slotMeds.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#737373]">No scheduled doses</p>
              ) : (
                <ul className="space-y-3">
                  {slotMeds.map((med) => {
                    const exp = explanations[med.id];
                    return (
                      <li
                        key={`${slot}-${med.id}`}
                        className={`elder-card rounded-lg border border-neutral-900/8 bg-[#fafafa] p-3.5 ${
                          med.hasSafetyFlag ? 'border-s-[3px] border-s-[#b45309]' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#171717]">
                              <bdi>{med.brandName}</bdi>
                            </p>
                            <p className="font-mono text-xs text-[#525252]">
                              <bdi dir="ltr">
                                {med.genericName} · {med.dose}
                              </bdi>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onSpeakText(
                                `${med.brandName}, ${med.dose}. ${
                                  exp?.howToTake || med.timingInstruction
                                }`,
                              )
                            }
                            aria-label={`Read instructions for ${med.brandName}`}
                            className="no-print flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-900/8 bg-white text-[#525252] transition-colors duration-150 hover:text-[#171717]"
                          >
                            <Volume2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                          </button>
                        </div>

                        <p className="mt-2 text-xs text-[#737373]">
                          {t.foodLabels[med.foodRule] || med.foodRule}
                        </p>

                        {med.hasSafetyFlag && med.safetyFlagSummary && (
                          <p className="mt-2 text-xs font-medium text-[#b45309]">
                            {med.safetyFlagSummary}
                          </p>
                        )}

                        <p className="mt-2 text-xs leading-relaxed text-[#525252]">
                          {exp?.howToTake || med.timingInstruction}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
