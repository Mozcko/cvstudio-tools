import type { CVData } from '../types/cv';

export const generateMarkdown = (data: CVData): string => {
  const { personal, experience, education } = data;

  // Generamos las tablas de experiencia dinámicamente
  const experienceSection = experience.map(exp => `
<table>
  <tr>
    <td><strong>${exp.company}</strong></td>
    <td><em>${exp.role}</em></td>
  </tr>
  <tr>
    <td><em>${exp.location}</em></td>
    <td><em>${exp.date}</em></td>
  </tr>
</table>

${exp.description}
`).join('\n');

  // Generamos la sección de educación
  const educationSection = education.map(edu => `
**${edu.degree}**
<br>
*${edu.institution} | ${edu.date}*
`).join('\n<br>\n');

  return `
# ${personal.name}

**${personal.city}** | **${personal.email}** | **${personal.phone}**
<br>
**[LinkedIn](${personal.linkedin})** | **[GitHub](${personal.github})** | **[Portfolio](${personal.portfolio})**

${personal.summary}

## Professional Experience

${experienceSection}

## Technical Skills

${data.skills}

## Education

${educationSection}

## Certifications

${data.certifications}

**Languages:** ${data.languages}
<br>
**Interests:** ${data.interests}
`.trim();
};