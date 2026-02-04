import React from 'react';
import type { Translation } from '../../../../i18n/locales';

interface InfoBannerProps {
    t: Translation;
    onClose: () => void;
}

export const InfoBanner = ({ t, onClose }: InfoBannerProps) => (
    <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-3 text-xs text-blue-200 flex items-start gap-2 relative animate-in fade-in slide-in-from-top-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
        <div className="flex-1 pr-2">
            <p>{t.header.emptyFieldsNotice}</p>
        </div>
        <button onClick={onClose} className="text-blue-400 hover:text-white transition-colors" title={t.actions.close}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
        </button>
    </div>
);