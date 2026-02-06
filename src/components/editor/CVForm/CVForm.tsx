import React, { useState } from 'react';
import type { CVData, Experience, Education } from '../../../types/cv';
import type { Translation } from '../../../i18n/locales';
import { Input, TextArea } from './components/FormInputs';
import { SocialsEditor } from './components/SocialsEditor';
import { DynamicListEditor } from './components/ListEditors';
import { CustomSectionsEditor } from './components/CustomSectionsEditor';
import { SectionHeader } from './components/SectionHeader';
import { InfoBanner } from './components/InfoBanner';
import { ExperienceItem, EducationItem, ProjectItem } from './components/SectionItems';

interface Props {
  data: CVData;
  onChange: (newData: CVData) => void;
  t: Translation;
  isReordering: boolean;
  onReorderFinish: () => void;
}

export default function CVForm({ data, onChange, t, isReordering, onReorderFinish }: Props) {
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    const target = e.target as Element;
    if (!target.closest || !target.closest('.drag-handle')) {
        e.preventDefault();
        return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newOrder = [...(data.sectionOrder || ['experience', 'projects', 'education', 'skills', 'custom'])];
    const item = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, item);
    
    setDraggedIndex(index);
    onChange({ ...data, sectionOrder: newOrder } as any);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    onReorderFinish();
  };

  // Soporte para Touch (Móviles)
  const handleTouchStart = (index: number) => {
    setDraggedIndex(index);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (draggedIndex === null) return;
    
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (!target) return;
    
    const row = target.closest('[data-reorder-index]');
    if (row) {
        const targetIndex = parseInt(row.getAttribute('data-reorder-index') || '-1', 10);
        if (targetIndex !== -1 && targetIndex !== draggedIndex) {
             const newOrder = [...(data.sectionOrder || ['experience', 'projects', 'education', 'skills', 'custom'])];
             const item = newOrder[draggedIndex];
             newOrder.splice(draggedIndex, 1);
             newOrder.splice(targetIndex, 0, item);
             
             setDraggedIndex(targetIndex);
             onChange({ ...data, sectionOrder: newOrder } as any);
        }
    }
  };
  
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

  // Helpers para Projects (usando any para bypass de tipo estricto temporalmente)
  const safeProjects = (data as any).projects || [];
  const updateProject = (index: number, field: string, value: any) => {
      const newProjs = [...safeProjects];
      newProjs[index] = { ...newProjs[index], [field]: value };
      onChange({ ...data, projects: newProjs } as any);
  };
  const addProject = () => onChange({ ...data, projects: [...safeProjects, { id: Date.now().toString(), name: 'Project Name', role: 'Role', startDate: '', endDate: '', description: ["Description..."] }] } as any);
  const removeProject = (index: number) => { if(confirm(t.actions.confirmDelete)) onChange({ ...data, projects: safeProjects.filter((_: any, i: number) => i !== index) } as any); };

  // --- REORDENAMIENTO ---
  const sectionOrder = (data as any).sectionOrder || ['experience', 'projects', 'education', 'skills', 'custom'];
  
  const moveSection = (index: number, direction: 'up' | 'down') => {
      const newOrder = [...sectionOrder];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newOrder.length) return;
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      onChange({ ...data, sectionOrder: newOrder } as any);
  };

  const getSectionTitle = (id: string) => {
    switch(id) {
        case 'experience': return t.sections.experience;
        case 'projects': return t.sections.projects;
        case 'education': return t.sections.edu;
        case 'skills': return t.sections.skills;
        case 'custom': return t.sections.custom;
        default: return id.toUpperCase();
    }
  };

  return (
    <div className="p-2 md:p-4 space-y-6 md:space-y-8 pb-4">
      
      {/* Aviso de campos vacíos */}
      {showInfoBanner && <InfoBanner t={t} onClose={() => setShowInfoBanner(false)} />}

      {/* 1. SECCIÓN PERSONAL */}
      <section>
        <h3 className="text-lg font-bold text-blue-400 mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span> {t.sections.personal}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t.labels.fullName} value={data.personal.name} onChange={(v) => updatePersonal('name', v)} required />
            <Input label={t.labels.role} value={data.personal.role} onChange={(v) => updatePersonal('role', v)} required />
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

      {/* SECCIONES REORDENABLES */}
      {isReordering ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Reordenar Secciones</h3>
                <button onClick={onReorderFinish} className="text-xs text-slate-400 hover:text-white">{t.actions.close}</button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Arrastra y suelta una sección para cambiar su posición.</p>
            {sectionOrder.map((sectionId: string, index: number) => (
                <div 
                    key={sectionId}
                    data-reorder-index={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={() => handleTouchStart(index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleDragEnd}
                    className={`drag-handle touch-none select-none p-4 rounded-lg border-2 flex justify-between items-center cursor-move transition-all
                        ${draggedIndex === index 
                            ? 'border-blue-500 bg-[rgba(59,130,246,0.1)] opacity-50' 
                            : 'border-slate-700 bg-[rgba(30,41,59,0.5)] hover:border-slate-500 hover:bg-[rgba(30,41,59,0.8)]'
                        }`}
                >
                    <span className="font-bold text-slate-200">{getSectionTitle(sectionId)}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </div>
            ))}
        </div>
      ) : (
        sectionOrder.map((sectionId: string, index: number) => {
        
        const headerProps = {
            onMoveUp: () => moveSection(index, 'up'),
            onMoveDown: () => moveSection(index, 'down'),
            canMoveUp: index !== 0,
            canMoveDown: index !== sectionOrder.length - 1,
            t
        };

        let content = null;

        if (sectionId === 'experience') {
            content = (
              <section>
                <SectionHeader title={t.sections.experience} onAdd={addExp} {...headerProps} />
                <button onClick={addExp} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-900/20">{t.actions.add}</button>
                <div className="space-y-6 mt-4">
                {data.experience.map((exp, idx) => (
                    <ExperienceItem key={exp.id} item={exp} index={idx} onUpdate={updateExp} onRemove={removeExp} t={t} />
                ))}
                </div>
              </section>
            );
        } else if (sectionId === 'projects') {
            content = (
              <section>
                <SectionHeader title={t.sections.projects} onAdd={addProject} {...headerProps} />
                <div className="space-y-6">
                {safeProjects.map((proj: any, idx: number) => (
                    <ProjectItem key={proj.id} item={proj} index={idx} onUpdate={updateProject} onRemove={removeProject} t={t} />
                ))}
                </div>
              </section>
            );
        } else if (sectionId === 'education') {
            content = (
              <section>
                <SectionHeader title={t.sections.edu} onAdd={addEdu} {...headerProps} />
                <div className="space-y-6">
                {data.education.map((edu, idx) => (
                    <EducationItem key={edu.id} item={edu} index={idx} onUpdate={updateEdu} onRemove={removeEdu} t={t} />
                ))}
                </div>
              </section>
            );
        } else if (sectionId === 'skills') {
            content = (
              <section>
                <SectionHeader title={t.sections.skills} {...headerProps} />
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
            );
        } else if (sectionId === 'custom') {
            content = (
              <section>
                <SectionHeader title={t.sections.custom} {...headerProps} />
                <CustomSectionsEditor 
                    sections={(data as any).customSections || []} 
                    onUpdate={(secs) => onChange({ ...data, customSections: secs } as any)} 
                    t={t} 
                />
              </section>
            );
        }

        if (!content) return null;

        return (
            <div key={sectionId}>
                {content}
            </div>
        );
      }))}

    </div>
  );
}