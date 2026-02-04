import React from 'react';
import type { Translation } from '../../../../i18n/locales';

interface SectionHeaderProps {
    title: string;
    onAdd?: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
    t: Translation;
}

export const SectionHeader = ({ title, onAdd, onMoveUp, onMoveDown, canMoveUp, canMoveDown, t }: SectionHeaderProps) => (
    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2 group">
        <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5 opacity-30 group-hover:opacity-100 transition-opacity">
                <button onClick={onMoveUp} disabled={!canMoveUp} className="hover:text-blue-400 disabled:opacity-20"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" /></svg></button>
                <button onClick={onMoveDown} disabled={!canMoveDown} className="hover:text-blue-400 disabled:opacity-20"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" /></svg></button>
            </div>
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><span className="w-2 h-6 bg-blue-500 rounded-full"></span> {title}</h3>
        </div>
        {onAdd && <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-900/20">{t.actions.add}</button>}
    </div>
);