'use client';

import React from 'react';
import { ClipboardCheck, QrCode } from 'lucide-react';
import type { SupportedLanguage, UnitSystem } from '@/lib/clinical/types';
import { LANGUAGES, UI_STRINGS } from '@/lib/i18n/uiStrings';

interface HeaderBarProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  unitSystem: UnitSystem;
  onUnitSystemChange: (unit: UnitSystem) => void;
  elderMode: boolean;
  onElderModeChange: (enabled: boolean) => void;
  hasEvaluation: boolean;
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
  hasEvaluation,
  onOpenAudit,
  onOpenQrSettings,
  onResetHome,
}: HeaderBarProps) {
  const t = UI_STRINGS[language];

  return (
    <header className="no-print sticky top-0 z-30 border-b border-neutral-900/8 bg-white/95 backdrop-blur-sm">
      <a
        href="#main-heading"
        className="visually-hidden fixed top-2 start-2 z-50 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-medium text-white"
      >
        {t.skipToMain}
      </a>

      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
        {/* Flat clinical brand mark + wordmark */}
        <button
          type="button"
          onClick={onResetHome}
          className="inline-flex h-9 shrink-0 items-center gap-2.5 rounded-lg text-start transition-opacity duration-150 hover:opacity-80"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="24" height="24" rx="6" fill="#0f766e" />
            <path
              d="M12 6.5V17.5M6.5 12H17.5"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[17px] font-semibold leading-none text-[#171717]">
            ShifaClear
          </span>
        </button>

        {/* Quiet single-row utility controls */}
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          {/* 5-Language Segmented Bar */}
          <nav
            aria-label="Language"
            className="inline-flex items-center gap-0.5 rounded-lg bg-[#f4f4f5] p-1"
          >
            {LANGUAGES.map((lang) => {
              const active = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  lang={lang.code}
                  aria-pressed={active}
                  onClick={() => onLanguageChange(lang.code)}
                  className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-neutral-900/8'
                      : 'text-[#525252] hover:text-[#171717]'
                  }`}
                >
                  {lang.nativeLabel}
                </button>
              );
            })}
          </nav>

          {/* SI / US Unit Switcher */}
          <div
            role="group"
            aria-label={t.unitsLabel}
            className="inline-flex items-center gap-0.5 rounded-lg bg-[#f4f4f5] p-1 text-xs font-medium"
          >
            <button
              type="button"
              aria-pressed={unitSystem === 'SI'}
              onClick={() => onUnitSystemChange('SI')}
              className={`h-7 rounded-md px-2 font-mono transition-colors duration-150 ${
                unitSystem === 'SI'
                  ? 'bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-neutral-900/8'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              SI
            </button>
            <button
              type="button"
              aria-pressed={unitSystem === 'US'}
              onClick={() => onUnitSystemChange('US')}
              className={`h-7 rounded-md px-2 font-mono transition-colors duration-150 ${
                unitSystem === 'US'
                  ? 'bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-neutral-900/8'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              US
            </button>
          </div>

          {/* Native HTML Switch for Large Print / Elder Mode */}
          <label
            htmlFor="elder-mode-switch"
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-neutral-900/10 bg-white px-3 text-xs font-medium text-[#525252] transition-colors duration-150 hover:text-[#171717]"
          >
            <span className="whitespace-nowrap">{t.elderMode}</span>
            <input
              id="elder-mode-switch"
              type="checkbox"
              checked={elderMode}
              onChange={(e) => onElderModeChange(e.target.checked)}
              {...({ switch: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          </label>

          {hasEvaluation && (
            <button
              type="button"
              onClick={onOpenAudit}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-900/10 bg-white px-3 text-xs font-medium text-[#171717] transition-colors duration-150 hover:bg-[#f4f4f5] active:scale-[0.98]"
            >
              <ClipboardCheck className="h-4 w-4 shrink-0 text-[#525252]" strokeWidth={1.5} aria-hidden="true" />
              <span className="whitespace-nowrap">{t.auditTrailBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenQrSettings}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-900/10 bg-white px-3 text-xs font-medium text-[#171717] transition-colors duration-150 hover:bg-[#f4f4f5] active:scale-[0.98]"
          >
            <QrCode className="h-4 w-4 shrink-0 text-[#525252]" strokeWidth={1.5} aria-hidden="true" />
            <span className="whitespace-nowrap">{t.qrSettingsBtn}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
