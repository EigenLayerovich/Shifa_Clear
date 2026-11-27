'use client';

import React from 'react';
import type {
  PatientNarrative,
  SupportedLanguage,
  VerifiedClinicalEvaluation,
} from '@/lib/clinical/types';
import { LANGUAGE_MAP } from '@/lib/i18n/uiStrings';

interface BilingualPrintSheetProps {
  evaluation: VerifiedClinicalEvaluation;
  narrative: PatientNarrative;
  language: SupportedLanguage;
}

/**
 * Dedicated print-only 1-page hospital discharge handout showing side-by-side
 * English clinical findings and the patient's active language narrative.
 */
export function BilingualPrintSheet({
  evaluation,
  narrative,
  language,
}: BilingualPrintSheetProps) {
  const langMeta = LANGUAGE_MAP[language];
  const isBilingual = language !== 'en';

  return (
    <div className="hidden print:block text-slate-900 text-xs leading-normal space-y-4">
      {/* Hospital Header */}
      <div className="flex items-start justify-between border-b-2 border-teal-800 pb-3">
        <div>
          <h1 className="text-lg font-extrabold text-teal-900">
            ShifaClear — Bilingual Patient &amp; Caregiver Discharge Summary
          </h1>
          <p className="text-[11px] text-slate-600">
            {evaluation.facilityName || 'Clinical Summary'} • Date:{' '}
            {evaluation.reportDate || new Date().toISOString().slice(0, 10)} • Patient:{' '}
            {evaluation.patientContext.sex}, {evaluation.patientContext.age}y
          </p>
        </div>
        <div className="text-end">
          <span className="inline-block rounded border border-teal-800 px-2 py-0.5 text-[10px] font-extrabold uppercase">
            Risk: {evaluation.overallRisk}
          </span>
          <p className="mt-1 text-[10px] text-slate-500">
            Languages: English{isBilingual ? ` + ${langMeta.nativeLabel}` : ''}
          </p>
        </div>
      </div>

      {/* Side-by-Side Bilingual Summary */}
      <div className={`grid gap-4 ${isBilingual ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="rounded-lg border border-slate-300 p-3" dir="ltr" lang="en">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800">
            Clinical Overview (English — For Clinician / Nurse)
          </p>
          <p className="mt-1 font-bold">
            Verified {evaluation.biomarkers.length} biomarker(s), {evaluation.medications.length}{' '}
            medication(s), and {evaluation.alerts.length} deterministic safety alert(s).
          </p>
          {evaluation.alerts.length > 0 && (
            <ul className="mt-2 list-disc ps-4 space-y-1">
              {evaluation.alerts.map((a) => (
                <li key={a.id}>
                  <strong>[{a.severity.toUpperCase()} — {a.ruleId}]</strong> {a.title}:{' '}
                  {a.recommendedAction}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="rounded-lg border border-teal-700 bg-teal-50/30 p-3"
          dir={langMeta.dir}
          lang={langMeta.code}
        >
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800">
            Patient &amp; Family Summary ({langMeta.nativeLabel})
          </p>
          <p className="mt-1 font-bold">{narrative.headline}</p>
          <p className="mt-1">{narrative.overallSummary}</p>
        </div>
      </div>

      {/* Compact Clinical Biomarker Table */}
      {evaluation.biomarkers.length > 0 && (
        <div dir="ltr">
          <h2 className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Verified Laboratory Markers (SI &amp; US Units)
          </h2>
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-slate-100">
                <th scope="col" className="border border-slate-300 px-2 py-1 text-start">Marker (LOINC)</th>
                <th scope="col" className="border border-slate-300 px-2 py-1 text-end">SI (UAE)</th>
                <th scope="col" className="border border-slate-300 px-2 py-1 text-end">US</th>
                <th scope="col" className="border border-slate-300 px-2 py-1 text-start">Target (SI)</th>
                <th scope="col" className="border border-slate-300 px-2 py-1 text-center">12m Trend</th>
                <th scope="col" className="border border-slate-300 px-2 py-1 text-start">Status</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.biomarkers.map((b) => {
                const pts = b.historySI && b.historySI.length >= 2 ? b.historySI : null;
                let sparkPath = '';
                if (pts) {
                  const vals = pts.map((p) => p.value);
                  const minV = Math.min(...vals);
                  const maxV = Math.max(...vals);
                  const span = Math.max(maxV - minV, 0.01);
                  sparkPath = pts
                    .map((p, i) => {
                      const x = 4 + (i / (pts.length - 1)) * 56;
                      const y = 18 - ((p.value - minV) / span) * 14;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ');
                }
                return (
                  <tr key={b.id}>
                    <td className="border border-slate-300 px-2 py-1 font-semibold">
                      {b.displayName} {b.loincCode ? `(${b.loincCode})` : ''}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-end tabular-nums font-bold">
                      {b.siValue} {b.siUnit}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-end tabular-nums">
                      {b.usValue} {b.usUnit}
                    </td>
                    <td className="border border-slate-300 px-2 py-1">{b.refLabelSI}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {sparkPath ? (
                        <svg viewBox="0 0 64 22" className="mx-auto h-4 w-14" aria-hidden="true">
                          <path d={sparkPath} fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 font-bold uppercase">
                      {b.status.replace('_', ' ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Medication Schedule Table */}
      {evaluation.medications.length > 0 && (
        <div dir="ltr">
          <h2 className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Daily Medication Schedule &amp; Safety Flags
          </h2>
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-slate-100">
                <th scope="col" className="border border-slate-300 px-2 py-1 text-start">Medicine (Generic)</th>
                <th scope="col" className="border border-slate-300 px-2 py-1 text-start">Dose</th>
                <th scope="col" className="border border-slate-300 px-2 py-1 text-start">Time Slots</th>
                <th scope="col" className="border border-slate-300 px-2 py-1 text-start">Guidance / Flag</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.medications.map((m) => (
                <tr key={m.id}>
                  <td className="border border-slate-300 px-2 py-1 font-semibold">
                    {m.brandName} ({m.genericName})
                  </td>
                  <td className="border border-slate-300 px-2 py-1">{m.dose}</td>
                  <td className="border border-slate-300 px-2 py-1 capitalize">
                    {m.slots.join(', ')}
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    {m.safetyFlagSummary ? `[FLAG: ${m.safetyFlagSummary}] ` : ''}
                    {m.timingInstruction}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Questions for Next Doctor Visit */}
      <div dir={langMeta.dir} lang={langMeta.code} className="rounded-lg border border-slate-300 p-3">
        <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
          Questions for Your Next Physician Visit ({langMeta.nativeLabel})
        </h2>
        <ol className="mt-1 list-decimal ps-4 space-y-1">
          {narrative.doctorQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      </div>

      {/* Clinical Boundary Footer */}
      <p className="border-t border-slate-300 pt-2 text-[10px] text-slate-500">
        Clinical Safety Notice: ShifaClear explains medical reports and prepares questions for your
        clinician; it does not diagnose medical conditions or modify prescriptions. For urgent
        emergencies in the UAE, call 998.
      </p>
    </div>
  );
}
