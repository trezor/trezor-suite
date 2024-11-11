import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'off',
            'no-restricted-syntax': 'off', // Todo: fix and solve
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
