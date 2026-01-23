import React from 'react';
import type { CVData, Experience, Education, SkillItem, SocialLink } from '../types/cv';
import type { Translation } from '../i18n/locales';

interface Props {
  data: CVData;
  onChange: (newData: CVData) => void;
  t: Translation;
}

// --- COMPONENTES AUXILIARES ---

interface InputProps {
    label?: string;
    value: string | number | readonly string[] | undefined;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    className?: string;
}

const Input = ({ label, value, onChange, placeholder, type = "text", disabled = false, className = "" }: InputProps) => (
    <div className={`w-full ${className}`}>
      {label && <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${disabled ? 'text-slate-600' : 'text-gray-400'}`}>{label}</label>}
      <input 
        type={type} 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-slate-700/50 border rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all
            ${disabled ? 'border-slate-800 text-slate-500 cursor-not-allowed' : 'border-slate-600 focus:border-transparent'}`}
      />
    </div>
);

const TextArea = ({ label, value, onChange, rows = 3 }: any) => (
    <div className="mb-3">
      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{label}</label>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono transition-all custom-scrollbar"
      />
    </div>
);

// --- EDITOR DE REDES SOCIALES ---
interface SocialsEditorProps {
    items: SocialLink[];
    onUpdate: (items: SocialLink[]) => void;
    t: Translation;
}

const SocialsEditor = ({ items, onUpdate, t }: SocialsEditorProps) => {
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

// --- EDITOR DE LISTAS SIMPLES (Bullets de Experiencia) ---
interface SimpleListEditorProps {
    title: string;
    items: string[];
    onUpdate: (items: string[]) => void;
    t: Translation;
}

const SimpleListEditor = ({ title, items, onUpdate, t }: SimpleListEditorProps) => {
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

// --- EDITOR DE LISTAS DINÁMICAS (Skills / Certs) ---
interface ListEditorProps {
    title: string;
    items: SkillItem[];
    onUpdate: (items: SkillItem[]) => void;
    t: Translation;
}

const DynamicListEditor = ({ title, items, onUpdate, t }: ListEditorProps) => {
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
            {safeItems.length === 0 && <div className="text-xs text-slate-500 italic p-3 text-center bg-slate-800/30 rounded border border-slate-700 border-dashed">No hay elementos.</div>}
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---

export default function CVForm({ data, onChange, t }: Props) {
  
  const updatePersonal = (field: keyof CVData['personal'], value: any) => {
    onChange({ ...data, personal: { ...data.personal, [field]: value } });
  };

  const updateExp = (index: number, field: keyof Experience, value: any) => {
    const newExp = [...data.experience];
    // @ts-ignore
    newExp[index] = { ...newExp[index], [field]: value };
    if (field === 'isCurrent' && value === true) newExp[index].endDate = null;
    onChange({ ...data, experience: newExp });
  };
  const addExp = () => onChange({ ...data, experience: [...data.experience, { id: Date.now().toString(), company: 'Company', role: 'Role', location: 'Remote', startDate: new Date().toISOString().slice(0, 7), endDate: null, isCurrent: true, description: ["Responsibility 1"] }] });
  const removeExp = (index: number) => { if(confirm(t.actions.confirmDelete)) onChange({ ...data, experience: data.experience.filter((_, i) => i !== index) }); };

  const updateEdu = (index: number, field: keyof Education, value: any) => {
    const newEdu = [...data.education];
    // @ts-ignore
    newEdu[index] = { ...newEdu[index], [field]: value };
    if (field === 'isCurrent' && value === true) newEdu[index].endDate = null;
    onChange({ ...data, education: newEdu });
  };
  const addEdu = () => onChange({ ...data, education: [...data.education, { id: Date.now().toString(), institution: 'University', degree: 'Degree', startDate: new Date().toISOString().slice(0, 7), endDate: null, isCurrent: true }] });
  const removeEdu = (index: number) => { if(confirm(t.actions.confirmDelete)) onChange({ ...data, education: data.education.filter((_, i) => i !== index) }); };


  return (
    <div className="p-3 md:p-6 space-y-6 md:space-y-8 pb-24">
      
      {/* 1. SECCIÓN PERSONAL */}
      <section>
        <h3 className="text-lg font-bold text-blue-400 mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span> {t.sections.personal}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t.labels.fullName} value={data.personal.name} onChange={(v) => updatePersonal('name', v)} />
            <Input label={t.labels.role} value={data.personal.role} onChange={(v) => updatePersonal('role', v)} />
            <Input label={t.labels.email} value={data.personal.email} onChange={(v) => updatePersonal('email', v)} />
            <Input label={t.labels.phone} value={data.personal.phone} onChange={(v) => updatePersonal('phone', v)} />
            <Input label={t.labels.city} value={data.personal.city} onChange={(v) => updatePersonal('city', v)} />
        </div>
        
        {/* Editor de Redes Sociales */}
        <SocialsEditor items={data.personal.socials} onUpdate={(newSocials) => updatePersonal('socials', newSocials)} t={t} />

        <div className="mt-4">
            <TextArea label={t.labels.summary} value={data.personal.summary} onChange={(v: string) => updatePersonal('summary', v)} />
        </div>
      </section>

      {/* 2. EXPERIENCIA */}
      <section>
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><span className="w-2 h-6 bg-blue-500 rounded-full"></span> {t.sections.experience}</h3>
            <button onClick={addExp} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-900/20">{t.actions.add}</button>
        </div>
        <div className="space-y-6">
            {data.experience.map((exp, idx) => (
                <div key={exp.id} className="bg-slate-800/40 p-5 rounded-lg border border-slate-700 relative group hover:border-slate-500 transition-colors">
                    <button onClick={() => removeExp(idx)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1" title={t.actions.delete}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Input label={t.labels.company} value={exp.company} onChange={(v) => updateExp(idx, 'company', v)} />
                        <Input label={t.labels.role} value={exp.role} onChange={(v) => updateExp(idx, 'role', v)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <Input label={t.labels.location} value={exp.location} onChange={(v) => updateExp(idx, 'location', v)} />
                         <div className="grid grid-cols-2 gap-2">
                             <Input label={t.labels.startDate} type="month" value={exp.startDate} onChange={(v) => updateExp(idx, 'startDate', v)} />
                             <Input label={t.labels.endDate} type="month" value={exp.endDate || ''} onChange={(v) => updateExp(idx, 'endDate', v)} disabled={exp.isCurrent} />
                         </div>
                    </div>
                    <div className="mb-4 flex items-center gap-2 justify-end">
                        <input type="checkbox" id={`current-exp-${exp.id}`} checked={exp.isCurrent} onChange={(e) => updateExp(idx, 'isCurrent', e.target.checked)} className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500 cursor-pointer" />
                        <label htmlFor={`current-exp-${exp.id}`} className="text-sm text-slate-300 select-none cursor-pointer">{t.labels.currentWork}</label>
                    </div>
                    
                    {/* Editor de Bullets */}
                    <SimpleListEditor title={t.labels.description} items={exp.description} onUpdate={(items) => updateExp(idx, 'description', items)} t={t} />
                </div>
            ))}
        </div>
      </section>

      {/* 3. EDUCACIÓN */}
      <section>
          {/* ... (Igual que antes) ... */}
           <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><span className="w-2 h-6 bg-blue-500 rounded-full"></span> {t.sections.edu}</h3>
            <button onClick={addEdu} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-900/20">{t.actions.add}</button>
        </div>
        <div className="space-y-6">
            {data.education.map((edu, idx) => (
                <div key={edu.id} className="bg-slate-800/40 p-5 rounded-lg border border-slate-700 relative group hover:border-slate-500 transition-colors">
                    <button onClick={() => removeEdu(idx)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1" title={t.actions.delete}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Input label={t.labels.institution} value={edu.institution} onChange={(v) => updateEdu(idx, 'institution', v)} />
                        <Input label={t.labels.degree} value={edu.degree} onChange={(v) => updateEdu(idx, 'degree', v)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div className="hidden md:block"></div>
                         <div className="grid grid-cols-2 gap-2">
                             <Input label={t.labels.startDate} type="month" value={edu.startDate} onChange={(v) => updateEdu(idx, 'startDate', v)} />
                             <Input label={t.labels.endDate} type="month" value={edu.endDate || ''} onChange={(v) => updateEdu(idx, 'endDate', v)} disabled={edu.isCurrent} />
                         </div>
                    </div>
                    <div className="mb-2 flex items-center gap-2 justify-end">
                        <input type="checkbox" id={`current-edu-${edu.id}`} checked={edu.isCurrent} onChange={(e) => updateEdu(idx, 'isCurrent', e.target.checked)} className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500 cursor-pointer" />
                        <label htmlFor={`current-edu-${edu.id}`} className="text-sm text-slate-300 select-none cursor-pointer">{t.labels.currentStudy}</label>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* 4. SKILLS Y CERTIFICACIONES */}
      <section>
        <h3 className="text-lg font-bold text-blue-400 mb-4 border-b border-slate-700 pb-2 flex items-center gap-2"><span className="w-2 h-6 bg-blue-500 rounded-full"></span> {t.sections.skills}</h3>
        <div className="space-y-8">
            <DynamicListEditor title={t.labels.techSkills} items={data.skills} onUpdate={(newSkills) => onChange({...data, skills: newSkills})} t={t} />
            <div className="h-px bg-slate-700/50"></div>
            <DynamicListEditor title={t.labels.certifications} items={data.certifications} onUpdate={(newCerts) => onChange({...data, certifications: newCerts})} t={t} />
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label={t.labels.languages} value={data.languages} onChange={(v) => onChange({...data, languages: v})} />
            <Input label={t.labels.interests} value={data.interests} onChange={(v) => onChange({...data, interests: v})} />
        </div>
      </section>

    </div>
  );
}