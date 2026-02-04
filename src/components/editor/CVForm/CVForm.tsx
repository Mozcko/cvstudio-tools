import { useState } from 'react';
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
}

export default function CVForm({ data, onChange, t }: Props) {
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  
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

  return (
    <div className="p-3 md:p-6 space-y-6 md:space-y-8 pb-4">
      
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
      {sectionOrder.map((sectionId: string, index: number) => {
        
        const headerProps = {
            onMoveUp: () => moveSection(index, 'up'),
            onMoveDown: () => moveSection(index, 'down'),
            canMoveUp: index !== 0,
            canMoveDown: index !== sectionOrder.length - 1,
            t
        };

        if (sectionId === 'experience') return (
          <section key="experience">
            <SectionHeader title={t.sections.experience} onAdd={addExp} {...headerProps} />
            <button onClick={addExp} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-900/20">{t.actions.add}</button>
            <div className="space-y-6">
            {data.experience.map((exp, idx) => (
                <ExperienceItem key={exp.id} item={exp} index={idx} onUpdate={updateExp} onRemove={removeExp} t={t} />
            ))}
            </div>
          </section>
        );

        if (sectionId === 'projects') return (
          <section key="projects">
            <SectionHeader title={t.sections.projects} onAdd={addProject} {...headerProps} />
            <div className="space-y-6">
            {safeProjects.map((proj: any, idx: number) => (
                <ProjectItem key={proj.id} item={proj} index={idx} onUpdate={updateProject} onRemove={removeProject} t={t} />
            ))}
            </div>
          </section>
        );

        if (sectionId === 'education') return (
          <section key="education">
            <SectionHeader title={t.sections.edu} onAdd={addEdu} {...headerProps} />
            <div className="space-y-6">
            {data.education.map((edu, idx) => (
                <EducationItem key={edu.id} item={edu} index={idx} onUpdate={updateEdu} onRemove={removeEdu} t={t} />
            ))}
            </div>
          </section>
        );

        if (sectionId === 'skills') return (
          <section key="skills">
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

        if (sectionId === 'custom') return (
          <section key="custom">
            <SectionHeader title={t.sections.custom} {...headerProps} />
        <CustomSectionsEditor 
            sections={(data as any).customSections || []} 
            onUpdate={(secs) => onChange({ ...data, customSections: secs } as any)} 
            t={t} 
        />
          </section>
        );

        return null;
      })}

    </div>
  );
}