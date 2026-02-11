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
  const addItem = () =>
    onUpdate([...safeItems, { id: Date.now().toString(), network: '', username: '', url: '' }]);
  const removeItem = (index: number) => onUpdate(safeItems.filter((_, i) => i !== index));

  return (
    <div className="mt-4 space-y-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="block text-xs font-bold tracking-wider text-gray-400 uppercase">
          Links / Socials
        </span>
        <button
          onClick={addItem}
          className="text-xs font-bold text-blue-400 transition-colors hover:text-blue-300"
        >
          {t.actions.addLink}
        </button>
      </div>
      {safeItems.map((item, idx) => (
        <div key={item.id} className="group flex items-start gap-2">
          <Input
            value={item.network}
            onChange={(v) => updateItem(idx, 'network', v)}
            placeholder={t.labels.network}
            className="w-1/3"
          />
          <Input
            value={item.url}
            onChange={(v) => updateItem(idx, 'url', v)}
            placeholder={t.labels.url}
            className="w-2/3"
          />
          <button
            onClick={() => removeItem(idx)}
            className="mt-1 rounded p-2 text-slate-600 transition-colors hover:bg-slate-800 hover:text-red-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
