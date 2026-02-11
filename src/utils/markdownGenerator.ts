import type { CVData, SkillItem, SocialLink } from '../types/cv';

const formatDate = (dateString: string | null, isCurrent: boolean, lang: 'es' | 'en'): string => {
  if (isCurrent) return lang === 'es' ? 'Presente' : 'Present';
  if (!dateString) return '';
  const [year, month] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' }).format(date);
};

// Helper para generar lista de items (SkillItem)
const generateCategoryList = (items: SkillItem[]): string => {
  if (!Array.isArray(items)) return '';
  return items.map((item) => `- **${item.category}:** ${item.items}`).join('\n');
};

// Helper para generar lista de bullets simples (Experience)
const generateBulletList = (items: string[]): string => {
  if (!Array.isArray(items)) return '';
  return items.map((item) => `- ${item}`).join('\n');
};

// NUEVO: Helper para generar enlaces sociales dinámicos
// Soluciona el error de 'platform' vs 'network' y la limitación de links fijos
const generateSocialLinks = (socials: SocialLink[]): string => {
  if (!Array.isArray(socials)) return '';
  // Genera: **[LinkedIn](url)** | **[GitHub](url)** ...
  return socials.map((link) => `**[${link.network}](${link.url})**`).join(' | ');
};

interface Project {
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  url: string;
  description: string[];
}

interface CustomSection {
  title: string;
  items: {
    title: string;
    subtitle: string;
    description: string;
  }[];
}

export const generateMarkdown = (data: CVData, lang: 'es' | 'en' = 'en'): string => {
  // Cast a any para soportar campos nuevos (projects, customSections) si la interfaz CVData no está actualizada
  const {
    personal,
    experience,
    education,
    skills,
    certifications,
    projects,
    customSections,
    sectionOrder,
  } = data as CVData & {
    projects?: Project[];
    customSections?: CustomSection[];
    sectionOrder?: string[];
  };

  // Generamos la línea de contactos usando la función dinámica
  const socialLinksLine = generateSocialLinks(personal.socials);

  const experienceSection = experience
    .map((exp) => {
      const start = formatDate(exp.startDate, false, lang);
      const end = formatDate(exp.endDate, exp.isCurrent, lang);

      const descriptionBullets = generateBulletList(exp.description);

      return `
<table>
  <tr>
    <td><strong>${exp.company}</strong></td>
    <td><em>${exp.role}</em></td>
  </tr>
  <tr>
    <td><em>${exp.location}</em></td>
    <td><em>${start} - ${end}</em></td>
  </tr>
</table>

${descriptionBullets}
`;
    })
    .join('\n');

  // --- NUEVO: PROYECTOS ---
  let projectsSection = '';
  if (projects && projects.length > 0) {
    projectsSection = projects
      .map((proj) => {
        const start = formatDate(proj.startDate, false, lang);
        const end = formatDate(proj.endDate, false, lang);
        const dateRange =
          start || end ? `${start} - ${end || (lang === 'es' ? 'Presente' : 'Present')}` : '';
        const link = proj.url ? ` | Link` : '';
        const descriptionBullets = generateBulletList(proj.description);

        return `
### ${proj.name}
*${proj.role}* | ${dateRange}${link}

${descriptionBullets}
`;
      })
      .join('\n');
  }

  const educationSection = education
    .map((edu) => {
      const start = formatDate(edu.startDate, false, lang);
      const end = formatDate(edu.endDate, edu.isCurrent, lang);
      return `
**${edu.degree}**
<br>
*${edu.institution} | ${start} - ${end}*
`;
    })
    .join('\n<br>\n');

  // --- NUEVO: SECCIONES PERSONALIZADAS ---
  let customSectionsContent = '';
  if (customSections && customSections.length > 0) {
    customSectionsContent = customSections
      .map((sec) => {
        const items = sec.items
          .map((item) => {
            return `
### ${item.title}
${item.subtitle ? `*${item.subtitle}*` : ''}

${item.description}
`;
          })
          .join('\n');
        return `## ${sec.title}\n\n${items}`;
      })
      .join('\n\n');
  }

  const titles =
    lang === 'es'
      ? {
          exp: 'Experiencia Profesional',
          skills: 'Habilidades Técnicas',
          edu: 'Educación',
          certs: 'Certificaciones',
          lang: 'Idiomas',
          int: 'Intereses',
          projects: 'Proyectos Destacados',
        }
      : {
          exp: 'Professional Experience',
          skills: 'Technical Skills',
          edu: 'Education',
          certs: 'Certifications',
          lang: 'Languages',
          int: 'Interests',
          projects: 'Key Projects',
        };

  // --- CONSTRUCCIÓN DINÁMICA DE SECCIONES ---
  const sectionsMap: Record<string, string> = {
    experience: experienceSection ? `\n## ${titles.exp}\n\n${experienceSection}` : '',
    projects: projectsSection ? `\n## ${titles.projects}\n\n${projectsSection}` : '',
    education: educationSection ? `\n## ${titles.edu}\n\n${educationSection}` : '',
    custom: customSectionsContent ? `\n\n${customSectionsContent}` : '',
    skills: (() => {
      let content = '';
      if (skills && skills.length > 0)
        content += `\n## ${titles.skills}\n\n${generateCategoryList(skills)}`;
      if (certifications && certifications.length > 0)
        content += `\n## ${titles.certs}\n\n${generateCategoryList(certifications)}`;
      if (data.languages) content += `\n\n**${titles.lang}:** ${data.languages}`;
      if (data.interests) content += `\n<br>\n**${titles.int}:** ${data.interests}`;
      return content;
    })(),
  };

  const order = sectionOrder || ['experience', 'projects', 'education', 'skills', 'custom'];

  let md = `
# ${personal.name}

**${personal.city}** | **${personal.email}** | **${personal.phone}**
<br>
${socialLinksLine}

${personal.summary}
`;

  order.forEach((sectionId: string) => {
    if (sectionsMap[sectionId]) md += sectionsMap[sectionId];
  });

  return md.trim();
};
