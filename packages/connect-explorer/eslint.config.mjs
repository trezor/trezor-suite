import * as mdx from 'eslint-plugin-mdx';

import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['.next/**/*'],
    },

    // Mdx
    {
        ...mdx.flat,
        rules: {
            'jsx-a11y/click-events-have-key-events': 'off',
            'jsx-a11y/no-static-element-interactions': 'off',
            'import/no-default-export': 'off',
            'no-console': 'off',
            'no-restricted-syntax': 'off',
        },
    },
    {
        files: ['**/*.mdx'],
        rules: {
            'react/no-unescaped-entities': 'off',
            'local-rules/no-override-ds-component': 'off',
        },
    },
    {
        rules: {
            'no-console': 'off',
            'import/no-default-export': 'off', // Todo: shall be fixed
            'no-restricted-syntax': 'off', // Todo: shall be fixed
            '@typescript-eslint/no-restricted-imports': 'off',
            '@typescript-eslint/no-shadow': 'off',
            'react/jsx-filename-extension': [
                'error',
                {
                    extensions: ['.tsx', '.mdx'],
                },
            ],
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/webpack/**',
                    ],
                },
            ],
        },
    },
];
