import {
    eslint,
    globalNoExtraneousDependenciesDevDependencies,
    playwrightEslint,
} from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'react/style-prop-object': [
                'error',
                {
                    allow: ['FormattedNumber'],
                },
            ],
            'no-restricted-syntax': 'off', // Todo: this should be fixed in codebase and this line removed
            'import/no-default-export': 'off', // Todo: shall be solved one day, usually its legacy Components
            'no-console': 'off', // Todo: we use it a lot, shall be disabled more granulary I think
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/src/support/tests/**',
                    ],
                },
            ],
        },
    },
    {
        ignores: ['**/playwright-report/', '**/test-results/'],
    },
    {
        files: ['**/scripts/**'],
        rules: {
            'no-console': 'off',
            'import/no-default-export': 'off',
        },
    },
    playwrightEslint,
];
