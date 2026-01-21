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
  if (!Array.isArray(items)) return ""; 
  return items.map(item => `- **${item.category}:** ${item.items}`).join('\n');
};

// Helper para generar lista de bullets simples (Experience)
const generateBulletList = (items: string[]): string => {
    if (!Array.isArray(items)) return "";
    return items.map(item => `- ${item}`).join('\n');
}

// NUEVO: Helper para generar enlaces sociales dinámicos
// Soluciona el error de 'platform' vs 'network' y la limitación de links fijos
const generateSocialLinks = (socials: SocialLink[]): string => {
    if (!Array.isArray(socials)) return "";
    // Genera: **[LinkedIn](url)** | **[GitHub](url)** ...
    return socials.map(link => `**[${link.network}](${link.url})**`).join(' | ');
}

export const generateMarkdown = (data: CVData, lang: 'es' | 'en' = 'en'): string => {
  const { personal, experience, education, skills, certifications } = data;

  // Generamos la línea de contactos usando la función dinámica
  const socialLinksLine = generateSocialLinks(personal.socials);

  const experienceSection = experience.map(exp => {
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
  }).join('\n');

  const educationSection = education.map(edu => {
    const start = formatDate(edu.startDate, false, lang);
    const end = formatDate(edu.endDate, edu.isCurrent, lang);
    return `
**${edu.degree}**
<br>
*${edu.institution} | ${start} - ${end}*
`;
  }).join('\n<br>\n');

  const titles = lang === 'es' ? {
    exp: "Experiencia Profesional",
    skills: "Habilidades Técnicas",
    edu: "Educación",
    certs: "Certificaciones",
    lang: "Idiomas",
    int: "Intereses"
  } : {
    exp: "Professional Experience",
    skills: "Technical Skills",
    edu: "Education",
    certs: "Certifications",
    lang: "Languages",
    int: "Interests"
  };

  return `
# ${personal.name}

**${personal.city}** | **${personal.email}** | **${personal.phone}**
<br>
${socialLinksLine}

${personal.summary}

## ${titles.exp}

${experienceSection}

## ${titles.skills}

${generateCategoryList(skills)}

## ${titles.edu}

${educationSection}

## ${titles.certs}

${generateCategoryList(certifications)}

**${titles.lang}:** ${data.languages}
<br>
**${titles.int}:** ${data.interests}
`.trim();
};