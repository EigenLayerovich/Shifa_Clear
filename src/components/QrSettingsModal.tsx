'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, KeyRound, X } from 'lucide-react';

interface QrSettingsModalProps {
  open: boolean;
  onClose: () => void;
  hasServerApiKey: boolean;
  sessionApiKey: string;
  onSessionApiKeyChange: (key: string) => void;
}

export function QrSettingsModal({
  open,
  onClose,
  hasServerApiKey,
  sessionApiKey,
  onSessionApiKeyChange,
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
          color: { dark: '#171717', light: '#FFFFFF' },
        })
          .then(setQrDataUrl)
          .catch(() => setQrDataUrl(''));
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

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
      <div className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-2xl border border-neutral-900/10 bg-white shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-900/8 bg-[#fafafa] px-6 py-4">
          <div>
            <h1 id="qr-dialog-title" className="text-base font-medium text-[#171717]">
              Mobile QR and API settings
            </h1>
            <p className="mt-0.5 text-xs text-[#737373]">
              Open this session on a phone or set a temporary Gemini key
            </p>
          </div>

          <form method="dialog">
            <button
              type="submit"
              aria-label="Close QR and API settings dialog"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-900/10 bg-white text-[#525252] transition-colors duration-150 hover:bg-[#f4f4f5] hover:text-[#171717]"
            >
              <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </form>
        </div>

        <div className="grid gap-6 overflow-y-auto p-6 sm:grid-cols-2">
          <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-900/8 bg-[#fafafa] p-5 text-center">
            <p className="text-xs font-medium text-[#525252]">Open on mobile</p>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code to open ShifaClear on a mobile phone"
                className="my-3 h-44 w-44 rounded-lg border border-neutral-900/8 bg-white p-2"
              />
            ) : (
              <div className="my-3 flex h-44 w-44 items-center justify-center rounded-lg bg-white text-xs text-[#737373]">
                Generating QR
              </div>
            )}
            <p className="max-w-full truncate font-mono text-[11px] text-[#525252]">
              <bdi dir="ltr">{liveUrl}</bdi>
            </p>
          </div>

          <div className="flex flex-col justify-between space-y-4">
            <div className="rounded-xl border border-neutral-900/8 bg-[#fafafa] p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[#171717]">
                <span
                  className={`h-2 w-2 rounded-full ${hasServerApiKey ? 'bg-[#15803d]' : 'bg-[#b45309]'}`}
                  aria-hidden="true"
                />
                <span>Server Gemini API status</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#525252]">
                {hasServerApiKey
                  ? 'GEMINI_API_KEY is active on the server. Live photo/PDF extraction and voice synthesis are enabled.'
                  : 'No server key detected. Add GEMINI_API_KEY in Vercel Environment Variables or enter a session key below.'}
              </p>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-3">
              <label
                htmlFor="session-gemini-key"
                className="flex items-center gap-1.5 text-xs font-medium text-[#525252]"
              >
                <KeyRound className="h-4 w-4 text-[#737373]" strokeWidth={1.5} aria-hidden="true" />
                <span>Session API key override (memory only)</span>
              </label>
              <input
                id="session-gemini-key"
                type="password"
                dir="ltr"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder="Google AI Studio key"
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-neutral-900/12 bg-[#fafafa] px-3 font-mono text-xs text-[#171717] focus:border-[#0f766e] focus:bg-white"
              />
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-xs font-medium text-white transition-colors duration-150 hover:bg-[#115e59] active:scale-[0.98]"
              >
                {savedNotice ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    <span>Saved for this session</span>
                  </>
                ) : (
                  <span>Save session key</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </dialog>
  );
}
