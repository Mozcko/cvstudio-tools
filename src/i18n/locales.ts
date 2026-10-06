export const locales = {
  es: {
    ui: {
      nav: {
        home: 'Inicio',
        features: 'Características',
        pricing: 'Precios',
        dashboard: 'Mis CVs',
        signIn: 'Iniciar Sesión',
        login: 'Iniciar Sesión',
        upgrade: 'Upgrade to Pro 🚀',
      },
      hero: {
        badge: '✨ Potenciado por IA',
        title: 'Tu currículum profesional,',
        titleAccent: 'optimizado en segundos.',
        description:
          'Deja que la IA corrija tu redacción, traduzca tu perfil y optimice tus habilidades para pasar los filtros ATS. Sin complicaciones.',
        cta: 'Crear mi CV Gratis →',
      },
      features: {
        title: 'Potencia tu búsqueda de empleo',
        description:
          'Herramientas diseñadas por expertos para darte una ventaja competitiva en el mercado laboral actual.',
        items: {
          ai: {
            title: 'IA de Redacción Avanzada',
            description:
              'Mejora tu perfil y experiencia con sugerencias impulsadas por IA. Profesionalismo garantizado en cada palabra.',
          },
          ats: {
            title: 'Simulador de Filtros ATS',
            description:
              'Analiza tu CV contra descripciones de trabajo reales y descubre qué tan bien pasas los sistemas de reclutamiento automáticos.',
          },
          editor: {
            title: 'Editor en Tiempo Real',
            description:
              'Visualiza los cambios en tu currículum instantáneamente. Elige entre múltiples plantillas profesionales diseñadas para impresionar.',
          },
          coverLetter: {
            title: 'Cartas de Presentación',
            description:
              'Genera cartas de presentación personalizadas para cada oferta de empleo utilizando la información de tu perfil y la descripción del puesto.',
          },
          multilingual: {
            title: 'Multilingüe por Defecto',
            description:
              '¿Necesitas tu CV en inglés o español? Tradúcelo con un clic manteniendo el formato y la calidad profesional.',
          },
          export: {
            title: 'Exportación Impecable',
            description:
              'Descarga tu currículum en PDF de alta calidad, optimizado para impresión y sistemas de lectura digital.',
          },
        },
      },
      pricing: {
        title: 'Planes para cada etapa',
        description: 'Sin suscripciones mensuales. Solo pagas por lo que necesitas.',
        recommended: 'Recomendado',
        loading: 'Cargando...',
        plans: {
          free: {
            name: 'Básico',
            price: 'Gratis',
            action: 'Empezar Gratis',
            features: [
              'Hasta 3 CVs',
              'Editor profesional',
              'Mejora de texto con IA (No incluido)',
              'Cartas de presentación (No incluido)',
              'Simulador ATS (No incluido)',
            ],
          },
          sprint: {
            name: 'Sprint Pass',
            price: '$2.50',
            duration: ' / 7 días',
            action: 'Seleccionar',
            features: ['Hasta 30 CVs', 'IA Avanzada', 'Cartas Ilimitadas', 'Simulador ATS'],
          },
          active: {
            name: 'Active Hunt',
            price: '$10.00',
            duration: ' / 30 días',
            action: 'Mejor Opción',
            features: [
              'Todo lo del Sprint',
              'CVs Ilimitados',
              'Acceso por un mes',
              'Soporte prioritario',
              'Optimización continua',
            ],
          },
          lifetime: {
            name: 'Lifetime',
            price: '$29.00',
            duration: ' / siempre',
            action: 'Acceso Total',
            features: [
              'Todo lo del Active Hunt',
              'CVs Ilimitados',
              'Actualizaciones futuras',
              'Soporte 24/7',
              'Sin límites',
            ],
          },
        },
        table: {
          feature: 'Característica',
          basic: 'Básico',
          pro: 'Pro (Todos los Planes)',
          rows: {
            limit: 'Límite de Currículums',
            ai: 'Mejora de redacción con IA',
            cover: 'Cartas de Presentación IA',
            ats: 'Simulador de Filtros ATS',
            pdf: 'Descarga en PDF',
            watermark: '',
            limitValues: 'Hasta 3 / 30 (Sprint) / Ilimitados',
            aiValue: 'Avanzada',
          },
        },
      },
      footer: {
        rights: 'Todos los derechos reservados.',
      },
    },
    header: {
      title: 'CV Builder',
      reset: 'Resetear',
      download: 'Descargar PDF',
      visualEditor: 'Editor Visual',
      codeEditor: 'Código Markdown',
      editorWarning:
        'Modo Avanzado: Los cambios directos al código no actualizan el editor visual.',
      parseError:
        'No se pudo convertir el markdown al editor visual. Permaneciendo en modo código.',
      preview: 'Vista Previa',
      editor: 'Editor',
      emptyFieldsNotice: 'Los campos vacíos se ocultarán automáticamente en el documento.',
      showHelp: 'Mostrar Help',
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
      undo: 'Deshacer',
      redo: 'Rehacer',
    },
    messages: {
      saved: 'CV guardado',
      saveError: 'Error al guardar. Se reintentará cuando hagas otro cambio.',
      notFound: 'CV no encontrado, iniciando uno nuevo',
      limitTitle: 'Límite del plan gratuito',
      limitDescription:
        'Has alcanzado el máximo de CVs del plan gratuito. Mejora a Pro para crear más.',
      upgradeTitle: 'Función Pro',
      upgradeDescription: 'Esta función está disponible con el plan Pro.',
      authTitle: 'Inicia sesión para continuar',
      authDescription: 'Crea una cuenta gratuita para guardar tus CVs en la nube.',
      signInToOpen: 'Inicia sesión para abrir este CV.',
      signInToDownload: 'Regístrate gratis para descargar tu currículum en PDF.',
      aiError: 'La IA no pudo procesar la solicitud. Inténtalo de nuevo.',
      aiRateLimited: 'Has alcanzado el límite de uso de IA. Inténtalo más tarde.',
      atsError: 'No se pudo completar el análisis ATS.',
      coverLetterError: 'No se pudo generar la carta.',
      copyCreated: 'Copia creada',
      applied: 'Cambios aplicados',
      genericError: 'Algo salió mal. Inténtalo de nuevo.',
      loading: 'Cargando...',
      upgrade: 'Mejorar a Pro',
      signIn: 'Iniciar sesión',
      pageBreak: 'Salto de página aproximado',
    },
    ai: {
      button: 'Herramientas IA',
      processing: 'Procesando...',
      overlayText: 'Generando mejoras con IA...',
      dropdown: {
        enhance: 'Mejorar Redacción',
        optimize: 'Optimizar para Oferta',
        translate: 'Traducir (ES/EN)',
        poweredBy: 'Potenciado por IA Avanzada',
      },
      alerts: {
        enhance: 'IA: He mejorado la redacción de tu perfil profesional.',
        translate: 'IA: He traducido los campos principales.',
        optimize: 'IA: He ajustado las keywords para coincidir con el puesto.',
      },
      jobDescriptionPrompt:
        'Pega aquí la descripción de la oferta de trabajo para optimizar tu CV:',
      optimize: {
        title: 'Optimización para Oferta',
        description:
          'Pega la descripción de la oferta para que la IA ajuste tu CV a los requisitos específicos, mejorando el match con el puesto.',
        placeholder: 'Pega aquí la descripción de la vacante (JD)...',
        action: 'Optimizar CV',
      },
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
      coverLetter: {
        button: 'Generar Cover Letter',
        title: 'Generador de Carta de Presentación',
        description:
          'La IA redactará una carta personalizada conectando tu experiencia con los requisitos de la oferta.',
        placeholder: 'Pega aquí la descripción del puesto (JD)...',
        generate: 'Generar Carta',
        generating: 'Escribiendo...',
        copy: 'Copiar al Portapapeles',
        copied: '¡Copiada!',
        emptyWarning: 'Por favor ingresa la descripción del trabajo.',
      },
    },
  },
  en: {
    ui: {
      nav: {
        home: 'Home',
        features: 'Features',
        pricing: 'Pricing',
        dashboard: 'My CVs',
        signIn: 'Sign In',
        login: 'Sign In',
        upgrade: 'Upgrade to Pro 🚀',
      },
      hero: {
        badge: '✨ Powered by AI',
        title: 'Your professional resume,',
        titleAccent: 'optimized in seconds.',
        description:
          'Let AI correct your writing, translate your profile, and optimize your skills to pass ATS filters. No complications.',
        cta: 'Create my CV Free →',
      },
      features: {
        title: 'Power your job search',
        description:
          "Expertly designed tools to give you a competitive edge in today's job market.",
        items: {
          ai: {
            title: 'Advanced AI Writing',
            description:
              'Enhance your profile and experience with suggestions powered by AI. Professionalism guaranteed in every word.',
          },
          ats: {
            title: 'ATS Filter Simulator',
            description:
              'Analyze your CV against real job descriptions and discover how well you pass automated recruitment systems.',
          },
          editor: {
            title: 'Real-time Editor',
            description:
              'Visualize changes to your resume instantly. Choose from multiple professional templates designed to impress.',
          },
          coverLetter: {
            title: 'Cover Letters',
            description:
              'Generate personalized cover letters for each job offer using your profile information and the job description.',
          },
          multilingual: {
            title: 'Multilingual by Default',
            description:
              'Need your CV in English or Spanish? Translate it with one click while maintaining formatting and professional quality.',
          },
          export: {
            title: 'Flawless Export',
            description:
              'Download your resume in high-quality PDF, optimized for printing and digital reading systems.',
          },
        },
      },
      pricing: {
        title: 'Plans for every stage',
        description: 'No monthly subscriptions. Only pay for what you need.',
        recommended: 'Recommended',
        loading: 'Loading...',
        plans: {
          free: {
            name: 'Basic',
            price: 'Free',
            action: 'Get Started Free',
            features: [
              'Up to 3 CVs',
              'Professional editor',
              'AI writing enhancement (Not included)',
              'Cover letters (Not included)',
              'ATS simulator (Not included)',
            ],
          },
          sprint: {
            name: 'Sprint Pass',
            price: '$2.50',
            duration: ' / 7 days',
            action: 'Select',
            features: ['Up to 30 CVs', 'Advanced AI', 'Unlimited Letters', 'ATS Simulator'],
          },
          active: {
            name: 'Active Hunt',
            price: '$10.00',
            duration: ' / 30 days',
            action: 'Best Option',
            features: [
              'Everything in Sprint',
              'Unlimited CVs',
              'Access for one month',
              'Priority support',
              'Continuous optimization',
            ],
          },
          lifetime: {
            name: 'Lifetime',
            price: '$29.00',
            duration: ' / forever',
            action: 'Total Access',
            features: [
              'Everything in Active Hunt',
              'Unlimited CVs',
              'Future updates',
              '24/7 Support',
              'No limits',
            ],
          },
        },
        table: {
          feature: 'Feature',
          basic: 'Basic',
          pro: 'Pro (All Plans)',
          rows: {
            limit: 'Resume Limit',
            ai: 'AI writing enhancement',
            cover: 'AI Cover Letters',
            ats: 'ATS Filter Simulator',
            pdf: 'PDF Download',
            watermark: '',
            limitValues: 'Up to 3 / 30 (Sprint) / Unlimited',
            aiValue: 'Advanced',
          },
        },
      },
      footer: {
        rights: 'All rights reserved.',
      },
    },
    header: {
      title: 'CV Builder',
      reset: 'Reset',
      download: 'Download PDF',
      visualEditor: 'Visual Editor',
      codeEditor: 'Markdown Code',
      editorWarning: 'Advanced Mode: Direct code changes do not update the visual editor.',
      parseError: 'Could not convert markdown to visual editor. Staying in code mode.',
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
      undo: 'Undo',
      redo: 'Redo',
    },
    messages: {
      saved: 'CV saved',
      saveError: 'Could not save. It will retry after your next change.',
      notFound: 'CV not found, starting fresh',
      limitTitle: 'Free plan limit',
      limitDescription:
        'You have reached the maximum number of CVs on the free plan. Upgrade to Pro to create more.',
      upgradeTitle: 'Pro feature',
      upgradeDescription: 'This feature is available on the Pro plan.',
      authTitle: 'Sign in to continue',
      authDescription: 'Create a free account to save your CVs to the cloud.',
      signInToOpen: 'Sign in to open this CV.',
      signInToDownload: 'Sign up for free to download your resume as a PDF.',
      aiError: 'The AI could not process the request. Please try again.',
      aiRateLimited: 'You have reached the AI usage limit. Please try again later.',
      atsError: 'The ATS analysis could not be completed.',
      coverLetterError: 'The cover letter could not be generated.',
      copyCreated: 'Copy created',
      applied: 'Changes applied',
      genericError: 'Something went wrong. Please try again.',
      loading: 'Loading...',
      upgrade: 'Upgrade to Pro',
      signIn: 'Sign in',
      pageBreak: 'Approximate page break',
    },
    ai: {
      button: 'AI Tools',
      processing: 'Processing...',
      overlayText: 'Generating improvements with AI...',
      dropdown: {
        enhance: 'Enhance Writing',
        optimize: 'Optimize for Job Post',
        translate: 'Translate (ES/EN)',
        poweredBy: 'Powered by Advanced AI',
      },
      alerts: {
        enhance: 'AI: I have improved your professional summary.',
        translate: 'AI: I have translated the main fields.',
        optimize: 'AI: I have adjusted keywords to match the job post.',
      },
      jobDescriptionPrompt: 'Paste the job description here to optimize your CV:',
      optimize: {
        title: 'Optimize for Job Post',
        description:
          'Paste the job description and the AI will tailor your CV to the specific requirements, improving your match for the role.',
        placeholder: 'Paste the Job Description (JD) here...',
        action: 'Optimize CV',
      },
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
      coverLetter: {
        button: 'Generate Cover Letter',
        title: 'Cover Letter Generator',
        description:
          'AI will write a personalized letter connecting your experience with the job requirements.',
        placeholder: 'Paste the Job Description (JD) here...',
        generate: 'Generate Letter',
        generating: 'Writing...',
        copy: 'Copy to Clipboard',
        copied: 'Copied!',
        emptyWarning: 'Please enter the job description.',
      },
    },
  },
  pt: {
    ui: {
      nav: {
        home: 'Início',
        features: 'Funcionalidades',
        pricing: 'Preços',
        dashboard: 'Meus CVs',
        signIn: 'Entrar',
        login: 'Entrar',
        upgrade: 'Upgrade para Pro 🚀',
      },
      hero: {
        badge: '✨ Potencializado por IA',
        title: 'Seu currículo profissional,',
        titleAccent: 'otimizado em segundos.',
        description:
          'Deixe a IA corrigir sua redação, traduzir seu perfil e otimizar suas habilidades para passar os filtros ATS. Sem complicações.',
        cta: 'Criar meu CV Grátis →',
      },
      features: {
        title: 'Potencialize sua busca de emprego',
        description:
          'Ferramentas desenhadas por especialistas para te dar uma vantagem competitiva no mercado de trabalho atual.',
        items: {
          ai: {
            title: 'IA de Redação Avançada',
            description:
              'Melhore seu perfil e experiência com sugestões impulsionadas por IA. Profissionalismo garantido em cada palavra.',
          },
          ats: {
            title: 'Simulador de Filtros ATS',
            description:
              'Analise seu CV contra descrições de trabalho reais e descubra o quão bem você passa pelos sistemas de recrutamento automáticos.',
          },
          editor: {
            title: 'Editor em Tempo Real',
            description:
              'Visualize as mudanças no seu currículo instantaneamente. Escolha entre múltiplas plantilhas profissionais desenhadas para impressionar.',
          },
          coverLetter: {
            title: 'Cartas de Apresentação',
            description:
              'Gere cartas de apresentação personalizadas para cada oferta de emprego utilizando a informação do seu perfil e a descrição do cargo.',
          },
          multilingual: {
            title: 'Multilíngue por Padrão',
            description:
              'Precisa do seu CV em inglês ou espanhol? Traduza-o com um clique mantendo o formato e a qualidade profissional.',
          },
          export: {
            title: 'Exportação Impecável',
            description:
              'Baixe seu currículo em PDF de alta qualidade, otimizado para impressão e sistemas de leitura digital.',
          },
        },
      },
      pricing: {
        title: 'Planos para cada etapa',
        description: 'Sem assinaturas mensais. Você só paga pelo que precisa.',
        recommended: 'Recomendado',
        loading: 'Carregando...',
        plans: {
          free: {
            name: 'Básico',
            price: 'Grátis',
            action: 'Começar Grátis',
            features: [
              'Até 3 CVs',
              'Editor profissional',
              'Melhoria de texto com IA (Não incluso)',
              'Cartas de apresentação (Não incluso)',
              'Simulador ATS (Não incluso)',
            ],
          },
          sprint: {
            name: 'Sprint Pass',
            price: '$2.50',
            duration: ' / 7 dias',
            action: 'Selecionar',
            features: ['Até 30 CVs', 'IA Avançada', 'Cartas Ilimitadas', 'Simulador ATS'],
          },
          active: {
            name: 'Active Hunt',
            price: '$10.00',
            duration: ' / 30 dias',
            action: 'Melhor Opção',
            features: [
              'Tudo do Sprint',
              'CVs Ilimitados',
              'Acesso por um mês',
              'Suporte prioritário',
              'Otimização contínua',
            ],
          },
          lifetime: {
            name: 'Lifetime',
            price: '$29.00',
            duration: ' / para sempre',
            action: 'Acesso Total',
            features: [
              'Tudo do Active Hunt',
              'CVs Ilimitados',
              'Atualizações futuras',
              'Suporte 24/7',
              'Sem limites',
            ],
          },
        },
        table: {
          feature: 'Funcionalidade',
          basic: 'Básico',
          pro: 'Pro (Todos os Planos)',
          rows: {
            limit: 'Limite de Currículos',
            ai: 'Melhoria de redação com IA',
            cover: 'Cartas de Apresentação IA',
            ats: 'Simulador de Filtros ATS',
            pdf: 'Download em PDF',
            watermark: '',
            limitValues: 'Até 3 / 30 (Sprint) / Ilimitados',
            aiValue: 'Avançada',
          },
        },
      },
      footer: {
        rights: 'Todos os direitos reservados.',
      },
    },
    header: {
      title: 'CV Builder',
      reset: 'Resetar',
      download: 'Baixar PDF',
      visualEditor: 'Editor Visual',
      codeEditor: 'Código Markdown',
      editorWarning: 'Modo Avançado: Alterações diretas no código não atualizam o editor visual.',
      parseError:
        'Não foi possível converter o markdown para o editor visual. Permanecendo no modo código.',
      preview: 'Visualização',
      editor: 'Editor',
      emptyFieldsNotice: 'Campos vazios serão ocultados automaticamente no documento.',
      showHelp: 'Mostrar Ajuda',
      reorder: 'Reordenar Seções',
    },
    sections: {
      personal: 'Informação Pessoal',
      experience: 'Experiência Profissional',
      edu: 'Educação',
      skills: 'Habilidades e Certificações',
      projects: 'Projetos Principais',
      custom: 'Seções Personalizadas',
    },
    labels: {
      fullName: 'Nome Completo',
      role: 'Cargo / Título',
      email: 'E-mail',
      phone: 'Telefone',
      city: 'Cidade/Localização',
      network: 'Rede / Site (ex: LinkedIn)',
      url: 'Link / URL',
      summary: 'Resumo Profissional',
      company: 'Empresa',
      location: 'Localização',
      startDate: 'Data de Início',
      endDate: 'Data de Término',
      currentWork: 'Atualmente trabalho aqui',
      description: 'Responsabilidades / Conquistas',
      institution: 'Instituição / Universidade',
      degree: 'Título / Grau',
      currentStudy: 'Atualmente estudo aqui',
      category: 'Categoria (ex: Cloud)',
      itemsList: 'Itens (ex: Azure, AWS)',
      techSkills: 'Habilidades Técnicas',
      certifications: 'Certificações',
      languages: 'Idiomas',
      interests: 'Interesses',
      page: 'Página',
      pages: 'Páginas',
      project: 'Nome do Projeto',
      sectionTitle: 'Título da Seção',
      itemTitle: 'Título do Item',
      itemSubtitle: 'Subtítulo / Cargo / Data',
    },
    actions: {
      add: '+ Adicionar',
      delete: 'Excluir',
      confirmDelete: 'Excluir esta entrada?',
      confirmReset:
        'Tem certeza que deseja resetar para o padrão? Você perderá as alterações atuais.',
      addItem: '+ Adicionar Item',
      addBullet: '+ Adicionar Ponto',
      addLink: '+ Adicionar Link',
      addSection: '+ Nova Seção',
      save: 'Salvar',
      saving: 'Salvando...',
      saved: 'Salvo',
      close: 'Fechar',
      undo: 'Desfazer',
      redo: 'Refazer',
    },
    messages: {
      saved: 'Currículo salvo',
      saveError: 'Erro ao salvar. Tentaremos de novo após a próxima alteração.',
      notFound: 'CV não encontrado, iniciando um novo',
      limitTitle: 'Limite do plano gratuito',
      limitDescription:
        'Você atingiu o máximo de CVs do plano gratuito. Faça upgrade para o Pro para criar mais.',
      upgradeTitle: 'Recurso Pro',
      upgradeDescription: 'Este recurso está disponível no plano Pro.',
      authTitle: 'Entre para continuar',
      authDescription: 'Crie uma conta gratuita para salvar seus CVs na nuvem.',
      signInToOpen: 'Entre para abrir este CV.',
      signInToDownload: 'Cadastre-se grátis para baixar seu currículo em PDF.',
      aiError: 'A IA não conseguiu processar a solicitação. Tente novamente.',
      aiRateLimited: 'Você atingiu o limite de uso de IA. Tente novamente mais tarde.',
      atsError: 'Não foi possível concluir a análise ATS.',
      coverLetterError: 'Não foi possível gerar a carta.',
      copyCreated: 'Cópia criada',
      applied: 'Alterações aplicadas',
      genericError: 'Algo deu errado. Tente novamente.',
      loading: 'Carregando...',
      upgrade: 'Fazer upgrade para o Pro',
      signIn: 'Entrar',
      pageBreak: 'Quebra de página aproximada',
    },
    ai: {
      button: 'Ferramentas de IA',
      processing: 'Processando...',
      overlayText: 'Gerando melhorias com IA...',
      dropdown: {
        enhance: 'Melhorar Redação',
        optimize: 'Otimizar para Vaga',
        translate: 'Traduzir (ES/EN)',
        poweredBy: 'Desenvolvido por IA Avançada',
      },
      alerts: {
        enhance: 'IA: Melhorei a redação do seu resumo profissional.',
        translate: 'IA: Traduzi os campos principais.',
        optimize: 'IA: Ajustei as palavras-chave para coincidir com a vaga.',
      },
      jobDescriptionPrompt: 'Cole a descrição da vaga aqui para otimizar seu currículo:',
      optimize: {
        title: 'Otimização para Vaga',
        description:
          'Cole a descrição da vaga e a IA ajustará seu currículo aos requisitos específicos, melhorando o match com o cargo.',
        placeholder: 'Cole a descrição da vaga (JD) aqui...',
        action: 'Otimizar CV',
      },
      ats: {
        button: 'Simulador ATS',
        title: 'Simulador de ATS e Entrevista',
        description:
          'Cole a descrição da vaga. A IA analisará seu currículo atual em relação aos requisitos reais.',
        placeholder: 'Cole a Descrição da Vaga (JD) aqui...',
        analyze: 'Analisar Match',
        analyzing: 'Analisando...',
        score: 'Pontuação ATS',
        probability: 'Probabilidade de Entrevista',
        missingKeywords: 'Palavras-chave Faltantes',
        improvements: 'Ações de Melhoria',
        requirements: 'Análise de Requisitos',
      },
      coverLetter: {
        button: 'Gerar Carta de Apresentação',
        title: 'Gerador de Carta de Apresentação',
        description:
          'A IA escreverá uma carta personalizada conectando sua experiência com os requisitos da vaga.',
        placeholder: 'Cole a descrição da vaga (JD) aqui...',
        generate: 'Gerar Carta',
        generating: 'Escrevendo...',
        copy: 'Copiar para a Área de Transferência',
        copied: 'Copiado!',
        emptyWarning: 'Por favor, insira a descrição da vaga.',
      },
    },
  },
};

export type Translation = typeof locales.es;
