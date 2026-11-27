'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ClipboardCheck,
} from 'lucide-react';
import type {
  BiologicalSex,
  ShifaClearAnalysisResponse,
  SupportedLanguage,
  UnitSystem,
} from '@/lib/clinical/types';
import { DEMO_CASES } from '@/lib/demo/cases';
import { LANGUAGE_MAP, UI_STRINGS } from '@/lib/i18n/uiStrings';
import { BiomarkerDashboard } from './BiomarkerDashboard';
import { ClinicalAuditDrawer } from './ClinicalAuditDrawer';
import { DoctorPrepAndVoice } from './DoctorPrepAndVoice';
import { HeaderBar } from './HeaderBar';
import { IntakePanel } from './IntakePanel';
import { MedicationTimetable } from './MedicationTimetable';
import { QrSettingsModal } from './QrSettingsModal';
import { UrgentAlertBanner } from './UrgentAlertBanner';

interface ShifaClearAppProps {
  hasServerApiKey: boolean;
}

export function ShifaClearApp({ hasServerApiKey }: ShifaClearAppProps) {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('SI');
  const [elderMode, setElderMode] = useState(false);
  const [age, setAge] = useState(54);
  const [sex, setSex] = useState<BiologicalSex>('male');

  const [analysis, setAnalysis] = useState<ShifaClearAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [auditOpen, setAuditOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [sessionApiKey, setSessionApiKey] = useState('');

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioProviderLabel, setAudioProviderLabel] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const langMeta = LANGUAGE_MAP[language];
  const t = UI_STRINGS[language];

  useEffect(() => {
    document.documentElement.lang = langMeta.code;
    document.documentElement.dir = langMeta.dir;
  }, [langMeta]);

  const stopAnyAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsLoadingAudio(false);
  };

  useEffect(() => {
    return () => stopAnyAudio();
  }, []);

  const buildHeaders = (json = true): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (json) headers['Content-Type'] = 'application/json';
    if (sessionApiKey.trim()) headers['x-gemini-api-key'] = sessionApiKey.trim();
    return headers;
  };

  const runDemoCase = async (
    caseId: string,
    overrideLang?: SupportedLanguage,
    overrideCtx?: { age: number; sex: BiologicalSex; unitSystem: UnitSystem },
  ) => {
    stopAnyAudio();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const demoDef = DEMO_CASES.find((c) => c.id === caseId);
      const effectiveAge = overrideCtx?.age ?? demoDef?.defaultContext.age ?? age;
      const effectiveSex = overrideCtx?.sex ?? demoDef?.defaultContext.sex ?? sex;
      const effectiveUnit = overrideCtx?.unitSystem ?? unitSystem;
      const effectiveLang = overrideLang ?? language;

      setAge(effectiveAge);
      setSex(effectiveSex);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({
          demoCaseId: caseId,
          patientContext: {
            age: effectiveAge,
            sex: effectiveSex,
            unitSystem: effectiveUnit,
            language: effectiveLang,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load clinical case.');
      setAnalysis(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load case.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeFile = async (file: File) => {
    stopAnyAudio();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'patientContext',
        JSON.stringify({ age, sex, unitSystem, language }),
      );

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: buildHeaders(false),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not analyze uploaded document.');
      setAnalysis(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload analysis failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeText = async (rawText: string) => {
    stopAnyAudio();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({
          rawText,
          patientContext: { age, sex, unitSystem, language },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not analyze clinical text.');
      setAnalysis(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Text analysis failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (newLang: SupportedLanguage) => {
    stopAnyAudio();
    setLanguage(newLang);

    if (!analysis) return;

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({
          language: newLang,
          demoCaseId: analysis.demoCaseId,
          evaluation: analysis.evaluation,
        }),
      });
      const data = await res.json();
      if (res.ok && data.narrative) {
        setAnalysis((prev) =>
          prev
            ? {
                ...prev,
                evaluation: {
                  ...prev.evaluation,
                  patientContext: {
                    ...prev.evaluation.patientContext,
                    language: newLang,
                  },
                },
                narrative: data.narrative,
              }
            : null,
        );
      }
    } catch {
      // Keep UI chrome switched cleanly
    } finally {
      setIsTranslating(false);
    }
  };

  const speakText = async (textToSpeak: string) => {
    stopAnyAudio();
    setIsLoadingAudio(true);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({ text: textToSpeak, language }),
      });
      const data = await res.json();

      if (res.ok && data.audioBase64) {
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
        audioRef.current = audio;
        setAudioProviderLabel('Gemini TTS');
        setIsLoadingAudio(false);
        setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
        return;
      }
    } catch {
      // Fallback to browser Speech Synthesis
    }

    setIsLoadingAudio(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.lang = langMeta.speechLocale;
      utter.rate = elderMode ? 0.88 : 0.96;
      setAudioProviderLabel('Browser voice');
      setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    }
  };

  const handleToggleMainSpeech = () => {
    if (isSpeaking) {
      stopAnyAudio();
      return;
    }
    if (analysis?.narrative.spokenSummaryScript) {
      speakText(analysis.narrative.spokenSummaryScript);
    }
  };

  const abnormalCount = analysis
    ? analysis.evaluation.biomarkers.filter((b) => b.status !== 'normal').length
    : 0;

  const riskDotColor =
    analysis?.evaluation.overallRisk === 'urgent'
      ? 'bg-[#b91c1c]'
      : analysis?.evaluation.overallRisk === 'attention'
        ? 'bg-[#b45309]'
        : 'bg-[#15803d]';

  const riskTextColor =
    analysis?.evaluation.overallRisk === 'urgent'
      ? 'text-[#b91c1c]'
      : analysis?.evaluation.overallRisk === 'attention'
        ? 'text-[#b45309]'
        : 'text-[#15803d]';

  return (
    <div
      dir={langMeta.dir}
      lang={langMeta.code}
      data-elder={elderMode ? 'true' : 'false'}
      className={`min-h-screen bg-[#fafafa] text-[#171717] ${langMeta.fontClass}`}
    >
      <HeaderBar
        language={language}
        onLanguageChange={handleLanguageChange}
        unitSystem={unitSystem}
        onUnitSystemChange={setUnitSystem}
        elderMode={elderMode}
        onElderModeChange={setElderMode}
        hasEvaluation={Boolean(analysis)}
        onOpenAudit={() => setAuditOpen(true)}
        onOpenQrSettings={() => setQrOpen(true)}
        onResetHome={() => {
          stopAnyAudio();
          setAnalysis(null);
          setErrorMessage(null);
        }}
      />

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {!analysis ? (
          <IntakePanel
            language={language}
            age={age}
            sex={sex}
            onAgeChange={setAge}
            onSexChange={setSex}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onAnalyzeFile={handleAnalyzeFile}
            onAnalyzeText={handleAnalyzeText}
            onSelectDemoCase={(id) => runDemoCase(id)}
          />
        ) : (
          <div className="clinical-enter space-y-8">
            {/* Top Context Bar */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  stopAnyAudio();
                  setAnalysis(null);
                  setErrorMessage(null);
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-900/10 bg-white px-3 text-xs font-medium text-[#171717] transition-colors duration-150 hover:bg-[#f4f4f5] active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4 shrink-0 rtl:rotate-180" strokeWidth={1.5} aria-hidden="true" />
                <span>{t.newScanBtn}</span>
              </button>

              <div className="inline-flex items-center gap-0.5 rounded-lg bg-[#f4f4f5] p-1">
                {DEMO_CASES.map((demo, idx) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => runDemoCase(demo.id)}
                    className={`h-7 rounded-md px-3 text-xs font-medium transition-colors duration-150 ${
                      analysis.demoCaseId === demo.id
                        ? 'bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-neutral-900/8'
                        : 'text-[#525252] hover:text-[#171717]'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {isTranslating && (
              <div className="rounded-xl border border-neutral-900/8 bg-white px-4 py-3">
                <p className="text-xs font-medium text-[#171717]">
                  Translating verified report into {langMeta.nativeLabel}
                </p>
                <progress
                  aria-label="Translating report"
                  className="mt-2 h-1.5 w-full rounded-full accent-[#0f766e]"
                />
              </div>
            )}

            {/* Executive Summary + 4 Pure Stat Figures */}
            <section className="space-y-4">
              <div className="rounded-2xl border border-neutral-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-4xl space-y-2.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className={`inline-flex items-center gap-1.5 font-medium ${riskTextColor}`}>
                        <span className={`h-2 w-2 rounded-full ${riskDotColor}`} aria-hidden="true" />
                        {t.riskBadges[analysis.evaluation.overallRisk]}
                      </span>
                      {analysis.evaluation.facilityName &&
                        analysis.evaluation.facilityName.toLowerCase() !== 'null' && (
                          <span className="text-[#737373]">
                            · {analysis.evaluation.facilityName}
                          </span>
                        )}
                      {analysis.evaluation.reportDate &&
                        analysis.evaluation.reportDate.toLowerCase() !== 'null' && (
                          <span className="font-mono text-[#737373]">
                            · <bdi dir="ltr">{analysis.evaluation.reportDate}</bdi>
                          </span>
                        )}
                      <span className="font-mono text-[#737373]">
                        ·{' '}
                        {analysis.evaluation.patientContext.sex === 'female'
                          ? t.female
                          : t.male}
                        , <bdi dir="ltr">{analysis.evaluation.patientContext.age}y</bdi>
                      </span>
                    </div>

                    <h1
                      id="main-heading"
                      tabIndex={-1}
                      className="text-2xl font-medium tracking-[-0.015em] text-[#171717] sm:text-[28px] sm:leading-[1.2]"
                    >
                      {analysis.narrative.headline}
                    </h1>

                    <p className="text-[15px] leading-relaxed text-[#525252]">
                      {analysis.narrative.overallSummary}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAuditOpen(true)}
                    className="no-print inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-neutral-900/10 bg-[#fafafa] px-3.5 text-xs font-medium text-[#171717] transition-colors duration-150 hover:bg-[#f4f4f5] active:scale-[0.98]"
                  >
                    <ClipboardCheck className="h-4 w-4 shrink-0 text-[#525252]" strokeWidth={1.5} aria-hidden="true" />
                    <span>
                      {t.auditTrailBtn} (<bdi dir="ltr">{analysis.evaluation.auditTrail.length}</bdi>)
                    </span>
                  </button>
                </div>
              </div>

              {/* 4 Pure-Number Stat Cards (Equal Height, Tabular Mono, No Decoration) */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-neutral-900/8 bg-white p-5">
                  <p className="text-xs text-[#737373]">{t.statMarkers}</p>
                  <p className="mt-2 font-mono text-[28px] font-medium leading-none tabular-nums text-[#171717]">
                    <bdi dir="ltr">{analysis.evaluation.biomarkers.length}</bdi>
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-900/8 bg-white p-5">
                  <p className="text-xs text-[#737373]">{t.statAttention}</p>
                  <p
                    className={`mt-2 font-mono text-[28px] font-medium leading-none tabular-nums ${
                      abnormalCount > 0 ? 'text-[#b91c1c]' : 'text-[#15803d]'
                    }`}
                  >
                    <bdi dir="ltr">{abnormalCount}</bdi>
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-900/8 bg-white p-5">
                  <p className="text-xs text-[#737373]">{t.statAlerts}</p>
                  <p
                    className={`mt-2 font-mono text-[28px] font-medium leading-none tabular-nums ${
                      analysis.evaluation.alerts.length > 0
                        ? 'text-[#b45309]'
                        : 'text-[#171717]'
                    }`}
                  >
                    <bdi dir="ltr">{analysis.evaluation.alerts.length}</bdi>
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-900/8 bg-white p-5">
                  <p className="text-xs text-[#737373]">{t.statMeds}</p>
                  <p className="mt-2 font-mono text-[28px] font-medium leading-none tabular-nums text-[#171717]">
                    <bdi dir="ltr">{analysis.evaluation.medications.length}</bdi>
                  </p>
                </div>
              </div>
            </section>

            <UrgentAlertBanner
              alerts={analysis.evaluation.alerts}
              translations={analysis.narrative.alertTranslations}
              language={language}
            />

            <BiomarkerDashboard
              biomarkers={analysis.evaluation.biomarkers}
              organSummaries={analysis.evaluation.organSummaries}
              explanations={analysis.narrative.biomarkerExplanations}
              unitSystem={unitSystem}
              language={language}
              elderMode={elderMode}
            />

            <MedicationTimetable
              medications={analysis.evaluation.medications}
              explanations={analysis.narrative.medicationExplanations}
              language={language}
              elderMode={elderMode}
              onSpeakText={(txt) => speakText(txt)}
            />

            <DoctorPrepAndVoice
              narrative={analysis.narrative}
              language={language}
              isSpeaking={isSpeaking}
              isLoadingAudio={isLoadingAudio}
              audioProviderLabel={audioProviderLabel}
              onToggleSpeak={handleToggleMainSpeech}
            />
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-neutral-900/8 bg-white py-6">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 text-xs text-[#737373] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="font-medium text-[#171717]">{t.disclaimerTitle}</span>
            <span className="mx-2">·</span>
            <span>{t.disclaimerText}</span>
          </div>
          <p className="shrink-0 font-mono text-[11px] text-[#737373]">
            ShifaClear · Khalifa University
          </p>
        </div>
      </footer>

      <ClinicalAuditDrawer
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        evaluation={analysis?.evaluation ?? null}
      />

      <QrSettingsModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        hasServerApiKey={hasServerApiKey}
        sessionApiKey={sessionApiKey}
        onSessionApiKeyChange={setSessionApiKey}
      />
    </div>
  );
}
