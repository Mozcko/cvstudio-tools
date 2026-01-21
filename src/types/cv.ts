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
  url: string;     // Ej: "https://..."
}

export interface SkillItem {
  id: string;
  category: string; // La parte en negrita (ej: "Lenguajes")
  items: string; // El resto del texto (ej: "Python, SQL")
}

export interface CVData {
  personal: {
    name: string;
    role: string;
    email: string;
    phone: string;
    city: string;
    summary: string;
    socials: SocialLink[]; // <--- CAMBIO: Array dinámico
  };
  experience: Experience[];
  skills: SkillItem[]; // <--- CAMBIO AQUÍ
  education: Education[];
  certifications: SkillItem[]; // <--- CAMBIO AQUÍ
  languages: string;
  interests: string;
}

export const initialCVData: CVData = {
  personal: {
    name: "Joaquín Eduardo Ramos Farfán",
    role: "Data Analyst",
    email: "joaquin.ramosff@gmail.com",
    phone: "5559336056",
    city: "CDMX, Mexico",
    summary: "Data Analyst with data engineering experience using **Azure (Databricks, Data Factory)**, SQL and Python. Focused on transforming complex data into clear, actionable business strategies.",
    socials: [
        { id: "1", network: "LinkedIn", username: "Joaquín Ramos", url: "https://linkedin.com/in/..." },
        { id: "2", network: "GitHub", username: "Mozcko", url: "https://github.com/Mozcko" },
        { id: "3", network: "Portfolio", username: "joaquinramos.dev", url: "https://joaquinramos.dev" }
    ]
  },
  experience: [
    {
      id: "1",
      company: "Infosys",
      role: "Systems Engineer Trainee",
      location: "CDMX (On-Site)",
      startDate: "2025-01",
      endDate: null,
      isCurrent: true,
      description: [ // <--- CAMBIO: Lista de bullets
        "Develop and optimize data pipelines using **Azure Data Factory** for ETL/ELT processes.",
        "Ensure data quality and integrity across multiple environments."
      ]
    },
  ],
  // Datos iniciales estructurados
  skills: [
    {
      id: "1",
      category: "Cloud & Big Data",
      items: "Azure Databricks, Azure Data Factory, Azure Ecosystem",
    },
    {
      id: "2",
      category: "Languages",
      items:
        "Python (Pandas, Scikit-learn), SQL (Advanced), Java, C#, JavaScript",
    },
    { id: "3", category: "Databases", items: "SQL, MongoDB" },
    { id: "4", category: "Operating Systems", items: "Linux, Windows" },
  ],
  education: [
    {
      id: "1",
      degree: "Master's in Analytics and Business Intelligence",
      institution: "Universidad Tecnológica de México",
      startDate: "2024-09",
      endDate: null,
      isCurrent: true,
    },
    {
      id: "2",
      degree: "Bachelor of Science in Computer Systems Engineering",
      institution: "Universidad Tecnológica de México",
      startDate: "2020-07",
      endDate: "2024-08",
      isCurrent: false,
    },
  ],
  certifications: [
    {
      id: "1",
      category: "Networking & Security",
      items:
        "CCNAv7 (Routing & Security Essentials), Cybersecurity Essentials (CISCO)",
    },
    {
      id: "2",
      category: "Programming",
      items:
        "Python Core & Data Structures (SoloLearn), Database Management System (Infosys)",
    },
  ],
  languages: "Spanish (Native), English (B2-C1).",
  interests:
    "Machine Learning, tech trends, cybersecurity, open source, travel, and the Scout community.",
};
