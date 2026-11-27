'use client';

import React from 'react';
import {
  Activity,
  Baby,
  ClipboardCheck,
  Globe,
  Pill,
  QrCode,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import type { SupportedLanguage, UnitSystem } from '@/lib/clinical/types';
import { LANGUAGES, UI_STRINGS } from '@/lib/i18n/uiStrings';

export type FamilyProfileKey = 'self' | 'parent' | 'child' | 'custom';

interface HeaderBarProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  unitSystem: UnitSystem;
  onUnitSystemChange: (unit: UnitSystem) => void;
  elderMode: boolean;
  onElderModeChange: (enabled: boolean) => void;
  familyProfile: FamilyProfileKey;
  onSelectFamilyProfile: (profile: 'self' | 'parent' | 'child') => void;
  hasEvaluation: boolean;
  onOpenDrugChecker: () => void;
  onOpenAudit: () => void;
  onOpenQrSettings: () => void;
  onResetHome: () => void;
}

export function HeaderBar({
  language,
  onLanguageChange,
  unitSystem,
  onUnitSystemChange,
  elderMode,
  onElderModeChange,
  familyProfile,
  onSelectFamilyProfile,
  hasEvaluation,
  onOpenDrugChecker,
  onOpenAudit,
  onOpenQrSettings,
  onResetHome,
}: HeaderBarProps) {
  const t = UI_STRINGS[language];

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <a
        href="#main-heading"
        className="visually-hidden fixed top-2 start-2 z-50 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-lg"
      >
        {t.skipToMain}
      </a>

      <div className="mx-auto flex max-w-7xl flex-col gap-2.5 px-4 py-2.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand lockup */}
        <div className="flex shrink-0 items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetHome}
            className="group flex items-center gap-2.5 rounded-xl text-start transition hover:opacity-95"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-700 to-emerald-600 text-white shadow-sm ring-1 ring-teal-800/10">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-slate-900">
                  ShifaClear
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 ring-1 ring-teal-200">
                  <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
                  MD Guardrails
                </span>
              </span>
              <span className="hidden text-[11px] font-medium text-slate-500 xl:block">
                {t.tagline}
              </span>
            </span>
          </button>

          {/* Compact mobile action buttons */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              type="button"
              onClick={onOpenDrugChecker}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 text-xs font-bold text-teal-900 hover:bg-teal-100"
            >
              <Pill className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              <span>Drugs</span>
            </button>
            <button
              type="button"
              onClick={onOpenAudit}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <ClipboardCheck className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              <span>{hasEvaluation ? t.auditTrailBtn : '12/12'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenQrSettings}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              aria-label={t.qrSettingsBtn}
            >
              <QrCode className="h-4 w-4 text-teal-700" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Single-Row Compact Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 lg:flex-nowrap lg:justify-end">
          {/* Compact Script Language Dropdown */}
          <div className="inline-flex items-center gap-1.5">
            <label htmlFor="language-select" className="visually-hidden">
              Select Language
            </label>
            <Globe className="hidden h-4 w-4 shrink-0 text-teal-700 sm:block" aria-hidden="true" />
            <select
              id="language-select"
              name="language"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="clinical-lang-select"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} lang={lang.code}>
                  {lang.code === 'en'
                    ? 'English'
                    : `${lang.nativeLabel} (${lang.englishLabel})`}
                </option>
              ))}
            </select>
          </div>

          {/* SI / US Units Switcher */}
          <div
            role="group"
            aria-label={t.unitsLabel}
            className="inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-bold"
          >
            <button
              type="button"
              aria-pressed={unitSystem === 'SI'}
              onClick={() => onUnitSystemChange('SI')}
              className={`min-h-[32px] whitespace-nowrap rounded-lg px-2 transition ${
                unitSystem === 'SI'
                  ? 'bg-white text-teal-800 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              SI
            </button>
            <button
              type="button"
              aria-pressed={unitSystem === 'US'}
              onClick={() => onUnitSystemChange('US')}
              className={`min-h-[32px] whitespace-nowrap rounded-lg px-2 transition ${
                unitSystem === 'US'
                  ? 'bg-white text-teal-800 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              US
            </button>
          </div>

          {/* Family Profile Switcher (Self / Parent / Child) */}
          <div
            role="group"
            aria-label="Family Profile"
            className="inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-bold"
          >
            {(
              [
                { id: 'self', label: 'Self', Icon: User },
                { id: 'parent', label: 'Parent', Icon: Users },
                { id: 'child', label: 'Child', Icon: Baby },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = familyProfile === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectFamilyProfile(id)}
                  className={`inline-flex min-h-[32px] items-center gap-1 whitespace-nowrap rounded-lg px-2 transition ${
                    active
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Native HTML Switch for Elder Mode */}
          <label
            htmlFor="elder-mode-switch"
            className={`inline-flex min-h-[36px] shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border px-2.5 py-1 text-[11px] font-bold transition ${
              elderMode
                ? 'border-teal-700 bg-teal-50 text-teal-900'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>{t.elderMode}</span>
            <input
              id="elder-mode-switch"
              type="checkbox"
              checked={elderMode}
              onChange={(e) => onElderModeChange(e.target.checked)}
              {...({ switch: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          </label>

          {/* Desktop Action Buttons */}
          <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
            <button
              type="button"
              onClick={onOpenDrugChecker}
              className="inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-xl bg-teal-700 px-2.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-teal-800"
            >
              <Pill className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Drug Checker</span>
            </button>
            <button
              type="button"
              onClick={onOpenAudit}
              className="inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-xl border border-teal-200 bg-teal-50/70 px-2.5 text-[11px] font-bold text-teal-900 transition hover:bg-teal-100"
            >
              <ClipboardCheck className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              <span>{hasEvaluation ? t.auditTrailBtn : '12/12'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenQrSettings}
              className="inline-flex min-h-[36px] items-center gap-1 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <QrCode className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              <span>{t.qrSettingsBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
