import React from 'react';
import type { Translation } from '../../i18n/locales';
import { localePrefixFromPath } from '../../i18n/utils';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translation;
  title?: string;
  description?: string;
  mode?: 'auth' | 'upgrade';
}

export default function AuthRequiredModal({
  isOpen,
  onClose,
  t,
  title,
  description,
  mode = 'auth',
}: AuthRequiredModalProps) {
  if (!isOpen) return null;

  const isUpgrade = mode === 'upgrade';
  const heading = title || (isUpgrade ? t.messages.upgradeTitle : t.messages.authTitle);
  const body =
    description || (isUpgrade ? t.messages.upgradeDescription : t.messages.authDescription);
  const langPrefix = localePrefixFromPath();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Enter' && onClose()}
        role="button"
        tabIndex={0}
        aria-label={t.actions.close}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        <h2 className="mb-2 text-2xl font-bold text-white">{heading}</h2>
        <p className="mb-6 text-sm text-slate-400">{body}</p>

        <div className="flex flex-col gap-3">
          {isUpgrade ? (
            <a
              href={`${langPrefix}/pricing`}
              className="rounded-xl bg-amber-500 p-3 text-center font-bold text-white"
            >
              {t.messages.upgrade}
            </a>
          ) : (
            <a
              href={`${langPrefix}/sign-in`}
              className="rounded-xl bg-blue-600 p-3 text-center font-bold text-white"
            >
              {t.messages.signIn}
            </a>
          )}
          <button onClick={onClose} className="text-sm text-slate-500">
            {t.actions.close}
          </button>
        </div>
      </div>
    </div>
  );
}
