import React from 'react';
import type { SocialLink } from '../../../../types/cv';
import type { Translation } from '../../../../i18n/locales';
import { Input } from './FormInputs';

interface SocialsEditorProps {
    items: SocialLink[];
    onUpdate: (items: SocialLink[]) => void;
    t: Translation;
}

export const SocialsEditor = ({ items, onUpdate, t }: SocialsEditorProps) => {
    const safeItems = Array.isArray(items) ? items : [];

    const updateItem = (index: number, field: keyof SocialLink, value: string) => {
        const newItems = [...safeItems];
        newItems[index] = { ...newItems[index], [field]: value };
        onUpdate(newItems);
    };
    const addItem = () => onUpdate([...safeItems, { id: Date.now().toString(), network: "", username: "", url: "" }]);
    const removeItem = (index: number) => onUpdate(safeItems.filter((_, i) => i !== index));

    return (
        <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Links / Socials</label>
                <button onClick={addItem} className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">{t.actions.addLink}</button>
            </div>
            {safeItems.map((item, idx) => (
                <div key={item.id} className="flex gap-2 items-start group">
                    <Input value={item.network} onChange={(v) => updateItem(idx, 'network', v)} placeholder={t.labels.network} className="w-1/3" />
                    <Input value={item.url} onChange={(v) => updateItem(idx, 'url', v)} placeholder={t.labels.url} className="w-2/3" />
                    <button onClick={() => removeItem(idx)} className="mt-1 text-slate-600 hover:text-red-400 transition-colors p-2 rounded hover:bg-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ))}
        </div>
    );
};