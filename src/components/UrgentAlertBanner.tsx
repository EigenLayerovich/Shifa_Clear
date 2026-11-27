'use client';

import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
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
                  ? 'border-rose-600 bg-rose-50 text-rose-950'
                  : isMajor
                    ? 'border-amber-500 bg-amber-50 text-amber-950'
                    : 'border-sky-400 bg-sky-50 text-sky-950'
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
