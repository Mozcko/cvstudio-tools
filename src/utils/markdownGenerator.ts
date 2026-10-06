import type { CVData, CVLang, SkillItem, SocialLink } from '../types/cv';
import { DEFAULT_SECTION_ORDER } from '../types/cv';
import { formatMonth, presentLabel, titlesMap } from './cvLocale';

const formatDate = (dateString: string | null, isCurrent: boolean, lang: CVLang): string => {
  if (isCurrent) return presentLabel[lang] || presentLabel.en;
  return formatMonth(dateString, lang);
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

// Helper para generar enlaces sociales dinámicos
const generateSocialLinks = (socials: SocialLink[]): string => {
  if (!Array.isArray(socials)) return '';
  return socials.map((link) => `**[${link.network}](${link.url})**`).join(' | ');
};

export const generateMarkdown = (data: CVData, lang: CVLang = 'en'): string => {
  const { personal, experience, education, skills, certifications, projects, customSections } =
    data;
  const titles = titlesMap[lang] || titlesMap.en;
  const present = presentLabel[lang] || presentLabel.en;

  const socialLinksLine = generateSocialLinks(personal.socials);

  const experienceSection = (experience || [])
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

  const projectsSection = (projects || [])
    .map((proj) => {
      const start = formatDate(proj.startDate, false, lang);
      const end = formatDate(proj.endDate, false, lang);
      const dateRange = start || end ? `${start} - ${end || present}` : '';
      // Only the parts that exist are printed, e.g. "*Role* | abr 2023 - Presente | [Link](url)"
      const meta = [
        proj.role ? `*${proj.role}*` : '',
        dateRange,
        proj.url ? `[Link](${proj.url})` : '',
      ]
        .filter(Boolean)
        .join(' | ');
      const descriptionBullets = generateBulletList(proj.description);

      return `
### ${proj.name}
${meta}

${descriptionBullets}
`;
    })
    .join('\n');

  const educationSection = (education || [])
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

  const customSectionsContent = (customSections || [])
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

  const order = (
    data.sectionOrder && data.sectionOrder.length > 0 ? data.sectionOrder : DEFAULT_SECTION_ORDER
  ).map((s) => s.toLowerCase());

  // Empty contact fields are left out instead of printing empty bold markers
  const contactLine = [personal.city, personal.email, personal.phone]
    .filter(Boolean)
    .map((value) => `**${value}**`)
    .join(' | ');

  let md = `
# ${personal.name}

${contactLine}
<br>
${socialLinksLine}

${personal.summary}
`;

  order.forEach((sectionId: string) => {
    if (sectionsMap[sectionId]) md += sectionsMap[sectionId];
  });

  return md.trim();
};
