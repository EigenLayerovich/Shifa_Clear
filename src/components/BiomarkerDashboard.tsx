'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  BiomarkerExplanation,
  BiomarkerStatus,
  EvaluatedBiomarker,
  OrganSystemSummary,
  SupportedLanguage,
  UnitSystem,
} from '@/lib/clinical/types';
import { UI_STRINGS } from '@/lib/i18n/uiStrings';

interface BiomarkerDashboardProps {
  biomarkers: EvaluatedBiomarker[];
  organSummaries: OrganSystemSummary[];
  explanations: Record<string, BiomarkerExplanation>;
  unitSystem: UnitSystem;
  language: SupportedLanguage;
  elderMode: boolean;
}

function statusMeta(status: BiomarkerStatus) {
  switch (status) {
    case 'critical_high':
    case 'critical_low':
      return {
        dot: 'bg-[#b91c1c]',
        text: 'text-[#b91c1c]',
        pin: 'bg-[#b91c1c]',
        cardAccent: 'border-s-[3px] border-s-[#b91c1c]',
      };
    case 'high':
    case 'low':
      return {
        dot: 'bg-[#b91c1c]',
        text: 'text-[#b91c1c]',
        pin: 'bg-[#b91c1c]',
        cardAccent: '',
      };
    case 'borderline_high':
    case 'borderline_low':
      return {
        dot: 'bg-[#b45309]',
        text: 'text-[#b45309]',
        pin: 'bg-[#b45309]',
        cardAccent: '',
      };
    case 'normal':
      return {
        dot: 'bg-[#15803d]',
        text: 'text-[#15803d]',
        pin: 'bg-[#0f766e]',
        cardAccent: '',
      };
    default:
      return {
        dot: 'bg-[#737373]',
        text: 'text-[#525252]',
        pin: 'bg-[#525252]',
        cardAccent: '',
      };
  }
}

export function BiomarkerDashboard({
  biomarkers,
  organSummaries,
  explanations,
  unitSystem,
  language,
  elderMode,
}: BiomarkerDashboardProps) {
  const t = UI_STRINGS[language];
  const [filter, setFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const filteredBiomarkers = useMemo(() => {
    if (filter === 'all') return biomarkers;
    if (filter === 'abnormal') {
      return biomarkers.filter((b) => b.status !== 'normal');
    }
    return biomarkers.filter((b) => b.organSystem === filter);
  }, [biomarkers, filter]);

  if (biomarkers.length === 0) return null;

  const abnormalCount = biomarkers.filter((b) => b.status !== 'normal').length;

  const toggleCard = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section aria-labelledby="biomarkers-heading" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-2.5">
          <h2 id="biomarkers-heading" className="text-base font-medium text-[#171717]">
            {t.biomarkersHeading}
          </h2>
          <span className="font-mono text-xs text-[#737373]">
            <bdi dir="ltr">{biomarkers.length}</bdi>
          </span>
        </div>

        {/* Quiet Filter Row */}
        <div className="no-print flex flex-wrap gap-1 rounded-lg bg-[#f4f4f5] p-1">
          <button
            type="button"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`h-8 rounded-md px-3 text-xs font-medium transition-colors duration-150 ${
              filter === 'all'
                ? 'bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-neutral-900/8'
                : 'text-[#525252] hover:text-[#171717]'
            }`}
          >
            {t.allFilter}{' '}
            <span className="font-mono text-[#737373]">
              <bdi dir="ltr">{biomarkers.length}</bdi>
            </span>
          </button>

          {abnormalCount > 0 && (
            <button
              type="button"
              aria-pressed={filter === 'abnormal'}
              onClick={() => setFilter('abnormal')}
              className={`h-8 rounded-md px-3 text-xs font-medium transition-colors duration-150 ${
                filter === 'abnormal'
                  ? 'bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-neutral-900/8'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              {t.abnormalFilter}{' '}
              <span className="font-mono text-[#b91c1c]">
                <bdi dir="ltr">{abnormalCount}</bdi>
              </span>
            </button>
          )}

          {organSummaries.map((org) => (
            <button
              key={org.organSystem}
              type="button"
              aria-pressed={filter === org.organSystem}
              onClick={() => setFilter(org.organSystem)}
              className={`h-8 rounded-md px-3 text-xs font-medium transition-colors duration-150 ${
                filter === org.organSystem
                  ? 'bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-neutral-900/8'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              {org.organSystem}
            </button>
          ))}
        </div>
      </div>

      {/* Biomarker Grid with Calibrated Clinical Range Meters */}
      <div className={`grid gap-4 ${elderMode ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
        {filteredBiomarkers.map((bio) => {
          const meta = statusMeta(bio.status);
          const exp = explanations[bio.canonicalId];
          const displayVal = unitSystem === 'SI' ? bio.siValue : bio.usValue;
          const displayUnit = unitSystem === 'SI' ? bio.siUnit : bio.usUnit;
          const displayRef = unitSystem === 'SI' ? bio.refLabelSI : bio.refLabelUS;
          const priorVal = unitSystem === 'SI' ? bio.priorSiValue : bio.priorUsValue;
          const isExpanded = elderMode || expandedIds[bio.id] !== false;

          const refStart = bio.refRangeStartPct ?? 25;
          const refEnd = bio.refRangeEndPct ?? 75;
          const refWidth = Math.max(4, refEnd - refStart);

          const hasPriorPin =
            bio.priorGaugePercent !== undefined && priorVal !== undefined;
          const deltaStart = hasPriorPin
            ? Math.min(bio.priorGaugePercent!, bio.gaugePercent)
            : 0;
          const deltaWidth = hasPriorPin
            ? Math.abs(bio.gaugePercent - bio.priorGaugePercent!)
            : 0;

          return (
            <article
              key={bio.id}
              className={`elder-card print-break-avoid rounded-xl border border-neutral-900/8 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${meta.cardAccent}`}
            >
              {/* Header row: Label + Mono Reading */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#737373]">
                    <span>{bio.organSystem}</span>
                    {bio.loincCode && (
                      <span className="font-mono">
                        · <bdi dir="ltr">{bio.loincCode}</bdi>
                      </span>
                    )}
                  </div>
                  <h3 className="text-[15px] font-medium text-[#171717]">
                    {exp?.plainTitle || bio.displayName}
                  </h3>
                  {exp?.plainTitle && exp.plainTitle !== bio.displayName && (
                    <p className="text-xs text-[#737373]">{bio.displayName}</p>
                  )}
                </div>

                <div className="shrink-0 text-end">
                  <div className="elder-value font-mono text-2xl font-medium leading-none tabular-nums text-[#171717]">
                    <bdi dir="ltr">
                      {displayVal}{' '}
                      <span className="text-xs font-normal text-[#737373]">{displayUnit}</span>
                    </bdi>
                  </div>
                  <div className="mt-1.5 inline-flex items-center justify-end gap-1.5 text-xs font-medium">
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                    <span className={meta.text}>
                      {t.statusLabels[bio.status] || bio.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signature Moment: Calibrated Clinical Reference Bracket Meter */}
              <div className="mt-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#737373]">
                  <span>
                    {t.referenceLabel}:{' '}
                    <span className="font-mono text-[#525252]">
                      <bdi dir="ltr">{displayRef}</bdi>
                    </span>
                  </span>
                  {bio.wasUnitConverted && (
                    <span className="font-mono text-[11px] text-[#0f766e]">
                      {t.convertedFromLabel}{' '}
                      <bdi dir="ltr">
                        {bio.originalValue} {bio.originalUnit}
                      </bdi>
                    </span>
                  )}
                </div>

                {/* Calibrated track: mirrors natively in RTL via insetInlineStart */}
                <div className="relative h-6 w-full" aria-hidden="true">
                  {/* Base rail */}
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#f4f4f5] ring-1 ring-neutral-900/6" />

                  {/* Calibrated normal reference window */}
                  <div
                    className="absolute top-1/2 h-2.5 -translate-y-1/2 border-x border-[#0f766e]/45 bg-[#0f766e]/12"
                    style={{
                      insetInlineStart: `${refStart}%`,
                      width: `${refWidth}%`,
                    }}
                  />

                  {/* Connecting hairline between 6-month prior and current reading */}
                  {hasPriorPin && deltaWidth > 1 && (
                    <div
                      className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-[#171717]/35"
                      style={{
                        insetInlineStart: `${deltaStart}%`,
                        width: `${deltaWidth}%`,
                      }}
                    />
                  )}

                  {/* Prior 6-month hollow ring marker */}
                  {hasPriorPin && (
                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-[1.5px] border-[#525252] bg-white"
                      style={{
                        insetInlineStart: `calc(${bio.priorGaugePercent}% - 6px)`,
                      }}
                    />
                  )}

                  {/* Current specimen calibrated needle dot */}
                  <div
                    className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,0.22)] ${meta.pin}`}
                    style={{
                      insetInlineStart: `calc(${bio.gaugePercent}% - 7px)`,
                    }}
                  />
                </div>

                {/* Longitudinal 6-Month Comparison Row */}
                {priorVal !== undefined && bio.trendDirection && (
                  <div className="flex items-center justify-between gap-2 text-xs text-[#525252]">
                    <span className="font-mono tabular-nums">
                      {t.priorLabel}:{' '}
                      <bdi dir="ltr">
                        {priorVal} → {displayVal} {displayUnit}
                      </bdi>
                    </span>
                    <span
                      className={`font-medium ${
                        bio.trendDirection === 'improving'
                          ? 'text-[#15803d]'
                          : bio.trendDirection === 'worsening'
                            ? 'text-[#b91c1c]'
                            : 'text-[#737373]'
                      }`}
                    >
                      {bio.trendDeltaText}
                    </span>
                  </div>
                )}
              </div>

              {/* Plain-Language Explanation */}
              {exp && (
                <div className="mt-4 border-t border-neutral-900/8 pt-3">
                  {!elderMode && (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => toggleCard(bio.id)}
                      className="no-print mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#525252] transition-colors duration-150 hover:text-[#171717]"
                    >
                      <span>{isExpanded ? t.hideNote : t.showNote}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                      )}
                    </button>
                  )}

                  {isExpanded && (
                    <div className="space-y-2 text-sm leading-relaxed text-[#525252]">
                      <p>
                        <span className="font-medium text-[#171717]">{exp.whatItMeasures}</span>{' '}
                        {exp.whatYourLevelMeans}
                      </p>
                      {exp.practicalTip && (
                        <p className="border-s-2 border-[#0f766e]/40 ps-3 text-xs leading-relaxed text-[#525252] sm:text-sm">
                          {exp.practicalTip}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
