'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Minus,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { BIOMARKER_RULES, classifyStatus } from '@/lib/clinical/ranges';
import type {
  BiologicalSex,
  BiomarkerExplanation,
  BiomarkerStatus,
  EvaluatedBiomarker,
  OrganSystemSummary,
  SupportedLanguage,
  UnitSystem,
} from '@/lib/clinical/types';
import { UNIT_DEFINITIONS, roundClinical } from '@/lib/clinical/units';
import { UI_STRINGS } from '@/lib/i18n/uiStrings';

interface BiomarkerDashboardProps {
  biomarkers: EvaluatedBiomarker[];
  organSummaries: OrganSystemSummary[];
  explanations: Record<string, BiomarkerExplanation>;
  unitSystem: UnitSystem;
  language: SupportedLanguage;
  elderMode: boolean;
  patientAge: number;
  patientSex: BiologicalSex;
}

function statusColors(status: BiomarkerStatus) {
  switch (status) {
    case 'critical_high':
    case 'critical_low':
      return {
        pill: 'bg-rose-700 text-white',
        cardBorder: 'border-rose-400 bg-rose-50/40',
        pin: 'bg-rose-700 ring-rose-200',
        valueText: 'text-rose-800',
      };
    case 'high':
    case 'low':
      return {
        pill: 'bg-rose-100 text-rose-900 ring-1 ring-rose-200',
        cardBorder: 'border-rose-200 bg-white',
        pin: 'bg-rose-600 ring-rose-200',
        valueText: 'text-rose-700',
      };
    case 'borderline_high':
    case 'borderline_low':
      return {
        pill: 'bg-amber-100 text-amber-950 ring-1 ring-amber-200',
        cardBorder: 'border-amber-200 bg-white',
        pin: 'bg-amber-500 ring-amber-200',
        valueText: 'text-amber-800',
      };
    case 'normal':
      return {
        pill: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200',
        cardBorder: 'border-slate-200 bg-white',
        pin: 'bg-emerald-600 ring-emerald-200',
        valueText: 'text-emerald-800',
      };
    default:
      return {
        pill: 'bg-slate-100 text-slate-800',
        cardBorder: 'border-slate-200 bg-white',
        pin: 'bg-slate-600 ring-slate-200',
        valueText: 'text-slate-800',
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
  patientAge,
  patientSex,
}: BiomarkerDashboardProps) {
  const t = UI_STRINGS[language];
  const [filter, setFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [whatIfOpen, setWhatIfOpen] = useState<Record<string, boolean>>({});
  const [whatIfSiValues, setWhatIfSiValues] = useState<Record<string, number>>({});

  const filteredBiomarkers = useMemo(() => {
    if (filter === 'all') return biomarkers;
    if (filter === 'abnormal') {
      return biomarkers.filter((b) => b.status !== 'normal' && b.status !== 'unknown');
    }
    return biomarkers.filter((b) => b.organSystem === filter);
  }, [biomarkers, filter]);

  if (biomarkers.length === 0) return null;

  const abnormalCount = biomarkers.filter(
    (b) => b.status !== 'normal' && b.status !== 'unknown',
  ).length;

  const toggleCard = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section aria-labelledby="biomarkers-heading" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Activity className="h-5 w-5 text-teal-700" aria-hidden="true" />
          <h2 id="biomarkers-heading" className="text-lg font-extrabold text-slate-900 sm:text-xl">
            {t.biomarkersHeading}
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            {biomarkers.length}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="no-print flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`min-h-[36px] rounded-xl px-3 text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-teal-700 text-white'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.allFilter} ({biomarkers.length})
          </button>
          {abnormalCount > 0 && (
            <button
              type="button"
              aria-pressed={filter === 'abnormal'}
              onClick={() => setFilter('abnormal')}
              className={`min-h-[36px] rounded-xl px-3 text-xs font-bold transition ${
                filter === 'abnormal'
                  ? 'bg-rose-700 text-white'
                  : 'bg-rose-50 text-rose-800 ring-1 ring-rose-200 hover:bg-rose-100'
              }`}
            >
              {t.abnormalFilter} ({abnormalCount})
            </button>
          )}
          {organSummaries.map((org) => (
            <button
              key={org.organSystem}
              type="button"
              aria-pressed={filter === org.organSystem}
              onClick={() => setFilter(org.organSystem)}
              className={`min-h-[36px] rounded-xl px-3 text-xs font-bold transition ${
                filter === org.organSystem
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {org.organSystem} ({org.totalCount})
            </button>
          ))}
        </div>
      </div>

      {/* Biomarker Gauge Grid */}
      <div className={`grid gap-4 ${elderMode ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
        {filteredBiomarkers.map((bio, bioIdx) => {
          const rule = BIOMARKER_RULES[bio.canonicalId];
          const unitDef = UNIT_DEFINITIONS[bio.canonicalId];
          const bounds = rule ? rule.bounds(patientSex, patientAge) : undefined;
          const isSimActive = Boolean(whatIfOpen[bio.id] && bounds);
          const simSiVal = isSimActive ? (whatIfSiValues[bio.id] ?? bio.siValue) : bio.siValue;
          const factor = unitDef?.siToUsFactor ?? 1;
          const decSI = unitDef?.decimalsSI ?? 1;
          const decUS = unitDef?.decimalsUS ?? 1;

          const effectiveStatus: BiomarkerStatus =
            isSimActive && bounds ? classifyStatus(simSiVal, bounds) : bio.status;
          const effectiveGaugePct =
            isSimActive && bounds
              ? Math.max(
                  4,
                  Math.min(
                    96,
                    Math.round(
                      ((simSiVal - bounds.scaleMin) /
                        Math.max(bounds.scaleMax - bounds.scaleMin, 0.001)) *
                        100,
                    ),
                  ),
                )
              : bio.gaugePercent;

          const colors = statusColors(effectiveStatus);
          const exp = explanations[bio.canonicalId];
          const displayVal = isSimActive
            ? unitSystem === 'SI'
              ? roundClinical(simSiVal, decSI)
              : roundClinical(simSiVal * factor, decUS)
            : unitSystem === 'SI'
              ? bio.siValue
              : bio.usValue;
          const displayUnit = unitSystem === 'SI' ? bio.siUnit : bio.usUnit;
          const displayRef = unitSystem === 'SI' ? bio.refLabelSI : bio.refLabelUS;
          const priorVal = unitSystem === 'SI' ? bio.priorSiValue : bio.priorUsValue;
          const isExpanded = elderMode || expandedIds[bio.id] !== false;

          const sliderStep = bounds
            ? bounds.scaleMax - bounds.scaleMin <= 5
              ? 0.05
              : bounds.scaleMax - bounds.scaleMin <= 30
                ? 0.1
                : 1
            : 0.1;

          return (
            <article
              key={bio.id}
              style={{ '--stagger-index': bioIdx } as React.CSSProperties}
              className={`clinical-card-enter elder-card print-break-avoid rounded-2xl border p-5 shadow-xs transition ${colors.cardBorder}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {bio.organSystem}
                    </span>
                    {bio.loincCode && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                        LOINC {bio.loincCode}
                      </span>
                    )}
                    {bio.isCalculated && (
                      <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold text-teal-900">
                        CKD-EPI 2021 Auto-Calculated
                      </span>
                    )}
                    {isSimActive && (
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-900">
                        What-If Preview
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {exp?.plainTitle || bio.displayName}
                  </h3>
                  {exp?.plainTitle && exp.plainTitle !== bio.displayName && (
                    <p className="text-xs font-medium text-slate-500">{bio.displayName}</p>
                  )}
                  {bio.isCalculated && bio.calculationNote && (
                    <p className="text-[11px] font-semibold text-teal-800">{bio.calculationNote}</p>
                  )}
                </div>

                <div className="text-end">
                  <div
                    key={`${bio.id}-${unitSystem}`}
                    className={`unit-digit-roll elder-value text-2xl font-extrabold tabular-nums ${colors.valueText}`}
                  >
                    {displayVal}{' '}
                    <span className="text-xs font-bold text-slate-500">{displayUnit}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${colors.pill}`}
                    >
                      {t.statusLabels[effectiveStatus] || effectiveStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Continuous Color-Coded Range Gauge Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
                  <span>
                    {t.referenceLabel}: <strong className="text-slate-700">{displayRef}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {bio.wasUnitConverted && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                        <RefreshCw className="h-3 w-3" aria-hidden="true" />
                        {t.convertedFromLabel} {bio.originalValue} {bio.originalUnit}
                      </span>
                    )}
                    {bounds && (
                      <button
                        type="button"
                        aria-pressed={isSimActive}
                        onClick={() => {
                          setWhatIfOpen((prev) => ({ ...prev, [bio.id]: !prev[bio.id] }));
                          if (whatIfSiValues[bio.id] === undefined) {
                            setWhatIfSiValues((prev) => ({ ...prev, [bio.id]: bio.siValue }));
                          }
                        }}
                        className={`no-print inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold transition ${
                          isSimActive
                            ? 'bg-indigo-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-800'
                        }`}
                      >
                        <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
                        <span>{isSimActive ? 'Close What-If' : 'What-If'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="relative h-3 w-full overflow-visible rounded-full bg-gradient-to-r from-amber-200 via-emerald-300 via-55% to-rose-400"
                  dir="ltr"
                  aria-hidden="true"
                >
                  <div
                    className={`clinical-gauge-pin absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-4 transition-all duration-300 ${colors.pin}`}
                    style={{ left: `${effectiveGaugePct}%` }}
                  />
                </div>

                {/* Interactive What-If Biomarker Risk Simulator */}
                {isSimActive && bounds && (
                  <div className="no-print mt-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <label
                        htmlFor={`whatif-${bio.id}`}
                        className="font-extrabold text-indigo-950"
                      >
                        Drag to simulate target {bio.displayName.split(' (')[0]}:
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setWhatIfSiValues((prev) => ({ ...prev, [bio.id]: bio.siValue }))
                        }
                        className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-950"
                      >
                        <RotateCcw className="h-3 w-3" aria-hidden="true" />
                        <span>
                          Reset to lab ({unitSystem === 'SI' ? bio.siValue : bio.usValue}{' '}
                          {displayUnit})
                        </span>
                      </button>
                    </div>
                    <input
                      id={`whatif-${bio.id}`}
                      type="range"
                      min={bounds.scaleMin}
                      max={bounds.scaleMax}
                      step={sliderStep}
                      value={Math.max(bounds.scaleMin, Math.min(bounds.scaleMax, simSiVal))}
                      aria-valuetext={`${displayVal} ${displayUnit} (${t.statusLabels[effectiveStatus] || effectiveStatus})`}
                      style={
                        {
                          '--slider-progress': `${effectiveGaugePct}%`,
                        } as React.CSSProperties
                      }
                      onChange={(e) =>
                        setWhatIfSiValues((prev) => ({
                          ...prev,
                          [bio.id]: Number(e.target.value),
                        }))
                      }
                      className="clinical-whatif-slider mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Longitudinal 6-month Trend Pill */}
              {priorVal !== undefined && bio.trendDirection && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/70">
                  <span>
                    {t.priorLabel}: <strong className="tabular-nums">{priorVal} {displayUnit}</strong> →{' '}
                    <strong className="tabular-nums">{displayVal} {displayUnit}</strong>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                      bio.trendDirection === 'improving'
                        ? 'bg-emerald-100 text-emerald-900'
                        : bio.trendDirection === 'worsening'
                          ? 'bg-rose-100 text-rose-900'
                          : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {bio.trendDirection === 'improving' ? (
                      <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : bio.trendDirection === 'worsening' ? (
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {bio.trendDeltaText}
                  </span>
                </div>
              )}

              {/* Plain-Language Clinical Explanation */}
              {exp && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  {!elderMode && (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => toggleCard(bio.id)}
                      className="no-print mb-1.5 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
                    >
                      <span>{isExpanded ? 'Hide explanation' : 'Plain-language guide'}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                  )}

                  {isExpanded && (
                    <div className="space-y-1.5 text-sm leading-relaxed text-slate-700">
                      <p>
                        <strong className="text-slate-900">{exp.whatItMeasures}</strong>{' '}
                        {exp.whatYourLevelMeans}
                      </p>
                      {exp.practicalTip && (
                        <p className="rounded-xl bg-teal-50/70 px-3 py-2 text-xs font-semibold text-teal-900 sm:text-sm">
                          💡 {exp.practicalTip}
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
