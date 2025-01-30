import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

import { chaiFriendlyConfig } from './chaiFriendlyConfig.mjs';
import { globalNoExtraneousDependenciesDevDependencies, importConfig } from './importConfig.mjs';
import { javascriptConfig } from './javascriptConfig.mjs';
import { javascriptNodejsConfig } from './javascriptNodejsConfig.mjs';
import { jestConfig } from './jestConfig.mjs';
import { localRulesConfig } from './localRulesConfig.mjs';
import { reactConfig } from './reactConfig.mjs';
import { typescriptConfig } from './typescriptConfig.mjs';

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
            '**/.expo/*',
            'eslint-local-rules/*',
            '**/.cache/*',
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
