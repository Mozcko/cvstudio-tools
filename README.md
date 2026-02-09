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

```text
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
