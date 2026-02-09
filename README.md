<div align="center">
  <p>
    <a href="#español">🇪🇸 Español</a> | <a href="#english">🇺🇸 English</a>
  </p>
</div>

---

<div id="español"></div>

# 📄 CV Builder

**CV Builder** es una aplicación web moderna diseñada para crear, editar y exportar currículums profesionales de manera ágil. Combina la velocidad de Astro con la interactividad de React, utilizando inteligencia artificial para asistir en la redacción y Supabase para la gestión de datos.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-development-orange)

## 🚀 Tecnologías

El proyecto está construido sobre un stack moderno y escalable:

* **Core:** [Astro](https://astro.build/) (v5) - Renderizado híbrido y optimización.
* **UI Framework:** [React](https://react.dev/) (v19) - Componentes interactivos.
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (v4) - Diseño responsivo y moderno.
* **Base de Datos & Auth:** [Supabase](https://supabase.com/) - Persistencia de usuarios y CVs.
* **IA:** [OpenAI API](https://openai.com/) - Asistencia generativa para perfiles y descripciones.
* **Utilidades:**
    * `html2pdf.js`: Exportación a PDF.
    * `react-markdown`: Renderizado de contenido rico.

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

* [Node.js](https://nodejs.org/) (v18 o superior)
* [pnpm](https://pnpm.io/) (Recomendado para gestionar paquetes)

## ⚡ Instalación y Configuración

Sigue estos pasos para levantar el entorno de desarrollo local:

1.  **Clonar el repositorio:**

    ```bash
    git clone [https://github.com/tu-usuario/cv-builder.git](https://github.com/tu-usuario/cv-builder.git)
    cd cv-builder
    ```

2.  **Instalar dependencias:**

    ```bash
    pnpm install
    ```

3.  **Configurar Variables de Entorno:**
    Renombra el archivo `.env.example` a `.env` y completa tus credenciales.

    ```bash
    cp .env.example .env
    ```

    **Variables requeridas:**
    * `PUBLIC_SUPABASE_URL`: Tu URL de proyecto Supabase.
    * `PUBLIC_SUPABASE_ANON_KEY`: Tu clave pública anónima de Supabase.
    * `OPENAI_API_KEY`: Tu clave de API de OpenAI (para funciones de IA).

4.  **Iniciar el servidor de desarrollo:**

    ```bash
    pnpm dev
    ```

    La aplicación estará disponible en `http://localhost:4321`.

## 📂 Estructura del Proyecto
``` text
/
├── public/              # Archivos estáticos
├── src/
│   ├── components/      # Componentes de React y Astro
│   │   ├── editor/      # Lógica principal del editor de CV
│   │   ├── ui/          # Componentes de UI reutilizables
│   │   └── auth/        # Componentes de autenticación
│   ├── layouts/         # Plantillas de diseño (App, Public)
│   ├── lib/             # Clientes de servicios (Supabase)
│   ├── pages/           # Rutas de la aplicación (File-based routing)
│   │   ├── api/         # Endpoints de servidor (IA, etc.)
│   │   └── app/         # Rutas protegidas de la aplicación
│   ├── templates/       # Definiciones de estilos para los CVs (Classic, Modern, etc.)
│   └── types/           # Definiciones de tipos TypeScript
└── package.json
```

## 🧞 Scripts Disponibles

| Comando          | Acción                                             |
| :--------------- | :------------------------------------------------- |
| `pnpm dev`       | Inicia el servidor de desarrollo local.            |
| `pnpm build`     | Compila el proyecto para producción en `./dist/`.  |
| `pnpm preview`   | Previsualiza la compilación localmente.            |
| `pnpm start`     | Ejecuta el servidor de producción (Node adapter).  |

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Para mantener el orden, seguimos este flujo:

1.  Revisa el **Project Board** (Backlog) para ver tareas pendientes.
2.  Crea un **Fork** del repositorio.
3.  Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
4.  Haz tus cambios y realiza commits descriptivos.
5.  Abre un **Pull Request** hacia la rama `main`.

Por favor, revisa el archivo `CONTRIBUTING.md` para más detalles sobre estándares de código.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.


<div id="english"></div>

# 📄 CV Builder

**CV Builder** is a modern web application designed to create, edit, and export professional resumes quickly and efficiently. It combines the speed of Astro with the interactivity of React, leveraging artificial intelligence to assist in writing and Supabase for data management.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-development-orange)

## 🚀 Technologies

The project is built on a modern and scalable stack:

* **Core:** [Astro](https://astro.build/) (v5) - Hybrid rendering and optimization.
* **UI Framework:** [React](https://react.dev/) (v19) - Interactive components.
* **Styles:** [Tailwind CSS](https://tailwindcss.com/) (v4) - Responsive and modern design.
* **Database & Auth:** [Supabase](https://supabase.com/) - User persistence and CV data.
* **AI:** [OpenAI API](https://openai.com/) - Generative assistance for profiles and descriptions.
* **Utilities:**
    * `html2pdf.js`: Export to PDF.
    * `react-markdown`: Rich content rendering.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

* [Node.js](https://nodejs.org/) (v18 or higher)
* [pnpm](https://pnpm.io/) (Recommended for package management)

## ⚡ Installation and Setup

Follow these steps to set up the local development environment:

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/your-username/cv-builder.git](https://github.com/your-username/cv-builder.git)
    cd cv-builder
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Configure Environment Variables:**
    Rename the `.env.example` file to `.env` and fill in your credentials.

    ```bash
    cp .env.example .env
    ```

    **Required Variables:**
    * `PUBLIC_SUPABASE_URL`: Your Supabase project URL.
    * `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anonymous key.
    * `OPENAI_API_KEY`: Your OpenAI API key (for AI features).

4.  **Start the development server:**

    ```bash
    pnpm dev
    ```

    The application will be available at `http://localhost:4321`.

## 📂 Project Structure

```text
/
├── public/              # Static files
├── src/
│   ├── components/      # React and Astro components
│   │   ├── editor/      # Main logic for the CV editor
│   │   ├── ui/          # Reusable UI components
│   │   └── auth/        # Authentication components
│   ├── layouts/         # Layout templates (App, Public)
│   ├── lib/             # Service clients (Supabase)
│   ├── pages/           # Application routes (File-based routing)
│   │   ├── api/         # Server endpoints (AI, etc.)
│   │   └── app/         # Protected application routes
│   ├── templates/       # Style definitions for CVs (Classic, Modern, etc.)
│   └── types/           # TypeScript type definitions
└── package.json
```

## 🧞 Available Scripts

| Command          | Action                                             |
| :--------------- | :------------------------------------------------- |
| `pnpm dev`       | Starts the local development server.               |
| `pnpm build`     | Builds the project for production to `./dist/`.    |
| `pnpm preview`   | Previews the build locally.                        |
| `pnpm start`     | Runs the production server (Node adapter).         |

## 🤝 Contribution

Contributions are welcome! To keep things organized, we follow this flow:

1.  Check the **Project Board** (Backlog) to see pending tasks.
2.  Create a **Fork** of the repository.
3.  Create a branch for your feature (`git checkout -b feature/new-feature`).
4.  Make your changes and write descriptive commits.
5.  Open a **Pull Request** to the `main` branch.

Please review the `CONTRIBUTING.md` file for more details on code standards.

## 📄 License

This project is licensed under the MIT License.
