'use client';

import React, { useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type {
  EvaluatedBiomarker,
  SupportedLanguage,
  UnitSystem,
} from '@/lib/clinical/types';

interface LongitudinalTrendChartProps {
  biomarkers: EvaluatedBiomarker[];
  unitSystem: UnitSystem;
  language: SupportedLanguage;
}

export function LongitudinalTrendChart({
  biomarkers,
  unitSystem,
  language,
}: LongitudinalTrendChartProps) {
  const trendMarkers = useMemo(
    () =>
      biomarkers.filter(
        (b) => (b.historySI && b.historySI.length >= 2) || (b.historyUS && b.historyUS.length >= 2),
      ),
    [biomarkers],
  );

  const [selectedId, setSelectedId] = useState<string>('');

  if (trendMarkers.length === 0) return null;

  const activeMarker =
    trendMarkers.find((m) => m.canonicalId === selectedId) || trendMarkers[0];

  const points =
    unitSystem === 'SI'
      ? activeMarker.historySI || []
      : activeMarker.historyUS || [];

  if (points.length < 2) return null;

  const unit = unitSystem === 'SI' ? activeMarker.siUnit : activeMarker.usUnit;
  const targetRef =
    unitSystem === 'SI'
      ? activeMarker.refHighSI ?? activeMarker.refLowSI
      : activeMarker.refHighUS ?? activeMarker.refLowUS;
  const targetLabel =
    unitSystem === 'SI' ? activeMarker.refLabelSI : activeMarker.refLabelUS;

  const allValues = [
    ...points.map((p) => p.value),
    ...(targetRef !== undefined ? [targetRef] : []),
  ];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const pad = Math.max((maxVal - minVal) * 0.25, 0.5);
  const yMin = Math.max(0, minVal - pad);
  const yMax = maxVal + pad;

  const width = 640;
  const height = 220;
  const padL = 64;
  const padR = 32;
  const padT = 32;
  const padB = 38;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const xInset = 44;

  const xAt = (idx: number) =>
    points.length === 1
      ? padL + plotW / 2
      : padL + xInset + (idx / (points.length - 1)) * (plotW - xInset * 2);
  const yAt = (val: number) =>
    padT + plotH - ((val - yMin) / Math.max(yMax - yMin, 0.001)) * plotH;

  const coords = points.map((p, i) => ({
    ...p,
    x: xAt(i),
    y: yAt(p.value),
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  const firstVal = points[0].value;
  const lastVal = points[points.length - 1].value;
  const delta = Math.round((lastVal - firstVal) * 100) / 100;
  const isImproving = activeMarker.trendDirection === 'improving';

  return (
    <section
      aria-labelledby="longitudinal-trend-heading"
      className="editorial-sheet print-break-avoid rounded-2xl p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="longitudinal-trend-heading" className="font-editorial text-2xl font-medium text-[#18181B]">
            {language === 'ar'
              ? 'مسار المؤشرات عبر الزيارات السابقة (12 شهراً)'
              : 'Longitudinal Clinical Trajectory (12-Month Multi-Visit Trend)'}
          </h2>
          <p className="text-xs text-[#57534E]">
            {activeMarker.displayName} · Target: <strong className="text-[#0D5C56]">{targetLabel}</strong>
          </p>
        </div>

        {/* Metric Switcher Tabs */}
        <div className="no-print flex flex-wrap gap-1.5">
          {trendMarkers.map((m) => {
            const isSelected = m.canonicalId === activeMarker.canonicalId;
            return (
              <button
                key={m.canonicalId}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedId(m.canonicalId)}
                className={`min-h-[34px] rounded-xl px-3 text-xs font-bold transition ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m.displayName.split(' (')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trajectory Summary Pill */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700">
        <span>
          {points[0].date}: <strong className="tabular-nums">{firstVal} {unit}</strong> →{' '}
          {points[points.length - 1].date}:{' '}
          <strong className="tabular-nums text-slate-900">{lastVal} {unit}</strong>
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
            isImproving
              ? 'bg-emerald-100 text-emerald-900'
              : activeMarker.trendDirection === 'worsening'
                ? 'bg-rose-100 text-rose-900'
                : 'bg-slate-200 text-slate-800'
          }`}
        >
          {delta <= 0 ? (
            <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {delta > 0 ? `+${delta}` : `${delta}`} {unit} ({activeMarker.trendDeltaText || 'Tracked'})
        </span>
      </div>

      {/* Responsive SVG Chart (always LTR for chronological axes) */}
      <div className="mt-4 overflow-x-auto" dir="ltr">
        <svg
          role="img"
          aria-label={`Longitudinal trend chart for ${activeMarker.displayName} showing values from ${points[0].date} to ${points[points.length - 1].date}`}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full max-w-3xl"
        >
          <defs>
            <linearGradient id="shifaTrendGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0F766E" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0F766E" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal baseline grid */}
          {[0, 0.5, 1].map((frac) => {
            const y = padT + frac * plotH;
            const val = yMax - frac * (yMax - yMin);
            return (
              <g key={frac}>
                <line
                  x1={padL}
                  x2={width - padR}
                  y1={y}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
                <text
                  x={padL - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-semibold"
                >
                  {Math.round(val * 10) / 10}
                </text>
              </g>
            );
          })}

          {/* Dashed Emerald Target Threshold Line */}
          {targetRef !== undefined && (
            <g>
              <line
                x1={padL}
                x2={width - padR}
                y1={yAt(targetRef)}
                y2={yAt(targetRef)}
                stroke="#059669"
                strokeWidth="1.75"
                strokeDasharray="6 4"
              />
              <text
                x={width - padR}
                y={yAt(targetRef) - 6}
                textAnchor="end"
                className="fill-emerald-700 text-[10px] font-bold"
              >
                Target ({targetRef} {unit})
              </text>
            </g>
          )}

          {/* Area & Animated Trajectory Line */}
          <g key={`${activeMarker.canonicalId}-${unitSystem}`}>
            <path d={areaPath} fill="url(#shifaTrendGrad)" className="trend-area-fade" />
            <path
              d={linePath}
              pathLength={100}
              fill="none"
              stroke="#0F766E"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="trend-line-draw"
            />

            {/* Data Points & Labels */}
            {coords.map((pt, idx) => (
              <g
                key={pt.date}
                style={{ '--dot-index': idx } as React.CSSProperties}
                className="trend-dot-pop"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={idx === coords.length - 1 ? 7 : 5.5}
                  fill={idx === coords.length - 1 ? '#0F766E' : '#FFFFFF'}
                  stroke="#0F766E"
                  strokeWidth="3"
                />
                <text
                  x={pt.x}
                  y={pt.y - 12}
                  textAnchor="middle"
                  className="fill-slate-900 text-[12px] font-extrabold"
                >
                  {pt.value} {unit}
                </text>
                <text
                  x={pt.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-bold"
                >
                  {pt.date}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Semantic data table fallback for screen readers */}
      <table className="visually-hidden">
        <caption>{activeMarker.displayName} longitudinal values</caption>
        <thead>
          <tr>
            <th scope="col">Visit Date</th>
            <th scope="col">Value ({unit})</th>
          </tr>
        </thead>
        <tbody>
          {points.map((pt) => (
            <tr key={pt.date}>
              <td>{pt.date}</td>
              <td>{pt.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
