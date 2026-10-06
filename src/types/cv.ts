export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  // Nuevos campos estructurados
  startDate: string; // YYYY-MM
  endDate: string | null;
  isCurrent: boolean;
}

export interface SocialLink {
  id: string;
  network: string; // Ej: "LinkedIn", "Web", "Twitter"
  username: string; // Ej: "mozcko" (Opcional, para mostrar en texto)
  url: string; // Ej: "https://..."
}

export interface SkillItem {
  id: string;
  category: string; // La parte en negrita (ej: "Lenguajes")
  items: string; // El resto del texto (ej: "Python, SQL")
}

export interface Project {
  id: string;
  name: string;
  role: string;
  startDate: string; // YYYY-MM or ''
  endDate: string; // YYYY-MM or ''
  url: string;
  description: string[];
}

export interface CustomItem {
  id: string | number;
  title: string;
  subtitle: string;
  description: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomItem[];
}

export type CVLang = 'es' | 'en' | 'pt';

export type SectionId = 'experience' | 'projects' | 'education' | 'skills' | 'custom';

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'experience',
  'projects',
  'education',
  'skills',
  'custom',
];

export interface CVData {
  personal: {
    name: string;
    role: string;
    email: string;
    phone: string;
    city: string;
    summary: string;
    socials: SocialLink[];
  };
  experience: Experience[];
  skills: SkillItem[];
  education: Education[];
  certifications: SkillItem[];
  languages: string;
  interests: string;
  projects?: Project[];
  customSections?: CustomSection[];
  /** Order of the reorderable blocks; missing ids are appended in default order. */
  sectionOrder?: string[];
  /** 'ES' | 'EN' | 'PT' — language the CV content is written in. */
  language?: string;
}

/** What the backend stores when a CV was saved from the Markdown editor. */
export interface MarkdownCVContent {
  mode: 'markdown';
  markdown: string;
}

export type CVContent = CVData | MarkdownCVContent;

export const isMarkdownContent = (content: unknown): content is MarkdownCVContent =>
  typeof content === 'object' &&
  content !== null &&
  (content as { mode?: unknown }).mode === 'markdown';

export const initialCVData: CVData = {
  personal: {
    name: 'John Doe',
    role: 'Software Engineer',
    email: 'email@example.com',
    phone: '+1 234 567 890',
    city: 'New York, USA',
    summary:
      'Software Engineer with experience in **Cloud Computing**, **Data Analysis**, and **Full Stack Development**. Passionate about building scalable solutions and optimizing workflows.',
    socials: [
      { id: '1', network: 'LinkedIn', username: 'johndoe', url: 'https://linkedin.com/in/johndoe' },
      { id: '2', network: 'GitHub', username: 'johndoe', url: 'https://github.com/johndoe' },
      { id: '3', network: 'Portfolio', username: 'johndoe.dev', url: 'https://johndoe.dev' },
    ],
  },
  experience: [
    {
      id: '1',
      company: 'Tech Company Inc.',
      role: 'Senior Developer',
      location: 'New York, NY (Remote)',
      startDate: '2023-01',
      endDate: null,
      isCurrent: true,
      description: [
        // <--- CAMBIO: Lista de bullets
        'Led the migration of legacy systems to a microservices architecture, improving scalability by 40%.',
        'Mentored junior developers and conducted code reviews to ensure high-quality standards.',
      ],
    },
    {
      id: '2',
      company: 'Startup Solutions',
      role: 'Junior Software Engineer',
      location: 'San Francisco, CA (Hybrid)',
      startDate: '2020-06',
      endDate: '2022-12',
      isCurrent: false,
      description: [
        'Developed and maintained RESTful APIs using Node.js and Express.',
        'Collaborated with the product team to implement new features based on user feedback.',
      ],
    },
  ],
  // Datos iniciales estructurados
  skills: [
    {
      id: '1',
      category: 'Languages',
      items: 'JavaScript, TypeScript, Python, Java',
    },
    {
      id: '2',
      category: 'Frameworks',
      items: 'React, Next.js, Node.js, Django',
    },
    { id: '3', category: 'Cloud & DevOps', items: 'AWS, Docker, Kubernetes, CI/CD' },
    { id: '4', category: 'Databases', items: 'PostgreSQL, MongoDB, Redis' },
  ],
  education: [
    {
      id: '1',
      degree: 'Master of Computer Science',
      institution: 'State University',
      startDate: '2018-09',
      endDate: '2020-06',
      isCurrent: false,
    },
    {
      id: '2',
      degree: 'Bachelor of Science in Computer Engineering',
      institution: 'City College',
      startDate: '2014-09',
      endDate: '2018-06',
      isCurrent: false,
    },
  ],
  certifications: [
    {
      id: '1',
      category: 'Cloud',
      items: 'AWS Certified Solutions Architect',
    },
    {
      id: '2',
      category: 'Security',
      items: 'CompTIA Security+',
    },
  ],
  languages: 'English (Native), Spanish (Intermediate).',
  interests: 'Open Source, AI Research, Hiking, Photography.',
};
