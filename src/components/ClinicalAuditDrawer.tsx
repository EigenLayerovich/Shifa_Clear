'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
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
      <div className="flex max-h-[86dvh] w-full flex-col overflow-hidden rounded-2xl border border-neutral-900/10 bg-white shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-900/8 bg-[#fafafa] px-6 py-4">
          <div>
            <h1 id="audit-dialog-title" className="text-base font-medium text-[#171717]">
              Deterministic clinical audit trail
            </h1>
            <p className="mt-0.5 text-xs text-[#737373]">
              Every rule evaluated before patient explanation is generated
            </p>
          </div>

          <form method="dialog">
            <button
              type="submit"
              aria-label="Close Clinical Audit dialog"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-900/10 bg-white text-[#525252] transition-colors duration-150 hover:bg-[#f4f4f5] hover:text-[#171717]"
            >
              <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </form>
        </div>

        <div className="overflow-y-auto p-6">
          {!evaluation ? (
            <p className="text-sm text-[#737373]">
              Open a clinical case or scan a report to inspect the verification pipeline.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[#525252]">
                  <span>
                    Context: {evaluation.patientContext.sex}, {evaluation.patientContext.age}y ({evaluation.patientContext.unitSystem})
                  </span>
                  <span>·</span>
                  <span>Risk: {evaluation.overallRisk}</span>
                </div>

                <button
                  type="button"
                  aria-pressed={showRawJson}
                  onClick={() => setShowRawJson((v) => !v)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-900/10 bg-white px-3 text-xs font-medium text-[#171717] transition-colors duration-150 hover:bg-[#f4f4f5]"
                >
                  <Code2 className="h-4 w-4 text-[#737373]" strokeWidth={1.5} aria-hidden="true" />
                  <span>{showRawJson ? 'Pipeline steps' : 'Verified JSON'}</span>
                </button>
              </div>

              {showRawJson ? (
                <pre className="max-h-[50dvh] overflow-auto rounded-xl bg-[#171717] p-4 font-mono text-xs leading-relaxed text-[#e5e5e5]">
                  {JSON.stringify(evaluation, null, 2)}
                </pre>
              ) : (
                <ol className="divide-y divide-neutral-900/8 rounded-xl border border-neutral-900/8 bg-[#fafafa]">
                  {evaluation.auditTrail.map((step) => {
                    const icon =
                      step.status === 'critical' ? (
                        <AlertOctagon className="h-4 w-4 text-[#b91c1c]" strokeWidth={1.5} aria-hidden="true" />
                      ) : step.status === 'flagged' ? (
                        <ShieldAlert className="h-4 w-4 text-[#b45309]" strokeWidth={1.5} aria-hidden="true" />
                      ) : step.status === 'converted' ? (
                        <RefreshCw className="h-4 w-4 text-[#0f766e]" strokeWidth={1.5} aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-[#15803d]" strokeWidth={1.5} aria-hidden="true" />
                      );

                    return (
                      <li key={step.stepNumber} className="flex items-start gap-3 p-4">
                        <span className="mt-0.5 flex w-4 shrink-0 justify-center">{icon}</span>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-mono text-xs text-[#737373]">
                              0{step.stepNumber} · {step.stage}
                            </span>
                            <h2 className="text-sm font-medium text-[#171717]">{step.title}</h2>
                          </div>
                          <p className="text-xs leading-relaxed text-[#525252]">{step.detail}</p>
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
