'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Camera, Loader2, Pill, Plus, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { UAE_DRUG_REGISTRY } from '@/lib/clinical/drugRegistry';
import { evaluateMedications } from '@/lib/clinical/medications';
import type { BiologicalSex, RawMedication } from '@/lib/clinical/types';

interface SelectedQuickMed {
  brandName: string;
  genericName: string;
  drugClass: string;
}

interface QuickDrugCheckerModalProps {
  open: boolean;
  onClose: () => void;
  defaultAge: number;
  defaultSex: BiologicalSex;
  sessionApiKey?: string;
  onSubmitCheck: (
    meds: RawMedication[],
    creatinineUmol?: number,
    overrideAge?: number,
    overrideSex?: BiologicalSex,
  ) => void;
}

export function QuickDrugCheckerModal({
  open,
  onClose,
  defaultAge,
  defaultSex,
  sessionApiKey,
  onSubmitCheck,
}: QuickDrugCheckerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const boxInputRef = useRef<HTMLInputElement>(null);
  const [drugQuery, setDrugQuery] = useState('');
  const [selectedMeds, setSelectedMeds] = useState<SelectedQuickMed[]>([]);
  const [optionalCreatinine, setOptionalCreatinine] = useState('');
  const [checkAge, setCheckAge] = useState(defaultAge);
  const [checkSex, setCheckSex] = useState<BiologicalSex>(defaultSex);
  const [isScanningBox, setIsScanningBox] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setCheckAge(defaultAge);
      setCheckSex(defaultSex);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, defaultAge, defaultSex]);

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

  const matchingDrugs = useMemo(() => {
    const q = drugQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{ brandDisplay: string; genericName: string; drugClass: string }> = [];
    for (const drug of UAE_DRUG_REGISTRY) {
      const aliasHit = drug.aliases.find((a) => a.toLowerCase().includes(q));
      const genericHit = drug.genericName.toLowerCase().includes(q);
      if (aliasHit || genericHit) {
        const display = aliasHit
          ? aliasHit.charAt(0).toUpperCase() + aliasHit.slice(1)
          : drug.aliases[0].charAt(0).toUpperCase() + drug.aliases[0].slice(1);
        results.push({
          brandDisplay: display,
          genericName: drug.genericName,
          drugClass: drug.drugClass.replace(/_/g, ' '),
        });
      }
      if (results.length >= 8) break;
    }
    return results;
  }, [drugQuery]);

  const addQuickMed = (med: SelectedQuickMed) => {
    if (selectedMeds.some((m) => m.genericName === med.genericName && m.brandName === med.brandName)) {
      return;
    }
    setSelectedMeds((prev) => [...prev, med]);
    setDrugQuery('');
  };

  const applyPreset = (meds: SelectedQuickMed[], crUmol = '', presetAge?: number) => {
    setSelectedMeds(meds);
    setOptionalCreatinine(crUmol);
    setScanStatus(null);
    if (presetAge !== undefined) setCheckAge(presetAge);
  };

  // Live instant <1ms interaction preview inside the modal as drugs are picked or scanned
  const livePreviewAlerts = useMemo(() => {
    if (selectedMeds.length === 0) return [];
    const { alerts } = evaluateMedications(
      selectedMeds.map((m) => ({
        brandName: m.brandName,
        genericName: m.genericName,
        dose: 'Standard dose',
        frequency: 'OD',
      })),
      [],
      checkAge,
    );
    return alerts;
  }, [selectedMeds, checkAge]);

  const handleBoxPhotoSelected = async (file?: File) => {
    if (!file) return;
    setIsScanningBox(true);
    setScanStatus(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const headers: Record<string, string> = {};
      if (sessionApiKey?.trim()) headers['x-gemini-api-key'] = sessionApiKey.trim();

      const res = await fetch('/api/scan-med', {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not scan medication box.');

      const found = (data.medications || []) as Array<{
        brandName: string;
        genericName: string;
        drugClass: string;
      }>;
      if (found.length === 0) {
        setScanStatus('No readable medication name found on photo — try a clearer front label.');
      } else {
        setSelectedMeds((prev) => {
          const next = [...prev];
          for (const item of found) {
            if (!next.some((x) => x.genericName === item.genericName && x.brandName === item.brandName)) {
              next.push({
                brandName: item.brandName,
                genericName: item.genericName,
                drugClass: item.drugClass,
              });
            }
          }
          return next;
        });
        setScanStatus(
          `Scanned from box: ${found.map((f) => `${f.brandName} (${f.genericName})`).join(', ')}`,
        );
      }
    } catch (err) {
      setScanStatus(err instanceof Error ? err.message : 'Box scan failed.');
    } finally {
      setIsScanningBox(false);
      if (boxInputRef.current) boxInputRef.current.value = '';
    }
  };

  const handleRun = () => {
    const crVal = Number(optionalCreatinine);
    onSubmitCheck(
      selectedMeds.map((m) => ({
        brandName: m.brandName,
        genericName: m.genericName,
        dose: 'Standard dose',
        frequency: 'OD',
      })),
      !Number.isNaN(crVal) && crVal > 0 ? crVal : undefined,
      checkAge,
      checkSex,
    );
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="drug-checker-dialog-title"
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
    >
      <div className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
              <Pill className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="drug-checker-dialog-title" className="text-base font-extrabold text-slate-900 sm:text-lg">
                Quick Drug Interaction &amp; CKD-EPI Checker
              </h2>
              <p className="text-xs text-slate-600">
                150 drug profiles • 620+ UAE/Gulf brands • 40 RxList, pediatric &amp; cross-domain rules (&lt; 10ms)
              </p>
            </div>
          </div>

          <form method="dialog">
            <button
              type="submit"
              aria-label="Close Quick Drug Checker dialog"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* Body */}
        <div className="space-y-5 overflow-y-auto p-6">
          {/* Compact Independent Patient Age/Sex Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <span className="text-xs font-bold text-slate-700">
              Patient Profile for This Check
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="modal-drug-age" className="text-xs font-bold text-slate-600">
                  Age
                </label>
                <input
                  id="modal-drug-age"
                  type="number"
                  min={0}
                  max={115}
                  value={checkAge}
                  onChange={(e) => setCheckAge(Math.max(0, Math.min(115, Number(e.target.value) || 0)))}
                  className="min-h-[36px] w-20 rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-900"
                />
              </div>
              <div className="inline-flex rounded-xl border border-slate-300 bg-white p-0.5 text-xs font-bold">
                <button
                  type="button"
                  aria-pressed={checkSex === 'male'}
                  onClick={() => setCheckSex('male')}
                  className={`min-h-[32px] rounded-lg px-2.5 transition ${
                    checkSex === 'male' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  aria-pressed={checkSex === 'female'}
                  onClick={() => setCheckSex('female')}
                  className={`min-h-[32px] rounded-lg px-2.5 transition ${
                    checkSex === 'female' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>
          </div>

          {/* 1-Click Live Challenge Presets */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Try Live Clinical Combos:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    [
                      { brandName: 'Imdur', genericName: 'Isosorbide Mononitrate', drugClass: 'nitrate' },
                      { brandName: 'Cialis', genericName: 'Tadalafil', drugClass: 'pde5 inhibitor' },
                    ],
                    '',
                    54,
                  )
                }
                className="min-h-[34px] rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-900 ring-1 ring-rose-200 hover:bg-rose-100"
              >
                Imdur + Cialis (998!)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    [
                      { brandName: 'Plavix', genericName: 'Clopidogrel', drugClass: 'antiplatelet' },
                      { brandName: 'Losec', genericName: 'Omeprazole', drugClass: 'ppi cyp2c19' },
                    ],
                    '',
                    54,
                  )
                }
                className="min-h-[34px] rounded-xl bg-amber-50 px-3 text-xs font-bold text-amber-950 ring-1 ring-amber-200 hover:bg-amber-100"
              >
                Plavix + Losec (CYP2C19)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    [
                      { brandName: 'Klacid', genericName: 'Clarithromycin', drugClass: 'macrolide' },
                      { brandName: 'Colchicine', genericName: 'Colchicine', drugClass: 'colchicine' },
                    ],
                    '',
                    54,
                  )
                }
                className="min-h-[34px] rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-900 ring-1 ring-rose-200 hover:bg-rose-100"
              >
                Klacid + Colchicine
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    [{ brandName: 'Glucophage', genericName: 'Metformin', drugClass: 'biguanide' }],
                    '240',
                    66,
                  )
                }
                className="min-h-[34px] rounded-xl bg-teal-50 px-3 text-xs font-bold text-teal-900 ring-1 ring-teal-200 hover:bg-teal-100"
              >
                Glucophage + Cr 240 (CKD-EPI)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    [{ brandName: 'Aspirin', genericName: 'Aspirin (Low-Dose)', drugClass: 'antiplatelet' }],
                    '',
                    5,
                  )
                }
                className="min-h-[34px] rounded-xl bg-purple-50 px-3 text-xs font-bold text-purple-900 ring-1 ring-purple-200 hover:bg-purple-100"
              >
                Aspirin in 5y Child (Reye&apos;s!)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    [
                      { brandName: 'Euthyrox', genericName: 'Levothyroxine', drugClass: 'thyroid hormone' },
                      { brandName: 'Caltrate', genericName: 'Calcium + Vitamin D3', drugClass: 'calcium supplement' },
                    ],
                    '',
                    45,
                  )
                }
                className="min-h-[34px] rounded-xl bg-sky-50 px-3 text-xs font-bold text-sky-900 ring-1 ring-sky-200 hover:bg-sky-100"
              >
                Euthyrox + Caltrate (4h Split)
              </button>
            </div>
          </div>

          {/* Pharmacy Box / Label Camera Scanner Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-teal-300 bg-teal-50/40 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                <Camera className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-teal-950">
                  Pharmacy Box / Label Camera Scanner
                </p>
                <p className="text-[11px] text-slate-600">
                  Snap any UAE medicine box (Panadol, Glucophage, Concor, Co-Diovan) to auto-detect generic &amp; risks
                </p>
              </div>
            </div>

            <input
              ref={boxInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="visually-hidden"
              onChange={(e) => handleBoxPhotoSelected(e.target.files?.[0])}
              disabled={isScanningBox}
            />
            <button
              type="button"
              disabled={isScanningBox}
              onClick={() => boxInputRef.current?.click()}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-teal-700 px-3.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-teal-800 disabled:opacity-60"
            >
              {isScanningBox ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Scanning box...</span>
                </>
              ) : (
                <>
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Scan Box Photo</span>
                </>
              )}
            </button>

            {scanStatus && (
              <p className="w-full rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-teal-900 ring-1 ring-teal-200">
                <Sparkles className="me-1.5 inline h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                {scanStatus}
              </p>
            )}
          </div>

          {/* Aligned Inputs */}
          <div className="grid items-start gap-3 sm:grid-cols-12">
            <div className="relative sm:col-span-8">
              <label htmlFor="modal-drug-search" className="mb-1 block text-[11px] font-bold text-slate-600">
                Search UAE Brand or Generic Medication
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="modal-drug-search"
                  type="text"
                  value={drugQuery}
                  onChange={(e) => setDrugQuery(e.target.value)}
                  placeholder="Type Plavix, Lipitor, Flagyl, Ciprobay, Cipralex, Tramal..."
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-slate-50/60 ps-10 pe-4 text-sm text-slate-900 focus:border-teal-600 focus:bg-white"
                />
              </div>

              {matchingDrugs.length > 0 && (
                <ul className="mt-1.5 max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  {matchingDrugs.map((item) => (
                    <li key={`${item.brandDisplay}-${item.genericName}`}>
                      <button
                        type="button"
                        onClick={() =>
                          addQuickMed({
                            brandName: item.brandDisplay,
                            genericName: item.genericName,
                            drugClass: item.drugClass,
                          })
                        }
                        className="flex min-h-[40px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-start text-xs hover:bg-teal-50"
                      >
                        <span>
                          <strong className="text-slate-900">{item.brandDisplay}</strong>{' '}
                          <span className="text-teal-800">({item.genericName})</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          <Plus className="h-3 w-3" aria-hidden="true" />
                          {item.drugClass}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="modal-creatinine" className="mb-1 block text-[11px] font-bold text-slate-600">
                Optional Creatinine (µmol/L)
              </label>
              <input
                id="modal-creatinine"
                type="number"
                min={20}
                max={1500}
                value={optionalCreatinine}
                onChange={(e) => setOptionalCreatinine(e.target.value)}
                placeholder="e.g. 240"
                className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 text-sm font-semibold text-slate-900 focus:border-teal-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Selected Medication Pills */}
          {selectedMeds.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
              {selectedMeds.map((m) => (
                <span
                  key={`${m.brandName}-${m.genericName}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-xs ring-1 ring-teal-200"
                >
                  <span>
                    {m.brandName} <span className="text-teal-700">({m.genericName})</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${m.brandName}`}
                    onClick={() =>
                      setSelectedMeds((prev) =>
                        prev.filter((x) => !(x.brandName === m.brandName && x.genericName === m.genericName)),
                      )
                    }
                    className="inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Live Instant Interaction Arc Preview (runs in <1ms before clicking Check Safety) */}
          {livePreviewAlerts.length > 0 && (
            <div
              dir="ltr"
              className="space-y-2.5 rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-950">
                  <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden="true" />
                  Instant Interaction Detected ({livePreviewAlerts.length})
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase text-rose-700 ring-1 ring-rose-200">
                  {livePreviewAlerts[0].severity} • {livePreviewAlerts[0].ruleId}
                </span>
              </div>

              {livePreviewAlerts[0].involvedItems.length >= 2 && (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-white/90 px-3 py-2.5">
                  <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-extrabold text-white">
                    {livePreviewAlerts[0].involvedItems[0].split(' (')[0]}
                  </span>
                  <div className="flex flex-1 flex-col items-center">
                    <svg viewBox="0 0 140 28" className="h-7 w-full max-w-[160px] overflow-visible" aria-hidden="true">
                      <path
                        key={livePreviewAlerts[0].ruleId}
                        d="M 6 24 Q 70 -4 134 24"
                        pathLength={100}
                        fill="none"
                        stroke={
                          livePreviewAlerts[0].severity === 'critical'
                            ? '#BE123C'
                            : livePreviewAlerts[0].category === 'timing_conflict'
                              ? '#0284C7'
                              : '#D97706'
                        }
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="interaction-arc-draw"
                      />
                    </svg>
                    <span className="-mt-1 text-[10px] font-extrabold text-rose-700">
                      {livePreviewAlerts[0].category === 'timing_conflict' ? '4h Separation Needed' : 'Warning Link'}
                    </span>
                  </div>
                  <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-extrabold text-white">
                    {livePreviewAlerts[0].involvedItems.slice(1).map((x) => x.split(' (')[0]).join(' + ')}
                  </span>
                </div>
              )}

              {livePreviewAlerts[0].category === 'timing_conflict' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-700">
                    <span>07:00 AM</span>
                    <span className="text-emerald-800">4-Hour Safe Window</span>
                    <span>11:00 AM / Lunch</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white p-0.5">
                    <div className="separation-bar-expand h-full w-full rounded-full bg-gradient-to-r from-teal-600 via-emerald-400 to-sky-600" />
                  </div>
                </div>
              )}

              <p className="text-xs font-semibold text-slate-800">{livePreviewAlerts[0].title}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setSelectedMeds([]);
                setOptionalCreatinine('');
                setDrugQuery('');
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Clear list
            </button>
            <button
              type="button"
              disabled={selectedMeds.length === 0 && !optionalCreatinine}
              onClick={handleRun}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Check Safety (&lt; 10ms)</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
