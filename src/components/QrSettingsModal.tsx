'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, KeyRound, Monitor, Moon, QrCode, ShieldCheck, Sun, X } from 'lucide-react';
import type { ThemePreference } from './HeaderBar';

interface QrSettingsModalProps {
  open: boolean;
  onClose: () => void;
  hasServerApiKey: boolean;
  sessionApiKey: string;
  onSessionApiKeyChange: (key: string) => void;
  themePreference: ThemePreference;
  systemIsDark: boolean;
  onSelectThemePreference: (pref: ThemePreference) => void;
}

export function QrSettingsModal({
  open,
  onClose,
  hasServerApiKey,
  sessionApiKey,
  onSessionApiKeyChange,
  themePreference,
  systemIsDark,
  onSelectThemePreference,
}: QrSettingsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [liveUrl, setLiveUrl] = useState<string>('');
  const [draftKey, setDraftKey] = useState(sessionApiKey);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraftKey(sessionApiKey);
  }, [sessionApiKey]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      const url = typeof window !== 'undefined' ? window.location.origin : '';
      setLiveUrl(url);
      if (url) {
        QRCode.toDataURL(url, {
          width: 240,
          margin: 2,
          color: { dark: '#0F172A', light: '#FFFFFF' },
        })
          .then(setQrDataUrl)
          .catch(() => setQrDataUrl(''));
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

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

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSessionApiKeyChange(draftKey.trim());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="qr-dialog-title"
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
    >
      <div className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 id="qr-dialog-title" className="text-base font-extrabold text-slate-900">
                Judge Live QR &amp; Gemini API Settings
              </h1>
              <p className="text-xs text-slate-600">
                Scan on mobile during your KUEC pitch or configure a session API key
              </p>
            </div>
          </div>

          <form method="dialog">
            <button
              type="submit"
              aria-label="Close QR and API settings dialog"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>

        <div className="grid gap-6 overflow-y-auto p-6 sm:grid-cols-2">
          {/* Live Demo QR Code */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
            <p className="text-xs font-extrabold uppercase tracking-wider text-teal-800">
              Try ShifaClear on Your Phone
            </p>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code to open ShifaClear live demo on a mobile phone"
                className="qr-preserve-light my-3 h-44 w-44 rounded-xl border border-slate-200 p-2 shadow-xs"
              />
            ) : (
              <div className="qr-preserve-light my-3 flex h-44 w-44 items-center justify-center rounded-xl text-xs text-slate-400">
                Generating QR…
              </div>
            )}
            <p className="max-w-full truncate font-mono text-[11px] font-semibold text-slate-600">
              {liveUrl}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Deploy to Vercel to share a public HTTPS QR code with KUEC judges.
            </p>
          </div>

          {/* Appearance Theme Selector & Gemini API Status */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="rounded-2xl border border-[#E7E3DA] bg-[#FAF9F6] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-[#18181B]">Appearance Theme</p>
                <span className="text-[11px] font-medium text-[#78716C]">
                  OS: {systemIsDark ? 'Dark' : 'Light'}
                </span>
              </div>
              <div
                role="group"
                aria-label="Color theme preference"
                className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-xl border border-[#E2DDD2] bg-[#F3F1EC] p-1 text-xs font-semibold"
              >
                {(
                  [
                    {
                      id: 'system',
                      label: `System`,
                      sub: systemIsDark ? 'Dark' : 'Light',
                      Icon: Monitor,
                    },
                    { id: 'light', label: 'Light', sub: null, Icon: Sun },
                    { id: 'dark', label: 'Dark', sub: null, Icon: Moon },
                  ] as const
                ).map(({ id, label, sub, Icon }) => {
                  const active = themePreference === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSelectThemePreference(id)}
                      className={`inline-flex min-h-[36px] flex-col items-center justify-center rounded-lg px-2 py-1 transition ${
                        active
                          ? 'bg-[#0D5C56] text-white shadow-xs'
                          : 'text-[#57534E] hover:bg-white hover:text-[#18181B]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{label}</span>
                      </span>
                      {sub && (
                        <span className="text-[9px] font-normal opacity-80">
                          Currently {sub}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-teal-900">
                <ShieldCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
                <span>Server Gemini API Status</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-teal-800">
                {hasServerApiKey
                  ? 'GEMINI_API_KEY is active on the server (.env.local / Vercel Env). Live photo/PDF scanning and Gemini 3.8 TTS are ready.'
                  : 'No server key detected. Add GEMINI_API_KEY in Vercel Environment Variables or enter a temporary session key below.'}
              </p>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-3">
              <label
                htmlFor="session-gemini-key"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
              >
                <KeyRound className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                <span>Optional Session Key Override (memory only)</span>
              </label>
              <input
                id="session-gemini-key"
                type="password"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder="Paste Google AI Studio key..."
                autoComplete="off"
                className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 text-xs font-mono text-slate-900"
              />
              <button
                type="submit"
                className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-xs font-bold text-white hover:bg-teal-800"
              >
                {savedNotice ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>Saved for This Session</span>
                  </>
                ) : (
                  <span>Save Session Override</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </dialog>
  );
}
