'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Lock,
  Mic,
  MicOff,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import { redactClinicalPII } from '@/lib/clinical/piiRedactor';
import type { BiologicalSex, ReadingLevel, SupportedLanguage } from '@/lib/clinical/types';
import { DEMO_CASES } from '@/lib/demo/cases';
import { LANGUAGE_MAP, UI_STRINGS } from '@/lib/i18n/uiStrings';

interface IntakePanelProps {
  language: SupportedLanguage;
  age: number;
  sex: BiologicalSex;
  readingLevel: ReadingLevel;
  onAgeChange: (age: number) => void;
  onSexChange: (sex: BiologicalSex) => void;
  onReadingLevelChange: (level: ReadingLevel) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onAnalyzeFiles: (files: File[]) => void;
  onAnalyzeText: (text: string) => void;
  onSelectDemoCase: (caseId: string) => void;
  savedOfflineHeadline?: string | null;
  onRestoreOfflineReport?: () => void;
  onClearOfflineReport?: () => void;
}

export function IntakePanel({
  language,
  age,
  sex,
  readingLevel,
  onAgeChange,
  onSexChange,
  onReadingLevelChange,
  isLoading,
  errorMessage,
  onAnalyzeFiles,
  onAnalyzeText,
  onSelectDemoCase,
  savedOfflineHeadline,
  onRestoreOfflineReport,
  onClearOfflineReport,
}: IntakePanelProps) {
  const t = UI_STRINGS[language];
  const langMeta = LANGUAGE_MAP[language];
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(0);
  const [isDictating, setIsDictating] = useState(false);
  const [dictationNotice, setDictationNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const piiPreview = useMemo(() => redactClinicalPII(pastedText), [pastedText]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleVoiceDictation = () => {
    if (isDictating && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsDictating(false);
      return;
    }

    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) {
      setDictationNotice('Voice dictation requires Chrome, Edge, or Safari with microphone access.');
      return;
    }

    setDictationNotice(null);
    const recognition = new SpeechRec();
    recognition.lang = langMeta.speechLocale;
    recognition.continuous = true;
    recognition.interimResults = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += `${event.results[i][0].transcript} `;
        }
      }
      if (transcript.trim()) {
        setPastedText((prev) => `${prev ? `${prev.trim()} ` : ''}${transcript.trim()}`);
      }
    };
    recognition.onerror = () => {
      setIsDictating(false);
      setDictationNotice('Could not access microphone. Please check browser mic permission.');
    };
    recognition.onend = () => {
      setIsDictating(false);
    };

    recognitionRef.current = recognition;
    setIsDictating(true);
    recognition.start();
  };

  useEffect(() => {
    if (!isLoading) {
      setPipelineStage(0);
      return;
    }
    setPipelineStage(0);
    const t1 = window.setTimeout(() => setPipelineStage(1), 1250);
    const t2 = window.setTimeout(() => setPipelineStage(2), 2850);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isLoading]);

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
    <div className="space-y-10">
      {/* Editorial 2-Column Boutique Clinical Hero (Zero AI-SaaS dark rectangle or sparkles) */}
      <section className="grid items-center gap-8 pt-2 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-5 lg:col-span-7">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#57534E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0D5C56]" aria-hidden="true" />
            <span>Khalifa University · MD-Validated Clinical Clarity</span>
          </p>

          <h1
            id="main-heading"
            tabIndex={-1}
            className="font-editorial text-4xl font-normal leading-[1.06] tracking-[-0.02em] text-[#18181B] sm:text-[52px]"
          >
            {language === 'en' ? (
              <>
                Every lab &amp; prescription,{' '}
                <em className="italic text-[#0D5C56]">clearly</em> understood.
              </>
            ) : (
              t.tagline
            )}
          </h1>

          <p className="max-w-xl text-[15px] leading-relaxed text-[#57534E] sm:text-base">
            {t.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E7E3DA] pt-4 text-xs text-[#57534E]">
            <span>
              <strong className="font-semibold text-[#18181B] tabular-nums">77</strong> LOINC Biomarkers
            </span>
            <span aria-hidden="true" className="text-[#CBC4B6]">·</span>
            <span>
              <strong className="font-semibold text-[#18181B] tabular-nums">150</strong> Drugs /{' '}
              <strong className="font-semibold text-[#18181B] tabular-nums">620+</strong> UAE Brands
            </span>
            <span aria-hidden="true" className="text-[#CBC4B6]">·</span>
            <span>
              <strong className="font-semibold text-[#18181B]">Pediatric</strong> &amp; CKD-EPI 2021
            </span>
            <span aria-hidden="true" className="text-[#CBC4B6]">·</span>
            <span>
              <strong className="font-semibold text-[#18181B]">5</strong> UAE Languages + Voice
            </span>
          </div>
        </div>

        <div className="lg:col-span-5">
          <figure className="overflow-hidden rounded-2xl border border-[#E7E3DA] bg-[#F5F2EB] shadow-[0_18px_42px_-22px_rgba(24,24,27,0.16)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-editorial.jpg"
              alt="Minimalist botanical and clinical pulse waveform artwork representing clear medical guidance"
              width={800}
              height={600}
              className="aspect-[4/3] w-full object-cover"
            />
          </figure>
        </div>
      </section>

      {/* Offline Cached Report Resume & Privacy Clear Banner */}
      {savedOfflineHeadline && onRestoreOfflineReport && !isLoading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE5E2] bg-[#F2F7F5] px-4 py-2.5">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#0D5C56]" aria-hidden="true" />
            <span className="font-medium text-[#18181B]">
              Saved offline report:{' '}
              <span className="font-semibold text-[#0D5C56]">{savedOfflineHeadline}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onClearOfflineReport && (
              <button
                type="button"
                onClick={onClearOfflineReport}
                className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#DDD8CE] bg-white px-3 text-xs font-semibold text-[#57534E] transition hover:border-rose-300 hover:text-rose-700"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear Saved Data</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRestoreOfflineReport}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[#0D5C56] px-3.5 text-xs font-semibold text-white transition hover:bg-[#094742]"
            >
              <span>Resume Report</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50/90 p-4 text-sm text-rose-900"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
          <div>
            <p className="font-semibold">Analysis Notice</p>
            <p className="mt-0.5 text-rose-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Live 3-Stage Clinical Pipeline Progress Indicator */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="clinical-card-enter editorial-sheet rounded-2xl p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-[#0D5C56]" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#18181B]">{t.analyzingBtn}</p>
            </div>
            <span className="rounded-md bg-[#F3F1EC] px-2.5 py-1 text-[11px] font-medium text-[#57534E]">
              Gemini 3.8 Flash → Deterministic MD Engine
            </span>
          </div>

          {/* Smooth Indeterminate Progress Track */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#EFECE5]">
            <div className="clinical-progress-bar h-full w-2/5 rounded-full bg-[#0D5C56]" />
          </div>

          {/* 3-Stage Hybrid Architecture Stepper */}
          <ol className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {[
              {
                title: '1. Multimodal Extraction',
                sub: 'Reading lab values, dates & UAE brands',
              },
              {
                title: '2. MD Deterministic Guardrails',
                sub: '77 LOINC ranges, CKD-EPI & 40 RxList rules',
              },
              {
                title: '3. Grounded Translation',
                sub: 'Plain-language guide & caregiver summary',
              },
            ].map((step, idx) => {
              const done = pipelineStage > idx;
              const active = pipelineStage === idx;
              return (
                <li
                  key={step.title}
                  className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors duration-300 ${
                    done
                      ? 'border-[#C6DDD7] bg-[#F2F7F5] text-[#0D5C56]'
                      : active
                        ? 'border-[#0D5C56]/40 bg-white text-[#18181B]'
                        : 'border-[#EFECE5] bg-[#FAF9F6] text-[#A8A29E]'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0D5C56]" aria-hidden="true" />
                  ) : active ? (
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[#0D5C56]" aria-hidden="true" />
                  ) : (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-[#D6D0C4]"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{step.title}</p>
                    <p className="text-[11px] opacity-80">{step.sub}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Un-nested Single Elevated Clinical Intake Sheet */}
      <section className="editorial-sheet overflow-hidden rounded-2xl">
        {/* Clean Inline Patient Context Strip (Hairline Divider — No Box-in-Box) */}
        <div className="flex flex-col gap-3 border-b border-[#EFECE5] bg-[#FCFBF9] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0D5C56]" aria-hidden="true" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
              {t.patientContextTitle}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="patient-age" className="text-xs font-medium text-[#57534E]">
                {t.ageLabel}
              </label>
              <input
                id="patient-age"
                type="number"
                min={0}
                max={115}
                value={age}
                onChange={(e) => onAgeChange(Math.max(0, Math.min(115, Number(e.target.value) || 0)))}
                className="min-h-[36px] w-16 rounded-lg border border-[#DDD8CE] bg-white px-2.5 text-sm font-semibold text-[#18181B] tabular-nums"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#57534E]">{t.sexLabel}</span>
              <div className="inline-flex rounded-lg border border-[#DDD8CE] bg-[#F3F1EC] p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  aria-pressed={sex === 'male'}
                  onClick={() => onSexChange('male')}
                  className={`min-h-[32px] rounded-md px-3 transition ${
                    sex === 'male'
                      ? 'bg-[#18181B] text-[#FAF9F6] shadow-2xs'
                      : 'text-[#57534E] hover:text-[#18181B]'
                  }`}
                >
                  {t.male}
                </button>
                <button
                  type="button"
                  aria-pressed={sex === 'female'}
                  onClick={() => onSexChange('female')}
                  className={`min-h-[32px] rounded-md px-3 transition ${
                    sex === 'female'
                      ? 'bg-[#18181B] text-[#FAF9F6] shadow-2xs'
                      : 'text-[#57534E] hover:text-[#18181B]'
                  }`}
                >
                  {t.female}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#57534E]">Tone</span>
              <div
                role="group"
                aria-label="Reading Level"
                className="inline-flex rounded-lg border border-[#DDD8CE] bg-[#F3F1EC] p-0.5 text-xs font-semibold"
              >
                {(
                  [
                    { id: 'simple', label: 'Simple' },
                    { id: 'standard', label: 'Standard' },
                    { id: 'clinical', label: 'Clinical' },
                  ] as const
                ).map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    aria-pressed={readingLevel === lvl.id}
                    onClick={() => onReadingLevelChange(lvl.id)}
                    className={`min-h-[32px] rounded-md px-2.5 transition ${
                      readingLevel === lvl.id
                        ? 'bg-[#0D5C56] text-white shadow-2xs'
                        : 'text-[#57534E] hover:text-[#18181B]'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Controls: Clean Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFECE5] px-6 py-3">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              aria-pressed={activeTab === 'upload'}
              onClick={() => setActiveTab('upload')}
              className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition sm:text-sm ${
                activeTab === 'upload'
                  ? 'bg-[#18181B] text-[#FAF9F6]'
                  : 'text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#18181B]'
              }`}
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              <span>{t.uploadTab}</span>
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'paste'}
              onClick={() => setActiveTab('paste')}
              className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition sm:text-sm ${
                activeTab === 'paste'
                  ? 'bg-[#18181B] text-[#FAF9F6]'
                  : 'text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#18181B]'
              }`}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>{t.pasteTab}</span>
            </button>
          </div>
        </div>

        <div className="p-6">
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
              className={`flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition ${
                isDragging
                  ? 'border-[#0D5C56] bg-[#F2F7F5]'
                  : 'border-[#D6D0C4] bg-[#FAF9F6]/70 hover:border-[#0D5C56]/60'
              }`}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#E7E3DA] bg-white text-[#0D5C56] shadow-2xs">
                <UploadCloud className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="font-editorial text-xl font-medium text-[#18181B]">{t.dropzoneTitle}</p>
              <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-[#57534E] sm:text-sm">
                Upload <strong className="font-semibold text-[#18181B]">1 to 6 files together</strong> (Hematology PDF, Biochemistry PDF, or Prescription photo) — automatically merged into one verified report.
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

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0D5C56] px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#094742] disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  <span>{queuedFiles.length > 0 ? 'Add More Files / Photos' : t.chooseFileBtn}</span>
                </button>

                <a
                  href="/samples/abu-dhabi-sample-lab-report.pdf"
                  download="abu-dhabi-sample-lab-report.pdf"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#DDD8CE] bg-white px-4 py-2.5 text-xs font-semibold text-[#18181B] transition hover:bg-[#F3F1EC]"
                >
                  <Download className="h-4 w-4 text-[#0D5C56]" aria-hidden="true" />
                  <span>Download Sample UAE Lab PDF</span>
                </a>
              </div>

              <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#78716C]">
                <Lock className="h-3 w-3 shrink-0 text-[#0D5C56]" aria-hidden="true" />
                <span>
                  Privacy notice: pasted/dictated text is PII-redacted on-device before AI. Uploaded photos/PDFs are sent directly to Gemini OCR — crop or cover names &amp; Emirates IDs first if desired.
                </span>
              </p>
            </div>

            {queuedFiles.length > 0 && (
              <div className="space-y-3 rounded-xl border border-[#DCE5E2] bg-[#F2F7F5]/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#18181B]">
                    Ready to Analyze Together ({queuedFiles.length} {queuedFiles.length === 1 ? 'document' : 'documents'})
                  </p>
                  <button
                    type="button"
                    onClick={() => setQueuedFiles([])}
                    className="text-xs font-medium text-[#57534E] hover:text-rose-700"
                  >
                    Clear all
                  </button>
                </div>

                <ul className="flex flex-wrap gap-2">
                  {queuedFiles.map((file, idx) => (
                    <li
                      key={`${file.name}-${file.size}-${idx}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#E2DDD2] bg-white px-3 py-1.5 text-xs font-medium text-[#18181B]"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-[#0D5C56]" aria-hidden="true" />
                      <span className="max-w-[200px] truncate">{file.name}</span>
                      <span className="text-[10px] text-[#78716C] tabular-nums">
                        {Math.max(1, Math.round(file.size / 1024))} KB
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() =>
                          setQueuedFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="rounded-full p-0.5 text-[#78716C] hover:bg-[#F3F1EC] hover:text-rose-600"
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
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0D5C56] px-6 text-sm font-semibold text-white shadow-xs transition hover:bg-[#094742] disabled:opacity-50"
                  >
                    <span>
                      {t.analyzeBtn} ({queuedFiles.length} {queuedFiles.length === 1 ? 'File' : 'Files'})
                    </span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="clinical-paste-box" className="text-sm font-semibold text-[#18181B]">
                  {t.pasteTab}
                </label>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#DCE5E2] bg-[#F2F7F5] px-2.5 py-0.5 text-[10px] font-semibold text-[#0D5C56]">
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  On-Device PII Redaction (UAE PDPL)
                </span>
              </div>

              <button
                type="button"
                onClick={toggleVoiceDictation}
                aria-pressed={isDictating}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                  isDictating
                    ? 'bg-rose-700 text-white hover:bg-rose-800'
                    : 'border border-[#DDD8CE] bg-[#FAF9F6] text-[#18181B] hover:border-[#0D5C56] hover:text-[#0D5C56]'
                }`}
              >
                {isDictating ? (
                  <>
                    <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Stop Dictating</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5 text-[#0D5C56]" aria-hidden="true" />
                    <span>Dictate Note ({langMeta.nativeLabel})</span>
                  </>
                )}
              </button>
            </div>

            {dictationNotice && (
              <p className="text-xs font-medium text-amber-800">{dictationNotice}</p>
            )}

            <textarea
              id="clinical-paste-box"
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={t.pastePlaceholder}
              className="w-full rounded-xl border border-[#DDD8CE] bg-[#FAF9F6] p-4 text-sm text-[#18181B] placeholder:text-[#A8A29E] focus:border-[#0D5C56] focus:bg-white"
            />

            {piiPreview.redactionCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#C6DDD7] bg-[#F2F7F5] px-3.5 py-2 text-xs text-[#0D5C56]">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">
                    {piiPreview.redactionCount} PII item(s) masked on-device before AI:
                  </strong>{' '}
                  {piiPreview.categories.join(', ')} (age, sex, and clinical values preserved).
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setPastedText(
                    'Patient Name: Ahmed Al-Mansoori, Emirates ID: 784-1972-1234567-8, Phone: +971 50 123 4567\nSEHA Lab Result: HbA1c 7.6%, Fasting Glucose 156 mg/dL, LDL 4.1 mmol/L, Potassium 5.8 mmol/L, Creatinine 148 umol/L, eGFR 44 mL/min. Medications: Cozaar 50mg OD, Lasix 40mg OD, Voltaren 50mg BD, Glucophage 1000mg BD.',
                  )
                }
                className="text-xs font-semibold text-[#0D5C56] underline decoration-[#0D5C56]/30 underline-offset-4 hover:text-[#094742]"
              >
                Insert realistic mixed UAE lab + Rx snippet (tests PII masking!)
              </button>
              <button
                type="button"
                disabled={isLoading || pastedText.trim().length < 5}
                onClick={() => onAnalyzeText(piiPreview.sanitizedText)}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0D5C56] px-6 text-sm font-semibold text-white transition hover:bg-[#094742] disabled:opacity-50"
              >
                <span>{t.analyzeBtn}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        </div>
      </section>

      {/* 3 Cohesive Editorial Clinical Walkthroughs (Zero Rainbow Buttons or Floating Corner Squares) */}
      <section aria-labelledby="demo-cases-heading" className="space-y-5">
        <div className="flex flex-col gap-1 border-b border-[#E7E3DA] pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="demo-cases-heading" className="font-editorial text-2xl font-normal tracking-tight text-[#18181B] sm:text-3xl">
              {t.demoCasesHeading}
            </h2>
            <p className="mt-0.5 text-xs text-[#57534E] sm:text-sm">{t.demoCasesSub}</p>
          </div>
          <span className="text-[11px] font-medium text-[#78716C]">
            Runs live through deterministic clinical rules
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {DEMO_CASES.map((demo, idx) => {
            const dotColor =
              demo.accent === 'crimson'
                ? 'bg-rose-600'
                : demo.accent === 'amber'
                  ? 'bg-amber-600'
                  : 'bg-[#0D5C56]';

            const tagColor =
              demo.accent === 'crimson'
                ? 'text-rose-800'
                : demo.accent === 'amber'
                  ? 'text-amber-800'
                  : 'text-[#0D5C56]';

            return (
              <article
                key={demo.id}
                className="editorial-sheet group flex flex-col justify-between rounded-2xl p-6 transition hover:border-[#CBC4B6]"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${tagColor}`}>
                      <span className={`h-2 w-2 rounded-full ${dotColor}`} aria-hidden="true" />
                      {demo.badge}
                    </span>
                    <span className="font-mono text-[11px] font-medium text-[#A8A29E]">
                      0{idx + 1}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-editorial text-[21px] font-medium leading-snug text-[#18181B]">
                      {demo.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#78716C]">{demo.subtitle}</p>
                  </div>

                  <ul className="space-y-2 border-t border-[#F0EDE6] pt-3.5 text-xs leading-relaxed text-[#57534E]">
                    {demo.highlights.map((hl, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#A8A29E]" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onSelectDemoCase(demo.id)}
                  className="mt-6 inline-flex min-h-[42px] w-full items-center justify-between rounded-xl border border-[#E2DDD2] bg-[#FAF9F6] px-4 text-xs font-semibold text-[#18181B] transition group-hover:border-[#0D5C56] group-hover:bg-[#0D5C56] group-hover:text-white disabled:opacity-50"
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
