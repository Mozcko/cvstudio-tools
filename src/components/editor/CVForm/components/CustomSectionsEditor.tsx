import React from 'react';
import type { Translation } from '../../../../i18n/locales';
import { Input, TextArea } from './FormInputs';

interface CustomSectionsEditorProps {
    sections: any[];
    onUpdate: (sections: any[]) => void;
    t: Translation;
}

export const CustomSectionsEditor = ({ sections, onUpdate, t }: CustomSectionsEditorProps) => {
    const safeSections = Array.isArray(sections) ? sections : [];

    const addSection = () => onUpdate([...safeSections, { id: Date.now().toString(), title: "Nueva Sección", items: [] }]);
    const removeSection = (idx: number) => { if(confirm(t.actions.confirmDelete)) onUpdate(safeSections.filter((_, i) => i !== idx)); };
    
    const updateSectionTitle = (idx: number, title: string) => {
        const newSecs = [...safeSections];
        newSecs[idx] = { ...newSecs[idx], title };
        onUpdate(newSecs);
    };

    const addItem = (secIdx: number) => {
        const newSecs = [...safeSections];
        newSecs[secIdx].items.push({ id: Date.now(), title: "Elemento", subtitle: "", description: "" });
        onUpdate(newSecs);
    };

    const updateItem = (secIdx: number, itemIdx: number, field: string, val: string) => {
        const newSecs = [...safeSections];
        newSecs[secIdx].items[itemIdx] = { ...newSecs[secIdx].items[itemIdx], [field]: val };
        onUpdate(newSecs);
    };

    return (
        <div className="space-y-6">
            {safeSections.map((section, sIdx) => (
                <div key={section.id} className="border-t border-slate-700 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <Input value={section.title} onChange={(v) => updateSectionTitle(sIdx, v)} placeholder={t.labels.sectionTitle} className="font-bold text-blue-400" />
                        <button onClick={() => removeSection(sIdx)} className="text-red-400 hover:text-red-300 text-xs uppercase font-bold">{t.actions.delete}</button>
                    </div>
                    {section.items.map((item: any, iIdx: number) => (
                        <div key={item.id} className="bg-[rgba(30,41,59,0.3)] p-3 rounded mb-3 border border-[rgba(51,65,85,0.5)]">
                            <Input value={item.title} onChange={(v) => updateItem(sIdx, iIdx, 'title', v)} placeholder={t.labels.itemTitle} className="mb-2" />
                            <Input value={item.subtitle} onChange={(v) => updateItem(sIdx, iIdx, 'subtitle', v)} placeholder={t.labels.itemSubtitle} className="mb-2 text-xs" />
                            <TextArea value={item.description} onChange={(v: string) => updateItem(sIdx, iIdx, 'description', v)} rows={2} />
                        </div>
                    ))}
                    <button onClick={() => addItem(sIdx)} className="text-xs text-blue-400 hover:text-blue-300 font-bold mt-2">{t.actions.addItem}</button>
                </div>
            ))}
            <button onClick={addSection} className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-blue-400 hover:border-blue-500/50 transition-colors font-bold uppercase text-xs tracking-wider">
                {t.actions.addSection}
            </button>
        </div>
    );
};