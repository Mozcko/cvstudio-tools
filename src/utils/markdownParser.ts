import type { CVData, CustomSection, Education, Experience, Project, SkillItem } from '../types/cv';
import { initialCVData } from '../types/cv';
import { isPresent, parseMonth, splitDateRange, titleToKey, titlesMap, CV_LANGS } from './cvLocale';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface ParseResult {
  success: boolean;
  data: CVData | null;
  /** Sections or fields that couldn't be fully parsed */
  warnings: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ────────────────────────────────────────────────────────────────────────────

let idCounter = 0;
function nextId(): string {
  return String(++idCounter);
}

function resetIdCounter(): void {
  idCounter = 0;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const labelPattern = (key: 'lang' | 'int') =>
  [...new Set(CV_LANGS.map((lang) => titlesMap[lang][key]))].map(escapeRegExp).join('|');

// "**Languages:** English, Spanish" / "**Interests:** ..." in any supported language
const LANGUAGES_LINE = new RegExp(`^\\*\\*(?:${labelPattern('lang')}):\\*\\*\\s*(.*)$`, 'i');
const INTERESTS_LINE = new RegExp(`^\\*\\*(?:${labelPattern('int')}):\\*\\*\\s*(.*)$`, 'i');

const isBreak = (line: string) => /^<br\s*\/?>$/i.test(line.trim());

/** Parses "abr 2023 - Presente" into structured dates. */
function parseRange(range: string): { start: string; end: string; isCurrent: boolean } {
  const [startText, endText] = splitDateRange(range);
  const isCurrent = isPresent(endText);
  return {
    start: parseMonth(startText),
    end: isCurrent ? '' : parseMonth(endText),
    isCurrent,
  };
}

/**
 * Split markdown into sections by `## ` headings.
 * Returns an array of { title, content } where the first entry has title = '' (the header).
 */
function splitSections(md: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const lines = md.split('\n');
  let currentTitle = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      // Save previous section
      sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
      currentTitle = h2Match[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  // Save last section
  sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });

  return sections;
}

/**
 * The generator appends the Languages / Interests lines to the "skills" slot, wherever
 * that slot happens to be. Pull them out of the document first so they never end up
 * inside another section's content.
 */
function extractLanguagesAndInterests(md: string): {
  markdown: string;
  languages: string;
  interests: string;
} {
  let languages = '';
  let interests = '';
  const kept: string[] = [];
  const lines = md.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const langMatch = line.match(LANGUAGES_LINE);
    if (langMatch) {
      languages = langMatch[1].trim();
      continue;
    }
    const intMatch = line.match(INTERESTS_LINE);
    if (intMatch) {
      interests = intMatch[1].trim();
      // Drop the <br> the generator puts between the two lines
      if (kept.length > 0 && isBreak(kept[kept.length - 1])) kept.pop();
      continue;
    }
    kept.push(lines[i]);
  }

  return { markdown: kept.join('\n'), languages, interests };
}

// ────────────────────────────────────────────────────────────────────────────
// Section Parsers
// ────────────────────────────────────────────────────────────────────────────

const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+$/.test(value);
const looksLikePhone = (value: string) => /^[+(]?\d[\d\s().-]{4,}$/.test(value);

/**
 * Parse the header block (before any ## heading).
 * Expected format:
 *   # Name
 *   **City** | **Email** | **Phone**      (empty fields are omitted)
 *   <br>
 *   **[LinkedIn](url)** | **[GitHub](url)**
 *   Summary text...
 */
function parseHeader(content: string, warnings: string[]): CVData['personal'] {
  const lines = content.split('\n').map((l) => l.trim());
  const personal: CVData['personal'] = {
    name: '',
    role: '',
    email: '',
    phone: '',
    city: '',
    summary: '',
    socials: [],
  };

  let lineIndex = 0;
  const skipBlank = (alsoBreaks = false) => {
    while (
      lineIndex < lines.length &&
      (!lines[lineIndex] || (alsoBreaks && isBreak(lines[lineIndex])))
    ) {
      lineIndex++;
    }
  };

  skipBlank();

  // Parse # Name
  if (lineIndex < lines.length) {
    const h1Match = lines[lineIndex].match(/^#\s+(.+)$/);
    if (h1Match) {
      personal.name = h1Match[1].trim();
      lineIndex++;
    } else {
      warnings.push('Could not find H1 name in header');
    }
  }

  skipBlank();

  // Parse the role / title line: <div class="cv-role">Role</div>
  if (lineIndex < lines.length) {
    const roleMatch = lines[lineIndex].match(/^<div class="cv-role">(.*)<\/div>$/);
    if (roleMatch) {
      personal.role = roleMatch[1].trim();
      lineIndex++;
    }
  }

  skipBlank();

  // Parse the contact line: bold parts that are not links
  if (lineIndex < lines.length && !lines[lineIndex].includes('](')) {
    const boldParts = [...lines[lineIndex].matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1].trim());
    if (boldParts.length === 3) {
      [personal.city, personal.email, personal.phone] = boldParts;
      lineIndex++;
    } else if (boldParts.length > 0 && boldParts.length < 3) {
      // Some fields were empty and omitted: work out which ones we have
      for (const part of boldParts) {
        if (!personal.email && looksLikeEmail(part)) personal.email = part;
        else if (!personal.phone && looksLikePhone(part)) personal.phone = part;
        else if (!personal.city) personal.city = part;
        else warnings.push(`Could not classify contact field "${part}"`);
      }
      lineIndex++;
    }
  }

  skipBlank(true);

  // Parse social links: **[Network](url)** | **[Network](url)**
  if (lineIndex < lines.length) {
    const socialMatches = [...lines[lineIndex].matchAll(/\*\*\[([^\]]*)\]\(([^)]*)\)\*\*/g)];
    if (socialMatches.length > 0) {
      personal.socials = socialMatches.map((m) => ({
        id: nextId(),
        network: m[1],
        username: '',
        url: m[2],
      }));
      lineIndex++;
    }
    // If no socials found, that's fine — not all CVs have them
  }

  skipBlank();

  // Everything remaining is the summary
  personal.summary = lines.slice(lineIndex).join('\n').trim();

  return personal;
}

/**
 * Parse experience section.
 * Expected format per entry:
 *   <table>
 *     <tr><td><strong>Company</strong></td><td><em>Role</em></td></tr>
 *     <tr><td><em>Location</em></td><td><em>Start - End</em></td></tr>
 *   </table>
 *   - Bullet 1
 *   - Bullet 2
 */
function parseExperience(content: string, warnings: string[]): Experience[] {
  const experiences: Experience[] = [];

  // Split by <table> blocks
  const tableBlocks = content.split(/<table>/i);

  for (const block of tableBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const exp: Experience = {
      id: nextId(),
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: null,
      isCurrent: false,
      description: [],
    };

    // Extract company and role from first <tr>
    const firstRowMatch = trimmed.match(
      /<tr>\s*<td><strong>([^<]*)<\/strong><\/td>\s*<td><em>([^<]*)<\/em><\/td>\s*<\/tr>/i
    );
    if (firstRowMatch) {
      exp.company = firstRowMatch[1].trim();
      exp.role = firstRowMatch[2].trim();
    }

    // Extract location and dates from second <tr>
    const secondRowMatch = trimmed.match(
      /<tr>\s*<td><em>([^<]*)<\/em><\/td>\s*<td><em>([^<]*)<\/em><\/td>\s*<\/tr>/i
    );
    if (secondRowMatch) {
      exp.location = secondRowMatch[1].trim();
      const range = parseRange(secondRowMatch[2]);
      exp.startDate = range.start;
      exp.isCurrent = range.isCurrent;
      exp.endDate = range.isCurrent ? null : range.end || null;
    }

    // Extract bullet points after </table>
    const afterTable = trimmed.split(/<\/table>/i)[1] || '';
    const bullets = afterTable
      .split('\n')
      .filter((line) => line.trim().startsWith('-'))
      .map((line) => line.trim().replace(/^-\s*/, ''));
    exp.description = bullets;

    // Only add if the block really was an entry table
    if (firstRowMatch || secondRowMatch) {
      experiences.push(exp);
    } else if (bullets.length > 0) {
      warnings.push('Found experience bullets without a company/role table');
    }
  }

  return experiences;
}

/**
 * Parse skills or certifications section.
 * Expected format:
 *   - **Category:** Items
 */
function parseCategoryList(content: string): SkillItem[] {
  const items: SkillItem[] = [];

  for (const line of content.split('\n')) {
    const match = line.trim().match(/^-\s+\*\*([^*]*):\*\*\s*(.*)$/);
    if (match) {
      items.push({
        id: nextId(),
        category: match[1].trim(),
        items: match[2].trim(),
      });
    }
  }

  return items;
}

/**
 * Parse education section.
 * Expected format (entries separated by <br>):
 *   **Degree**
 *   <br>
 *   *Institution | Start - End*
 */
function parseEducation(content: string, warnings: string[]): Education[] {
  const educations: Education[] = [];
  let current: Education | null = null;

  const startEntry = (): Education => {
    const edu: Education = {
      id: nextId(),
      institution: '',
      degree: '',
      startDate: '',
      endDate: null,
      isCurrent: false,
    };
    educations.push(edu);
    return edu;
  };

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || isBreak(line)) continue;

    // **Degree** starts a new entry (the degree may be empty: "****")
    const degreeMatch = line.match(/^\*\*([^*]*)\*\*$/);
    if (degreeMatch) {
      current = startEntry();
      current.degree = degreeMatch[1].trim();
      continue;
    }

    // *Institution | Start - End*
    const instMatch = line.match(/^\*([^*]+)\*$/);
    if (instMatch) {
      if (!current || current.institution || current.startDate) current = startEntry();
      const instContent = instMatch[1];
      const pipeIndex = instContent.indexOf('|');
      if (pipeIndex !== -1) {
        current.institution = instContent.substring(0, pipeIndex).trim();
        const range = parseRange(instContent.substring(pipeIndex + 1));
        current.startDate = range.start;
        current.isCurrent = range.isCurrent;
        current.endDate = range.isCurrent ? null : range.end || null;
      } else {
        current.institution = instContent.trim();
      }
      current = null;
    }
  }

  if (educations.length === 0 && content.trim()) {
    warnings.push('Could not parse education entries');
  }

  return educations;
}

/**
 * Parse projects section.
 * Expected format:
 *   ### Project Name
 *   *Role* | Start - End | [Link](url)      (each part is optional)
 *   - Bullet 1
 */
function parseProjects(content: string): Project[] {
  const projects: Project[] = [];

  // Split by ### headings
  const projectBlocks = content.split(/^###\s+/m);

  for (const block of projectBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');

    const proj: Project = {
      id: nextId(),
      name: lines[0].trim(),
      role: '',
      startDate: '',
      endDate: '',
      url: '',
      description: [],
    };

    let metaParsed = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Collect bullet points
      if (line.startsWith('-')) {
        proj.description.push(line.replace(/^-\s*/, ''));
        continue;
      }

      // The first other line is the metadata line
      if (metaParsed) continue;
      metaParsed = true;

      for (const token of line.split(/\s+\|\s+/)) {
        const part = token.trim();
        const roleMatch = part.match(/^\*([^*]+)\*$/);
        const linkMatch = part.match(/^\[[^\]]*\]\(([^)]*)\)$/);
        if (roleMatch) {
          proj.role = roleMatch[1].trim();
        } else if (linkMatch) {
          proj.url = linkMatch[1].trim();
        } else if (part && part.toLowerCase() !== 'link') {
          const range = parseRange(part);
          proj.startDate = range.start;
          proj.endDate = range.end;
        }
      }
    }

    if (proj.name) {
      projects.push(proj);
    }
  }

  return projects;
}

/**
 * Parse a custom section.
 * Expected format:
 *   ### Item Title
 *   *Subtitle*
 *
 *   Description text
 */
function parseCustomSection(title: string, content: string): CustomSection {
  const section: CustomSection = { id: nextId(), title, items: [] };

  const itemBlocks = content.split(/^###\s+/m);

  for (const block of itemBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');
    const itemTitle = lines[0].trim();

    let subtitle = '';
    const descriptionLines: string[] = [];
    let foundSubtitle = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!foundSubtitle && descriptionLines.length === 0) {
        const subMatch = line.match(/^\*([^*]+)\*$/);
        if (subMatch) {
          subtitle = subMatch[1].trim();
          foundSubtitle = true;
          continue;
        }
      }
      if (line || descriptionLines.length > 0) {
        descriptionLines.push(lines[i]); // Keep original indentation
      }
    }

    if (itemTitle) {
      section.items.push({
        id: nextId(),
        title: itemTitle,
        subtitle,
        description: descriptionLines.join('\n').trim(),
      });
    }
  }

  return section;
}

// ────────────────────────────────────────────────────────────────────────────
// Main Parser
// ────────────────────────────────────────────────────────────────────────────

/**
 * Parse a markdown string (as generated by markdownGenerator.ts) back into
 * a structured CVData object. Section headings are recognised in every
 * supported language.
 *
 * @param markdown - The raw markdown string
 * @returns ParseResult with success flag, data, and any warnings
 */
export function parseMarkdownToCV(markdown: string): ParseResult {
  resetIdCounter();
  const warnings: string[] = [];

  if (!markdown || !markdown.trim()) {
    return { success: false, data: null, warnings: ['Empty markdown content'] };
  }

  try {
    const extracted = extractLanguagesAndInterests(markdown);

    // Split into sections by ## headings
    const sections = splitSections(extracted.markdown);

    // Parse header (first section, no ## heading)
    const personal = parseHeader(sections[0].content, warnings);

    const cvData: CVData = {
      ...initialCVData,
      personal,
      experience: [],
      skills: [],
      education: [],
      certifications: [],
      languages: extracted.languages,
      interests: extracted.interests,
      projects: [],
      customSections: [],
      sectionOrder: [],
    };
    const projects: Project[] = [];
    const customSections: CustomSection[] = [];

    // Track section order as we encounter them
    const sectionOrder: string[] = [];
    const addToOrder = (id: string) => {
      if (!sectionOrder.includes(id)) sectionOrder.push(id);
    };

    // Process each ## section
    for (let i = 1; i < sections.length; i++) {
      const { title, content } = sections[i];
      if (!content.trim() && !title) continue;

      const key = titleToKey.get(title.toLowerCase());

      switch (key) {
        case 'exp': {
          cvData.experience = parseExperience(content, warnings);
          addToOrder('experience');
          break;
        }
        case 'skills': {
          cvData.skills = parseCategoryList(content);
          addToOrder('skills');
          break;
        }
        case 'certs': {
          // Certifications are part of the "skills" slot in the generator
          cvData.certifications.push(...parseCategoryList(content));
          addToOrder('skills');
          break;
        }
        case 'edu': {
          cvData.education = parseEducation(content, warnings);
          addToOrder('education');
          break;
        }
        case 'projects': {
          projects.push(...parseProjects(content));
          addToOrder('projects');
          break;
        }
        default: {
          // Unknown section → treat as custom section
          const customSection = parseCustomSection(title, content);

          // If there are no ### sub-items, create one item with the content as description
          if (customSection.items.length === 0 && content.trim()) {
            customSection.items.push({
              id: nextId(),
              title: title,
              subtitle: '',
              description: content.trim(),
            });
          }

          customSections.push(customSection);
          addToOrder('custom');
          break;
        }
      }
    }

    // Languages / interests alone still occupy the skills slot
    if (extracted.languages || extracted.interests) addToOrder('skills');

    cvData.projects = projects;
    cvData.customSections = customSections;
    cvData.sectionOrder = sectionOrder;

    // Determine success: we need at least a name or some content in any section
    const hasContent =
      !!personal.name ||
      cvData.experience.length > 0 ||
      cvData.education.length > 0 ||
      cvData.skills.length > 0 ||
      projects.length > 0;

    return { success: hasContent, data: cvData, warnings };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      data: null,
      warnings: [`Parser error: ${errorMsg}`],
    };
  }
}
