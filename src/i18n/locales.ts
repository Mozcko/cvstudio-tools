export const locales = {
  es: {
    header: {
      title: 'CV Builder',
      reset: 'Resetear',
      download: 'Descargar PDF',
      visualEditor: 'Editor Visual',
      codeEditor: 'Código Markdown',
      editorWarning:
        '⚠️ Modo Avanzado: Los cambios directos al código no actualizan el editor visual.',
      preview: 'Vista Previa',
      editor: 'Editor',
      emptyFieldsNotice: 'Los campos vacíos se ocultarán automáticamente en el documento.',
      showHelp: 'Mostrar Ayuda',
      reorder: 'Acomodar Secciones',
    },
    sections: {
      personal: 'Información Personal',
      experience: 'Experiencia Laboral',
      edu: 'Educación',
      skills: 'Habilidades y Certificaciones',
      projects: 'Proyectos Destacados',
      custom: 'Secciones Personalizadas',
    },
    labels: {
      // Personal
      fullName: 'Nombre Completo',
      role: 'Rol / Título',
      email: 'Email',
      phone: 'Teléfono',
      city: 'Ciudad',
      network: 'Red / Sitio (ej. LinkedIn)',
      url: 'Enlace / URL',
      summary: 'Resumen Profesional',

      // Experiencia
      company: 'Empresa',
      location: 'Ubicación',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      currentWork: 'Actualmente trabajo aquí',
      description: 'Responsabilidades / Logros',

      // Educación
      institution: 'Institución / Universidad',
      degree: 'Título / Grado',
      currentStudy: 'Actualmente estudio aquí',

      // Listas Dinámicas (Skills/Certs)
      category: 'Categoría (ej. Cloud)',
      itemsList: 'Elementos (ej. Azure, AWS)',
      techSkills: 'Habilidades Técnicas',
      certifications: 'Certificaciones',

      // Otros
      languages: 'Idiomas',
      interests: 'Intereses',
      page: 'Página',
      pages: 'Páginas',

      // Projects & Custom
      project: 'Nombre del Proyecto',
      sectionTitle: 'Título de la Sección',
      itemTitle: 'Título del Elemento',
      itemSubtitle: 'Subtítulo / Rol / Fecha',
    },
    actions: {
      add: '+ Agregar',
      delete: 'Eliminar',
      confirmDelete: '¿Eliminar esta entrada?',
      confirmReset: '¿Estás seguro de reiniciar al CV por defecto? Perderás los cambios actuales.',
      addItem: '+ Añadir Elemento',
      addBullet: '+ Añadir Punto',
      addLink: '+ Añadir Enlace',
      addSection: '+ Nueva Sección',
      save: 'Guardar',
      saving: 'Guardando...',
      saved: 'Guardado',
      close: 'Cerrar',
    },
    ai: {
      button: 'Herramientas IA',
      processing: 'Procesando...',
      overlayText: 'Generando mejoras con IA...',
      dropdown: {
        enhance: 'Mejorar Redacción',
        optimize: 'Optimizar para Oferta',
        translate: 'Traducir (ES/EN)',
        poweredBy: 'Potenciado por Deepseek',
      },
      alerts: {
        enhance: 'IA: He mejorado la redacción de tu perfil profesional.',
        translate: 'IA: He traducido los campos principales.',
        optimize: 'IA: He ajustado las keywords para coincidir con el puesto.',
      },
      jobDescriptionPrompt:
        'Pega aquí la descripción de la oferta de trabajo para optimizar tu CV:',
      ats: {
        button: 'Simulador ATS',
        title: 'Simulador de Entrevista & ATS',
        description:
          'Pega la descripción de la oferta. La IA analizará tu CV actual contra los requisitos reales.',
        placeholder: 'Pega aquí el Job Description (JD)...',
        analyze: 'Analizar Match',
        analyzing: 'Analizando...',
        score: 'ATS Score',
        probability: 'Probabilidad de Entrevista',
        missingKeywords: 'Keywords Faltantes',
        improvements: 'Acciones de Mejora',
        requirements: 'Análisis de Requisitos',
      },
    },
  },
  en: {
    header: {
      title: 'CV Builder',
      reset: 'Reset',
      download: 'Download PDF',
      visualEditor: 'Visual Editor',
      codeEditor: 'Markdown Code',
      editorWarning: '⚠️ Advanced Mode: Direct code changes do not update the visual editor.',
      preview: 'Preview',
      editor: 'Editor',
      emptyFieldsNotice: 'Empty fields will be automatically hidden in the document.',
      showHelp: 'Show Help',
      reorder: 'Reorder Sections',
    },
    sections: {
      personal: 'Personal Information',
      experience: 'Work Experience',
      edu: 'Education',
      skills: 'Skills & Certifications',
      projects: 'Key Projects',
      custom: 'Custom Sections',
    },
    labels: {
      // Personal
      fullName: 'Full Name',
      role: 'Role / Title',
      email: 'Email',
      phone: 'Phone',
      city: 'City/Location',
      network: 'Network / Site (e.g. LinkedIn)',
      url: 'Link / URL',
      summary: 'Professional Summary',

      // Experience
      company: 'Company',
      location: 'Location',
      startDate: 'Start Date',
      endDate: 'End Date',
      currentWork: 'I currently work here',
      description: 'Responsibilities / Achievements',

      // Education
      institution: 'Institution / University',
      degree: 'Degree / Major',
      currentStudy: 'I currently study here',

      // Dynamic Lists (Skills/Certs)
      category: 'Category (e.g. Cloud)',
      itemsList: 'Items (e.g. Azure, AWS)',
      techSkills: 'Technical Skills',
      certifications: 'Certifications',

      // Others
      languages: 'Languages',
      interests: 'Interests',
      page: 'Page',
      pages: 'Pages',

      // Projects & Custom
      project: 'Project Name',
      sectionTitle: 'Section Title',
      itemTitle: 'Item Title',
      itemSubtitle: 'Subtitle / Role / Date',
    },
    actions: {
      add: '+ Add',
      delete: 'Delete',
      confirmDelete: 'Delete this entry?',
      confirmReset: 'Are you sure you want to reset to default? You will lose current changes.',
      addItem: '+ Add Item',
      addBullet: '+ Add Bullet',
      addLink: '+ Add Link',
      addSection: '+ New Section',
      save: 'Save',
      saving: 'Saving...',
      saved: 'Saved',
      close: 'Close',
    },
    ai: {
      button: 'AI Tools',
      processing: 'Processing...',
      overlayText: 'Generating improvements with AI...',
      dropdown: {
        enhance: 'Enhance Writing',
        optimize: 'Optimize for Job Post',
        translate: 'Translate (ES/EN)',
        poweredBy: 'Powered by Deepseek',
      },
      alerts: {
        enhance: 'AI: I have improved your professional summary.',
        translate: 'AI: I have translated the main fields.',
        optimize: 'AI: I have adjusted keywords to match the job post.',
      },
      jobDescriptionPrompt: 'Paste the job description here to optimize your CV:',
      ats: {
        button: 'ATS Simulator',
        title: 'ATS & Interview Simulator',
        description:
          'Paste the job description. AI will analyze your current CV against real requirements.',
        placeholder: 'Paste Job Description (JD) here...',
        analyze: 'Analyze Match',
        analyzing: 'Analyzing...',
        score: 'ATS Score',
        probability: 'Interview Probability',
        missingKeywords: 'Missing Keywords',
        improvements: 'Improvement Actions',
        requirements: 'Requirements Analysis',
      },
    },
  },
};

export type Translation = typeof locales.es;
