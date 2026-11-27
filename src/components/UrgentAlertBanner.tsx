'use client';

import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  PhoneCall,
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
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="safety-alerts-heading" className="text-base font-medium text-[#171717]">
          {t.safetyAlertsHeading}
        </h2>
        <span className="font-mono text-xs text-[#737373]">
          <bdi dir="ltr">{alerts.length}</bdi>
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const translated = translations[alert.id];
          const title = translated?.title || alert.title;
          const explanation = translated?.explanation || alert.clinicalRationale;
          const action = translated?.action || alert.recommendedAction;

          const isCritical = alert.severity === 'critical';
          const isMajor = alert.severity === 'major';

          const borderAccent = isCritical
            ? 'border-s-[3px] border-s-[#b91c1c] bg-red-50/40'
            : isMajor
              ? 'border-s-[3px] border-s-[#b45309] bg-white'
              : 'border-s-[3px] border-s-[#0f766e] bg-white';

          const severityLabel = isCritical
            ? 'Critical'
            : isMajor
              ? 'Major'
              : 'Timing';

          const severityTextColor = isCritical
            ? 'text-[#b91c1c]'
            : isMajor
              ? 'text-[#b45309]'
              : 'text-[#0f766e]';

          return (
            <div
              key={alert.id}
              role={isCritical ? 'alert' : undefined}
              className={`print-break-avoid rounded-xl border border-neutral-900/10 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${borderAccent}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex w-4 shrink-0 justify-center ${severityTextColor}`}>
                    {isCritical ? (
                      <AlertOctagon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    ) : alert.category === 'timing_conflict' ? (
                      <Clock className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </span>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                      <span className={`font-medium ${severityTextColor}`}>{severityLabel}</span>
                      <span className="font-mono text-[#737373]">
                        <bdi dir="ltr">{alert.ruleId}</bdi>
                      </span>
                      {alert.involvedItems.length > 0 && (
                        <span className="text-[#737373]">
                          · <bdi>{alert.involvedItems.join(', ')}</bdi>
                        </span>
                      )}
                    </div>

                    <h3 className="text-[15px] font-semibold text-[#171717]">{title}</h3>
                    <p className="text-sm leading-relaxed text-[#525252]">{explanation}</p>
                    <p className="border-t border-neutral-900/8 pt-2.5 text-sm font-medium text-[#171717]">
                      {action}
                    </p>
                  </div>
                </div>

                {alert.emergencyNumber && (
                  <a
                    href={`tel:${alert.emergencyNumber}`}
                    className="no-print inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#b91c1c] px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#991b1b] active:scale-[0.98]"
                  >
                    <PhoneCall className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
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
