import * as mdx from 'eslint-plugin-mdx';

import {
    eslint,
    globalNoExtraneousDependenciesDevDependencies,
    noCastedObjectHelpersSyntax,
} from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['.next/**/*', 'next-env.d.ts'],
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
            // keep the casted-Object-helper ban active; the rest of no-restricted-syntax stays off (legacy getState/state-as-any debt)
            'no-restricted-syntax': ['error', ...noCastedObjectHelpersSyntax],
            '@typescript-eslint/no-restricted-imports': 'off',
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
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
    {
        // the catch-all override above has no `files` key, so it re-enables no-restricted-syntax
        // for .mdx too; keep MDX exempt (it intentionally disables the whole rule)
        files: ['**/*.mdx'],
        rules: {
            'no-restricted-syntax': 'off',
        },
    },
];
