import React from 'react';
import type { SkillItem } from '../../../../types/cv';
import type { Translation } from '../../../../i18n/locales';
import { Input } from './FormInputs';

interface SimpleListEditorProps {
    title: string;
    items: string[];
    onUpdate: (items: string[]) => void;
    t: Translation;
}

export const SimpleListEditor = ({ title, items, onUpdate, t }: SimpleListEditorProps) => {
    const safeItems = Array.isArray(items) ? items : [];

    const updateItem = (index: number, value: string) => {
        const newItems = [...safeItems];
        newItems[index] = value;
        onUpdate(newItems);
    };
    const addItem = () => onUpdate([...safeItems, ""]);
    const removeItem = (index: number) => onUpdate(safeItems.filter((_, i) => i !== index));

    return (
        <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</label>
                <button onClick={addItem} className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">{t.actions.addBullet}</button>
            </div>
            {safeItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start group animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="mt-2 text-slate-500 text-xs">•</span>
                    <Input value={item} onChange={(v) => updateItem(idx, v)} placeholder="Logro..." />
                    <button onClick={() => removeItem(idx)} className="mt-1 text-slate-600 hover:text-red-400 transition-colors p-2 rounded hover:bg-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ))}
            {safeItems.length === 0 && <div className="text-xs text-slate-500 italic p-2 text-center border border-dashed border-slate-700 rounded">Sin descripción.</div>}
        </div>
    );
};

interface ListEditorProps {
    title: string;
    items: SkillItem[];
    onUpdate: (items: SkillItem[]) => void;
    t: Translation;
}

export const DynamicListEditor = ({ title, items, onUpdate, t }: ListEditorProps) => {
    const safeItems = Array.isArray(items) ? items : [];

    const updateItem = (index: number, field: keyof SkillItem, value: string) => {
        const newItems = [...safeItems];
        newItems[index] = { ...newItems[index], [field]: value };
        onUpdate(newItems);
    };
    const addItem = () => onUpdate([...safeItems, { id: Date.now().toString(), category: "", items: "" }]);
    const removeItem = (index: number) => onUpdate(safeItems.filter((_, i) => i !== index));

    return (
        <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</label>
                <button onClick={addItem} className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">{t.actions.addItem}</button>
            </div>
            {safeItems.map((item, idx) => (
                <div key={item.id} className="flex gap-2 items-start group animate-in fade-in slide-in-from-top-1 duration-200">
                    <Input value={item.category} onChange={(v) => updateItem(idx, 'category', v)} placeholder={t.labels.category} className="w-1/3" />
                    <Input value={item.items} onChange={(v) => updateItem(idx, 'items', v)} placeholder={t.labels.itemsList} className="w-2/3" />
                    <button onClick={() => removeItem(idx)} className="mt-1 text-slate-600 hover:text-red-400 transition-colors p-2 rounded hover:bg-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ))}
            {safeItems.length === 0 && <div className="text-xs text-slate-500 italic p-3 text-center bg-[rgba(30,41,59,0.3)] rounded border border-slate-700 border-dashed">No hay elementos.</div>}
        </div>
    );
};