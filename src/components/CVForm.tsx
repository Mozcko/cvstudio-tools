import React from 'react';
import type { CVData, Experience } from '../types/cv';

interface Props {
  data: CVData;
  onChange: (newData: CVData) => void;
}

// --- COMPONENTES AUXILIARES (DEFINIDOS AFUERA) ---

interface InputProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
}

const Input = ({ label, value, onChange, placeholder }: InputProps) => (
    <div className="mb-3">
      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
      />
    </div>
);

interface TextAreaProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    rows?: number;
}

const TextArea = ({ label, value, onChange, rows = 3 }: TextAreaProps) => (
    <div className="mb-3">
      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">{label}</label>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono transition-shadow"
      />
    </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function CVForm({ data, onChange }: Props) {
  
  const updatePersonal = (field: keyof CVData['personal'], value: string) => {
    onChange({ ...data, personal: { ...data.personal, [field]: value } });
  };

  const updateExp = (index: number, field: keyof Experience, value: string) => {
    const newExp = [...data.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    onChange({ ...data, experience: newExp });
  };

  const addExp = () => {
    onChange({
      ...data,
      experience: [...data.experience, { id: Date.now().toString(), company: 'Nueva Empresa', role: 'Puesto', location: 'Remoto', date: 'Presente', description: '- Descripción' }]
    });
  };
    
  const removeExp = (index: number) => {
      if(confirm("¿Eliminar esta experiencia?")) {
        const newExp = data.experience.filter((_, i) => i !== index);
        onChange({ ...data, experience: newExp });
      }
  };

  return (
    <div className="p-6 space-y-8 pb-20">
      
      {/* Sección Personal */}
      <section>
        <h3 className="text-lg font-bold text-blue-400 mb-4 border-b border-slate-700 pb-2">Información Personal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre Completo" value={data.personal.name} onChange={(v) => updatePersonal('name', v)} />
            <Input label="Rol / Título" value={data.personal.role} onChange={(v) => updatePersonal('role', v)} />
            <Input label="Email" value={data.personal.email} onChange={(v) => updatePersonal('email', v)} />
            <Input label="Teléfono" value={data.personal.phone} onChange={(v) => updatePersonal('phone', v)} />
            <Input label="Ciudad" value={data.personal.city} onChange={(v) => updatePersonal('city', v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
             <Input label="LinkedIn URL" value={data.personal.linkedin} onChange={(v) => updatePersonal('linkedin', v)} />
             <Input label="GitHub URL" value={data.personal.github} onChange={(v) => updatePersonal('github', v)} />
             <Input label="Portfolio URL" value={data.personal.portfolio} onChange={(v) => updatePersonal('portfolio', v)} />
        </div>
        <div className="mt-4">
            <TextArea label="Resumen Profesional" value={data.personal.summary} onChange={(v) => updatePersonal('summary', v)} />
        </div>
      </section>

      {/* Experiencia */}
      <section>
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h3 className="text-lg font-bold text-blue-400">Experiencia Laboral</h3>
            <button onClick={addExp} className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-white font-medium transition-colors">
                + Agregar
            </button>
        </div>
        
        <div className="space-y-6">
            {data.experience.map((exp, idx) => (
                <div key={exp.id} className="bg-slate-800/50 p-4 rounded border border-slate-700 relative group hover:border-slate-500 transition-colors">
                    <button 
                        onClick={() => removeExp(idx)} 
                        className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                        title="Eliminar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <Input label="Empresa" value={exp.company} onChange={(v) => updateExp(idx, 'company', v)} />
                        <Input label="Puesto" value={exp.role} onChange={(v) => updateExp(idx, 'role', v)} />
                        <Input label="Ubicación" value={exp.location} onChange={(v) => updateExp(idx, 'location', v)} />
                        <Input label="Fechas" value={exp.date} onChange={(v) => updateExp(idx, 'date', v)} />
                    </div>
                    <TextArea label="Descripción (Bullets)" value={exp.description} onChange={(v) => updateExp(idx, 'description', v)} rows={4} />
                </div>
            ))}
        </div>
      </section>

      {/* Skills y Otros */}
      <section>
        <h3 className="text-lg font-bold text-blue-400 mb-4 border-b border-slate-700 pb-2">Habilidades y Otros</h3>
        <div className="space-y-4">
            <TextArea label="Skills Técnicos" value={data.skills} onChange={(v) => onChange({...data, skills: v})} />
            <TextArea label="Certificaciones" value={data.certifications} onChange={(v) => onChange({...data, certifications: v})} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Idiomas" value={data.languages} onChange={(v) => onChange({...data, languages: v})} />
                <Input label="Intereses" value={data.interests} onChange={(v) => onChange({...data, interests: v})} />
            </div>
        </div>
      </section>

    </div>
  );
}