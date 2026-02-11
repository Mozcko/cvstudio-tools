import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // 1. Configuración Global
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,astro}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  // 2. Configuración Base (JS + TS)
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // 3. Configuración para Astro
  ...eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.astro"],
    processor: "astro/client-side-ts", // Procesa scripts dentro de .astro
  },

  // 4. Configuración para React
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginJsxA11y.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
    settings: {
      react: { 
        version: "19.0" // <--- CAMBIO IMPORTANTE: Ponemos la versión fija
      },
    },
  },
  // 5. Integración con Prettier (Siempre al final para desactivar reglas de estilo conflictivas)
  eslintConfigPrettier, 
];
