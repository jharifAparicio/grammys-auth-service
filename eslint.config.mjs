// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Ignoramos carpetas de compilación y el propio archivo de configuración
    ignores: ['eslint.config.mjs', 'dist/'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      // Cambiamos a 'module' porque NestJS usa ECMAScript Modules/TypeScript nativo
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // 🔥 REGLAS ESTRICTAS ESTILO MIDUDEV / PRODUCCIÓN

      // Prohibido usar "any" (fuerza el uso de tipos reales o interfaces)
      '@typescript-eslint/no-explicit-any': 'error',

      // Obligatorio controlar las promesas flotantes (evita bugs silenciosos en operaciones asíncronas)
      '@typescript-eslint/no-floating-promises': 'error',

      // Evita pasar argumentos inseguros sin tipar
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Control estricto de variables muertas (error si dejas variables declaradas que no usas)
      // Permite ignorar variables específicas si empiezan con guion bajo (ej. _req, _res)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],

      // Integración total con Prettier para formatear el estilo al guardar
      'prettier/prettier': [
        'error',
        {
          singleQuote: true, // Fuerza comillas simples ''
          trailingComma: 'all', // Coma al final en objetos multilínea
          semi: true, // Obligatorio el punto y coma ;
          printWidth: 100, // Rompe líneas largas a los 100 caracteres
          tabWidth: 2, // Identación de 2 espacios
          endOfLine: 'auto', // Evita conflictos de saltos de línea entre Windows/Linux
        },
      ],
    },
  },
);
