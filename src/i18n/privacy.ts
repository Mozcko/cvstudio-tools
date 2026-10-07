/**
 * Privacy policy, one entry per locale. Spanish is the original; keep the three in step
 * when the policy changes (and update `updated`).
 */
export const privacy = {
  es: {
    title: 'Política de Privacidad',
    collection: {
      title: '1. Recopilación de Datos',
      body: 'En CVStudio, recopilamos información necesaria para brindarte un servicio de creación de currículums de alta calidad. Esto incluye los datos que introduces en tus currículums (experiencia laboral, educación, habilidades) y datos de contacto básicos. Si importas un currículum existente, el archivo se lee en tu navegador y no se sube a nuestros servidores; cuando hace falta IA para interpretarlo (por ejemplo, un PDF) solo se envía su texto, con los correos electrónicos, teléfonos y enlaces enmascarados.',
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
          text: 'Potencia nuestras herramientas de mejora de texto y análisis, y la voz de la entrevista simulada (transcripción y síntesis).',
        },
      ],
    },
    ai: {
      title: '3. Seguridad en IA (Anonimización)',
      before:
        'Tu privacidad es nuestra prioridad. Antes de enviar cualquier dato de tu currículum a nuestros proveedores de IA, nuestro sistema aplica una capa de',
      highlight: 'anonimización automática',
      after:
        '. En las herramientas que trabajan sobre tu currículum (mejora, optimización, traducción, simulador ATS, carta de presentación y preparación de la entrevista), tu correo electrónico, teléfono, ciudad y enlaces se reemplazan por etiquetas genéricas antes de enviarlo.',
      paragraphs: [
        'Hay contenido que no puede anonimizarse de forma fiable y se envía tal como es: tu nombre y el texto de tu experiencia; el texto de un PDF que importas (en él se enmascaran correos, teléfonos y enlaces, pero no direcciones postales); y lo que dices o escribes como respuesta en una entrevista simulada.',
        'En la entrevista simulada, tu voz se envía a OpenAI para transcribirla y no se almacena. Guardamos la transcripción, la oferta que pegaste y el informe hasta que elimines la entrevista o tu cuenta.',
      ],
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
    publicLinks: {
      title: '6. Enlaces públicos y estadísticas de visitas',
      body: 'Si publicas un currículum con un enlace público, cualquier persona que tenga la dirección podrá verlo; tú decides si se muestran tu correo y tu teléfono, puedes desactivar el enlace en cualquier momento y, por defecto, pedimos a los buscadores que no lo indexen. Para mostrarte cuántas visitas recibe, registramos cada visita con un identificador anónimo que cambia cada día y el sitio web desde el que llegó el visitante. No guardamos direcciones IP ni usamos cookies para ello.',
    },
    updated: 'Última actualización: 7 de octubre de 2026',
  },
  en: {
    title: 'Privacy Policy',
    collection: {
      title: '1. Data We Collect',
      body: 'At CVStudio we collect the information needed to give you a high-quality resume building service. This includes the data you enter in your resumes (work experience, education, skills) and basic contact details. If you import an existing resume, the file is read in your browser and is not uploaded to our servers; when AI is needed to interpret it (a PDF, for example) only its text is sent, with e-mail addresses, phone numbers and links masked.',
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
          text: 'Powers our text improvement and analysis tools, and the voice of the mock interview (transcription and speech).',
        },
      ],
    },
    ai: {
      title: '3. AI Safety (Anonymisation)',
      before:
        'Your privacy is our priority. Before any data from your resume is sent to our AI providers, our system applies a layer of',
      highlight: 'automatic anonymisation',
      after:
        '. In the tools that work on your resume (enhance, optimise, translate, ATS simulator, cover letter and interview preparation), your email address, phone number, city and links are replaced with generic placeholders before it is sent.',
      paragraphs: [
        'Some content cannot be reliably anonymised and is sent as it is: your name and the text of your experience; the text of a PDF you import (email addresses, phone numbers and links in it are masked, but postal addresses are not); and what you say or type as an answer in a mock interview.',
        'In the mock interview, your voice is sent to OpenAI to be transcribed and is not stored. We keep the transcript, the job posting you pasted and the report until you delete the interview or your account.',
      ],
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
    publicLinks: {
      title: '6. Public Links and View Statistics',
      body: 'If you publish a resume with a public link, anyone who has the address can see it; you decide whether your email address and phone number are shown, you can switch the link off at any time and, by default, we ask search engines not to index it. To show you how many visits it gets, we record each visit with an anonymous identifier that changes every day and the website the visitor came from. We do not store IP addresses or use cookies for this.',
    },
    updated: 'Last updated: 7 October 2026',
  },
  pt: {
    title: 'Política de Privacidade',
    collection: {
      title: '1. Coleta de Dados',
      body: 'No CVStudio, coletamos as informações necessárias para oferecer um serviço de criação de currículos de alta qualidade. Isso inclui os dados que você insere em seus currículos (experiência profissional, formação, habilidades) e dados básicos de contato. Se você importar um currículo existente, o arquivo é lido no seu navegador e não é enviado aos nossos servidores; quando a IA é necessária para interpretá-lo (um PDF, por exemplo), apenas o texto é enviado, com e-mails, telefones e links mascarados.',
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
          text: 'Alimenta nossas ferramentas de melhoria de texto e análise, e a voz da entrevista simulada (transcrição e síntese).',
        },
      ],
    },
    ai: {
      title: '3. Segurança em IA (Anonimização)',
      before:
        'Sua privacidade é nossa prioridade. Antes de enviar qualquer dado do seu currículo aos nossos provedores de IA, nosso sistema aplica uma camada de',
      highlight: 'anonimização automática',
      after:
        '. Nas ferramentas que trabalham sobre o seu currículo (melhoria, otimização, tradução, simulador ATS, carta de apresentação e preparação da entrevista), seu e-mail, telefone, cidade e links são substituídos por marcadores genéricos antes do envio.',
      paragraphs: [
        'Há conteúdo que não pode ser anonimizado de forma confiável e é enviado como está: seu nome e o texto da sua experiência; o texto de um PDF que você importa (nele, e-mails, telefones e links são mascarados, mas endereços postais não); e o que você diz ou digita como resposta em uma entrevista simulada.',
        'Na entrevista simulada, sua voz é enviada à OpenAI para transcrição e não é armazenada. Guardamos a transcrição, a vaga que você colou e o relatório até que você exclua a entrevista ou a sua conta.',
      ],
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
    publicLinks: {
      title: '6. Links Públicos e Estatísticas de Visitas',
      body: 'Se você publicar um currículo com um link público, qualquer pessoa que tenha o endereço poderá vê-lo; você decide se o seu e-mail e o seu telefone são exibidos, pode desativar o link a qualquer momento e, por padrão, pedimos aos buscadores que não o indexem. Para mostrar quantas visitas ele recebe, registramos cada visita com um identificador anônimo que muda a cada dia e o site de onde o visitante veio. Não armazenamos endereços IP nem usamos cookies para isso.',
    },
    updated: 'Última atualização: 7 de outubro de 2026',
  },
};

export type PrivacyPolicy = typeof privacy.es;
