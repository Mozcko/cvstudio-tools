/**
 * Privacy policy, one entry per locale. Spanish is the original; keep the three in step
 * when the policy changes (and update `updated`).
 */
export const privacy = {
  es: {
    title: 'Política de Privacidad',
    collection: {
      title: '1. Recopilación de Datos',
      body: 'En CVStudio, recopilamos información necesaria para brindarte un servicio de creación de currículums de alta calidad. Esto incluye los datos que introduces en tus currículums (experiencia laboral, educación, habilidades) y datos de contacto básicos.',
    },
    processors: {
      title: '2. Procesamiento por Terceros',
      body: 'Para operar nuestra plataforma, utilizamos servicios externos líderes en la industria:',
      items: [
        {
          name: 'Autenticación (Clerk):',
          text: 'Gestiona de forma segura tu inicio de sesión e identidad.',
        },
        {
          name: 'Pagos (Stripe):',
          text: 'Procesa tus transacciones de suscripción Pro sin que nosotros almacenemos tus datos bancarios.',
        },
        {
          name: 'Inteligencia Artificial (OpenAI):',
          text: 'Potencia nuestras herramientas de mejora de texto y análisis.',
        },
      ],
    },
    ai: {
      title: '3. Seguridad en IA (Anonimización)',
      before:
        'Tu privacidad es nuestra prioridad. Antes de enviar cualquier dato de tu currículum a nuestros proveedores de IA, nuestro sistema aplica una capa de',
      highlight: 'anonimización automática',
      after:
        '. Tu correo electrónico, número de teléfono y direcciones exactas son reemplazados por etiquetas genéricas para que los modelos de lenguaje nunca procesen tu Información de Identificación Personal (PII).',
    },
    rights: {
      title: '4. Derechos de los Usuarios (Derecho al Olvido)',
      paragraphs: [
        'Cumplimos con las normativas internacionales de protección de datos (GDPR / LFPDPPP). Tienes el derecho de acceder, rectificar o eliminar tus datos en cualquier momento.',
        'Puedes eliminar tu cuenta permanentemente desde la sección de gestión de perfil. Al hacerlo, nuestro sistema ejecutará un proceso de limpieza inmediata que eliminará todos tus currículums y registros personales de nuestra base de datos de forma irreversible.',
      ],
    },
    cookies: {
      title: '5. Cookies',
      body: 'Utilizamos cookies técnicas esenciales para mantener tu sesión activa y cookies de análisis para entender cómo mejorar nuestra herramienta. Puedes gestionar tu consentimiento a través de nuestro banner informativo.',
    },
    updated: 'Última actualización: 6 de junio de 2026',
  },
  en: {
    title: 'Privacy Policy',
    collection: {
      title: '1. Data We Collect',
      body: 'At CVStudio we collect the information needed to give you a high-quality resume building service. This includes the data you enter in your resumes (work experience, education, skills) and basic contact details.',
    },
    processors: {
      title: '2. Third-Party Processing',
      body: 'To run our platform we rely on industry-leading external services:',
      items: [
        {
          name: 'Authentication (Clerk):',
          text: 'Securely manages your sign-in and identity.',
        },
        {
          name: 'Payments (Stripe):',
          text: 'Processes your Pro plan transactions without us storing your banking details.',
        },
        {
          name: 'Artificial Intelligence (OpenAI):',
          text: 'Powers our text improvement and analysis tools.',
        },
      ],
    },
    ai: {
      title: '3. AI Safety (Anonymisation)',
      before:
        'Your privacy is our priority. Before any data from your resume is sent to our AI providers, our system applies a layer of',
      highlight: 'automatic anonymisation',
      after:
        '. Your email address, phone number and exact addresses are replaced with generic placeholders so that language models never process your Personally Identifiable Information (PII).',
    },
    rights: {
      title: '4. Your Rights (Right to Be Forgotten)',
      paragraphs: [
        'We comply with international data protection regulations (GDPR / LFPDPPP). You have the right to access, correct or delete your data at any time.',
        'You can permanently delete your account from the profile management section. When you do, our system runs an immediate clean-up that irreversibly removes all your resumes and personal records from our database.',
      ],
    },
    cookies: {
      title: '5. Cookies',
      body: 'We use essential technical cookies to keep your session active and analytics cookies to understand how to improve our tool. You can manage your consent through our information banner.',
    },
    updated: 'Last updated: 6 June 2026',
  },
  pt: {
    title: 'Política de Privacidade',
    collection: {
      title: '1. Coleta de Dados',
      body: 'No CVStudio, coletamos as informações necessárias para oferecer um serviço de criação de currículos de alta qualidade. Isso inclui os dados que você insere em seus currículos (experiência profissional, formação, habilidades) e dados básicos de contato.',
    },
    processors: {
      title: '2. Processamento por Terceiros',
      body: 'Para operar nossa plataforma, utilizamos serviços externos líderes do setor:',
      items: [
        {
          name: 'Autenticação (Clerk):',
          text: 'Gerencia com segurança seu login e sua identidade.',
        },
        {
          name: 'Pagamentos (Stripe):',
          text: 'Processa as transações do seu plano Pro sem que armazenemos seus dados bancários.',
        },
        {
          name: 'Inteligência Artificial (OpenAI):',
          text: 'Alimenta nossas ferramentas de melhoria de texto e análise.',
        },
      ],
    },
    ai: {
      title: '3. Segurança em IA (Anonimização)',
      before:
        'Sua privacidade é nossa prioridade. Antes de enviar qualquer dado do seu currículo aos nossos provedores de IA, nosso sistema aplica uma camada de',
      highlight: 'anonimização automática',
      after:
        '. Seu e-mail, número de telefone e endereços exatos são substituídos por marcadores genéricos para que os modelos de linguagem nunca processem suas Informações de Identificação Pessoal (PII).',
    },
    rights: {
      title: '4. Direitos dos Usuários (Direito ao Esquecimento)',
      paragraphs: [
        'Cumprimos as normas internacionais de proteção de dados (GDPR / LFPDPPP). Você tem o direito de acessar, corrigir ou excluir seus dados a qualquer momento.',
        'Você pode excluir sua conta permanentemente na seção de gerenciamento de perfil. Ao fazer isso, nosso sistema executará uma limpeza imediata que removerá de forma irreversível todos os seus currículos e registros pessoais do nosso banco de dados.',
      ],
    },
    cookies: {
      title: '5. Cookies',
      body: 'Utilizamos cookies técnicos essenciais para manter sua sessão ativa e cookies de análise para entender como melhorar nossa ferramenta. Você pode gerenciar seu consentimento por meio do nosso banner informativo.',
    },
    updated: 'Última atualização: 6 de junho de 2026',
  },
};

export type PrivacyPolicy = typeof privacy.es;
