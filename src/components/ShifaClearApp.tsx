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
import { getSafeDisplayNarrative } from '@/lib/clinical/factCheck';
import type {
  BiologicalSex,
  RawMedication,
  ReadingLevel,
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
import { HeaderBar, type FamilyProfileKey, type ThemePreference } from './HeaderBar';
import { IntakePanel } from './IntakePanel';
import { LongitudinalTrendChart } from './LongitudinalTrendChart';
import { MedicationTimetable } from './MedicationTimetable';
import { QrSettingsModal } from './QrSettingsModal';
import { QuickDrugCheckerModal } from './QuickDrugCheckerModal';
import { UrgentAlertBanner } from './UrgentAlertBanner';

interface ShifaClearAppProps {
  hasServerApiKey: boolean;
}

export function ShifaClearApp({ hasServerApiKey }: ShifaClearAppProps) {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('SI');
  const [elderMode, setElderMode] = useState(false);
  const [familyProfile, setFamilyProfile] = useState<FamilyProfileKey>('self');
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>('standard');
  const [age, setAge] = useState(54);
  const [sex, setSex] = useState<BiologicalSex>('male');

  const [analysis, setAnalysis] = useState<ShifaClearAnalysisResponse | null>(null);
  const [savedOfflineReport, setSavedOfflineReport] = useState<ShifaClearAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [auditOpen, setAuditOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [drugCheckerOpen, setDrugCheckerOpen] = useState(false);
  const [sessionApiKey, setSessionApiKey] = useState('');
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [systemIsDark, setSystemIsDark] = useState(false);

  // Audio playback & live teleprompter state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioProviderLabel, setAudioProviderLabel] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechTimerRef = useRef<number | null>(null);

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

  // Sync color-scheme <meta>, localStorage, cross-tab storage events, and OS preference changes
  const applyColorSchemeMeta = (pref: ThemePreference) => {
    if (typeof document === 'undefined') return;
    const metas = Array.from(
      document.querySelectorAll('meta[name="color-scheme"]'),
    ) as HTMLMetaElement[];
    const content = pref === 'system' ? 'light dark' : pref;
    if (metas.length === 0) {
      const meta = document.createElement('meta');
      meta.name = 'color-scheme';
      meta.content = content;
      document.head.appendChild(meta);
    } else {
      metas[0].content = content;
      // Remove any duplicate <meta name="color-scheme"> tags so CSS :has() stays unambiguous
      for (let i = 1; i < metas.length; i++) {
        metas[i].remove();
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(mq.matches);

    const readStoredTheme = (): ThemePreference => {
      try {
        const stored = window.localStorage.getItem('color-scheme');
        if (stored === 'light' || stored === 'dark') return stored;
      } catch {
        // Storage unavailable; stay on system preference
      }
      return 'system';
    };

    const initial = readStoredTheme();
    setThemePreference(initial);
    applyColorSchemeMeta(initial);

    // Track OS preference changes (never retroactively delete a pinned user override)
    const onMqChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    mq.addEventListener('change', onMqChange);

    // Stay in sync if theme changes in another tab
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'color-scheme' || e.key === null) {
        const next = readStoredTheme();
        setThemePreference(next);
        applyColorSchemeMeta(next);
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      mq.removeEventListener('change', onMqChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleSelectThemePreference = (next: ThemePreference) => {
    setThemePreference(next);
    applyColorSchemeMeta(next);
    try {
      if (next === 'system') {
        window.localStorage.removeItem('color-scheme');
      } else {
        window.localStorage.setItem('color-scheme', next);
      }
    } catch {
      // Theme still applied to DOM even if storage is blocked
    }
  };

  // Two-state header toggle per modern-web-guidance:
  // Target = opposite of currently rendered scheme; revert to system (remove stored) when target matches OS
  const handleToggleTheme = () => {
    const renderedDark =
      themePreference === 'dark' || (themePreference === 'system' && systemIsDark);
    const target: 'light' | 'dark' = renderedDark ? 'light' : 'dark';
    const osScheme: 'light' | 'dark' = systemIsDark ? 'dark' : 'light';
    if (target === osScheme) {
      handleSelectThemePreference('system');
    } else {
      handleSelectThemePreference(target);
    }
  };

  // Register Offline PWA Service Worker & hydrate last cached clinical report
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    try {
      const cached = window.localStorage.getItem('shifaclear_last_report_v1');
      if (cached) {
        const parsed = JSON.parse(cached) as ShifaClearAnalysisResponse;
        if (parsed?.evaluation && parsed?.narrative) {
          setSavedOfflineReport(parsed);
        }
      }
    } catch {
      // Ignore storage read issues
    }
  }, []);

  // Automatically persist the latest verified analysis locally for offline PWA access
  useEffect(() => {
    if (!analysis || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('shifaclear_last_report_v1', JSON.stringify(analysis));
      setSavedOfflineReport(analysis);
    } catch {
      // Ignore quota errors
    }
  }, [analysis]);

  const stopAnyAudio = () => {
    if (speechTimerRef.current !== null) {
      window.clearInterval(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsLoadingAudio(false);
    setAudioProgress(0);
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
            readingLevel,
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

  const compressLargeImageIfNeeded = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/') || file.size <= 1.2 * 1024 * 1024) {
      return file;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.82),
      );
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
    } catch {
      return file;
    }
  };

  const handleAnalyzeFiles = async (files: File[]) => {
    if (files.length === 0) return;
    stopAnyAudio();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const formData = new FormData();
      for (const f of files) {
        const readyFile = await compressLargeImageIfNeeded(f);
        formData.append('files', readyFile);
      }
      formData.append(
        'patientContext',
        JSON.stringify({ age, sex, unitSystem, language, readingLevel }),
      );

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: buildHeaders(false),
        body: formData,
      });
      const data = (await res.json()) as ShifaClearAnalysisResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not analyze uploaded document(s).');
      if (data.evaluation?.patientContext?.autoDetectedFromReport) {
        setAge(Math.max(1, Math.round(data.evaluation.patientContext.age)));
        setSex(data.evaluation.patientContext.sex);
      }
      setAnalysis(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload analysis failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDrugCheck = (
    meds: RawMedication[],
    creatinineUmol?: number,
    overrideAge?: number,
    overrideSex?: BiologicalSex,
  ) => {
    stopAnyAudio();
    setErrorMessage(null);
    const effectiveAge = overrideAge ?? age;
    const effectiveSex = overrideSex ?? sex;
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
      {
        age: effectiveAge,
        isPediatric: effectiveAge < 18,
        sex: effectiveSex,
        unitSystem,
        language,
      },
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
          patientContext: { age, sex, unitSystem, language, readingLevel },
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

  const handleSelectFamilyProfile = (profile: 'self' | 'parent' | 'child') => {
    const presets: Record<'self' | 'parent' | 'child', { age: number; sex: BiologicalSex }> = {
      self: { age: 35, sex: 'male' },
      parent: { age: 72, sex: 'female' },
      child: { age: 5, sex: 'female' },
    };
    const next = presets[profile];
    setFamilyProfile(profile);
    setAge(next.age);
    setSex(next.sex);

    // Deterministically re-evaluate the currently open report under the new age/sex bounds in <2ms
    if (analysis) {
      const ev = analysis.evaluation;
      const reEvaluated = evaluateClinicalDocument(
        {
          documentType: ev.documentType,
          reportDate: ev.reportDate,
          priorReportDate: ev.priorReportDate,
          facilityName: ev.facilityName,
          biomarkers: ev.biomarkers
            .filter((b) => !b.isCalculated)
            .map((b) => ({
              name: b.displayName,
              value: b.originalValue,
              unit: b.originalUnit,
              history: b.historySI?.slice(0, -1).map((h) => ({ date: h.date, value: h.value, unit: b.siUnit })),
            })),
          priorBiomarkers: ev.biomarkers
            .filter((b) => b.priorSiValue !== undefined && !b.isCalculated)
            .map((b) => ({
              name: b.displayName,
              value: b.priorSiValue!,
              unit: b.siUnit,
            })),
          medications: ev.medications.map((m) => ({
            brandName: m.brandName,
            genericName: m.genericName,
            dose: m.dose,
            frequency: m.frequencyRaw,
            timingNotes: m.timingInstruction,
            duration: m.duration,
          })),
        },
        {
          age: next.age,
          isPediatric: next.age < 18,
          sex: next.sex,
          unitSystem,
          language,
        },
      );
      setAnalysis((prev) => (prev ? { ...prev, evaluation: reEvaluated } : null));
    }
  };

  const handleReadingLevelChange = async (newLevel: ReadingLevel) => {
    setReadingLevel(newLevel);
    if (!analysis) return;

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({
          language,
          readingLevel: newLevel,
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
                    readingLevel: newLevel,
                  },
                  factCheck: data.factCheck ?? prev.evaluation.factCheck,
                },
                narrative: data.narrative,
                aiPowered: data.narrative.source === 'gemini_live' || prev.aiPowered,
              }
            : null,
        );
      }
    } catch {
      // Keep current narrative cleanly
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLanguageChange = async (newLang: SupportedLanguage) => {
    stopAnyAudio();
    const applyLang = () => setLanguage(newLang);
    const prevDir = LANGUAGE_MAP[language].dir;
    const nextDir = LANGUAGE_MAP[newLang].dir;

    // Progressive View Transitions API reflow when flipping LTR <-> RTL (per modern-web-guidance)
    if (
      prevDir !== nextDir &&
      typeof document !== 'undefined' &&
      'startViewTransition' in document
    ) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(
        applyLang,
      );
    } else {
      applyLang();
    }

    if (!analysis) return;

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({
          language: newLang,
          readingLevel,
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
        setAudioProgress(0);
        audio.ontimeupdate = () => {
          if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
            setAudioProgress(Math.min(1, audio.currentTime / audio.duration));
          }
        };
        audio.onended = () => {
          setIsSpeaking(false);
          setAudioProgress(0);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setAudioProgress(0);
        };
        await audio.play();
        return;
      }
    } catch {
      // Fall through cleanly to browser Web Speech API
    }

    // Fallback: Browser Speech Synthesis with live teleprompter progress
    setIsLoadingAudio(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.lang = langMeta.speechLocale;
      utter.rate = elderMode ? 0.88 : 0.96;
      setAudioProviderLabel('Browser Voice');
      setIsSpeaking(true);
      setAudioProgress(0);

      const estimatedMs = Math.max(3000, (textToSpeak.length / 13.5) * 1000);
      const startedAt = Date.now();
      let gotBoundary = false;

      utter.onboundary = (event) => {
        if (typeof event.charIndex === 'number' && textToSpeak.length > 0) {
          gotBoundary = true;
          setAudioProgress(Math.min(0.99, event.charIndex / textToSpeak.length));
        }
      };

      speechTimerRef.current = window.setInterval(() => {
        if (!gotBoundary) {
          setAudioProgress(Math.min(0.98, (Date.now() - startedAt) / estimatedMs));
        }
      }, 220);

      utter.onend = () => {
        if (speechTimerRef.current !== null) {
          window.clearInterval(speechTimerRef.current);
          speechTimerRef.current = null;
        }
        setIsSpeaking(false);
        setAudioProgress(0);
      };
      utter.onerror = () => {
        if (speechTimerRef.current !== null) {
          window.clearInterval(speechTimerRef.current);
          speechTimerRef.current = null;
        }
        setIsSpeaking(false);
        setAudioProgress(0);
      };
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
        familyProfile={familyProfile}
        onSelectFamilyProfile={handleSelectFamilyProfile}
        hasEvaluation={Boolean(analysis)}
        onToggleTheme={handleToggleTheme}
        onOpenDrugChecker={() => setDrugCheckerOpen(true)}
        onOpenAudit={() => setAuditOpen(true)}
        onOpenQrSettings={() => setQrOpen(true)}
        onResetHome={() => {
          stopAnyAudio();
          setAnalysis(null);
          setErrorMessage(null);
        }}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
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
            readingLevel={readingLevel}
            onAgeChange={(val) => {
              setAge(val);
              setFamilyProfile('custom');
            }}
            onSexChange={(val) => {
              setSex(val);
              setFamilyProfile('custom');
            }}
            onReadingLevelChange={setReadingLevel}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onAnalyzeFiles={handleAnalyzeFiles}
            onAnalyzeText={handleAnalyzeText}
            onSelectDemoCase={(id) => runDemoCase(id)}
            savedOfflineHeadline={savedOfflineReport?.narrative.headline ?? null}
            onRestoreOfflineReport={
              savedOfflineReport
                ? () => {
                    setAnalysis(savedOfflineReport);
                    setAge(savedOfflineReport.evaluation.patientContext.age);
                    setSex(savedOfflineReport.evaluation.patientContext.sex);
                  }
                : undefined
            }
            onClearOfflineReport={
              savedOfflineReport
                ? () => {
                    try {
                      window.localStorage.removeItem('shifaclear_last_report_v1');
                    } catch {
                      // ignore storage error
                    }
                    setSavedOfflineReport(null);
                  }
                : undefined
            }
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
            <section className="editorial-sheet rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${riskBadgeStyle}`}
                    >
                      {t.riskBadges[analysis.evaluation.overallRisk]}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#DCE5E2] bg-[#F2F7F5] px-2.5 py-1 text-[11px] font-semibold text-[#0D5C56]">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {analysis.evaluation.auditTrail.length} Deterministic Checks Verified
                    </span>
                    {analysis.evaluation.factCheck && (
                      analysis.evaluation.factCheck.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
                          Fact Preservation {analysis.evaluation.factCheck.scorePercent}% · 0 Invented
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-950">
                          AI Summary Held · Deterministic Clinical View
                        </span>
                      )
                    )}
                    {analysis.aiPowered && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#E7E3DA] bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-medium text-[#57534E]">
                        <Sparkles className="h-3 w-3 text-[#0D5C56]" aria-hidden="true" />
                        Gemini 3.8 Flash Live
                      </span>
                    )}
                  </div>

                  {(() => {
                    const safeDisplay = getSafeDisplayNarrative(analysis.evaluation, analysis.narrative);
                    return (
                      <>
                        <h1
                          id="main-heading"
                          tabIndex={-1}
                          className="font-editorial text-2xl font-medium tracking-tight text-[#18181B] sm:text-3xl"
                        >
                          {safeDisplay.headline}
                        </h1>

                        <p className="max-w-3xl text-sm leading-relaxed text-[#57534E] sm:text-[15px]">
                          {safeDisplay.overallSummary}
                        </p>
                      </>
                    );
                  })()}

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
                      {analysis.evaluation.patientContext.ageLabel || `${analysis.evaluation.patientContext.age}y`}
                    </span>
                    {analysis.evaluation.patientContext.isPediatric && (
                      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-extrabold text-teal-900">
                        Pediatric Ranges Active
                      </span>
                    )}
                    {analysis.evaluation.patientContext.autoDetectedFromReport && (
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 ring-1 ring-sky-200">
                        Auto-detected from report
                      </span>
                    )}
                  </div>
                </div>

                <div className="no-print flex shrink-0 flex-wrap items-center gap-2">
                  {/* Live Reading-Level Switcher (Simple / Standard / Clinical) */}
                  <div
                    role="group"
                    aria-label="Explanation Reading Level"
                    className="inline-flex items-center rounded-xl border border-[#E2DDD2] bg-[#F3F1EC] p-0.5 text-[11px] font-semibold"
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
                        onClick={() => handleReadingLevelChange(lvl.id)}
                        className={`min-h-[34px] rounded-lg px-2.5 transition ${
                          readingLevel === lvl.id
                            ? 'bg-[#0D5C56] text-white shadow-2xs'
                            : 'text-[#57534E] hover:text-[#18181B]'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setAuditOpen(true)}
                    className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border border-[#DCE5E2] bg-[#F2F7F5] px-4 text-xs font-semibold text-[#0D5C56] transition hover:bg-[#0D5C56] hover:text-white"
                  >
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                    <span>{t.auditTrailBtn}</span>
                  </button>
                </div>
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
              patientAge={analysis.evaluation.patientContext.age}
              patientSex={analysis.evaluation.patientContext.sex}
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
              evaluation={analysis.evaluation}
              narrative={analysis.narrative}
              language={language}
              unitSystem={unitSystem}
              isSpeaking={isSpeaking}
              isLoadingAudio={isLoadingAudio}
              audioProgress={audioProgress}
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
      <footer className="no-print mt-14 border-t border-[#E7E3DA] bg-[#FAF9F6] py-7">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-xs text-[#57534E] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="max-w-3xl">
            <p className="font-semibold text-[#18181B]">{t.disclaimerTitle}</p>
            <p className="mt-0.5 leading-relaxed">{t.disclaimerText}</p>
          </div>
          <div className="shrink-0 text-end text-[11px] font-medium text-[#78716C]">
            <p>ShifaClear · Khalifa University (KUEC Sandbox 2026)</p>
            <p>MD + Biomedical Engineering Clinical Safety Architecture</p>
          </div>
        </div>
      </footer>

      {/* Native <dialog> Modals */}
      <QuickDrugCheckerModal
        open={drugCheckerOpen}
        onClose={() => setDrugCheckerOpen(false)}
        defaultAge={age}
        defaultSex={sex}
        sessionApiKey={sessionApiKey}
        onSubmitCheck={handleQuickDrugCheck}
      />

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
        themePreference={themePreference}
        systemIsDark={systemIsDark}
        onSelectThemePreference={handleSelectThemePreference}
      />
    </div>
  );
}
