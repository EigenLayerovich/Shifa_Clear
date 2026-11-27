'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Download,
  FileText,
  HeartPulse,
  Pill,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { UAE_DRUG_REGISTRY } from '@/lib/clinical/drugRegistry';
import type { BiologicalSex, RawMedication, SupportedLanguage } from '@/lib/clinical/types';
import { DEMO_CASES } from '@/lib/demo/cases';
import { UI_STRINGS } from '@/lib/i18n/uiStrings';

interface IntakePanelProps {
  language: SupportedLanguage;
  age: number;
  sex: BiologicalSex;
  onAgeChange: (age: number) => void;
  onSexChange: (sex: BiologicalSex) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onAnalyzeFiles: (files: File[]) => void;
  onAnalyzeText: (text: string) => void;
  onSelectDemoCase: (caseId: string) => void;
  onQuickDrugCheck: (meds: RawMedication[], creatinineUmol?: number) => void;
}

interface SelectedQuickMed {
  brandName: string;
  genericName: string;
  drugClass: string;
}

export function IntakePanel({
  language,
  age,
  sex,
  onAgeChange,
  onSexChange,
  isLoading,
  errorMessage,
  onAnalyzeFiles,
  onAnalyzeText,
  onSelectDemoCase,
  onQuickDrugCheck,
}: IntakePanelProps) {
  const t = UI_STRINGS[language];
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'drugs'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Drug Checker state
  const [drugQuery, setDrugQuery] = useState('');
  const [selectedMeds, setSelectedMeds] = useState<SelectedQuickMed[]>([]);
  const [optionalCreatinine, setOptionalCreatinine] = useState('');

  const matchingDrugs = useMemo(() => {
    const q = drugQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{ brandDisplay: string; genericName: string; drugClass: string; matchedAlias: string }> = [];
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
          matchedAlias: aliasHit || drug.genericName,
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

  const applyPreset = (meds: SelectedQuickMed[], crUmol = '') => {
    setSelectedMeds(meds);
    setOptionalCreatinine(crUmol);
  };

  const handleFilesAdded = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList);
    setQueuedFiles((prev) => {
      const merged = [...prev];
      for (const f of incoming) {
        if (merged.length >= 6) break;
        if (!merged.some((existing) => existing.name === f.name && existing.size === f.size)) {
          merged.push(f);
        }
      }
      return merged;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="rounded-3xl border border-teal-900/10 bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-800 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-teal-50 ring-1 ring-white/20">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>KUEC Sandbox Hackathon • Health &amp; Wellbeing • MD + BME PhD Clinical Safety Engine</span>
            </div>
            <h1
              id="main-heading"
              tabIndex={-1}
              className="text-2xl font-extrabold tracking-tight sm:text-4xl"
            >
              {t.tagline}
            </h1>
            <p className="text-sm leading-relaxed text-teal-100 sm:text-base">
              {t.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              141 Drugs / 600+ UAE Brands
            </span>
            <span className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              CKD-EPI 2021 + UAE 998
            </span>
            <span className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              5 UAE Languages + Voice
            </span>
          </div>
        </div>
      </section>

      {/* Error alert if any */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 shadow-xs"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
          <div>
            <p className="font-bold">Analysis Notice</p>
            <p className="mt-0.5 text-rose-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Loading progress indicator */}
      {isLoading && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-teal-900">{t.analyzingBtn}</p>
            <span className="text-xs font-semibold text-teal-700">
              Gemini 3.8 Flash → Deterministic MD Engine
            </span>
          </div>
          <progress
            aria-label={t.analyzingBtn}
            className="mt-3 h-2 w-full overflow-hidden rounded-full accent-teal-700"
          />
        </div>
      )}

      {/* Main Intake Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {/* Patient Context Row */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-teal-700" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-800">{t.patientContextTitle}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="patient-age" className="text-xs font-bold text-slate-600">
                {t.ageLabel}
              </label>
              <input
                id="patient-age"
                type="number"
                min={1}
                max={115}
                value={age}
                onChange={(e) => onAgeChange(Math.max(1, Math.min(115, Number(e.target.value) || 45)))}
                className="min-h-[40px] w-20 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">{t.sexLabel}</span>
              <div className="inline-flex rounded-xl border border-slate-300 bg-white p-0.5 text-xs font-bold">
                <button
                  type="button"
                  aria-pressed={sex === 'male'}
                  onClick={() => onSexChange('male')}
                  className={`min-h-[36px] rounded-lg px-3 transition ${
                    sex === 'male' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.male}
                </button>
                <button
                  type="button"
                  aria-pressed={sex === 'female'}
                  onClick={() => onSexChange('female')}
                  className={`min-h-[36px] rounded-lg px-3 transition ${
                    sex === 'female' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.female}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Intake Mode Tabs */}
        <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            aria-pressed={activeTab === 'upload'}
            onClick={() => setActiveTab('upload')}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === 'upload'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            <span>{t.uploadTab}</span>
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'paste'}
            onClick={() => setActiveTab('paste')}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === 'paste'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>{t.pasteTab}</span>
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'drugs'}
            onClick={() => setActiveTab('drugs')}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === 'drugs'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Pill className="h-4 w-4" aria-hidden="true" />
            <span>Quick Drug Checker (600+ Brands)</span>
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesAdded(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
                isDragging
                  ? 'border-teal-600 bg-teal-50/70'
                  : 'border-slate-300 bg-slate-50/50 hover:border-teal-500/70'
              }`}
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-800">
                <UploadCloud className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="text-base font-bold text-slate-900">{t.dropzoneTitle}</p>
              <p className="mt-1 max-w-xl text-xs text-slate-600 sm:text-sm">
                Upload <strong>1 to 6 files together</strong> (e.g., Hematology PDF + Biochemistry PDF + Prescription photo) — merged into one verified report.
              </p>

              <input
                ref={fileInputRef}
                id="clinical-file-upload"
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="visually-hidden"
                onChange={(e) => handleFilesAdded(e.target.files)}
                disabled={isLoading}
              />

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  <span>{queuedFiles.length > 0 ? 'Add More Files / Photos' : t.chooseFileBtn}</span>
                </button>

                <a
                  href="/samples/abu-dhabi-sample-lab-report.pdf"
                  download="abu-dhabi-sample-lab-report.pdf"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-xs font-bold text-teal-900 shadow-xs transition hover:bg-teal-50"
                >
                  <Download className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  <span>Download Sample UAE Lab PDF</span>
                </a>
              </div>
            </div>

            {queuedFiles.length > 0 && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-extrabold text-teal-950">
                    Ready to Analyze Together ({queuedFiles.length} {queuedFiles.length === 1 ? 'document' : 'documents'})
                  </p>
                  <button
                    type="button"
                    onClick={() => setQueuedFiles([])}
                    className="text-xs font-bold text-slate-500 hover:text-rose-700"
                  >
                    Clear all
                  </button>
                </div>

                <ul className="flex flex-wrap gap-2">
                  {queuedFiles.map((file, idx) => (
                    <li
                      key={`${file.name}-${file.size}-${idx}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-xs ring-1 ring-teal-200"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden="true" />
                      <span className="max-w-[200px] truncate">{file.name}</span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {Math.max(1, Math.round(file.size / 1024))} KB
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() =>
                          setQueuedFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => onAnalyzeFiles(queuedFiles)}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {t.analyzeBtn} ({queuedFiles.length} {queuedFiles.length === 1 ? 'File' : 'Files'})
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'paste' ? (
          <div className="space-y-4">
            <label htmlFor="clinical-paste-box" className="block text-sm font-bold text-slate-800">
              {t.pasteTab}
            </label>
            <textarea
              id="clinical-paste-box"
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={t.pastePlaceholder}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setPastedText(
                    'SEHA Lab Result: HbA1c 7.6%, Fasting Glucose 156 mg/dL, LDL 4.1 mmol/L, Potassium 5.8 mmol/L, Creatinine 148 umol/L, eGFR 44 mL/min. Medications: Cozaar 50mg OD, Lasix 40mg OD, Voltaren 50mg BD, Glucophage 1000mg BD.',
                  )
                }
                className="text-xs font-bold text-teal-700 underline decoration-teal-300 underline-offset-4 hover:text-teal-900"
              >
                Insert realistic mixed UAE lab + Rx snippet
              </button>
              <button
                type="button"
                disabled={isLoading || pastedText.trim().length < 5}
                onClick={() => onAnalyzeText(pastedText)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>{t.analyzeBtn}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Quick Drug Interaction Sandbox */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Instant Deterministic Drug-Interaction &amp; CKD-EPI Checker
                </h3>
                <p className="text-xs text-slate-600">
                  Search 141 outpatient generics (600+ UAE/Gulf pharmacy brands) — runs 25+ RxList safety rules in &lt; 10ms.
                </p>
              </div>
            </div>

            {/* 1-Click Judge Challenge Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Try Live Combos:
              </span>
              <button
                type="button"
                onClick={() =>
                  applyPreset([
                    { brandName: 'Imdur', genericName: 'Isosorbide Mononitrate', drugClass: 'nitrate' },
                    { brandName: 'Cialis', genericName: 'Tadalafil', drugClass: 'pde5 inhibitor' },
                  ])
                }
                className="min-h-[34px] rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-900 ring-1 ring-rose-200 hover:bg-rose-100"
              >
                Imdur + Cialis (998!)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset([
                    { brandName: 'Plavix', genericName: 'Clopidogrel', drugClass: 'antiplatelet' },
                    { brandName: 'Losec', genericName: 'Omeprazole', drugClass: 'ppi cyp2c19' },
                  ])
                }
                className="min-h-[34px] rounded-xl bg-amber-50 px-3 text-xs font-bold text-amber-950 ring-1 ring-amber-200 hover:bg-amber-100"
              >
                Plavix + Losec (CYP2C19)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset([
                    { brandName: 'Klacid', genericName: 'Clarithromycin', drugClass: 'macrolide' },
                    { brandName: 'Colchicine', genericName: 'Colchicine', drugClass: 'colchicine' },
                  ])
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
                  )
                }
                className="min-h-[34px] rounded-xl bg-teal-50 px-3 text-xs font-bold text-teal-900 ring-1 ring-teal-200 hover:bg-teal-100"
              >
                Glucophage + Cr 240 (CKD-EPI Auto-eGFR)
              </button>
            </div>

            {/* Autocomplete Search Input + Optional Creatinine */}
            <div className="grid gap-3 sm:grid-cols-12">
              <div className="relative sm:col-span-8">
                <label htmlFor="quick-drug-search" className="visually-hidden">
                  Search UAE pharmacy brand or generic medication
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="quick-drug-search"
                    type="text"
                    value={drugQuery}
                    onChange={(e) => setDrugQuery(e.target.value)}
                    placeholder="Type any UAE brand or generic (e.g., Plavix, Lipitor, Flagyl, Ciprobay, Cipralex, Tramal)..."
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-slate-50/60 ps-10 pe-4 text-sm text-slate-900 focus:border-teal-600 focus:bg-white"
                  />
                </div>

                {matchingDrugs.length > 0 && (
                  <ul className="mt-1.5 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
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
                <label htmlFor="quick-creatinine" className="block text-[11px] font-bold text-slate-600 mb-1">
                  Optional Creatinine (µmol/L) for CKD-EPI eGFR
                </label>
                <input
                  id="quick-creatinine"
                  type="number"
                  min={20}
                  max={1500}
                  value={optionalCreatinine}
                  onChange={(e) => setOptionalCreatinine(e.target.value)}
                  placeholder="e.g. 240 (optional)"
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
                      className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              {selectedMeds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMeds([]);
                    setOptionalCreatinine('');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Clear list
                </button>
              )}
              <button
                type="button"
                disabled={selectedMeds.length === 0 && !optionalCreatinine}
                onClick={() => {
                  const crVal = Number(optionalCreatinine);
                  onQuickDrugCheck(
                    selectedMeds.map((m) => ({
                      brandName: m.brandName,
                      genericName: m.genericName,
                      dose: 'Standard dose',
                      frequency: 'OD',
                    })),
                    !Number.isNaN(crVal) && crVal > 0 ? crVal : undefined,
                  );
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>Check Safety (&lt; 10ms)</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3 UAE Flagship Clinical Cases */}
      <section aria-labelledby="demo-cases-heading" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="demo-cases-heading" className="text-lg font-extrabold text-slate-900 sm:text-xl">
              {t.demoCasesHeading}
            </h2>
            <p className="text-xs text-slate-600 sm:text-sm">{t.demoCasesSub}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {DEMO_CASES.map((demo) => {
            const accentStyles =
              demo.accent === 'crimson'
                ? {
                    border: 'border-rose-200 hover:border-rose-400',
                    badge: 'bg-rose-100 text-rose-900',
                    iconBg: 'bg-rose-50 text-rose-700',
                    btn: 'bg-rose-700 hover:bg-rose-800 text-white',
                    Icon: AlertTriangle,
                  }
                : demo.accent === 'amber'
                  ? {
                      border: 'border-amber-200 hover:border-amber-400',
                      badge: 'bg-amber-100 text-amber-950',
                      iconBg: 'bg-amber-50 text-amber-700',
                      btn: 'bg-amber-700 hover:bg-amber-800 text-white',
                      Icon: Pill,
                    }
                  : {
                      border: 'border-teal-200 hover:border-teal-400',
                      badge: 'bg-teal-100 text-teal-900',
                      iconBg: 'bg-teal-50 text-teal-700',
                      btn: 'bg-teal-700 hover:bg-teal-800 text-white',
                      Icon: HeartPulse,
                    };

            const CaseIcon = accentStyles.Icon;

            return (
              <article
                key={demo.id}
                className={`flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-md ${accentStyles.border}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${accentStyles.badge}`}
                    >
                      {demo.badge}
                    </span>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentStyles.iconBg}`}
                    >
                      <CaseIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{demo.title}</h3>
                    <p className="mt-1 text-xs font-medium text-slate-500">{demo.subtitle}</p>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {demo.highlights.map((hl, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onSelectDemoCase(demo.id)}
                  className={`mt-5 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-xs transition disabled:opacity-50 ${accentStyles.btn}`}
                >
                  <span>{t.openCaseBtn}</span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
