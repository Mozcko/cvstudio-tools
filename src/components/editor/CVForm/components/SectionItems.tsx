import React from 'react';
import type { Experience, Education } from '../../../../types/cv';
import type { Translation } from '../../../../i18n/locales';
import { Input } from './FormInputs';
import { SimpleListEditor } from './ListEditors';

interface ItemProps<T> {
    item: T;
    index: number;
    onUpdate: (index: number, field: keyof T | string, value: any) => void;
    onRemove: (index: number) => void;
    t: Translation;
}

export const ExperienceItem = ({ item, index, onUpdate, onRemove, t }: ItemProps<Experience>) => (
    <div className="bg-[rgba(30,41,59,0.4)] p-5 rounded-lg border border-slate-700 relative group hover:border-slate-500 transition-colors">
        <button onClick={() => onRemove(index)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1" title={t.actions.delete}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input label={t.labels.company} value={item.company} onChange={(v) => onUpdate(index, 'company', v)} />
            <Input label={t.labels.role} value={item.role} onChange={(v) => onUpdate(index, 'role', v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input label={t.labels.location} value={item.location} onChange={(v) => onUpdate(index, 'location', v)} />
                <div className="grid grid-cols-2 gap-2">
                    <Input label={t.labels.startDate} type="month" value={item.startDate} onChange={(v) => onUpdate(index, 'startDate', v)} />
                    <Input label={t.labels.endDate} type="month" value={item.endDate || ''} onChange={(v) => onUpdate(index, 'endDate', v)} disabled={item.isCurrent} />
                </div>
        </div>
        <div className="mb-4 flex items-center gap-2 justify-end">
            <input type="checkbox" id={`current-exp-${item.id}`} checked={item.isCurrent} onChange={(e) => onUpdate(index, 'isCurrent', e.target.checked)} className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500 cursor-pointer" />
            <label htmlFor={`current-exp-${item.id}`} className="text-sm text-slate-300 select-none cursor-pointer">{t.labels.currentWork}</label>
        </div>
        
        <SimpleListEditor title={t.labels.description} items={item.description} onUpdate={(items) => onUpdate(index, 'description', items)} t={t} />
    </div>
);

export const EducationItem = ({ item, index, onUpdate, onRemove, t }: ItemProps<Education>) => (
    <div className="bg-[rgba(30,41,59,0.4)] p-5 rounded-lg border border-slate-700 relative group hover:border-slate-500 transition-colors">
        <button onClick={() => onRemove(index)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1" title={t.actions.delete}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input label={t.labels.institution} value={item.institution} onChange={(v) => onUpdate(index, 'institution', v)} />
            <Input label={t.labels.degree} value={item.degree} onChange={(v) => onUpdate(index, 'degree', v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="hidden md:block"></div>
                <div className="grid grid-cols-2 gap-2">
                    <Input label={t.labels.startDate} type="month" value={item.startDate} onChange={(v) => onUpdate(index, 'startDate', v)} />
                    <Input label={t.labels.endDate} type="month" value={item.endDate || ''} onChange={(v) => onUpdate(index, 'endDate', v)} disabled={item.isCurrent} />
                </div>
        </div>
        <div className="mb-2 flex items-center gap-2 justify-end">
            <input type="checkbox" id={`current-edu-${item.id}`} checked={item.isCurrent} onChange={(e) => onUpdate(index, 'isCurrent', e.target.checked)} className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500 cursor-pointer" />
            <label htmlFor={`current-edu-${item.id}`} className="text-sm text-slate-300 select-none cursor-pointer">{t.labels.currentStudy}</label>
        </div>
    </div>
);

export const ProjectItem = ({ item, index, onUpdate, onRemove, t }: ItemProps<any>) => (
    <div className="bg-[rgba(30,41,59,0.4)] p-5 rounded-lg border border-slate-700 relative group hover:border-slate-500 transition-colors">
        <button onClick={() => onRemove(index)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input label={t.labels.project} value={item.name} onChange={(v) => onUpdate(index, 'name', v)} />
            <Input label={t.labels.role} value={item.role} onChange={(v) => onUpdate(index, 'role', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
                <Input label={t.labels.startDate} type="month" value={item.startDate} onChange={(v) => onUpdate(index, 'startDate', v)} />
                <Input label={t.labels.endDate} type="month" value={item.endDate} onChange={(v) => onUpdate(index, 'endDate', v)} />
        </div>
        <Input label={t.labels.url} value={item.url} onChange={(v) => onUpdate(index, 'url', v)} className="mb-4" />
        <SimpleListEditor title={t.labels.description} items={item.description} onUpdate={(items) => onUpdate(index, 'description', items)} t={t} />
    </div>
);