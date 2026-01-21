export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  date: string;
  description: string; // Usaremos bullets aquí
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  date: string;
}

export interface CVData {
  personal: {
    name: string;
    role: string;
    email: string;
    phone: string;
    city: string;
    linkedin: string;
    github: string;
    portfolio: string;
    summary: string;
  };
  experience: Experience[];
  skills: string; // Texto libre o lista separada por comas
  education: Education[];
  certifications: string;
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
    linkedin: "https://linkedin.com/in/...",
    github: "https://github.com/Mozcko",
    portfolio: "https://joaquinramos.dev",
    summary: "Data Analyst with data engineering experience using **Azure**..."
  },
  experience: [
    {
      id: "1",
      company: "Infosys",
      role: "Systems Engineer Trainee",
      location: "CDMX (On-Site)",
      date: "January 2025 - Present",
      description: "- Develop and optimize data pipelines using **Azure Data Factory**..."
    }
  ],
  skills: "- **Cloud:** Azure Databricks\n- **Languages:** Python, SQL",
  education: [
    {
        id: "1",
        degree: "Master's in Analytics",
        institution: "Universidad Tecnológica de México",
        date: "Sept 2024 - Present"
    }
  ],
  certifications: "- **Networking:** CCNAv7",
  languages: "Spanish (Native), English (B2-C1)",
  interests: "Machine Learning, tech trends..."
};