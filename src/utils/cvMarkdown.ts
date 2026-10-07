import { generateMarkdown } from './markdownGenerator';
import { isMarkdownContent, type CVData, type CVLang } from '../types/cv';

const toLang = (language: string | null | undefined): CVLang => {
  const code = (language || 'es').toLowerCase();
  return (['es', 'en', 'pt'].includes(code) ? code : 'es') as CVLang;
};

/**
 * Markdown for a stored CV, whatever shape it was saved in: hand-written Markdown is returned
 * as it is, structured data goes through the generator with missing parts filled in.
 */
export function cvToMarkdown(content: unknown, language?: string | null): string {
  if (isMarkdownContent(content)) return content.markdown || '';

  const raw = (content && typeof content === 'object' ? content : {}) as Partial<CVData>;
  const data: CVData = {
    ...raw,
    personal: {
      name: '',
      role: '',
      summary: '',
      email: '',
      phone: '',
      city: '',
      ...(raw.personal || {}),
      socials: raw.personal?.socials || [],
    },
    experience: raw.experience || [],
    education: raw.education || [],
    skills: raw.skills || [],
    certifications: raw.certifications || [],
    languages: raw.languages || '',
    interests: raw.interests || '',
  };
  return generateMarkdown(data, toLang(language));
}
