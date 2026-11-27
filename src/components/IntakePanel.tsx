'use client';

import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Upload,
} from 'lucide-react';
import type { BiologicalSex, SupportedLanguage } from '@/lib/clinical/types';
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
  onAnalyzeFile: (file: File) => void;
  onAnalyzeText: (text: string) => void;
  onSelectDemoCase: (caseId: string) => void;
}

export function IntakePanel({
  language,
  age,
  sex,
  onAgeChange,
  onSexChange,
  isLoading,
  errorMessage,
  onAnalyzeFile,
  onAnalyzeText,
  onSelectDemoCase,
}: IntakePanelProps) {
  const t = UI_STRINGS[language];
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePicked = (file?: File) => {
    if (!file) return;
    onAnalyzeFile(file);
  };

  return (
    <div className="clinical-enter space-y-8">
      {/* Calm editorial title block — no gradient hero, no hype pills */}
      <section className="max-w-3xl space-y-3 pt-4">
        <h1
          id="main-heading"
          tabIndex={-1}
          className="text-3xl font-medium tracking-[-0.02em] text-[#171717] sm:text-4xl sm:leading-[1.15]"
        >
          {t.tagline}
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-[#525252] sm:text-base">
          {t.subtitle}
        </p>
      </section>

      {/* Error banner */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-white p-4 text-sm text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b91c1c]" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-[#525252]">{errorMessage}</p>
        </div>
      )}

      {/* Loading progress */}
      {isLoading && (
        <div className="rounded-xl border border-neutral-900/8 bg-white p-5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[#171717]">{t.analyzingBtn}</span>
            <span className="font-mono text-xs text-[#737373]">
              Extraction · Unit check · Safety rules
            </span>
          </div>
          <progress
            aria-label={t.analyzingBtn}
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full accent-[#0f766e]"
          />
        </div>
      )}

      {/* Asymmetric 7/5 Split Workspace */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* Left 7 columns: Primary Document Intake Workspace */}
        <section className="rounded-2xl border border-neutral-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:col-span-7">
          {/* Patient Context + Mode Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-900/8 pb-4">
            <div className="inline-flex rounded-lg bg-[#f4f4f5] p-1">
              <button
                type="button"
                aria-pressed={activeTab === 'upload'}
                onClick={() => setActiveTab('upload')}
                className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors duration-150 ${
                  activeTab === 'upload'
                    ? 'bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-neutral-900/8'
                    : 'text-[#525252] hover:text-[#171717]'
                }`}
              >
                <Upload className="h-4 w-4 shrink-0 text-[#737373]" strokeWidth={1.5} aria-hidden="true" />
                <span>{t.uploadTab}</span>
              </button>
              <button
                type="button"
                aria-pressed={activeTab === 'paste'}
                onClick={() => setActiveTab('paste')}
                className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors duration-150 ${
                  activeTab === 'paste'
                    ? 'bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-neutral-900/8'
                    : 'text-[#525252] hover:text-[#171717]'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0 text-[#737373]" strokeWidth={1.5} aria-hidden="true" />
                <span>{t.pasteTab}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="patient-age" className="text-xs text-[#737373]">
                  {t.ageLabel}
                </label>
                <input
                  id="patient-age"
                  type="number"
                  min={1}
                  max={115}
                  value={age}
                  onChange={(e) =>
                    onAgeChange(Math.max(1, Math.min(115, Number(e.target.value) || 45)))
                  }
                  className="h-9 w-16 rounded-lg border border-neutral-900/12 bg-[#fafafa] px-2.5 font-mono text-sm tabular-nums text-[#171717]"
                />
              </div>

              <div className="inline-flex rounded-lg bg-[#f4f4f5] p-1 text-xs font-medium">
                <button
                  type="button"
                  aria-pressed={sex === 'male'}
                  onClick={() => onSexChange('male')}
                  className={`h-7 rounded-md px-2.5 transition-colors duration-150 ${
                    sex === 'male'
                      ? 'bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-neutral-900/8'
                      : 'text-[#525252] hover:text-[#171717]'
                  }`}
                >
                  {t.male}
                </button>
                <button
                  type="button"
                  aria-pressed={sex === 'female'}
                  onClick={() => onSexChange('female')}
                  className={`h-7 rounded-md px-2.5 transition-colors duration-150 ${
                    sex === 'female'
                      ? 'bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-neutral-900/8'
                      : 'text-[#525252] hover:text-[#171717]'
                  }`}
                >
                  {t.female}
                </button>
              </div>
            </div>
          </div>

          {/* Intake Body */}
          <div className="pt-5">
            {activeTab === 'upload' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFilePicked(e.dataTransfer.files?.[0]);
                }}
                className={`flex flex-col items-start justify-between gap-5 rounded-xl border border-dashed p-6 transition-colors duration-150 sm:flex-row sm:items-center ${
                  isDragging
                    ? 'border-[#0f766e] bg-[#f4f4f5]'
                    : 'border-neutral-900/18 bg-[#fafafa]'
                }`}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#171717]">{t.dropzoneTitle}</p>
                  <p className="text-xs text-[#737373]">{t.dropzoneSubtitle}</p>
                </div>

                <input
                  ref={fileInputRef}
                  id="clinical-file-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  className="visually-hidden"
                  onChange={(e) => handleFilePicked(e.target.files?.[0])}
                  disabled={isLoading}
                />

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#115e59] active:scale-[0.98] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>{t.chooseFileBtn}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <label htmlFor="clinical-paste-box" className="visually-hidden">
                  {t.pasteTab}
                </label>
                <textarea
                  id="clinical-paste-box"
                  rows={5}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={t.pastePlaceholder}
                  className="w-full rounded-xl border border-neutral-900/12 bg-[#fafafa] p-4 font-mono text-xs leading-relaxed text-[#171717] placeholder:font-sans placeholder:text-[#737373] focus:border-[#0f766e] focus:bg-white"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPastedText(
                        'SEHA Lab Result: HbA1c 7.6%, Fasting Glucose 156 mg/dL, LDL 4.1 mmol/L, Potassium 5.8 mmol/L, Creatinine 148 umol/L, eGFR 44 mL/min. Medications: Cozaar 50mg OD, Lasix 40mg OD, Voltaren 50mg BD, Glucophage 1000mg BD.',
                      )
                    }
                    className="text-xs font-medium text-[#525252] underline decoration-neutral-300 underline-offset-4 transition-colors duration-150 hover:text-[#171717]"
                  >
                    Insert sample UAE lab + prescription
                  </button>
                  <button
                    type="button"
                    disabled={isLoading || pastedText.trim().length < 5}
                    onClick={() => onAnalyzeText(pastedText)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f766e] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#115e59] active:scale-[0.98] disabled:opacity-50"
                  >
                    <span>{t.analyzeBtn}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* Quiet clinical verification specification strip */}
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-neutral-900/8 pt-5 text-xs">
              <div>
                <p className="font-mono text-[#737373]">01 · Units</p>
                <p className="mt-1 font-medium text-[#171717]">SI and US auto-normalized</p>
              </div>
              <div>
                <p className="font-mono text-[#737373]">02 · Guardrails</p>
                <p className="mt-1 font-medium text-[#171717]">25+ biomarkers, 998 panic rules</p>
              </div>
              <div>
                <p className="font-mono text-[#737373]">03 · Pharmacy</p>
                <p className="mt-1 font-medium text-[#171717]">UAE brand and interaction matrix</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right 5 columns: Clinical Specimen Case List */}
        <section
          aria-labelledby="demo-cases-heading"
          className="rounded-2xl border border-neutral-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:col-span-5"
        >
          <div className="mb-4 flex items-baseline justify-between gap-2 border-b border-neutral-900/8 pb-3">
            <div>
              <h2 id="demo-cases-heading" className="text-sm font-medium text-[#171717]">
                {t.demoCasesHeading}
              </h2>
              <p className="mt-0.5 text-xs text-[#737373]">{t.demoCasesSub}</p>
            </div>
            <span className="font-mono text-xs text-[#737373]">03</span>
          </div>

          <ul className="divide-y divide-neutral-900/8">
            {DEMO_CASES.map((demo, idx) => {
              const dotColor =
                demo.accent === 'crimson'
                  ? 'bg-[#b91c1c]'
                  : demo.accent === 'amber'
                    ? 'bg-[#b45309]'
                    : 'bg-[#0f766e]';

              return (
                <li key={demo.id} className="py-3.5 first:pt-1 last:pb-0">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => onSelectDemoCase(demo.id)}
                    className="group flex w-full items-start justify-between gap-3 rounded-lg p-2 -mx-2 text-start transition-colors duration-150 hover:bg-[#fafafa] disabled:opacity-50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
                        <span className="font-mono text-xs text-[#737373]">
                          <bdi dir="ltr">0{idx + 1}</bdi> · {demo.badge}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#171717] group-hover:text-[#0f766e]">
                        {demo.title.replace(/^Case \d+:\s*/, '')}
                      </p>
                      <p className="text-xs leading-relaxed text-[#525252]">
                        {demo.highlights[0]}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 h-4 w-4 shrink-0 text-[#737373] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#171717] rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
