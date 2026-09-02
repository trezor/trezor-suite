import { fixupConfigRules } from '@eslint/compat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

import { areExpensiveChecksEnabled } from './expensiveChecks.mjs';
import { globalNoExtraneousDependenciesDevDependencies, importConfig } from './importConfig.mjs';
import {
    javascriptConfig,
    noCastedObjectHelpersSyntax,
    noRestrictedSyntax,
} from './javascriptConfig.mjs';
import { javascriptNodejsConfig } from './javascriptNodejsConfig.mjs';
import { jestConfig } from './jestConfig.mjs';
import { localRulesConfig } from './localRulesConfig.mjs';
import { reactConfig } from './reactConfig.mjs';
import { reactQueryConfig } from './reactQueryConfig.mjs';
import { restrictedImportsPatterns, typescriptConfig } from './typescriptConfig.mjs';
/**
 * @typedef {import('eslint').Linter.Config} Config
 */

export {
    globalNoExtraneousDependenciesDevDependencies,
    noCastedObjectHelpersSyntax,
    noRestrictedSyntax,
    restrictedImportsPatterns,
};

/** @type {Config[]} */
export const eslint = [
    {
        ignores: [
            '**/.nx/*',
            '**/lib/*',
            '**/libDev/*',
            '**/dist/*',
            '**/coverage/*',
            '**/build/*',
            '**/build-electron/*',
            '**/build-webextension/*',
            '**/node_modules/*',
            '**/public/*',
            '**/.expo/*',
            '**/.cache/*',
            '**/playwright-report/*',
            '**/suite-data/files/favicon.js',
        ],
    },
    { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
    {
        linterOptions: {
            reportUnusedDisableDirectives: areExpensiveChecksEnabled ? 'warn' : 'off',
        },
    },
    { languageOptions: { globals: globals.browser } },
    {
        languageOptions: {
            globals: {
                ...globals.serviceworker,
                ...globals.browser,
            },
        },
    },

    ...reactConfig,
    ...reactQueryConfig,
    ...javascriptConfig,
    ...javascriptNodejsConfig,
    ...typescriptConfig,
    ...importConfig,
    ...jestConfig,
    ...localRulesConfig,

    // TODO: Remove the compatibility wrapper when eslint-plugin-jsx-a11y supports ESLint 10.
    ...fixupConfigRules(jsxA11y.flatConfigs.recommended),

    // Tests
    {
        files: ['**/__fixtures__/**/*'],
        rules: {
            'import/no-default-export': 'off', // Todo: we have many default exports in fixtures, we shall get rid of them
        },
    },

    // ESLint config itself
    {
        files: ['eslint.config.mjs'],
        rules: {
            'import/no-default-export': 'off',
        },
    },
];

const playwrightEslintRules = {
    ...playwright.configs['flat/recommended'].rules,
    'playwright/no-nested-step': 'off',
    'playwright/expect-expect': 'off',
    'playwright/no-wait-for-timeout': 'off',
    'playwright/no-conditional-in-test': 'off',
    'playwright/no-force-option': 'off',
    'playwright/valid-title': 'off',
};

/** @type {Config} */
export const playwrightEslint = {
    ...playwright.configs['flat/recommended'],
    files: ['e2e/**'],
    rules: playwrightEslintRules,
};

/** @type {Config} */
export const playwrightEslintFlat = {
    ...playwright.configs['flat/recommended'],
    files: ['./**/*.{ts,tsx,js,jsx}'],
    rules: playwrightEslintRules,
};
