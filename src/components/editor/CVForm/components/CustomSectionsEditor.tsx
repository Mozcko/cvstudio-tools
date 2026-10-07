import React from 'react';
import type { Translation } from '../../../../i18n/locales';
import type { CustomItem, CustomSection } from '../../../../types/cv';
import { Input, TextArea } from './FormInputs';

interface CustomSectionsEditorProps {
  sections: CustomSection[];
  onUpdate: (sections: CustomSection[]) => void;
  t: Translation;
}

export const CustomSectionsEditor = ({ sections, onUpdate, t }: CustomSectionsEditorProps) => {
  const safeSections = Array.isArray(sections) ? sections : [];

  const addSection = () =>
    onUpdate([...safeSections, { id: Date.now().toString(), title: t.form.newSection, items: [] }]);
  const removeSection = (idx: number) => {
    if (confirm(t.actions.confirmDelete)) onUpdate(safeSections.filter((_, i) => i !== idx));
  };

  const updateSectionTitle = (idx: number, title: string) => {
    const newSecs = [...safeSections];
    newSecs[idx] = { ...newSecs[idx], title };
    onUpdate(newSecs);
  };

  const addItem = (secIdx: number) => {
    const newSecs = safeSections.map((section, i) =>
      i === secIdx
        ? {
            ...section,
            items: [
              ...section.items,
              { id: Date.now(), title: t.form.newItem, subtitle: '', description: '' },
            ],
          }
        : section
    );
    onUpdate(newSecs);
  };

  const updateItem = (secIdx: number, itemIdx: number, field: keyof CustomItem, val: string) => {
    const newSecs = safeSections.map((section, i) =>
      i === secIdx
        ? {
            ...section,
            items: section.items.map((item, j) =>
              j === itemIdx ? { ...item, [field]: val } : item
            ),
          }
        : section
    );
    onUpdate(newSecs);
  };

  return (
    <div className="space-y-6">
      {safeSections.map((section, sIdx) => (
        <div key={section.id} className="border-t border-slate-700 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <Input
              value={section.title}
              onChange={(v) => updateSectionTitle(sIdx, v)}
              placeholder={t.labels.sectionTitle}
              className="font-bold text-blue-400"
            />
            <button
              onClick={() => removeSection(sIdx)}
              className="text-xs font-bold text-red-400 uppercase hover:text-red-300"
            >
              {t.actions.delete}
            </button>
          </div>
          {section.items.map((item, iIdx) => (
            <div
              key={item.id}
              className="mb-3 rounded border border-[rgba(51,65,85,0.5)] bg-[rgba(30,41,59,0.3)] p-3"
            >
              <Input
                value={item.title}
                onChange={(v) => updateItem(sIdx, iIdx, 'title', v)}
                placeholder={t.labels.itemTitle}
                className="mb-2"
              />
              <Input
                value={item.subtitle}
                onChange={(v) => updateItem(sIdx, iIdx, 'subtitle', v)}
                placeholder={t.labels.itemSubtitle}
                className="mb-2 text-xs"
              />
              <TextArea
                value={item.description}
                onChange={(v: string) => updateItem(sIdx, iIdx, 'description', v)}
                rows={2}
              />
            </div>
          ))}
          <button
            onClick={() => addItem(sIdx)}
            className="mt-2 text-xs font-bold text-blue-400 hover:text-blue-300"
          >
            {t.actions.addItem}
          </button>
        </div>
      ))}
      <button
        onClick={addSection}
        className="w-full rounded-lg border-2 border-dashed border-slate-700 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase transition-colors hover:border-blue-500/50 hover:text-blue-400"
      >
        {t.actions.addSection}
      </button>
    </div>
  );
};
