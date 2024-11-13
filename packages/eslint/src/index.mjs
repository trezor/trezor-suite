import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';

import { reactConfig } from './reactConfig.mjs';
import { javascriptConfig } from './javascriptConfig.mjs';
import { typescriptConfig } from './typescriptConfig.mjs';
import { importConfig, globalNoExtraneousDependenciesDevDependencies } from './importConfig.mjs';
import { jestConfig } from './jestConfig.mjs';
import { javascriptNodejsConfig } from './javascriptNodejsConfig.mjs';
import { localRulesConfig } from './localRulesConfig.mjs';
import { chaiFriendlyConfig } from './chaiFriendlyConfig.mjs';

export { globalNoExtraneousDependenciesDevDependencies };

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
            '**/node_modules/*',
            '**/public/*',
            '**/ci/',
            'eslint-local-rules/*',
        ],
    },
    { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
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
    ...javascriptConfig,
    ...javascriptNodejsConfig,
    ...typescriptConfig,
    ...importConfig,
    ...jestConfig,
    ...localRulesConfig,
    ...chaiFriendlyConfig,

    jsxA11y.flatConfigs.recommended,

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
