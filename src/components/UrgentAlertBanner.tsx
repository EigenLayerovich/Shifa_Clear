'use client';

import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Cpu,
  PhoneCall,
  ShieldAlert,
} from 'lucide-react';
import type {
  AlertTranslation,
  ClinicalAlert,
  SupportedLanguage,
} from '@/lib/clinical/types';
import { UI_STRINGS } from '@/lib/i18n/uiStrings';

interface UrgentAlertBannerProps {
  alerts: ClinicalAlert[];
  translations: Record<string, AlertTranslation>;
  language: SupportedLanguage;
}

export function UrgentAlertBanner({
  alerts,
  translations,
  language,
}: UrgentAlertBannerProps) {
  if (alerts.length === 0) return null;
  const t = UI_STRINGS[language];

  return (
    <section aria-labelledby="safety-alerts-heading" className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-rose-700" aria-hidden="true" />
        <h2 id="safety-alerts-heading" className="text-base font-extrabold text-slate-900 sm:text-lg">
          {t.safetyAlertsHeading}
        </h2>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const translated = translations[alert.id];
          const title = translated?.title || alert.title;
          const explanation = translated?.explanation || alert.clinicalRationale;
          const action = translated?.action || alert.recommendedAction;

          const isCritical = alert.severity === 'critical';
          const isMajor = alert.severity === 'major';

          return (
            <div
              key={alert.id}
              role={isCritical ? 'alert' : undefined}
              className={`print-break-avoid rounded-2xl border-2 p-5 shadow-sm ${
                isCritical
                  ? 'border-rose-600 border-s-[6px] border-s-rose-700 bg-rose-50 text-rose-950 shadow-md shadow-rose-900/10'
                  : isMajor
                    ? 'border-amber-500 border-s-[6px] border-s-amber-600 bg-amber-50 text-amber-950'
                    : 'border-sky-400 border-s-[6px] border-s-sky-600 bg-sky-50 text-sky-950'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isCritical
                        ? 'bg-rose-600 text-white'
                        : isMajor
                          ? 'bg-amber-600 text-white'
                          : 'bg-sky-600 text-white'
                    }`}
                  >
                    {isCritical ? (
                      <AlertOctagon className="h-6 w-6" aria-hidden="true" />
                    ) : alert.category === 'timing_conflict' ? (
                      <Clock className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-700 text-white'
                            : isMajor
                              ? 'bg-amber-700 text-white'
                              : 'bg-sky-700 text-white'
                        }`}
                      >
                        {alert.severity} • {alert.ruleId}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 shadow-xs">
                        <Cpu className="h-3 w-3 shrink-0" aria-hidden="true" />
                        Verified by Rule Engine (Non-LLM)
                      </span>
                      {alert.involvedItems.map((item) => (
                        <span
                          key={item}
                          className="rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-bold text-slate-800 ring-1 ring-black/10"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-base font-extrabold sm:text-lg">{title}</h3>
                    <p className="text-sm leading-relaxed opacity-90">{explanation}</p>

                    {/* Animated Drug Interaction Arc Graph for multi-item drug/cross-domain interactions */}
                    {alert.involvedItems.length >= 2 &&
                      alert.category !== 'panic_value' &&
                      alert.category !== 'patient_identity' && (
                      <div
                        dir="ltr"
                        className="my-2.5 rounded-xl border border-black/10 bg-white/85 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-xs">
                            {alert.involvedItems[0]}
                          </span>

                          <div className="relative flex min-w-[110px] flex-1 flex-col items-center">
                            <svg
                              viewBox="0 0 180 34"
                              className="h-8 w-full max-w-[200px] overflow-visible"
                              aria-hidden="true"
                            >
                              <path
                                d="M 8 28 Q 90 -6 172 28"
                                pathLength={100}
                                fill="none"
                                stroke={
                                  isCritical ? '#BE123C' : isMajor ? '#D97706' : '#0284C7'
                                }
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={alert.category === 'timing_conflict' ? '6 4' : undefined}
                                className="interaction-arc-draw"
                              />
                              <circle
                                cx="8"
                                cy="28"
                                r="4"
                                fill={isCritical ? '#BE123C' : isMajor ? '#D97706' : '#0284C7'}
                              />
                              <circle
                                cx="172"
                                cy="28"
                                r="4"
                                fill={isCritical ? '#BE123C' : isMajor ? '#D97706' : '#0284C7'}
                              />
                            </svg>
                            <span
                              className={`-mt-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-900'
                                  : isMajor
                                    ? 'bg-amber-100 text-amber-950'
                                    : 'bg-sky-100 text-sky-900'
                              }`}
                            >
                              {alert.category === 'timing_conflict'
                                ? 'Absorption Block'
                                : isCritical
                                  ? 'Contraindicated Link'
                                  : 'Interaction Link'}
                            </span>
                          </div>

                          <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-xs">
                            {alert.involvedItems.slice(1).join(' + ')}
                          </span>
                        </div>

                        {/* Visual Expanding 4-Hour Safe Dosing Separation Bar for Chelation Conflicts */}
                        {alert.category === 'timing_conflict' && (
                          <div className="mt-3 space-y-1.5 border-t border-slate-200/80 pt-2.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                              <span className="text-teal-800">07:00 AM • {alert.involvedItems[0].split(' (')[0]}</span>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">
                                Safe 4-Hour Window
                              </span>
                              <span className="text-sky-800">11:00 AM / Lunch • {alert.involvedItems[1].split(' (')[0]}</span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                              <div className="separation-bar-expand h-full w-full rounded-full bg-gradient-to-r from-teal-600 via-emerald-400 to-sky-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="rounded-xl bg-white/75 px-3.5 py-2.5 text-sm font-bold ring-1 ring-black/5">
                      {action}
                    </p>
                  </div>
                </div>

                {alert.emergencyNumber && (
                  <a
                    href={`tel:${alert.emergencyNumber}`}
                    className="no-print inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-rose-800"
                  >
                    <PhoneCall className="h-5 w-5" aria-hidden="true" />
                    <span>{t.urgentBannerCall}</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
