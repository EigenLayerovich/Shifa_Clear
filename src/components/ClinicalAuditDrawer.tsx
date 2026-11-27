'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { VerifiedClinicalEvaluation } from '@/lib/clinical/types';

interface ClinicalAuditDrawerProps {
  open: boolean;
  onClose: () => void;
  evaluation: VerifiedClinicalEvaluation | null;
}

export function ClinicalAuditDrawer({
  open,
  onClose,
  evaluation,
}: ClinicalAuditDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

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
              <h1 id="audit-dialog-title" className="text-base font-extrabold text-slate-900 sm:text-lg">
                Deterministic Clinical Safety Audit Trail
              </h1>
              <p className="text-xs text-slate-600">
                Inspect every MD rule fired before patient explanation — zero black-box diagnosis
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
          {!evaluation ? (
            <p className="text-sm text-slate-500">Run a scan or select a UAE clinical case to inspect the audit trail.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-teal-900 ring-1 ring-teal-200">
                    Context: {evaluation.patientContext.sex}, {evaluation.patientContext.age}y ({evaluation.patientContext.unitSystem})
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-800">
                    Overall Risk: {evaluation.overallRisk.toUpperCase()}
                  </span>
                </div>

                <button
                  type="button"
                  aria-pressed={showRawJson}
                  onClick={() => setShowRawJson((v) => !v)}
                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Code2 className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                  <span>{showRawJson ? 'Show Pipeline Steps' : 'Inspect Verified JSON'}</span>
                </button>
              </div>

              {showRawJson ? (
                <pre className="max-h-[50dvh] overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-emerald-300">
                  {JSON.stringify(evaluation, null, 2)}
                </pre>
              ) : (
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
              )}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
