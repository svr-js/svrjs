const globals = require("globals");
const pluginJs = require("@eslint/js");
const tseslint = require("typescript-eslint");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const jest = require("eslint-plugin-jest");

module.exports = tseslint.config(
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs"
    }
  },
  {
    files: ["tests/*.test.js", "tests/**/*.test.js"],
    ...jest.configs['flat/recommended'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/prefer-expect-assertions': 'off',
    }
  },
  {
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  pluginJs.configs.recommended,
  {
    files: ["**/*.d.ts"],
    languageOptions: {
      sourceType: "commonjs",
      parser: tseslint.parser
    },
    extends: [tseslint.configs.base],
    rules: {
      "no-redeclare": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-redeclare": [
        "error",
        {
          ignoreDeclarationMerge: true
        }
      ]
    }
  },
  eslintPluginPrettierRecommended
);
