'use client';

import React from 'react';
import {
  ClipboardCheck,
  Globe,
  Moon,
  Pill,
  QrCode,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import type { SupportedLanguage, UnitSystem } from '@/lib/clinical/types';
import { LANGUAGES, UI_STRINGS } from '@/lib/i18n/uiStrings';
import { ShifaClearLogo } from './ShifaClearLogo';

export type FamilyProfileKey = 'self' | 'parent' | 'child' | 'custom';
export type ThemePreference = 'system' | 'light' | 'dark';

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
  onToggleTheme: () => void;
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
  onToggleTheme,
  onOpenDrugChecker,
  onOpenAudit,
  onOpenQrSettings,
  onResetHome,
}: HeaderBarProps) {
  const t = UI_STRINGS[language];

  return (
    <header className="no-print sticky top-0 z-30 border-b border-[#E7E3DA] bg-[#FAF9F6]/92 backdrop-blur-md">
      <a
        href="#main-heading"
        className="visually-hidden fixed top-2 start-2 z-50 rounded-lg bg-[#0D5C56] px-4 py-2 text-sm font-semibold text-white shadow-lg"
      >
        {t.skipToMain}
      </a>

      <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand lockup */}
        <div className="flex shrink-0 items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetHome}
            className="group flex items-center gap-2.5 rounded-xl text-start transition hover:opacity-95"
          >
            <ShifaClearLogo
              size={38}
              className="shadow-xs transition-transform duration-200 group-hover:scale-[1.03]"
            />
            <span>
              <span className="flex items-baseline gap-2">
                <span className="font-editorial text-[23px] font-medium leading-none tracking-tight text-[#18181B]">
                  Shifa<em className="italic text-[#0D5C56]">Clear</em>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap border-s border-[#DDD8CE] ps-2 text-[10px] font-semibold uppercase tracking-wider text-[#0D5C56]">
                  <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
                  MD Guardrails
                </span>
              </span>
            </span>
          </button>

          {/* Compact mobile action buttons */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              type="button"
              onClick={onOpenDrugChecker}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#0D5C56] px-2.5 text-xs font-semibold text-white hover:bg-[#094742]"
            >
              <Pill className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Drugs</span>
            </button>
            <button
              type="button"
              onClick={onOpenAudit}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#E2DDD2] bg-white px-2.5 text-xs font-medium text-[#18181B] hover:bg-[#F3F1EC]"
            >
              <ClipboardCheck className="h-3.5 w-3.5 text-[#0D5C56]" aria-hidden="true" />
              <span>{hasEvaluation ? t.auditTrailBtn : '12/12'}</span>
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              title="Toggle light or dark theme"
              className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-[#E2DDD2] bg-white text-[#18181B] hover:bg-[#F3F1EC]"
            >
              <span className="theme-show-when-light inline-flex items-center">
                <Moon className="h-4 w-4 text-[#0D5C56]" aria-hidden="true" />
                <span className="visually-hidden">Switch to dark theme</span>
              </span>
              <span className="theme-show-when-dark items-center">
                <Sun className="h-4 w-4 text-[#0D5C56]" aria-hidden="true" />
                <span className="visually-hidden">Switch to light theme</span>
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenQrSettings}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#E2DDD2] bg-white px-2.5 text-xs font-medium text-[#18181B] hover:bg-[#F3F1EC]"
              aria-label={t.qrSettingsBtn}
            >
              <QrCode className="h-4 w-4 text-[#0D5C56]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Single-Row Compact Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 lg:flex-nowrap lg:justify-end">
          {/* Compact Script Language Dropdown */}
          <div className="inline-flex items-center gap-1.5">
            <label htmlFor="language-select" className="visually-hidden">
              Select Language
            </label>
            <Globe className="hidden h-3.5 w-3.5 shrink-0 text-[#57534E] sm:block" aria-hidden="true" />
            <select
              id="language-select"
              name="language"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="clinical-lang-select"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} lang={lang.code}>
                  {lang.nativeLabel}
                </option>
              ))}
            </select>
          </div>

          {/* SI / US Units Switcher */}
          <div
            role="group"
            aria-label={t.unitsLabel}
            className="inline-flex shrink-0 items-center rounded-lg border border-[#E2DDD2] bg-[#F3F1EC] p-0.5 text-[11px] font-semibold"
          >
            <button
              type="button"
              aria-pressed={unitSystem === 'SI'}
              onClick={() => onUnitSystemChange('SI')}
              className={`min-h-[30px] whitespace-nowrap rounded-md px-2 transition ${
                unitSystem === 'SI'
                  ? 'bg-white text-[#18181B] shadow-2xs ring-1 ring-[#E2DDD2]'
                  : 'text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              SI
            </button>
            <button
              type="button"
              aria-pressed={unitSystem === 'US'}
              onClick={() => onUnitSystemChange('US')}
              className={`min-h-[30px] whitespace-nowrap rounded-md px-2 transition ${
                unitSystem === 'US'
                  ? 'bg-white text-[#18181B] shadow-2xs ring-1 ring-[#E2DDD2]'
                  : 'text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              US
            </button>
          </div>

          {/* Family Profile Switcher (Self / Parent / Child) */}
          <div
            role="group"
            aria-label="Family Profile"
            className="inline-flex shrink-0 items-center rounded-lg border border-[#E2DDD2] bg-[#F3F1EC] p-0.5 text-[11px] font-semibold"
          >
            {(
              [
                { id: 'self', label: 'Self' },
                { id: 'parent', label: 'Parent' },
                { id: 'child', label: 'Child' },
              ] as const
            ).map(({ id, label }) => {
              const active = familyProfile === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectFamilyProfile(id)}
                  className={`inline-flex min-h-[30px] items-center whitespace-nowrap rounded-md px-2.5 transition ${
                    active
                      ? 'bg-[#18181B] text-[#FAF9F6] shadow-2xs'
                      : 'text-[#57534E] hover:bg-white/70 hover:text-[#18181B]'
                  }`}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Native HTML Switch for Elder Mode */}
          <label
            htmlFor="elder-mode-switch"
            className={`inline-flex min-h-[34px] shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
              elderMode
                ? 'border-[#0D5C56] bg-[#EDF5F4] text-[#0D5C56]'
                : 'border-[#E2DDD2] bg-white text-[#57534E] hover:border-[#CBC4B6] hover:text-[#18181B]'
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
              className="inline-flex min-h-[34px] items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#0D5C56] px-3 text-[11px] font-semibold text-white transition hover:bg-[#094742]"
            >
              <Pill className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Drug Checker</span>
            </button>
            <button
              type="button"
              onClick={onOpenAudit}
              className="inline-flex min-h-[34px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E2DDD2] bg-white px-2.5 text-[11px] font-semibold text-[#18181B] transition hover:bg-[#F3F1EC]"
            >
              <ClipboardCheck className="h-3.5 w-3.5 text-[#0D5C56]" aria-hidden="true" />
              <span>{hasEvaluation ? t.auditTrailBtn : '12/12'}</span>
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              title="Toggle light or dark theme"
              className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-[#E2DDD2] bg-white text-[#57534E] transition hover:bg-[#F3F1EC] hover:text-[#18181B]"
            >
              <span className="theme-show-when-light inline-flex items-center">
                <Moon className="h-3.5 w-3.5 text-[#0D5C56]" aria-hidden="true" />
                <span className="visually-hidden">Switch to dark theme</span>
              </span>
              <span className="theme-show-when-dark items-center">
                <Sun className="h-3.5 w-3.5 text-[#0D5C56]" aria-hidden="true" />
                <span className="visually-hidden">Switch to light theme</span>
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenQrSettings}
              aria-label={t.qrSettingsBtn}
              title={t.qrSettingsBtn}
              className="inline-flex min-h-[34px] items-center gap-1 whitespace-nowrap rounded-lg border border-[#E2DDD2] bg-white px-2.5 text-[11px] font-semibold text-[#57534E] transition hover:bg-[#F3F1EC] hover:text-[#18181B]"
            >
              <QrCode className="h-3.5 w-3.5 text-[#0D5C56]" aria-hidden="true" />
              <span>QR</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
