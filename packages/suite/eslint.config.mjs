import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

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
            'import/no-default-export': 'off', // Todo: shall be solved one day, usually its legacy Components
            'no-console': 'off', // Todo: we use it a lot, shall be disabled more granulary I think
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/src/support/tests/**',
                        '**/src/support/test-utils/**',
                    ],
                },
            ],
        },
    },
];
