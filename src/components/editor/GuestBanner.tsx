import React from 'react';
import type { Translation } from '../../i18n/locales';

interface GuestBannerProps {
  onSignUp: () => void;
  t: Translation;
}

export default function GuestBanner({ onSignUp, t }: GuestBannerProps) {
  return (
    <div
      data-testid="guest-banner"
      className="flex items-center justify-center gap-4 border-b border-blue-500/20 bg-blue-600/10 px-4 py-2 text-xs"
    >
      <span className="font-medium text-blue-400">{t.guest.notice}</span>
      <button
        onClick={onSignUp}
        className="font-bold text-blue-400 underline transition-colors hover:text-blue-300"
      >
        {t.guest.action}
      </button>
    </div>
  );
}
