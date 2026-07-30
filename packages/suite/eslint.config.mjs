import {
    eslint,
    globalNoExtraneousDependenciesDevDependencies,
    noCastedObjectHelpersSyntax,
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
            // keep the casted-Object-helper ban active; the rest of no-restricted-syntax stays off (legacy getState/state-as-any debt)
            'no-restricted-syntax': ['error', ...noCastedObjectHelpersSyntax],
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
