'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  Award,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Copy,
  Download,
  FileJson,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  runClinicalValidationBenchmark,
  type BenchmarkSuiteSummary,
} from '@/lib/clinical/benchmark';
import { buildFhirR4Bundle } from '@/lib/clinical/fhir';
import type { VerifiedClinicalEvaluation } from '@/lib/clinical/types';

const KNOWN_LIMITATIONS_AND_MITIGATIONS = [
  {
    tag: 'OCR / INPUT',
    limitation: 'Blurred photos or handwritten prescriptions can be misread by vision models.',
    mitigation:
      'Every extracted brand passes through our 150-drug / 620-brand UAE fuzzy resolver, and all parsed numbers/brands remain visibly editable and reviewable.',
  },
  {
    tag: 'JCI IPSG.1',
    limitation: 'Households may accidentally upload lab PDFs from two different family members together.',
    mitigation:
      'Two-layer patient-identity guardrail checks names, MRNs, sexes, and >3-year age gaps—hard-blocking cross-patient trajectories and alerting the user.',
  },
  {
    tag: 'PEDIATRICS',
    limitation: 'Adult CKD-EPI 2021 eGFR equations are clinically invalid for children (< 18y).',
    mitigation:
      'CKD-EPI 2021 is deterministically suppressed under age 18; pediatric age-stratified Creatinine bounds apply and Bedside Schwartz height requirements are logged.',
  },
  {
    tag: 'HALLUCINATION',
    limitation: 'LLMs can invent lab numbers or downplay life-threatening panic values.',
    mitigation:
      'All 77 LOINC ranges, 40 RxList rules, and UAE 998 alerts run strictly in non-LLM TypeScript, verified afterward by our Fact-Preservation check (0 invented values).',
  },
  {
    tag: 'PRIVACY (PDPL)',
    limitation: 'Pasted clinic notes often contain Emirates IDs, phone numbers, MRNs, or full names.',
    mitigation:
      'Client-side UAE PDPL scrubber redacts Emirates IDs, phones, emails, MRNs, and name headers in the browser before any text leaves the device.',
  },
  {
    tag: 'CLINICAL SCOPE',
    limitation: 'AI tools must never diagnose medical conditions or alter prescribed therapy.',
    mitigation:
      'ShifaClear follows "Translation, not interpretation"—framing guidance as doctor-visit questions plus a 1-click English clinician handoff card.',
  },
];

interface ClinicalAuditDrawerProps {
  open: boolean;
  onClose: () => void;
  evaluation: VerifiedClinicalEvaluation | null;
}

type AuditTab = 'steps' | 'limitations' | 'fhir' | 'benchmark' | 'json';

export function ClinicalAuditDrawer({
  open,
  onClose,
  evaluation,
}: ClinicalAuditDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<AuditTab>('steps');
  const [copiedFhir, setCopiedFhir] = useState(false);
  const [benchmark, setBenchmark] = useState<BenchmarkSuiteSummary | null>(null);

  const fhirBundleJson = useMemo(() => {
    if (!evaluation) return '';
    return JSON.stringify(buildFhirR4Bundle(evaluation), null, 2);
  }, [evaluation]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      // If opened from Home with no report yet, jump straight to Live Validation Benchmark!
      if (!evaluation) {
        setActiveTab('benchmark');
      }
      setBenchmark(runClinicalValidationBenchmark());
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, evaluation]);

  // Progressive fallback for closedby="any" where native support is absent
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };
    dialog.addEventListener('close', handleClose);

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      const onDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) dialog.close();
      };
      dialog.addEventListener('pointerdown', onDown);
      dialog.addEventListener('pointerup', onUp);
      return () => {
        dialog.removeEventListener('close', handleClose);
        dialog.removeEventListener('pointerdown', onDown);
        dialog.removeEventListener('pointerup', onUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  const handleCopyFhir = async () => {
    try {
      await navigator.clipboard.writeText(fhirBundleJson);
      setCopiedFhir(true);
      setTimeout(() => setCopiedFhir(false), 2200);
    } catch {
      setCopiedFhir(false);
    }
  };

  const handleDownloadFhir = () => {
    const blob = new Blob([fhirBundleJson], { type: 'application/fhir+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shifaclear-malaffi-fhir-r4-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="audit-dialog-title"
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
    >
      <div className="flex max-h-[86dvh] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="audit-dialog-title" className="text-base font-extrabold text-slate-900 sm:text-lg">
                Clinical Audit, Validation Benchmark &amp; HL7 FHIR R4
              </h2>
              <p className="text-xs text-slate-600">
                Inspect MD rules, run 12 gold-standard clinical vignettes live, &amp; export Malaffi FHIR R4
              </p>
            </div>
          </div>

          <form method="dialog">
            <button
              type="submit"
              aria-label="Close Clinical Audit dialog"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
                {evaluation && (
                  <>
                    <button
                      type="button"
                      aria-pressed={activeTab === 'steps'}
                      onClick={() => setActiveTab('steps')}
                      className={`min-h-[34px] rounded-lg px-3 text-xs font-bold transition ${
                        activeTab === 'steps'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      Pipeline Steps
                    </button>
                    <button
                      type="button"
                      aria-pressed={activeTab === 'fhir'}
                      onClick={() => setActiveTab('fhir')}
                      className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                        activeTab === 'fhir'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>HL7 FHIR R4 (Malaffi)</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  aria-pressed={activeTab === 'limitations'}
                  onClick={() => setActiveTab('limitations')}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                    activeTab === 'limitations'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Limitations &amp; Mitigations</span>
                </button>
                <button
                  type="button"
                  aria-pressed={activeTab === 'benchmark'}
                  onClick={() => {
                    setBenchmark(runClinicalValidationBenchmark());
                    setActiveTab('benchmark');
                  }}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                    activeTab === 'benchmark'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Validation ({benchmark ? `${benchmark.passedCases}/${benchmark.totalCases}` : '12/12'})</span>
                </button>
                {evaluation && (
                  <button
                    type="button"
                    aria-pressed={activeTab === 'json'}
                    onClick={() => setActiveTab('json')}
                    className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                      activeTab === 'json'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Verified JSON</span>
                  </button>
                )}
              </div>

              {evaluation && (
                <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900 ring-1 ring-teal-200">
                  {evaluation.patientContext.sex}, {evaluation.patientContext.age}y • Risk: {evaluation.overallRisk.toUpperCase()}
                </span>
              )}
            </div>

            {activeTab === 'limitations' ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#DCE5E2] bg-[#F2F7F5] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0D5C56]">
                    Clinical Transparency — &ldquo;Translation, Not Interpretation&rdquo;
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700">
                    ShifaClear pairs every known AI and clinical workflow risk with an explicit, deterministic engineering mitigation. It explains lab reports and prepares questions for your doctor — it never diagnoses conditions or modifies prescriptions.
                  </p>
                </div>

                <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                  {KNOWN_LIMITATIONS_AND_MITIGATIONS.map((item) => (
                    <div
                      key={item.tag}
                      className="grid gap-3 bg-white p-4 sm:grid-cols-12 sm:items-start"
                    >
                      <div className="space-y-1 sm:col-span-5">
                        <span className="inline-block rounded bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-extrabold text-amber-950">
                          FLAGGED · {item.tag}
                        </span>
                        <p className="text-xs font-bold leading-relaxed text-slate-900">
                          {item.limitation}
                        </p>
                      </div>
                      <div className="sm:col-span-7 sm:border-s sm:border-slate-200 sm:ps-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                          → Deterministic Mitigation
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-700">
                          {item.mitigation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'benchmark' && benchmark ? (
              <div className="space-y-4">
                {/* KPI Scorecard */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Clinical Recall / Sensitivity
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-emerald-900 tabular-nums">
                      {benchmark.sensitivityPercent}%{' '}
                      <span className="text-xs font-bold">({benchmark.passedCases}/{benchmark.totalCases})</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                      False-Positive Rate (Control)
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-teal-900 tabular-nums">
                      {benchmark.falsePositiveRatePercent}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                      Deterministic Engine Latency
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-sky-900 tabular-nums">
                      {benchmark.totalLatencyMs} ms
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-600">
                    Executed live in browser against 12 internal self-authored clinical stress-test vignettes (RxList + CKD-EPI 2021 + Panic Values — not an external hospital dataset).
                  </p>
                  <button
                    type="button"
                    onClick={() => setBenchmark(runClinicalValidationBenchmark())}
                    className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-xl bg-teal-700 px-3 text-xs font-bold text-white hover:bg-teal-800"
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Re-Run Live</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-600">
                      <tr>
                        <th scope="col" className="px-3 py-2.5">ID</th>
                        <th scope="col" className="px-3 py-2.5">Clinical Vignette</th>
                        <th scope="col" className="px-3 py-2.5">Engine Output</th>
                        <th scope="col" className="px-3 py-2.5 text-end">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {benchmark.results.map((r) => (
                        <tr key={r.id} className="bg-white">
                          <td className="px-3 py-2 font-mono font-bold text-slate-500">{r.id}</td>
                          <td className="px-3 py-2 font-bold text-slate-900">{r.name}</td>
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-700">{r.actualOutcome}</td>
                          <td className="px-3 py-2 text-end">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                r.passed
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {r.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : !evaluation ? (
              <p className="text-sm text-slate-500">
                Run a scan or select a UAE clinical case to inspect the case-specific audit trail and HL7 FHIR R4 bundle.
              </p>
            ) : activeTab === 'fhir' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-200 bg-teal-50/70 p-3.5">
                  <p className="text-xs font-semibold text-teal-950">
                    Standards-compliant <strong>HL7 FHIR R4 Bundle</strong> with LOINC-coded{' '}
                    <code>Observation</code>, <code>DiagnosticReport</code>,{' '}
                    <code>MedicationStatement</code>, and <code>DetectedIssue</code> resources ready
                    for Abu Dhabi Malaffi HIE integration.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyFhir}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-teal-300 bg-white px-3 text-xs font-extrabold text-teal-900 hover:bg-teal-50"
                    >
                      {copiedFhir ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          <span>Copied FHIR</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Copy FHIR JSON</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadFhir}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-teal-700 px-3 text-xs font-extrabold text-white hover:bg-teal-800"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Download .fhir.json</span>
                    </button>
                  </div>
                </div>
                <pre className="max-h-[46dvh] overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-sky-300">
                  {fhirBundleJson}
                </pre>
              </div>
            ) : activeTab === 'json' ? (
              <pre className="max-h-[50dvh] overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-emerald-300">
                {JSON.stringify(evaluation, null, 2)}
              </pre>
            ) : (
              <div className="space-y-4">
                {evaluation.factCheck && (
                  <div
                    className={`rounded-2xl border p-4 ${
                      evaluation.factCheck.verified
                        ? 'border-emerald-200 bg-emerald-50/70'
                        : 'border-amber-300 bg-amber-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-extrabold ${
                          evaluation.factCheck.verified ? 'text-emerald-950' : 'text-amber-950'
                        }`}
                      >
                        {evaluation.factCheck.verified ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                        ) : (
                          <ShieldAlert className="h-4 w-4 text-amber-700" aria-hidden="true" />
                        )}
                        Post-Generation Fact-Preservation Audit
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white tabular-nums ${
                          evaluation.factCheck.verified ? 'bg-emerald-700' : 'bg-amber-700'
                        }`}
                      >
                        {evaluation.factCheck.verified
                          ? `${evaluation.factCheck.scorePercent}% Verified · 0 Invented`
                          : `FLAGGED (${evaluation.factCheck.scorePercent}%) · ${evaluation.factCheck.inventedNumbersCount} Invented`}
                      </span>
                    </div>
                    <p
                      className={`mt-1.5 text-xs ${
                        evaluation.factCheck.verified ? 'text-emerald-900' : 'text-amber-950'
                      }`}
                    >
                      {evaluation.factCheck.summary}
                    </p>
                  </div>
                )}

                <ol className="space-y-3">
                {evaluation.auditTrail.map((step) => {
                  const icon =
                    step.status === 'critical' ? (
                      <AlertOctagon className="h-5 w-5 text-rose-600" aria-hidden="true" />
                    ) : step.status === 'flagged' ? (
                      <ShieldAlert className="h-5 w-5 text-amber-600" aria-hidden="true" />
                    ) : step.status === 'converted' ? (
                      <RefreshCw className="h-5 w-5 text-sky-600" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    );

                  return (
                    <li
                      key={step.stepNumber}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <span className="mt-0.5 shrink-0">{icon}</span>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                            STEP {step.stepNumber} • {step.stage.toUpperCase()}
                          </span>
                          <h2 className="text-sm font-extrabold text-slate-900">{step.title}</h2>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700">{step.detail}</p>
                      </div>
                    </li>
                  );
                })}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
