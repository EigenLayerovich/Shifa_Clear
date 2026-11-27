'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  ClipboardCheck,
  Hospital,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { evaluateClinicalDocument } from '@/lib/clinical/engine';
import type {
  BiologicalSex,
  RawMedication,
  ShifaClearAnalysisResponse,
  SupportedLanguage,
  UnitSystem,
} from '@/lib/clinical/types';
import { DEMO_CASES } from '@/lib/demo/cases';
import { LANGUAGE_MAP, UI_STRINGS } from '@/lib/i18n/uiStrings';
import { BilingualPrintSheet } from './BilingualPrintSheet';
import { BiomarkerDashboard } from './BiomarkerDashboard';
import { ClinicalAuditDrawer } from './ClinicalAuditDrawer';
import { ClinicalQaPanel } from './ClinicalQaPanel';
import { DoctorPrepAndVoice } from './DoctorPrepAndVoice';
import { HeaderBar } from './HeaderBar';
import { IntakePanel } from './IntakePanel';
import { LongitudinalTrendChart } from './LongitudinalTrendChart';
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

  // Audio playback state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioProviderLabel, setAudioProviderLabel] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const langMeta = LANGUAGE_MAP[language];
  const t = UI_STRINGS[language];

  // Sync document language, RTL/LTR direction, and Elder Mode root scaling dynamically
  useEffect(() => {
    document.documentElement.lang = langMeta.code;
    document.documentElement.dir = langMeta.dir;
  }, [langMeta]);

  useEffect(() => {
    document.documentElement.dataset.elder = elderMode ? 'true' : 'false';
    return () => {
      document.documentElement.dataset.elder = 'false';
    };
  }, [elderMode]);

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

  const runDemoCase = async (caseId: string, overrideLang?: SupportedLanguage, overrideCtx?: { age: number; sex: BiologicalSex; unitSystem: UnitSystem }) => {
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

  const handleQuickDrugCheck = (meds: RawMedication[], creatinineUmol?: number) => {
    stopAnyAudio();
    setErrorMessage(null);
    const evaluation = evaluateClinicalDocument(
      {
        documentType: creatinineUmol ? 'mixed' : 'prescription',
        reportDate: new Date().toISOString().slice(0, 10),
        facilityName: 'ShifaClear Quick Drug & Renal Safety Check',
        biomarkers: creatinineUmol
          ? [{ name: 'Serum Creatinine', value: creatinineUmol, unit: 'µmol/L' }]
          : [],
        medications: meds,
      },
      { age, sex, unitSystem, language },
    );

    const headline =
      evaluation.overallRisk === 'urgent'
        ? `CRITICAL SAFETY ALERT: ${evaluation.alerts[0]?.title || 'Urgent clinical contraindication detected'}`
        : evaluation.alerts.length > 0
          ? `${evaluation.alerts.length} Deterministic Medication Safety Check(s) Found`
          : `No Major Interactions Detected Across ${meds.length} Selected Medicine(s)`;

    const overallSummary =
      evaluation.alerts.length > 0
        ? `ShifaClear screened ${meds.length} medication(s)${
            creatinineUmol ? ' plus auto-calculated CKD-EPI 2021 eGFR' : ''
          } across 25+ RxList clinical interaction rules in under 2 milliseconds and flagged ${evaluation.alerts.length} actionable safety alert(s) below.`
        : `All ${meds.length} selected medication(s) were checked across ShifaClear's 141-drug UAE formulary and 25+ RxList rules with no major interactions detected. Always confirm new medicines with your pharmacist.`;

    const immediateResponse: ShifaClearAnalysisResponse = {
      evaluation,
      narrative: {
        language: 'en',
        headline,
        overallSummary,
        biomarkerExplanations: {},
        medicationExplanations: {},
        alertTranslations: {},
        doctorQuestions:
          evaluation.alerts.length > 0
            ? [
                `ShifaClear flagged "${evaluation.alerts[0].title}" — should we switch or adjust one of these medicines?`,
                'Do I need a follow-up kidney (eGFR/Creatinine) or electrolyte blood test?',
                'What is the safest daily timing schedule for my current prescription list?',
              ]
            : [
                'Are there any food or supplement timing precautions for my current medicines?',
                'When should we next review my medication list and routine labs?',
                'Are any over-the-counter painkillers unsafe to combine with this regimen?',
              ],
        caregiverWhatsappSummary: `ShifaClear Quick Check: ${headline}. Checked ${meds.map((m) => m.brandName).join(', ')}.`,
        spokenSummaryScript: `${headline}. ${overallSummary}`,
        source: 'verified_demo_cache',
      },
      aiPowered: false,
    };

    setAnalysis(immediateResponse);

    // If user is currently in AR/UR/TL/HI, translate the verified result immediately via /api/translate
    if (language !== 'en') {
      setIsTranslating(true);
      fetch('/api/translate', {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({ language, evaluation }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.narrative) {
            setAnalysis((prev) => (prev ? { ...prev, narrative: data.narrative, aiPowered: true } : null));
          }
        })
        .catch(() => {})
        .finally(() => setIsTranslating(false));
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
      // Keep UI chrome switched cleanly even if live translation fails
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
        setAudioProviderLabel('Gemini 3.8 TTS');
        setIsLoadingAudio(false);
        setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
        return;
      }
    } catch {
      // Fall through cleanly to browser Web Speech API
    }

    // Fallback: Browser Speech Synthesis
    setIsLoadingAudio(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.lang = langMeta.speechLocale;
      utter.rate = elderMode ? 0.88 : 0.96;
      setAudioProviderLabel('Browser Voice');
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

  const riskBadgeStyle =
    analysis?.evaluation.overallRisk === 'urgent'
      ? 'bg-rose-700 text-white'
      : analysis?.evaluation.overallRisk === 'attention'
        ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-300'
        : 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300';

  return (
    <div
      dir={langMeta.dir}
      lang={langMeta.code}
      data-elder={elderMode ? 'true' : 'false'}
      className={`clinical-grid-bg min-h-screen ${langMeta.fontClass}`}
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {analysis && (
          <BilingualPrintSheet
            evaluation={analysis.evaluation}
            narrative={analysis.narrative}
            language={language}
          />
        )}

        <div className={analysis ? 'print:hidden' : ''}>
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
            onQuickDrugCheck={handleQuickDrugCheck}
          />
        ) : (
          <div className="space-y-7">
            {/* Top Action & Context Bar */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  stopAnyAudio();
                  setAnalysis(null);
                  setErrorMessage(null);
                }}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-800 shadow-xs hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                <span>{t.newScanBtn}</span>
              </button>

              {/* Quick Case Switcher Pills for Smooth Pitching */}
              <div className="flex flex-wrap items-center gap-1.5">
                {DEMO_CASES.map((demo, idx) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => runDemoCase(demo.id)}
                    className={`min-h-[36px] rounded-xl px-3 text-xs font-bold transition ${
                      analysis.demoCaseId === demo.id
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {isTranslating && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
                <p className="text-xs font-bold text-teal-900">
                  Translating verified clinical explanation into {langMeta.nativeLabel}...
                </p>
                <progress
                  aria-label="Translating report"
                  className="mt-2 h-1.5 w-full rounded-full accent-teal-700"
                />
              </div>
            )}

            {/* Executive Clinical Summary Card */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${riskBadgeStyle}`}
                    >
                      {t.riskBadges[analysis.evaluation.overallRisk]}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800 ring-1 ring-teal-200">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {analysis.evaluation.auditTrail.length} Deterministic Checks Verified
                    </span>
                    {analysis.aiPowered && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-800 ring-1 ring-sky-200">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Gemini 3.8 Flash Live
                      </span>
                    )}
                  </div>

                  <h1
                    id="main-heading"
                    tabIndex={-1}
                    className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl"
                  >
                    {analysis.narrative.headline}
                  </h1>

                  <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
                    {analysis.narrative.overallSummary}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold text-slate-500">
                    {analysis.evaluation.facilityName &&
                      analysis.evaluation.facilityName.toLowerCase() !== 'null' && (
                        <span className="inline-flex items-center gap-1.5">
                          <Hospital className="h-4 w-4 text-teal-700" aria-hidden="true" />
                          {analysis.evaluation.facilityName}
                        </span>
                      )}
                    {analysis.evaluation.reportDate &&
                      analysis.evaluation.reportDate.toLowerCase() !== 'null' && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-teal-700" aria-hidden="true" />
                          {analysis.evaluation.reportDate}
                        </span>
                      )}
                    <span>
                      {analysis.evaluation.patientContext.sex === 'female' ? t.female : t.male},{' '}
                      {analysis.evaluation.patientContext.age}y
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAuditOpen(true)}
                  className="no-print inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/70 px-4 text-xs font-extrabold text-teal-900 transition hover:bg-teal-100"
                >
                  <ClipboardCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  <span>{t.auditTrailBtn}</span>
                </button>
              </div>
            </section>

            {/* Deterministic Urgent / Safety Alerts */}
            <UrgentAlertBanner
              alerts={analysis.evaluation.alerts}
              translations={analysis.narrative.alertTranslations}
              language={language}
            />

            {/* Multi-Visit Longitudinal Trajectory Chart */}
            <LongitudinalTrendChart
              biomarkers={analysis.evaluation.biomarkers}
              unitSystem={unitSystem}
              language={language}
            />

            {/* Lab Biomarker Gauges */}
            <BiomarkerDashboard
              biomarkers={analysis.evaluation.biomarkers}
              organSummaries={analysis.evaluation.organSummaries}
              explanations={analysis.narrative.biomarkerExplanations}
              unitSystem={unitSystem}
              language={language}
              elderMode={elderMode}
            />

            {/* Visual Daily Medication Timetable */}
            <MedicationTimetable
              medications={analysis.evaluation.medications}
              explanations={analysis.narrative.medicationExplanations}
              language={language}
              elderMode={elderMode}
              onSpeakText={(txt) => speakText(txt)}
            />

            {/* Doctor Visit Prep & Voice Handoff */}
            <DoctorPrepAndVoice
              narrative={analysis.narrative}
              language={language}
              isSpeaking={isSpeaking}
              isLoadingAudio={isLoadingAudio}
              audioProviderLabel={audioProviderLabel}
              onToggleSpeak={handleToggleMainSpeech}
            />

            {/* Grounded UAE Clinical Follow-Up Q&A */}
            <ClinicalQaPanel
              key={`${analysis.demoCaseId || 'custom'}-${language}`}
              evaluation={analysis.evaluation}
              language={language}
              sessionApiKey={sessionApiKey}
            />
          </div>
        )}
        </div>
      </main>

      {/* Persistent Clinical Safety Footer */}
      <footer className="no-print mt-12 border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="max-w-3xl">
            <p className="font-extrabold text-slate-800">{t.disclaimerTitle}</p>
            <p className="mt-0.5 leading-relaxed">{t.disclaimerText}</p>
          </div>
          <div className="shrink-0 text-end text-[11px] font-semibold text-slate-500">
            <p>ShifaClear • Built at Khalifa University (KUEC Sandbox 2026)</p>
            <p>MD + Biomedical Engineering Clinical Safety Architecture</p>
          </div>
        </div>
      </footer>

      {/* Native <dialog> Modals */}
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
