'use client';

import React from 'react';
import {
  AlertTriangle,
  CloudSun,
  Moon,
  Pill,
  Sun,
  Sunset,
  Utensils,
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
    { label: string; timeHint: string; bg: string; iconColor: string; Icon: typeof Sun }
  > = {
    morning: {
      label: t.morningSlot,
      timeHint: '07:00 – 09:00',
      bg: 'bg-amber-50 border-amber-200',
      iconColor: 'text-amber-600 bg-amber-100',
      Icon: Sun,
    },
    afternoon: {
      label: t.afternoonSlot,
      timeHint: '12:30 – 14:30',
      bg: 'bg-sky-50 border-sky-200',
      iconColor: 'text-sky-700 bg-sky-100',
      Icon: CloudSun,
    },
    evening: {
      label: t.eveningSlot,
      timeHint: '18:30 – 20:30',
      bg: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-700 bg-orange-100',
      Icon: Sunset,
    },
    bedtime: {
      label: t.bedtimeSlot,
      timeHint: '21:30 – 23:00',
      bg: 'bg-indigo-50 border-indigo-200',
      iconColor: 'text-indigo-700 bg-indigo-100',
      Icon: Moon,
    },
  };

  return (
    <section aria-labelledby="medications-heading" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Pill className="h-5 w-5 text-teal-700" aria-hidden="true" />
          <h2 id="medications-heading" className="text-lg font-extrabold text-slate-900 sm:text-xl">
            {t.medicationsHeading}
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            {medications.length}
          </span>
        </div>
        {elderMode && (
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-extrabold text-teal-900">
            Grandparent / Caregiver Large-Print Schedule Active
          </span>
        )}
      </div>

      {/* 4-Slot Visual Daily Grid */}
      <div className={`grid gap-4 ${elderMode ? 'grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
        {SLOT_ORDER.map((slot) => {
          const slotMeds = medications.filter((m) => m.slots.includes(slot));
          const meta = slotMeta[slot];
          const SlotIcon = meta.Icon;

          return (
            <div
              key={slot}
              className={`print-break-avoid rounded-2xl border p-4 ${meta.bg}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.iconColor}`}
                  >
                    <SlotIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{meta.label}</h3>
                    <p className="text-[11px] font-semibold text-slate-500">{meta.timeHint}</p>
                  </div>
                </div>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-extrabold text-slate-700">
                  {slotMeds.length}
                </span>
              </div>

              {slotMeds.length === 0 ? (
                <p className="rounded-xl bg-white/60 px-3 py-4 text-center text-xs font-medium text-slate-400">
                  —
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {slotMeds.map((med) => {
                    const exp = explanations[med.id];
                    return (
                      <li
                        key={`${slot}-${med.id}`}
                        className={`elder-card rounded-xl border bg-white p-3.5 shadow-xs ${
                          med.hasSafetyFlag ? 'border-amber-400 ring-1 ring-amber-200' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-extrabold text-slate-900 sm:text-base">
                              {med.brandName}
                            </p>
                            <p className="text-xs font-semibold text-teal-800">
                              {med.genericName} • {med.dose}
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
                            className="no-print flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100"
                          >
                            <Volume2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                          <Utensils className="h-3 w-3 shrink-0 text-slate-500" aria-hidden="true" />
                          <span>{t.foodLabels[med.foodRule] || med.foodRule}</span>
                        </div>

                        {med.hasSafetyFlag && med.safetyFlagSummary && (
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-extrabold text-amber-900 ring-1 ring-amber-200">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                            <span>{med.safetyFlagSummary}</span>
                          </div>
                        )}

                        <p className="mt-2 text-xs leading-relaxed text-slate-700">
                          {exp?.howToTake || med.timingInstruction}
                        </p>
                        {exp?.plainPurpose && (
                          <p className="mt-1 text-[11px] font-medium text-slate-500">
                            {exp.plainPurpose}
                          </p>
                        )}
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
